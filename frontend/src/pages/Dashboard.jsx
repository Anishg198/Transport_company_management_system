import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Truck, FileText, AlertTriangle, TrendingUp,
  Clock, CheckCircle, Activity, ArrowRight, Plus, Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { dashboardAPI, allocationAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatVolume } from '../lib/utils'
import Header from '../components/Layout/Header'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'

const PIE_COLORS = {
  Available:        '#22c55e',
  Allocated:        '#3b82f6',
  InTransit:        '#f59e0b',
  Loading:          '#a855f7',
  UnderMaintenance: '#ef4444',
  Unloading:        '#f97316',
}

// ── AnimatedStatCard ──────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, colorClass, accentColor, delay = 0 }) {
  return (
    <div
      className="stat-card rounded-xl overflow-hidden"
      style={{
        animation: `fadeInUp 0.5s ease-out ${delay}ms both`,
        background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}06 100%)`,
        border: `1px solid ${accentColor}30`,
      }}
    >
      {/* Top shimmer line override for this card's color */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          animation: 'shimmerLine 3s ease-in-out infinite',
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p
            className="text-3xl font-bold text-white"
            style={{ animation: `countUp 0.6s ease-out ${delay + 100}ms both` }}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35` }}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  )
}

// ── AlertCard ─────────────────────────────────────────────────────────────
function AlertCard({ destination, volume, percentage }) {
  const isNear = percentage >= 80
  const isCritical = percentage >= 95

  const color = isCritical ? '#ef4444' : isNear ? '#f59e0b' : '#3b82f6'
  const barClass = isCritical ? 'red' : isNear ? 'amber' : 'blue'

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-white/5"
      style={{
        background: `${color}08`,
        borderColor: `${color}25`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{destination}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatVolume(volume)}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold" style={{ color }}>
          {percentage}%
        </div>
        {(isNear || isCritical) && (
          <div className="text-[10px] mt-0.5" style={{ color }}>
            {isCritical ? 'Critical' : 'Near limit'}
          </div>
        )}
      </div>
      <div className="w-14 shrink-0">
        <div className="progress-bar-container h-1.5">
          <div
            className={`progress-bar-fill ${barClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Custom Pie Tooltip ─────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs border border-white/20">
      <span className="text-white font-semibold">{payload[0].name}</span>
      <span className="ml-2 text-gray-300">{payload[0].value}</span>
    </div>
  )
}

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs border border-white/20">
      <div className="text-gray-400 mb-0.5">{label}</div>
      <div className="text-white font-semibold">{payload[0].value} m³</div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isOperator, isManager, isAdmin } = useAuth()
  const [summary, setSummary] = useState(null)
  const [pendingVols, setPendingVols] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.summary(),
      allocationAPI.pendingVolumes()
    ]).then(([summaryRes, volsRes]) => {
      setSummary(summaryRes.data)
      setPendingVols(volsRes.data.pendingVolumes || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const truckPieData = summary ? Object.entries({
    Available:        parseInt(summary.trucks?.available)          || 0,
    Allocated:        parseInt(summary.trucks?.allocated)          || 0,
    InTransit:        parseInt(summary.trucks?.in_transit)         || 0,
    Loading:          parseInt(summary.trucks?.loading)            || 0,
    UnderMaintenance: parseInt(summary.trucks?.under_maintenance)  || 0,
  }).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : []

  const pendingChartData = pendingVols.slice(0, 8).map(v => ({
    name: v.destination.substring(0, 9),
    volume: parseFloat(parseFloat(v.pendingVolume).toFixed(1)),
  }))

  if (loading) return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">

        {/* ── Welcome Hero ──────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden p-6 border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(0,102,255,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(0,20,60,0.2) 100%)',
            animation: 'fadeInUp 0.5s ease-out both',
          }}
        >
          {/* Animated gradient overlay */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #0066ff15, #8b5cf615, #0066ff15)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 6s ease infinite',
            }}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-electric-400 font-medium uppercase tracking-widest mb-1">
                Welcome back
              </div>
              <h1 className="text-2xl font-bold text-white">
                {firstName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Here's what's happening with your fleet today.
              </p>
            </div>

            {/* Animated truck icon */}
            <div className="hidden sm:flex items-center justify-center relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,102,255,0.2), rgba(139,92,246,0.15))',
                  border: '1px solid rgba(0,102,255,0.3)',
                  boxShadow: '0 0 30px rgba(0,102,255,0.2)',
                  animation: 'bounceGentle 3s ease-in-out infinite',
                }}
              >
                <Truck size={30} className="text-electric-400" />
              </div>
              {/* Outer pulse rings */}
              <div
                className="absolute inset-0 rounded-2xl animate-ping-slow opacity-20"
                style={{ background: 'rgba(0,102,255,0.3)' }}
              />
            </div>
          </div>
        </div>

        {/* ── Branch Operator Section ───────────────────────────────────── */}
        {(isOperator() || isAdmin()) && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Package}      label="Today's Consignments" value={summary?.consignments?.today_count || 0}       accentColor="#3b82f6" delay={0}   />
              <StatCard icon={Clock}        label="Pending"              value={summary?.consignments?.pending_count || 0}     accentColor="#f59e0b" delay={80}  />
              <StatCard icon={FileText}     label="Bills Today"          value={summary?.consignments?.registered_today || 0}  accentColor="#a855f7" delay={160} />
              <StatCard icon={CheckCircle}  label="Delivered Today"      value={summary?.consignments?.delivered_today || 0}   accentColor="#22c55e" delay={240} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ animation: 'fadeInUp 0.5s ease-out 300ms both' }}>
              {/* Quick Actions */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="icon-container-blue w-8 h-8 text-sm">
                    <Zap size={14} />
                  </div>
                  <h3 className="section-title">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link to="/consignments?new=1" className="btn-primary justify-center py-3 rounded-xl">
                    <Plus size={15} /> New Consignment
                  </Link>
                  <Link to="/dispatch" className="btn-secondary justify-center py-3">
                    <FileText size={15} /> Dispatch Docs
                  </Link>
                  <Link to="/consignments" className="btn-secondary justify-center py-3">
                    <Package size={15} /> Track Consignment
                  </Link>
                  <Link to="/bills" className="btn-secondary justify-center py-3">
                    <FileText size={15} /> View Bills
                  </Link>
                </div>
              </div>

              {/* Pending Volume Alerts */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 shrink-0">
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <h3 className="section-title">Pending Volume Alerts</h3>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {pendingVols.length > 0 ? pendingVols.map(v => (
                    <AlertCard
                      key={v.destination}
                      destination={v.destination}
                      volume={v.pendingVolume}
                      percentage={v.thresholdPercentage}
                    />
                  )) : (
                    <div className="text-center py-6">
                      <CheckCircle size={28} className="mx-auto mb-2 text-green-500 opacity-60" />
                      <p className="text-gray-500 text-sm">No pending consignments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Transport Manager Section ─────────────────────────────────── */}
        {(isManager() || isAdmin()) && (
          <>
            {!isOperator() && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Truck}       label="Available Trucks"         value={summary?.trucks?.available || 0}                   accentColor="#22c55e" delay={0}   />
                <StatCard icon={Activity}    label="In Transit"               value={summary?.trucks?.in_transit || 0}                  accentColor="#f59e0b" delay={80}  />
                <StatCard icon={Package}     label="In Transit Consignments"  value={summary?.consignments?.in_transit_count || 0}      accentColor="#3b82f6" delay={160} />
                <StatCard icon={TrendingUp}  label="Today's Revenue"          value={formatCurrency(summary?.consignments?.today_revenue)} accentColor="#a855f7" delay={240} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ animation: 'fadeInUp 0.5s ease-out 280ms both' }}>
              {/* Fleet Donut Chart */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="section-title">Fleet Status Overview</h3>
                  <Link to="/fleet" className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1 transition-colors">
                    View fleet <ArrowRight size={11} />
                  </Link>
                </div>
                {truckPieData.length > 0 ? (
                  <div className="flex items-center gap-5">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={truckPieData}
                          cx="50%" cy="50%"
                          innerRadius={44} outerRadius={72}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#0a0f1e"
                        >
                          {truckPieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[entry.name] || '#6b7280'}
                              style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS[entry.name] || '#6b7280'}60)` }}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {truckPieData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: PIE_COLORS[d.name], boxShadow: `0 0 6px ${PIE_COLORS[d.name]}60` }}
                            />
                            <span className="text-gray-400 group-hover:text-gray-200 transition-colors text-xs">{d.name}</span>
                          </div>
                          <span className="font-bold text-white text-sm">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Truck size={32} className="mx-auto mb-2 text-gray-600 opacity-40" />
                    <p className="text-gray-500 text-sm">No fleet data</p>
                  </div>
                )}
              </div>

              {/* Pending Volume Bar Chart */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="section-title">Pending Volume by Destination</h3>
                  <Link to="/consignments" className="text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1 transition-colors">
                    View all <ArrowRight size={11} />
                  </Link>
                </div>
                {pendingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pendingChartData} barCategoryGap="30%">
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar
                        dataKey="volume"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                        fill="url(#barGradient)"
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2980ff" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#0066ff" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10">
                    <Package size={32} className="mx-auto mb-2 text-gray-600 opacity-40" />
                    <p className="text-gray-500 text-sm">No pending consignments</p>
                  </div>
                )}
              </div>
            </div>

            {/* Allocation Alerts */}
            {pendingVols.filter(v => v.nearingThreshold).length > 0 && (
              <div
                className="glass-card p-5"
                style={{
                  border: '1px solid rgba(245,158,11,0.35)',
                  boxShadow: '0 0 30px rgba(245,158,11,0.08)',
                  animation: 'fadeInUp 0.5s ease-out 350ms both',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 shrink-0">
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <h3 className="section-title">Allocation Alerts — Destinations Nearing 500 m³</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingVols.filter(v => v.nearingThreshold).map(v => (
                    <AlertCard
                      key={v.destination}
                      destination={v.destination}
                      volume={v.pendingVolume}
                      percentage={v.thresholdPercentage}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Admin System Overview ─────────────────────────────────────── */}
        {isAdmin() && (
          <div
            className="glass-card p-5"
            style={{ animation: 'fadeInUp 0.5s ease-out 400ms both' }}
          >
            <h3 className="section-title mb-4">System Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Trucks',          value: summary?.trucks?.total || 0,                          color: '#3b82f6' },
                { label: "Today's Consignments",  value: parseInt(summary?.consignments?.today_count) || 0,    color: '#22c55e' },
                { label: 'Active Routes',         value: pendingVols.length,                                   color: '#f59e0b' },
                { label: 'Revenue Today',         value: formatCurrency(summary?.consignments?.today_revenue), color: '#a855f7' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="text-center p-4 rounded-xl transition-all duration-200 hover:scale-105"
                  style={{
                    background: `${color}0a`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
