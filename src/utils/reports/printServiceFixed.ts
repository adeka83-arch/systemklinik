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
  doctorFeeFilters?: { doctorName?: string, groupByDoctor?: boolean },
  fieldTripBonusData?: any[],
  fieldTripBonusFilters?: any
) => {
  console.log('Print button clicked for type:', type)
  
  try {
    let tableContent = ''
    let title = ''
    let data: any[] = []
    
    if (type === 'attendance') {
      title = 'Laporan Absensi Dokter'
      data = filteredAttendanceData
      tableContent = generateAttendanceTable(data)
    } else if (type === 'salary') {
      title = 'Laporan Gaji Karyawan'
      data = filteredSalaryData
      tableContent = generateSalaryTableWithFilters(data)
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
      title = 'Laporan Fee & Bonus Field Trip'
      
      // Use provided field trip bonus data if available, otherwise use default
      if (fieldTripBonusData && fieldTripBonusData.length > 0) {
        data = fieldTripBonusData
        console.log('Using provided field trip bonus data:', data)
      } else {
        // Fallback to hardcoded data if no custom data provided
        data = [
          { name: 'drg. Azwindar Eka Satria', type: 'doctor', role: 'GP', amount: 350000, fieldTripCount: 1, averageAmount: 350000 },
          { name: 'drg. Eka Puspitasari', type: 'doctor', role: 'GP', amount: 350000, fieldTripCount: 1, averageAmount: 350000 },
          { name: 'drg. Falasifah', type: 'doctor', role: 'GP', amount: 350000, fieldTripCount: 1, averageAmount: 350000 },
          { name: 'Muhammad Rakha Fitriansyah', type: 'employee', role: 'Admin', amount: 150000, fieldTripCount: 1, averageAmount: 150000 },
          { name: 'Najwa Nurhaliza', type: 'employee', role: 'Admin', amount: 150000, fieldTripCount: 1, averageAmount: 150000 }
        ]
        console.log('Using fallback hardcoded field trip data')
      }
      
      tableContent = generateFieldTripBonusTable(data, fieldTripBonusFilters)
    } else if (type === 'field-trip-employee-bonuses') {
      title = 'Laporan Bonus Karyawan Field Trip'
      // Generate hardcoded data for field trip employee bonuses
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
    // Create iframe element
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    
    // Add iframe to document
    document.body.appendChild(iframe)
    
    // Get iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      throw new Error('Cannot access iframe document')
    }
    
    // Generate print content
    const printContent = generatePrintHTML(title, tableContent, recordCount)
    
    // Write content to iframe
    iframeDoc.open()
    iframeDoc.write(printContent)
    iframeDoc.close()
    
    // Wait for content to load then print
    iframe.onload = () => {
      try {
        // Focus iframe and print
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        
        // Clean up - remove iframe after a delay
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
        
        toast.success('Laporan siap dicetak!')
      } catch (printError) {
        console.error('Print execution error:', printError)
        // Fallback to regular window.open if iframe fails
        fallbackPrint(title, tableContent, recordCount)
      }
    }
    
    // Also try to print immediately if onload doesn't trigger
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        
        toast.success('Laporan siap dicetak!')
      } catch (printError) {
        console.error('Immediate print error:', printError)
        // Clean up and fallback
        document.body.removeChild(iframe)
        fallbackPrint(title, tableContent, recordCount)
      }
    }, 500)
    
  } catch (error) {
    console.error('Iframe print error:', error)
    // Fallback to window.open method
    fallbackPrint(title, tableContent, recordCount)
  }
}

const fallbackPrint = (title: string, tableContent: string, recordCount: number) => {
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      // If pop-up is blocked, try to create a blob URL and download
      downloadAsPDF(title, tableContent, recordCount)
      return
    }

    const printContent = generatePrintHTML(title, tableContent, recordCount)
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
    const printContent = generatePrintHTML(title, tableContent, recordCount)
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

