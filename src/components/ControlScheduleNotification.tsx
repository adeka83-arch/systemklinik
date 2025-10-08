import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Calendar, Clock, Phone, MapPin, User, CheckCircle, RefreshCw, MessageCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string
  gender: string
  bloodType?: string
  allergies?: string
  emergencyContact?: string
  emergencyPhone?: string
  registrationDate: string
  medicalRecordNumber?: string
}

interface ControlSchedule {
  id: string
  patientId: string
  patientName: string
  controlDate: string
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

interface ControlScheduleNotificationProps {
  accessToken: string
  onScheduleUpdate?: () => void
}

export function ControlScheduleNotification({ accessToken, onScheduleUpdate }: ControlScheduleNotificationProps) {
  const [schedules, setSchedules] = useState<ControlSchedule[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ControlSchedule | null>(null)

  useEffect(() => {
    fetchSchedules()
    fetchPatients()
    
    // Set up auto-refresh every 30 seconds to catch new schedules
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing control schedules...')
      fetchSchedules()
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [accessToken])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      console.log('Fetching control schedules...')
      
      const fetchWithFallback = async (url: string, fallback: any) => {
        try {
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          
          if (!response.ok) {
            console.log(`Failed to fetch ${url}: ${response.status}`)
            return fallback
          }
          
          return await response.json()
        } catch (error) {
          console.log(`Error fetching ${url}:`, error)
          return fallback
        }
      }

      const [schedulesData, treatmentsData] = await Promise.all([
        fetchWithFallback(`${serverUrl}/control-schedules`, { schedules: [] }),
        fetchWithFallback(`${serverUrl}/treatments`, { treatments: [] })
      ])
      
      if (schedulesData.success || schedulesData.schedules) {
        console.log('Raw schedules data:', schedulesData.schedules?.length || 0, 'schedules')
        
        // Filter only scheduled appointments
        let scheduledAppointments = (schedulesData.schedules || []).filter(
          (schedule: ControlSchedule) => schedule.status === 'scheduled'
        )
        
        console.log('Filtered scheduled appointments:', scheduledAppointments.length, 'appointments')

        // TEMPORARY: Disable treatment filtering to show all scheduled appointments
        // This will help diagnose why new control schedules are not showing
        console.log('Treatments data available:', treatmentsData.treatments ? treatmentsData.treatments.length : 0, 'treatments')
        console.log('Skipping treatment filtering - showing all scheduled appointments')
        
        // Sort by control date ascending (nearest first)
        scheduledAppointments.sort((a: ControlSchedule, b: ControlSchedule) => 
          new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()
        )
        
        console.log('Final scheduled appointments to display:', scheduledAppointments.map(s => ({
          name: s.patientName,
          date: s.controlDate,
          status: s.status,
          id: s.id
        })))
        
        setSchedules(scheduledAppointments)
      } else {
        setSchedules([])
      }
    } catch (error) {
      console.log('Error fetching control schedules:', error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients from:', `${serverUrl}/patients`)
      const response = await fetch(`${serverUrl}/patients`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Patients response:', data)
      
      if (data.success) {
        setPatients(data.patients || [])
      } else {
        console.log('Patients fetch unsuccessful:', data)
        setPatients([])
      }
    } catch (error) {
      console.log('Failed to fetch patients:', error)
      setPatients([]) // Set empty array as fallback
      // Don't show toast error here as it's not critical for dashboard loading
    }
  }

  const markAsCompleted = async (scheduleId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`${serverUrl}/control-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: 'completed'
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Jadwal kontrol berhasil ditandai sebagai selesai')
        fetchSchedules() // Refresh the list
        onScheduleUpdate?.()
      } else {
        toast.error(data.error || 'Gagal memperbarui status jadwal kontrol')
      }
    } catch (error) {
      console.log('Error updating schedule:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const getPatientDetails = (patientId: string) => {
    return patients.find(patient => patient.id === patientId)
  }

  const getDaysUntilControl = (controlDate: string) => {
    const today = new Date()
    const control = new Date(controlDate)
    const diffTime = control.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'bg-red-500 text-white' // Overdue
    if (daysUntil === 0) return 'bg-orange-500 text-white' // Today
    if (daysUntil <= 3) return 'bg-yellow-500 text-black' // Within 3 days
    if (daysUntil <= 7) return 'bg-blue-500 text-white' // Within a week
    return 'bg-green-500 text-white' // More than a week
  }

  const getStatusText = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} hari terlambat`
    if (daysUntil === 0) return 'Hari ini'
    if (daysUntil === 1) return 'Besok'
    return `${daysUntil} hari lagi`
  }

  const handleWhatsAppReminder = (patient: Patient, schedule: ControlSchedule) => {
    if (!patient || !patient.phone) {
      toast.error('Nomor telepon pasien tidak tersedia')
      return
    }

    // Clean phone number - remove non-numeric characters and leading zeros/spaces
    let cleanPhone = patient.phone.replace(/\D/g, '')
    
    // Add Indonesia country code if not present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone
    }

    // Format control date for WhatsApp message
    const controlDate = new Date(schedule.controlDate)
    const formattedDate = controlDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })

    // Create reminder message template
    const message = `Halo ${patient.name}, 

Ini adalah pengingat jadwal kontrol Anda di Falasifah Dental Clinic:

📅 Tanggal: ${formattedDate}
🏥 Tempat: Falasifah Dental Clinic
${schedule.notes ? `📝 Catatan: ${schedule.notes}` : ''}

Mohon konfirmasi kehadiran Anda. Jika ada perubahan jadwal, silakan hubungi kami sebelumnya.

Terima kasih! 🦷✨`

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')
    
    // Show success toast
    toast.success(`Membuka WhatsApp untuk ${patient.name}`)
  }

