/**
 * Format a number as currency (EUR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a date string or object to German locale date string
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'Unbegrenzt'
  return new Date(date).toLocaleDateString('de-DE')
}
