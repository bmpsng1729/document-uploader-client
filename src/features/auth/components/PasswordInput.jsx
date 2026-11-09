import { useState } from 'react'

export function PasswordInput({
  id,
  label,
  autoComplete,
  error,
  registration,
}) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-normal text-muted"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...registration}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`min-h-11 w-full rounded-control border-[1.5px] bg-mint-200 px-3.5 py-2.5 pr-16 text-sm text-ink outline-none transition placeholder:text-ink/80 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark focus:ring-offset-2 focus:ring-offset-white ${
            error ? 'border-brand-dark' : 'border-brand'
          }`}
          id={id}
          type={visible ? 'text' : 'password'}
        />
        <button
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 min-w-11 rounded-r-control px-3 text-sm font-semibold text-ink hover:bg-mint-100"
          onClick={() => setVisible((previous) => !previous)}
          type="button"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-brand-dark" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
