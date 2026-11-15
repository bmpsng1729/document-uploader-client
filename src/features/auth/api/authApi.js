import { apiClient, setRefreshSessionHandler } from '../../../lib/apiClient.js'
import { clearAccessToken, setAccessToken } from '../../../lib/tokenStore.js'

const endpoints = {
  signup: '/api/v1/auth/signup',
  login: '/api/v1/auth/login',
  google: '/api/v1/auth/google',
  refresh: '/api/v1/auth/refresh',
  logout: '/api/v1/auth/logout',
  me: '/api/v1/me',
}

let refreshSessionPromise

function normalizeAuthResponse(response) {
  const user =
    response?.user ??
    (response?.userId
      ? {
          id: response.userId,
          name: response.name,
          email: response.email,
        }
      : null)
  const normalizedResponse = user ? { ...response, user } : null

  if (
    !normalizedResponse?.accessToken ||
    !normalizedResponse.user?.id ||
    !normalizedResponse.user?.name ||
    !normalizedResponse.user?.email
  ) {
    return null
  }
  return normalizedResponse
}

/**
 * @typedef {{ id: string, name: string, email: string }} AuthUser
 * @typedef {{ accessToken: string, expiresIn: number, user: AuthUser }} AuthResponse
 */

/**
 * Validates and stores a backend-issued access token without persisting it.
 * @param {AuthResponse} response
 * @returns {AuthResponse}
 */
function storeAuthResponse(response) {
  const normalizedResponse = normalizeAuthResponse(response)
  if (!normalizedResponse) {
    throw new Error('The server returned an invalid authentication response.')
  }
  setAccessToken(normalizedResponse.accessToken)
  return normalizedResponse
}

async function postAuth(endpoint, body) {
  const { data } = await apiClient.post(endpoint, body)
  return storeAuthResponse(data)
}

export async function signup(credentials) {
  const { data } = await apiClient.post(endpoints.signup, credentials)
  if (!normalizeAuthResponse(data)) {
    return { authenticated: false }
  }
  return storeAuthResponse(data)
}

export function login(credentials) {
  return postAuth(endpoints.login, credentials)
}

/**
 * Restores a session from the backend-managed httpOnly refresh cookie.
 * @returns {Promise<AuthResponse>}
 */
export function refreshSession() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = apiClient
      .post(endpoints.refresh)
      .then(({ data }) => storeAuthResponse(data))
      .catch((error) => {
        clearAccessToken()
        throw error
      })
      .finally(() => {
        refreshSessionPromise = null
      })
  }
  return refreshSessionPromise
}

export function logout() {
  return apiClient.post(endpoints.logout).finally(clearAccessToken)
}

/**
 * Retrieves the signed-in user from the backend.
 * @returns {Promise<AuthUser>}
 */
export async function getCurrentUser() {
  const { data } = await apiClient.get(endpoints.me)
  return data
}

setRefreshSessionHandler(refreshSession)
