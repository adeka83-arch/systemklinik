// Function to create salary signature section with employee names instead of doctor
const generateSalarySignatureSection = (data: SalaryReport[]): string => {
  const employeeNames = [...new Set(data.map(item => item.employeeName))].filter(Boolean)
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `
    <!-- Signature Section for Salary Report - Optimized for A5 -->
    <div style="margin-top: 20px; padding: 12px; border-top: 1px solid #e5e7eb; page-break-inside: avoid;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 100%; font-size: 10px;">
        
        <!-- Left Section: Employee/Manager -->
        <div style="text-align: center;">
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; color: #374151; font-size: 11px;">Mengetahui,</div>
            <div style="color: #6b7280; font-size: 10px;">Manager Klinik</div>
          </div>
          <div style="height: 50px; border-bottom: 1px solid #374151; margin: 15px 20px;"></div>
          <div style="color: #374151; font-weight: bold; font-size: 10px;">drg. Falasifah</div>
          <div style="color: #6b7280; font-size: 9px;">Dokter & Owner</div>
        </div>

        <!-- Right Section: Employee Names -->
        <div style="text-align: center;">
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; color: #374151; font-size: 11px;">Yang Menerima,</div>
            <div style="color: #6b7280; font-size: 10px;">Karyawan Terkait</div>
          </div>
          ${employeeNames.length === 1 ? `
            <div style="height: 50px; border-bottom: 1px solid #374151; margin: 15px 20px;"></div>
            <div style="color: #374151; font-weight: bold; font-size: 10px;">${employeeNames[0]}</div>
            <div style="color: #6b7280; font-size: 9px;">Karyawan</div>
          ` : `
            <div style="margin: 15px 0; text-align: center;">
              <div style="color: #6b7280; font-size: 9px; margin-bottom: 5px;">Karyawan yang bersangkutan:</div>
              ${employeeNames.map(name => `
                <div style="color: #374151; font-weight: bold; font-size: 9px; margin: 2px 0;">${name}</div>
              `).join('')}
            </div>
          `}
        </div>

      </div>

      <!-- Footer Info -->
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb; text-align: center;">
        <div style="color: #6b7280; font-size: 8px; line-height: 1.4;">
          <div>📍 Falasifah Dental Clinic</div>
          <div>Laporan ini dicetak pada: ${currentDate}</div>
          <div style="margin-top: 5px;">Sistem Manajemen Klinik Digital</div>
        </div>
      </div>
    </div>
  `
}

// Function to create A5-optimized print HTML
const generateA5PrintHTML = (title: string, tableContent: string, recordCount: number): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Falasifah Dental Clinic</title>
      <style>
        @page {
          size: A5;
          margin: 15mm 12mm 15mm 12mm;
          counter-increment: page;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #374151;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #ec4899;
        }
        
        .clinic-name {
          font-size: 16px;
          font-weight: bold;
          color: #9d174d;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .clinic-subtitle {
          font-size: 9px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        
        .report-title {
          font-size: 14px;
          font-weight: bold;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .report-info {
          font-size: 9px;
          color: #6b7280;
        }
        
        .content {
          margin-bottom: 25px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9px;
        }
        
        th {
          background-color: #fce7f3;
          color: #9d174d;
          font-weight: bold;
          padding: 8px 6px;
          border: 1px solid #e5e7eb;
          text-align: left;
          font-size: 9px;
        }
        
        td {
          padding: 6px;
          border: 1px solid #e5e7eb;
          font-size: 8px;
        }
        
        .currency {
          text-align: right;
          font-weight: 500;
        }
        
        .total-row {
          background-color: #f8fafc;
          font-weight: bold;
        }
        
        .summary-box {
          margin: 15px 0;
          padding: 12px;
          border: 1px solid #9d174d;
          border-radius: 8px;
          background: #fdf2f8;
          text-align: center;
        }
        
        .summary-title {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        
        .summary-amount {
          font-size: 16px;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 5px;
        }
        
        .summary-detail {
          font-size: 8px;
          color: #6b7280;
        }
        
        .signature-section {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          page-break-inside: avoid;
        }
        
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 20px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-title {
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 3px;
          color: #374151;
        }
        
        .signature-subtitle {
          font-size: 8px;
          color: #6b7280;
          margin-bottom: 15px;
        }
        
        .signature-line {
          height: 40px;
          border-bottom: 1px solid #374151;
          margin: 0 15px 10px;
        }
        
        .signature-name {
          font-weight: bold;
          font-size: 9px;
          color: #374151;
          margin-bottom: 2px;
        }
        
        .signature-role {
          font-size: 8px;
          color: #6b7280;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #e5e7eb;
          text-align: center;
        }
        
        .footer-info {
          font-size: 7px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        /* Print-specific styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .signature-section {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="clinic-name">Falasifah Dental Clinic</div>
        <div class="clinic-subtitle">Klinik Gigi & Mulut Terpercaya</div>
        <div class="report-title">${title}</div>
        <div class="report-info">
          Dicetak pada: ${currentDate} | Total Record: ${recordCount}
        </div>
      </div>
      
      <!-- Content -->
      <div class="content">
        ${tableContent}
      </div>
    </body>
    </html>
  `
}