const generateAttendanceTable = (data: AttendanceReport[]): string => {
  // Calculate attendance statistics
  const doctors = new Set(data.map(item => item.doctorName))
  const shifts = new Set(data.map(item => item.shift))
  const checkIns = data.filter(item => item.type === 'check-in').length
  const checkOuts = data.filter(item => item.type === 'check-out').length
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Shift</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Jenis</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Waktu</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.doctorName || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.shift || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: ${item.type === 'check-in' ? '#16a34a' : '#ea580c'};">${item.type === 'check-in' ? 'Masuk' : 'Pulang'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.time || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Compact Summary -->
    <div style="margin: 8px 0; padding: 6px; border: 1px solid #4f46e5; border-radius: 4px; background: #f0f9ff;">
      <div style="text-align: center;">
        <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">📋 RINGKASAN ABSENSI</div>
        <div style="font-size: 12px; font-weight: bold; color: #4f46e5;">${data.length} Total Record</div>
        <div style="font-size: 8px; color: #6b7280; margin-top: 1px;">
          ${doctors.size} dokter • ${checkIns} masuk • ${checkOuts} pulang • ${shifts.size} shift
        </div>
      </div>
    </div>
    
    ${generateSignatureSection(data, 'attendance')}
  `
}

const generateSalaryTable = (data: SalaryReport[]): string => {
  // Calculate totals
  const totalBaseSalary = data.reduce((sum, item) => sum + (item.baseSalary || 0), 0)
  const totalBonus = data.reduce((sum, item) => sum + (item.bonus || 0), 0)
  const totalHolidayAllowance = data.reduce((sum, item) => sum + (item.holidayAllowance || 0), 0)
  const totalSalary = data.reduce((sum, item) => sum + (item.totalSalary || 0), 0)
  const employeeCount = data.length

  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Karyawan</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Periode</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Gaji Pokok</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Bonus</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tunjangan</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${months.find(m => m.value === item.month)?.label} ${item.year}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.baseSalary)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.holidayAllowance)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; font-weight: bold; color: #dc2626;">${formatCurrency(item.totalSalary)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #9d174d; text-align: center; font-size: 9px;">
            TOTAL (${employeeCount} Karyawan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #9d174d; font-size: 9px;">
            ${formatCurrency(totalBaseSalary)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalBonus)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #2563eb; font-size: 9px;">
            ${formatCurrency(totalHolidayAllowance)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #dc2626; font-size: 9px;">
            ${formatCurrency(totalSalary)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Compact Summary -->
    <div style="margin: 8px 0; padding: 6px; border: 1px solid #9d174d; border-radius: 4px; background: #fdf2f8;">
      <div style="text-align: center;">
        <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">📊 RINGKASAN PENGGAJIAN</div>
        <div style="font-size: 12px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalary)}</div>
        <div style="font-size: 8px; color: #6b7280; margin-top: 1px;">
          ${employeeCount} karyawan • Rata-rata: ${formatCurrency(employeeCount > 0 ? totalSalary / employeeCount : 0)}
        </div>
      </div>
    </div>
    
    ${generateSalarySignatureSection(data)}
  `
}

