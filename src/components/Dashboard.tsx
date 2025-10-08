import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Clock, User, Calendar } from 'lucide-react'
import { supabase, serverUrl } from '../utils/supabase/client'
import { apiGet, apiPost } from '../utils/api'
import { toast } from 'sonner@2.0.3'
import { processValidDoctors } from '../utils/doctorNameCleaner'
import { FieldTripOutstanding } from './FieldTripOutstanding'
import { TreatmentOutstanding } from './TreatmentOutstanding'
import { ControlScheduleNotification } from './ControlScheduleNotificationWithWhatsApp'
import { SecuritySettingsCard } from './SecuritySettingsCard'
import { SystemDevelopmentSuggestions } from './SystemDevelopmentSuggestions'
import { ClockWidget, WeatherWidget, QuickStatsWidget, SystemStatusWidget, ActiveShiftWidget } from './DashboardWidgets'
import { AnimatedBackground } from './AnimatedBackground'
import { GlowCard, FloatingElement, PulsingBadge } from './EnhancedInteractions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { EmployeeAttendanceWidget } from './EmployeeAttendanceWidget'


interface Doctor {
  id: string
  name: string
  specialization: string
  shifts: string[]
}

interface DashboardProps {
  accessToken: string
  onNavigate?: (tab: string) => void
  clinicSettings?: {
    name?: string
    address?: string
    city?: string
    province?: string
    country?: string
  }
}

