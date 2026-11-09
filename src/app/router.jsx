import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/pages/LoginPage.jsx'
import { SignupPage } from '../features/auth/pages/SignupPage.jsx'
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute.jsx'
import { PublicOnlyRoute } from '../features/auth/routes/PublicOnlyRoute.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
        path="/login"
      />
      <Route
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
        path="/signup"
      />
      <Route
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
