import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { hashFile } from './hashFile.js'

function makeFileBytes(bytes) {
  const buffer = Uint8Array.from(bytes).buffer
  return { arrayBuffer: async () => buffer }
}

describe('hashFile', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('matches the SHA-256 empty-input vector', async () => {
    await expect(hashFile(makeFileBytes([]))).resolves.toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('matches the SHA-256 abc vector', async () => {
    await expect(hashFile(makeFileBytes([0x61, 0x62, 0x63]))).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})
