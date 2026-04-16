import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageSquare, Package, ChevronLeft, Search } from 'lucide-react'
import { chatAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useToast } from '../components/ui/Toast'
import Header from '../components/Layout/Header'
import { formatDateTime } from '../lib/utils'

const ROLE_STYLES = {
  BranchOperator:      { name: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',   avatar: 'from-amber-600 to-amber-400 text-amber-950' },
  TransportManager:    { name: 'text-electric-400', badge: 'bg-electric-500/15 text-electric-400 border-electric-500/30', avatar: 'from-electric-500 to-blue-400 text-white' },
  SystemAdministrator: { name: 'text-violet-400',   badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',  avatar: 'from-violet-600 to-violet-400 text-white' },
}

const ROLE_LABELS = {
  BranchOperator: 'Operator',
  TransportManager: 'Manager',
  SystemAdministrator: 'Admin',
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase()
}

function Avatar({ name, role, size = 'md' }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.BranchOperator
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 bg-gradient-to-br ${style.avatar}`}>
      {getInitials(name)}
    </div>
  )
}

function UserItem({ u, isSelected, onClick, hasUnread }) {
  const style = ROLE_STYLES[u.role] || ROLE_STYLES.BranchOperator
  return (
    <button
      data-testid={`chat-user-${u.username}`}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
        isSelected ? 'bg-electric-500/20 border border-electric-500/30' : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={u.name} role={u.role} />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-navy-900 animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold truncate ${hasUnread ? 'text-white' : 'text-white/80'}`}>{u.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${style.badge}`}>
            {ROLE_LABELS[u.role]}
          </span>
        </div>
        {u.last_message ? (
          <div className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
            {u.last_message_mine ? 'You: ' : ''}{u.last_message}
          </div>
        ) : (
          <div className="text-xs text-gray-600 mt-0.5">No messages yet</div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1 self-start mt-0.5">
        {u.last_message_at && (
          <div className="text-[10px] text-gray-600">
            {new Date(u.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {hasUnread && (
          <span className="w-2 h-2 rounded-full bg-red-500" />
        )}
      </div>
    </button>
  )
}

function MessageBubble({ msg, isOwn }) {
  const style = ROLE_STYLES[msg.sender_role] || ROLE_STYLES.BranchOperator
  return (
    <div data-testid={isOwn ? 'chat-msg-own' : 'chat-msg-other'} className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar name={msg.sender_name} role={msg.sender_role} size="sm" />}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className={`text-xs font-semibold px-1 ${style.name}`}>{msg.sender_name}</span>
        )}
        <div className={`rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'bg-electric-500/25 border border-electric-500/40 rounded-br-sm'
            : 'bg-white/8 border border-white/10 rounded-bl-sm'
        }`}>
          {msg.consignment_ref && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
              <Package size={9} />
              <span className="font-mono">{msg.consignment_ref}</span>
            </div>
          )}
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <span className="text-[10px] text-gray-600 px-1">{formatDateTime(msg.sent_at)}</span>
      </div>
    </div>
  )
}

export default function Chat() {
  const { user } = useAuth()
  const { isUnread, clearUnread, checkUnread } = useNotifications()
  const toast = useToast()
  const [chatUsers, setChatUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [consignmentRef, setConsignmentRef] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [latestAt, setLatestAt] = useState(null)
  const [usersLoading, setUsersLoading] = useState(true)
  const bottomRef = useRef(null)
  const pollingRef = useRef(null)
  const selectedUserRef = useRef(null)
  const latestAtRef = useRef(null)

  // Keep refs in sync
  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])
  useEffect(() => { latestAtRef.current = latestAt }, [latestAt])

  // Load chat users on mount
  useEffect(() => {
    chatAPI.getUsers()
      .then(({ data }) => setChatUsers(data.users || []))
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Failed to load users' }))
      .finally(() => setUsersLoading(false))
  }, [])

  // Refresh user list (to update last message preview) when conversation changes
  const refreshUserList = useCallback(() => {
    chatAPI.getUsers().then(({ data }) => setChatUsers(data.users || [])).catch(() => {})
  }, [])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (targetUser, since) => {
    if (!targetUser) return
    try {
      const params = { with: targetUser.user_id }
      if (since) params.since = since
      const { data } = await chatAPI.getMessages(params)
      if (data.messages.length > 0) {
        if (since) {
          setMessages(prev => [...prev, ...data.messages])
        } else {
          setMessages(data.messages)
        }
        const last = data.messages[data.messages.length - 1]
        setLatestAt(last.sent_at)
        if (targetUser) clearUnread(targetUser.user_id)
        refreshUserList()
      }
    } catch {
      // ignore polling errors
    }
  }, [refreshUserList])

  // Load conversation when user is selected, clear unread
  useEffect(() => {
    if (!selectedUser) { setMessages([]); return }
    setMessages([])
    setLatestAt(null)
    clearUnread(selectedUser.user_id)
    fetchMessages(selectedUser, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, fetchMessages])

  // Poll every 3s for new messages
  useEffect(() => {
    clearInterval(pollingRef.current)
    if (!selectedUser) return
    pollingRef.current = setInterval(() => {
      fetchMessages(selectedUserRef.current, latestAtRef.current)
    }, 3000)
    return () => clearInterval(pollingRef.current)
  }, [selectedUser, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || !selectedUser) return
    setSending(true)
    try {
      const body = { content, recipientId: selectedUser.user_id }
      if (consignmentRef.trim()) body.consignmentRef = consignmentRef.trim()
      const { data } = await chatAPI.sendMessage(body)
      setMessages(prev => [...prev, data])
      setLatestAt(data.sent_at)
      setInput('')
      setConsignmentRef('')
      clearUnread(selectedUser.user_id)
      refreshUserList()
      checkUnread()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to send' })
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const filteredUsers = chatUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-screen">
      <Header title="Chat" />
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Left sidebar: user list */}
        <div className="w-72 shrink-0 flex flex-col border-r border-white/8 bg-navy-900/50">
          <div className="p-3 border-b border-white/8">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                data-testid="chat-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-8 text-sm py-2"
                placeholder="Search people..."
              />
            </div>
          </div>
          <div data-testid="chat-user-list" className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {usersLoading ? (
              <div className="text-center text-gray-500 text-sm py-8">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div data-testid="chat-no-users" className="text-center text-gray-500 text-sm py-8">No users found</div>
            ) : filteredUsers.map(u => (
              <UserItem
                key={u.user_id}
                u={u}
                isSelected={selectedUser?.user_id === u.user_id}
                hasUnread={isUnread(u.user_id)}
                onClick={() => setSelectedUser(u)}
              />
            ))}
          </div>
        </div>

        {/* Right: conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedUser ? (
            <div data-testid="chat-empty-state" className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a person to start chatting</p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <button onClick={() => setSelectedUser(null)} className="lg:hidden text-gray-400 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
                <Avatar name={selectedUser.name} role={selectedUser.role} />
                <div>
                  <div className="font-semibold text-white text-sm">{selectedUser.name}</div>
                  <div className="text-xs text-gray-500">{ROLE_LABELS[selectedUser.role]}{selectedUser.branch_location ? ` · ${selectedUser.branch_location}` : ''}</div>
                </div>
              </div>

              {/* Messages */}
              <div data-testid="chat-messages-container" className="flex-1 overflow-y-auto p-4 min-h-0">
                {messages.length === 0 ? (
                  <div data-testid="chat-conversation-empty" className="flex flex-col items-center justify-center h-full text-gray-600">
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <MessageBubble
                        key={msg.message_id}
                        msg={msg}
                        isOwn={msg.sender_id === user?.userId}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/8 space-y-2">
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-gray-600 shrink-0" />
                  <input
                    data-testid="chat-consignment-ref-input"
                    value={consignmentRef}
                    onChange={e => setConsignmentRef(e.target.value)}
                    className="input-field font-mono text-xs py-1.5 w-52"
                    placeholder="Consignment # (optional)"
                  />
                </div>
                <div className="flex gap-2">
                  <textarea
                    data-testid="chat-message-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-field flex-1 resize-none text-sm"
                    rows={2}
                    placeholder={`Message ${selectedUser.name}… (Enter to send)`}
                  />
                  <button
                    data-testid="chat-send-btn"
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="btn-primary px-4 self-end shrink-0 disabled:opacity-50"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
