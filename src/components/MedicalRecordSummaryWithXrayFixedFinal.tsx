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

export function MedicalRecordSummaryWithXrayFixedFinal({ accessToken }: MedicalRecordSummaryWithXrayProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [patientsLoaded, setPatientsLoaded] = useState(false)
  const [doctorsLoaded, setDoctorsLoaded] = useState(false)

  // X-ray related states
  const [xrayImages, setXrayImages] = useState<XrayImage[]>([])
  const [selectedXrayImage, setSelectedXrayImage] = useState<XrayImage | null>(null)
  const [xrayDialogOpen, setXrayDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewerImage, setViewerImage] = useState<XrayImage | null>(null)
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)

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
  
  // Form state for medical record with proper typing
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

  // Debug effect to monitor form state
  useEffect(() => {
    console.log('📋 Record form state updated:', recordForm)
  }, [recordForm])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (accessToken && patients.length === 0 && medicalRecords.length === 0) {
      console.log('Access token available and no data loaded, fetching...')
      fetchInitialData()
    }
  }, [accessToken])

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
      
      // Clean up state
      setMedicalRecords([])
      setSelectedPatient(null)
      setPatientSummary(null)
      setXrayImages([])
      setRecordDialogOpen(false)
      setEditRecordMode(false)
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
      
      // Reset form data
      setRecordForm({
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
      
      // Increased timeout for initial load
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 25000) // 25 seconds
      )
      
      // Fetch data with staggered approach to avoid overwhelming the server
      setLoadingProgress('Memuat data pasien...')
      console.log('📥 Fetching patients first...')
      const patientsPromise = fetchPatients()
      
      // Wait a bit before fetching doctors to stagger the requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLoadingProgress('Memuat data dokter...')
      console.log('👨‍⚕️ Fetching doctors...')
      const doctorsPromise = fetchDoctors()
      
      const dataPromise = Promise.all([patientsPromise, doctorsPromise])
      
      await Promise.race([dataPromise, timeoutPromise])
      setLoadingProgress('Data berhasil dimuat')
      console.log('✅ Initial data fetch completed successfully')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      if (error.message === 'Data fetch timeout') {
        setLoadingProgress('Timeout - melanjutkan dengan data yang tersedia')
        toast.error('Loading data timeout. Data mungkin masih dimuat di background.')
      } else {
        setLoadingProgress('Error - mencoba memuat data')
        toast.error('Gagal memuat data')
      }
      
      // Don't clear state on timeout - let individual fetch functions handle retries
      console.log('🔄 Allowing individual fetch functions to handle retries')
    } finally {
      // Delay setting loading to false to allow background retries
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress('')
        console.log('✅ Loading state cleared')
      }, 3000)
    }
  }

  const fetchPatients = async (retryCount = 0) => {
    const maxRetries = 3
    const baseTimeout = 10000 // 10 seconds for initial load
    
    try {
      console.log(`Fetching patients (attempt ${retryCount + 1}/${maxRetries + 1}) with accessToken:`, accessToken ? 'Present' : 'Missing')
      
      if (!accessToken) {
        console.error('No access token available')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        return
      }

      const controller = new AbortController()
      const timeout = baseTimeout + (retryCount * 5000) // Increase timeout with each retry
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Patients loaded successfully:', data.patients?.length || 0, 'patients')
        setPatients(data.patients || [])
        setPatientsLoaded(true)
        setLoadingProgress('Pasien berhasil dimuat')
      } else {
        if (response.status === 401) {
          console.error('Unauthorized access - token may be invalid')
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          console.error('Failed to fetch patients:', response.status)
          toast.error(`Gagal memuat data pasien (${response.status})`)
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Fetch patients timeout on attempt ${retryCount + 1}`)
        
        if (retryCount < maxRetries) {
          console.log(`Retrying patients fetch in 2 seconds... (${retryCount + 1}/${maxRetries})`)
          toast.error(`Timeout loading patients. Mencoba lagi... (${retryCount + 1}/${maxRetries})`)
          
          setTimeout(() => {
            fetchPatients(retryCount + 1)
          }, 2000)
        } else {
          console.error('All retry attempts failed for patients')
          toast.error('Gagal memuat data pasien setelah beberapa percobaan. Silakan refresh halaman.')
        }
      } else {
        console.error('Error fetching patients:', error)
        toast.error('Terjadi kesalahan saat memuat data pasien')
      }
    }
  }

  const fetchDoctors = async (retryCount = 0) => {
    const maxRetries = 3
    const baseTimeout = 10000 // 10 seconds for initial load
    
    try {
      console.log(`Fetching doctors (attempt ${retryCount + 1}/${maxRetries + 1})`)
      
      if (!accessToken) {
        console.error('No access token available for doctors')
        return
      }

      const controller = new AbortController()
      const timeout = baseTimeout + (retryCount * 5000) // Increase timeout with each retry
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Doctors loaded successfully:', data.doctors?.length || 0, 'doctors')
        setDoctors(cleanDoctorNames(data.doctors || []))
        setDoctorsLoaded(true)
        setLoadingProgress('Dokter berhasil dimuat')
      } else {
        console.error('Failed to fetch doctors:', response.status)
        if (response.status === 401) {
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          toast.error(`Gagal memuat data dokter (${response.status})`)
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Fetch doctors timeout on attempt ${retryCount + 1}`)
        
        if (retryCount < maxRetries) {
          console.log(`Retrying doctors fetch in 2 seconds... (${retryCount + 1}/${maxRetries})`)
          toast.error(`Timeout loading doctors. Mencoba lagi... (${retryCount + 1}/${maxRetries})`)
          
          setTimeout(() => {
            fetchDoctors(retryCount + 1)
          }, 2000)
        } else {
          console.error('All retry attempts failed for doctors')
          toast.error('Gagal memuat data dokter setelah beberapa percobaan. Silakan refresh halaman.')
          // Set empty doctors to prevent infinite loading
          setDoctors([])
        }
      } else {
        console.error('Error fetching doctors:', error)
        toast.error('Terjadi kesalahan saat memuat data dokter')
        setDoctors([])
      }
    }
  }

  // CRUD Functions for Medical Records
  const handleAddRecord = () => {
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu')
      return
    }
    
    setEditRecordMode(false)
    const newForm = {
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
    }
    
    console.log('🆕 Setting up new record form:', newForm)
    setRecordForm(newForm)
    setRecordDialogOpen(true)
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setEditRecordMode(true)
    const editForm = {
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      doctorName: record.doctorName || '',
      visitDate: record.visitDate.split('T')[0],
      complaint: record.complaint,
      examination: record.examination,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes
    }
    
    console.log('✏️ Setting up edit record form:', editForm)
    setRecordForm(editForm)
    setRecordDialogOpen(true)
  }

  // Enhanced handler function for doctor selection in form
  const handleDoctorSelect = (doctorId: string) => {
    console.log('🩺 Doctor selected in form:', doctorId)
    
    // Find the selected doctor to get the name
    const selectedDoctor = doctors.find(doctor => doctor.id === doctorId)
    console.log('🩺 Selected doctor details:', selectedDoctor)
    
    if (selectedDoctor) {
      const updatedForm = {
        ...recordForm,
        doctorId: doctorId,
        doctorName: selectedDoctor.name || ''
      }
      
      console.log('📋 Updating record form with doctor:', updatedForm)
      setRecordForm(updatedForm)
      
      // Show success message
      toast.success(`Dokter ${selectedDoctor.name} dipilih`)
    } else {
      console.error('❌ Doctor not found in doctors list')
      toast.error('Dokter tidak ditemukan')
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
        
        // Reset form
        setRecordForm({
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
        
        // Refresh data if needed
        // TODO: Add refresh logic here
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSummaryLoading(true)
    
    try {
      console.log('Patient selected:', patient.name, 'ID:', patient.id)
      setSelectedPatient(patient)
      // TODO: Add patient summary generation logic
    } catch (error) {
      console.error('Error in handleSelectPatient:', error)
      toast.error('Gagal memuat data pasien')
    } finally {
      setSummaryLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">{loadingProgress || 'Memuat data...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-800 mb-2">Rekapan Rekam Medis dengan X-Ray</h1>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Summary and Records Panel */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-pink-600" />
                      Informasi Pasien
                    </div>
                    <div className="flex gap-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-pink-600">Nama Pasien</p>
                      <p className="font-medium text-pink-800">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pink-600">Nomor Rekam Medis</p>
                      <p className="font-medium text-pink-800">{selectedPatient.medicalRecordNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pink-600">Nomor Telepon</p>
                      <p className="font-medium text-pink-800">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-pink-600">Tanggal Lahir</p>
                      <p className="font-medium text-pink-800">{selectedPatient.birthDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pink-600" />
                    Riwayat Rekam Medis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                    <p className="text-pink-600">Belum ada rekam medis</p>
                    <p className="text-sm text-pink-500 mt-2">Klik "Tambah Rekam Medis" untuk menambah data</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="lg:col-span-2">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Users className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                  <p className="text-lg text-pink-600 mb-2">Pilih Pasien</p>
                  <p className="text-pink-500">Pilih pasien dari daftar untuk melihat rekam medis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-600" />
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient && (
                <>Pasien: {selectedPatient.name} ({selectedPatient.medicalRecordNumber})</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={recordForm.visitDate}
                  onChange={(e) => setRecordForm(prev => ({...prev, visitDate: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                />
              </div>

              <div className="space-y-2">
                <Label>Dokter Pemeriksa *</Label>
                <DoctorSelector
                  doctors={doctors}
                  selectedDoctorId={recordForm.doctorId}
                  onDoctorSelect={handleDoctorSelect}
                  placeholder="Pilih Dokter"
                  className="w-full"
                />
                {/* Debug info */}
                <div className="text-xs text-gray-500">
                  Debug: doctorId = "{recordForm.doctorId}", 
                  doctors count = {doctors.length}
                  {recordForm.doctorId && (
                    <>, selected = {doctors.find(d => d.id === recordForm.doctorId)?.name || 'NOT FOUND'}</>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaint">Keluhan Utama *</Label>
                <Textarea
                  id="complaint"
                  placeholder="Masukkan keluhan utama pasien..."
                  value={recordForm.complaint}
                  onChange={(e) => setRecordForm(prev => ({...prev, complaint: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examination">Pemeriksaan</Label>
                <Textarea
                  id="examination"
                  placeholder="Hasil pemeriksaan..."
                  value={recordForm.examination}
                  onChange={(e) => setRecordForm(prev => ({...prev, examination: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>
            </div>

            {/* Medical Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Diagnosis..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm(prev => ({...prev, diagnosis: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Perawatan/Tindakan</Label>
                <Textarea
                  id="treatment"
                  placeholder="Perawatan yang diberikan..."
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm(prev => ({...prev, treatment: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Resep/Obat</Label>
                <Textarea
                  id="prescription"
                  placeholder="Resep obat atau instruksi..."
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm(prev => ({...prev, prescription: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm(prev => ({...prev, notes: e.target.value}))}
                  className="border-pink-200 focus:border-pink-400"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setRecordDialogOpen(false)}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Batal
            </Button>
            <Button
              onClick={saveRecord}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {editRecordMode ? 'Update' : 'Simpan'} Rekam Medis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}