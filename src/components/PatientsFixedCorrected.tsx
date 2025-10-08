import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Plus, Edit, UserPlus, Users, CalendarDays, FileText, Search, Phone, MapPin, Calendar as CalendarIcon, Trash2, RefreshCw, Printer, Filter, Hash, RotateCw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string
  gender: string
  bloodType?: string
  allergies?: string
  emergencyContact?: string
  emergencyPhone?: string
  registrationDate: string
  medicalRecordNumber?: string
  created_at: string
}

interface ControlSchedule {
  id: string
  patientId: string
  patientName: string
  controlDate: string
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  visitDate: string
  complaint: string
  diagnosis: string
  treatment: string
  prescription?: string
  notes?: string
  created_at: string
}

interface PatientsProps {
  accessToken: string
}

export default function PatientsFixedCorrected({ accessToken }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [schedules, setSchedules] = useState<ControlSchedule[]>([])
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('')
  const [recordSearchTerm, setRecordSearchTerm] = useState('')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editRecordMode, setEditRecordMode] = useState(false)
  const [editScheduleMode, setEditScheduleMode] = useState(false)
  
  // Form states
  const [patientForm, setPatientForm] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
    registrationDate: new Date().toISOString().split('T')[0]
  })

  const [scheduleForm, setScheduleForm] = useState({
    id: '',
    patientId: '',
    controlDate: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  })

  const [recordForm, setRecordForm] = useState({
    id: '',
    patientId: '',
    visitDate: new Date().toISOString().split('T')[0],
    complaint: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: ''
  })

  // Filtered data
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [patients, searchTerm])

  const filteredSchedulePatients = useMemo(() => {
    if (!scheduleSearchTerm) return []
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
      patient.phone.includes(scheduleSearchTerm) ||
      patient.medicalRecordNumber?.toLowerCase().includes(scheduleSearchTerm.toLowerCase())
    )
  }, [patients, scheduleSearchTerm])

  const filteredRecordPatients = useMemo(() => {
    if (!recordSearchTerm) return []
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
      patient.phone.includes(recordSearchTerm) ||
      patient.medicalRecordNumber?.toLowerCase().includes(recordSearchTerm.toLowerCase())
    )
  }, [patients, recordSearchTerm])

  // Filtered medical records with search and sorted by latest date
  const [recordFilterTerm, setRecordFilterTerm] = useState('')
  const filteredRecords = useMemo(() => {
    let filtered = records
    
    // Apply search filter if there's a search term
    if (recordFilterTerm) {
      filtered = records.filter(record => {
        const patient = patients.find(p => p.id === record.patientId)
        return (
          record.patientName.toLowerCase().includes(recordFilterTerm.toLowerCase()) ||
          record.complaint.toLowerCase().includes(recordFilterTerm.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(recordFilterTerm.toLowerCase()) ||
          record.treatment.toLowerCase().includes(recordFilterTerm.toLowerCase()) ||
          (patient?.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(recordFilterTerm.toLowerCase())) ||
          (patient?.phone && patient.phone.includes(recordFilterTerm))
        )
      })
    }
    
    // Sort by latest visit date
    return filtered.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }, [records, patients, recordFilterTerm])

  // Filtered and sorted schedules by control date (closest first)
  const sortedSchedules = useMemo(() => {
    return schedules.sort((a, b) => {
      const dateA = new Date(a.controlDate).getTime()
      const dateB = new Date(b.controlDate).getTime()
      return dateA - dateB // Sort ascending (closest date first)
    })
  }, [schedules])

  useEffect(() => {
    fetchPatients()
    fetchSchedules()
    fetchRecords()
  }, [])

  const fetchPatients = async () => {
    try {
      console.log('🏥 Fetching patients...')
      const data = await apiGet('/patients', accessToken)
      if (data.success) {
        setPatients(data.patients || [])
        console.log('✅ Patients loaded:', data.patients?.length || 0)
      } else {
        console.log('❌ Patients fetch unsuccessful:', data)
        toast.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error)
      toast.error('Gagal memuat data pasien')
    }
  }

  const fetchSchedules = async () => {
    try {
      console.log('📅 Fetching schedules...')
      const data = await apiGet('/control-schedules', accessToken)
      if (data.success) {
        setSchedules(data.schedules || [])
        console.log('✅ Schedules loaded:', data.schedules?.length || 0)
      } else {
        console.log('❌ Schedules fetch unsuccessful:', data)
        toast.error('Gagal memuat jadwal kontrol')
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error)
      toast.error('Gagal memuat jadwal kontrol')
    }
  }

  const fetchRecords = async () => {
    try {
      console.log('📋 Fetching medical records...')
      const data = await apiGet('/medical-records', accessToken)
      if (data.success) {
        setRecords(data.records || [])
        console.log('✅ Medical records loaded:', data.records?.length || 0)
      } else {
        console.log('❌ Medical records fetch unsuccessful:', data)
        toast.error('Gagal memuat rekam medis')
      }
    } catch (error) {
      console.error('❌ Error fetching medical records:', error)
      toast.error('Gagal memuat rekam medis')
    }
  }

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

  const resetForm = () => {
    setPatientForm({
      id: '',
      name: '',
      phone: '',
      address: '',
      birthDate: '',
      gender: '',
      bloodType: '',
      allergies: '',
      emergencyContact: '',
      emergencyPhone: '',
      registrationDate: new Date().toISOString().split('T')[0]
    })
    setEditMode(false)
    setDialogOpen(false)
  }

  const resetScheduleForm = () => {
    setScheduleForm({
      id: '',
      patientId: '',
      controlDate: '',
      notes: '',
      status: 'scheduled'
    })
    setScheduleSearchTerm('')
    setEditScheduleMode(false)
    setScheduleDialogOpen(false)
  }

  const resetRecordForm = () => {
    setRecordForm({
      id: '',
      patientId: '',
      visitDate: new Date().toISOString().split('T')[0],
      complaint: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: ''
    })
    setRecordSearchTerm('')
    setEditRecordMode(false)
    setRecordDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editMode 
        ? `${serverUrl}/patients/${patientForm.id}`
        : `${serverUrl}/patients`
        
      const method = editMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(patientForm)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(editMode ? 'Pasien berhasil diperbarui' : 'Pasien berhasil ditambahkan')
        fetchPatients()
        resetForm()
      } else {
        toast.error(data.error || 'Gagal menyimpan data pasien')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error('Gagal menyimpan data pasien')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleForm.patientId) {
      toast.error('Pilih pasien terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const selectedPatient = patients.find(p => p.id === scheduleForm.patientId)
      
      // Remove id from payload for new schedules
      const { id, ...payloadData } = scheduleForm
      const payload = {
        ...payloadData,
        patientName: selectedPatient?.name || ''
      }

      const url = editScheduleMode 
        ? `${serverUrl}/control-schedules/${scheduleForm.id}`
        : `${serverUrl}/control-schedules`
      const method = editScheduleMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(editScheduleMode ? 'Jadwal kontrol berhasil diperbarui' : 'Jadwal kontrol berhasil ditambahkan')
        fetchSchedules()
        resetScheduleForm()
      } else {
        toast.error(data.error || 'Gagal menyimpan jadwal kontrol')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Gagal menyimpan jadwal kontrol')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordForm.patientId) {
      toast.error('Pilih pasien terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const selectedPatient = patients.find(p => p.id === recordForm.patientId)
      
      // Remove id from payload for new records
      const { id, ...payloadData } = recordForm
      const payload = {
        ...payloadData,
        patientName: selectedPatient?.name || ''
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
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(editRecordMode ? 'Rekam medis berhasil diperbarui' : 'Rekam medis berhasil ditambahkan')
        fetchRecords()
        resetRecordForm()
      } else {
        toast.error(data.error || 'Gagal menyimpan rekam medis')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('Gagal menyimpan rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPatient = (patient: Patient) => {
    setPatientForm({
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      address: patient.address,
      birthDate: patient.birthDate,
      gender: patient.gender,
      bloodType: patient.bloodType || '',
      allergies: patient.allergies || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      registrationDate: patient.registrationDate
    })
    setEditMode(true)
    setDialogOpen(true)
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setRecordForm({
      id: record.id,
      patientId: record.patientId,
      visitDate: record.visitDate,
      complaint: record.complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes || ''
    })
    setEditRecordMode(true)
    setRecordDialogOpen(true)
  }

  const handleDeletePatient = async (patient: Patient) => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/patients/${patient.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Pasien berhasil dihapus')
        fetchPatients()
      } else {
        toast.error(data.error || 'Gagal menghapus pasien')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Gagal menghapus pasien')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (record: MedicalRecord) => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/medical-records/${record.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Rekam medis berhasil dihapus')
        fetchRecords()
      } else {
        toast.error(data.error || 'Gagal menghapus rekam medis')
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Gagal menghapus rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSchedule = (schedule: ControlSchedule) => {
    setScheduleForm({
      id: schedule.id,
      patientId: schedule.patientId,
      controlDate: schedule.controlDate,
      notes: schedule.notes,
      status: schedule.status
    })
    setEditScheduleMode(true)
    setScheduleDialogOpen(true)
  }

  const handleDeleteSchedule = async (schedule: ControlSchedule) => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/control-schedules/${schedule.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Jadwal kontrol berhasil dihapus')
        fetchSchedules()
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal kontrol')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Gagal menghapus jadwal kontrol')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const generateMedicalRecordNumber = (registrationDate: string) => {
    const date = new Date(registrationDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    // Generate a random 3-digit number for uniqueness
    const randomSuffix = Math.floor(Math.random() * 900) + 100
    
    return `RM-${year}${month}${day}-${randomSuffix}`
  }

  const handleGenerateMedicalRecord = async (patient: Patient) => {
    if (patient.medicalRecordNumber) {
      toast.error('Pasien sudah memiliki nomor rekam medis')
      return
    }

    try {
      setLoading(true)
      const newMedicalRecordNumber = generateMedicalRecordNumber(patient.registrationDate || patient.created_at)
      
      const response = await fetch(`${serverUrl}/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ...patient,
          medicalRecordNumber: newMedicalRecordNumber
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Nomor RM ${newMedicalRecordNumber} berhasil dibuat untuk ${patient.name}`)
        fetchPatients()
      } else {
        toast.error(data.error || 'Gagal membuat nomor rekam medis')
      }
    } catch (error) {
      console.error('Error generating medical record:', error)
      toast.error('Gagal membuat nomor rekam medis')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkGenerateMedicalRecords = async () => {
    const patientsWithoutRM = patients.filter(patient => !patient.medicalRecordNumber)
    
    if (patientsWithoutRM.length === 0) {
      toast.info('Semua pasien sudah memiliki nomor rekam medis')
      return
    }

    try {
      setLoading(true)
      let successCount = 0
      let errorCount = 0

      for (const patient of patientsWithoutRM) {
        try {
          const newMedicalRecordNumber = generateMedicalRecordNumber(patient.registrationDate || patient.created_at)
          
          const response = await fetch(`${serverUrl}/patients/${patient.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              ...patient,
              medicalRecordNumber: newMedicalRecordNumber
            })
          })

          const data = await response.json()
          
          if (data.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil membuat ${successCount} nomor rekam medis`)
        fetchPatients()
      }
      
      if (errorCount > 0) {
        toast.error(`Gagal membuat ${errorCount} nomor rekam medis`)
      }
    } catch (error) {
      console.error('Error bulk generating medical records:', error)
      toast.error('Gagal membuat nomor rekam medis secara bulk')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintRecord = (record: MedicalRecord) => {
    const patient = patients.find(p => p.id === record.patientId)
    if (!patient) {
      toast.error('Data pasien tidak ditemukan')
      return
    }

    // Generate HTML content for printing
    const visitDate = new Date(record.visitDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const printContent = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="UTF-8">',
      `  <title>Rekam Medis - ${patient.name}</title>`,
      '  <style>',
      '    @page { size: A4; margin: 20mm; }',
      '    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }',
      '    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }',
      '    .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }',
      '    .clinic-address { font-size: 11px; color: #666; }',
      '    .title { font-size: 18px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; }',
      '    .info-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }',
      '    .info-row { display: flex; margin-bottom: 8px; }',
      '    .info-label { font-weight: bold; width: 140px; color: #495057; }',
      '    .info-value { flex: 1; color: #212529; }',
      '    .content-section { margin: 20px 0; }',
      '    .section-title { font-size: 14px; font-weight: bold; color: #e91e63; margin-bottom: 10px; border-bottom: 1px solid #e91e63; padding-bottom: 5px; }',
      '    .section-content { padding: 10px 15px; background: #fff; border: 1px solid #ddd; border-radius: 5px; min-height: 40px; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="header">',
      '    <div class="clinic-name">Falasifah Dental Clinic</div>',
      '    <div class="clinic-address">',
      '      Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama<br>',
      '      Kec. Sawangan, Depok, Jawa Barat<br>',
      '      Telp/WA: 085283228355',
      '    </div>',
      '  </div>',
      '  <div class="title">REKAM MEDIS PASIEN</div>',
      '  <div class="info-section">',
      '    <div class="info-row">',
      '      <div class="info-label">Nama Pasien:</div>',
      `      <div class="info-value">${patient.name}</div>`,
      '    </div>',
      '    <div class="info-row">',
      '      <div class="info-label">No. Rekam Medis:</div>',
      `      <div class="info-value">${patient.medicalRecordNumber || 'Belum tersedia'}</div>`,
      '    </div>',
      '    <div class="info-row">',
      '      <div class="info-label">Tanggal Kunjungan:</div>',
      `      <div class="info-value">${visitDate}</div>`,
      '    </div>',
      '    <div class="info-row">',
      '      <div class="info-label">Telepon:</div>',
      `      <div class="info-value">${patient.phone}</div>`,
      '    </div>',
      '    <div class="info-row">',
      '      <div class="info-label">Alamat:</div>',
      `      <div class="info-value">${patient.address}</div>`,
      '    </div>',
      '  </div>',
      '  <div class="content-section">',
      '    <div class="section-title">Keluhan Utama</div>',
      `    <div class="section-content">${record.complaint}</div>`,
      '  </div>',
      '  <div class="content-section">',
      '    <div class="section-title">Diagnosis</div>',
      `    <div class="section-content">${record.diagnosis}</div>`,
      '  </div>',
      '  <div class="content-section">',
      '    <div class="section-title">Tindakan</div>',
      `    <div class="section-content">${record.treatment}</div>`,
      '  </div>'
    ]

    if (record.prescription) {
      printContent.push(
        '  <div class="content-section">',
        '    <div class="section-title">Resep Obat</div>',
        `    <div class="section-content">${record.prescription}</div>`,
        '  </div>'
      )
    }

    if (record.notes) {
      printContent.push(
        '  <div class="content-section">',
        '    <div class="section-title">Catatan</div>',
        `    <div class="section-content">${record.notes}</div>`,
        '  </div>'
      )
    }

    printContent.push(
      `  <div style="margin-top: 40px; text-align: right; font-size: 11px; color: #666;">`,
      `    Dicetak pada: ${currentDate}`,
      '  </div>',
      '  <script>',
      '    window.onload = function() {',
      '      setTimeout(() => { window.print(); }, 500);',
      '    }',
      '  </script>',
      '</body>',
      '</html>'
    )

    const finalHtml = printContent.join('\n')

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
      if (printWindow && !printWindow.closed) {
        printWindow.document.write(finalHtml)
        printWindow.document.close()
        toast.success('Membuka halaman cetak...')
      } else {
        // Fallback: download as HTML
        const blob = new Blob([finalHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Rekam-Medis-${patient.name}-${new Date(record.visitDate).toISOString().split('T')[0]}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
      }
    } catch (error) {
      console.error('Error printing record:', error)
      toast.error('Gagal mencetak rekam medis')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-800">Manajemen Pasien</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              fetchPatients()
              fetchSchedules()
              fetchRecords()
            }}
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            <Users className="h-4 w-4 mr-2" />
            <div className="flex flex-col items-start">
              <span>Data Pasien</span>
              {(() => {
                const patientsWithRM = patients.filter(patient => patient.medicalRecordNumber).length
                const totalPatients = patients.length
                const patientsWithoutRM = totalPatients - patientsWithRM
                return totalPatients > 0 && (
                  <span className="text-xs text-pink-600 hidden lg:block">
                    RM: {patientsWithRM}/{totalPatients}
                    {patientsWithoutRM > 0 && (
                      <span className="text-orange-600 ml-1">({patientsWithoutRM} kosong)</span>
                    )}
                  </span>
                )
              })()}
            </div>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            <CalendarDays className="h-4 w-4 mr-2" />
            Jadwal Kontrol
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            <FileText className="h-4 w-4 mr-2" />
            Rekam Medis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, telepon, RM, atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Bulk Generate RM Button */}
              {(() => {
                const patientsWithoutRM = patients.filter(patient => !patient.medicalRecordNumber)
                return patientsWithoutRM.length > 0 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                        title={`Generate nomor RM untuk ${patientsWithoutRM.length} pasien`}
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Generate RM ({patientsWithoutRM.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Generate Nomor Rekam Medis</AlertDialogTitle>
                        <AlertDialogDescription>
                          Akan membuat nomor rekam medis otomatis untuk <strong>{patientsWithoutRM.length}</strong> pasien yang belum memiliki nomor RM.
                          <br /><br />
                          Format: <code className="bg-gray-100 px-2 py-1 rounded text-sm">RM-YYYYMMDD-XXX</code>
                          <br />
                          <span className="text-xs text-gray-600 mt-2 block">
                            Nomor akan dibuat berdasarkan tanggal registrasi pasien dengan suffix acak untuk uniqueness.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleBulkGenerateMedicalRecords}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          {loading ? 'Membuat...' : 'Generate Semua'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null
              })()}
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="bg-pink-600 hover:bg-pink-700 flex-1 sm:flex-none">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Tambah Pasien
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Pasien' : 'Tambah Pasien Baru'}</DialogTitle>
                  <DialogDescription>
                    {editMode ? 'Perbarui informasi pasien' : 'Masukkan data pasien baru ke dalam sistem'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        value={patientForm.name}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <Input
                        id="phone"
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08123456789"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Masukkan alamat lengkap"
                      className="resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Tanggal Lahir</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={patientForm.birthDate}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, birthDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <Select value={patientForm.gender} onValueChange={(value) => setPatientForm(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodType">Golongan Darah</Label>
                      <Select value={patientForm.bloodType} onValueChange={(value) => setPatientForm(prev => ({ ...prev, bloodType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih golongan darah" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="AB">AB</SelectItem>
                          <SelectItem value="O">O</SelectItem>
                          <SelectItem value="Tidak Diketahui">Tidak Diketahui</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergi</Label>
                    <Textarea
                      id="allergies"
                      value={patientForm.allergies}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder="Alergi obat, makanan, atau lainnya (opsional)"
                      className="resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Kontak Darurat</Label>
                      <Input
                        id="emergencyContact"
                        value={patientForm.emergencyContact}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Nama kontak darurat"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telepon Darurat</Label>
                      <Input
                        id="emergencyPhone"
                        value={patientForm.emergencyPhone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        placeholder="08123456789"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                      {loading ? 'Menyimpan...' : editMode ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          No. RM
                          {(() => {
                            const patientsWithoutRM = filteredPatients.filter(patient => !patient.medicalRecordNumber)
                            return patientsWithoutRM.length > 0 && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {patientsWithoutRM.length} kosong
                              </Badge>
                            )
                          })()}
                        </div>
                      </TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Umur</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'Tidak ada pasien yang cocok dengan pencarian' : 'Belum ada data pasien'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            {patient.medicalRecordNumber ? (
                              <Badge variant="outline" className="font-mono text-xs bg-pink-50 text-pink-700 border-pink-200">
                                {patient.medicalRecordNumber}
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Belum ada
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateMedicalRecord(patient)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-6"
                                  title="Generate nomor rekam medis"
                                  disabled={loading}
                                >
                                  <Hash className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {patient.phone}
                            </div>
                          </TableCell>
                          <TableCell>{calculateAge(patient.birthDate)} tahun</TableCell>
                          <TableCell>
                            <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'}>
                              {patient.gender}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate" title={patient.address}>
                                {patient.address}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPatient(patient)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit pasien"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Hapus pasien"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus pasien <strong>{patient.name}</strong>?
                                      <br /><br />
                                      Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait pasien.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePatient(patient)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium">Jadwal Kontrol Pasien</h3>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {sortedSchedules.length} jadwal
                </Badge>
              </div>
              
              {/* Quick stats for control schedules */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const today = new Date()
                  const overdue = sortedSchedules.filter(s => new Date(s.controlDate) < today && s.status === 'scheduled').length
                  const todayCount = sortedSchedules.filter(s => new Date(s.controlDate).toDateString() === today.toDateString() && s.status === 'scheduled').length
                  const upcoming = sortedSchedules.filter(s => new Date(s.controlDate) > today && s.status === 'scheduled').length
                  
                  return (
                    <>
                      {overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {overdue} Terlambat
                        </Badge>
                      )}
                      {todayCount > 0 && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          {todayCount} Hari Ini
                        </Badge>
                      )}
                      {upcoming > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">
                          {upcoming} Mendatang
                        </Badge>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetScheduleForm()} className="bg-blue-600 hover:bg-blue-700">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Tambah Jadwal Kontrol
                </Button>
              </DialogTrigger>
              <DialogContent className="large-dialog max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">{editScheduleMode ? 'Edit Jadwal Kontrol' : 'Tambah Jadwal Kontrol'}</DialogTitle>
                  <DialogDescription>
                    {editScheduleMode ? 'Perbarui jadwal kontrol pasien' : 'Buat jadwal kontrol baru untuk pasien - Cari dan pilih pasien dari tabel di bawah'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleScheduleSubmit} className="space-y-6">
                  {!editScheduleMode && (
                    <div className="space-y-4">
                      <Label htmlFor="schedulePatient" className="text-lg font-medium">Pilih Pasien</Label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Cari nama pasien, nomor RM, atau telepon..."
                            value={scheduleSearchTerm}
                            onChange={(e) => setScheduleSearchTerm(e.target.value)}
                            className="w-full pl-12 py-3 text-base"
                          />
                        </div>
                      
                        {scheduleSearchTerm && (
                          <div className="text-sm text-gray-600">
                            Ditemukan {filteredSchedulePatients.length} pasien
                            {filteredSchedulePatients.length > 10 && ' (menampilkan 10 teratas)'}
                          </div>
                        )}
                      
                        <div className="border rounded-lg max-h-96 overflow-y-auto table-container">
                          <Table className="w-full table-fixed">
                            <TableHeader>
                              <TableRow className="bg-blue-50">
                                <TableHead className="text-blue-700 w-[22%]">Nama Pasien</TableHead>
                                <TableHead className="text-blue-700 w-[14%]">No. RM</TableHead>
                                <TableHead className="text-blue-700 w-[16%]">Telepon</TableHead>
                                <TableHead className="text-blue-700 w-[10%]">Umur</TableHead>
                                <TableHead className="text-blue-700 w-[8%]">Gender</TableHead>  
                                <TableHead className="text-blue-700 w-[20%]">Alamat</TableHead>
                                <TableHead className="text-blue-700 w-[10%] text-center">Pilih</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {!scheduleSearchTerm ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                      <Search className="h-12 w-12 text-gray-300" />
                                      <span className="text-lg">Ketik untuk mencari pasien</span>
                                      <span className="text-sm">Masukkan nama, nomor RM, atau telepon pasien</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : filteredSchedulePatients.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                      <Search className="h-12 w-12 text-gray-300" />
                                      <span className="text-lg">Tidak ada pasien ditemukan</span>
                                      <span className="text-sm">Coba ubah kata kunci pencarian</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredSchedulePatients.slice(0, 10).map((patient) => (
                                  <TableRow
                                    key={patient.id}
                                    className={`cursor-pointer hover:bg-gray-50 ${
                                      scheduleForm.patientId === patient.id ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => {
                                      setScheduleForm(prev => ({ ...prev, patientId: patient.id }))
                                      setScheduleSearchTerm('')
                                    }}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium truncate" title={patient.name}>
                                            {patient.name}
                                          </span>
                                          {scheduleForm.patientId === patient.id && (
                                            <Badge className="bg-blue-600 text-white text-xs flex-shrink-0">Terpilih</Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: '2-digit', 
                                            year: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200 truncate w-full justify-center">
                                        {patient.medicalRecordNumber || 'Belum ada'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{patient.phone}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 text-center">
                                      {calculateAge(patient.birthDate)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'} className="text-xs">
                                        {patient.gender === 'Laki-laki' ? 'L' : 'P'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        <span className="truncate" title={patient.address}>
                                          {patient.address}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={scheduleForm.patientId === patient.id ? "default" : "outline"}
                                        className={`w-full ${scheduleForm.patientId === patient.id ? 
                                          "bg-blue-600 hover:bg-blue-700 text-white" : 
                                          "border-blue-200 text-blue-700 hover:bg-blue-50"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setScheduleForm(prev => ({ ...prev, patientId: patient.id }))
                                          setScheduleSearchTerm('')
                                        }}
                                      >
                                        {scheduleForm.patientId === patient.id ? '✓' : 'Pilih'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {scheduleForm.patientId && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Pasien terpilih: {patients.find(p => p.id === scheduleForm.patientId)?.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label htmlFor="controlDate" className="text-base font-semibold">Tanggal Kontrol</Label>
                      <Input
                        id="controlDate"
                        type="date"
                        value={scheduleForm.controlDate}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, controlDate: e.target.value }))}
                        required
                        className="text-base py-3"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {editScheduleMode && (
                      <div className="space-y-4">
                        <Label htmlFor="status" className="text-base font-semibold">Status</Label>
                        <Select 
                          value={scheduleForm.status} 
                          onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => 
                            setScheduleForm(prev => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="text-base py-3">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Terjadwal</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="scheduleNotes" className="text-base font-semibold">Catatan</Label>
                    <Textarea
                      id="scheduleNotes"
                      placeholder="Catatan atau instruksi khusus untuk kontrol..."
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="resize-none text-base"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetScheduleForm}
                      className="px-8 py-3 text-base"
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !scheduleForm.patientId} 
                      className="bg-blue-600 hover:bg-blue-700 px-10 py-3 text-base"
                      title={!scheduleForm.patientId ? 'Pilih pasien terlebih dahulu' : ''}
                    >
                      {loading ? 'Menyimpan...' : editScheduleMode ? 'Perbarui Jadwal' : 'Simpan Jadwal Kontrol'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Tanggal Kontrol
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            ↑ Terdekat
                          </Badge>
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSchedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Belum ada jadwal kontrol
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSchedules.map((schedule) => {
                        const patient = patients.find(p => p.id === schedule.patientId)
                        const controlDate = new Date(schedule.controlDate)
                        const today = new Date()
                        const isOverdue = controlDate < today && schedule.status === 'scheduled'
                        const isToday = controlDate.toDateString() === today.toDateString()
                        const isUpcoming = controlDate > today && schedule.status === 'scheduled'
                        
                        return (
                          <TableRow 
                            key={schedule.id}
                            className={`${
                              isOverdue ? 'bg-red-50 border-l-4 border-l-red-400' : 
                              isToday ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 
                              isUpcoming ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                            }`}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {schedule.patientName}
                                {isOverdue && <Badge variant="destructive" className="text-xs">Terlambat</Badge>}
                                {isToday && <Badge className="bg-yellow-600 text-white text-xs">Hari Ini</Badge>}
                                {isUpcoming && <Badge className="bg-blue-600 text-white text-xs">Mendatang</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {patient?.medicalRecordNumber || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className={`font-medium ${
                                  isOverdue ? 'text-red-600' : 
                                  isToday ? 'text-yellow-600' : 
                                  isUpcoming ? 'text-blue-600' : 'text-gray-900'
                                }`}>
                                  {controlDate.toLocaleDateString('id-ID')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {controlDate.toLocaleDateString('id-ID', { weekday: 'long' })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                            <TableCell>{schedule.notes || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSchedule(schedule)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Edit jadwal kontrol"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Hapus jadwal kontrol"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus jadwal kontrol untuk pasien <strong>{schedule.patientName}</strong> pada tanggal <strong>{new Date(schedule.controlDate).toLocaleDateString('id-ID')}</strong>?
                                        <br /><br />
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium">Rekam Medis Pasien</h3>
              <Badge variant="outline" className="text-pink-600 border-pink-200">
                {filteredRecords.length} rekam medis
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pasien, diagnosis, keluhan, atau no. RM..."
                  value={recordFilterTerm}
                  onChange={(e) => setRecordFilterTerm(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
              
              <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetRecordForm()} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Rekam Medis
                  </Button>
                </DialogTrigger>
                <DialogContent className="large-dialog max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editRecordMode ? 'Edit Rekam Medis' : 'Tambah Rekam Medis'}</DialogTitle>
                    <DialogDescription>
                      {editRecordMode ? 'Perbarui informasi rekam medis pasien' : 'Buat rekam medis baru untuk pasien - Cari dan pilih pasien dari tabel di bawah'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleRecordSubmit} className="space-y-6">
                    {!editRecordMode && (
                      <div className="space-y-4">
                        <Label htmlFor="recordPatient" className="text-lg font-medium">Pilih Pasien</Label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              placeholder="Cari nama pasien, nomor RM, atau telepon..."
                              value={recordSearchTerm}
                              onChange={(e) => setRecordSearchTerm(e.target.value)}
                              className="w-full pl-12 py-3 text-base"
                            />
                          </div>
                        
                          {recordSearchTerm && (
                            <div className="text-sm text-gray-600">
                              Ditemukan {filteredRecordPatients.length} pasien
                              {filteredRecordPatients.length > 5 && ' (menampilkan 5 teratas)'}
                            </div>
                          )}
                        
                          <div className="border rounded-lg max-h-96 overflow-y-auto table-container">
                            <Table className="w-full table-fixed">
                              <TableHeader>
                                <TableRow className="bg-green-50">
                                  <TableHead className="text-green-700 w-[22%]">Nama Pasien</TableHead>
                                  <TableHead className="text-green-700 w-[14%]">No. RM</TableHead>
                                  <TableHead className="text-green-700 w-[16%]">Telepon</TableHead>
                                  <TableHead className="text-green-700 w-[10%]">Umur</TableHead>
                                  <TableHead className="text-green-700 w-[8%]">Gender</TableHead>  
                                  <TableHead className="text-green-700 w-[20%]">Alamat</TableHead>
                                  <TableHead className="text-green-700 w-[10%] text-center">Pilih</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {!recordSearchTerm ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                      <div className="flex flex-col items-center gap-3">
                                        <Search className="h-12 w-12 text-gray-300" />
                                        <span className="text-lg">Ketik untuk mencari pasien</span>
                                        <span className="text-sm">Masukkan nama, nomor RM, atau telepon pasien</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : filteredRecordPatients.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                      <div className="flex flex-col items-center gap-3">
                                        <Search className="h-12 w-12 text-gray-300" />
                                        <span className="text-lg">Tidak ada pasien ditemukan</span>
                                        <span className="text-sm">Coba ubah kata kunci pencarian</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredRecordPatients.slice(0, 5).map((patient) => (
                                    <TableRow
                                      key={patient.id}
                                      className={`cursor-pointer hover:bg-gray-50 ${
                                        recordForm.patientId === patient.id ? 'bg-green-50' : ''
                                      }`}
                                      onClick={() => {
                                        setRecordForm(prev => ({ ...prev, patientId: patient.id }))
                                        setRecordSearchTerm('')
                                      }}
                                    >
                                      <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate" title={patient.name}>
                                              {patient.name}
                                            </span>
                                            {recordForm.patientId === patient.id && (
                                              <Badge className="bg-green-600 text-white text-xs flex-shrink-0">Terpilih</Badge>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID', {
                                              day: '2-digit',
                                              month: '2-digit', 
                                              year: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs bg-green-50 text-green-700 border-green-200 truncate w-full justify-center">
                                          {patient.medicalRecordNumber || 'Belum ada'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{patient.phone}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600 text-center">
                                        {calculateAge(patient.birthDate)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'} className="text-xs">
                                          {patient.gender === 'Laki-laki' ? 'L' : 'P'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate" title={patient.address}>
                                            {patient.address}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={recordForm.patientId === patient.id ? "default" : "outline"}
                                          className={`w-full ${recordForm.patientId === patient.id ? 
                                            "bg-green-600 hover:bg-green-700 text-white" : 
                                            "border-green-200 text-green-700 hover:bg-green-50"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setRecordForm(prev => ({ ...prev, patientId: patient.id }))
                                            setRecordSearchTerm('')
                                          }}
                                        >
                                          {recordForm.patientId === patient.id ? '✓' : 'Pilih'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {recordForm.patientId && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Pasien terpilih: {patients.find(p => p.id === recordForm.patientId)?.name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label htmlFor="visitDate" className="text-base font-semibold">Tanggal Kunjungan</Label>
                      <Input
                        id="visitDate"
                        type="date"
                        value={recordForm.visitDate}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, visitDate: e.target.value }))}
                        required
                        className="text-base py-3"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="complaint" className="text-base font-semibold">Keluhan Utama</Label>
                      <Textarea
                        id="complaint"
                        placeholder="Masukkan keluhan utama pasien..."
                        value={recordForm.complaint}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, complaint: e.target.value }))}
                        className="resize-none text-base"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="diagnosis" className="text-base font-semibold">Diagnosis</Label>
                      <Textarea
                        id="diagnosis"
                        placeholder="Masukkan diagnosis dokter..."
                        value={recordForm.diagnosis}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        className="resize-none text-base"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="treatment" className="text-base font-semibold">Tindakan</Label>
                      <Textarea
                        id="treatment"
                        placeholder="Masukkan tindakan yang dilakukan..."
                        value={recordForm.treatment}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                        className="resize-none text-base"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="prescription" className="text-base font-semibold">Resep Obat (Opsional)</Label>
                      <Textarea
                        id="prescription"
                        placeholder="Masukkan resep obat jika ada..."
                        value={recordForm.prescription}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, prescription: e.target.value }))}
                        className="resize-none text-base"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="recordNotes" className="text-base font-semibold">Catatan Tambahan (Opsional)</Label>
                      <Textarea
                        id="recordNotes"
                        placeholder="Catatan tambahan untuk rekam medis..."
                        value={recordForm.notes}
                        onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="resize-none text-base"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetRecordForm}
                        className="px-8 py-3 text-base"
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading || !recordForm.patientId} 
                        className="bg-green-600 hover:bg-green-700 px-10 py-3 text-base"
                        title={!recordForm.patientId ? 'Pilih pasien terlebih dahulu' : ''}
                      >
                        {loading ? 'Menyimpan...' : editRecordMode ? 'Perbarui Rekam Medis' : 'Simpan Rekam Medis'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Tanggal Kunjungan</TableHead>
                      <TableHead>Keluhan</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Tindakan</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {recordFilterTerm ? 'Tidak ada rekam medis yang cocok dengan pencarian' : 'Belum ada rekam medis'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => {
                        const patient = patients.find(p => p.id === record.patientId)
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.patientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {patient?.medicalRecordNumber || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(record.visitDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={record.complaint}>
                                {record.complaint}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={record.diagnosis}>
                                {record.diagnosis}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={record.treatment}>
                                {record.treatment}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintRecord(record)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Cetak rekam medis"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRecord(record)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Edit rekam medis"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Hapus rekam medis"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus rekam medis untuk pasien <strong>{record.patientName}</strong> pada tanggal <strong>{new Date(record.visitDate).toLocaleDateString('id-ID')}</strong>?
                                        <br /><br />
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteRecord(record)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}