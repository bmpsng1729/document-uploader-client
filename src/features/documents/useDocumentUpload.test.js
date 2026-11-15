import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  uploadDocument: vi.fn(),
  validateFile: vi.fn(),
}))

vi.mock('./uploadDocument.js', () => ({
  uploadDocument: mocks.uploadDocument,
}))

vi.mock('./utils/validateFile.js', () => ({
  validateFile: mocks.validateFile,
}))

import { useDocumentUpload } from './useDocumentUpload.js'

function makeFile(name, type = 'image/jpeg') {
  return new File(['image bytes'], name, {
    type,
    lastModified: 1,
  })
}

let originalCreateObjectURL
let originalRevokeObjectURL
let nextPreviewId

describe('useDocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextPreviewId = 0
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:preview-${++nextPreviewId}`),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    mocks.validateFile.mockResolvedValue({ valid: true })
    mocks.uploadDocument.mockResolvedValue({
      documentId: 'document-1',
      status: 'READY',
      document: { id: 'document-1', status: 'READY' },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: originalCreateObjectURL,
      })
    } else {
      delete URL.createObjectURL
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: originalRevokeObjectURL,
      })
    } else {
      delete URL.revokeObjectURL
    }
  })

  it('allows selecting another file only after the current upload finishes', async () => {
    let finishUpload
    mocks.uploadDocument.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        }),
    )
    const { result } = renderHook(() => useDocumentUpload())
    const firstFile = makeFile('first.jpg')
    const nextFile = makeFile('next.jpg')

    await act(async () => result.current.selectFiles([firstFile]))
    act(() => {
      result.current.setDocumentType('PHOTO')
      result.current.upload()
    })
    expect(result.current.isBusy).toBe(true)

    await act(async () => result.current.selectFiles([nextFile]))
    expect(result.current.item.file).toBe(firstFile)
    expect(result.current.selectionError).toContain(
      'Wait for the current upload to finish first.',
    )

    await act(async () => {
      finishUpload({
        documentId: 'document-1',
        status: 'READY',
        document: { id: 'document-1', status: 'READY' },
      })
    })
    await waitFor(() => expect(result.current.isBusy).toBe(false))
    expect(result.current.item.status).toBe('ready')

    await act(async () => result.current.selectFiles([nextFile]))
    expect(result.current.item.file).toBe(nextFile)
    expect(result.current.selectionError).toBe('')
  })

  it('rejects selecting multiple documents at once', async () => {
    const { result } = renderHook(() => useDocumentUpload())

    await act(async () =>
      result.current.selectFiles([makeFile('one.jpg'), makeFile('two.jpg')]),
    )

    expect(result.current.item).toBeNull()
    expect(result.current.selectionError).toBe('Choose one document at a time.')
    expect(mocks.validateFile).not.toHaveBeenCalled()
  })

  it('restarts a failed upload from the beginning when retried', async () => {
    mocks.uploadDocument
      .mockRejectedValueOnce(
        Object.assign(new Error('network error'), {
          uploadOperation: 'upload',
        }),
      )
      .mockResolvedValueOnce({
        documentId: 'document-1',
        status: 'READY',
        document: { id: 'document-1', status: 'READY' },
      })
    const { result } = renderHook(() => useDocumentUpload())

    await act(async () => result.current.selectFiles([makeFile('retry.jpg')]))
    act(() => {
      result.current.setDocumentType('PHOTO')
      result.current.upload()
    })
    await waitFor(() => expect(result.current.item.status).toBe('failed'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.item.status).toBe('ready'))
    expect(mocks.uploadDocument).toHaveBeenCalledTimes(2)
  })

  it('cancels an active upload and leaves it retryable', async () => {
    let uploadSignal
    mocks.uploadDocument.mockImplementation(
      (file, type, { signal }) =>
        new Promise((resolve, reject) => {
          uploadSignal = signal
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          )
        }),
    )
    const { result } = renderHook(() => useDocumentUpload())

    await act(async () => result.current.selectFiles([makeFile('cancel.jpg')]))
    act(() => {
      result.current.setDocumentType('PHOTO')
      result.current.upload()
    })

    act(() => result.current.cancel())

    await waitFor(() =>
      expect(result.current.item).toMatchObject({
        status: 'cancelled',
        retryable: true,
      }),
    )
    expect(uploadSignal.aborted).toBe(true)
  })

  it('shows mapped errors for invalid files and revokes previews on replacement/unmount', async () => {
    const { result, unmount } = renderHook(() => useDocumentUpload())

    await act(async () => result.current.selectFiles([makeFile('first.jpg')]))
    const firstPreview = result.current.item.previewUrl
    await act(async () => result.current.selectFiles([makeFile('second.jpg')]))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstPreview)
    const secondPreview = result.current.item.previewUrl

    mocks.validateFile.mockResolvedValue({
      valid: false,
      code: 'unsupported_type',
    })
    await act(async () =>
      result.current.selectFiles([makeFile('photo.heic', 'image/heic')]),
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(secondPreview)
    const invalidPreview = result.current.item.previewUrl
    expect(result.current.item).toMatchObject({
      status: 'failed',
      retryable: false,
    })
    expect(result.current.item.error).toContain(
      'iPhone HEIC photos must be converted to JPEG first.',
    )

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(invalidPreview)
  })
})
