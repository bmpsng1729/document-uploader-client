import { apiClient } from '../../../lib/apiClient.js'

const DOCUMENTS_ENDPOINT = '/api/v1/documents'

/**
 * @typedef {'PENDING'|'PROCESSING'|'READY'|'REJECTED'|'DELETING'} DocumentStatus
 * @typedef {{
 *   originalName: string,
 *   mimeType: string,
 *   sizeBytes: number,
 *   sha256: string,
 *   type: string
 * }} InitiateDocumentRequest
 * @typedef {{
 *   documentId: string,
 *   uploadUrl: string,
 *   expiresAt: string,
 *   requiredHeaders: Record<string, string>
 * }} InitiateDocumentResponse
 * @typedef {{
 *   id: string,
 *   status: DocumentStatus,
 *   rejectReason: string|null,
 *   originalName: string,
 *   sizeBytes: number,
 *   type: string
 * }} DocumentStatusResponse
 */

/**
 * Reserves a document and returns its temporary storage upload instructions.
 * @param {InitiateDocumentRequest} request
 * @returns {Promise<InitiateDocumentResponse>}
 */
export async function initiate(request, { signal } = {}) {
  const { data } = await apiClient.post(`${DOCUMENTS_ENDPOINT}/init`, request, {
    signal,
  })
  return data
}

/**
 * Notifies the API that direct-to-storage upload has finished.
 * @param {string} documentId
 * @returns {Promise<unknown>}
 */
export async function complete(documentId, { signal } = {}) {
  const { data } = await apiClient.post(
    `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/complete`,
    undefined,
    { signal },
  )
  return data
}

/**
 * Retrieves processing status for an initiated document.
 * @param {string} documentId
 * @returns {Promise<DocumentStatusResponse>}
 */
export async function getStatus(documentId, { signal } = {}) {
  const { data } = await apiClient.get(
    `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}`,
    { signal },
  )
  return data
}
