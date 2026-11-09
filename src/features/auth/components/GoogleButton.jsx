import { useEffect, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { FormError } from './FormError.jsx'

export function GoogleButton({ onCredential }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleScriptError = () => {
      setError(
        'Google sign-in could not load. Check your connection and try again.',
      )
    }
    window.addEventListener('auth:google-script-error', handleScriptError)
    return () =>
      window.removeEventListener('auth:google-script-error', handleScriptError)
  }, [])

  async function handleSuccess(response) {
    if (!response.credential) {
      setError('Google sign-in did not return a valid credential.')
      return
    }

    setPending(true)
    setError('')
    try {
      await onCredential(response.credential)
    } catch {
      setError('Google sign-in could not be completed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  function handleNonOAuthError(result) {
    if (result?.type === 'popup_closed') return

    setError(
      result?.type === 'popup_failed_to_open'
        ? 'Google sign-in could not load. Check your connection and try again.'
        : 'Google sign-in is currently unavailable. Please try again.',
    )
  }

  return (
    <div>
      {pending ? (
        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-brand-dark bg-white px-4 text-sm font-normal text-ink"
          disabled
          type="button"
        >
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-mint-300 border-t-brand-dark"
          />
          Connecting to Google…
        </button>
      ) : (
        <div className="flex min-h-11 justify-center">
          <GoogleLogin
            onError={() =>
              setError(
                'Google sign-in could not load. Check your connection and try again.',
              )
            }
            onNonOAuthError={handleNonOAuthError}
            onSuccess={handleSuccess}
            theme="outline"
            text="continue_with"
            width="240"
          />
        </div>
      )}
      <FormError>{error}</FormError>
    </div>
  )
}
