import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../app/ThemeProvider.jsx'
import { ToastProvider } from '../app/ToastProvider.jsx'
import { DashboardPage } from './DashboardPage.jsx'

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  user: { name: 'Riley Example', email: 'riley@example.com' },
}))

vi.mock('../features/auth/context/useAuth.js', () => ({
  useAuth: () => authMocks,
}))

function renderDashboard() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<DashboardPage />} path="/dashboard" />
            <Route element={<p>Upload page</p>} path="/documents/upload" />
            <Route element={<p>Login page</p>} path="/login" />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('DashboardPage logout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('shows sample documents with action buttons and download all', () => {
    renderDashboard()

    const documentList = screen.getByRole('list', {
      name: 'Sample documents',
    })
    expect(
      screen.getByRole('heading', { name: 'Your documents' }),
    ).toBeVisible()
    expect(within(documentList).getAllByRole('listitem')).toHaveLength(5)
    expect(within(documentList).getByText('Passport Photo.jpg')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Download all documents' }),
    ).toBeEnabled()
    expect(
      within(documentList).getByRole('button', {
        name: 'View Passport Photo.jpg (coming soon)',
      }),
    ).toBeDisabled()
    expect(
      within(documentList).getByRole('button', {
        name: 'Download Passport Photo.jpg',
      }),
    ).toBeEnabled()
    expect(
      within(documentList).getByRole('button', {
        name: 'Delete Passport Photo.jpg (coming soon)',
      }),
    ).toBeDisabled()
  })

  it('opens the upload page from the dashboard call to action', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByRole('link', { name: 'Upload document' }))

    expect(await screen.findByText('Upload page')).toBeVisible()
  })

  it('opens a custom confirmation and stays signed in when cancelled', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent(
      'Are you sure you want to log out of Document Vault?',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(authMocks.logout).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: 'Welcome back, Riley Example' }),
    ).toBeVisible()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('logs out and navigates to login when confirmed', async () => {
    const user = userEvent.setup()
    authMocks.logout.mockResolvedValue(undefined)
    renderDashboard()

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Log out' }))

    expect(await screen.findByText('Login page')).toBeVisible()
    expect(authMocks.logout).toHaveBeenCalledOnce()
  })
})
