// components/ui/search-input.tsx
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

export const SearchInput = ({ className = '', onSearch, ...props }: any) => {
  const [value, setValue] = useState('')

  const handleChange = (e: any) => {
    const newValue = e.target.value
    setValue(newValue)
    if (onSearch) onSearch(newValue)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      <input
        type="text"
        className={`w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white placeholder:text-[var(--text-muted)] focus:border-[var(--primary-default)] focus:outline-none ${className}`}
        value={value}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}