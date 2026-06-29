/**
 * Format a number as currency (GBP default)
 */
export function formatCurrency(value, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format a number with commas
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-GB').format(value)
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Truncate a string to a max length
 */
export function truncate(str, max = 60) {
  return str?.length > max ? str.slice(0, max) + '…' : str
}

/**
 * Generate a random colour for chart segments
 */
export function generateColour(index) {
  const colours = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  ]
  return colours[index % colours.length]
}