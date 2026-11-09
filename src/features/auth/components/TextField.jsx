export function TextField({
  id,
  label,
  type = 'text',
  autoComplete,
  error,
  registration,
}) {
  const errorId = `${id}-error`
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-normal text-muted"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        {...registration}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={`min-h-11 w-full rounded-control border-[1.5px] bg-mint-200 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/80 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark focus:ring-offset-2 focus:ring-offset-white ${
          error ? 'border-brand-dark' : 'border-brand'
        }`}
        id={id}
        type={type}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-brand-dark" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
