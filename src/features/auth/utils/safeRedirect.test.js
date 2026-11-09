import { describe, expect, it } from 'vitest'
import { safeRedirect } from './safeRedirect.js'

describe('safeRedirect', () => {
  it('accepts an internal path with query and hash', () => {
    expect(
      safeRedirect({
        pathname: '/documents',
        search: '?type=id',
        hash: '#list',
      }),
    ).toBe('/documents?type=id#list')
  })

  it.each([
    'https://malicious.example',
    '//malicious.example',
    '/\\malicious.example',
    '',
  ])('rejects unsafe destination %s', (destination) => {
    expect(safeRedirect(destination)).toBe('/dashboard')
  })
})
