import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { UploadDropzone } from '../features/documents/components/UploadDropzone.jsx'
import { UploadItem } from '../features/documents/components/UploadItem.jsx'
import { useUploadedDocuments } from '../features/documents/context/UploadedDocumentsContext.js'
import { useDocumentUpload } from '../features/documents/useDocumentUpload.js'
import { useToast } from '../app/ToastContext.js'

export function UploadPage() {
  const { addDocument } = useUploadedDocuments()
  const { showSuccess } = useToast()
  const handleDocumentReady = useCallback(
    (document) => {
      addDocument(document)
      showSuccess(`${document.name} uploaded successfully.`)
    },
    [addDocument, showSuccess],
  )
  const upload = useDocumentUpload({ onDocumentReady: handleDocumentReady })

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-semibold text-brand-dark hover:bg-mint-100"
          to="/dashboard"
        >
          <span aria-hidden="true">←</span>
          Back to dashboard
        </Link>

        <section className="mt-4 rounded-card border border-mint-300 bg-white p-5 shadow-card sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-dark">
              Document Vault
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              Upload a document
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Upload one JPEG, PNG, or PDF document up to 10 MB. After it
              finishes, you can select another document.
            </p>
          </div>

          <div className="mt-7">
            <UploadDropzone
              disabled={upload.isBusy}
              onFilesSelected={upload.selectFiles}
              prompt={
                upload.item?.status === 'ready'
                  ? 'Select another document after this upload'
                  : 'Only one document can be selected at a time'
              }
            />
          </div>

          {upload.selectionError ? (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {upload.selectionError}
            </p>
          ) : null}

          {upload.item ? (
            <section aria-label="Selected document" className="mt-8">
              <UploadItem
                isBusy={upload.isBusy}
                item={upload.item}
                onCancel={upload.cancel}
                onRemove={upload.remove}
                onRetry={upload.retry}
                onTypeChange={upload.setDocumentType}
                onUpload={upload.upload}
              />
            </section>
          ) : (
            <p className="mt-6 text-center text-sm text-muted">
              Select one document to get started.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
