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
import { Plus, Edit, UserPlus, Users, CalendarDays, FileText, Search, Phone, MapPin, Calendar as CalendarIcon, Trash2, RefreshCw, Printer, Filter, Hash, RotateCw, Stethoscope } from 'lucide-react'
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

export default function PatientsWithImport({ accessToken }: PatientsProps) {
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
  const [editMode, setEditMode] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  const [editScheduleMode, setEditScheduleMode] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
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

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare patient data
      const patientData = {
        ...patientForm,
        registrationDate: editMode ? undefined : new Date().toISOString()
      }

      // For new patients, let server generate medical record number
      // For existing patients, don't include medicalRecordNumber to avoid overwriting
      if (!editMode) {
        // Let server generate the medical record number
        console.log('🆕 Creating new patient, server will generate medical record number')
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

  const handleMedicalRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare medical record data
      const selectedDoctor = doctors.find(d => d.id === recordForm.doctorId)
      const medicalRecordData = {
        ...recordForm,
        patientName: selectedPatient?.name || '',
        doctorName: selectedDoctor?.name || ''
      }

      const data = editRecordMode
        ? await apiPut(`/medical-records/${recordForm.id}`, accessToken, medicalRecordData)
        : await apiPost('/medical-records', accessToken, medicalRecordData)

      if (data.success) {
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil ditambahkan')
        console.log('✅ Medical record saved:', data.record)
        setRecordDialogOpen(false)
        setRecordForm({
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
        setEditRecordMode(false)
        setSelectedPatient(null)
        await fetchRecords()
      } else {
        console.error('❌ Save medical record failed:', data.error)
        toast.error(data.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('❌ Error saving medical record:', error)
      toast.error('Gagal menyimpan rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedicalRecord = (patient: Patient) => {
    setSelectedPatient(patient)
    setRecordForm({
      id: '',
      patientId: patient.id,
      doctorId: '',
      visitDate: new Date().toISOString().split('T')[0],
      complaint: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    })
    setEditRecordMode(false)
    setRecordDialogOpen(true)
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

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchTerm) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, searchTerm])

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
            Riwayat Rekam Medis ({records.length})
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
            
            <div className="flex gap-2">
              <Button 
                onClick={handleBatchUpdateMedicalRecords}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                disabled={loading}
              >
                <Hash className="h-4 w-4 mr-2" />
                {loading ? 'Memproses...' : 'Generate No. RM'}
              </Button>
              
              <ImportPatientsXLSX 
                accessToken={accessToken} 
                onImportComplete={() => {
                  fetchPatients()
                  toast.success('Data pasien berhasil diperbarui setelah import')
                }}
              />
              
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
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{patient.name}</span>
                              {(!patient.birthDate || !patient.phone || !patient.address) && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 w-fit">
                                  Perlu dilengkapi
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {patient.medicalRecordNumber || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={!patient.phone ? 'text-gray-400 italic' : ''}>
                              {patient.phone || 'Belum diisi'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={!patient.birthDate ? 'text-gray-400 italic' : ''}>
                              {patient.birthDate ? 
                                new Date(patient.birthDate).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric'
                                }) : 'Belum diisi'
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={!patient.birthDate ? 'text-gray-400 italic' : ''}>
                              {patient.birthDate ? `${calculateAge(patient.birthDate)} tahun` : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={!patient.gender ? 'text-gray-400 italic' : ''}>
                              {patient.gender || 'Belum diisi'}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className={`truncate block ${!patient.address ? 'text-gray-400 italic' : ''}`}>
                              {patient.address || 'Belum diisi'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPatient(patient)}
                                title="Edit data pasien"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddMedicalRecord(patient)}
                                title="Tambah rekam medis"
                                className="text-pink-600 hover:text-pink-800"
                              >
                                <Stethoscope className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
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

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pasien atau dokter..."
                value={recordSearchTerm}
                onChange={(e) => setRecordSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal Kunjungan</TableHead>
                      <TableHead>Keluhan</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Tindakan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-gray-300" />
                            <p>Belum ada rekam medis</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.patientName}</TableCell>
                          <TableCell>{record.doctorName}</TableCell>
                          <TableCell>
                            {new Date(record.visitDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="truncate block">{record.complaint}</span>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="truncate block">{record.diagnosis}</span>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="truncate block">{record.treatment}</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" title="Lihat detail">
                              <FileText className="h-4 w-4" />
                            </Button>
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
      </Tabs>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              {editRecordMode 
                ? `Perbarui catatan rekam medis untuk ${selectedPatient?.name}`
                : `Tambahkan catatan rekam medis baru untuk ${selectedPatient?.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleMedicalRecordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pasien</Label>
                <Input
                  value={selectedPatient?.name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-doctor">Dokter Pemeriksa *</Label>
                <Select 
                  value={recordForm.doctorId} 
                  onValueChange={(value) => {
                    const selectedDoc = doctors.find(d => d.id === value)
                    setRecordForm(prev => ({ 
                      ...prev, 
                      doctorId: value
                    }))
                  }}
                >
                  <SelectTrigger>
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
                      <SelectItem value="no-doctors" disabled>
                        Tidak ada dokter tersedia
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={recordForm.visitDate}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, visitDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-complaint">Keluhan Utama *</Label>
                <Input
                  id="record-complaint"
                  value={recordForm.complaint}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                  placeholder="Keluhan pasien..."
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="record-diagnosis">Diagnosis *</Label>
                <Textarea
                  id="record-diagnosis"
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Diagnosis dokter..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-treatment">Tindakan *</Label>
                <Textarea
                  id="record-treatment"
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Tindakan yang diberikan..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-prescription">Resep Obat</Label>
                <Textarea
                  id="record-prescription"
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                  placeholder="Resep obat dan dosis..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-notes">Catatan Tambahan</Label>
                <Textarea
                  id="record-notes"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan tambahan..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setRecordDialogOpen(false)
                  setSelectedPatient(null)
                }}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !recordForm.doctorId}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {loading ? 'Menyimpan...' : (editRecordMode ? 'Perbarui' : 'Simpan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}