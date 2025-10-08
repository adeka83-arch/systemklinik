import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Clock, MapPin, Thermometer, Droplets, Wind, Eye, Sun, Moon, Cloud, CloudRain, Zap, Calendar } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  visibility: number
  icon: string
}

// Simulasi data cuaca berdasarkan lokasi klinik
const getSimulatedWeatherForLocation = (location?: string): WeatherData => {
  // Set lokasi default untuk Falasifah Dental Clinic di Depok
  const clinicLocation = location || 'Depok City, West Java, Indonesia'
  
  // Kondisi cuaca yang sesuai untuk wilayah Depok, West Java
  const conditions = [
    { desc: 'Cerah', icon: 'sun', temp: 31 },
    { desc: 'Berawan', icon: 'cloud', temp: 27 },
    { desc: 'Hujan Ringan', icon: 'rain', temp: 24 },
    { desc: 'Berawan Sebagian', icon: 'partly-cloudy', temp: 29 }
  ]
  
  const current = conditions[Math.floor(Math.random() * conditions.length)]
  
  return {
    location: clinicLocation,
    temperature: current.temp + Math.floor(Math.random() * 4) - 2,
    description: current.desc,
    humidity: 70 + Math.floor(Math.random() * 15), // Humidity sedikit lebih tinggi untuk Depok
    windSpeed: 5 + Math.floor(Math.random() * 8), // Angin lebih pelan di wilayah Depok
    visibility: 9 + Math.floor(Math.random() * 3), // Visibility baik
    icon: current.icon
  }
}

const WeatherIcon = ({ type, className = "" }: { type: string, className?: string }) => {
  switch (type) {
    case 'sun': return <Sun className={`text-yellow-500 ${className}`} />
    case 'cloud': return <Cloud className={`text-gray-500 ${className}`} />
    case 'rain': return <CloudRain className={`text-blue-500 ${className}`} />
    case 'partly-cloudy': return <Cloud className={`text-gray-400 ${className}`} />
    default: return <Sun className={`text-yellow-500 ${className}`} />
  }
}