// Enhanced salary table generator with advanced filtering and styling
const generateSalaryTableWithFilters = (data: SalaryReport[]): string => {
  // Calculate comprehensive totals and statistics
  const totalBaseSalary = data.reduce((sum, item) => sum + (item.baseSalary || 0), 0)
  const totalBonus = data.reduce((sum, item) => sum + (item.bonus || 0), 0)
  const totalHolidayAllowance = data.reduce((sum, item) => sum + (item.holidayAllowance || 0), 0)
  const totalSalary = data.reduce((sum, item) => sum + (item.totalSalary || 0), 0)
  const employeeCount = data.length
  
  // Calculate additional statistics
  const averageSalary = employeeCount > 0 ? totalSalary / employeeCount : 0
  const maxSalary = Math.max(...data.map(item => item.totalSalary || 0))
  const minSalary = Math.min(...data.map(item => item.totalSalary || 0))
  
  // Group by month/year for period analysis
  const periodStats = data.reduce((acc, item) => {
    const period = `${months.find(m => m.value === item.month)?.label} ${item.year}`
    if (!acc[period]) {
      acc[period] = { count: 0, total: 0 }
    }
    acc[period].count += 1
    acc[period].total += item.totalSalary || 0
    return acc
  }, {} as Record<string, { count: number, total: number }>)

  return `
    <!-- Enhanced Header with Period Info -->
    <div style="margin-bottom: 12px; padding: 8px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 6px; border: 1px solid #f3e8ff;">
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: bold; color: #9d174d; margin-bottom: 4px;">📊 LAPORAN GAJI KARYAWAN DENGAN FILTER</div>
        <div style="font-size: 10px; color: #6b7280;">
          Periode: ${Object.keys(periodStats).join(', ')} • ${employeeCount} Karyawan
        </div>
      </div>
    </div>
    
    <!-- Main Salary Table with Enhanced Styling -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #ec4899; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);">
      <thead>
        <tr style="background: linear-gradient(135deg, #fce7f3 0%, #f8fafc 100%);">
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: center;">No</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d;">Nama Karyawan</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: center;">Periode</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: right;">Gaji Pokok</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: right;">Bonus</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: right;">Tunjangan</th>
          <th style="border: 1px solid #ec4899; padding: 8px; font-size: 10px; font-weight: bold; color: #9d174d; text-align: right;">Total Gaji</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#fefbff' : '#ffffff'}; transition: background-color 0.2s;">
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: center; color: #6b7280;">${index + 1}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; font-weight: 500; color: #1f2937;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: center; color: #6b7280;">${months.find(m => m.value === item.month)?.label} ${item.year}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: right; color: #374151;">${formatCurrency(item.baseSalary)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: right; color: ${item.bonus > 0 ? '#059669' : '#6b7280'};">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: right; color: ${item.holidayAllowance > 0 ? '#2563eb' : '#6b7280'};">${formatCurrency(item.holidayAllowance)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px; text-align: right; font-weight: bold; color: #dc2626; background-color: ${item.totalSalary === maxSalary ? '#fef2f2' : 'transparent'};">${formatCurrency(item.totalSalary)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-top: 2px solid #ec4899;">
          <td colspan="3" style="border: 1px solid #ec4899; padding: 10px; font-weight: bold; color: #9d174d; text-align: center; font-size: 10px;">
            TOTAL KESELURUHAN (${employeeCount} Karyawan)
          </td>
          <td style="border: 1px solid #ec4899; padding: 10px; font-weight: bold; color: #9d174d; font-size: 10px; text-align: right;">
            ${formatCurrency(totalBaseSalary)}
          </td>
          <td style="border: 1px solid #ec4899; padding: 10px; font-weight: bold; color: #059669; font-size: 10px; text-align: right;">
            ${formatCurrency(totalBonus)}
          </td>
          <td style="border: 1px solid #ec4899; padding: 10px; font-weight: bold; color: #2563eb; font-size: 10px; text-align: right;">
            ${formatCurrency(totalHolidayAllowance)}
          </td>
          <td style="border: 1px solid #ec4899; padding: 10px; font-weight: bold; color: #dc2626; font-size: 11px; text-align: right; background-color: #fef2f2;">
            ${formatCurrency(totalSalary)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Enhanced Statistics Summary -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 12px 0;">
      <!-- Total Summary Card -->
      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border: 2px solid #ec4899; border-radius: 8px; padding: 12px;">
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">💰 TOTAL PENGGAJIAN</div>
          <div style="font-size: 16px; font-weight: bold; color: #dc2626; margin-bottom: 6px;">${formatCurrency(totalSalary)}</div>
          <div style="font-size: 8px; color: #6b7280;">
            Rata-rata: <span style="font-weight: 600; color: #9d174d;">${formatCurrency(averageSalary)}</span>
          </div>
        </div>
      </div>
      
      <!-- Salary Range Card -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 8px; padding: 12px;">
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">📊 RENTANG GAJI</div>
          <div style="font-size: 9px; color: #0369a1; margin-bottom: 2px;">
            Tertinggi: <span style="font-weight: bold;">${formatCurrency(maxSalary)}</span>
          </div>
          <div style="font-size: 9px; color: #0369a1;">
            Terendah: <span style="font-weight: bold;">${formatCurrency(minSalary)}</span>
          </div>
        </div>
      </div>
      
      <!-- Period Analysis Card -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 8px; padding: 12px;">
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">📅 ANALISIS PERIODE</div>
          <div style="font-size: 9px; color: #15803d;">
            ${Object.entries(periodStats).map(([period, stats]) => 
              `${period}: ${stats.count} org (${formatCurrency(stats.total)})`
            ).join('<br>')}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Detailed Breakdown -->
    <div style="margin: 12px 0; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; background-color: #f9fafb;">
      <div style="font-size: 10px; font-weight: bold; color: #374151; margin-bottom: 6px; text-align: center;">
        🔍 RINCIAN KOMPONEN GAJI
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
        <div>
          <div style="font-size: 8px; color: #6b7280;">Gaji Pokok Total</div>
          <div style="font-size: 10px; font-weight: bold; color: #9d174d;">${formatCurrency(totalBaseSalary)}</div>
          <div style="font-size: 7px; color: #6b7280;">${((totalBaseSalary / totalSalary) * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div style="font-size: 8px; color: #6b7280;">Bonus Total</div>
          <div style="font-size: 10px; font-weight: bold; color: #059669;">${formatCurrency(totalBonus)}</div>
          <div style="font-size: 7px; color: #6b7280;">${((totalBonus / totalSalary) * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div style="font-size: 8px; color: #6b7280;">Tunjangan Total</div>
          <div style="font-size: 10px; font-weight: bold; color: #2563eb;">${formatCurrency(totalHolidayAllowance)}</div>
          <div style="font-size: 7px; color: #6b7280;">${((totalHolidayAllowance / totalSalary) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
    
    ${generateSalarySignatureSection(data)}
  `
}

