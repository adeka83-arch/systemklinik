import type {
  ReportFilters,
  AttendanceReport,
  SalaryReport,
  DoctorFeeReport,
  TreatmentReport,
  SalesReport,
  ExpenseReport,
  FinancialSummary,
  FieldTripSaleReport
} from './types'
import { getCurrentMonthYear } from './helpers'

export const filterAttendanceData = (
  attendanceData: AttendanceReport[],
  filters: ReportFilters,
  doctors: any[]
): AttendanceReport[] => {
  const filtered = attendanceData.filter(record => {
    if (filters.doctor && !record.doctorName.toLowerCase().includes(filters.doctor.toLowerCase())) {
      return false
    }
    if (filters.selectedDoctorId && filters.selectedDoctorId !== 'all') {
      const doctor = doctors.find(d => d.name === record.doctorName)
      if (!doctor || doctor.id !== filters.selectedDoctorId) return false
    }
    if (filters.shift && filters.shift !== 'all' && record.shift !== filters.shift) return false
    if (filters.date && record.date !== filters.date) return false
    if (filters.type && filters.type !== 'all' && record.type !== filters.type) return false
    if (filters.startDate && record.date < filters.startDate) return false
    if (filters.endDate && record.date > filters.endDate) return false
    
    // Filter bulan dan tahun untuk data absensi
    if (filters.month !== 'all') {
      const recordDate = new Date(record.date)
      const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0')
      if (recordMonth !== filters.month) return false
    }
    if (filters.year !== 'all') {
      const recordDate = new Date(record.date)
      const recordYear = recordDate.getFullYear().toString()
      if (recordYear !== filters.year) return false
    }
    
    return true
  })

  // Sort by date descending (newest first), then by doctor name
  return filtered.sort((a, b) => {
    // First sort by date (newest first)
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime()
    }
    
    // Then by doctor name alphabetically
    return a.doctorName.localeCompare(b.doctorName)
  })
}

export const filterSalaryData = (
  salaryData: SalaryReport[],
  filters: ReportFilters
): SalaryReport[] => {
  return salaryData.filter(salary => {
    if (filters.employee && !salary.employeeName.toLowerCase().includes(filters.employee.toLowerCase())) {
      return false
    }
    if (filters.month !== 'all' && salary.month !== filters.month) return false
    if (filters.year !== 'all' && salary.year !== filters.year) return false
    return true
  })
}

export const filterDoctorFeeData = (
  doctorFeeData: DoctorFeeReport[],
  filters: ReportFilters
): DoctorFeeReport[] => {
  const filtered = doctorFeeData.filter(fee => {
    if (filters.doctor && !fee.doctor.toLowerCase().includes(filters.doctor.toLowerCase())) {
      return false
    }
    if (filters.startDate && fee.date < filters.startDate) return false
    if (filters.endDate && fee.date > filters.endDate) return false
    
    // Filter bulan dan tahun untuk data doctor fees
    if (filters.month !== 'all') {
      const feeDate = new Date(fee.date)
      const feeMonth = (feeDate.getMonth() + 1).toString().padStart(2, '0')
      if (feeMonth !== filters.month) return false
    }
    if (filters.year !== 'all') {
      const feeDate = new Date(fee.date)
      const feeYear = feeDate.getFullYear().toString()
      if (feeYear !== filters.year) return false
    }
    
    return true
  })

  // Sort by date descending (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export const filterTreatmentData = (
  treatmentData: TreatmentReport[],
  filters: ReportFilters
): TreatmentReport[] => {
  const filtered = treatmentData.filter(treatment => {
    if (filters.doctor && !treatment.doctorName.toLowerCase().includes(filters.doctor.toLowerCase())) {
      return false
    }
    if (filters.startDate && treatment.date < filters.startDate) return false
    if (filters.endDate && treatment.date > filters.endDate) return false
    
    // Filter pencarian pasien
    if (filters.searchPatient && !treatment.patientName.toLowerCase().includes(filters.searchPatient.toLowerCase())) {
      return false
    }
    
    // Filter pencarian tindakan
    if (filters.searchTreatment && !treatment.treatmentName.toLowerCase().includes(filters.searchTreatment.toLowerCase())) {
      return false
    }
    
    // Filter bulan tindakan
    if (filters.treatmentMonth && filters.treatmentMonth !== 'all') {
      const treatmentDate = new Date(treatment.date)
      const treatmentMonth = (treatmentDate.getMonth() + 1).toString().padStart(2, '0')
      if (treatmentMonth !== filters.treatmentMonth) return false
    }
    
    // Filter tahun tindakan
    if (filters.treatmentYear && filters.treatmentYear !== 'all') {
      const treatmentDate = new Date(treatment.date)
      const treatmentYear = treatmentDate.getFullYear().toString()
      if (treatmentYear !== filters.treatmentYear) return false
    }
    
    return true
  })

  // Sort by date descending (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export const filterSalesData = (
  salesData: SalesReport[],
  filters: ReportFilters
): SalesReport[] => {
  const filtered = salesData.filter(sale => {
    // Filter tanggal
    if (filters.startDate && sale.date < filters.startDate) return false
    if (filters.endDate && sale.date > filters.endDate) return false
    
    // Filter pencarian produk
    if (filters.searchProduct && !sale.productName.toLowerCase().includes(filters.searchProduct.toLowerCase())) {
      return false
    }
    
    // Filter kategori produk
    if (filters.productCategory && filters.productCategory !== 'all' && sale.category !== filters.productCategory) {
      return false
    }
    
    // Filter bulan penjualan
    if (filters.salesMonth && filters.salesMonth !== 'all') {
      const saleDate = new Date(sale.date)
      const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0')
      if (saleMonth !== filters.salesMonth) return false
    }
    
    // Filter tahun penjualan
    if (filters.salesYear && filters.salesYear !== 'all') {
      const saleDate = new Date(sale.date)
      const saleYear = saleDate.getFullYear().toString()
      if (saleYear !== filters.salesYear) return false
    }
    
    return true
  })

  // Sort by date descending (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export const filterFinancialData = (
  financialData: FinancialSummary[],
  filters: ReportFilters
): FinancialSummary[] => {
  return financialData.filter(item => {
    if (filters.month !== 'all' && item.month !== filters.month) return false
    if (filters.year !== 'all' && item.year !== filters.year) return false
    return true
  })
}

