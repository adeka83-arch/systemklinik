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

const generateOrthoFormCompleteHTML = (patient: Patient, doctorName: string, printDate: string) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Formulir Ortodontik Lengkap - ${patient.name}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; }
        .ortho-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        
        /* Header Styles */
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 3px solid #e91e63; padding-bottom: 15px; gap: 20px; }
        .logo { height: 70px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 22px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.3; }
        .title { font-size: 18px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; text-transform: uppercase; }
        
        /* Patient Info */
        .patient-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { font-weight: bold; width: 130px; color: #495057; font-size: 11px; }
        .info-value { flex: 1; color: #212529; font-size: 11px; }
        
        /* Sections */
        .section { margin: 18px 0; page-break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: bold; color: #e91e63; margin-bottom: 10px; border-bottom: 2px solid #e91e63; padding-bottom: 5px; }
        
        /* Tables */
        .form-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .form-table td { border: 1px solid #ddd; padding: 8px; font-size: 11px; vertical-align: top; }
        .form-table .label-cell { width: 28%; background: #f8f9fa; font-weight: bold; color: #495057; }
        .form-table .value-cell { width: 72%; }
        
        /* Checkboxes */
        .inline-checkbox { display: inline-flex; align-items: center; margin-right: 15px; margin-bottom: 6px; font-size: 11px; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #333; margin-right: 6px; flex-shrink: 0; }
        
        /* Treatment rows */
        .treatment-row { min-height: 25px; }
        .notes-row { min-height: 50px; }
        
        /* Phase table */
        .phase-table { border: 2px solid #e91e63; margin-bottom: 20px; }
        .phase-header { background: #e91e63; color: white; font-weight: bold; text-align: center; font-size: 12px; }
        .phase-table td { min-height: 30px; }
        
        /* Photo sections */
        .two-column { display: flex; gap: 15px; margin: 15px 0; }
        .column { flex: 1; }
        .photo-section { border: 1px dashed #ccc; min-height: 80px; text-align: center; padding: 20px; margin: 10px 0; font-size: 10px; color: #666; }
        
        /* Signatures */
        .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
        .signature-box { width: 48%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 8px; font-size: 10px; }
        
        /* Page break for 2 pages */
        .page-break { page-break-before: always; }
        
        /* First page content */
        .page-1 { min-height: 240mm; }
        
        @media print {
            body { margin: 0; font-size: 12px; -webkit-print-color-adjust: exact; }
            .ortho-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="ortho-container">
        <!-- HALAMAN 1 -->
        <div class="page-1">
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
                    <div class="info-value">drg. ${doctorName}</div>
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

            <div class="section">
                <div class="section-title">II. Pemeriksaan Klinis</div>
                <table class="form-table">
                    <tr>
                        <td class="label-cell">Profil Wajah</td>
                        <td class="value-cell">
                            <div class="inline-checkbox"><div class="checkbox"></div> Cembung</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Lurus</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Cekung</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">Hubungan Molar</td>
                        <td class="value-cell">
                            <div class="inline-checkbox"><div class="checkbox"></div> Kelas I</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Kelas II</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Kelas III</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">Overjet</td>
                        <td class="value-cell treatment-row">_______ mm</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Overbite</td>
                        <td class="value-cell treatment-row">_______ mm</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Crowding</td>
                        <td class="value-cell">
                            <div class="inline-checkbox"><div class="checkbox"></div> Ringan (1-3mm)</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Sedang (4-6mm)</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Berat (>6mm)</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">III. Rencana Perawatan</div>
                <table class="form-table">
                    <tr>
                        <td class="label-cell">Jenis Alat</td>
                        <td class="value-cell">
                            <div class="inline-checkbox"><div class="checkbox"></div> Behel Konvensional</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Behel Ceramic</div><br>
                            <div class="inline-checkbox"><div class="checkbox"></div> Behel Damon</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Invisalign</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">Perkiraan Waktu</td>
                        <td class="value-cell treatment-row">_______ bulan</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Pencabutan Diperlukan</td>
                        <td class="value-cell">
                            <div class="inline-checkbox"><div class="checkbox"></div> Ya</div>
                            <div class="inline-checkbox"><div class="checkbox"></div> Tidak</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">Gigi yang Dicabut</td>
                        <td class="value-cell treatment-row">____________________________________________________________________</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- HALAMAN 2 -->
        <div class="page-break">
            <div class="header">
                <img src="${clinicLogo}" alt="Logo Falasifah Dental Clinic" class="logo">
                <div class="clinic-info">
                    <div class="clinic-name">Falasifah Dental Clinic</div>
                    <div class="clinic-address">
                        Formulir Ortodontik - ${patient.name} (Halaman 2 dari 2)
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">IV. Tahapan Perawatan</div>
                <table class="form-table phase-table">
                    <tr class="phase-header">
                        <td style="width: 15%;">Fase</td>
                        <td style="width: 35%;">Tindakan</td>
                        <td style="width: 20%;">Tanggal</td>
                        <td style="width: 30%;">Catatan</td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Persiapan</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Pemasangan</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Kontrol 1</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Kontrol 2</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Kontrol 3</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Kontrol 4</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Kontrol 5</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                    <tr>
                        <td class="treatment-row">Pembongkaran</td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                        <td class="treatment-row"></td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">V. Dokumentasi Foto</div>
                <div class="two-column">
                    <div class="column">
                        <div class="section-title" style="font-size: 12px; margin-bottom: 8px;">Foto Sebelum Perawatan</div>
                        <div class="photo-section">Foto Wajah Depan</div>
                        <div class="photo-section">Foto Intraoral</div>
                    </div>
                    <div class="column">
                        <div class="section-title" style="font-size: 12px; margin-bottom: 8px;">Foto Setelah Perawatan</div>
                        <div class="photo-section">Foto Wajah Depan</div>
                        <div class="photo-section">Foto Intraoral</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">VI. Catatan Khusus</div>
                <table class="form-table">
                    <tr>
                        <td class="label-cell">Alergi</td>
                        <td class="value-cell treatment-row">____________________________________________________________________</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Instruksi Khusus</td>
                        <td class="value-cell notes-row"></td>
                    </tr>
                    <tr>
                        <td class="label-cell">Catatan Kontrol</td>
                        <td class="value-cell notes-row"></td>
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
                    <div class="signature-line">(drg. ${doctorName})</div>
                </div>
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

export const generateOrthoFormComplete = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Complete Ortho Form for printing...')
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const orthoHTML = generateOrthoFormCompleteHTML(patient, doctorName, printDate)
      printWindow.document.write(orthoHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const orthoHTML = generateOrthoFormCompleteHTML(patient, doctorName, printDate)
  const blob = new Blob([orthoHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Ortho-Form-Complete-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
}