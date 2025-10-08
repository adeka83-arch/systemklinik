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



// Helper functions for formatting
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



const generateOrthoFormHTML = (patient: Patient, doctorName: string, printDate: string) => {
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
    <title>Formulir Ortodontik - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 11px; line-height: 1.3; color: #333; background: white; }
        .ortho-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 3px solid #e91e63; padding-bottom: 12px; gap: 15px; }
        .logo { height: 60px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 20px; font-weight: bold; color: #e91e63; margin-bottom: 3px; }
        .clinic-address { font-size: 10px; color: #666; line-height: 1.2; }
        .title { font-size: 16px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; text-transform: uppercase; }
        .patient-info { background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { font-weight: bold; width: 110px; color: #495057; font-size: 10px; }
        .info-value { flex: 1; color: #212529; font-size: 10px; }
        .section { margin: 15px 0; }
        .section-title { font-size: 13px; font-weight: bold; color: #e91e63; margin-bottom: 10px; border-bottom: 2px solid #e91e63; padding-bottom: 3px; }
        .form-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .form-table td { border: 1px solid #ddd; padding: 8px; font-size: 10px; vertical-align: top; }
        .form-table .label-cell { width: 30%; background: #f8f9fa; font-weight: bold; color: #495057; }
        .form-table .value-cell { width: 70%; }
        .checkbox-line { display: flex; align-items: center; margin: 8px 0; font-size: 10px; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; flex-shrink: 0; }
        .signature-section { margin-top: 25px; display: flex; justify-content: space-between; }
        .signature-box { width: 48%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; font-size: 9px; }
        .two-column { display: flex; gap: 15px; }
        .column { flex: 1; }
        .inline-checkbox { display: inline-flex; align-items: center; margin-right: 15px; margin-bottom: 5px; }
        .inline-checkbox .checkbox { margin-right: 5px; }
        .phase-table { border: 2px solid #e91e63; }
        .phase-header { background: #e91e63; color: white; font-weight: bold; text-align: center; }
        .treatment-row { min-height: 25px; }
        .notes-row { min-height: 60px; }
        .photo-section { border: 1px dashed #ccc; min-height: 100px; text-align: center; padding: 20px; margin: 10px 0; }
        @media print {
            body { margin: 0; font-size: 11px; }
            .ortho-container { margin: 0; padding: 0; max-width: none; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="ortho-container">
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

        <div class="title">Formulir Tindakan Ortodontik (Behel)</div>

        <div class="patient-info">
            <div class="info-row">
                <div class="info-label">Nama Pasien:</div>
                <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. Rekam Medis:</div>
                <div class="info-value">${patient.medicalRecordNumber || 'Belum tersedia'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Lahir:</div>
                <div class="info-value">${formatDate(patient.birthDate)} (${calculateAge(patient.birthDate)} tahun)</div>
            </div>
            <div class="info-row">
                <div class="info-label">Jenis Kelamin:</div>
                <div class="info-value">${patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. Telepon:</div>
                <div class="info-value">${patient.phone}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter Ortodontis:</div>
                <div class="info-value">${doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Pencetakan:</div>
                <div class="info-value">${formatDate(printDate)}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">I. Anamnesis & Pemeriksaan Awal</div>
            <table class="form-table">
                <tr>
                    <td class="label-cell">Keluhan Utama</td>
                    <td class="value-cell treatment-row">____________________________________________________________________</td>
                </tr>
                <tr>
                    <td class="label-cell">Riwayat Kebiasaan Buruk</td>
                    <td class="value-cell">
                        <div class="inline-checkbox"><div class="checkbox"></div> Menghisap jempol</div>
                        <div class="inline-checkbox"><div class="checkbox"></div> Menggigit kuku</div>
                        <div class="inline-checkbox"><div class="checkbox"></div> Bernapas melalui mulut</div><br>
                        <div class="inline-checkbox"><div class="checkbox"></div> Menggigit bibir</div>
                        <div class="inline-checkbox"><div class="checkbox"></div> Menjulurkan lidah</div>
                        <div class="inline-checkbox"><div class="checkbox"></div> Lainnya: _________________</div>
                    </td>
                </tr>
                <tr>
                    <td class="label-cell">Riwayat Perawatan Gigi</td>
                    <td class="value-cell treatment-row">____________________________________________________________________</td>
                </tr>
            </table>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div>Pasien/Wali</div>
                <div class="signature-line">(${patient.name})</div>
            </div>
            <div class="signature-box">
                <div>Dokter Ortodontis</div>
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
}

export const generateOrthoForm = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Ortho Form for printing...')
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const orthoHTML = generateOrthoFormHTML(patient, doctorName, printDate)
      printWindow.document.write(orthoHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const orthoHTML = generateOrthoFormHTML(patient, doctorName, printDate)
  const blob = new Blob([orthoHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Ortho-Form-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}

export const generatePrescription = (patient: Patient, doctorName: string, printDate: string) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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

  const prescriptionHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resep Obat - ${patient.name}</title>
    <style>
        @page { size: A5; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 11px; line-height: 1.3; color: #333; background: white; }
        .prescription-container { width: 100%; max-width: 148mm; margin: 0 auto; padding: 0; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #e91e63; padding-bottom: 10px; gap: 10px; }
        .logo { height: 60px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 3px; }
        .clinic-address { font-size: 9px; color: #666; line-height: 1.2; }
        .title { font-size: 14px; font-weight: bold; color: #e91e63; margin: 12px 0; text-align: center; text-transform: uppercase; }
        .prescription-info { background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 15px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 80px; color: #495057; font-size: 9px; }
        .info-value { flex: 1; color: #212529; font-size: 9px; }
        .date-doctor { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .date-box, .doctor-box { flex: 1; }
        .date-box { margin-right: 10px; }
        .section-title { font-size: 12px; font-weight: bold; color: #e91e63; margin-bottom: 8px; border-bottom: 1px solid #e91e63; padding-bottom: 2px; }
        .prescription-area { border: 1px solid #e5e7eb; min-height: 150px; padding: 15px; margin-bottom: 15px; background: white; }
        .rx-symbol { font-size: 24px; color: #e91e63; font-weight: bold; margin-bottom: 10px; }
        .signature-section { margin-top: 20px; text-align: right; }
        .signature-box { display: inline-block; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 9px; }
        .validity { text-align: center; font-size: 8px; color: #666; margin-top: 15px; }
        @media print {
            body { margin: 0; font-size: 11px; }
            .prescription-container { margin: 0; padding: 0; max-width: none; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="prescription-container">
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

        <div class="title">Resep Obat</div>

        <div class="prescription-info">
            <div class="info-row">
                <div class="info-label">Nama Pasien:</div>
                <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. RM:</div>
                <div class="info-value">${patient.medicalRecordNumber || 'Belum tersedia'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Umur:</div>
                <div class="info-value">${calculateAge(patient.birthDate)} tahun</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
        </div>

        <div class="date-doctor">
            <div class="date-box">
                <div class="section-title">Tanggal</div>
                <div style="border-bottom: 1px solid #ccc; padding: 5px; font-size: 10px;">
                    ${formatDate(printDate)}
                </div>
            </div>
            <div class="doctor-box">
                <div class="section-title">Dokter</div>
                <div style="border-bottom: 1px solid #ccc; padding: 5px; font-size: 10px;">
                    ${doctorName}
                </div>
            </div>
        </div>

        <div class="section-title">Obat yang Diberikan</div>
        <div class="prescription-area">
            <div class="rx-symbol">℞</div>
            <!-- Area kosong untuk menulis resep -->
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div>Dokter Pemeriksa</div>
                <div class="signature-line">(${doctorName})</div>
            </div>
        </div>

        <div class="validity">
            Surat keterangan ini berlaku sesuai dengan ketentuan yang berlaku
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

  printWindow.document.write(prescriptionHTML)
  printWindow.document.close()
}

// Temporary export placeholders for backward compatibility
export const generateXrayReferral = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Redirecting to generateXrayReferralNew...')
  // This will be handled by the new function in print-functions-updated.tsx
  throw new Error('Gunakan generateXrayReferralNew untuk fungsi ini')
}

export const generateSpecialistReferral = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Redirecting to generateSpecialistReferralNew...')
  // This will be handled by the new function in print-functions-updated.tsx  
  throw new Error('Gunakan generateSpecialistReferralNew untuk fungsi ini')
}

export const generateMedicalCertificate = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Redirecting to generateMedicalCertificateNew...')
  // This will be handled by the new function in print-functions-updated.tsx
  throw new Error('Gunakan generateMedicalCertificateNew untuk fungsi ini')
}