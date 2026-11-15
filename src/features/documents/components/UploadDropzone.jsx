const ACCEPTED_FILES = '.jpg,.jpeg,.png,.pdf'

export function UploadDropzone({
  disabled = false,
  onFilesSelected,
  prompt = 'Choose one document to begin',
}) {
  function handleDrop(event) {
    event.preventDefault()
    if (disabled) return
    onFilesSelected(event.dataTransfer.files)
  }

  return (
    <label
      aria-disabled={disabled}
      className={`relative block rounded-card border-2 border-dashed border-mint-400 bg-mint-100/60 p-7 text-center transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-dark focus-within:ring-offset-2 sm:p-10 ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-brand-dark hover:bg-mint-100'
      }`}
      onDragOver={(event) => {
        if (disabled) return
        event.preventDefault()
      }}
      onDrop={handleDrop}
    >
      <input
        accept={ACCEPTED_FILES}
        aria-label="Choose one document to upload"
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        disabled={disabled}
        onChange={(event) => {
          onFilesSelected(event.target.files)
          event.target.value = ''
        }}
        type="file"
      />
      <span className="pointer-events-none mx-auto flex size-12 items-center justify-center rounded-full bg-white text-brand-dark shadow-sm">
        <svg
          aria-hidden="true"
          className="size-6"
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
      </span>
      <span className="pointer-events-none mt-4 block font-semibold text-ink">
        Drop one document here or{' '}
        <span className="text-brand-dark underline underline-offset-2">
          browse files
        </span>
      </span>
      <span className="pointer-events-none mt-2 block text-sm text-muted">
        {prompt} · JPEG, PNG, or PDF · Up to 10 MB
      </span>
    </label>
  )
}
