import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatBytes.js'

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [10 * 1024 * 1024, '10 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })

  it('rejects invalid byte counts', () => {
    expect(() => formatBytes(-1)).toThrow(RangeError)
    expect(() => formatBytes(Number.NaN)).toThrow(RangeError)
  })
})
