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
  ChevronDown,
  Printer,
  Image
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

interface XrayImage {
  id: string
  patientId: string
  patientName: string
  fileName: string
  fileUrl: string
  originalFileName: string
  description: string
  type: string
  uploadDate: string
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
  xrayImages: XrayImage[]
  totalVisits: number
  lastVisit: string
  commonDiagnoses: string[]
  treatingDoctors: string[]
}

interface MedicalRecordSummaryProps {
  accessToken: string
}

export function MedicalRecordSummary({ accessToken }: MedicalRecordSummaryProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [xrayImages, setXrayImages] = useState<XrayImage[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Debug log access token status
  useEffect(() => {
    console.log('MedicalRecordSummary mounted with accessToken:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
      tokenPrefix: accessToken?.substring(0, 20) + '...' || 'N/A'
    })
  }, [accessToken])
  
  // Dialog states for medical records
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  const [recordSearchTerm, setRecordSearchTerm] = useState('')
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

  // Watch for access token changes and refetch data
  useEffect(() => {
    if (accessToken && patients.length === 0 && medicalRecords.length === 0) {
      console.log('Access token available and no data loaded, fetching...')
      fetchInitialData()
    }
  }, [accessToken])

  // Debug logging for data consistency
  useEffect(() => {
    console.log('📊 Data State Update:', {
      patients: patients.length,
      medicalRecords: medicalRecords.length,
      selectedPatient: selectedPatient?.name || 'None',
      hasSummary: !!patientSummary,
      summaryRecords: patientSummary?.medicalRecords?.length || 0
    })
  }, [patients, medicalRecords, selectedPatient, patientSummary])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Check if access token is available
      if (!accessToken) {
        console.error('Cannot fetch data: No access token available')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        setLoading(false)
        return
      }
      
      console.log('Starting initial data fetch with valid access token')
      
      // Comprehensive initial state cleanup to prevent data mixing
      console.log('🧹 Performing comprehensive initial cleanup...')
      setMedicalRecords([])
      setSelectedPatient(null)
      setPatientSummary(null)
      setSearchTerm('') 
      setRecordSearchTerm('')
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
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 10000)
      )
      
      const dataPromise = Promise.all([
        fetchPatients(),
        // Don't fetch medical records initially to prevent mixed data
        // fetchMedicalRecords(), // Medical records will be fetched when patient is selected
        fetchDoctors()
      ])
      
      await Promise.race([dataPromise, timeoutPromise])
      console.log('✅ Initial data fetch completed successfully - clean state maintained')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      if (error.message === 'Data fetch timeout') {
        toast.error('Loading data timeout. Silakan refresh halaman.')
      } else {
        toast.error('Gagal memuat data')
      }
      
      // Ensure clean state even on error
      setMedicalRecords([])
      setSelectedPatient(null)
      setPatientSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients with accessToken:', accessToken ? 'Present' : 'Missing')
      console.log('Server URL:', serverUrl)
      
      if (!accessToken) {
        console.error('No access token available')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('Patients fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Patients data received:', data)
        setPatients(data.patients || [])
      } else {
        if (response.status === 401) {
          console.error('Unauthorized access - token may be invalid')
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          console.error('Failed to fetch patients:', response.status, await response.text())
          toast.error(`Gagal memuat data pasien (${response.status})`)
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Fetch patients timeout')
        toast.error('Timeout loading patients data')
      } else {
        console.error('Error fetching patients:', error)
        toast.error('Terjadi kesalahan saat memuat data pasien')
      }
    }
  }

  const fetchMedicalRecords = async (patientId?: string, patientName?: string): Promise<MedicalRecord[]> => {
    try {
      console.log('Fetching medical records with accessToken:', accessToken ? 'Present' : 'Missing')
      
      if (!accessToken) {
        console.error('No access token available for medical records')
        toast.error('Sesi tidak valid. Silakan login ulang.')
        return []
      }

      // If no filter provided (initial load), don't fetch all records to prevent data mixing
      if (!patientId && !patientName) {
        console.log('📋 No patient filter provided - clearing medical records for clean initial load')
        setMedicalRecords([])
        return []
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      // Build query parameters for filtering
      const queryParams = new URLSearchParams()
      if (patientId) queryParams.append('patientId', patientId)
      if (patientName) queryParams.append('patientName', patientName)
      
      const url = `${serverUrl}/medical-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      console.log('📋 Fetching medical records from:', url)
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('Medical records fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Medical records data received:', data)
        
        // Additional frontend filtering as safety measure
        let filteredRecords = data.records || []
        
        // Filter by patient if parameters provided - double check for data integrity
        if (patientId || patientName) {
          filteredRecords = filteredRecords.filter(record => {
            if (patientId && record.patientId !== patientId) return false
            if (patientName && !record.patientName?.toLowerCase().includes(patientName.toLowerCase())) return false
            return true
          })
          console.log(`📋 Frontend filtered to ${filteredRecords.length} records for patient ${patientName || patientId}`)
        } else {
          // Fallback: if somehow no filter but we got here, clear records to be safe
          console.warn('📋 No filter but fetch was called - clearing records for safety')
          filteredRecords = []
        }
        
        // Clean up empty prescriptions/medications and ensure data integrity
        filteredRecords = filteredRecords.map(record => ({
          ...record,
          prescription: record.prescription && record.prescription.trim() ? record.prescription : null,
          medications: record.medications && record.medications.length > 0 ? record.medications : null,
          // Ensure patient data consistency
          patientId: record.patientId || '',
          patientName: record.patientName || ''
        }))
        
        setMedicalRecords(filteredRecords)
        return filteredRecords
      } else {
        if (response.status === 401) {
          console.error('Unauthorized access to medical records - token may be invalid')
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          console.error('Failed to fetch medical records:', response.status, await response.text())
          toast.error(`Gagal memuat rekam medis (${response.status})`)
        }
        // Clear medical records on error to prevent showing stale data
        setMedicalRecords([])
        return []
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Fetch medical records timeout')
        toast.error('Timeout loading medical records data')
      } else {
        console.error('Error fetching medical records:', error)
        toast.error('Terjadi kesalahan saat memuat rekam medis')
      }
      // Clear medical records on error to prevent showing stale data
      setMedicalRecords([])
      return []
    }
  }



  const fetchDoctors = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(cleanDoctorNames(data.doctors || []))
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Fetch doctors timeout')
        toast.error('Timeout loading doctors data')
      } else {
        console.error('Error fetching doctors:', error)
      }
    }
  }

  const fetchXrayImages = async (patientId: string): Promise<XrayImage[]> => {
    try {
      console.log('Fetching X-ray images for patient:', patientId)
      
      if (!accessToken) {
        console.error('No access token available for X-ray images')
        return []
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
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
        console.log('X-ray images data received:', data)
        setXrayImages(data.images || [])
        return data.images || []
      } else {
        if (response.status === 401) {
          console.error('Unauthorized access to X-ray images')
          toast.error('Sesi berakhir. Silakan login ulang.')
        } else {
          console.error('Failed to fetch X-ray images:', response.status)
        }
        setXrayImages([])
        return []
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Fetch X-ray images timeout')
      } else {
        console.error('Error fetching X-ray images:', error)
      }
      setXrayImages([])
      return []
    }
  }

  // Updated function to generate summary from given medical records and X-ray images
  const generatePatientSummary = (patient: Patient, records: MedicalRecord[], xrayImgs: XrayImage[] = []): PatientSummary => {
    console.log('Generating summary for patient:', patient.id, patient.name)
    console.log('Using medical records:', records.length, 'X-ray images:', xrayImgs.length)
    
    // More robust filtering to ensure we only get records for this specific patient
    const patientRecords = records.filter(record => {
      const matchesId = record.patientId === patient.id
      const matchesRM = record.medicalRecordNumber === patient.medicalRecordNumber
      const matchesName = record.patientName?.toLowerCase() === patient.name?.toLowerCase()
      
      // Primary match by ID, fallback to RM number or name
      return matchesId || (matchesRM && patient.medicalRecordNumber) || matchesName
    })
    
    console.log('Patient records found:', patientRecords.length, patientRecords)
    
    // Additional validation to ensure records actually belong to this patient
    const validatedRecords = patientRecords.filter(record => {
      if (!record.patientId && !record.patientName) {
        console.warn('Record missing patient info, skipping:', record.id)
        return false
      }
      return true
    })
    
    console.log('Validated patient records:', validatedRecords.length)
    
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
      xrayImages: xrayImgs,
      totalVisits: validatedRecords.length,
      lastVisit,
      commonDiagnoses: commonDiagnoses.slice(0, 10), // Limit to prevent UI overflow
      treatingDoctors: treatingDoctors.slice(0, 10) // Limit to prevent UI overflow
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSummaryLoading(true)
    
    try {
      console.log('🔍 Patient selected:', patient.name, 'ID:', patient.id)
      
      // Clear previous patient data first to prevent mixing
      setSelectedPatient(null)
      setPatientSummary(null)
      setMedicalRecords([])
      setXrayImages([])
      
      // Set the new patient
      setSelectedPatient(patient)
      
      // Fetch medical records and X-ray images specifically for this patient
      console.log('📋 Fetching medical records for selected patient...')
      const fetchedRecords = await fetchMedicalRecords(patient.id, patient.name)
      
      console.log('📸 Fetching X-ray images for selected patient...')
      const fetchedXrayImages = await fetchXrayImages(patient.id)
      
      // Generate summary using the fetched data directly (not from state)
      const summary = generatePatientSummary(patient, fetchedRecords, fetchedXrayImages)
      setPatientSummary(summary)
      
      console.log('✅ Patient selection completed for:', patient.name)
      console.log('📋 Summary generated with', summary.medicalRecords.length, 'records and', summary.xrayImages.length, 'X-ray images')
    } catch (error) {
      console.error('Error in handleSelectPatient:', error)
      toast.error('Gagal memuat rekam medis pasien')
      
      // Clear state on error to prevent showing mixed data
      setSelectedPatient(null)
      setPatientSummary(null)
      setMedicalRecords([])
      setXrayImages([])
    } finally {
      setSummaryLoading(false)
    }
  }

  // Function to clear patient selection with thorough cleanup
  const handleClearSelection = () => {
    console.log('🧹 Clearing patient selection...')
    setSelectedPatient(null)
    setPatientSummary(null)
    setMedicalRecords([])
    setXrayImages([])
    setRecordDialogOpen(false)
    setEditRecordMode(false)
    setRecordSearchTerm('')
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
    
    toast.success('Pilihan pasien berhasil dibersihkan')
  }



  // Form handlers for medical records
  const resetRecordForm = () => {
    if (!selectedPatient) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }
    
    console.log('Resetting form for patient:', selectedPatient) // Debug log
    
    const newFormData = {
      id: '',
      patientId: selectedPatient.id,
      doctorId: '',
      visitDate: new Date().toISOString().split('T')[0],
      complaint: '',
      examination: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    }
    
    console.log('New form data:', newFormData) // Debug log
    
    setRecordForm(newFormData)
    setEditRecordMode(false)
    setRecordSearchTerm('')
  }

  const handleEditRecord = (record: MedicalRecord) => {
    const patient = patients.find(p => p.id === record.patientId)
    setRecordForm({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      visitDate: record.visitDate,
      complaint: record.complaint,
      examination: record.examination || '',
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes || ''
    })
    setEditRecordMode(true)
    setRecordDialogOpen(true)
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted with data:', recordForm) // Debug log
    
    if (!recordForm.patientId) {
      toast.error('Pasien tidak dipilih dengan benar')
      return
    }
    
    if (!recordForm.doctorId) {
      toast.error('Silakan pilih dokter pemeriksa')
      return
    }
    
    if (!recordForm.complaint.trim()) {
      toast.error('Keluhan utama wajib diisi')
      return
    }
    
    if (!recordForm.diagnosis.trim()) {
      toast.error('Diagnosis wajib diisi')
      return
    }
    
    if (!recordForm.treatment.trim()) {
      toast.error('Tindakan wajib diisi')
      return
    }

    setLoading(true)
    try {
      const selectedDoctor = doctors.find(d => d.id === recordForm.doctorId)
      const patient = patients.find(p => p.id === recordForm.patientId)
      
      const recordData = {
        patientId: recordForm.patientId,
        patientName: patient?.name || '',
        doctorId: recordForm.doctorId,
        doctorName: selectedDoctor?.name || '',
        visitDate: recordForm.visitDate,
        complaint: recordForm.complaint,
        examination: recordForm.examination,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        prescription: recordForm.prescription,
        notes: recordForm.notes,
        medicalRecordNumber: patient?.medicalRecordNumber || ''
      }

      const url = editRecordMode 
        ? `${serverUrl}/medical-records/${recordForm.id}`
        : `${serverUrl}/medical-records`
      
      const method = editRecordMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(recordData)
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('Server response:', responseData) // Debug log
        
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil dibuat')
        setRecordDialogOpen(false)
        resetRecordForm()
        
        // Refresh medical records for the specific patient instead of all records
        if (selectedPatient) {
          const fetchedRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
          const summary = generatePatientSummary(selectedPatient, fetchedRecords)
          setPatientSummary(summary)
        } else {
          // Clear medical records if no patient selected
          setMedicalRecords([])
        }
      } else {
        let errorMessage = 'Gagal menyimpan rekam medis'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('Server error:', errorData) // Debug log
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error saving medical record:', error)
      toast.error('Gagal menyimpan rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (record: MedicalRecord) => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/medical-records/${record.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        toast.success('Rekam medis berhasil dihapus')
        
        // Refresh medical records for the specific patient instead of all records
        if (selectedPatient) {
          const fetchedRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
          const summary = generatePatientSummary(selectedPatient, fetchedRecords)
          setPatientSummary(summary)
        } else {
          // Clear medical records if no patient selected
          setMedicalRecords([])
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus rekam medis')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Gagal menghapus rekam medis')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }

  const openDeleteDialog = (record: MedicalRecord) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (recordToDelete) {
      await handleDeleteRecord(recordToDelete)
    }
  }

  // Handler function for doctor selection in form
  const handleDoctorSelect = (doctorId: string) => {
    console.log('🩺 Doctor selected in form:', doctorId) // Debug log
    setRecordForm(prev => ({
      ...prev,
      doctorId: doctorId
    }))
  }

  // FUNGSI PRINT REKAP REKAM MEDIS DAN FOTO X-RAY
  const handlePrintSummaryWithXray = async () => {
    try {
      if (!selectedPatient || !patientSummary) {
        toast.error('Tidak ada data pasien untuk dicetak')
        return
      }

      if (patientSummary.medicalRecords.length === 0 && patientSummary.xrayImages.length === 0) {
        toast.error('Tidak ada rekam medis atau foto X-ray untuk dicetak')
        return
      }

      const patient = selectedPatient
      const records = patientSummary.medicalRecords
      const xrayImages = patientSummary.xrayImages

      // Print window
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        toast.error('Gagal membuka jendela print. Pastikan popup tidak diblokir.')
        return
      }

      // Generate HTML content with medical records and X-ray images
      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rekap Rekam Medis & Foto X-ray - ${patient.name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.4; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ec4899; padding-bottom: 20px; }
    .clinic-name { font-size: 28px; font-weight: bold; color: #9d174d; margin-bottom: 5px; }
    .title { font-size: 22px; font-weight: bold; color: #9d174d; margin-bottom: 10px; }
    .patient-info { background-color: #fef7ff; border: 2px solid #ec4899; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .info-item { display: flex; }
    .info-label { font-weight: bold; width: 140px; color: #9d174d; }
    .info-value { color: #374151; }
    .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; color: #9d174d; }
    .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; }
    .section { margin-top: 30px; page-break-inside: avoid; }
    .section-title { font-size: 20px; font-weight: bold; color: #9d174d; margin-bottom: 20px; border-bottom: 2px solid #ec4899; padding-bottom: 8px; }
    .record-card { background-color: #ffffff; border: 2px solid #e2e8f0; border-left: 5px solid #ec4899; border-radius: 8px; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
    .record-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
    .record-date { font-size: 16px; font-weight: bold; color: #9d174d; }
    .record-doctor { font-size: 14px; color: #64748b; }
    .record-diagnosis { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 5px; }
    .record-content { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .content-item { }
    .content-label { font-weight: bold; color: #9d174d; font-size: 14px; margin-bottom: 4px; }
    .content-text { color: #374151; font-size: 14px; background-color: #fef7ff; padding: 8px 12px; border-radius: 4px; border-left: 3px solid #ec4899; }
    .xray-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px; }
    .xray-item { background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; page-break-inside: avoid; }
    .xray-image { max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 10px; }
    .xray-info { text-align: left; }
    .xray-label { font-weight: bold; color: #9d174d; font-size: 12px; }
    .xray-value { color: #374151; font-size: 12px; margin-bottom: 5px; }
    @media print {
      body { margin: 0; }
      .header { margin-bottom: 20px; padding-bottom: 15px; }
      .xray-gallery { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">Falasifah Dental Clinic</div>
    <div class="title">Rekap Rekam Medis & Foto X-ray</div>
  </div>
  
  <div class="patient-info">
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nama Pasien:</span>
        <span class="info-value">${patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. Rekam Medis:</span>
        <span class="info-value">${patient.medicalRecordNumber}</span>
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
        <span class="info-label">No. Telepon:</span>
        <span class="info-value">${patient.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Alamat:</span>
        <span class="info-value">${patient.address}</span>
      </div>
    </div>
  </div>

  <div class="summary-stats">
    <div class="stat-box">
      <div class="stat-number">${patientSummary.totalVisits}</div>
      <div class="stat-label">Total Kunjungan</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${patientSummary.commonDiagnoses.length}</div>
      <div class="stat-label">Jenis Diagnosis</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${patientSummary.treatingDoctors.length}</div>
      <div class="stat-label">Dokter Pemeriksa</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${xrayImages.length}</div>
      <div class="stat-label">Foto X-ray</div>
    </div>
  </div>

  ${records.length > 0 ? `
  <div class="section">
    <div class="section-title">Riwayat Rekam Medis</div>
    ${records.map(record => `
      <div class="record-card">
        <div class="record-header">
          <div class="record-date">${new Date(record.visitDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="record-doctor">Dokter: ${record.doctorName}</div>
        </div>
        <div class="record-diagnosis">${record.diagnosis}</div>
        <div class="record-content">
          <div class="content-item">
            <div class="content-label">Keluhan:</div>
            <div class="content-text">${record.complaint}</div>
          </div>
          ${record.examination ? `
          <div class="content-item">
            <div class="content-label">Pemeriksaan:</div>
            <div class="content-text">${record.examination}</div>
          </div>
          ` : ''}
          <div class="content-item">
            <div class="content-label">Tindakan:</div>
            <div class="content-text">${record.treatment}</div>
          </div>
          ${record.prescription ? `
          <div class="content-item">
            <div class="content-label">Resep/Obat:</div>
            <div class="content-text">${record.prescription}</div>
          </div>
          ` : ''}
          ${record.notes ? `
          <div class="content-item">
            <div class="content-label">Catatan:</div>
            <div class="content-text">${record.notes}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${xrayImages.length > 0 ? `
  <div class="section">
    <div class="section-title">Foto X-ray Pasien</div>
    <div class="xray-gallery">
      ${xrayImages.map(xray => `
        <div class="xray-item">
          <img src="${xray.fileUrl}" alt="${xray.description}" class="xray-image" />
          <div class="xray-info">
            <div class="xray-label">Deskripsi:</div>
            <div class="xray-value">${xray.description}</div>
            <div class="xray-label">Jenis:</div>
            <div class="xray-value">${xray.type}</div>
            <div class="xray-label">Tanggal Upload:</div>
            <div class="xray-value">${new Date(xray.uploadDate).toLocaleDateString('id-ID')}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #64748b;">
    Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </div>

</body>
</html>`)

      printWindow.document.close()
      
      // Tunggu loading gambar dan print
      setTimeout(() => {
        printWindow.print()
      }, 1000) // Beri waktu lebih untuk load gambar

    } catch (error) {
      console.error('Error printing summary with X-ray:', error)
      toast.error('Gagal mencetak rekap rekam medis dan foto X-ray')
    }
  }

inic</div>
    <div class="title">Rekapan Rekam Medis</div>
  </div>
  
  <!-- Informasi Pasien -->
  <div class="patient-info">
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nama Pasien:</span>
        <span class="info-value">${patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. Rekam Medis:</span>
        <span class="info-value">${patient.medicalRecordNumber}</span>
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
        <span class="info-label">No. Telepon:</span>
        <span class="info-value">${patient.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Alamat:</span>
        <span class="info-value">${patient.address}</span>
      </div>
    </div>
  </div>

  <!-- Statistik Ringkasan -->
  <div class="summary-stats">
    <div class="stat-box">
      <div class="stat-number">${patientSummary.totalVisits}</div>
      <div class="stat-label">Total Kunjungan</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${patientSummary.commonDiagnoses.length}</div>
      <div class="stat-label">Jenis Diagnosis</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${patientSummary.treatingDoctors.length}</div>
      <div class="stat-label">Dokter Pemeriksa</div>
    </div>
  </div>

  <!-- Riwayat Rekam Medis -->
  <div class="records-section">
    <div class="section-title">Riwayat Rekam Medis</div>
    ${records.map(record => `
      <div class="record-card">
        <div class="record-header">
          <div class="record-date">${new Date(record.visitDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="record-doctor">Dokter: ${record.doctorName}</div>
        </div>
        <div class="record-diagnosis">${record.diagnosis}</div>
        <div class="record-content">
          <div class="content-item">
            <div class="content-label">Keluhan:</div>
            <div class="content-text">${record.complaint}</div>
          </div>
          ${record.examination ? `
          <div class="content-item">
            <div class="content-label">Pemeriksaan:</div>
            <div class="content-text">${record.examination}</div>
          </div>
          ` : ''}
          <div class="content-item">
            <div class="content-label">Tindakan:</div>
            <div class="content-text">${record.treatment}</div>
          </div>
          ${record.prescription ? `
          <div class="content-item">
            <div class="content-label">Resep/Obat:</div>
            <div class="content-text">${record.prescription}</div>
          </div>
          ` : ''}
          ${record.notes ? `
          <div class="content-item">
            <div class="content-label">Catatan:</div>
            <div class="content-text">${record.notes}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #64748b;">
    Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </div>

</body>
</html>`

      // Buka jendela baru untuk print
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Tunggu sedikit untuk loading konten
        setTimeout(() => {
          printWindow.print()
        }, 500)
      } else {
        toast.error('Gagal membuka jendela print. Pastikan popup tidak diblokir.')
      }

    } catch (error) {
      console.error('Error printing summary:', error)
      toast.error('Gagal mencetak rekap rekam medis')
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  // Filter records for search functionality
  const filteredRecords = patientSummary?.medicalRecords.filter(record =>
    record.complaint.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.treatment.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.doctorName.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    new Date(record.visitDate).toLocaleDateString('id-ID').includes(recordSearchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Memuat data rekam medis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Rekapan Rekam Medis Pasien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Cari Pasien</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama, nomor RM, atau telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {selectedPatient && (
                <div className="flex gap-2 items-end">
                  <Button
                    onClick={handleClearSelection}
                    variant="outline"
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Bersihkan Pilihan
                  </Button>
                </div>
              )}
            </div>

            {/* Patient List */}
            <div className="border rounded-lg">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-medium">Daftar Pasien ({filteredPatients.length})</h3>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2 p-4">
                  {filteredPatients.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {searchTerm ? 'Tidak ada pasien yang ditemukan' : 'Belum ada data pasien'}
                    </p>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? 'bg-pink-50 border-pink-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-gray-600">RM: {patient.medicalRecordNumber}</p>
                            <p className="text-sm text-gray-600">{patient.phone}</p>
                          </div>
                          <Badge variant="outline">
                            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} tahun
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Summary */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Rekap Rekam Medis - {selectedPatient.name}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    resetRecordForm()
                    setRecordDialogOpen(true)
                  }}
                  size="sm"
                  disabled={!selectedPatient}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Rekam Medis
                </Button>
                <Button
                  onClick={handlePrintSummaryWithXray}
                  size="sm"
                  variant="outline"
                  disabled={!patientSummary || (patientSummary.medicalRecords.length === 0 && patientSummary.xrayImages.length === 0)}
                  className="text-pink-600 border-pink-600 hover:bg-pink-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Rekap & X-ray
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-pink-600">Memuat rekam medis pasien...</p>
              </div>
            ) : patientSummary ? (
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                  <TabsTrigger value="records">Riwayat Rekam Medis</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-pink-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Nama Pasien</p>
                      <p className="font-medium">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">No. Rekam Medis</p>
                      <p className="font-medium">{selectedPatient.medicalRecordNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Lahir</p>
                      <p className="font-medium">{new Date(selectedPatient.birthDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jenis Kelamin</p>
                      <p className="font-medium">{selectedPatient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">No. Telepon</p>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alamat</p>
                      <p className="font-medium">{selectedPatient.address}</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.totalVisits}</div>
                        <div className="text-sm text-gray-600">Total Kunjungan</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.commonDiagnoses.length}</div>
                        <div className="text-sm text-gray-600">Jenis Diagnosis</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.treatingDoctors.length}</div>
                        <div className="text-sm text-gray-600">Dokter Pemeriksa</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Last Visit */}
                  {patientSummary.lastVisit && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          <h4 className="font-medium">Kunjungan Terakhir</h4>
                        </div>
                        <p className="text-gray-600">{new Date(patientSummary.lastVisit).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Common Diagnoses */}
                  {patientSummary.commonDiagnoses.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Stethoscope className="h-4 w-4 text-pink-600" />
                          <h4 className="font-medium">Diagnosis yang Pernah Dialami</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {patientSummary.commonDiagnoses.map((diagnosis, index) => (
                            <Badge key={index} variant="secondary">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Treating Doctors */}
                  {patientSummary.treatingDoctors.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-pink-600" />
                          <h4 className="font-medium">Dokter yang Pernah Memeriksa</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {patientSummary.treatingDoctors.map((doctor, index) => (
                            <Badge key={index} variant="outline">
                              {doctor}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                  {/* Search Records */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Cari dalam rekam medis..."
                          value={recordSearchTerm}
                          onChange={(e) => setRecordSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        resetRecordForm()
                        setRecordDialogOpen(true)
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </div>

                  {/* Records List */}
                  <div className="space-y-4">
                    {filteredRecords.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <div className="text-gray-400 mb-4">
                            <FileText className="h-12 w-12 mx-auto" />
                          </div>
                          <p className="text-gray-600">
                            {recordSearchTerm 
                              ? 'Tidak ada rekam medis yang cocok dengan pencarian' 
                              : 'Belum ada rekam medis untuk pasien ini'
                            }
                          </p>
                          <Button
                            onClick={() => {
                              resetRecordForm()
                              setRecordDialogOpen(true)
                            }}
                            className="mt-4"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Rekam Medis Pertama
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredRecords.map((record) => (
                        <Card key={record.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="h-4 w-4 text-pink-600" />
                                  <span className="font-medium">
                                    {new Date(record.visitDate).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Dokter: {record.doctorName}</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(record)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-lg text-pink-800 mb-1">{record.diagnosis}</h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Keluhan:</p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.complaint}</p>
                                </div>

                                {record.examination && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Pemeriksaan:</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.examination}</p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Tindakan:</p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.treatment}</p>
                                </div>

                                {record.prescription && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Resep/Obat:</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.prescription}</p>
                                  </div>
                                )}
                              </div>

                              {record.notes && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Catatan:</p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Gagal memuat rekam medis pasien</p>
                <Button
                  onClick={() => handleSelectPatient(selectedPatient)}
                  size="sm"
                  className="mt-4"
                >
                  Coba Lagi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            {selectedPatient && (
              <DialogDescription>
                Pasien: {selectedPatient.name} (RM: {selectedPatient.medicalRecordNumber})
              </DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={recordForm.visitDate}
                  onChange={(e) => setRecordForm({ ...recordForm, visitDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="doctor">Dokter Pemeriksa *</Label>
                <DoctorSelector
                  value={recordForm.doctorId}
                  onValueChange={(value) => setRecordForm({ ...recordForm, doctorId: value })}
                  doctors={doctors}
                  placeholder="Pilih dokter..."
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="complaint">Keluhan Utama *</Label>
              <Textarea
                id="complaint"
                value={recordForm.complaint}
                onChange={(e) => setRecordForm({ ...recordForm, complaint: e.target.value })}
                placeholder="Keluhan yang disampaikan pasien..."
                required
              />
            </div>

            <div>
              <Label htmlFor="examination">Pemeriksaan</Label>
              <Textarea
                id="examination"
                value={recordForm.examination}
                onChange={(e) => setRecordForm({ ...recordForm, examination: e.target.value })}
                placeholder="Hasil pemeriksaan fisik..."
              />
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Textarea
                id="diagnosis"
                value={recordForm.diagnosis}
                onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                placeholder="Diagnosis yang ditetapkan..."
                required
              />
            </div>

            <div>
              <Label htmlFor="treatment">Tindakan *</Label>
              <Textarea
                id="treatment"
                value={recordForm.treatment}
                onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                placeholder="Tindakan yang dilakukan..."
                required
              />
            </div>

            <div>
              <Label htmlFor="prescription">Resep/Obat</Label>
              <Textarea
                id="prescription"
                value={recordForm.prescription}
                onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                placeholder="Obat yang diberikan..."
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="Catatan tambahan..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecordDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : (editRecordMode ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rekam Medis</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus rekam medis ini? Tindakan ini tidak dapat dibatalkan.
              {recordToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm">Tanggal: {new Date(recordToDelete.visitDate).toLocaleDateString('id-ID')}</p>
                  <p className="text-sm">Diagnosis: {recordToDelete.diagnosis}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}