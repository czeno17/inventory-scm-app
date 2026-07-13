// components/ui/loading.tsx
'use client'

export const Loading = ({ size = 'md', fullPage = false }: any) => {
  const sizeClasses: any = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const spinner = (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-2 border-[var(--border-default)] border-t-[var(--primary-default)] rounded-full animate-spin`} />
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export const LoadingSkeleton = ({ count = 3 }: any) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-[var(--bg-tertiary)] rounded-lg" />
        </div>
      ))}
    </div>
  )
}