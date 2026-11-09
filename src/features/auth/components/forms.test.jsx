import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../../app/ToastProvider.jsx'
import { SignupForm } from './SignupForm.jsx'
import { LoginForm } from './LoginForm.jsx'

const authMocks = vi.hoisted(() => ({
  signup: vi.fn(),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
}))

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMocks,
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button type="button">Continue with Google</button>,
}))

function renderForm(component) {
  return render(
    <MemoryRouter>
      <ToastProvider>{component}</ToastProvider>
    </MemoryRouter>,
  )
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.signup.mockResolvedValue({})
    authMocks.loginWithGoogle.mockResolvedValue({})
  })

  it('shows validation errors and blocks invalid values', async () => {
    const user = userEvent.setup()
    renderForm(<SignupForm onSuccess={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText('Name must be at least 2 characters.'),
    ).toBeVisible()
    expect(authMocks.signup).not.toHaveBeenCalled()
  })

  it('submits normalized valid data and disables submit during the request', async () => {
    const user = userEvent.setup()
    let resolveSignup
    authMocks.signup.mockReturnValue(
      new Promise((resolve) => {
        resolveSignup = resolve
      }),
    )
    const onSuccess = vi.fn()
    renderForm(<SignupForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Full name'), 'Riley Example')
    await user.type(screen.getByLabelText('Email'), 'RILEY@EXAMPLE.COM')
    await user.type(screen.getByLabelText('Password'), 'secure123')
    await user.type(screen.getByLabelText('Confirm password'), 'secure123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByRole('button', { name: 'Creating account…' }),
    ).toBeDisabled()
    expect(authMocks.signup).toHaveBeenCalledWith({
      name: 'Riley Example',
      email: 'riley@example.com',
      password: 'secure123',
    })
    resolveSignup({})
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Account created successfully.',
    )
  })

  it('shows the friendly duplicate-email message', async () => {
    const user = userEvent.setup()
    authMocks.signup.mockRejectedValue({ response: { status: 409 } })
    renderForm(<SignupForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText('Full name'), 'Riley Example')
    await user.type(screen.getByLabelText('Email'), 'riley@example.com')
    await user.type(screen.getByLabelText('Password'), 'secure123')
    await user.type(screen.getByLabelText('Confirm password'), 'secure123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText(
        'An account with this email already exists. Try logging in.',
      ),
    ).toBeVisible()
  })

  it('shows backend field errors below the matching input', async () => {
    const user = userEvent.setup()
    authMocks.signup.mockRejectedValue({
      response: {
        status: 400,
        data: { errors: { email: 'Email is already used.' } },
      },
    })
    renderForm(<SignupForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText('Full name'), 'Riley Example')
    await user.type(screen.getByLabelText('Email'), 'riley@example.com')
    await user.type(screen.getByLabelText('Password'), 'secure123')
    await user.type(screen.getByLabelText('Confirm password'), 'secure123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Email is already used.')).toBeVisible()
  })
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.login.mockResolvedValue({})
    authMocks.loginWithGoogle.mockResolvedValue({})
  })

  it('shows validation errors and calls login with normalized arguments', async () => {
    const user = userEvent.setup()
    renderForm(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeVisible()

    await user.type(screen.getByLabelText('Email'), 'USER@example.com')
    await user.type(screen.getByLabelText('Password'), 'pass123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() =>
      expect(authMocks.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'pass123',
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Signed in successfully.',
    )
  })

  it('shows the generic invalid-credentials message', async () => {
    const user = userEvent.setup()
    authMocks.login.mockRejectedValue({ response: { status: 401 } })
    renderForm(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'incorrect')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
  })

  it('does not expose raw server error text', async () => {
    const user = userEvent.setup()
    authMocks.login.mockRejectedValue({
      response: { status: 500, data: { detail: 'secret database failure' } },
    })
    renderForm(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    )
    expect(
      screen.queryByText('secret database failure'),
    ).not.toBeInTheDocument()
  })
})
