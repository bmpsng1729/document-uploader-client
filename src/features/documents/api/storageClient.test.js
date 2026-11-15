import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { storageClient } from './storageClient.js'

describe('storageClient', () => {
  let originalAdapter

  beforeEach(() => {
    originalAdapter = storageClient.defaults.adapter
  })

  afterEach(() => {
    storageClient.defaults.adapter = originalAdapter
  })

  it('sends raw bytes without API credentials or cookies', async () => {
    const uploadUrl =
      'https://storage.example/upload?signature=presigned-value%2F'
    const file = new Blob(['original file bytes'], { type: 'image/jpeg' })
    const requiredHeaders = {
      'Content-Type': 'image/jpeg',
      'x-storage-checksum': 'test-checksum',
    }
    let request

    storageClient.defaults.adapter = async (config) => {
      request = config
      return {
        config,
        data: '',
        headers: {},
        status: 200,
        statusText: 'OK',
      }
    }

    await storageClient.put(uploadUrl, file, {
      headers: requiredHeaders,
      withCredentials: false,
    })

    expect(request.url).toBe(uploadUrl)
    expect(request.data).toBe(file)
    expect(request.headers.get('Content-Type')).toBe('image/jpeg')
    expect(request.headers.get('x-storage-checksum')).toBe('test-checksum')
    expect(request.headers.get('Authorization')).toBeUndefined()
    expect(request.headers.get('Cookie')).toBeUndefined()
    expect(request.withCredentials).toBe(false)
    expect(storageClient.interceptors.request.handlers).toEqual([])
    expect(storageClient.interceptors.response.handlers).toEqual([])
  })
})
