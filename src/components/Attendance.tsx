import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { UserCheck, Calendar, Filter, RefreshCw, Trash2, Edit, Plus, Clock, Users } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { EmployeeAttendance } from './EmployeeAttendance'

interface AttendanceRecord {
  id: string
  doctorId: string
  doctorName: string
  shift: string
  type: 'check-in' | 'check-out'
  date: string
  time: string
  createdAt: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface AttendanceProps {
  accessToken: string
}

export function Attendance({ accessToken }: AttendanceProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [manualInputOpen, setManualInputOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRecord, setNewRecord] = useState({
    doctorId: '',
    shift: '',
    type: 'check-in' as 'check-in' | 'check-out',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  })
  const [filters, setFilters] = useState({
    doctorId: 'all',
    shift: 'all',
    date: '',
    type: 'all'
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (doctors.length > 0) {
      fetchAttendanceRecords()
    }
  }, [doctors]) // Re-fetch attendance when doctors are loaded

  const fetchAttendanceRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('Raw attendance data:', data.attendance?.slice(0, 2)) // Debug log
        console.log('Available doctors:', doctors) // Debug log
        // Map attendance data to ensure proper field mapping with doctor names
        const attendanceRecords = (data.attendance || []).map((record: any) => {
          const doctorName = record.doctorName || (doctors.find(doc => doc.id === record.doctorId)?.name) || 'Unknown Doctor'
          console.log(`Mapping record for doctorId ${record.doctorId}: ${doctorName}`) // Debug log
          return {
            ...record,
            doctorName
          }
        })
        console.log('Mapped attendance data:', attendanceRecords.slice(0, 2)) // Debug log
        setAttendanceRecords(attendanceRecords)
      } else {
        toast.error('Gagal mengambil data absensi')
      }
    } catch (error) {
      console.log('Error fetching attendance:', error)
      toast.error('Terjadi kesalahan saat mengambil data absensi')
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('Fetched doctors:', data.doctors) // Debug log
        setDoctors(data.doctors || [])
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const deleteAttendanceRecord = async (attendanceId: string) => {
    setDeleting(attendanceId)
    try {
      const response = await fetch(`${serverUrl}/attendance/${attendanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove the deleted record from local state
        setAttendanceRecords(prev => prev.filter(record => record.id !== attendanceId))
        toast.success('Data absensi berhasil dihapus')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus data absensi')
      }
    } catch (error) {
      console.log('Error deleting attendance:', error)
      toast.error('Terjadi kesalahan saat menghapus data absensi')
    } finally {
      setDeleting(null)
    }
  }

  const updateAttendanceRecord = async () => {
    if (!editingRecord) return
    
    setUpdating(true)
    try {
      const response = await fetch(`${serverUrl}/attendance/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: editingRecord.doctorId,
          shift: editingRecord.shift,
          type: editingRecord.type,
          date: editingRecord.date,
          time: editingRecord.time
        })
      })

      if (response.ok) {
        const updatedRecord = await response.json()
        // Update the record in local state
        setAttendanceRecords(prev => prev.map(record => 
          record.id === editingRecord.id 
            ? { ...editingRecord, doctorName: doctors.find(d => d.id === editingRecord.doctorId)?.name || editingRecord.doctorName }
            : record
        ))
        
        toast.success('Data absensi berhasil diperbarui')
        setEditDialogOpen(false)
        setEditingRecord(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal memperbarui data absensi')
      }
    } catch (error) {
      console.log('Error updating attendance:', error)
      toast.error('Terjadi kesalahan saat memperbarui data absensi')
    } finally {
      setUpdating(false)
    }
  }

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord({ ...record })
    setEditDialogOpen(true)
  }

  const createAttendanceRecord = async () => {
    if (!newRecord.doctorId || !newRecord.shift || !newRecord.date || !newRecord.time) {
      toast.error('Semua field harus diisi')
      return
    }
    
    // Check for duplicate attendance on same day, shift, and type
    const duplicateCheck = attendanceRecords.find(record => 
      record.doctorId === newRecord.doctorId &&
      record.date === newRecord.date &&
      record.shift === newRecord.shift &&
      record.type === newRecord.type
    )
    
    if (duplicateCheck) {
      const doctorName = doctors.find(d => d.id === newRecord.doctorId)?.name || 'dokter'
      const typeLabel = newRecord.type === 'check-in' ? 'masuk' : 'pulang'
      toast.error(`${doctorName} sudah tercatat absen ${typeLabel} pada tanggal dan shift yang sama`)
      return
    }
    
    setCreating(true)
    try {
      const response = await fetch(`${serverUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: newRecord.doctorId,
          shift: newRecord.shift,
          type: newRecord.type,
          date: newRecord.date,
          time: newRecord.time
        })
      })

      if (response.ok) {
        const createdRecord = await response.json()
        
        // Find doctor name
        const doctorName = doctors.find(d => d.id === newRecord.doctorId)?.name || 'Unknown Doctor'
        
        // Add the new record to local state
        const newAttendanceRecord: AttendanceRecord = {
          id: createdRecord.attendance?.id || Date.now().toString(),
          doctorId: newRecord.doctorId,
          doctorName,
          shift: newRecord.shift,
          type: newRecord.type,
          date: newRecord.date,
          time: newRecord.time,
          createdAt: new Date().toISOString()
        }
        
        setAttendanceRecords(prev => [newAttendanceRecord, ...prev])
        
        const typeLabel = newRecord.type === 'check-in' ? 'masuk' : 'pulang'
        toast.success(`✅ Absen ${typeLabel} ${doctorName} berhasil ditambahkan`)
        setManualInputOpen(false)
        
        // Reset form
        setNewRecord({
          doctorId: '',
          shift: '',
          type: 'check-in',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menambahkan data absensi')
      }
    } catch (error) {
      console.log('Error creating attendance:', error)
      toast.error('Terjadi kesalahan saat menambahkan data absensi')
    } finally {
      setCreating(false)
    }
  }

  const filteredRecords = attendanceRecords
    .filter(record => {
      if (filters.doctorId && filters.doctorId !== "all" && record.doctorId !== filters.doctorId) return false
      if (filters.shift && filters.shift !== "all" && record.shift !== filters.shift) return false
      if (filters.date && record.date !== filters.date) return false
      if (filters.type && filters.type !== "all" && record.type !== filters.type) return false
      return true
    })
    .sort((a, b) => {
      // Sort by date first (newest first)
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      
      if (dateA !== dateB) {
        return dateB - dateA // Newer dates first
      }
      
      // If dates are the same, sort by time (newest first)
      const [hoursA, minutesA] = a.time.split(':').map(Number)
      const [hoursB, minutesB] = b.time.split(':').map(Number)
      const timeA = hoursA * 60 + minutesA
      const timeB = hoursB * 60 + minutesB
      
      return timeB - timeA // Later times first
    })

  const clearFilters = () => {
    setFilters({
      doctorId: 'all',
      shift: 'all',
      date: '',
      type: 'all'
    })
  }

  const getAttendanceStats = () => {
    const today = new Date().toDateString()
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === today
    )

    const checkIns = todayRecords.filter(record => record.type === 'check-in').length
    const checkOuts = todayRecords.filter(record => record.type === 'check-out').length
    const uniqueDoctors = new Set(todayRecords.map(record => record.doctorId)).size

    return { checkIns, checkOuts, uniqueDoctors, total: todayRecords.length }
  }

  const stats = getAttendanceStats()

  // Function to convert shift time to status
  const getShiftStatus = (shift: string) => {
    if (shift === '09:00-15:00') {
      return 'Pagi'
    } else if (shift === '18:00-20:00') {
      return 'Sore'
    }
    return shift // fallback for any other format
  }

  // Function to get shift status color class
  const getShiftStatusColor = (shift: string) => {
    if (shift === '09:00-15:00') {
      return 'bg-blue-100 text-blue-800'
    } else if (shift === '18:00-20:00') {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-gray-100 text-gray-800' // fallback
  }

  const shiftOptions = [
    { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
    { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
  ]

  const typeOptions = [
    { value: 'check-in', label: 'Absen Masuk' },
    { value: 'check-out', label: 'Absen Pulang' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl text-gray-800">Sistem Absensi</h1>
        <p className="text-gray-600">Kelola absensi dokter dan karyawan dengan mudah</p>
      </div>

      {/* Tabs untuk Dokter dan Karyawan */}
      <Tabs defaultValue="doctors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Absensi Dokter
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Absensi Karyawan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctors">
          <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Absensi Hari Ini</p>
                <p className="text-2xl text-pink-800">{stats.total}</p>
              </div>
              <UserCheck className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Absen Masuk</p>
                <p className="text-2xl text-emerald-700">{stats.checkIns}</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Absen Pulang</p>
                <p className="text-2xl text-red-600">{stats.checkOuts}</p>
              </div>
              <UserCheck className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Dokter Aktif</p>
                <p className="text-2xl text-pink-800">{stats.uniqueDoctors}</p>
              </div>
              <Calendar className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Data Absensi Dokter
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  // Reset form when opening dialog
                  setNewRecord({
                    doctorId: '',
                    shift: '',
                    type: 'check-in',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5)
                  })
                  setManualInputOpen(true)
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white"
                disabled={loading || creating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Input Manual
              </Button>
              <Button
                onClick={async () => {
                  await fetchDoctors()
                  await fetchAttendanceRecords()
                }}
                disabled={loading}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
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
                  {shiftOptions.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFilter" className="text-pink-700">Tanggal</Label>
              <Input
                id="dateFilter"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeFilter" className="text-pink-700">Jenis</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenis</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-pink-700">Dokter</TableHead>
                  <TableHead className="text-pink-700">Shift</TableHead>
                  <TableHead className="text-pink-700">Tanggal</TableHead>
                  <TableHead className="text-pink-700">Jenis Absensi</TableHead>
                  <TableHead className="text-pink-700">Waktu</TableHead>
                  <TableHead className="text-pink-700">Status</TableHead>
                  <TableHead className="text-pink-700 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.doctorName}</div>
                        <div className="text-sm text-gray-500">
                          {doctors.find(d => d.id === record.doctorId)?.specialization}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getShiftStatusColor(record.shift)}`}>
                        {getShiftStatus(record.shift)}
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
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                      {/* Calculate if attendance is on time based on shift */}
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
                          // For check-out, we consider it on time if it's after the shift end
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
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          disabled={deleting === record.id || updating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              disabled={deleting === record.id || updating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Data Absensi</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus data absensi {record.doctorName} 
                                pada {new Date(record.date).toLocaleDateString('id-ID')} 
                                jam {record.time}? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAttendanceRecord(record.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleting === record.id || updating}
                              >
                                {deleting === record.id ? 'Menghapus...' : 'Hapus'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRecords.length === 0 && (
              <div className="text-center py-8 text-pink-600">
                {attendanceRecords.length === 0 
                  ? 'Belum ada data absensi' 
                  : 'Tidak ada data yang sesuai dengan filter'
                }
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-pink-700">
              <span>Total data ditampilkan: {filteredRecords.length} dari {attendanceRecords.length} record</span>
              <span>Terakhir diperbarui: {new Date().toLocaleString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Input Dialog */}
      <Dialog open={manualInputOpen} onOpenChange={setManualInputOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Input Manual Absensi</DialogTitle>
            <DialogDescription>
              Tambahkan data absensi secara manual untuk dokter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDoctor" className="text-pink-700">Dokter *</Label>
              <Select 
                value={newRecord.doctorId} 
                onValueChange={(value) => setNewRecord({ ...newRecord, doctorId: value })}
              >
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newShift" className="text-pink-700">Shift *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const [hours] = newRecord.time.split(':').map(Number)
                    if (hours >= 9 && hours < 18) {
                      setNewRecord({ ...newRecord, shift: '09:00-15:00' })
                    } else if (hours >= 18 || hours < 9) {
                      setNewRecord({ ...newRecord, shift: '18:00-20:00' })
                    }
                  }}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs px-2 py-1 h-6"
                  disabled={!newRecord.time}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Auto
                </Button>
              </div>
              <Select 
                value={newRecord.shift} 
                onValueChange={(value) => setNewRecord({ ...newRecord, shift: value })}
              >
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih shift" />
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
              <Label htmlFor="newType" className="text-pink-700">Jenis Absensi *</Label>
              <Select 
                value={newRecord.type} 
                onValueChange={(value) => setNewRecord({ ...newRecord, type: value as 'check-in' | 'check-out' })}
              >
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newDate" className="text-pink-700">Tanggal *</Label>
              <Input
                id="newDate"
                type="date"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newTime" className="text-pink-700">Waktu *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    setNewRecord({ 
                      ...newRecord, 
                      time: now.toTimeString().slice(0, 5),
                      date: now.toISOString().split('T')[0]
                    })
                  }}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs px-2 py-1 h-6"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Sekarang
                </Button>
              </div>
              <Input
                id="newTime"
                type="time"
                value={newRecord.time}
                onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
                className="border-pink-200"
              />
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <p className="text-xs text-pink-700">
                <strong>Catatan:</strong> Pastikan data yang diinputkan sudah benar. 
                Data absensi manual akan langsung tersimpan dalam sistem dan dapat diedit atau dihapus setelahnya jika diperlukan.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManualInputOpen(false)
                // Reset form
                setNewRecord({
                  doctorId: '',
                  shift: '',
                  type: 'check-in',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toTimeString().slice(0, 5)
                })
              }}
              disabled={creating}
            >
              Batal
            </Button>
            <Button
              onClick={createAttendanceRecord}
              disabled={creating || !newRecord.doctorId || !newRecord.shift || !newRecord.date || !newRecord.time}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {creating ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Edit Data Absensi</DialogTitle>
            <DialogDescription>
              Ubah data absensi untuk {editingRecord?.doctorName}
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editDoctor" className="text-pink-700">Dokter</Label>
                <Select 
                  value={editingRecord.doctorId} 
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, doctorId: value })}
                >
                  <SelectTrigger className="border-pink-200">
                    <SelectValue placeholder="Pilih dokter" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editShift" className="text-pink-700">Shift</Label>
                <Select 
                  value={editingRecord.shift} 
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, shift: value })}
                >
                  <SelectTrigger className="border-pink-200">
                    <SelectValue placeholder="Pilih shift" />
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
                <Label htmlFor="editType" className="text-pink-700">Jenis Absensi</Label>
                <Select 
                  value={editingRecord.type} 
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, type: value as 'check-in' | 'check-out' })}
                >
                  <SelectTrigger className="border-pink-200">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDate" className="text-pink-700">Tanggal</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="border-pink-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTime" className="text-pink-700">Waktu</Label>
                <Input
                  id="editTime"
                  type="time"
                  value={editingRecord.time}
                  onChange={(e) => setEditingRecord({ ...editingRecord, time: e.target.value })}
                  className="border-pink-200"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingRecord(null)
              }}
              disabled={updating}
            >
              Batal
            </Button>
            <Button
              onClick={updateAttendanceRecord}
              disabled={updating}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeAttendance accessToken={accessToken} />
        </TabsContent>
      </Tabs>
    </div>
  )
}