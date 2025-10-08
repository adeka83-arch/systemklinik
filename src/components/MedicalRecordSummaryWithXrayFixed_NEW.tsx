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
  
  // Form state for medical record
  const [recordForm, setRecordForm] = useState({
    id: '',
    patientId: '',
    doctorId: '',
    doctorName: '', // Add doctorName to form state
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

  const fetchMedicalRecords = async (patientId?: string, patientName?: string, retryCount = 0): Promise<MedicalRecord[]> => {
    const maxRetries = 2
    const baseTimeout = 8000 // 8 seconds for medical records
    
    try {
      if (!accessToken) {
        console.error('No access token available for medical records')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        return []
      }

      if (!patientId && !patientName) {
        console.log('No patient filter provided - clearing medical records')
        setMedicalRecords([])
        return []
      }

      console.log(`Fetching medical records for patient (attempt ${retryCount + 1}/${maxRetries + 1})`)

      const controller = new AbortController()
      const timeout = baseTimeout + (retryCount * 3000) // Increase timeout with each retry
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const queryParams = new URLSearchParams()
      if (patientId) queryParams.append('patientId', patientId)
      if (patientName) queryParams.append('patientName', patientName)
      
      const url = `${serverUrl}/medical-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        let filteredRecords = data.records || []
        
        if (patientId || patientName) {
          filteredRecords = filteredRecords.filter(record => {
            if (patientId && record.patientId !== patientId) return false
            if (patientName && !record.patientName?.toLowerCase().includes(patientName.toLowerCase())) return false
            return true
          })
        } else {
          filteredRecords = []
        }
        
        filteredRecords = filteredRecords.map(record => ({
          ...record,
          prescription: record.prescription && record.prescription.trim() ? record.prescription : null,
          patientId: record.patientId || '',
          patientName: record.patientName || ''
        }))
        
        console.log('✅ Medical records loaded:', filteredRecords.length, 'records')
        setMedicalRecords(filteredRecords)
        return filteredRecords
      } else {
        if (response.status === 401) {
          console.error('Unauthorized access to medical records')
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          console.error('Failed to fetch medical records:', response.status)
          toast.error(`Gagal memuat rekam medis (${response.status})`)
        }
        setMedicalRecords([])
        return []
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Fetch medical records timeout on attempt ${retryCount + 1}`)
        
        if (retryCount < maxRetries) {
          console.log(`Retrying medical records fetch in 1 second... (${retryCount + 1}/${maxRetries})`)
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          return await fetchMedicalRecords(patientId, patientName, retryCount + 1)
        } else {
          console.error('All retry attempts failed for medical records')
          toast.error('Timeout loading rekam medis. Data mungkin tidak lengkap.')
          setMedicalRecords([])
          return []
        }
      } else {
        console.error('Error fetching medical records:', error)
        toast.error('Terjadi kesalahan saat memuat rekam medis')
        setMedicalRecords([])
        return []
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

  const fetchXrayImages = async (patientId: string, retryCount = 0): Promise<XrayImage[]> => {
    const maxRetries = 2
    const baseTimeout = 8000 // 8 seconds for X-ray images
    
    try {
      if (!accessToken) {
        console.error('No access token available for X-ray images')
        return []
      }

      console.log(`Fetching X-ray images for patient (attempt ${retryCount + 1}/${maxRetries + 1})`)

      const controller = new AbortController()
      const timeout = baseTimeout + (retryCount * 3000) // Increase timeout with each retry
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(`${serverUrl}/xray-images?patientId=${patientId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const images = data.images || []
        console.log('✅ X-ray images loaded:', images.length, 'images')
        setXrayImages(images)
        return images
      } else {
        console.error('Failed to fetch X-ray images:', response.status)
        setXrayImages([])
        return []
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Fetch X-ray images timeout on attempt ${retryCount + 1}`)
        
        if (retryCount < maxRetries) {
          console.log(`Retrying X-ray images fetch in 1 second... (${retryCount + 1}/${maxRetries})`)
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          return await fetchXrayImages(patientId, retryCount + 1)
        } else {
          console.error('All retry attempts failed for X-ray images')
          console.log('Continuing without X-ray images')
          setXrayImages([])
          return []
        }
      } else {
        console.error('Error fetching X-ray images:', error)
        setXrayImages([])
        return []
      }
    }
  }

  const generatePatientSummary = (patient: Patient, records: MedicalRecord[]): PatientSummary => {
    console.log('Generating summary for patient:', patient.id, patient.name)
    
    const patientRecords = records.filter(record => {
      const matchesId = record.patientId === patient.id
      const matchesRM = record.medicalRecordNumber === patient.medicalRecordNumber
      const matchesName = record.patientName?.toLowerCase() === patient.name?.toLowerCase()
      
      return matchesId || (matchesRM && patient.medicalRecordNumber) || matchesName
    })
    
    const validatedRecords = patientRecords.filter(record => {
      if (!record.patientId && !record.patientName) {
        console.warn('Record missing patient info, skipping:', record.id)
        return false
      }
      return true
    })
    
    const lastVisit = validatedRecords.length > 0 
      ? validatedRecords.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0].visitDate
      : ''

    const diagnoses = validatedRecords.map(record => record.diagnosis).filter(diagnosis => diagnosis && diagnosis.trim())
    const commonDiagnoses = [...new Set(diagnoses)]

    const doctors = validatedRecords.map(record => record.doctorName).filter(doctor => doctor && doctor.trim())
    const treatingDoctors = [...new Set(doctors)]

    return {
      patient,
      medicalRecords: validatedRecords.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()),
      totalVisits: validatedRecords.length,
      lastVisit,
      commonDiagnoses: commonDiagnoses.slice(0, 10),
      treatingDoctors: treatingDoctors.slice(0, 10)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSummaryLoading(true)
    
    try {
      console.log('Patient selected:', patient.name, 'ID:', patient.id)
      
      // Clear previous data
      setSelectedPatient(null)
      setPatientSummary(null)
      setMedicalRecords([])
      setXrayImages([])
      
      // Set new patient
      setSelectedPatient(patient)
      
      // Fetch patient data
      const [fetchedRecords] = await Promise.all([
        fetchMedicalRecords(patient.id, patient.name),
        fetchXrayImages(patient.id)
      ])
      
      // Generate summary
      const summary = generatePatientSummary(patient, fetchedRecords)
      setPatientSummary(summary)
      
      console.log('Patient selection completed for:', patient.name)
    } catch (error) {
      console.error('Error in handleSelectPatient:', error)
      toast.error('Gagal memuat data pasien')
      
      setSelectedPatient(null)
      setPatientSummary(null)
      setMedicalRecords([])
      setXrayImages([])
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedPatient(null)
    setPatientSummary(null)
    setMedicalRecords([])
    setXrayImages([])
    setRecordDialogOpen(false)
    setEditRecordMode(false)
    setDeleteDialogOpen(false)
    setRecordToDelete(null)
    
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
    
    toast.success('Pilihan pasien berhasil dibersihkan')
  }

  // CRUD Functions for Medical Records
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

  const handleEditRecord = (record: MedicalRecord) => {
    setEditRecordMode(true)
    setRecordForm({
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
    })
    setRecordDialogOpen(true)
  }

  const handleDeleteRecord = (record: MedicalRecord) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
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
          const freshRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
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

  const confirmDeleteRecord = async () => {
    try {
      if (!recordToDelete) return

      const response = await fetch(`${serverUrl}/medical-records/${recordToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Rekam medis berhasil dihapus')
        setDeleteDialogOpen(false)
        setRecordToDelete(null)
        
        // Refresh medical records
        if (selectedPatient) {
          const freshRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
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
  }

  // X-ray Upload Functions
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
        setUploadForm({
          file: null,
          description: '',
          type: 'panoramic'
        })
        
        // Refresh X-ray images
        await fetchXrayImages(selectedPatient.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal upload X-ray')
      }
    } catch (error) {
      console.error('Error uploading X-ray:', error)
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingFile(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-pink-600">{loadingProgress || 'Memuat data...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-pink-600" />
            <h1 className="text-2xl text-pink-800">Ringkasan Rekam Medis</h1>
          </div>
          <Badge variant="outline" className="text-pink-600 border-pink-200">
            {patients.length} Pasien
          </Badge>
        </div>
        
        {selectedPatient && (
          <Button
            onClick={handleClearSelection}
            variant="outline"
            className="text-pink-600 border-pink-200 hover:bg-pink-50"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Users className="h-5 w-5" />
                Daftar Pasien
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pink-400" />
                <Input
                  placeholder="Cari pasien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="p-4 space-y-2">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Tidak ada pasien ditemukan</p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedPatient?.id === patient.id
                            ? 'border-pink-300 bg-pink-50 shadow-sm'
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {patient.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {patient.medicalRecordNumber}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{patient.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Patient Summary & Details */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <User className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Pasien</h3>
                <p className="text-gray-500">Klik pada pasien di sebelah kiri untuk melihat ringkasan rekam medis</p>
              </div>
            </Card>
          ) : summaryLoading ? (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-2 text-pink-600">Memuat data pasien...</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Patient Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-pink-800">
                      <User className="h-5 w-5" />
                      Informasi Pasien
                    </CardTitle>
                    <Badge variant="outline" className="text-pink-600 border-pink-200">
                      {patientSummary?.totalVisits || 0} Kunjungan
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nama Lengkap</p>
                        <p className="font-medium">{selectedPatient.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">No. Rekam Medis</p>
                        <p className="font-medium font-mono text-sm">{selectedPatient.medicalRecordNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telepon</p>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Tanggal Lahir</p>
                        <p className="font-medium">{new Date(selectedPatient.birthDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Jenis Kelamin</p>
                        <p className="font-medium">{selectedPatient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kunjungan Terakhir</p>
                        <p className="font-medium">
                          {patientSummary?.lastVisit 
                            ? new Date(patientSummary.lastVisit).toLocaleDateString('id-ID')
                            : 'Belum ada'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPatient.address && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="font-medium flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        {selectedPatient.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabs for Records and X-ray */}
              <Card>
                <Tabs defaultValue="records" className="w-full">
                  <CardHeader className="pb-3">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="records" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Rekam Medis
                      </TabsTrigger>
                      <TabsTrigger value="xray" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        X-Ray
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent>
                    <TabsContent value="records" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-pink-800">Riwayat Rekam Medis</h3>
                        <Button 
                          onClick={handleAddRecord}
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Rekam Medis
                        </Button>
                      </div>

                      {patientSummary?.medicalRecords.length === 0 ? (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Belum ada rekam medis</p>
                          <Button 
                            onClick={handleAddRecord}
                            variant="outline"
                            className="mt-4 text-pink-600 border-pink-200 hover:bg-pink-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Rekam Medis Pertama
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                          {patientSummary?.medicalRecords.map((record) => (
                            <Card key={record.id} className="border border-gray-200">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calendar className="h-4 w-4 text-pink-600" />
                                      <span className="text-sm font-medium">
                                        {new Date(record.visitDate).toLocaleDateString('id-ID')}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {record.doctorName}
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-700">Keluhan: </span>
                                        <span className="text-gray-600">{record.complaint}</span>
                                      </div>
                                      
                                      {record.examination && (
                                        <div>
                                          <span className="font-medium text-gray-700">Pemeriksaan: </span>
                                          <span className="text-gray-600">{record.examination}</span>
                                        </div>
                                      )}
                                      
                                      <div>
                                        <span className="font-medium text-gray-700">Diagnosis: </span>
                                        <span className="text-gray-600">{record.diagnosis}</span>
                                      </div>
                                      
                                      <div>
                                        <span className="font-medium text-gray-700">Perawatan: </span>
                                        <span className="text-gray-600">{record.treatment}</span>
                                      </div>

                                      {record.prescription && (
                                        <div>
                                          <span className="font-medium text-gray-700">Resep: </span>
                                          <span className="text-gray-600">{record.prescription}</span>
                                        </div>
                                      )}
                                      
                                      {record.notes && (
                                        <div>
                                          <span className="font-medium text-gray-700">Catatan: </span>
                                          <span className="text-gray-600">{record.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditRecord(record)}
                                      className="h-8 w-8 p-0 hover:bg-blue-50"
                                    >
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRecord(record)}
                                      className="h-8 w-8 p-0 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="xray" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-pink-800">X-Ray Images</h3>
                        <Button 
                          onClick={() => setUploadDialogOpen(true)}
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload X-Ray
                        </Button>
                      </div>

                      {xrayImages.length === 0 ? (
                        <div className="text-center py-8">
                          <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Belum ada X-ray</p>
                          <Button 
                            onClick={() => setUploadDialogOpen(true)}
                            variant="outline"
                            className="mt-4 text-pink-600 border-pink-200 hover:bg-pink-50"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload X-Ray Pertama
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
                          {xrayImages.map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={image.fileUrl}
                                  alt={image.description}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => {
                                    setViewerImage(image)
                                    setImageViewerOpen(true)
                                  }}
                                />
                              </div>
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 truncate">
                                  {image.description || 'No description'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                                </p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {image.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              {/* Summary Cards */}
              {patientSummary && patientSummary.medicalRecords.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-pink-800">Diagnosis Umum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patientSummary.commonDiagnoses.length === 0 ? (
                        <p className="text-gray-500 text-sm">Belum ada diagnosis</p>
                      ) : (
                        <div className="space-y-2">
                          {patientSummary.commonDiagnoses.map((diagnosis, index) => (
                            <Badge key={index} variant="secondary" className="mr-2">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-pink-800">Dokter Pemeriksa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patientSummary.treatingDoctors.length === 0 ? (
                        <p className="text-gray-500 text-sm">Belum ada dokter</p>
                      ) : (
                        <div className="space-y-2">
                          {patientSummary.treatingDoctors.map((doctor, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-pink-600" />
                              <span className="text-sm">{doctor}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription>
              Pasien: {selectedPatient?.name} ({selectedPatient?.medicalRecordNumber})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={recordForm.visitDate}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Dokter Pemeriksa *</Label>
                  <Select
                    value={recordForm.doctorId}
                    onValueChange={(value) => {
                      const selectedDoctor = doctors.find(doctor => doctor.id === value)
                      setRecordForm(prev => ({
                        ...prev,
                        doctorId: value,
                        doctorName: selectedDoctor?.name || ''
                      }))
                    }}
                  >
                    <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                      <SelectValue placeholder="Pilih Dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            <span>{doctor.name}</span>
                            <span className="text-xs text-gray-500">({doctor.specialization})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaint">Keluhan Utama *</Label>
                <Textarea
                  id="complaint"
                  placeholder="Masukkan keluhan utama pasien..."
                  value={recordForm.complaint}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examination">Hasil Pemeriksaan</Label>
                <Textarea
                  id="examination"
                  placeholder="Hasil pemeriksaan..."
                  value={recordForm.examination}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, examination: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Diagnosis..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Perawatan/Tindakan *</Label>
                <Textarea
                  id="treatment"
                  placeholder="Perawatan yang diberikan..."
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Resep Obat/Instruksi</Label>
                <Textarea
                  id="prescription"
                  placeholder="Resep obat atau instruksi..."
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={confirmDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* X-ray Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-pink-800">Upload X-Ray</DialogTitle>
            <DialogDescription>
              Upload gambar X-ray untuk pasien: {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
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
                <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="xrayDescription">Deskripsi</Label>
              <Textarea
                id="xrayDescription"
                placeholder="Deskripsi X-ray..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploadingFile}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Batal
              </Button>
              <Button 
                onClick={handleUploadXray}
                disabled={!uploadForm.file || uploadingFile}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {uploadingFile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* X-ray Image Viewer */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              X-Ray Viewer
            </DialogTitle>
            <DialogDescription>
              {viewerImage?.description} - {viewerImage?.type}
            </DialogDescription>
          </DialogHeader>

          {viewerImage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{imageZoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageRotation((imageRotation + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center overflow-auto max-h-[60vh]">
                <img
                  src={viewerImage.fileUrl}
                  alt={viewerImage.description}
                  className="max-w-full h-auto"
                  style={{
                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Upload: {new Date(viewerImage.uploadDate).toLocaleDateString('id-ID')}</p>
                <p>Pasien: {viewerImage.patientName}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}