export function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getGreeting = (hour: number) => {
    if (hour < 6) return 'Dini Hari'
    if (hour < 10) return 'Pagi'
    if (hour < 15) return 'Siang'
    if (hour < 18) return 'Sore'
    return 'Malam'
  }

  const getTimeZone = () => {
    return 'Falasifah Dental Clinic'
  }

  const hour = time.getHours()
  const isNight = hour < 6 || hour > 18

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 min-h-[132px]">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="h-4 w-4 text-pink-500" />
                </motion.div>
                <p className="text-xs text-pink-600">Waktu Saat Ini</p>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <motion.div
                    key={formatTime(time)}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold text-pink-800"
                  >
                    {formatTime(time)}
                  </motion.div>
                  <div className="text-xs text-pink-600">
                    {getGreeting(hour)}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isNight ? 360 : 0 }}
                  transition={{ duration: 2, ease: "linear" }}
                >
                  {isNight ? <Moon className="h-6 w-6 text-purple-500" /> : <Sun className="h-6 w-6 text-yellow-500" />}
                </motion.div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{getTimeZone()}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-pink-500" />
                  <span className="truncate">{formatDate(time).split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-pink-500" />
                  <span>WIB</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function WeatherWidget({ clinicLocation }: { clinicLocation?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulasi loading dengan lokasi klinik
    const timer = setTimeout(() => {
      setWeather(getSimulatedWeatherForLocation(clinicLocation))
      setLoading(false)
    }, 1000)

    // Update setiap 10 menit dengan lokasi klinik
    const updateTimer = setInterval(() => {
      setWeather(getSimulatedWeatherForLocation(clinicLocation))
    }, 600000)

    return () => {
      clearTimeout(timer)
      clearInterval(updateTimer)
    }
  }, [clinicLocation])

  if (loading) {
    return (
      <Card className="border-pink-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Thermometer className="h-4 w-4 text-pink-500" />
                </motion.div>
                <p className="text-xs text-pink-600">Memuat Cuaca...</p>
              </div>
              <div className="h-4 bg-pink-100 rounded animate-pulse mb-2"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-3 bg-pink-100 rounded animate-pulse"></div>
                <div className="h-3 bg-pink-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-pink-200 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-[132px]">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-2">
                <WeatherIcon type={weather.icon} className="h-4 w-4" />
                <p className="text-xs text-pink-600">Cuaca Hari Ini</p>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <div className="text-lg font-bold text-blue-800">
                    {weather.temperature}°C
                  </div>
                  <div className="text-xs text-blue-600">
                    {weather.description}
                  </div>
                </div>
                <WeatherIcon type={weather.icon} className="h-6 w-6" />
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{weather.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  <span>{weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3 text-gray-500" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Birthday reminder component
function BirthdayReminder({ patients }: { patients: any[] }) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // Filter patients with birthdays today or upcoming week
  const todayBirthdays = patients.filter(patient => {
    if (!patient.birthDate && !patient.birth_date) return false
    const birthDate = new Date(patient.birthDate || patient.birth_date)
    const birthStr = `${today.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
    return birthStr === todayStr
  })

  const upcomingBirthdays = patients.filter(patient => {
    if (!patient.birthDate && !patient.birth_date) return false
    const birthDate = new Date(patient.birthDate || patient.birth_date)
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    const diffTime = thisYearBirthday.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 7
  })

  return (
    <div className="w-full h-full flex flex-col justify-center">
      {todayBirthdays.length > 0 ? (
        <div className="text-center">
          <div className="text-sm font-bold text-pink-600 mb-1 animate-pulse">
            🎉 {todayBirthdays.length} Hari Ini!
          </div>
          <div className="text-xs text-gray-600 mb-1">
            {(todayBirthdays[0]?.name || todayBirthdays[0]?.nama || 'Pasien')}
            {todayBirthdays.length > 1 && ` +${todayBirthdays.length - 1} lainnya`}
          </div>
          <div className="text-lg">🎂</div>
        </div>
      ) : upcomingBirthdays.length > 0 ? (
        <div className="text-center">
          <div className="text-sm font-bold text-blue-600 mb-1">
            📅 {upcomingBirthdays.length} Minggu Ini
          </div>
          <div className="text-xs text-gray-600 mb-1">
            {(upcomingBirthdays[0]?.name || upcomingBirthdays[0]?.nama || 'Pasien')}
            {upcomingBirthdays.length > 1 && ` +${upcomingBirthdays.length - 1} lainnya`}
          </div>
          <div className="text-xs text-gray-500">
            Dalam 7 hari
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">
            Tidak ada ulang tahun
          </div>
          <div className="text-xs text-gray-400 mb-1">
            minggu ini
          </div>
          <div className="text-lg opacity-50">📝</div>
        </div>
      )}
    </div>
  )
}

export function QuickStatsWidget({ stats }: { stats: any }) {
  const quickStats = [
    {
      label: 'Total Pasien',
      value: stats?.totalPatientsThisMonth || '0',
      icon: <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>👥</motion.div>,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Pasien Baru',
      value: stats?.newPatientsThisMonth || '0',
      icon: <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>✨</motion.div>,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Dokter Hadir',
      value: stats?.presentDoctors || '0',
      doctorNames: stats?.presentDoctorNames || [],
      icon: <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>👨‍⚕️</motion.div>,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isDoctorStat: true
    },
    {
      label: 'Karyawan Hadir',
      value: stats?.presentEmployees || '0',
      employeeNames: stats?.presentEmployeeNames || [],
      icon: <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>👨‍💼</motion.div>,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isEmployeeStat: true
    },
    {
      label: 'Ulang Tahun Pasien',
      value: '',
      icon: <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>🎂</motion.div>,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      isBirthdayReminder: true
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {quickStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className={`border-pink-200 ${stat.bgColor} hover:shadow-md transition-shadow h-[100px]`}>
            <CardContent className="p-3 flex items-center justify-center h-full">
              {stat.isBirthdayReminder ? (
                <BirthdayReminder patients={stats?.patients || []} />
              ) : stat.isDoctorStat ? (
                <div className="w-full h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-xl">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {stat.label}
                  </div>
                  {stat.doctorNames && stat.doctorNames.length > 0 && (
                    <div className="space-y-0.5 max-h-8 overflow-y-auto custom-scrollbar">
                      {stat.doctorNames.slice(0, 3).map((name, idx) => (
                        <div key={idx} className="text-xs text-purple-500 truncate">
                          {name}
                        </div>
                      ))}
                      {stat.doctorNames.length > 3 && (
                        <div className="text-xs text-purple-400 font-medium">
                          +{stat.doctorNames.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : stat.isEmployeeStat ? (
                <div className="w-full h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-xl">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {stat.label}
                  </div>
                  {stat.employeeNames && stat.employeeNames.length > 0 && (
                    <div className="space-y-0.5 max-h-8 overflow-y-auto custom-scrollbar">
                      {stat.employeeNames.slice(0, 3).map((name, idx) => (
                        <div key={idx} className="text-xs text-indigo-500 truncate">
                          {name}
                        </div>
                      ))}
                      {stat.employeeNames.length > 3 && (
                        <div className="text-xs text-indigo-400 font-medium">
                          +{stat.employeeNames.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                  <div className="text-xl">
                    {stat.icon}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export function SystemStatusWidget() {
  const [status, setStatus] = useState({
    server: 'healthy',
    database: 'healthy',
    lastBackup: '2 jam lalu'
  })

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-pink-200 bg-gradient-to-br from-green-50 to-emerald-50 min-h-[132px]">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-4 w-4 text-pink-500" />
                </motion.div>
                <p className="text-xs text-pink-600">Status Sistem</p>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <div className="text-lg font-bold text-green-800">
                    Online
                  </div>
                  <div className="text-xs text-green-600">
                    Sistem Berjalan Normal
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-6 w-6 text-green-500" />
                </motion.div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">Falasifah Dental Clinic</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="truncate">Database</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Server</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ActiveShiftWidget({ activeShifts }: { activeShifts: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-pink-200 bg-gradient-to-br from-orange-50 to-amber-50 min-h-[132px]">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="h-4 w-4 text-pink-500" />
                </motion.div>
                <p className="text-xs text-pink-600">Shift Aktif</p>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <div className="text-lg font-bold text-orange-800">
                    {activeShifts}
                  </div>
                  <div className="text-xs text-orange-600">
                    {activeShifts > 0 ? 'Shift Berjalan' : 'Tidak Ada Shift'}
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    scale: activeShifts > 0 ? [1, 1.2, 1] : 1,
                    rotate: activeShifts > 0 ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="h-6 w-6 text-orange-500" />
                </motion.div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">Hari Ini</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${activeShifts > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="truncate">Status</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span>{activeShifts > 0 ? 'Aktif' : 'Standby'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}