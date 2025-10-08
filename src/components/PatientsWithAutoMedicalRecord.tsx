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
import { Plus, Edit, UserPlus, Users, CalendarDays, FileText, Search, Phone, MapPin, Calendar as CalendarIcon, Trash2, RefreshCw, Printer, Filter, Hash, RotateCw, Stethoscope, Upload } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import { DoctorSelector } from './DoctorSelector'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'
import { ImportPatientsXLSX } from './ImportPatientsXLSX'

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
  created_at: string
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

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  visitDate: string
  complaint: string
  diagnosis: string
  treatment: string
  prescription?: string
  notes?: string
  created_at: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  phone?: string
  email?: string
  license?: string
}

interface PatientsProps {
  accessToken: string
}

export default function PatientsWithAutoMedicalRecord({ accessToken }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [schedules, setSchedules] = useState<ControlSchedule[]>([])
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('')
  const [recordSearchTerm, setRecordSearchTerm] = useState('')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  const [editScheduleMode, setEditScheduleMode] = useState(false)
  
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

  const [recordForm, setRecordForm] = useState({
    id: '',
    patientId: '',
    doctorId: '',
    visitDate: '',
    complaint: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  })

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPatients(),
        fetchDoctors(),
        fetchSchedules(),
        fetchRecords()
      ])
    }
    loadInitialData()
  }, [])

  const fetchPatients = async () => {
    try {
      console.log('🏥 Fetching patients...')
      const data = await apiGet('/patients', accessToken)
      if (data.success) {
        setPatients(data.patients || [])
        console.log('✅ Patients loaded:', data.patients?.length || 0)
      } else {
        console.log('❌ Patients fetch unsuccessful:', data)
        toast.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error)
      toast.error('Gagal memuat data pasien')
    }
  }

  const fetchDoctors = async () => {
    try {
      console.log('👨‍⚕️ Fetching doctors...')
      const data = await apiGet('/doctors', accessToken)
      if (data.success) {
        const cleanedDoctors = cleanDoctorNames(data.doctors || [])
        setDoctors(cleanedDoctors)
        console.log('✅ Doctors loaded:', cleanedDoctors?.length || 0)
      } else {
        console.log('❌ Doctors fetch unsuccessful:', data)
        toast.error('Gagal memuat data dokter')
      }
    } catch (error) {
      console.error('❌ Error fetching doctors:', error)
      toast.error('Gagal memuat data dokter')
    }
  }

  const fetchSchedules = async () => {
    try {
      console.log('📅 Fetching schedules...')
      const data = await apiGet('/control-schedules', accessToken)
      if (data.success) {
        setSchedules(data.schedules || [])
        console.log('✅ Schedules loaded:', data.schedules?.length || 0)
      } else {
        console.log('❌ Schedules fetch unsuccessful:', data)
        toast.error('Gagal memuat jadwal kontrol')
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error)
      toast.error('Gagal memuat jadwal kontrol')
    }
  }

  const fetchRecords = async () => {
    try {
      console.log('📋 Fetching medical records...')
      const data = await apiGet('/medical-records', accessToken)
      if (data.success) {
        setRecords(data.records || [])
        console.log('✅ Records loaded:', data.records?.length || 0)
      } else {
        console.log('❌ Records fetch unsuccessful:', data)
        toast.error('Gagal memuat rekam medis')
      }
    } catch (error) {
      console.error('❌ Error fetching records:', error)
      toast.error('Gagal memuat rekam medis')
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
    setEditScheduleMode(false)
    setScheduleSearchTerm('')
  }

  const resetRecordForm = () => {
    setRecordForm({
      id: '',
      patientId: '',
      doctorId: '',
      visitDate: new Date().toISOString().split('T')[0],
      complaint: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    })
    setEditRecordMode(false)
    setRecordSearchTerm('')
  }

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const patientData = {
        ...patientForm,
        registrationDate: editMode ? undefined : new Date().toISOString(),
        medicalRecordNumber: editMode ? undefined : generateMedicalRecordNumber()
      }

      const data = editMode 
        ? await apiPut(`/patients/${patientForm.id}`, accessToken, patientData)
        : await apiPost('/patients', accessToken, patientData)

      if (data.success) {
        toast.success(editMode ? 'Pasien berhasil diperbarui' : 'Pasien berhasil ditambahkan')
        setDialogOpen(false)
        resetPatientForm()
        await fetchPatients()
      } else {
        toast.error(data.error || 'Gagal menyimpan data pasien')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error('Gagal menyimpan data pasien')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔄 Starting schedule submit process')
      console.log('📋 Schedule form data:', scheduleForm)
      console.log('📋 Edit mode:', editScheduleMode)

      const selectedPatient = patients.find(p => p.id === scheduleForm.patientId)
      const selectedDoctor = doctors.find(d => d.id === scheduleForm.doctorId)
      
      console.log('👤 Selected patient:', selectedPatient ? selectedPatient.name : 'None')
      console.log('👨‍⚕️ Selected doctor:', selectedDoctor ? selectedDoctor.name : 'None')
      
      if (!selectedPatient || !selectedDoctor) {
        console.log('❌ Missing patient or doctor')
        toast.error('Pilih pasien dan dokter terlebih dahulu')
        setLoading(false)
        return
      }

      // Validate required fields
      if (!scheduleForm.controlDate) {
        console.log('❌ Missing control date')
        toast.error('Tanggal kontrol wajib diisi')
        setLoading(false)
        return
      }

      const scheduleData = {
        ...scheduleForm,
        patientName: selectedPatient.name,
        doctorName: selectedDoctor.name
      }

      console.log('📄 Final schedule data to send:', scheduleData)

      const endpoint = editScheduleMode ? `/control-schedules/${scheduleForm.id}` : '/control-schedules'
      console.log('🌐 API endpoint:', endpoint)

      const data = editScheduleMode 
        ? await apiPut(endpoint, accessToken, scheduleData)
        : await apiPost(endpoint, accessToken, scheduleData)

      console.log('📡 API response:', data)

      if (data.success) {
        console.log('✅ Schedule save successful')
        toast.success(editScheduleMode ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil ditambahkan')
        setScheduleDialogOpen(false)
        resetScheduleForm()
        await fetchSchedules()
      } else {
        console.log('❌ Schedule save failed:', data.error)
        toast.error(data.error || 'Gagal menyimpan jadwal')
      }
    } catch (error) {
      console.error('❌ Error saving schedule:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan jadwal'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedPatient = patients.find(p => p.id === recordForm.patientId)
      const selectedDoctor = doctors.find(d => d.id === recordForm.doctorId)
      
      if (!selectedPatient || !selectedDoctor) {
        toast.error('Pilih pasien dan dokter terlebih dahulu')
        setLoading(false)
        return
      }

      const recordData = {
        ...recordForm,
        patientName: selectedPatient.name,
        doctorName: selectedDoctor.name
      }

      const data = editRecordMode 
        ? await apiPut(`/medical-records/${recordForm.id}`, accessToken, recordData)
        : await apiPost('/medical-records', accessToken, recordData)

      if (data.success) {
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil ditambahkan')
        setRecordDialogOpen(false)
        resetRecordForm()
        await fetchRecords()
      } else {
        toast.error(data.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('Gagal menyimpan rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPatient = (patient: Patient) => {
    setPatientForm({
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      address: patient.address,
      birthDate: patient.birthDate,
      gender: patient.gender,
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
      id: schedule.id,
      patientId: schedule.patientId,
      doctorId: schedule.doctorId,
      controlDate: schedule.controlDate,
      notes: schedule.notes,
      status: schedule.status
    })
    setEditScheduleMode(true)
    setScheduleDialogOpen(true)
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setRecordForm({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      visitDate: record.visitDate,
      complaint: record.complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes || ''
    })
    setEditRecordMode(true)
    setRecordDialogOpen(true)
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
        toast.success('Jadwal berhasil dihapus')
        await fetchSchedules()
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Gagal menghapus jadwal')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (record: MedicalRecord) => {
    setLoading(true)
    try {
      const data = await apiDelete(`/medical-records/${record.id}`, accessToken)
      if (data.success) {
        toast.success('Rekam medis berhasil dihapus')
        await fetchRecords()
      } else {
        toast.error(data.error || 'Gagal menghapus rekam medis')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Gagal menghapus rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800">Selesai</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchTerm) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, searchTerm])

  const filteredSchedulePatients = useMemo(() => {
    if (!scheduleSearchTerm) return []
    const searchLower = scheduleSearchTerm.toLowerCase()
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.phone.includes(scheduleSearchTerm) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, scheduleSearchTerm])

  const filteredRecordPatients = useMemo(() => {
    if (!recordSearchTerm) return []
    const searchLower = recordSearchTerm.toLowerCase()
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.phone.includes(recordSearchTerm) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, recordSearchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-800">Manajemen Pasien</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              fetchPatients()
              fetchSchedules()
              fetchRecords()
            }}
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            <Users className="h-4 w-4 mr-2" />
            Data Pasien ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
            <CalendarDays className="h-4 w-4 mr-2" />
            Jadwal Kontrol ({schedules.length})
          </TabsTrigger>
        </TabsList>

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
                      <Label htmlFor="phone">Nomor Telepon *</Label>
                      <Input
                        id="phone"
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
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

                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telepon Darurat</Label>
                      <Input
                        id="emergencyPhone"
                        value={patientForm.emergencyPhone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
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

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Umur</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-gray-300" />
                            <p>
                              {searchTerm ? 
                                `Tidak ada pasien yang cocok dengan "${searchTerm}"` :
                                'Belum ada data pasien'
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {patient.medicalRecordNumber || 'Belum ada'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {patient.phone}
                            </div>
                          </TableCell>
                          <TableCell>{calculateAge(patient.birthDate)} tahun</TableCell>
                          <TableCell>
                            <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'}>
                              {patient.gender}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate" title={patient.address}>
                                {patient.address}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPatient(patient)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit pasien"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Hapus pasien"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus pasien <strong>{patient.name}</strong>?
                                      <br /><br />
                                      Tindakan ini akan menghapus semua data terkait pasien dan tidak dapat dibatalkan.
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

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium text-blue-800">Jadwal Kontrol Pasien</h3>
              <div className="flex items-center gap-2">
                {(() => {
                  const today = new Date()
                  const overdue = schedules.filter(s => new Date(s.controlDate) < today && s.status === 'scheduled').length
                  const todayCount = schedules.filter(s => {
                    const controlDate = new Date(s.controlDate)
                    return controlDate.toDateString() === today.toDateString() && s.status === 'scheduled'
                  }).length
                  const upcoming = schedules.filter(s => new Date(s.controlDate) > today && s.status === 'scheduled').length
                  
                  return (
                    <>
                      {overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {overdue} Terlambat
                        </Badge>
                      )}
                      {todayCount > 0 && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          {todayCount} Hari Ini
                        </Badge>
                      )}
                      {upcoming > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">
                          {upcoming} Mendatang
                        </Badge>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetScheduleForm()} className="bg-blue-600 hover:bg-blue-700">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Tambah Jadwal Kontrol
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">{editScheduleMode ? 'Edit Jadwal Kontrol' : 'Tambah Jadwal Kontrol'}</DialogTitle>
                  <DialogDescription>
                    {editScheduleMode ? 'Perbarui jadwal kontrol pasien' : 'Buat jadwal kontrol baru untuk pasien - Cari dan pilih pasien dari tabel di bawah'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleScheduleSubmit} className="space-y-6">
                  {!editScheduleMode && (
                    <div className="space-y-4">
                      <Label htmlFor="schedulePatient" className="text-lg font-medium">Pilih Pasien</Label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Cari nama pasien, nomor RM, atau telepon..."
                            value={scheduleSearchTerm}
                            onChange={(e) => setScheduleSearchTerm(e.target.value)}
                            className="w-full pl-12 py-3 text-base"
                          />
                        </div>
                        
                        {scheduleSearchTerm && (
                          <div className="text-sm text-gray-600">
                            Ditemukan {filteredSchedulePatients.length} pasien
                            {filteredSchedulePatients.length > 10 && ' (menampilkan 10 teratas)'}
                          </div>
                        )}
                      
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                          <Table className="w-full">
                            <TableHeader>
                              <TableRow className="bg-blue-50">
                                <TableHead className="text-blue-700">Nama Pasien</TableHead>
                                <TableHead className="text-blue-700">No. RM</TableHead>
                                <TableHead className="text-blue-700">Telepon</TableHead>
                                <TableHead className="text-blue-700">Umur</TableHead>
                                <TableHead className="text-blue-700">Gender</TableHead>  
                                <TableHead className="text-blue-700">Alamat</TableHead>
                                <TableHead className="text-blue-700 text-center">Pilih</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {!scheduleSearchTerm ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                      <Search className="h-12 w-12 text-gray-300" />
                                      <p className="text-base">Ketik nama, nomor RM, atau telepon untuk mencari pasien</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : filteredSchedulePatients.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                      <Users className="h-12 w-12 text-gray-300" />
                                      <p className="text-base">Tidak ada pasien yang cocok dengan pencarian "{scheduleSearchTerm}"</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredSchedulePatients.slice(0, 10).map((patient) => (
                                  <TableRow 
                                    key={patient.id}
                                    className={scheduleForm.patientId === patient.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                                  >
                                    <TableCell className="font-medium">{patient.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {patient.medicalRecordNumber || 'Belum ada'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{patient.phone}</TableCell>
                                    <TableCell>{calculateAge(patient.birthDate)} tahun</TableCell>
                                    <TableCell>
                                      <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'}>
                                        {patient.gender}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={patient.address}>
                                      {patient.address}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={scheduleForm.patientId === patient.id ? "default" : "outline"}
                                        onClick={() => setScheduleForm(prev => ({ ...prev, patientId: patient.id }))}
                                        className={scheduleForm.patientId === patient.id ? "bg-blue-600 hover:bg-blue-700" : ""}
                                      >
                                        {scheduleForm.patientId === patient.id ? 'Terpilih' : 'Pilih'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {scheduleForm.patientId && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Pasien terpilih: {patients.find(p => p.id === scheduleForm.patientId)?.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Doctor Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Pilih Dokter Pemeriksa</Label>
                    <div className="space-y-3">
                      <DoctorSelector
                        doctors={doctors}
                        selectedDoctorId={scheduleForm.doctorId}
                        onDoctorSelect={(doctorId) => setScheduleForm(prev => ({ ...prev, doctorId }))}
                        placeholder="Pilih dokter yang melakukan pemeriksaan"
                        className="w-full"
                      />
                      
                      {scheduleForm.doctorId && (() => {
                        const selectedDoctor = doctors.find(d => d.id === scheduleForm.doctorId)
                        return selectedDoctor && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Dokter terpilih: {selectedDoctor.name}
                              </span>
                              {selectedDoctor.specialization && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                  {selectedDoctor.specialization}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label htmlFor="controlDate" className="text-base font-semibold">Tanggal Kontrol</Label>
                      <Input
                        id="controlDate"
                        type="date"
                        value={scheduleForm.controlDate}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, controlDate: e.target.value }))}
                        required
                        className="text-base py-3"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {editScheduleMode && (
                      <div className="space-y-4">
                        <Label htmlFor="status" className="text-base font-semibold">Status</Label>
                        <Select 
                          value={scheduleForm.status} 
                          onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => 
                            setScheduleForm(prev => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="text-base py-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Terjadwal</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="notes" className="text-base font-semibold">Catatan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan tambahan untuk jadwal kontrol..."
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="resize-none text-base"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !scheduleForm.patientId || !scheduleForm.doctorId} 
                      className="bg-blue-600 hover:bg-blue-700 px-10 py-3 text-base"
                      title={!scheduleForm.patientId ? 'Pilih pasien terlebih dahulu' : !scheduleForm.doctorId ? 'Pilih dokter terlebih dahulu' : ''}
                    >
                      {loading ? 'Menyimpan...' : editScheduleMode ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Tanggal Kontrol
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Urutkan Terbaru
                          </Badge>
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center gap-4">
                            <CalendarDays className="h-16 w-16 text-gray-300" />
                            <div>
                              <p className="text-lg font-medium mb-2">Belum ada jadwal kontrol</p>
                              <p className="text-sm">Klik tombol "Tambah Jadwal Kontrol" untuk membuat jadwal baru</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedules
                        .sort((a, b) => new Date(b.controlDate).getTime() - new Date(a.controlDate).getTime())
                        .map((schedule) => {
                          const patient = patients.find(p => p.id === schedule.patientId)
                          const controlDate = new Date(schedule.controlDate)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          controlDate.setHours(0, 0, 0, 0)
                          
                          const isOverdue = controlDate < today && schedule.status === 'scheduled'
                          const isToday = controlDate.getTime() === today.getTime() && schedule.status === 'scheduled'
                          
                          return (
                            <TableRow 
                              key={schedule.id}
                              className={
                                isOverdue ? 'bg-red-50 border-l-4 border-red-500' :
                                isToday ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                                schedule.status === 'completed' ? 'bg-green-50' :
                                schedule.status === 'cancelled' ? 'bg-gray-50' :
                                'hover:bg-gray-50'
                              }
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{schedule.patientName}</div>
                                    {patient && (
                                      <div className="text-xs text-gray-500">
                                        {patient.phone} • {calculateAge(patient.birthDate)} tahun
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {patient?.medicalRecordNumber || 'Belum ada'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {schedule.doctorName || 'Belum ditentukan'}
                                    </div>
                                    {(() => {
                                      const doctor = doctors.find(d => d.id === schedule.doctorId)
                                      return doctor?.specialization && (
                                        <div className="text-xs text-gray-500">
                                          {doctor.specialization}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className={`font-medium ${isOverdue ? 'text-red-600' : isToday ? 'text-yellow-600' : 'text-blue-600'}`}>
                                      {controlDate.toLocaleDateString('id-ID', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {isOverdue ? (
                                        <span className="text-red-600 font-medium">
                                          Terlambat {Math.floor((today.getTime() - controlDate.getTime()) / (1000 * 60 * 60 * 24))} hari
                                        </span>
                                      ) : isToday ? (
                                        <span className="text-yellow-600 font-medium">Hari ini</span>
                                      ) : (
                                        <span className="text-blue-600">
                                          {Math.floor((controlDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} hari lagi
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isOverdue && (
                                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                                  )}
                                  {isToday && (
                                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(schedule.status)}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate" title={schedule.notes}>
                                  {schedule.notes || '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSchedule(schedule)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Edit jadwal"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Hapus jadwal"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus jadwal kontrol untuk <strong>{schedule.patientName}</strong> pada tanggal {controlDate.toLocaleDateString('id-ID')}?
                                          <br /><br />
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