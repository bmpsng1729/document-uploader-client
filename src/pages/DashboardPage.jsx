import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../app/ThemeToggle.jsx'
import { useAuth } from '../features/auth/context/useAuth.js'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-ink sm:px-6">
      <section className="mx-auto max-w-3xl rounded-card border border-mint-300 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              Document Vault
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">
              You’re signed in, {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="min-h-11 rounded-control border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-mint-100"
              onClick={handleLogout}
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
        <p className="mt-8 rounded-control bg-mint-100 px-4 py-3 text-sm text-ink">
          Your dashboard is ready. Document features will be available here
          later.
        </p>
      </section>
    </main>
  )
}
