/**
 * Format Philippine Peso (PHP)
 */
export function formatPHP(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₱0.00'

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date to Philippine format
 */
export function formatDatePH(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '0'

  return new Intl.NumberFormat('en-PH').format(num)
}