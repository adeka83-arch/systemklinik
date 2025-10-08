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

const generateTestXrayReferralHTML = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('=== generateTestXrayReferralHTML called ===')
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
  
  const xrayHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rujukan Rontgen - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px; line-height: 1.5; color: #333; background: white; }
        .xray-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #e91e63; padding-bottom: 20px; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-address { font-size: 12px; color: #666; line-height: 1.4; }
        
        .title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; text-transform: uppercase; }
        
        .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 140px; color: #495057; font-size: 13px; }
        .info-value { flex: 1; color: #212529; font-size: 13px; }
        
        .section { margin: 25px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #e91e63; margin-bottom: 15px; border-bottom: 2px solid #e91e63; padding-bottom: 8px; }
        .section-content { border: 1px solid #e5e5e5; padding: 20px; min-height: 80px; margin-bottom: 18px; background: white; }
        
        .xray-types { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .checkbox-option { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #333; flex-shrink: 0; }
        
        .priority-box { border: 2px solid #059669; background-color: #ecfdf5; padding: 20px; margin: 25px 0; text-align: center; }
        .priority-title { font-weight: bold; color: #059669; margin-bottom: 12px; font-size: 15px; }
        
        .instruction-box { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 25px 0; }
        .instruction-title { font-weight: bold; color: #92400e; margin-bottom: 12px; font-size: 15px; }
        .instruction-list { font-size: 13px; color: #92400e; }
        .instruction-list li { margin-bottom: 5px; }
        
        .footer-note { text-align: center; font-size: 13px; color: #666; margin: 25px 0; font-style: italic; }
        
        .date-doctor-section { display: flex; justify-content: space-between; margin-top: 40px; }
        .doctor-signature { text-align: center; }
        .doctor-name { margin-top: 100px; border-top: 1px solid #333; padding-top: 8px; font-size: 13px; }
        
        @media print {
            body { margin: 0; font-size: 14px; }
            .xray-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .header { margin-bottom: 20px; padding-bottom: 15px; }
            .patient-info { margin-bottom: 20px; }
            .date-doctor-section { margin-top: 35px; }
        }
    </style>
</head>
<body>
    <div class="xray-container">
        <div class="header">
            <div class="clinic-name">Falasifah Dental Clinic</div>
            <div class="clinic-address">
                Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama<br>
                Kec. Sawangan, Depok, Jawa Barat<br>
                Telp/WA: 085283228355
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
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 25px;"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Area yang Difokuskan</div>
            <div class="section-content">
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 25px;"></div>
            </div>
        </div>

        <div class="priority-box">
            <div class="priority-title">Prioritas Pemeriksaan:</div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 15px;">
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
                <div style="border-bottom: 1px solid #ccc; margin-bottom: 15px; min-height: 25px;"></div>
                <div style="border-bottom: 1px solid #ccc; min-height: 25px;"></div>
            </div>
        </div>

        <div class="footer-note">
            Mohon hasil pemeriksaan dapat diberikan kepada pasien untuk dibawa kembali ke dokter pengirim.
        </div>

        <div class="date-doctor-section">
            <div class="doctor-signature">
                <div style="margin-bottom: 10px;">Dokter Pengirim</div>
                <div class="doctor-name">(drg. ${doctorName})</div>
            </div>
            <div class="doctor-signature">
                <div style="margin-bottom: 10px;">Depok, ${formatDate(printDate)}</div>
                <div class="doctor-name">Petugas Radiologi</div>
            </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #666; margin-top: 20px; font-style: italic;">
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

export const generateTestXrayReferral = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating TEST Xray Referral for printing...')
  console.log('Patient data:', patient)
  console.log('Doctor name:', doctorName)
  console.log('Print date:', printDate)
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const xrayHTML = generateTestXrayReferralHTML(patient, doctorName, printDate)
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
  const xrayHTML = generateTestXrayReferralHTML(patient, doctorName, printDate)
  const blob = new Blob([xrayHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Test-Xray-Referral-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}