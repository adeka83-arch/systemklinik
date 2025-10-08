import { toast } from 'sonner@2.0.3'
import { formatCurrency, getCategoryLabel } from './helpers'
import { months } from './constants'
import { generateSalaryTableA5, generateA5PrintHTML, generateSalarySignatureSectionA5 } from './printServiceExtensions'
import { 
  generatePrintHTML, 
  generateDoctorSignatureSection, 
  generateFieldTripDoctorFeesTable,
  generateFieldTripEmployeeBonusesTable,
  generateSalesTable,
  generateFieldTripSalesTable,
  generateExpensesTable,
  generateFinancialTable
} from './printFunctions'
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
      title = 'Laporan Absensi Dokter'
      data = filteredAttendanceData
      tableContent = generateAttendanceTable(data)
    } else if (type === 'salary') {
      title = 'Laporan Gaji Karyawan'
      data = filteredSalaryData
      console.log('🚨 SALARY PRINT DIPANGGIL - AKAN MENGGUNAKAN generateSalaryTableA5')
      console.log('🚨 File: printService.ts - baris 54')
      // Use the A5 optimized version that has correct employee terminology
      tableContent = generateSalaryTableA5(data)
      console.log('🚨 generateSalaryTableA5 BERHASIL DIPANGGIL')
      console.log('🚨 tableContent length:', tableContent.length)
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
      // Generate hardcoded data for field trip doctor fees
      data = [
        { doctorName: 'drg. Falasifah', specialization: 'GP', fee: 400000, fieldTripCount: 2, averageFee: 200000 },
        { doctorName: 'drg. Eka Puspitasari', specialization: 'GP', fee: 200000, fieldTripCount: 1, averageFee: 200000 }
      ]
      tableContent = generateFieldTripDoctorFeesTable(data)
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
        onConfirmPrint: () => printUsingIframe(title, tableContent, data.length, type)
      })
    } else {
      // Direct print without preview
      printUsingIframe(title, tableContent, data.length, type)
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

const printUsingIframe = (title: string, tableContent: string, recordCount: number, reportType?: string) => {
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
    
    // Generate print content - use A5 optimized for salary reports
    console.log('🔥 PRINT USING IFRAME - reportType:', reportType)
    if (reportType === 'salary') {
      console.log('🔥 MENGGUNAKAN generateA5PrintHTML untuk salary')
    } else {
      console.log('🔥 MENGGUNAKAN generatePrintHTML untuk', reportType)
    }
    const printContent = reportType === 'salary' ? generateA5PrintHTML(title, tableContent, recordCount) : generatePrintHTML(title, tableContent, recordCount)
    console.log('🔥 PRINT CONTENT GENERATED, length:', printContent.length)
    
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
        fallbackPrint(title, tableContent, recordCount, reportType)
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
        fallbackPrint(title, tableContent, recordCount, reportType)
      }
    }, 500)
    
  } catch (error) {
    console.error('Iframe print error:', error)
    // Fallback to window.open method
    fallbackPrint(title, tableContent, recordCount, reportType)
  }
}

const fallbackPrint = (title: string, tableContent: string, recordCount: number, reportType?: string) => {
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      // If pop-up is blocked, try to create a blob URL and download
      downloadAsPDF(title, tableContent, recordCount, reportType)
      return
    }

    const printContent = reportType === 'salary' ? generateA5PrintHTML(title, tableContent, recordCount) : generatePrintHTML(title, tableContent, recordCount)
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
    downloadAsPDF(title, tableContent, recordCount, reportType)
  }
}

