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

export const generateMedicalCertificateNew = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Medical Certificate for printing...')
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const certificateHTML = generateMedicalCertificateHTML(patient, doctorName, printDate)
      printWindow.document.write(certificateHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const certificateHTML = generateMedicalCertificateHTML(patient, doctorName, printDate)
  const blob = new Blob([certificateHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Medical-Certificate-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}

const generateMedicalCertificateHTML = (patient: Patient, doctorName: string, printDate: string) => {
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

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Surat Keterangan Berobat - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px; line-height: 1.3; color: #333; background: white; }
        .certificate-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        /* Header Styles */
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 3px solid #e91e63; padding-bottom: 12px; gap: 20px; }
        .logo { height: 75px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 4px; }
        .clinic-address { font-size: 12px; color: #666; line-height: 1.2; }
        
        .title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; text-transform: uppercase; }
        
        /* Patient Info */
        .patient-info { margin-bottom: 16px; background: #f8f9fa; padding: 12px; border-radius: 6px; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { font-weight: bold; width: 140px; color: #333; font-size: 13px; }
        .info-value { flex: 1; color: #333; font-size: 13px; }
        
        /* Sections */
        .section { margin: 15px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #e91e63; margin-bottom: 8px; border-bottom: 2px solid #e91e63; padding-bottom: 4px; }
        .section-content { border: 1px solid #e5e5e5; padding: 12px; min-height: 50px; margin-bottom: 10px; background: white; }
        .content-line { border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 20px; }
        .content-line:last-child { margin-bottom: 0; }
        
        /* Recommendation Box */
        .recommendation-box { border: 2px solid #f59e0b; background-color: #fef3c7; padding: 12px; margin: 15px 0; text-align: center; border-radius: 6px; }
        .recommendation-title { font-weight: bold; color: #92400e; margin-bottom: 10px; font-size: 14px; }
        .rest-options { display: flex; justify-content: center; gap: 30px; margin-bottom: 10px; }
        .checkbox-option { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #333; flex-shrink: 0; }
        .date-range { margin-top: 10px; font-size: 13px; font-weight: 500; }
        
        /* Footer */
        .footer-note { text-align: center; font-size: 12px; color: #666; margin: 15px 0; font-style: italic; }
        
        /* Signature */
        .date-doctor-section { display: flex; justify-content: flex-end; margin-top: 20px; }
        .doctor-signature { text-align: center; min-width: 180px; }
        .signature-date { margin-bottom: 8px; font-size: 13px; font-weight: 500; }
        .signature-title { margin-bottom: 8px; font-size: 13px; font-weight: 500; }
        .doctor-name { margin-top: 60px; border-top: 1px solid #333; padding-top: 8px; font-size: 13px; font-weight: 500; }
        
        .validity-note { text-align: center; font-size: 11px; color: #666; margin-top: 10px; font-style: italic; }
        
        @media print {
            body { margin: 0; font-size: 14px; -webkit-print-color-adjust: exact; }
            .certificate-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 12px; padding-bottom: 10px; }
            .patient-info { margin-bottom: 12px; }
            .section { margin: 12px 0; }
            .date-doctor-section { margin-top: 15px; }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
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

        <div class="title">Surat Keterangan Berobat</div>

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
                <div class="info-label">Umur:</div>
                <div class="info-value">${calculateAge(patient.birthDate)} tahun</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. Telepon:</div>
                <div class="info-value">${patient.phone}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Keluhan/Diagnosis</div>
            <div class="section-content">
                <div class="content-line"></div>
                <div class="content-line"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Tindakan yang Dilakukan</div>
            <div class="section-content">
                <div class="content-line"></div>
                <div class="content-line"></div>
            </div>
        </div>

        <div class="recommendation-box">
            <div class="recommendation-title">Rekomendasi Istirahat:</div>
            <div class="rest-options">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Tidak perlu istirahat</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Istirahat _____ hari</span>
                </div>
            </div>
            <div class="date-range">
                Dari tanggal: ________________ sampai ________________
            </div>
        </div>

        <div class="section">
            <div class="section-title">Catatan Khusus</div>
            <div class="section-content">
                <div class="content-line"></div>
                <div class="content-line"></div>
            </div>
        </div>

        <div class="footer-note">
            Surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div class="signature-date">Depok, ${formatDate(printDate)}</div>
                <div class="signature-title">Dokter yang memeriksa</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
            </div>
        </div>

        <div class="validity-note">
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
}

export const generatePrescriptionNew = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Prescription for printing...')
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const prescriptionHTML = generatePrescriptionHTML(patient, doctorName, printDate)
      printWindow.document.write(prescriptionHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const prescriptionHTML = generatePrescriptionHTML(patient, doctorName, printDate)
  const blob = new Blob([prescriptionHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Prescription-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}

const generatePrescriptionHTML = (patient: Patient, doctorName: string, printDate: string) => {
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

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resep Obat - ${patient.name}</title>
    <style>
        @page { size: A5; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 11px; line-height: 1.25; color: #333; background: white; }
        .prescription-container { width: 100%; max-width: 148mm; margin: 0 auto; padding: 0; }
        
        .header { display: flex; align-items: flex-start; justify-content: flex-start; margin-bottom: 14px; border-bottom: 3px solid #e91e63; padding-bottom: 10px; gap: 12px; }
        .logo { height: 50px; width: auto; object-fit: contain; flex-shrink: 0; }
        .clinic-info { text-align: left; flex: 1; }
        .clinic-name { font-size: 16px; font-weight: bold; color: #e91e63; margin-bottom: 2px; }
        .clinic-address { font-size: 9px; color: #333; line-height: 1.2; }
        
        .title { font-size: 14px; font-weight: bold; color: #e91e63; margin: 12px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { margin-bottom: 14px; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; width: 90px; color: #333; font-size: 10px; }
        .info-value { flex: 1; color: #333; font-size: 10px; }
        
        .date-doctor-section { display: flex; gap: 15px; margin-bottom: 14px; }
        .date-section, .doctor-section { flex: 1; }
        .section-title { font-size: 11px; font-weight: bold; color: #e91e63; margin-bottom: 6px; border-bottom: 2px solid #e91e63; padding-bottom: 3px; }
        .input-box { border: 1px solid #ccc; padding: 6px; min-height: 24px; background: white; font-size: 10px; }
        
        .prescription-body { margin: 14px 0; }
        .rx-section { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
        .rx-symbol { font-size: 28px; font-weight: bold; color: #e91e63; line-height: 1; }
        .medication-title { font-size: 12px; font-weight: bold; color: #e91e63; margin-top: 6px; }
        
        .medication-area { border: 1px solid #e5e5e5; padding: 14px; min-height: 180px; background: white; margin-bottom: 14px; }
        
        .instructions { font-size: 9px; color: #666; line-height: 1.3; margin-bottom: 14px; }
        .instructions ul { margin-left: 12px; }
        .instructions li { margin-bottom: 2px; }
        
        .signature-section { margin-top: 18px; text-align: right; }
        .signature-content { display: inline-block; text-align: center; }
        .signature-title { font-size: 10px; color: #333; margin-bottom: 35px; }
        .signature-line { font-size: 9px; color: #333; }
        .validity-note { text-align: center; font-size: 8px; color: #666; margin-top: 12px; }
        
        @media print {
            body { margin: 0; font-size: 11px; }
            .prescription-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 10px; padding-bottom: 8px; }
            .patient-info { margin-bottom: 10px; }
            .signature-section { margin-top: 14px; }
            .medication-area { min-height: 160px; }
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
                <div class="info-label">Umur:</div>
                <div class="info-value">${calculateAge(patient.birthDate)} tahun</div>
            </div>
            <div class="info-row">
                <div class="info-label">Alamat:</div>
                <div class="info-value">${patient.address}</div>
            </div>
        </div>

        <div class="date-doctor-section">
            <div class="date-section">
                <div class="section-title">Tanggal Resep</div>
                <div class="input-box">${formatDate(printDate)}</div>
            </div>
            <div class="doctor-section">
                <div class="section-title">Dokter Pemeriksa</div>
                <div class="input-box">drg. ${doctorName}</div>
            </div>
        </div>

        <div class="prescription-body">
            <div class="rx-section">
                <div class="rx-symbol">℞</div>
                <div class="medication-title">Daftar Obat</div>
            </div>
            
            <div class="medication-area">
                <!-- Area kosong untuk menulis resep obat -->
            </div>
        </div>

        <div class="instructions">
            <ul>
                <li>Jika ada reaksi alergi atau efek samping yang tidak diinginkan, segera hubungi dokter</li>
                <li>Jangan memberikan obat ini kepada orang lain</li>
                <li>Konsultasikan dengan dokter jika gejela tidak kunjung membaik dalam 2-5 hari</li>
            </ul>
        </div>

        <div class="signature-section">
            <div class="signature-content">
                <div class="signature-title">Dokter Pemeriksa</div>
                <div class="signature-line">(drg. ${doctorName})</div>
            </div>
        </div>

        <div class="validity-note">
            Resep ini berlaku selama 30 hari sejak tanggal diterbitkan
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

export const generateSpecialistReferralNew = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Specialist Referral for printing...')
  console.log('Patient data:', patient)
  console.log('Doctor name:', doctorName)
  console.log('Print date:', printDate)
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const referralHTML = generateSpecialistReferralHTML(patient, doctorName, printDate)
      console.log('HTML length:', referralHTML.length)
      console.log('HTML preview:', referralHTML.substring(0, 200))
      printWindow.document.write(referralHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const referralHTML = generateSpecialistReferralHTML(patient, doctorName, printDate)
  const blob = new Blob([referralHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Specialist-Referral-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}

const generateSpecialistReferralHTML = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('=== generateSpecialistReferralHTML called ===')
  console.log('Patient:', patient)
  console.log('Doctor Name:', doctorName)
  console.log('Print Date:', printDate)

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

  console.log('Formatted date:', formatDate(printDate))
  console.log('Patient age:', calculateAge(patient.birthDate))
  
  const referralHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rujukan Spesialis - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.3; color: #333; background: white; }
        .referral-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 3px solid #e91e63; padding-bottom: 12px; gap: 18px; }
        .logo { height: 70px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 22px; font-weight: bold; color: #e91e63; margin-bottom: 4px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.2; }
        
        .title { font-size: 18px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { font-weight: bold; width: 130px; color: #495057; font-size: 11px; }
        .info-value { flex: 1; color: #212529; font-size: 11px; }
        
        .section { margin: 15px 0; }
        .section-title { font-size: 14px; font-weight: bold; color: #e91e63; margin-bottom: 8px; border-bottom: 2px solid #e91e63; padding-bottom: 4px; }
        .section-content { border: 1px solid #e5e5e5; padding: 12px; min-height: 50px; margin-bottom: 10px; background: white; }
        
        .specialist-options { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
        .checkbox-option { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 11px; }
        .checkbox { width: 16px; height: 16px; border: 2px solid #333; flex-shrink: 0; }
        
        .urgency-box { border: 2px solid #dc2626; background-color: #fef2f2; padding: 12px; margin: 15px 0; text-align: center; border-radius: 6px; }
        .urgency-title { font-weight: bold; color: #dc2626; margin-bottom: 8px; font-size: 13px; }
        
        .footer-note { text-align: center; font-size: 11px; color: #666; margin: 15px 0; font-style: italic; }
        
        .date-doctor-section { display: flex; justify-content: space-between; margin-top: 20px; }
        .doctor-signature { text-align: center; }
        .doctor-name { margin-top: 60px; border-top: 1px solid #333; padding-top: 6px; font-size: 11px; }
        
        @media print {
            body { margin: 0; font-size: 12px; -webkit-print-color-adjust: exact; }
            .referral-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 12px; padding-bottom: 10px; }
            .patient-info { margin-bottom: 12px; }
            .section { margin: 12px 0; }
            .date-doctor-section { margin-top: 15px; }
        }
    </style>
</head>
<body>
    <div class="referral-container">
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

        <div class="title">Surat Rujukan ke Dokter Spesialis</div>

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
                <div class="info-label">Umur:</div>
                <div class="info-value">${calculateAge(patient.birthDate)} tahun</div>
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
        </div>

        <div class="section">
            <div class="section-title">Rujukan ke Spesialisasi</div>
            <div class="specialist-options">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Bedah Mulut</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Ortodonti</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Prostodonti</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Periodonti</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Konservasi Gigi</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Spesialis Pedodonti</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Lainnya: ________________________</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Keluhan/Diagnosis</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 18px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Tindakan yang Sudah Dilakukan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 18px;"></div>
            </div>
        </div>

        <div class="urgency-box">
            <div class="urgency-title">Tingkat Kegawatan:</div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px;">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Biasa</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Mendesak</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Darurat</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Catatan Tambahan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 18px;"></div>
            </div>
        </div>

        <div class="footer-note">
            Mohon pasien dapat segera ditangani dan hasil konsultasinya dapat dikomunikasikan kembali.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div style="margin-bottom: 8px; font-size: 11px;">Dokter Pengirim</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
            </div>
            <div class="doctor-signature">
                <div style="margin-bottom: 8px; font-size: 11px;">Depok, ${formatDate(printDate)}</div>
                <div class="doctor-name">Dokter Penerima</div>
            </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #666; margin-top: 12px; font-style: italic;">
            Surat rujukan ini berlaku selama 30 hari sejak tanggal diterbitkan
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
  
  console.log('Generated Specialist Referral HTML length:', referralHTML.length)
  return referralHTML
}

export const generateXrayReferralNew = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Xray Referral for printing...')
  console.log('Patient data:', patient)
  console.log('Doctor name:', doctorName)
  console.log('Print date:', printDate)
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const xrayHTML = generateXrayReferralHTML(patient, doctorName, printDate)
      console.log('HTML length:', xrayHTML.length)
      console.log('HTML preview:', xrayHTML.substring(0, 200))
      printWindow.document.write(xrayHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const xrayHTML = generateXrayReferralHTML(patient, doctorName, printDate)
  const blob = new Blob([xrayHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Xray-Referral-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}

const generateXrayReferralHTML = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('=== generateXrayReferralHTML called ===')
  console.log('Patient:', patient)
  console.log('Doctor Name:', doctorName)
  console.log('Print Date:', printDate)

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

  console.log('Formatted date:', formatDate(printDate))
  console.log('Patient age:', calculateAge(patient.birthDate))
  
  const xrayHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rujukan Rontgen - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 9mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 11.5px; line-height: 1.3; color: #333; background: white; }
        .xray-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; border-bottom: 3px solid #e91e63; padding-bottom: 10px; gap: 15px; }
        .logo { height: 64px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 20px; font-weight: bold; color: #e91e63; margin-bottom: 4px; }
        .clinic-address { font-size: 10.5px; color: #666; line-height: 1.2; }
        
        .title { font-size: 16px; font-weight: bold; color: #e91e63; margin: 12px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 12px; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; width: 120px; color: #495057; font-size: 10.5px; }
        .info-value { flex: 1; color: #212529; font-size: 10.5px; }
        
        .section { margin: 12px 0; }
        .section-title { font-size: 13px; font-weight: bold; color: #e91e63; margin-bottom: 6px; border-bottom: 2px solid #e91e63; padding-bottom: 3px; }
        .section-content { border: 1px solid #e5e5e5; padding: 9px; min-height: 38px; margin-bottom: 7px; background: white; }
        
        .xray-types { display: flex; flex-wrap: wrap; gap: 10px; margin: 9px 0; }
        .checkbox-option { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; font-size: 10.5px; }
        .checkbox { width: 14px; height: 14px; border: 2px solid #333; flex-shrink: 0; }
        
        .priority-box { border: 2px solid #059669; background-color: #ecfdf5; padding: 9px; margin: 12px 0; text-align: center; border-radius: 5px; }
        .priority-title { font-weight: bold; color: #059669; margin-bottom: 7px; font-size: 12px; }
        
        .instruction-box { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 9px; margin: 12px 0; border-radius: 5px; }
        .instruction-title { font-weight: bold; color: #92400e; margin-bottom: 7px; font-size: 12px; }
        .instruction-list { font-size: 10px; color: #92400e; margin-left: 14px; }
        .instruction-list li { margin-bottom: 3px; }
        
        .footer-note { text-align: center; font-size: 10.5px; color: #666; margin: 12px 0; font-style: italic; }
        
        .date-doctor-section { display: flex; justify-content: space-between; margin-top: 14px; }
        .doctor-signature { text-align: center; }
        .doctor-name { margin-top: 45px; border-top: 1px solid #333; padding-top: 6px; font-size: 10.5px; }
        
        @media print {
            body { margin: 0; font-size: 11.5px; -webkit-print-color-adjust: exact; }
            .xray-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 10px; padding-bottom: 8px; }
            .patient-info { margin-bottom: 10px; }
            .section { margin: 10px 0; }
            .date-doctor-section { margin-top: 12px; }
        }
    </style>
</head>
<body>
    <div class="xray-container">
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

        <div class="title">Surat Rujukan Pemeriksaan Rontgen</div>

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
                <div class="info-label">Umur:</div>
                <div class="info-value">${calculateAge(patient.birthDate)} tahun</div>
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
        </div>

        <div class="section">
            <div class="section-title">Jenis Pemeriksaan Rontgen yang Diminta</div>
            <div class="xray-types">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Panoramic (OPG)</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Periapical</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Bitewing</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Occlusal</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Cephalometric</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>CT Scan</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>CBCT (3D)</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Lainnya: ________________________</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Indikasi Pemeriksaan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 7px; min-height: 16px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 7px; min-height: 16px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 16px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Area yang Difokuskan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 7px; min-height: 16px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 16px;"></div>
            </div>
        </div>

        <div class="priority-box">
            <div class="priority-title">Prioritas Pemeriksaan:</div>
            <div style="display: flex; justify-content: center; gap: 18px; margin-top: 6px;">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Normal</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Segera</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Darurat</span>
                </div>
            </div>
        </div>

        <div class="instruction-box">
            <div class="instruction-title">Instruksi untuk Pasien:</div>
            <ul class="instruction-list">
                <li>Lepaskan semua aksesoris logam (perhiasan, kacamata, dll) sebelum pemeriksaan</li>
                <li>Informasikan kepada petugas jika sedang hamil (untuk pasien wanita)</li>
                <li>Ikuti instruksi petugas radiologi selama pemeriksaan</li>
                <li>Hasil rontgen dapat diambil sesuai dengan ketentuan fasilitas radiologi</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">Catatan Tambahan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 7px; min-height: 16px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 16px;"></div>
            </div>
        </div>

        <div class="footer-note">
            Mohon hasil pemeriksaan dapat diberikan kepada pasien untuk dibawa kembali ke dokter pengirim.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div style="margin-bottom: 6px; font-size: 10.5px;">Dokter Pengirim</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
            </div>
            <div class="doctor-signature">
                <div style="margin-bottom: 6px; font-size: 10.5px;">Depok, ${formatDate(printDate)}</div>
                <div class="doctor-name">Petugas Radiologi</div>
            </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #666; margin-top: 10px; font-style: italic;">
            Surat rujukan ini berlaku selama 14 hari sejak tanggal diterbitkan
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
  
  console.log('Generated HTML length:', xrayHTML.length)
  return xrayHTML
}