import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, BarChart2, TrendingUp, Truck, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts'
import { reportsAPI } from '../services/api'
import { useToast } from '../components/ui/Toast'
import { formatCurrency, formatVolume, formatDate } from '../lib/utils'
import Header from '../components/Layout/Header'
import { PageLoader, CardSkeleton } from '../components/ui/LoadingSkeleton'

const COLORS = ['#0066ff', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#64748b']

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }
}

function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const presets = [
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
    { label: '1 year', days: 365 },
    { label: '2 years', days: 730 },
  ]
  const setPreset = (days) => {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    onStartChange(start.toISOString().split('T')[0])
    onEndChange(end.toISOString().split('T')[0])
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-2">
        {presets.map(p => (
          <button key={p.days} onClick={() => setPreset(p.days)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">
            Last {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={startDate} onChange={e => onStartChange(e.target.value)} className="input-field py-1.5" />
        <span className="text-gray-500">to</span>
        <input type="date" value={endDate} onChange={e => onEndChange(e.target.value)} className="input-field py-1.5" />
      </div>
    </div>
  )
}

export default function Reports() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('revenue')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})
  const [downloading, setDownloading] = useState(false)

  const end = new Date().toISOString().split('T')[0]
  const start2y = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(start2y)
  const [endDate, setEndDate] = useState(end)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { startDate, endDate }
      if (activeTab === 'revenue') {
        const res = await reportsAPI.revenue(params)
        setData(res.data)
      } else if (activeTab === 'performance') {
        const res = await reportsAPI.performance(params)
        setData(res.data)
      } else if (activeTab === 'trucks') {
        const res = await reportsAPI.truckUsage(params)
        setData(res.data)
      }
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to load report data' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [activeTab, startDate, endDate])

  const handleExport = async (format) => {
    setDownloading(true)
    try {
      const params = { startDate, endDate, type: 'all' }
      const res = format === 'excel' ? await reportsAPI.exportExcel(params) : await reportsAPI.exportPdf(params)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `TCCS_Report_${startDate}_to_${endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
      toast({ type: 'success', title: 'Downloaded', message: `Report exported as ${format.toUpperCase()}` })
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Export failed' })
    } finally {
      setDownloading(false)
    }
  }

  const TABS = [
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
    { id: 'trucks', label: 'Truck Usage', icon: Truck },
  ]

  return (
    <div>
      <Header title="Reports & Analytics" actions={
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={downloading} className="btn-secondary">
            <Download size={14} /> PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={downloading} className="btn-primary">
            <Download size={14} /> Excel
          </button>
        </div>
      } />
      <div className="p-6 space-y-5 animate-fade-in">
        {/* Controls */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
            <button onClick={fetchData} className="btn-secondary py-2 px-3"><RefreshCw size={14} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.id ? 'border-electric-400 text-electric-400' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                <Icon size={15} /> {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? <PageLoader /> : (
          <>
            {/* Revenue Tab */}
            {activeTab === 'revenue' && data.summary && (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: formatCurrency(data.summary.total_revenue), color: 'text-amber-400' },
                    { label: 'Total Consignments', value: data.summary.total_consignments, color: 'text-electric-400' },
                    { label: 'Avg Charge', value: formatCurrency(data.summary.avg_charge), color: 'text-green-400' },
                    { label: 'Total Volume', value: formatVolume(data.summary.total_volume), color: 'text-purple-400' },
                  ].map(item => (
                    <div key={item.label} className="glass-card p-4">
                      <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                      <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Revenue by destination */}
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4">Revenue by Destination</h3>
                    {data.revenueByDestination?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.revenueByDestination}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="destination" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                          <Bar dataKey="total_revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.revenueByDestination.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-gray-500 py-8 text-center">No data</p>}
                  </div>

                  {/* Daily revenue trend */}
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4">Daily Revenue Trend</h3>
                    {data.dailyRevenue?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={data.dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={(d) => formatDate(d)} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v, name) => [
                            name === 'revenue' ? formatCurrency(v) : v,
                            name === 'revenue' ? 'Revenue' : 'Consignments'
                          ]} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#0066ff" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="consignments" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <p className="text-gray-500 py-8 text-center">No data</p>}
                  </div>
                </div>

                {/* Revenue table */}
                <div className="glass-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10">
                    <h3 className="section-title">Revenue Details by Destination</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          {['Destination', 'Consignments', 'Revenue', 'Avg Revenue', 'Volume', 'Delivered', 'Cancelled'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.revenueByDestination?.map(row => (
                          <tr key={row.destination} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 font-medium text-white">{row.destination}</td>
                            <td className="px-4 py-3 text-gray-300">{row.total_consignments}</td>
                            <td className="px-4 py-3 text-amber-400 font-semibold">{formatCurrency(row.total_revenue)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatCurrency(row.avg_revenue)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatVolume(row.total_volume)}</td>
                            <td className="px-4 py-3 text-green-400">{row.delivered_count}</td>
                            <td className="px-4 py-3 text-red-400">{row.cancelled_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Waiting time chart */}
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4">Avg. Waiting Time by Destination (hours)</h3>
                    {data.waitingTimeByDestination?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.waitingTimeByDestination}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="destination" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} />
                          <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${parseFloat(v).toFixed(1)}h`, 'Avg Wait']} />
                          <Bar dataKey="avg_waiting_hours" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-gray-500 py-8 text-center">No data</p>}
                  </div>

                  {/* Status distribution */}
                  <div className="glass-card p-5">
                    <h3 className="section-title mb-4">Consignment Status Distribution</h3>
                    {data.statusDistribution?.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie data={data.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                              {data.statusDistribution.map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip {...CHART_TOOLTIP_STYLE} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 flex-1">
                          {data.statusDistribution.map((item, idx) => (
                            <div key={item.status} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                                <span className="text-gray-300 text-xs">{item.status}</span>
                              </div>
                              <span className="font-bold text-white">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <p className="text-gray-500 py-8 text-center">No data</p>}
                  </div>
                </div>

                {/* Truck utilization */}
                <div className="glass-card p-5">
                  <h3 className="section-title mb-4">Truck Utilization</h3>
                  {data.truckUtilization?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {['Truck', 'Driver', 'Trips', 'Volume Transported', 'Delivered', 'Avg Utilization'].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.truckUtilization.map(t => (
                            <tr key={t.truck_id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-3 py-2.5 font-medium text-white">{t.registration_number}</td>
                              <td className="px-3 py-2.5 text-gray-300">{t.driver_name}</td>
                              <td className="px-3 py-2.5 text-gray-300">{t.total_trips}</td>
                              <td className="px-3 py-2.5 text-gray-300">{formatVolume(t.total_volume_transported)}</td>
                              <td className="px-3 py-2.5 text-green-400">{t.completed_trips}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-20">
                                    <div className="h-full bg-electric-400 rounded-full" style={{ width: `${Math.min(parseFloat(t.avg_utilization_percent), 100)}%` }} />
                                  </div>
                                  <span className="text-electric-400 text-xs font-medium">{parseFloat(t.avg_utilization_percent).toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-gray-500 py-8 text-center">No data</p>}
                </div>
              </div>
            )}

            {/* Truck Usage Tab */}
            {activeTab === 'trucks' && (
              <div className="space-y-5">
                {data.truckUsage?.length > 0 ? (
                  <>
                    <div className="glass-card p-5">
                      <h3 className="section-title mb-4">Truck Usage ({startDate} to {endDate})</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.truckUsage}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="registration_number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} />
                          <Tooltip {...CHART_TOOLTIP_STYLE} />
                          <Legend />
                          <Bar dataKey="trips_completed" name="Trips" fill="#0066ff" radius={[4, 4, 0, 0]} maxBarSize={35} />
                          <Bar dataKey="total_consignments_delivered" name="Consignments" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={35} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/10">
                        <h3 className="section-title">Detailed Truck Report</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              {['Truck', 'Driver', 'Capacity', 'Status', 'Trips', 'Volume', 'Consignments', 'Avg Trip (h)', 'Utilization'].map(h => (
                                <th key={h} className="px-3 py-3 text-left text-xs text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.truckUsage.map(t => (
                              <tr key={t.truck_id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-3 py-3 font-medium text-white">{t.registration_number}</td>
                                <td className="px-3 py-3 text-gray-300">{t.driver_name}</td>
                                <td className="px-3 py-3 text-gray-300">{formatVolume(t.capacity)}</td>
                                <td className="px-3 py-3">
                                  <span className={`badge ${
                                    t.current_status === 'Available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    t.current_status === 'InTransit' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                  }`}>{t.current_status}</span>
                                </td>
                                <td className="px-3 py-3 text-electric-400 font-semibold">{t.trips_completed}</td>
                                <td className="px-3 py-3 text-gray-300">{formatVolume(t.total_volume_transported)}</td>
                                <td className="px-3 py-3 text-gray-300">{t.total_consignments_delivered}</td>
                                <td className="px-3 py-3 text-gray-300">{parseFloat(t.avg_trip_hours).toFixed(1)}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full bg-electric-400 rounded-full" style={{ width: `${Math.min(t.avg_utilization_pct, 100)}%` }} />
                                    </div>
                                    <span className="text-xs text-electric-400">{t.avg_utilization_pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : <p className="text-gray-500 py-12 text-center">No truck usage data for this period</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
