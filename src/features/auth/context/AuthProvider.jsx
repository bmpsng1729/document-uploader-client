import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '../api/authApi.js'
import { AuthContext } from './AuthContext.js'

/**
 * Provides the current authenticated user and auth actions to the app.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi
      .refreshSession()
      .then(({ user: restoredUser }) => {
        if (active) setUser(restoredUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const expireSession = () => {
      setUser(null)
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:session-expired', expireSession)
    return () =>
      window.removeEventListener('auth:session-expired', expireSession)
  }, [navigate])

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials)
    setUser(response.user)
    return response
  }, [])

  const signup = useCallback(async (credentials) => {
    const response = await authApi.signup(credentials)
    setUser(response.user)
    return response
  }, [])

  const loginWithGoogle = useCallback(async (idToken) => {
    const response = await authApi.loginWithGoogle(idToken)
    setUser(response.user)
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, loginWithGoogle, logout }),
    [user, loading, login, signup, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
