// lib/utils/format.ts

/**
 * Format a number to a compact string (e.g., 1.5M, 2.3K)
 */
export const formatCompact = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * Format a currency to a compact string (e.g., ₱1.5M, ₱2.3K)
 */
export const formatCompactPHP = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `₱${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `₱${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `₱${(num / 1_000).toFixed(1)}K`
  }
  return `₱${num.toFixed(2)}`
}