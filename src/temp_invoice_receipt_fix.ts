// Template functions untuk invoice dan kwitansi tindakan tanpa signature dokter dan pasien

// Generate Invoice Without Signature
const generateInvoiceWithCashierNoSignature = (treatment: any, cashierName: string, transactionDate: string, clinicSettings: any, clinicLogo: string, numberToWords: (num: number) => string) => {
  const invoiceWindow = window.open('', '_blank')
  if (!invoiceWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'
  const currentAdminFee = treatment.adminFeeOverride || 20000

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice Tindakan - ${treatment.patientName}</title>
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
        
        .patient-section {
          margin-bottom: 15px;
          padding: 8px;
          background-color: #fef7ff;
          border: 1px solid #f3e8ff;
          border-radius: 4px;
          font-size: 9px;
        }
        
        .patient-row {
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
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
        }
        
        .footer-note {
          margin-top: 15px;
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
          ${treatment.treatmentTypes.map((item: any, index: number) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td class="text-right">Rp ${item.price.toLocaleString('id-ID')}</td>
              <td class="text-right">-Rp ${item.discountAmount.toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${item.finalPrice.toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
          ${treatment.selectedMedications && treatment.selectedMedications.length > 0 ? 
            treatment.selectedMedications.map((med: any, index: number) => `
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
      
      <div class="amount-words">
        <strong>Terbilang:</strong> ${numberToWords(treatment.totalTindakan)} rupiah
      </div>
      
      ${treatment.paymentStatus && treatment.paymentStatus === 'dp' ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> DP (Down Payment)<br>
        <strong>Jumlah DP:</strong> Rp ${treatment.dpAmount.toLocaleString('id-ID')}<br>
        <strong>Sisa Pembayaran:</strong> Rp ${treatment.outstandingAmount.toLocaleString('id-ID')}<br>
        <strong>Metode Pembayaran:</strong> ${treatment.paymentMethod || 'Tidak diketahui'}
      </div>
      ` : treatment.paymentMethod ? `
      <div class="payment-info">
        <strong>Status Pembayaran:</strong> LUNAS<br>
        <strong>Metode Pembayaran:</strong> ${treatment.paymentMethod}
      </div>
      ` : ''}
      
      <div class="footer">
        <div class="footer-note">
          Terima kasih atas kepercayaan Anda kepada ${clinicName}
        </div>
      </div>
      
      <div class="print-date">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
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

// Generate Receipt Without Signature
const generateReceiptWithCashierNoSignature = (treatment: any, cashierName: string, transactionDate: string, clinicSettings: any, clinicLogo: string, numberToWords: (num: number) => string) => {
  const receiptWindow = window.open('', '_blank')
  if (!receiptWindow) return

  const logoSrc = clinicSettings?.logo || clinicLogo
  const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'
  const currentAdminFee = treatment.adminFeeOverride || 20000

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kwitansi Tindakan - ${treatment.patientName}</title>
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
        
        .patient-info {
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
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
        }
        
        .footer-note {
          margin-top: 15px;
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
          
          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Untuk Pembayaran:</span>
              <span>Tindakan Dental</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Jenis Tindakan:</span>
              <span>${treatment.treatmentTypes.map((t: any) => t.name).join(', ')}</span>
            </div>
            ${treatment.selectedMedications && treatment.selectedMedications.length > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Obat:</span>
              <span>${treatment.selectedMedications.map((m: any) => `${m.name} (${m.quantity}x)`).join(', ')}</span>
            </div>
            ` : ''}
            ${treatment.paymentStatus && treatment.paymentStatus === 'dp' ? `
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span>DP - Sisa: Rp ${treatment.outstandingAmount.toLocaleString('id-ID')}</span>
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
            <div class="footer-note">
              Terima kasih atas kepercayaan Anda kepada ${clinicName}
            </div>
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

export { generateInvoiceWithCashierNoSignature, generateReceiptWithCashierNoSignature }