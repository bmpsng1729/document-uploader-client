import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')

afterEach(cleanup)
