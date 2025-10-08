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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
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
  Printer,
  Users,
  Filter,
  Download,
  ChevronDown,
  Settings,
  MoreVertical
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

interface MedicalRecordSummaryProps {
  accessToken: string
}

export function MedicalRecordSummary({ accessToken }: MedicalRecordSummaryProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  
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

  // Helper function to calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (accessToken && patients.length === 0) {
      fetchInitialData()
    }
  }, [accessToken])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      if (!accessToken) {
        toast.error('Sesi tidak valid. Silakan login ulang.')
        setLoading(false)
        return
      }
      
      await Promise.all([
        fetchPatients(),
        fetchDoctors()
      ])
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
      } else {
        toast.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Terjadi kesalahan saat memuat data pasien')
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
        return data.records || []
      } else {
        toast.error('Gagal memuat rekam medis')
        return []
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
      toast.error('Terjadi kesalahan saat memuat rekam medis')
      return []
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(cleanDoctorNames(data.doctors || []))
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const generatePatientSummary = (patient: Patient, records: MedicalRecord[]): PatientSummary => {
    const patientRecords = records.filter(record => 
      record.patientId === patient.id || 
      record.patientName?.toLowerCase() === patient.name?.toLowerCase()
    )
    
    const lastVisit = patientRecords.length > 0 
      ? patientRecords.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0].visitDate
      : ''

    const diagnoses = patientRecords.map(record => record.diagnosis).filter(d => d && d.trim())
    const commonDiagnoses = [...new Set(diagnoses)]

    const doctors = patientRecords.map(record => record.doctorName).filter(d => d && d.trim())
    const treatingDoctors = [...new Set(doctors)]

    return {
      patient,
      medicalRecords: patientRecords.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()),
      totalVisits: patientRecords.length,
      lastVisit,
      commonDiagnoses,
      treatingDoctors
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    setSummaryLoading(true)
    
    try {
      setSelectedPatient(patient)
      
      // Fetch medical records
      const records = await fetchMedicalRecords(patient.id)
      
      // Generate summary
      const summary = generatePatientSummary(patient, records)
      setPatientSummary(summary)
      setMedicalRecords(summary.medicalRecords) // Set for search functionality
    } catch (error) {
      console.error('Error selecting patient:', error)
      toast.error('Gagal memuat data pasien')
    } finally {
      setSummaryLoading(false)
    }
  }

  const resetRecordForm = () => {
    if (!selectedPatient) return
    
    setRecordForm({
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
    })
    setEditRecordMode(false)
  }

  const handleAddRecord = () => {
    if (!selectedPatient) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }
    resetRecordForm()
    setRecordDialogOpen(true)
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
    
    if (!recordForm.patientId || !recordForm.doctorId || !recordForm.complaint.trim() || 
        !recordForm.diagnosis.trim() || !recordForm.treatment.trim()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi')
      return
    }

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
        
        // Refresh data
        if (selectedPatient) {
          const records = await fetchMedicalRecords(selectedPatient.id)
          const summary = generatePatientSummary(selectedPatient, records)
          setPatientSummary(summary)
          setMedicalRecords(summary.medicalRecords)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving medical record:', error)
      toast.error('Gagal menyimpan rekam medis')
    }
  }

  const handleDeleteRecord = async (record: MedicalRecord) => {
    try {
      const response = await fetch(`${serverUrl}/medical-records/${record.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        toast.success('Rekam medis berhasil dihapus')
        
        // Refresh data
        if (selectedPatient) {
          const records = await fetchMedicalRecords(selectedPatient.id)
          const summary = generatePatientSummary(selectedPatient, records)
          setPatientSummary(summary)
          setMedicalRecords(summary.medicalRecords)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus rekam medis')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Gagal menghapus rekam medis')
    } finally {
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }

  const handlePrintSummary = async () => {
    try {
      if (!selectedPatient) {
        toast.error('Tidak ada pasien yang dipilih')
        return
      }

      const patient = selectedPatient
      const records = patientSummary?.medicalRecords || []

      // Generate comprehensive medical record summary for A5 size
      const htmlContent = [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <title>Rekapan Rekam Medis - ' + patient.name + '</title>',
        '  <style>',
        '    @page { size: A5; margin: 12mm; }',
        '    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; line-height: 1.2; color: #333; font-size: 10px; }',
        '    .header { text-align: center; margin-bottom: 8px; border-bottom: 2px solid #ec4899; padding-bottom: 6px; }',
        '    .clinic-name { font-size: 14px; font-weight: bold; color: #9d174d; margin-bottom: 2px; }',
        '    .title { font-size: 12px; font-weight: bold; color: #9d174d; margin-bottom: 4px; }',
        '    .patient-info { background-color: #fef7ff; border: 1px solid #ec4899; border-radius: 4px; padding: 8px; margin-bottom: 8px; }',
        '    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 9px; }',
        '    .info-item { display: flex; }',
        '    .info-label { font-weight: bold; width: 80px; color: #9d174d; }',
        '    .info-value { color: #374151; flex: 1; }',
        '    .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }',
        '    .stat-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 6px; text-align: center; }',
        '    .stat-number { font-size: 12px; font-weight: bold; color: #9d174d; }',
        '    .stat-label { font-size: 8px; color: #64748b; margin-top: 2px; }',
        '    .records-section { margin-top: 8px; }',
        '    .section-title { font-size: 11px; font-weight: bold; color: #9d174d; margin-bottom: 6px; border-bottom: 1px solid #ec4899; padding-bottom: 3px; }',
        '    .record-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #ec4899; border-radius: 3px; padding: 6px; margin-bottom: 6px; page-break-inside: avoid; }',
        '    .record-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }',
        '    .record-date { font-size: 9px; font-weight: bold; color: #9d174d; }',
        '    .record-doctor { font-size: 8px; color: #64748b; }',
        '    .record-diagnosis { font-size: 9px; font-weight: bold; color: #374151; }',
        '    .record-content { font-size: 8px; }',
        '    .content-item { margin-bottom: 3px; }',
        '    .content-label { font-weight: bold; color: #9d174d; }',
        '    .content-text { color: #374151; background-color: #fef7ff; padding: 2px 4px; border-radius: 2px; border-left: 2px solid #ec4899; margin-top: 1px; }',
        '    .future-visits { margin-top: 10px; page-break-inside: avoid; }',
        '    .future-table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8px; }',
        '    .future-table th, .future-table td { border: 1px solid #d1d5db; padding: 4px; text-align: left; height: 15px; }',
        '    .future-table th { background-color: #fce7f3; font-weight: bold; color: #9d174d; text-align: center; font-size: 8px; }',
        '    .print-info { text-align: center; font-size: 7px; color: #6b7280; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 4px; }',
        '    @media print { ',
        '      body { -webkit-print-color-adjust: exact; }',
        '      .header { page-break-after: avoid; }',
        '      .patient-info { page-break-after: avoid; }',
        '      .record-card { page-break-inside: avoid; }',
        '      .summary-stats { page-break-after: avoid; }',
        '      .future-visits { page-break-inside: avoid; }',
        '    }',
        '  </style>',
        '</head>',
        '<body>',
        '  <div class="header">',
        '    <div class="clinic-name">Falasifah Dental Clinic</div>',
        '    <div class="title">REKAPAN REKAM MEDIS</div>',
        '  </div>',
        
        // Patient Information Section - Compact
        '  <div class="patient-info">',
        '    <div class="info-grid">',
        '      <div class="info-item">',
        '        <div class="info-label">Nama Pasien:</div>',
        '        <div class="info-value">' + patient.name + '</div>',
        '      </div>',
        '      <div class="info-item">',
        '        <div class="info-label">No. RM:</div>',
        '        <div class="info-value">' + (patient.medicalRecordNumber || 'Belum tersedia') + '</div>',
        '      </div>',
        '      <div class="info-item">',
        '        <div class="info-label">Jenis Kelamin:</div>',
        '        <div class="info-value">' + patient.gender + '</div>',
        '      </div>',
        '      <div class="info-item">',
        '        <div class="info-label">Umur:</div>',
        '        <div class="info-value">' + calculateAge(patient.birthDate) + ' tahun</div>',
        '      </div>',
        '      <div class="info-item">',
        '        <div class="info-label">Telepon:</div>',
        '        <div class="info-value">' + patient.phone + '</div>',
        '      </div>',
        '      <div class="info-item">',
        '        <div class="info-label">Alamat:</div>',
        '        <div class="info-value">' + (patient.address || 'Tidak tersedia') + '</div>',
        '      </div>',
        '    </div>',
        '  </div>',
        
        // Compact Summary Statistics
        '  <div class="summary-stats">',
        '    <div class="stat-box">',
        '      <div class="stat-number">' + (patientSummary?.totalVisits || 0) + '</div>',
        '      <div class="stat-label">Total Kunjungan</div>',
        '    </div>',
        '    <div class="stat-box">',
        '      <div class="stat-number">' + (patientSummary?.treatingDoctors?.length || 0) + '</div>',
        '      <div class="stat-label">Dokter Berbeda</div>',
        '    </div>',
        '    <div class="stat-box">',
        '      <div class="stat-number" style="font-size: 8px;">' + (patientSummary?.lastVisit ? new Date(patientSummary.lastVisit).toLocaleDateString('id-ID') : 'Belum ada') + '</div>',
        '      <div class="stat-label">Kunjungan Terakhir</div>',
        '    </div>',
        '  </div>',

        // Medical Records Section - Compact
        '  <div class="records-section">',
        '    <div class="section-title">RIWAYAT REKAM MEDIS</div>',
        
        records.length === 0 ? [
          '    <div style="text-align: center; padding: 12px; color: #6b7280; background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 4px; font-size: 9px;">',
          '      <div style="font-weight: bold;">Belum Ada Rekam Medis</div>',
          '      <div style="margin-top: 2px;">Pasien ini belum memiliki riwayat rekam medis.</div>',
          '    </div>'
        ].join('') : records.map((record, index) => [
          '    <div class="record-card">',
          '      <div class="record-header">',
          '        <div>',
          '          <div class="record-date">Kunjungan #' + (index + 1) + ' - ' + new Date(record.visitDate).toLocaleDateString('id-ID') + '</div>',
          '          <div class="record-doctor">Dr. ' + record.doctorName + '</div>',
          '        </div>',
          '        <div class="record-diagnosis">' + record.diagnosis + '</div>',
          '      </div>',
          '      <div class="record-content">',
          '        <div class="content-item">',
          '          <div class="content-label">Keluhan:</div>',
          '          <div class="content-text">' + record.complaint + '</div>',
          '        </div>',
          record.examination ? [
            '        <div class="content-item">',
            '          <div class="content-label">Pemeriksaan:</div>',
            '          <div class="content-text">' + record.examination + '</div>',
            '        </div>'
          ].join('') : '',
          '        <div class="content-item">',
          '          <div class="content-label">Tindakan:</div>',
          '          <div class="content-text">' + record.treatment + '</div>',
          '        </div>',
          record.prescription ? [
            '        <div class="content-item">',
            '          <div class="content-label">Resep:</div>',
            '          <div class="content-text">' + record.prescription + '</div>',
            '        </div>'
          ].join('') : '',
          record.notes ? [
            '        <div class="content-item">',
            '          <div class="content-label">Catatan:</div>',
            '          <div class="content-text">' + record.notes + '</div>',
            '        </div>'
          ].join('') : '',
          '      </div>',
          '    </div>'
        ].join('')).flat(),

        '  </div>',

        // Future Visits Table
        '  <div class="future-visits">',
        '    <div class="section-title">KUNJUNGAN BERIKUTNYA</div>',
        '    <table class="future-table">',
        '      <thead>',
        '        <tr>',
        '          <th style="width: 15%;">Tanggal</th>',
        '          <th style="width: 20%;">Dokter</th>',
        '          <th style="width: 25%;">Keluhan</th>',
        '          <th style="width: 20%;">Diagnosis</th>',
        '          <th style="width: 20%;">Tindakan</th>',
        '        </tr>',
        '      </thead>',
        '      <tbody>',
        Array(5).fill(0).map((_, i) => [
          '        <tr>',
          '          <td>&nbsp;</td>',
          '          <td>&nbsp;</td>',
          '          <td>&nbsp;</td>',
          '          <td>&nbsp;</td>',
          '          <td>&nbsp;</td>',
          '        </tr>'
        ].join('')).join(''),
        '      </tbody>',
        '    </table>',
        '  </div>',

        '  <div class="print-info">',
        '    <div>Dicetak pada: ' + new Date().toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }) + ' | Total riwayat: ' + records.length + ' kunjungan</div>',
        '  </div>',
        '</body>',
        '</html>'
      ].join('')

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
        
        toast.success(records.length > 0 ? 
          `Rekapan rekam medis ${records.length} kunjungan berhasil disiapkan untuk cetak A5` :
          'Template rekapan rekam medis A5 berhasil disiapkan untuk cetak'
        )
      } else {
        toast.error('Gagal membuka jendela cetak')
      }
    } catch (error) {
      console.error('Error printing summary:', error)
      toast.error('Gagal mencetak rekapan rekam medis')
    }
  }

  // Filter patients berdasarkan search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  // Filter medical records berdasarkan search term untuk tab pencarian
  const filteredMedicalRecords = medicalRecords.filter(record =>
    record.complaint.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.treatment.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.doctorName.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
    record.notes?.toLowerCase().includes(recordSearchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Patient List Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Users className="h-5 w-5" />
              Daftar Pasien ({filteredPatients.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari pasien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id
                        ? 'border-pink-300 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.medicalRecordNumber}</div>
                    <div className="text-xs text-gray-400">{patient.phone}</div>
                  </div>
                ))}
                
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada pasien ditemukan</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Patient Summary Panel */}
        <div className="lg:col-span-3">
          {!selectedPatient ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pilih Pasien
                  </h3>
                  <p>Pilih pasien dari daftar untuk melihat rekapan rekam medis</p>
                </div>
              </CardContent>
            </Card>
          ) : summaryLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                  <p className="text-pink-600">Memuat rekam medis...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="ringkasan" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ringkasan" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ringkasan
                  </TabsTrigger>
                  <TabsTrigger value="riwayat" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat
                  </TabsTrigger>
                  <TabsTrigger value="pencarian" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Pencarian
                  </TabsTrigger>
                  <TabsTrigger value="kelola" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Kelola
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="ringkasan" className="space-y-4">
                {/* Patient Info Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pink-800">
                        {selectedPatient.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-pink-600 border-pink-600">
                        {selectedPatient.medicalRecordNumber}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Jenis Kelamin:</span>
                        <p className="text-gray-900">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Umur:</span>
                        <p className="text-gray-900">{calculateAge(selectedPatient.birthDate)} tahun</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Telepon:</span>
                        <p className="text-gray-900">{selectedPatient.phone}</p>
                      </div>
                      <div className="md:col-span-3">
                        <span className="font-medium text-gray-600">Alamat:</span>
                        <p className="text-gray-900">{selectedPatient.address || 'Tidak tersedia'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                {patientSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.totalVisits}</div>
                        <p className="text-sm text-gray-600">Total Kunjungan</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.treatingDoctors.length}</div>
                        <p className="text-sm text-gray-600">Dokter Berbeda</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-pink-600">
                          {patientSummary.lastVisit ? 
                            new Date(patientSummary.lastVisit).toLocaleDateString('id-ID') : 
                            'Belum ada'
                          }
                        </div>
                        <p className="text-sm text-gray-600">Kunjungan Terakhir</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-pink-600">{patientSummary.commonDiagnoses.length}</div>
                        <p className="text-sm text-gray-600">Diagnosis Berbeda</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Summary Tags */}
                {patientSummary && (patientSummary.treatingDoctors.length > 0 || patientSummary.commonDiagnoses.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-pink-800">Ringkasan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {patientSummary.treatingDoctors.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Dokter Pemeriksa:</h4>
                            <div className="flex flex-wrap gap-2">
                              {patientSummary.treatingDoctors.map((doctor, index) => (
                                <Badge key={index} variant="outline" className="text-pink-600 border-pink-600">
                                  Dr. {doctor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {patientSummary.commonDiagnoses.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Diagnosis:</h4>
                            <div className="flex flex-wrap gap-2">
                              {patientSummary.commonDiagnoses.map((diagnosis, index) => (
                                <Badge key={index} variant="secondary">
                                  {diagnosis}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="riwayat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pink-800">
                        Riwayat Rekam Medis ({patientSummary?.medicalRecords.length || 0})
                      </CardTitle>
                      <Button
                        onClick={handleAddRecord}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Rekam Medis
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!patientSummary || patientSummary.medicalRecords.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Belum Ada Rekam Medis
                        </h3>
                        <p className="mb-4">Pasien ini belum memiliki riwayat rekam medis.</p>
                        <Button
                          onClick={handleAddRecord}
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Buat Rekam Medis Pertama
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patientSummary.medicalRecords.map((record, index) => (
                          <Card key={record.id} className="border-l-4 border-l-pink-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    Kunjungan #{patientSummary.medicalRecords.length - index} - {' '}
                                    {new Date(record.visitDate).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </h4>
                                  <p className="text-sm text-gray-500">Dr. {record.doctorName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{record.diagnosis}</Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setRecordToDelete(record)
                                          setDeleteDialogOpen(true)
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Hapus
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Keluhan:</span>
                                  <p className="text-gray-900 mt-1">{record.complaint}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Tindakan:</span>
                                  <p className="text-gray-900 mt-1">{record.treatment}</p>
                                </div>
                                {record.examination && (
                                  <div>
                                    <span className="font-medium text-gray-600">Pemeriksaan:</span>
                                    <p className="text-gray-900 mt-1">{record.examination}</p>
                                  </div>
                                )}
                                {record.prescription && (
                                  <div>
                                    <span className="font-medium text-gray-600">Resep:</span>
                                    <p className="text-gray-900 mt-1">{record.prescription}</p>
                                  </div>
                                )}
                                {record.notes && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-600">Catatan:</span>
                                    <p className="text-gray-900 mt-1">{record.notes}</p>
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
              </TabsContent>

              <TabsContent value="pencarian" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-pink-800">Pencarian Rekam Medis</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cari berdasarkan keluhan, diagnosis, tindakan, dokter, atau catatan..."
                        value={recordSearchTerm}
                        onChange={(e) => setRecordSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {medicalRecords.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Tidak Ada Rekam Medis
                        </h3>
                        <p>Pasien ini belum memiliki rekam medis untuk dicari.</p>
                      </div>
                    ) : filteredMedicalRecords.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Tidak Ada Hasil
                        </h3>
                        <p>Tidak ditemukan rekam medis yang sesuai dengan pencarian.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Ditemukan {filteredMedicalRecords.length} dari {medicalRecords.length} rekam medis
                        </p>
                        {filteredMedicalRecords.map((record) => (
                          <Card key={record.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {new Date(record.visitDate).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </h4>
                                  <p className="text-sm text-gray-500">Dr. {record.doctorName}</p>
                                </div>
                                <Badge variant="secondary">{record.diagnosis}</Badge>
                              </div>
                              
                              <div className="text-sm text-gray-900">
                                <p><strong>Keluhan:</strong> {record.complaint}</p>
                                <p><strong>Tindakan:</strong> {record.treatment}</p>
                                {record.notes && <p><strong>Catatan:</strong> {record.notes}</p>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kelola" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-pink-800">Kelola Rekam Medis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={handleAddRecord}
                        className="bg-pink-600 hover:bg-pink-700 text-white h-16 flex-col"
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Tambah Rekam Medis Baru
                      </Button>
                      
                      <Button
                        onClick={handlePrintSummary}
                        variant="outline"
                        className="border-pink-600 text-pink-600 hover:bg-pink-50 h-16 flex-col"
                      >
                        <Printer className="h-6 w-6 mb-2" />
                        Print Rekapan ({patientSummary?.medicalRecords.length || 0})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


            </Tabs>
          )}
        </div>
      </div>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient && `Pasien: ${selectedPatient.name} (${selectedPatient.medicalRecordNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={recordForm.visitDate}
                  onChange={(e) => setRecordForm({...recordForm, visitDate: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="doctorId">Dokter Pemeriksa *</Label>
                <Select
                  value={recordForm.doctorId}
                  onValueChange={(value) => setRecordForm({...recordForm, doctorId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokter" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="complaint">Keluhan Utama *</Label>
              <Textarea
                id="complaint"
                placeholder="Keluhan yang disampaikan pasien..."
                value={recordForm.complaint}
                onChange={(e) => setRecordForm({...recordForm, complaint: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="examination">Pemeriksaan</Label>
              <Textarea
                id="examination"
                placeholder="Hasil pemeriksaan fisik..."
                value={recordForm.examination}
                onChange={(e) => setRecordForm({...recordForm, examination: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                placeholder="Diagnosis medis..."
                value={recordForm.diagnosis}
                onChange={(e) => setRecordForm({...recordForm, diagnosis: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="treatment">Tindakan *</Label>
              <Textarea
                id="treatment"
                placeholder="Tindakan yang dilakukan..."
                value={recordForm.treatment}
                onChange={(e) => setRecordForm({...recordForm, treatment: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="prescription">Resep Obat</Label>
              <Textarea
                id="prescription"
                placeholder="Resep obat yang diberikan..."
                value={recordForm.prescription}
                onChange={(e) => setRecordForm({...recordForm, prescription: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan khusus atau follow-up..."
                value={recordForm.notes}
                onChange={(e) => setRecordForm({...recordForm, notes: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecordDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {editRecordMode ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus rekam medis ini? Tindakan ini tidak dapat dibatalkan.
              {recordToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <p><strong>Tanggal:</strong> {new Date(recordToDelete.visitDate).toLocaleDateString('id-ID')}</p>
                  <p><strong>Diagnosis:</strong> {recordToDelete.diagnosis}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
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