import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './ThemeProvider.jsx'
import { ToastProvider } from './ToastProvider.jsx'
import { AuthProvider } from '../features/auth/context/AuthProvider.jsx'
import { AppRouter } from './router.jsx'
import { UploadedDocumentsProvider } from '../features/documents/context/UploadedDocumentsProvider.jsx'

export function App() {
  // TODO:-> this can cause prop-drilling ,use redux-toolkit for this

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <UploadedDocumentsProvider>
              <AppRouter />
            </UploadedDocumentsProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
