import React from 'react'
import { Settings as SettingsIcon, User, Lock, Bell, Database, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Layout/Header'

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
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
              <div>Truck allocation triggers when cumulative pending volume for a destination reaches <strong className="text-white">500 m³</strong></div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
              <div>Transport charges = <strong className="text-white">max(volume × rate/m³, minimum charge)</strong></div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
              <div>All financial calculations are performed <strong className="text-white">server-side only</strong></div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
              <div>Status changes are always logged with timestamp and reason</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-2 shrink-0" />
              <div>Sessions expire after <strong className="text-white">30 minutes</strong> of inactivity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
