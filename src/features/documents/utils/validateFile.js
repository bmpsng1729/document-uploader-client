import { sniffFileType } from './sniffFileType.js'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
])

/**
 * @typedef {{ valid: true } | { valid: false, code: string }} FileValidation
 */

/**
 * Validates file metadata, duplicates, and the file's magic bytes.
 * @param {{ name: string, type: string, size: number, lastModified: number, slice: Function }} file
 * @param {Array<{ name: string, size: number, lastModified: number }>} [queuedFiles]
 * @returns {Promise<FileValidation>}
 */
export async function validateFile(file, queuedFiles = []) {
  if (!file || typeof file.name !== 'string' || !Number.isFinite(file.size)) {
    return { valid: false, code: 'file_required' }
  }
  if (file.size < 1) {
    return { valid: false, code: 'file_empty' }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, code: 'file_too_large' }
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, code: 'unsupported_type' }
  }
  if (
    queuedFiles.some(
      (queuedFile) =>
        queuedFile.name === file.name &&
        queuedFile.size === file.size &&
        queuedFile.lastModified === file.lastModified,
    )
  ) {
    return { valid: false, code: 'duplicate_file' }
  }

  const detectedType = await sniffFileType(file)
  if (!detectedType) {
    return { valid: false, code: 'invalid_file_signature' }
  }
  if (detectedType !== file.type) {
    return { valid: false, code: 'file_type_mismatch' }
  }
  return { valid: true }
}
