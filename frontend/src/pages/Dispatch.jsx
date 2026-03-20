import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, Plus, Truck, Eye, RefreshCw, CheckCircle, FileText, Loader2 } from 'lucide-react'
import { dispatchAPI, trucksAPI } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { formatDateTime, formatVolume, getStatusBadgeClass } from '../lib/utils'
import Header from '../components/Layout/Header'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'

// ── Status config for filter pills ────────────────────────────────────────
const DISPATCH_STATUSES = ['', 'Dispatched', 'InTransit', 'Delivered', 'Cancelled']

const STATUS_PILL_COLORS = {
  '':          { dot: null,           accent: '#6b7280' },
  Dispatched:  { dot: 'bg-blue-400',  accent: '#3b82f6' },
  InTransit:   { dot: 'bg-amber-400', accent: '#f59e0b' },
  Delivered:   { dot: 'bg-green-400', accent: '#22c55e' },
  Cancelled:   { dot: 'bg-red-400',   accent: '#ef4444' },
}

// ── GenerateDispatchForm ───────────────────────────────────────────────────
function GenerateDispatchForm({ onSuccess, onClose }) {
  const toast = useToast()
  const [trucks, setTrucks] = useState([])
  const [selectedTruck, setSelectedTruck] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTrucks, setLoadingTrucks] = useState(true)

  useEffect(() => {
    trucksAPI.getAll({ status: 'Allocated' })
      .then(({ data }) => setTrucks(data.trucks || []))
      .catch(() => {})
      .finally(() => setLoadingTrucks(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTruck) {
      toast({ type: 'error', title: 'Error', message: 'Please select a truck' })
      return
    }
    setLoading(true)
    try {
      // Convert datetime-local value to proper ISO string
      const dt = departureTime ? new Date(departureTime).toISOString() : undefined

      const { data } = await dispatchAPI.create({
        truckId: selectedTruck,
        departureTime: dt,
      })
      toast({
        type: 'success',
        title: 'Dispatch Generated',
        message: `Document ${data.dispatch.dispatch_id.substring(0, 8)}… created`,
      })
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
      <div>
        <label className="label">Select Allocated Truck *</label>
        {loadingTrucks ? (
          <div className="input-field text-gray-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading trucks…
          </div>
        ) : (
          <select
            value={selectedTruck}
            onChange={e => setSelectedTruck(e.target.value)}
            className="select-field"
            required
          >
            <option value="">Select a truck</option>
            {trucks.map(t => (
              <option key={t.truck_id} value={t.truck_id}>
                {t.registration_number} — {t.driver_name} → {t.destination} ({formatVolume(t.cargo_volume)} loaded)
              </option>
            ))}
          </select>
        )}
        {!loadingTrucks && trucks.length === 0 && (
          <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            No trucks in Allocated status. Run allocation first.
          </p>
        )}
      </div>

      <div>
        <label className="label">Departure Time</label>
        <input
          type="datetime-local"
          value={departureTime}
          onChange={e => setDepartureTime(e.target.value)}
          className="input-field"
        />
        <p className="text-xs text-gray-500 mt-1">Leave blank to use current time</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={loading || trucks.length === 0}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? 'Generating…' : 'Generate Dispatch'}
        </button>
      </div>
    </form>
  )
}

// ── Dispatch page ──────────────────────────────────────────────────────────
export default function Dispatch() {
  const navigate = useNavigate()
  const toast = useToast()
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchDispatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const { data } = await dispatchAPI.getAll(params)
      setDispatches(data.dispatches || [])
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to load dispatch documents' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchDispatches() }, [fetchDispatches])

  // Counts per status
  const statusCounts = dispatches.reduce((acc, d) => {
    acc[d.dispatch_status] = (acc[d.dispatch_status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <Header
        title="Dispatch Documents"
        actions={
          <button onClick={() => setShowGenerate(true)} className="btn-primary">
            <Plus size={16} /> Generate Dispatch
          </button>
        }
      />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DISPATCH_STATUSES.map(s => {
            const isActive = statusFilter === s
            const cfg = STATUS_PILL_COLORS[s] || STATUS_PILL_COLORS['']
            const count = s === '' ? dispatches.length : (statusCounts[s] || 0)
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
                style={isActive ? {
                  background: `${cfg.accent}25`,
                  borderColor: `${cfg.accent}50`,
                  color: cfg.accent,
                } : {}}
              >
                {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                {s || 'All'}
                {count > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={isActive
                      ? { background: `${cfg.accent}30`, color: cfg.accent }
                      : { background: 'rgba(255,255,255,0.08)', color: '#6b7280' }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          <button
            onClick={fetchDispatches}
            className="btn-secondary ml-auto py-1.5 px-3 gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="flex items-center justify-between px-5 py-3 table-header">
            <span className="text-sm font-medium text-gray-300">
              {dispatches.length} document{dispatches.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>

          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={7} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    {['Dispatch ID', 'Truck', 'Destination', 'Driver', 'Pkgs', 'Volume', 'Dispatched', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispatches.length > 0 ? dispatches.map((d, idx) => (
                    <tr
                      key={d.dispatch_id}
                      className="table-row cursor-pointer"
                      style={{ animationDelay: `${idx * 30}ms`, animation: 'fadeIn 0.3s ease-out both' }}
                      onClick={() => navigate(`/dispatch/${d.dispatch_id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-electric-400 text-xs">
                          {d.dispatch_id.substring(0, 12)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Truck size={12} className="text-gray-500 shrink-0" />
                          <span className="text-white font-medium">{d.truck_reg_number || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{d.destination}</td>
                      <td className="px-4 py-3 text-gray-300">{d.driver_name}</td>
                      <td className="px-4 py-3 text-gray-300">{d.total_consignments}</td>
                      <td className="px-4 py-3 text-gray-300">{formatVolume(d.total_volume)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDateTime(d.dispatch_timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadgeClass(d.dispatch_status)}>{d.dispatch_status}</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Link
                          to={`/dispatch/${d.dispatch_id}`}
                          className="btn-secondary py-1 px-2.5 text-xs gap-1.5"
                        >
                          <Eye size={11} /> View
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <Send size={40} className="text-gray-600 opacity-40 animate-float" />
                          </div>
                          <p className="text-gray-500 font-medium">No dispatch documents found</p>
                          <p className="text-gray-600 text-sm">
                            {statusFilter ? `No documents with status "${statusFilter}"` : 'Generate your first dispatch document'}
                          </p>
                          {!statusFilter && (
                            <button onClick={() => setShowGenerate(true)} className="btn-primary mt-1">
                              <Plus size={14} /> Generate Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        title="Generate Dispatch Document"
        size="md"
      >
        <GenerateDispatchForm onSuccess={fetchDispatches} onClose={() => setShowGenerate(false)} />
      </Modal>
    </div>
  )
}
