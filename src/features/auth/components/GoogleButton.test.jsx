import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleButton } from './GoogleButton.jsx'

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onNonOAuthError }) => (
    <button
      onClick={() => onNonOAuthError({ type: 'popup_closed' })}
      type="button"
    >
      Start Google sign-in
    </button>
  ),
}))

describe('GoogleButton', () => {
  it('shows a clear message when the Google script fails to load', async () => {
    render(<GoogleButton onCredential={vi.fn()} />)

    await screen.findByRole('button', { name: 'Start Google sign-in' })
    window.dispatchEvent(new Event('auth:google-script-error'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google sign-in could not load. Check your connection and try again.',
    )
  })

  it('does not show an error when the user closes the Google prompt', async () => {
    const user = userEvent.setup()
    render(<GoogleButton onCredential={vi.fn()} />)

    await user.click(
      screen.getByRole('button', { name: 'Start Google sign-in' }),
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
