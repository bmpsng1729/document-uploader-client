import { afterEach, describe, expect, it, vi } from 'vitest'
import { sleep } from './sleep.js'

describe('sleep', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the requested delay', async () => {
    vi.useFakeTimers()
    const wait = sleep(250)

    await vi.advanceTimersByTimeAsync(250)

    await expect(wait).resolves.toBeUndefined()
  })

  it('rejects immediately when its signal is aborted', async () => {
    const controller = new AbortController()
    const wait = sleep(10_000, controller.signal)
    controller.abort()

    await expect(wait).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects invalid delays', async () => {
    await expect(sleep(-1)).rejects.toThrow(RangeError)
  })
})
