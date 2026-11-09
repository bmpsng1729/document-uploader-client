export function AuthDivider() {
  return (
    <div aria-label="or" className="relative py-1" role="separator">
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-mint-300" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-sm font-normal text-muted">or</span>
      </div>
    </div>
  )
}
