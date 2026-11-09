import axios from 'axios'
import { API_BASE_URL } from './env.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './tokenStore.js'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let refreshSessionHandler
let refreshPromise

export function setRefreshSessionHandler(handler) {
  refreshSessionHandler = handler
}

function isAuthEndpoint(config) {
  return config.url?.includes('/api/v1/auth/')
}

function notifySessionExpired() {
  clearAccessToken()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:session-expired'))
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    config.headers.delete('Authorization')
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._authRetry ||
      isAuthEndpoint(originalRequest)
    ) {
      return Promise.reject(error)
    }

    originalRequest._authRetry = true
    if (!refreshPromise) {
      refreshPromise = (async () => {
        if (!refreshSessionHandler) {
          throw new Error('The auth refresh handler has not been configured.')
        }
        const session = await refreshSessionHandler()
        if (!session?.accessToken) {
          throw new Error(
            'The refresh response did not contain an access token.',
          )
        }
        setAccessToken(session.accessToken)
        return session
      })()
        .catch((refreshError) => {
          notifySessionExpired()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    try {
      await refreshPromise
    } catch {
      return Promise.reject(error)
    }
    return apiClient(originalRequest)
  },
)
