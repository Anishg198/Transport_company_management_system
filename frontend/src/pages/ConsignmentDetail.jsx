import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Clock, MapPin, Package, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { consignmentsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { formatDateTime, formatCurrency, formatVolume, getStatusBadgeClass, CONSIGNMENT_STATUSES } from '../lib/utils'
import Header from '../components/Layout/Header'
import { PageLoader } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'
import { formatDistanceToNow, parseISO } from 'date-fns'

function StatusTimeline({ log }) {
  if (!log || !log.length) return null
  const entries = [...log].reverse()
  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
              i === 0 ? 'bg-electric-400 shadow-glow-blue' : 'bg-gray-600'
            }`} />
            {i < entries.length - 1 && <div className="w-0.5 bg-white/10 flex-1 my-1" />}
          </div>
          <div className={`pb-4 ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                {entry.newStatus}
              </span>
              {entry.oldStatus && (
                <span className="text-xs text-gray-600">← from {entry.oldStatus}</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {entry.timestamp ? formatDateTime(entry.timestamp) : '—'}
              {entry.timestamp && ` (${formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })})`}
            </div>
            {entry.note && <div className="text-xs text-gray-500 mt-0.5 italic">{entry.note}</div>}
            {entry.updatedBy && <div className="text-xs text-gray-600 mt-0.5">by {entry.updatedBy}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ConsignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin, isManager } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', note: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    consignmentsAPI.getById(id)
      .then(({ data }) => setData(data))
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Consignment not found' }))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return
    setUpdating(true)
    try {
      const { data: updated } = await consignmentsAPI.updateStatus(id, statusForm)
      setData(prev => ({ ...prev, consignment: updated.consignment }))
      setShowStatusModal(false)
      toast({ type: 'success', title: 'Status Updated', message: `Status changed to ${statusForm.status}` })
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || err.message })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div><Header /><PageLoader /></div>
  if (!data) return <div><Header /><div className="p-6 text-gray-400">Consignment not found</div></div>

  const { consignment, bill } = data
  const log = Array.isArray(consignment.status_change_log) ? consignment.status_change_log : []

  return (
    <div>
      <Header title="Consignment Detail" actions={
        <Link to="/consignments" className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </Link>
      } />
      <div className="p-6 space-y-5 animate-fade-in">
        {/* Header card */}
        <div className="glass-card glow-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-2xl font-bold text-electric-400">{consignment.consignment_number}</div>
              <div className="text-gray-400 text-sm mt-1">Registered {formatDateTime(consignment.registration_timestamp)}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge text-sm px-4 py-1.5 ${getStatusBadgeClass(consignment.status).replace('badge ', '')}`}>
                {consignment.status}
              </span>
              {(isAdmin() || isManager()) && (
                <button onClick={() => { setStatusForm({ status: consignment.status, note: '' }); setShowStatusModal(true) }}
                  className="btn-secondary">
                  Update Status
                </button>
              )}
              {bill && (
                <Link to={`/bills/${id}`} className="btn-primary">
                  <FileText size={16} /> View Bill
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Details */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2"><Package size={18} /> Shipment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destination</div>
                  <div className="text-white font-medium flex items-center gap-1.5">
                    <MapPin size={14} className="text-electric-400" /> {consignment.destination}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volume</div>
                  <div className="text-white font-medium">{formatVolume(consignment.volume)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sender Address</div>
                  <div className="text-gray-300 text-sm">{consignment.sender_address}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Receiver Address</div>
                  <div className="text-gray-300 text-sm">{consignment.receiver_address}</div>
                </div>
              </div>
            </div>

            {consignment.assigned_truck_id && (
              <div className="glass-card p-5">
                <h3 className="section-title mb-4 flex items-center gap-2"><Truck size={18} /> Assigned Truck</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Registration Number</div>
                    <Link to={`/fleet/${consignment.assigned_truck_id}`} className="text-electric-400 hover:text-electric-300 font-medium">
                      {consignment.truck_reg_number}
                    </Link>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Driver</div>
                    <div className="text-white">{consignment.truck_driver}</div>
                  </div>
                  {consignment.truck_location && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Current Location</div>
                      <div className="text-white flex items-center gap-1.5">
                        <MapPin size={12} className="text-amber-400" /> {consignment.truck_location}
                      </div>
                    </div>
                  )}
                  {consignment.truck_status && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Truck Status</div>
                      <span className={getStatusBadgeClass(consignment.truck_status)}>{consignment.truck_status}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bill && (
              <div className="glass-card p-5 glow-border-amber">
                <h3 className="section-title mb-4 flex items-center gap-2"><FileText size={18} /> Bill Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Volume</span><span className="float-right text-white">{formatVolume(bill.pricing_breakdown?.volume)}</span></div>
                  <div><span className="text-gray-400">Rate</span><span className="float-right text-white">₹{bill.pricing_breakdown?.ratePerCubicMeter}/m³</span></div>
                  <div><span className="text-gray-400">Base Charge</span><span className="float-right text-white">{formatCurrency(bill.pricing_breakdown?.baseCharge)}</span></div>
                  <div><span className="text-gray-400">Min Charge</span><span className="float-right text-white">{formatCurrency(bill.pricing_breakdown?.minimumCharge)}</span></div>
                  <div className="col-span-2 border-t border-white/10 pt-3 mt-1">
                    <span className="text-gray-300 font-medium">Total Charges</span>
                    <span className="float-right text-amber-400 font-bold text-xl">{formatCurrency(bill.transport_charges)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting time */}
            {['Registered', 'Pending'].includes(consignment.status) && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Clock size={20} className="text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-400">Waiting for Allocation</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Waiting since {formatDateTime(consignment.registration_timestamp)}
                    {' '}({formatDistanceToNow(parseISO(consignment.registration_timestamp), { addSuffix: false })} ago)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-5 flex items-center gap-2">
              <Clock size={18} /> Status Timeline
            </h3>
            <StatusTimeline log={log} />
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">New Status</label>
            <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))} className="select-field">
              {CONSIGNMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <textarea value={statusForm.note} onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
              className="input-field" rows={2} placeholder="Reason for status change..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleStatusUpdate} className="btn-primary flex-1 justify-center" disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
