import { createContext, useContext } from 'react'

export const UploadedDocumentsContext = createContext({
  documents: [],
  addDocument: () => {},
})

export function useUploadedDocuments() {
  return useContext(UploadedDocumentsContext)
}
