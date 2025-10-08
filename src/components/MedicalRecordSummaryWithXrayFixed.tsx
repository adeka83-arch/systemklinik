import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  FileText, 
  Calendar, 
  User, 
  Stethoscope,
  ClipboardList,
  History,
  Eye,
  AlertCircle,
  Activity,
  Plus,
  Edit,
  Trash2,
  Printer,
  Users,
  Filter,
  Download,
  ChevronDown,
  Upload,
  Image,
  X,
  Camera,
  FileImage,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Phone,
  MapPin,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'

interface Patient {
  id: string
  name: string
  medicalRecordNumber: string
  phone: string
  birthDate: string
  gender: string
  address: string
}

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  visitDate: string
  complaint: string
  examination: string
  diagnosis: string
  treatment: string
  notes: string
  doctorId: string
  doctorName: string
  medicalRecordNumber: string
  prescription?: string
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

interface PatientSummary {
  patient: Patient
  medicalRecords: MedicalRecord[]
  totalVisits: number
  lastVisit: string
  commonDiagnoses: string[]
  treatingDoctors: string[]
}

interface XrayImage {
  id: string
  patientId: string
  patientName: string
  fileName: string
  fileUrl: string
  uploadDate: string
  description: string
  type: 'panoramic' | 'periapical' | 'bitewing' | 'cephalometric' | 'other'
  created_at: string
}

interface MedicalRecordSummaryWithXrayProps {
  accessToken: string
}

