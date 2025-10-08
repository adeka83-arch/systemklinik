import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Printer, Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart, Stethoscope, Filter, MapPin, Search, RotateCcw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel, getCurrentMonthYear, getMonthNameIndonesian, shouldResetFiltersForNewMonth, getDateString } from '../utils/reports/helpers'
import { serverUrl } from '../utils/supabase/client'
import { months, years, shiftOptions, attendanceTypes } from '../utils/reports/constants'
import { handlePrint } from '../utils/reports/printService'
import { PrintPreviewWrapper } from './PrintPreviewWrapper'
import { usePrintPreview } from '../utils/reports/previewHook'
import { DateRangeQuickSelect } from './DateRangeQuickSelect'
import {
  fetchAttendanceReport,
  fetchSalaryReport,
  fetchDoctorFeeReport,
  fetchExpenseReport,
  fetchTreatmentReport,
  fetchSalesReport,
  fetchFieldTripSales,
  fetchDoctors,
  fetchEmployees,
  calculateFinancialData
} from '../utils/reports/dataService'
import {
  filterAttendanceData,
  filterSalaryData,
  filterDoctorFeeData,
  filterTreatmentData,
  filterSalesData,
  filterFieldTripSalesData,
  filterFinancialData,
  filterExpenseData,
  getDefaultFilters
} from '../utils/reports/filters'
import type {
  ReportsProps,
  AttendanceReport,
  SalaryReport,
  DoctorFeeReport,
  ExpenseReport,
  FinancialSummary,
  TreatmentReport,
  SalesReport,
  FieldTripSaleReport,
  ReportFilters
} from '../utils/reports/types'

