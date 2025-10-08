import { categoryLabels } from './constants'

// Helper function to get current month and year
export const getCurrentMonthYear = () => {
  const now = new Date()
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
  const currentYear = now.getFullYear().toString()
  return { currentMonth, currentYear }
}

// Helper function to get month name in Indonesian
export const getMonthNameIndonesian = (monthNumber: string) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const monthIndex = parseInt(monthNumber) - 1
  return months[monthIndex] || monthNumber
}

// Helper function to check if filters should be reset (first day of new month)
export const shouldResetFiltersForNewMonth = (lastViewDate?: string) => {
  if (!lastViewDate) return false
  
  const now = new Date()
  const last = new Date(lastViewDate)
  
  // Check if we're in a new month compared to last view
  return now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear()
}

// Helper function to get formatted date string for comparison
export const getDateString = () => {
  return new Date().toISOString().split('T')[0]
}

export const formatCurrency = (amount: number | string | null | undefined): string => {
  // Handle null, undefined, or invalid values
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(0)
  }
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Check again after conversion
  if (isNaN(numericAmount)) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(0)
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(numericAmount)
}

export const getCategoryLabel = (category: string): string => {
  return categoryLabels[category as keyof typeof categoryLabels] || category
}