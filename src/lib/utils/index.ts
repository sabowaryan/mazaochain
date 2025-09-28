import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USDC'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function calculateCropValue(
  superficie: number,
  rendement: number,
  prixReference: number
): number {
  return superficie * rendement * prixReference
}

export function calculateCollateralRatio(
  collateralValue: number,
  loanAmount: number
): number {
  return (collateralValue / loanAmount) * 100
}

export function isValidCollateralRatio(ratio: number): boolean {
  return ratio >= 200 // 200% minimum collateral ratio
}