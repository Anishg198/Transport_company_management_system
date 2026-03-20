import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM yyyy')
  } catch { return '—' }
}

export function formatDateTime(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM yyyy, HH:mm')
  } catch { return '—' }
}

export function formatRelativeTime(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch { return '—' }
}

export function formatVolume(volume) {
  if (volume == null) return '—'
  return `${parseFloat(volume).toFixed(2)} m³`
}

export const STATUS_COLORS = {
  // Consignment statuses
  Registered:      { bg: 'bg-blue-500/20',    text: 'text-blue-300',   border: 'border-blue-500/30' },
  Pending:         { bg: 'bg-yellow-500/20',   text: 'text-yellow-300', border: 'border-yellow-500/30' },
  AllocatedToTruck:{ bg: 'bg-purple-500/20',   text: 'text-purple-300', border: 'border-purple-500/30' },
  InTransit:       { bg: 'bg-amber-500/20',    text: 'text-amber-400',  border: 'border-amber-500/30' },
  Delivered:       { bg: 'bg-green-500/20',    text: 'text-green-400',  border: 'border-green-500/30' },
  Cancelled:       { bg: 'bg-red-500/20',      text: 'text-red-400',    border: 'border-red-500/30' },
  // Truck statuses
  Available:       { bg: 'bg-green-500/20',    text: 'text-green-400',  border: 'border-green-500/30' },
  Allocated:       { bg: 'bg-blue-500/20',     text: 'text-blue-400',   border: 'border-blue-500/30' },
  Loading:         { bg: 'bg-purple-500/20',   text: 'text-purple-400', border: 'border-purple-500/30' },
  Unloading:       { bg: 'bg-orange-500/20',   text: 'text-orange-400', border: 'border-orange-500/30' },
  UnderMaintenance:{ bg: 'bg-red-500/20',      text: 'text-red-400',    border: 'border-red-500/30' },
  // Dispatch statuses
  Dispatched:      { bg: 'bg-electric-500/20', text: 'text-electric-400', border: 'border-electric-500/30' },
}

export function getStatusBadgeClass(status) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
  return `badge ${colors.bg} ${colors.text} border ${colors.border}`
}

export const DESTINATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
]

export const CONSIGNMENT_STATUSES = ['Registered', 'Pending', 'AllocatedToTruck', 'InTransit', 'Delivered', 'Cancelled']
export const TRUCK_STATUSES = ['Available', 'Allocated', 'InTransit', 'Loading', 'Unloading', 'UnderMaintenance']
