import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Users, FileText, Printer, Calendar, Clock, Download } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { DateRangeQuickSelect } from './DateRangeQuickSelect'
import { getDefaultDateRange } from '../utils/dateHelpers'

interface EmployeeAttendanceReportData {
  id: string
  employeeId: string
  employeeName: string
  position: string
  type: 'check-in' | 'check-out'
  date: string
  time: string
  status: 'Tepat Waktu' | 'Terlambat' | 'Pulang Cepat'
}

interface Employee {
  id: string
  name: string
  position: string
}

interface EmployeeAttendanceReportProps {
  accessToken: string
}

export function EmployeeAttendanceReport({ accessToken }: EmployeeAttendanceReportProps) {
  const [reportData, setReportData] = useState<EmployeeAttendanceReportData[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [filters, setFilters] = useState(() => {
    const defaultRange = getDefaultDateRange()
    return {
      startDate: defaultRange.start,
      endDate: defaultRange.end,
      employeeId: 'all',
      type: 'all'
    }
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReportData()
    }
  }, [filters])

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching employees:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/employee-attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        let attendanceRecords = data.attendance || []
        
        // Apply filters
        if (filters.startDate) {
          attendanceRecords = attendanceRecords.filter((record: any) => record.date >= filters.startDate)
        }
        if (filters.endDate) {
          attendanceRecords = attendanceRecords.filter((record: any) => record.date <= filters.endDate)
        }
        if (filters.employeeId && filters.employeeId !== 'all') {
          attendanceRecords = attendanceRecords.filter((record: any) => record.employeeId === filters.employeeId)
        }
        if (filters.type && filters.type !== 'all') {
          attendanceRecords = attendanceRecords.filter((record: any) => record.type === filters.type)
        }

        // Transform data with status calculation
        const transformedData = attendanceRecords.map((record: any) => {
          const [hours, minutes] = record.time.split(':').map(Number)
          const timeInMinutes = hours * 60 + minutes
          let status = 'Tepat Waktu'

          if (record.type === 'check-in') {
            // Standard work hours: before 8:30 AM
            if (timeInMinutes > 8 * 60 + 30) {
              status = 'Terlambat'
            }
          } else {
            // Check-out: after 5:00 PM
            if (timeInMinutes < 17 * 60) {
              status = 'Pulang Cepat'
            }
          }

          return {
            id: record.id,
            employeeId: record.employeeId,
            employeeName: record.employeeName,
            position: record.position,
            type: record.type,
            date: record.date,
            time: record.time,
            status
          }
        })

        // Sort by date descending (newest first), then by time descending, then by employee name
        transformedData.sort((a: any, b: any) => {
          // First sort by date (newest first)
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime()
          }
          
          // Then by time descending (latest first)
          const timeA = a.time
          const timeB = b.time
          if (timeB !== timeA) {
            return timeB.localeCompare(timeA)
          }
          
          // Finally by employee name
          return a.employeeName.localeCompare(b.employeeName)
        })

        console.log('Transformed and sorted employee attendance records:', transformedData.slice(0, 5))
        console.log('Total employee attendance records:', transformedData.length)
        setReportData(transformedData)
      } else {
        toast.error('Gagal mengambil data laporan absensi karyawan')
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
    const checkIns = reportData.filter(r => r.type === 'check-in').length
    const checkOuts = reportData.filter(r => r.type === 'check-out').length
    const onTime = reportData.filter(r => r.status === 'Tepat Waktu').length
    const late = reportData.filter(r => r.status === 'Terlambat').length
    const earlyOut = reportData.filter(r => r.status === 'Pulang Cepat').length
    const uniqueEmployees = new Set(reportData.map(r => r.employeeId)).size

    return {
      totalRecords,
      checkIns,
      checkOuts,
      onTime,
      late,
      earlyOut,
      uniqueEmployees
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
        <title>Laporan Absensi Karyawan</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .summary-item { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status-ontime { color: #059669; font-weight: bold; }
          .status-late { color: #dc2626; font-weight: bold; }
          .status-early { color: #d97706; font-weight: bold; }
          .type-checkin { color: #059669; }
          .type-checkout { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Absensi Karyawan</h1>
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
              <div><strong>${summary.checkIns}</strong></div>
              <div>Absen Masuk</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.checkOuts}</strong></div>
              <div>Absen Pulang</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.uniqueEmployees}</strong></div>
              <div>Karyawan Unik</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.onTime}</strong></div>
              <div>Tepat Waktu</div>
            </div>
            <div class="summary-item">
              <div><strong>${summary.late + summary.earlyOut}</strong></div>
              <div>Terlambat/Pulang Cepat</div>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Posisi</th>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Waktu</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map((record, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${record.employeeName}</td>
                <td>${record.position}</td>
                <td>${new Date(record.date).toLocaleDateString('id-ID')}</td>
                <td class="${record.type === 'check-in' ? 'type-checkin' : 'type-checkout'}">
                  ${record.type === 'check-in' ? 'Absen Masuk' : 'Absen Pulang'}
                </td>
                <td>${record.time}</td>
                <td class="${record.status === 'Tepat Waktu' ? 'status-ontime' : 
                           record.status === 'Terlambat' ? 'status-late' : 'status-early'}">
                  ${record.status}
                </td>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-blue-800 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Laporan Absensi Karyawan
          </h2>
          <p className="text-blue-600">Generate laporan absensi karyawan berdasarkan periode dan filter</p>
        </div>
        <Button
          onClick={handlePrintReport}
          disabled={loading || reportData.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="h-4 w-4 mr-2" />
          Cetak Laporan
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <DateRangeQuickSelect
              startDate={filters.startDate}
              endDate={filters.endDate}
              onRangeChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
              label="Periode Cepat"
              labelClassName="text-blue-700"
              className="md:col-span-2"
            />

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-blue-700">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-blue-700">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeFilter" className="text-blue-700">Karyawan</Label>
              <Select value={filters.employeeId} onValueChange={(value) => setFilters({ ...filters, employeeId: value })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Semua karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua karyawan</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeFilter" className="text-blue-700">Jenis Absensi</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenis</SelectItem>
                  <SelectItem value="check-in">Absen Masuk</SelectItem>
                  <SelectItem value="check-out">Absen Pulang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600">Total Absensi</p>
              <p className="text-2xl text-blue-800">{summary.totalRecords}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-600">Absen Masuk</p>
              <p className="text-2xl text-green-700">{summary.checkIns}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600">Absen Pulang</p>
              <p className="text-2xl text-red-700">{summary.checkOuts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-purple-600">Karyawan Unik</p>
              <p className="text-2xl text-purple-700">{summary.uniqueEmployees}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-emerald-600">Tepat Waktu</p>
              <p className="text-2xl text-emerald-700">{summary.onTime}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-orange-600">Terlambat</p>
              <p className="text-2xl text-orange-700">{summary.late + summary.earlyOut}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Absensi Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-blue-700">No</TableHead>
                    <TableHead className="text-blue-700">Nama Karyawan</TableHead>
                    <TableHead className="text-blue-700">Posisi</TableHead>
                    <TableHead className="text-blue-700">Tanggal</TableHead>
                    <TableHead className="text-blue-700">Jenis</TableHead>
                    <TableHead className="text-blue-700">Waktu</TableHead>
                    <TableHead className="text-blue-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {record.position}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.type === 'check-in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type === 'check-in' ? 'Absen Masuk' : 'Absen Pulang'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{record.time}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.status === 'Tepat Waktu' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : record.status === 'Terlambat'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.length === 0 && !loading && (
                <div className="text-center py-8 text-blue-600">
                  Tidak ada data absensi karyawan untuk periode yang dipilih
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-blue-700">
              <span>Total data: {reportData.length} record</span>
              <span>Periode: {new Date(filters.startDate).toLocaleDateString('id-ID')} - {new Date(filters.endDate).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}