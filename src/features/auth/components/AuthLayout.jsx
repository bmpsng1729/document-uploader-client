import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../../../app/ThemeToggle.jsx'

function PageWave() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 w-full sm:h-52"
      preserveAspectRatio="none"
      viewBox="0 0 1440 220"
    >
      <path
        d="M0 92C245 24 424 184 720 112s461-106 720-38v146H0V92Z"
        fill="var(--color-mint-100)"
      />
    </svg>
  )
}

export function AuthLayout({ children }) {
  const { pathname } = useLocation()
  const isSignup = pathname === '/signup'
  const alternatePath = isSignup ? '/login' : '/signup'
  const alternateLabel = isSignup ? 'Log in' : 'Create account'

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-white">
      <PageWave />
      <header className="auth-header relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Document Vault home"
          className="flex min-h-11 items-center gap-3 text-ink"
          to="/"
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-control border border-brand-dark bg-brand text-sm font-semibold text-ink"
          >
            DV
          </span>
          <span className="hidden text-base font-semibold min-[375px]:inline">
            Document Vault
          </span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-brand-dark hover:bg-mint-100 sm:px-4"
            to={alternatePath}
          >
            {alternateLabel}
          </Link>
        </nav>
      </header>

      <main className="auth-main relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      <footer className="auth-footer relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-4 text-sm text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Document Vault
      </footer>
    </div>
  )
}
