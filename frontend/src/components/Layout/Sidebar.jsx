import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Truck, LayoutDashboard, Package, Send, FileText,
  BarChart2, Settings, Users, DollarSign, LogOut,
  ChevronLeft, ChevronRight, Zap, Shield, TrendingUp, MapPin
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['BranchOperator', 'TransportManager', 'SystemAdministrator'] },
  { path: '/consignments', icon: Package, label: 'Consignments', roles: ['BranchOperator', 'TransportManager', 'SystemAdministrator'] },
  { path: '/fleet', icon: Truck, label: 'Fleet', roles: ['TransportManager', 'SystemAdministrator'] },
  { path: '/dispatch', icon: Send, label: 'Dispatch', roles: ['BranchOperator', 'TransportManager', 'SystemAdministrator'] },
  { path: '/bills', icon: FileText, label: 'Bills', roles: ['BranchOperator', 'SystemAdministrator'] },
  { path: '/reports', icon: BarChart2, label: 'Reports', roles: ['TransportManager', 'SystemAdministrator'] },
  { path: '/pricing', icon: DollarSign, label: 'Pricing', roles: ['SystemAdministrator'] },
  { path: '/users', icon: Users, label: 'Users', roles: ['SystemAdministrator'] },
  { path: '/settings', icon: Settings, label: 'Settings', roles: ['BranchOperator', 'TransportManager', 'SystemAdministrator'] },
]

const ROLE_CONFIG = {
  BranchOperator:      { label: 'Operator',  icon: Zap,        color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   initials: 'OP' },
  TransportManager:    { label: 'Manager',   icon: TrendingUp, color: 'text-electric-400', bg: 'bg-electric-500/15', border: 'border-electric-500/30', initials: 'TM' },
  SystemAdministrator: { label: 'Admin',     icon: Shield,     color: 'text-violet-400',   bg: 'bg-violet-500/15',  border: 'border-violet-500/30',  initials: 'SA' },
}

const AVATAR_COLORS = {
  BranchOperator:      { bg: 'from-amber-600 to-amber-400',    text: 'text-amber-950' },
  TransportManager:    { bg: 'from-electric-500 to-blue-400',  text: 'text-white' },
  SystemAdministrator: { bg: 'from-violet-600 to-violet-400',  text: 'text-white' },
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role))
  const roleConf = ROLE_CONFIG[user?.role]
  const avatarConf = AVATAR_COLORS[user?.role]
  const RoleIcon = roleConf?.icon
  const initials = getInitials(user?.name)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-[64px]' : 'w-[228px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1530 50%, #0a0f1e 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Subtle animated left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0,102,255,0.5) 30%, rgba(139,92,246,0.3) 70%, transparent)',
          animation: 'shimmerLine 4s ease-in-out infinite',
        }}
      />

      {/* Logo */}
      {collapsed ? (
        /* Collapsed header: truck icon centered, toggle as absolute tab on right edge */
        <div className="relative flex items-center justify-center min-h-[64px] border-b border-white/[0.06]">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{
              background: 'linear-gradient(135deg, #0066ff, #2980ff)',
              boxShadow: '0 0 16px rgba(0,102,255,0.5), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Truck size={15} className="text-white" />
            <span
              className="absolute inset-0 rounded-xl animate-ping-slow opacity-30"
              style={{ background: 'rgba(0,102,255,0.4)' }}
            />
          </div>
          {/* Toggle tab on right edge */}
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #111d3d, #162247)',
              border: '1px solid rgba(0,102,255,0.4)',
              boxShadow: '0 0 10px rgba(0,102,255,0.3)',
            }}
            title="Expand sidebar"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      ) : (
        /* Expanded header: full logo row with collapse button */
        <div className="flex items-center gap-3 px-4 py-4 min-h-[64px] border-b border-white/[0.06]">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{
              background: 'linear-gradient(135deg, #0066ff, #2980ff)',
              boxShadow: '0 0 16px rgba(0,102,255,0.5), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Truck size={15} className="text-white" />
            <span
              className="absolute inset-0 rounded-xl animate-ping-slow opacity-30"
              style={{ background: 'rgba(0,102,255,0.4)' }}
            />
          </div>
          <div className="overflow-hidden flex-1">
            <div
              className="font-bold text-sm leading-tight bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff, #93c5fd)' }}
            >
              TCCS
            </div>
            <div className="text-[10px] text-gray-500 leading-tight tracking-wide uppercase">Transport System</div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Collapse sidebar"
          >
            <ChevronLeft size={12} />
          </button>
        </div>
      )}

      {/* User card */}
      {user && (
        <div className={cn(
          'mx-3 my-3 rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-300',
          collapsed ? 'p-0' : 'p-3',
          'bg-white/[0.04]'
        )}>
          {collapsed ? (
            <div className="flex justify-center py-2.5">
              <div
                className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br', avatarConf?.bg, avatarConf?.text)}
                title={user.name}
              >
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br', avatarConf?.bg, avatarConf?.text)}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate leading-tight">{user.name}</div>
                <div className="text-[11px] text-gray-500 truncate mt-0.5">{user.username}</div>
                {roleConf && (
                  <div className={cn(
                    'mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    roleConf.color, roleConf.bg, roleConf.border
                  )}>
                    {RoleIcon && <RoleIcon size={9} />}
                    {roleConf.label}
                  </div>
                )}
                {user.branchLocation && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
                    <MapPin size={9} />
                    <span className="truncate">{user.branchLocation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-0.5">
        {visibleItems.map((item, idx) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'nav-item group relative',
                isActive ? 'nav-item-active' : 'nav-item-inactive',
                collapsed ? 'justify-center px-0 py-2.5' : ''
              )}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Active left indicator bar */}
              {isActive && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #2980ff, #5599ff)', boxShadow: '0 0 8px rgba(0,102,255,0.6)' }}
                />
              )}

              <Icon
                size={collapsed ? 18 : 16}
                className={cn(
                  'shrink-0 transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}
              />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {/* Active pulse dot */}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-electric-400 shrink-0"
                  style={{ boxShadow: '0 0 6px rgba(0,102,255,0.8)' }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'nav-item nav-item-inactive w-full group',
            collapsed ? 'justify-center px-0 py-2.5' : '',
            'hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
          )}
        >
          <LogOut
            size={collapsed ? 18 : 16}
            className="shrink-0 transition-transform duration-200 group-hover:rotate-12"
          />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
