import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE_BYTES, validateFile } from './validateFile.js'

function makeFile({
  bytes,
  name = 'document.jpg',
  type = 'image/jpeg',
  size = bytes.length,
  lastModified = 1,
}) {
  return {
    name,
    type,
    size,
    lastModified,
    slice(start, end) {
      const buffer = Uint8Array.from(bytes.slice(start, end)).buffer
      return { arrayBuffer: async () => buffer }
    },
  }
}

describe('validateFile', () => {
  it.each([
    [makeFile({ bytes: [0xff, 0xd8, 0xff], type: 'image/jpeg' })],
    [
      makeFile({
        bytes: [0x89, 0x50, 0x4e, 0x47],
        name: 'document.png',
        type: 'image/png',
      }),
    ],
    [
      makeFile({
        bytes: [0x25, 0x50, 0x44, 0x46],
        name: 'document.pdf',
        type: 'application/pdf',
      }),
    ],
  ])('accepts a supported file with a matching signature', async (file) => {
    await expect(validateFile(file)).resolves.toEqual({ valid: true })
  })

  it('rejects empty and oversized files', async () => {
    await expect(
      validateFile(makeFile({ bytes: [], size: 0 })),
    ).resolves.toEqual({ valid: false, code: 'file_empty' })

    await expect(
      validateFile(
        makeFile({
          bytes: [0xff, 0xd8, 0xff],
          size: MAX_FILE_SIZE_BYTES + 1,
        }),
      ),
    ).resolves.toEqual({ valid: false, code: 'file_too_large' })
  })

  it('rejects unsupported types and mismatched signatures', async () => {
    await expect(
      validateFile(makeFile({ bytes: [0x00, 0x01], type: 'image/heic' })),
    ).resolves.toEqual({ valid: false, code: 'unsupported_type' })

    await expect(
      validateFile(
        makeFile({
          bytes: [0x89, 0x50, 0x4e, 0x47],
          type: 'image/jpeg',
        }),
      ),
    ).resolves.toEqual({ valid: false, code: 'file_type_mismatch' })
  })

  it('rejects files without a recognized signature', async () => {
    await expect(
      validateFile(makeFile({ bytes: [0x00, 0x01] })),
    ).resolves.toEqual({ valid: false, code: 'invalid_file_signature' })
  })

  it('rejects a duplicate name, size, and last-modified combination', async () => {
    const file = makeFile({ bytes: [0xff, 0xd8, 0xff] })
    const duplicate = makeFile({ bytes: [0xff, 0xd8, 0xff] })

    await expect(validateFile(file, [duplicate])).resolves.toEqual({
      valid: false,
      code: 'duplicate_file',
    })
  })
})
