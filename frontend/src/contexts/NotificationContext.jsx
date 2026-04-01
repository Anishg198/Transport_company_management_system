import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { chatAPI } from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

// localStorage key for last-seen timestamp per conversation
function seenKey(userId) {
  return `tccs_chat_seen_${userId}`
}

export function getSeenAt(userId) {
  try { return localStorage.getItem(seenKey(userId)) } catch { return null }
}

export function markSeen(userId) {
  try { localStorage.setItem(seenKey(userId), new Date().toISOString()) } catch {}
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadMap, setUnreadMap] = useState({}) // { userId: true/false }
  const pollingRef = useRef(null)

  const checkUnread = useCallback(() => {
    if (!user) return
    chatAPI.getUsers()
      .then(({ data }) => {
        const map = {}
        for (const u of (data.users || [])) {
          if (!u.last_message_at || u.last_message_mine) {
            map[u.user_id] = false
            continue
          }
          const seenAt = getSeenAt(u.user_id)
          if (!seenAt) {
            map[u.user_id] = true
          } else {
            map[u.user_id] = new Date(u.last_message_at) > new Date(seenAt)
          }
        }
        setUnreadMap(map)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) { setUnreadMap({}); return }
    checkUnread()
    pollingRef.current = setInterval(checkUnread, 8000)
    return () => clearInterval(pollingRef.current)
  }, [user, checkUnread])

  const unreadTotal = Object.values(unreadMap).filter(Boolean).length

  const isUnread = useCallback((userId) => !!unreadMap[userId], [unreadMap])

  const clearUnread = useCallback((userId) => {
    markSeen(userId)
    setUnreadMap(prev => ({ ...prev, [userId]: false }))
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadTotal, isUnread, clearUnread, checkUnread }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
