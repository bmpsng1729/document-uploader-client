import { describe, expect, it } from 'vitest'
import { mapUploadError } from './mapUploadError.js'

describe('mapUploadError', () => {
  it.each([
    ['file_required', 'Choose a file to upload.'],
    ['file_empty', 'This file is empty. Choose a different file.'],
    ['file_too_large', 'Each file must be 10 MB or smaller.'],
    [
      'unsupported_type',
      'Only JPG, PNG, or PDF files are supported. iPhone HEIC photos must be converted to JPEG first.',
    ],
    [
      'invalid_file_signature',
      'This file could not be recognized. Choose a valid JPG, PNG, or PDF.',
    ],
    [
      'file_type_mismatch',
      'The file contents do not match its declared type. Choose a valid JPG, PNG, or PDF.',
    ],
    ['duplicate_file', 'This file is already in the upload queue.'],
  ])('maps local error %s', (code, expected) => {
    expect(mapUploadError({ code })).toBe(expected)
  })

  it('shows safe initiate validation field messages', () => {
    expect(
      mapUploadError(
        {
          response: {
            status: 400,
            data: {
              errors: {
                sizeBytes: ['must be less than 10 MB'],
                unknownField: 'do not display this',
                originalName: 'https://storage.example/file',
              },
            },
          },
        },
        'initiate',
      ),
    ).toBe('File size: must be less than 10 MB')
  })

  it.each([
    ['initiate', 'You have reached your storage limit.'],
    ['upload', 'The upload link expired. Please retry the upload.'],
  ])('maps 403 during %s', (operation, expected) => {
    expect(mapUploadError({ response: { status: 403 } }, operation)).toBe(
      expected,
    )
  })

  it('uses a friendly fallback for invalid initiate details', () => {
    expect(mapUploadError({ response: { status: 400 } }, 'initiate')).toBe(
      'Some file details are invalid. Check the file and try again.',
    )
  })

  it('maps completion conflicts and missing documents', () => {
    expect(mapUploadError({ response: { status: 409 } }, 'complete')).toBe(
      'Upload did not finish. Please retry.',
    )
    expect(mapUploadError({ response: { status: 404 } })).toBe(
      'This document could not be found. Please try again.',
    )
  })

  it('shows an explicit rejected-file reason when provided', () => {
    expect(
      mapUploadError({
        status: 'REJECTED',
        rejectReason: 'The file is password-protected.',
      }),
    ).toBe('File rejected: The file is password-protected.')
    expect(
      mapUploadError({
        response: { status: 422, data: { detail: 'https://private.example' } },
      }),
    ).toBe('This file was rejected. Choose another file.')
  })

  it('maps rate limits and server errors', () => {
    expect(mapUploadError({ response: { status: 429 } })).toBe(
      'Too many upload requests. Please wait and try again.',
    )
    expect(mapUploadError({ response: { status: 503 } })).toBe(
      'The server could not process this upload. Please try again.',
    )
  })

  it('maps blocked storage requests, timeouts, and cancellations', () => {
    expect(mapUploadError({ code: 'ERR_CORS' }, 'upload')).toBe(
      'Upload was blocked. Please contact support.',
    )
    expect(mapUploadError({ code: 'ECONNABORTED' }, 'upload')).toBe(
      'The upload timed out. Check your connection and try again.',
    )
    expect(mapUploadError({ code: 'ERR_CANCELED' })).toBe('Upload cancelled.')
  })

  it('does not expose raw server messages', () => {
    expect(
      mapUploadError({
        response: {
          status: 500,
          data: { detail: 'internal database host and stack trace' },
        },
      }),
    ).toBe('The server could not process this upload. Please try again.')
  })
})
