// Template cetak A4 untuk penjualan field trip
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

export const generateFieldTripInvoiceA4 = (sale: FieldTripSale, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
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
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #333;
          background: white;
        }
        
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 0;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding: 15px 0;
          border-bottom: 3px solid #ec4899;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo {
          width: 70px;
          height: 50px;
          object-fit: contain;
        }
        
        .clinic-info {
          flex: 1;
        }
        
        .clinic-name {
          font-size: 20px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .clinic-address {
          font-size: 10px;
          color: #666;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        
        .clinic-contact {
          font-size: 10px;
          color: #666;
          font-weight: 500;
        }
        
        .invoice-info {
          text-align: right;
          min-width: 180px;
        }
        
        .invoice-title {
          font-size: 17px;
          font-weight: bold;
          color: #ec4899;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }
        
        .invoice-number {
          font-size: 12px;
          color: #333;
          margin-bottom: 3px;
        }
        
        .invoice-date {
          font-size: 11px;
          color: #666;
        }
        
        .transaction-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 30px;
        }
        
        .transaction-details {
          flex: 1;
          background-color: #fef7ff;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #f3e8ff;
        }
        
        .transaction-title {
          font-size: 12px;
          font-weight: bold;
          color: #be185d;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #666;
          min-width: 110px;
        }
        
        .detail-value {
          color: #333;
          font-weight: 500;
        }
        
        .customer-section {
          background-color: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }
        
        .customer-title {
          font-size: 12px;
          font-weight: bold;
          color: #be185d;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .customer-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .items-section {
          margin-bottom: 16px;
        }
        
        .items-title {
          font-size: 14px;
          font-weight: bold;
          color: #be185d;
          margin-bottom: 10px;
          text-transform: uppercase;
          padding-bottom: 5px;
          border-bottom: 2px solid #fce7f3;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .items-table th {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          padding: 8px 10px;
          text-align: center;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .items-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 10px;
        }
        
        .items-table tbody tr:nth-child(even) {
          background-color: #fefefe;
        }
        
        .items-table tbody tr:hover {
          background-color: #fef7ff;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .product-name {
          font-weight: 500;
          color: #333;
        }
        
        .price-format {
          font-weight: 500;
          color: #059669;
        }
        
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }
        
        .total-table {
          width: 300px;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .total-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 11px;
        }
        
        .total-label {
          background-color: #fef7ff;
          font-weight: 600;
          color: #666;
          width: 170px;
        }
        
        .total-value {
          background-color: white;
          font-weight: 500;
          text-align: right;
          color: #333;
        }
        
        .grand-total-row .total-label {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .grand-total-row .total-value {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          font-weight: bold;
          font-size: 13px;
        }
        
        .amount-words {
          margin-top: 12px;
          padding: 10px;
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
          border: 1px solid #f3e8ff;
          border-radius: 6px;
          font-style: italic;
          color: #7c2d12;
          text-align: center;
          font-size: 10px;
        }
        
        .amount-words-label {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 3px;
          font-size: 11px;
        }
        
        .payment-info {
          margin-top: 12px;
          padding: 10px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          font-size: 10px;
        }
        
        .payment-title {
          font-weight: bold;
          color: #065f46;
          margin-bottom: 6px;
          text-transform: uppercase;
          font-size: 11px;
        }
        
        .payment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .notes-section {
          margin-top: 12px;
          padding: 10px;
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 6px;
        }
        
        .notes-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .notes-content {
          color: #78350f;
          line-height: 1.4;
          font-size: 10px;
        }
        
        .footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .signature-section {
          text-align: center;
          min-width: 160px;
        }
        
        .signature-title {
          font-weight: bold;
          color: #666;
          margin-bottom: 35px;
          font-size: 11px;
        }
        
        .signature-line {
          border-top: 2px solid #333;
          padding-top: 5px;
          font-weight: bold;
          color: #333;
          font-size: 10px;
        }
        
        .footer-info {
          text-align: right;
          color: #666;
          font-size: 9px;
          line-height: 1.3;
        }
        
        .thank-you {
          margin-top: 15px;
          text-align: center;
          padding: 10px;
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
          border-radius: 6px;
          color: #666;
          font-style: italic;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo-section">
            <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
            <div class="clinic-info">
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-address">Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19</div>
              <div class="clinic-address">Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat</div>
              <div class="clinic-contact">Telp/WA: 085283228355</div>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">Invoice Field Trip</div>
            <div class="invoice-number">No: FT-${sale.id.substring(0, 8).toUpperCase()}</div>
            <div class="invoice-date">${new Date(transactionDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
        </div>

        <div class="transaction-info">
          <div class="transaction-details">
            <div class="transaction-title">Informasi Transaksi</div>
            <div class="detail-row">
              <span class="detail-label">Tanggal Transaksi:</span>
              <span class="detail-value">${new Date(transactionDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Waktu Transaksi:</span>
              <span class="detail-value">${new Date(transactionDate).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Kasir:</span>
              <span class="detail-value">${cashierName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${sale.paymentStatus === 'dp' ? 'Down Payment' : 'Lunas'}</span>
            </div>
          </div>
        </div>

        <div class="customer-section">
          <div class="customer-title">Informasi Pelanggan</div>
          <div class="customer-details">
            <div>
              <div class="detail-row">
                <span class="detail-label">Nama:</span>
                <span class="detail-value">${sale.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Telepon:</span>
                <span class="detail-value">${sale.customerPhone || '-'}</span>
              </div>
            </div>
            <div>
              ${sale.customerAddress ? `
              <div class="detail-row">
                <span class="detail-label">Alamat:</span>
                <span class="detail-value">${sale.customerAddress}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="items-section">
          <div class="items-title">Detail Produk</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px;">No</th>
                <th style="width: auto;">Nama Produk</th>
                <th style="width: 100px;">Harga Satuan</th>
                <th style="width: 60px;">Qty</th>
                <th style="width: 100px;">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              ${sale.products.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td class="product-name">${item.name}</td>
                  <td class="text-right price-format">Rp ${item.price.toLocaleString('id-ID')}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right price-format">Rp ${item.totalPrice.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <table class="total-table">
            <tr>
              <td class="total-label">Subtotal</td>
              <td class="total-value">Rp ${sale.subtotal.toLocaleString('id-ID')}</td>
            </tr>
            <tr class="grand-total-row">
              <td class="total-label">Total Pembayaran</td>
              <td class="total-value">Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <div class="amount-words">
          <div class="amount-words-label">Terbilang:</div>
          ${numberToWords(sale.totalAmount)} rupiah
        </div>

        ${sale.paymentStatus && sale.paymentStatus === 'dp' ? `
        <div class="payment-info">
          <div class="payment-title">Informasi Pembayaran DP</div>
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">Jumlah DP:</span>
              <span class="detail-value">Rp ${sale.dpAmount?.toLocaleString('id-ID')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sisa Pembayaran:</span>
              <span class="detail-value">Rp ${sale.outstandingAmount?.toLocaleString('id-ID')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Metode Pembayaran:</span>
              <span class="detail-value">${sale.paymentMethod || 'Tidak diketahui'}</span>
            </div>
          </div>
        </div>
        ` : sale.paymentMethod ? `
        <div class="payment-info">
          <div class="payment-title">Informasi Pembayaran</div>
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">LUNAS</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Metode Pembayaran:</span>
              <span class="detail-value">${sale.paymentMethod}</span>
            </div>
          </div>
        </div>
        ` : ''}

        ${sale.notes ? `
        <div class="notes-section">
          <div class="notes-title">Catatan:</div>
          <div class="notes-content">${sale.notes}</div>
        </div>
        ` : ''}

        <div class="footer">
          <div class="signature-section">
            <div class="signature-title">Kasir</div>
            <div class="signature-line">${cashierName}</div>
          </div>
          <div class="footer-info">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}<br>
            Oleh: ${cashierName}<br>
            Sistem: Falasifah Dental Clinic
          </div>
        </div>

        <div class="thank-you">
          Terima kasih atas kepercayaan Anda kepada ${clinicName}
        </div>
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

export const generateFieldTripReceiptA4 = (sale: FieldTripSale, cashierName: string, transactionDate: string, clinicSettings?: ClinicSettings) => {
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
          size: A4;
          margin: 12mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10px;
          line-height: 1.2;
          color: #333;
          background: white;
        }
        
        .receipt-container {
          max-width: 450px;
          margin: 0 auto;
          border: 1px solid #ec4899;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          padding: 14px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><circle cx="80" cy="30" r="10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>') repeat;
          opacity: 0.2;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .logo {
          width: 50px;
          height: 38px;
          object-fit: contain;
          margin: 0 auto 6px;
          display: block;
          filter: brightness(0) invert(1);
        }
        
        .clinic-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .clinic-info {
          font-size: 9px;
          line-height: 1.2;
          opacity: 0.95;
        }
        
        .content {
          padding: 18px;
        }
        
        .document-title {
          text-align: center;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #ec4899;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
        }
        
        .document-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 2px;
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          border-radius: 1px;
        }
        
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #f3e8ff;
        }
        
        .info-group {
          flex: 1;
        }
        
        .info-label {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 2px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .info-value {
          color: #333;
          font-weight: 500;
          margin-bottom: 6px;
          font-size: 9px;
        }
        
        .customer-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
        }
        
        .customer-title {
          font-size: 11px;
          font-weight: bold;
          color: #be185d;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .customer-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
          border: 1px solid #f3e8ff;
          border-radius: 8px;
          padding: 14px;
          margin: 12px 0;
          text-align: center;
          position: relative;
        }
        
        .amount-section::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(135deg, #ec4899, #be185d, #ec4899);
          border-radius: 8px;
          z-index: -1;
        }
        
        .amount-label {
          font-size: 10px;
          color: #be185d;
          font-weight: bold;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .amount-value {
          font-size: 22px;
          font-weight: bold;
          color: #ec4899;
          margin-bottom: 8px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .amount-words {
          font-size: 9px;
          font-style: italic;
          color: #7c2d12;
          padding: 6px;
          background-color: white;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          line-height: 1.3;
        }
        
        .amount-words-title {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 3px;
          text-transform: uppercase;
          font-style: normal;
          font-size: 9px;
        }
        
        .details-section {
          margin: 12px 0;
          border-top: 1px solid #f3e8ff;
          border-bottom: 1px solid #f3e8ff;
          padding: 8px 0;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
          padding: 3px 0;
          border-bottom: 1px solid #f8fafc;
        }
        
        .detail-label {
          font-weight: bold;
          color: #be185d;
          min-width: 80px;
          font-size: 9px;
        }
        
        .detail-value {
          color: #333;
          font-weight: 500;
          font-size: 9px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 8px;
          font-size: 8px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .status-lunas {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        
        .status-dp {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        
        .footer {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .signature-section {
          text-align: center;
          min-width: 120px;
        }
        
        .signature-title {
          font-weight: bold;
          color: #666;
          margin-bottom: 25px;
          font-size: 10px;
          text-transform: uppercase;
        }
        
        .signature-line {
          border-top: 2px solid #333;
          padding-top: 4px;
          font-weight: bold;
          color: #333;
          font-size: 10px;
        }
        
        .print-info {
          text-align: right;
          color: #666;
          font-size: 8px;
          line-height: 1.2;
        }
        
        .footer-note {
          margin-top: 8px;
          padding: 8px;
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
          border-radius: 6px;
          font-size: 9px;
          color: #666;
          text-align: center;
          font-style: italic;
          border: 1px solid #f3e8ff;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(236, 72, 153, 0.025);
          font-weight: bold;
          z-index: -1;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="watermark">KWITANSI</div>
      
      <div class="receipt-container">
        <div class="header">
          <div class="header-content">
            <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
            <div class="clinic-name">${clinicName}</div>
            <div class="clinic-info">
              Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
              Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
              Telp/WA: 085283228355
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="document-title">Kwitansi Field Trip</div>
          
          <div class="receipt-info">
            <div class="info-group">
              <div class="info-label">Tanggal Transaksi</div>
              <div class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              
              <div class="info-label">Nomor Referensi</div>
              <div class="info-value">FT-${sale.id.substring(0, 8).toUpperCase()}</div>
            </div>
            
            <div class="info-group" style="text-align: right;">
              <div class="info-label">Waktu Transaksi</div>
              <div class="info-value">${new Date(transactionDate).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}</div>
              
              <div class="info-label">Kasir</div>
              <div class="info-value">${cashierName}</div>
            </div>
          </div>
          
          <div class="customer-section">
            <div class="customer-title">Informasi Pelanggan</div>
            <div class="customer-details">
              <div>
                <div class="detail-row">
                  <span class="detail-label">Nama:</span>
                  <span class="detail-value">${sale.customerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Telepon:</span>
                  <span class="detail-value">${sale.customerPhone || '-'}</span>
                </div>
              </div>
              <div>
                ${sale.customerAddress ? `
                <div class="detail-row">
                  <span class="detail-label">Alamat:</span>
                  <span class="detail-value">${sale.customerAddress}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Telah Terima Untuk Penjualan Field Trip</div>
            <div class="amount-value">Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
            <div class="amount-words">
              <div class="amount-words-title">Terbilang:</div>
              ${numberToWords(sale.totalAmount)} rupiah
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-grid">
              <div class="detail-row">
                <span class="detail-label">Untuk Pembayaran:</span>
                <span class="detail-value">Produk Field Trip</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Jumlah Item:</span>
                <span class="detail-value">${sale.products.length} produk</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Quantity:</span>
                <span class="detail-value">${sale.products.reduce((sum, p) => sum + p.quantity, 0)} unit</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status Pembayaran:</span>
                <span class="detail-value">
                  ${sale.paymentStatus === 'dp' ? 
                    `<span class="status-badge status-dp">DP - Sisa: Rp ${sale.outstandingAmount?.toLocaleString('id-ID')}</span>` :
                    `<span class="status-badge status-lunas">LUNAS</span>`
                  }
                </span>
              </div>
              ${sale.paymentMethod ? `
              <div class="detail-row">
                <span class="detail-label">Metode Pembayaran:</span>
                <span class="detail-value">${sale.paymentMethod}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="footer">
            <div class="signature-section">
              <div class="signature-title">Kasir</div>
              <div class="signature-line">${cashierName}</div>
            </div>
            <div class="print-info">
              Dicetak pada: ${new Date().toLocaleString('id-ID')}<br>
              Oleh: ${cashierName}<br>
              Sistem: ${clinicName}
            </div>
          </div>
          
          <div class="footer-note">
            Terima kasih atas kepercayaan Anda kepada ${clinicName}.<br>
            Kwitansi ini merupakan bukti pembayaran yang sah.
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