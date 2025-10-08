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

export function MedicalRecordSummaryFixed({ accessToken }: MedicalRecordSummaryWithXrayProps) {
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

    try {
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
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Terjadi kesalahan saat mencetak. Silakan coba lagi.')
    }
  }

  // Fixed generatePrintContent function
  const generatePrintContent = () => {
    if (!patientSummary) return ''

    const { patient, medicalRecords, totalVisits, lastVisit, treatingDoctors } = patientSummary
    
    // Get X-ray images from state - FIXED
    const currentXrayImages = xrayImages || []
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
    
    .page-break {
      page-break-before: always;
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
      <div class="stat-number">${currentXrayImages.length}</div>
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
  ${currentXrayImages.length > 0 ? `
  <div class="page-break">
    <div class="section xray-section">
      <div class="section-title">Gambar X-Ray & Radiografi</div>
      <div class="xray-gallery">
        ${currentXrayImages.map(image => `
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

  // Return loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 text-lg font-medium">Memuat data...</p>
          {loadingProgress && (
            <p className="text-gray-500 text-sm mt-2">{loadingProgress}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rekapan Rekam Medis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pasien berdasarkan nama, nomor RM, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Patient List */}
            <div className="border rounded-lg">
              <ScrollArea className="h-64">
                <div className="divide-y">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedPatient?.id === patient.id ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                      }`}
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-500">
                            {patient.medicalRecordNumber} • {patient.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} tahun
                          </p>
                          <p className="text-xs text-gray-400">{patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Print buttons */}
            {selectedPatient && patientSummary && (
              <div className="flex gap-2">
                <Button onClick={handlePrintSummary} className="bg-pink-600 hover:bg-pink-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak A5 + Form
                </Button>
                <Button onClick={handleClearSelection} variant="outline">
                  Bersihkan Pilihan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary display */}
      {selectedPatient && patientSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan: {selectedPatient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{patientSummary.totalVisits}</div>
                <div className="text-sm text-blue-500">Total Kunjungan</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{medicalRecords.length}</div>
                <div className="text-sm text-green-500">Rekam Medis</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{patientSummary.treatingDoctors.length}</div>
                <div className="text-sm text-purple-500">Dokter</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{xrayImages.length}</div>
                <div className="text-sm text-pink-500">X-Ray</div>
              </div>
            </div>

            {medicalRecords.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Tanggal</TableHeader>
                      <TableHeader>Keluhan</TableHeader>
                      <TableHeader>Diagnosis</TableHeader>
                      <TableHeader>Perawatan</TableHeader>
                      <TableHeader>Dokter</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicalRecords.slice(0, 5).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.visitDate).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.complaint || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.diagnosis || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.treatment || '-'}</TableCell>
                        <TableCell>{record.doctorName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {medicalRecords.length > 5 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    ... dan {medicalRecords.length - 5} rekam medis lainnya
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}