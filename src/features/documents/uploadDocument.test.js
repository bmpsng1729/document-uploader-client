import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  initiate: vi.fn(),
  complete: vi.fn(),
  getStatus: vi.fn(),
  put: vi.fn(),
  validateFile: vi.fn(),
  hashFile: vi.fn(),
  sleep: vi.fn(),
}))

vi.mock('./api/documentsApi.js', () => ({
  initiate: mocks.initiate,
  complete: mocks.complete,
  getStatus: mocks.getStatus,
}))

vi.mock('./api/storageClient.js', () => ({
  storageClient: { put: mocks.put },
}))

vi.mock('./utils/validateFile.js', () => ({
  validateFile: mocks.validateFile,
}))

vi.mock('./utils/hashFile.js', () => ({
  hashFile: mocks.hashFile,
}))

vi.mock('./utils/sleep.js', () => ({
  sleep: mocks.sleep,
}))

import { uploadDocument } from './uploadDocument.js'

const file = {
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 3,
  lastModified: 1,
}
const sha256 = 'a'.repeat(64)
const uploadUrl = 'https://storage.example/upload?signature=unchanged%2F'
const headers = { 'Content-Type': 'image/jpeg' }

let fakeNow

function makeInstructions(documentId = 'document-1', expiresInMs = 3_600_000) {
  return {
    documentId,
    uploadUrl,
    expiresAt: new Date(fakeNow + expiresInMs).toISOString(),
    requiredHeaders: headers,
  }
}

function makeStatus(status, rejectReason = null) {
  return {
    id: 'document-1',
    status,
    rejectReason,
    originalName: file.name,
    sizeBytes: file.size,
    type: 'PHOTO',
  }
}

function makeHttpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  })
}

