import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../../app/ToastContext.js'
import { loginSchema } from '../schemas/authSchemas.js'
import { mapAuthError, mapAuthFieldErrors } from '../utils/mapAuthError.js'
import { safeRedirect } from '../utils/safeRedirect.js'
import { useAuth } from '../context/useAuth.js'
import { AuthDivider } from './AuthDivider.jsx'
import { FormError } from './FormError.jsx'
import { GoogleButton } from './GoogleButton.jsx'
import { PasswordInput } from './PasswordInput.jsx'
import { TextField } from './TextField.jsx'

export function LoginForm() {
  const { login, loginWithGoogle } = useAuth()
  const { showSuccess } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  function completeLogin() {
    navigate(safeRedirect(location.state?.from), { replace: true })
  }

  async function submit(values) {
    setFormError('')
    try {
      await login(values)
      showSuccess('Signed in successfully.')
      completeLogin()
    } catch (error) {
      const fieldErrors = mapAuthFieldErrors(error)
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (['email', 'password'].includes(field)) {
          setError(field, { type: 'server', message })
        }
      }
      setFormError(mapAuthError(error, 'login'))
    }
  }

  async function submitGoogle(idToken) {
    setFormError('')
    try {
      await loginWithGoogle(idToken)
      showSuccess('Signed in successfully.')
      completeLogin()
    } catch (error) {
      setFormError(mapAuthError(error, 'google'))
    }
  }

  return (
    <div className="space-y-3">
      <FormError>{formError}</FormError>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(submit)}>
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          id="email"
          label="Email"
          registration={register('email')}
          type="email"
        />
        <PasswordInput
          autoComplete="current-password"
          error={errors.password?.message}
          id="password"
          label="Password"
          registration={register('password')}
        />
        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-[1.5px] border-brand-dark bg-brand px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mint-300 active:translate-y-px active:bg-mint-300 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
            />
          ) : null}
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <AuthDivider />
      <GoogleButton onCredential={submitGoogle} />
      <p className="text-center text-sm text-muted">
        Don’t have an account?{' '}
        <Link
          className="inline-flex min-h-11 items-center px-1 font-semibold text-brand-dark underline-offset-4 hover:underline"
          to="/signup"
        >
          Create account
        </Link>
      </p>
    </div>
  )
}
