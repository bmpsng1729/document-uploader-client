/**
 * Computes a lowercase SHA-256 hex digest for the exact file bytes.
 * @param {{ arrayBuffer: () => Promise<ArrayBuffer> }} file
 * @returns {Promise<string>}
 */
export async function hashFile(file) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle?.digest) {
    throw new Error('Secure SHA-256 hashing is unavailable in this browser.')
  }

  const digest = await subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
