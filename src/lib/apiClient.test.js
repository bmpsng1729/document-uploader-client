import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { apiClient, setRefreshSessionHandler } from './apiClient.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './tokenStore.js'

function unauthorized(config) {
  return new AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    {},
    {
      config,
      data: {},
      headers: {},
      status: 401,
      statusText: 'Unauthorized',
    },
  )
}

function ok(config) {
  return {
    config,
    data: { ok: true },
    headers: {},
    status: 200,
    statusText: 'OK',
  }
}

describe('apiClient response interceptor', () => {
  let originalAdapter

  beforeEach(() => {
    originalAdapter = apiClient.defaults.adapter
    clearAccessToken()
    setRefreshSessionHandler(undefined)
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    setRefreshSessionHandler(undefined)
    clearAccessToken()
  })

  it('refreshes once and retries a request after a 401', async () => {
    const refresh = vi.fn(async () => {
      setAccessToken('fresh-token')
      return { accessToken: 'fresh-token' }
    })
    setRefreshSessionHandler(refresh)
    const requests = []
    apiClient.defaults.adapter = async (config) => {
      requests.push(config)
      if (requests.length === 1) throw unauthorized(config)
      return ok(config)
    }

    const response = await apiClient.get('/api/v1/me')

    expect(response.data).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledOnce()
    expect(requests).toHaveLength(2)
    expect(requests[1].headers.get('Authorization')).toBe('Bearer fresh-token')
  })

  it('shares one refresh across concurrent 401 responses', async () => {
    let releaseRefresh
    const refreshGate = new Promise((resolve) => {
      releaseRefresh = resolve
    })
    const refresh = vi.fn(async () => {
      await refreshGate
      setAccessToken('shared-token')
      return { accessToken: 'shared-token' }
    })
    setRefreshSessionHandler(refresh)
    const attempts = new Map()
    apiClient.defaults.adapter = async (config) => {
      const count = (attempts.get(config.url) ?? 0) + 1
      attempts.set(config.url, count)
      if (count === 1) throw unauthorized(config)
      return ok(config)
    }

    const first = apiClient.get('/first')
    const second = apiClient.get('/second')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    releaseRefresh()
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)

    expect(refresh).toHaveBeenCalledOnce()
    expect([...attempts.values()]).toEqual([2, 2])
  })

  it('clears the token and notifies the app if refresh fails', async () => {
    setAccessToken('expired-token')
    setRefreshSessionHandler(
      vi.fn().mockRejectedValue(new Error('refresh failed')),
    )
    const onExpired = vi.fn()
    window.addEventListener('auth:session-expired', onExpired)
    apiClient.defaults.adapter = async (config) => {
      throw unauthorized(config)
    }

    await expect(apiClient.get('/api/v1/me')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(getAccessToken()).toBeNull()
    expect(onExpired).toHaveBeenCalledOnce()
    window.removeEventListener('auth:session-expired', onExpired)
  })
})
