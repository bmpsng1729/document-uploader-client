import { Link } from 'react-router-dom'
import { ThemeToggle } from '../app/ThemeToggle.jsx'

function DocumentIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center"
    >
      <div className="absolute inset-4 rounded-full border border-mint-300 bg-mint-100 sm:inset-8" />
      <div className="absolute inset-12 rounded-full border border-brand/40 sm:inset-16" />
      <div className="relative w-64 rounded-card border border-mint-300 bg-white p-5 shadow-card sm:w-72 sm:p-6">
        <div className="flex items-center gap-3 border-b border-mint-300 pb-4">
          <span className="flex size-11 items-center justify-center rounded-control border border-brand-dark bg-brand text-sm font-semibold text-ink">
            DV
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Document Vault</p>
            <p className="mt-0.5 text-sm text-muted">Your workspace</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-control bg-mint-100 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-mint-300 bg-white text-brand-dark">
              <svg fill="none" viewBox="0 0 24 24" className="size-5">
                <path
                  d="M7 3.75h6l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
                <path
                  d="M13 4v4h4M8.5 12h5M8.5 15.5h7"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Get started</p>
              <p className="mt-0.5 text-sm text-muted">
                Create an account to continue
              </p>
            </div>
          </div>
          <div className="h-3 w-4/5 rounded-full bg-mint-200" />
          <div className="h-3 w-3/5 rounded-full bg-mint-200" />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-white text-ink">
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

      <header className="relative z-10 mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Document Vault home"
          className="flex min-h-11 items-center gap-3"
          to="/"
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-control border border-brand-dark bg-brand text-sm font-semibold"
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
            to="/login"
          >
            Log in
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-control border-[1.5px] border-brand-dark bg-brand px-3 text-sm font-semibold text-ink hover:bg-mint-300 sm:px-4"
            to="/signup"
          >
            Create account
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <section className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
          <p className="inline-flex min-h-9 items-center rounded-full border border-mint-300 bg-mint-100 px-4 text-sm font-semibold text-brand-dark">
            Welcome to Document Vault
          </p>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            A fresh start for your document workflow.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted lg:mx-0">
            Create an account to get started, or log in to continue to your
            dashboard.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-control border-[1.5px] border-brand-dark bg-brand px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mint-300"
              to="/signup"
            >
              Create your account
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-mint-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-mint-100"
              to="/login"
            >
              Log in
            </Link>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          <DocumentIllustration />
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex min-h-12 w-full max-w-7xl items-center justify-center px-4 text-sm text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Document Vault
      </footer>
    </div>
  )
}
