import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Truck, MapPin, Package, Clock, AlertTriangle,
  CheckCircle, ChevronRight, Users, FileText, CheckSquare, Loader2, Plus, Eye
} from 'lucide-react'
import { trucksAPI, allocationAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { formatDateTime, formatVolume, formatCurrency, getStatusBadgeClass, TRUCK_STATUSES } from '../lib/utils'
import Header from '../components/Layout/Header'
import { PageLoader } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'

// ── Status colors ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Available:        { accent: '#22c55e',  bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
  Allocated:        { accent: '#3b82f6',  bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  InTransit:        { accent: '#f59e0b',  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  Loading:          { accent: '#a855f7',  bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)' },
  Unloading:        { accent: '#f97316',  bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  UnderMaintenance: { accent: '#ef4444',  bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
}

// ── Capacity Ring ──────────────────────────────────────────────────────────
function CapacityRing({ cargo, capacity }) {
  const pct = capacity > 0 ? Math.min(cargo / capacity * 100, 100) : 0
  const overCapacity = cargo > capacity
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ

  const ringColor = overCapacity ? '#ef4444' : pct > 80 ? '#f59e0b' : '#0066ff'

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Fill */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${ringColor})`, transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className={`text-2xl font-bold ${overCapacity ? 'text-red-400' : 'text-white'}`}>
          {pct.toFixed(0)}%
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">utilized</div>
      </div>
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
      .then(({ data }) => setConsignments(data.consignments || data || []))
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Failed to load consignments' }))
      .finally(() => setLoading(false))
  }, [destFilter])

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedItems = consignments.filter(c => selected.includes(c.consignment_number || c.id))
  const totalVolume = selectedItems.reduce((sum, c) => sum + parseFloat(c.volume || 0), 0)
  const currentCargo = parseFloat(truck.cargo_volume || 0)
  const capacity = parseFloat(truck.capacity || 0)
  const wouldExceed = currentCargo + totalVolume > capacity

  const handleAssign = async () => {
    if (!selected.length) {
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
      <div className="flex items-center gap-3 p-3 rounded-xl bg-electric-500/10 border border-electric-500/20">
        <div className="icon-container-blue"><Truck size={16} /></div>
        <div>
          <div className="text-sm font-semibold text-white">{truck.registration_number}</div>
          <div className="text-xs text-gray-400">
            Capacity: {formatVolume(truck.capacity)} · Loaded: {formatVolume(truck.cargo_volume)}
          </div>
        </div>
        {truck.destination && (
          <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={10} />{truck.destination}
          </div>
        )}
      </div>

      <div>
        <label className="label">Filter by Destination</label>
        <input
          className="input-field"
          placeholder="Type destination to filter…"
          value={destFilter}
          onChange={e => setDestFilter(e.target.value)}
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : consignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No assignable consignments{destFilter ? ` for "${destFilter}"` : ''}
          </div>
        ) : (
          consignments.map(c => {
            const cId = c.consignment_number || c.id
            const isSel = selected.includes(cId)
            return (
              <label key={cId}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                  isSel ? 'bg-electric-500/15 border-electric-500/30' : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <input type="checkbox" checked={isSel} onChange={() => toggleSelect(cId)}
                  className="rounded accent-blue-500 w-3.5 h-3.5 shrink-0" />
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

      {selected.length > 0 && (
        <div className={`p-3 rounded-xl border text-sm ${wouldExceed ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className={wouldExceed ? 'text-red-400' : 'text-green-400'}>
              {selected.length} selected · +{formatVolume(totalVolume)}
            </span>
            {wouldExceed && (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <AlertTriangle size={12} />
                Exceeds by {formatVolume(currentCargo + totalVolume - capacity)}
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
          {assigning ? 'Assigning…' : `Assign${selected.length > 0 ? ` (${selected.length})` : ''}`}
        </button>
      </div>
    </div>
  )
}

// ── FleetDetail page ────────────────────────────────────────────────────────
export default function FleetDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { isAdmin, isManager } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', note: '', currentLocation: '', destination: '' })
  const [updating, setUpdating] = useState(false)

  const fetchData = () => {
    trucksAPI.getById(id)
      .then(({ data: d }) => setData(d))
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Truck not found' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      const { data: updated } = await trucksAPI.updateStatus(id, statusForm)
      setData(prev => ({ ...prev, truck: updated.truck }))
      setShowStatusModal(false)
      toast({ type: 'success', title: 'Updated', message: `Truck status changed to ${statusForm.status}` })
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div><Header /><PageLoader /></div>
  if (!data) return <div><Header /><div className="p-6 text-gray-400">Truck not found</div></div>

  const { truck, consignments, dispatches } = data
  const history = Array.isArray(truck.status_history) ? [...truck.status_history].reverse() : []
  const canUpdate = isAdmin() || isManager()
  const canAssign = isAdmin() || isManager()

  const statusConf = STATUS_COLORS[truck.status] || { accent: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' }
  const cargo = parseFloat(truck.cargo_volume || 0)
  const capacity = parseFloat(truck.capacity || 0)
  const utilPct = capacity > 0 ? Math.min(cargo / capacity * 100, 100) : 0
  const overCapacity = cargo > capacity
  const assignable = truck.status === 'Available' || truck.status === 'Allocated'

  return (
    <div>
      <Header
        title="Truck Detail"
        actions={
          <Link to="/fleet" className="btn-secondary">
            <ArrowLeft size={16} /> Back to Fleet
          </Link>
        }
      />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Over-capacity warning banner */}
        {overCapacity && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/40 bg-red-500/10 animate-scale-in">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-300">Cargo Exceeds Capacity</div>
              <div className="text-xs text-red-400/80 mt-0.5">
                Loaded {formatVolume(cargo)} but capacity is {formatVolume(capacity)} — over by {formatVolume(cargo - capacity)}
              </div>
            </div>
          </div>
        )}

        {/* Hero header card */}
        <div
          className="glass-card p-6 overflow-hidden relative"
          style={{
            border: `1px solid ${statusConf.border}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${statusConf.bg}`,
          }}
        >
          {/* Background gradient overlay */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 80% at 100% 0%, ${statusConf.bg}, transparent)`,
            }}
          />

          <div className="relative flex flex-wrap items-start justify-between gap-5">
            {/* Left: truck info */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
                style={{ background: statusConf.bg, border: `1px solid ${statusConf.border}` }}
              >
                <Truck size={26} style={{ color: statusConf.accent }} />
                {truck.status === 'Available' && (
                  <span
                    className="absolute inset-0 rounded-2xl animate-ping-slow opacity-20"
                    style={{ background: statusConf.accent }}
                  />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono tracking-wide">
                  {truck.registration_number}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Users size={13} className="text-gray-500" />
                    {truck.driver_name}
                  </div>
                  {truck.driver_license && (
                    <div className="text-xs text-gray-600 font-mono">#{truck.driver_license}</div>
                  )}
                </div>
                {(truck.current_location || truck.destination) && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400">
                    <MapPin size={12} className="text-amber-400 shrink-0" />
                    <span>{truck.current_location || '—'}</span>
                    {truck.destination && (
                      <>
                        <ChevronRight size={12} className="text-gray-600" />
                        <span className="text-gray-300">{truck.destination}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: status + actions */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: statusConf.accent, boxShadow: `0 0 8px ${statusConf.accent}` }}
                  />
                  {truck.status === 'Available' && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping-slow opacity-50"
                      style={{ background: statusConf.accent }}
                    />
                  )}
                </div>
                <span
                  className="px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: statusConf.bg, border: `1px solid ${statusConf.border}`, color: statusConf.accent }}
                >
                  {truck.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canAssign && assignable && (
                  <button onClick={() => setShowAssignModal(true)} className="btn-secondary py-1.5 text-xs gap-1.5">
                    <CheckSquare size={13} /> Assign Consignments
                  </button>
                )}
                {canUpdate && (
                  <button
                    onClick={() => {
                      setStatusForm({ status: truck.status, note: '', currentLocation: truck.current_location || '', destination: truck.destination || '' })
                      setShowStatusModal(true)
                    }}
                    className="btn-secondary py-1.5 text-xs"
                  >
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Capacity section */}
          <div className="relative mt-5 pt-5 border-t border-white/10 flex flex-wrap items-center gap-6">
            <CapacityRing cargo={cargo} capacity={capacity} />

            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Capacity</div>
                  <div className="text-white font-semibold">{formatVolume(capacity)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Cargo Volume</div>
                  <div className={`font-semibold ${overCapacity ? 'text-red-400' : 'text-white'}`}>
                    {formatVolume(cargo)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Available Space</div>
                  <div className={`font-semibold ${overCapacity ? 'text-red-400' : 'text-green-400'}`}>
                    {formatVolume(Math.max(capacity - cargo, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Consignments</div>
                  <div className="text-white font-semibold">{consignments?.length || 0}</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Cargo Utilization</span>
                  <span className={overCapacity ? 'text-red-400 font-semibold' : ''}>{utilPct.toFixed(1)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar-fill ${overCapacity ? 'red' : utilPct > 80 ? 'amber' : 'blue'} shimmer`}
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: consignments + dispatches */}
          <div className="lg:col-span-2 space-y-5">

            {/* Assigned Consignments */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title flex items-center gap-2">
                  <Package size={18} className="text-electric-400" />
                  Assigned Consignments
                  <span className="text-gray-500 font-normal text-base">({consignments?.length || 0})</span>
                </h3>
                {canAssign && assignable && (
                  <button onClick={() => setShowAssignModal(true)} className="btn-secondary py-1 px-3 text-xs gap-1.5">
                    <Plus size={12} /> Assign More
                  </button>
                )}
              </div>

              {consignments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Number', 'Volume', 'Destination', 'Status', 'Charges'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {consignments.map((c, idx) => (
                        <tr
                          key={c.consignment_number}
                          className="table-row"
                          style={{ animationDelay: `${idx * 30}ms`, animation: 'fadeIn 0.3s ease-out both' }}
                        >
                          <td className="px-3 py-2.5">
                            <Link
                              to={`/consignments/${c.consignment_number}`}
                              className="font-mono text-electric-400 text-xs hover:text-electric-300 transition-colors"
                            >
                              {c.consignment_number}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-gray-300">{formatVolume(c.volume)}</td>
                          <td className="px-3 py-2.5 text-gray-300">{c.destination}</td>
                          <td className="px-3 py-2.5">
                            <span className={getStatusBadgeClass(c.status)}>{c.status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-amber-400 font-medium">{formatCurrency(c.transport_charges)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={32} className="mx-auto mb-2 text-gray-600 opacity-40" />
                  <p className="text-gray-500 text-sm">No consignments assigned</p>
                  {canAssign && assignable && (
                    <button onClick={() => setShowAssignModal(true)} className="btn-primary mx-auto mt-3 text-xs">
                      <Plus size={12} /> Assign Consignments
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dispatch History */}
            <div className="glass-card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                Dispatch History
                <span className="text-gray-500 font-normal text-base">({dispatches?.length || 0})</span>
              </h3>
              {dispatches?.length > 0 ? (
                <div className="space-y-2">
                  {dispatches.map(d => (
                    <div
                      key={d.dispatch_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{d.destination}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(d.dispatch_timestamp)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-gray-300">{d.total_consignments} pkgs</div>
                        <div className="text-xs text-gray-500">{formatVolume(d.total_volume)}</div>
                      </div>
                      <span className={getStatusBadgeClass(d.dispatch_status)}>{d.dispatch_status}</span>
                      <Link
                        to={`/dispatch/${d.dispatch_id}`}
                        className="btn-secondary py-1 px-2.5 text-xs shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <Eye size={11} /> View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-4 text-center">No dispatch history</p>
              )}
            </div>
          </div>

          {/* Right: Status Timeline */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-5 flex items-center gap-2">
              <Clock size={18} className="text-electric-400" />
              Status History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-0">
                {history.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 shrink-0 transition-all ${i === 0 ? 'timeline-dot-active' : 'bg-gray-700'}`}
                        style={i === 0 ? {} : {}}
                      />
                      {i < history.length - 1 && (
                        <div className="timeline-line" />
                      )}
                    </div>
                    <div className={`pb-4 flex-1 ${i === 0 ? 'text-white' : 'text-gray-500'}`}>
                      <div className={`text-sm font-semibold flex items-center gap-1.5 ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                        {i === 0 && <CheckCircle size={12} className="text-electric-400 shrink-0" />}
                        {entry.status}
                      </div>
                      <div className="text-xs mt-0.5 text-gray-600">{formatDateTime(entry.timestamp)}</div>
                      {entry.note && (
                        <div className="text-xs italic mt-1 text-gray-600 bg-white/5 rounded px-2 py-1">{entry.note}</div>
                      )}
                      {entry.location && (
                        <div className="text-xs mt-0.5 text-gray-600 flex items-center gap-1">
                          <MapPin size={9} />{entry.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No status history</p>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Truck Status" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">New Status</label>
            <select
              value={statusForm.status}
              onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
              className="select-field"
            >
              {TRUCK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Current Location</label>
            <input
              value={statusForm.currentLocation}
              onChange={e => setStatusForm(p => ({ ...p, currentLocation: e.target.value }))}
              className="input-field" placeholder="City name"
            />
          </div>
          <div>
            <label className="label">Destination</label>
            <input
              value={statusForm.destination}
              onChange={e => setStatusForm(p => ({ ...p, destination: e.target.value }))}
              className="input-field" placeholder="Destination city"
            />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea
              value={statusForm.note}
              onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
              className="input-field" rows={2}
              placeholder="Reason for status change…"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleStatusUpdate} className="btn-primary flex-1 justify-center" disabled={updating}>
              {updating ? <Loader2 size={14} className="animate-spin" /> : null}
              {updating ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Consignments Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Consignments — ${truck.registration_number}`}
        size="lg"
      >
        <AssignModal
          truck={truck}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => { fetchData(); setShowAssignModal(false) }}
        />
      </Modal>
    </div>
  )
}
