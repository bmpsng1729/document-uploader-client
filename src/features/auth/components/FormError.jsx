export function FormError({ children }) {
  if (!children) return null

  return (
    <div
      className="rounded-control border border-brand-dark bg-mint-100 px-4 py-3 text-sm text-brand-dark"
      role="alert"
    >
      {children}
    </div>
  )
}
