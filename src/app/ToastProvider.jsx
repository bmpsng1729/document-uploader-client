import { useCallback, useEffect, useState } from 'react'
import { ToastContext } from './ToastContext.js'

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showSuccess = useCallback((message) => {
    setToast({ message })
  }, [])

  const dismiss = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(dismiss, 4000)
    return () => window.clearTimeout(timeoutId)
  }, [toast, dismiss])

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      {toast ? (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="fixed inset-x-4 top-4 z-50 flex items-center gap-3 rounded-control border border-brand-dark bg-mint-100 px-4 py-3 text-sm text-brand-dark shadow-card sm:left-auto sm:right-6 sm:w-[min(24rem,calc(100vw-3rem))]"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="size-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m5 12 4 4L19 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span className="flex-1">{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            className="flex size-11 shrink-0 items-center justify-center rounded-control text-brand-dark hover:bg-mint-200"
            onClick={dismiss}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
