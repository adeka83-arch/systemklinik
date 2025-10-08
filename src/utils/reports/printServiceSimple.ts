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
  doctorFeeFilters?: any
) => {
  console.log('Print button clicked for type:', type)
  
  try {
    let tableContent = ''
    let title = ''
    let data: any[] = []
    
    if (type === 'attendance') {
      title = 'Laporan Absensi Dokter'
      data = filteredAttendanceData
      tableContent = generateSimpleTable('Absensi', data, [
        'Dokter', 'Tanggal', 'Shift', 'Status', 'Jam Masuk', 'Jam Keluar'
      ])
    } else if (type === 'salary') {
      title = 'Laporan Gaji Karyawan'
      data = filteredSalaryData
      tableContent = generateSimpleTable('Gaji', data, [
        'Karyawan', 'Periode', 'Gaji Pokok', 'Bonus', 'Total'
      ])
    } else if (type === 'doctor-fees') {
      title = 'Laporan Fee Dokter'
      data = filteredDoctorFeeData
      tableContent = generateSimpleTable('Fee Dokter', data, [
        'Dokter', 'Periode', 'Total Fee', 'Uang Duduk', 'Grand Total'
      ])
    } else if (type === 'treatments') {
      title = 'Laporan Tindakan Medis'
      data = filteredTreatmentData
      tableContent = generateSimpleTable('Tindakan', data, [
        'Tanggal', 'Pasien', 'Dokter', 'Tindakan', 'Biaya'
      ])
    } else if (type === 'sales') {
      title = 'Laporan Penjualan'
      data = filteredSalesData
      tableContent = generateSalesTable(data)
    } else if (type === 'field-trip-sales') {
      title = 'Laporan Field Trip'
      data = filteredFieldTripSalesData
      tableContent = generateSimpleTable('Field Trip', data, [
        'Tanggal', 'Organisasi', 'Produk', 'Peserta', 'Total'
      ])
    } else if (type === 'field-trip-bonus') {
      title = 'Laporan Fee & Bonus Field Trip'
      data = [] // This will be handled specially
      tableContent = '<p>Laporan Fee & Bonus Field Trip akan segera tersedia.</p>'
    } else if (type === 'expenses') {
      title = 'Laporan Pengeluaran'
      data = filteredExpenseData
      tableContent = generateSimpleTable('Pengeluaran', data, [
        'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah'
      ])
    } else if (type === 'financial') {
      // Enhanced title based on filters
      const filters = doctorFeeFilters || {} // Reuse the same parameter for financial filters
      let titleSuffix = ''
      if (filters.selectedYear && filters.selectedYear !== 'all') {
        titleSuffix += ` - Tahun ${filters.selectedYear}`
      }
      if (filters.viewType === 'yearly') {
        titleSuffix += ' (Akumulasi Tahunan)'
      }
      title = `Laporan Keuangan${titleSuffix}`
      
      // Enhanced financial data processing with filter support
      const financialDataForPrint = filteredFinancialData.map(item => {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ]
        
        // Handle period display for both monthly and yearly views
        let periodDisplay = ''
        if (filters.viewType === 'yearly') {
          periodDisplay = (item as any).period || `Tahun ${item.year}`
        } else {
          const monthIndex = parseInt(item.month) - 1
          const monthName = monthNames[monthIndex] || 'Unknown'
          periodDisplay = `${monthName} ${item.year}`
        }
        
        // Calculate total income and total expenses using the enhanced fields
        const totalIncome = (item as any).totalIncome || ((item.treatmentIncome || 0) + (item.salesIncome || 0) + (item.fieldTripIncome || 0))
        const totalExpenses = (item as any).totalExpense || ((item.salaryExpense || 0) + (item.doctorFeeExpense || 0) + (item.expenses || 0))
        const netProfit = (item as any).profit || item.netProfit || (totalIncome - totalExpenses)
        
        return {
          period: periodDisplay,
          treatmentIncome: item.treatmentIncome || 0,
          salesIncome: item.salesIncome || 0,
          fieldTripIncome: item.fieldTripIncome || 0,
          totalIncome,
          salaryExpense: item.salaryExpense || 0,
          doctorFeeExpense: item.doctorFeeExpense || 0,
          expenses: item.expenses || 0,
          totalExpenses,
          netProfit,
          month: item.month,
          year: item.year,
          recordCount: (item as any).recordCount || 1,
          viewType: filters.viewType || 'monthly'
        }
      }).filter(item => item.totalIncome > 0 || item.totalExpenses > 0) // Only show periods with activity
      
      data = financialDataForPrint.length > 0 ? financialDataForPrint : [
        { 
          period: filters.viewType === 'yearly' ? 'Tahun 2025' : 'Januari 2025', 
          treatmentIncome: 0,
          salesIncome: 0,
          fieldTripIncome: 0,
          totalIncome: 0, 
          salaryExpense: 0,
          doctorFeeExpense: 0,
          expenses: 0,
          totalExpenses: 0, 
          netProfit: 0,
          recordCount: 0,
          viewType: filters.viewType || 'monthly'
        }
      ]
      
      // Adjust table headers based on view type
      const headers = filters.viewType === 'yearly' 
        ? ['Periode', 'Pendapatan Tindakan', 'Pendapatan Penjualan', 'Pendapatan Field Trip', 'Total Pemasukan', 'Gaji Karyawan', 'Fee Dokter', 'Pengeluaran Lain', 'Total Pengeluaran', 'Laba Bersih', 'Periode Data']
        : ['Periode', 'Pendapatan Tindakan', 'Pendapatan Penjualan', 'Pendapatan Field Trip', 'Total Pemasukan', 'Gaji Karyawan', 'Fee Dokter', 'Pengeluaran Lain', 'Total Pengeluaran', 'Laba Bersih']
      
      tableContent = generateSimpleTable('Keuangan', data, headers)
    }

    // Show preview if callback is provided, otherwise print directly
    if (onShowPreview && typeof onShowPreview === 'function') {
      onShowPreview({
        title,
        content: tableContent,
        recordCount: data.length,
        onConfirmPrint: () => printDirectly(title, tableContent, data.length)
      })
    } else {
      // Direct print without preview - simplified approach
      printDirectly(title, tableContent, data.length)
    }
    
  } catch (error) {
    console.error('Print error:', error)
    toast.error('Gagal mencetak laporan')
  }
}

