import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from './helpers'
import { months } from './constants'
import type {
  AttendanceReport,
  SalaryReport,
  DoctorFeeReport,
  TreatmentReport,
  SalesReport,
  FieldTripSaleReport,
  ExpenseReport,
  FinancialSummary
} from './types'

export const handlePrint = (
  type: string,
  filteredAttendanceData: AttendanceReport[],
  filteredSalaryData: SalaryReport[],
  filteredDoctorFeeData: DoctorFeeReport[],
  filteredTreatmentData: TreatmentReport[],
  filteredSalesData: SalesReport[],
  filteredFieldTripSalesData: FieldTripSaleReport[],
  filteredExpenseData: ExpenseReport[],
  filteredFinancialData: FinancialSummary[],
  onShowPreview?: (data: { title: string, content: string, recordCount: number, onConfirmPrint: () => void }) => void,
  doctorFeeFilters?: { doctorName?: string, groupByDoctor?: boolean }
) => {
  console.log('Print button clicked for type:', type)
  
  try {
    let tableContent = ''
    let title = ''
    let data: any[] = []
    
    if (type === 'attendance') {
      title = 'Laporan Absensi Karyawan'
      data = filteredAttendanceData
      tableContent = generateAttendanceTable(data)
    } else if (type === 'salary') {
      title = 'Laporan Gaji Karyawan'
      data = filteredSalaryData
      tableContent = generateSalaryTableA5(data)
    } else if (type === 'doctor-fees') {
      title = 'Laporan Fee Dokter'
      data = filteredDoctorFeeData
      tableContent = generateDoctorFeesTable(data, doctorFeeFilters)
    } else if (type === 'treatments') {
      title = 'Laporan Tindakan Medis'
      data = filteredTreatmentData
      tableContent = generateTreatmentsTable(data)
    } else if (type === 'sales') {
      title = 'Laporan Penjualan'
      data = filteredSalesData
      tableContent = generateSalesTable(data)
    } else if (type === 'field-trip-sales') {
      title = 'Laporan Penjualan Field Trip'
      data = filteredFieldTripSalesData
      tableContent = generateFieldTripSalesTable(data)
    } else if (type === 'expenses') {
      title = 'Laporan Pengeluaran'
      data = filteredExpenseData
      tableContent = generateExpensesTable(data)
    } else if (type === 'financial') {
      title = 'Laporan Keuangan Bulanan'
      data = filteredFinancialData
      tableContent = generateFinancialTable(data)
    } else if (type === 'field-trip-doctor-fees') {
      title = 'Laporan Fee Dokter Field Trip'
      data = [
        { doctorName: 'drg. Falasifah', specialization: 'GP', fee: 400000, fieldTripCount: 2, averageFee: 200000 },
        { doctorName: 'drg. Eka Puspitasari', specialization: 'GP', fee: 200000, fieldTripCount: 1, averageFee: 200000 }
      ]
      tableContent = generateFieldTripDoctorFeesTable(data)
    } else if (type === 'field-trip-employee-bonuses') {
      title = 'Laporan Bonus Karyawan Field Trip'
      data = [
        { employeeName: 'Muhammad Rakha Fitriansyah', position: 'Admin', bonus: 200000, fieldTripCount: 2, averageBonus: 100000 },
        { employeeName: 'Najwa Nurhaliza', position: 'Admin', bonus: 100000, fieldTripCount: 1, averageBonus: 100000 }
      ]
      tableContent = generateFieldTripEmployeeBonusesTable(data)
    }

    // If preview callback is provided, show preview first
    if (onShowPreview) {
      onShowPreview({
        title,
        content: tableContent,
        recordCount: data.length,
        onConfirmPrint: () => printUsingIframe(title, tableContent, data.length)
      })
    } else {
      // Direct print without preview
      printUsingIframe(title, tableContent, data.length)
    }
    
  } catch (error) {
    console.error('Print error:', error)
    toast.error('Gagal mencetak laporan')
  }
}

// Export function for direct printing (used from preview confirmation)
export const executePrint = (title: string, tableContent: string, recordCount: number) => {
  printUsingIframe(title, tableContent, recordCount)
}

