import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './ThemeProvider.jsx'
import { ToastProvider } from './ToastProvider.jsx'
import { AuthProvider } from '../features/auth/context/AuthProvider.jsx'
import { GOOGLE_CLIENT_ID } from '../lib/env.js'
import { AppRouter } from './router.jsx'

export function App() {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() =>
        window.dispatchEvent(new Event('auth:google-script-error'))
      }
    >
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