  if (schedules.length === 0) {
    return (
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Jadwal Kontrol Pasien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Tidak ada jadwal kontrol yang terjadwal</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-pink-200">
      <CardHeader>
        <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Jadwal Kontrol Pasien ({schedules.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {schedules.map((schedule) => {
            const patient = getPatientDetails(schedule.patientId)
            const daysUntil = getDaysUntilControl(schedule.controlDate)
            
            return (
              <div
                key={schedule.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-pink-800">{schedule.patientName}</h4>
                      <Badge className={`${getStatusColor(daysUntil)} text-xs`}>
                        {getStatusText(daysUntil)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(schedule.controlDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      
                      {patient && (
                        <>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{patient.address}</span>
                          </div>
                        </>
                      )}
                      
                      {schedule.notes && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <strong>Catatan:</strong> {schedule.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSchedule(schedule)}
                          className="border-pink-200 text-pink-700 hover:bg-pink-50"
                        >
                          <User className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-pink-800">Detail Pasien & Jadwal Kontrol</DialogTitle>
                        </DialogHeader>
                        {selectedSchedule && patient && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-800">Informasi Pasien</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Nama:</strong> {patient.name}</div>
                                <div><strong>No. RM:</strong> {patient.medicalRecordNumber}</div>
                                <div><strong>Telepon:</strong> {patient.phone}</div>
                                <div><strong>Alamat:</strong> {patient.address}</div>
                                <div><strong>Umur:</strong> {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} tahun</div>
                                <div><strong>Jenis Kelamin:</strong> {patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
                                {patient.allergies && <div><strong>Alergi:</strong> {patient.allergies}</div>}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-800">Jadwal Kontrol</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Tanggal Kontrol:</strong> {new Date(selectedSchedule.controlDate).toLocaleDateString('id-ID')}</div>
                                <div><strong>Status:</strong> 
                                  <Badge className={`ml-2 ${getStatusColor(getDaysUntilControl(selectedSchedule.controlDate))}`}>
                                    {getStatusText(getDaysUntilControl(selectedSchedule.controlDate))}
                                  </Badge>
                                </div>
                                {selectedSchedule.notes && (
                                  <div><strong>Catatan:</strong> {selectedSchedule.notes}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Selesai
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Penyelesaian</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menandai jadwal kontrol untuk pasien <strong>{schedule.patientName}</strong> sebagai selesai? 
                            Tindakan ini akan menghilangkan notifikasi dari dashboard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => markAsCompleted(schedule.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {loading ? 'Memproses...' : 'Ya, Tandai Selesai'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}