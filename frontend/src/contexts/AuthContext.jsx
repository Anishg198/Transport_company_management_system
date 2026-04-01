import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '../services/api'


const AuthContext = createContext(null)

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

function readStoredUser() {
  try {
    const stored = localStorage.getItem('tccs_user')
    const token = localStorage.getItem('tccs_token')
    if (!stored || !token) return null
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem('tccs_user')
    localStorage.removeItem('tccs_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
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
      // Clear any stale auth data on login failure
      localStorage.removeItem('tccs_token')
      localStorage.removeItem('tccs_user')
      const message = err.response?.data?.error
        || (err.code === 'ECONNREFUSED' || err.message === 'Network Error' ? 'Cannot connect to server. Is the backend running?' : null)
        || err.message
        || 'Login failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = useCallback(async ({ currentPassword, newUsername, newPassword }) => {
    const { data } = await authAPI.updateProfile({ currentPassword, newUsername, newPassword })
    const updatedUser = data.user
    const newToken = data.token
    localStorage.setItem('tccs_token', newToken)
    localStorage.setItem('tccs_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    return updatedUser
  }, [])

  const hasRole = (...roles) => user && roles.includes(user.role)
  const isAdmin = () => user?.role === 'SystemAdministrator'
  const isManager = () => user?.role === 'TransportManager'
  const isOperator = () => user?.role === 'BranchOperator'

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser, hasRole, isAdmin, isManager, isOperator }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