// Special function for sales table with subtotal and discount columns
const generateSalesTable = (data: any[]): string => {
  if (!data || data.length === 0) {
    return `<p>Tidak ada data penjualan untuk ditampilkan.</p>`
  }

  // Calculate totals
  const totalTransaksi = data.length
  const totalQty = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const totalSubtotal = data.reduce((sum, item) => {
    const subtotal = item.subtotal || (item.quantity * (item.pricePerUnit || item.price || 0))
    return sum + subtotal
  }, 0)
  const totalDiskon = data.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
  const totalPenjualan = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0)

  // Generate table header
  const tableHeader = `
    <tr>
      <th style="width: 5%;">No</th>
      <th style="width: 20%;">Produk</th>
      <th style="width: 12%;">Kategori</th>
      <th style="width: 8%;">Qty</th>
      <th style="width: 12%;">Harga Satuan</th>
      <th style="width: 12%;">Subtotal</th>
      <th style="width: 12%;">Diskon</th>
      <th style="width: 12%;">Total</th>
      <th style="width: 12%;">Tanggal</th>
    </tr>
  `

  // Generate table rows
  const tableRows = data.map((item, index) => {
    const subtotal = item.subtotal || (item.quantity * (item.pricePerUnit || item.price || 0))
    const discountAmount = item.discountAmount || 0
    const discountPercentage = item.discountPercentage || 0
    
    const discountDisplay = discountAmount > 0 
      ? `-${formatCurrency(discountAmount)}${discountPercentage > 0 ? ` (${discountPercentage.toFixed(1)}%)` : ''}`
      : '-'

    return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${item.productName || '-'}</td>
        <td style="text-align: center;">${getCategoryLabel(item.productCategory || item.category)}</td>
        <td style="text-align: center;">${item.quantity || 0}</td>
        <td style="text-align: right;">${formatCurrency(item.pricePerUnit || item.price || 0)}</td>
        <td style="text-align: right; color: #16a34a; font-weight: bold;">${formatCurrency(subtotal)}</td>
        <td style="text-align: right; color: #dc2626; font-weight: bold;">${discountDisplay}</td>
        <td style="text-align: right; color: #7c3aed; font-weight: bold;">${formatCurrency(item.totalAmount || 0)}</td>
        <td style="text-align: center;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
      </tr>
    `
  }).join('')

  // Generate summary
  const summary = `
    <div class="summary-box">
      <div style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ec4899;">
        <h3 style="font-size: 14px; font-weight: bold; color: #9d174d; margin: 0;">RINGKASAN PENJUALAN</h3>
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value" style="color: #9d174d;">${totalTransaksi}</div>
          <div class="summary-label">Total Transaksi</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #0891b2;">${totalQty}</div>
          <div class="summary-label">Total Qty</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #16a34a;">${formatCurrency(totalSubtotal)}</div>
          <div class="summary-label">Total Subtotal</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #dc2626;">${formatCurrency(totalDiskon)}</div>
          <div class="summary-label">Total Diskon</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #7c3aed; font-size: 16px;">${formatCurrency(totalPenjualan)}</div>
          <div class="summary-label" style="font-weight: bold;">Total Penjualan</div>
        </div>
      </div>
    </div>
  `

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
      <thead>
        ${tableHeader}
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    ${summary}
  `
}

const generateSimpleTable = (reportType: string, data: any[], headers: string[]): string => {
  if (!data || data.length === 0) {
    return `<p>Tidak ada data ${reportType.toLowerCase()} untuk ditampilkan.</p>`
  }

  // Special handling for attendance data to group check-in/check-out
  let processedData = data
  if (reportType === 'Absensi') {
    processedData = processAttendanceData(data)
  }

  // Calculate totals for relevant reports
  let totalSummary = ''
  if (reportType === 'Penjualan') {
    const totalPenjualan = processedData.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
    const totalQty = processedData.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const avgPerTransaction = processedData.length > 0 ? totalPenjualan / processedData.length : 0
    totalSummary = `
      <div class="summary-box">
        <div style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ec4899;">
          <h3 style="font-size: 14px; font-weight: bold; color: #9d174d; margin: 0;">RINGKASAN PENJUALAN</h3>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value" style="color: #16a34a;">${formatCurrency(totalPenjualan)}</div>
            <div class="summary-label">Total Penjualan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${totalQty}</div>
            <div class="summary-label">Total Quantity</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #9d174d;">${processedData.length}</div>
            <div class="summary-label">Total Transaksi</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #ca8a04;">${formatCurrency(avgPerTransaction)}</div>
            <div class="summary-label">Rata-rata/Transaksi</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Field Trip') {
    const totalFieldTrip = processedData.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
    const totalParticipants = processedData.reduce((sum, item) => sum + (item.participants || 0), 0)
    totalSummary = `
      <div style="margin-top: 20px; padding: 15px; background: #fce7f3; border-radius: 5px; border: 2px solid #ec4899;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #9d174d; margin-bottom: 5px;">${formatCurrency(totalFieldTrip)}</div>
            <div style="font-size: 12px; color: #666;">Total Field Trip</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">${totalParticipants}</div>
            <div style="font-size: 12px; color: #666;">Total Peserta</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 5px;">${processedData.length}</div>
            <div style="font-size: 12px; color: #666;">Total Records</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Tindakan') {
    const totalTindakan = processedData.reduce((sum, item) => sum + (item.nominal || item.amount || 0), 0)
    totalSummary = `
      <div style="margin-top: 20px; padding: 15px; background: #fce7f3; border-radius: 5px; border: 2px solid #ec4899;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #9d174d; margin-bottom: 5px;">${formatCurrency(totalTindakan)}</div>
            <div style="font-size: 12px; color: #666;">Total Tindakan</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 5px;">${processedData.length}</div>
            <div style="font-size: 12px; color: #666;">Total Records</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Pengeluaran') {
    const totalPengeluaran = processedData.reduce((sum, item) => sum + (item.amount || 0), 0)
    totalSummary = `
      <div style="margin-top: 20px; padding: 15px; background: #fce7f3; border-radius: 5px; border: 2px solid #ec4899;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">${formatCurrency(totalPengeluaran)}</div>
            <div style="font-size: 12px; color: #666;">Total Pengeluaran</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 5px;">${processedData.length}</div>
            <div style="font-size: 12px; color: #666;">Total Records</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Gaji') {
    const totalGaji = processedData.reduce((sum, item) => sum + (item.totalSalary || 0), 0)
    const totalBonus = processedData.reduce((sum, item) => sum + (item.bonus || 0), 0)
    const totalBaseSalary = processedData.reduce((sum, item) => sum + (item.baseSalary || 0), 0)
    totalSummary = `
      <div class="summary-box">
        <div style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ec4899;">
          <h3 style="font-size: 14px; font-weight: bold; color: #9d174d; margin: 0;">RINGKASAN GAJI KARYAWAN</h3>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${formatCurrency(totalBaseSalary)}</div>
            <div class="summary-label">Total Gaji Pokok</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #16a34a;">${formatCurrency(totalBonus)}</div>
            <div class="summary-label">Total Bonus</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #9d174d; font-size: 16px;">${formatCurrency(totalGaji)}</div>
            <div class="summary-label" style="font-weight: bold;">Total Keseluruhan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #ca8a04;">${processedData.length}</div>
            <div class="summary-label">Total Karyawan</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Fee Dokter') {
    const totalFee = processedData.reduce((sum, item) => sum + (item.totalFee || 0), 0)
    const totalSittingFee = processedData.reduce((sum, item) => sum + (item.sittingFee || 0), 0)
    const grandTotal = totalFee + totalSittingFee
    const avgFeePerDoctor = processedData.length > 0 ? grandTotal / processedData.length : 0
    totalSummary = `
      <div class="summary-box">
        <div style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ec4899;">
          <h3 style="font-size: 14px; font-weight: bold; color: #9d174d; margin: 0;">RINGKASAN FEE DOKTER</h3>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value" style="color: #ca8a04;">${formatCurrency(totalFee)}</div>
            <div class="summary-label">Fee Tindakan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #16a34a;">${formatCurrency(totalSittingFee)}</div>
            <div class="summary-label">Uang Duduk</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #9d174d; font-size: 16px;">${formatCurrency(grandTotal)}</div>
            <div class="summary-label" style="font-weight: bold;">Grand Total</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${formatCurrency(avgFeePerDoctor)}</div>
            <div class="summary-label">Rata-rata/Dokter</div>
          </div>
        </div>
      </div>
    `
  } else if (reportType === 'Keuangan') {
    const totalIncome = processedData.reduce((sum, item) => sum + (item.totalIncome || 0), 0)
    const totalExpenses = processedData.reduce((sum, item) => sum + (item.totalExpenses || 0), 0)
    const totalProfit = totalIncome - totalExpenses
    const totalTreatmentIncome = processedData.reduce((sum, item) => sum + (item.treatmentIncome || 0), 0)
    const totalSalesIncome = processedData.reduce((sum, item) => sum + (item.salesIncome || 0), 0)
    const totalFieldTripIncome = processedData.reduce((sum, item) => sum + (item.fieldTripIncome || 0), 0)
    
    totalSummary = `
      <div class="summary-box">
        <div style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ec4899;">
          <h3 style="font-size: 14px; font-weight: bold; color: #9d174d; margin: 0;">RINGKASAN KEUANGAN</h3>
        </div>
        
        <div class="summary-grid" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${formatCurrency(totalTreatmentIncome)}</div>
            <div class="summary-label">Pendapatan Tindakan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${formatCurrency(totalSalesIncome)}</div>
            <div class="summary-label">Pendapatan Penjualan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #0891b2;">${formatCurrency(totalFieldTripIncome)}</div>
            <div class="summary-label">Pendapatan Field Trip</div>
          </div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value" style="color: #16a34a; font-size: 16px;">${formatCurrency(totalIncome)}</div>
            <div class="summary-label" style="font-weight: bold;">Total Pemasukan</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: #dc2626; font-size: 16px;">${formatCurrency(totalExpenses)}</div>
            <div class="summary-label" style="font-weight: bold;">Total Pengeluaran</div>
          </div>
          <div class="summary-item">
            <div class="summary-value" style="color: ${totalProfit > 0 ? '#16a34a' : '#dc2626'}; font-size: 18px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${formatCurrency(totalProfit)}</div>
            <div class="summary-label" style="font-weight: bold; color: ${totalProfit > 0 ? '#16a34a' : '#dc2626'};">LABA BERSIH</div>
          </div>
        </div>
        
        <div style="margin-top: 10px; text-align: center; font-size: 9px; color: #666; font-style: italic;">
          Margin Laba: ${totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0.0'}% | 
          Periode: ${processedData.length} bulan data
        </div>
      </div>
    `
  } else {
    // Default summary for other reports
    totalSummary = `
      <div style="margin-top: 20px; padding: 10px; background: #f0f9ff; border-radius: 5px;">
        <strong>Total Records: ${processedData.length}</strong>
      </div>
    `
  }

  // Adjust table style based on report type for better A4 fitting
  const getTableStyle = (reportType: string) => {
    switch (reportType) {
      case 'Keuangan':
        return `
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
          font-size: 10px; 
          table-layout: fixed;
        `
      case 'Fee Dokter':
      case 'Gaji':
        return `
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
          font-size: 11px; 
          table-layout: auto;
        `
      default:
        return `
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
          font-size: 11px; 
          table-layout: auto;
        `
    }
  }

  // Adjust header padding and style based on content
  const getCellStyle = (reportType: string, isHeader: boolean = false) => {
    const baseStyle = isHeader 
      ? "border: 1px solid #ec4899; background-color: #fce7f3; color: #9d174d; font-weight: bold; text-align: center; vertical-align: middle;"
      : "border: 1px solid #e5e7eb; vertical-align: top;"
    
    switch (reportType) {
      case 'Keuangan':
        return baseStyle + (isHeader ? " padding: 6px 4px; font-size: 10px;" : " padding: 5px 4px; font-size: 10px;")
      case 'Fee Dokter':
      case 'Gaji':
        return baseStyle + (isHeader ? " padding: 8px 6px; font-size: 11px;" : " padding: 6px 6px; font-size: 11px;")
      default:
        return baseStyle + (isHeader ? " padding: 8px; font-size: 11px;" : " padding: 6px 8px; font-size: 11px;")
    }
  }

  return `
    <table style="${getTableStyle(reportType)}">
      <thead>
        <tr>
          <th style="${getCellStyle(reportType, true)} width: 5%;">No</th>
          ${headers.map((header, index) => {
            let width = 'auto'
            if (reportType === 'Keuangan') {
              const widths = ['12%', '12%', '12%', '12%', '12%', '10%', '10%', '10%', '10%', '10%']
              width = widths[index] || 'auto'
            } else if (reportType === 'Fee Dokter') {
              const widths = ['25%', '20%', '20%', '20%', '20%']
              width = widths[index] || 'auto'
            } else if (reportType === 'Gaji') {
              const widths = ['25%', '20%', '20%', '15%', '20%']
              width = widths[index] || 'auto'
            }
            return `<th style="${getCellStyle(reportType, true)} width: ${width};">${header}</th>`
          }).join('')}
        </tr>
      </thead>
      <tbody>
        ${processedData.slice(0, 200).map((item, index) => `
          <tr style="${index % 2 === 0 ? 'background-color: #fefbff;' : 'background-color: white;'}">
            <td style="${getCellStyle(reportType)} text-align: center; font-weight: bold;">${index + 1}</td>
            ${generateRowCells(item, reportType)}
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${totalSummary}
  `
}

// Format time display for better readability
const formatTimeDisplay = (time: string | null): string => {
  if (!time) return '-'
  
  // If time is already in HH:MM format, return as is
  if (time.match(/^\d{2}:\d{2}$/)) {
    return time
  }
  
  // If time includes seconds, remove them
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5)
  }
  
  // Try to parse and format if it's a different format
  try {
    const date = new Date(time)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      })
    }
  } catch (error) {
    // If parsing fails, return original time
    return time
  }
  
  return time
}