export function Dashboard({ accessToken, onNavigate, clinicSettings }: DashboardProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedShift, setSelectedShift] = useState('')
  const [attendanceType, setAttendanceType] = useState<'check-in' | 'check-out'>('check-in')
  const [loading, setLoading] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<{
    hasCheckedIn: boolean
    hasCheckedOut: boolean
    checkInTime?: string
    checkOutTime?: string
  } | null>(null)
  const [stats, setStats] = useState({
    totalDoctors: 0,
    todayAttendance: 0,
    activeShifts: 0,
    totalPatientsThisMonth: 0,
    newPatientsThisMonth: 0,
    presentDoctorNames: [],
    presentEmployeeNames: [],
    patients: []
  })
  


  useEffect(() => {
    fetchDoctors()
    fetchTodayStats()
  }, [])

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors...')
      const data = await apiGet('/doctors', accessToken)
      console.log('Doctors response:', data)
      
      // Clean and filter valid doctors using utility function
      const validDoctors = processValidDoctors(data.doctors || [])
      
      console.log('Processed valid doctors:', validDoctors.length, 'out of', (data.doctors || []).length)
      
      // If no doctors found, try to initialize sample data
      if (validDoctors.length === 0) {
        console.log('🎲 No doctors found, initializing sample data...')
        await initializeSampleData()
        
        // Retry fetching doctors after sample data creation
        const retryData = await apiGet('/doctors', accessToken)
        const retryValidDoctors = processValidDoctors(retryData.doctors || [])
        setDoctors(retryValidDoctors)
        
        if (retryValidDoctors.length > 0) {
          toast.success('Data sample telah dibuat untuk memudahkan penggunaan')
        }
      } else {
        setDoctors(validDoctors)
      }
    } catch (error) {
      console.log('Failed to fetch doctors:', error)
      toast.error('Gagal memuat data dokter')
      setDoctors([]) // Set empty array as fallback
    }
  }
  
  const initializeSampleData = async () => {
    try {
      console.log('🎲 Initializing sample data...')
      const response = await apiPost('/init-sample-data', accessToken, {})
      console.log('Sample data initialization result:', response)
    } catch (error) {
      console.log('Failed to initialize sample data:', error)
    }
  }

  const fetchTodayStats = async () => {
    try {
      console.log('Fetching dashboard stats...')
      
      // Fetch with individual error handling using API utility
      const fetchWithFallback = async (endpoint: string, fallback: any) => {
        try {
          console.log(`Fetching: ${endpoint}`)
          const data = await apiGet(endpoint, accessToken)
          console.log(`Success fetching ${endpoint}:`, Object.keys(data))
          return data
        } catch (error) {
          console.log(`Error fetching ${endpoint}:`, error)
          return fallback
        }
      }

      const [doctorsData, attendanceData, patientsData, employeesData, employeeAttendanceData] = await Promise.all([
        fetchWithFallback('/doctors', { doctors: [] }),
        fetchWithFallback('/attendance', { attendance: [] }),
        fetchWithFallback('/patients', { patients: [] }),
        fetchWithFallback('/employees', { employees: [] }),
        fetchWithFallback('/employee-attendance', { attendance: [] })
      ])

      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const todayStr = today.toDateString()
      
      // Calculate TOTAL patients (all patients in database)
      const totalPatients = patientsData.patients?.length || 0

      // Calculate new patients this month (based on registrationDate or created_at)
      const newPatientsThisMonth = patientsData.patients?.filter((patient: any) => {
        const regDate = new Date(patient.registrationDate || patient.created_at || patient.date)
        return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear
      }).length || 0

      // Get today's attendance (both check-in and check-out)
      const todayAttendance = attendanceData.attendance?.filter((att: any) => 
        new Date(att.date).toDateString() === todayStr
      ) || []

      // Calculate present doctors (checked in but not yet checked out)
      const presentDoctorIds = []
      const doctorAttendanceMap = new Map()

      // Group attendance by doctor and shift
      todayAttendance.forEach((att: any) => {
        const key = `${att.doctorId}-${att.shift}`
        if (!doctorAttendanceMap.has(key)) {
          doctorAttendanceMap.set(key, [])
        }
        doctorAttendanceMap.get(key).push(att)
      })

      // For each doctor-shift combination, check if they're currently present
      doctorAttendanceMap.forEach((attendances, key) => {
        const doctorId = key.split('-')[0]
        
        // Sort by time to get the latest status
        const sortedAttendances = attendances.sort((a: any, b: any) => 
          new Date(a.time || a.date).getTime() - new Date(b.time || b.date).getTime()
        )
        
        const latestAttendance = sortedAttendances[sortedAttendances.length - 1]
        
        // If latest attendance is check-in, doctor is present
        if (latestAttendance.type === 'check-in') {
          if (!presentDoctorIds.includes(doctorId)) {
            presentDoctorIds.push(doctorId)
          }
        }
      })
      
      // Process and count only valid doctors (same as DoctorStatusManager)
      const validDoctors = processValidDoctors(doctorsData.doctors || [])
      
      // Get names of present doctors
      const presentDoctorNames = validDoctors
        .filter(doctor => presentDoctorIds.includes(doctor.id))
        .map(doctor => doctor.name)
      
      // Calculate present employees (checked in but not yet checked out for today)
      const todayEmployeeAttendance = employeeAttendanceData.attendance?.filter((att: any) => 
        new Date(att.date).toDateString() === todayStr
      ) || []

      const presentEmployeeIds = []
      const employeeAttendanceMap = new Map()

      // Group employee attendance by employee
      todayEmployeeAttendance.forEach((att: any) => {
        if (!employeeAttendanceMap.has(att.employeeId)) {
          employeeAttendanceMap.set(att.employeeId, [])
        }
        employeeAttendanceMap.get(att.employeeId).push(att)
      })

      // For each employee, check if they're currently present
      employeeAttendanceMap.forEach((attendances, employeeId) => {
        // Sort by time to get the latest status
        const sortedAttendances = attendances.sort((a: any, b: any) => 
          new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
        )
        
        const latestAttendance = sortedAttendances[sortedAttendances.length - 1]
        
        // If latest attendance is check-in, employee is present
        if (latestAttendance.type === 'check-in') {
          if (!presentEmployeeIds.includes(employeeId)) {
            presentEmployeeIds.push(employeeId)
          }
        }
      })

      // Get names of present employees
      const presentEmployeeNames = employeesData.employees
        ?.filter((employee: any) => presentEmployeeIds.includes(employee.id))
        ?.map((employee: any) => employee.name) || []
      
      setStats({
        totalDoctors: validDoctors.length,
        todayAttendance: todayAttendance.length,
        activeShifts: getActiveShifts(),
        totalPatientsThisMonth: totalPatients,
        newPatientsThisMonth: newPatientsThisMonth,
        presentDoctorNames: presentDoctorNames,
        presentEmployeeNames: presentEmployeeNames,
        patients: patientsData.patients || []
      })
      
      console.log('Dashboard stats updated successfully')
    } catch (error) {
      console.log('Error fetching stats:', error)
      toast.error('Gagal memuat statistik dashboard')
      
      // Set fallback stats with sample birthday data
      const samplePatients = [
        {
          name: 'John Doe',
          birthDate: new Date().toISOString(), // Today's birthday for demo
        },
        {
          name: 'Jane Smith', 
          birthDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Birthday in 2 days
        }
      ]
      
      setStats({
        totalDoctors: 0,
        todayAttendance: 0,
        activeShifts: getActiveShifts(),
        totalPatientsThisMonth: 0, // No fallback - show actual data only
        newPatientsThisMonth: 0,   // No fallback - show actual data only
        presentDoctorNames: [],    // No doctors present in fallback
        presentEmployeeNames: [],  // No employees present in fallback
        patients: samplePatients   // Sample birthday data for demo
      })
    }
  }

  const getActiveShifts = () => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay() // 0 = Sunday, 6 = Saturday
    
    // Weekend (Saturday = 6, Sunday = 0) only morning shift
    if (day === 0 || day === 6) {
      return hour >= 9 && hour < 15 ? 1 : 0
    }
    
    // Weekdays: morning (9-15) and evening (18-20)
    if ((hour >= 9 && hour < 15) || (hour >= 18 && hour < 20)) {
      return 1
    }
    
    return 0
  }

  const getAvailableShifts = () => {
    const now = new Date()
    const day = now.getDay()
    
    // Weekend shifts
    if (day === 0 || day === 6) {
      return [{ value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' }]
    }
    
    // Weekday shifts
    return [
      { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
      { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
    ]
  }

  const handleAttendance = async () => {
    if (!selectedDoctor || !selectedShift) {
      toast.error('Pilih dokter dan shift terlebih dahulu')
      return
    }

    setLoading(true)

    try {
      // Get doctor name for better feedback
      const selectedDoctorData = doctors.find(d => d.id === selectedDoctor)
      const doctorName = selectedDoctorData?.name || 'Unknown Doctor'

      // Create attendance payload
      const attendance = {
        doctorId: selectedDoctor,
        doctorName: doctorName,
        shift: selectedShift,
        type: attendanceType,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('id-ID', { 
          hour12: false,
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }

      console.log('🕒 Sending attendance data:', attendance)

      const response = await fetch(`${serverUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(attendance)
      })

      const data = await response.json()

      if (response.ok) {
        // Success - use message from server or default
        toast.success(data.message || `✅ Absensi ${attendanceType === 'check-in' ? 'masuk' : 'pulang'} berhasil dicatat`)
        
        // If it's check-in, auto-create sitting fee based on default settings
        if (attendanceType === 'check-in') {
          await autoCreateSittingFee(selectedDoctor, doctorName, selectedShift)
        }
        
        // Refresh attendance status and stats
        fetchTodayStats()
        await checkAttendanceStatus()
        
        // Don't reset doctor and shift - keep them selected for potential next action
      } else {
        // Error handling with detailed feedback
        console.log('❌ Attendance error response:', data)
        
        if (response.status === 409 && data.duplicate) {
          // Duplicate attendance error - show detailed info
          const existingRecord = data.existingRecord
          if (existingRecord) {
            toast.error(
              `❌ ${doctorName} sudah melakukan absensi ${attendanceType === 'check-in' ? 'masuk' : 'pulang'} pada tanggal ${existingRecord.date}, shift ${existingRecord.shift} jam ${existingRecord.time}. Tidak dapat melakukan absensi ${attendanceType === 'check-in' ? 'masuk' : 'pulang'} lagi!`,
              { duration: 6000 }
            )
          } else {
            toast.error(data.error || 'Absensi sudah tercatat sebelumnya')
          }
        } else {
          // General error
          toast.error(data.error || 'Gagal mencatat absensi')
        }
      }
    } catch (error) {
      console.log('💥 Error creating attendance:', error)
      toast.error('Terjadi kesalahan sistem saat mencatat absensi')
    } finally {
      setLoading(false)
    }
  }

  const autoCreateSittingFee = async (doctorId: string, doctorName: string, shift: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if sitting fee already exists for today
      const existingFeesResponse = await fetch(`${serverUrl}/sitting-fees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (existingFeesResponse.ok) {
        const data = await existingFeesResponse.json()
        const existingFee = data.sittingFees?.find((fee: any) => 
          fee.doctorId === doctorId && 
          fee.shift === shift && 
          fee.date === today
        )
        
        if (existingFee) {
          toast.info(`✅ Uang duduk sudah tersimpan: Rp ${existingFee.amount.toLocaleString('id-ID')}`)
          return
        }
      }

      // Get default sitting fee setting for this doctor and shift
      const defaultSettingResponse = await fetch(`${serverUrl}/doctor-sitting-fee/${doctorId}/${encodeURIComponent(shift)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (defaultSettingResponse.ok) {
        const settingData = await defaultSettingResponse.json()
        
        if (settingData.setting && settingData.setting.amount) {
          // Create sitting fee automatically based on default setting
          const sittingFeePayload = {
            doctorId: doctorId,
            doctorName: doctorName,
            shift: shift,
            amount: settingData.setting.amount,
            date: today
          }

          const createResponse = await fetch(`${serverUrl}/sitting-fees`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(sittingFeePayload)
          })

          if (createResponse.ok) {
            toast.success(`✅ Uang duduk otomatis tersimpan: Rp ${settingData.setting.amount.toLocaleString('id-ID')}`)
          } else {
            toast.warning('⚠️ Gagal menyimpan uang duduk otomatis - perlu input manual')
          }
        } else {
          toast.warning('⚠️ Belum ada pengaturan default uang duduk untuk dokter ini - perlu input manual')
        }
      } else {
        toast.warning('⚠️ Tidak dapat mengambil pengaturan default uang duduk - perlu input manual')
      }
    } catch (error) {
      console.log('Error auto-creating sitting fee:', error)
      toast.warning('⚠️ Gagal membuat uang duduk otomatis - perlu input manual')
    }
  }



  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor)

  // Check attendance status when doctor and shift are selected
  useEffect(() => {
    if (selectedDoctor && selectedShift) {
      checkAttendanceStatus()
    } else {
      setAttendanceStatus(null)
    }
  }, [selectedDoctor, selectedShift, accessToken])

  const checkAttendanceStatus = async () => {
    if (!selectedDoctor || !selectedShift || !accessToken) return

    try {
      const response = await fetch(`${serverUrl}/attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const today = new Date().toISOString().split('T')[0]
        
        // Filter today's attendance for selected doctor and shift
        const todayAttendance = data.attendance?.filter((att: any) => 
          att.date === today && 
          att.doctorId === selectedDoctor && 
          att.shift === selectedShift
        ) || []

        let hasCheckedIn = false
        let hasCheckedOut = false
        let checkInTime = ''
        let checkOutTime = ''

        todayAttendance.forEach((att: any) => {
          if (att.type === 'check-in') {
            hasCheckedIn = true
            checkInTime = att.time || '00:00'
          } else if (att.type === 'check-out') {
            hasCheckedOut = true
            checkOutTime = att.time || '00:00'
          }
        })

        setAttendanceStatus({
          hasCheckedIn,
          hasCheckedOut,
          checkInTime: hasCheckedIn ? checkInTime : undefined,
          checkOutTime: hasCheckedOut ? checkOutTime : undefined
        })

        // Auto-suggest attendance type based on current status
        if (hasCheckedIn && !hasCheckedOut) {
          // If already checked in but not checked out, suggest check-out
          setAttendanceType('check-out')
        } else if (!hasCheckedIn) {
          // If haven't checked in, suggest check-in
          setAttendanceType('check-in')
        }
      }
    } catch (error) {
      console.log('Error checking attendance status:', error)
      setAttendanceStatus(null)
    }
  }

  return (
    <div className="relative">
      {/* Animated Background */}
      <AnimatedBackground 
        particleCount={30}
        colors={['#fce7f3', '#f3e8ff', '#e0f2fe', '#f0fdf4']}
        speed={0.3}
        className="opacity-30"
      />
      
      <Tabs defaultValue="overview" className="space-y-4 relative z-10">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Dashboard Utama
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saran Pengembangan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
        {/* Enhanced Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clock Widget */}
          <FloatingElement>
            <ClockWidget />
          </FloatingElement>

          {/* Weather Widget */}
          <FloatingElement>
            <WeatherWidget 
              clinicLocation={
                clinicSettings?.address || 
                `${clinicSettings?.city || 'Depok City'}, ${clinicSettings?.province || 'West Java'}, ${clinicSettings?.country || 'Indonesia'}`
              } 
            />
          </FloatingElement>

          {/* System Status Widget */}
          <FloatingElement>
            <SystemStatusWidget />
          </FloatingElement>

          {/* Shift Status Widget */}
          <FloatingElement>
            <ActiveShiftWidget activeShifts={stats.activeShifts} />
          </FloatingElement>
        </div>

        {/* Quick Stats Overview */}
        <QuickStatsWidget stats={{
          totalPatientsThisMonth: stats.totalPatientsThisMonth || 0,
          newPatientsThisMonth: stats.newPatientsThisMonth || 0,
          presentDoctors: stats.presentDoctorNames.length,
          presentDoctorNames: stats.presentDoctorNames,
          presentEmployees: stats.presentEmployeeNames.length,
          presentEmployeeNames: stats.presentEmployeeNames,
          patients: stats.patients || []
        }} />

        {/* Form Absensi - Layout Bersebelahan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form Absensi Dokter */}
          <Card className="border-pink-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-pink-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Form Absensi Dokter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="doctor" className="text-sm text-pink-700">Pilih Dokter</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger className="border-pink-200 h-9">
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                            Tidak ada dokter tersedia
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="shift" className="text-sm text-pink-700">Pilih Shift</Label>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                      <SelectTrigger className="border-pink-200 h-9">
                        <SelectValue placeholder="Pilih shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableShifts().map((shift) => (
                          <SelectItem key={shift.value} value={shift.value}>
                            {shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-pink-700">Jenis Absensi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={attendanceType === 'check-in' ? 'default' : 'outline'}
                      onClick={() => setAttendanceType('check-in')}
                      className={`h-8 transition-all duration-200 ${attendanceType === 'check-in' ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' : 'border-pink-200 text-pink-600 hover:bg-pink-50'}`}
                    >
                      📝 Absen Masuk
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={attendanceType === 'check-out' ? 'default' : 'outline'}
                      onClick={() => setAttendanceType('check-out')}
                      className={`h-8 transition-all duration-200 ${attendanceType === 'check-out' ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' : 'border-pink-200 text-pink-600 hover:bg-pink-50'}`}
                    >
                      🚪 Absen Pulang
                    </Button>
                  </div>
                  
                  {/* Visual indicator for selected type */}
                  <div className={`p-2 rounded-lg border text-center transition-all duration-200 ${
                    attendanceType === 'check-in' 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <p className="text-xs font-medium">
                      {attendanceType === 'check-in' ? (
                        <span className="flex items-center justify-center gap-1">
                          ✅ Mode: Absen Masuk dipilih
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          🚪 Mode: Absen Pulang dipilih
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleAttendance}
                    disabled={loading || !selectedDoctor || !selectedShift || 
                      (attendanceStatus?.hasCheckedIn && attendanceStatus?.hasCheckedOut) ||
                      (attendanceType === 'check-in' && attendanceStatus?.hasCheckedIn) ||
                      (attendanceType === 'check-out' && attendanceStatus?.hasCheckedOut)}
                    className={`w-full h-9 text-sm transition-all duration-200 ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : (attendanceStatus?.hasCheckedIn && attendanceStatus?.hasCheckedOut)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : (attendanceType === 'check-in' && attendanceStatus?.hasCheckedIn)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : (attendanceType === 'check-out' && attendanceStatus?.hasCheckedOut)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : attendanceType === 'check-in'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Memproses...
                      </span>
                    ) : (attendanceStatus?.hasCheckedIn && attendanceStatus?.hasCheckedOut) ? (
                      '✅ Sudah Absen Lengkap'
                    ) : (attendanceType === 'check-in' && attendanceStatus?.hasCheckedIn) ? (
                      '✅ Sudah Absen Masuk'
                    ) : (attendanceType === 'check-out' && attendanceStatus?.hasCheckedOut) ? (
                      '✅ Sudah Absen Pulang'
                    ) : (
                      `${attendanceType === 'check-in' ? '📝 Catat Absen Masuk' : '🚪 Catat Absen Pulang'}`
                    )}
                  </Button>

                  {/* Reset button when attendance is complete or need to change selection */}
                  {(selectedDoctor || selectedShift) && (
                    <Button
                      onClick={() => {
                        setSelectedDoctor('')
                        setSelectedShift('')
                        setAttendanceType('check-in')
                        setAttendanceStatus(null)
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      🔄 Pilih Dokter/Shift Lain
                    </Button>
                  )}
                </div>

                {/* Info Compact */}
                <div className="space-y-2">
                  {/* Time Info Compact */}
                  <div className="p-2 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                    <p className="text-xs text-pink-600 mb-1 font-medium">⏰ Waktu Saat Ini</p>
                    <p className="text-xs font-semibold text-pink-800">{new Date().toLocaleString('id-ID')}</p>
                  </div>

                  {/* Selected Doctor Info Compact */}
                  {selectedDoctorData && (
                    <div className="p-2 bg-pink-50 border border-pink-200 rounded-lg">
                      <p className="text-xs text-pink-600 mb-1 font-medium">👨‍⚕️ {selectedDoctorData.name}</p>
                      <p className="text-xs text-gray-600">{selectedDoctorData.specialization}</p>
                    </div>
                  )}

                  {/* Auto Sitting Fee Info Compact */}
                  {attendanceType === 'check-in' && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium">ℹ Otomatisasi Uang Duduk</p>
                      <p className="text-xs text-blue-700">Uang duduk otomatis tersimpan saat absen masuk</p>
                    </div>
                  )}

                  {/* Attendance Status Display */}
                  {selectedDoctor && selectedShift && attendanceStatus && (
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-800 font-medium mb-1">📊 Status Absensi Hari Ini</p>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1 text-xs ${
                          attendanceStatus.hasCheckedIn ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {attendanceStatus.hasCheckedIn ? '✅' : '⏳'} 
                          Absen Masuk: {attendanceStatus.hasCheckedIn ? `${attendanceStatus.checkInTime}` : 'Belum absen'}
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${
                          attendanceStatus.hasCheckedOut ? 'text-red-700' : 'text-gray-500'
                        }`}>
                          {attendanceStatus.hasCheckedOut ? '✅' : '⏳'} 
                          Absen Pulang: {attendanceStatus.hasCheckedOut ? `${attendanceStatus.checkOutTime}` : 'Belum absen'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-medium">🔒 Perlindungan Duplikasi</p>
                    <p className="text-xs text-yellow-700">
                      Sistem akan mencegah absensi ganda untuk dokter yang sama pada hari dan shift yang sama
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Absensi Karyawan */}
          <EmployeeAttendanceWidget 
            accessToken={accessToken} 
            onNavigate={onNavigate}
          />
        </div>

        {/* Control Schedule - Compact */}
        <ControlScheduleNotification 
          accessToken={accessToken} 
          onScheduleUpdate={fetchTodayStats}
        />

        {/* Outstanding Payments Row - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldTripOutstanding 
            accessToken={accessToken} 
            onPaymentUpdate={fetchTodayStats}
          />
          
          <TreatmentOutstanding 
            accessToken={accessToken} 
            onPaymentUpdate={fetchTodayStats}
          />
        </div>
      </TabsContent>

      <TabsContent value="development">
        <SystemDevelopmentSuggestions />
      </TabsContent>
    </Tabs>
    </div>
  )
}