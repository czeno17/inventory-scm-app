// components/ui/button.tsx
'use client'

import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--primary-default)] text-white hover:bg-[var(--primary-hover)]',
      primary: 'bg-[var(--primary-default)] text-white hover:bg-[var(--primary-hover)]',
      ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]',
      outline: 'bg-transparent border border-[var(--border-default)] text-white hover:bg-[var(--bg-tertiary)]',
      success: 'bg-[var(--success)] text-white hover:bg-[var(--success)]/80',
      danger: 'bg-[var(--error)] text-white hover:bg-[var(--error)]/80',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-default)]/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'