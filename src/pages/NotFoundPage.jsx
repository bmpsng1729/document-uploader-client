import { Link } from 'react-router-dom'
import { ThemeToggle } from '../app/ThemeToggle.jsx'

export function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-4 text-ink">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="max-w-sm text-center">
        <p className="text-sm font-semibold text-brand-dark">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The page you’re looking for doesn’t exist.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-control border-[1.5px] border-brand-dark bg-brand px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mint-300"
          to="/"
        >
          Go to home
        </Link>
      </section>
    </main>
  )
}
