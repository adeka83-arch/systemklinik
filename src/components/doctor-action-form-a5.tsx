import React from 'react'
import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string
  gender: string
  medicalRecordNumber?: string
}

export const generateDoctorActionForm = (patient: Patient, doctorName: string, printDate: string) => {
  console.log('Generating Doctor Action Form for printing...')
  
  // Try popup method first
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (printWindow && !printWindow.closed) {
      console.log('Print window opened successfully')
      const formHTML = generateDoctorActionFormHTML(patient, doctorName, printDate)
      printWindow.document.write(formHTML)
      printWindow.document.close()
      return
    }
  } catch (error) {
    console.log('Popup method failed:', error)
  }
  
  // Fallback: create download link
  console.log('Using download fallback method')
  const htmlContent = generateDoctorActionFormHTML(patient, doctorName, printDate)
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Formulir-Tindakan-Dokter-${patient.name}-${printDate}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  throw new Error('File HTML berhasil diunduh! Buka file tersebut di browser dan tekan Ctrl+P untuk mencetak.')
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
        @page { size: A5 landscape; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 10px; line-height: 1.3; color: #333; background: white; }
        .form-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; gap: 15px; }
        .logo { height: 50px; width: auto; object-fit: contain; }
        .clinic-info { text-align: center; flex: 1; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #7c3aed; margin-bottom: 3px; }
        .clinic-address { font-size: 9px; color: #666; line-height: 1.2; }
        .title { font-size: 14px; font-weight: bold; color: #7c3aed; margin: 10px 0; text-align: center; text-transform: uppercase; }
        .patient-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 15px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 90px; color: #495057; font-size: 9px; }
        .info-value { flex: 1; color: #212529; font-size: 9px; }
        .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
        .section-title { font-size: 11px; font-weight: bold; color: #7c3aed; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .item-row { display: grid; grid-template-columns: 2fr 1fr; gap: 5px; margin-bottom: 8px; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px; }
        .item-name { font-size: 9px; border: none; background: transparent; resize: none; height: 30px; }
        .item-price { text-align: right; border: 1px solid #d1d5db; padding: 4px; font-size: 9px; border-radius: 3px; }
        .total-row { display: grid; grid-template-columns: 2fr 1fr; gap: 5px; margin-top: 10px; padding: 8px; background: #f0f9ff; border: 2px solid #7c3aed; border-radius: 6px; font-weight: bold; }
        .notes-section { grid-column: 1 / -1; margin-top: 15px; }
        .notes-area { width: 100%; min-height: 80px; border: 1px solid #d1d5db; padding: 8px; font-size: 9px; border-radius: 4px; resize: none; }
        .signature-section { margin-top: 20px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 5px; font-size: 8px; }
        .print-date { text-align: center; font-size: 8px; color: #666; margin-top: 15px; }
        @media print {
            body { margin: 0; font-size: 10px; }
            .form-container { margin: 0; padding: 0; max-width: none; width: 100%; }
            .signature-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="form-container">
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
                <div class="info-label">Dokter:</div>
                <div class="info-value">drg. ${doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal:</div>
                <div class="info-value">${formatDate(printDate)}</div>
            </div>
        </div>

        <div class="main-content">
            <!-- Section Tindakan -->
            <div class="section">
                <div class="section-title">🩺 Jenis Tindakan & Harga</div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama tindakan..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama tindakan..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama tindakan..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama tindakan..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama tindakan..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="total-row">
                    <div>TOTAL TINDAKAN:</div>
                    <input type="text" class="item-price" placeholder="Rp 0" style="background: white; font-weight: bold;">
                </div>
            </div>

            <!-- Section Obat -->
            <div class="section">
                <div class="section-title">💊 Obat & Harga</div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama obat..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama obat..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama obat..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama obat..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="item-row">
                    <textarea class="item-name" placeholder="Nama obat..."></textarea>
                    <input type="text" class="item-price" placeholder="Rp 0">
                </div>
                
                <div class="total-row">
                    <div>TOTAL OBAT:</div>
                    <input type="text" class="item-price" placeholder="Rp 0" style="background: white; font-weight: bold;">
                </div>
            </div>

            <!-- Section Catatan Admin -->
            <div class="notes-section">
                <div class="section-title">📋 Catatan untuk Admin</div>
                <textarea class="notes-area" placeholder="Catatan khusus, instruksi pembayaran, atau informasi penting lainnya..."></textarea>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div>Dokter Pemeriksa</div>
                <div class="signature-line">(drg. ${doctorName})</div>
            </div>
            <div class="signature-box">
                <div>Admin Klinik</div>
                <div class="signature-line">(...........................)</div>
            </div>
        </div>

        <div class="print-date">
            Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
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