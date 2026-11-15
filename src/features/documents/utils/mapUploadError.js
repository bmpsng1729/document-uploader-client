const VALIDATION_MESSAGES = {
  file_required: 'Choose a file to upload.',
  file_empty: 'This file is empty. Choose a different file.',
  file_too_large: 'Each file must be 10 MB or smaller.',
  unsupported_type:
    'Only JPG, PNG, or PDF files are supported. iPhone HEIC photos must be converted to JPEG first.',
  invalid_file_signature:
    'This file could not be recognized. Choose a valid JPG, PNG, or PDF.',
  file_type_mismatch:
    'The file contents do not match its declared type. Choose a valid JPG, PNG, or PDF.',
  duplicate_file: 'This file is already in the upload queue.',
  document_type_required: 'Choose a document type.',
  upload_url_expired: 'The upload link expired. Please retry the upload.',
  document_deleting: 'This document is being removed and is unavailable.',
}

const VALIDATION_FIELDS = {
  originalName: 'File name',
  mimeType: 'File type',
  sizeBytes: 'File size',
  sha256: 'File checksum',
  type: 'Document type',
}

function cleanMessage(message) {
  if (typeof message !== 'string') return ''
  const cleaned = [...message.trim()]
    .filter((character) => {
      const codePoint = character.codePointAt(0)
      return codePoint >= 32 && codePoint !== 127
    })
    .join('')
  if (!cleaned || /(?:https?:\/\/|www\.)/i.test(cleaned)) return ''
  return cleaned.slice(0, 200)
}

function mapValidationErrors(errors) {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return ''
  }

  return Object.entries(VALIDATION_FIELDS)
    .flatMap(([field, label]) => {
      const value = errors[field]
      const messages = Array.isArray(value) ? value : [value]
      return messages
        .map(cleanMessage)
        .filter(Boolean)
        .map((message) => `${label}: ${message}`)
    })
    .join(' ')
}

function mapRejectedError(error) {
  const data = error?.response?.data ?? error?.data
  const reason = cleanMessage(
    error?.rejectReason ?? data?.rejectReason ?? data?.reason ?? data?.detail,
  )
  return reason
    ? `File rejected: ${reason}`
    : 'This file was rejected. Choose another file.'
}

/**
 * Maps local validation and API failures to user-facing messages.
 * @param {unknown} error
 * @param {'initiate'|'upload'|'complete'|'status'} [operation]
 * @returns {string}
 */
export function mapUploadError(error, operation = 'upload') {
  const code = error?.code
  if (VALIDATION_MESSAGES[code]) return VALIDATION_MESSAGES[code]
  if (error?.name === 'AbortError' || code === 'ERR_CANCELED') {
    return 'Upload cancelled.'
  }
  if (
    code === 'ERR_CORS' ||
    error?.kind === 'cors' ||
    (operation === 'upload' && code === 'ERR_NETWORK' && !error?.response)
  ) {
    return 'Upload was blocked. Please contact support.'
  }

  const status = error?.response?.status ?? error?.status
  if (status === 'REJECTED' || code === 'REJECTED' || status === 422) {
    return mapRejectedError(error)
  }
  if (status === 400 && operation === 'initiate') {
    return (
      mapValidationErrors(
        error?.response?.data?.errors ?? error?.data?.errors,
      ) || 'Some file details are invalid. Check the file and try again.'
    )
  }
  if (status === 403 && operation === 'initiate') {
    return 'You have reached your storage limit.'
  }
  if (status === 403 && operation === 'upload') {
    return 'The upload link expired. Please retry the upload.'
  }
  if (status === 404) {
    return 'This document could not be found. Please try again.'
  }
  if (status === 409 && operation === 'complete') {
    return 'Upload did not finish. Please retry.'
  }
  if (status === 429) {
    return 'Too many upload requests. Please wait and try again.'
  }
  if (typeof status === 'number' && status >= 500) {
    return 'The server could not process this upload. Please try again.'
  }
  if (code === 'ECONNABORTED') {
    return 'The upload timed out. Check your connection and try again.'
  }
  return 'The upload could not be completed. Please try again.'
}
