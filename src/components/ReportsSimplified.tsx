import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { FileText, Printer, Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart, Stethoscope, MapPin, Calculator } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from '../utils/reports/helpers'

import { handlePrint } from '../utils/reports/printServiceSimple'
// Removed PrintPreviewWrapper and usePrintPreview for simplified direct printing
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
import { FieldTripBonusReportTest } from './FieldTripBonusReportTest'

export function Reports({ accessToken }: ReportsProps) {
  const [loading, setLoading] = useState(false)
  const [salaryData, setSalaryData] = useState<SalaryReport[]>([])
  const [doctorFeeData, setDoctorFeeData] = useState<DoctorFeeReport[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([])
  const [treatmentData, setTreatmentData] = useState<TreatmentReport[]>([])
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [fieldTripSalesData, setFieldTripSalesData] = useState<FieldTripSaleReport[]>([])
  const [financialData, setFinancialData] = useState<FinancialSummary[]>([])
  
  // Simplified direct printing - no preview needed for now

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (treatmentData.length > 0 || salesData.length > 0 || fieldTripSalesData.length > 0 || salaryData.length > 0 || doctorFeeData.length > 0 || expenseData.length > 0) {
      const financialResults = calculateFinancialData(treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData)
      setFinancialData(financialResults)
    }
  }, [treatmentData, salesData, fieldTripSalesData, salaryData, doctorFeeData, expenseData])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [salaries, doctorFees, expenses, treatments, sales, fieldTripSales] = await Promise.all([
        fetchSalaryReport(accessToken),
        fetchDoctorFeeReport(accessToken),
        fetchExpenseReport(accessToken),
        fetchTreatmentReport(accessToken),
        fetchSalesReport(accessToken),
        fetchFieldTripSales(accessToken)
      ])
      
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

  // Process attendance data to display properly
  const processAttendanceDataForDisplay = (data: any[]): any[] => {
    if (!data || data.length === 0) return []
    
    // If data already has enriched structure from server, use it directly
    if (data[0]?.doctorName && data[0]?.status && data[0]?.shift) {
      return data.sort((a, b) => {
        const dateCompare = new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        if (dateCompare !== 0) return dateCompare
        return (a.doctorName || 'Unknown').localeCompare(b.doctorName || 'Unknown')
      })
    }
    
    // Fallback: Process raw attendance data if not enriched
    const grouped = new Map()
    
    data.forEach(item => {
      const date = item.date || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
      const key = `${item.doctorName || item.doctorId}-${date}-${item.shift || 'Unknown'}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          doctorId: item.doctorId,
          doctorName: item.doctorName || 'Unknown Doctor',
          date: date,
          shift: item.shift || 'Unknown',
          checkInTime: item.checkin || null,
          checkOutTime: item.checkout || null,
          status: item.status || 'Unknown'
        })
      }
    })
    
    return Array.from(grouped.values()).sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.doctorName.localeCompare(b.doctorName)
    })
  }

  // Filter attendance data based on filters
  const getFilteredAttendanceData = () => {
    let filtered = [...attendanceData]
    
    // Filter by doctor name
    if (attendanceFilters.doctorName && attendanceFilters.doctorName !== 'all') {
      filtered = filtered.filter(item => 
        item.doctorName?.toLowerCase().includes(attendanceFilters.doctorName.toLowerCase())
      )
    }
    
    // Filter by shift
    if (attendanceFilters.shift && attendanceFilters.shift !== 'all') {
      filtered = filtered.filter(item => item.shift === attendanceFilters.shift)
    }
    
    // Filter by status
    if (attendanceFilters.status && attendanceFilters.status !== 'all') {
      filtered = filtered.filter(item => item.status === attendanceFilters.status)
    }
    
    // Filter by date range
    if (attendanceFilters.startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.createdAt)
        const startDate = new Date(attendanceFilters.startDate)
        return itemDate >= startDate
      })
    }
    
    if (attendanceFilters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.createdAt)
        const endDate = new Date(attendanceFilters.endDate)
        return itemDate <= endDate
      })
    }
    
    return filtered
  }
  
  const processedAttendanceData = processAttendanceDataForDisplay(getFilteredAttendanceData())
  const filteredSalaryData = salaryData
  const filteredDoctorFeeData = doctorFeeData
  const filteredTreatmentData = treatmentData
  const filteredSalesData = salesData
  const filteredFieldTripSalesData = fieldTripSalesData
  const filteredFinancialData = financialData
  const filteredExpenseData = expenseData
  
  // Get unique doctor names for filter dropdown
  const uniqueDoctors = [...new Set(attendanceData.map(item => item.doctorName).filter(Boolean))]
  
  // Reset attendance filters
  const resetAttendanceFilters = () => {
    setAttendanceFilters({
      doctorName: 'all',
      shift: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    })
  }



  const onPrint = (type: string) => {
    console.log('=== PRINT FUNCTION CALLED ===')
    console.log('Print triggered for type:', type)
    console.log('Available data:', {
      attendance: processedAttendanceData?.length,
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
        processedAttendanceData,
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
      {/* Tabs untuk berbagai jenis laporan */}
      <Tabs defaultValue="field-trip-bonus" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 bg-pink-100">
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
            onPrint={onPrint}
          />
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