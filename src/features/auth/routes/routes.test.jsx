import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute.jsx'
import { PublicOnlyRoute } from './PublicOnlyRoute.jsx'

const authMocks = vi.hoisted(() => ({ value: {} }))

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => authMocks.value,
}))

function LocationDisplay() {
  const location = useLocation()
  return <p>Current route: {location.pathname}</p>
}

function renderRoutes(initialPath, auth, element) {
  authMocks.value = auth
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route path="/dashboard" element={element} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('route guards', () => {
  it('redirects signed-out dashboard visitors to login', async () => {
    renderRoutes(
      '/dashboard',
      { user: null, loading: false },
      <ProtectedRoute>
        <p>Private dashboard</p>
      </ProtectedRoute>,
    )

    expect(await screen.findByText('Login page')).toBeVisible()
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument()
  })

  it('redirects signed-in users away from login', async () => {
    authMocks.value = { user: { name: 'Riley' }, loading: false }
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <p>Login page</p>
              </PublicOnlyRoute>
            }
          />
          <Route path="/dashboard" element={<p>Private dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Private dashboard')).toBeVisible()
  })

  it('shows a neutral loading screen while auth is being restored', () => {
    renderRoutes(
      '/dashboard',
      { user: null, loading: true },
      <ProtectedRoute>
        <p>Private dashboard</p>
      </ProtectedRoute>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading your account…',
    )
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
