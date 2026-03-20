import React, { useState, useEffect } from 'react'
import { Plus, Users as UsersIcon, Edit, UserX, UserCheck, Shield, Zap, TrendingUp, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'
import { usersAPI } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { formatDateTime } from '../lib/utils'
import Header from '../components/Layout/Header'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'

const ROLE_ICONS = {
  BranchOperator: { icon: Zap, color: 'text-amber-400' },
  TransportManager: { icon: TrendingUp, color: 'text-electric-400' },
  SystemAdministrator: { icon: Shield, color: 'text-purple-400' },
}

function UserForm({ initial, onSuccess, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState(initial || { username: '', password: '', role: 'BranchOperator', name: '', branchLocation: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (initial?.userId) {
        await usersAPI.update(initial.userId, { name: form.name, branchLocation: form.branchLocation, role: form.role })
        toast({ type: 'success', title: 'Updated', message: 'User updated successfully' })
      } else {
        await usersAPI.create(form)
        toast({ type: 'success', title: 'Created', message: `User ${form.username} created` })
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="input-field" placeholder="Full name" required />
        </div>
        <div>
          <label className="label">Username *</label>
          <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            className="input-field" placeholder="username" required disabled={!!initial?.userId} />
        </div>
        {!initial?.userId && (
          <div>
            <label className="label">Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="input-field" placeholder="Min 8 characters" required minLength={6} />
          </div>
        )}
        <div>
          <label className="label">Role *</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="select-field" required>
            <option value="BranchOperator">Branch Operator</option>
            <option value="TransportManager">Transport Manager</option>
            <option value="SystemAdministrator">System Administrator</option>
          </select>
        </div>
        <div className={initial?.userId ? 'col-span-2' : ''}>
          <label className="label">Branch Location</label>
          <input value={form.branchLocation} onChange={e => setForm(p => ({ ...p, branchLocation: e.target.value }))}
            className="input-field" placeholder="e.g. Mumbai" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Saving...' : (initial?.userId ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  )
}

function PendingApprovalsTab({ onCountChange }) {
  const toast = useToast()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await usersAPI.pending()
      const list = res.data.users || res.data || []
      setPending(list)
      onCountChange(list.length)
    } catch {
      // If endpoint doesn't exist yet, show empty state gracefully
      setPending([])
      onCountChange(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (userId, username) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'approve' }))
    try {
      await usersAPI.approve(userId)
      toast({ type: 'success', title: 'Approved', message: `${username} has been approved and can now log in` })
      fetchPending()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[userId]; return n })
    }
  }

  const handleReject = async (userId, username) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'reject' }))
    try {
      await usersAPI.reject(userId)
      toast({ type: 'success', title: 'Rejected', message: `${username}'s registration has been rejected` })
      fetchPending()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[userId]; return n })
    }
  }

  if (loading) {
    return <div className="p-4"><TableSkeleton rows={4} cols={5} /></div>
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        <div className="text-white font-semibold mb-1">No Pending Requests</div>
        <div className="text-gray-500 text-sm">All registration requests have been processed.</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="table-header">
          <tr>
            {['Applicant', 'Username', 'Role Preference', 'Branch', 'Submitted', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pending.map(u => {
            const userId = u.user_id || u.userId || u.id
            const username = u.username
            const isApproving = actionLoading[userId] === 'approve'
            const isRejecting = actionLoading[userId] === 'reject'
            const isLoading = !!actionLoading[userId]
            return (
              <tr key={userId} className="table-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm font-semibold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-white">{u.name || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-gray-400 text-xs">{username}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-electric-500/15 text-electric-400 border border-electric-500/25">
                    {(u.role_preference || u.rolePreference || u.role || '—').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{u.branch_location || u.branchLocation || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.created_at || u.createdAt ? formatDateTime(u.created_at || u.createdAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(userId, username)}
                      disabled={isLoading}
                      className="btn-success py-1.5 px-3 text-xs"
                      title="Approve registration"
                    >
                      {isApproving ? (
                        <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><UserCheck size={12} /> Approve</>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(userId, username)}
                      disabled={isLoading}
                      className="btn-danger py-1.5 px-3 text-xs"
                      title="Reject registration"
                    >
                      {isRejecting ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><XCircle size={12} /> Reject</>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Users() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [deactivating, setDeactivating] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([usersAPI.getAll(), usersAPI.stats()])
      setUsers(usersRes.data.users || [])
      setStats(statsRes.data.stats)
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      await usersAPI.delete(confirmDeactivate.user_id)
      toast({ type: 'success', title: 'Deactivated', message: `User ${confirmDeactivate.username} deactivated` })
      setConfirmDeactivate(null)
      fetchUsers()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div>
      <Header title="User Management" actions={
        <button onClick={() => { setEditingUser(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Add User
        </button>
      } />
      <div className="p-6 space-y-5 animate-fade-in">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Active Users', value: stats.active_users },
              { label: 'Operators', value: stats.operators },
              { label: 'Managers', value: stats.managers },
              { label: 'Admins', value: stats.admins },
              { label: 'Active Today', value: stats.active_today },
            ].map(item => (
              <div key={item.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-xs text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
              activeTab === 'users'
                ? 'text-electric-400 border-electric-500 bg-electric-500/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <UsersIcon size={14} />
              Users
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
              activeTab === 'pending'
                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock size={14} />
              Pending Approvals
              {pendingCount > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: pendingCount > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                    border: `1px solid ${pendingCount > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    color: pendingCount > 0 ? '#fbbf24' : '#f87171',
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'users' && (
          <div className="table-container">
            <div className="flex items-center justify-between px-5 py-3 table-header">
              <span className="text-sm font-medium text-gray-300">{users.length} users</span>
              <button onClick={fetchUsers} className="btn-secondary py-1.5 px-2.5"><RefreshCw size={13} /></button>
            </div>
            {loading ? <div className="p-4"><TableSkeleton rows={5} cols={6} /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      {['User', 'Username', 'Role', 'Branch', 'Last Login', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const roleInfo = ROLE_ICONS[u.role]
                      const RoleIcon = roleInfo?.icon
                      return (
                        <tr key={u.user_id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400 text-sm font-semibold shrink-0">
                                {u.name?.charAt(0)}
                              </div>
                              <span className="font-medium text-white">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400 text-xs">{u.username}</td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${roleInfo?.color}`}>
                              {RoleIcon && <RoleIcon size={12} />}
                              {u.role.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{u.branch_location || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.last_login ? formatDateTime(u.last_login) : 'Never'}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingUser({ userId: u.user_id, name: u.name, username: u.username, role: u.role, branchLocation: u.branch_location }); setShowForm(true) }}
                                className="btn-secondary py-1 px-2"><Edit size={12} /></button>
                              {u.user_id !== currentUser?.userId && u.is_active && (
                                <button onClick={() => setConfirmDeactivate(u)} className="btn-danger py-1 px-2">
                                  <UserX size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="table-container">
            <div className="flex items-center justify-between px-5 py-3 table-header">
              <span className="text-sm font-medium text-gray-300">
                {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}` : 'No pending requests'}
              </span>
            </div>
            <PendingApprovalsTab onCountChange={setPendingCount} />
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingUser ? 'Edit User' : 'Add New User'} size="md">
        <UserForm initial={editingUser} onSuccess={fetchUsers} onClose={() => setShowForm(false)} />
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmDeactivate?.name}? They will no longer be able to log in.`}
        confirmText="Deactivate"
        loading={deactivating}
      />
    </div>
  )
}
