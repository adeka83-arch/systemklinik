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

function PatientsWithImportFeatureComplete({ accessToken }: PatientsProps) {
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
  const [showImport, setShowImport] = useState(false)
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
        
        // Debug: Log sample patient data to check birthDate and gender
        if (data.patients && data.patients.length > 0) {
          const sample = data.patients[0]
          console.log('📋 Sample patient data:', {
            name: sample.name,
            birthDate: sample.birthDate,
            gender: sample.gender,
            hasValidBirthDate: !!sample.birthDate,
            hasValidGender: !!sample.gender
          })
        }
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

  const calculateAge = (birthDate: string) => {
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

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient =>
      (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchLower))
    )
  }, [patients, searchTerm])

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
                                      onClick={() => resetPatientForm()}
                                      size="sm" 
                                      className="bg-pink-600 hover:bg-pink-700"
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Tambah Manual
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
                          <TableCell>{patient.phone}</TableCell>
                          <TableCell>
                            {(() => {
                               const age = calculateAge(patient.birthDate)
                               if (age === null) return '-'
                               return `${age} th`
                             })()}
                          </TableCell>
                          <TableCell>{formatGender(patient.gender)}</TableCell>
                          <TableCell className="max-w-xs truncate">{patient.address}</TableCell>
                          <TableCell>
                            {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID')}
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

        <TabsContent value="schedules" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Fitur jadwal kontrol akan ditampilkan di sini</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PatientsWithImportFeatureComplete