const printUsingIframe = (title: string, tableContent: string, recordCount: number) => {
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    
    document.body.appendChild(iframe)
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      throw new Error('Cannot access iframe document')
    }
    
    const printContent = generateA5PrintHTML(title, tableContent, recordCount)
    
    iframeDoc.open()
    iframeDoc.write(printContent)
    iframeDoc.close()
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
        
        toast.success('Laporan siap dicetak!')
      } catch (printError) {
        console.error('Print execution error:', printError)
        fallbackPrint(title, tableContent, recordCount)
      }
    }
    
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        toast.success('Laporan siap dicetak!')
      } catch (printError) {
        console.error('Immediate print error:', printError)
        document.body.removeChild(iframe)
        fallbackPrint(title, tableContent, recordCount)
      }
    }, 500)
    
  } catch (error) {
    console.error('Iframe print error:', error)
    fallbackPrint(title, tableContent, recordCount)
  }
}

const fallbackPrint = (title: string, tableContent: string, recordCount: number) => {
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      downloadAsPDF(title, tableContent, recordCount)
      return
    }

    const printContent = generateA5PrintHTML(title, tableContent, recordCount)
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }

    toast.success('Laporan siap dicetak!')
    
  } catch (error) {
    console.error('Fallback print error:', error)
    downloadAsPDF(title, tableContent, recordCount)
  }
}

