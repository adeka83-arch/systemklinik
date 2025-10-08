import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ChevronDown, ChevronRight, Clock, Printer, Filter, Calendar, User, BarChart3 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl, fetchWithTimeout } from '../utils/supabase/client'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface Treatment {
  id: string
  doctorId: string
  doctorName: string
  patientName: string
  calculatedFee: number
  shift: string
  date: string
  createdAt: string
}

interface SittingFee {
  id: string
  doctorId: string
  doctorName: string
  shift: string
  amount: number
  date: string
  createdAt: string
}

interface AttendanceRecord {
  id: string
  doctorId: string
  doctorName: string
  date: string
  shift: string
  status: string
}

interface DoctorFeeRecord {
  id: string
  doctorId: string
  doctorName: string
  date: string
  shift: string
  feeTindakan: number
  feeDuduk: number
  feeFinal: number
  type: 'treatment' | 'sitting'
  hasAttendance?: boolean
}

interface DoctorSummary {
  doctorId: string
  doctorName: string
  totalSessions: number
  totalFeeTindakan: number
  totalFeeDuduk: number
  totalFeeFinal: number
  records: DoctorFeeRecord[]
}

interface DoctorFeeReportsProps {
  accessToken: string
}

export function DoctorFeeReports({ accessToken }: DoctorFeeReportsProps) {
  const [feeRecords, setFeeRecords] = useState<DoctorFeeRecord[]>([])
  const [doctorSummaries, setDoctorSummaries] = useState<DoctorSummary[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true) // Start with loading state
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  
  console.log('DoctorFeeReports component loaded with accessToken:', !!accessToken)
  
  // Early return if no access token
  if (!accessToken) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <p className="text-pink-600">Menunggu otentikasi...</p>
      </div>
    )
  }
  
  // Filter states
  const [filters, setFilters] = useState({
    doctorId: '',
    dateFrom: '',
    dateTo: '',
    shift: '',
    minAmount: '',
    maxAmount: ''
  })

  // Summary calculations
  const [summary, setSummary] = useState({
    totalSessions: 0,
    totalFeeTindakan: 0,
    totalFeeDuduk: 0,
    totalFeeFinal: 0
  })

  useEffect(() => {
    if (accessToken) {
      console.log('Access token available, fetching data...')
      fetchDoctors()
      fetchFeeData()
    } else {
      console.log('No access token available, skipping data fetch')
    }
  }, [accessToken])

  useEffect(() => {
    calculateSummary()
    calculateDoctorSummaries()
  }, [feeRecords])

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors from server...')
      const response = await fetchWithTimeout(`${serverUrl}/doctors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }, 8000)
      
      console.log('Doctors response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Doctors API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Doctors data:', data)
      
      const cleanedDoctors = cleanDoctorNames(data.doctors || [])
      console.log('Cleaned doctors:', cleanedDoctors)
      setDoctors(cleanedDoctors)
    } catch (error) {
      console.log('Error fetching doctors:', error)
      toast.error('Gagal mengambil data dokter')
    }
  }

  const fetchFeeData = async () => {
    setLoading(true)
    try {
      console.log('Fetching fee data from server...')
      console.log('Server URL:', serverUrl)
      console.log('Access token available:', !!accessToken)
      
      // Fetch treatments, sitting fees, and attendance concurrently with timeout
      const [treatmentsResponse, sittingFeesResponse, attendanceResponse] = await Promise.all([
        fetchWithTimeout(`${serverUrl}/treatments`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${accessToken}`
          }
        }, 10000).catch(err => {
          console.log('Treatments fetch error:', err)
          throw new Error(`Failed to fetch treatments: ${err.message}`)
        }),
        fetchWithTimeout(`${serverUrl}/sitting-fees`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${accessToken}`
          }
        }, 10000).catch(err => {
          console.log('Sitting fees fetch error:', err)
          throw new Error(`Failed to fetch sitting fees: ${err.message}`)
        }),
        fetchWithTimeout(`${serverUrl}/attendance`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${accessToken}`
          }
        }, 10000).catch(err => {
          console.log('Attendance fetch error:', err)
          throw new Error(`Failed to fetch attendance: ${err.message}`)
        })
      ])

      console.log('All API responses received')
      console.log('Treatments response status:', treatmentsResponse.status)
      console.log('Sitting fees response status:', sittingFeesResponse.status)
      console.log('Attendance response status:', attendanceResponse.status)

      // Check for non-OK responses
      if (!treatmentsResponse.ok) {
        throw new Error(`Treatments API error: ${treatmentsResponse.status}`)
      }
      if (!sittingFeesResponse.ok) {
        throw new Error(`Sitting fees API error: ${sittingFeesResponse.status}`)
      }
      if (!attendanceResponse.ok) {
        throw new Error(`Attendance API error: ${attendanceResponse.status}`)
      }

      console.log('Parsing JSON responses...')
      const [treatmentsData, sittingFeesData, attendanceData] = await Promise.all([
        treatmentsResponse.json().catch(err => {
          console.log('Treatments JSON parse error:', err)
          return { treatments: [] }
        }),
        sittingFeesResponse.json().catch(err => {
          console.log('Sitting fees JSON parse error:', err)
          return { sittingFees: [] }
        }),
        attendanceResponse.json().catch(err => {
          console.log('Attendance JSON parse error:', err)
          return { attendance: [] }
        })
      ])

      console.log('Data parsed successfully')
      console.log('Treatments data:', treatmentsData)
      console.log('Sitting fees data:', sittingFeesData)
      console.log('Attendance data:', attendanceData)

      const treatments: Treatment[] = treatmentsData.treatments || []
      const sittingFees: SittingFee[] = sittingFeesData.sittingFees || []
      const attendanceRecords: AttendanceRecord[] = attendanceData.attendance || []

      // Create a map of attendance for quick lookup and shift validation
      const attendanceMap = new Map()
      attendanceRecords.forEach((record) => {
        const key = `${record.doctorId}-${record.date}-${record.shift}`
        attendanceMap.set(key, record)
      })

      // Process treatments into fee records (only if doctor attended and shift matches)
      const treatmentRecords: DoctorFeeRecord[] = []
      treatments.forEach(treatment => {
        const attendanceKey = `${treatment.doctorId}-${treatment.date}-${treatment.shift}`
        const attendanceRecord = attendanceMap.get(attendanceKey)
        
        // Only include if doctor attended AND shift matches attendance record
        if (attendanceRecord && attendanceRecord.status === 'hadir') {
          treatmentRecords.push({
            id: `treatment-${treatment.id}`,
            doctorId: treatment.doctorId,
            doctorName: treatment.doctorName,
            date: treatment.date,
            shift: treatment.shift, // Use shift from treatment but validate against attendance
            feeTindakan: treatment.calculatedFee || 0,
            feeDuduk: 0,
            feeFinal: treatment.calculatedFee || 0,
            type: 'treatment',
            hasAttendance: true
          })
        }
      })

      // Process sitting fees into fee records (only if no treatments on same day/shift and doctor attended)
      const sittingFeeRecords: DoctorFeeRecord[] = []
      
      sittingFees.forEach(sittingFee => {
        // Check attendance first with correct shift
        const attendanceKey = `${sittingFee.doctorId}-${sittingFee.date}-${sittingFee.shift}`
        const attendanceRecord = attendanceMap.get(attendanceKey)
        
        // Only process if doctor attended with matching shift
        if (attendanceRecord && attendanceRecord.status === 'hadir') {
          // Check if there's already a treatment for this doctor/date/shift
          const existingTreatment = treatmentRecords.find(tr => 
            tr.doctorId === sittingFee.doctorId && 
            tr.date === sittingFee.date && 
            tr.shift === sittingFee.shift
          )

          if (!existingTreatment) {
            // Add sitting fee record
            sittingFeeRecords.push({
              id: `sitting-${sittingFee.id}`,
              doctorId: sittingFee.doctorId,
              doctorName: sittingFee.doctorName,
              date: sittingFee.date,
              shift: sittingFee.shift,
              feeTindakan: 0,
              feeDuduk: sittingFee.amount,
              feeFinal: sittingFee.amount,
              type: 'sitting',
              hasAttendance: true
            })
          } else {
            // Apply sitting fee logic: if treatment fee < sitting fee, doctor gets sitting fee amount
            if (existingTreatment.feeTindakan < sittingFee.amount) {
              // Doctor gets sitting fee amount, but we show the breakdown
              existingTreatment.feeFinal = sittingFee.amount
              existingTreatment.feeDuduk = sittingFee.amount - existingTreatment.feeTindakan
            }
            // If treatment fee >= sitting fee, sitting fee is "cancelled" (no additional fee)
          }
        }
      })

      // Combine and sort records
      const allRecords = [...treatmentRecords, ...sittingFeeRecords]
        .sort((a, b) => {
          // Sort by date first (newest first)
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          
          if (dateA !== dateB) {
            return dateB - dateA
          }
          
          // Then by doctor name
          return a.doctorName.localeCompare(b.doctorName)
        })

      setFeeRecords(allRecords)
    } catch (error) {
      console.log('Error fetching fee data:', error)
      toast.error(`Gagal mengambil data fee dokter: ${error.message || 'Unknown error'}`)
      
      // Set empty data to prevent component crash
      setFeeRecords([])
      setDoctorSummaries([])
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = () => {
    const filtered = getFilteredRecords()
    
    const summary = {
      totalSessions: filtered.length,
      totalFeeTindakan: filtered.reduce((sum, record) => sum + record.feeTindakan, 0),
      totalFeeDuduk: filtered.reduce((sum, record) => sum + record.feeDuduk, 0),
      totalFeeFinal: filtered.reduce((sum, record) => sum + record.feeFinal, 0)
    }
    
    setSummary(summary)
  }

  const calculateDoctorSummaries = () => {
    const filtered = getFilteredRecords()
    const doctorMap = new Map<string, DoctorSummary>()

    filtered.forEach(record => {
      if (!doctorMap.has(record.doctorId)) {
        doctorMap.set(record.doctorId, {
          doctorId: record.doctorId,
          doctorName: record.doctorName,
          totalSessions: 0,
          totalFeeTindakan: 0,
          totalFeeDuduk: 0,
          totalFeeFinal: 0,
          records: []
        })
      }

      const summary = doctorMap.get(record.doctorId)!
      summary.totalSessions += 1
      summary.totalFeeTindakan += record.feeTindakan
      summary.totalFeeDuduk += record.feeDuduk
      summary.totalFeeFinal += record.feeFinal
      summary.records.push(record)
    })

    const summaries = Array.from(doctorMap.values())
      .sort((a, b) => b.totalFeeFinal - a.totalFeeFinal) // Sort by total fee final (highest first)

    setDoctorSummaries(summaries)
  }

  const getFilteredRecords = () => {
    return feeRecords.filter(record => {
      // Doctor filter
      if (filters.doctorId && record.doctorId !== filters.doctorId) {
        return false
      }
      
      // Date range filter
      if (filters.dateFrom && record.date < filters.dateFrom) {
        return false
      }
      if (filters.dateTo && record.date > filters.dateTo) {
        return false
      }
      
      // Shift filter
      if (filters.shift && record.shift !== filters.shift) {
        return false
      }
      
      // Amount filter
      if (filters.minAmount && record.feeFinal < parseFloat(filters.minAmount)) {
        return false
      }
      if (filters.maxAmount && record.feeFinal > parseFloat(filters.maxAmount)) {
        return false
      }
      
      return true
    })
  }

  const handlePrint = (type: 'summary' | 'detail') => {
    const data = type === 'summary' ? doctorSummaries : getFilteredRecords()
    
    let tableContent = ''
    let title = type === 'summary' ? 'Laporan Akumulasi Fee per Dokter' : 'Laporan Detail Fee Dokter'
    
    if (type === 'summary') {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Dokter</th>
              <th>Total Sessions</th>
              <th>Total Fee Tindakan</th>
              <th>Total Fee Duduk</th>
              <th>Total Fee Final</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((summary: DoctorSummary, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${summary.doctorName}</td>
                <td class="text-center">${summary.totalSessions}</td>
                <td class="currency">${formatCurrency(summary.totalFeeTindakan)}</td>
                <td class="currency">${formatCurrency(summary.totalFeeDuduk)}</td>
                <td class="currency">${formatCurrency(summary.totalFeeFinal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Dokter</th>
              <th>Tanggal</th>
              <th>Shift</th>
              <th>Fee Tindakan</th>
              <th>Fee Duduk</th>
              <th>Fee Final</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((record: DoctorFeeRecord, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${record.doctorName}</td>
                <td>${new Date(record.date).toLocaleDateString('id-ID')}</td>
                <td>
                  <span style="background: #fce7f3; color: #be185d; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                    ${record.shift === '09:00-15:00' ? 'Pagi' : 'Sore'}
                  </span>
                </td>
                <td class="currency">${formatCurrency(record.feeTindakan)}</td>
                <td class="currency">${formatCurrency(record.feeDuduk)}</td>
                <td class="currency">${formatCurrency(record.feeFinal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Falasifah Dental Clinic</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #be185d; }
            .header p { margin: 5px 0; color: #666; }
            .filter-info { background: #fce7f3; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .filter-info h3 { margin: 0 0 10px 0; color: #be185d; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background-color: #fce7f3; color: #9d174d; font-weight: 600; }
            tbody tr:nth-child(even) { background-color: #fef7ff; }
            .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 18px; font-weight: bold; color: #be185d; }
            .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
            .text-center { text-align: center; }
            .currency { font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Falasifah Dental Clinic</p>
            <p>Periode: ${filters.dateFrom || 'Semua'} s/d ${filters.dateTo || 'Semua'}</p>
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</p>
          </div>
          
          ${filters.doctorId || filters.shift || filters.minAmount || filters.maxAmount ? `
          <div class="filter-info">
            <h3>Filter Aktif:</h3>
            ${filters.doctorId ? `<p>Dokter: ${doctors.find(d => d.id === filters.doctorId)?.name || 'Tidak diketahui'}</p>` : ''}
            ${filters.shift ? `<p>Shift: ${filters.shift}</p>` : ''}
            ${filters.minAmount ? `<p>Fee Minimum: ${formatCurrency(parseFloat(filters.minAmount))}</p>` : ''}
            ${filters.maxAmount ? `<p>Fee Maksimum: ${formatCurrency(parseFloat(filters.maxAmount))}</p>` : ''}
          </div>
          ` : ''}
          
          ${tableContent}
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value" style="color: #dc2626;">${type === 'summary' ? doctorSummaries.reduce((sum, d) => sum + d.totalSessions, 0) : summary.totalSessions}</div>
                <div class="summary-label">Total Sessions</div>
              </div>
              <div class="summary-item">
                <div class="summary-value" style="color: #2563eb;">${formatCurrency(type === 'summary' ? doctorSummaries.reduce((sum, d) => sum + d.totalFeeTindakan, 0) : summary.totalFeeTindakan)}</div>
                <div class="summary-label">Total Fee Tindakan</div>
              </div>
              <div class="summary-item">
                <div class="summary-value" style="color: #7c3aed;">${formatCurrency(type === 'summary' ? doctorSummaries.reduce((sum, d) => sum + d.totalFeeDuduk, 0) : summary.totalFeeDuduk)}</div>
                <div class="summary-label">Total Fee Duduk</div>
              </div>
              <div class="summary-item">
                <div class="summary-value" style="color: #059669;">${formatCurrency(type === 'summary' ? doctorSummaries.reduce((sum, d) => sum + d.totalFeeFinal, 0) : summary.totalFeeFinal)}</div>
                <div class="summary-label">Total Fee Final</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const resetFilters = () => {
    setFilters({
      doctorId: '',
      dateFrom: '',
      dateTo: '',
      shift: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  const filteredRecords = getFilteredRecords()

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="border-pink-200">
        <CardHeader>
          <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Lanjutan
                </CardTitle>
                <div className="flex items-center gap-2">
                  {(filters.doctorId || filters.dateFrom || filters.dateTo || filters.shift || filters.minAmount || filters.maxAmount) && (
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      Filter Aktif
                    </Badge>
                  )}
                  {filterOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="doctor-filter" className="text-pink-700">Dokter</Label>
                  <Select value={filters.doctorId} onValueChange={(value) => setFilters({ ...filters, doctorId: value })}>
                    <SelectTrigger className="border-pink-200">
                      <SelectValue placeholder="Semua dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua dokter</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-from" className="text-pink-700">Tanggal Dari</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="border-pink-200"
                  />
                </div>

                <div>
                  <Label htmlFor="date-to" className="text-pink-700">Tanggal Sampai</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="border-pink-200"
                  />
                </div>

                <div>
                  <Label htmlFor="shift-filter" className="text-pink-700">Shift</Label>
                  <Select value={filters.shift} onValueChange={(value) => setFilters({ ...filters, shift: value })}>
                    <SelectTrigger className="border-pink-200">
                      <SelectValue placeholder="Semua shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua shift</SelectItem>
                      <SelectItem value="09:00-15:00">Shift Pagi (09:00-15:00)</SelectItem>
                      <SelectItem value="18:00-20:00">Shift Sore (18:00-20:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="min-amount" className="text-pink-700">Fee Minimum</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="border-pink-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="max-amount" className="text-pink-700">Fee Maksimum</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    className="border-pink-200"
                    placeholder="Tidak terbatas"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  Reset Filter
                </Button>
                <Button
                  onClick={fetchFeeData}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  Refresh Data
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Main Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Akumulasi per Dokter
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Detail per Session
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Laporan Akumulasi Fee per Dokter
                </CardTitle>
                <Button 
                  onClick={() => handlePrint('summary')}
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={loading || doctorSummaries.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                  <p className="text-pink-600">Memuat data fee dokter...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-pink-50 hover:bg-pink-50">
                          <TableHead className="text-pink-800">No</TableHead>
                          <TableHead className="text-pink-800">Dokter</TableHead>
                          <TableHead className="text-pink-800">Total Sessions</TableHead>
                          <TableHead className="text-pink-800">Fee Tindakan</TableHead>
                          <TableHead className="text-pink-800">Fee Duduk</TableHead>
                          <TableHead className="text-pink-800">Fee Final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctorSummaries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                              Belum ada data fee dokter.
                            </TableCell>
                          </TableRow>
                        ) : (
                          doctorSummaries.map((summary, index) => (
                            <TableRow key={summary.doctorId} className="hover:bg-pink-50/50">
                              <TableCell className="text-center">{index + 1}</TableCell>
                              <TableCell className="font-medium">{summary.doctorName}</TableCell>
                              <TableCell className="text-center font-medium text-red-600">
                                {summary.totalSessions}
                              </TableCell>
                              <TableCell className="font-medium text-blue-600">
                                {formatCurrency(summary.totalFeeTindakan)}
                              </TableCell>
                              <TableCell className="font-medium text-purple-600">
                                {formatCurrency(summary.totalFeeDuduk)}
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(summary.totalFeeFinal)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Totals */}
                  {doctorSummaries.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">
                          {doctorSummaries.reduce((sum, d) => sum + d.totalSessions, 0)}
                        </div>
                        <div className="text-sm text-red-700 mt-1">Total Sessions</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(doctorSummaries.reduce((sum, d) => sum + d.totalFeeTindakan, 0))}
                        </div>
                        <div className="text-sm text-blue-700 mt-1">Total Fee Tindakan</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-lg font-bold text-purple-600">
                          {formatCurrency(doctorSummaries.reduce((sum, d) => sum + d.totalFeeDuduk, 0))}
                        </div>
                        <div className="text-sm text-purple-700 mt-1">Total Fee Duduk</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(doctorSummaries.reduce((sum, d) => sum + d.totalFeeFinal, 0))}
                        </div>
                        <div className="text-sm text-green-700 mt-1">Total Fee Final</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detail Tab */}
        <TabsContent value="detail" className="mt-6">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Laporan Detail Fee per Session
                </CardTitle>
                <Button 
                  onClick={() => handlePrint('detail')}
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={loading || filteredRecords.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                  <p className="text-pink-600">Memuat data fee dokter...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-pink-50 hover:bg-pink-50">
                          <TableHead className="text-pink-800">No</TableHead>
                          <TableHead className="text-pink-800">Dokter</TableHead>
                          <TableHead className="text-pink-800">Tanggal</TableHead>
                          <TableHead className="text-pink-800">Shift</TableHead>
                          <TableHead className="text-pink-800">Fee Tindakan</TableHead>
                          <TableHead className="text-pink-800">Fee Duduk</TableHead>
                          <TableHead className="text-pink-800">Fee Final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              {feeRecords.length === 0 
                                ? 'Belum ada data fee dokter.' 
                                : 'Tidak ada data yang sesuai dengan filter.'
                              }
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((record, index) => (
                            <TableRow key={record.id} className="hover:bg-pink-50/50">
                              <TableCell className="text-center">{index + 1}</TableCell>
                              <TableCell className="font-medium">{record.doctorName}</TableCell>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString('id-ID')}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    record.shift === '09:00-15:00' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                      : 'bg-orange-50 text-orange-700 border-orange-300'
                                  }
                                >
                                  {record.shift === '09:00-15:00' ? 'Pagi' : 'Sore'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-blue-600">
                                {formatCurrency(record.feeTindakan)}
                              </TableCell>
                              <TableCell className="font-medium text-purple-600">
                                {formatCurrency(record.feeDuduk)}
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatCurrency(record.feeFinal)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  {filteredRecords.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{summary.totalSessions}</div>
                        <div className="text-sm text-red-700 mt-1">Total Sessions</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalFeeTindakan)}</div>
                        <div className="text-sm text-blue-700 mt-1">Total Fee Tindakan</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalFeeDuduk)}</div>
                        <div className="text-sm text-purple-700 mt-1">Total Fee Duduk</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalFeeFinal)}</div>
                        <div className="text-sm text-green-700 mt-1">Total Fee Final</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}