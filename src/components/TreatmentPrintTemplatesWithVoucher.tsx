// Template cetak untuk tindakan dengan support voucher diskon
import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'

interface Treatment {
  id: string
  doctorId: string
  doctorName: string
  patientId: string
  patientName: string
  patientPhone?: string
  treatmentTypes: {
    id: string
    name: string
    price: number
    discount: number
    discountType: 'percentage' | 'nominal'
    discountAmount: number
    finalPrice: number
  }[]
  selectedMedications?: {
    id: string
    name: string
    price: number
    quantity: number
    totalPrice: number
  }[]
  description: string
  subtotal: number
  totalDiscount: number
  totalNominal: number
  medicationCost: number
  totalTindakan: number
  feePercentage: number
  adminFeeOverride?: number
  calculatedFee: number
  shift: string
  date: string
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp'
  dpAmount?: number
  outstandingAmount?: number
  paymentNotes?: string
  createdAt: string
  voucherData?: {
    voucherId: string
    voucherCode: string
    discountAmount: number
    finalAmount: number
  } | null
}

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
  adminFee?: number
}

// Fungsi untuk konversi angka ke terbilang bahasa Indonesia
const numberToWords = (num: number): string => {
  if (num === 0) return 'nol'
  
  const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
  const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 
                 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 
                'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
  
  const convertChunk = (n: number): string => {
    let result = ''
    
    if (n >= 100) {
      if (Math.floor(n / 100) === 1) {
        result += 'seratus '
      } else {
        result += ones[Math.floor(n / 100)] + ' ratus '
      }
      n %= 100
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + ' '
      return result.trim()
    }
    
    if (n > 0) {
      result += ones[n] + ' '
    }
    
    return result.trim()
  }
  
  if (num < 1000) {
    return convertChunk(num)
  } else if (num < 1000000) {
    const thousands = Math.floor(num / 1000)
    const remainder = num % 1000
    let result = ''
    
    if (thousands === 1) {
      result = 'seribu'
    } else {
      result = convertChunk(thousands) + ' ribu'
    }
    
    if (remainder > 0) {
      result += ' ' + convertChunk(remainder)
    }
    
    return result
  } else if (num < 1000000000) {
    const millions = Math.floor(num / 1000000)
    const remainder = num % 1000000
    let result = convertChunk(millions) + ' juta'
    
    if (remainder > 0) {
      result += ' ' + numberToWords(remainder)
    }
    
    return result
  } else {
    const billions = Math.floor(num / 1000000000)
    const remainder = num % 1000000000
    let result = convertChunk(billions) + ' miliar'
    
    if (remainder > 0) {
      result += ' ' + numberToWords(remainder)
    }
    
    return result
  }
}

