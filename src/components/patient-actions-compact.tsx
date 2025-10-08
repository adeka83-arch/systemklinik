import { useState } from 'react'
import { Button } from './ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'
import { CompactPrintDropdown, FormType } from './compact-print-dropdown'
import { 
  generateOrthoForm, 
  generatePrescription,
  generateXrayReferral,
  generateSpecialistReferral,
  generateMedicalCertificate
} from './print-functions'
import { toast } from 'sonner@2.0.3'

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

interface PatientActionsCompactProps {
  patient: Patient
  doctors: Doctor[]
  onEdit?: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
  onView?: (patient: Patient) => void
  disabled?: boolean
}

export function PatientActionsCompact({ 
  patient, 
  doctors, 
  onEdit, 
  onDelete, 
  onView,
  disabled = false 
}: PatientActionsCompactProps) {
  
  const generateInformedConsent = (patient: Patient, doctorName: string, printDate: string) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Use the same informed consent template from your existing code
    const consentHTML = `
<!DOCTYPE html>
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
        .content { margin: 20px 0; text-align: justify; line-height: 1.6; }
        .content p { margin-bottom: 10px; font-size: 11px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 10px; }
        @media print {
            body { margin: 0; font-size: 12px; }
            .consent-container { margin: 0; padding: 0; max-width: none; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="consent-container">
        <div class="header">
            <div class="clinic-info">
                <div class="clinic-name">Falasifah Dental Clinic</div>
                <div class="clinic-address">
                    Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama<br>
                    Kec. Sawangan, Depok, Jawa Barat<br>
                    Telp/WA: 085283228355
                </div>
            </div>
        </div>

        <div class="title">Persetujuan Tindakan Medis (Informed Consent)</div>

        <div class="patient-info">
            <div class="info-row">
                <div class="info-label">Nama Pasien:</div>
                <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. RM:</div>
                <div class="info-value">${patient.medicalRecordNumber || 'Belum tersedia'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter:</div>
                <div class="info-value">${doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal:</div>
                <div class="info-value">${new Date(printDate).toLocaleDateString('id-ID')}</div>
            </div>
        </div>

        <div class="content">
            <p>Yang bertanda tangan di bawah ini, menyatakan bahwa saya telah mendapat penjelasan secara lengkap mengenai tindakan medis yang akan dilakukan kepada saya, termasuk:</p>
            <p>• Diagnosis dan kondisi kesehatan saat ini</p>
            <p>• Prosedur tindakan yang akan dilakukan</p>
            <p>• Risiko dan komplikasi yang mungkin terjadi</p>
            <p>• Alternatif pengobatan yang tersedia</p>
            <p>• Prognosis atau perkiraan hasil pengobatan</p>
            
            <p>Dengan penuh kesadaran dan tanpa paksaan dari pihak manapun, saya menyetujui untuk menjalani tindakan medis tersebut.</p>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div style="font-size: 11px; margin-bottom: 50px;">Pasien/Keluarga</div>
                <div class="signature-line">(${patient.name})</div>
            </div>
            <div class="signature-box">
                <div style="font-size: 11px; margin-bottom: 50px;">Dokter</div>
                <div class="signature-line">(${doctorName})</div>
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

    printWindow.document.write(consentHTML)
    printWindow.document.close()
  }

  const handlePrint = async (patient: Patient, formType: FormType, doctorId: string) => {
    try {
      const selectedDoctor = doctors.find(doc => doc.id === doctorId)
      if (!selectedDoctor) {
        toast.error('Dokter tidak ditemukan')
        return
      }

      const doctorName = selectedDoctor.name
      const printDate = new Date().toISOString().split('T')[0]

      console.log('Printing form:', { formType, doctorName, patient: patient.name })

      switch (formType) {
        case 'informed-consent':
          generateInformedConsent(patient, doctorName, printDate)
          break

        case 'ortho-form':
          generateOrthoForm(patient, doctorName, printDate)
          break
        case 'prescription':
          generatePrescription(patient, doctorName, printDate)
          break
        case 'xray-referral':
          generateXrayReferral(patient, doctorName, printDate)
          break
        case 'specialist-referral':
          generateSpecialistReferral(patient, doctorName, printDate)
          break
        case 'medical-certificate':
          generateMedicalCertificate(patient, doctorName, printDate)
          break
        default:
          toast.error('Tipe formulir tidak dikenal')
          return
      }

      toast.success('Dokumen berhasil dicetak')
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Gagal mencetak dokumen')
    }
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Action Buttons */}
      <div className="flex gap-1">
        {onView && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(patient)}
            disabled={disabled}
            className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(patient)}
            disabled={disabled}
            className="h-8 w-8 p-0 border-amber-200 text-amber-600 hover:bg-amber-50"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        
        {onDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(patient)}
            disabled={disabled}
            className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Print Dropdown */}
      <div className="border-l border-gray-200 pl-2">
        <CompactPrintDropdown 
          patient={patient}
          doctors={doctors}
          onPrint={handlePrint}
          disabled={disabled}
        />
      </div>
    </div>
  )
}