// Process attendance data to group check-in/check-out by doctor and date
const processAttendanceData = (data: any[]): any[] => {
  const grouped = new Map()
  
  // Group by doctor, date, and shift
  data.forEach(item => {
    const key = `${item.doctorName}-${item.date}-${item.shift}`
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        doctorName: item.doctorName,
        date: item.date,
        shift: item.shift,
        checkInTime: null,
        checkOutTime: null,
        status: 'Tidak Hadir'
      })
    }
    
    const record = grouped.get(key)
    if (item.type === 'check-in') {
      record.checkInTime = item.time
      // Update status - mark as present even if just check-in
      record.status = 'Masuk'
    } else if (item.type === 'check-out') {
      record.checkOutTime = item.time
      // If already has check-in, mark as complete, otherwise just check-out
      record.status = record.checkInTime ? 'Lengkap' : 'Pulang Saja'
    }
  })
  
  // Convert back to array and sort by date and doctor name
  return Array.from(grouped.values()).sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateCompare !== 0) return dateCompare
    return a.doctorName.localeCompare(b.doctorName)
  })
}

const generateRowCells = (item: any, reportType: string): string => {
  // Get cell style for consistency
  const cellStyle = (additionalStyle: string = '') => {
    const baseStyle = reportType === 'Keuangan' 
      ? "border: 1px solid #e5e7eb; padding: 5px 4px; font-size: 10px; vertical-align: top;" 
      : "border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 11px; vertical-align: top;"
    return baseStyle + additionalStyle
  }

  switch (reportType) {
    case 'Absensi':
      return `
        <td style="${cellStyle()}">${item.doctorName || '-'}</td>
        <td style="${cellStyle()}">${new Date(item.date).toLocaleDateString('id-ID')}</td>
        <td style="${cellStyle()}">${item.shift || '-'}</td>
        <td style="${cellStyle()}">${item.status || '-'}</td>
        <td style="${cellStyle()}">${formatTimeDisplay(item.checkInTime)}</td>
        <td style="${cellStyle()}">${formatTimeDisplay(item.checkOutTime)}</td>
      `
    case 'Gaji':
      return `
        <td style="${cellStyle()}">${item.employeeName || '-'}</td>
        <td style="${cellStyle()}">${item.period || `${item.month}/${item.year}` || '-'}</td>
        <td style="${cellStyle('text-align: right;')}">${formatCurrency(item.baseSalary || 0)}</td>
        <td style="${cellStyle('text-align: right;')}">${formatCurrency((item.bonus || 0) + (item.fieldTripBonus || 0))}</td>
        <td style="${cellStyle('font-weight: bold; text-align: right; color: #16a34a;')}">${formatCurrency(item.totalSalary || 0)}</td>
      `
    case 'Fee Dokter':
      return `
        <td style="${cellStyle()}">${item.doctorName || '-'}</td>
        <td style="${cellStyle()}">${item.period || '-'}</td>
        <td style="${cellStyle('text-align: right; color: #ca8a04;')}">${formatCurrency(item.totalFee || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #16a34a;')}">${formatCurrency(item.sittingFee || 0)}</td>
        <td style="${cellStyle('font-weight: bold; text-align: right; color: #9d174d;')}">${formatCurrency((item.totalFee || 0) + (item.sittingFee || 0))}</td>
      `
    case 'Tindakan':
      return `
        <td style="${cellStyle()}">${new Date(item.date).toLocaleDateString('id-ID')}</td>
        <td style="${cellStyle()}">${item.patientName || '-'}</td>
        <td style="${cellStyle()}">${item.doctorName || '-'}</td>
        <td style="${cellStyle()}">${item.treatmentName || '-'}</td>
        <td style="${cellStyle('font-weight: bold; text-align: right; color: #16a34a;')}">${formatCurrency(item.nominal || item.amount || 0)}</td>
      `
    case 'Penjualan':
      // Akan menggunakan fungsi generateSalesTable yang khusus untuk sales
      return ''
    case 'Field Trip':
      return `
        <td style="${cellStyle()}">${new Date(item.date).toLocaleDateString('id-ID')}</td>
        <td style="${cellStyle()}">${item.organization || item.location || '-'}</td>
        <td style="${cellStyle()}">${item.productName || '-'}</td>
        <td style="${cellStyle('text-align: center;')}">${item.participants || item.quantity || 0}</td>
        <td style="${cellStyle('font-weight: bold; text-align: right; color: #16a34a;')}">${formatCurrency(item.totalAmount || 0)}</td>
      `
    case 'Pengeluaran':
      return `
        <td style="${cellStyle()}">${new Date(item.date).toLocaleDateString('id-ID')}</td>
        <td style="${cellStyle()}">${getCategoryLabel(item.category)}</td>
        <td style="${cellStyle()}">${item.description || '-'}</td>
        <td style="${cellStyle('font-weight: bold; text-align: right; color: #dc2626;')}">${formatCurrency(item.amount || 0)}</td>
      `
    case 'Keuangan':
      return `
        <td style="${cellStyle('font-weight: bold; text-align: center; background-color: #fef7ff;')}">${item.period || '-'}</td>
        <td style="${cellStyle('text-align: right; color: #0891b2;')}">${formatCurrency(item.treatmentIncome || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #0891b2;')}">${formatCurrency(item.salesIncome || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #0891b2;')}">${formatCurrency(item.fieldTripIncome || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #16a34a; font-weight: bold; background-color: #f0fdf4;')}">${formatCurrency(item.totalIncome || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #dc2626;')}">${formatCurrency(item.salaryExpense || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #dc2626;')}">${formatCurrency(item.doctorFeeExpense || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #dc2626;')}">${formatCurrency(item.expenses || 0)}</td>
        <td style="${cellStyle('text-align: right; color: #dc2626; font-weight: bold; background-color: #fef2f2;')}">${formatCurrency(item.totalExpenses || 0)}</td>
        <td style="${cellStyle(`text-align: right; font-weight: bold; background-color: ${(item.netProfit || 0) > 0 ? '#f0fdf4' : '#fef2f2'}; color: ${(item.netProfit || 0) > 0 ? '#16a34a' : '#dc2626'};`)}">${formatCurrency(item.netProfit || 0)}</td>
      `
    default:
      return `<td style="${cellStyle()}">-</td>`
  }
}

