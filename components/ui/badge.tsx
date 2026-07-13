// components/ui/badge.tsx
'use client'

export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}: any) => {
  const variants: any = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
    error: 'bg-[var(--error-bg)] text-[var(--error)]',
    info: 'bg-[var(--info-bg)] text-[var(--info)]',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}