const downloadAsPDF = (title: string, tableContent: string, recordCount: number) => {
  try {
    const printContent = generateA5PrintHTML(title, tableContent, recordCount)
    const blob = new Blob([printContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Laporan berhasil diunduh sebagai file HTML!')
    
  } catch (error) {
    console.error('Download error:', error)
    toast.error('Gagal mencetak atau mengunduh laporan')
  }
}

// Optimized salary table for A5 with larger fonts
const generateSalaryTableA5 = (data: SalaryReport[]): string => {
  const totalBaseSalary = data.reduce((sum, item) => sum + (item.baseSalary || 0), 0)
  const totalBonus = data.reduce((sum, item) => sum + (item.bonus || 0), 0)
  const totalHolidayAllowance = data.reduce((sum, item) => sum + (item.holidayAllowance || 0), 0)
  const totalSalary = data.reduce((sum, item) => sum + (item.totalSalary || 0), 0)
  const employeeCount = data.length

  return `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #e5e7eb; margin-bottom: 25px; font-size: 12px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Karyawan</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Periode</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Gaji Pokok</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Bonus</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Tunjangan Raya</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold; color: #9d174d;">Total Gaji</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; font-weight: 500;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px;">${months.find(m => m.value === item.month)?.label} ${item.year}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px;">${formatCurrency(item.baseSalary)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; color: #16a34a;">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; color: #2563eb;">${formatCurrency(item.holidayAllowance)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; font-weight: bold; color: #dc2626;">${formatCurrency(item.totalSalary)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 3px solid #9d174d;">
          <td colspan="2" style="border: 2px solid #e5e7eb; padding: 15px 10px; font-weight: bold; color: #9d174d; text-align: center; font-size: 13px;">
            TOTAL (${employeeCount} Karyawan)
          </td>
          <td style="border: 2px solid #e5e7eb; padding: 15px 10px; font-weight: bold; color: #9d174d; background-color: #fce7f3; font-size: 12px;">
            ${formatCurrency(totalBaseSalary)}
          </td>
          <td style="border: 2px solid #e5e7eb; padding: 15px 10px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 12px;">
            ${formatCurrency(totalBonus)}
          </td>
          <td style="border: 2px solid #e5e7eb; padding: 15px 10px; font-weight: bold; color: #2563eb; background-color: #dbeafe; font-size: 12px;">
            ${formatCurrency(totalHolidayAllowance)}
          </td>
          <td style="border: 2px solid #e5e7eb; padding: 15px 10px; font-weight: bold; font-size: 14px; color: #dc2626; background-color: #fee2e2;">
            ${formatCurrency(totalSalary)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Summary Box optimized for A5 -->
    <div style="margin: 25px 0; padding: 20px; border: 3px solid #9d174d; border-radius: 10px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);">
      <h3 style="margin: 0 0 15px 0; color: #9d174d; font-size: 18px; text-align: center; border-bottom: 2px solid #9d174d; padding-bottom: 10px; font-weight: bold;">
        📊 RINGKASAN PENGGAJIAN
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #9d174d; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px; font-weight: 500;">Jumlah Karyawan</div>
          <div style="font-size: 20px; font-weight: bold; color: #9d174d;">${employeeCount} Orang</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #dc2626; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px; font-weight: 500;">Total Pengeluaran Gaji</div>
          <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalary)}</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #16a34a; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px; font-weight: 500;">Total Bonus</div>
          <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${formatCurrency(totalBonus)}</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px; font-weight: 500;">Total Tunjangan Raya</div>
          <div style="font-size: 20px; font-weight: bold; color: #2563eb;">${formatCurrency(totalHolidayAllowance)}</div>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 18px; background: rgba(220, 38, 38, 0.1); border-radius: 8px; border: 2px dashed #dc2626;">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 6px; font-weight: 500;">💰 TOTAL YANG HARUS DIBAYAR</div>
          <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalary)}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 6px; font-style: italic;">
            Rata-rata per karyawan: ${formatCurrency(employeeCount > 0 ? totalSalary / employeeCount : 0)}
          </div>
        </div>
      </div>
    </div>
    
    ${generateSalarySignatureSectionA5(data)}
  `
}

// Signature section optimized for A5 with employee terminology
const generateSalarySignatureSectionA5 = (data: SalaryReport[]): string => {
  const employeeNames = [...new Set(data.map(item => item.employeeName))].filter(Boolean)
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `
    <!-- Signature Section for Salary Report - Optimized for A5 -->
    <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #e5e7eb; page-break-inside: avoid;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; max-width: 100%; font-size: 12px;">
        
        <!-- Left Section: Manager -->
        <div style="text-align: center;">
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #374151; font-size: 14px;">Mengetahui,</div>
            <div style="color: #6b7280; font-size: 12px;">Manager Klinik</div>
          </div>
          <div style="height: 60px; border-bottom: 2px solid #374151; margin: 20px 25px;"></div>
          <div style="color: #374151; font-weight: bold; font-size: 13px;">drg. Falasifah</div>
          <div style="color: #6b7280; font-size: 11px;">Dokter & Owner</div>
        </div>

        <!-- Right Section: Employee Names -->
        <div style="text-align: center;">
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #374151; font-size: 14px;">Yang Menerima,</div>
            <div style="color: #6b7280; font-size: 12px;">Karyawan</div>
          </div>
          ${employeeNames.length === 1 ? `
            <div style="height: 60px; border-bottom: 2px solid #374151; margin: 20px 25px;"></div>
            <div style="color: #374151; font-weight: bold; font-size: 13px;">${employeeNames[0]}</div>
            <div style="color: #6b7280; font-size: 11px;">Karyawan</div>
          ` : `
            <div style="margin: 20px 0; text-align: center;">
              <div style="color: #6b7280; font-size: 11px; margin-bottom: 8px;">Karyawan yang menerima:</div>
              ${employeeNames.map(name => `
                <div style="color: #374151; font-weight: bold; font-size: 12px; margin: 4px 0;">${name}</div>
              `).join('')}
            </div>
          `}
        </div>

      </div>

      <!-- Footer Info -->
      <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #e5e7eb; text-align: center;">
        <div style="color: #6b7280; font-size: 10px; line-height: 1.5;">
          <div style="font-weight: 500;">📍 Falasifah Dental Clinic</div>
          <div>Laporan ini dicetak pada: ${currentDate}</div>
          <div style="margin-top: 5px;">Sistem Manajemen Klinik Digital</div>
        </div>
      </div>
    </div>
  `
}

// A5 optimized print HTML generator
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
          margin: 20mm 15mm 20mm 15mm;
          counter-increment: page;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #374151;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ec4899;
        }
        
        .clinic-name {
          font-size: 20px;
          font-weight: bold;
          color: #9d174d;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        
        .clinic-subtitle {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .report-title {
          font-size: 16px;
          font-weight: bold;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.8px;
        }
        
        .report-info {
          font-size: 10px;
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
          font-size: 11px;
        }
        
        th {
          background-color: #fce7f3;
          color: #9d174d;
          font-weight: bold;
          padding: 10px 8px;
          border: 2px solid #e5e7eb;
          text-align: left;
          font-size: 11px;
        }
        
        td {
          padding: 8px;
          border: 1px solid #e5e7eb;
          font-size: 10px;
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
          margin: 20px 0;
          padding: 15px;
          border: 2px solid #9d174d;
          border-radius: 10px;
          background: #fdf2f8;
          text-align: center;
        }
        
        .summary-title {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .summary-amount {
          font-size: 20px;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 8px;
        }
        
        .summary-detail {
          font-size: 10px;
          color: #6b7280;
        }
        
        .signature-section {
          margin-top: 30px;
          padding-top: 25px;
          border-top: 2px solid #e5e7eb;
          page-break-inside: avoid;
        }
        
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 25px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 5px;
          color: #374151;
        }
        
        .signature-subtitle {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 20px;
        }
        
        .signature-line {
          height: 50px;
          border-bottom: 2px solid #374151;
          margin: 0 20px 15px;
        }
        
        .signature-name {
          font-weight: bold;
          font-size: 11px;
          color: #374151;
          margin-bottom: 3px;
        }
        
        .signature-role {
          font-size: 10px;
          color: #6b7280;
        }
        
        .footer {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px dashed #e5e7eb;
          text-align: center;
        }
        
        .footer-info {
          font-size: 9px;
          color: #6b7280;
          line-height: 1.4;
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
          
          .summary-box {
            page-break-inside: avoid;
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

// Placeholder functions for other report types (keeping same structure but updated)
const generateAttendanceTable = (data: AttendanceReport[]): string => {
  const employees = new Set(data.map(item => item.doctorName))
  const shifts = new Set(data.map(item => item.shift))
  const checkIns = data.filter(item => item.type === 'check-in').length
  const checkOuts = data.filter(item => item.type === 'check-out').length
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #e5e7eb; margin-bottom: 25px; font-size: 12px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; color: #9d174d;">Karyawan</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; color: #9d174d;">Shift</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; color: #9d174d;">Tanggal</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; color: #9d174d;">Jenis</th>
          <th style="border: 2px solid #e5e7eb; padding: 12px 8px; text-align: left; font-size: 12px; color: #9d174d;">Waktu</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; font-weight: 500;">${item.doctorName || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px;">${item.shift || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px;">${item.type === 'check-in' ? 'Masuk' : 'Pulang'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 11px; font-family: monospace;">${item.time || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div style="margin: 25px 0; padding: 20px; border: 3px solid #4f46e5; border-radius: 10px; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);">
      <h3 style="margin: 0 0 15px 0; color: #4f46e5; font-size: 18px; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        📋 RINGKASAN ABSENSI
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #4f46e5; text-align: center;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">Total Record</div>
          <div style="font-size: 20px; font-weight: bold; color: #4f46e5;">${data.length}</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #2563eb; text-align: center;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">Jumlah Karyawan</div>
          <div style="font-size: 20px; font-weight: bold; color: #2563eb;">${employees.size}</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #16a34a; text-align: center;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">Absen Masuk</div>
          <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${checkIns}</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #ea580c; text-align: center;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">Absen Pulang</div>
          <div style="font-size: 20px; font-weight: bold; color: #ea580c;">${checkOuts}</div>
        </div>
      </div>
    </div>
  `
}

// Placeholder functions to prevent errors
const generateDoctorFeesTable = (data: any[], filters?: any): string => {
  return '<div>Doctor fees table placeholder</div>'
}

const generateTreatmentsTable = (data: any[]): string => {
  return '<div>Treatments table placeholder</div>'
}

const generateSalesTable = (data: any[]): string => {
  return '<div>Sales table placeholder</div>'
}

const generateFieldTripSalesTable = (data: any[]): string => {
  return '<div>Field trip sales table placeholder</div>'
}

const generateExpensesTable = (data: any[]): string => {
  return '<div>Expenses table placeholder</div>'
}

const generateFinancialTable = (data: any[]): string => {
  return '<div>Financial table placeholder</div>'
}

const generateFieldTripDoctorFeesTable = (data: any[]): string => {
  return '<div>Field trip doctor fees table placeholder</div>'
}

const generateFieldTripEmployeeBonusesTable = (data: any[]): string => {
  return '<div>Field trip employee bonuses table placeholder</div>'
}