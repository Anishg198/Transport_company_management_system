import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Truck, MapPin, Package, RefreshCw, Eye, Users,
  AlertTriangle, CheckSquare, X, ChevronRight, Loader2
} from 'lucide-react'
import { trucksAPI, allocationAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { formatVolume, getStatusBadgeClass, TRUCK_STATUSES } from '../lib/utils'
import Header from '../components/Layout/Header'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Available:        { dot: 'bg-green-400',  border: 'border-green-500/30',  glow: 'rgba(34,197,94,0.12)',   pulse: true },
  Allocated:        { dot: 'bg-blue-400',   border: 'border-blue-500/30',   glow: 'rgba(59,130,246,0.12)',  pulse: false },
  InTransit:        { dot: 'bg-amber-400',  border: 'border-amber-500/30',  glow: 'rgba(245,158,11,0.12)',  pulse: false },
  Loading:          { dot: 'bg-purple-400', border: 'border-purple-500/30', glow: 'rgba(168,85,247,0.12)',  pulse: false },
  Unloading:        { dot: 'bg-orange-400', border: 'border-orange-500/30', glow: 'rgba(249,115,22,0.12)',  pulse: false },
  UnderMaintenance: { dot: 'bg-red-400',    border: 'border-red-500/30',    glow: 'rgba(239,68,68,0.12)',   pulse: false },
}

const STATUS_FILTER_COLORS = {
  '':               'from-white/10 to-white/5',
  Available:        'from-green-500/20 to-green-500/5',
  Allocated:        'from-blue-500/20 to-blue-500/5',
  InTransit:        'from-amber-500/20 to-amber-500/5',
  Loading:          'from-purple-500/20 to-purple-500/5',
  Unloading:        'from-orange-500/20 to-orange-500/5',
  UnderMaintenance: 'from-red-500/20 to-red-500/5',
}

