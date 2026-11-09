import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export function LoadingScreen() {
  return (
    <main
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-white px-4 text-sm text-muted"
      role="status"
    >
      <span className="mr-3 size-5 animate-spin rounded-full border-2 border-mint-300 border-t-brand-dark" />
      Loading your account…
    </main>
  )
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
