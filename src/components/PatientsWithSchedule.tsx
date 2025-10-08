import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Plus, Edit, UserPlus, Users, CalendarDays, Search, Trash2, RefreshCw, Hash, Upload, Clock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import { ImportPatientsFullPage } from './ImportPatientsFullPage'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string | null | undefined
  gender: string | null | undefined
  bloodType?: string
  allergies?: string
  emergencyContact?: string
  emergencyPhone?: string
  registrationDate: string
  medicalRecordNumber?: string
  created_at: string
  // Additional database fields
  tanggal_lahir?: string | null
  tanggal_mendaftar?: string | null
  jenis_kelamin?: string | null
  golongan_darah?: string | null
  riwayat_alergi?: string | null
  kontak_darurat?: string | null
  telepon_darurat?: string | null
  alamat?: string | null
  telepon?: string | null
  nama?: string | null
  no_rm?: string | null
  nomor_rm?: string | null
}

interface Doctor {
  id: string
  name: string
  specialization?: string
  status: string
}

interface ControlSchedule {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  controlDate: string
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

interface PatientsProps {
  accessToken: string
}

function PatientsWithSchedule({ accessToken }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [controlSchedules, setControlSchedules] = useState<ControlSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [activeTab, setActiveTab] = useState('patients')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [scheduleEditMode, setScheduleEditMode] = useState(false)
  
  // Form states
  const [patientForm, setPatientForm] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  const [scheduleForm, setScheduleForm] = useState({
    id: '',
    patientId: '',
    doctorId: '',
    controlDate: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    await Promise.all([
      fetchPatients(),
      fetchDoctors(),
      fetchControlSchedules()
    ])
  }

  const fetchPatients = async () => {
    try {
      setLoading(true)
      console.log('🏥 Fetching patients...')
      const data = await apiGet('/patients', accessToken)
      console.log('📡 Raw API response:', data)
      
      if (data.success) {
        const patientsData = data.patients || []
        console.log('📊 Patients data array:', patientsData)
        
        // Map database fields to component interface
        const mappedPatients = patientsData.map((patient: any) => {
          console.log('🔄 Mapping patient:', patient)
          
          return {
            id: patient.id,
            name: patient.nama || patient.name || 'Unknown Patient',
            phone: patient.telepon || patient.phone || '',
            address: patient.alamat || patient.address || '',
            birthDate: patient.tanggal_lahir || patient.birthDate || patient.birth_date || '',
            gender: patient.jenis_kelamin || patient.gender || '',
            bloodType: patient.golongan_darah || patient.bloodType || patient.blood_type || '',
            allergies: patient.riwayat_alergi || patient.allergies || '',
            emergencyContact: patient.kontak_darurat || patient.emergencyContact || patient.emergency_contact || '',
            emergencyPhone: patient.telepon_darurat || patient.emergencyPhone || patient.emergency_phone || '',
            registrationDate: patient.tanggal_mendaftar || patient.registrationDate || patient.registration_date || patient.created_at || new Date().toISOString(),
            medicalRecordNumber: patient.no_rm || patient.nomor_rm || patient.medicalRecordNumber || patient.medical_record_number || '',
            created_at: patient.created_at || new Date().toISOString(),
            // Keep original fields for reference
            tanggal_lahir: patient.tanggal_lahir,
            tanggal_mendaftar: patient.tanggal_mendaftar,
            jenis_kelamin: patient.jenis_kelamin,
            golongan_darah: patient.golongan_darah,
            riwayat_alergi: patient.riwayat_alergi,
            kontak_darurat: patient.kontak_darurat,
            telepon_darurat: patient.telepon_darurat,
            alamat: patient.alamat,
            telepon: patient.telepon,
            nama: patient.nama,
            no_rm: patient.no_rm,
            nomor_rm: patient.nomor_rm
          }
        })
        
        setPatients(mappedPatients)
        console.log('✅ Patients loaded and mapped:', mappedPatients.length)
        console.log('📋 First few patients:', mappedPatients.slice(0, 3))
        
        // Debug: Log sample patient data
        if (mappedPatients.length > 0) {
          const sample = mappedPatients[0]
          console.log('📋 Sample mapped patient data:', {
            id: sample.id,
            name: sample.name,
            phone: sample.phone,
            birthDate: sample.birthDate,
            gender: sample.gender,
            registrationDate: sample.registrationDate,
            medicalRecord: sample.medicalRecordNumber
          })
        } else {
          console.log('⚠️ No patients found in database')
        }
      } else {
        console.log('❌ Patients fetch unsuccessful:', data)
        if (data.error) {
          console.error('❌ Server error:', data.error)
          toast.error(`Error: ${data.error}`)
        } else {
          toast.error('Gagal memuat data pasien')
        }
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error)
      toast.error(`Gagal memuat data pasien: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      console.log('👨‍⚕️ Fetching doctors...')
      const data = await apiGet('/doctors', accessToken)
      if (data.success) {
        const doctorsData = data.doctors || []
        setDoctors(doctorsData)
        console.log('✅ Doctors loaded:', doctorsData.length)
      } else {
        console.log('❌ Doctors fetch unsuccessful:', data)
      }
    } catch (error) {
      console.error('❌ Error fetching doctors:', error)
    }
  }

  const fetchControlSchedules = async () => {
    try {
      console.log('📅 Fetching control schedules...')
      const data = await apiGet('/control-schedules', accessToken)
      if (data.success) {
        const schedulesData = data.schedules || []
        setControlSchedules(schedulesData)
        console.log('✅ Control schedules loaded:', schedulesData.length)
      } else {
        console.log('❌ Control schedules fetch unsuccessful:', data)
      }
    } catch (error) {
      console.error('❌ Error fetching control schedules:', error)
    }
  }

  const handleBatchUpdateMedicalRecords = async () => {
    setLoading(true)
    try {
      console.log('🔄 Starting batch update medical records...')
      const data = await apiPost('/batch-update-medical-records', accessToken, {})
      
      if (data.success) {
        toast.success(`Berhasil generate ${data.updatedCount} nomor rekam medis`)
        console.log('✅ Batch update completed:', data)
        await fetchPatients() // Refresh data
      } else {
        console.error('❌ Batch update failed:', data.error)
        toast.error(data.error || 'Gagal generate nomor rekam medis')
      }
    } catch (error) {
      console.error('❌ Error batch updating medical records:', error)
      toast.error('Gagal generate nomor rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const generateMedicalRecordNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    const todayPatients = patients.filter(p => {
      const regDate = new Date(p.registrationDate || p.created_at)
      return regDate.toDateString() === now.toDateString()
    })
    
    const sequence = String(todayPatients.length + 1).padStart(3, '0')
    return `RM-${year}${month}${day}-${sequence}`
  }

  const resetPatientForm = () => {
    setPatientForm({
      id: '',
      name: '',
      phone: '',
      address: '',
      birthDate: '',
      gender: '',
      bloodType: '',
      allergies: '',
      emergencyContact: '',
      emergencyPhone: ''
    })
    setEditMode(false)
  }

  const resetScheduleForm = () => {
    setScheduleForm({
      id: '',
      patientId: '',
      doctorId: '',
      controlDate: '',
      notes: '',
      status: 'scheduled'
    })
    setScheduleEditMode(false)
  }

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare patient data with proper field mapping
      const patientData = {
        nama: patientForm.name,
        name: patientForm.name,
        telepon: patientForm.phone,
        phone: patientForm.phone,
        alamat: patientForm.address,
        address: patientForm.address,
        tanggal_lahir: patientForm.birthDate,
        birthDate: patientForm.birthDate,
        jenis_kelamin: patientForm.gender,
        gender: patientForm.gender,
        golongan_darah: patientForm.bloodType,
        bloodType: patientForm.bloodType,
        riwayat_alergi: patientForm.allergies,
        allergies: patientForm.allergies,
        kontak_darurat: patientForm.emergencyContact,
        emergencyContact: patientForm.emergencyContact,
        telepon_darurat: patientForm.emergencyPhone,
        emergencyPhone: patientForm.emergencyPhone,
        tanggal_mendaftar: editMode ? undefined : new Date().toISOString(),
        registrationDate: editMode ? undefined : new Date().toISOString()
      }

      const data = editMode 
        ? await apiPut(`/patients/${patientForm.id}`, accessToken, patientData)
        : await apiPost('/patients', accessToken, patientData)

      if (data.success) {
        toast.success(editMode ? 'Pasien berhasil diperbarui' : 'Pasien berhasil ditambahkan')
        console.log('✅ Patient saved:', data.patient)
        setDialogOpen(false)
        resetPatientForm()
        await fetchPatients()
      } else {
        console.error('❌ Save patient failed:', data.error)
        toast.error(data.error || 'Gagal menyimpan data pasien')
      }
    } catch (error) {
      console.error('❌ Error saving patient:', error)
      toast.error('Gagal menyimpan data pasien')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get patient and doctor names
      const patient = patients.find(p => p.id === scheduleForm.patientId)
      const doctor = doctors.find(d => d.id === scheduleForm.doctorId)

      const scheduleData = {
        ...scheduleForm,
        patientName: patient?.name || 'Unknown Patient',
        doctorName: doctor?.name || 'Unknown Doctor'
      }

      const data = scheduleEditMode 
        ? await apiPut(`/control-schedules/${scheduleForm.id}`, accessToken, scheduleData)
        : await apiPost('/control-schedules', accessToken, scheduleData)

      if (data.success) {
        toast.success(scheduleEditMode ? 'Jadwal kontrol berhasil diperbarui' : 'Jadwal kontrol berhasil ditambahkan')
        console.log('✅ Schedule saved:', data.schedule)
        setScheduleDialogOpen(false)
        resetScheduleForm()
        await fetchControlSchedules()
      } else {
        console.error('❌ Save schedule failed:', data.error)
        toast.error(data.error || 'Gagal menyimpan jadwal kontrol')
      }
    } catch (error) {
      console.error('❌ Error saving schedule:', error)
      toast.error('Gagal menyimpan jadwal kontrol')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPatient = (patient: Patient) => {
    setPatientForm({
      id: patient.id || '',
      name: patient.name || '',
      phone: patient.phone || '',
      address: patient.address || '',
      birthDate: patient.birthDate || '',
      gender: patient.gender || '',
      bloodType: patient.bloodType || '',
      allergies: patient.allergies || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || ''
    })
    setEditMode(true)
    setDialogOpen(true)
  }

  const handleEditSchedule = (schedule: ControlSchedule) => {
    setScheduleForm({
      id: schedule.id || '',
      patientId: schedule.patientId || '',
      doctorId: schedule.doctorId || '',
      controlDate: schedule.controlDate || '',
      notes: schedule.notes || '',
      status: schedule.status || 'scheduled'
    })
    setScheduleEditMode(true)
    setScheduleDialogOpen(true)
  }

  const handleDeletePatient = async (patient: Patient) => {
    setLoading(true)
    try {
      const data = await apiDelete(`/patients/${patient.id}`, accessToken)
      if (data.success) {
        toast.success('Pasien berhasil dihapus')
        await fetchPatients()
      } else {
        toast.error(data.error || 'Gagal menghapus pasien')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Gagal menghapus pasien')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (schedule: ControlSchedule) => {
    setLoading(true)
    try {
      const data = await apiDelete(`/control-schedules/${schedule.id}`, accessToken)
      if (data.success) {
        toast.success('Jadwal kontrol berhasil dihapus')
        await fetchControlSchedules()
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal kontrol')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Gagal menghapus jadwal kontrol')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate || birthDate === '' || birthDate === null || birthDate === undefined) {
      return null
    }
    
    try {
      const birth = new Date(birthDate)
      
      // Check if birth date is valid
      if (isNaN(birth.getTime())) {
        return null
      }
      
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      // Ensure age is reasonable (0-150 years)
      if (age < 0 || age > 150) {
        return null
      }
      
      return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return null
    }
  }

  const formatGender = (gender: string | null | undefined) => {
    if (!gender || gender === '' || gender === null || gender === undefined) {
      return '-'
    }
    
    try {
      // Normalize gender values
      const normalizedGender = String(gender).toLowerCase().trim()
      
      if (normalizedGender === 'laki-laki' || normalizedGender === 'male' || normalizedGender === 'l' || normalizedGender === 'm') {
        return 'Laki-laki'
      } else if (normalizedGender === 'perempuan' || normalizedGender === 'female' || normalizedGender === 'p' || normalizedGender === 'f') {
        return 'Perempuan'
      }
      
      // Return original value if it doesn't match known patterns
      return String(gender)
    } catch (error) {
      console.error('Error formatting gender:', error)
      return '-'
    }
  }

  const formatAge = (birthDate: string | null | undefined) => {
    if (!birthDate || birthDate === '' || birthDate === null || birthDate === undefined) {
      return '-'
    }
    
    try {
      const age = calculateAge(birthDate)
      if (age === null) return '-'
      return `${age} th`
    } catch (error) {
      console.error('Error formatting age:', error)
      return '-'
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === '' || dateStr === null || dateStr === undefined) {
      return '-'
    }
    
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        return '-'
      }
      return date.toLocaleDateString('id-ID')
    } catch (error) {
      console.error('Error formatting date:', error)
      return '-'
    }
  }

  const formatStatus = (status: string) => {
    const statusMap = {
      'scheduled': { label: 'Terjadwal', className: 'bg-blue-50 border-blue-200 text-blue-700' },
      'completed': { label: 'Selesai', className: 'bg-green-50 border-green-200 text-green-700' },
      'cancelled': { label: 'Dibatalkan', className: 'bg-red-50 border-red-200 text-red-700' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-50 border-gray-200 text-gray-700' }
  }

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient =>
      (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, searchTerm])

  const filteredSchedules = useMemo(() => {
    if (!scheduleSearchTerm) return controlSchedules
    const searchLower = scheduleSearchTerm.toLowerCase()
    return controlSchedules.filter(schedule =>
      (schedule.patientName && schedule.patientName.toLowerCase().includes(searchLower)) ||
      (schedule.doctorName && schedule.doctorName.toLowerCase().includes(searchLower)) ||
      (schedule.controlDate && schedule.controlDate.includes(scheduleSearchTerm))
    )
  }, [controlSchedules, scheduleSearchTerm])

  // Show full page import
  if (showImport) {
    return (
      <ImportPatientsFullPage
        accessToken={accessToken}
        onImportComplete={() => {
          setShowImport(false)
          fetchPatients()
          toast.success('Data pasien berhasil diimpor!')
        }}
        onClose={() => setShowImport(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-800">Manajemen Pasien</h2>
        <div className="flex gap-2">
          <Button 
            onClick={fetchAllData}
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Data Pasien
          </TabsTrigger>
          <TabsTrigger value="control-schedules" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Jadwal Kontrol
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Data Pasien */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, telepon, atau nomor RM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Generate No. RM Button */}
              <Button 
                onClick={handleBatchUpdateMedicalRecords}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                disabled={loading}
              >
                <Hash className="h-4 w-4 mr-2" />
                {loading ? 'Memproses...' : 'Generate No. RM'}
              </Button>
              
              {/* Import Excel Button */}
              <Button 
                variant="outline" 
                onClick={() => setShowImport(true)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>

              {/* Add Patient Button */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetPatientForm()} className="bg-pink-600 hover:bg-pink-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Tambah Pasien
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editMode ? 'Edit Pasien' : 'Tambah Pasien Baru'}</DialogTitle>
                    <DialogDescription>
                      {editMode ? 'Perbarui informasi pasien' : 'Masukkan informasi pasien baru'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handlePatientSubmit} className="space-y-4">
                    {!editMode && (
                      <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-pink-600" />
                          <span className="text-sm text-pink-700">
                            Nomor RM akan dibuat otomatis: <span className="font-mono font-medium">{generateMedicalRecordNumber()}</span>
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          value={patientForm.name}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Nomor Telepon</Label>
                        <Input
                          id="phone"
                          value={patientForm.phone}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={patientForm.birthDate}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, birthDate: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Jenis Kelamin *</Label>
                        <Select 
                          value={patientForm.gender} 
                          onValueChange={(value) => setPatientForm(prev => ({ ...prev, gender: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Golongan Darah</Label>
                        <Select 
                          value={patientForm.bloodType} 
                          onValueChange={(value) => setPatientForm(prev => ({ ...prev, bloodType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih golongan darah" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Kontak Darurat</Label>
                        <Input
                          id="emergencyContact"
                          value={patientForm.emergencyContact}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat *</Label>
                      <Textarea
                        id="address"
                        value={patientForm.address}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allergies">Alergi</Label>
                      <Textarea
                        id="allergies"
                        value={patientForm.allergies}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                        placeholder="Masukkan informasi alergi jika ada..."
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Menyimpan...' : editMode ? 'Perbarui' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead>Umur</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Tanggal Mendaftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-4">
                            <Users className="h-12 w-12 text-gray-300" />
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {searchTerm ? 
                                  `Tidak ada pasien yang cocok dengan "${searchTerm}"` :
                                  'Belum ada data pasien'
                                }
                              </p>
                              {!searchTerm && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm text-gray-600">
                                    Mulai tambahkan data pasien dengan:
                                  </p>
                                  <div className="flex justify-center gap-2">
                                    <Button 
                                      onClick={handleBatchUpdateMedicalRecords}
                                      size="sm" 
                                      variant="outline"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                      disabled={loading}
                                    >
                                      <Hash className="h-4 w-4 mr-2" />
                                      Generate No. RM
                                    </Button>
                                    <Button 
                                      onClick={() => setShowImport(true)}
                                      size="sm" 
                                      variant="outline"
                                      className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Import Excel
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        resetPatientForm()
                                        setDialogOpen(true)
                                      }}
                                      size="sm" 
                                      className="bg-pink-600 hover:bg-pink-700"
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Tambah Manual
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-mono text-xs ${patient.medicalRecordNumber ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                              {patient.medicalRecordNumber || 'Belum ada'}
                            </Badge>
                          </TableCell>
                          <TableCell>{patient.phone || '-'}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(patient.birthDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {formatAge(patient.birthDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {formatGender(patient.gender)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(patient.registrationDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPatient(patient)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Pasien</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus data pasien {patient.name}?
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePatient(patient)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Jadwal Kontrol */}
        <TabsContent value="control-schedules" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama pasien, dokter, atau tanggal..."
                value={scheduleSearchTerm}
                onChange={(e) => setScheduleSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Add Schedule Button */}
              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetScheduleForm()} className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Jadwal Kontrol
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{scheduleEditMode ? 'Edit Jadwal Kontrol' : 'Tambah Jadwal Kontrol Baru'}</DialogTitle>
                    <DialogDescription>
                      {scheduleEditMode ? 'Perbarui jadwal kontrol pasien' : 'Buat jadwal kontrol baru untuk pasien'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientId">Pasien *</Label>
                        <Select 
                          value={scheduleForm.patientId} 
                          onValueChange={(value) => setScheduleForm(prev => ({ ...prev, patientId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pasien" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name} - {patient.medicalRecordNumber || 'No RM: -'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doctorId">Dokter *</Label>
                        <Select 
                          value={scheduleForm.doctorId} 
                          onValueChange={(value) => setScheduleForm(prev => ({ ...prev, doctorId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih dokter" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name} - {doctor.specialization || 'Dokter Gigi'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="controlDate">Tanggal Kontrol *</Label>
                        <Input
                          id="controlDate"
                          type="date"
                          value={scheduleForm.controlDate}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, controlDate: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select 
                          value={scheduleForm.status} 
                          onValueChange={(value) => setScheduleForm(prev => ({ ...prev, status: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Terjadwal</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan</Label>
                      <Textarea
                        id="notes"
                        value={scheduleForm.notes}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Masukkan catatan jadwal kontrol..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Menyimpan...' : scheduleEditMode ? 'Perbarui' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal Kontrol</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-4">
                            <CalendarDays className="h-12 w-12 text-gray-300" />
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {scheduleSearchTerm ? 
                                  `Tidak ada jadwal yang cocok dengan "${scheduleSearchTerm}"` :
                                  'Belum ada jadwal kontrol'
                                }
                              </p>
                              {!scheduleSearchTerm && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Mulai tambahkan jadwal kontrol untuk pasien
                                  </p>
                                  <Button 
                                    onClick={() => {
                                      resetScheduleForm()
                                      setScheduleDialogOpen(true)
                                    }}
                                    size="sm" 
                                    className="bg-pink-600 hover:bg-pink-700"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Jadwal Kontrol
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSchedules.map((schedule) => {
                        const patient = patients.find(p => p.id === schedule.patientId)
                        const statusFormat = formatStatus(schedule.status)
                        
                        return (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.patientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs bg-blue-50 border-blue-200 text-blue-700">
                                {patient?.medicalRecordNumber || 'Belum ada'}
                              </Badge>
                            </TableCell>
                            <TableCell>{schedule.doctorName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {formatDate(schedule.controlDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusFormat.className}>
                                {statusFormat.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {schedule.notes || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Jadwal Kontrol</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus jadwal kontrol untuk {schedule.patientName}?
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PatientsWithSchedule