import React from 'react'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/utils'

export default function Header({ title, actions }) {
  const { user } = useAuth()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-bold text-white">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="text-right hidden sm:block">
          <div className="text-xs text-gray-400">{formatDate(new Date())}</div>
          <div className="text-xs text-gray-500">{user?.branchLocation || 'TCCS'}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400 text-sm font-semibold">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
