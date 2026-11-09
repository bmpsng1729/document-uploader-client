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
  if (
    !response?.accessToken ||
    !response.user?.id ||
    !response.user?.name ||
    !response.user?.email
  ) {
    throw new Error('The server returned an invalid authentication response.')
  }
  setAccessToken(response.accessToken)
  return response
}

async function postAuth(endpoint, body) {
  const { data } = await apiClient.post(endpoint, body)
  return storeAuthResponse(data)
}

export function signup(credentials) {
  return postAuth(endpoints.signup, credentials)
}

export function login(credentials) {
  return postAuth(endpoints.login, credentials)
}

export function loginWithGoogle(idToken) {
  return postAuth(endpoints.google, { idToken })
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
