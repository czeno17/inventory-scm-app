// components/ui/form-field.tsx
'use client'

import * as React from 'react'

// Form Field Container
export const FormField = ({ children, className = '', ...props }: any) => {
  return (
    <div className={`space-y-1 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Form Label
export const FormLabel = ({ children, className = '', ...props }: any) => {
  return (
    <label className={`block text-sm font-medium text-[var(--text-secondary)] ${className}`} {...props}>
      {children}
    </label>
  )
}

// Form Control (wrapper for inputs)
export const FormControl = ({ children, className = '', ...props }: any) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// Form Description
export const FormDescription = ({ children, className = '', ...props }: any) => {
  return (
    <p className={`text-sm text-[var(--text-muted)] ${className}`} {...props}>
      {children}
    </p>
  )
}

// Form Message (error messages)
export const FormMessage = ({ children, className = '', ...props }: any) => {
  if (!children) return null
  return (
    <p className={`text-sm text-[var(--error)] ${className}`} {...props}>
      {children}
    </p>
  )
}