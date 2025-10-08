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

export function MedicalRecordSummaryWithXrayUpdated({ accessToken }: MedicalRecordSummaryWithXrayProps) {
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

  // Filter patients berdasarkan search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  // Fungsi print rekapan rekam medis A5 (Compact dengan form manual)
  const handlePrintSummary = () => {
    if (!patientSummary) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }

    const printContent = generatePrintContent()
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success('Membuka dialog print A5...')
    } else {
      toast.error('Popup diblokir. Silakan izinkan popup untuk mencetak.')
    }
  }

  // Fungsi print A4 lengkap (format asli)
  const handlePrintSummaryA4 = () => {
    if (!patientSummary) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }

    const printContent = generatePrintContentA4()
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success('Membuka dialog print A4...')
    } else {
      toast.error('Popup diblokir. Silakan izinkan popup untuk mencetak.')
    }
  }

  const generatePrintContent = () => {
    if (!patientSummary) return ''

    const { patient, medicalRecords, totalVisits, lastVisit, treatingDoctors } = patientSummary
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rekapan Rekam Medis - ${patient.name}</title>
  <style>
    @page { 
      size: A5; 
      margin: 10mm; 
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.3;
      color: #333;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1.5px solid #e91e63;
      padding-bottom: 8px;
    }
    
    .clinic-name {
      font-size: 16px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 4px;
    }
    
    .report-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }
    
    .print-date {
      font-size: 10px;
      color: #666;
    }
    
    .patient-info {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 12px;
      border-left: 3px solid #e91e63;
    }
    
    .patient-info h3 {
      color: #e91e63;
      font-size: 12px;
      margin-bottom: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 70px;
      color: #555;
    }
    
    .info-value {
      color: #333;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .stat-card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 8px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 18px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 3px;
    }
    
    .stat-label {
      color: #666;
      font-size: 9px;
    }
    
    .section {
      margin-bottom: 12px;
    }
    
    .section-title {
      background: #e91e63;
      color: white;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .records-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 9px;
    }
    
    .records-table th,
    .records-table td {
      border: 1px solid #ddd;
      padding: 5px 6px;
      text-align: left;
      vertical-align: top;
    }
    
    .records-table th {
      background: #f1f8e9;
      font-weight: bold;
      color: #333;
      font-size: 9px;
    }
    
    .records-table tr:nth-child(even) {
      background: #fafafa;
    }
    
    .date-col { width: 15%; }
    .complaint-col { width: 25%; }
    .diagnosis-col { width: 20%; }
    .treatment-col { width: 25%; }
    .doctor-col { width: 15%; }
    
    .diagnosis-list,
    .doctor-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 4px;
    }
    
    .list-item {
      background: #f8f9fa;
      padding: 6px;
      border-radius: 3px;
      border-left: 2px solid #e91e63;
      font-size: 9px;
    }
    
    .xray-section {
      margin-top: 10px;
    }
    
    .xray-gallery {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 10px 0;
    }
    
    .xray-item {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      text-align: center;
    }
    
    .xray-image {
      width: 100%;
      max-width: 160px;
      height: auto;
      max-height: 120px;
      object-fit: contain;
      border: 1px solid #eee;
      border-radius: 3px;
      margin-bottom: 6px;
    }
    
    .xray-type {
      background: #e91e63;
      color: white;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 8px;
      display: inline-block;
      margin-bottom: 4px;
    }
    
    .xray-filename {
      font-size: 8px;
      color: #666;
      margin-bottom: 3px;
      word-break: break-all;
    }
    
    .xray-description {
      font-size: 8px;
      color: #333;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .blank-form {
      margin-top: 20px;
    }
    
    .blank-form-title {
      background: #e91e63;
      color: white;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .form-field {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    
    .form-label {
      font-weight: bold;
      min-width: 90px;
      font-size: 11px;
      color: #333;
    }
    
    .form-line {
      flex: 1;
      border-bottom: 1px solid #333;
      height: 24px;
      margin-left: 10px;
    }
    
    .form-textarea {
      width: 100%;
      min-height: 70px;
      border: 1px solid #333;
      margin-top: 6px;
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-top: 25px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      height: 45px;
      margin-bottom: 6px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #333;
    }
    
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">Falasifah Dental Clinic</div>
    <div class="report-title">Rekapan Rekam Medis</div>
    <div class="print-date">Dicetak pada: ${currentDate}</div>
  </div>

  <div class="patient-info">
    <h3>Informasi Pasien</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nama:</span>
        <span class="info-value">${patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. RM:</span>
        <span class="info-value">${patient.medicalRecordNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Telepon:</span>
        <span class="info-value">${patient.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Tgl Lahir:</span>
        <span class="info-value">${new Date(patient.birthDate).toLocaleDateString('id-ID')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Gender:</span>
        <span class="info-value">${patient.gender === 'male' ? 'L' : 'P'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Alamat:</span>
        <span class="info-value">${patient.address}</span>
      </div>
    </div>
  </div>

  <div class="summary-stats">
    <div class="stat-card">
      <div class="stat-number">${totalVisits}</div>
      <div class="stat-label">Kunjungan</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${medicalRecords.length}</div>
      <div class="stat-label">Rekam Medis</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${treatingDoctors.length}</div>
      <div class="stat-label">Dokter</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${xrayImages.length}</div>
      <div class="stat-label">X-Ray</div>
    </div>
  </div>

  ${medicalRecords.length > 0 ? `
  <div class="section">
    <div class="section-title">Riwayat Rekam Medis</div>
    <table class="records-table">
      <thead>
        <tr>
          <th class="date-col">Tanggal</th>
          <th class="complaint-col">Keluhan</th>
          <th class="diagnosis-col">Diagnosis</th>
          <th class="treatment-col">Perawatan</th>
          <th class="doctor-col">Dokter</th>
        </tr>
      </thead>
      <tbody>
        ${medicalRecords.slice(0, 8).map(record => `
        <tr>
          <td>${new Date(record.visitDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
          <td>${(record.complaint || '-').length > 35 ? (record.complaint || '-').substring(0, 35) + '...' : (record.complaint || '-')}</td>
          <td>${(record.diagnosis || '-').length > 30 ? (record.diagnosis || '-').substring(0, 30) + '...' : (record.diagnosis || '-')}</td>
          <td>${(record.treatment || '-').length > 35 ? (record.treatment || '-').substring(0, 35) + '...' : (record.treatment || '-')}</td>
          <td>${(record.doctorName || '-').length > 18 ? (record.doctorName || '-').substring(0, 18) + '...' : (record.doctorName || '-')}</td>
        </tr>
        `).join('')}
        ${medicalRecords.length > 8 ? `
        <tr>
          <td colspan="5" style="text-align: center; font-style: italic; color: #666;">
            ... dan ${medicalRecords.length - 8} kunjungan lainnya
          </td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${treatingDoctors.length > 0 ? `
  <div class="section">
    <div class="section-title">Dokter Pemeriksa</div>
    <div class="doctor-list">
      ${treatingDoctors.map(doctor => `
      <div class="list-item">${doctor}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- X-Ray di halaman terpisah -->
  ${xrayImages.length > 0 ? `
  <div class="page-break">
    <div class="section xray-section">
      <div class="section-title">Gambar X-Ray & Radiografi</div>
      <div class="xray-gallery">
        ${xrayImages.map(image => `
        <div class="xray-item">
          <div class="xray-type">${image.type.toUpperCase()}</div>
          <img src="${image.fileUrl}" alt="${image.fileName}" class="xray-image" />
          <div class="xray-filename">${image.fileName}</div>
          <div class="xray-description">${image.description ? (image.description.length > 50 ? image.description.substring(0, 50) + '...' : image.description) : 'Tanpa deskripsi'}</div>
        </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Halaman Form Manual -->
  <div class="page-break">
    <div class="blank-form">
      <div class="blank-form-title">Form Rekam Medis - Kunjungan Berikutnya</div>
      
      <div class="patient-info">
        <h3>Data Pasien</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nama:</span>
            <span class="info-value">${patient.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">No. RM:</span>
            <span class="info-value">${patient.medicalRecordNumber}</span>
          </div>
        </div>
      </div>

      <div class="form-field">
        <span class="form-label">Tanggal:</span>
        <div class="form-line"></div>
        <span class="form-label" style="margin-left: 20px;">Dokter:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Keluhan:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Pemeriksaan:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Diagnosis:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Perawatan:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Resep:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Catatan:</span>
        <div class="form-line"></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Tanda Tangan Dokter</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Tanggal & Waktu</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>Falasifah Dental Clinic - Sistem Manajemen Rekam Medis</div>
    <div>Dicetak pada: ${currentDate}</div>
  </div>
</body>
</html>`

    return printHTML
  }

  const generatePrintContentA4 = () => {
    if (!patientSummary) return ''

    const { patient, medicalRecords, totalVisits, lastVisit, commonDiagnoses, treatingDoctors } = patientSummary
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rekapan Rekam Medis Lengkap - ${patient.name}</title>
  <style>
    @page { 
      size: A4; 
      margin: 15mm; 
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #e91e63;
      padding-bottom: 15px;
    }
    
    .clinic-name {
      font-size: 18px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 5px;
    }
    
    .report-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .print-date {
      font-size: 10px;
      color: #666;
    }
    
    .patient-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #e91e63;
    }
    
    .patient-info h3 {
      color: #e91e63;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 120px;
      color: #555;
    }
    
    .info-value {
      color: #333;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .stat-card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #666;
      font-size: 10px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      background: #e91e63;
      color: white;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .records-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
    }
    
    .records-table th,
    .records-table td {
      border: 1px solid #ddd;
      padding: 8px 6px;
      text-align: left;
      vertical-align: top;
    }
    
    .records-table th {
      background: #f1f8e9;
      font-weight: bold;
      color: #333;
      font-size: 10px;
    }
    
    .records-table tr:nth-child(even) {
      background: #fafafa;
    }
    
    .date-col { width: 12%; }
    .complaint-col { width: 25%; }
    .diagnosis-col { width: 20%; }
    .treatment-col { width: 25%; }
    .doctor-col { width: 18%; }
    
    .diagnosis-list,
    .doctor-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    
    .list-item {
      background: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid #e91e63;
      font-size: 10px;
    }
    
    .xray-section {
      margin-top: 20px;
    }
    
    .xray-gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    
    .xray-item {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    
    .xray-image {
      width: 100%;
      max-width: 200px;
      height: auto;
      max-height: 150px;
      object-fit: contain;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .xray-type {
      background: #e91e63;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9px;
      display: inline-block;
      margin-bottom: 4px;
    }
    
    .xray-filename {
      font-size: 9px;
      color: #666;
      margin-bottom: 4px;
      word-break: break-all;
    }
    
    .xray-description {
      font-size: 9px;
      color: #333;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">Falasifah Dental Clinic</div>
    <div class="report-title">Rekapan Rekam Medis Lengkap</div>
    <div class="print-date">Dicetak pada: ${currentDate}</div>
  </div>

  <div class="patient-info">
    <h3>Informasi Pasien</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nama:</span>
        <span class="info-value">${patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. RM:</span>
        <span class="info-value">${patient.medicalRecordNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Telepon:</span>
        <span class="info-value">${patient.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Tanggal Lahir:</span>
        <span class="info-value">${new Date(patient.birthDate).toLocaleDateString('id-ID')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Jenis Kelamin:</span>
        <span class="info-value">${patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Alamat:</span>
        <span class="info-value">${patient.address}</span>
      </div>
    </div>
  </div>

  <div class="summary-stats">
    <div class="stat-card">
      <div class="stat-number">${totalVisits}</div>
      <div class="stat-label">Total Kunjungan</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${commonDiagnoses.length}</div>
      <div class="stat-label">Jenis Diagnosis</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${treatingDoctors.length}</div>
      <div class="stat-label">Dokter Pemeriksa</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${lastVisit ? new Date(lastVisit).toLocaleDateString('id-ID') : '-'}</div>
      <div class="stat-label">Kunjungan Terakhir</div>
    </div>
  </div>

  ${medicalRecords.length > 0 ? `
  <div class="section">
    <div class="section-title">Riwayat Rekam Medis Lengkap</div>
    <table class="records-table">
      <thead>
        <tr>
          <th class="date-col">Tanggal</th>
          <th class="complaint-col">Keluhan</th>
          <th class="diagnosis-col">Diagnosis</th>
          <th class="treatment-col">Perawatan</th>
          <th class="doctor-col">Dokter</th>
        </tr>
      </thead>
      <tbody>
        ${medicalRecords.map(record => `
        <tr>
          <td>${new Date(record.visitDate).toLocaleDateString('id-ID')}</td>
          <td>${record.complaint || '-'}</td>
          <td>${record.diagnosis || '-'}</td>
          <td>${record.treatment || '-'}</td>
          <td>${record.doctorName || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${commonDiagnoses.length > 0 ? `
  <div class="section">
    <div class="section-title">Diagnosis Umum</div>
    <div class="diagnosis-list">
      ${commonDiagnoses.map(diagnosis => `
      <div class="list-item">${diagnosis}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${treatingDoctors.length > 0 ? `
  <div class="section">
    <div class="section-title">Dokter Pemeriksa</div>
    <div class="doctor-list">
      ${treatingDoctors.map(doctor => `
      <div class="list-item">${doctor}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${xrayImages.length > 0 ? `
  <div class="section xray-section">
    <div class="section-title">Gambar X-Ray & Radiografi Lengkap</div>
    <div class="xray-gallery">
      ${xrayImages.map(image => `
      <div class="xray-item">
        <div class="xray-type">${image.type.toUpperCase()}</div>
        <img src="${image.fileUrl}" alt="${image.fileName}" class="xray-image" />
        <div class="xray-filename">${image.fileName}</div>
        <div class="xray-description">${image.description || 'Tidak ada deskripsi'}</div>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>Falasifah Dental Clinic - Sistem Manajemen Rekam Medis</div>
    <div>Dicetak pada: ${currentDate}</div>
  </div>
</body>
</html>`

    return printHTML
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-pink-600 mb-2">Memuat data rekapan rekam medis...</p>
                {loadingProgress && (
                  <p className="text-sm text-gray-500">{loadingProgress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-pink-600" />
                Rekapan Rekam Medis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Pilih pasien untuk melihat rekapan rekam medis lengkap dengan foto X-ray
              </p>
              {selectedPatient && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p>• <strong>Cetak A5 + Form:</strong> Format kompak dengan halaman kosong untuk kunjungan berikutnya</p>
                  <p>• <strong>Cetak A4 Lengkap:</strong> Format lengkap dengan semua data dan foto X-ray ukuran besar</p>
                </div>
              )}
            </div>

            {/* Print Buttons */}
            {selectedPatient && (
              <div className="flex gap-2">
                <Button
                  onClick={handlePrintSummary}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={!patientSummary}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak A5 + Form
                </Button>
                <Button
                  onClick={handlePrintSummaryA4}
                  variant="outline"
                  className="border-pink-600 text-pink-600 hover:bg-pink-50"
                  disabled={!patientSummary}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Cetak A4 Lengkap
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Search Section */}
          <div className="mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Cari Pasien</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Cari berdasarkan nama, nomor RM, atau telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {selectedPatient && (
                <Button
                  onClick={handleClearSelection}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Bersihkan
                </Button>
              )}
            </div>
          </div>

          {/* Patient Selection */}
          {!selectedPatient && (
            <div className="mb-6">
              <Label className="mb-2 block">Daftar Pasien</Label>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? 'Tidak ada pasien yang ditemukan' : 'Tidak ada data pasien'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>RM: {patient.medicalRecordNumber}</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronDown className="h-4 w-4 text-gray-400 transform -rotate-90" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Patient Summary */}
          {selectedPatient && (
            <div className="space-y-6">
              {summaryLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-pink-600">Memuat data pasien...</p>
                  </div>
                </div>
              ) : patientSummary ? (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                    <TabsTrigger value="records">Rekam Medis</TabsTrigger>
                    <TabsTrigger value="xray">X-Ray ({xrayImages.length})</TabsTrigger>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-6">
                    {/* Patient Info Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-pink-600" />
                          Informasi Pasien
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
                              <p className="text-sm font-medium">{patientSummary.patient.name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Nomor Rekam Medis</Label>
                              <p className="text-sm font-medium">{patientSummary.patient.medicalRecordNumber}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Telepon</Label>
                              <p className="text-sm font-medium">{patientSummary.patient.phone}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Tanggal Lahir</Label>
                              <p className="text-sm font-medium">
                                {new Date(patientSummary.patient.birthDate).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Jenis Kelamin</Label>
                              <p className="text-sm font-medium">
                                {patientSummary.patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Alamat</Label>
                              <p className="text-sm font-medium">{patientSummary.patient.address}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <div className="p-2 bg-pink-100 rounded-full">
                              <Calendar className="h-4 w-4 text-pink-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-2xl font-bold text-pink-600">{patientSummary.totalVisits}</p>
                              <p className="text-xs text-muted-foreground">Total Kunjungan</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-full">
                              <Activity className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-2xl font-bold text-green-600">{patientSummary.commonDiagnoses.length}</p>
                              <p className="text-xs text-muted-foreground">Jenis Diagnosis</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-2xl font-bold text-blue-600">{patientSummary.treatingDoctors.length}</p>
                              <p className="text-xs text-muted-foreground">Dokter Pemeriksa</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-full">
                              <FileImage className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-2xl font-bold text-orange-600">{xrayImages.length}</p>
                              <p className="text-xs text-muted-foreground">Foto X-Ray</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="records">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="h-5 w-5 text-pink-600" />
                          Riwayat Rekam Medis ({patientSummary.medicalRecords.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {patientSummary.medicalRecords.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada rekam medis untuk pasien ini</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {patientSummary.medicalRecords.map((record, index) => (
                              <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Kunjungan #{patientSummary.medicalRecords.length - index}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(record.visitDate).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {record.doctorName || 'Dokter tidak tercatat'}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Keluhan</Label>
                                    <p className="text-sm">{record.complaint || '-'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Diagnosis</Label>
                                    <p className="text-sm">{record.diagnosis || '-'}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Perawatan</Label>
                                    <p className="text-sm">{record.treatment || '-'}</p>
                                  </div>
                                  {record.notes && (
                                    <div className="md:col-span-2">
                                      <Label className="text-xs text-muted-foreground">Catatan</Label>
                                      <p className="text-sm">{record.notes}</p>
                                    </div>
                                  )}
                                  {record.prescription && (
                                    <div className="md:col-span-2">
                                      <Label className="text-xs text-muted-foreground">Resep</Label>
                                      <p className="text-sm">{record.prescription}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="xray">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileImage className="h-5 w-5 text-pink-600" />
                          Foto X-Ray & Radiografi ({xrayImages.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {xrayImages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada foto X-ray untuk pasien ini</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {xrayImages.map((image) => (
                              <div key={image.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                  <img
                                    src={image.fileUrl}
                                    alt={image.fileName}
                                    className="w-full h-full object-contain cursor-pointer"
                                    onClick={() => {
                                      setViewerImage(image)
                                      setImageViewerOpen(true)
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">
                                      {image.type.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium truncate">{image.fileName}</p>
                                  {image.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {image.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Quick Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Statistik Ringkas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Kunjungan Terakhir</span>
                            <span className="text-sm font-medium">
                              {patientSummary.lastVisit 
                                ? new Date(patientSummary.lastVisit).toLocaleDateString('id-ID')
                                : 'Belum ada kunjungan'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Total Rekam Medis</span>
                            <span className="text-sm font-medium">{patientSummary.medicalRecords.length}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Foto X-Ray</span>
                            <span className="text-sm font-medium">{xrayImages.length}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Common Diagnoses */}
                      {patientSummary.commonDiagnoses.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Diagnosis Umum</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {patientSummary.commonDiagnoses.map((diagnosis, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                  <span className="text-sm">{diagnosis}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Treating Doctors */}
                      {patientSummary.treatingDoctors.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Dokter Pemeriksa</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {patientSummary.treatingDoctors.map((doctor, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">{doctor}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Recent X-rays */}
                      {xrayImages.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">X-Ray Terbaru</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                              {xrayImages.slice(0, 4).map((image) => (
                                <div key={image.id} className="border rounded-lg p-2">
                                  <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                                    <img
                                      src={image.fileUrl}
                                      alt={image.fileName}
                                      className="w-full h-full object-contain cursor-pointer"
                                      onClick={() => {
                                        setViewerImage(image)
                                        setImageViewerOpen(true)
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs font-medium truncate">{image.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {xrayImages.length > 4 && (
                              <p className="text-xs text-muted-foreground mt-3 text-center">
                                +{xrayImages.length - 4} foto lainnya
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gagal memuat data pasien. Silakan coba lagi.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {viewerImage?.fileName}
            </DialogTitle>
            <DialogDescription>
              {viewerImage?.type.toUpperCase()} - {viewerImage ? new Date(viewerImage.uploadDate).toLocaleDateString('id-ID') : ''}
            </DialogDescription>
          </DialogHeader>
          
          {viewerImage && (
            <div className="space-y-4">
              {/* Image Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom(Math.max(50, imageZoom - 10))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-3">{imageZoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageZoom(Math.min(200, imageZoom + 10))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageZoom(100)
                    setImageRotation(0)
                  }}
                >
                  Reset
                </Button>
              </div>

              {/* Image Display */}
              <div className="flex justify-center bg-gray-100 rounded-lg p-4 max-h-[60vh] overflow-auto">
                <img
                  src={viewerImage.fileUrl}
                  alt={viewerImage.fileName}
                  className="object-contain"
                  style={{
                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
              </div>

              {/* Image Description */}
              {viewerImage.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                  <p className="text-sm mt-1">{viewerImage.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}