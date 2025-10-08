import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Users, Calendar, Filter, RefreshCw, Trash2, Edit, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface EmployeeAttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  position: string
  type: 'check-in' | 'check-out'
  date: string
  time: string
  createdAt: string
}

interface Employee {
  id: string
  name: string
  position: string
  email: string
}

interface EmployeeAttendanceProps {
  accessToken: string
}

export function EmployeeAttendance({ accessToken }: EmployeeAttendanceProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<EmployeeAttendanceRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [manualInputOpen, setManualInputOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    type: 'check-in' as 'check-in' | 'check-out',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  })
  const [filters, setFilters] = useState({
    employeeId: 'all',
    date: '',
    type: 'all'
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      fetchEmployeeAttendanceRecords()
    }
  }, [employees])

  const fetchEmployeeAttendanceRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/employee-attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('Raw employee attendance data:', data.attendance?.slice(0, 2))
        // Map attendance data to ensure proper field mapping with employee names
        const attendanceRecords = (data.attendance || []).map((record: any) => {
          const employee = employees.find(emp => emp.id === record.employeeId)
          const employeeName = record.employeeName || employee?.name || 'Unknown Employee'
          const position = employee?.position || 'Unknown Position'
          return {
            ...record,
            employeeName,
            position
          }
        })
        setAttendanceRecords(attendanceRecords)
      } else {
        toast.error('Gagal mengambil data absensi karyawan')
      }
    } catch (error) {
      console.log('Error fetching employee attendance:', error)
      toast.error('Terjadi kesalahan saat mengambil data absensi karyawan')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('Fetched employees:', data.employees)
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching employees:', error)
    }
  }

  const deleteAttendanceRecord = async (attendanceId: string) => {
    setDeleting(attendanceId)
    try {
      const response = await fetch(`${serverUrl}/employee-attendance/${attendanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setAttendanceRecords(prev => prev.filter(record => record.id !== attendanceId))
        toast.success('Data absensi karyawan berhasil dihapus')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus data absensi karyawan')
      }
    } catch (error) {
      console.log('Error deleting employee attendance:', error)
      toast.error('Terjadi kesalahan saat menghapus data absensi karyawan')
    } finally {
      setDeleting(null)
    }
  }

  const updateAttendanceRecord = async () => {
    if (!editingRecord) return
    
    setUpdating(true)
    try {
      const response = await fetch(`${serverUrl}/employee-attendance/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: editingRecord.employeeId,
          type: editingRecord.type,
          date: editingRecord.date,
          time: editingRecord.time
        })
      })

      if (response.ok) {
        setAttendanceRecords(prev => prev.map(record => 
          record.id === editingRecord.id 
            ? { 
                ...editingRecord, 
                employeeName: employees.find(e => e.id === editingRecord.employeeId)?.name || editingRecord.employeeName,
                position: employees.find(e => e.id === editingRecord.employeeId)?.position || editingRecord.position
              }
            : record
        ))
        
        toast.success('Data absensi karyawan berhasil diperbarui')
        setEditDialogOpen(false)
        setEditingRecord(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal memperbarui data absensi karyawan')
      }
    } catch (error) {
      console.log('Error updating employee attendance:', error)
      toast.error('Terjadi kesalahan saat memperbarui data absensi karyawan')
    } finally {
      setUpdating(false)
    }
  }

  const handleEditRecord = (record: EmployeeAttendanceRecord) => {
    setEditingRecord({ ...record })
    setEditDialogOpen(true)
  }

  const createAttendanceRecord = async () => {
    if (!newRecord.employeeId || !newRecord.date || !newRecord.time) {
      toast.error('Semua field harus diisi')
      return
    }
    
    // Check for duplicate attendance on same day and type
    const duplicateCheck = attendanceRecords.find(record => 
      record.employeeId === newRecord.employeeId &&
      record.date === newRecord.date &&
      record.type === newRecord.type
    )
    
    if (duplicateCheck) {
      const employeeName = employees.find(e => e.id === newRecord.employeeId)?.name || 'karyawan'
      const typeLabel = newRecord.type === 'check-in' ? 'masuk' : 'pulang'
      toast.error(`${employeeName} sudah tercatat absen ${typeLabel} pada tanggal tersebut`)
      return
    }
    
    setCreating(true)
    try {
      const response = await fetch(`${serverUrl}/employee-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: newRecord.employeeId,
          type: newRecord.type,
          date: newRecord.date,
          time: newRecord.time
        })
      })

      if (response.ok) {
        const createdRecord = await response.json()
        
        // Find employee data
        const employee = employees.find(e => e.id === newRecord.employeeId)
        const employeeName = employee?.name || 'Unknown Employee'
        const position = employee?.position || 'Unknown Position'
        
        // Add the new record to local state
        const newAttendanceRecord: EmployeeAttendanceRecord = {
          id: createdRecord.attendance?.id || Date.now().toString(),
          employeeId: newRecord.employeeId,
          employeeName,
          position,
          type: newRecord.type,
          date: newRecord.date,
          time: newRecord.time,
          createdAt: new Date().toISOString()
        }
        
        setAttendanceRecords(prev => [newAttendanceRecord, ...prev])
        
        const typeLabel = newRecord.type === 'check-in' ? 'masuk' : 'pulang'
        toast.success(`✅ Absen ${typeLabel} ${employeeName} berhasil ditambahkan`)
        setManualInputOpen(false)
        
        // Reset form
        setNewRecord({
          employeeId: '',
          type: 'check-in',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menambahkan data absensi karyawan')
      }
    } catch (error) {
      console.log('Error creating employee attendance:', error)
      toast.error('Terjadi kesalahan saat menambahkan data absensi karyawan')
    } finally {
      setCreating(false)
    }
  }

  const filteredRecords = attendanceRecords
    .filter(record => {
      if (filters.employeeId && filters.employeeId !== "all" && record.employeeId !== filters.employeeId) return false
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
      employeeId: 'all',
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
    const uniqueEmployees = new Set(todayRecords.map(record => record.employeeId)).size

    return { checkIns, checkOuts, uniqueEmployees, total: todayRecords.length }
  }

  const stats = getAttendanceStats()

  const typeOptions = [
    { value: 'check-in', label: 'Absen Masuk' },
    { value: 'check-out', label: 'Absen Pulang' }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Absensi Hari Ini</p>
                <p className="text-2xl text-blue-800">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Absen Masuk</p>
                <p className="text-2xl text-emerald-700">{stats.checkIns}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Absen Pulang</p>
                <p className="text-2xl text-red-600">{stats.checkOuts}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Karyawan Aktif</p>
                <p className="text-2xl text-blue-800">{stats.uniqueEmployees}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Data Absensi Karyawan
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setNewRecord({
                    employeeId: '',
                    type: 'check-in',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5)
                  })
                  setManualInputOpen(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || creating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Input Manual
              </Button>
              <Button
                onClick={async () => {
                  await fetchEmployees()
                  await fetchEmployeeAttendanceRecords()
                }}
                disabled={loading}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              <Label htmlFor="dateFilter" className="text-blue-700">Tanggal</Label>
              <Input
                id="dateFilter"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeFilter" className="text-blue-700">Jenis</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="border-blue-200">
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
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
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
                  <TableHead className="text-blue-700">Karyawan</TableHead>
                  <TableHead className="text-blue-700">Posisi</TableHead>
                  <TableHead className="text-blue-700">Tanggal</TableHead>
                  <TableHead className="text-blue-700">Jenis Absensi</TableHead>
                  <TableHead className="text-blue-700">Waktu</TableHead>
                  <TableHead className="text-blue-700">Status</TableHead>
                  <TableHead className="text-blue-700 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">
                          {employees.find(e => e.id === record.employeeId)?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {record.position}
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
                      {(() => {
                        const [hours, minutes] = record.time.split(':').map(Number)
                        const timeInMinutes = hours * 60 + minutes
                        let isOnTime = false

                        if (record.type === 'check-in') {
                          // Standard work hours: before 8:30 AM
                          isOnTime = timeInMinutes <= 8 * 60 + 30
                        } else {
                          // Check-out: after 5:00 PM
                          isOnTime = timeInMinutes >= 17 * 60
                        }

                        return (
                          <span className={`px-2 py-1 rounded text-xs ${
                            isOnTime 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isOnTime ? 'Tepat Waktu' : record.type === 'check-in' ? 'Terlambat' : 'Pulang Cepat'}
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
                              <AlertDialogTitle>Hapus Data Absensi Karyawan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus data absensi {record.employeeName} 
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
              <div className="text-center py-8 text-blue-600">
                {attendanceRecords.length === 0 
                  ? 'Belum ada data absensi karyawan' 
                  : 'Tidak ada data yang sesuai dengan filter'
                }
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-blue-700">
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
            <DialogTitle className="text-blue-800">Input Manual Absensi Karyawan</DialogTitle>
            <DialogDescription>
              Tambahkan data absensi secara manual untuk karyawan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newEmployee" className="text-blue-700">Karyawan *</Label>
              <Select 
                value={newRecord.employeeId} 
                onValueChange={(value) => setNewRecord({ ...newRecord, employeeId: value })}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newType" className="text-blue-700">Jenis Absensi *</Label>
              <Select 
                value={newRecord.type} 
                onValueChange={(value) => setNewRecord({ ...newRecord, type: value as 'check-in' | 'check-out' })}
              >
                <SelectTrigger className="border-blue-200">
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
              <Label htmlFor="newDate" className="text-blue-700">Tanggal *</Label>
              <Input
                id="newDate"
                type="date"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                className="border-blue-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newTime" className="text-blue-700">Waktu *</Label>
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
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-6"
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
                className="border-blue-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setManualInputOpen(false)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Batal
            </Button>
            <Button 
              onClick={createAttendanceRecord} 
              disabled={creating || !newRecord.employeeId || !newRecord.date || !newRecord.time}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingRecord && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Edit Absensi Karyawan</DialogTitle>
              <DialogDescription>
                Perbarui data absensi karyawan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editEmployee" className="text-blue-700">Karyawan *</Label>
                <Select 
                  value={editingRecord.employeeId} 
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, employeeId: value })}
                >
                  <SelectTrigger className="border-blue-200">
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editType" className="text-blue-700">Jenis Absensi *</Label>
                <Select 
                  value={editingRecord.type} 
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, type: value as 'check-in' | 'check-out' })}
                >
                  <SelectTrigger className="border-blue-200">
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
                <Label htmlFor="editDate" className="text-blue-700">Tanggal *</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="border-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTime" className="text-blue-700">Waktu *</Label>
                <Input
                  id="editTime"
                  type="time"
                  value={editingRecord.time}
                  onChange={(e) => setEditingRecord({ ...editingRecord, time: e.target.value })}
                  className="border-blue-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Batal
              </Button>
              <Button 
                onClick={updateAttendanceRecord} 
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Memperbarui...' : 'Perbarui'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}