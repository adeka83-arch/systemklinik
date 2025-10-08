// Utility functions for date handling in reports
export const getDateRanges = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  
  return {
    // Hari ini
    today: {
      start: today.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: 'Hari Ini'
    },
    
    // Minggu ini (Senin - Minggu)
    thisWeek: {
      start: (() => {
        const monday = new Date(today)
        const day = monday.getDay()
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
        monday.setDate(diff)
        return monday.toISOString().split('T')[0]
      })(),
      end: (() => {
        const sunday = new Date(today)
        const day = sunday.getDay()
        const diff = sunday.getDate() - day + 7
        sunday.setDate(diff)
        return sunday.toISOString().split('T')[0]
      })(),
      label: 'Minggu Ini'
    },
    
    // Bulan ini (default untuk sistem bulan berjalan)
    thisMonth: {
      start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
      label: 'Bulan Ini'
    },
    
    // Bulan lalu
    lastMonth: {
      start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
      label: 'Bulan Lalu'
    },
    
    // 3 bulan terakhir
    last3Months: {
      start: new Date(currentYear, currentMonth - 2, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
      label: '3 Bulan Terakhir'
    },
    
    // Tahun ini
    thisYear: {
      start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
      end: new Date(currentYear, 11, 31).toISOString().split('T')[0],
      label: 'Tahun Ini'
    }
  }
}

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  
  if (startDate === endDate) {
    return start.toLocaleDateString('id-ID', options)
  }
  
  return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`
}

export const getQuickDateRangeOptions = () => {
  const ranges = getDateRanges()
  
  return [
    { value: 'today', label: ranges.today.label, range: ranges.today },
    { value: 'thisWeek', label: ranges.thisWeek.label, range: ranges.thisWeek },
    { value: 'thisMonth', label: ranges.thisMonth.label, range: ranges.thisMonth },
    { value: 'lastMonth', label: ranges.lastMonth.label, range: ranges.lastMonth },
    { value: 'last3Months', label: ranges.last3Months.label, range: ranges.last3Months },
    { value: 'thisYear', label: ranges.thisYear.label, range: ranges.thisYear },
    { value: 'custom', label: 'Periode Kustom', range: null }
  ]
}

// Get default date range (bulan berjalan)
export const getDefaultDateRange = () => {
  const ranges = getDateRanges()
  return ranges.thisMonth
}

// Check if current date range matches a quick option
export const getCurrentQuickOption = (startDate: string, endDate: string) => {
  const options = getQuickDateRangeOptions()
  
  for (const option of options) {
    if (option.range && option.range.start === startDate && option.range.end === endDate) {
      return option.value
    }
  }
  
  return 'custom'
}