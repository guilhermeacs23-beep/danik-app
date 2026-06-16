import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))
}

export function daysFromNow(date: string): number {
  const target = new Date(date)
  const now = new Date()
  const diff = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function daysAgo(date: string): number {
  return -daysFromNow(date)
}

export function calcMarkup(cost: number, salePrice: number): number {
  if (!cost) return 0
  return Math.round((salePrice / cost) * 100) / 100
}

export function calcMargin(cost: number, salePrice: number): number {
  if (!salePrice) return 0
  return Math.round(((salePrice - cost) / salePrice) * 10000) / 100
}

export function priceFromMarkup(cost: number, markup: number): number {
  return Math.round(cost * markup * 100) / 100
}

export function priceFromMargin(cost: number, marginPct: number): number {
  if (marginPct >= 100) return 0
  return Math.round((cost / (1 - marginPct / 100)) * 100) / 100
}

export function generateItemCode(
  internalCode: string,
  size: string,
  color: string,
  seq: number
): string {
  const colorAbbr = color.slice(0, 3).toUpperCase()
  const seqPad = String(seq).padStart(4, '0')
  return `${internalCode}-${size}-${colorAbbr}-${seqPad}`
}

export function generateSuitcaseCode(seq: number): string {
  const year = new Date().getFullYear()
  return `MAL-${year}-${String(seq).padStart(3, '0')}`
}

export function generateSaleCode(seq: number): string {
  const year = new Date().getFullYear()
  return `VND-${year}-${String(seq).padStart(4, '0')}`
}
