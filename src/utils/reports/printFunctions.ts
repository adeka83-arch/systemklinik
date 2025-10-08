// Default print HTML generator for non-salary reports
export const generatePrintHTML = (title: string, tableContent: string, recordCount: number): string => {
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
          size: A4;
          margin: 20mm;
          counter-increment: page;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ec4899;
        }
        
        .clinic-name {
          font-size: 24px;
          font-weight: bold;
          color: #9d174d;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        
        .clinic-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .report-title {
          font-size: 20px;
          font-weight: bold;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.8px;
        }
        
        .report-info {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .content {
          margin-bottom: 30px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        th {
          background-color: #fce7f3;
          color: #9d174d;
          font-weight: bold;
          padding: 12px 10px;
          border: 2px solid #e5e7eb;
          text-align: left;
          font-size: 13px;
        }
        
        td {
          padding: 10px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
        }
        
        /* Print-specific styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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

// Placeholder functions for missing signature sections
export const generateDoctorSignatureSection = (data: any[], filters?: any): string => {
  return '<div>Doctor signature section placeholder</div>'
}

export const generateFieldTripDoctorFeesTable = (data: any[]): string => {
  return '<div>Field trip doctor fees table placeholder</div>'
}

export const generateFieldTripEmployeeBonusesTable = (data: any[]): string => {
  return '<div>Field trip employee bonuses table placeholder</div>'
}

export const generateSalesTable = (data: any[]): string => {
  return '<div>Sales table placeholder</div>'
}

export const generateFieldTripSalesTable = (data: any[]): string => {
  return '<div>Field trip sales table placeholder</div>'
}

export const generateExpensesTable = (data: any[]): string => {
  return '<div>Expenses table placeholder</div>'
}

export const generateFinancialTable = (data: any[]): string => {
  return '<div>Financial table placeholder</div>'
}