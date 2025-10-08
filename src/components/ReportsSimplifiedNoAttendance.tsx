import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { FileText, Printer, Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart, Stethoscope, MapPin, Calculator, Filter } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from '../utils/reports/helpers'
import { months, years, shiftOptions, attendanceTypes, getLastRefreshInfo } from '../utils/reports/constants'
import { useMonthlyRefresh } from '../utils/reports/monthlyRefreshHook'

import { handlePrint } from '../utils/reports/printServiceFixed'
import { PrintPreviewDialog } from './PrintPreviewDialog'
import {
  fetchSalaryReport,
  fetchDoctorFeeReport,
  fetchExpenseReport,
  fetchTreatmentReport,
  fetchSalesReport,
  fetchFieldTripSales,
  calculateFinancialData
} from '../utils/reports/dataService'

import type {
  ReportsProps,
  SalaryReport,
  DoctorFeeReport,
  ExpenseReport,
  FinancialSummary,
  TreatmentReport,
  SalesReport,
  FieldTripSaleReport
} from '../utils/reports/types'
import { FieldTripBonusReportFixed } from './FieldTripBonusReportFixed'
import { AttendanceReportsUnified } from './AttendanceReportsUnified'

export function Reports({ accessToken }: ReportsProps) {
  // Debug: Log available years untuk monitoring
  console.log('📅 Years available in Reports:', years.map(y => `${y.value} (${y.label})`).join(', '))
  console.log('📅 Total years count:', years.length)
  
  const [loading, setLoading] = useState(false)
  const [salaryData, setSalaryData] = useState<SalaryReport[]>([])
  const [doctorFeeData, setDoctorFeeData] = useState<DoctorFeeReport[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([])
  const [treatmentData, setTreatmentData] = useState<TreatmentReport[]>([])
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [fieldTripSalesData, setFieldTripSalesData] = useState<FieldTripSaleReport[]>([])
  const [financialData, setFinancialData] = useState<FinancialSummary[]>([])
  
  // Doctor fee filters state
  const [doctorFeeFilters, setDoctorFeeFilters] = useState({
    startDate: '',
    endDate: '',
    doctorName: 'all',
    groupByDoctor: true // New option to group by doctor
  })
  
  // Financial report filters state
  const [financialFilters, setFinancialFilters] = useState({
    selectedYear: 'all',
    viewType: 'monthly' // 'monthly' or 'yearly'
  })

  // Expense filters state
  const [expenseFilters, setExpenseFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    searchText: ''
  })

  // Salary filters state
  const [salaryFilters, setSalaryFilters] = useState({
    searchEmployee: 'all',
    month: 'all',
    year: 'all'
  })

  // Sales filters state
  const [salesFilters, setSalesFilters] = useState({
    searchProduct: '',
    month: 'all',
    year: 'all'
  })

  // Field Trip filters state
  const [fieldTripFilters, setFieldTripFilters] = useState({
    searchOrganization: '',
    month: 'all',
    year: 'all'
  })

  // Treatment filters state
  const [treatmentFilters, setTreatmentFilters] = useState({
    searchPatient: '',
    month: 'all',
    year: 'all'
  })
  
  // Print preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    title: string
    content: string
    recordCount: number
    onConfirmPrint: () => void
  } | null>(null)
  
  // State untuk update last refresh info secara real-time (minimal untuk notifications)
  const [refreshStats, setRefreshStats] = useState({
    lastRefreshTime: null as Date | null,
    refreshDuration: 0,
    dataLoadStatus: 'ready' as 'loading' | 'ready' | 'error',
    errorCount: 0,
    lastError: null as string | null,
    autoRefreshHealth: 'healthy' as 'healthy' | 'warning' | 'critical',
    totalRefreshes: 0,
    avgLoadTime: 0,
    systemUptime: Date.now()
  })

  useEffect(() => {
    fetchAllData()
    
    // Show system ready notification (simplified for production)
    setTimeout(() => {
      toast.success('📊 Sistem Reports siap digunakan', {
        description: 'Auto refresh aktif • Konsisten year filter 2020-2040'
      })
    }, 2000)
  }, [])

  // Cleanup: lastRefreshDisplay no longer needed since debug panel removed

  /**
   * AUTO REFRESH SYSTEM - SISTEM AUTO REFRESH BULANAN
   * ================================================
   * 
   * Sistem ini mengimplementasikan auto refresh otomatis setiap tanggal 1 bulan baru.
   * Features:
   * - ✅ Auto refresh data setiap tanggal 1 bulan baru
   * - ✅ Manual refresh untuk testing (admin only)
   * - ✅ Error handling dengan retry mechanism (max 3 retries)
   * - ✅ Performance monitoring dengan statistik lengkap
   * - ✅ Real-time status updates dan health monitoring
   * - ✅ Debug panel dengan informasi sistem komprehensif
   * - ✅ Recovery mechanism untuk error handling
   * - ✅ Toast notifications untuk semua operasi
   * 
   * Hook ini menggunakan localStorage untuk tracking refresh terakhir
   * dan memastikan tidak ada duplicate refresh dalam hari yang sama.
   */
  const { triggerManualRefresh } = useMonthlyRefresh({
    onRefresh: async () => {
      console.log('🔄 Monthly auto refresh: Memuat ulang semua data laporan...')
      await fetchAllData()
      // Cleanup: lastRefreshDisplay removed
    },
    enabled: true,
    onError: (error) => {
      console.error('🔥 Auto refresh error handler called:', error)
      setRefreshStats(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastError: error.message,
        autoRefreshHealth: 'critical'
      }))
    },
    maxRetries: 3
  })

  useEffect(() => {
    console.log('Financial data calculation triggered with data:', {
      treatments: treatmentData.length,
      sales: salesData.length, 
      fieldTripSales: fieldTripSalesData.length,
      salaries: salaryData.length,
      doctorFees: doctorFeeData.length,
      expenses: expenseData.length
    })
    
    if (treatmentData.length > 0 || salesData.length > 0 || fieldTripSalesData.length > 0 || salaryData.length > 0 || doctorFeeData.length > 0 || expenseData.length > 0) {
      try {
        console.log('Calculating financial data...')
        const financialResults = calculateFinancialData(treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData)
        console.log('Financial calculation results:', financialResults)
        if (financialResults && Array.isArray(financialResults)) {
          setFinancialData(financialResults)
          console.log('Financial data set successfully:', financialResults.length, 'records')
        } else {
          console.log('No financial results or invalid results')
          setFinancialData([])
        }
      } catch (error) {
        console.error('Error calculating financial data:', error)
        setFinancialData([])
      }
    } else {
      console.log('No data available for financial calculation')
      setFinancialData([])
    }
  }, [treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData])

  const fetchAllData = async () => {
    const startTime = Date.now()
    setLoading(true)
    setRefreshStats(prev => ({ ...prev, dataLoadStatus: 'loading', lastRefreshTime: new Date() }))
    
    try {
      console.log('Fetching all report data...')
      const [salaries, doctorFees, expenses, treatments, sales, fieldTripSales] = await Promise.all([
        fetchSalaryReport(accessToken),
        fetchDoctorFeeReport(accessToken),
        fetchExpenseReport(accessToken),
        fetchTreatmentReport(accessToken),
        fetchSalesReport(accessToken),
        fetchFieldTripSales(accessToken)
      ])
      
      console.log('Fetched data results:', {
        salaries: salaries.length,
        doctorFees: doctorFees.length,
        expenses: expenses.length,
        treatments: treatments.length,
        sales: sales.length,
        fieldTripSales: fieldTripSales.length
      })
      
      setSalaryData(salaries)
      setDoctorFeeData(doctorFees)
      setExpenseData(expenses)
      setTreatmentData(treatments)
      setSalesData(sales)
      setFieldTripSalesData(fieldTripSales)
      
      console.log('All data set successfully')
      
      // Cleanup: lastRefreshDisplay removed for cleaner production UI
      
      // Update performance stats
      const duration = Date.now() - startTime
      setRefreshStats(prev => {
        const newTotalRefreshes = prev.totalRefreshes + 1
        const newAvgLoadTime = Math.round((prev.avgLoadTime * prev.totalRefreshes + duration) / newTotalRefreshes)
        
        return {
          ...prev, 
          dataLoadStatus: 'ready',
          refreshDuration: duration,
          totalRefreshes: newTotalRefreshes,
          avgLoadTime: newAvgLoadTime,
          // Reset error count on successful refresh
          errorCount: 0,
          lastError: null,
          autoRefreshHealth: 'healthy'
        }
      })
      console.log(`📊 Data refresh completed in ${duration}ms`)
      console.log('📊 Data summary:', {
        salaryRecords: salaryData.length,
        salesRecords: salesData.length,
        treatmentRecords: treatmentData.length,
        expenseRecords: expenseData.length,
        doctorFeeRecords: doctorFeeData.length,
        totalRecords: salaryData.length + salesData.length + treatmentData.length + expenseData.length + doctorFeeData.length
      })
      
      // Show completion notification for manual refresh
      if (duration > 100) { // Only show for actual data fetches
        toast.success('📊 Data laporan berhasil dimuat!', {
          description: `Semua data telah dimuat dalam ${duration}ms`
        })
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error fetching reports:', error)
      
      // Update error stats
      setRefreshStats(prev => ({
        ...prev,
        dataLoadStatus: 'error',
        errorCount: prev.errorCount + 1,
        lastError: errorMessage,
        autoRefreshHealth: prev.errorCount > 2 ? 'critical' : prev.errorCount > 0 ? 'warning' : 'healthy'
      }))
      
      // Enhanced error notification with retry suggestion
      toast.error('❌ Gagal mengambil data laporan', {
        description: `Error: ${errorMessage}. Coba refresh manual.`,
        action: {
          label: 'Retry',
          onClick: () => fetchAllData()
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Cleanup unused functions - debug panel removed for cleaner production UI

  // Helper function to process doctor fee data with accumulation
  const processedDoctorFeeData = () => {
    let data = doctorFeeData

    // Apply date filters
    if (doctorFeeFilters.startDate) {
      data = data.filter(fee => fee.date >= doctorFeeFilters.startDate)
    }
    if (doctorFeeFilters.endDate) {
      data = data.filter(fee => fee.date <= doctorFeeFilters.endDate)
    }

    // Apply doctor name filter
    if (doctorFeeFilters.doctorName !== 'all') {
      data = data.filter(fee => fee.doctorName === doctorFeeFilters.doctorName)
    }

    // Group by doctor if enabled
    if (doctorFeeFilters.groupByDoctor) {
      const grouped = data.reduce((acc, fee) => {
        const key = fee.doctorName
        if (!acc[key]) {
          // Get all dates for this doctor to create period range
          const doctorData = data.filter(f => f.doctorName === key)
          const dates = doctorData.map(f => new Date(f.date))
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
          
          let periodDisplay = ''
          if (minDate.getTime() === maxDate.getTime()) {
            periodDisplay = minDate.toLocaleDateString('id-ID', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          } else {
            periodDisplay = `${minDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short'
            })} - ${maxDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}`
          }
          
          acc[key] = {
            doctorName: fee.doctorName,
            doctor: fee.doctor,
            doctorId: fee.doctorId,
            period: periodDisplay,
            date: fee.date, // Keep for compatibility
            shift: 'Gabungan',
            treatmentFee: 0,
            sittingFee: 0,
            finalFee: 0,
            totalFee: 0,
            hasTreatments: false,
            recordCount: 0
          }
        }
        
        acc[key].treatmentFee += fee.treatmentFee || 0
        acc[key].sittingFee += fee.sittingFee || 0
        acc[key].finalFee += fee.finalFee || 0
        acc[key].totalFee += fee.totalFee || 0
        acc[key].hasTreatments = acc[key].hasTreatments || fee.hasTreatments
        acc[key].recordCount += 1
        
        return acc
      }, {} as Record<string, any>)
      
      return Object.values(grouped).sort((a, b) => b.totalFee - a.totalFee) // Sort by total fee descending
    }

    // Return individual records with formatted date, sorted by date descending
    return data.map(fee => ({
      ...fee,
      period: new Date(fee.date).toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Get unique doctor names for filter
  const uniqueDoctorNames = [...new Set(doctorFeeData.map(fee => fee.doctorName))].filter(Boolean)

  // Get unique expense categories for filter
  const uniqueExpenseCategories = [...new Set(expenseData.map(expense => expense.category))].filter(Boolean)

  // Get unique years from expense data for filter
  const uniqueExpenseYears = [...new Set(expenseData.map(expense => 
    new Date(expense.date).getFullYear().toString()
  ))].sort((a, b) => parseInt(b) - parseInt(a))

  // Note: Using years constant from utils/reports/constants.ts for consistent year filtering

  // Get unique employee names from salary data for filter
  const uniqueEmployeeNames = [...new Set(salaryData.map(salary => 
    salary.employeeName
  ).filter(Boolean))].sort()

  // Helper function to process financial data with filters and aggregation
  const processFinancialData = () => {
    let data = [...financialData]
    
    // Apply year filter
    if (financialFilters.selectedYear !== 'all') {
      data = data.filter(item => item.year === financialFilters.selectedYear)
    }
    
    // Apply view type aggregation
    if (financialFilters.viewType === 'yearly') {
      const yearlyData: { [year: string]: any } = {}
      
      data.forEach(item => {
        const year = item.year
        if (!yearlyData[year]) {
          yearlyData[year] = {
            period: `Tahun ${year}`,
            year: year,
            totalIncome: 0,
            totalExpense: 0,
            profit: 0,
            margin: 0,
            treatmentIncome: 0,
            salesIncome: 0,
            fieldTripIncome: 0,
            salaryExpense: 0,
            doctorFeeExpense: 0,
            expenses: 0,
            recordCount: 0
          }
        }
        
        // Aggregate all values
        yearlyData[year].totalIncome += (item as any).totalIncome || 0
        yearlyData[year].totalExpense += (item as any).totalExpense || 0
        yearlyData[year].treatmentIncome += item.treatmentIncome || 0
        yearlyData[year].salesIncome += item.salesIncome || 0
        yearlyData[year].fieldTripIncome += item.fieldTripIncome || 0
        yearlyData[year].salaryExpense += item.salaryExpense || 0
        yearlyData[year].doctorFeeExpense += item.doctorFeeExpense || 0
        yearlyData[year].expenses += item.expenses || 0
        yearlyData[year].recordCount += 1
      })
      
      // Calculate final profit and margin for each year
      Object.values(yearlyData).forEach((yearData: any) => {
        yearData.profit = yearData.totalIncome - yearData.totalExpense
        yearData.margin = yearData.totalIncome > 0 ? (yearData.profit / yearData.totalIncome) * 100 : 0
      })
      
      return Object.values(yearlyData).sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year))
    }
    
    // Return monthly data sorted by year-month descending
    return data.sort((a, b) => {
      const aKey = `${a.year}-${a.month.padStart(2, '0')}`
      const bKey = `${b.year}-${b.month.padStart(2, '0')}`
      return bKey.localeCompare(aKey)
    })
  }

  // Note: Using years constant from utils/reports/constants.ts for consistent year filtering across all reports

  // Filter salary data
  const filteredSalaryData = (() => {
    let filtered = salaryData

    // Filter by employee name
    if (salaryFilters.searchEmployee && salaryFilters.searchEmployee !== 'all') {
      filtered = filtered.filter(salary => 
        salary.employeeName === salaryFilters.searchEmployee
      )
    }

    // Filter by month
    if (salaryFilters.month !== 'all') {
      filtered = filtered.filter(salary => 
        salary.month === salaryFilters.month
      )
    }

    // Filter by year
    if (salaryFilters.year !== 'all') {
      filtered = filtered.filter(salary => 
        salary.year === salaryFilters.year
      )
    }

    // Sort by employee name
    return filtered.sort((a, b) => 
      (a.employeeName || '').localeCompare(b.employeeName || '')
    )
  })()
  const filteredDoctorFeeData = processedDoctorFeeData()
  
  // Filter treatment data
  const filteredTreatmentData = (() => {
    let filtered = treatmentData

    // Filter by patient name search
    if (treatmentFilters.searchPatient) {
      const searchLower = treatmentFilters.searchPatient.toLowerCase()
      filtered = filtered.filter(treatment => 
        (treatment.patientName || '').toLowerCase().includes(searchLower)
      )
    }

    // Filter by month
    if (treatmentFilters.month !== 'all') {
      filtered = filtered.filter(treatment => {
        const treatmentDate = new Date(treatment.date)
        const treatmentMonth = (treatmentDate.getMonth() + 1).toString().padStart(2, '0')
        return treatmentMonth === treatmentFilters.month
      })
    }

    // Filter by year
    if (treatmentFilters.year !== 'all') {
      filtered = filtered.filter(treatment => {
        const treatmentDate = new Date(treatment.date)
        const treatmentYear = treatmentDate.getFullYear().toString()
        return treatmentYear === treatmentFilters.year
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })()
  
  // Filter sales data
  const filteredSalesData = (() => {
    let filtered = salesData

    // Filter by product name search
    if (salesFilters.searchProduct) {
      const searchLower = salesFilters.searchProduct.toLowerCase()
      filtered = filtered.filter(sale => 
        (sale.productName || '').toLowerCase().includes(searchLower)
      )
    }

    // Filter by month
    if (salesFilters.month !== 'all') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date)
        const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0')
        return saleMonth === salesFilters.month
      })
    }

    // Filter by year
    if (salesFilters.year !== 'all') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date)
        const saleYear = saleDate.getFullYear().toString()
        return saleYear === salesFilters.year
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })()
  
  // Filter field trip sales data
  const filteredFieldTripSalesData = (() => {
    let filtered = fieldTripSalesData

    // Filter by organization name search
    if (fieldTripFilters.searchOrganization) {
      const searchLower = fieldTripFilters.searchOrganization.toLowerCase()
      filtered = filtered.filter(sale => 
        (sale.organization || '').toLowerCase().includes(searchLower)
      )
    }

    // Filter by month
    if (fieldTripFilters.month !== 'all') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date)
        const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0')
        return saleMonth === fieldTripFilters.month
      })
    }

    // Filter by year
    if (fieldTripFilters.year !== 'all') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date)
        const saleYear = saleDate.getFullYear().toString()
        return saleYear === fieldTripFilters.year
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })()
  const filteredFinancialData = processFinancialData()
  const filteredExpenseData = (() => {
    let filtered = expenseData

    // Filter by date range
    if (expenseFilters.startDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) >= new Date(expenseFilters.startDate)
      )
    }
    if (expenseFilters.endDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) <= new Date(expenseFilters.endDate)
      )
    }

    // Filter by category
    if (expenseFilters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === expenseFilters.category)
    }

    // Filter by amount range
    if (expenseFilters.minAmount) {
      const minAmount = parseFloat(expenseFilters.minAmount)
      filtered = filtered.filter(expense => (expense.amount || 0) >= minAmount)
    }
    if (expenseFilters.maxAmount) {
      const maxAmount = parseFloat(expenseFilters.maxAmount)
      filtered = filtered.filter(expense => (expense.amount || 0) <= maxAmount)
    }

    // Filter by search text (description or notes)
    if (expenseFilters.searchText) {
      const searchLower = expenseFilters.searchText.toLowerCase()
      filtered = filtered.filter(expense => 
        (expense.description || '').toLowerCase().includes(searchLower) ||
        (expense.notes || '').toLowerCase().includes(searchLower)
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })()

  const onPrint = (type: string, usePreview: boolean = true, customData?: any) => {
    console.log('=== PRINT FUNCTION CALLED ===')
    console.log('Print triggered for type:', type, 'with preview:', usePreview)
    console.log('Custom data:', customData)
    console.log('Available data:', {
      salary: filteredSalaryData?.length,
      doctorFees: filteredDoctorFeeData?.length,
      treatments: filteredTreatmentData?.length,
      sales: filteredSalesData?.length,
      fieldTripSales: filteredFieldTripSalesData?.length,
      expenses: filteredExpenseData?.length,
      financial: filteredFinancialData?.length
    })
    
    // Prepare filters for signature section
    let filtersForPrint = undefined
    let fieldTripBonusData = undefined
    let fieldTripBonusFilters = undefined
    
    if (type === 'doctor-fees') {
      filtersForPrint = {
        doctorName: doctorFeeFilters.doctorName,
        groupByDoctor: doctorFeeFilters.groupByDoctor
      }
      console.log('Doctor fee filters for print:', filtersForPrint)
    } else if (type === 'financial') {
      filtersForPrint = {
        selectedYear: financialFilters.selectedYear,
        viewType: financialFilters.viewType
      }
      console.log('Financial filters for print:', filtersForPrint)
    } else if (type === 'salary') {
      filtersForPrint = {
        searchEmployee: salaryFilters.searchEmployee,
        month: salaryFilters.month,
        year: salaryFilters.year
      }
      console.log('Salary filters for print:', filtersForPrint)
    } else if (type === 'field-trip-doctor-fees-custom') {
      // Handle custom field trip data with filters
      fieldTripBonusData = customData?.data || []
      fieldTripBonusFilters = customData?.filters || {}
      // Convert to regular field trip type
      type = 'field-trip-doctor-fees'
      console.log('Field trip custom data for print:', { fieldTripBonusData, fieldTripBonusFilters })
    } else if (type === 'field-trip-doctor-fees' || type === 'field-trip-employee-bonuses') {
      // These will use generic signature
      filtersForPrint = {}
      console.log('Field trip bonus filters for print:', filtersForPrint)
    }
    
    const handleShowPreview = usePreview ? (data: {
      title: string
      content: string
      recordCount: number
      onConfirmPrint: () => void
    }) => {
      setPreviewData(data)
      setShowPreview(true)
    } : undefined
    
    try {
      console.log('Calling handlePrint with preview:', usePreview)
      handlePrint(
        type,
        [], // No attendance data
        filteredSalaryData,
        filteredDoctorFeeData,
        filteredTreatmentData,
        filteredSalesData,
        filteredFieldTripSalesData,
        filteredExpenseData,
        filteredFinancialData,
        handleShowPreview, // Preview callback
        filtersForPrint, // Filters for signature (doctor fees or financial)
        fieldTripBonusData, // Custom field trip data
        fieldTripBonusFilters // Custom field trip filters
      )
      console.log('handlePrint called successfully')
    } catch (error) {
      console.error('Error in onPrint:', error)
      toast.error('Gagal memproses permintaan print')
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setPreviewData(null)
  }

  return (
    <div className="space-y-6">



      {/* Tabs untuk berbagai jenis laporan */}
      <Tabs defaultValue="salary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9 bg-pink-100">
          <TabsTrigger value="salary" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Gaji</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Penjualan</span>
          </TabsTrigger>
          <TabsTrigger value="field-trip-sales" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Field Trip</span>
          </TabsTrigger>
          <TabsTrigger value="field-trip-bonus" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Calculator className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Fee & Bonus</span>
          </TabsTrigger>
          <TabsTrigger value="treatments" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Stethoscope className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Tindakan</span>
          </TabsTrigger>
          <TabsTrigger value="doctor-fees" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Fee Dokter</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <TrendingDown className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Pengeluaran</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Keuangan</span>
          </TabsTrigger>
          <TabsTrigger value="employee-attendance" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Absensi</span>
          </TabsTrigger>
        </TabsList>

        {/* Laporan Fee & Bonus Field Trip */}
        <TabsContent value="field-trip-bonus" className="space-y-4">
          <FieldTripBonusReportFixed
            accessToken={accessToken}
            onPrint={onPrint}
            fieldTripSalesData={filteredFieldTripSalesData}
          />
        </TabsContent>

        {/* Laporan Absensi (Dokter & Karyawan) */}
        <TabsContent value="employee-attendance" className="space-y-4">
          <AttendanceReportsUnified accessToken={accessToken} />
        </TabsContent>

        {/* Laporan Gaji */}
        <TabsContent value="salary" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Laporan Gaji Karyawan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filter Section for Salary */}
              <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-pink-600" />
                  <span className="text-pink-800 font-medium">Filter Pencarian</span>
                  {(salaryFilters.searchEmployee !== 'all' || salaryFilters.month !== 'all' || salaryFilters.year !== 'all') && (
                    <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">
                      {filteredSalaryData.length} dari {salaryData.length} data
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="salary-search" className="text-sm text-pink-700">Cari Karyawan</Label>
                    <Select value={salaryFilters.searchEmployee} onValueChange={(value) => setSalaryFilters(prev => ({ ...prev, searchEmployee: value }))}>
                      <SelectTrigger className="border-pink-200 focus:border-pink-500">
                        <SelectValue placeholder="Pilih karyawan..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Karyawan</SelectItem>
                        {uniqueEmployeeNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary-month" className="text-sm text-pink-700">Bulan</Label>
                    <Select value={salaryFilters.month} onValueChange={(value) => setSalaryFilters(prev => ({ ...prev, month: value }))}>
                      <SelectTrigger className="border-pink-200 focus:border-pink-500">
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = i + 1
                          const monthName = new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' })
                          return (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {monthName}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary-year" className="text-sm text-pink-700">Tahun</Label>
                    <Select value={salaryFilters.year} onValueChange={(value) => setSalaryFilters(prev => ({ ...prev, year: value }))}>
                      <SelectTrigger className="border-pink-200 focus:border-pink-500">
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => setSalaryFilters({ searchEmployee: 'all', month: 'all', year: 'all' })}
                      variant="outline"
                      className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Karyawan</TableHead>
                      <TableHead className="text-pink-700">Periode</TableHead>
                      <TableHead className="text-pink-700">Gaji Pokok</TableHead>
                      <TableHead className="text-pink-700">Bonus</TableHead>
                      <TableHead className="text-pink-700">Tunjangan</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredSalaryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data gaji untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSalaryData.map((salary, index) => (
                        <TableRow key={`salary-${salary.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{salary.employeeName}</TableCell>
                          <TableCell>{salary.period || `${salary.month}/${salary.year}`}</TableCell>
                          <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                          <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                          <TableCell>{formatCurrency(salary.holidayAllowance)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(salary.totalSalary)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredSalaryData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredSalaryData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Karyawan</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredSalaryData.reduce((sum, salary) => sum + (salary.baseSalary || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Gaji Pokok</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(filteredSalaryData.reduce((sum, salary) => sum + (salary.bonus || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Bonus</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredSalaryData.reduce((sum, salary) => sum + (salary.totalSalary || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Keseluruhan</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Penjualan */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Laporan Penjualan
                </CardTitle>
                <Button
                  onClick={() => onPrint('sales')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Pencarian */}
              <Card className="mb-6 border-pink-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-pink-600" />
                    <h3 className="text-pink-800 font-semibold">Filter Pencarian</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-pink-700">Cari Produk</Label>
                      <Input
                        type="text"
                        placeholder="Semua Produk"
                        value={salesFilters?.searchProduct || ''}
                        onChange={(e) => setSalesFilters({ ...salesFilters, searchProduct: e.target.value })}
                        className="border-pink-200 bg-white focus:border-pink-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-pink-700">Bulan</Label>
                      <Select value={salesFilters?.month || 'all'} onValueChange={(value) => setSalesFilters({ ...salesFilters, month: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          <SelectItem value="01">Januari</SelectItem>
                          <SelectItem value="02">Februari</SelectItem>
                          <SelectItem value="03">Maret</SelectItem>
                          <SelectItem value="04">April</SelectItem>
                          <SelectItem value="05">Mei</SelectItem>
                          <SelectItem value="06">Juni</SelectItem>
                          <SelectItem value="07">Juli</SelectItem>
                          <SelectItem value="08">Agustus</SelectItem>
                          <SelectItem value="09">September</SelectItem>
                          <SelectItem value="10">Oktober</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">Desember</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Tahun</Label>
                      <Select value={salesFilters?.year || 'all'} onValueChange={(value) => setSalesFilters({ ...salesFilters, year: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">&nbsp;</Label>
                      <Button
                        onClick={() => setSalesFilters({ searchProduct: '', month: 'all', year: 'all' })}
                        variant="outline"
                        className="w-full border-pink-600 text-pink-600 hover:bg-pink-50"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Qty</TableHead>
                      <TableHead className="text-pink-700">Harga Satuan</TableHead>
                      <TableHead className="text-pink-700">Subtotal</TableHead>
                      <TableHead className="text-pink-700">Diskon</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredSalesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          Tidak ada data penjualan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSalesData.map((sale, index) => {
                        const subtotal = sale.subtotal || (sale.quantity * (sale.pricePerUnit || sale.price || 0))
                        const discountAmount = sale.discountAmount || 0
                        const discountPercentage = sale.discountPercentage || 0
                        
                        return (
                          <TableRow key={`sale-${sale.id || index}-${index}`}>
                            <TableCell className="text-center">{index + 1}</TableCell>
                            <TableCell>{sale.productName}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {getCategoryLabel(sale.productCategory || sale.category)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{sale.quantity}</TableCell>
                            <TableCell>{formatCurrency(sale.pricePerUnit || sale.price || 0)}</TableCell>
                            <TableCell className="font-medium text-green-600">{formatCurrency(subtotal)}</TableCell>
                            <TableCell>
                              {discountAmount > 0 ? (
                                <span className="text-red-600 font-medium">
                                  -{formatCurrency(discountAmount)}
                                  {discountPercentage > 0 && (
                                    <span className="text-xs text-gray-500 block">
                                      ({discountPercentage.toFixed(1)}%)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-purple-600">{formatCurrency(sale.totalAmount)}</TableCell>
                            <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredSalesData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredSalesData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Transaksi</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {filteredSalesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Qty</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + (sale.subtotal || (sale.quantity * (sale.pricePerUnit || sale.price || 0))), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Subtotal</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Diskon</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Penjualan</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Field Trip Sales */}
        <TabsContent value="field-trip-sales" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Laporan Field Trip Sales
                </CardTitle>
                <Button
                  onClick={() => onPrint('field-trip-sales')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Pencarian */}
              <Card className="mb-6 border-pink-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-pink-600" />
                    <h3 className="text-pink-800 font-semibold">Filter Pencarian</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-pink-700">Cari Organisasi</Label>
                      <Input
                        type="text"
                        placeholder="Semua Organisasi"
                        value={fieldTripFilters?.searchOrganization || ''}
                        onChange={(e) => setFieldTripFilters({ ...fieldTripFilters, searchOrganization: e.target.value })}
                        className="border-pink-200 bg-white focus:border-pink-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-pink-700">Bulan</Label>
                      <Select value={fieldTripFilters?.month || 'all'} onValueChange={(value) => setFieldTripFilters({ ...fieldTripFilters, month: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          <SelectItem value="01">Januari</SelectItem>
                          <SelectItem value="02">Februari</SelectItem>
                          <SelectItem value="03">Maret</SelectItem>
                          <SelectItem value="04">April</SelectItem>
                          <SelectItem value="05">Mei</SelectItem>
                          <SelectItem value="06">Juni</SelectItem>
                          <SelectItem value="07">Juli</SelectItem>
                          <SelectItem value="08">Agustus</SelectItem>
                          <SelectItem value="09">September</SelectItem>
                          <SelectItem value="10">Oktober</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">Desember</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Tahun</Label>
                      <Select value={fieldTripFilters?.year || 'all'} onValueChange={(value) => setFieldTripFilters({ ...fieldTripFilters, year: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">&nbsp;</Label>
                      <Button
                        onClick={() => setFieldTripFilters({ searchOrganization: '', month: 'all', year: 'all' })}
                        variant="outline"
                        className="w-full border-pink-600 text-pink-600 hover:bg-pink-50"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Organisasi</TableHead>
                      <TableHead className="text-pink-700">Lokasi</TableHead>
                      <TableHead className="text-pink-700">Peserta</TableHead>
                      <TableHead className="text-pink-700">Harga/Peserta</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredFieldTripSalesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data field trip sales untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFieldTripSalesData.map((sale, index) => (
                        <TableRow key={`field-trip-${sale.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{sale.organization}</TableCell>
                          <TableCell>{sale.location}</TableCell>
                          <TableCell className="text-center">{sale.quantity}</TableCell>
                          <TableCell>{formatCurrency(sale.price)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                          <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredFieldTripSalesData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredFieldTripSalesData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Field Trip</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {filteredFieldTripSalesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Peserta</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredFieldTripSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredFieldTripSalesData.length > 0 ? filteredFieldTripSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / filteredFieldTripSalesData.length : 0)}
                      </div>
                      <div className="text-sm text-gray-600">Rata-rata/Field Trip</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Tindakan */}
        <TabsContent value="treatments" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Laporan Tindakan
                </CardTitle>
                <Button
                  onClick={() => onPrint('treatments')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Pencarian */}
              <Card className="mb-6 border-pink-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-pink-600" />
                    <h3 className="text-pink-800 font-semibold">Filter Pencarian</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-pink-700">Cari Pasien</Label>
                      <Input
                        type="text"
                        placeholder="Semua Pasien"
                        value={treatmentFilters?.searchPatient || ''}
                        onChange={(e) => setTreatmentFilters({ ...treatmentFilters, searchPatient: e.target.value })}
                        className="border-pink-200 bg-white focus:border-pink-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-pink-700">Bulan</Label>
                      <Select value={treatmentFilters?.month || 'all'} onValueChange={(value) => setTreatmentFilters({ ...treatmentFilters, month: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          <SelectItem value="01">Januari</SelectItem>
                          <SelectItem value="02">Februari</SelectItem>
                          <SelectItem value="03">Maret</SelectItem>
                          <SelectItem value="04">April</SelectItem>
                          <SelectItem value="05">Mei</SelectItem>
                          <SelectItem value="06">Juni</SelectItem>
                          <SelectItem value="07">Juli</SelectItem>
                          <SelectItem value="08">Agustus</SelectItem>
                          <SelectItem value="09">September</SelectItem>
                          <SelectItem value="10">Oktober</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">Desember</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Tahun</Label>
                      <Select value={treatmentFilters?.year || 'all'} onValueChange={(value) => setTreatmentFilters({ ...treatmentFilters, year: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">&nbsp;</Label>
                      <Button
                        onClick={() => setTreatmentFilters({ searchPatient: '', month: 'all', year: 'all' })}
                        variant="outline"
                        className="w-full border-pink-600 text-pink-600 hover:bg-pink-50"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Pasien</TableHead>
                      <TableHead className="text-pink-700">Tindakan</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Biaya</TableHead>
                      <TableHead className="text-pink-700">Status</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTreatmentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data tindakan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTreatmentData.map((treatment, index) => (
                        <TableRow key={`treatment-${treatment.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{treatment.patientName}</TableCell>
                          <TableCell>{treatment.treatmentName}</TableCell>
                          <TableCell>{treatment.doctorName}</TableCell>
                          <TableCell>{formatCurrency(treatment.nominal || treatment.amount || 0)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              treatment.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-800' :
                              treatment.paymentStatus === 'DP' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {treatment.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(treatment.date).toLocaleDateString('id-ID')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredTreatmentData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredTreatmentData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Tindakan</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {filteredTreatmentData.filter(t => t.paymentStatus === 'Lunas').length}
                      </div>
                      <div className="text-sm text-gray-600">Lunas</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {filteredTreatmentData.filter(t => t.paymentStatus === 'DP').length}
                      </div>
                      <div className="text-sm text-gray-600">DP</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredTreatmentData.reduce((sum, treatment) => sum + (treatment.nominal || treatment.amount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Fee Dokter */}
        <TabsContent value="doctor-fees" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Laporan Fee Dokter
                </CardTitle>
                <Button
                  onClick={() => onPrint('doctor-fees')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <Card className="mb-4 border-pink-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-800">Filter Laporan</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-sm">Tanggal Mulai</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={doctorFeeFilters.startDate}
                        onChange={(e) => setDoctorFeeFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm">Tanggal Akhir</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={doctorFeeFilters.endDate}
                        onChange={(e) => setDoctorFeeFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-filter" className="text-sm">Dokter</Label>
                      <Select
                        value={doctorFeeFilters.doctorName}
                        onValueChange={(value) => setDoctorFeeFilters(prev => ({ ...prev, doctorName: value }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue placeholder="Pilih dokter..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Dokter</SelectItem>
                          {uniqueDoctorNames.map((doctorName) => (
                            <SelectItem key={doctorName} value={doctorName}>
                              {doctorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-filter" className="text-sm">Tampilan</Label>
                      <Select
                        value={doctorFeeFilters.groupByDoctor ? 'grouped' : 'individual'}
                        onValueChange={(value) => setDoctorFeeFilters(prev => ({ ...prev, groupByDoctor: value === 'grouped' }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grouped">Akumulasi per Dokter</SelectItem>
                          <SelectItem value="individual">Detail per Hari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => setDoctorFeeFilters({
                        startDate: '',
                        endDate: '',
                        doctorName: 'all',
                        groupByDoctor: true
                      })}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Reset Filter
                    </Button>
                    <Button
                      onClick={fetchAllData}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      disabled={loading}
                    >
                      Refresh Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">
                        {doctorFeeFilters.groupByDoctor ? 'Periode' : 'Tanggal'}
                      </TableHead>
                      <TableHead className="text-pink-700">Fee Tindakan</TableHead>
                      <TableHead className="text-pink-700">Uang Duduk</TableHead>
                      <TableHead className="text-pink-700">Total Fee</TableHead>
                      {doctorFeeFilters.groupByDoctor && (
                        <TableHead className="text-pink-700">Jumlah Hari</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={doctorFeeFilters.groupByDoctor ? 7 : 6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredDoctorFeeData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={doctorFeeFilters.groupByDoctor ? 7 : 6} className="text-center py-8 text-gray-500">
                          Tidak ada data fee dokter untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDoctorFeeData.map((fee, index) => (
                        <TableRow key={`doctor-fee-${fee.doctorId || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">{fee.doctorName}</TableCell>
                          <TableCell className="text-sm">{fee.period}</TableCell>
                          <TableCell>{formatCurrency(fee.treatmentFee)}</TableCell>
                          <TableCell>{formatCurrency(fee.sittingFee)}</TableCell>
                          <TableCell className="font-bold text-pink-600">{formatCurrency(fee.totalFee)}</TableCell>
                          {doctorFeeFilters.groupByDoctor && (
                            <TableCell className="text-center text-sm">
                              {(fee as any).recordCount || 1} hari
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredDoctorFeeData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredDoctorFeeData.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        {doctorFeeFilters.groupByDoctor ? 'Total Dokter' : 'Total Records'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + (fee.treatmentFee || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Fee Tindakan</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + (fee.sittingFee || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Uang Duduk</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + (fee.totalFee || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Keseluruhan</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Pengeluaran */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Laporan Pengeluaran
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={fetchAllData}
                    variant="outline"
                    className="border-pink-600 text-pink-600 hover:bg-pink-50"
                    disabled={loading}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m-15.356-2A8.001 8.001 0 0019.419 15" />
                    </svg>
                    Refresh
                  </Button>
                  <div className="flex">
                    <Button
                      onClick={() => onPrint('expenses', true)}
                      className="bg-pink-600 hover:bg-pink-700 text-white rounded-r-none"
                      disabled={loading}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => onPrint('expenses', false)}
                      className="bg-pink-500 hover:bg-pink-600 text-white rounded-l-none border-l border-pink-400 px-3"
                      disabled={loading}
                      title="Print langsung tanpa preview"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Expense Filters */}
              <Card className="mb-4 border-pink-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-800">Filter Laporan Pengeluaran</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-start-date" className="text-sm">Tanggal Mulai</Label>
                      <Input
                        id="expense-start-date"
                        type="date"
                        value={expenseFilters.startDate}
                        onChange={(e) => setExpenseFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-end-date" className="text-sm">Tanggal Akhir</Label>
                      <Input
                        id="expense-end-date"
                        type="date"
                        value={expenseFilters.endDate}
                        onChange={(e) => setExpenseFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-category-filter" className="text-sm">Kategori</Label>
                      <Select
                        value={expenseFilters.category}
                        onValueChange={(value) => setExpenseFilters(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          {uniqueExpenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {getCategoryLabel(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-min-amount" className="text-sm">Jumlah Minimal (Rp)</Label>
                      <Input
                        id="expense-min-amount"
                        type="number"
                        placeholder="0"
                        value={expenseFilters.minAmount}
                        onChange={(e) => setExpenseFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-max-amount" className="text-sm">Jumlah Maksimal (Rp)</Label>
                      <Input
                        id="expense-max-amount"
                        type="number"
                        placeholder="Tidak terbatas"
                        value={expenseFilters.maxAmount}
                        onChange={(e) => setExpenseFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-search" className="text-sm">Cari Deskripsi/Keterangan</Label>
                      <Input
                        id="expense-search"
                        type="text"
                        placeholder="Kata kunci pencarian..."
                        value={expenseFilters.searchText}
                        onChange={(e) => setExpenseFilters(prev => ({ ...prev, searchText: e.target.value }))}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Filter Buttons */}
                  <div className="mt-4">
                    <Label className="text-sm text-pink-700 mb-2 block">Filter Cepat Kategori:</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Operasional', 'Peralatan Medis', 'Obat-obatan', 'Utilitas', 'Marketing'].map((category) => (
                        <Button
                          key={category}
                          onClick={() => setExpenseFilters(prev => ({ ...prev, category }))}
                          variant={expenseFilters.category === category ? "default" : "outline"}
                          size="sm"
                          className={
                            expenseFilters.category === category 
                              ? "bg-pink-600 hover:bg-pink-700 text-white" 
                              : "border-pink-200 text-pink-600 hover:bg-pink-50"
                          }
                        >
                          {getCategoryLabel(category)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Date Filter Buttons */}
                  <div className="mt-3">
                    <Label className="text-sm text-pink-700 mb-2 block">Filter Cepat Tanggal:</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0]
                          setExpenseFilters(prev => ({ ...prev, startDate: today, endDate: today }))
                        }}
                        variant="outline"
                        size="sm"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        Hari Ini
                      </Button>
                      <Button
                        onClick={() => {
                          const today = new Date()
                          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                          setExpenseFilters(prev => ({ 
                            ...prev, 
                            startDate: weekAgo.toISOString().split('T')[0], 
                            endDate: today.toISOString().split('T')[0] 
                          }))
                        }}
                        variant="outline"
                        size="sm"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        7 Hari Terakhir
                      </Button>
                      <Button
                        onClick={() => {
                          const today = new Date()
                          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                          setExpenseFilters(prev => ({ 
                            ...prev, 
                            startDate: firstDay.toISOString().split('T')[0], 
                            endDate: today.toISOString().split('T')[0] 
                          }))
                        }}
                        variant="outline"
                        size="sm"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        Bulan Ini
                      </Button>
                      <Button
                        onClick={() => {
                          const today = new Date()
                          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                          setExpenseFilters(prev => ({ 
                            ...prev, 
                            startDate: monthAgo.toISOString().split('T')[0], 
                            endDate: today.toISOString().split('T')[0] 
                          }))
                        }}
                        variant="outline"
                        size="sm"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        30 Hari Terakhir
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => setExpenseFilters({
                        startDate: '',
                        endDate: '',
                        category: 'all',
                        minAmount: '',
                        maxAmount: '',
                        searchText: ''
                      })}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Reset Filter
                    </Button>
                    <Button
                      onClick={fetchAllData}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      disabled={loading}
                    >
                      Refresh Data
                    </Button>
                    <Button
                      onClick={() => {
                        // Export filtered data to CSV
                        if (filteredExpenseData.length === 0) {
                          toast.error('Tidak ada data untuk diexport')
                          return
                        }
                        
                        const csvData = filteredExpenseData.map((expense, index) => ({
                          No: index + 1,
                          Deskripsi: expense.description,
                          Kategori: getCategoryLabel(expense.category),
                          Jumlah: expense.amount,
                          Tanggal: new Date(expense.date).toLocaleDateString('id-ID'),
                          Keterangan: expense.notes || '-'
                        }))
                        
                        const csvString = [
                          Object.keys(csvData[0] || {}).join(','),
                          ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
                        ].join('\\n')
                        
                        const blob = new Blob([csvString], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `laporan-pengeluaran-${new Date().toISOString().split('T')[0]}.csv`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        
                        toast.success(`Data pengeluaran (${filteredExpenseData.length} records) berhasil diexport ke CSV`)
                      }}
                      variant="outline"
                      size="sm"
                      className="border-green-200 text-green-600 hover:bg-green-50"
                      disabled={filteredExpenseData.length === 0}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                  
                  {/* Filter Status */}
                  <div className="mt-3 flex items-center justify-between text-xs text-pink-600">
                    <div>
                      {(expenseFilters.startDate || expenseFilters.endDate || expenseFilters.category !== 'all' || 
                        expenseFilters.minAmount || expenseFilters.maxAmount || expenseFilters.searchText) ? (
                        <span className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          Filter aktif: Menampilkan {filteredExpenseData.length} dari {expenseData.length} data
                        </span>
                      ) : (
                        <span>Menampilkan semua {expenseData.length} data pengeluaran</span>
                      )}
                    </div>
                    {filteredExpenseData.length > 0 && (
                      <span className="text-pink-500">
                        Total: {formatCurrency(filteredExpenseData.reduce((sum, expense) => sum + (expense.amount || 0), 0))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Deskripsi</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Jumlah</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenseData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada data pengeluaran untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenseData.map((expense, index) => (
                        <TableRow key={`expense-${expense.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>{new Date(expense.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{expense.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredExpenseData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredExpenseData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Transaksi</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(filteredExpenseData.reduce((sum, expense) => sum + (expense.amount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pengeluaran</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatCurrency(filteredExpenseData.length > 0 ? filteredExpenseData.reduce((sum, expense) => sum + (expense.amount || 0), 0) / filteredExpenseData.length : 0)}
                      </div>
                      <div className="text-sm text-gray-600">Rata-rata/Transaksi</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {new Set(filteredExpenseData.map(e => e.category)).size}
                      </div>
                      <div className="text-sm text-gray-600">Kategori Berbeda</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Keuangan */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Laporan Keuangan
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={fetchAllData}
                    variant="outline"
                    size="sm"
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    disabled={loading}
                  >
                    Refresh Data
                  </Button>
                  <div className="flex">
                    <Button
                      onClick={() => onPrint('financial', true)}
                      className="bg-pink-600 hover:bg-pink-700 text-white rounded-r-none"
                      disabled={loading}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => onPrint('financial', false)}
                      className="bg-pink-500 hover:bg-pink-600 text-white rounded-l-none border-l border-pink-400 px-3"
                      disabled={loading}
                      title="Print langsung tanpa preview"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Financial Report Filters */}
              <Card className="mb-4 border-pink-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-800">Filter & Tampilan Laporan</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year-filter" className="text-sm">Filter Tahun</Label>
                      <Select
                        value={financialFilters.selectedYear}
                        onValueChange={(value) => setFinancialFilters(prev => ({ ...prev, selectedYear: value }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue placeholder="Pilih tahun..." />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.value === 'all' ? year.label : `Tahun ${year.value}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="view-type" className="text-sm">Tampilan Data</Label>
                      <Select
                        value={financialFilters.viewType}
                        onValueChange={(value) => setFinancialFilters(prev => ({ ...prev, viewType: value as 'monthly' | 'yearly' }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Per Bulan
                            </div>
                          </SelectItem>
                          <SelectItem value="yearly">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Akumulasi Tahunan
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-transparent">Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setFinancialFilters({
                            selectedYear: 'all',
                            viewType: 'monthly'
                          })}
                          variant="outline"
                          size="sm"
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter Summary */}
                  <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Periode:</span>
                        <span className="font-medium text-pink-700">
                          {financialFilters.selectedYear === 'all' ? 'Semua Tahun' : `Tahun ${financialFilters.selectedYear}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Tampilan:</span>
                        <span className="font-medium text-pink-700">
                          {financialFilters.viewType === 'monthly' ? 'Per Bulan' : 'Akumulasi Tahunan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium text-pink-700">
                          {filteredFinancialData.length} {financialFilters.viewType === 'monthly' ? 'bulan' : 'tahun'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Periode</TableHead>
                      <TableHead className="text-pink-700">Total Pemasukan</TableHead>
                      <TableHead className="text-pink-700">Total Pengeluaran</TableHead>
                      <TableHead className="text-pink-700">Laba/Rugi</TableHead>
                      <TableHead className="text-pink-700">Margin (%)</TableHead>
                      {financialFilters.viewType === 'yearly' && (
                        <TableHead className="text-pink-700">Periode</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={financialFilters.viewType === 'yearly' ? 7 : 6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredFinancialData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={financialFilters.viewType === 'yearly' ? 7 : 6} className="text-center py-8 text-gray-500">
                          Tidak ada data keuangan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFinancialData.map((financial, index) => (
                        <TableRow key={`financial-${financial.period || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {financial.period}
                            {financialFilters.viewType === 'yearly' && (financial as any).recordCount && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(financial as any).recordCount} bulan data
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency((financial as any).totalIncome || 0)}
                            {financialFilters.viewType === 'yearly' && (
                              <div className="text-xs text-gray-600 mt-1">
                                <div>Tindakan: {formatCurrency((financial as any).treatmentIncome || 0)}</div>
                                <div>Penjualan: {formatCurrency((financial as any).salesIncome || 0)}</div>
                                <div>Field Trip: {formatCurrency((financial as any).fieldTripIncome || 0)}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatCurrency((financial as any).totalExpense || 0)}
                            {financialFilters.viewType === 'yearly' && (
                              <div className="text-xs text-gray-600 mt-1">
                                <div>Gaji: {formatCurrency((financial as any).salaryExpense || 0)}</div>
                                <div>Fee Dokter: {formatCurrency((financial as any).doctorFeeExpense || 0)}</div>
                                <div>Field Trip: {formatCurrency((financial as any).fieldTripExpense || 0)}</div>
                                <div>Operasional: {formatCurrency((financial as any).expenses || 0)}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`font-bold ${
                            ((financial as any).profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency((financial as any).profit || 0)}
                          </TableCell>
                          <TableCell className={`font-medium ${
                            ((financial as any).margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {((financial as any).margin || 0).toFixed(1)}%
                          </TableCell>
                          {financialFilters.viewType === 'yearly' && (
                            <TableCell className="text-center text-sm">
                              {((financial as any).recordCount || 0)} bulan
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Summary with more detailed breakdown */}
              {filteredFinancialData.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* Main Summary */}
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="h-5 w-5 text-pink-600" />
                      <h3 className="font-medium text-pink-800">
                        Ringkasan {financialFilters.viewType === 'yearly' ? 'Tahunan' : 'Bulanan'}
                        {financialFilters.selectedYear !== 'all' && ` - Tahun ${financialFilters.selectedYear}`}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).totalIncome || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Pemasukan</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-600">
                          {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).totalExpense || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Pengeluaran</div>
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          filteredFinancialData.reduce((sum, f) => sum + ((f as any).profit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).profit || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Laba/Rugi</div>
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          filteredFinancialData.length > 0 && (filteredFinancialData.reduce((sum, f) => sum + ((f as any).margin || 0), 0) / filteredFinancialData.length) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {filteredFinancialData.length > 0 ? (filteredFinancialData.reduce((sum, f) => sum + ((f as any).margin || 0), 0) / filteredFinancialData.length).toFixed(1) : '0.0'}%
                        </div>
                        <div className="text-sm text-gray-600">Rata-rata Margin</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Income Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Rincian Pemasukan
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tindakan Medis:</span>
                          <span className="font-medium text-green-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).treatmentIncome || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Penjualan Produk:</span>
                          <span className="font-medium text-green-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).salesIncome || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Field Trip:</span>
                          <span className="font-medium text-green-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).fieldTripIncome || 0), 0))}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span className="text-green-800">Total:</span>
                          <span className="text-green-800">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).totalIncome || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Rincian Pengeluaran
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gaji Karyawan:</span>
                          <span className="font-medium text-red-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).salaryExpense || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fee Dokter:</span>
                          <span className="font-medium text-red-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).doctorFeeExpense || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Field Trip:</span>
                          <span className="font-medium text-red-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).fieldTripExpense || 0), 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Operasional:</span>
                          <span className="font-medium text-red-700">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).expenses || 0), 0))}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span className="text-red-800">Total:</span>
                          <span className="text-red-800">
                            {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f as any).totalExpense || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Metrik Kinerja
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {filteredFinancialData.length}
                        </div>
                        <div className="text-gray-600">
                          Periode {financialFilters.viewType === 'yearly' ? 'Tahun' : 'Bulan'}
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {filteredFinancialData.filter(f => ((f as any).profit || 0) > 0).length}
                        </div>
                        <div className="text-gray-600">Periode Profit</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {filteredFinancialData.filter(f => ((f as any).profit || 0) < 0).length}
                        </div>
                        <div className="text-gray-600">Periode Rugi</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {(((filteredFinancialData.filter(f => ((f as any).profit || 0) > 0).length) / (filteredFinancialData.length || 1)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-600">Tingkat Profit</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Dialog */}
      {previewData && (
        <PrintPreviewDialog
          isOpen={showPreview}
          onClose={handleClosePreview}
          title={previewData.title}
          content={previewData.content}
          recordCount={previewData.recordCount}
          onConfirmPrint={previewData.onConfirmPrint}
        />
      )}
    </div>
  )
}