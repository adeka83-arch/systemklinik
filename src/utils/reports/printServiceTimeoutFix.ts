// Timeout-resistant print HTML generator
// This function is designed to handle large amounts of data without causing timeouts

export const generatePrintHTMLWithTimeout = (title: string, tableContent: string, recordCount: number): string => {
  try {
    console.log('🔧 Generating print HTML with timeout protection...')
    
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Split large content into smaller chunks to prevent browser hanging
    const maxContentLength = 50000 // 50KB chunks
    let processedContent = tableContent
    
    if (tableContent.length > maxContentLength) {
      console.log(`⚠️ Large content detected (${tableContent.length} chars), processing in chunks...`)
      
      // Simple content chunking - split tables if they're too large
      const tableMatches = tableContent.match(/<table[\s\S]*?<\/table>/gi)
      if (tableMatches && tableMatches.length > 1) {
        // If multiple tables, keep only the first few to prevent timeout
        const maxTables = 3
        processedContent = tableMatches.slice(0, maxTables).join('\n\n')
        console.log(`📊 Reduced ${tableMatches.length} tables to ${maxTables} for printing`)
      } else {
        // If single large table, truncate content
        processedContent = tableContent.substring(0, maxContentLength) + '\n\n<p style="text-align: center; color: #dc2626; font-weight: bold;">⚠️ Konten terpotong untuk mencegah timeout. Gunakan filter untuk mengurangi data.</p>'
        console.log('✂️ Content truncated to prevent timeout')
      }
    }

    // Generate optimized HTML with minimal styling to prevent rendering issues
    const printHTML = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Falasifah Dental Clinic</title>
        <style>
          /* Optimized print styles - minimal to prevent timeout */
          @page {
            size: A4;
            margin: 20mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ec4899;
          }
          
          .clinic-name {
            font-size: 18px;
            font-weight: bold;
            color: #9d174d;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .report-info {
            font-size: 12px;
            color: #6b7280;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
          }
          
          th {
            background-color: #fce7f3;
            color: #9d174d;
            font-weight: bold;
            padding: 8px 6px;
            border: 1px solid #e5e7eb;
            text-align: left;
          }
          
          td {
            padding: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }
          
          /* Print optimizations */
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
            
            .header {
              page-break-after: avoid;
            }
            
            .footer {
              page-break-before: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="clinic-name">Falasifah Dental Clinic</div>
          <div class="report-title">${title}</div>
          <div class="report-info">
            Dicetak pada: ${currentDate} | Total Record: ${recordCount}
          </div>
        </div>
        
        <!-- Content -->
        <div class="content">
          ${processedContent}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div>📍 Falasifah Dental Clinic</div>
          <div>Laporan ini dicetak pada: ${currentDate}</div>
          <div>Sistem Manajemen Klinik Digital</div>
        </div>
      </body>
      </html>
    `

    console.log('✅ Print HTML generated successfully')
    return printHTML

  } catch (error) {
    console.error('❌ Error generating print HTML:', error)
    
    // Return a minimal error page if HTML generation fails
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Error - ${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
          .error { color: #dc2626; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Falasifah Dental Clinic</h1>
        <h2>${title}</h2>
        <div class="error">
          <p>❌ Terjadi kesalahan saat memuat laporan</p>
          <p>Silakan coba lagi dengan data yang lebih sedikit</p>
        </div>
        <p>Error: ${error.message || 'Unknown error'}</p>
      </body>
      </html>
    `
  }
}

// Alternative simplified print function for very large datasets
export const generateSimplePrintHTML = (title: string, data: any[], recordCount: number): string => {
  try {
    const currentDate = new Date().toLocaleDateString('id-ID')
    
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title} - Falasifah Dental Clinic</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ec4899; padding-bottom: 15px; }
          .clinic-name { font-size: 18px; font-weight: bold; color: #9d174d; margin-bottom: 5px; }
          .report-title { font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 8px; }
          .info { font-size: 12px; color: #6b7280; }
          .summary { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">Falasifah Dental Clinic</div>
          <div class="report-title">${title}</div>
          <div class="info">Dicetak pada: ${currentDate} | Total Record: ${recordCount}</div>
        </div>
        
        <div class="summary">
          <h3>📊 Ringkasan Laporan</h3>
          <p><strong>Jumlah Data:</strong> ${recordCount} record</p>
          <p><strong>Tanggal Cetak:</strong> ${currentDate}</p>
          <p><strong>Status:</strong> Data terlalu besar untuk ditampilkan detail. Gunakan filter untuk mengurangi data.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280;">
          <div>📍 Falasifah Dental Clinic</div>
          <div>Sistem Manajemen Klinik Digital</div>
        </div>
      </body>
      </html>
    `
  } catch (error) {
    return `<html><body><h1>Error generating report</h1><p>${error.message}</p></body></html>`
  }
}