import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getNextTicketNumber(prefix: number, lastNumber: number | null): string {
  const next = lastNumber ? lastNumber + 1 : 1
  return `#${prefix}${String(next).padStart(4, '0')}`
}
