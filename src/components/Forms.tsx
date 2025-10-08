import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Search, FileCheck, Receipt, Smile, Camera, UserCheck, ClipboardList, Printer, Users, Stethoscope, RotateCcw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { generateOrthoForm } from './print-functions'
import { generateOrthoFormComplete } from './ortho-form-complete'
import { generateInformedConsent } from './informed-consent-form'
import { generatePrescriptionNew, generateMedicalCertificateNew, generateSpecialistReferralNew, generateXrayReferralNew, generateDoctorActionFormNew } from './print-functions-enhanced'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'
import { PatientSelector } from './PatientSelector'
import { DoctorSelector } from './DoctorSelector'
import { FormTemplateCard } from './FormTemplateCard'
import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'

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

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface FormsProps {
  accessToken: string
}

const FORM_TEMPLATES = [
  {
    id: 'doctor-action-form',
    title: 'Formulir Tindakan Dokter',
    description: 'Template form A5 compact untuk ditulis manual oleh dokter',
    size: 'A5',
    color: 'purple',
    icon: Stethoscope,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    usage: 'Formulir A5 compact dengan garis untuk ditulis manual, mencakup tindakan, obat, harga, dan catatan admin (1 halaman)'
  },
  {
    id: 'informed-consent',
    title: 'Informed Consent',
    description: 'Persetujuan tindakan medis dari pasien',
    size: 'A4',
    color: 'blue',
    icon: FileCheck,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    usage: 'Digunakan sebelum melakukan tindakan medis untuk mendapatkan persetujuan pasien'
  },
  {
    id: 'ortho-form',
    title: 'Form Ortodontik',
    description: 'Formulir khusus perawatan behel',
    size: 'A4',
    color: 'orange',
    icon: Smile,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    usage: 'Digunakan khusus untuk konsultasi dan perencanaan perawatan ortodontik'
  },
  {
    id: 'prescription',
    title: 'Resep Obat',
    description: 'Template resep obat praktis',
    size: 'Siap Print',
    color: 'green',
    icon: Receipt,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    usage: 'Format standar untuk penulisan resep obat dengan simbol ℞'
  },
  {
    id: 'xray-referral',
    title: 'Rujukan Rontgen',
    description: 'Surat rujukan pemeriksaan radiologi',
    size: 'Siap Print',
    color: 'indigo',
    icon: Camera,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    usage: 'Rujukan untuk pemeriksaan rontgen dengan berbagai jenis (panoramic, periapical, dll)'
  },
  {
    id: 'specialist-referral',
    title: 'Rujukan Spesialis',
    description: 'Surat rujukan ke dokter spesialis',
    size: 'Siap Print',
    color: 'cyan',
    icon: UserCheck,
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    usage: 'Rujukan ke berbagai spesialisasi (bedah mulut, ortodonti, prostodonti, dll)'
  },
  {
    id: 'medical-certificate',
    title: 'Surat Keterangan Berobat',
    description: 'Surat keterangan untuk keperluan administrasi',
    size: 'Siap Print',
    color: 'rose',
    icon: ClipboardList,
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    usage: 'Surat keterangan resmi bahwa pasien telah berobat di klinik'
  }
]

