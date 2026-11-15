const SIGNATURES = [
  {
    mimeType: 'image/jpeg',
    matches: (bytes) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mimeType: 'image/png',
    matches: (bytes) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47,
  },
  {
    mimeType: 'application/pdf',
    matches: (bytes) =>
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46,
  },
]

/**
 * Detects a supported file type from its leading signature bytes.
 * @param {{ slice: (start: number, end: number) => { arrayBuffer: () => Promise<ArrayBuffer> } }} file
 * @returns {Promise<string|null>}
 */
export async function sniffFileType(file) {
  if (!file || typeof file.slice !== 'function') return null

  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  return (
    SIGNATURES.find((signature) => signature.matches(bytes))?.mimeType ?? null
  )
}
