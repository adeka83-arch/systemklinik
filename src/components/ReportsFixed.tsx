import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Printer, Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart, Stethoscope, Filter, MapPin, Calculator } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from '../utils/reports/helpers'
import { months, years, shiftOptions, attendanceTypes } from '../utils/reports/constants'
import { handlePrint } from '../utils/reports/printService'
import { PrintPreviewWrapper } from './PrintPreviewWrapper'
import { usePrintPreview } from '../utils/reports/previewHook'
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
import { FieldTripBonusReport } from './FieldTripBonusReport'

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

  // Filter functions for each report type
  const filteredAttendanceData = filterAttendanceData(attendanceData, filters, doctors)
  const filteredSalaryData = filterSalaryData(salaryData, filters)
  const filteredDoctorFeeData = filterDoctorFeeData(doctorFeeData, filters)
  const filteredTreatmentData = filterTreatmentData(treatmentData, filters)
  const filteredSalesData = filterSalesData(salesData, filters)
  const filteredFieldTripSalesData = filterFieldTripSalesData(fieldTripSalesData, filters)
  const filteredFinancialData = filterFinancialData(financialData, filters)
  const filteredExpenseData = filterExpenseData(expenseData, filters)

  // Calculate actual doctor fees and employee bonuses from field trip sales data
  const calculateFieldTripFeesAndBonuses = () => {
    let totalDoctorFees = 0
    let totalEmployeeBonuses = 0

    // Get the raw field trip sales data (before filtering for report format)
    fieldTripSalesData.forEach(sale => {
      // Add doctor fees if selectedDoctors exist and have fee data
      if (sale.selectedDoctors && Array.isArray(sale.selectedDoctors)) {
        sale.selectedDoctors.forEach(doctor => {
          totalDoctorFees += doctor.fee || 0
        })
      }
      
      // Add employee bonuses if selectedEmployees exist and have bonus data
      if (sale.selectedEmployees && Array.isArray(sale.selectedEmployees)) {
        sale.selectedEmployees.forEach(employee => {
          totalEmployeeBonuses += employee.bonus || 0
        })
      }

      // Fallback: use aggregated values if individual arrays not available
      if (sale.totalDoctorFees && typeof sale.totalDoctorFees === 'number') {
        totalDoctorFees += sale.totalDoctorFees
      }
      if (sale.totalEmployeeBonuses && typeof sale.totalEmployeeBonuses === 'number') {
        totalEmployeeBonuses += sale.totalEmployeeBonuses
      }
    })

    return { totalDoctorFees, totalEmployeeBonuses }
  }

  const { totalDoctorFees, totalEmployeeBonuses } = calculateFieldTripFeesAndBonuses()

  const resetFilters = () => {
    setFilters(getDefaultFilters())
  }

  const onPrint = (type: string) => {
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
      {/* Filter Pencarian */}
      <Card className="border-pink-200 bg-pink-50/30">
        <CardContent className="p-6">
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

      {/* Filter Lanjutan */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filter Periode & Pencarian Lanjutan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs untuk berbagai jenis laporan */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9 bg-pink-100">
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
          <TabsTrigger value="field-trip-bonus" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Calculator className="h-4 w-4 mr-2" />
            Fee & Bonus
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
                      <TableHead className="text-pink-700">Jenis</TableHead>
                      <TableHead className="text-pink-700">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceData.map((attendance, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-pink-800">{attendance.doctorName}</TableCell>
                        <TableCell>{attendance.shift}</TableCell>
                        <TableCell>
                          {new Date(attendance.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            attendance.type === 'check-in' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attendance.type === 'check-in' ? 'Masuk' : 'Pulang'}
                          </span>
                        </TableCell>
                        <TableCell>{attendance.time}</TableCell>
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
                  <span>Test Attendance Report - {filteredAttendanceData.length} records</span>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">No</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Customer</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Qty</TableHead>
                      <TableHead className="text-pink-700">Tim Pendamping</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                      <TableHead className="text-pink-700">Final</TableHead>
                      <TableHead className="text-pink-700">Status</TableHead>
                      <TableHead className="text-pink-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFieldTripSalesData.map((sale, index) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{new Date(sale.date).toLocaleDateString('id-ID')}</span>
                            <span className="text-xs text-gray-500">Event: {new Date(sale.date).toLocaleDateString('id-ID')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{sale.organization || sale.location}</span>
                            <span className="text-xs text-gray-500">{sale.participants || 0} peserta</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-pink-800">{sale.productName}</span>
                            <span className="text-xs text-gray-500">{sale.participants || 0} peserta</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(sale.doctorName || sale.employeeName) ? (
                              <>
                                {sale.doctorName && (
                                  <div className="flex items-center gap-1">
                                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                      🩺 2 dokter
                                    </div>
                                  </div>
                                )}
                                {sale.employeeName && (
                                  <div className="flex items-center gap-1">
                                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      👥 2 karyawan
                                    </div>
                                  </div>
                                )}
                                {sale.doctorName && (
                                  <div className="text-xs text-yellow-600">
                                    Fee: {formatCurrency((sale as any).totalDoctorFees || 0)}
                                  </div>
                                )}
                                {sale.employeeName && (
                                  <div className="text-xs text-green-600">
                                    Bonus: {formatCurrency((sale as any).totalEmployeeBonuses || 0)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                Belum ada tim
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(sale.subtotal || sale.totalAmount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                            <span className="text-xs text-blue-600">Cash - Lunas</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            Lunas
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              👁️
                            </Button>
                          </div>
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

              {/* Field Trip Sales Summary - Enhanced */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredFieldTripSalesData.length}
                    </div>
                    <div className="text-sm text-blue-700">Total Transaksi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Total Pendapatan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredFieldTripSalesData.reduce((total, sale) => total + (sale.participants || 0), 0)}
                    </div>
                    <div className="text-sm text-purple-700">Total Peserta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(filteredFieldTripSalesData.map(s => s.location)).size}
                    </div>
                    <div className="text-sm text-orange-700">Lokasi Field Trip</div>
                  </div>
                </div>
              </div>

              {/* Fee Summary for Field Trip */}
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Ringkasan Fee & Bonus Tim</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => 
                        total + (sale.doctorName ? ((sale.pricePerParticipant || 0) * (sale.participants || 0) * 0.025) : 0), 0))}
                    </div>
                    <div className="text-sm text-yellow-700">Total Fee Dokter (2.5%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => 
                        total + (sale.employeeName ? ((sale.pricePerParticipant || 0) * (sale.participants || 0) * 0.025) : 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Total Bonus Karyawan (2.5%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => 
                        total + ((sale.doctorName ? 0.025 : 0) + (sale.employeeName ? 0.025 : 0)) * ((sale.pricePerParticipant || 0) * (sale.participants || 0)), 0))}
                    </div>
                    <div className="text-sm text-blue-700">Total Fee & Bonus</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredFieldTripSalesData.length} dari {fieldTripSalesData.length} record</span>
                  <span>Total pendapatan field trip: {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}</span>
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
                  Laporan Keuangan Bulanan
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
                      <TableHead className="text-pink-700">Pendapatan Tindakan</TableHead>
                      <TableHead className="text-pink-700">Pendapatan Penjualan</TableHead>
                      <TableHead className="text-pink-700">Pendapatan Field Trip</TableHead>
                      <TableHead className="text-pink-700">Total Pendapatan</TableHead>
                      <TableHead className="text-pink-700">Gaji Karyawan</TableHead>
                      <TableHead className="text-pink-700">Fee Dokter</TableHead>
                      <TableHead className="text-pink-700">Pengeluaran</TableHead>
                      <TableHead className="text-pink-700">Laba Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFinancialData.map((financial) => {
                      const totalIncome = (financial.treatmentIncome || 0) + (financial.salesIncome || 0) + (financial.fieldTripIncome || 0)
                      return (
                        <TableRow key={`${financial.month}-${financial.year}`}>
                          <TableCell className="font-medium text-pink-800">
                            {months.find(m => m.value === financial.month)?.label} {financial.year}
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(financial.treatmentIncome || 0)}</TableCell>
                          <TableCell className="text-blue-600">{formatCurrency(financial.salesIncome || 0)}</TableCell>
                          <TableCell className="text-cyan-600">{formatCurrency(financial.fieldTripIncome || 0)}</TableCell>
                          <TableCell className="text-green-700 font-semibold">{formatCurrency(totalIncome)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(financial.salaryExpense || 0)}</TableCell>
                          <TableCell className="text-purple-600">{formatCurrency(financial.doctorFeeExpense || 0)}</TableCell>
                          <TableCell className="text-orange-600">{formatCurrency(financial.expenses || 0)}</TableCell>
                          <TableCell className={`font-bold ${(financial.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(financial.netProfit || 0)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

              {/* Financial Summary */}
              <div className="mt-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Ringkasan Keuangan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(filteredFinancialData.reduce((total, f) => total + (f.treatmentIncome || 0) + (f.salesIncome || 0) + (f.fieldTripIncome || 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Total Pendapatan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(filteredFinancialData.reduce((total, f) => total + (f.salaryExpense || 0) + (f.doctorFeeExpense || 0) + (f.expenses || 0), 0))}
                    </div>
                    <div className="text-sm text-red-700">Total Pengeluaran</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-600">
                      {formatCurrency(filteredFinancialData.reduce((total, f) => total + (f.fieldTripIncome || 0), 0))}
                    </div>
                    <div className="text-sm text-cyan-700">Pendapatan Field Trip</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${filteredFinancialData.reduce((total, f) => total + (f.netProfit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(filteredFinancialData.reduce((total, f) => total + (f.netProfit || 0), 0))}
                    </div>
                    <div className="text-sm text-gray-700">Laba Bersih</div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Formula: Pendapatan Field Trip + Pendapatan Tindakan + Pendapatan Penjualan - Gaji Karyawan - Fee Dokter - Pengeluaran</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Gaji Karyawan */}
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
                      <TableRow key={`${salary.employeeName}-${salary.month}-${salary.year}`}>
                        <TableCell className="text-pink-800">{salary.employeeName}</TableCell>
                        <TableCell>
                          {months.find(m => m.value === salary.month)?.label} {salary.year}
                        </TableCell>
                        <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(salary.bonus)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(salary.holidayAllowance)}</TableCell>
                        <TableCell className="text-pink-800 font-semibold">{formatCurrency(salary.totalSalary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSalaryData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {salaryData.length === 0 
                      ? 'Belum ada data gaji karyawan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              {/* Salary Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {filteredSalaryData.length}
                    </div>
                    <div className="text-sm text-pink-700">Total Record</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(filteredSalaryData.reduce((total, salary) => total + (salary.bonus || 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Total Bonus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(filteredSalaryData.reduce((total, salary) => total + (salary.holidayAllowance || 0), 0))}
                    </div>
                    <div className="text-sm text-blue-700">Total Tunjangan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(filteredSalaryData.reduce((total, salary) => total + (salary.totalSalary || 0), 0))}
                    </div>
                    <div className="text-sm text-red-700">Total Gaji</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredSalaryData.length} dari {salaryData.length} record</span>
                  <span>Total pengeluaran gaji: {formatCurrency(filteredSalaryData.reduce((total, salary) => total + (salary.totalSalary || 0), 0))}</span>
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
                  Laporan Penjualan
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Produk</TableHead>
                      <TableHead className="text-pink-700">Kategori</TableHead>
                      <TableHead className="text-pink-700">Jumlah</TableHead>
                      <TableHead className="text-pink-700">Harga</TableHead>
                      <TableHead className="text-pink-700">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalesData.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-pink-800">{sale.productName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getCategoryLabel(sale.category)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>{formatCurrency(sale.price)}</TableCell>
                        <TableCell className="text-pink-800 font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
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

              {/* Sales Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredSalesData.length}
                    </div>
                    <div className="text-sm text-blue-700">Total Transaksi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(filteredSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Total Penjualan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredSalesData.reduce((total, sale) => total + (sale.quantity || 0), 0)}
                    </div>
                    <div className="text-sm text-purple-700">Total Item</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(filteredSalesData.map(s => s.category)).size}
                    </div>
                    <div className="text-sm text-orange-700">Kategori</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredSalesData.length} dari {salesData.length} record</span>
                  <span>Total pendapatan penjualan: {formatCurrency(filteredSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Tindakan Medis */}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Pasien</TableHead>
                      <TableHead className="text-pink-700">Tindakan</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Nominal</TableHead>
                      <TableHead className="text-pink-700">Fee Dokter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTreatmentData.map((treatment) => (
                      <TableRow key={treatment.id}>
                        <TableCell>
                          {new Date(treatment.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-pink-800">{treatment.patientName}</TableCell>
                        <TableCell>{treatment.treatmentName || treatment.treatmentType}</TableCell>
                        <TableCell>{treatment.doctorName}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(treatment.nominal || treatment.amount)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(treatment.calculatedFee || treatment.fee || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTreatmentData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {treatmentData.length === 0 
                      ? 'Belum ada data tindakan medis' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              {/* Treatment Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredTreatmentData.length}
                    </div>
                    <div className="text-sm text-green-700">Total Tindakan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(filteredTreatmentData.reduce((total, treatment) => total + (treatment.nominal || treatment.amount || 0), 0))}
                    </div>
                    <div className="text-sm text-blue-700">Total Pendapatan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(filteredTreatmentData.reduce((total, treatment) => total + (treatment.calculatedFee || treatment.fee || 0), 0))}
                    </div>
                    <div className="text-sm text-purple-700">Total Fee Dokter</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(filteredTreatmentData.map(t => t.patientName)).size}
                    </div>
                    <div className="text-sm text-orange-700">Pasien</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredTreatmentData.length} dari {treatmentData.length} record</span>
                  <span>Total pendapatan tindakan: {formatCurrency(filteredTreatmentData.reduce((total, treatment) => total + (treatment.nominal || treatment.amount || 0), 0))}</span>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50">
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Fee Tindakan</TableHead>
                      <TableHead className="text-pink-700">Uang Duduk</TableHead>
                      <TableHead className="text-pink-700">Fee Final</TableHead>
                      <TableHead className="text-pink-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctorFeeData.map((doctorFee) => (
                      <TableRow key={`${doctorFee.doctor}-${doctorFee.date}-${doctorFee.shift}`}>
                        <TableCell className="text-pink-800">{doctorFee.doctor}</TableCell>
                        <TableCell>{doctorFee.shift}</TableCell>
                        <TableCell>
                          {new Date(doctorFee.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(doctorFee.treatmentFee)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(doctorFee.sittingFee)}
                        </TableCell>
                        <TableCell className="text-pink-800 font-semibold">
                          {formatCurrency(doctorFee.finalFee)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            doctorFee.hasTreatments 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {doctorFee.hasTreatments ? 'Ada Tindakan' : 'Duduk Saja'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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

              {/* Doctor Fee Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredDoctorFeeData.length}
                    </div>
                    <div className="text-sm text-purple-700">Total Sesi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + (fee.treatmentFee || 0), 0))}
                    </div>
                    <div className="text-sm text-green-700">Fee Tindakan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + (fee.sittingFee || 0), 0))}
                    </div>
                    <div className="text-sm text-blue-700">Uang Duduk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + (fee.finalFee || 0), 0))}
                    </div>
                    <div className="text-sm text-pink-700">Total Fee</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredDoctorFeeData.length} dari {doctorFeeData.length} record</span>
                  <span>Total fee dokter: {formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + (fee.finalFee || 0), 0))}</span>
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
                            {getCategoryLabel(expense.category)}
                          </span>
                        </TableCell>
                        <TableCell className="text-pink-800">{expense.description}</TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(expense.amount)}
                        </TableCell>
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

              {/* Expense Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredExpenseData.length}
                    </div>
                    <div className="text-sm text-red-700">Total Transaksi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(filteredExpenseData.reduce((total, expense) => total + (expense.amount || 0), 0))}
                    </div>
                    <div className="text-sm text-orange-700">Total Pengeluaran</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(filteredExpenseData.map(e => e.category)).size}
                    </div>
                    <div className="text-sm text-purple-700">Kategori</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredExpenseData.length} dari {expenseData.length} record</span>
                  <span>Total pengeluaran: {formatCurrency(filteredExpenseData.reduce((total, expense) => total + (expense.amount || 0), 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Modal */}
      <PrintPreviewWrapper
        previewData={previewData}
        onClose={closePreview}
        onConfirmPrint={confirmPrint}
      />
    </div>
  )
}