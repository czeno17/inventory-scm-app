// components/ui/input.tsx
'use client'

import * as React from 'react'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white placeholder:text-[var(--text-muted)] focus:border-[var(--primary-default)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-default)]/20 ${className}`}
      {...props}
    />
  )
})

Input.displayName = 'Input'