const printDirectly = (title: string, tableContent: string, recordCount: number) => {
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Pop-up diblokir. Silakan izinkan pop-up untuk mencetak.')
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @page { 
            size: A4; 
            margin: 15mm 10mm 15mm 10mm; 
            @bottom-right {
              content: "Halaman " counter(page) " dari " counter(pages);
              font-size: 9px;
              color: #666;
            }
          }
          
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }
          
          body {
            font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
            line-height: 1.3; 
            font-size: 11px; 
            color: #333;
            padding: 10px;
            background: white;
          }
          
          .header {
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #ec4899; 
            padding-bottom: 15px;
            page-break-after: avoid;
          }
          
          .clinic-name {
            font-size: 22px; 
            font-weight: bold; 
            color: #9d174d; 
            margin-bottom: 6px;
            text-transform: uppercase; 
            letter-spacing: 1px;
          }
          
          .clinic-address {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
          }
          
          .report-title {
            font-size: 16px; 
            color: #ec4899; 
            margin-bottom: 6px; 
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .report-info { 
            font-size: 10px; 
            color: #666; 
            margin-bottom: 3px; 
          }
          
          .print-date { 
            font-size: 9px; 
            color: #888; 
            font-style: italic; 
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
            page-break-inside: auto;
          }
          
          th, td { 
            border: 1px solid #e5e7eb; 
            text-align: left; 
            vertical-align: top; 
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          th { 
            background-color: #fce7f3; 
            font-weight: bold; 
            color: #9d174d; 
            text-align: center;
            font-size: 10px;
            padding: 6px 4px;
          }
          
          td {
            font-size: 10px;
            padding: 4px 5px;
          }
          
          tbody tr:nth-child(even) { 
            background-color: #fefbff; 
          }
          
          tbody tr:hover {
            background-color: #fce7f3;
          }
          
          .summary-box {
            margin-top: 15px;
            padding: 10px;
            background: linear-gradient(135deg, #fce7f3 0%, #fef7ff 100%);
            border: 2px solid #ec4899;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          
          .summary-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 10px;
          }
          
          .summary-item {
            text-align: center;
            flex: 1;
            min-width: 120px;
          }
          
          .summary-value {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          
          .summary-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            page-break-inside: avoid;
          }
          
          /* Print-specific optimizations */
          @media print {
            body { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
              margin: 0;
              padding: 5px;
            }
            
            .header {
              margin-bottom: 15px;
              padding-bottom: 10px;
            }
            
            table {
              margin-bottom: 10px;
            }
            
            .summary-box {
              margin-top: 10px;
              padding: 8px;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* Ensure tables don't break badly */
            tr {
              page-break-inside: avoid;
            }
            
            thead {
              display: table-header-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
          }
          
          /* Responsive adjustments for different screen sizes */
          @media (max-width: 600px) {
            .clinic-name {
              font-size: 18px;
            }
            
            .report-title {
              font-size: 14px;
            }
            
            table {
              font-size: 9px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">Falasifah Dental Clinic</div>
          <div class="clinic-address">Jl. Raya Dental No. 123, Kota Sehat | Telp: (021) 1234-5678 | Email: info@falasifah-dental.com</div>
          <div class="report-title">${title}</div>
          <div class="report-info">
            <strong>Total Records:</strong> ${recordCount} | 
            <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div class="print-date">Generated at ${new Date().toLocaleString('id-ID')}</div>
        </div>
        
        <div class="content">
          ${tableContent}
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 5px;">
            <strong>© ${new Date().getFullYear()} Falasifah Dental Clinic</strong> - Sistem Manajemen Klinik Terintegrasi
          </div>
          <div>
            Laporan ini digenerate secara otomatis oleh sistem dan telah diverifikasi untuk akurasi data.
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Add a small delay to ensure content is fully loaded
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      
      // Close window after printing (optional)
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }, 500)

    toast.success('Laporan siap dicetak! Jendela print akan terbuka dalam beberapa detik.')
    
  } catch (error) {
    console.error('Print error:', error)
    toast.error('Gagal mencetak laporan: ' + (error as Error).message)
  }
}