import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  signup,
} from './authApi.js'
import { apiClient } from '../../../lib/apiClient.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../../../lib/tokenStore.js'

const session = {
  accessToken: 'memory-only-token',
  expiresIn: 900,
  user: { id: 'user-1', name: 'Riley Example', email: 'riley@example.com' },
}

describe('authApi', () => {
  let originalAdapter

  beforeEach(() => {
    originalAdapter = apiClient.defaults.adapter
    clearAccessToken()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    clearAccessToken()
  })

  it('uses the documented endpoint paths and request bodies', async () => {
    const calls = []
    apiClient.defaults.adapter = async (config) => {
      calls.push({
        method: config.method,
        url: config.url,
        data: config.data ? JSON.parse(config.data) : undefined,
      })
      if (config.url === '/api/v1/me') {
        return {
          config,
          data: session.user,
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      }
      return {
        config,
        data: session,
        headers: {},
        status: config.url.endsWith('/logout') ? 204 : 200,
        statusText: 'OK',
      }
    }

    await expect(
      signup({
        name: 'Riley Example',
        email: 'riley@example.com',
        password: 'secure123',
      }),
    ).resolves.toEqual(session    )
    await login({ email: 'riley@example.com', password: 'secure123' })
    await refreshSession()
    expect(getAccessToken()).toBe('memory-only-token')
    await logout()
    await expect(getCurrentUser()).resolves.toEqual(session.user)

    expect(calls).toEqual([
      {
        method: 'post',
        url: '/api/v1/auth/signup',
        data: {
          name: 'Riley Example',
          email: 'riley@example.com',
          password: 'secure123',
        },
      },
      {
        method: 'post',
        url: '/api/v1/auth/login',
        data: { email: 'riley@example.com', password: 'secure123' },
      },
      {
        method: 'post',
        url: '/api/v1/auth/refresh',
        data: undefined,
      },
      {
        method: 'post',
        url: '/api/v1/auth/logout',
        data: undefined,
      },
      { method: 'get', url: '/api/v1/me', data: undefined },
    ])
    expect(getAccessToken()).toBeNull()
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it.each([
    { message: 'Account created' },
    {
      accessToken: 'partial-token',
      user: { id: 'user-1', email: 'riley@example.com' },
    },
  ])(
    'accepts successful signup responses without a complete session',
    async (data) => {
      apiClient.defaults.adapter = async (config) => ({
        config,
        data,
        headers: {},
        status: 201,
        statusText: 'Created',
      })

      await expect(
        signup({
          name: 'Riley Example',
          email: 'riley@example.com',
          password: 'secure123',
        }),
      ).resolves.toEqual({ authenticated: false })
      expect(getAccessToken()).toBeNull()
    },
  )

  it('normalizes flat signup user fields and stores its access token', async () => {
    const data = {
      userId: 'user-2',
      name: 'Riley Example',
      email: 'riley@example.com',
      accessToken: 'signup-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }
    apiClient.defaults.adapter = async (config) => ({
      config,
      data,
      headers: {},
      status: 201,
      statusText: 'Created',
    })

    await expect(
      signup({
        name: 'Riley Example',
        email: 'riley@example.com',
        password: 'secure123',
      }),
    ).resolves.toEqual({
      ...data,
      user: { id: 'user-2', name: 'Riley Example', email: 'riley@example.com' },
    })
    expect(getAccessToken()).toBe('signup-token')
  })

  it('shares concurrent startup refresh calls', async () => {
    let requestCount = 0
    let releaseRequest
    const requestGate = new Promise((resolve) => {
      releaseRequest = resolve
    })
    apiClient.defaults.adapter = async (config) => {
      requestCount += 1
      await requestGate
      return {
        config,
        data: session,
        headers: {},
        status: 200,
        statusText: 'OK',
      }
    }

    const first = refreshSession()
    const second = refreshSession()
    expect(requestCount).toBe(0)
    releaseRequest()
    await expect(Promise.all([first, second])).resolves.toEqual([
      session,
      session,
    ])
    expect(requestCount).toBe(1)
  })

  it('clears the in-memory token even when logout fails', async () => {
    setAccessToken('active-token')
    apiClient.defaults.adapter = async () => {
      throw new Error('network failure')
    }

    await expect(logout()).rejects.toThrow('network failure')
    expect(getAccessToken()).toBeNull()
  })
})
