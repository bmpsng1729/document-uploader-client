/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   mimeType: string,
 *   sizeBytes: number,
 *   updatedAt: string
 * }} SampleDocument
 */

/** @type {SampleDocument[]} */
export const sampleDocuments = [
  {
    id: 'sample-photo',
    name: 'Passport Photo.jpg',
    type: 'PHOTO',
    mimeType: 'image/jpeg',
    sizeBytes: 1_842_176,
    updatedAt: 'Nov 14, 2026',
  },
  {
    id: 'sample-signature',
    name: 'Signature.png',
    type: 'SIGNATURE',
    mimeType: 'image/png',
    sizeBytes: 148_992,
    updatedAt: 'Nov 14, 2026',
  },
  {
    id: 'sample-id-proof',
    name: 'ID Proof - Passport.pdf',
    type: 'ID_PROOF',
    mimeType: 'application/pdf',
    sizeBytes: 2_516_582,
    updatedAt: 'Nov 13, 2026',
  },
  {
    id: 'sample-marksheet',
    name: 'Degree Marksheet.pdf',
    type: 'MARKSHEET',
    mimeType: 'application/pdf',
    sizeBytes: 974_848,
    updatedAt: 'Nov 12, 2026',
  },
  {
    id: 'sample-certificate',
    name: 'Graduation Certificate.pdf',
    type: 'CERTIFICATE',
    mimeType: 'application/pdf',
    sizeBytes: 1_261_568,
    updatedAt: 'Nov 11, 2026',
  },
]
