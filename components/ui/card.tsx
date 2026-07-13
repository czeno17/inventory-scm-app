// components/ui/card.tsx
'use client'

export const Card = ({ children, className = '', ...props }: any) => {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '', ...props }: any) => {
  return <div className={`p-6 pb-0 ${className}`} {...props}>{children}</div>
}

export const CardTitle = ({ children, className = '', ...props }: any) => {
  return <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>{children}</h3>
}

export const CardDescription = ({ children, className = '', ...props }: any) => {
  return <p className={`text-sm text-[var(--text-muted)] ${className}`} {...props}>{children}</p>
}

export const CardContent = ({ children, className = '', ...props }: any) => {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
}

export const CardFooter = ({ children, className = '', ...props }: any) => {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
}