export const generateInvoiceWithCashierSignature = (treatment: Treatment, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
  const invoiceWindow = window.open('', '_blank')
  if (!invoiceWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'
  const currentAdminFee = treatment.adminFeeOverride || clinicSettings?.adminFee || 20000

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice Tindakan - ${treatment.patientName}</title>
      <style>
        @page {
          size: A5;
          margin: 8mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px solid #ec4899;
          padding-bottom: 8px;
        }
        
        .logo {
          max-width: 45px;
          max-height: 35px;
          margin: 0 auto 5px;
          display: block;
        }
        
        .clinic-name {
          font-size: 12px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .clinic-info {
          font-size: 7px;
          color: #666;
          line-height: 1.1;
        }
        
        .document-title {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          margin: 8px 0;
          color: #ec4899;
          text-transform: uppercase;
          border: 1px solid #ec4899;
          padding: 4px;
          letter-spacing: 0.3px;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 8px;
        }
        
        .info-section div {
          flex: 1;
        }
        
        .info-label {
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 1px;
        }
        
        .patient-section {
          margin-bottom: 10px;
          padding: 5px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 3px;
          font-size: 8px;
        }
        
        .patient-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 8px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 3px 2px;
          text-align: left;
          vertical-align: top;
        }
        
        .items-table th {
          background-color: #fce7f3;
          font-weight: bold;
          color: #9d174d;
          text-align: center;
          font-size: 7px;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-section {
          margin-top: 8px;
          padding-top: 5px;
          border-top: 1px solid #ec4899;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 9px;
        }
        
        .total-row.grand-total {
          font-weight: bold;
          font-size: 10px;
          color: #ec4899;
          padding-top: 3px;
          border-top: 1px solid #ddd;
        }
        
        .voucher-section {
          margin: 8px 0;
          padding: 5px;
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 3px;
          font-size: 8px;
        }
        
        .voucher-title {
          font-weight: bold;
          color: #0c4a6e;
          margin-bottom: 3px;
          font-size: 9px;
          text-align: center;
        }
        
        .voucher-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .voucher-code {
          font-family: 'Courier New', monospace;
          background-color: #dbeafe;
          padding: 2px 6px;
          border-radius: 2px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .voucher-amount {
          font-weight: bold;
          color: #059669;
        }
        
        .amount-words {
          margin-top: 8px;
          padding: 5px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 3px;
          font-size: 8px;
          font-style: italic;
          color: #7c2d12;
        }
        
        .payment-info {
          margin-top: 8px;
          padding: 5px;
          background-color: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 3px;
          font-size: 8px;
        }
        
        .footer {
          margin-top: 12px;
          display: flex;
          justify-content: center;
          font-size: 9px;
        }
        
        .footer-note {
          margin-top: 8px;
          padding: 5px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 3px;
          font-size: 7px;
          color: #64748b;
          text-align: center;
        }
        
        .print-date {
          text-align: center;
          margin-top: 6px;
          font-size: 6px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
        <div class="clinic-name">${clinicName}</div>
        <div class="clinic-info">
          Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
          Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
          Telp/WA: 085283228355
        </div>
      </div>
      
      <div class="document-title">INVOICE TINDAKAN</div>
      
      <div class="info-section">
        <div>
          <div class="info-label">Tanggal Transaksi:</div>
          <div>${new Date(transactionDate).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <div class="info-label" style="margin-top: 8px;">Dokter:</div>
          <div>drg. ${treatment.doctorName}</div>
        </div>
        <div style="text-align: right;">
          <div class="info-label">Kasir:</div>
          <div>${cashierName}</div>
          <div class="info-label" style="margin-top: 8px;">Shift:</div>
          <div>${treatment.shift}</div>
        </div>
      </div>
      
      <div class="patient-section">
        <div class="patient-row">
          <span><strong>Pasien:</strong> ${treatment.patientName}</span>
          <span><strong>Telepon:</strong> ${treatment.patientPhone || '-'}</span>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%;">No</th>
            <th style="width: 45%;">Jenis Tindakan</th>
            <th style="width: 15%;">Harga Asli</th>
            <th style="width: 15%;">Diskon</th>
            <th style="width: 17%;">Harga Final</th>
          </tr>
        </thead>
        <tbody>
          ${treatment.treatmentTypes.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td class="text-right">Rp ${item.price.toLocaleString('id-ID')}</td>
              <td class="text-right">-Rp ${item.discountAmount.toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${item.finalPrice.toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
          ${treatment.selectedMedications && treatment.selectedMedications.length > 0 ? 
            treatment.selectedMedications.map((med, index) => `
              <tr>
                <td class="text-center">${treatment.treatmentTypes.length + index + 1}</td>
                <td>Obat: ${med.name} (${med.quantity}x)</td>
                <td class="text-right">Rp ${med.price.toLocaleString('id-ID')}</td>
                <td class="text-right">-</td>
                <td class="text-right">Rp ${med.totalPrice.toLocaleString('id-ID')}</td>
              </tr>
            `).join('') : ''
          }
          <tr>
            <td class="text-center">${treatment.treatmentTypes.length + (treatment.selectedMedications?.length || 0) + 1}</td>
            <td>Biaya Admin</td>
            <td class="text-right">Rp ${currentAdminFee.toLocaleString('id-ID')}</td>
            <td class="text-right">-</td>
            <td class="text-right">Rp ${currentAdminFee.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal Tindakan:</span>
          <span>Rp ${treatment.subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row">
          <span>Total Diskon:</span>
          <span>-Rp ${treatment.totalDiscount.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row">
          <span>Biaya Obat:</span>
          <span>Rp ${treatment.medicationCost.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row">
          <span>Biaya Admin:</span>
          <span>Rp ${currentAdminFee.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL PEMBAYARAN:</span>
          <span>Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      ${treatment.voucherData ? `
      <div class="voucher-section">
        <div class="voucher-title">🎫 VOUCHER DISKON DIGUNAKAN</div>
        <div class="voucher-row">
          <span>Kode Voucher:</span>
          <span class="voucher-code">${treatment.voucherData.voucherCode}</span>
        </div>
        <div class="voucher-row">
          <span>Jumlah Diskon:</span>
          <span class="voucher-amount">Rp ${treatment.voucherData.discountAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>
      ` : ''}
      
      <div class="amount-words">
        <strong>Terbilang:</strong> ${numberToWords(treatment.totalTindakan)} rupiah
      </div>
      
      ${treatment.paymentStatus && treatment.paymentStatus === 'dp' ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> DP (Down Payment)<br>
        <strong>Jumlah DP:</strong> Rp ${treatment.dpAmount?.toLocaleString('id-ID')}<br>
        <strong>Sisa Pembayaran:</strong> Rp ${treatment.outstandingAmount?.toLocaleString('id-ID')}<br>
        <strong>Metode Pembayaran:</strong> ${treatment.paymentMethod || 'Tidak diketahui'}
      </div>
      ` : treatment.paymentMethod ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> LUNAS<br>
        <strong>Metode Pembayaran:</strong> ${treatment.paymentMethod}
      </div>
      ` : ''}
      
      <div class="footer">
        <div style="text-align: center; width: 140px; margin: 0 auto;">
          <div>Kasir</div>
          <div style="border-top: 1px solid #333; margin-top: 25px; padding-top: 3px; font-weight: bold;">${cashierName}</div>
        </div>
      </div>
      
      <div class="footer-note">
        Terima kasih atas kepercayaan Anda kepada ${clinicName}
      </div>
      
      <div class="print-date">
        Dicetak pada: ${new Date().toLocaleString('id-ID')} oleh ${cashierName}
      </div>
    </body>
    </html>
  `

  invoiceWindow.document.write(invoiceHtml)
  invoiceWindow.document.close()
  
  invoiceWindow.onload = function() {
    setTimeout(() => {
      invoiceWindow.print()
    }, 250)
  }
}

export const generateReceiptWithCashierSignature = (treatment: Treatment, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
  const receiptWindow = window.open('', '_blank')
  if (!receiptWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kwitansi Tindakan - ${treatment.patientName}</title>
      <style>
        @page {
          size: A5;
          margin: 8mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          color: #333;
        }
        
        .receipt-container {
          max-width: 320px;
          margin: 0 auto;
          border: 1px solid #ec4899;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          padding: 10px;
          text-align: center;
        }
        
        .logo {
          max-width: 40px;
          max-height: 30px;
          margin: 0 auto 5px;
          display: block;
          filter: brightness(0) invert(1);
        }
        
        .clinic-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .clinic-info {
          font-size: 7px;
          line-height: 1.1;
          opacity: 0.95;
        }
        
        .content {
          padding: 12px;
        }
        
        .document-title {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #ec4899;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 8px;
        }
        
        .info-label {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 1px;
        }
        
        .patient-info {
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 3px;
          padding: 8px;
          margin-bottom: 10px;
          font-size: 8px;
        }
        
        .amount-section {
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          text-align: center;
        }
        
        .amount-label {
          font-size: 8px;
          color: #be185d;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .amount-value {
          font-size: 16px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 8px;
        }
        
        .amount-words {
          font-size: 8px;
          font-style: italic;
          color: #7c2d12;
          padding: 5px;
          background-color: white;
          border: 1px solid #f3e8ff;
          border-radius: 3px;
        }
        
        .voucher-section {
          margin: 10px 0;
          padding: 6px;
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 3px;
          font-size: 8px;
        }
        
        .voucher-title {
          font-weight: bold;
          color: #0c4a6e;
          margin-bottom: 4px;
          text-align: center;
          font-size: 9px;
        }
        
        .voucher-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .voucher-code {
          font-family: 'Courier New', monospace;
          background-color: #dbeafe;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .voucher-amount {
          font-weight: bold;
          color: #059669;
        }
        
        .details-section {
          margin: 10px 0;
          border-top: 1px solid #f3e8ff;
          border-bottom: 1px solid #f3e8ff;
          padding: 8px 0;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 8px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #be185d;
        }
        
        .footer {
          margin-top: 12px;
          display: flex;
          justify-content: center;
          font-size: 8px;
        }
        
        .signature-receipt {
          text-align: center;
          width: 120px;
        }
        
        .signature-line-receipt {
          border-top: 1px solid #333;
          margin-top: 20px;
          padding-top: 3px;
          font-weight: bold;
        }
        
        .footer-note {
          margin-top: 8px;
          padding: 6px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 3px;
          font-size: 7px;
          color: #666;
          text-align: center;
        }
        
        .print-info {
          text-align: center;
          margin-top: 8px;
          font-size: 6px;
          color: #999;
          border-top: 1px solid #f3e8ff;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
          <div class="clinic-name">${clinicName}</div>
          <div class="clinic-info">
            Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
            Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
            Telp/WA: 085283228355
          </div>
        </div>
        
        <div class="content">
          <div class="document-title">KWITANSI</div>
          
          <div class="receipt-info">
            <div>
              <div class="info-label">Tanggal:</div>
              <div>${new Date(transactionDate).toLocaleDateString('id-ID')}</div>
              <div class="info-label" style="margin-top: 8px;">Dokter:</div>
              <div>drg. ${treatment.doctorName}</div>
            </div>
            <div style="text-align: right;">
              <div class="info-label">Kasir:</div>
              <div>${cashierName}</div>
              <div class="info-label" style="margin-top: 8px;">Shift:</div>
              <div>${treatment.shift}</div>
            </div>
          </div>
          
          <div class="patient-info">
            <div class="info-label">Pasien:</div>
            <div>${treatment.patientName}</div>
            ${treatment.patientPhone ? `
            <div class="info-label" style="margin-top: 6px;">Telepon:</div>
            <div>${treatment.patientPhone}</div>
            ` : ''}
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Telah Terima Untuk Tindakan Sejumlah</div>
            <div class="amount-value">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</div>
            <div class="amount-words">
              <strong>Terbilang:</strong><br>
              ${numberToWords(treatment.totalTindakan)} rupiah
            </div>
          </div>
          
          ${treatment.voucherData ? `
          <div class="voucher-section">
            <div class="voucher-title">🎫 VOUCHER DISKON DIGUNAKAN</div>
            <div class="voucher-row">
              <span>Kode Voucher:</span>
              <span class="voucher-code">${treatment.voucherData.voucherCode}</span>
            </div>
            <div class="voucher-row">
              <span>Jumlah Diskon:</span>
              <span class="voucher-amount">Rp ${treatment.voucherData.discountAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
          ` : ''}
          
          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Untuk Pembayaran:</span>
              <span>Tindakan Dental</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Jenis Tindakan:</span>
              <span>${treatment.treatmentTypes.map(t => t.name).join(', ')}</span>
            </div>
            ${treatment.selectedMedications && treatment.selectedMedications.length > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Obat:</span>
              <span>${treatment.selectedMedications.map(m => `${m.name} (${m.quantity}x)`).join(', ')}</span>
            </div>
            ` : ''}
            ${treatment.paymentStatus && treatment.paymentStatus === 'dp' ? `
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span>DP - Sisa: Rp ${treatment.outstandingAmount?.toLocaleString('id-ID')}</span>
            </div>
            ` : `
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span>LUNAS</span>
            </div>
            `}
            ${treatment.paymentMethod ? `
            <div class="detail-row">
              <span class="detail-label">Metode Bayar:</span>
              <span>${treatment.paymentMethod}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div class="signature-receipt">
              <div>Kasir</div>
              <div class="signature-line-receipt">${cashierName}</div>
            </div>
          </div>
          
          <div class="footer-note">
            Terima kasih atas kepercayaan Anda kepada ${clinicName}
          </div>
          
          <div class="print-info">
            Dicetak pada: ${new Date().toLocaleString('id-ID')} oleh ${cashierName}
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  receiptWindow.document.write(receiptHtml)
  receiptWindow.document.close()
  
  receiptWindow.onload = function() {
    setTimeout(() => {
      receiptWindow.print()
    }, 250)
  }
}