// ── TruckCard ──────────────────────────────────────────────────────────────
function TruckCard({ truck, onClick, onAssign, canAssign, style }) {
  const cfg = STATUS_CONFIG[truck.status] || { dot: 'bg-gray-400', border: 'border-white/10', glow: 'transparent', pulse: false }
  const pct = parseFloat(truck.capacity) > 0
    ? Math.min(parseFloat(truck.cargo_volume || 0) / parseFloat(truck.capacity) * 100, 100)
    : 0
  const overCapacity = parseFloat(truck.cargo_volume || 0) > parseFloat(truck.capacity)

  const assignable = truck.status === 'Available' || truck.status === 'Allocated'

  const barColor = overCapacity ? 'red' : pct > 80 ? 'amber' : 'blue'

  return (
    <div
      className={`truck-card border ${cfg.border}`}
      style={{
        ...style,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 0 40px ${cfg.glow}`,
      }}
    >
      {/* Card top: reg + status */}
      <div className="flex items-start justify-between mb-3" onClick={onClick}>
        <div className="flex items-center gap-2.5 cursor-pointer">
          {/* Status dot */}
          <div className="relative shrink-0">
            <div className={`status-dot ${cfg.dot}`} />
            {cfg.pulse && (
              <span
                className="absolute inset-0 rounded-full animate-ping-slow opacity-50"
                style={{ background: cfg.dot.replace('bg-', '') }}
              />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm font-mono tracking-wide">{truck.registration_number}</div>
            {truck.driver_name && (
              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Users size={9} className="shrink-0" />
                {truck.driver_name}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {overCapacity && (
            <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] py-0.5">
              <AlertTriangle size={9} className="mr-0.5" />
              Over
            </span>
          )}
          <span className={getStatusBadgeClass(truck.status)}>{truck.status}</span>
        </div>
      </div>

      {/* Location */}
      {(truck.current_location || truck.destination) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5" onClick={onClick}>
          <MapPin size={10} className="shrink-0 text-amber-400" />
          <span className="truncate">{truck.current_location || '—'}</span>
          {truck.destination && (
            <>
              <ChevronRight size={10} className="shrink-0 text-gray-600" />
              <span className="truncate text-gray-500">{truck.destination}</span>
            </>
          )}
        </div>
      )}

      {/* Capacity bar */}
      <div onClick={onClick}>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <div className="flex items-center gap-1">
            <Package size={9} className="shrink-0" />
            <span>{formatVolume(truck.cargo_volume)} / {formatVolume(truck.capacity)}</span>
          </div>
          <span className={overCapacity ? 'text-red-400 font-semibold' : pct > 80 ? 'text-amber-400' : ''}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill ${barColor} ${pct > 0 ? 'shimmer' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Assign button */}
      {canAssign && assignable && (
        <button
          onClick={(e) => { e.stopPropagation(); onAssign(truck) }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
          style={{
            background: 'rgba(0,102,255,0.08)',
            borderColor: 'rgba(0,102,255,0.25)',
            color: '#5599ff',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,102,255,0.18)'
            e.currentTarget.style.borderColor = 'rgba(0,102,255,0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,102,255,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,102,255,0.25)'
          }}
        >
          <CheckSquare size={11} />
          Assign Consignments
        </button>
      )}
    </div>
  )
}

// ── AssignModal ────────────────────────────────────────────────────────────
function AssignModal({ truck, onClose, onSuccess }) {
  const toast = useToast()
  const [consignments, setConsignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [destFilter, setDestFilter] = useState(truck.destination || '')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (destFilter) params.destination = destFilter
    allocationAPI.assignableConsignments(params)
      .then(({ data }) => {
        setConsignments(data.consignments || data || [])
      })
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Failed to load consignments' }))
      .finally(() => setLoading(false))
  }, [destFilter])

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedConsignments = consignments.filter(c => selected.includes(c.consignment_number || c.id))
  const totalVolume = selectedConsignments.reduce((sum, c) => sum + parseFloat(c.volume || 0), 0)
  const currentCargo = parseFloat(truck.cargo_volume || 0)
  const capacity = parseFloat(truck.capacity || 0)
  const wouldExceed = currentCargo + totalVolume > capacity

  const handleAssign = async () => {
    if (selected.length === 0) {
      toast({ type: 'error', title: 'None selected', message: 'Select at least one consignment' })
      return
    }
    setAssigning(true)
    try {
      await allocationAPI.manualAssign({ truckId: truck.truck_id, consignmentIds: selected })
      toast({ type: 'success', title: 'Assigned', message: `${selected.length} consignment(s) assigned to ${truck.registration_number}` })
      onSuccess()
      onClose()
    } catch (err) {
      toast({ type: 'error', title: 'Assignment Failed', message: err.response?.data?.error || err.message })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Truck summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-electric-500/10 border border-electric-500/20">
        <div className="icon-container-blue">
          <Truck size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{truck.registration_number}</div>
          <div className="text-xs text-gray-400">
            Capacity: {formatVolume(truck.capacity)} · Loaded: {formatVolume(truck.cargo_volume)}
          </div>
        </div>
        {truck.destination && (
          <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={10} />
            {truck.destination}
          </div>
        )}
      </div>

      {/* Destination filter */}
      <div>
        <label className="label">Filter by Destination</label>
        <input
          className="input-field"
          placeholder="Type destination to filter…"
          value={destFilter}
          onChange={e => setDestFilter(e.target.value)}
        />
      </div>

      {/* Consignment list */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading consignments…
          </div>
        ) : consignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No assignable consignments{destFilter ? ` for "${destFilter}"` : ''}
          </div>
        ) : (
          consignments.map(c => {
            const cId = c.consignment_number || c.id
            const isSelected = selected.includes(cId)
            return (
              <label
                key={cId}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-electric-500/15 border-electric-500/30'
                    : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(cId)}
                  className="rounded accent-blue-500 w-3.5 h-3.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-electric-400">{cId}</div>
                  <div className="text-xs text-gray-400 truncate">{c.destination || c.consignee_city}</div>
                </div>
                <div className="text-xs text-gray-300 shrink-0">{formatVolume(c.volume)}</div>
              </label>
            )
          })
        )}
      </div>

      {/* Summary */}
      {selected.length > 0 && (
        <div className={`p-3 rounded-xl border text-sm ${
          wouldExceed
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-green-500/10 border-green-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className={wouldExceed ? 'text-red-400' : 'text-green-400'}>
              {selected.length} selected · +{formatVolume(totalVolume)}
            </span>
            {wouldExceed && (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <AlertTriangle size={12} />
                Exceeds capacity by {formatVolume(currentCargo + totalVolume - capacity)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button
          onClick={handleAssign}
          disabled={assigning || selected.length === 0}
          className="btn-primary flex-1 justify-center"
          style={wouldExceed ? { background: '#b45309', boxShadow: '0 0 20px rgba(180,83,9,0.3)' } : {}}
        >
          {assigning ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
          {assigning ? 'Assigning…' : `Assign ${selected.length > 0 ? `(${selected.length})` : ''}`}
        </button>
      </div>
    </div>
  )
}

// ── AddTruckForm ───────────────────────────────────────────────────────────
function AddTruckForm({ onSuccess, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({
    registrationNumber: '', capacity: '', driverName: '',
    driverLicense: '', currentLocation: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await trucksAPI.create(form)
      toast({ type: 'success', title: 'Truck Added', message: `Truck ${form.registrationNumber} registered` })
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
          <label className="label">Registration Number *</label>
          <input
            value={form.registrationNumber}
            onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))}
            className="input-field" placeholder="e.g. MH-12-AB-1234" required
          />
        </div>
        <div>
          <label className="label">Capacity (m³) *</label>
          <input
            type="number" step="0.01" min="1"
            value={form.capacity}
            onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
            className="input-field" placeholder="e.g. 800" required
          />
        </div>
        <div>
          <label className="label">Driver Name *</label>
          <input
            value={form.driverName}
            onChange={e => setForm(p => ({ ...p, driverName: e.target.value }))}
            className="input-field" placeholder="Full name" required
          />
        </div>
        <div>
          <label className="label">Driver License *</label>
          <input
            value={form.driverLicense}
            onChange={e => setForm(p => ({ ...p, driverLicense: e.target.value }))}
            className="input-field" placeholder="License number" required
          />
        </div>
        <div className="col-span-2">
          <label className="label">Current Location</label>
          <input
            value={form.currentLocation}
            onChange={e => setForm(p => ({ ...p, currentLocation: e.target.value }))}
            className="input-field" placeholder="e.g. Mumbai"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {loading ? 'Adding…' : 'Add Truck'}
        </button>
      </div>
    </form>
  )
}

// ── Fleet page ─────────────────────────────────────────────────────────────
export default function Fleet() {
  const { isAdmin, isManager } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [assignTruck, setAssignTruck] = useState(null)

  const fetchTrucks = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const { data } = await trucksAPI.getAll(params)
      setTrucks(data.trucks || [])
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to load fleet' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchTrucks() }, [fetchTrucks])

  const canAdd = isAdmin() || isManager()
  const canAssign = isAdmin() || isManager()

  const allStatuses = [
    { status: '', label: 'All', count: trucks.length },
    ...TRUCK_STATUSES.map(s => ({ status: s, label: s, count: trucks.filter(t => t.status === s).length }))
  ]

  return (
    <div>
      <Header
        title="Fleet Management"
        actions={
          canAdd && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} /> Add Truck
            </button>
          )
        }
      />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(({ status, label, count }) => {
            const isActive = statusFilter === status
            const cfg = STATUS_CONFIG[status]
            return (
              <button
                key={label}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'border-electric-500/50 text-electric-400 bg-electric-500/15'
                    : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {cfg && (
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                )}
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-electric-500/30 text-electric-300' : 'bg-white/10 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="section-title">
              {statusFilter ? statusFilter : 'All Trucks'}
              <span className="text-gray-500 font-normal text-base ml-2">({trucks.length})</span>
            </h3>
          </div>
          <button onClick={fetchTrucks} className="btn-secondary py-1.5 px-3 gap-1.5">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : trucks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trucks.map((truck, idx) => (
              <TruckCard
                key={truck.truck_id}
                truck={truck}
                onClick={() => navigate(`/fleet/${truck.truck_id}`)}
                onAssign={setAssignTruck}
                canAssign={canAssign}
                style={{ animationDelay: `${idx * 50}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-16 text-center">
            <div className="relative inline-block mb-4">
              <Truck size={52} className="text-gray-600 opacity-40 animate-float" />
              <div
                className="absolute -inset-4 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.4), transparent)' }}
              />
            </div>
            <p className="text-gray-400 font-medium">No trucks found</p>
            <p className="text-gray-600 text-sm mt-1">
              {statusFilter ? `No trucks with status "${statusFilter}"` : 'Add your first truck to get started'}
            </p>
            {canAdd && !statusFilter && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mx-auto mt-4">
                <Plus size={14} /> Add First Truck
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Truck Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Truck" size="lg">
        <AddTruckForm onSuccess={fetchTrucks} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Assign Consignments Modal */}
      <Modal
        isOpen={!!assignTruck}
        onClose={() => setAssignTruck(null)}
        title={`Assign Consignments — ${assignTruck?.registration_number || ''}`}
        size="lg"
      >
        {assignTruck && (
          <AssignModal
            truck={assignTruck}
            onClose={() => setAssignTruck(null)}
            onSuccess={fetchTrucks}
          />
        )}
      </Modal>
    </div>
  )
}
