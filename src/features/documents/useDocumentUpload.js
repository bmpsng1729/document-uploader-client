import { useCallback, useEffect, useRef, useState } from 'react'
import { mapUploadError } from './utils/mapUploadError.js'
import { validateFile } from './utils/validateFile.js'
import { uploadDocument } from './uploadDocument.js'

const BUSY_STATUSES = new Set([
  'checking',
  'validating',
  'hashing',
  'initiating',
  'uploading',
  'completing',
  'processing',
])

function isBusy(item) {
  return Boolean(
    item &&
    BUSY_STATUSES.has(item.status) &&
    !(item.status === 'processing' && item.trackingComplete),
  )
}

function createItemId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

function createPreviewUrl(file) {
  if (
    !file.type.startsWith('image/') ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return null
  }
  return URL.createObjectURL(file)
}

function revokePreviewUrl(previewUrl) {
  if (previewUrl && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(previewUrl)
  }
}

function createItem(file, status = 'queued') {
  return {
    id: createItemId(),
    file,
    previewUrl: createPreviewUrl(file),
    type: '',
    status,
    step: status,
    progress: 0,
    error: '',
    message: '',
    retryable: false,
  }
}

/**
 * Manages one selected document and its upload lifecycle.
 * File data remains in this component tree only.
 * @param {{ onDocumentReady?: (document: object) => void }} [options]
 */
