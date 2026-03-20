import React from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className }) {
  return (
    <div className={cn(
      'animate-pulse bg-white/10 rounded',
      className
    )} />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3 bg-white/5 rounded-t-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={cn(
      'border-2 border-electric-500 border-t-transparent rounded-full animate-spin',
      sizes[size] || sizes.md,
      className
    )} />
  )
}