export function Forms({ accessToken }: FormsProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (accessToken) {
      console.log('Forms component: accessToken available, fetching data...', accessToken.slice(0, 10) + '...')
      fetchPatientsAndDoctors()
    } else {
      console.log('Forms component: accessToken not available yet')
    }
  }, [accessToken])



  const fetchPatientsAndDoctors = async () => {
    try {
      setIsLoading(true)
      
      // Fetch patients
      console.log('Fetching patients from:', `${serverUrl}/patients`)
      const patientsResponse = await fetch(`${serverUrl}/patients`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log('Patients response status:', patientsResponse.status)
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        console.log('Patients data received:', patientsData)
        setPatients(patientsData.patients || [])
      } else {
        console.error('Failed to fetch patients:', patientsResponse.statusText)
        toast.error(`Gagal memuat data pasien: ${patientsResponse.statusText}`)
      }

      // Fetch doctors
      console.log('Fetching doctors from:', `${serverUrl}/doctors`)
      const doctorsResponse = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log('Doctors response status:', doctorsResponse.status)
      
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json()
        console.log('Doctors data received:', doctorsData)
        // Clean doctor names from duplicate drg. prefix using utility function
        const cleanedDoctors = cleanDoctorNames(doctorsData.doctors || [])
        setDoctors(cleanedDoctors)
      } else {
        console.error('Failed to fetch doctors:', doctorsResponse.statusText)
        toast.error(`Gagal memuat data dokter: ${doctorsResponse.statusText}`)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data pasien dan dokter: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const generateInformedConsent = (patient: Patient, doctorName: string, printDate: string) => {
    console.log('Generating Informed Consent for printing...')
    
    // Try popup method first
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
      if (printWindow && !printWindow.closed) {
        console.log('Print window opened successfully')
        const consentHTML = generateInformedConsentHTML(patient, doctorName, printDate)
        printWindow.document.write(consentHTML)
        printWindow.document.close()
        return
      }
    } catch (error) {
      console.log('Popup method failed:', error)
    }
    
    // Fallback: create download link
    console.log('Using download fallback method')
    const htmlContent = generateInformedConsentHTML(patient, doctorName, printDate)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Informed-Consent-${patient.name}-${printDate}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
  }

  const handlePrint = async () => {
    if (!selectedForm || !selectedPatient || !selectedDoctor) {
      const missing = []
      if (!selectedForm) missing.push('template formulir')
      if (!selectedPatient) missing.push('pasien')
      if (!selectedDoctor) missing.push('dokter')
      
      toast.error(`Harap pilih: ${missing.join(', ')}`)
      return
    }

    try {
      setIsPrinting(true)
      console.log('=== STARTING PRINT PROCESS ===')
      
      const patient = patients.find(p => p.id === selectedPatient)
      const doctor = doctors.find(d => d.id === selectedDoctor)
      
      if (!patient || !doctor) {
        toast.error('Data pasien atau dokter tidak ditemukan')
        return
      }

      console.log('Selected form:', selectedForm)
      console.log('Patient:', patient.name)
      console.log('Doctor:', doctor.name)

      const printDate = new Date().toISOString().split('T')[0]
      const doctorName = doctor.name

      // Generate form based on type
      if (selectedForm) {
        try {
          switch (selectedForm) {
            case 'informed-consent':
              console.log('Generating informed consent...')
              generateInformedConsent(patient, doctorName, printDate)
              break
            case 'ortho-form':
              console.log('Generating complete ortho form...')
              generateOrthoFormComplete(patient, doctorName, printDate)
              break
            case 'prescription':
              console.log('Generating prescription...')
              generatePrescriptionNew(patient, doctorName, printDate)
              break
            case 'xray-referral':
              console.log('Generating xray referral...')
              generateXrayReferralNew(patient, doctorName, printDate)
              break
            case 'specialist-referral':
              console.log('Generating specialist referral...')
              generateSpecialistReferralNew(patient, doctorName, printDate)
              break
            case 'medical-certificate':
              console.log('Generating medical certificate...')
              generateMedicalCertificateNew(patient, doctorName, printDate)
              break
            case 'doctor-action-form':
              console.log('Generating doctor action form...')
              generateDoctorActionFormNew(patient, doctorName, printDate)
              break
            default:
              console.error('Unknown form type:', selectedForm)
              toast.error('Jenis formulir tidak dikenal: ' + selectedForm)
              return
          }
        } catch (formError) {
          console.log('Form generation result:', formError.message)
          // Check if it's a success message (download fallback)
          if (formError.message && formError.message.includes('berhasil diunduh')) {
            toast.success(formError.message)
          } else {
            toast.error(`Gagal membuat formulir: ${formError.message || 'Unknown error'}`)
            return
          }
        }
      }

      console.log('=== PRINT PROCESS COMPLETED ===')
      toast.success(`Formulir ${FORM_TEMPLATES.find(f => f.id === selectedForm)?.title} berhasil dicetak`)
      
    } catch (error) {
      console.error('Print error:', error)
      toast.error(`Gagal mencetak formulir: ${error.message || 'Unknown error'}`)
    } finally {
      setIsPrinting(false)
    }
  }

  const generateInformedConsentHTML = (patient: Patient, doctorName: string, printDate: string) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
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

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informed Consent - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; }
        .consent-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 3px solid #e91e63; padding-bottom: 15px; gap: 20px; }
        .logo { height: 80px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.3; }
        .title { font-size: 18px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; text-transform: uppercase; }
        .patient-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 120px; color: #495057; font-size: 11px; }
        .info-value { flex: 1; color: #212529; font-size: 11px; }
        .content { margin: 20px 0; line-height: 1.6; }
        .section { margin: 20px 0; }
        .section-title { font-size: 14px; font-weight: bold; color: #e91e63; margin-bottom: 10px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 10px; }
        .checkbox-line { display: flex; align-items: center; margin: 10px 0; font-size: 12px; }
        .checkbox { width: 15px; height: 15px; border: 1px solid #333; margin-right: 10px; flex-shrink: 0; }
        @media print {
            body { margin: 0; font-size: 12px; }
            .consent-container { margin: 0; padding: 0; max-width: none; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="consent-container">
        <div class="header">
            <img src="${clinicLogo}" alt="Logo Falasifah Dental Clinic" class="logo">
            <div class="clinic-info">
                <div class="clinic-name">Falasifah Dental Clinic</div>
                <div class="clinic-address">
                    Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama<br>
                    Kec. Sawangan, Depok, Jawa Barat<br>
                    Telp/WA: 085283228355
                </div>
            </div>
        </div>

        <div class="title">Informed Consent (Persetujuan Tindakan)</div>

        <div class="patient-info">
            <div class="info-row">
                <div class="info-label">Nama Pasien:</div>
                <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Lahir:</div>
                <div class="info-value">${formatDate(patient.birthDate)} (${calculateAge(patient.birthDate)} tahun)</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter:</div>
                <div class="info-value">drg. ${doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal:</div>
                <div class="info-value">${formatDate(printDate)}</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">Tindakan yang Direncanakan:</div>
                <div style="border: 1px solid #ddd; min-height: 80px; padding: 10px; margin: 10px 0;">
                    ________________________________________________________________________________________________
                    <br><br>
                    ________________________________________________________________________________________________
                    <br><br>
                    ________________________________________________________________________________________________
                </div>
            </div>

            <div class="section">
                <div class="section-title">Risiko dan Komplikasi yang Mungkin Terjadi:</div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Nyeri atau ketidaknyamanan setelah tindakan
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Pendarahan ringan
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Pembengkakan
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Infeksi (jarang terjadi)
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Lainnya: ___________________________________________________________________________
                </div>
            </div>

            <div class="section">
                <div class="section-title">Pernyataan Persetujuan:</div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Saya telah mendapat penjelasan yang cukup mengenai tindakan yang akan dilakukan
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Saya memahami risiko dan komplikasi yang mungkin terjadi
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Saya menyetujui tindakan tersebut dilakukan
                </div>
                <div class="checkbox-line">
                    <div class="checkbox"></div>
                    Saya bersedia mengikuti instruksi perawatan setelah tindakan
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div>Pasien/Wali</div>
                <div class="signature-line">(${patient.name})</div>
            </div>
            <div class="signature-box">
                <div>Dokter Pemeriksa</div>
                <div class="signature-line">(drg. ${doctorName})</div>
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>`
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

  const selectedFormData = FORM_TEMPLATES.find(form => form.id === selectedForm)
  const selectedPatientData = patients.find(p => p.id === selectedPatient)
  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-2 text-pink-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-pink-600" />
          <h1 className="text-2xl text-pink-800">Formulir Medis</h1>
        </div>
        <Badge variant="outline" className="text-pink-600 border-pink-200">
          {FORM_TEMPLATES.length} Template Tersedia
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Templates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg text-pink-800">Pilih Template Formulir</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-pink-600">
                <FileCheck className="h-4 w-4" />
                Siap cetak
              </div>
              {selectedForm && (
                <Badge variant="outline" className="text-pink-600 border-pink-200">
                  1 dipilih
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORM_TEMPLATES.map((template) => (
              <FormTemplateCard
                key={template.id}
                template={template}
                isSelected={selectedForm === template.id}
                onClick={() => setSelectedForm(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Form Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-pink-800">Konfigurasi Cetak</CardTitle>
                <div className="flex items-center gap-1">
                  {selectedForm && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {selectedPatient && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {selectedDoctor && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {/* Patient Selection */}
              <div>
                <label className="text-sm font-medium text-pink-800 mb-3 block flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-pink-600" />
                    Pilih Pasien
                  </span>
                  {selectedPatient && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                      ✓ Dipilih
                    </Badge>
                  )}
                </label>
                <PatientSelector
                  patients={patients}
                  selectedPatientId={selectedPatient}
                  onPatientSelect={setSelectedPatient}
                  placeholder="Pilih pasien untuk formulir"
                />
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="text-sm font-medium text-pink-800 mb-3 block flex items-center justify-between">
                  <span className="flex items-center">
                    <Stethoscope className="h-4 w-4 mr-2 text-pink-600" />
                    Pilih Dokter
                  </span>
                  {selectedDoctor && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                      ✓ Dipilih
                    </Badge>
                  )}
                </label>
                <DoctorSelector
                  doctors={doctors}
                  selectedDoctorId={selectedDoctor}
                  onDoctorSelect={setSelectedDoctor}
                  placeholder="Pilih dokter pemeriksa"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handlePrint}
                  disabled={!selectedForm || !selectedPatient || !selectedDoctor || isPrinting}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mencetak...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak Formulir
                    </>
                  )}
                </Button>
                
                {(selectedForm || selectedPatient || selectedDoctor) && (
                  <Button 
                    onClick={() => {
                      setSelectedForm('')
                      setSelectedPatient('')
                      setSelectedDoctor('')
                    }}
                    variant="outline"
                    className="w-full text-pink-600 border-pink-200 hover:bg-pink-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Pilihan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {selectedFormData && selectedPatientData && selectedDoctorData && (
            <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-pink-800 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-3 border border-pink-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded ${selectedFormData.bgColor}`}>
                      <selectedFormData.icon className={`h-3 w-3 ${selectedFormData.textColor}`} />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-gray-700">Template:</div>
                      <div className="text-pink-600">{selectedFormData.title}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-pink-100">
                  <div className="text-xs space-y-2">
                    <div>
                      <div className="font-medium text-gray-700">Pasien:</div>
                      <div className="font-medium">{selectedPatientData.name}</div>
                      <div className="text-gray-500 flex items-center gap-3">
                        <span>RM: {selectedPatientData.medicalRecordNumber || 'Belum tersedia'}</span>
                        <span>{calculateAge(selectedPatientData.birthDate)} tahun</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedPatientData.gender === 'male' ? 'L' : 'P'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Dokter:</div>
                      <div className="font-medium">drg. {selectedDoctorData.name}</div>
                      <div className="text-gray-500">{selectedDoctorData.specialization}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}