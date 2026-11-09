import { describe, expect, it } from 'vitest'
import { mapAuthError, mapAuthFieldErrors } from './mapAuthError.js'

describe('mapAuthError', () => {
  it('does not disclose which login credential was invalid', () => {
    expect(mapAuthError({ response: { status: 401 } }, 'login')).toBe(
      'Invalid email or password',
    )
  })

  it('maps duplicate signup accounts', () => {
    expect(mapAuthError({ response: { status: 409 } }, 'signup')).toBe(
      'An account with this email already exists. Try logging in.',
    )
  })

  it('maps rate limits', () => {
    expect(mapAuthError({ response: { status: 429 } })).toBe(
      'Too many attempts. Please try again later.',
    )
  })

  it('maps network, server, validation, and other failures safely', () => {
    expect(
      mapAuthError({
        isAxiosError: true,
        message: 'private server text',
      }),
    ).toBe('Cannot reach the server. Check your connection.')
    expect(mapAuthError({ response: { status: 503 } })).toBe(
      'Something went wrong. Please try again.',
    )
    expect(mapAuthError({ response: { status: 400 } })).toBe(
      'Something went wrong. Please try again.',
    )
    expect(mapAuthError({ response: { status: 401 } }, 'signup')).toBe(
      'Something went wrong. Please try again.',
    )
  })
})

describe('mapAuthFieldErrors', () => {
  it('returns only recognized string validation messages', () => {
    expect(
      mapAuthFieldErrors({
        response: {
          status: 400,
          data: {
            errors: {
              email: 'Invalid email.',
              unknown: 'Do not display.',
              password: 42,
            },
          },
        },
      }),
    ).toEqual({ email: 'Invalid email.' })
  })
})
