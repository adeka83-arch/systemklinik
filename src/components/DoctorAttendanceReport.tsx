import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Stethoscope, FileText, Printer, Calendar, Clock, Download } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { DateRangeQuickSelect } from './DateRangeQuickSelect'
import { getDefaultDateRange } from '../utils/dateHelpers'

interface DoctorAttendanceReportData {
  id: string
  doctorId: string
  doctorName: string
  date: string
  shift: string
  status: 'hadir' | 'tidak_hadir' | 'libur'
  loginTime?: string | null
  logoutTime?: string | null
  notes?: string
  createdAt: string
}

interface Doctor {
  id: string
  name: string
  specialization?: string
  status: string
}

interface DoctorAttendanceReportProps {
  accessToken: string
}

export function DoctorAttendanceReport({ accessToken }: DoctorAttendanceReportProps) {
  const [reportData, setReportData] = useState<DoctorAttendanceReportData[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState(() => {
    const defaultRange = getDefaultDateRange()
    return {
      startDate: defaultRange.start,
      endDate: defaultRange.end,
      doctorId: 'all',
      shift: 'all',
      status: 'all'
    }
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReportData()
    }
  }, [filters])

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setDoctors(data.doctors || [])
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Fetch data from existing doctor attendance system
      const response = await fetch(`${serverUrl}/attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        let attendanceRecords = data.attendance || []
        
        console.log('Raw attendance data for reports:', attendanceRecords.slice(0, 3))
        
        // Group check-ins and check-outs by doctor and date only (1 record per doctor per date)
        const statusMap = new Map()
        
        attendanceRecords.forEach((record: any) => {
          // Use only doctorId and date as key to ensure 1 record per doctor per date
          const key = `${record.doctorId}_${record.date}`
          
          if (!statusMap.has(key)) {
            statusMap.set(key, {
              id: `status_${record.doctorId}_${record.date}`,
              doctorId: record.doctorId,
              doctorName: record.doctorName,
              date: record.date,
              shift: record.shift, // Use first shift encountered
              status: 'tidak_hadir', // default
              loginTime: null,
              logoutTime: null,
              notes: '',
              createdAt: record.createdAt,
              allShifts: [record.shift] // Track all shifts for this doctor on this date
            })
          }
          
          const statusRecord = statusMap.get(key)
          
          // Track all shifts for this doctor on this date
          if (!statusRecord.allShifts.includes(record.shift)) {
            statusRecord.allShifts.push(record.shift)
            // Update shift display to show primary shift or combined shifts
            if (statusRecord.allShifts.length > 1) {
              statusRecord.shift = statusRecord.allShifts.join(' + ')
            }
          }
          
          // Update status and times based on check-in/check-out records
          if (record.type === 'check-in') {
            statusRecord.status = 'hadir'
            // Keep the earliest check-in time if multiple check-ins
            if (!statusRecord.loginTime || record.time < statusRecord.loginTime) {
              statusRecord.loginTime = record.time
            }
            // Update createdAt to the earliest record
            if (!statusRecord.createdAt || record.createdAt < statusRecord.createdAt) {
              statusRecord.createdAt = record.createdAt
            }
          } else if (record.type === 'check-out') {
            // Keep the latest check-out time if multiple check-outs
            if (!statusRecord.logoutTime || record.time > statusRecord.logoutTime) {
              statusRecord.logoutTime = record.time
            }
            // If there's a checkout, status should be hadir
            if (statusRecord.status === 'tidak_hadir') {
              statusRecord.status = 'hadir'
            }
          }
        })
        
        // Convert map to array - now guaranteed to be unique per doctor per date
        let transformedRecords = Array.from(statusMap.values())
        
        // Clean up allShifts property (not needed in final output)
        transformedRecords = transformedRecords.map(record => {
          const { allShifts, ...cleanRecord } = record
          return cleanRecord
        })
        
        // Apply filters
        if (filters.startDate) {
          transformedRecords = transformedRecords.filter((record: any) => record.date >= filters.startDate)
        }
        if (filters.endDate) {
          transformedRecords = transformedRecords.filter((record: any) => record.date <= filters.endDate)
        }
        if (filters.doctorId && filters.doctorId !== 'all') {
          transformedRecords = transformedRecords.filter((record: any) => record.doctorId === filters.doctorId)
        }
        if (filters.shift && filters.shift !== 'all') {
          transformedRecords = transformedRecords.filter((record: any) => record.shift === filters.shift)
        }
        if (filters.status && filters.status !== 'all') {
          transformedRecords = transformedRecords.filter((record: any) => record.status === filters.status)
        }

        // Sort by date descending (newest first), then by doctor name
        transformedRecords.sort((a: any, b: any) => {
          // First sort by date (newest first)
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime()
          }
          
          // Then by doctor name alphabetically
          return a.doctorName.localeCompare(b.doctorName)
        })

        console.log('Transformed and sorted records for report:', transformedRecords.slice(0, 5))
        console.log('Total unique records:', transformedRecords.length)
        setReportData(transformedRecords)
      } else {
        toast.error('Gagal mengambil data laporan absensi dokter')
      }
    } catch (error) {
      console.log('Error fetching report data:', error)
      toast.error('Terjadi kesalahan saat mengambil data laporan')
    } finally {
      setLoading(false)
    }
  }

  const getReportSummary = () => {
    const totalRecords = reportData.length
    const hadirCount = reportData.filter(r => r.status === 'hadir').length
    const tidakHadirCount = reportData.filter(r => r.status === 'tidak_hadir').length
    const liburCount = reportData.filter(r => r.status === 'libur').length
    const shiftPagiCount = reportData.filter(r => r.shift === '09:00-15:00' || r.shift === 'pagi').length
    const shiftSoreCount = reportData.filter(r => r.shift === '18:00-20:00' || r.shift === 'sore').length
    const uniqueDoctors = new Set(reportData.map(r => r.doctorId)).size

    return {
      totalRecords,
      hadirCount,
      tidakHadirCount,
      liburCount,
      shiftPagiCount,
      shiftSoreCount,
      uniqueDoctors
    }
  }

  const summary = getReportSummary()

  const handlePrintReport = () => {
    const printContent = generatePrintContent()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generatePrintContent = () => {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Absensi Dokter</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .summary-item { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #fce7f3; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status-hadir { color: #059669; font-weight: bold; }
          .status-tidak-hadir { color: #dc2626; font-weight: bold; }
          .status-libur { color: #6b7280; font-weight: bold; }
          .shift-pagi { color: #059669; }
          .shift-sore { color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Absensi Dokter</h1>
          <p>Falasifah Dental Clinic</p>
          <p>Periode: ${new Date(filters.startDate).toLocaleDateString('id-ID')} - ${new Date(filters.endDate).toLocaleDateString('id-ID')}</p>
          <p>Dicetak pada: ${today}</p>
        </div>
        
        <div class="summary">
          <h3>Ringkasan Laporan</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div><strong>${summary.totalRecords}</strong></div>
              <div>Total Absensi</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.hadirCount}</strong></div>
              <div>Hadir</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.tidakHadirCount}</strong></div>
              <div>Tidak Hadir</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.liburCount}</strong></div>
              <div>Libur</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.shiftPagiCount}</strong></div>
              <div>Shift Pagi</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.shiftSoreCount}</strong></div>
              <div>Shift Sore</div>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Dokter</th>
              <th>Tanggal</th>
              <th>Shift</th>
              <th>Status</th>
              <th>Waktu Login</th>
              <th>Waktu Logout</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map((record, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${record.doctorName}</td>
                <td>${new Date(record.date).toLocaleDateString('id-ID')}</td>
                <td class="${record.shift === '09:00-15:00' || record.shift === 'pagi' ? 'shift-pagi' : 'shift-sore'}">
                  ${record.shift === '09:00-15:00' || record.shift === 'pagi' ? 'Shift Pagi (09:00-15:00)' : 
                    record.shift === '18:00-20:00' || record.shift === 'sore' ? 'Shift Sore (18:00-20:00)' : record.shift}
                </td>
                <td class="${record.status === 'hadir' ? 'status-hadir' : 
                           record.status === 'tidak_hadir' ? 'status-tidak-hadir' : 'status-libur'}">
                  ${record.status === 'hadir' ? 'Hadir' : 
                    record.status === 'tidak_hadir' ? 'Tidak Hadir' : 'Libur'}
                </td>
                <td>${record.loginTime || '-'}</td>
                <td>${record.logoutTime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; text-align: right;">
          <p>____________________</p>
          <p>Admin</p>
        </div>
      </body>
      </html>
    `
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'hadir': { label: 'Hadir', variant: 'default', className: 'bg-green-100 text-green-800' },
      'tidak_hadir': { label: 'Tidak Hadir', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'libur': { label: 'Libur', variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.tidak_hadir
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getShiftBadge = (shift: string) => {
    const shiftMap = {
      '09:00-15:00': { label: 'Shift Pagi', className: 'bg-green-100 text-green-800' },
      '18:00-20:00': { label: 'Shift Sore', className: 'bg-orange-100 text-orange-800' },
      'pagi': { label: 'Shift Pagi', className: 'bg-green-100 text-green-800' },
      'sore': { label: 'Shift Sore', className: 'bg-orange-100 text-orange-800' }
    }
    const config = shiftMap[shift as keyof typeof shiftMap] || { label: shift, className: 'bg-blue-100 text-blue-800' }
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-pink-800 flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Laporan Absensi Dokter
          </h2>
          <p className="text-pink-600">Generate laporan absensi dokter berdasarkan periode dan filter</p>
        </div>
        <Button
          onClick={handlePrintReport}
          disabled={loading || reportData.length === 0}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <Printer className="h-4 w-4 mr-2" />
          Cetak Laporan
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <DateRangeQuickSelect
              startDate={filters.startDate}
              endDate={filters.endDate}
              onRangeChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
              className="md:col-span-2"
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
              <Label htmlFor="doctorFilter" className="text-pink-700">Dokter</Label>
              <Select value={filters.doctorId} onValueChange={(value) => setFilters({ ...filters, doctorId: value })}>
                <SelectTrigger className="border-pink-200">
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
              <Label htmlFor="shiftFilter" className="text-pink-700">Shift</Label>
              <Select value={filters.shift} onValueChange={(value) => setFilters({ ...filters, shift: value })}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Semua shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua shift</SelectItem>
                  <SelectItem value="09:00-15:00">Shift Pagi (09:00-15:00)</SelectItem>
                  <SelectItem value="18:00-20:00">Shift Sore (18:00-20:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter" className="text-pink-700">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                  <SelectItem value="libur">Libur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-pink-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-pink-600">Total Absensi</p>
              <p className="text-2xl text-pink-800">{summary.totalRecords}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-600">Hadir</p>
              <p className="text-2xl text-green-700">{summary.hadirCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600">Tidak Hadir</p>
              <p className="text-2xl text-red-700">{summary.tidakHadirCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Libur</p>
              <p className="text-2xl text-gray-700">{summary.liburCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-emerald-600">Shift Pagi</p>
              <p className="text-2xl text-emerald-700">{summary.shiftPagiCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-orange-600">Shift Sore</p>
              <p className="text-2xl text-orange-700">{summary.shiftSoreCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Absensi Dokter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <span className="ml-2 text-pink-600">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-pink-700">No</TableHead>
                    <TableHead className="text-pink-700">Nama Dokter</TableHead>
                    <TableHead className="text-pink-700">Tanggal</TableHead>
                    <TableHead className="text-pink-700">Shift</TableHead>
                    <TableHead className="text-pink-700">Status</TableHead>
                    <TableHead className="text-pink-700">Waktu Login</TableHead>
                    <TableHead className="text-pink-700">Waktu Logout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{record.doctorName}</TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>{getShiftBadge(record.shift)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="font-mono">{record.loginTime || '-'}</TableCell>
                      <TableCell className="font-mono">{record.logoutTime || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.length === 0 && !loading && (
                <div className="text-center py-8 text-pink-600">
                  Tidak ada data absensi dokter untuk periode yang dipilih
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-pink-700">
              <span>Total data: {reportData.length} record</span>
              <span>Periode: {new Date(filters.startDate).toLocaleDateString('id-ID')} - {new Date(filters.endDate).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}