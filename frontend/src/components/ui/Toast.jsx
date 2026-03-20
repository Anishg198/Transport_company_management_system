import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'border-green-500/40 bg-green-500/10 text-green-400',
  error: 'border-red-500/40 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  info: 'border-electric-500/40 bg-electric-500/10 text-electric-400',
}

export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || Info
        return (
          <div
            key={toast.id}
            className={cn(
              'glass-card border p-4 flex items-start gap-3 animate-fade-in shadow-glass',
              styles[toast.type] || styles.info
            )}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              {toast.message && <div className="text-sm opacity-80 mt-0.5">{toast.message}</div>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback((options) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, ...options }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContext = React.createContext(() => {})
export const useToast = () => React.useContext(ToastContext)