describe('uploadDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeNow = Date.parse('2026-11-14T12:00:00Z')
    vi.spyOn(Date, 'now').mockImplementation(() => fakeNow)

    mocks.validateFile.mockResolvedValue({ valid: true })
    mocks.hashFile.mockResolvedValue(sha256)
    mocks.initiate.mockResolvedValue(makeInstructions())
    mocks.put.mockResolvedValue({ status: 200 })
    mocks.complete.mockResolvedValue(undefined)
    mocks.getStatus.mockResolvedValue(makeStatus('READY'))
    mocks.sleep.mockImplementation(async (delayMs, signal) => {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Aborted', 'AbortError')
      }
      fakeNow += delayMs
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs the complete flow in order and forwards progress', async () => {
    const calls = []
    const onProgress = vi.fn()
    const onStep = vi.fn()
    mocks.initiate.mockImplementation(async () => {
      calls.push('initiate')
      return makeInstructions()
    })
    mocks.put.mockImplementation(async (_url, _file, config) => {
      calls.push('put')
      config.onUploadProgress({ loaded: 63, total: 100 })
    })
    mocks.complete.mockImplementation(async () => {
      calls.push('complete')
    })
    mocks.getStatus.mockImplementation(async () => {
      calls.push('status')
      return makeStatus('READY')
    })

    const result = await uploadDocument(file, 'PHOTO', {
      onProgress,
      onStep,
    })

    expect(calls).toEqual(['initiate', 'put', 'complete', 'status'])
    expect(mocks.validateFile).toHaveBeenCalledWith(file)
    expect(mocks.hashFile).toHaveBeenCalledWith(file)
    expect(mocks.initiate).toHaveBeenCalledWith(
      {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 3,
        sha256,
        type: 'PHOTO',
      },
      { signal: undefined },
    )
    expect(mocks.put).toHaveBeenCalledWith(
      uploadUrl,
      file,
      expect.objectContaining({
        headers,
        signal: undefined,
        withCredentials: false,
      }),
    )
    expect(mocks.complete).toHaveBeenCalledWith('document-1', {
      signal: undefined,
    })
    expect(mocks.getStatus).toHaveBeenCalledWith('document-1', {
      signal: undefined,
    })
    expect(onProgress).toHaveBeenNthCalledWith(1, 0)
    expect(onProgress).toHaveBeenNthCalledWith(2, 63)
    expect(onStep).toHaveBeenLastCalledWith('ready')
    expect(result).toMatchObject({ documentId: 'document-1', status: 'READY' })
    expect(JSON.stringify(result)).not.toContain('signature=')
  })

  it('re-initiates once when the presigned URL is nearly expired', async () => {
    mocks.initiate
      .mockResolvedValueOnce(makeInstructions('expired-document', 10_000))
      .mockResolvedValueOnce(makeInstructions('fresh-document'))

    const result = await uploadDocument(file, 'PHOTO')

    expect(mocks.initiate).toHaveBeenCalledTimes(2)
    expect(mocks.put).toHaveBeenCalledOnce()
    expect(mocks.complete).toHaveBeenCalledWith('fresh-document', {
      signal: undefined,
    })
    expect(result.documentId).toBe('fresh-document')
  })

  it('re-initiates once after a storage 403 and completes the new document', async () => {
    mocks.initiate
      .mockResolvedValueOnce(makeInstructions('expired-document'))
      .mockResolvedValueOnce(makeInstructions('fresh-document'))
    mocks.put
      .mockRejectedValueOnce(makeHttpError(403))
      .mockResolvedValueOnce({ status: 200 })

    const result = await uploadDocument(file, 'PHOTO')

    expect(mocks.initiate).toHaveBeenCalledTimes(2)
    expect(mocks.put).toHaveBeenCalledTimes(2)
    expect(mocks.complete).toHaveBeenCalledWith('fresh-document', {
      signal: undefined,
    })
    expect(result.documentId).toBe('fresh-document')
  })

  it('retries network failures up to two times with the configured backoff', async () => {
    mocks.put
      .mockRejectedValueOnce({ code: 'ERR_NETWORK' })
      .mockRejectedValueOnce({ code: 'ERR_NETWORK' })
      .mockResolvedValueOnce({ status: 200 })

    await uploadDocument(file, 'PHOTO')

    expect(mocks.put).toHaveBeenCalledTimes(3)
    expect(mocks.sleep.mock.calls.map(([delay]) => delay)).toEqual([
      1_000, 3_000, 1_500,
    ])
  })

  it('logs a CORS hint without logging the presigned URL after network retries fail', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.put.mockRejectedValue({
      code: 'ERR_NETWORK',
      isAxiosError: true,
    })

    await expect(uploadDocument(file, 'PHOTO')).rejects.toMatchObject({
      uploadOperation: 'upload',
    })

    expect(mocks.put).toHaveBeenCalledTimes(3)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('CORS')
    expect(warn.mock.calls[0][0]).not.toContain('signature=')
  })

  it('retries complete conflicts three times then fails', async () => {
    mocks.complete.mockRejectedValue(makeHttpError(409))

    await expect(uploadDocument(file, 'PHOTO')).rejects.toMatchObject({
      uploadOperation: 'complete',
      response: { status: 409 },
    })

    expect(mocks.complete).toHaveBeenCalledTimes(4)
    expect(mocks.sleep.mock.calls).toEqual([
      [1_500, undefined],
      [1_500, undefined],
      [1_500, undefined],
    ])
    expect(mocks.getStatus).not.toHaveBeenCalled()
  })

  it('does not retry quota errors from initiate', async () => {
    mocks.initiate.mockRejectedValue(makeHttpError(403))

    await expect(uploadDocument(file, 'PHOTO')).rejects.toMatchObject({
      uploadOperation: 'initiate',
      response: { status: 403 },
    })

    expect(mocks.initiate).toHaveBeenCalledOnce()
    expect(mocks.put).not.toHaveBeenCalled()
  })

  it('rejects missing document types before calling the API', async () => {
    await expect(uploadDocument(file, '')).rejects.toMatchObject({
      code: 'document_type_required',
    })
    expect(mocks.initiate).not.toHaveBeenCalled()
  })

  it('returns rejected documents and their reason', async () => {
    mocks.getStatus.mockResolvedValue(
      makeStatus('REJECTED', 'The document is unreadable.'),
    )

    await expect(uploadDocument(file, 'PHOTO')).resolves.toMatchObject({
      status: 'REJECTED',
      rejectReason: 'The document is unreadable.',
    })
  })

  it('stops polling when the status becomes DELETING', async () => {
    mocks.getStatus.mockResolvedValue(makeStatus('DELETING'))

    await expect(uploadDocument(file, 'PHOTO')).resolves.toMatchObject({
      status: 'DELETING',
    })
    expect(mocks.getStatus).toHaveBeenCalledOnce()
  })

  it('returns a non-error timeout after two minutes of processing', async () => {
    mocks.getStatus.mockResolvedValue(makeStatus('PROCESSING'))
    const startTime = fakeNow

    await expect(uploadDocument(file, 'PHOTO')).resolves.toMatchObject({
      status: 'PROCESSING',
      timedOut: true,
      message: 'Still processing. It will appear in your documents when ready.',
    })

    expect(fakeNow - startTime).toBe(120_000)
    expect(mocks.getStatus).toHaveBeenCalled()
  })

  it('aborts the storage request and does not complete or poll', async () => {
    const controller = new AbortController()
    mocks.put.mockImplementation((_url, _file, config) => {
      return new Promise((_resolve, reject) => {
        config.signal.addEventListener(
          'abort',
          () =>
            reject(
              Object.assign(new Error('Aborted'), { code: 'ERR_CANCELED' }),
            ),
          { once: true },
        )
      })
    })

    const upload = uploadDocument(file, 'PHOTO', {
      signal: controller.signal,
    })
    await vi.waitFor(() => expect(mocks.put).toHaveBeenCalledOnce())
    controller.abort()

    await expect(upload).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(mocks.complete).not.toHaveBeenCalled()
    expect(mocks.getStatus).not.toHaveBeenCalled()
  })
})
