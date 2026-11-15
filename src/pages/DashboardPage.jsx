import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../app/ThemeToggle.jsx'
import { ToastContext } from '../app/ToastContext.js'
import { useAuth } from '../features/auth/context/useAuth.js'
import { useUploadedDocuments } from '../features/documents/context/UploadedDocumentsContext.js'
import { formatBytes } from '../features/documents/utils/formatBytes.js'
import { sampleDocuments } from '../features/documents/data/sampleDocuments.js'

function triggerFileDownload(document) {
  const sampleContent = `Document: ${document.name}\nType: ${document.type}\nSize: ${formatBytes(document.sizeBytes)}\nUpdated: ${document.updatedAt || 'N/A'}`
  const blob = new Blob([sampleContent], {
    type: document.mimeType || 'text/plain',
  })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = document.name
  window.document.body.appendChild(anchor)
  anchor.click()
  window.document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { documents: uploadedDocuments } = useUploadedDocuments()
  const toast = useContext(ToastContext)
  const navigate = useNavigate()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const logoutButtonRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const dialogWasOpen = useRef(false)

  const displayedDocuments =
    uploadedDocuments.length > 0 ? uploadedDocuments : sampleDocuments

  const handleDownload = useCallback((document) => {
    triggerFileDownload(document)
  }, [])

  const handleDownloadAll = useCallback(() => {
    if (displayedDocuments.length === 0) return
    toast?.showSuccess?.(`Downloading ${displayedDocuments.length} documents…`)
    displayedDocuments.forEach((doc, index) => {
      setTimeout(() => {
        triggerFileDownload(doc)
      }, index * 200)
    })
  }, [displayedDocuments, toast])

  useEffect(() => {
    if (logoutDialogOpen) {
      dialogWasOpen.current = true
      cancelButtonRef.current?.focus()

      function handleDialogKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setLogoutDialogOpen(false)
        } else if (event.key === 'Tab') {
          const firstButton = cancelButtonRef.current
          const lastButton = confirmButtonRef.current

          if (event.shiftKey && document.activeElement === firstButton) {
            event.preventDefault()
            lastButton?.focus()
          } else if (!event.shiftKey && document.activeElement === lastButton) {
            event.preventDefault()
            firstButton?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleDialogKeyDown)
      return () => document.removeEventListener('keydown', handleDialogKeyDown)
    }

    if (dialogWasOpen.current) {
      dialogWasOpen.current = false
      logoutButtonRef.current?.focus()
    }
    return undefined
  }, [logoutDialogOpen])

  async function confirmLogout() {
    setLogoutDialogOpen(false)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-ink sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-card border border-mint-300 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-brand-dark">
                Document Vault
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">
                Welcome back, {user.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="min-h-11 rounded-control border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-mint-100"
                onClick={() => setLogoutDialogOpen(true)}
                ref={logoutButtonRef}
                type="button"
              >
                Log out
              </button>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="documents-heading"
          className="mt-8 rounded-card border border-mint-300 bg-white p-5 shadow-card sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-ink"
                id="documents-heading"
              >
                Your documents
              </h2>
              <p className="mt-1 text-sm text-muted">
                {uploadedDocuments.length > 0
                  ? 'Documents uploaded during this session.'
                  : 'View the files in your document vault.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex w-fit items-center rounded-full border border-brand-dark/20 bg-mint-100 px-3 py-1 text-xs font-semibold text-brand-dark">
                {uploadedDocuments.length > 0
                  ? 'Uploaded this session'
                  : 'Sample data'}
              </span>
              <button
                aria-label="Download all documents"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-mint-300 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-mint-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={displayedDocuments.length === 0}
                onClick={handleDownloadAll}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                Download all
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-mint-300"
                to="/documents/upload"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 16V4m0 0L7 9m5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                Upload document
              </Link>
            </div>
          </div>

          {uploadedDocuments.length > 0 ? (
            <p className="mt-5 rounded-control bg-mint-100 px-4 py-3 text-sm leading-6 text-ink">
              This list contains completed uploads from your current session.
              Connect a document-list API to load your documents after signing
              in again.
            </p>
          ) : (
            <p className="mt-5 rounded-control bg-mint-100 px-4 py-3 text-sm leading-6 text-ink">
              These example documents are for preview only. Upload a document to
              see it listed here.
            </p>
          )}

          <div
            aria-label={
              uploadedDocuments.length > 0
                ? 'Uploaded documents'
                : 'Sample documents'
            }
            className="mt-5 space-y-3"
            role="list"
          >
            {(uploadedDocuments.length > 0
              ? uploadedDocuments
              : sampleDocuments
            ).map((document) => {
              const fileKind =
                document.mimeType === 'application/pdf' ? 'PDF' : 'IMAGE'

              return (
                <article
                  className="rounded-control border border-mint-300 bg-white p-4 sm:p-5"
                  key={document.id}
                  role="listitem"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div
                        aria-hidden="true"
                        className="flex size-12 shrink-0 items-center justify-center rounded-control bg-mint-100 text-xs font-bold tracking-wide text-brand-dark"
                      >
                        {fileKind}
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="truncate font-semibold text-ink"
                          title={document.name}
                        >
                          {document.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {document.type.replaceAll('_', ' ')} ·{' '}
                          {formatBytes(document.sizeBytes)}
                          {document.updatedAt
                            ? ` · Updated ${new Date(document.updatedAt).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex">
                      {['View', 'Download', 'Delete'].map((action) => {
                        const isDownload = action === 'Download'
                        return (
                          <button
                            aria-label={
                              isDownload
                                ? `Download ${document.name}`
                                : `${action} ${document.name} (coming soon)`
                            }
                            className={
                              isDownload
                                ? 'min-h-10 rounded-control border border-mint-300 px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-mint-100 sm:px-4 sm:text-sm'
                                : 'min-h-10 rounded-control border border-mint-300 px-3 text-xs font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-sm'
                            }
                            disabled={!isDownload}
                            key={action}
                            onClick={
                              isDownload
                                ? () => handleDownload(document)
                                : undefined
                            }
                            title={
                              isDownload
                                ? `Download ${document.name}`
                                : 'Available when document actions are connected'
                            }
                            type="button"
                          >
                            {action}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
      {logoutDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLogoutDialogOpen(false)
            }
          }}
        >
          <section
            aria-describedby="logout-dialog-description"
            aria-labelledby="logout-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-card border border-mint-300 bg-white p-6 text-ink shadow-card sm:p-8"
            role="alertdialog"
          >
            <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-mint-100 text-brand-dark">
              <svg
                aria-hidden="true"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M10 17l5-5-5-5m5 5H3m9-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold text-ink"
              id="logout-dialog-title"
            >
              Log out?
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-muted"
              id="logout-dialog-description"
            >
              Are you sure you want to log out of Document Vault? You’ll need to
              sign in again to access your account.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-control border border-mint-300 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-mint-100"
                onClick={() => setLogoutDialogOpen(false)}
                ref={cancelButtonRef}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-11 rounded-control border border-brand-dark bg-brand px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-mint-300 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={confirmLogout}
                ref={confirmButtonRef}
                type="button"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
