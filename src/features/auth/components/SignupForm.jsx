import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useToast } from '../../../app/ToastContext.js'
import { signupSchema } from '../schemas/authSchemas.js'
import { mapAuthError, mapAuthFieldErrors } from '../utils/mapAuthError.js'
import { useAuth } from '../context/useAuth.js'
import { AuthDivider } from './AuthDivider.jsx'
import { FormError } from './FormError.jsx'
import { GoogleButton } from './GoogleButton.jsx'
import { PasswordInput } from './PasswordInput.jsx'
import { TextField } from './TextField.jsx'

export function SignupForm({ onSuccess }) {
  const { signup, loginWithGoogle } = useAuth()
  const { showSuccess } = useToast()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema), mode: 'onTouched' })

  async function submit(values) {
    setFormError('')
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      showSuccess('Account created successfully.')
      onSuccess()
    } catch (error) {
      const fieldErrors = mapAuthFieldErrors(error)
      for (const [field, message] of Object.entries(fieldErrors)) {
        const name = field === 'fullName' ? 'name' : field
        if (['name', 'email', 'password', 'confirmPassword'].includes(name)) {
          setError(name, { type: 'server', message })
        }
      }
      setFormError(mapAuthError(error, 'signup'))
    }
  }

  async function submitGoogle(idToken) {
    setFormError('')
    try {
      await loginWithGoogle(idToken)
      showSuccess('Signed in successfully.')
      onSuccess()
    } catch (error) {
      setFormError(mapAuthError(error, 'google'))
    }
  }

  return (
    <div className="space-y-3">
      <FormError>{formError}</FormError>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(submit)}>
        <TextField
          autoComplete="name"
          error={errors.name?.message}
          id="name"
          label="Full name"
          registration={register('name')}
        />
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          id="email"
          label="Email"
          registration={register('email')}
          type="email"
        />
        <PasswordInput
          autoComplete="new-password"
          error={errors.password?.message}
          id="password"
          label="Password"
          registration={register('password')}
        />
        <PasswordInput
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          id="confirmPassword"
          label="Confirm password"
          registration={register('confirmPassword')}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <AuthDivider />
      <GoogleButton onCredential={submitGoogle} />
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          className="inline-flex min-h-11 items-center px-1 font-semibold text-brand-dark underline-offset-4 hover:underline"
          to="/login"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}
