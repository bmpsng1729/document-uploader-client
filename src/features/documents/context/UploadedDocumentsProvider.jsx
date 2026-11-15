import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/context/useAuth.js'
import { UploadedDocumentsContext } from './UploadedDocumentsContext.js'

export function UploadedDocumentsProvider({ children }) {
  const { user } = useAuth()
  return (
    <UserDocumentsScope key={user?.id ?? 'guest'}>
      {children}
    </UserDocumentsScope>
  )
}

function UserDocumentsScope({ children }) {
  const [documents, setDocuments] = useState([])
  const addDocument = useCallback((document) => {
    const safeDocument = {
      id: document.id,
      name: document.name,
      type: document.type,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      updatedAt: document.updatedAt,
    }

    setDocuments((currentDocuments) => [
      safeDocument,
      ...currentDocuments.filter((item) => item.id !== safeDocument.id),
    ])
  }, [])

  return (
    <UploadedDocumentsContext.Provider value={{ documents, addDocument }}>
      {children}
    </UploadedDocumentsContext.Provider>
  )
}