// Enhanced signature section specifically for salary reports
const generateSalarySignatureSection = (data: SalaryReport[]): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const totalAmount = data.reduce((sum, item) => sum + (item.totalSalary || 0), 0)
  const employeeCount = data.length
  
  return `
    <!-- Professional Signature Section for Salary Report -->
    <div style="margin-top: 20px; page-break-inside: avoid;">
      <!-- Report Summary Banner -->
      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border: 2px solid #ec4899; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 12px; font-weight: bold; color: #9d174d; margin-bottom: 4px;">
            📋 RINGKASAN LAPORAN PENGGAJIAN
          </div>
          <div style="font-size: 10px; color: #6b7280; margin-bottom: 6px;">
            Total ${employeeCount} karyawan dengan nilai penggajian ${formatCurrency(totalAmount)}
          </div>
          <div style="font-size: 8px; color: #9d174d;">
            Laporan dicetak pada: ${currentDate}
          </div>
        </div>
      </div>
      
      <!-- Signature Grid with Enhanced Design -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px;">
        <!-- Prepared By -->
        <div style="text-align: center; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; background-color: #f9fafb;">
          <div style="font-size: 9px; font-weight: bold; color: #374151; margin-bottom: 8px;">
            DISIAPKAN OLEH
          </div>
          <div style="margin: 30px 0; border-bottom: 1px solid #6b7280; min-height: 40px;"></div>
          <div style="font-size: 8px; color: #6b7280;">
            Admin Keuangan<br>
            Tanggal: _______________
          </div>
        </div>
        
        <!-- Reviewed By -->
        <div style="text-align: center; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; background-color: #f9fafb;">
          <div style="font-size: 9px; font-weight: bold; color: #374151; margin-bottom: 8px;">
            DIPERIKSA OLEH
          </div>
          <div style="margin: 30px 0; border-bottom: 1px solid #6b7280; min-height: 40px;"></div>
          <div style="font-size: 8px; color: #6b7280;">
            Manager Operasional<br>
            Tanggal: _______________
          </div>
        </div>
        
        <!-- Approved By -->
        <div style="text-align: center; padding: 12px; border: 2px solid #ec4899; border-radius: 6px; background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%);">
          <div style="font-size: 9px; font-weight: bold; color: #9d174d; margin-bottom: 8px;">
            DISETUJUI OLEH
          </div>
          <div style="margin: 30px 0; border-bottom: 2px solid #ec4899; min-height: 40px;"></div>
          <div style="font-size: 8px; color: #9d174d; font-weight: 500;">
            Direktur Klinik<br>
            Tanggal: _______________
          </div>
        </div>
      </div>
      
      <!-- Important Notes -->
      <div style="margin-top: 16px; padding: 10px; background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px;">
        <div style="font-size: 8px; color: #92400e;">
          <strong>📌 Catatan Penting:</strong><br>
          • Laporan ini berisi informasi keuangan yang bersifat rahasia<br>
          • Harap pastikan keakuratan data sebelum pengesahan<br>
          • Dokumen ini sah setelah ditandatangani oleh pihak berwenang<br>
          • Untuk pertanyaan, hubungi Bagian Keuangan
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 7px; color: #9ca3af;">
          Laporan dibuat secara otomatis oleh Sistem Manajemen Klinik Falasifah Dental Clinic<br>
          Dicetak pada ${currentDate} | Total Record: ${employeeCount} | Total Nilai: ${formatCurrency(totalAmount)}
        </div>
      </div>
    </div>
  `
}

