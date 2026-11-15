const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * Formats a non-negative byte count using binary units.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new RangeError('bytes must be a non-negative safe integer.')
  }
  if (bytes < 1024) return `${bytes} B`

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  )
  const value = Number((bytes / 1024 ** unitIndex).toFixed(1))
  return `${value} ${UNITS[unitIndex]}`
}
