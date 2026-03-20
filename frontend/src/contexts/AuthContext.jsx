import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tccs_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inactivityTimer = useRef(null)

  const logout = useCallback(() => {
    localStorage.removeItem('tccs_token')
    localStorage.removeItem('tccs_user')
    setUser(null)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    authAPI.logout().catch(() => {})
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (user) {
      inactivityTimer.current = setTimeout(() => {
        logout()
        alert('Session expired due to inactivity. Please log in again.')
      }, INACTIVITY_TIMEOUT)
    }
  }, [user, logout])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, resetInactivityTimer))
    resetInactivityTimer()
    return () => {
      events.forEach(e => document.removeEventListener(e, resetInactivityTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivityTimer])

  const login = async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await authAPI.login(credentials)
      localStorage.setItem('tccs_token', data.token)
      localStorage.setItem('tccs_user', JSON.stringify(data.user))
      setUser(data.user)
      resetInactivityTimer()
      return data
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (...roles) => user && roles.includes(user.role)
  const isAdmin = () => user?.role === 'SystemAdministrator'
  const isManager = () => user?.role === 'TransportManager'
  const isOperator = () => user?.role === 'BranchOperator'

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, hasRole, isAdmin, isManager, isOperator }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
