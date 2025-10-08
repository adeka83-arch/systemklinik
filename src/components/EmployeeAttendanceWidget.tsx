import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Users, Clock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Employee {
  id: string
  name: string
  position: string
  email: string
}

interface EmployeeAttendanceWidgetProps {
  accessToken: string
  onNavigate?: (tab: string) => void
}

export function EmployeeAttendanceWidget({ accessToken, onNavigate }: EmployeeAttendanceWidgetProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [attendanceType, setAttendanceType] = useState<'check-in' | 'check-out'>('check-in')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    presentEmployees: 0,
    presentEmployeeNames: [] as string[]
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      fetchTodayStats()
    }
  }, [employees])

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

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch employee attendance first, then use the data
      const attendanceResponse = await fetch(`${serverUrl}/employee-attendance?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json()
        const attendanceRecords = data.attendance || []
        
        // Calculate stats
        const checkInRecords = attendanceRecords.filter((record: any) => record.type === 'check-in')
        const uniqueEmployeeIds = new Set(checkInRecords.map((record: any) => record.employeeId))
        
        // Get present employee names from current employees state
        const presentEmployeeNames: string[] = []
        uniqueEmployeeIds.forEach(employeeId => {
          const employee = employees.find(emp => emp.id === employeeId)
          if (employee) {
            presentEmployeeNames.push(employee.name)
          }
        })
        
        setStats({
          totalEmployees: employees.length,
          todayAttendance: attendanceRecords.length,
          presentEmployees: uniqueEmployeeIds.size,
          presentEmployeeNames
        })
      }
    } catch (error) {
      console.log('Error fetching today stats:', error)
      // Set default stats on error
      setStats({
        totalEmployees: employees.length,
        todayAttendance: 0,
        presentEmployees: 0,
        presentEmployeeNames: []
      })
    }
  }

  const handleAttendance = async () => {
    if (!selectedEmployee) {
      toast.error('Pilih karyawan terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const currentTime = new Date()
      const today = currentTime.toISOString().split('T')[0]
      const timeString = currentTime.toTimeString().slice(0, 5)

      // Check for duplicate attendance
      const checkResponse = await fetch(`${serverUrl}/employee-attendance?date=${today}&employeeId=${selectedEmployee}&type=${attendanceType}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.attendance && checkData.attendance.length > 0) {
          const employeeName = employees.find(e => e.id === selectedEmployee)?.name || 'Karyawan'
          const typeLabel = attendanceType === 'check-in' ? 'masuk' : 'pulang'
          const statusIcon = attendanceType === 'check-in' ? '🟢' : '🔴'
          toast.warning(`${statusIcon} ${employeeName} sudah tercatat absen ${typeLabel} hari ini`)
          setLoading(false)
          return
        }
      }

      const response = await fetch(`${serverUrl}/employee-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          type: attendanceType,
          date: today,
          time: timeString
        })
      })

      if (response.ok) {
        const selectedEmployeeData = employees.find(e => e.id === selectedEmployee)
        const typeLabel = attendanceType === 'check-in' ? 'masuk' : 'pulang'
        const statusText = attendanceType === 'check-in' ? '🟢 Masuk' : '🔴 Pulang'
        toast.success(`${statusText} ${selectedEmployeeData?.name} berhasil dicatat (${timeString})`)
        
        // Reset the form
        setSelectedEmployee('')
        setAttendanceType('check-in') // Reset to default
        
        // Refresh stats after a short delay to ensure database is updated
        setTimeout(() => {
          fetchTodayStats()
        }, 500)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mencatat absensi karyawan')
      }
    } catch (error) {
      console.log('Error creating employee attendance:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee)

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-blue-800 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Form Absensi Karyawan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label htmlFor="employee" className="text-sm text-blue-700">Pilih Karyawan</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="border-blue-200 h-9">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                      Tidak ada karyawan tersedia
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-blue-700">Status Absensi</Label>
              <div className="flex gap-1">
                <span className={`px-2 py-1 text-xs rounded ${
                  stats.presentEmployees > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {stats.presentEmployees} Hadir
                </span>
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                  {stats.totalEmployees} Total
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-blue-700">Jenis Absensi</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={attendanceType === 'check-in' ? 'default' : 'outline'}
                onClick={() => setAttendanceType('check-in')}
                className={`h-8 ${attendanceType === 'check-in' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
              >
                Absen Masuk
              </Button>
              <Button
                type="button"
                size="sm"
                variant={attendanceType === 'check-out' ? 'default' : 'outline'}
                onClick={() => setAttendanceType('check-out')}
                className={`h-8 ${attendanceType === 'check-out' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
              >
                Absen Pulang
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAttendance}
            disabled={loading || !selectedEmployee}
            className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-sm"
          >
            {loading ? 'Memproses...' : `Catat Absensi ${attendanceType === 'check-in' ? 'Masuk' : 'Pulang'}`}
          </Button>

          {/* Info Compact */}
          <div className="space-y-2">
            {/* Time Info Compact */}
            <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 mb-1 font-medium">⏰ Waktu Saat Ini</p>
              <p className="text-xs font-semibold text-blue-800">{new Date().toLocaleString('id-ID')}</p>
            </div>

            {/* Selected Employee Info Compact */}
            {selectedEmployeeData && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 mb-1 font-medium">👨‍💼 {selectedEmployeeData.name}</p>
                <p className="text-xs text-gray-600">{selectedEmployeeData.position}</p>
              </div>
            )}

            {/* Karyawan Hadir Hari Ini Compact */}
            {stats.presentEmployeeNames.length > 0 ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-600 mb-1 font-medium">✅ Karyawan Hadir ({stats.presentEmployeeNames.length})</p>
                <div className="text-xs text-green-700">
                  {stats.presentEmployeeNames.slice(0, 2).map((name, index) => (
                    <span key={index}>{name}{index < 1 && stats.presentEmployeeNames.length > 1 ? ', ' : ''}</span>
                  ))}
                  {stats.presentEmployeeNames.length > 2 && (
                    <span className="text-green-600"> +{stats.presentEmployeeNames.length - 2}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 font-medium">📅 Belum ada yang absen masuk</p>
              </div>
            )}


          </div>
        </div>
      </CardContent>
    </Card>
  )
}