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
  RotateCw
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

export function MedicalRecordSummaryWithXray({ accessToken }: MedicalRecordSummaryWithXrayProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)

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
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 10000)
      )
      
      const dataPromise = Promise.all([
        fetchPatients(),
        fetchDoctors()
      ])
      
      await Promise.race([dataPromise, timeoutPromise])
      console.log('✅ Initial data fetch completed successfully')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      if (error.message === 'Data fetch timeout') {
        toast.error('Loading data timeout. Silakan refresh halaman.')
      } else {
        toast.error('Gagal memuat data')
      }
      
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
      
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
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
        console.error('Fetch medical records timeout')
        toast.error('Timeout loading medical records data')
      } else {
        console.error('Error fetching medical records:', error)
        toast.error('Terjadi kesalahan saat memuat rekam medis')
      }
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
        const images = data.images || []
        setXrayImages(images)
        return images
      } else {
        console.error('Failed to fetch X-ray images:', response.status)
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      
      setUploadForm(prev => ({
        ...prev,
        file
      }))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }
    
    if (!uploadForm.file) {
      toast.error('Silakan pilih file gambar')
      return
    }

    if (!uploadForm.description.trim()) {
      toast.error('Deskripsi wajib diisi')
      return
    }

    setUploadingFile(true)
    
    try {
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
        const result = await response.json()
        toast.success('Foto rontgen berhasil diupload')
        
        // Reset form
        setUploadForm({
          file: null,
          description: '',
          type: 'panoramic'
        })
        
        // Refresh X-ray images
        await fetchXrayImages(selectedPatient.id)
        
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal mengupload foto rontgen')
      }
    } catch (error) {
      console.error('Error uploading X-ray image:', error)
      toast.error('Gagal mengupload foto rontgen')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteXrayImage = async (imageId: string) => {
    try {
      const response = await fetch(`${serverUrl}/xray-images/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        toast.success('Foto rontgen berhasil dihapus')
        
        // Refresh images
        if (selectedPatient) {
          await fetchXrayImages(selectedPatient.id)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus foto rontgen')
      }
    } catch (error) {
      console.error('Error deleting X-ray image:', error)
      toast.error('Gagal menghapus foto rontgen')
    }
  }

  const openImageViewer = (image: XrayImage) => {
    setViewerImage(image)
    setImageZoom(100)
    setImageRotation(0)
    setImageViewerOpen(true)
  }

  const getXrayTypeLabel = (type: XrayImage['type']) => {
    const typeMap = {
      panoramic: 'Panoramik',
      periapical: 'Periapikal', 
      bitewing: 'Bitewing',
      cephalometric: 'Sefalometri',
      other: 'Lainnya'
    }
    return typeMap[type] || type
  }

  const getXrayTypeColor = (type: XrayImage['type']) => {
    const colorMap = {
      panoramic: 'bg-blue-100 text-blue-800',
      periapical: 'bg-green-100 text-green-800',
      bitewing: 'bg-purple-100 text-purple-800', 
      cephalometric: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  // Handle other functions for medical records (simplified for space)
  const resetRecordForm = () => {
    if (!selectedPatient) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }
    
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
    
    setRecordForm(newFormData)
    setEditRecordMode(false)
  }

  const handleEditRecord = (record: MedicalRecord) => {
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
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil dibuat')
        setRecordDialogOpen(false)
        resetRecordForm()
        
        if (selectedPatient) {
          const fetchedRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
          const summary = generatePatientSummary(selectedPatient, fetchedRecords)
          setPatientSummary(summary)
        } else {
          setMedicalRecords([])
        }
      } else {
        let errorMessage = 'Gagal menyimpan rekam medis'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
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
        
        if (selectedPatient) {
          const fetchedRecords = await fetchMedicalRecords(selectedPatient.id, selectedPatient.name)
          const summary = generatePatientSummary(selectedPatient, fetchedRecords)
          setPatientSummary(summary)
        } else {
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

  // Fungsi print rekapan rekam medis
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
      
      toast.success('Membuka dialog print...')
    } else {
      toast.error('Popup diblokir. Silakan izinkan popup untuk mencetak.')
    }
  }

  const generatePrintContent = () => {
    if (!patientSummary) return ''

    const { patient, medicalRecords, totalVisits, lastVisit, commonDiagnoses, treatingDoctors } = patientSummary
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rekapan Rekam Medis - ${patient.name}</title>
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
          
          .page-break {
            page-break-before: always;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">Falasifah Dental Clinic</div>
          <div class="report-title">Rekapan Rekam Medis Pasien</div>
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
              <span class="info-label">Jenis Kelamin:</span>
              <span class="info-value">${patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tanggal Lahir:</span>
              <span class="info-value">${new Date(patient.birthDate).toLocaleDateString('id-ID')}</span>
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
            <div class="stat-number">${lastVisit ? new Date(lastVisit).toLocaleDateString('id-ID') : 'Belum ada'}</div>
            <div class="stat-label">Kunjungan Terakhir</div>
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
                <th class="treatment-col">Tindakan</th>
                <th class="doctor-col">Dokter</th>
              </tr>
            </thead>
            <tbody>
              ${medicalRecords.map(record => `
                <tr>
                  <td>${new Date(record.visitDate).toLocaleDateString('id-ID')}</td>
                  <td>${record.complaint}</td>
                  <td>${record.diagnosis}</td>
                  <td>${record.treatment}</td>
                  <td>${record.doctorName}</td>
                </tr>
                ${record.prescription ? `
                <tr>
                  <td colspan="5" style="background: #f0f9ff; font-style: italic; color: #0369a1;">
                    <strong>Resep:</strong> ${record.prescription}
                  </td>
                </tr>
                ` : ''}
                ${record.notes ? `
                <tr>
                  <td colspan="5" style="background: #fffbeb; font-style: italic; color: #92400e;">
                    <strong>Catatan:</strong> ${record.notes}
                  </td>
                </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${commonDiagnoses.length > 0 ? `
        <div class="section">
          <div class="section-title">Riwayat Diagnosis</div>
          <div class="diagnosis-list">
            ${commonDiagnoses.map((diagnosis, index) => `
              <div class="list-item">${index + 1}. ${diagnosis}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${treatingDoctors.length > 0 ? `
        <div class="section">
          <div class="section-title">Dokter Pemeriksa</div>
          <div class="doctor-list">
            ${treatingDoctors.map((doctor, index) => `
              <div class="list-item">${index + 1}. ${doctor}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Laporan ini digenerate secara otomatis oleh Sistem Manajemen Klinik Falasifah Dental Clinic</p>
          <p>© ${new Date().getFullYear()} Falasifah Dental Clinic - Semua hak dilindungi</p>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            <span className="text-pink-600">Memuat data pasien...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            Pilih Pasien untuk Melihat Rekapan ({filteredPatients.length})
          </CardTitle>
          <div className="relative mt-4">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nama pasien, nomor RM, atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <Card 
                key={patient.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPatient?.id === patient.id 
                    ? 'ring-2 ring-pink-500 bg-pink-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectPatient(patient)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-pink-600" />
                      <span className="text-sm truncate">{patient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600">{patient.medicalRecordNumber}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {patient.gender} • {new Date(patient.birthDate).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedPatient && (
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={handleClearSelection}
                variant="outline"
                size="sm"
                className="text-pink-600 border-pink-300 hover:bg-pink-50"
              >
                <X className="h-4 w-4 mr-2" />
                Bersihkan Pilihan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {summaryLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
              <span className="text-pink-600">Memuat data pasien...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Summary */}
      {patientSummary && !summaryLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-pink-600" />
              Ringkasan Pasien: {patientSummary.patient.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-pink-600" />
                  <span className="text-sm text-pink-700">Total Kunjungan</span>
                </div>
                <div className="text-2xl text-pink-800">{patientSummary.totalVisits}</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Kunjungan Terakhir</span>
                </div>
                <div className="text-sm text-blue-800">
                  {patientSummary.lastVisit ? new Date(patientSummary.lastVisit).toLocaleDateString('id-ID') : 'Belum ada'}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Diagnosis Umum</span>
                </div>
                <div className="text-xs text-green-800">
                  {patientSummary.commonDiagnoses.length > 0 ? patientSummary.commonDiagnoses.slice(0, 2).join(', ') : 'Belum ada'}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-700">Dokter Pemeriksa</span>
                </div>
                <div className="text-xs text-purple-800">
                  {patientSummary.treatingDoctors.length > 0 ? patientSummary.treatingDoctors.slice(0, 2).join(', ') : 'Belum ada'}
                </div>
              </div>
            </div>

            {/* Tabs for Medical Records and X-ray Images */}
            <Tabs defaultValue="records" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="records" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Rekam Medis
                </TabsTrigger>
                <TabsTrigger value="xray" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Foto Rontgen
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Foto Rontgen
                </TabsTrigger>
              </TabsList>

              {/* Medical Records Tab */}
              <TabsContent value="records" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg text-pink-800">Riwayat Rekam Medis</h3>
                  <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={resetRecordForm} 
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Rekam Medis
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
                        </DialogTitle>
                        <DialogDescription>
                          {editRecordMode 
                            ? 'Perbarui informasi rekam medis pasien' 
                            : 'Masukkan informasi rekam medis untuk pasien'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleRecordSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="doctorId">Dokter Pemeriksa *</Label>
                            <DoctorSelector
                              doctors={doctors}
                              selectedDoctorId={recordForm.doctorId}
                              onSelect={(doctorId) => setRecordForm(prev => ({ ...prev, doctorId }))}
                              placeholder="Pilih dokter pemeriksa"
                            />
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
                          <Label htmlFor="complaint">Keluhan Utama *</Label>
                          <Textarea
                            id="complaint"
                            value={recordForm.complaint}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                            placeholder="Masukkan keluhan utama pasien"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="examination">Pemeriksaan</Label>
                          <Textarea
                            id="examination"
                            value={recordForm.examination}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, examination: e.target.value }))}
                            placeholder="Masukkan hasil pemeriksaan"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="diagnosis">Diagnosis *</Label>
                          <Textarea
                            id="diagnosis"
                            value={recordForm.diagnosis}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                            placeholder="Masukkan diagnosis"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="treatment">Tindakan/Perawatan *</Label>
                          <Textarea
                            id="treatment"
                            value={recordForm.treatment}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                            placeholder="Masukkan tindakan atau perawatan yang diberikan"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prescription">Resep/Obat</Label>
                          <Textarea
                            id="prescription"
                            value={recordForm.prescription}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                            placeholder="Masukkan resep atau obat yang diberikan"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Catatan Tambahan</Label>
                          <Textarea
                            id="notes"
                            value={recordForm.notes}
                            onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Masukkan catatan tambahan"
                            rows={3}
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
                          <Button 
                            type="submit" 
                            className="bg-pink-600 hover:bg-pink-700"
                            disabled={loading}
                          >
                            {loading ? 'Menyimpan...' : (editRecordMode ? 'Perbarui' : 'Simpan')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {patientSummary.medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {patientSummary.medicalRecords.map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-pink-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-pink-600" />
                              <span className="text-sm text-pink-700">
                                {new Date(record.visitDate).toLocaleDateString('id-ID')}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-sm text-gray-600">{record.doctorName}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(record)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Keluhan:</span>
                              <p className="text-gray-800 mt-1">{record.complaint}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Diagnosis:</span>
                              <p className="text-gray-800 mt-1">{record.diagnosis}</p>
                            </div>
                            {record.examination && (
                              <div>
                                <span className="text-gray-600">Pemeriksaan:</span>
                                <p className="text-gray-800 mt-1">{record.examination}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Tindakan:</span>
                              <p className="text-gray-800 mt-1">{record.treatment}</p>
                            </div>
                            {record.prescription && (
                              <div className="md:col-span-2">
                                <span className="text-gray-600">Resep:</span>
                                <p className="text-gray-800 mt-1">{record.prescription}</p>
                              </div>
                            )}
                            {record.notes && (
                              <div className="md:col-span-2">
                                <span className="text-gray-600">Catatan:</span>
                                <p className="text-gray-800 mt-1">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada rekam medis untuk pasien ini</p>
                  </div>
                )}
              </TabsContent>

              {/* X-ray Images Tab */}
              <TabsContent value="xray" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg text-pink-800">Foto Rontgen</h3>
                  <span className="text-sm text-gray-600">
                    {xrayImages.length} foto tersedia
                  </span>
                </div>
                
                {xrayImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {xrayImages.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative group">
                          <img
                            src={image.fileUrl}
                            alt={image.description}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openImageViewer(image)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteXrayImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getXrayTypeColor(image.type)}>
                              {getXrayTypeLabel(image.type)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(image.uploadDate).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{image.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada foto rontgen untuk pasien ini</p>
                  </div>
                )}
              </TabsContent>

              {/* Upload X-ray Tab - Mengganti tab pencarian */}
              <TabsContent value="upload" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg text-pink-800">Upload Foto Rontgen</h3>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center">
                          <Camera className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                          <div className="space-y-2">
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <span className="text-pink-600 hover:text-pink-700">
                                Klik untuk pilih file
                              </span>
                              <span className="text-gray-600"> atau drag & drop</span>
                            </Label>
                            <Input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500">
                              Format: JPG, PNG, GIF (Max: 10MB)
                            </p>
                          </div>
                          
                          {uploadForm.file && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 justify-center">
                                <FileImage className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">
                                  File dipilih: {uploadForm.file.name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="xray-type">Jenis Foto Rontgen *</Label>
                            <Select 
                              value={uploadForm.type} 
                              onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value as XrayImage['type'] }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis foto rontgen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="panoramic">Panoramik</SelectItem>
                                <SelectItem value="periapical">Periapikal</SelectItem>
                                <SelectItem value="bitewing">Bitewing</SelectItem>
                                <SelectItem value="cephalometric">Sefalometri</SelectItem>
                                <SelectItem value="other">Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Deskripsi *</Label>
                          <Textarea
                            id="description"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Masukkan deskripsi foto rontgen (mis: lokasi, kondisi, catatan khusus)"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setUploadForm({
                              file: null,
                              description: '',
                              type: 'panoramic'
                            })
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                            if (fileInput) fileInput.value = ''
                          }}
                        >
                          Reset
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-pink-600 hover:bg-pink-700"
                          disabled={uploadingFile || !uploadForm.file || !uploadForm.description.trim()}
                        >
                          {uploadingFile ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Foto
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus rekam medis ini? Tindakan ini tidak dapat dibatalkan.
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

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="flex items-center justify-between">
              <span>Viewer Foto Rontgen</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageZoom(prev => Math.max(50, prev - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{imageZoom}%</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageZoom(prev => Math.min(200, prev + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewerImage && (
            <div className="flex flex-col items-center justify-center p-4 min-h-[400px] bg-gray-100 rounded-lg overflow-auto">
              <img
                src={viewerImage.fileUrl}
                alt={viewerImage.description}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{
                  transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`
                }}
              />
              
              <div className="mt-4 p-4 bg-white rounded-lg max-w-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getXrayTypeColor(viewerImage.type)}>
                    {getXrayTypeLabel(viewerImage.type)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(viewerImage.uploadDate).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{viewerImage.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}