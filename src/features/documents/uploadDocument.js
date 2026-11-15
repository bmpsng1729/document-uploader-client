import { complete, getStatus, initiate } from './api/documentsApi.js'
import { storageClient } from './api/storageClient.js'
import { hashFile } from './utils/hashFile.js'
import { sleep } from './utils/sleep.js'
import { validateFile } from './utils/validateFile.js'

const URL_EXPIRY_BUFFER_MS = 15_000
const PUT_RETRY_DELAYS = [1_000, 3_000]
const COMPLETE_RETRY_DELAY_MS = 1_500
const MAX_COMPLETE_RETRIES = 3
const MAX_PROCESSING_TIME_MS = 2 * 60 * 1_000
const MAX_POLL_DELAY_MS = 5_000
const CORS_HINT =
  'Direct storage upload may be blocked by CORS. Ensure the storage bucket CORS policy allows PUT and Content-Type from this origin.'
const DOCUMENT_TYPES = new Set([
  'PHOTO',
  'SIGNATURE',
  'ID_PROOF',
  'MARKSHEET',
  'CERTIFICATE',
  'OTHER',
])

function isAbort(error, signal) {
  return (
    signal?.aborted ||
    error?.name === 'AbortError' ||
    error?.code === 'ERR_CANCELED'
  )
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw (
      signal.reason ??
      new DOMException('The operation was aborted.', 'AbortError')
    )
  }
}

function createUploadError(code, operation) {
  const error = new Error(code)
  error.code = code
  error.uploadOperation = operation
  return error
}

function attachOperation(error, operation) {
  if (error && typeof error === 'object') {
    error.uploadOperation = operation
    return error
  }

  const wrappedError = new Error('The upload request failed.')
  wrappedError.cause = error
  wrappedError.uploadOperation = operation
  return wrappedError
}

function isNearExpiry(expiresAt) {
  const expirationTime = Date.parse(expiresAt)
  return (
    !Number.isFinite(expirationTime) ||
    expirationTime - Date.now() <= URL_EXPIRY_BUFFER_MS
  )
}

function hasValidUploadInstructions(instructions) {
  if (
    !instructions ||
    typeof instructions.documentId !== 'string' ||
    typeof instructions.uploadUrl !== 'string' ||
    !instructions.uploadUrl ||
    !instructions.requiredHeaders ||
    typeof instructions.requiredHeaders !== 'object' ||
    Array.isArray(instructions.requiredHeaders)
  ) {
    return false
  }

  return Object.entries(instructions.requiredHeaders).some(
    ([name, value]) =>
      name.toLowerCase() === 'content-type' && typeof value === 'string',
  )
}

function reportProgress(event, onProgress) {
  if (!onProgress || !Number.isFinite(event.total) || event.total <= 0) return
  const percent = Math.max(0, Math.min(100, (event.loaded / event.total) * 100))
  onProgress(Math.round(percent))
}

function logStorageNetworkHint(error) {
  if (
    !error?.response &&
    (error?.code === 'ERR_NETWORK' || error?.isAxiosError)
  ) {
    console.warn(CORS_HINT)
  }
}

/**
 * Runs validation, hashing, direct storage upload, completion, and processing
 * status polling for one file. Presigned URLs remain local to this invocation.
 * @param {File} file
 * @param {string} type
 * @param {{
 *   signal?: AbortSignal,
 *   onProgress?: (percent: number) => void,
 *   onStep?: (step: string) => void
 * }} [options]
 * @returns {Promise<{
 *   documentId: string,
 *   status: string,
 *   document?: object,
 *   rejectReason?: string|null,
 *   timedOut?: boolean,
 *   message?: string
 * }>}
 */
