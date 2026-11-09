import { describe, expect, it } from 'vitest'
import { loginSchema, signupSchema } from './authSchemas.js'

describe('auth schemas', () => {
  it('normalizes valid signup name and email', () => {
    expect(
      signupSchema.parse({
        name: '  Riley Example ',
        email: '  RILEY@example.com ',
        password: 'secure123',
        confirmPassword: 'secure123',
      }),
    ).toEqual({
      name: 'Riley Example',
      email: 'riley@example.com',
      password: 'secure123',
      confirmPassword: 'secure123',
    })
  })

  it.each([
    [
      'short name',
      {
        name: 'R',
        email: 'r@example.com',
        password: 'secure123',
        confirmPassword: 'secure123',
      },
    ],
    [
      'long name',
      {
        name: 'a'.repeat(81),
        email: 'r@example.com',
        password: 'secure123',
        confirmPassword: 'secure123',
      },
    ],
    [
      'invalid email',
      {
        name: 'Riley',
        email: 'invalid',
        password: 'secure123',
        confirmPassword: 'secure123',
      },
    ],
    [
      'short password',
      {
        name: 'Riley',
        email: 'r@example.com',
        password: 'abc123',
        confirmPassword: 'abc123',
      },
    ],
    [
      'password without a digit',
      {
        name: 'Riley',
        email: 'r@example.com',
        password: 'securepass',
        confirmPassword: 'securepass',
      },
    ],
    [
      'password without a letter',
      {
        name: 'Riley',
        email: 'r@example.com',
        password: '12345678',
        confirmPassword: '12345678',
      },
    ],
    [
      'mismatched confirmation',
      {
        name: 'Riley',
        email: 'r@example.com',
        password: 'secure123',
        confirmPassword: 'different123',
      },
    ],
  ])('rejects %s', (_label, values) => {
    expect(signupSchema.safeParse(values).success).toBe(false)
  })

  it('accepts a valid login and normalizes its email', () => {
    expect(
      loginSchema.parse({ email: ' USER@example.com ', password: 'anything' }),
    ).toEqual({ email: 'user@example.com', password: 'anything' })
  })

  it('requires a valid email and a non-empty password for login', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: '' }).success).toBe(
      false,
    )
  })
})