export const filterExpenseData = (
  expenseData: ExpenseReport[],
  filters: ReportFilters
): ExpenseReport[] => {
  const filtered = expenseData.filter(expense => {
    if (filters.startDate && expense.date < filters.startDate) return false
    if (filters.endDate && expense.date > filters.endDate) return false
    
    // Filter bulan dan tahun untuk data expenses
    if (filters.month !== 'all') {
      const expenseDate = new Date(expense.date)
      const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, '0')
      if (expenseMonth !== filters.month) return false
    }
    if (filters.year !== 'all') {
      const expenseDate = new Date(expense.date)
      const expenseYear = expenseDate.getFullYear().toString()
      if (expenseYear !== filters.year) return false
    }
    
    return true
  })

  // Sort by date descending (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export const filterFieldTripSalesData = (
  fieldTripSalesData: FieldTripSaleReport[],
  filters: ReportFilters
): FieldTripSaleReport[] => {
  const filtered = fieldTripSalesData.filter(sale => {
    if (filters.startDate && sale.date < filters.startDate) return false
    if (filters.endDate && sale.date > filters.endDate) return false
    if (filters.doctor && sale.doctorName && !sale.doctorName.toLowerCase().includes(filters.doctor.toLowerCase())) {
      return false
    }
    if (filters.employee && sale.employeeName && !sale.employeeName.toLowerCase().includes(filters.employee.toLowerCase())) {
      return false
    }
    
    // Filter pencarian produk field trip
    if (filters.searchFieldTripProduct && !sale.productName.toLowerCase().includes(filters.searchFieldTripProduct.toLowerCase())) {
      return false
    }
    
    // Filter pencarian lokasi
    if (filters.searchLocation && !sale.location.toLowerCase().includes(filters.searchLocation.toLowerCase())) {
      return false
    }
    
    // Filter bulan field trip
    if (filters.fieldTripMonth && filters.fieldTripMonth !== 'all') {
      const fieldTripDate = new Date(sale.date)
      const fieldTripMonth = (fieldTripDate.getMonth() + 1).toString().padStart(2, '0')
      if (fieldTripMonth !== filters.fieldTripMonth) return false
    }
    
    // Filter tahun field trip
    if (filters.fieldTripYear && filters.fieldTripYear !== 'all') {
      const fieldTripDate = new Date(sale.date)
      const fieldTripYear = fieldTripDate.getFullYear().toString()
      if (fieldTripYear !== filters.fieldTripYear) return false
    }
    
    return true
  })

  // Sort by date descending (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export const getDefaultFilters = (): ReportFilters => {
  const { currentMonth, currentYear } = getCurrentMonthYear()
  
  // Get current month date range for default filters
  const today = new Date()
  const currentYearNum = today.getFullYear()
  const currentMonthNum = today.getMonth()
  const firstDayOfMonth = new Date(currentYearNum, currentMonthNum, 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(currentYearNum, currentMonthNum + 1, 0).toISOString().split('T')[0]
  
  return {
    startDate: firstDayOfMonth,  // Awal bulan berjalan
    endDate: lastDayOfMonth,     // Akhir bulan berjalan
    month: currentMonth, // Default ke bulan berjalan
    year: currentYear,   // Default ke tahun berjalan
    doctor: '',
    employee: '',
    selectedDoctorId: 'all',
    shift: 'all',
    date: '',
    type: 'all',
    searchProduct: '',
    productCategory: 'all',
    salesMonth: currentMonth,  // Default ke bulan berjalan untuk tab Sales
    salesYear: currentYear,    // Default ke tahun berjalan untuk tab Sales
    searchFieldTripProduct: '',
    searchLocation: '',
    fieldTripMonth: currentMonth,  // Default ke bulan berjalan untuk tab Field Trip
    fieldTripYear: currentYear,    // Default ke tahun berjalan untuk tab Field Trip
    searchPatient: '',
    searchTreatment: '',
    treatmentMonth: currentMonth,  // Default ke bulan berjalan untuk tab Treatment
    treatmentYear: currentYear     // Default ke tahun berjalan untuk tab Treatment
  }
}