export async function uploadDocument(
  file,
  type,
  { signal, onProgress, onStep } = {},
) {
  let operation = 'validate'

  try {
    throwIfAborted(signal)
    if (!DOCUMENT_TYPES.has(type)) {
      throw createUploadError('document_type_required', 'validate')
    }

    onStep?.('validating')
    const validation = await validateFile(file)
    if (!validation.valid) {
      throw createUploadError(validation.code, 'validate')
    }

    throwIfAborted(signal)
    operation = 'hash'
    onStep?.('hashing')
    const sha256 = await hashFile(file)

    const request = {
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256,
      type,
    }

    let initiateCount = 0
    async function getUploadInstructions() {
      throwIfAborted(signal)
      if (initiateCount >= 2) {
        throw createUploadError('upload_url_expired', 'upload')
      }

      initiateCount += 1
      operation = 'initiate'
      onStep?.('initiating')
      try {
        const instructions = await initiate(request, { signal })
        throwIfAborted(signal)
        if (!hasValidUploadInstructions(instructions)) {
          throw createUploadError('invalid_upload_instructions', 'initiate')
        }
        return instructions
      } catch (error) {
        if (isAbort(error, signal)) throw error
        throw attachOperation(error, 'initiate')
      }
    }

    async function refreshIfNearExpiry(instructions) {
      if (!isNearExpiry(instructions.expiresAt)) return instructions
      const refreshedInstructions = await getUploadInstructions()
      if (isNearExpiry(refreshedInstructions.expiresAt)) {
        throw createUploadError('upload_url_expired', 'upload')
      }
      return refreshedInstructions
    }

    let instructions = await getUploadInstructions()
    instructions = await refreshIfNearExpiry(instructions)

    let networkRetries = 0
    while (true) {
      throwIfAborted(signal)
      instructions = await refreshIfNearExpiry(instructions)
      operation = 'upload'
      onStep?.('uploading')
      onProgress?.(0)

      try {
        await storageClient.put(instructions.uploadUrl, file, {
          headers: instructions.requiredHeaders,
          withCredentials: false,
          signal,
          onUploadProgress: (event) => reportProgress(event, onProgress),
        })
        break
      } catch (error) {
        if (isAbort(error, signal)) throw error

        if (error?.response?.status === 403) {
          if (initiateCount >= 2) throw attachOperation(error, 'upload')
          instructions = await getUploadInstructions()
          instructions = await refreshIfNearExpiry(instructions)
          continue
        }

        const status = error?.response?.status
        const retryable = !error?.response || status >= 500
        if (retryable && networkRetries < PUT_RETRY_DELAYS.length) {
          const delay = PUT_RETRY_DELAYS[networkRetries]
          networkRetries += 1

          if (isNearExpiry(instructions.expiresAt)) {
            instructions = await refreshIfNearExpiry(instructions)
            continue
          }

          await sleep(delay, signal)
          continue
        }

        logStorageNetworkHint(error)
        throw attachOperation(error, 'upload')
      }
    }

    throwIfAborted(signal)
    operation = 'complete'
    onStep?.('completing')
    let completeRetries = 0
    while (true) {
      try {
        await complete(instructions.documentId, { signal })
        break
      } catch (error) {
        if (isAbort(error, signal)) throw error
        if (
          error?.response?.status === 409 &&
          completeRetries < MAX_COMPLETE_RETRIES
        ) {
          completeRetries += 1
          await sleep(COMPLETE_RETRY_DELAY_MS, signal)
          continue
        }
        throw attachOperation(error, 'complete')
      }
    }

    operation = 'status'
    onStep?.('processing')
    const deadline = Date.now() + MAX_PROCESSING_TIME_MS
    let pollDelay = 1_500

    while (Date.now() < deadline) {
      const remainingTime = deadline - Date.now()
      await sleep(Math.min(pollDelay, remainingTime), signal)
      throwIfAborted(signal)

      let document
      try {
        document = await getStatus(instructions.documentId, { signal })
      } catch (error) {
        if (isAbort(error, signal)) throw error
        throw attachOperation(error, 'status')
      }
      throwIfAborted(signal)

      if (document.status === 'READY') {
        onStep?.('ready')
        return {
          documentId: instructions.documentId,
          status: 'READY',
          document,
        }
      }
      if (document.status === 'REJECTED') {
        onStep?.('rejected')
        return {
          documentId: instructions.documentId,
          status: 'REJECTED',
          rejectReason: document.rejectReason,
          document,
        }
      }
      if (document.status === 'DELETING') {
        return {
          documentId: instructions.documentId,
          status: 'DELETING',
          document,
        }
      }
      if (document.status !== 'PENDING' && document.status !== 'PROCESSING') {
        throw createUploadError('invalid_document_status', 'status')
      }

      pollDelay = Math.min(pollDelay * 1.5, MAX_POLL_DELAY_MS)
    }

    return {
      documentId: instructions.documentId,
      status: 'PROCESSING',
      timedOut: true,
      message: 'Still processing. It will appear in your documents when ready.',
    }
  } catch (error) {
    if (isAbort(error, signal)) throw error
    onStep?.('failed')
    throw attachOperation(error, error?.uploadOperation ?? operation)
  }
}
