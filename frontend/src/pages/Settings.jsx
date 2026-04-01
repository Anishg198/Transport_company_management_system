import React, { useState } from 'react'
import { Settings as SettingsIcon, User, Lock, Database, Info, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import Header from '../components/Layout/Header'

function ChangeUsernameForm() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ currentPassword: '', newUsername: '' })
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.newUsername.trim() || !form.currentPassword) return
    setSaving(true)
    try {
      await updateUser({ currentPassword: form.currentPassword, newUsername: form.newUsername.trim() })
      toast({ type: 'success', title: 'Username Updated', message: `Username changed to "${form.newUsername.trim()}"` })
      setForm({ currentPassword: '', newUsername: '' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed', message: err.response?.data?.error || err.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">New Username</label>
        <input
          value={form.newUsername}
          onChange={e => setForm(p => ({ ...p, newUsername: e.target.value }))}
          className="input-field"
          placeholder="Enter new username (min 3 characters)"
          minLength={3}
          required
        />
      </div>
      <div>
        <label className="label">Current Password <span className="text-gray-500">(to confirm)</span></label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
            className="input-field pr-10"
            placeholder="Enter your current password"
            required
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving || !form.newUsername.trim() || !form.currentPassword}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        {saving ? 'Saving…' : 'Change Username'}
      </button>
    </form>
  )
}

function ChangePasswordForm() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState({ current: false, new: false, confirm: false })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast({ type: 'error', title: 'Mismatch', message: 'New passwords do not match' })
      return
    }
    if (form.newPassword.length < 6) {
      toast({ type: 'error', title: 'Too Short', message: 'Password must be at least 6 characters' })
      return
    }
    setSaving(true)
    try {
      await updateUser({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast({ type: 'success', title: 'Password Updated', message: 'Your password has been changed successfully' })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed', message: err.response?.data?.error || err.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (field) => setShow(p => ({ ...p, [field]: !p[field] }))

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Current Password</label>
        <div className="relative">
          <input
            type={show.current ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
            className="input-field pr-10"
            placeholder="Enter current password"
            required
          />
          <button type="button" onClick={() => toggle('current')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {show.current ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <input
            type={show.new ? 'text' : 'password'}
            value={form.newPassword}
            onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
            className="input-field pr-10"
            placeholder="Min 6 characters"
            minLength={6}
            required
          />
          <button type="button" onClick={() => toggle('new')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {show.new ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="label">Confirm New Password</label>
        <div className="relative">
          <input
            type={show.confirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
            className="input-field pr-10"
            placeholder="Repeat new password"
            required
          />
          <button type="button" onClick={() => toggle('confirm')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {form.confirmPassword && form.newPassword !== form.confirmPassword && (
          <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
        {saving ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  )
}

export default function Settings() {
  const { user } = useAuth()

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-5 animate-fade-in max-w-2xl">

        {/* Profile */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><User size={18} /> Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Name</span><div className="text-white font-medium mt-0.5">{user?.name}</div></div>
            <div><span className="text-gray-400">Username</span><div className="text-white font-mono mt-0.5">{user?.username}</div></div>
            <div><span className="text-gray-400">Role</span><div className="text-electric-400 font-medium mt-0.5">{user?.role}</div></div>
            <div><span className="text-gray-400">Branch</span><div className="text-white mt-0.5">{user?.branchLocation || '—'}</div></div>
          </div>
        </div>

        {/* Change Username */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><User size={18} className="text-electric-400" /> Change Username</h3>
          <ChangeUsernameForm />
        </div>

        {/* Change Password */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><Lock size={18} className="text-amber-400" /> Change Password</h3>
          <ChangePasswordForm />
        </div>

        {/* System Info */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><Info size={18} /> System Information</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'System', value: 'Transport Company Computerisation System (TCCS)' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Auto Allocation Threshold', value: '500 m³ per destination' },
              { label: 'Session Timeout', value: '30 minutes inactivity' },
              { label: 'Consignment Format', value: 'TCCS-YYYYMMDD-NNNN' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Rules */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><Database size={18} /> Business Rules</h3>
          <div className="space-y-3 text-sm text-gray-300">
            {[
              'Truck allocation triggers when cumulative pending volume for a destination reaches <strong class="text-white">500 m³</strong>',
              'Transport charges = <strong class="text-white">max(volume × rate/m³, minimum charge)</strong>',
              'All financial calculations are performed <strong class="text-white">server-side only</strong>',
              'Status changes are always logged with timestamp and reason',
              'Sessions expire after <strong class="text-white">30 minutes</strong> of inactivity',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
                <div dangerouslySetInnerHTML={{ __html: rule }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
