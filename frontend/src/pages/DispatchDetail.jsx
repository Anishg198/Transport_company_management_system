import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Truck, MapPin, Package, Calendar, User } from 'lucide-react'
import { dispatchAPI } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { formatDateTime, formatCurrency, formatVolume, getStatusBadgeClass } from '../lib/utils'
import Header from '../components/Layout/Header'
import { PageLoader } from '../components/ui/LoadingSkeleton'

export default function DispatchDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dispatchAPI.getById(id)
      .then(({ data }) => setData(data))
      .catch(() => toast({ type: 'error', title: 'Error', message: 'Dispatch document not found' }))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div><Header /><PageLoader /></div>
  if (!data) return <div><Header /><div className="p-6 text-gray-400">Document not found</div></div>

  const dispatch = data.dispatch
  const manifest = Array.isArray(dispatch.consignment_manifest) ? dispatch.consignment_manifest : []

  return (
    <div>
      <Header title="Dispatch Document" actions={
        <div className="flex gap-2">
          <Link to="/dispatch" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
          <button onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Print</button>
        </div>
      } />

      <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in" id="printable">
        {/* Document Header */}
        <div className="glass-card glow-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-electric-500/20 rounded-lg flex items-center justify-center border border-electric-500/30">
                  <Truck size={20} className="text-electric-400" />
                </div>
                <div>
                  <div className="text-lg font-black text-white tracking-tight">TCCS</div>
                  <div className="text-xs text-gray-500">Transport Company Computerisation System</div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mt-3">DISPATCH DOCUMENT</h1>
            </div>
            <div className="text-right">
              <span className={`badge text-sm px-4 py-1.5 ${getStatusBadgeClass(dispatch.dispatch_status).replace('badge ', '')}`}>
                {dispatch.dispatch_status}
              </span>
              <div className="text-xs text-gray-400 mt-2">ID: {dispatch.dispatch_id}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-lg">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Truck size={11} /> Truck</div>
              <div className="font-bold text-white">{dispatch.truck_reg_number}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><User size={11} /> Driver</div>
              <div className="font-bold text-white">{dispatch.driver_name}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><MapPin size={11} /> Destination</div>
              <div className="font-bold text-white">{dispatch.destination}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Calendar size={11} /> Dispatched</div>
              <div className="font-bold text-white text-sm">{formatDateTime(dispatch.dispatch_timestamp)}</div>
            </div>
          </div>

          {dispatch.departure_time && (
            <div className="grid grid-cols-2 gap-4 mt-3 px-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Departure Time</div>
                <div className="text-white text-sm">{formatDateTime(dispatch.departure_time)}</div>
              </div>
              {dispatch.arrival_time && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Arrival Time</div>
                  <div className="text-white text-sm">{formatDateTime(dispatch.arrival_time)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consignment Manifest */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2"><Package size={18} /> Consignment Manifest</h3>
            <div className="text-sm text-gray-400">
              {dispatch.total_consignments} consignments · {formatVolume(dispatch.total_volume)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['#', 'Consignment Number', 'Volume', 'Sender Address', 'Receiver Address', 'Charges'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {manifest.map((item, idx) => (
                  <tr key={item.consignmentNumber} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <Link to={`/consignments/${item.consignmentNumber}`} className="font-mono text-electric-400 text-xs hover:text-electric-300" onClick={e => e.stopPropagation()}>
                        {item.consignmentNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{formatVolume(item.volume)}</td>
                    <td className="px-3 py-2.5 text-gray-300 max-w-xs truncate text-xs">{item.senderAddress}</td>
                    <td className="px-3 py-2.5 text-gray-300 max-w-xs truncate text-xs">{item.receiverAddress}</td>
                    <td className="px-3 py-2.5 text-amber-400 whitespace-nowrap">{formatCurrency(item.charges)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20 bg-white/5">
                  <td colSpan={2} className="px-3 py-3 text-white font-bold text-sm">TOTALS</td>
                  <td className="px-3 py-3 text-white font-bold">{formatVolume(dispatch.total_volume)}</td>
                  <td colSpan={2} />
                  <td className="px-3 py-3 text-amber-400 font-bold">
                    {formatCurrency(manifest.reduce((sum, item) => sum + (parseFloat(item.charges) || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Signature section */}
        <div className="glass-card p-5">
          <div className="grid grid-cols-3 gap-8">
            {['Prepared By', 'Driver Signature', 'Authorized By'].map(label => (
              <div key={label} className="text-center">
                <div className="h-12 border-b border-white/20 mb-2" />
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-xs text-gray-600">
            Generated by TCCS · {formatDateTime(new Date())} · {dispatch.created_by_name && `Prepared by ${dispatch.created_by_name}`}
          </div>
        </div>
      </div>
    </div>
  )
}
