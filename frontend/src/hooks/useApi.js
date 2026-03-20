import { useState, useCallback } from 'react'

export function useApi(apiFunc) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFunc(...args)
      setData(result.data)
      return result.data
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'An error occurred'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [apiFunc])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, message, type = 'info' }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, removeToast }
}
