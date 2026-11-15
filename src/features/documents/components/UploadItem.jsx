import { formatBytes } from '../utils/formatBytes.js'

const DOCUMENT_TYPES = [
  ['PHOTO', 'Photo'],
  ['SIGNATURE', 'Signature'],
  ['ID_PROOF', 'ID proof'],
  ['MARKSHEET', 'Marksheet'],
  ['CERTIFICATE', 'Certificate'],
  ['OTHER', 'Other'],
]

const STATUS_LABELS = {
  checking: 'Checking file',
  queued: 'Ready to upload',
  validating: 'Checking file',
  hashing: 'Preparing file',
  initiating: 'Starting secure upload',
  uploading: 'Uploading',
  completing: 'Finishing upload',
  processing: 'Processing',
  ready: 'Uploaded',
  rejected: 'Needs attention',
  failed: 'Upload failed',
  cancelled: 'Cancelled',
}

const ACTIVE_STATUSES = new Set([
  'checking',
  'validating',
  'hashing',
  'initiating',
  'uploading',
  'completing',
  'processing',
])

function FilePreview({ item }) {
  if (item.previewUrl) {
    return (
      <img
        alt=""
        className="size-12 shrink-0 rounded-control border border-mint-300 object-cover"
        src={item.previewUrl}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-control bg-mint-100 text-xs font-bold tracking-wide text-brand-dark"
    >
      PDF
    </span>
  )
}

export function UploadItem({
  item,
  isBusy,
  onCancel,
  onRemove,
  onRetry,
  onTypeChange,
  onUpload,
}) {
  const isActive = ACTIVE_STATUSES.has(item.status) && isBusy
  const canRetry =
    !isBusy && item.retryable && ['failed', 'cancelled'].includes(item.status)
  const canUpload = item.status === 'queued' && Boolean(item.type)
  const label = STATUS_LABELS[item.status] ?? item.status

  return (
    <article
      aria-label={`Selected document: ${item.file.name} (${label})`}
      className="rounded-control border border-mint-300 bg-white p-4 sm:p-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <FilePreview item={item} />
        <div className="min-w-0 flex-1">
          <h2
            className="truncate font-semibold text-ink"
            title={item.file.name}
          >
            {item.file.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {formatBytes(item.file.size)} · {item.file.type}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-brand-dark">
          {label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block text-sm font-medium text-ink">
          Document type
          <select
            className="mt-1 min-h-11 w-full rounded-control border border-mint-400 bg-white px-3 text-sm text-ink focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20 disabled:bg-mint-100"
            disabled={
              isBusy ||
              ['ready', 'processing', 'rejected'].includes(item.status)
            }
            onChange={(event) => onTypeChange(event.target.value)}
            value={item.type}
          >
            <option value="">Choose a type</option>
            {DOCUMENT_TYPES.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          {canUpload ? (
            <button
              className="min-h-11 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-mint-300"
              onClick={onUpload}
              type="button"
            >
              Upload document
            </button>
          ) : null}
          {isActive && item.status !== 'checking' && !item.trackingComplete ? (
            <button
              className="min-h-11 rounded-control border border-mint-400 px-4 py-2 text-sm font-semibold text-ink hover:bg-mint-100"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          {canRetry ? (
            <button
              className="min-h-11 rounded-control border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-mint-100"
              onClick={onRetry}
              type="button"
            >
              Retry
            </button>
          ) : null}
          {!isBusy && item.status !== 'ready' ? (
            <button
              aria-label={`Remove ${item.file.name}`}
              className="min-h-11 rounded-control border border-mint-400 px-4 py-2 text-sm font-semibold text-muted hover:bg-mint-100"
              onClick={onRemove}
              type="button"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {isActive && item.status !== 'processing' ? (
        <div
          aria-label={`Upload progress for ${item.file.name}`}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={item.progress}
          className="mt-4 h-2 overflow-hidden rounded-full bg-mint-100"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-brand-dark transition-[width]"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      ) : null}

      {item.message ? (
        <p className="mt-3 text-sm text-muted">{item.message}</p>
      ) : null}
      {item.error ? (
        <p className="mt-3 rounded-control bg-red-50 px-3 py-2 text-sm text-red-800">
          {item.error}
        </p>
      ) : null}
    </article>
  )
}