const generateDoctorFeesTable = (data: DoctorFeeReport[], filters?: { doctorName?: string, groupByDoctor?: boolean }): string => {
  // Calculate doctor fee statistics grouped by doctor
  const doctorStats = {}
  let grandTotalFees = 0
  
  data.forEach(item => {
    const doctorName = item.doctor || 'Unknown'
    const finalFee = item.finalFee || 0
    
    if (!doctorStats[doctorName]) {
      doctorStats[doctorName] = {
        name: doctorName,
        totalFinalFee: 0,
        treatmentCount: 0,
        sessionsWithTreatments: 0,
        sessionsWithoutTreatments: 0
      }
    }
    
    doctorStats[doctorName].totalFinalFee += finalFee
    doctorStats[doctorName].treatmentCount += 1
    
    if (item.hasTreatments) {
      doctorStats[doctorName].sessionsWithTreatments += 1
    } else {
      doctorStats[doctorName].sessionsWithoutTreatments += 1
    }
    
    grandTotalFees += finalFee
  })
  
  const doctors = Object.values(doctorStats)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 10px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 11px;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 11px;">Shift</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 11px;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 11px;">Fee Final</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-size: 11px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 5px; font-size: 10px;">${item.doctor}</td>
            <td style="border: 1px solid #e5e7eb; padding: 5px; font-size: 10px;">${item.shift}</td>
            <td style="border: 1px solid #e5e7eb; padding: 5px; font-size: 10px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 5px; font-weight: bold; color: #16a34a; font-size: 10px;">${formatCurrency(item.finalFee)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 5px; font-size: 9px;">
              <span style="background-color: ${item.hasTreatments ? '#dcfce7' : '#fef3c7'}; color: ${item.hasTreatments ? '#15803d' : '#b45309'}; padding: 1px 4px; border-radius: 2px;">
                ${item.hasTreatments ? 'Ada Tindakan' : 'Duduk Saja'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Compact Summary -->
    <div style="margin: 10px 0; padding: 8px; border: 1px solid #7c3aed; border-radius: 4px; background: #faf5ff;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 8px;">
        ${doctors.map(doctor => `
          <div style="background: white; padding: 6px; border-radius: 4px; border-left: 2px solid #7c3aed; font-size: 9px;">
            <div style="font-weight: bold; color: #7c3aed; margin-bottom: 2px;">${doctor.name}</div>
            <div style="color: #6b7280;">
              Total: <span style="font-weight: bold; color: #7c3aed;">${formatCurrency(doctor.totalFinalFee)}</span>
            </div>
            <div style="color: #6b7280; font-size: 8px;">
              ${doctor.treatmentCount} sesi (${doctor.sessionsWithTreatments} tindakan, ${doctor.sessionsWithoutTreatments} duduk)
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Grand Total Compact -->
      <div style="text-align: center; padding: 6px; background: rgba(124, 58, 237, 0.1); border-radius: 4px; border: 1px dashed #7c3aed;">
        <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">💰 TOTAL FEE SEMUA DOKTER</div>
        <div style="font-size: 16px; font-weight: bold; color: #7c3aed;">${formatCurrency(grandTotalFees)}</div>
        <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">
          ${data.length} sesi • ${doctors.length} dokter
        </div>
      </div>
    </div>
    
    ${generateDoctorSignatureSection(data, filters)}
  `
}

const generateTreatmentsTable = (data: TreatmentReport[]): string => {
  const totalAmount = data.reduce((sum, item) => sum + (item.nominal || item.amount || 0), 0)
  const totalFees = data.reduce((sum, item) => sum + (item.calculatedFee || item.fee || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Pasien</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tindakan</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Nominal</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Fee</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.patientName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.treatmentName || item.treatmentType}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.doctorName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #16a34a;">${formatCurrency(item.nominal || item.amount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #2563eb;">${formatCurrency(item.calculatedFee || item.fee || 0)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; text-align: center; font-size: 9px;">
            TOTAL (${data.length} Tindakan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalAmount)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #2563eb; font-size: 9px;">
            ${formatCurrency(totalFees)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'treatments')}
  `
}

const generateSalesTable = (data: SalesReport[]): string => {
  const totalAmount = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Produk</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Kategori</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Qty</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Harga</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Total</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tanggal</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.productName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${getCategoryLabel(item.category)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.quantity}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.price)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #16a34a;">${formatCurrency(item.totalAmount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; text-align: center; font-size: 9px;">
            TOTAL (${data.length} Item)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalAmount)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 8px;"></td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'sales')}
  `
}

const generateFieldTripSalesTable = (data: FieldTripSaleReport[]): string => {
  const totalAmount = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Lokasi</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Produk</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Qty</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Harga</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Total</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tanggal</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.location}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.productName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.quantity}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.price)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #16a34a;">${formatCurrency(item.totalAmount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; text-align: center; font-size: 9px;">
            TOTAL (${data.length} Item)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalAmount)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 8px;"></td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'field-trip-sales')}
  `
}

const generateExpensesTable = (data: ExpenseReport[]): string => {
  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Kategori</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Deskripsi</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${getCategoryLabel(item.category)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.description}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #dc2626;">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #dc2626; text-align: center; font-size: 9px;">
            TOTAL (${data.length} Pengeluaran)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #dc2626; font-size: 9px;">
            ${formatCurrency(totalAmount)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'expenses')}
  `
}

