const viteEnv = import.meta.env ?? {}
const apiBaseUrl = viteEnv.VITE_API_BASE_URL?.trim()
const googleClientId = viteEnv.VITE_GOOGLE_CLIENT_ID?.trim()

if (!apiBaseUrl) {
  throw new Error(
    'Missing VITE_API_BASE_URL. Add it to your .env file before starting the app.',
  )
}

if (!googleClientId) {
  throw new Error(
    'Missing VITE_GOOGLE_CLIENT_ID. Add it to your .env file before starting the app.',
  )
}

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '')
export const GOOGLE_CLIENT_ID = googleClientId

if (viteEnv.PROD && new URL(API_BASE_URL).protocol !== 'https:') {
  throw new Error('VITE_API_BASE_URL must use HTTPS in production.')
}
