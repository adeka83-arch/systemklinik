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

const generateInformedConsentHTML = (patient: Patient, doctorName: string, printDate: string) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informed Consent - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.5; color: #333; background: white; }
        .consent-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; border-bottom: 3px solid #e91e63; padding-bottom: 20px; gap: 20px; }
        .logo { height: 80px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.4; }
        
        .title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 140px; color: #495057; font-size: 12px; }
        .info-value { flex: 1; color: #212529; font-size: 12px; }
        
        .section { margin: 25px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #e91e63; margin-bottom: 15px; border-bottom: 2px solid #e91e63; padding-bottom: 8px; }
        .section-content { text-align: justify; line-height: 1.6; margin-bottom: 20px; }
        
        .procedure-list { margin: 15px 0; padding-left: 20px; }
        .procedure-list li { margin-bottom: 8px; }
        
        .checkbox-section { margin: 20px 0; }
        .checkbox-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #333; flex-shrink: 0; margin-top: 2px; }
        .checkbox-text { flex: 1; font-size: 11px; line-height: 1.5; }
        
        .declaration-box { border: 2px solid #e91e63; background-color: #fef7ff; padding: 20px; margin: 25px 0; text-align: center; }
        .declaration-title { font-weight: bold; color: #e91e63; margin-bottom: 15px; font-size: 16px; }
        .declaration-text { font-size: 12px; line-height: 1.6; text-align: justify; }
        
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-title { font-weight: bold; margin-bottom: 60px; font-size: 12px; }
        .signature-line { border-top: 1px solid #333; padding-top: 8px; font-size: 11px; }
        .date-line { margin-bottom: 20px; font-size: 11px; }
        
        @media print {
            body { margin: 0; font-size: 12px; }
            .consent-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 20px; padding-bottom: 15px; }
            .patient-info { margin-bottom: 20px; }
            .signature-section { margin-top: 35px; }
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

        <div class="title">Informed Consent</div>
        <div style="text-align: center; font-size: 14px; margin-bottom: 20px; color: #666;">
            (Surat Persetujuan Tindakan Medis)
        </div>

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
            <div class="section-title">Penjelasan Dokter</div>
            <div class="section-content">
                Saya yang bertanda tangan di bawah ini, menyatakan bahwa saya telah memberikan penjelasan yang selengkap-lengkapnya 
                kepada pasien/keluarga pasien mengenai tindakan medis yang akan dilakukan, meliputi:
            </div>
            
            <ul class="procedure-list">
                <li>Diagnosis dan kondisi saat ini</li>
                <li>Tindakan medis yang direncanakan dan alternatifnya</li>
                <li>Tujuan tindakan medis yang dilakukan</li>
                <li>Resiko dan komplikasi yang mungkin terjadi</li>
                <li>Prognosis terhadap tindakan yang dilakukan</li>
                <li>Perkiraan biaya pengobatan</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">Jenis Tindakan yang Akan Dilakukan</div>
            <div style="border: 1px solid #e5e5e5; padding: 20px; min-height: 80px; margin-bottom: 20px; background: white;">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 25px;"></div>
            </div>
        </div>

        <div class="checkbox-section">
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="checkbox-text">
                    <strong>Saya memahami</strong> bahwa dokter telah menjelaskan kepada saya tentang perlunya 
                    dilakukan tindakan medis tersebut di atas dan saya juga menyadari bahwa dalam bidang 
                    kedokteran tidak ada jaminan kesembuhan 100%.
                </div>
            </div>
            
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="checkbox-text">
                    <strong>Saya memahami</strong> bahwa selama dan pasca tindakan mungkin diperlukan 
                    tindakan tambahan atau perubahan prosedur dari rencana awal, termasuk 
                    tindakan penyelamatan bila terjadi kondisi darurat.
                </div>
            </div>
            
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="checkbox-text">
                    <strong>Saya memahami</strong> risiko dan komplikasi yang mungkin terjadi seperti: 
                    rasa sakit, perdarahan, pembengkakan, infeksi, reaksi alergi terhadap obat, 
                    cedera pada gigi/jaringan sekitar, dan komplikasi lainnya.
                </div>
            </div>
            
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="checkbox-text">
                    <strong>Saya bersedia</strong> mengikuti petunjuk dokter selama perawatan 
                    dan akan datang kontrol sesuai jadwal yang ditentukan.
                </div>
            </div>
        </div>

        <div class="declaration-box">
            <div class="declaration-title">Pernyataan Persetujuan</div>
            <div class="declaration-text">
                Dengan ini saya menyatakan bahwa saya telah membaca, memahami, dan menyetujui 
                dilakukannya tindakan medis sesuai dengan penjelasan yang telah diberikan oleh dokter. 
                Saya memberikan persetujuan ini dengan penuh kesadaran dan tanpa paksaan dari siapa pun.
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="date-line">Depok, ${formatDate(printDate)}</div>
                <div class="signature-title">Yang Menyatakan<br>(Pasien/Wali Pasien)</div>
                <div class="signature-line">(${patient.name})</div>
            </div>
            <div class="signature-box">
                <div class="date-line">Depok, ${formatDate(printDate)}</div>
                <div class="signature-title">Dokter yang Menjelaskan</div>
                <div class="signature-line">(drg. ${doctorName})</div>
            </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px; font-style: italic;">
            Dokumen ini merupakan bagian dari rekam medis yang sah dan berlaku
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

export const generateInformedConsent = (patient: Patient, doctorName: string, printDate: string) => {
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
  const consentHTML = generateInformedConsentHTML(patient, doctorName, printDate)
  const blob = new Blob([consentHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Informed-Consent-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}