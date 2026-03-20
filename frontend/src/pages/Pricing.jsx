import React, { useState, useEffect } from 'react'
import { Plus, DollarSign, Edit, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { pricingAPI } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { formatCurrency, formatDate, DESTINATIONS } from '../lib/utils'
import Header from '../components/Layout/Header'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'
import { Modal } from '../components/ui/Modal'

function PricingForm({ initial, onSuccess, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState(initial || {
    destination: '', ratePerCubicMeter: '', minimumCharge: '', effectiveDate: '', expiryDate: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (initial?.id) {
        await pricingAPI.update(initial.id, form)
        toast({ type: 'success', title: 'Updated', message: 'Pricing rule updated' })
      } else {
        await pricingAPI.create(form)
        toast({ type: 'success', title: 'Created', message: `Pricing rule for ${form.destination} created` })
      }
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
        <div className="col-span-2">
          <label className="label">Destination *</label>
          <select value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} className="select-field" required>
            <option value="">Select destination</option>
            {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rate per m³ (₹) *</label>
          <input type="number" step="0.01" min="0" value={form.ratePerCubicMeter}
            onChange={e => setForm(p => ({ ...p, ratePerCubicMeter: e.target.value }))}
            className="input-field" placeholder="e.g. 500" required />
        </div>
        <div>
          <label className="label">Minimum Charge (₹) *</label>
          <input type="number" step="0.01" min="0" value={form.minimumCharge}
            onChange={e => setForm(p => ({ ...p, minimumCharge: e.target.value }))}
            className="input-field" placeholder="e.g. 2500" required />
        </div>
        <div>
          <label className="label">Effective Date *</label>
          <input type="date" value={form.effectiveDate} onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))}
            className="input-field" required />
        </div>
        <div>
          <label className="label">Expiry Date</label>
          <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
            className="input-field" />
          <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry</p>
        </div>
      </div>
      <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-400">
        <strong className="text-white">Charge calculation:</strong> max(volume × rate, minimumCharge)
        {form.ratePerCubicMeter && form.minimumCharge && (
          <div className="mt-1 text-xs">
            Example: 100m³ → max(100 × ₹{form.ratePerCubicMeter}, ₹{form.minimumCharge}) = {formatCurrency(Math.max(100 * parseFloat(form.ratePerCubicMeter), parseFloat(form.minimumCharge)))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Saving...' : (initial?.id ? 'Update Rule' : 'Create Rule')}
        </button>
      </div>
    </form>
  )
}

export default function Pricing() {
  const toast = useToast()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)

  const fetchRules = async () => {
    setLoading(true)
    try {
      const { data } = await pricingAPI.getAll()
      setRules(data.pricingRules || [])
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to load pricing rules' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRules() }, [])

  const toggleActive = async (rule) => {
    try {
      await pricingAPI.update(rule.id, { isActive: !rule.is_active })
      toast({ type: 'success', title: 'Updated', message: `Rule ${rule.is_active ? 'deactivated' : 'activated'}` })
      fetchRules()
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.message })
    }
  }

  return (
    <div>
      <Header title="Pricing Rules" actions={
        <button onClick={() => { setEditingRule(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Add Rule
        </button>
      } />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="glass-card p-4 bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3 text-sm">
            <DollarSign size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-gray-300">
              <span className="text-amber-400 font-medium">Charge formula:</span> Transport Charges = max(Volume × Rate/m³, Minimum Charge)
              <br />Only active rules within the effective date range are applied for new consignments.
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="flex items-center justify-between px-5 py-3 table-header">
            <span className="text-sm font-medium text-gray-300">{rules.length} pricing rules</span>
            <button onClick={fetchRules} className="btn-secondary py-1.5 px-2.5"><RefreshCw size={13} /></button>
          </div>
          {loading ? <div className="p-4"><TableSkeleton rows={6} cols={6} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    {['Destination', 'Rate/m³', 'Min Charge', 'Effective Date', 'Expiry', 'Active', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} className="table-row">
                      <td className="px-4 py-3 font-medium text-white">{rule.destination}</td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">₹{rule.rate_per_cubic_meter}</td>
                      <td className="px-4 py-3 text-gray-300">{formatCurrency(rule.minimum_charge)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(rule.effective_date)}</td>
                      <td className="px-4 py-3 text-gray-400">{rule.expiry_date ? formatDate(rule.expiry_date) : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(rule)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all ${
                            rule.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                          {rule.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setEditingRule({ ...rule, ratePerCubicMeter: rule.rate_per_cubic_meter, minimumCharge: rule.minimum_charge, effectiveDate: rule.effective_date, expiryDate: rule.expiry_date || '', isActive: rule.is_active }); setShowForm(true) }}
                          className="btn-secondary py-1 px-2">
                          <Edit size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingRule ? 'Edit Pricing Rule' : 'Add Pricing Rule'} size="md">
        <PricingForm initial={editingRule} onSuccess={fetchRules} onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
