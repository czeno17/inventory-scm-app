// components/ui/select.tsx
'use client'

import * as React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white focus:border-[var(--primary-default)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-default)]/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'