// components/ui/empty-state.tsx
'use client'

import { Package, Plus } from 'lucide-react'

export const EmptyState = ({ title, description, icon, actionLabel, onAction }: any) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
        {icon || <Package className="w-8 h-8 text-[var(--text-muted)]" />}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-default)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}