export function MedicalRecordSummaryWithXrayFixed({ accessToken }: MedicalRecordSummaryWithXrayProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')

  // X-ray related states
  const [xrayImages, setXrayImages] = useState<XrayImage[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewerImage, setViewerImage] = useState<XrayImage | null>(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    type: 'panoramic' as XrayImage['type']
  })

  // Dialog states for medical records
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null)
  
  // Form state for medical record
  const [recordForm, setRecordForm] = useState({
    id: '',
    patientId: '',
    doctorId: '',
    doctorName: '',
    visitDate: '',
    complaint: '',
    examination: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      if (!accessToken) {
        console.error('Cannot fetch data: No access token available')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        setLoading(false)
        return
      }
      
      console.log('Starting initial data fetch with valid access token')
      
      setLoadingProgress('Memuat data...')
      await Promise.all([
        fetchPatients(),
        fetchDoctors()
      ])
      
      setLoadingProgress('Data berhasil dimuat')
      console.log('✅ Initial data fetch completed successfully')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      setLoadingProgress('Error - mencoba memuat data')
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
      setLoadingProgress('')
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
        console.log('✅ Patients loaded:', data.patients?.length || 0)
      } else {
        console.error('Failed to fetch patients:', response.status)
        toast.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Terjadi kesalahan saat memuat data pasien')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(cleanDoctorNames(data.doctors || []))
        console.log('✅ Doctors loaded:', data.doctors?.length || 0)
      } else {
        console.error('Failed to fetch doctors:', response.status)
        toast.error('Gagal memuat data dokter')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Terjadi kesalahan saat memuat data dokter')
    }
  }

  const fetchMedicalRecords = async (patientId: string): Promise<MedicalRecord[]> => {
    try {
      const response = await fetch(`${serverUrl}/medical-records?patientId=${patientId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const records = data.records || []
        setMedicalRecords(records)
        return records
      } else {
        console.error('Failed to fetch medical records:', response.status)
        setMedicalRecords([])
        return []
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
      setMedicalRecords([])
      return []
    }
  }

  const fetchXrayImages = async (patientId: string): Promise<XrayImage[]> => {
    try {
      const response = await fetch(`${serverUrl}/xray-images?patientId=${patientId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const images = data.images || []
        setXrayImages(images)
        return images
      } else {
        console.error('Failed to fetch X-ray images:', response.status)
        setXrayImages([])
        return []
      }
    } catch (error) {
      console.error('Error fetching X-ray images:', error)
      setXrayImages([])
      return []
    }
  }

  const generatePatientSummary = (patient: Patient, records: MedicalRecord[]): PatientSummary => {
    const lastVisit = records.length > 0 
      ? records.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0].visitDate
      : ''

    const diagnoses = records.map(record => record.diagnosis).filter(diagnosis => diagnosis && diagnosis.trim())
    const commonDiagnoses = [...new Set(diagnoses)]

    const doctorNames = records.map(record => record.doctorName).filter(doctor => doctor && doctor.trim())
    const treatingDoctors = [...new Set(doctorNames)]

    return {
      patient,
      medicalRecords: records.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()),
      totalVisits: records.length,
      lastVisit,
      commonDiagnoses: commonDiagnoses.slice(0, 10),
      treatingDoctors: treatingDoctors.slice(0, 10)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSummaryLoading(true)
    
    try {
      console.log('Patient selected:', patient.name, 'ID:', patient.id)
      
      setSelectedPatient(patient)
      
      // Fetch patient data
      const [fetchedRecords] = await Promise.all([
        fetchMedicalRecords(patient.id),
        fetchXrayImages(patient.id)
      ])
      
      // Generate summary
      const summary = generatePatientSummary(patient, fetchedRecords)
      setPatientSummary(summary)
      
      console.log('Patient selection completed for:', patient.name)
    } catch (error) {
      console.error('Error in handleSelectPatient:', error)
      toast.error('Gagal memuat data pasien')
    } finally {
      setSummaryLoading(false)
    }
  }

  const saveRecord = async () => {
    try {
      if (!selectedPatient) {
        toast.error('Pasien tidak dipilih')
        return
      }

      if (!recordForm.doctorId || !recordForm.visitDate || !recordForm.complaint) {
        toast.error('Harap isi semua field yang required')
        return
      }

      const recordData = {
        ...recordForm,
        patientName: selectedPatient.name,
        medicalRecordNumber: selectedPatient.medicalRecordNumber
      }

      const url = editRecordMode 
        ? `${serverUrl}/medical-records/${recordForm.id}`
        : `${serverUrl}/medical-records`
      
      const method = editRecordMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      })

      if (response.ok) {
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil ditambahkan')
        setRecordDialogOpen(false)
        
        // Refresh medical records
        if (selectedPatient) {
          const freshRecords = await fetchMedicalRecords(selectedPatient.id)
          const summary = generatePatientSummary(selectedPatient, freshRecords)
          setPatientSummary(summary)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleUploadXray = async () => {
    try {
      if (!uploadForm.file || !selectedPatient) {
        toast.error('Pilih file dan pastikan pasien telah dipilih')
        return
      }

      setUploadingFile(true)

      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('patientId', selectedPatient.id)
      formData.append('patientName', selectedPatient.name)
      formData.append('description', uploadForm.description)
      formData.append('type', uploadForm.type)

      const response = await fetch(`${serverUrl}/xray-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success('X-ray berhasil diupload')
        setUploadDialogOpen(false)
        
        // Reset form
        setUploadForm({
          file: null,
          description: '',
          type: 'panoramic'
        })
        
        // Refresh X-ray images
        await fetchXrayImages(selectedPatient.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal mengupload X-ray')
      }
    } catch (error) {
      console.error('Error uploading X-ray:', error)
      toast.error('Terjadi kesalahan saat mengupload')
    } finally {
      setUploadingFile(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // X-ray types with unique keys
  const xrayTypes = [
    { value: 'panoramic', label: 'Panoramic' },
    { value: 'periapical', label: 'Periapical' },
    { value: 'bitewing', label: 'Bitewing' },
    { value: 'cephalometric', label: 'Cephalometric' },
    { value: 'other', label: 'Lainnya' }
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingProgress || 'Memuat data...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-800">Rekam Medis & X-Ray</h2>
        <Button onClick={() => fetchInitialData()} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients">
            <Users className="h-4 w-4 mr-2" />
            Pilih Pasien ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!selectedPatient}>
            <FileText className="h-4 w-4 mr-2" />
            Ringkasan Pasien
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, telepon, atau nomor RM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                      <TableHead>Nama</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">
                            {searchTerm ? `Tidak ada pasien yang cocok dengan "${searchTerm}"` : 'Tidak ada data pasien'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {patient.medicalRecordNumber || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{patient.phone || '-'}</TableCell>
                          <TableCell>{patient.gender || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{patient.address || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectPatient(patient)}
                              className={selectedPatient?.id === patient.id ? 'bg-pink-50 border-pink-200' : ''}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {selectedPatient?.id === patient.id ? 'Terpilih' : 'Pilih'}
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

        <TabsContent value="summary" className="space-y-4">
          {selectedPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pink-800">Informasi Pasien</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedPatient(null)
                          setPatientSummary(null)
                          setMedicalRecords([])
                          setXrayImages([])
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Batal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Nama</Label>
                        <p className="font-medium">{selectedPatient.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">No. RM</Label>
                        <p className="font-mono">{selectedPatient.medicalRecordNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Telepon</Label>
                        <p>{selectedPatient.phone || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                        <p>{selectedPatient.gender || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Alamat</Label>
                      <p>{selectedPatient.address || '-'}</p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => {
                            setEditRecordMode(false)
                            setRecordForm({
                              id: '',
                              patientId: selectedPatient.id,
                              doctorId: '',
                              doctorName: '',
                              visitDate: new Date().toISOString().split('T')[0],
                              complaint: '',
                              examination: '',
                              diagnosis: '',
                              treatment: '',
                              prescription: '',
                              notes: ''
                            })
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Rekam Medis
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis'}
                            </DialogTitle>
                            <DialogDescription>
                              {editRecordMode ? 'Edit catatan rekam medis' : 'Tambahkan catatan rekam medis baru'} untuk {selectedPatient.name}
                            </DialogDescription>
                          </DialogHeader>

                          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveRecord(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="doctor">Dokter *</Label>
                                <Select 
                                  value={recordForm.doctorId} 
                                  onValueChange={(value) => {
                                    const selectedDoctor = doctors.find(doc => doc.id === value)
                                    setRecordForm(prev => ({ 
                                      ...prev, 
                                      doctorId: value,
                                      doctorName: selectedDoctor?.name || ''
                                    }))
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih dokter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {doctors.map(doctor => (
                                      <SelectItem key={doctor.id} value={doctor.id}>
                                        {doctor.name} - {doctor.specialization}
                                      </SelectItem>
                                    ))}
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
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="complaint">Keluhan *</Label>
                              <Textarea
                                id="complaint"
                                value={recordForm.complaint}
                                onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                                placeholder="Masukkan keluhan pasien..."
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="examination">Pemeriksaan</Label>
                              <Textarea
                                id="examination"
                                value={recordForm.examination}
                                onChange={(e) => setRecordForm(prev => ({ ...prev, examination: e.target.value }))}
                                placeholder="Hasil pemeriksaan..."
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis</Label>
                                <Textarea
                                  id="diagnosis"
                                  value={recordForm.diagnosis}
                                  onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                                  placeholder="Diagnosis..."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="treatment">Penanganan</Label>
                                <Textarea
                                  id="treatment"
                                  value={recordForm.treatment}
                                  onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                                  placeholder="Tindakan yang dilakukan..."
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="prescription">Resep</Label>
                              <Textarea
                                id="prescription"
                                value={recordForm.prescription}
                                onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                                placeholder="Resep obat..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="notes">Catatan Tambahan</Label>
                              <Textarea
                                id="notes"
                                value={recordForm.notes}
                                onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Catatan tambahan..."
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                                Batal
                              </Button>
                              <Button type="submit">
                                {editRecordMode ? 'Perbarui' : 'Simpan'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload X-Ray
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload X-Ray</DialogTitle>
                            <DialogDescription>
                              Upload gambar X-Ray untuk {selectedPatient.name}
                            </DialogDescription>
                          </DialogHeader>

                          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUploadXray(); }}>
                            <div className="space-y-2">
                              <Label htmlFor="xrayFile">File X-Ray *</Label>
                              <Input
                                id="xrayFile"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  setUploadForm(prev => ({ ...prev, file }))
                                }}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="xrayType">Jenis X-Ray</Label>
                              <Select 
                                value={uploadForm.type} 
                                onValueChange={(value: XrayImage['type']) => 
                                  setUploadForm(prev => ({ ...prev, type: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih jenis X-Ray" />
                                </SelectTrigger>
                                <SelectContent>
                                  {xrayTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Deskripsi</Label>
                              <Textarea
                                id="description"
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Deskripsi X-Ray..."
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                Batal
                              </Button>
                              <Button type="submit" disabled={uploadingFile}>
                                {uploadingFile ? 'Mengupload...' : 'Upload'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-pink-800">Rekam Medis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Memuat rekam medis...</p>
                      </div>
                    ) : medicalRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada rekam medis</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {medicalRecords.map((record) => (
                          <Card key={record.id} className="border-l-4 border-l-pink-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-medium text-pink-700">{record.doctorName}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(record.visitDate).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditRecord(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Rekam Medis</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus rekam medis ini? Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`${serverUrl}/medical-records/${record.id}`, {
                                                method: 'DELETE',
                                                headers: {
                                                  'Authorization': `Bearer ${accessToken}`,
                                                  'Content-Type': 'application/json'
                                                }
                                              })

                                              if (response.ok) {
                                                toast.success('Rekam medis berhasil dihapus')
                                                if (selectedPatient) {
                                                  const freshRecords = await fetchMedicalRecords(selectedPatient.id)
                                                  const summary = generatePatientSummary(selectedPatient, freshRecords)
                                                  setPatientSummary(summary)
                                                }
                                              } else {
                                                const errorData = await response.json()
                                                toast.error(errorData.error || 'Gagal menghapus rekam medis')
                                              }
                                            } catch (error) {
                                              console.error('Error deleting record:', error)
                                              toast.error('Terjadi kesalahan saat menghapus data')
                                            }
                                          }}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Keluhan</Label>
                                  <p className="text-sm">{record.complaint}</p>
                                </div>
                                {record.examination && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Pemeriksaan</Label>
                                    <p className="text-sm">{record.examination}</p>
                                  </div>
                                )}
                                {record.diagnosis && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Diagnosis</Label>
                                    <p className="text-sm">{record.diagnosis}</p>
                                  </div>
                                )}
                                {record.treatment && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Penanganan</Label>
                                    <p className="text-sm">{record.treatment}</p>
                                  </div>
                                )}
                                {record.prescription && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Resep</Label>
                                    <p className="text-sm">{record.prescription}</p>
                                  </div>
                                )}
                                {record.notes && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Catatan</Label>
                                    <p className="text-sm">{record.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-pink-800">X-Ray Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {xrayImages.length === 0 ? (
                    <div className="text-center py-8">
                      <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada gambar X-Ray</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload X-Ray
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {xrayImages.map((image) => (
                        <div key={image.id} className="border rounded-lg p-3">
                          <img 
                            src={image.fileUrl} 
                            alt={image.description}
                            className="w-full h-32 object-cover rounded mb-2 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setViewerImage(image)
                              setImageViewerOpen(true)
                            }}
                          />
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {image.type}
                            </Badge>
                            <p className="text-sm font-medium">{image.fileName}</p>
                            <p className="text-xs text-gray-500">{image.description}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Silakan pilih pasien terlebih dahulu</p>
                <p className="text-sm text-gray-400 mt-2">
                  Kembali ke tab "Pilih Pasien" untuk memilih pasien
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewerImage?.fileName}</DialogTitle>
            <DialogDescription>
              {viewerImage?.description} - {viewerImage?.type}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center">
            {viewerImage && (
              <img 
                src={viewerImage.fileUrl} 
                alt={viewerImage.description}
                className="max-w-full max-h-96 object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}