import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Calculator, Printer, AlertCircle, Filter, RotateCcw } from 'lucide-react'
import { formatCurrency, getCurrentMonthYear, getMonthNameIndonesian, shouldResetFiltersForNewMonth, getDateString } from '../utils/reports/helpers'
import { years } from '../utils/reports/constants'
import { serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface FieldTripBonusReportFixedProps {
  accessToken: string
  onPrint: (type: string, usePreview?: boolean) => void
  fieldTripSalesData?: any[] // Add data prop from parent
}

interface FieldTripRecord {
  name: string
  type: 'doctor' | 'employee'
  role: string
  amount: number
  fieldTripCount: number
  averageAmount: number
  dates?: string[] // Array of field trip dates for this person
}

export function FieldTripBonusReportFixed({ accessToken, onPrint, fieldTripSalesData = [] }: FieldTripBonusReportFixedProps) {
  const [loading, setLoading] = useState(false)
  const [fieldTripRecords, setFieldTripRecords] = useState<FieldTripRecord[]>([])
  const [fieldTripCount, setFieldTripCount] = useState(0)
  const [salesData, setSalesData] = useState<any[]>([])
  
  // Filter state dengan default bulan dan tahun berjalan
  const [filters, setFilters] = useState(() => {
    const { currentMonth, currentYear } = getCurrentMonthYear()
    return {
      searchName: 'all',
      type: 'all', // 'all', 'doctor', 'employee'
      minAmount: '',
      maxAmount: '',
      month: currentMonth, // Default ke bulan berjalan
      year: currentYear    // Default ke tahun berjalan
    }
  })

  // Auto-reset filter setiap bulan baru
  useEffect(() => {
    const lastViewDate = localStorage.getItem('fieldTripBonusLastViewDate')
    const currentDate = getDateString()
    
    if (shouldResetFiltersForNewMonth(lastViewDate || undefined)) {
      console.log('🗓️ Bulan baru terdeteksi untuk Field Trip Bonus, mereset filter ke bulan berjalan')
      const { currentMonth, currentYear } = getCurrentMonthYear()
      setFilters({ 
        searchName: 'all', 
        type: 'all', 
        minAmount: '', 
        maxAmount: '', 
        month: currentMonth, 
        year: currentYear 
      })
      toast.success('Filter Field Trip Bonus direset ke bulan berjalan')
    }
    
    // Update last view date
    localStorage.setItem('fieldTripBonusLastViewDate', currentDate)
  }, []) // Only run once on component mount

  useEffect(() => {
    // Use data from parent if available, otherwise fetch
    if (fieldTripSalesData && fieldTripSalesData.length > 0) {
      console.log('Using field trip data from parent:', fieldTripSalesData.length, 'records')
      setSalesData(fieldTripSalesData)
      processFieldTripData(fieldTripSalesData)
    } else {
      fetchFieldTripData()
    }
  }, [accessToken, fieldTripSalesData])

  const fetchFieldTripData = async () => {
    try {
      setLoading(true)
      console.log('Fetching field trip data for bonus report...')
      
      const response = await fetch(`${serverUrl}/field-trip-sales`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('Field trip sales data received:', data.sales?.length || 0, 'records')
        
        const sales = data.sales || []
        setSalesData(sales)
        processFieldTripData(sales)
      } else {
        console.log('No field trip sales data found')
        // Clear all data if no sales found
        setFieldTripRecords([])
        setFieldTripCount(0)
        setSalesData([])
      }
    } catch (error) {
      console.log('Error fetching field trip data for bonus report:', error)
      toast.error('Gagal mengambil data field trip untuk laporan bonus')
      // Clear data on error
      setFieldTripRecords([])
      setFieldTripCount(0)
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  const processFieldTripData = (sales: any[]) => {
    console.log('Processing field trip data for bonuses and fees...')
    console.log('Sales data received:', sales.length, 'records')
    
    if (sales.length > 0) {
      console.log('Sample sale structure:', sales[0])
    }
    
    const recordsMap = new Map<string, FieldTripRecord>()
    
    sales.forEach(sale => {
      console.log(`Processing sale ${sale.id}:`, {
        selectedDoctors: sale.selectedDoctors?.length || 0,
        selectedEmployees: sale.selectedEmployees?.length || 0,
        saleDate: sale.saleDate,
        eventDate: sale.eventDate
      })
      
      // Process doctor fees - MENGGUNAKAN LOGIKA YANG SAMA DENGAN FieldTripSales
      if (sale.selectedDoctors && Array.isArray(sale.selectedDoctors)) {
        sale.selectedDoctors.forEach((doctor: any) => {
          const key = `doctor-${doctor.id}`
          const name = doctor.name || doctor.doctorName || 'Unknown Doctor'
          
          console.log('Processing doctor:', { name, fee: doctor.fee, id: doctor.id })
          
          if (recordsMap.has(key)) {
            const existing = recordsMap.get(key)!
            const newAmount = existing.amount + (doctor.fee || 0)
            const newCount = existing.fieldTripCount + 1
            recordsMap.set(key, {
              ...existing,
              amount: newAmount,
              fieldTripCount: newCount,
              averageAmount: newCount > 0 ? newAmount / newCount : 0
            })
          } else {
            const fee = doctor.fee || 0
            recordsMap.set(key, {
              name,
              type: 'doctor',
              role: doctor.specialization || 'GP',
              amount: fee,
              fieldTripCount: 1,
              averageAmount: fee
            })
          }
        })
      }
      
      // Process employee bonuses - MENGGUNAKAN LOGIKA YANG SAMA DENGAN FieldTripSales
      if (sale.selectedEmployees && Array.isArray(sale.selectedEmployees)) {
        sale.selectedEmployees.forEach((employee: any) => {
          const key = `employee-${employee.id}`
          const name = employee.name || employee.employeeName || 'Unknown Employee'
          
          console.log('Processing employee:', { name, bonus: employee.bonus, id: employee.id })
          
          if (recordsMap.has(key)) {
            const existing = recordsMap.get(key)!
            const newAmount = existing.amount + (employee.bonus || 0)
            const newCount = existing.fieldTripCount + 1
            recordsMap.set(key, {
              ...existing,
              amount: newAmount,
              fieldTripCount: newCount,
              averageAmount: newCount > 0 ? newAmount / newCount : 0
            })
          } else {
            const bonus = employee.bonus || 0
            recordsMap.set(key, {
              name,
              type: 'employee',
              role: employee.position || 'Staff',
              amount: bonus,
              fieldTripCount: 1,
              averageAmount: bonus
            })
          }
        })
      }
    })
    
    const recordsArray = Array.from(recordsMap.values()).sort((a, b) => {
      // Sort by type (doctors first), then by name
      if (a.type !== b.type) {
        return a.type === 'doctor' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    console.log('Final processed field trip records:', recordsArray)
    console.log('Record types distribution:', {
      doctors: recordsArray.filter(r => r.type === 'doctor').length,
      employees: recordsArray.filter(r => r.type === 'employee').length
    })
    
    setFieldTripRecords(recordsArray)
    setFieldTripCount(sales.length)
  }

  // Get unique names for dropdown filter
  const uniqueNames = [...new Set(fieldTripRecords.map(record => record.name))].sort()

  // Filtered data
  const filteredFieldTripRecords = (() => {
    console.log('=== FILTERING FIELD TRIP RECORDS ===')
    console.log('Total sales data:', salesData.length)
    console.log('Total field trip records (raw):', fieldTripRecords.length)
    console.log('Active filters:', filters)
    
    // First filter sales data by month/year
    let filteredSales = salesData

    if (filters.month !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        // Gunakan eventDate jika ada, jika tidak gunakan saleDate
        const dateToUse = sale.eventDate || sale.saleDate || sale.date
        const saleDate = new Date(dateToUse)
        const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0')
        return saleMonth === filters.month
      })
    }

    if (filters.year !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        // Gunakan eventDate jika ada, jika tidak gunakan saleDate
        const dateToUse = sale.eventDate || sale.saleDate || sale.date
        const saleDate = new Date(dateToUse)
        const saleYear = saleDate.getFullYear().toString()
        return saleYear === filters.year
      })
    }

    // Process filtered sales to get records
    const recordsMap = new Map<string, FieldTripRecord>()
    
    filteredSales.forEach(sale => {
      // Process doctor fees - MENGGUNAKAN LOGIKA YANG SAMA
      if (sale.selectedDoctors && Array.isArray(sale.selectedDoctors)) {
        sale.selectedDoctors.forEach((doctor: any) => {
          const key = `doctor-${doctor.id}`
          const name = doctor.name || doctor.doctorName || 'Unknown Doctor'
          
          if (recordsMap.has(key)) {
            const existing = recordsMap.get(key)!
            const newAmount = existing.amount + (doctor.fee || 0)
            const newCount = existing.fieldTripCount + 1
            recordsMap.set(key, {
              ...existing,
              amount: newAmount,
              fieldTripCount: newCount,
              averageAmount: newCount > 0 ? newAmount / newCount : 0,
              dates: [...(existing.dates || []), sale.eventDate || sale.saleDate]
            })
          } else {
            const fee = doctor.fee || 0
            recordsMap.set(key, {
              name,
              type: 'doctor',
              role: doctor.specialization || 'GP',
              amount: fee,
              fieldTripCount: 1,
              averageAmount: fee,
              dates: [sale.eventDate || sale.saleDate]
            })
          }
        })
      }
      
      // Process employee bonuses - MENGGUNAKAN LOGIKA YANG SAMA
      if (sale.selectedEmployees && Array.isArray(sale.selectedEmployees)) {
        sale.selectedEmployees.forEach((employee: any) => {
          const key = `employee-${employee.id}`
          const name = employee.name || employee.employeeName || 'Unknown Employee'
          
          if (recordsMap.has(key)) {
            const existing = recordsMap.get(key)!
            const newAmount = existing.amount + (employee.bonus || 0)
            const newCount = existing.fieldTripCount + 1
            recordsMap.set(key, {
              ...existing,
              amount: newAmount,
              fieldTripCount: newCount,
              averageAmount: newCount > 0 ? newAmount / newCount : 0,
              dates: [...(existing.dates || []), sale.eventDate || sale.saleDate]
            })
          } else {
            const bonus = employee.bonus || 0
            recordsMap.set(key, {
              name,
              type: 'employee',
              role: employee.position || 'Staff',
              amount: bonus,
              fieldTripCount: 1,
              averageAmount: bonus,
              dates: [sale.eventDate || sale.saleDate]
            })
          }
        })
      }
    })

    let filtered = Array.from(recordsMap.values())

    // Filter by name
    if (filters.searchName && filters.searchName !== 'all') {
      filtered = filtered.filter(record => 
        record.name === filters.searchName
      )
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(record => record.type === filters.type)
    }

    // Filter by amount range
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount)
      filtered = filtered.filter(record => record.amount >= minAmount)
    }
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount)
      filtered = filtered.filter(record => record.amount <= maxAmount)
    }

    return filtered.sort((a, b) => {
      // Sort by type (doctors first), then by name
      if (a.type !== b.type) {
        return a.type === 'doctor' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  })()

  const totalAmount = filteredFieldTripRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalDoctorFees = filteredFieldTripRecords.filter(r => r.type === 'doctor').reduce((sum, r) => sum + r.amount, 0)
  const totalEmployeeBonuses = filteredFieldTripRecords.filter(r => r.type === 'employee').reduce((sum, r) => sum + r.amount, 0)

  const handlePrint = (usePreview: boolean = true) => {
    // Pass the filtered data to print function
    console.log('=== FIELD TRIP PRINT DEBUG ===')
    console.log('Filtered records to print:', filteredFieldTripRecords)
    console.log('Active filters:', filters)
    console.log('================================')
    
    // Use the main print function with filtered data and filters
    onPrint('field-trip-doctor-fees-custom', usePreview, {
      data: filteredFieldTripRecords,
      filters: filters
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
              <span className="ml-2 text-pink-600">Memuat data field trip...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state if no field trip data
  if (fieldTripCount === 0 || fieldTripRecords.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Tidak Ada Data Fee & Bonus
              </h3>
              <p className="text-gray-500 mb-4">
                Belum ada data field trip atau data fee & bonus belum tersedia.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-blue-700 text-sm mb-2"><strong>Debug Info:</strong></p>
                <p className="text-blue-600 text-xs">Field Trip Count: {fieldTripCount}</p>
                <p className="text-blue-600 text-xs">Records: {fieldTripRecords.length} total</p>
                <p className="text-blue-600 text-xs">Loading: {loading ? 'Ya' : 'Tidak'}</p>
                <p className="text-blue-600 text-xs">Sales Data: {salesData.length} items</p>
                <p className="text-blue-600 text-xs">Parent Data: {fieldTripSalesData.length} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="border-pink-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Laporan Fee & Bonus Field Trip
          </CardTitle>
          <div className="flex">
            <Button
              onClick={() => handlePrint(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-r-none"
              disabled={loading}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => handlePrint(false)}
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
      </CardHeader>
      <CardContent>
        {/* Info Default Filter */}
        <Card className="mb-4 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-blue-700 text-sm">
                  <strong>Default Filter:</strong> Tab ini menampilkan data bulan berjalan ({getMonthNameIndonesian(getCurrentMonthYear().currentMonth)} {getCurrentMonthYear().currentYear}). 
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

        {/* Filter Pencarian - LAYOUT FIXED */}
        <Card className="mb-6 border-pink-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-pink-600" />
              <h3 className="text-pink-800 font-semibold">Filter Pencarian</h3>
              {(filters.searchName !== 'all' || filters.type !== 'all' || filters.minAmount || filters.maxAmount || filters.month !== 'all' || filters.year !== 'all') && (
                <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">
                  {filteredFieldTripRecords.length} data
                </span>
              )}
            </div>
            
            {/* Row 1: Filter fields in 6 columns */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div>
                <Label className="text-pink-700">Cari Nama</Label>
                <Select value={filters.searchName} onValueChange={(value) => setFilters(prev => ({ ...prev, searchName: value }))}>
                  <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                    <SelectValue placeholder="Semua Nama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Nama</SelectItem>
                    {uniqueNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-pink-700">Jenis</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="border-pink-200 bg-white focus:border-pink-400">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="doctor">Fee Dokter</SelectItem>
                    <SelectItem value="employee">Bonus Karyawan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-pink-700">Bulan</Label>
                <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
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
              <div>
                <Label className="text-pink-700">Tahun</Label>
                <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
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
              <div>
                <Label className="text-pink-700">Min Amount</Label>
                <Input
                  id="bonus-min"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="border-pink-200 bg-white focus:border-pink-400"
                />
              </div>
              <div>
                <Label className="text-pink-700">Max Amount</Label>
                <Input
                  id="bonus-max"
                  type="number"
                  placeholder="∞"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="border-pink-200 bg-white focus:border-pink-400"
                />
              </div>
            </div>
            
            {/* Row 2: Reset button centered */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  const { currentMonth, currentYear } = getCurrentMonthYear()
                  setFilters({ 
                    searchName: 'all', 
                    type: 'all', 
                    minAmount: '', 
                    maxAmount: '', 
                    month: currentMonth, // Reset ke bulan berjalan
                    year: currentYear    // Reset ke tahun berjalan
                  })
                  toast.success('Filter direset ke bulan berjalan')
                }}
                variant="outline"
                className="border-pink-600 text-pink-600 hover:bg-pink-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset ke Bulan Berjalan
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50">
                <TableHead className="text-pink-700">No</TableHead>
                <TableHead className="text-pink-700">Nama</TableHead>
                <TableHead className="text-pink-700">Jenis</TableHead>
                <TableHead className="text-pink-700">Posisi/Spesialisasi</TableHead>
                <TableHead className="text-pink-700">Jumlah Field Trip</TableHead>
                <TableHead className="text-pink-700">Total Amount</TableHead>
                <TableHead className="text-pink-700">Rata-rata</TableHead>
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
              ) : filteredFieldTripRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada data fee & bonus untuk filter yang dipilih
                  </TableCell>
                </TableRow>
              ) : (
                filteredFieldTripRecords.map((record, index) => (
                  <TableRow key={`${record.type}-${record.name}-${index}`}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium text-pink-800">{record.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.type === 'doctor' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.type === 'doctor' ? 'Fee Dokter' : 'Bonus Karyawan'}
                      </span>
                    </TableCell>
                    <TableCell>{record.role}</TableCell>
                    <TableCell className="text-center">{record.fieldTripCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(record.amount)}</TableCell>
                    <TableCell>{formatCurrency(record.averageAmount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredFieldTripRecords.length > 0 && (
          <div className="mt-4 p-4 bg-pink-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {formatCurrency(totalDoctorFees)}
                </div>
                <div className="text-sm text-gray-600">Total Fee Dokter</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(totalEmployeeBonuses)}
                </div>
                <div className="text-sm text-gray-600">Total Bonus Karyawan</div>
              </div>
              <div>
                <div className="text-xl font-bold text-pink-600">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-sm text-gray-600">Total Keseluruhan</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {fieldTripCount}
                </div>
                <div className="text-sm text-gray-600">Field Trip</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}