export function useDocumentUpload({ onDocumentReady } = {}) {
  const [item, setItem] = useState(null)
  const [selectionError, setSelectionError] = useState('')
  const [uploading, setUploading] = useState(false)
  const itemRef = useRef(item)
  const controllerRef = useRef(null)
  const mountedRef = useRef(true)

  const updateItem = useCallback((id, changes) => {
    if (!mountedRef.current || itemRef.current?.id !== id) return
    const updatedItem = { ...itemRef.current, ...changes }
    itemRef.current = updatedItem
    setItem(updatedItem)
  }, [])

  const selectFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? [])
      if (files.length === 0) return

      setSelectionError('')
      if (files.length > 1) {
        setSelectionError('Choose one document at a time.')
        return
      }
      if (controllerRef.current || isBusy(itemRef.current)) {
        setSelectionError('Wait for the current upload to finish first.')
        return
      }

      const file = files[0]
      revokePreviewUrl(itemRef.current?.previewUrl)
      const nextItem = createItem(file, 'checking')
      itemRef.current = nextItem
      setItem(nextItem)

      try {
        const validation = await validateFile(file)
        if (!mountedRef.current || itemRef.current?.id !== nextItem.id) return

        updateItem(
          nextItem.id,
          validation.valid
            ? { status: 'queued', step: 'queued' }
            : {
                status: 'failed',
                step: 'failed',
                error: mapUploadError({ code: validation.code }, 'validate'),
              },
        )
      } catch (error) {
        updateItem(nextItem.id, {
          status: 'failed',
          step: 'failed',
          error: mapUploadError(error, 'validate'),
        })
      }
    },
    [updateItem],
  )

  const startUpload = useCallback(
    (selectedItem) => {
      if (!selectedItem || controllerRef.current || isBusy(itemRef.current)) {
        return
      }

      const controller = new AbortController()
      controllerRef.current = controller
      setUploading(true)
      updateItem(selectedItem.id, {
        status: 'validating',
        step: 'validating',
        progress: 0,
        error: '',
        message: '',
        retryable: false,
      })

      uploadDocument(selectedItem.file, selectedItem.type, {
        signal: controller.signal,
        onProgress: (progress) => updateItem(selectedItem.id, { progress }),
        onStep: (step) => updateItem(selectedItem.id, { step, status: step }),
      })
        .then((result) => {
          if (result.status === 'READY') {
            updateItem(selectedItem.id, {
              documentId: result.documentId,
              status: 'ready',
              step: 'ready',
              progress: 100,
              retryable: false,
            })
            onDocumentReady?.({
              id: result.documentId,
              name: selectedItem.file.name,
              type: selectedItem.type,
              mimeType: selectedItem.file.type,
              sizeBytes: selectedItem.file.size,
              updatedAt: new Date().toISOString(),
            })
            return
          }

          if (result.status === 'REJECTED') {
            updateItem(selectedItem.id, {
              documentId: result.documentId,
              status: 'rejected',
              step: 'rejected',
              error: mapUploadError(
                {
                  status: 'REJECTED',
                  rejectReason: result.rejectReason,
                },
                'status',
              ),
              retryable: false,
            })
            return
          }

          if (result.status === 'DELETING') {
            updateItem(selectedItem.id, {
              documentId: result.documentId,
              status: 'failed',
              step: 'failed',
              error: mapUploadError({ code: 'document_deleting' }, 'status'),
              retryable: false,
            })
            return
          }

          updateItem(selectedItem.id, {
            documentId: result.documentId,
            status: 'processing',
            step: 'processing',
            progress: 100,
            message: result.message,
            trackingComplete: Boolean(result.timedOut),
            retryable: false,
          })
        })
        .catch((error) => {
          if (
            controller.signal.aborted ||
            error?.name === 'AbortError' ||
            error?.code === 'ERR_CANCELED'
          ) {
            updateItem(selectedItem.id, {
              status: 'cancelled',
              step: 'cancelled',
              error: '',
              retryable: true,
            })
            return
          }

          if (error?.response?.status === 422) {
            updateItem(selectedItem.id, {
              status: 'rejected',
              step: 'rejected',
              error: mapUploadError(error, error.uploadOperation ?? 'upload'),
              retryable: false,
            })
            return
          }

          const quotaExceeded =
            error?.uploadOperation === 'initiate' &&
            error?.response?.status === 403
          updateItem(selectedItem.id, {
            status: 'failed',
            step: 'failed',
            error: mapUploadError(error, error.uploadOperation ?? 'upload'),
            retryable: !quotaExceeded && error?.uploadOperation !== 'validate',
          })
        })
        .finally(() => {
          if (controllerRef.current === controller) {
            controllerRef.current = null
            if (mountedRef.current) setUploading(false)
          }
        })
    },
    [onDocumentReady, updateItem],
  )

  const setDocumentType = useCallback(
    (type) => {
      const currentItem = itemRef.current
      if (
        !currentItem ||
        controllerRef.current ||
        isBusy(currentItem) ||
        ['ready', 'rejected'].includes(currentItem.status)
      ) {
        return
      }
      updateItem(currentItem.id, { type })
    },
    [updateItem],
  )

  const upload = useCallback(() => {
    const currentItem = itemRef.current
    if (!currentItem?.type || currentItem.status !== 'queued') return
    startUpload(currentItem)
  }, [startUpload])

  const retry = useCallback(() => {
    const currentItem = itemRef.current
    if (
      !currentItem?.retryable ||
      !['failed', 'cancelled'].includes(currentItem.status)
    ) {
      return
    }
    startUpload(currentItem)
  }, [startUpload])

  const cancel = useCallback(() => {
    if (!controllerRef.current) return
    controllerRef.current.abort()
    updateItem(itemRef.current.id, {
      status: 'cancelled',
      step: 'cancelled',
      progress: 0,
      error: '',
      retryable: true,
    })
  }, [updateItem])

  const remove = useCallback(() => {
    if (controllerRef.current || isBusy(itemRef.current)) return
    revokePreviewUrl(itemRef.current?.previewUrl)
    itemRef.current = null
    setItem(null)
    setSelectionError('')
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      revokePreviewUrl(itemRef.current?.previewUrl)
    }
  }, [])

  return {
    item,
    isBusy: uploading || isBusy(item),
    selectionError,
    selectFiles,
    setDocumentType,
    upload,
    cancel,
    retry,
    remove,
  }
}