const generateFieldTripBonusTable = (data: any[], filters?: any): string => {
  console.log('Generating field trip bonus table with data:', data)
  console.log('Filters:', filters)
  
  // Calculate statistics
  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0)
  const doctorCount = data.filter(item => item.type === 'doctor').length
  const employeeCount = data.filter(item => item.type === 'employee').length
  const totalDoctorFees = data.filter(item => item.type === 'doctor').reduce((sum, item) => sum + item.amount, 0)
  const totalEmployeeBonuses = data.filter(item => item.type === 'employee').reduce((sum, item) => sum + item.amount, 0)

  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px; text-align: center;">No</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Nama</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Jenis</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Posisi/Spesialisasi</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px; text-align: center;">Jumlah Field Trip</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Total Amount</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Rata-rata</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; font-weight: bold; color: #9d174d;">${item.name}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">
              <span style="background-color: ${item.type === 'doctor' ? '#fef3c7' : '#dcfce7'}; color: ${item.type === 'doctor' ? '#b45309' : '#15803d'}; padding: 1px 4px; border-radius: 2px; font-size: 7px;">
                ${item.type === 'doctor' ? 'Fee Dokter' : 'Bonus Karyawan'}
              </span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.role}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; text-align: center;">${item.fieldTripCount}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; font-weight: bold; color: ${item.type === 'doctor' ? '#b45309' : '#15803d'};">${formatCurrency(item.amount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.averageAmount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Summary Section -->
    <div style="margin: 10px 0; padding: 8px; border: 1px solid #f59e0b; border-radius: 4px; background: #fffbeb;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 8px;">
        <div style="background: #fef3c7; padding: 6px; border-radius: 4px; border-left: 3px solid #f59e0b; font-size: 9px; text-align: center;">
          <div style="font-weight: bold; color: #b45309; margin-bottom: 2px;">Total Fee Dokter</div>
          <div style="font-size: 12px; font-weight: bold; color: #b45309;">${formatCurrency(totalDoctorFees)}</div>
          <div style="color: #6b7280; font-size: 8px; margin-top: 1px;">${doctorCount} dokter</div>
        </div>
        
        <div style="background: #dcfce7; padding: 6px; border-radius: 4px; border-left: 3px solid #22c55e; font-size: 9px; text-align: center;">
          <div style="font-weight: bold; color: #15803d; margin-bottom: 2px;">Total Bonus Karyawan</div>
          <div style="font-size: 12px; font-weight: bold; color: #15803d;">${formatCurrency(totalEmployeeBonuses)}</div>
          <div style="color: #6b7280; font-size: 8px; margin-top: 1px;">${employeeCount} karyawan</div>
        </div>
        
        <div style="background: #fdf2f8; padding: 6px; border-radius: 4px; border-left: 3px solid #ec4899; font-size: 9px; text-align: center;">
          <div style="font-weight: bold; color: #be185d; margin-bottom: 2px;">Total Keseluruhan</div>
          <div style="font-size: 12px; font-weight: bold; color: #be185d;">${formatCurrency(totalAmount)}</div>
          <div style="color: #6b7280; font-size: 8px; margin-top: 1px;">${data.length} orang</div>
        </div>
      </div>
    </div>
    
    ${generateFieldTripSignatureSection(data, filters)}
  `
}

const generateFieldTripEmployeeBonusesTable = (data: any[]): string => {
  const totalBonus = data.reduce((sum, item) => sum + (item.bonus || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Karyawan</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Posisi</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Field Trip</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Total Bonus</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Rata-rata</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.position}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; text-align: center;">${item.fieldTripCount}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #16a34a;">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${formatCurrency(item.averageBonus)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; text-align: center; font-size: 9px;">
            TOTAL (${data.length} Karyawan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalBonus)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 8px;"></td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'field-trip-employee-bonuses')}
  `
}

const generateFinancialTable = (data: FinancialSummary[]): string => {
  const totalIncome = data.reduce((sum, item) => sum + ((item as any).totalIncome || 0), 0)
  const totalExpense = data.reduce((sum, item) => sum + ((item as any).totalExpense || 0), 0)
  const netProfit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Periode</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Pendapatan</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Pengeluaran</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Laba</th>
          <th style="border: 1px solid #e5e7eb; padding: 4px; font-size: 9px;">Margin %</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px;">${item.period || `${item.month}/${item.year}`}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #16a34a;">${formatCurrency((item as any).totalIncome || 0)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; color: #dc2626;">${formatCurrency((item as any).totalExpense || 0)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; font-weight: bold; color: ${(item.profit || 0) >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(item.profit || 0)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 3px; font-size: 8px; text-align: center;">${(item.margin || 0).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9;">
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #6366f1; text-align: center; font-size: 9px;">
            TOTAL
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #16a34a; font-size: 9px;">
            ${formatCurrency(totalIncome)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #dc2626; font-size: 9px;">
            ${formatCurrency(totalExpense)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: ${netProfit >= 0 ? '#16a34a' : '#dc2626'}; font-size: 9px;">
            ${formatCurrency(netProfit)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold; color: #6366f1; font-size: 9px; text-align: center;">
            ${profitMargin.toFixed(1)}%
          </td>
        </tr>
      </tfoot>
    </table>
    
    ${generateSignatureSection(data, 'financial')}
  `
}

const generatePrintHTML = (title: string, tableContent: string, recordCount: number): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            @page { 
                size: A4; 
                margin: 10mm 15mm 15mm 15mm;
            }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 10px; 
                line-height: 1.3;
                margin: 0; 
                padding: 0;
                color: #1f2937;
            }
            .header { 
                text-align: center; 
                margin-bottom: 15px; 
                border-bottom: 2px solid #ec4899;
                padding-bottom: 8px;
            }
            .clinic-name { 
                font-size: 18px; 
                font-weight: bold; 
                color: #be185d; 
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .clinic-address { 
                font-size: 10px; 
                color: #6b7280; 
                margin: 2px 0;
            }
            .report-title { 
                font-size: 14px; 
                font-weight: bold; 
                color: #1f2937; 
                margin: 8px 0 4px 0;
                text-transform: uppercase;
            }
            .print-date { 
                font-size: 9px; 
                color: #6b7280; 
                margin-bottom: 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="clinic-name">🦷 Falasifah Dental Clinic</h1>
            <p class="clinic-address">Jl. Contoh No. 123, Jakarta • Telp: (021) 123-4567 • Email: info@falasifah-dental.com</p>
            <h2 class="report-title">${title}</h2>
            <p class="print-date">${currentDate} • Total Data: ${recordCount}</p>
        </div>
        
        <div class="content">
            ${tableContent}
        </div>
    </body>
    </html>
  `
}

const generateSignatureSection = (data: any[], type: string): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `
    <!-- Signature Section -->
    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Mengetahui,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">drg. Falasifah</div>
        <div style="font-size: 8px; color: #6b7280;">Owner/Co-owner</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Operator Input,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">Ade Mardiansyah Eka Putra</div>
        <div style="font-size: 8px; color: #6b7280;">Administrator</div>
      </div>
    </div>
    
    <!-- Footer with generation info -->
    <div style="margin-top: 15px; text-align: center; font-size: 7px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
      Laporan otomatis - Sistem Absensi Falasifah Dental Clinic - ${currentDate}
    </div>
  `
}

const generateFieldTripSignatureSection = (data: any[], filters?: any): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Generate signature based on filtered data
  const doctors = data.filter(item => item.type === 'doctor')
  const employees = data.filter(item => item.type === 'employee')
  
  // If filter is applied for specific person, show only that person in signature
  let leftSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
  let rightSignature = { name: 'Ade Mardiansyah Eka Putra', role: 'Administrator' }
  
  if (filters?.searchName && filters.searchName !== 'all') {
    // Find the specific person in the filtered data
    const filteredPerson = data.find(item => item.name === filters.searchName)
    if (filteredPerson) {
      if (filteredPerson.type === 'doctor') {
        leftSignature = { name: filteredPerson.name, role: filteredPerson.role }
        rightSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
      } else {
        leftSignature = { name: filteredPerson.name, role: filteredPerson.role }
        rightSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
      }
    }
  } else if (filters?.type && filters.type !== 'all') {
    // If filtering by type, show representative from that type
    if (filters.type === 'doctor' && doctors.length > 0) {
      leftSignature = { name: doctors[0].name, role: doctors[0].role }
      rightSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
    } else if (filters.type === 'employee' && employees.length > 0) {
      leftSignature = { name: employees[0].name, role: employees[0].role }
      rightSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
    }
  }

  return `
    <!-- Signature Section -->
    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Fee Diterimakan,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">${leftSignature.name}</div>
        <div style="font-size: 8px; color: #6b7280;">${leftSignature.role}</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Dibuat Oleh,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">${rightSignature.name}</div>
        <div style="font-size: 8px; color: #6b7280;">${rightSignature.role}</div>
      </div>
    </div>
    
    <!-- Footer with generation info -->
    <div style="margin-top: 15px; text-align: center; font-size: 7px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
      Laporan Fee & Bonus Field Trip - Falasifah Dental Clinic - ${currentDate}
      ${filters && (filters.searchName !== 'all' || filters.type !== 'all') ? ` (Filtered: ${filters.searchName !== 'all' ? filters.searchName : filters.type})` : ''}
    </div>
  `
}

const generateDoctorSignatureSection = (data: any[], filters?: { doctorName?: string, groupByDoctor?: boolean }): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Generate signature based on doctor filter
  let leftSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
  let rightSignature = { name: 'Ade Mardiansyah Eka Putra', role: 'Administrator' }
  
  if (filters?.doctorName && filters.doctorName !== 'all') {
    // If specific doctor is filtered, show that doctor in signature
    leftSignature = { name: filters.doctorName, role: 'Dokter' }
    rightSignature = { name: 'drg. Falasifah', role: 'Owner/Co-owner' }
  }

  return `
    <!-- Signature Section -->
    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Fee Diterima,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">${leftSignature.name}</div>
        <div style="font-size: 8px; color: #6b7280;">${leftSignature.role}</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 9px; margin-bottom: 50px;">Dibuat Oleh,</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 9px; font-weight: bold;">${rightSignature.name}</div>
        <div style="font-size: 8px; color: #6b7280;">${rightSignature.role}</div>
      </div>
    </div>
    
    <!-- Footer with generation info -->
    <div style="margin-top: 15px; text-align: center; font-size: 7px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
      Laporan Fee Dokter - Falasifah Dental Clinic - ${currentDate}
      ${filters && filters.doctorName !== 'all' ? ` (Filter: ${filters.doctorName})` : ''}
    </div>
  `
}