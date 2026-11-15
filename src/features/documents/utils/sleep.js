function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

/**
 * Waits for the requested duration and rejects promptly when aborted.
 * @param {number} delayMs
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export function sleep(delayMs, signal) {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return Promise.reject(new RangeError('delayMs must be non-negative.'))
  }
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? createAbortError())
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, delayMs)

    function abort() {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', abort)
      reject(signal?.reason ?? createAbortError())
    }

    signal?.addEventListener('abort', abort, { once: true })
  })
}