const downloadAsPDF = (title: string, tableContent: string, recordCount: number, reportType?: string) => {
  try {
    const printContent = reportType === 'salary' ? generateA5PrintHTML(title, tableContent, recordCount) : generatePrintHTML(title, tableContent, recordCount)
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
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Shift</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jenis</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Waktu</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.doctorName || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.shift || ''}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.type === 'check-in' ? 'Masuk' : 'Pulang'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.time || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Attendance Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #4f46e5; border-radius: 8px; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);">
      <h3 style="margin: 0 0 12px 0; color: #4f46e5; font-size: 16px; text-align: center; border-bottom: 1px solid #4f46e5; padding-bottom: 8px;">
        📋 RINGKASAN ABSENSI
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #4f46e5;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Record</div>
          <div style="font-size: 18px; font-weight: bold; color: #4f46e5;">${data.length} Record</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Dokter</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${doctors.size} Dokter</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Absen Masuk</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${checkIns} Kali</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ea580c;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Absen Pulang</div>
          <div style="font-size: 18px; font-weight: bold; color: #ea580c;">${checkOuts} Kali</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(79, 70, 229, 0.1); border-radius: 6px; border: 1px dashed #4f46e5;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">⏰ DATA ABSENSI</div>
          <div style="font-size: 20px; font-weight: bold; color: #4f46e5;">${data.length} Total Record</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Melibatkan ${doctors.size} dokter dengan ${shifts.size} jenis shift
          </div>
        </div>
      </div>
    </div>
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
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Karyawan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Periode</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Gaji Pokok</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Bonus</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tunjangan Raya</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total Gaji</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${months.find(m => m.value === item.month)?.label} ${item.year}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.baseSalary)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.holidayAllowance)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold;">${formatCurrency(item.totalSalary)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #9d174d;">
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #9d174d; text-align: center;">
            TOTAL (${employeeCount} Karyawan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #9d174d; background-color: #fce7f3;">
            ${formatCurrency(totalBaseSalary)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7;">
            ${formatCurrency(totalBonus)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe;">
            ${formatCurrency(totalHolidayAllowance)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; font-size: 14px; color: #dc2626; background-color: #fee2e2;">
            ${formatCurrency(totalSalary)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #9d174d; border-radius: 8px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);">
      <h3 style="margin: 0 0 12px 0; color: #9d174d; font-size: 16px; text-align: center; border-bottom: 1px solid #9d174d; padding-bottom: 8px;">
        📊 RINGKASAN PENGGAJIAN
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #9d174d;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Karyawan</div>
          <div style="font-size: 18px; font-weight: bold; color: #9d174d;">${employeeCount} Orang</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Pengeluaran Gaji</div>
          <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalary)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Bonus</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalBonus)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Tunjangan Raya</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${formatCurrency(totalHolidayAllowance)}</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 6px; border: 1px dashed #dc2626;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL YANG HARUS DIBAYAR</div>
          <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalary)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Rata-rata per karyawan: ${formatCurrency(employeeCount > 0 ? totalSalary / employeeCount : 0)}
          </div>
        </div>
      </div>
    </div>
  `
}

const generateDoctorFeesTable = (data: DoctorFeeReport[], filters?: { doctorName?: string, groupByDoctor?: boolean }): string => {
  // Calculate doctor fee statistics grouped by doctor using correct formula
  const doctorStats = {}
  let grandTotalFees = 0
  
  data.forEach((item, index) => {
    const doctorName = item.doctor || item.doctorName || 'Unknown'
    const treatmentFee = item.treatmentFee || 0
    const sittingFee = item.sittingFee || 0
    
    // Apply correct formula: Total Fee = Math.max(treatmentFee, sittingFee)
    const finalFee = Math.max(treatmentFee, sittingFee)
    
    if (!doctorStats[doctorName]) {
      doctorStats[doctorName] = {
        name: doctorName,
        totalTreatmentFee: 0,
        totalSittingFee: 0,
        totalFinalFee: 0,
        treatmentCount: 0,
        sessionsWithTreatments: 0,
        sessionsWithoutTreatments: 0
      }
    }
    
    doctorStats[doctorName].totalTreatmentFee += treatmentFee
    doctorStats[doctorName].totalSittingFee += sittingFee
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
    <!-- Formula Info Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #3b82f6; border-radius: 8px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
      <h3 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 16px; text-align: center; border-bottom: 1px solid #3b82f6; padding-bottom: 8px;">
        📋 RUMUS PERHITUNGAN FEE DOKTER
      </h3>
      <div style="text-align: center; font-size: 14px; color: #1e40af;">
        <strong>Jika Fee Tindakan &lt; Uang Duduk → Total Fee = Uang Duduk</strong><br>
        <strong>Jika Fee Tindakan ≥ Uang Duduk → Total Fee = Fee Tindakan</strong>
      </div>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">
        Contoh: Fee Tindakan Rp 32.000, Uang Duduk Rp 100.000 → Total Fee = Rp 100.000
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; width: 5%;">No</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fee Tindakan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Uang Duduk</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total Fee</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => {
          const treatmentFee = item.treatmentFee || 0
          const sittingFee = item.sittingFee || 0
          const totalFee = Math.max(treatmentFee, sittingFee) // Apply correct formula
          
          return `
            <tr>
              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.doctor || item.doctorName}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #16a34a;">${formatCurrency(treatmentFee)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #2563eb;">${formatCurrency(sittingFee)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #dc2626; background-color: #fef2f2;">${formatCurrency(totalFee)}</td>
            </tr>
          `
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #9d174d;">
          <td colspan="5" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #9d174d; text-align: center;">
            TOTAL FEE SEMUA DOKTER (${data.length} Sesi)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; font-size: 14px; color: #dc2626; background-color: #fee2e2;">
            ${formatCurrency(grandTotalFees)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Doctor Fees Summary -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #7c3aed; border-radius: 8px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);">
      <h3 style="margin: 0 0 12px 0; color: #7c3aed; font-size: 16px; text-align: center; border-bottom: 1px solid #7c3aed; padding-bottom: 8px;">
        👩‍⚕️ RINGKASAN FEE DOKTER PER INDIVIDU
      </h3>
      
      <!-- Per Doctor Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${doctors.map(doctor => `
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #7c3aed; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 8px;">${doctor.name}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <div>
                <span style="color: #6b7280;">Fee Tindakan:</span><br>
                <span style="font-weight: bold; color: #16a34a;">${formatCurrency(doctor.totalTreatmentFee)}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Uang Duduk:</span><br>
                <span style="font-weight: bold; color: #2563eb;">${formatCurrency(doctor.totalSittingFee)}</span>
              </div>
              <div style="grid-column: 1 / -1; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px;">
                <span style="color: #6b7280;">Total Fee:</span><br>
                <span style="font-weight: bold; font-size: 13px; color: #7c3aed;">${formatCurrency(doctor.totalFinalFee)}</span>
              </div>
              <div style="grid-column: 1 / -1; font-size: 10px; color: #6b7280;">
                Sesi: ${doctor.treatmentCount} | Dengan tindakan: ${doctor.sessionsWithTreatments} | Duduk saja: ${doctor.sessionsWithoutTreatments}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Grand Total -->
      <div style="padding: 16px; background: rgba(124, 58, 237, 0.1); border-radius: 8px; border: 2px dashed #7c3aed;">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL FEE SEMUA DOKTER</div>
          <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${formatCurrency(grandTotalFees)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Dari ${data.length} sesi pelayanan | Melibatkan ${doctors.length} dokter
          </div>
        </div>
      </div>
    </div>
    
    ${generateDoctorSignatureSection(data, filters)}
  `
}

const generateTreatmentsTable = (data: TreatmentReport[]): string => {
  // Calculate treatment statistics
  let totalAmount = 0
  let totalFees = 0
  const patients = new Set()
  const doctors = new Set()
  const treatments = new Set()
  
  data.forEach(item => {
    totalAmount += item.nominal || item.amount || 0
    totalFees += item.calculatedFee || item.fee || 0
    patients.add(item.patientName)
    doctors.add(item.doctorName)
    treatments.add(item.treatmentName || item.treatmentType)
  })
  
  const averageAmount = data.length > 0 ? totalAmount / data.length : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Pasien</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tindakan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Nominal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fee Dokter</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.patientName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.treatmentName || item.treatmentType}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.doctorName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.nominal || item.amount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; color: #2563eb;">${formatCurrency(item.calculatedFee || item.fee || 0)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #16a34a;">
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; text-align: center;">
            TOTAL (${data.length} Tindakan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 14px;">
            ${formatCurrency(totalAmount)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe; font-size: 14px;">
            ${formatCurrency(totalFees)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Treatment Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #16a34a; border-radius: 8px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <h3 style="margin: 0 0 12px 0; color: #16a34a; font-size: 16px; text-align: center; border-bottom: 1px solid #16a34a; padding-bottom: 8px;">
        🏥 RINGKASAN TINDAKAN MEDIS
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Tindakan</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${data.length} Tindakan</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Pendapatan</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${formatCurrency(totalAmount)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Fee Dokter</div>
          <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${formatCurrency(totalFees)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ec4899;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Pasien</div>
          <div style="font-size: 18px; font-weight: bold; color: #ec4899;">${patients.size} Pasien</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(22, 163, 74, 0.1); border-radius: 6px; border: 1px dashed #16a34a;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL PENDAPATAN TINDAKAN</div>
          <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${formatCurrency(totalAmount)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Melibatkan ${doctors.size} dokter | ${treatments.size} jenis tindakan | Rata-rata: ${formatCurrency(averageAmount)}
          </div>
        </div>
      </div>
    </div>
  `
}

const generateSalesTable = (data: SalesReport[]): string => {
  // Calculate sales statistics
  let totalSales = 0
  let totalQuantity = 0
  const products = new Set()
  const categories = new Set()
  
  data.forEach(item => {
    totalSales += item.totalAmount || 0
    totalQuantity += item.quantity || 0
    products.add(item.productName)
    categories.add(item.category)
  })
  
  const averageSale = data.length > 0 ? totalSales / data.length : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Produk</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Kategori</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Harga</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.productName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${getCategoryLabel(item.category)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.price)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.totalAmount)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #16a34a;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; text-align: center;">
            TOTAL (${data.length} Transaksi)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe; text-align: center;">
            ${totalQuantity}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #6b7280;">-</td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 14px;">
            ${formatCurrency(totalSales)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Sales Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #2563eb; border-radius: 8px; background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);">
      <h3 style="margin: 0 0 12px 0; color: #2563eb; font-size: 16px; text-align: center; border-bottom: 1px solid #2563eb; padding-bottom: 8px;">
        🛒 RINGKASAN PENJUALAN
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Transaksi</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${data.length} Transaksi</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Penjualan</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Produk</div>
          <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${products.size} Produk</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ec4899;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Kategori</div>
          <div style="font-size: 18px; font-weight: bold; color: #ec4899;">${categories.size} Kategori</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(37, 99, 235, 0.1); border-radius: 6px; border: 1px dashed #2563eb;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL PENDAPATAN PENJUALAN</div>
          <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Rata-rata per transaksi: ${formatCurrency(averageSale)} | Total item: ${totalQuantity}
          </div>
        </div>
      </div>
    </div>
  `
}

const generateFieldTripSalesTable = (data: FieldTripSaleReport[]): string => {
  // Calculate field trip sales statistics
  let totalSales = 0
  let totalQuantity = 0
  let totalDiscount = 0
  const products = new Set()
  const locations = new Set()
  
  data.forEach(item => {
    totalSales += item.totalAmount || 0
    totalQuantity += item.quantity || 0
    totalDiscount += item.discountAmount || 0
    products.add(item.productName)
    locations.add(item.location)
  })
  
  const grossSales = totalSales + totalDiscount
  const averageSale = data.length > 0 ? totalSales / data.length : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Produk</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Lokasi</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Harga</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Subtotal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Diskon</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.productName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">
              <span style="padding: 2px 6px; border-radius: 3px; background-color: #dbeafe; color: #1d4ed8; font-size: 11px;">
                ${item.location}
              </span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.price)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.subtotal)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; color: #dc2626;">${formatCurrency(item.discountAmount || 0)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.totalAmount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 11px; color: #6b7280;">${item.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #06b6d4;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #06b6d4; text-align: center;">
            TOTAL (${data.length} Transaksi)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe; text-align: center;">
            ${totalQuantity}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #6b7280;">-</td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7;">
            ${formatCurrency(grossSales)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #dc2626; background-color: #fee2e2;">
            ${formatCurrency(totalDiscount)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #06b6d4; background-color: #ecfeff; font-size: 14px;">
            ${formatCurrency(totalSales)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #6b7280;">-</td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Field Trip Sales Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #06b6d4; border-radius: 8px; background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);">
      <h3 style="margin: 0 0 12px 0; color: #06b6d4; font-size: 16px; text-align: center; border-bottom: 1px solid #06b6d4; padding-bottom: 8px;">
        🏕️ RINGKASAN PENJUALAN FIELD TRIP
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #06b6d4;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Transaksi</div>
          <div style="font-size: 18px; font-weight: bold; color: #06b6d4;">${data.length} Transaksi</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Pendapatan</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Produk</div>
          <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${products.size} Produk</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ec4899;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Lokasi Field Trip</div>
          <div style="font-size: 18px; font-weight: bold; color: #ec4899;">${locations.size} Lokasi</div>
        </div>
      </div>
      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 6px; border: 1px dashed #dc2626;">
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💸 TOTAL DISKON</div>
            <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrency(totalDiscount)}</div>
          </div>
        </div>
        <div style="padding: 12px; background: rgba(6, 182, 212, 0.1); border-radius: 6px; border: 1px dashed #06b6d4;">
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 PENDAPATAN BERSIH</div>
            <div style="font-size: 20px; font-weight: bold; color: #06b6d4;">${formatCurrency(totalSales)}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(6, 182, 212, 0.1); border-radius: 6px; border: 1px dashed #06b6d4;">
        <div style="text-align: center;">
          <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px; font-style: italic;">
            Rata-rata per transaksi: ${formatCurrency(averageSale)} | Total item: ${totalQuantity} | Gross: ${formatCurrency(grossSales)}
          </div>
        </div>
      </div>
    </div>
  `
}

const generateExpensesTable = (data: ExpenseReport[]): string => {
  // Calculate expense statistics
  let totalExpenses = 0
  const categories = new Set()
  const categoryTotals = {}
  
  data.forEach(item => {
    totalExpenses += item.amount || 0
    categories.add(item.category)
    
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = 0
    }
    categoryTotals[item.category] += item.amount || 0
  })
  
  const averageExpense = data.length > 0 ? totalExpenses / data.length : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Kategori</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Deskripsi</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">
              <span style="padding: 2px 6px; border-radius: 3px; background-color: #fef3c7; color: #b45309; font-size: 11px;">
                ${getCategoryLabel(item.category)}
              </span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.description}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #dc2626;">${formatCurrency(item.amount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 11px; color: #6b7280;">${item.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #dc2626;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #dc2626; text-align: center;">
            TOTAL (${data.length} Pengeluaran)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #dc2626; background-color: #fee2e2; font-size: 14px;">
            ${formatCurrency(totalExpenses)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #6b7280;">-</td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Expenses Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #dc2626; border-radius: 8px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);">
      <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px; text-align: center; border-bottom: 1px solid #dc2626; padding-bottom: 8px;">
        💸 RINGKASAN PENGELUARAN
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Pengeluaran</div>
          <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(totalExpenses)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ea580c;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Transaksi</div>
          <div style="font-size: 18px; font-weight: bold; color: #ea580c;">${data.length} Transaksi</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Kategori</div>
          <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">${categories.size} Kategori</div>
        </div>
      </div>
      
      <!-- Category Breakdown -->
      <div style="margin-top: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 14px;">Breakdown per Kategori:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
          ${Object.entries(categoryTotals).map(([category, total]) => `
            <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #dc2626;">
              <div style="font-size: 11px; color: #6b7280;">${getCategoryLabel(category)}</div>
              <div style="font-size: 14px; font-weight: bold; color: #dc2626;">${formatCurrency(total)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 6px; border: 1px dashed #dc2626;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL PENGELUARAN</div>
          <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${formatCurrency(totalExpenses)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Rata-rata per transaksi: ${formatCurrency(averageExpense)}
          </div>
        </div>
      </div>
    </div>
  `
}

const generateFinancialTable = (data: FinancialSummary[]): string => {
  // Calculate financial totals
  let totalTreatmentIncome = 0
  let totalSalesIncome = 0
  let totalFieldTripIncome = 0
  let totalSalaryExpense = 0
  let totalDoctorFeeExpense = 0
  let totalFieldTripExpense = 0
  let totalExpenses = 0
  let totalNetProfit = 0
  
  data.forEach(item => {
    totalTreatmentIncome += item.treatmentIncome || 0
    totalSalesIncome += item.salesIncome || 0
    totalFieldTripIncome += item.fieldTripIncome || 0
    totalSalaryExpense += item.salaryExpense || 0
    totalDoctorFeeExpense += item.doctorFeeExpense || 0
    totalFieldTripExpense += (item as any).fieldTripExpense || 0
    totalExpenses += item.expenses || 0
    totalNetProfit += item.netProfit || 0
  })
  
  const totalIncome = totalTreatmentIncome + totalSalesIncome + totalFieldTripIncome
  const totalExpensesAll = totalSalaryExpense + totalDoctorFeeExpense + totalFieldTripExpense + totalExpenses
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Periode</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Pendapatan Tindakan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Pendapatan Penjualan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Pendapatan Field Trip</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total Pendapatan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Gaji Karyawan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fee Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Pengeluaran Field Trip</th>
           <th style=\"border: 1px solid #e5e7eb; padding: 8px; text-align: left;\">Pengeluaran Lain</th>
           <th style=\"border: 1px solid #e5e7eb; padding: 8px; text-align: left;\">Total Pengeluaran</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Laba Bersih</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => {
          const totalIncomeItem = (item.treatmentIncome || 0) + (item.salesIncome || 0) + (item.fieldTripIncome || 0)
          return `
            <tr>
              <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #9d174d;">
                ${months.find(m => m.value === item.month)?.label} ${item.year}
              </td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #16a34a;">${formatCurrency(item.treatmentIncome || 0)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #2563eb;">${formatCurrency(item.salesIncome || 0)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #06b6d4;">${formatCurrency(item.fieldTripIncome || 0)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a; background-color: #dcfce7;">
                ${formatCurrency(totalIncomeItem)}
              </td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #dc2626;">${formatCurrency(item.salaryExpense || 0)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #7c3aed;">${formatCurrency(item.doctorFeeExpense || 0)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; color: #ea580c;">${formatCurrency((item as any).fieldTripExpense || 0)}</td>
               <td style=\"border: 1px solid #e5e7eb; padding: 8px; color: #ea580c;\">${formatCurrency(item.expenses || 0)}</td>
               <td style=\"border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #dc2626; background-color: #fee2e2;\">${formatCurrency((item.salaryExpense || 0) + (item.doctorFeeExpense || 0) + ((item as any).fieldTripExpense || 0) + (item.expenses || 0))}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; ${(item.netProfit || 0) >= 0 ? 'color: #16a34a; background-color: #dcfce7;' : 'color: #dc2626; background-color: #fee2e2;'}">
                ${formatCurrency(item.netProfit || 0)}
              </td>
            </tr>
          `
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #9d174d;">
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #9d174d; text-align: center;">
            TOTAL (${data.length} Periode)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7;">
            ${formatCurrency(totalTreatmentIncome)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe;">
            ${formatCurrency(totalSalesIncome)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #06b6d4; background-color: #ecfeff;">
            ${formatCurrency(totalFieldTripIncome)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 14px;">
            ${formatCurrency(totalIncome)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #dc2626; background-color: #fee2e2;">
            ${formatCurrency(totalSalaryExpense)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #7c3aed; background-color: #f3e8ff;">
            ${formatCurrency(totalDoctorFeeExpense)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #ea580c; background-color: #fed7aa;">
            ${formatCurrency(totalExpenses)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; font-size: 14px; ${totalNetProfit >= 0 ? 'color: #16a34a; background-color: #dcfce7;' : 'color: #dc2626; background-color: #fee2e2;'}">
            ${formatCurrency(totalNetProfit)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Financial Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #16a34a; border-radius: 8px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <h3 style="margin: 0 0 12px 0; color: #16a34a; font-size: 16px; text-align: center; border-bottom: 1px solid #16a34a; padding-bottom: 8px;">
        📊 RINGKASAN KEUANGAN BULANAN
      </h3>
      
      <!-- Income Section -->
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #16a34a; font-size: 14px;">📈 PENDAPATAN</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Tindakan Medis</div>
            <div style="font-size: 16px; font-weight: bold; color: #16a34a;">${formatCurrency(totalTreatmentIncome)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Penjualan Produk</div>
            <div style="font-size: 16px; font-weight: bold; color: #2563eb;">${formatCurrency(totalSalesIncome)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #06b6d4;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Field Trip</div>
            <div style="font-size: 16px; font-weight: bold; color: #06b6d4;">${formatCurrency(totalFieldTripIncome)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a; border: 2px solid #16a34a;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">TOTAL PENDAPATAN</div>
            <div style="font-size: 16px; font-weight: bold; color: #16a34a;">${formatCurrency(totalIncome)}</div>
          </div>
        </div>
      </div>
      
      <!-- Expense Section -->
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 14px;">📉 PENGELUARAN</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Gaji Karyawan</div>
            <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(totalSalaryExpense)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Fee Dokter</div>
            <div style="font-size: 16px; font-weight: bold; color: #7c3aed;">${formatCurrency(totalDoctorFeeExpense)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ea580c;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Operasional</div>
            <div style="font-size: 16px; font-weight: bold; color: #ea580c;">${formatCurrency(totalExpenses)}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626; border: 2px solid #dc2626;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">TOTAL PENGELUARAN</div>
            <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(totalExpensesAll)}</div>
          </div>
        </div>
      </div>
      
      <!-- Net Profit Section -->
      <div style="padding: 16px; background: ${totalNetProfit >= 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'}; border-radius: 8px; border: 2px dashed ${totalNetProfit >= 0 ? '#16a34a' : '#dc2626'};">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
            💰 LABA BERSIH (Pendapatan Field Trip + Pendapatan Tindakan + Pendapatan Penjualan - Gaji Karyawan - Fee Dokter - Pengeluaran)
          </div>
          <div style="font-size: 32px; font-weight: bold; color: ${totalNetProfit >= 0 ? '#16a34a' : '#dc2626'}; margin-bottom: 8px;">
            ${formatCurrency(totalNetProfit)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <div style="background: rgba(22, 163, 74, 0.1); padding: 8px; border-radius: 4px;">
              <div style="font-size: 11px; color: #6b7280;">Total Pendapatan</div>
              <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalIncome)}</div>
            </div>
            <div style="background: rgba(220, 38, 38, 0.1); padding: 8px; border-radius: 4px;">
              <div style="font-size: 11px; color: #6b7280;">Total Pengeluaran</div>
              <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(totalExpensesAll)}</div>
            </div>
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 8px; font-style: italic;">
            Margin keuntungan: ${totalIncome > 0 ? ((totalNetProfit / totalIncome) * 100).toFixed(1) : '0'}% | Periode: ${data.length} bulan
          </div>
        </div>
      </div>
    </div>
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
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ec4899;
        }
        
        .header h1 {
          color: #9d174d;
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: bold;
        }
        
        .header .clinic-name {
          color: #ec4899;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .header .date-info {
          color: #6b7280;
          font-size: 11px;
          margin-top: 8px;
        }
        
        .content {
          margin: 20px 0;
        }
        
        .summary-info {
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #ec4899;
          margin-bottom: 25px;
          text-align: center;
        }
        
        .summary-info h3 {
          color: #9d174d;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        
        .summary-info p {
          color: #6b7280;
          margin: 4px 0;
          font-size: 11px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 20px 0;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        
        th {
          background-color: #fce7f3;
          color: #9d174d;
          font-weight: 600;
          font-size: 11px;
        }
        
        tbody tr:nth-child(even) {
          background-color: #fef7ff;
        }
        
        tfoot tr {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ec4899;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
        }
        
        .footer p {
          margin: 4px 0;
        }
        
        /* Summary boxes in content */
        .print-content div[style*="border: 2px solid"] {
          page-break-inside: avoid;
          margin-bottom: 20px;
        }
        
        /* Ensure tables don't break awkwardly */
        table {
          page-break-inside: auto;
        }
        
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        thead {
          display: table-header-group;
        }
        
        tfoot {
          display: table-footer-group;
        }
        
        /* Hide elements that shouldn't be printed */
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">🏥 Falasifah Dental Clinic</div>
        <h1>${title}</h1>
        <div class="date-info">
          Dicetak pada: ${currentDate} • Total Record: ${recordCount}
        </div>
      </div>
      
      <div class="summary-info">
        <h3>📋 Informasi Laporan</h3>
        <p><strong>Jumlah Data:</strong> ${recordCount} record</p>
        <p><strong>Tanggal Cetak:</strong> ${currentDate}</p>
        <p><strong>Jenis Laporan:</strong> ${title}</p>
      </div>
      
      <div class="content print-content">
        ${tableContent}
      </div>
      
      <div class="footer">
        <p><strong>Falasifah Dental Clinic</strong></p>
        <p>Sistem Manajemen Klinik Digital</p>
        <p>Dokumen ini dicetak secara otomatis pada ${currentDate}</p>
        <p style="margin-top: 12px; font-style: italic;">
          "Melayani dengan sepenuh hati untuk kesehatan gigi dan mulut yang optimal"
        </p>
      </div>
    </body>
    </html>
  `
}

// Function to generate doctor signature section for fee reports
const generateDoctorSignatureSection = (data: DoctorFeeReport[], filters?: { doctorName?: string, groupByDoctor?: boolean }): string => {
  // Get unique doctors from the data
  const uniqueDoctors = [...new Set(data.map(item => item.doctor || item.doctorName))].filter(Boolean)
  
  // If a specific doctor is selected via filter, only show that doctor's signature
  let doctorsToShow = uniqueDoctors
  if (filters?.doctorName && filters.doctorName !== 'all') {
    doctorsToShow = [filters.doctorName]
  }
  
  // If no doctors or more than 4 doctors, use a general signature section
  if (doctorsToShow.length === 0 || doctorsToShow.length > 4) {
    return `
      <!-- Signature Section -->
      <div style="margin: 40px 0 20px 0; padding: 20px; border: 2px solid #ec4899; border-radius: 8px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); page-break-inside: avoid;">
        <h3 style="margin: 0 0 20px 0; color: #9d174d; font-size: 16px; text-align: center; border-bottom: 1px solid #ec4899; padding-bottom: 8px;">
          ✍️ PERSETUJUAN DAN TANDA TANGAN
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px;">
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #9d174d; margin-bottom: 60px; padding-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">Mengetahui,</span>
            </div>
            <div style="margin-bottom: 8px; height: 60px; border-bottom: 1px solid #9d174d;"></div>
            <div style="font-weight: bold; color: #9d174d; margin-top: 8px;">Pimpinan Klinik</div>
            <div style="color: #6b7280; font-size: 11px;">Falasifah Dental Clinic</div>
          </div>
          
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #9d174d; margin-bottom: 60px; padding-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">Dokter Penanggung Jawab,</span>
            </div>
            <div style="margin-bottom: 8px; height: 60px; border-bottom: 1px solid #9d174d;"></div>
            <div style="font-weight: bold; color: #9d174d; margin-top: 8px;">
              ${doctorsToShow.length === 1 ? doctorsToShow[0] : 'Dokter Bertugas'}
            </div>
            <div style="color: #6b7280; font-size: 11px;">Falasifah Dental Clinic</div>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding: 12px; background: rgba(157, 23, 77, 0.1); border-radius: 6px; border: 1px dashed #9d174d; text-align: center;">
          <div style="font-size: 11px; color: #6b7280; font-style: italic;">
            Laporan ini telah diperiksa dan disetujui. Semua informasi fee dokter adalah akurat sesuai dengan pencatatan sistem.
          </div>
        </div>
      </div>
    `
  }
  
  // For 1-4 doctors, show individual signature boxes
  return `
    <!-- Doctor Signatures Section -->
    <div style="margin: 40px 0 20px 0; padding: 20px; border: 2px solid #ec4899; border-radius: 8px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); page-break-inside: avoid;">
      <h3 style="margin: 0 0 20px 0; color: #9d174d; font-size: 16px; text-align: center; border-bottom: 1px solid #ec4899; padding-bottom: 8px;">
        ✍️ PERSETUJUAN DAN TANDA TANGAN DOKTER
      </h3>
      
      <div style="display: grid; grid-template-columns: ${doctorsToShow.length === 1 ? '1fr' : doctorsToShow.length === 2 ? '1fr 1fr' : doctorsToShow.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr'}; gap: 20px; margin-top: 30px;">
        ${doctorsToShow.map(doctorName => `
          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px; border: 1px solid #ec4899;">
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 8px;">Menyetujui,</div>
            <div style="font-weight: bold; color: #9d174d; margin-bottom: 12px; font-size: 13px;">
              ${doctorName}
            </div>
            <div style="margin: 20px 0; height: 50px; border-bottom: 1px solid #9d174d; position: relative;">
              <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #6b7280;">
                Tanda Tangan
              </div>
            </div>
            <div style="color: #6b7280; font-size: 10px; margin-top: 12px;">
              Tanggal: ___________
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Management Approval -->
      <div style="margin-top: 30px; padding: 16px; background: rgba(157, 23, 77, 0.05); border-radius: 8px; border: 1px solid #ec4899;">
        <h4 style="margin: 0 0 16px 0; color: #9d174d; font-size: 14px; text-align: center;">
          👩‍💼 PERSETUJUAN MANAJEMEN
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div style="text-align: center;">
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 8px;">Mengetahui,</div>
            <div style="margin: 20px 0; height: 50px; border-bottom: 1px solid #9d174d;"></div>
            <div style="font-weight: bold; color: #9d174d; margin-top: 8px; font-size: 12px;">Pimpinan Klinik</div>
            <div style="color: #6b7280; font-size: 10px;">Falasifah Dental Clinic</div>
          </div>
          <div style="text-align: center;">
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 8px;">Menyetujui,</div>
            <div style="margin: 20px 0; height: 50px; border-bottom: 1px solid #9d174d;"></div>
            <div style="font-weight: bold; color: #9d174d; margin-top: 8px; font-size: 12px;">Bagian Keuangan</div>
            <div style="color: #6b7280; font-size: 10px;">Falasifah Dental Clinic</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 12px; background: rgba(157, 23, 77, 0.1); border-radius: 6px; border: 1px dashed #9d174d; text-align: center;">
        <div style="font-size: 11px; color: #6b7280; font-style: italic;">
          📋 Laporan ini telah diperiksa dan disetujui oleh dokter terkait dan manajemen klinik.<br>
          Semua informasi fee dokter adalah akurat sesuai dengan pencatatan sistem dan telah diverifikasi.
        </div>
      </div>
    </div>
  `
}