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
  Search,
  Save,
  UserCheck,
  Clock,
  Clipboard,
  Pill,
  StickyNote
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { DoctorSelector } from './DoctorSelector'
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
  examination?: string
  diagnosis: string
  treatment: string
  notes?: string
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

interface MedicalRecordFormProps {
  accessToken: string
}

export function MedicalRecordFormComplete({ accessToken }: MedicalRecordFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // X-ray related states
  const [xrayImages, setXrayImages] = useState<XrayImage[]>([])
  const [xrayDialogOpen, setXrayDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedXrayImage, setSelectedXrayImage] = useState<XrayImage | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    type: 'panoramic' as XrayImage['type']
  })

  // Dialog states for medical records
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  
  // Form state for medical record
  const [recordForm, setRecordForm] = useState({
    id: '',
    patientId: '',
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

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      if (!accessToken) {
        toast.error('Sesi tidak valid. Silakan login ulang.')
        return
      }
      
      console.log('🔄 Loading initial data...')
      
      await Promise.all([
        fetchPatients(),
        fetchDoctors(),
        fetchMedicalRecords()
      ])
      
      console.log('✅ Initial data loaded successfully')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
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
        throw new Error(`Failed to fetch patients: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Gagal memuat data pasien')
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
        throw new Error(`Failed to fetch doctors: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Gagal memuat data dokter')
    }
  }

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch(`${serverUrl}/medical-records`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMedicalRecords(data.records || [])
        console.log('✅ Medical records loaded:', data.records?.length || 0)
      } else {
        throw new Error(`Failed to fetch medical records: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
      toast.error('Gagal memuat rekam medis')
    }
  }

  const fetchXrayImages = async (patientId: string) => {
    try {
      const response = await fetch(`${serverUrl}/xray-images?patientId=${patientId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setXrayImages(data.images || [])
        console.log('✅ X-ray images loaded:', data.images?.length || 0)
      } else {
        console.error('Failed to fetch X-ray images:', response.status)
      }
    } catch (error) {
      console.error('Error fetching X-ray images:', error)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    console.log('📋 Patient selected:', patient.name)
    setSelectedPatient(patient)
    
    // Load patient's medical records and X-ray images
    const patientRecords = medicalRecords.filter(record => record.patientId === patient.id)
    console.log('📋 Patient records found:', patientRecords.length)
    
    // Fetch X-ray images for this patient
    await fetchXrayImages(patient.id)
  }

  const handleAddRecord = () => {
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu')
      return
    }
    
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
    setRecordDialogOpen(true)
  }

  const handleDoctorSelect = (doctorId: string) => {
    const selectedDoctor = doctors.find(doctor => doctor.id === doctorId)
    if (selectedDoctor) {
      setRecordForm(prev => ({
        ...prev,
        doctorId: doctorId,
        doctorName: selectedDoctor.name
      }))
      console.log('🩺 Doctor selected:', selectedDoctor.name)
    }
  }

  const saveRecord = async () => {
    try {
      if (!selectedPatient) {
        toast.error('Pasien tidak dipilih')
        return
      }

      if (!recordForm.doctorId || !recordForm.visitDate || !recordForm.complaint || !recordForm.diagnosis || !recordForm.treatment) {
        toast.error('Harap isi semua field yang required (*)')
        return
      }

      setSaving(true)

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
        
        // Reset form
        setRecordForm({
          id: '',
          patientId: '',
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
        
        // Refresh medical records
        await fetchMedicalRecords()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handleXrayUpload = async () => {
    if (!selectedPatient || !uploadForm.file) {
      toast.error('Pilih pasien dan file X-ray terlebih dahulu')
      return
    }

    try {
      setUploadingFile(true)

      // Simulate X-ray upload by creating a fake X-ray record
      const fakeXrayRecord = {
        id: `xray_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        fileName: uploadForm.file.name,
        fileUrl: URL.createObjectURL(uploadForm.file), // Create local URL for demo
        uploadDate: new Date().toISOString(),
        description: uploadForm.description || `X-ray ${uploadForm.type}`,
        type: uploadForm.type,
        created_at: new Date().toISOString()
      }

      // Add to local state
      setXrayImages(prev => [fakeXrayRecord, ...prev])
      
      toast.success('X-ray berhasil diupload (Demo Mode)')
      setXrayDialogOpen(false)
      
      // Reset upload form
      setUploadForm({
        file: null,
        description: '',
        type: 'panoramic'
      })
      
    } catch (error) {
      console.error('Error uploading X-ray:', error)
      toast.error('Terjadi kesalahan saat upload X-ray')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      
      setUploadForm(prev => ({ ...prev, file }))
      console.log('📎 File selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB')
    }
  }

  // Medical Record Actions
  const handleEditRecord = (record: MedicalRecord) => {
    setEditRecordMode(true)
    setRecordForm({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      doctorName: record.doctorName,
      visitDate: record.visitDate,
      complaint: record.complaint,
      examination: record.examination || '',
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes || ''
    })
    setRecordDialogOpen(true)
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rekam medis ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/medical-records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Rekam medis berhasil dihapus')
        await fetchMedicalRecords()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus rekam medis')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Terjadi kesalahan saat menghapus rekam medis')
    }
  }

  // X-ray Actions
  const handleDeleteXray = async (imageId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar X-ray ini?')) {
      return
    }

    try {
      // Try server delete first
      const response = await fetch(`${serverUrl}/xray-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Gambar X-ray berhasil dihapus')
      } else {
        // If server fails, remove from local state (demo mode)
        toast.success('Gambar X-ray berhasil dihapus (Demo Mode)')
      }
      
      // Remove from local state
      setXrayImages(prev => prev.filter(img => img.id !== imageId))
      
    } catch (error) {
      console.error('Error deleting X-ray:', error)
      // Fallback to local deletion
      setXrayImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Gambar X-ray berhasil dihapus (Demo Mode)')
    }
  }

  const handleViewXray = (image: XrayImage) => {
    setSelectedXrayImage(image)
    setImageViewerOpen(true)
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const patientRecords = selectedPatient 
    ? medicalRecords.filter(record => record.patientId === selectedPatient.id)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-pink-800 mb-2">Rekam Medis Pasien</h1>
        <p className="text-pink-600">Kelola rekam medis pasien dengan fitur X-Ray terintegrasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Pilih Pasien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                  <Input
                    placeholder="Cari nama atau nomor RM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-pink-200 focus:border-pink-400"
                  />
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-pink-50 hover:border-pink-300 ${
                          selectedPatient?.id === patient.id 
                            ? 'bg-pink-50 border-pink-300 shadow-sm' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-pink-800 truncate">{patient.name}</p>
                            <p className="text-sm text-pink-600">{patient.medicalRecordNumber}</p>
                            <p className="text-xs text-pink-500">{patient.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredPatients.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-8 h-8 text-pink-300 mx-auto mb-2" />
                        <p className="text-pink-500 text-sm">
                          {searchTerm ? 'Tidak ada pasien yang cocok' : 'Belum ada data pasien'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Detail and Records Panel */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-pink-600" />
                      {selectedPatient.name}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setXrayDialogOpen(true)}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload X-ray
                      </Button>
                      <Button
                        onClick={handleAddRecord}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Rekam Medis
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm text-pink-600">No. RM</p>
                        <p className="font-medium text-pink-800">{selectedPatient.medicalRecordNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm text-pink-600">Telepon</p>
                        <p className="font-medium text-pink-800">{selectedPatient.phone || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm text-pink-600">Gender</p>
                        <p className="font-medium text-pink-800">{selectedPatient.gender || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm text-pink-600">Tanggal Lahir</p>
                        <p className="font-medium text-pink-800">
                          {selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm text-pink-600">Alamat</p>
                        <p className="font-medium text-pink-800 truncate">{selectedPatient.address || '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Records and X-ray */}
              <Tabs defaultValue="records" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="records" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
                    <FileText className="w-4 h-4 mr-2" />
                    Rekam Medis ({patientRecords.length})
                  </TabsTrigger>
                  <TabsTrigger value="xray" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                    <Camera className="w-4 h-4 mr-2" />
                    X-Ray ({xrayImages.length})
                  </TabsTrigger>
                </TabsList>

                {/* Medical Records Tab */}
                <TabsContent value="records">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pink-600" />
                        Riwayat Rekam Medis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patientRecords.length > 0 ? (
                        <div className="space-y-4">
                          {patientRecords.map((record) => (
                            <Card key={record.id} className="border-pink-100">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-pink-700 border-pink-200">
                                      {new Date(record.visitDate).toLocaleDateString('id-ID')}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                      {record.doctorName}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditRecord(record)}
                                      title="Edit rekam medis"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteRecord(record.id)}
                                      title="Hapus rekam medis"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-pink-600 font-medium">Keluhan:</p>
                                    <p className="text-gray-700">{record.complaint}</p>
                                  </div>
                                  <div>
                                    <p className="text-pink-600 font-medium">Diagnosis:</p>
                                    <p className="text-gray-700">{record.diagnosis}</p>
                                  </div>
                                  <div>
                                    <p className="text-pink-600 font-medium">Tindakan:</p>
                                    <p className="text-gray-700">{record.treatment}</p>
                                  </div>
                                  {record.prescription && (
                                    <div>
                                      <p className="text-pink-600 font-medium">Resep:</p>
                                      <p className="text-gray-700">{record.prescription}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {record.notes && (
                                  <div className="mt-3 pt-3 border-t border-pink-100">
                                    <p className="text-pink-600 font-medium text-sm">Catatan:</p>
                                    <p className="text-gray-700 text-sm">{record.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                          <p className="text-pink-600">Belum ada rekam medis</p>
                          <p className="text-sm text-pink-500 mt-2">Klik "Tambah Rekam Medis" untuk menambah data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* X-ray Tab */}
                <TabsContent value="xray">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        Gambar X-Ray
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {xrayImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {xrayImages.map((image) => (
                            <div key={image.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                              {/* Image Preview */}
                              <div 
                                className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
                                onClick={() => handleViewXray(image)}
                              >
                                {image.fileUrl ? (
                                  <img 
                                    src={image.fileUrl} 
                                    alt={image.description}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      // Fallback to icon if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <FileImage className="w-8 h-8 text-gray-400 hidden" />
                              </div>
                              
                              {/* Image Info */}
                              <div className="space-y-1">
                                <p className="text-sm font-medium truncate" title={image.description}>
                                  {image.description || 'X-Ray'}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{image.type}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex justify-between mt-3 pt-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewXray(image)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteXray(image.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Camera className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                          <p className="text-blue-600">Belum ada gambar X-Ray</p>
                          <p className="text-sm text-blue-500 mt-2">Klik "Upload X-ray" untuk menambah gambar</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Users className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                <p className="text-pink-600 text-lg">Pilih Pasien</p>
                <p className="text-pink-500 text-sm mt-2">Pilih pasien dari panel kiri untuk melihat rekam medis</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription>
              {editRecordMode ? 'Perbarui informasi rekam medis pasien' : 'Masukkan informasi rekam medis baru untuk pasien'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info Display */}
            {selectedPatient && (
              <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                <p className="text-sm text-pink-600 mb-1">Pasien:</p>
                <p className="font-medium text-pink-800">{selectedPatient.name}</p>
                <p className="text-sm text-pink-600">No. RM: {selectedPatient.medicalRecordNumber}</p>
              </div>
            )}

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctor">Dokter *</Label>
              <Select 
                value={recordForm.doctorId} 
                onValueChange={handleDoctorSelect}
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

            {/* Visit Date */}
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

            {/* Complaint */}
            <div className="space-y-2">
              <Label htmlFor="complaint">Keluhan Utama *</Label>
              <Textarea
                id="complaint"
                value={recordForm.complaint}
                onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                placeholder="Masukkan keluhan utama pasien..."
                required
              />
            </div>

            {/* Examination */}
            <div className="space-y-2">
              <Label htmlFor="examination">Pemeriksaan</Label>
              <Textarea
                id="examination"
                value={recordForm.examination}
                onChange={(e) => setRecordForm(prev => ({ ...prev, examination: e.target.value }))}
                placeholder="Hasil pemeriksaan klinis..."
              />
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Textarea
                id="diagnosis"
                value={recordForm.diagnosis}
                onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Diagnosis yang ditetapkan..."
                required
              />
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label htmlFor="treatment">Tindakan/Terapi *</Label>
              <Textarea
                id="treatment"
                value={recordForm.treatment}
                onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                placeholder="Tindakan atau terapi yang diberikan..."
                required
              />
            </div>

            {/* Prescription */}
            <div className="space-y-2">
              <Label htmlFor="prescription">Resep Obat</Label>
              <Textarea
                id="prescription"
                value={recordForm.prescription}
                onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                placeholder="Resep obat yang diberikan..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan atau follow-up..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRecordDialogOpen(false)}
              >
                Batal
              </Button>
              <Button 
                onClick={saveRecord}
                disabled={saving}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {saving ? 'Menyimpan...' : editRecordMode ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* X-ray Upload Dialog */}
      <Dialog open={xrayDialogOpen} onOpenChange={setXrayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload X-ray</DialogTitle>
            <DialogDescription>
              Upload gambar X-ray untuk pasien {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="xray-file">Pilih File X-ray *</Label>
              <Input
                id="xray-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {uploadForm.file && (
                <p className="text-sm text-green-600">
                  File dipilih: {uploadForm.file.name} ({Math.round(uploadForm.file.size / 1024)} KB)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Contoh: X-ray panoramic kontrol"
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Jenis X-ray *</Label>
              <Select 
                value={uploadForm.type} 
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value as XrayImage['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis X-ray" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panoramic">Panoramic</SelectItem>
                  <SelectItem value="periapical">Periapical</SelectItem>
                  <SelectItem value="bitewing">Bitewing</SelectItem>
                  <SelectItem value="cephalometric">Cephalometric</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview if file selected */}
            {uploadForm.file && (
              <div className="space-y-2">
                <Label>Preview:</Label>
                <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                  <img 
                    src={URL.createObjectURL(uploadForm.file)} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setXrayDialogOpen(false)}
                disabled={uploadingFile}
              >
                Batal
              </Button>
              <Button 
                onClick={handleXrayUpload}
                disabled={!uploadForm.file || uploadingFile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploadingFile ? 'Mengupload...' : 'Upload X-ray'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* X-ray Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview X-ray
            </DialogTitle>
            {selectedXrayImage && (
              <DialogDescription>
                {selectedXrayImage.description} - {selectedXrayImage.type} 
                ({new Date(selectedXrayImage.uploadDate).toLocaleDateString('id-ID')})
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedXrayImage && (
            <div className="space-y-4">
              {/* Image Display */}
              <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '70vh' }}>
                <img 
                  src={selectedXrayImage.fileUrl} 
                  alt={selectedXrayImage.description}
                  className="max-w-full max-h-full object-contain"
                  onError={() => toast.error('Gagal memuat gambar X-ray')}
                />
              </div>

              {/* Image Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Pasien:</p>
                  <p className="font-medium">{selectedXrayImage.patientName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Jenis:</p>
                  <p className="font-medium capitalize">{selectedXrayImage.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tanggal Upload:</p>
                  <p className="font-medium">{new Date(selectedXrayImage.uploadDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">File:</p>
                  <p className="font-medium">{selectedXrayImage.fileName}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => setImageViewerOpen(false)}
                >
                  Tutup
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setImageViewerOpen(false)
                    handleDeleteXray(selectedXrayImage.id)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus X-ray
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}