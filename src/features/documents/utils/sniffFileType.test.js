import { describe, expect, it } from 'vitest'
import { sniffFileType } from './sniffFileType.js'

function makeFile(bytes) {
  return {
    slice(start, end) {
      const buffer = Uint8Array.from(bytes.slice(start, end)).buffer
      return { arrayBuffer: async () => buffer }
    },
  }
}

describe('sniffFileType', () => {
  it.each([
    [[0xff, 0xd8, 0xff, 0x00], 'image/jpeg'],
    [[0x89, 0x50, 0x4e, 0x47], 'image/png'],
    [[0x25, 0x50, 0x44, 0x46], 'application/pdf'],
  ])('recognizes the file signature as %s', async (bytes, mimeType) => {
    await expect(sniffFileType(makeFile(bytes))).resolves.toBe(mimeType)
  })

  it('returns null for unsupported or incomplete signatures', async () => {
    await expect(sniffFileType(makeFile([0x00, 0x01]))).resolves.toBeNull()
    await expect(sniffFileType(null)).resolves.toBeNull()
  })
})
