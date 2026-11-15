import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../app/ToastProvider.jsx'
import { AuthContext } from '../features/auth/context/AuthContext.js'
import { useUploadedDocuments } from '../features/documents/context/UploadedDocumentsContext.js'
import { UploadedDocumentsProvider } from '../features/documents/context/UploadedDocumentsProvider.jsx'
import { UploadPage } from './UploadPage.jsx'

const mocks = vi.hoisted(() => ({
  uploadDocument: vi.fn(),
  validateFile: vi.fn(),
}))

vi.mock('../features/documents/uploadDocument.js', () => ({
  uploadDocument: mocks.uploadDocument,
}))

vi.mock('../features/documents/utils/validateFile.js', () => ({
  validateFile: mocks.validateFile,
}))

function UploadedDocumentList() {
  const { documents } = useUploadedDocuments()
  return (
    <ul aria-label="Uploaded documents">
      {documents.map((document) => (
        <li key={document.id}>{document.name}</li>
      ))}
    </ul>
  )
}

function renderUploadPage() {
  return render(
    <AuthContext.Provider value={{ user: { id: 'test-user' } }}>
      <UploadedDocumentsProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/documents/upload']}>
            <Routes>
              <Route element={<UploadPage />} path="/documents/upload" />
              <Route element={<UploadedDocumentList />} path="/dashboard" />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </UploadedDocumentsProvider>
    </AuthContext.Provider>,
  )
}

describe('UploadPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('uploads a selected file and keeps safe document metadata for the dashboard', async () => {
    const user = userEvent.setup()
    mocks.validateFile.mockResolvedValue({ valid: true })
    mocks.uploadDocument.mockImplementation(
      async (file, type, { onProgress, onStep }) => {
        expect(file.name).toBe('passport.jpg')
        expect(type).toBe('PHOTO')
        onStep('uploading')
        onProgress(100)
        onStep('ready')
        return {
          documentId: 'document-1',
          status: 'READY',
          document: { id: 'document-1', status: 'READY' },
        }
      },
    )
    renderUploadPage()

    const file = new File(['image data'], 'passport.jpg', {
      type: 'image/jpeg',
    })
    await user.upload(
      screen.getByLabelText('Choose one document to upload'),
      file,
    )

    expect(await screen.findByText('passport.jpg')).toBeVisible()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Document type' }),
      'PHOTO',
    )
    await user.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'passport.jpg uploaded successfully.',
    )
    await user.click(screen.getByRole('link', { name: 'Back to dashboard' }))

    await waitFor(() =>
      expect(
        screen.getByRole('list', { name: 'Uploaded documents' }),
      ).toHaveTextContent('passport.jpg'),
    )
  })

  it('disables file selection during an upload and allows the next file after completion', async () => {
    const user = userEvent.setup()
    let finishUpload
    mocks.validateFile.mockResolvedValue({ valid: true })
    mocks.uploadDocument.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        }),
    )
    renderUploadPage()

    const fileInput = screen.getByLabelText('Choose one document to upload')
    expect(fileInput).not.toHaveAttribute('multiple')
    const firstFile = new File(['first'], 'first.jpg', { type: 'image/jpeg' })
    const nextFile = new File(['next'], 'next.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, firstFile)
    await screen.findByText('first.jpg')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Document type' }),
      'PHOTO',
    )
    await user.click(screen.getByRole('button', { name: 'Upload document' }))

    expect(fileInput).toBeDisabled()
    await user.upload(fileInput, nextFile)
    expect(screen.getByText('first.jpg')).toBeVisible()
    expect(screen.queryByText('Upload queue')).not.toBeInTheDocument()

    await act(async () => {
      finishUpload({
        documentId: 'document-1',
        status: 'READY',
        document: { id: 'document-1', status: 'READY' },
      })
    })
    await waitFor(() => expect(fileInput).toBeEnabled())

    await user.upload(fileInput, nextFile)
    expect(await screen.findByText('next.jpg')).toBeVisible()
    expect(screen.queryByText('first.jpg')).not.toBeInTheDocument()
  })
})
