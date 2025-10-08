// Template cetak untuk penjualan field trip
import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'

interface FieldTripSale {
  id: string
  date: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  products: {
    id: string
    name: string
    price: number
    quantity: number
    totalPrice: number
  }[]
  subtotal: number
  totalAmount: number
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp'
  dpAmount?: number
  outstandingAmount?: number
  notes?: string
  createdAt: string
}

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
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

export const generateFieldTripInvoiceWithCashier = (sale: FieldTripSale, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
  const invoiceWindow = window.open('', '_blank')
  if (!invoiceWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice Field Trip - ${sale.customerName}</title>
      <style>
        @page {
          size: A5;
          margin: 12mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.3;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #ec4899;
          padding-bottom: 12px;
        }
        
        .logo {
          max-width: 60px;
          max-height: 45px;
          margin: 0 auto 8px;
          display: block;
        }
        
        .clinic-name {
          font-size: 14px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .clinic-info {
          font-size: 8px;
          color: #666;
          line-height: 1.2;
        }
        
        .document-title {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          margin: 15px 0;
          color: #ec4899;
          text-transform: uppercase;
          border: 2px solid #ec4899;
          padding: 6px;
          letter-spacing: 0.5px;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 9px;
        }
        
        .info-section div {
          flex: 1;
        }
        
        .info-label {
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 2px;
        }
        
        .customer-section {
          margin-bottom: 15px;
          padding: 8px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          font-size: 9px;
        }
        
        .customer-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 9px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 6px 4px;
          text-align: left;
          vertical-align: top;
        }
        
        .items-table th {
          background-color: #fce7f3;
          font-weight: bold;
          color: #9d174d;
          text-align: center;
          font-size: 8px;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-section {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 2px solid #ec4899;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 10px;
        }
        
        .total-row.grand-total {
          font-weight: bold;
          font-size: 12px;
          color: #ec4899;
          padding-top: 6px;
          border-top: 1px solid #ddd;
        }
        
        .amount-words {
          margin-top: 12px;
          padding: 8px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          font-size: 9px;
          font-style: italic;
          color: #7c2d12;
        }
        
        .payment-info {
          margin-top: 15px;
          padding: 8px;
          background-color: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 4px;
          font-size: 9px;
        }
        
        .footer {
          margin-top: 25px;
          display: flex;
          justify-content: center;
          font-size: 10px;
        }
        
        .signature-invoice {
          text-align: center;
          width: 180px;
        }
        
        .signature-line-invoice {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
          font-weight: bold;
        }
        
        .footer-note {
          margin-top: 20px;
          padding: 8px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 8px;
          color: #64748b;
          text-align: center;
        }
        
        .print-date {
          text-align: center;
          margin-top: 15px;
          font-size: 7px;
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
      
      <div class="document-title">INVOICE FIELD TRIP</div>
      
      <div class="info-section">
        <div>
          <div class="info-label">Tanggal Transaksi:</div>
          <div>${new Date(transactionDate).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <div class="info-label" style="margin-top: 8px;">No. Invoice:</div>
          <div>FT-${sale.id.substring(0, 8).toUpperCase()}</div>
        </div>
        <div style="text-align: right;">
          <div class="info-label">Kasir:</div>
          <div>${cashierName}</div>
          <div class="info-label" style="margin-top: 8px;">Waktu:</div>
          <div>${new Date(transactionDate).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</div>
        </div>
      </div>
      
      <div class="customer-section">
        <div class="customer-row">
          <span><strong>Pelanggan:</strong> ${sale.customerName}</span>
          <span><strong>Telepon:</strong> ${sale.customerPhone || '-'}</span>
        </div>
        ${sale.customerAddress ? `
        <div style="margin-top: 4px;">
          <strong>Alamat:</strong> ${sale.customerAddress}
        </div>
        ` : ''}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%;">No</th>
            <th style="width: 50%;">Nama Produk</th>
            <th style="width: 15%;">Harga</th>
            <th style="width: 10%;">Qty</th>
            <th style="width: 17%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${sale.products.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td class="text-right">Rp ${item.price.toLocaleString('id-ID')}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">Rp ${item.totalPrice.toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rp ${sale.subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL PEMBAYARAN:</span>
          <span>Rp ${sale.totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <div class="amount-words">
        <strong>Terbilang:</strong> ${numberToWords(sale.totalAmount)} rupiah
      </div>
      
      ${sale.paymentStatus && sale.paymentStatus === 'dp' ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> DP (Down Payment)<br>
        <strong>Jumlah DP:</strong> Rp ${sale.dpAmount?.toLocaleString('id-ID')}<br>
        <strong>Sisa Pembayaran:</strong> Rp ${sale.outstandingAmount?.toLocaleString('id-ID')}<br>
        <strong>Metode Pembayaran:</strong> ${sale.paymentMethod || 'Tidak diketahui'}
      </div>
      ` : sale.paymentMethod ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> LUNAS<br>
        <strong>Metode Pembayaran:</strong> ${sale.paymentMethod}
      </div>
      ` : ''}
      
      ${sale.notes ? `
      <div style="margin-top: 12px; padding: 8px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; font-size: 9px;">
        <strong>Catatan:</strong> ${sale.notes}
      </div>
      ` : ''}
      
      <div class="footer">
        <div class="signature-invoice">
          <div>Kasir</div>
          <div class="signature-line-invoice">${cashierName}</div>
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

export const generateFieldTripReceiptWithCashier = (sale: FieldTripSale, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
  const receiptWindow = window.open('', '_blank')
  if (!receiptWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kwitansi Field Trip - ${sale.customerName}</title>
      <style>
        @page {
          size: A5;
          margin: 12mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #333;
        }
        
        .receipt-container {
          max-width: 400px;
          margin: 0 auto;
          border: 2px solid #ec4899;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          padding: 15px;
          text-align: center;
        }
        
        .logo {
          max-width: 50px;
          max-height: 38px;
          margin: 0 auto 8px;
          display: block;
          filter: brightness(0) invert(1);
        }
        
        .clinic-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .clinic-info {
          font-size: 9px;
          line-height: 1.2;
          opacity: 0.9;
        }
        
        .content {
          padding: 18px;
        }
        
        .document-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #ec4899;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
          font-size: 10px;
        }
        
        .info-label {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 2px;
        }
        
        .customer-info {
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .amount-section {
          background-color: #fef7ff;
          border: 2px solid #f3e8ff;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
          text-align: center;
        }
        
        .amount-label {
          font-size: 10px;
          color: #be185d;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .amount-value {
          font-size: 22px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 12px;
        }
        
        .amount-words {
          font-size: 10px;
          font-style: italic;
          color: #7c2d12;
          padding: 8px;
          background-color: white;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
        }
        
        .details-section {
          margin: 15px 0;
          border-top: 1px solid #f3e8ff;
          border-bottom: 1px solid #f3e8ff;
          padding: 12px 0;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 10px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #be185d;
        }
        
        .footer {
          margin-top: 25px;
          display: flex;
          justify-content: center;
          font-size: 10px;
        }
        
        .signature-receipt {
          text-align: center;
          width: 160px;
        }
        
        .signature-line-receipt {
          border-top: 1px solid #333;
          margin-top: 35px;
          padding-top: 4px;
          font-weight: bold;
        }
        
        .footer-note {
          margin-top: 20px;
          padding: 12px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          font-size: 9px;
          color: #666;
          text-align: center;
        }
        
        .print-info {
          text-align: center;
          margin-top: 15px;
          font-size: 8px;
          color: #999;
          border-top: 1px solid #f3e8ff;
          padding-top: 12px;
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
          <div class="document-title">KWITANSI FIELD TRIP</div>
          
          <div class="receipt-info">
            <div>
              <div class="info-label">Tanggal:</div>
              <div>${new Date(transactionDate).toLocaleDateString('id-ID')}</div>
              <div class="info-label" style="margin-top: 8px;">No. Ref:</div>
              <div>FT-${sale.id.substring(0, 8).toUpperCase()}</div>
            </div>
            <div style="text-align: right;">
              <div class="info-label">Kasir:</div>
              <div>${cashierName}</div>
              <div class="info-label" style="margin-top: 8px;">Waktu:</div>
              <div>${new Date(transactionDate).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</div>
            </div>
          </div>
          
          <div class="customer-info">
            <div class="info-label">Pelanggan:</div>
            <div>${sale.customerName}</div>
            ${sale.customerPhone ? `
            <div class="info-label" style="margin-top: 6px;">Telepon:</div>
            <div>${sale.customerPhone}</div>
            ` : ''}
            ${sale.customerAddress ? `
            <div class="info-label" style="margin-top: 6px;">Alamat:</div>
            <div>${sale.customerAddress}</div>
            ` : ''}
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Telah Terima Untuk Penjualan Field Trip</div>
            <div class="amount-value">Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
            <div class="amount-words">
              <strong>Terbilang:</strong><br>
              ${numberToWords(sale.totalAmount)} rupiah
            </div>
          </div>
          
          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Untuk Pembayaran:</span>
              <span>Produk Field Trip</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Jumlah Item:</span>
              <span>${sale.products.length} produk</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Qty:</span>
              <span>${sale.products.reduce((sum, p) => sum + p.quantity, 0)} unit</span>
            </div>
            ${sale.paymentStatus && sale.paymentStatus === 'dp' ? `
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span>DP - Sisa: Rp ${sale.outstandingAmount?.toLocaleString('id-ID')}</span>
            </div>
            ` : `
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span>LUNAS</span>
            </div>
            `}
            ${sale.paymentMethod ? `
            <div class="detail-row">
              <span class="detail-label">Metode Bayar:</span>
              <span>${sale.paymentMethod}</span>
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