export function AuthCard({ title, description, children }) {
  return (
    <section className="w-full rounded-card border border-mint-300 bg-white p-6 shadow-card">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </header>
      {children}
    </section>
  )
}
