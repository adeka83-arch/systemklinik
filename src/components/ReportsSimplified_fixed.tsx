import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Printer, Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart, Stethoscope, Filter, MapPin, Calculator, RotateCcw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from '../utils/reports/helpers'
import { months, years, shiftOptions, attendanceTypes } from '../utils/reports/constants'
import { handlePrint } from '../utils/reports/printServiceSimple'
// Removed PrintPreviewWrapper and usePrintPreview for simplified direct printing
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
import { FieldTripBonusReportTest } from './FieldTripBonusReportTest'

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
  
  // Simplified direct printing - no preview needed for now

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

  // Format time display for better readability
  const formatTimeDisplay = (time: string | null): string => {
    if (!time) return '-'
    
    // If time is already in HH:MM format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time
    }
    
    // If time includes seconds, remove them
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time.substring(0, 5)
    }
    
    // Try to parse and format if it's a different format
    try {
      const date = new Date(time)
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })
      }
    } catch (error) {
      // If parsing fails, return original time
      return time
    }
    
    return time
  }

  // Process attendance data to group check-in/check-out by doctor and date
  const processAttendanceDataForDisplay = (data: any[]): any[] => {
    const grouped = new Map()
    
    // Group by doctor, date, and shift
    data.forEach(item => {
      const key = `${item.doctorName}-${item.date}-${item.shift}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          doctorId: item.doctorId,
          doctorName: item.doctorName,
          date: item.date,
          shift: item.shift,
          checkInTime: null,
          checkOutTime: null,
          status: 'Tidak Hadir'
        })
      }
      
      const record = grouped.get(key)
      if (item.type === 'check-in') {
        record.checkInTime = item.time
        record.status = 'Masuk'
      } else if (item.type === 'check-out') {
        record.checkOutTime = item.time
        record.status = record.checkInTime ? 'Lengkap' : 'Pulang Saja'
      }
    })
    
    // Convert back to array and sort by date and doctor name
    return Array.from(grouped.values()).sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.doctorName.localeCompare(b.doctorName)
    })
  }

  // Filter functions for each report type
  const filteredAttendanceData = filterAttendanceData(attendanceData, filters, doctors)
  const processedAttendanceData = processAttendanceDataForDisplay(filteredAttendanceData)
  const filteredSalaryData = filterSalaryData(salaryData, filters)
  const filteredDoctorFeeData = filterDoctorFeeData(doctorFeeData, filters)
  const filteredTreatmentData = filterTreatmentData(treatmentData, filters)
  const filteredSalesData = filterSalesData(salesData, filters)
  const filteredFieldTripSalesData = filterFieldTripSalesData(fieldTripSalesData, filters)
  const filteredFinancialData = filterFinancialData(financialData, filters)
  const filteredExpenseData = filterExpenseData(expenseData, filters)

  const resetFilters = () => {
    setFilters(getDefaultFilters())
    toast.success('Filter berhasil direset')
  }

  const onPrint = (type: string) => {
    console.log('=== PRINT FUNCTION CALLED ===')
    console.log('Print triggered for type:', type)
    console.log('Available data:', {
      attendance: filteredAttendanceData?.length,
      salary: filteredSalaryData?.length,
      doctorFees: filteredDoctorFeeData?.length,
      treatments: filteredTreatmentData?.length,
      sales: filteredSalesData?.length,
      fieldTripSales: filteredFieldTripSalesData?.length,
      expenses: filteredExpenseData?.length,
      financial: filteredFinancialData?.length
    })
    
    try {
      console.log('Calling simplified handlePrint')
      handlePrint(
        type,
        filteredAttendanceData,
        filteredSalaryData,
        filteredDoctorFeeData,
        filteredTreatmentData,
        filteredSalesData,
        filteredFieldTripSalesData,
        filteredExpenseData,
        filteredFinancialData
      )
      console.log('handlePrint called successfully')
    } catch (error) {
      console.error('Error in onPrint:', error)
      toast.error('Gagal memproses permintaan print')
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Sederhana */}
      <Card className="border-pink-200 bg-pink-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="border-pink-600 text-pink-600 hover:bg-pink-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-pink-700">Periode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
                  <SelectTrigger className="border-pink-200 bg-white">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={`month-${month.value}`} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
                  <SelectTrigger className="border-pink-200 bg-white">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={`year-${year.value}`} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Rentang Tanggal</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="border-pink-200 bg-white text-sm"
                  placeholder="Mulai"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="border-pink-200 bg-white text-sm"
                  placeholder="Akhir"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Dokter</Label>
              <Select value={filters.selectedDoctorId} onValueChange={(value) => setFilters({ ...filters, selectedDoctorId: value })}>
                <SelectTrigger className="border-pink-200 bg-white">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Dokter</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={`doctor-${doctor.id}`} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Pencarian</Label>
              <Input
                type="text"
                placeholder="Cari nama dokter/karyawan..."
                value={filters.doctor || filters.employee || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  doctor: e.target.value,
                  employee: e.target.value 
                })}
                className="border-pink-200 bg-white"
              />
            </div>
          </div>

          {/* Filter Tambahan (Collapsible) */}
          <details className="group">
            <summary className="cursor-pointer text-pink-700 hover:text-pink-800 flex items-center gap-2 py-2">
              <span className="transform transition-transform group-open:rotate-90">▶</span>
              Filter Lanjutan
            </summary>
            <div className="mt-3 pt-3 border-t border-pink-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-pink-700">Shift</Label>
                  <Select value={filters.shift} onValueChange={(value) => setFilters({ ...filters, shift: value })}>
                    <SelectTrigger className="border-pink-200 bg-white">
                      <SelectValue placeholder="Pilih shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftOptions.map((shift) => (
                        <SelectItem key={`shift-${shift.value}`} value={shift.value}>
                          {shift.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-pink-700">Jenis Absensi</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger className="border-pink-200 bg-white">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceTypes.map((type) => (
                        <SelectItem key={`attendance-type-${type.value}`} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-pink-700">Tanggal Spesifik</Label>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="border-pink-200 bg-white"
                  />
                </div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Tabs untuk berbagai jenis laporan */}
      <Tabs defaultValue="field-trip-bonus" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9 bg-pink-100">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Absensi</span>
          </TabsTrigger>
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
        </TabsList>

        {/* Laporan Fee & Bonus Field Trip */}
        <TabsContent value="field-trip-bonus" className="space-y-4">
          <FieldTripBonusReportTest
            accessToken={accessToken}
            filters={filters}
            onPrint={onPrint}
          />
        </TabsContent>

        {/* Laporan Absensi */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Laporan Absensi
                </CardTitle>
                <Button
                  onClick={() => onPrint('attendance')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
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
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">Status</TableHead>
                      <TableHead className="text-pink-700">Jam Masuk</TableHead>
                      <TableHead className="text-pink-700">Jam Keluar</TableHead>
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
                    ) : processedAttendanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data absensi untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedAttendanceData.map((attendance, index) => (
                        <TableRow key={`attendance-${attendance.doctorId || index}-${attendance.date}-${attendance.shift}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{attendance.doctorName}</TableCell>
                          <TableCell>{new Date(attendance.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              attendance.shift === 'pagi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {attendance.shift === 'pagi' ? 'Pagi' : 'Sore'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              attendance.status === 'Lengkap' ? 'bg-green-100 text-green-800' :
                              attendance.status === 'Masuk' ? 'bg-blue-100 text-blue-800' :
                              attendance.status === 'Pulang Saja' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatTimeDisplay(attendance.checkInTime)}</TableCell>
                          <TableCell>{formatTimeDisplay(attendance.checkOutTime)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {processedAttendanceData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {processedAttendanceData.filter(a => a.status === 'Lengkap').length}
                      </div>
                      <div className="text-sm text-gray-600">Lengkap</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {processedAttendanceData.filter(a => a.status === 'Masuk').length}
                      </div>
                      <div className="text-sm text-gray-600">Hanya Masuk</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {processedAttendanceData.filter(a => a.status === 'Pulang Saja').length}
                      </div>
                      <div className="text-sm text-gray-600">Hanya Keluar</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {processedAttendanceData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Records</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Gaji */}
        <TabsContent value="salary" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Laporan Gaji Karyawan
                </CardTitle>
                <Button
                  onClick={() => onPrint('salary')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
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
                          <TableCell>{formatCurrency(salary.bonus + (salary.fieldTripBonus || 0))}</TableCell>
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
                        {formatCurrency(filteredSalaryData.reduce((sum, salary) => sum + ((salary.bonus || 0) + (salary.fieldTripBonus || 0)), 0))}
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

        {/* Laporan Tindakan - FIXED VERSION */}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Pasien</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Tindakan</TableHead>
                      <TableHead className="text-pink-700">Biaya</TableHead>
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
                    ) : filteredTreatmentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada data tindakan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTreatmentData.map((treatment, index) => (
                        <TableRow key={`treatment-${treatment.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{new Date(treatment.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{treatment.patientName}</TableCell>
                          <TableCell>{treatment.doctorName}</TableCell>
                          <TableCell>{treatment.treatmentName}</TableCell>
                          <TableCell>{formatCurrency(treatment.nominal || treatment.amount || 0)}</TableCell>
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
                      <div className="text-xl font-bold text-blue-600">
                        {filteredTreatmentData.filter(t => t.patientName).reduce((acc, curr) => {
                          return acc.add(curr.patientName);
                        }, new Set()).size}
                      </div>
                      <div className="text-sm text-gray-600">Unique Pasien</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredTreatmentData.reduce((sum, treatment) => sum + (treatment.nominal || treatment.amount || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pendapatan</div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Qty</TableHead>
                      <TableHead className="text-pink-700">Harga</TableHead>
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
                    ) : filteredSalesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data penjualan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSalesData.map((sale, index) => (
                        <TableRow key={`sale-${sale.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{sale.productName}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {getCategoryLabel(sale.productCategory)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{sale.quantity}</TableCell>
                          <TableCell>{formatCurrency(sale.price)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(sale.totalAmount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredSalesData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredSalesData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Transaksi</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {filteredSalesData.reduce((sum, sale) => sum + sale.quantity, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Qty</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pendapatan</div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Lokasi</TableHead>
                      <TableHead className="text-pink-700">Organisasi</TableHead>
                      <TableHead className="text-pink-700">Peserta</TableHead>
                      <TableHead className="text-pink-700">Harga/Orang</TableHead>
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
                    ) : filteredFieldTripSalesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data field trip sales untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFieldTripSalesData.map((fieldTrip, index) => (
                        <TableRow key={`fieldtrip-${fieldTrip.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{new Date(fieldTrip.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{fieldTrip.location}</TableCell>
                          <TableCell>{fieldTrip.organization}</TableCell>
                          <TableCell className="text-center">{fieldTrip.participants}</TableCell>
                          <TableCell>{formatCurrency(fieldTrip.pricePerParticipant)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(fieldTrip.totalAmount)}</TableCell>
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
                        {filteredFieldTripSalesData.reduce((sum, ft) => sum + ft.participants, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Peserta</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredFieldTripSalesData.reduce((sum, ft) => sum + ft.totalAmount, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pendapatan</div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">Fee Tindakan</TableHead>
                      <TableHead className="text-pink-700">Fee Duduk</TableHead>
                      <TableHead className="text-pink-700">Fee Final</TableHead>
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
                    ) : filteredDoctorFeeData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data fee dokter untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDoctorFeeData.map((fee, index) => (
                        <TableRow key={`doctorfee-${fee.doctor || index}-${fee.date}-${fee.shift}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{fee.doctor}</TableCell>
                          <TableCell>{new Date(fee.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              fee.shift === 'pagi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {fee.shift === 'pagi' ? 'Pagi' : 'Sore'}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(fee.treatmentFee)}</TableCell>
                          <TableCell>{formatCurrency(fee.sittingFee)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(fee.finalFee)}</TableCell>
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
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + fee.treatmentFee, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Fee Tindakan</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + fee.sittingFee, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Fee Duduk</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredDoctorFeeData.reduce((sum, fee) => sum + fee.finalFee, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Fee Final</div>
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
                <Button
                  onClick={() => onPrint('expenses')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
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
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Keterangan</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenseData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Tidak ada data pengeluaran untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenseData.map((expense, index) => (
                        <TableRow key={`expense-${expense.id || index}-${index}`}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>{new Date(expense.date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredExpenseData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-pink-600">
                        {filteredExpenseData.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Transaksi</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(filteredExpenseData.reduce((sum, expense) => sum + expense.amount, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pengeluaran</div>
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
                <Button
                  onClick={() => onPrint('financial')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
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
                      <TableHead className="text-pink-700">Pendapatan Tindakan</TableHead>
                      <TableHead className="text-pink-700">Pendapatan Penjualan</TableHead>
                      <TableHead className="text-pink-700">Pendapatan Field Trip</TableHead>
                      <TableHead className="text-pink-700">Total Pendapatan</TableHead>
                      <TableHead className="text-pink-700">Total Pengeluaran</TableHead>
                      <TableHead className="text-pink-700">Laba Bersih</TableHead>
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
                    ) : filteredFinancialData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data keuangan untuk filter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFinancialData.map((financial, index) => {
                        const totalIncome = (financial.treatmentIncome || 0) + (financial.salesIncome || 0) + (financial.fieldTripIncome || 0)
                        const totalExpense = (financial.salaryExpense || 0) + (financial.doctorFeeExpense || 0) + (financial.expenses || 0)
                        
                        return (
                          <TableRow key={`financial-${financial.month}-${financial.year}-${index}`}>
                            <TableCell className="font-bold">{financial.month}/{financial.year}</TableCell>
                            <TableCell>{formatCurrency(financial.treatmentIncome || 0)}</TableCell>
                            <TableCell>{formatCurrency(financial.salesIncome || 0)}</TableCell>
                            <TableCell>{formatCurrency(financial.fieldTripIncome || 0)}</TableCell>
                            <TableCell className="font-bold text-green-600">{formatCurrency(totalIncome)}</TableCell>
                            <TableCell className="font-bold text-red-600">{formatCurrency(totalExpense)}</TableCell>
                            <TableCell className={`font-bold ${financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(financial.netProfit || 0)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              {filteredFinancialData.length > 0 && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f.treatmentIncome || 0) + (f.salesIncome || 0) + (f.fieldTripIncome || 0)), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pendapatan</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + ((f.salaryExpense || 0) + (f.doctorFeeExpense || 0) + (f.expenses || 0)), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Pengeluaran</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.netProfit || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Laba Bersih</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}