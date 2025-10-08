import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'
import { printFormWithFeedback } from '../utils/printHelpers'

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

export const generateMedicalCertificateNew = async (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Medical Certificate for printing...')
  
  const htmlContent = generateMedicalCertificateHTML(patient, doctorName, printDate)
  const result = await printFormWithFeedback(htmlContent, {
    filename: `Medical-Certificate-${patient.name}-${printDate}`,
    title: 'Surat Keterangan Berobat'
  })
  
  return result
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

export const generatePrescriptionNew = async (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Prescription for printing...')
  
  const htmlContent = generatePrescriptionHTML(patient, doctorName, printDate)
  const result = await printFormWithFeedback(htmlContent, {
    filename: `Prescription-${patient.name}-${printDate}`,
    title: 'Resep Obat'
  })
  
  return result
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

export const generateSpecialistReferralNew = async (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Specialist Referral for printing...')
  
  const htmlContent = generateSpecialistReferralHTML(patient, doctorName, printDate)
  const result = await printFormWithFeedback(htmlContent, {
    filename: `Specialist-Referral-${patient.name}-${printDate}`,
    title: 'Rujukan Spesialis'
  })
  
  return result
}

const generateSpecialistReferralHTML = (patient: Patient, doctorName: string, printDate: string) => {
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
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Tindakan yang Sudah Dilakukan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Tujuan Rujukan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="urgency-box">
            <div class="urgency-title">Tingkat Urgensi:</div>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Segera</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Dalam 1 minggu</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Normal</span>
                </div>
            </div>
        </div>

        <div class="footer-note">
            Terima kasih atas kerjasamanya dalam memberikan pelayanan terbaik untuk pasien.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div style="font-size: 11px; margin-bottom: 6px;">Depok, ${formatDate(printDate)}</div>
                <div style="font-size: 11px; margin-bottom: 6px;">Dokter Perujuk</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
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

export const generateDoctorActionFormNew = async (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Doctor Action Form for printing...')
  
  const htmlContent = generateDoctorActionFormHTML(patient, doctorName, printDate)
  const result = await printFormWithFeedback(htmlContent, {
    filename: `Doctor-Action-Form-${patient.name}-${printDate}`,
    title: 'Formulir Tindakan Dokter'
  })
  
  return result
}

const generateDoctorActionFormHTML = (patient: Patient, doctorName: string, printDate: string) => {
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
    <title>Formulir Tindakan Dokter - ${patient.name}</title>
    <style>
        @page { size: A5; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 10px; line-height: 1.2; color: #333; background: white; }
        .form-container { width: 100%; max-width: 148mm; margin: 0 auto; padding: 0; }
        
        /* Header */
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; gap: 10px; }
        .logo { height: 35px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 2px; }
        .clinic-address { font-size: 8px; color: #666; line-height: 1.1; }
        .title { font-size: 12px; font-weight: bold; color: #7c3aed; margin: 8px 0; text-align: center; text-transform: uppercase; }
        
        /* Patient Info */
        .patient-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; width: 70px; color: #495057; font-size: 9px; }
        .info-value { flex: 1; color: #212529; border-bottom: 1px solid #ccc; padding-bottom: 1px; font-size: 9px; }
        
        /* Main Content */
        .main-content { margin-bottom: 15px; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 11px; font-weight: bold; color: #7c3aed; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
        
        /* Item Tables */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .items-table th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 4px; text-align: center; font-weight: bold; color: #374151; font-size: 9px; }
        .items-table td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
        .item-name-cell { width: 65%; }
        .item-price-cell { width: 35%; text-align: center; }
        .item-name-line { border-bottom: 1px solid #ccc; margin-bottom: 4px; padding-bottom: 1px; min-height: 12px; font-size: 9px; }
        .item-price-line { border-bottom: 1px solid #ccc; padding-bottom: 1px; min-height: 12px; text-align: right; font-size: 9px; }
        
        /* Total Row */
        .total-row { background: #f0f9ff; }
        .total-row td { border: 2px solid #7c3aed; font-weight: bold; color: #7c3aed; font-size: 9px; }
        
        /* Notes Section */
        .notes-section { margin-top: 12px; }
        .notes-box { border: 1px solid #d1d5db; min-height: 40px; padding: 6px; }
        .notes-line { border-bottom: 1px solid #ccc; margin-bottom: 4px; min-height: 10px; }
        
        /* Signature Section */
        .signature-section { margin-top: 15px; display: flex; justify-content: space-between; }
        .signature-box { width: 48%; text-align: center; border: 1px solid #d1d5db; padding: 6px; }
        .signature-title { font-weight: bold; margin-bottom: 20px; font-size: 9px; }
        .signature-line { border-top: 1px solid #333; margin-top: 15px; padding-top: 3px; font-weight: bold; font-size: 8px; }
        
        /* Print Date */
        .print-date { text-align: center; font-size: 7px; color: #666; margin-top: 8px; }
        
        @media print {
            body { margin: 0; font-size: 10px; }
            .form-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .signature-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <!-- Header -->
        <div class="header">
            <img src="${clinicLogo}" alt="Logo Falasifah Dental Clinic" class="logo">
            <div class="clinic-info">
                <div class="clinic-name">Falasifah Dental Clinic</div>
                <div class="clinic-address">
                    Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama<br>
                    Kec. Sawangan, Depok, Jawa Barat | Telp/WA: 085283228355
                </div>
            </div>
        </div>

        <div class="title">Formulir Tindakan Dokter</div>

        <!-- Patient Information -->
        <div class="patient-info">
            <div class="info-grid">
                <div>
                    <div class="info-row">
                        <div class="info-label">Nama:</div>
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
                </div>
                <div>
                    <div class="info-row">
                        <div class="info-label">Dokter:</div>
                        <div class="info-value">drg. ${doctorName}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Tanggal:</div>
                        <div class="info-value">${formatDate(printDate)}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Waktu:</div>
                        <div class="info-value">_____ : _____ WIB</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <!-- Tindakan Section -->
            <div class="section">
                <div class="section-title">🩺 Jenis Tindakan & Harga</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="item-name-cell">Nama Tindakan</th>
                            <th class="item-price-cell">Harga (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="item-name-cell">
                                <div class="item-name-line"></div>
                                <div class="item-name-line"></div>
                            </td>
                            <td class="item-price-cell">
                                <div class="item-price-line"></div>
                            </td>
                        </tr>
                        <tr>
                            <td class="item-name-cell">
                                <div class="item-name-line"></div>
                                <div class="item-name-line"></div>
                            </td>
                            <td class="item-price-cell">
                                <div class="item-price-line"></div>
                            </td>
                        </tr>
                        <tr class="total-row">
                            <td class="item-name-cell" style="text-align: center; font-weight: bold;">TOTAL TINDAKAN</td>
                            <td class="item-price-cell">
                                <div class="item-price-line" style="border-bottom: 1px solid #7c3aed;"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Obat Section -->
            <div class="section">
                <div class="section-title">💊 Obat & Harga</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="item-name-cell">Nama Obat</th>
                            <th class="item-price-cell">Harga (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="item-name-cell">
                                <div class="item-name-line"></div>
                                <div class="item-name-line"></div>
                            </td>
                            <td class="item-price-cell">
                                <div class="item-price-line"></div>
                            </td>
                        </tr>
                        <tr>
                            <td class="item-name-cell">
                                <div class="item-name-line"></div>
                                <div class="item-name-line"></div>
                            </td>
                            <td class="item-price-cell">
                                <div class="item-price-line"></div>
                            </td>
                        </tr>
                        <tr class="total-row">
                            <td class="item-name-cell" style="text-align: center; font-weight: bold;">TOTAL OBAT</td>
                            <td class="item-price-cell">
                                <div class="item-price-line" style="border-bottom: 1px solid #7c3aed;"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Notes Section -->
            <div class="notes-section">
                <div class="section-title">📋 Catatan untuk Admin</div>
                <div class="notes-box">
                    <div class="notes-line"></div>
                    <div class="notes-line"></div>
                    <div class="notes-line"></div>
                </div>
            </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-title">Dokter Pemeriksa</div>
                <div class="signature-line">(drg. ${doctorName})</div>
            </div>
            <div class="signature-box">
                <div class="signature-title">Admin Klinik</div>
                <div class="signature-line">(...............................)</div>
            </div>
        </div>

        <div class="print-date">
            Dicetak: ${new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
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

export const generateXrayReferralNew = async (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating X-ray Referral for printing...')
  
  const htmlContent = generateXrayReferralHTML(patient, doctorName, printDate)
  const result = await printFormWithFeedback(htmlContent, {
    filename: `Xray-Referral-${patient.name}-${printDate}`,
    title: 'Rujukan Rontgen'
  })
  
  return result
}

const generateXrayReferralHTML = (patient: Patient, doctorName: string, printDate: string) => {
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
    <title>Rujukan Rontgen - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.3; color: #333; background: white; }
        .referral-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 3px solid #6366f1; padding-bottom: 12px; gap: 18px; }
        .logo { height: 70px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 22px; font-weight: bold; color: #6366f1; margin-bottom: 4px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.2; }
        
        .title { font-size: 18px; font-weight: bold; color: #6366f1; margin: 15px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #dbeafe; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { font-weight: bold; width: 130px; color: #1e40af; font-size: 11px; }
        .info-value { flex: 1; color: #1e3a8a; font-size: 11px; }
        
        .section { margin: 15px 0; }
        .section-title { font-size: 14px; font-weight: bold; color: #6366f1; margin-bottom: 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
        .section-content { border: 1px solid #e5e5e5; padding: 12px; min-height: 50px; margin-bottom: 10px; background: white; }
        
        .xray-types { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
        .checkbox-option { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 11px; }
        .checkbox { width: 16px; height: 16px; border: 2px solid #333; flex-shrink: 0; }
        
        .special-note { border: 2px solid #f59e0b; background-color: #fef3c7; padding: 12px; margin: 15px 0; border-radius: 6px; }
        .special-note-title { font-weight: bold; color: #92400e; margin-bottom: 8px; font-size: 13px; }
        
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
            <div class="section-title">Jenis Pemeriksaan Rontgen yang Diperlukan</div>
            <div class="xray-types">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Panoramic</span>
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
                    <span>Lateral Cephalometric</span>
                </div>
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>CBCT</span>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <div class="checkbox-option">
                    <div class="checkbox"></div>
                    <span>Lainnya: ____________________________________</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Area/Gigi yang Akan Difoto</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Keluhan/Indikasi Klinis</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Tujuan Pemeriksaan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; min-height: 18px;"></div>
            </div>
        </div>

        <div class="special-note">
            <div class="special-note-title">Catatan Khusus:</div>
            <div style="font-size: 11px; line-height: 1.4;">
                <div style="border-bottom: 1px solid #92400e; margin-bottom: 6px; min-height: 16px;"></div>
                <div style="border-bottom: 1px solid #92400e; margin-bottom: 6px; min-height: 16px;"></div>
            </div>
        </div>

        <div class="footer-note">
            Mohon hasil rontgen dikirimkan kembali beserta interpretasi radiologis untuk kelanjutan perawatan pasien.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div style="font-size: 11px; margin-bottom: 6px;">Depok, ${formatDate(printDate)}</div>
                <div style="font-size: 11px; margin-bottom: 6px;">Dokter Perujuk</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
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