import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../app/ThemeProvider.jsx'
import { HomePage } from './HomePage.jsx'

describe('HomePage', () => {
  it('welcomes visitors and links to account creation and login', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'A fresh start for your document workflow.',
      }),
    ).toBeVisible()
    expect(
      within(screen.getByRole('navigation', { name: 'Account' })).getByRole(
        'link',
        { name: 'Create account' },
      ),
    ).toHaveAttribute('href', '/signup')
    expect(
      within(screen.getByRole('navigation', { name: 'Account' })).getByRole(
        'link',
        { name: 'Log in' },
      ),
    ).toHaveAttribute('href', '/login')
  })
})
