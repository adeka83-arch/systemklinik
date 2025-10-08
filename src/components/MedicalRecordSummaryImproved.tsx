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
  Search, 
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
  Users,
  Filter,
  Download,
  Printer,
  Image,
  X,
  Camera,
  FileImage,
  ZoomIn,
  Phone,
  MapPin,
  RefreshCw,
  UserCheck,
  Clock,
  ChevronRight,
  Heart,
  Shield,
  Award
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
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

interface MedicalRecordSummaryImprovedProps {
  accessToken: string
}

export function MedicalRecordSummaryImproved({ accessToken }: MedicalRecordSummaryImprovedProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [activeTab, setActiveTab] = useState('patients')

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
      
      setLoadingProgress('Memuat data pasien...')
      await fetchPatients()
      
      setLoadingProgress('Memuat data dokter...')
      await fetchDoctors()
      
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
      
      // Auto switch to summary tab
      setActiveTab('summary')
      
      console.log('Patient selection completed for:', patient.name)
    } catch (error) {
      console.error('Error in handleSelectPatient:', error)
      toast.error('Gagal memuat data pasien')
    } finally {
      setSummaryLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-pink-300 opacity-20 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-pink-600 font-medium">{loadingProgress || 'Memuat data...'}</p>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-pink-800 flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              Rekam Medis & X-Ray
            </h2>
            <p className="text-pink-600">Kelola dan lihat rekam medis pasien secara lengkap</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => fetchInitialData()} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Pasien</p>
              <p className="text-2xl font-bold text-pink-600">{patients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total Pasien</p>
                <p className="text-3xl font-bold text-blue-700">{patients.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Dokter Aktif</p>
                <p className="text-3xl font-bold text-green-700">{doctors.length}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium">Rekam Medis</p>
                <p className="text-3xl font-bold text-purple-700">{medicalRecords.length}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-medium">X-Ray Images</p>
                <p className="text-3xl font-bold text-orange-700">{xrayImages.length}</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Image className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-pink-50 p-1 rounded-xl">
          <TabsTrigger 
            value="patients" 
            className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            Pilih Pasien ({patients.length})
          </TabsTrigger>
          <TabsTrigger 
            value="summary" 
            disabled={!selectedPatient}
            className="data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ringkasan Pasien
            {selectedPatient && (
              <Badge variant="secondary" className="ml-2 bg-pink-100 text-pink-600">
                {selectedPatient.name.split(' ')[0]}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          {/* Enhanced Search */}
          <Card className="border-pink-200">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="🔍 Cari nama, telepon, atau nomor RM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 h-12 text-base border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchTerm && (
                <p className="text-sm text-gray-600 mt-2">
                  Menampilkan {filteredPatients.length} hasil dari "{searchTerm}"
                </p>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Patient Table */}
          <Card className="border-pink-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200">
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Pasien
                <Badge variant="secondary" className="bg-pink-100 text-pink-600">
                  {filteredPatients.length} pasien
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Nama Pasien</TableHead>
                      <TableHead className="font-semibold text-gray-700">No. RM</TableHead>
                      <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
                      <TableHead className="font-semibold text-gray-700">Gender</TableHead>
                      <TableHead className="font-semibold text-gray-700">Alamat</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="space-y-3">
                            <Users className="h-12 w-12 text-gray-300 mx-auto" />
                            <div>
                              <p className="text-gray-500 font-medium">
                                {searchTerm ? `Tidak ada pasien yang cocok dengan "${searchTerm}"` : 'Tidak ada data pasien'}
                              </p>
                              {searchTerm && (
                                <p className="text-sm text-gray-400 mt-1">
                                  Coba gunakan kata kunci yang berbeda
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow 
                          key={patient.id} 
                          className={`hover:bg-pink-50 transition-colors duration-200 ${
                            selectedPatient?.id === patient.id ? 'bg-pink-50 border-l-4 border-pink-400' : ''
                          }`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-pink-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{patient.name}</p>
                                {patient.birthDate && (
                                  <p className="text-xs text-gray-500">
                                    {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} tahun
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono border-pink-200 text-pink-600">
                              {patient.medicalRecordNumber || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{patient.phone || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                patient.gender === 'Laki-laki' 
                                  ? 'border-blue-200 text-blue-600 bg-blue-50' 
                                  : 'border-pink-200 text-pink-600 bg-pink-50'
                              }
                            >
                              {patient.gender || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate">{patient.address || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSelectPatient(patient)}
                              className={`transition-all duration-200 ${
                                selectedPatient?.id === patient.id 
                                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                                  : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                              }`}
                              disabled={summaryLoading}
                            >
                              {summaryLoading && selectedPatient?.id === patient.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  {selectedPatient?.id === patient.id ? (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Terpilih
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Pilih
                                    </>
                                  )}
                                </>
                              )}
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

        <TabsContent value="summary" className="space-y-6">
          {selectedPatient && patientSummary ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Info Card */}
              <Card className="lg:col-span-1 border-pink-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informasi Pasien
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedPatient(null)
                        setPatientSummary(null)
                        setMedicalRecords([])
                        setXrayImages([])
                        setActiveTab('patients')
                      }}
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tutup
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center pb-4 border-b border-pink-100">
                    <div className="h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-pink-600" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedPatient.name}</h3>
                    <p className="text-sm text-gray-500">No. RM: {selectedPatient.medicalRecordNumber}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Telepon:</span>
                      <span className="text-sm text-gray-900">{selectedPatient.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Gender:</span>
                      <Badge variant="outline" className={
                        selectedPatient.gender === 'Laki-laki' 
                          ? 'border-blue-200 text-blue-600 bg-blue-50' 
                          : 'border-pink-200 text-pink-600 bg-pink-50'
                      }>
                        {selectedPatient.gender || '-'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Alamat:</span>
                      <span className="text-sm text-gray-900 text-right max-w-[60%]">{selectedPatient.address || '-'}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{patientSummary.totalVisits}</p>
                      <p className="text-xs text-blue-600">Total Kunjungan</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{xrayImages.length}</p>
                      <p className="text-xs text-green-600">X-Ray Images</p>
                    </div>
                  </div>

                  {patientSummary.lastVisit && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Kunjungan Terakhir</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        {new Date(patientSummary.lastVisit).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-4">
                    <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => {
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
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Rekam Medis
                    </Button>
                    <Button variant="outline" className="w-full border-pink-200 text-pink-600 hover:bg-pink-50">
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak Ringkasan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Records & X-ray */}
              <div className="lg:col-span-2 space-y-6">
                {/* Medical Records */}
                <Card className="border-pink-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200">
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Riwayat Rekam Medis
                      <Badge variant="secondary" className="bg-pink-100 text-pink-600">
                        {patientSummary.medicalRecords.length} catatan
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {patientSummary.medicalRecords.length === 0 ? (
                      <div className="text-center py-12">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada rekam medis</p>
                        <p className="text-sm text-gray-400 mt-1">Klik "Tambah Rekam Medis" untuk memulai</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                          {patientSummary.medicalRecords.map((record) => (
                            <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs border-pink-200 text-pink-600">
                                      {new Date(record.visitDate).toLocaleDateString('id-ID')}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {record.doctorName}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 mb-1">Keluhan:</p>
                                    <p className="text-sm text-gray-700">{record.complaint}</p>
                                  </div>
                                  {record.diagnosis && (
                                    <div>
                                      <p className="font-medium text-gray-900 mb-1">Diagnosis:</p>
                                      <p className="text-sm text-gray-700">{record.diagnosis}</p>
                                    </div>
                                  )}
                                  {record.treatment && (
                                    <div>
                                      <p className="font-medium text-gray-900 mb-1">Tindakan:</p>
                                      <p className="text-sm text-gray-700">{record.treatment}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* X-ray Images */}
                <Card className="border-pink-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pink-800 flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        X-Ray Images
                        <Badge variant="secondary" className="bg-pink-100 text-pink-600">
                          {xrayImages.length} gambar
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadDialogOpen(true)}
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {xrayImages.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada gambar X-ray</p>
                        <p className="text-sm text-gray-400 mt-1">Upload gambar X-ray untuk pasien ini</p>
                        <Button
                          variant="outline"
                          className="mt-3 border-pink-200 text-pink-600 hover:bg-pink-50"
                          onClick={() => setUploadDialogOpen(true)}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Upload X-ray
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {xrayImages.map((image) => (
                          <div key={image.id} className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                            <div className="aspect-square bg-gray-100 flex items-center justify-center">
                              <FileImage className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="p-3">
                              <p className="text-xs font-medium text-gray-900 truncate">{image.fileName}</p>
                              <p className="text-xs text-gray-500">{image.type}</p>
                              <p className="text-xs text-gray-400">{new Date(image.uploadDate).toLocaleDateString('id-ID')}</p>
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setViewerImage(image)
                                  setImageViewerOpen(true)
                                }}
                              >
                                <ZoomIn className="h-4 w-4 mr-1" />
                                Lihat
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Pasien</h3>
              <p className="text-gray-500">Pilih pasien dari tab "Pilih Pasien" untuk melihat ringkasan rekam medis</p>
              <Button 
                variant="outline" 
                className="mt-4 border-pink-200 text-pink-600 hover:bg-pink-50"
                onClick={() => setActiveTab('patients')}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                Kembali ke Daftar Pasien
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Medical Record Dialog (Simplified - just the structure) */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-800">
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              {editRecordMode ? 'Edit catatan rekam medis' : 'Tambahkan catatan rekam medis baru'} untuk {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">Form akan ditambahkan pada implementasi lengkap</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload X-ray Dialog (Simplified - just the structure) */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-800">Upload X-ray</DialogTitle>
            <DialogDescription className="text-pink-600">
              Upload gambar X-ray untuk {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">Form upload akan ditambahkan pada implementasi lengkap</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}