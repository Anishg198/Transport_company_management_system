import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Filter, Package, Eye, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { consignmentsAPI, pricingAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { formatDateTime, formatCurrency, formatVolume, getStatusBadgeClass, DESTINATIONS, CONSIGNMENT_STATUSES } from '../lib/utils'
import Header from '../components/Layout/Header'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'

function RegisterForm({ onSuccess, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({ volume: '', destination: '', senderAddress: '', receiverAddress: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.volume || !form.destination || !form.senderAddress || !form.receiverAddress) {
      toast({ type: 'error', title: 'Validation Error', message: 'All fields are required' })
      return
    }
    setLoading(true)
    try {
      const { data } = await consignmentsAPI.create({ ...form, volume: parseFloat(form.volume) })
      setResult(data)
      onSuccess()
      if (data.billingWarning) {
        toast({ type: 'warning', title: 'Billing Notice', message: data.billingWarning })
      } else {
        toast({ type: 'success', title: 'Consignment Registered', message: `${data.consignment.consignment_number} created` })
      }
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const { consignment, bill, allocationTriggered, allocationDetails, billingWarning } = result
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={20} />
          <span className="font-semibold">Consignment Registered Successfully!</span>
        </div>

        <div className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Consignment Number</span>
            <span className="font-mono font-bold text-electric-400">{consignment.consignment_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Destination</span>
            <span className="text-white">{consignment.destination}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Volume</span>
            <span className="text-white">{formatVolume(consignment.volume)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status</span>
            <span className={getStatusBadgeClass(consignment.status)}>{consignment.status}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Transport Charges</span>
              <span className="font-bold text-amber-400 text-base">{formatCurrency(consignment.transport_charges)}</span>
            </div>
            {bill?.pricing_breakdown && (
              <div className="text-xs text-gray-500 mt-1">
                {bill.pricing_breakdown.volume}m³ × ₹{bill.pricing_breakdown.ratePerCubicMeter}/m³
                {bill.pricing_breakdown.appliedRule === 'minimum' && ' (minimum charge applied)'}
              </div>
            )}
          </div>
        </div>

        {allocationTriggered && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Truck Allocated!</div>
              <div className="text-xs text-green-300 mt-0.5">
                Truck {allocationDetails.truck?.registrationNumber} allocated for {allocationDetails.destination}
                ({allocationDetails.consignmentCount} consignments, {formatVolume(allocationDetails.totalVolume)})
              </div>
            </div>
          </div>
        )}

        {allocationDetails?.noTrucks && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>Volume threshold reached but no trucks available. TransportManager notified.</div>
          </div>
        )}

        {billingWarning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>{billingWarning}</div>
          </div>
        )}

        <div className="flex gap-3">
          <Link to={`/bills/${consignment.consignment_number}`} className="btn-primary flex-1 justify-center">
            View Bill
          </Link>
          <button onClick={() => { setResult(null); setForm({ volume: '', destination: '', senderAddress: '', receiverAddress: '' }); onSuccess() }} className="btn-secondary flex-1 justify-center">
            Register Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Volume (cubic meters) *</label>
          <input type="number" step="0.01" min="0.01" value={form.volume}
            onChange={e => setForm(p => ({ ...p, volume: e.target.value }))}
            className="input-field" placeholder="e.g. 50.00" required />
        </div>
        <div>
          <label className="label">Destination *</label>
          <select value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
            className="select-field" required>
            <option value="">Select destination</option>
            {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Sender Address *</label>
        <textarea value={form.senderAddress} onChange={e => setForm(p => ({ ...p, senderAddress: e.target.value }))}
          className="input-field" rows={2} placeholder="Full sender address" required />
      </div>
      <div>
        <label className="label">Receiver Address *</label>
        <textarea value={form.receiverAddress} onChange={e => setForm(p => ({ ...p, receiverAddress: e.target.value }))}
          className="input-field" rows={2} placeholder="Full receiver address at destination" required />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Registering...' : 'Register & Generate Bill'}
        </button>
      </div>
    </form>
  )
}

export default function Consignments() {
  const { isOperator, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [consignments, setConsignments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(searchParams.get('new') === '1')
  const [filters, setFilters] = useState({ status: '', destination: '', search: '', startDate: '', endDate: '' })
  const [page, setPage] = useState(0)
  const limit = 20

  const fetchConsignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, offset: page * limit, ...filters }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = await consignmentsAPI.getAll(params)
      setConsignments(data.consignments || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to load consignments' })
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchConsignments() }, [fetchConsignments])

  const canRegister = isOperator() || isAdmin()

  return (
    <div>
      <Header
        title="Consignments"
        actions={canRegister && (
          <button onClick={() => setShowRegister(true)} className="btn-primary">
            <Plus size={16} /> Register Consignment
          </button>
        )}
      />
      <div className="p-6 space-y-4 animate-fade-in">
        {/* Filters */}
        <div className="glass-card p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                className="input-field pl-9" placeholder="Search consignments..." />
            </div>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="select-field">
              <option value="">All Statuses</option>
              {CONSIGNMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.destination} onChange={e => setFilters(p => ({ ...p, destination: e.target.value }))} className="select-field">
              <option value="">All Destinations</option>
              {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
            <div className="flex gap-2">
              <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="input-field flex-1" />
              <button onClick={fetchConsignments} className="btn-secondary px-3 shrink-0" title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="flex items-center justify-between px-5 py-3 table-header">
            <span className="text-sm font-medium text-gray-300">{total} consignments</span>
          </div>
          {loading ? <div className="p-4"><TableSkeleton rows={8} cols={7} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    {['Consignment #', 'Destination', 'Volume', 'Status', 'Charges', 'Registered', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consignments.length > 0 ? consignments.map(c => (
                    <tr key={c.consignment_number} className="table-row cursor-pointer" onClick={() => navigate(`/consignments/${c.consignment_number}`)}>
                      <td className="px-4 py-3 font-mono text-electric-400 font-medium text-xs">{c.consignment_number}</td>
                      <td className="px-4 py-3 text-white">{c.destination}</td>
                      <td className="px-4 py-3 text-gray-300">{formatVolume(c.volume)}</td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadgeClass(c.status)}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-medium">{formatCurrency(c.transport_charges)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDateTime(c.registration_timestamp)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Link to={`/consignments/${c.consignment_number}`} className="btn-secondary py-1 px-2">
                          <Eye size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        No consignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <span className="text-xs text-gray-400">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary py-1 px-3 disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total} className="btn-secondary py-1 px-3 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Register New Consignment" size="lg">
        <RegisterForm onSuccess={fetchConsignments} onClose={() => setShowRegister(false)} />
      </Modal>
    </div>
  )
}