export function Reports({ accessToken }: ReportsProps) {
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([])  
  const [salaryData, setSalaryData] = useState<SalaryReport[]>([])
  const [doctorFeeData, setDoctorFeeData] = useState<DoctorFeeReport[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([])
  const [treatmentData, setTreatmentData] = useState<TreatmentReport[]>([])
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [fieldTripSalesData, setFieldTripSalesData] = useState<FieldTripSaleReport[]>([])
  const [financialData, setFinancialData] = useState<FinancialSummary[]>([])
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters())
  const [doctors, setDoctors] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  
  // Print preview hook
  const { isPreviewOpen, previewData, showPreview, closePreview, confirmPrint } = usePrintPreview()

  useEffect(() => {
    loadDoctors()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (doctors.length > 0) {
      fetchAllData()
    }
  }, [doctors])

  useEffect(() => {
    if (treatmentData.length > 0 || salesData.length > 0 || fieldTripSalesData.length > 0 || salaryData.length > 0 || doctorFeeData.length > 0 || expenseData.length > 0) {
      const financialResults = calculateFinancialData(treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData)
      setFinancialData(financialResults)
    }
  }, [treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [attendance, salaries, doctorFees, expenses, treatments, sales, fieldTripSales] = await Promise.all([
        fetchAttendanceReport(accessToken, doctors),
        fetchSalaryReport(accessToken),
        fetchDoctorFeeReport(accessToken),
        fetchExpenseReport(accessToken),
        fetchTreatmentReport(accessToken),
        fetchSalesReport(accessToken),
        fetchFieldTripSales(accessToken)
      ])
      
      console.log('=== REPORTS DEBUG - FIELD TRIP SALES DATA ===')
      console.log('Raw field trip sales data received:', fieldTripSales)
      console.log('Number of field trip sales:', fieldTripSales?.length || 0)
      if (fieldTripSales && fieldTripSales.length > 0) {
        console.log('First field trip sale sample:', fieldTripSales[0])
      }
      console.log('=== END REPORTS DEBUG ===')
      
      // Enhanced doctor fee calculation logging
      console.log('=== DOCTOR FEE CALCULATION DEBUG ===')
      console.log('Total doctor fee records:', doctorFees.length)
      doctorFees.forEach((fee, index) => {
        if (index < 5) { // Log first 5 entries
          const treatmentFee = fee.treatmentFee || 0
          const sittingFee = fee.sittingFee || 0
          const calculatedTotal = Math.max(treatmentFee, sittingFee)
          console.log(`Fee ${index + 1} - Doctor: ${fee.doctorName}, Date: ${fee.date}, Treatment: ${treatmentFee}, Sitting: ${sittingFee}, Total: ${calculatedTotal}`)
        }
      })
      
      // Check if there are any issues with sitting fees
      const zeroSittingFees = doctorFees.filter(fee => (fee.sittingFee || 0) === 0)
      if (zeroSittingFees.length > 0) {
        console.warn(`⚠️ Found ${zeroSittingFees.length} records with zero sitting fees`)
        console.log('Sample zero sitting fee records:', zeroSittingFees.slice(0, 3))
      }
      
      console.log('=== END DOCTOR FEE DEBUG ===')
      
      setAttendanceData(attendance)
      setSalaryData(salaries)
      setDoctorFeeData(doctorFees)
      setExpenseData(expenses)
      setTreatmentData(treatments)
      setSalesData(sales)
      setFieldTripSalesData(fieldTripSales)
    } catch (error) {
      console.log('Error fetching reports:', error)
      toast.error('Gagal mengambil data laporan')
    } finally {
      setLoading(false)
    }
  }

  const loadDoctors = async () => {
    const doctors = await fetchDoctors(accessToken)
    setDoctors(doctors)
  }

  const loadEmployees = async () => {
    const employees = await fetchEmployees(accessToken)
    setEmployees(employees)
  }

  // Auto-reset filter setiap bulan baru
  useEffect(() => {
    const lastViewDate = localStorage.getItem('reportsLastViewDate')
    const currentDate = getDateString()
    
    if (shouldResetFiltersForNewMonth(lastViewDate || undefined)) {
      console.log('🗓️ Bulan baru terdeteksi, mereset filter ke bulan berjalan')
      setFilters(getDefaultFilters())
      toast.success('Filter direset ke bulan berjalan')
    }
    
    // Update last view date
    localStorage.setItem('reportsLastViewDate', currentDate)
  }, []) // Only run once on component mount

  // Filter functions for each report type
  const filteredAttendanceData = filterAttendanceData(attendanceData, filters, doctors)
  const filteredSalaryData = filterSalaryData(salaryData, filters)
  const filteredDoctorFeeData = filterDoctorFeeData(doctorFeeData, filters)
  const filteredTreatmentData = filterTreatmentData(treatmentData, filters)
  const filteredSalesData = filterSalesData(salesData, filters)
  const filteredFieldTripSalesData = filterFieldTripSalesData(fieldTripSalesData, filters)
  const filteredFinancialData = filterFinancialData(financialData, filters)
  const filteredExpenseData = filterExpenseData(expenseData, filters)

  const resetFilters = () => {
    setFilters(getDefaultFilters())
  }

  const onPrint = (type: string) => {
    handlePrint(
      type,
      filteredAttendanceData,
      filteredSalaryData,
      filteredDoctorFeeData,
      filteredTreatmentData,
      filteredSalesData,
      filteredFieldTripSalesData,
      filteredExpenseData,
      filteredFinancialData,
      showPreview // Pass the preview callback
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Default Filter */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-blue-700 text-sm">
                <strong>Default Filter:</strong> Halaman ini menampilkan data bulan berjalan ({getMonthNameIndonesian(getCurrentMonthYear().currentMonth)} {getCurrentMonthYear().currentYear}). 
                Untuk melihat data bulan lain, gunakan filter pencarian di bawah ini.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(filters.month === getCurrentMonthYear().currentMonth && filters.year === getCurrentMonthYear().currentYear) ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  Bulan Berjalan
                </span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                  Custom Filter
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Pencarian - Sesuai dengan desain gambar */}
      <Card className="border-pink-200 bg-pink-50/30">
        <CardContent className="p-6">
          {/* Filter Bar dengan 4 kolom sesuai gambar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-pink-600">Dokter</Label>
              <Select value={filters.selectedDoctorId} onValueChange={(value) => setFilters({ ...filters, selectedDoctorId: value })}>
                <SelectTrigger className="border-pink-200 bg-white">
                  <SelectValue placeholder="Semua dokter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua dokter</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-600">Shift</Label>
              <Select value={filters.shift} onValueChange={(value) => setFilters({ ...filters, shift: value })}>
                <SelectTrigger className="border-pink-200 bg-white">
                  <SelectValue placeholder="Semua shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-600">Tanggal</Label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="border-pink-200 bg-white"
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-pink-600">Jenis</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="border-pink-200 bg-white">
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  {attendanceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filter Button */}
          <div className="flex justify-end">
            <Button
              onClick={resetFilters}
              variant="outline"
              className="border-pink-600 text-pink-600 hover:bg-pink-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Lanjutan (periode, pencarian teks, dll) */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filter Periode & Pencarian Lanjutan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DateRangeQuickSelect
              startDate={filters.startDate}
              endDate={filters.endDate}
              onRangeChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
              className="md:col-span-1"
            />

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-pink-700">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-pink-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-pink-700">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorFilter" className="text-pink-700">Cari Dokter</Label>
              <Input
                id="doctorFilter"
                type="text"
                placeholder="Nama dokter..."
                value={filters.doctor}
                onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
                className="border-pink-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeFilter" className="text-pink-700">Cari Karyawan</Label>
              <Input
                id="employeeFilter"
                type="text"
                placeholder="Nama karyawan..."
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="border-pink-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthFilter" className="text-pink-700">Bulan</Label>
              <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearFilter" className="text-pink-700">Tahun</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
                <SelectTrigger className="border-pink-200">
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

            {/* Tombol Reset Filter */}
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setFilters(getDefaultFilters())}
                variant="outline"
                className="border-pink-300 text-pink-700 hover:bg-pink-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset ke Bulan Berjalan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs untuk berbagai jenis laporan */}
      <Tabs defaultValue="attendance" className="space-y-4" onValueChange={(value) => {
        if (value === 'doctor-fees') {
          toast.info('📋 Rumus fee dokter: Jika fee tindakan < uang duduk → Total = uang duduk. Jika fee tindakan ≥ uang duduk → Total = fee tindakan', {
            duration: 4000
          })
        }
      }}>
        <TabsList className="grid w-full grid-cols-8 bg-pink-100">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Absensi
          </TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Gaji
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="field-trip-sales" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <MapPin className="h-4 w-4 mr-2" />
            Field Trip
          </TabsTrigger>
          <TabsTrigger value="treatments" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Stethoscope className="h-4 w-4 mr-2" />
            Tindakan
          </TabsTrigger>
          <TabsTrigger value="doctor-fees" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            Fee Dokter
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <TrendingDown className="h-4 w-4 mr-2" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Keuangan
          </TabsTrigger>
        </TabsList>

        {/* Laporan Absensi */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Laporan Absensi Dokter
                </CardTitle>
                <Button
                  onClick={() => onPrint('attendance')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Jenis Absensi</TableHead>
                      <TableHead className="text-pink-700">Waktu</TableHead>
                      <TableHead className="text-pink-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="text-pink-800">{record.doctorName}</div>
                            <div className="text-sm text-gray-500">
                              {doctors.find(d => d.name === record.doctorName)?.specialization}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                            {record.shift}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            record.type === 'check-in' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.type === 'check-in' ? 'Absen Masuk' : 'Absen Pulang'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {record.time}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const [hours, minutes] = record.time.split(':').map(Number)
                            const timeInMinutes = hours * 60 + minutes
                            let isOnTime = false

                            if (record.type === 'check-in') {
                              if (record.shift === '09:00-15:00') {
                                isOnTime = timeInMinutes <= 9 * 60 + 15 // 09:15
                              } else if (record.shift === '18:00-20:00') {
                                isOnTime = timeInMinutes <= 18 * 60 + 15 // 18:15
                              }
                            } else {
                              if (record.shift === '09:00-15:00') {
                                isOnTime = timeInMinutes >= 15 * 60 // 15:00
                              } else if (record.shift === '18:00-20:00') {
                                isOnTime = timeInMinutes >= 20 * 60 // 20:00
                              }
                            }

                            return (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isOnTime 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isOnTime ? 'Tepat Waktu' : 'Terlambat'}
                              </span>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredAttendanceData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {attendanceData.length === 0 
                      ? 'Belum ada data absensi' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredAttendanceData.length} dari {attendanceData.length} record</span>
                  <span>Terakhir diperbarui: {new Date().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {/* Filter Pencarian - Tab Gaji */}
              <Card className="mb-6 border-pink-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-pink-600" />
                    <h3 className="text-pink-800 font-semibold">Filter Pencarian</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-pink-700">Cari Karyawan</Label>
                      <Input
                        type="text"
                        placeholder="Semua Karyawan"
                        value={filters.employee || ''}
                        onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                        className="border-pink-200 bg-white focus:border-pink-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-pink-700">Bulan</Label>
                      <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Tahun</Label>
                      <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
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
                        onClick={() => {
                          const { currentMonth, currentYear } = getCurrentMonthYear()
                          setFilters({ 
                            ...filters, 
                            employee: '', 
                            month: currentMonth, // Reset ke bulan berjalan
                            year: currentYear    // Reset ke tahun berjalan
                          })
                        }}
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
                      <TableHead className="text-pink-700">Karyawan</TableHead>
                      <TableHead className="text-pink-700">Periode</TableHead>
                      <TableHead className="text-pink-700">Gaji Pokok</TableHead>
                      <TableHead className="text-pink-700">Bonus</TableHead>
                      <TableHead className="text-pink-700">Tunjangan Raya</TableHead>
                      <TableHead className="text-pink-700">Total Gaji</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaryData.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell className="text-pink-800">{salary.employeeName}</TableCell>
                        <TableCell>
                          {months.find(m => m.value === salary.month)?.label} {salary.year}
                        </TableCell>
                        <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                        <TableCell className="text-emerald-700">{formatCurrency(salary.bonus)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(salary.holidayAllowance)}</TableCell>
                        <TableCell className="text-pink-800">{formatCurrency(salary.totalSalary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSalaryData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {salaryData.length === 0 
                      ? 'Belum ada data gaji' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredSalaryData.length} dari {salaryData.length} record</span>
                  <span>Total gaji yang ditampilkan: {formatCurrency(filteredSalaryData.reduce((total, salary) => total + salary.totalSalary, 0))}</span>
                </div>
              </div>
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
                  Laporan Penjualan Produk
                </CardTitle>
                <Button
                  onClick={() => onPrint('sales')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Pencarian - Tab Penjualan */}
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
                        value={filters.searchProduct || ''}
                        onChange={(e) => setFilters({ ...filters, searchProduct: e.target.value })}
                        className="border-pink-200 bg-white focus:border-pink-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-pink-700">Bulan</Label>
                      <Select value={filters.salesMonth || 'all'} onValueChange={(value) => setFilters({ ...filters, salesMonth: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Tahun</Label>
                      <Select value={filters.salesYear || 'all'} onValueChange={(value) => setFilters({ ...filters, salesYear: value })}>
                        <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                          <SelectValue placeholder="Semua Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tahun</SelectItem>
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
                        onClick={() => setFilters({ 
                          ...filters, 
                          searchProduct: '', 
                          productCategory: 'all', 
                          salesMonth: 'all', 
                          salesYear: 'all' 
                        })}
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
                      <TableHead className="text-pink-700 w-16">No</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700 text-center">Qty</TableHead>
                      <TableHead className="text-pink-700">Harga</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalesData.map((sale, index) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-center text-gray-600">{index + 1}</TableCell>
                        <TableCell className="text-pink-800 font-medium">{sale.productName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getCategoryLabel(sale.category)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">{sale.quantity}</TableCell>
                        <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                        <TableCell className="text-pink-800 font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(sale.date).toLocaleDateString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSalesData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {salesData.length === 0 
                      ? 'Belum ada data penjualan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              {/* Ringkasan Data Penjualan */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">{filteredSalesData.length}</div>
                  <div className="text-sm opacity-90">Total Transaksi</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">
                    {filteredSalesData.reduce((total, sale) => total + sale.quantity, 0)}
                  </div>
                  <div className="text-sm opacity-90">Total Qty</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
                  <div className="text-lg font-bold">
                    {formatCurrency(filteredSalesData.reduce((total, sale) => total + sale.totalAmount, 0))}
                  </div>
                  <div className="text-sm opacity-90">Total Penjualan</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg">
                  <div className="text-lg font-bold">
                    {filteredSalesData.length > 0 
                      ? formatCurrency(filteredSalesData.reduce((total, sale) => total + sale.totalAmount, 0) / filteredSalesData.length)
                      : formatCurrency(0)
                    }
                  </div>
                  <div className="text-sm opacity-90">Rata-rata/Transaksi</div>
                </div>
              </div>
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
                  Laporan Penjualan Field Trip
                </CardTitle>
                <Button
                  onClick={() => onPrint('field-trip-sales')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter khusus untuk tab field trip */}
              <Card className="mb-4 border-purple-200 bg-purple-50/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-purple-600">Cari Produk Field Trip</Label>
                      <Input
                        type="text"
                        placeholder="Nama produk field trip..."
                        value={filters.searchFieldTripProduct || ''}
                        onChange={(e) => setFilters({ ...filters, searchFieldTripProduct: e.target.value })}
                        className="border-purple-200 bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-purple-600">Lokasi</Label>
                      <Input
                        type="text"
                        placeholder="Lokasi field trip..."
                        value={filters.searchLocation || ''}
                        onChange={(e) => setFilters({ ...filters, searchLocation: e.target.value })}
                        className="border-purple-200 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-600">Bulan Field Trip</Label>
                      <Select value={filters.fieldTripMonth || 'all'} onValueChange={(value) => setFilters({ ...filters, fieldTripMonth: value })}>
                        <SelectTrigger className="border-purple-200 bg-white">
                          <SelectValue placeholder="Semua bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua bulan</SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-600">Tahun Field Trip</Label>
                      <Select value={filters.fieldTripYear || 'all'} onValueChange={(value) => setFilters({ ...filters, fieldTripYear: value })}>
                        <SelectTrigger className="border-purple-200 bg-white">
                          <SelectValue placeholder="Semua tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua tahun</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Lokasi</TableHead>
                      <TableHead className="text-pink-700">Jumlah</TableHead>
                      <TableHead className="text-pink-700">Harga Satuan</TableHead>
                      <TableHead className="text-pink-700">Subtotal</TableHead>
                      <TableHead className="text-pink-700">Diskon</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                      <TableHead className="text-pink-700">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFieldTripSalesData.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-pink-800">{sale.productName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {sale.location}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                        <TableCell>{formatCurrency(sale.subtotal)}</TableCell>
                        <TableCell className="text-orange-600">
                          {(sale.discountPercentage && sale.discountPercentage > 0) ? `${sale.discountPercentage}%` : '-'}
                        </TableCell>
                        <TableCell className="text-pink-800">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {sale.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredFieldTripSalesData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {fieldTripSalesData.length === 0 
                      ? 'Belum ada data penjualan field trip' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredFieldTripSalesData.length} dari {fieldTripSalesData.length} record</span>
                  <span>Total penjualan field trip: {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + sale.totalAmount, 0))}</span>
                </div>
              </div>
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
                  Laporan Tindakan Medis
                </CardTitle>
                <Button
                  onClick={() => onPrint('treatments')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter khusus untuk tab tindakan */}
              <Card className="mb-4 border-green-200 bg-green-50/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-600">Cari Pasien</Label>
                      <Input
                        type="text"
                        placeholder="Nama pasien..."
                        value={filters.searchPatient || ''}
                        onChange={(e) => setFilters({ ...filters, searchPatient: e.target.value })}
                        className="border-green-200 bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-green-600">Cari Tindakan</Label>
                      <Input
                        type="text"
                        placeholder="Nama tindakan..."
                        value={filters.searchTreatment || ''}
                        onChange={(e) => setFilters({ ...filters, searchTreatment: e.target.value })}
                        className="border-green-200 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-green-600">Bulan Tindakan</Label>
                      <Select value={filters.treatmentMonth || 'all'} onValueChange={(value) => setFilters({ ...filters, treatmentMonth: value })}>
                        <SelectTrigger className="border-green-200 bg-white">
                          <SelectValue placeholder="Semua bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua bulan</SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-green-600">Tahun Tindakan</Label>
                      <Select value={filters.treatmentYear || 'all'} onValueChange={(value) => setFilters({ ...filters, treatmentYear: value })}>
                        <SelectTrigger className="border-green-200 bg-white">
                          <SelectValue placeholder="Semua tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua tahun</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Pasien</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Tindakan</TableHead>
                      <TableHead className="text-pink-700">Biaya</TableHead>
                      <TableHead className="text-pink-700">Fee Dokter</TableHead>
                      <TableHead className="text-pink-700">Admin Fee</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTreatmentData.map((treatment) => (
                      <TableRow key={treatment.id}>
                        <TableCell>
                          {new Date(treatment.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-pink-800">{treatment.patientName}</TableCell>
                        <TableCell className="text-purple-700">{treatment.doctorName}</TableCell>
                        <TableCell>{treatment.treatmentName}</TableCell>
                        <TableCell>{formatCurrency(treatment.amount || treatment.nominal || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(treatment.fee || treatment.calculatedFee || 0)}</TableCell>
                        <TableCell className="text-orange-600">{formatCurrency(0)}</TableCell>
                        <TableCell className="text-pink-800">{formatCurrency((treatment.amount || treatment.nominal || 0) + (treatment.fee || treatment.calculatedFee || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTreatmentData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {treatmentData.length === 0 
                      ? 'Belum ada data tindakan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredTreatmentData.length} dari {treatmentData.length} record</span>
                  <span>Total pendapatan tindakan: {formatCurrency(filteredTreatmentData.reduce((total, treatment) => total + (treatment.amount || treatment.nominal || 0) + (treatment.fee || treatment.calculatedFee || 0), 0))}</span>
                </div>
              </div>
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
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Info Formula Fee Dokter */}
              <Card className="mb-4 border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-green-700 text-sm">
                          <strong>✅ FIX DUPLIKASI COMPLETED:</strong> Sistem grouping baru dengan normalisasi key yang ketat
                        </p>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-green-600 text-xs">
                          <strong>🔧 Perbaikan:</strong> Strict key normalization, doctor name cleaning, shift standardization
                        </p>
                        <p className="text-green-600 text-xs">
                          <strong>📊 Logic:</strong> Group treatments by doctor+shift+date → accumulate fees → apply formula → single record
                        </p>
                        <p className="text-green-600 text-xs">
                          <strong>⚡ Formula:</strong> Max(total_tindakan_per_shift, uang_duduk) = Final Fee
                        </p>
                        <p className="text-blue-600 text-xs">
                          <strong>🔍 Debug:</strong> Check browser console untuk detailed logging proses grouping
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          console.log('🔄 Force refresh - click "Refresh Data" untuk melihat fix')
                          toast.info('Klik tombol "Refresh Data" untuk melihat perbaikan')
                        }}
                        variant="outline"
                        size="sm" 
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        📊 View Fix
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings/create-sample`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${accessToken}` }
                            })
                            const data = await response.json()
                            if (data.success) {
                              toast.success(`✅ ${data.message}`)
                              fetchAllData() // Refresh data
                            } else {
                              toast.error(data.error || 'Gagal membuat pengaturan sample')
                            }
                          } catch (error) {
                            toast.error('Gagal membuat pengaturan sample')
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        Setup Default
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700 text-center">No</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Fee Tindakan</TableHead>
                      <TableHead className="text-pink-700">Uang Duduk</TableHead>
                      <TableHead className="text-pink-700">Total Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctorFeeData.map((fee, index) => {
                      // Calculate total fee using the correct formula: Max of treatment fee and sitting fee
                      const treatmentFee = fee.treatmentFee || 0
                      const sittingFee = fee.sittingFee || 0
                      const totalFeeCalculated = Math.max(treatmentFee, sittingFee)
                      
                      return (
                        <TableRow key={`${fee.doctor || fee.doctorName}_${fee.date}_${fee.shift || 'default'}`}>
                          <TableCell className="text-center text-pink-700">{index + 1}</TableCell>
                          <TableCell className="text-pink-800">{fee.doctorName || fee.doctor}</TableCell>
                          <TableCell>
                            {new Date(fee.date || fee.period).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(treatmentFee)}</TableCell>
                          <TableCell className="text-blue-600">{formatCurrency(sittingFee)}</TableCell>
                          <TableCell className="text-pink-800">{formatCurrency(totalFeeCalculated)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredDoctorFeeData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {doctorFeeData.length === 0 
                      ? 'Belum ada data fee dokter' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredDoctorFeeData.length} dari {doctorFeeData.length} record</span>
                  <span>Total fee dokter: {formatCurrency(filteredDoctorFeeData.reduce((total, fee) => {
                    const treatmentFee = fee.treatmentFee || 0
                    const sittingFee = fee.sittingFee || 0
                    return total + Math.max(treatmentFee, sittingFee)
                  }, 0))}</span>
                </div>
              </div>
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
                <Button
                  onClick={() => onPrint('expenses')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Deskripsi</TableHead>
                      <TableHead className="text-pink-700">Jumlah</TableHead>
                      <TableHead className="text-pink-700">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenseData.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {new Date(expense.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {expense.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-pink-800">{expense.description}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {expense.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredExpenseData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {expenseData.length === 0 
                      ? 'Belum ada data pengeluaran' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredExpenseData.length} dari {expenseData.length} record</span>
                  <span>Total pengeluaran: {formatCurrency(filteredExpenseData.reduce((total, expense) => total + expense.amount, 0))}</span>
                </div>
              </div>
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
                <Button
                  onClick={() => onPrint('financial')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Periode</TableHead>
                      <TableHead className="text-pink-700">Total Tindakan</TableHead>
                      <TableHead className="text-pink-700">Total Penjualan</TableHead>
                      <TableHead className="text-pink-700">Total Field Trip</TableHead>
                      <TableHead className="text-pink-700">Total Gaji</TableHead>
                      <TableHead className="text-pink-700">Total Fee Dokter</TableHead>
                      <TableHead className="text-pink-700">Total Pengeluaran</TableHead>
                      <TableHead className="text-pink-700">Pendapatan Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFinancialData.map((financial) => (
                      <TableRow key={financial.period}>
                        <TableCell className="text-pink-800">
                          {financial.period}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(financial.totalTreatmentRevenue)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(financial.totalSalesRevenue)}
                        </TableCell>
                        <TableCell className="text-purple-600">
                          {formatCurrency(financial.totalFieldTripRevenue)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(financial.totalSalaryCosts)}
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          {formatCurrency(financial.totalDoctorFees)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(financial.totalExpenses)}
                        </TableCell>
                        <TableCell className={`${
                          financial.netProfit >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(financial.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredFinancialData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {financialData.length === 0 
                      ? 'Belum ada data keuangan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredFinancialData.length} dari {financialData.length} record</span>
                  <span>Total pendapatan bersih: {formatCurrency(filteredFinancialData.reduce((total, financial) => total + financial.netProfit, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Modal */}
      <PrintPreviewWrapper
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onConfirm={confirmPrint}
        data={previewData}
      />
    </div>
  )
}