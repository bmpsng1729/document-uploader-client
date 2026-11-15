import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '../../../lib/apiClient.js'
import { clearAccessToken, setAccessToken } from '../../../lib/tokenStore.js'
import { complete, getStatus, initiate } from './documentsApi.js'

describe('documentsApi', () => {
  let originalAdapter

  beforeEach(() => {
    originalAdapter = apiClient.defaults.adapter
    clearAccessToken()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    clearAccessToken()
  })

  it('uses the authenticated API client and document endpoint contract', async () => {
    const calls = []
    const documentId = 'document-123'
    const initiateRequest = {
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      sha256: 'a'.repeat(64),
      type: 'PHOTO',
    }
    const uploadInstructions = {
      documentId,
      uploadUrl: 'https://storage.example/upload?signature=temporary',
      expiresAt: '2026-11-14T13:05:00Z',
      requiredHeaders: { 'Content-Type': 'image/jpeg' },
    }
    const statusResponse = {
      id: documentId,
      status: 'PROCESSING',
      rejectReason: null,
      originalName: 'photo.jpg',
      sizeBytes: 1024,
      type: 'PHOTO',
    }

    setAccessToken('test-access-token')
    apiClient.defaults.adapter = async (config) => {
      calls.push({
        method: config.method,
        url: config.url,
        data: config.data ? JSON.parse(config.data) : undefined,
        authorization: config.headers.get('Authorization'),
      })

      if (config.url.endsWith('/init')) {
        return {
          config,
          data: uploadInstructions,
          headers: {},
          status: 201,
          statusText: 'Created',
        }
      }
      if (config.url.endsWith('/complete')) {
        return {
          config,
          data: '',
          headers: {},
          status: 202,
          statusText: 'Accepted',
        }
      }
      return {
        config,
        data: statusResponse,
        headers: {},
        status: 200,
        statusText: 'OK',
      }
    }

    await expect(initiate(initiateRequest)).resolves.toEqual(uploadInstructions)
    await expect(complete(documentId)).resolves.toBe('')
    await expect(getStatus(documentId)).resolves.toEqual(statusResponse)

    expect(calls).toEqual([
      {
        method: 'post',
        url: '/api/v1/documents/init',
        data: initiateRequest,
        authorization: 'Bearer test-access-token',
      },
      {
        method: 'post',
        url: '/api/v1/documents/document-123/complete',
        data: undefined,
        authorization: 'Bearer test-access-token',
      },
      {
        method: 'get',
        url: '/api/v1/documents/document-123',
        data: undefined,
        authorization: 'Bearer test-access-token',
      },
    ])
  })
})
