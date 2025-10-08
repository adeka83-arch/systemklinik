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
import { handlePrint } from '../utils/reports/printServiceFixed'
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
      <Tabs defaultValue="field-trip-bonus" className="space-y-4">
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

        {/* Laporan Fee & Bonus Field Trip */}
        <TabsContent value="field-trip-bonus" className="space-y-4">
          <FieldTripBonusReportTest
            accessToken={accessToken}
            filters={filters}
            onPrint={onPrint}
          />
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
                  <div className="text-center py-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-blue-800 mb-2">
                        Belum Ada Data Field Trip
                      </h3>
                      <p className="text-blue-600 mb-4">
                        Data field trip sales belum tersedia atau tidak sesuai dengan filter yang dipilih.
                      </p>
                      
                      {/* Debug Info */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                        <p className="text-gray-700 text-sm mb-2"><strong>Debug Info:</strong></p>
                        <p className="text-gray-600 text-xs">Total raw field trip data: {fieldTripSalesData.length}</p>
                        <p className="text-gray-600 text-xs">Filtered field trip data: {filteredFieldTripSalesData.length}</p>
                        <p className="text-gray-600 text-xs">Loading: {loading ? 'Ya' : 'Tidak'}</p>
                        <p className="text-gray-600 text-xs">Access Token: {accessToken ? 'Ada' : 'Tidak ada'}</p>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-yellow-700 text-sm">
                          💡 <strong>Tip:</strong> Untuk melihat laporan fee & bonus field trip yang sudah ada, 
                          klik tab <strong>"Fee & Bonus"</strong> di atas.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          // Switch to fee & bonus tab
                          const feeTab = document.querySelector('[value="field-trip-bonus"]') as HTMLElement
                          if (feeTab) feeTab.click()
                        }}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Lihat Fee & Bonus
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Field Trip Sales Summary - Enhanced */}
              {filteredFieldTripSalesData.length > 0 && (
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
                        {formatCurrency(totalDoctorFees + totalEmployeeBonuses)}
                      </div>
                      <div className="text-sm text-orange-700">Fee & Bonus</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Gaji */}
        <TabsContent value="salary" className="space-y-4">
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Laporan Gaji Karyawan
                </CardTitle>
                <Button
                  onClick={() => onPrint('salary')}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                    <TableRow className="bg-green-50">
                      <TableHead className="text-green-700">Karyawan</TableHead>
                      <TableHead className="text-green-700">Bulan/Tahun</TableHead>
                      <TableHead className="text-green-700">Gaji Pokok</TableHead>
                      <TableHead className="text-green-700">Bonus</TableHead>
                      <TableHead className="text-green-700">Tunjangan Hari Raya</TableHead>
                      <TableHead className="text-green-700">Total Gaji</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaryData.map((salary, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-green-800">{salary.employeeName}</TableCell>
                        <TableCell>{salary.month}/{salary.year}</TableCell>
                        <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                        <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                        <TableCell>{formatCurrency(salary.holidayAllowance)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(salary.totalSalary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSalaryData.length === 0 && (
                  <div className="text-center py-8 text-green-600">
                    {salaryData.length === 0 
                      ? 'Belum ada data gaji' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Total data: {filteredSalaryData.length} record</span>
                  <span>Total Gaji: {formatCurrency(filteredSalaryData.reduce((sum, s) => sum + s.totalSalary, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Penjualan */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Laporan Penjualan Produk
                </CardTitle>
                <Button
                  onClick={() => onPrint('sales')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-700">Produk</TableHead>
                      <TableHead className="text-blue-700">Kategori</TableHead>
                      <TableHead className="text-blue-700">Qty</TableHead>
                      <TableHead className="text-blue-700">Harga Satuan</TableHead>
                      <TableHead className="text-blue-700">Total</TableHead>
                      <TableHead className="text-blue-700">Tanggal</TableHead>
                      <TableHead className="text-blue-700">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalesData.map((sale, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-blue-800">{sale.productName}</TableCell>
                        <TableCell>{getCategoryLabel(sale.category)}</TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-sm text-gray-600">{sale.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSalesData.length === 0 && (
                  <div className="text-center py-8 text-blue-600">
                    {salesData.length === 0 
                      ? 'Belum ada data penjualan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <span>Total data: {filteredSalesData.length} record</span>
                  <span>Total Penjualan: {formatCurrency(filteredSalesData.reduce((sum, s) => sum + s.totalAmount, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Tindakan */}
        <TabsContent value="treatments" className="space-y-4">
          <Card className="border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Laporan Tindakan Medis
                </CardTitle>
                <Button
                  onClick={() => onPrint('treatments')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
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
                    <TableRow className="bg-purple-50">
                      <TableHead className="text-purple-700">Pasien</TableHead>
                      <TableHead className="text-purple-700">Tindakan</TableHead>
                      <TableHead className="text-purple-700">Jenis</TableHead>
                      <TableHead className="text-purple-700">Nominal</TableHead>
                      <TableHead className="text-purple-700">Dokter</TableHead>
                      <TableHead className="text-purple-700">Fee Dokter</TableHead>
                      <TableHead className="text-purple-700">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTreatmentData.map((treatment, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-purple-800">{treatment.patientName}</TableCell>
                        <TableCell>{treatment.treatmentName}</TableCell>
                        <TableCell>{treatment.treatmentType}</TableCell>
                        <TableCell>{formatCurrency(treatment.nominal)}</TableCell>
                        <TableCell>{treatment.doctorName}</TableCell>
                        <TableCell>{formatCurrency(treatment.calculatedFee || treatment.fee || 0)}</TableCell>
                        <TableCell>{new Date(treatment.date).toLocaleDateString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTreatmentData.length === 0 && (
                  <div className="text-center py-8 text-purple-600">
                    {treatmentData.length === 0 
                      ? 'Belum ada data tindakan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                  <span>Total data: {filteredTreatmentData.length} record</span>
                  <span>Total Pendapatan: {formatCurrency(filteredTreatmentData.reduce((sum, t) => sum + t.nominal, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Fee Dokter */}
        <TabsContent value="doctor-fees" className="space-y-4">
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Laporan Fee Dokter
                </CardTitle>
                <Button
                  onClick={() => onPrint('doctor-fees')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
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
                    <TableRow className="bg-orange-50">
                      <TableHead className="text-orange-700">Dokter</TableHead>
                      <TableHead className="text-orange-700">Shift</TableHead>
                      <TableHead className="text-orange-700">Tanggal</TableHead>
                      <TableHead className="text-orange-700">Fee Tindakan</TableHead>
                      <TableHead className="text-orange-700">Uang Duduk</TableHead>
                      <TableHead className="text-orange-700">Total Fee</TableHead>
                      <TableHead className="text-orange-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctorFeeData.map((fee, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-orange-800">{fee.doctor}</TableCell>
                        <TableCell>{fee.shift}</TableCell>
                        <TableCell>{new Date(fee.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{formatCurrency(fee.treatmentFee)}</TableCell>
                        <TableCell>{formatCurrency(fee.sittingFee)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(fee.finalFee)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            fee.hasTreatments 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fee.hasTreatments ? 'Ada Tindakan' : 'Hanya Duduk'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDoctorFeeData.length === 0 && (
                  <div className="text-center py-8 text-orange-600">
                    {doctorFeeData.length === 0 
                      ? 'Belum ada data fee dokter' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-orange-700">
                  <span>Total data: {filteredDoctorFeeData.length} record</span>
                  <span>Total Fee: {formatCurrency(filteredDoctorFeeData.reduce((sum, f) => sum + f.finalFee, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Pengeluaran */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Laporan Pengeluaran
                </CardTitle>
                <Button
                  onClick={() => onPrint('expenses')}
                  className="bg-red-600 hover:bg-red-700 text-white"
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
                    <TableRow className="bg-red-50">
                      <TableHead className="text-red-700">Nama Pengeluaran</TableHead>
                      <TableHead className="text-red-700">Kategori</TableHead>
                      <TableHead className="text-red-700">Jumlah</TableHead>
                      <TableHead className="text-red-700">Tanggal</TableHead>
                      <TableHead className="text-red-700">Deskripsi</TableHead>
                      <TableHead className="text-red-700">Bukti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenseData.map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-red-800">{expense.name}</TableCell>
                        <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-sm text-gray-600">{expense.description || '-'}</TableCell>
                        <TableCell>
                          {expense.receipt ? (
                            <span className="text-green-600 text-xs">✓ Ada</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredExpenseData.length === 0 && (
                  <div className="text-center py-8 text-red-600">
                    {expenseData.length === 0 
                      ? 'Belum ada data pengeluaran' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-red-700">
                  <span>Total data: {filteredExpenseData.length} record</span>
                  <span>Total Pengeluaran: {formatCurrency(filteredExpenseData.reduce((sum, e) => sum + e.amount, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Keuangan */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="border-indigo-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-indigo-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Laporan Ringkasan Keuangan
                </CardTitle>
                <Button
                  onClick={() => onPrint('financial')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Income Cards */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.treatmentIncome || f.totalTreatments || 0), 0))}
                      </div>
                      <div className="text-sm text-green-700">Pendapatan Tindakan</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.salesIncome || f.totalSales || 0), 0))}
                      </div>
                      <div className="text-sm text-blue-700">Pendapatan Penjualan</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.fieldTripIncome || f.totalFieldTripRevenue || 0), 0))}
                      </div>
                      <div className="text-sm text-purple-700">Pendapatan Field Trip</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.netProfit || f.netIncome || 0), 0))}
                      </div>
                      <div className="text-sm text-orange-700">Laba Bersih</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Fee & Expense Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.salaryExpense || f.totalSalaries || 0), 0))}
                      </div>
                      <div className="text-sm text-red-700">Total Gaji Karyawan</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.doctorFeeExpense || f.totalDoctorFees || 0), 0))}
                      </div>
                      <div className="text-sm text-yellow-700">
                        Total Fee Dokter
                        <div className="text-xs mt-1 text-yellow-600">
                          (Termasuk Field Trip: {formatCurrency(totalDoctorFees)})
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {formatCurrency(filteredFinancialData.reduce((sum, f) => sum + (f.expenses || f.totalExpenses || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-700">Pengeluaran Operasional</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-cyan-200 bg-cyan-50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-600">
                        {formatCurrency(totalEmployeeBonuses)}
                      </div>
                      <div className="text-sm text-cyan-700">Bonus Karyawan Field Trip</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50">
                      <TableHead className="text-indigo-700">Bulan/Tahun</TableHead>
                      <TableHead className="text-indigo-700">Pendapatan Tindakan</TableHead>
                      <TableHead className="text-indigo-700">Pendapatan Penjualan</TableHead>
                      <TableHead className="text-indigo-700">Pendapatan Field Trip</TableHead>
                      <TableHead className="text-indigo-700">Total Gaji</TableHead>
                      <TableHead className="text-indigo-700">Fee Dokter Total</TableHead>
                      <TableHead className="text-indigo-700">Pengeluaran Lain</TableHead>
                      <TableHead className="text-indigo-700">Laba Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFinancialData.map((financial, index) => {
                      const treatmentIncome = financial.treatmentIncome || financial.totalTreatments || 0
                      const salesIncome = financial.salesIncome || financial.totalSales || 0
                      const fieldTripIncome = financial.fieldTripIncome || financial.totalFieldTripRevenue || 0
                      const salaryExpense = financial.salaryExpense || financial.totalSalaries || 0
                      const doctorFeeExpense = financial.doctorFeeExpense || financial.totalDoctorFees || 0
                      const otherExpenses = financial.expenses || financial.totalExpenses || 0
                      const netProfit = financial.netProfit || financial.netIncome || 0
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-indigo-800 font-medium">{financial.month}/{financial.year}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(treatmentIncome)}</TableCell>
                          <TableCell className="text-blue-600">{formatCurrency(salesIncome)}</TableCell>
                          <TableCell className="text-purple-600">{formatCurrency(fieldTripIncome)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(salaryExpense)}</TableCell>
                          <TableCell className="text-yellow-600">
                            <div className="flex flex-col">
                              <span>{formatCurrency(doctorFeeExpense)}</span>
                              <span className="text-xs text-gray-500">
                                (Termasuk Field Trip)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{formatCurrency(otherExpenses)}</TableCell>
                          <TableCell className={`font-bold ${
                            netProfit >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(netProfit)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredFinancialData.length === 0 && (
                  <div className="text-center py-8 text-indigo-600">
                    {financialData.length === 0 
                      ? 'Belum ada data keuangan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              {/* Financial Summary Formula */}
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-medium text-indigo-800 mb-2">Formula Perhitungan Laba Bersih:</h4>
                <div className="text-sm text-indigo-700">
                  <div className="mb-2">
                    <strong>Laba Bersih = </strong>
                    <span className="text-green-600">(Pendapatan Tindakan + Pendapatan Penjualan + Pendapatan Field Trip)</span>
                    <span> - </span>
                    <span className="text-red-600">(Gaji Karyawan + Fee Dokter + Pengeluaran)</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mt-2">
                    <strong className="text-yellow-800">Catatan:</strong>
                    <span className="text-yellow-700"> Fee Dokter Total sudah termasuk fee dokter dari kegiatan Field Trip sebesar {formatCurrency(totalDoctorFees)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-sm text-indigo-700">
                  <span>Total periode: {filteredFinancialData.length} bulan</span>
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
        previewData={previewData}
      />
    </div>
  )
}