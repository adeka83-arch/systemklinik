import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Search, Plus, Edit, Trash2, ShoppingCart, Printer, Receipt, UserPlus, Stethoscope, X, Filter, Calendar, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { generateFieldTripInvoiceWithCashier, generateFieldTripReceiptWithCashier } from './FieldTripPrintTemplates'
import { generateFieldTripInvoiceA4, generateFieldTripReceiptA4 } from './FieldTripPrintTemplatesA4'

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  phone: string
}

interface FieldTripProduct {
  id: string
  name: string
  category: string
  price: number
  unit: string
  isActive: boolean
}

interface SelectedDoctor {
  id: string
  name: string
  fee: number
}

interface SelectedEmployee {
  id: string
  name: string
  bonus: number
}

interface FieldTripSalesProps {
  accessToken: string
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
}

interface FieldTripSale {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  organization?: string
  productId: string
  productName?: string
  productPrice?: number
  totalAmount: number
  discount: number
  finalAmount: number
  saleDate: string
  eventDate?: string
  eventEndDate?: string
  participants: number
  notes?: string
  status: 'draft' | 'confirmed' | 'completed'
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp' | 'tempo'
  dpAmount?: number
  outstandingAmount?: number
  paymentNotes?: string
  selectedDoctors?: SelectedDoctor[]
  selectedEmployees?: SelectedEmployee[]
  totalDoctorFees?: number
  totalEmployeeBonuses?: number
  created_at: string
  updated_at?: string
}

interface ReportFilters {
  startDate: string
  endDate: string
  eventDateStart: string
  eventDateEnd: string
  personType: 'all' | 'doctor' | 'employee'
  personName: string
  status: string
}

interface ReportItem {
  id: string
  name: string
  type: 'Fee Dokter' | 'Bonus Karyawan'
  position: string
  fieldTripCount: number
  totalAmount: number
  averageAmount: number
  fieldTripData: FieldTripSale[]
}

export function FieldTripSalesWithActions({ accessToken, clinicSettings }: FieldTripSalesProps) {
  const [sales, setSales] = useState<FieldTripSale[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [products, setProducts] = useState<FieldTripProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<FieldTripSale | null>(null)
  const [selectedCashierId, setSelectedCashierId] = useState('')
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4')
  
  // Edit/Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<FieldTripSale | null>(null)
  
  // Add new sale dialog states
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<FieldTripSale | null>(null)
  
  // Doctor and Employee selection states
  const [selectedDoctors, setSelectedDoctors] = useState<SelectedDoctor[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([])
  
  // Form state for new sale
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    organization: '',
    productId: '',
    discount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    eventDate: '',
    eventEndDate: '',
    participants: 1,
    notes: '',
    status: 'draft' as const,
    paymentMethod: '',
    paymentStatus: 'lunas' as const,
    dpAmount: 0,
    outstandingAmount: 0,
    paymentNotes: ''
  })
  
  // Report states
  const [activeTab, setActiveTab] = useState('sales')
  const [reportItems, setReportItems] = useState<ReportItem[]>([])
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    eventDateStart: '',
    eventDateEnd: '',
    personType: 'all',
    personName: 'all',
    status: 'all'
  })
  const [reportLoading, setReportLoading] = useState(false)

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'secondary' },
    { value: 'confirmed', label: 'Terkonfirmasi', color: 'default' },
    { value: 'completed', label: 'Selesai', color: 'default' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer Bank' },
    { value: 'debit', label: 'Kartu Debit' },
    { value: 'credit', label: 'Kartu Kredit' },
    { value: 'qris', label: 'QRIS' }
  ]

  useEffect(() => {
    fetchSales()
    fetchEmployees()
    fetchDoctors()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (activeTab === 'report') {
      generateReport()
    }
  }, [activeTab, reportFilters, sales])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/field-trip-sales`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setSales(data.sales || [])
      } else {
        toast.error(data.error || 'Gagal mengambil data penjualan field trip')
      }
    } catch (error) {
      console.log('Error fetching field trip sales:', error)
      toast.error('Gagal mengambil data penjualan field trip')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching employees:', error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setDoctors(data.doctors || [])
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/field-trip-products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products?.filter((p: FieldTripProduct) => p.isActive) || [])
      }
    } catch (error) {
      console.log('Error fetching field trip products:', error)
    }
  }

  const generateReport = () => {
    if (!sales.length) {
      setReportItems([])
      return
    }

    setReportLoading(true)
    
    try {
      // Filter sales based on date range
      let filteredSales = sales
      
      if (reportFilters.startDate) {
        filteredSales = filteredSales.filter(sale => 
          new Date(sale.saleDate) >= new Date(reportFilters.startDate)
        )
      }
      
      if (reportFilters.endDate) {
        filteredSales = filteredSales.filter(sale => 
          new Date(sale.saleDate) <= new Date(reportFilters.endDate)
        )
      }
      
      // Filter by event date
      if (reportFilters.eventDateStart) {
        filteredSales = filteredSales.filter(sale => 
          sale.eventDate && new Date(sale.eventDate) >= new Date(reportFilters.eventDateStart)
        )
      }
      
      if (reportFilters.eventDateEnd) {
        filteredSales = filteredSales.filter(sale => 
          sale.eventDate && new Date(sale.eventDate) <= new Date(reportFilters.eventDateEnd)
        )
      }
      
      if (reportFilters.status !== 'all') {
        filteredSales = filteredSales.filter(sale => sale.status === reportFilters.status)
      }

      // Group and calculate report data
      const reportData: ReportItem[] = []
      
      // Process doctors
      if (reportFilters.personType === 'all' || reportFilters.personType === 'doctor') {
        const doctorData = new Map<string, {
          id: string
          name: string
          position: string
          totalFee: number
          fieldTrips: FieldTripSale[]
        }>()
        
        filteredSales.forEach(sale => {
          if (sale.selectedDoctors && sale.selectedDoctors.length > 0) {
            sale.selectedDoctors.forEach(doctor => {
              if (reportFilters.personName === 'all' || doctor.name.toLowerCase().includes(reportFilters.personName.toLowerCase())) {
                const key = doctor.id
                if (!doctorData.has(key)) {
                  const doctorDetail = doctors.find(d => d.id === doctor.id)
                  doctorData.set(key, {
                    id: doctor.id,
                    name: doctor.name,
                    position: doctorDetail?.specialization || 'GP',
                    totalFee: 0,
                    fieldTrips: []
                  })
                }
                
                const existing = doctorData.get(key)!
                existing.totalFee += doctor.fee
                existing.fieldTrips.push(sale)
              }
            })
          }
        })
        
        doctorData.forEach(doctor => {
          reportData.push({
            id: doctor.id,
            name: doctor.name,
            type: 'Fee Dokter',
            position: doctor.position,
            fieldTripCount: doctor.fieldTrips.length,
            totalAmount: doctor.totalFee,
            averageAmount: doctor.fieldTrips.length > 0 ? doctor.totalFee / doctor.fieldTrips.length : 0,
            fieldTripData: doctor.fieldTrips
          })
        })
      }
      
      // Process employees
      if (reportFilters.personType === 'all' || reportFilters.personType === 'employee') {
        const employeeData = new Map<string, {
          id: string
          name: string
          position: string
          totalBonus: number
          fieldTrips: FieldTripSale[]
        }>()
        
        filteredSales.forEach(sale => {
          if (sale.selectedEmployees && sale.selectedEmployees.length > 0) {
            sale.selectedEmployees.forEach(employee => {
              if (reportFilters.personName === 'all' || employee.name.toLowerCase().includes(reportFilters.personName.toLowerCase())) {
                const key = employee.id
                if (!employeeData.has(key)) {
                  const employeeDetail = employees.find(e => e.id === employee.id)
                  employeeData.set(key, {
                    id: employee.id,
                    name: employee.name,
                    position: employeeDetail?.position || 'Staff',
                    totalBonus: 0,
                    fieldTrips: []
                  })
                }
                
                const existing = employeeData.get(key)!
                existing.totalBonus += employee.bonus
                existing.fieldTrips.push(sale)
              }
            })
          }
        })
        
        employeeData.forEach(employee => {
          reportData.push({
            id: employee.id,
            name: employee.name,
            type: 'Bonus Karyawan',
            position: employee.position,
            fieldTripCount: employee.fieldTrips.length,
            totalAmount: employee.totalBonus,
            averageAmount: employee.fieldTrips.length > 0 ? employee.totalBonus / employee.fieldTrips.length : 0,
            fieldTripData: employee.fieldTrips
          })
        })
      }
      
      setReportItems(reportData)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Gagal membuat laporan')
    } finally {
      setReportLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (sale.customerName || '').toLowerCase().includes(searchLower) ||
      (sale.customerPhone || '').includes(searchTerm) ||
      (sale.organization || '').toLowerCase().includes(searchLower) ||
      (sale.productName || '').toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handlePrintReport = () => {
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) return

    const totalDoctorFees = reportItems
      .filter(item => item.type === 'Fee Dokter')
      .reduce((sum, item) => sum + item.totalAmount, 0)
    
    const totalEmployeeBonuses = reportItems
      .filter(item => item.type === 'Bonus Karyawan')
      .reduce((sum, item) => sum + item.totalAmount, 0)
    
    const totalFieldTrips = new Set(
      reportItems.flatMap(item => item.fieldTripData.map(trip => trip.id))
    ).size

    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })

    const filterInfo = []
    if (reportFilters.startDate) filterInfo.push(`Tgl Penjualan Mulai: ${new Date(reportFilters.startDate).toLocaleDateString('id-ID')}`)
    if (reportFilters.endDate) filterInfo.push(`Tgl Penjualan Akhir: ${new Date(reportFilters.endDate).toLocaleDateString('id-ID')}`)
    if (reportFilters.eventDateStart) filterInfo.push(`Tgl Kegiatan Mulai: ${new Date(reportFilters.eventDateStart).toLocaleDateString('id-ID')}`)
    if (reportFilters.eventDateEnd) filterInfo.push(`Tgl Kegiatan Akhir: ${new Date(reportFilters.eventDateEnd).toLocaleDateString('id-ID')}`)
    if (reportFilters.personType !== 'all') filterInfo.push(`Jenis: ${reportFilters.personType === 'doctor' ? 'Dokter' : 'Karyawan'}`)
    if (reportFilters.personName !== 'all') filterInfo.push(`Nama: ${reportFilters.personName}`)
    if (reportFilters.status !== 'all') filterInfo.push(`Status: ${reportFilters.status}`)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Fee & Bonus Field Trip - ${clinicSettings?.name || 'Falasifah Dental Clinic'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }
            .clinic-name { font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
            .report-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .print-date { font-size: 10px; color: #666; }
            .filters { background: #fce4ec; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
            .filters h4 { margin: 0 0 8px 0; color: #e91e63; }
            .filters p { margin: 2px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #fce4ec; color: #e91e63; font-weight: bold; text-align: center; }
            .text-center { text-align: center; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .doctor-fee { color: #2196f3; }
            .employee-bonus { color: #4caf50; }
            .total { color: #e91e63; }
            .field-trip-count { color: #ff9800; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${clinicSettings?.name || 'Falasifah Dental Clinic'}</div>
            <div class="report-title">Laporan Fee & Bonus Field Trip</div>
            <div class="print-date">Dicetak pada: ${currentDate}</div>
          </div>

          ${filterInfo.length > 0 ? `
            <div class="filters">
              <h4>🔍 Filter Laporan:</h4>
              ${filterInfo.map(info => `<p>• ${info}</p>`).join('')}
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 20%;">Nama</th>
                <th style="width: 12%;">Jenis</th>
                <th style="width: 18%;">Posisi/Spesialisasi</th>
                <th style="width: 10%;">Jumlah Field Trip</th>
                <th style="width: 20%;">Tanggal Kegiatan</th>
                <th style="width: 10%;">Total Amount</th>
                <th style="width: 5%;">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              ${reportItems.map((item, index) => {
                // Get unique event dates from field trips
                const eventDates = [...new Set(
                  item.fieldTripData
                    .filter(trip => trip.eventDate)
                    .map(trip => new Date(trip.eventDate).toLocaleDateString('id-ID'))
                )].sort()
                
                const eventDatesDisplay = eventDates.length > 0 
                  ? eventDates.slice(0, 3).join('<br>') + (eventDates.length > 3 ? `<br><small>+${eventDates.length - 3} lainnya</small>` : '')
                  : '-'
                  
                return `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.name}</td>
                    <td class="text-center">
                      <span style="background: ${item.type === 'Fee Dokter' ? '#fff3cd' : '#d4edda'}; 
                                   color: ${item.type === 'Fee Dokter' ? '#856404' : '#155724'}; 
                                   padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                        ${item.type}
                      </span>
                    </td>
                    <td>${item.position}</td>
                    <td class="text-center">${item.fieldTripCount}</td>
                    <td style="text-align: center; font-size: 10px; line-height: 1.3;">${eventDatesDisplay}</td>
                    <td style="text-align: right;">Rp ${item.totalAmount.toLocaleString('id-ID')}</td>
                    <td style="text-align: right;">Rp ${item.averageAmount.toLocaleString('id-ID')}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value doctor-fee">Rp ${totalDoctorFees.toLocaleString('id-ID')}</div>
                <div>Total Fee Dokter</div>
              </div>
              <div class="summary-item">
                <div class="summary-value employee-bonus">Rp ${totalEmployeeBonuses.toLocaleString('id-ID')}</div>
                <div>Total Bonus Karyawan</div>
              </div>
              <div class="summary-item">
                <div class="summary-value total">Rp ${(totalDoctorFees + totalEmployeeBonuses).toLocaleString('id-ID')}</div>
                <div>Total Keseluruhan</div>
              </div>
              <div class="summary-item">
                <div class="summary-value field-trip-count">${totalFieldTrips}</div>
                <div>Field Trip</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    reportWindow.document.write(html)
    reportWindow.document.close()
    reportWindow.print()
  }

  const openCashierDialog = (sale: FieldTripSale, type: 'invoice' | 'receipt') => {
    setSelectedSaleForPrint(sale)
    setPrintType(type)
    setSelectedCashierId('')
    setPaperSize('A4')
    setCashierDialogOpen(true)
  }

  const handlePrintWithCashier = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSaleForPrint || !selectedCashierId) {
      toast.error('Kasir harus dipilih')
      return
    }

    // Get selected cashier name
    const selectedCashier = employees.find(emp => emp.id === selectedCashierId)
    const cashierNameForPrint = selectedCashier ? selectedCashier.name : ''
    
    if (!cashierNameForPrint) {
      toast.error('Data kasir tidak ditemukan')
      return
    }

    const saleForPrint = {
      id: selectedSaleForPrint.id,
      date: selectedSaleForPrint.saleDate,
      customerName: selectedSaleForPrint.customerName,
      customerPhone: selectedSaleForPrint.customerPhone,
      customerAddress: selectedSaleForPrint.customerAddress,
      products: [{
        id: selectedSaleForPrint.productId,
        name: selectedSaleForPrint.productName || 'Produk tidak ditemukan',
        price: selectedSaleForPrint.productPrice || 0,
        quantity: selectedSaleForPrint.participants,
        totalPrice: selectedSaleForPrint.totalAmount
      }],
      subtotal: selectedSaleForPrint.totalAmount,
      totalAmount: selectedSaleForPrint.finalAmount,
      paymentMethod: selectedSaleForPrint.paymentMethod,
      paymentStatus: selectedSaleForPrint.paymentStatus,
      dpAmount: selectedSaleForPrint.dpAmount,
      outstandingAmount: selectedSaleForPrint.outstandingAmount,
      notes: selectedSaleForPrint.notes,
      createdAt: selectedSaleForPrint.created_at
    }

    const transactionDate = selectedSaleForPrint.saleDate

    if (paperSize === 'A4') {
      if (printType === 'invoice') {
        generateFieldTripInvoiceA4(saleForPrint, cashierNameForPrint, transactionDate, clinicSettings)
      } else {
        generateFieldTripReceiptA4(saleForPrint, cashierNameForPrint, transactionDate, clinicSettings)
      }
    } else {
      if (printType === 'invoice') {
        generateFieldTripInvoiceWithCashier(saleForPrint, cashierNameForPrint, transactionDate, clinicSettings)
      } else {
        generateFieldTripReceiptWithCashier(saleForPrint, cashierNameForPrint, transactionDate, clinicSettings)
      }
    }

    setCashierDialogOpen(false)
    setSelectedCashierId('')
    setPaperSize('A4')
    setSelectedSaleForPrint(null)
    
    toast.success(`${printType === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil dicetak (${paperSize})`)
  }

  const handleEdit = (sale: FieldTripSale) => {
    console.log('Edit button clicked for sale:', sale.id)
    openSaleDialog(sale)
  }

  const handleDelete = async () => {
    if (!selectedSale) return

    try {
      const response = await fetch(`${serverUrl}/field-trip-sales/${selectedSale.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data penjualan field trip berhasil dihapus')
        fetchSales()
        setDeleteDialogOpen(false)
        setSelectedSale(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data penjualan')
      }
    } catch (error) {
      console.log('Error deleting field trip sale:', error)
      toast.error('Gagal menghapus data penjualan')
    }
  }

  const openDeleteDialog = (sale: FieldTripSale) => {
    setSelectedSale(sale)
    setDeleteDialogOpen(true)
  }

  const calculateAmounts = () => {
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) return { totalAmount: 0, finalAmount: 0 }
    
    const totalAmount = selectedProduct.price * saleForm.participants
    const finalAmount = totalAmount - saleForm.discount
    
    return { totalAmount, finalAmount }
  }

  const calculateTotalDoctorFees = () => {
    return selectedDoctors.reduce((total, doctor) => total + doctor.fee, 0)
  }

  const calculateTotalEmployeeBonuses = () => {
    return selectedEmployees.reduce((total, employee) => total + employee.bonus, 0)
  }

  const addDoctor = () => {
    if (doctors.length === 0) {
      toast.error('Tidak ada data dokter tersedia')
      return
    }
    
    const availableDoctors = doctors.filter(doctor => 
      !selectedDoctors.some(selected => selected.id === doctor.id)
    )
    
    if (availableDoctors.length === 0) {
      toast.error('Semua dokter sudah ditambahkan')
      return
    }
    
    const firstAvailable = availableDoctors[0]
    setSelectedDoctors([...selectedDoctors, {
      id: firstAvailable.id,
      name: firstAvailable.name,
      fee: 0
    }])
  }

  const removeDoctor = (doctorId: string) => {
    setSelectedDoctors(selectedDoctors.filter(doctor => doctor.id !== doctorId))
  }

  const updateDoctorFee = (doctorId: string, fee: number) => {
    setSelectedDoctors(selectedDoctors.map(doctor => 
      doctor.id === doctorId ? { ...doctor, fee } : doctor
    ))
  }

  const changeDoctorSelection = (oldDoctorId: string, newDoctorId: string) => {
    const newDoctor = doctors.find(d => d.id === newDoctorId)
    if (!newDoctor) return
    
    setSelectedDoctors(selectedDoctors.map(doctor => 
      doctor.id === oldDoctorId 
        ? { id: newDoctor.id, name: newDoctor.name, fee: doctor.fee }
        : doctor
    ))
  }

  const addEmployee = () => {
    if (employees.length === 0) {
      toast.error('Tidak ada data karyawan tersedia')
      return
    }
    
    const availableEmployees = employees.filter(employee => 
      !selectedEmployees.some(selected => selected.id === employee.id)
    )
    
    if (availableEmployees.length === 0) {
      toast.error('Semua karyawan sudah ditambahkan')
      return
    }
    
    const firstAvailable = availableEmployees[0]
    setSelectedEmployees([...selectedEmployees, {
      id: firstAvailable.id,
      name: firstAvailable.name,
      bonus: 0
    }])
  }

  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(selectedEmployees.filter(employee => employee.id !== employeeId))
  }

  const updateEmployeeBonus = (employeeId: string, bonus: number) => {
    setSelectedEmployees(selectedEmployees.map(employee => 
      employee.id === employeeId ? { ...employee, bonus } : employee
    ))
  }

  const changeEmployeeSelection = (oldEmployeeId: string, newEmployeeId: string) => {
    const newEmployee = employees.find(e => e.id === newEmployeeId)
    if (!newEmployee) return
    
    setSelectedEmployees(selectedEmployees.map(employee => 
      employee.id === oldEmployeeId 
        ? { id: newEmployee.id, name: newEmployee.name, bonus: employee.bonus }
        : employee
    ))
  }

  const openSaleDialog = (sale?: FieldTripSale) => {
    if (sale) {
      console.log('Opening edit dialog for sale:', sale.id, sale)
      setEditingSale(sale)
      
      const formData = {
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerEmail: sale.customerEmail || '',
        customerAddress: sale.customerAddress || '',
        organization: sale.organization || '',
        productId: sale.productId,
        discount: sale.discount,
        saleDate: sale.saleDate,
        eventDate: sale.eventDate || '',
        eventEndDate: sale.eventEndDate || '',
        participants: sale.participants,
        notes: sale.notes || '',
        status: sale.status,
        paymentMethod: sale.paymentMethod || '',
        paymentStatus: sale.paymentStatus || 'lunas',
        dpAmount: sale.dpAmount || 0,
        outstandingAmount: sale.outstandingAmount || 0,
        paymentNotes: sale.paymentNotes || ''
      }
      
      console.log('Setting form data:', formData)
      setSaleForm(formData)
      
      // Set doctors and employees data
      console.log('Setting selected doctors:', sale.selectedDoctors || [])
      console.log('Setting selected employees:', sale.selectedEmployees || [])
      setSelectedDoctors(sale.selectedDoctors || [])
      setSelectedEmployees(sale.selectedEmployees || [])
    } else {
      console.log('Opening new sale dialog')
      setEditingSale(null)
      resetForm()
    }
    setSaleDialogOpen(true)
  }

  const resetForm = () => {
    console.log('Resetting form and closing dialog')
    
    setSaleForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      organization: '',
      productId: '',
      discount: 0,
      saleDate: new Date().toISOString().split('T')[0],
      eventDate: '',
      eventEndDate: '',
      participants: 1,
      notes: '',
      status: 'draft',
      paymentMethod: '',
      paymentStatus: 'lunas',
      dpAmount: 0,
      outstandingAmount: 0,
      paymentNotes: ''
    })
    
    // Reset doctors and employees
    setSelectedDoctors([])
    setSelectedEmployees([])
    setEditingSale(null)
    setSaleDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi field wajib
    if (!saleForm.customerName.trim()) {
      toast.error('Nama customer harus diisi')
      return
    }
    
    if (!saleForm.customerPhone.trim()) {
      toast.error('Telepon customer harus diisi')
      return
    }
    
    // Validasi tanggal event
    if (saleForm.eventDate && saleForm.eventEndDate) {
      if (new Date(saleForm.eventEndDate) < new Date(saleForm.eventDate)) {
        toast.error('Tanggal selesai event tidak boleh lebih awal dari tanggal mulai')
        return
      }
    }
    
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) {
      toast.error('Produk harus dipilih')
      return
    }

    const { totalAmount, finalAmount } = calculateAmounts()
    const totalDoctorFees = calculateTotalDoctorFees()
    const totalEmployeeBonuses = calculateTotalEmployeeBonuses()
    
    try {
      setLoading(true)
      
      const url = editingSale 
        ? `${serverUrl}/field-trip-sales/${editingSale.id}`
        : `${serverUrl}/field-trip-sales`
      
      const method = editingSale ? 'PUT' : 'POST'

      const saleData = {
        ...saleForm,
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        totalAmount,
        finalAmount,
        selectedDoctors,
        selectedEmployees,
        totalDoctorFees,
        totalEmployeeBonuses
      }

      console.log('Submitting field trip sale:', {
        method,
        url,
        isEditing: !!editingSale,
        editingSaleId: editingSale?.id,
        saleData: {
          ...saleData,
          id: editingSale?.id
        }
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(saleData)
      })

      const data = await response.json()
      console.log('Submit response:', { 
        ok: response.ok, 
        status: response.status, 
        data 
      })

      if (response.ok) {
        toast.success(editingSale ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan')
        fetchSales()
        resetForm()
      } else {
        console.error('Submit failed:', data)
        toast.error(data.error || 'Gagal menyimpan penjualan')
      }
    } catch (error) {
      console.error('Error saving sale:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-pink-100">
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Penjualan Field Trip
          </TabsTrigger>
          <TabsTrigger 
            value="report" 
            className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Fee & Bonus
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-pink-600" />
              <CardTitle className="text-pink-800">Kelola Transaksi Field Trip</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchSales}
                variant="outline"
                size="sm"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                disabled={loading}
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Memuat...' : 'Refresh'}
              </Button>
              <Button 
                onClick={() => openSaleDialog()}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Penjualan Field Trip
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari customer, organisasi, atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Semua Status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead className="w-28">Tanggal Penjualan</TableHead>
                  <TableHead className="w-28">Periode Event</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Final</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-48">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Belum ada data penjualan field trip
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale, index) => (
                    <TableRow key={sale.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(sale.saleDate).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.eventDate ? (
                            <div>
                              <div className="text-blue-600">
                                {new Date(sale.eventDate).toLocaleDateString('id-ID')}
                                {sale.eventEndDate && sale.eventEndDate !== sale.eventDate && (
                                  <span className="text-gray-500 text-xs ml-1">
                                    - {new Date(sale.eventEndDate).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                              </div>
                              {sale.eventEndDate && sale.eventEndDate !== sale.eventDate && (
                                <div className="text-xs text-green-600">
                                  Multi-hari ({Math.ceil((new Date(sale.eventEndDate).getTime() - new Date(sale.eventDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} hari)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Belum ditentukan</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.customerName || 'Tidak ada nama'}</div>
                          <div className="text-sm text-gray-500">{sale.customerPhone || 'Tidak ada telepon'}</div>
                          {sale.organization && (
                            <div className="text-xs text-gray-400">{sale.organization}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.productName || 'Produk tidak ditemukan'}</div>
                          <div className="text-sm text-gray-500">{sale.participants} peserta</div>
                          {sale.selectedDoctors && sale.selectedDoctors.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {sale.selectedDoctors.length} dokter • Rp {(sale.totalDoctorFees || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                          {sale.selectedEmployees && sale.selectedEmployees.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              {sale.selectedEmployees.length} karyawan • Rp {(sale.totalEmployeeBonuses || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>Rp {(sale.totalAmount || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <div>
                          <div>Rp {(sale.finalAmount || 0).toLocaleString('id-ID')}</div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-red-500">
                              Diskon: Rp {sale.discount.toLocaleString('id-ID')}
                            </div>
                          )}
                          {sale.paymentStatus === 'dp' && sale.outstandingAmount && sale.outstandingAmount > 0 && (
                            <div className="text-xs text-orange-600 mt-1 font-medium">
                              Outstanding: Rp {sale.outstandingAmount.toLocaleString('id-ID')}
                            </div>
                          )}
                          {sale.paymentMethod && (
                            <div className="text-xs text-blue-600 mt-1">
                              {sale.paymentMethod} • {
                                sale.paymentStatus === 'dp' ? 'DP' : 
                                sale.paymentStatus === 'tempo' ? 'Tempo' : 'Lunas'
                              }
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusOptions.find(s => s.value === sale.status)?.color as any || 'default'}>
                          {statusOptions.find(s => s.value === sale.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sale)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(sale)}
                            title="Hapus"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCashierDialog(sale, 'invoice')}
                            title="Print Invoice"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCashierDialog(sale, 'receipt')}
                            title="Print Kwitansi"
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Report Tab */}
    <TabsContent value="report" className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan Fee & Bonus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-start-date">Tanggal Penjualan Mulai</Label>
              <Input
                id="report-start-date"
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end-date">Tanggal Penjualan Akhir</Label>
              <Input
                id="report-end-date"
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date-start" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-pink-500" />
                Tanggal Kegiatan Mulai
              </Label>
              <Input
                id="event-date-start"
                type="date"
                value={reportFilters.eventDateStart}
                onChange={(e) => setReportFilters(prev => ({ ...prev, eventDateStart: e.target.value }))}
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date-end" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-pink-500" />
                Tanggal Kegiatan Akhir
              </Label>
              <Input
                id="event-date-end"
                type="date"
                value={reportFilters.eventDateEnd}
                onChange={(e) => setReportFilters(prev => ({ ...prev, eventDateEnd: e.target.value }))}
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="person-type">Jenis</Label>
              <Select
                value={reportFilters.personType}
                onValueChange={(value) => setReportFilters(prev => ({ ...prev, personType: value as 'all' | 'doctor' | 'employee' }))}
              >
                <SelectTrigger className="border-pink-200 focus:border-pink-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="doctor">Fee Dokter</SelectItem>
                  <SelectItem value="employee">Bonus Karyawan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-name">Nama</Label>
              <Input
                id="person-name"
                value={reportFilters.personName === 'all' ? '' : reportFilters.personName}
                onChange={(e) => setReportFilters(prev => ({ ...prev, personName: e.target.value || 'all' }))}
                placeholder="Cari nama..."
                className="border-pink-200 focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-status">Status</Label>
              <Select
                value={reportFilters.status}
                onValueChange={(value) => setReportFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="border-pink-200 focus:border-pink-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setReportFilters({
                startDate: '',
                endDate: '',
                eventDateStart: '',
                eventDateEnd: '',
                personType: 'all',
                personName: 'all',
                status: 'all'
              })}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Reset Filter
            </Button>
            <Button
              onClick={generateReport}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
              disabled={reportLoading}
            >
              <Search className="h-4 w-4 mr-2" />
              {reportLoading ? 'Memuat...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Laporan Fee & Bonus Field Trip
            </CardTitle>
            <Button
              onClick={handlePrintReport}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={reportLoading || reportItems.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-pink-50">
                  <TableHead className="text-pink-700 text-center w-12">No</TableHead>
                  <TableHead className="text-pink-700">Nama</TableHead>
                  <TableHead className="text-pink-700 text-center">Jenis</TableHead>
                  <TableHead className="text-pink-700">Posisi/Spesialisasi</TableHead>
                  <TableHead className="text-pink-700 text-center">Jumlah Field Trip</TableHead>
                  <TableHead className="text-pink-700 text-center">Tanggal Kegiatan</TableHead>
                  <TableHead className="text-pink-700 text-right">Total Amount</TableHead>
                  <TableHead className="text-pink-700 text-right">Rata-rata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        Memuat laporan...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reportItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Tidak ada data untuk filter yang dipilih
                    </TableCell>
                  </TableRow>
                ) : (
                  reportItems.map((item, index) => {
                    // Get unique event dates from field trips
                    const eventDates = [...new Set(
                      item.fieldTripData
                        .filter(trip => trip.eventDate)
                        .map(trip => new Date(trip.eventDate!).toLocaleDateString('id-ID'))
                    )].sort()
                    
                    return (
                      <TableRow key={`${item.type}-${item.id}-${index}`}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.type === 'Fee Dokter' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.position}</TableCell>
                        <TableCell className="text-center">{item.fieldTripCount}</TableCell>
                        <TableCell className="text-center text-xs">
                          {eventDates.length > 0 ? (
                            <div className="space-y-1">
                              {eventDates.slice(0, 2).map((date, idx) => (
                                <div key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {date}
                                </div>
                              ))}
                              {eventDates.length > 2 && (
                                <div className="text-gray-500 text-xs">
                                  +{eventDates.length - 2} lainnya
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {item.totalAmount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.averageAmount.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {reportItems.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    Rp {reportItems
                      .filter(item => item.type === 'Fee Dokter')
                      .reduce((sum, item) => sum + item.totalAmount, 0)
                      .toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-blue-600">Total Fee Dokter</div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    Rp {reportItems
                      .filter(item => item.type === 'Bonus Karyawan')
                      .reduce((sum, item) => sum + item.totalAmount, 0)
                      .toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-green-600">Total Bonus Karyawan</div>
                </CardContent>
              </Card>
              
              <Card className="border-pink-200 bg-pink-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    Rp {reportItems
                      .reduce((sum, item) => sum + item.totalAmount, 0)
                      .toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-pink-600">Total Keseluruhan</div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(
                      reportItems.flatMap(item => item.fieldTripData.map(trip => trip.id))
                    ).size}
                  </div>
                  <div className="text-sm text-orange-600">Field Trip</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

      {/* Add/Edit Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={(open) => {
        console.log('Dialog open change:', open)
        if (!open) {
          resetForm()
        } else {
          setSaleDialogOpen(open)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {editingSale ? 'Edit Penjualan Field Trip' : 'Tambah Penjualan Field Trip'}
            </DialogTitle>
            <DialogDescription>
              {editingSale ? 'Perbarui data penjualan field trip' : 'Masukkan data penjualan field trip baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nama Customer *</Label>
                  <Input
                    id="customerName"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({...saleForm, customerName: e.target.value})}
                    placeholder="Masukkan nama customer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telepon Customer *</Label>
                  <Input
                    id="customerPhone"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({...saleForm, customerPhone: e.target.value})}
                    placeholder="Masukkan nomor telepon"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Customer</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={saleForm.customerEmail}
                    onChange={(e) => setSaleForm({...saleForm, customerEmail: e.target.value})}
                    placeholder="Masukkan email customer (opsional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organisasi</Label>
                  <Input
                    id="organization"
                    value={saleForm.organization}
                    onChange={(e) => setSaleForm({...saleForm, organization: e.target.value})}
                    placeholder="Nama sekolah/organisasi (opsional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Alamat Customer</Label>
                  <Textarea
                    id="customerAddress"
                    value={saleForm.customerAddress}
                    onChange={(e) => setSaleForm({...saleForm, customerAddress: e.target.value})}
                    placeholder="Masukkan alamat lengkap (opsional)"
                    rows={2}
                  />
                </div>
              </div>

              {/* Product and Sales Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Produk Field Trip *</Label>
                  <Select
                    value={saleForm.productId}
                    onValueChange={(value) => {
                      setSaleForm(prev => {
                        const newForm = {...prev, productId: value}
                        // Auto-update outstanding amount if DP is selected
                        if (newForm.paymentStatus === 'dp') {
                          const selectedProduct = products.find(p => p.id === value)
                          if (selectedProduct) {
                            const totalAmount = selectedProduct.price * newForm.participants
                            const finalAmount = totalAmount - newForm.discount
                            newForm.outstandingAmount = Math.max(0, finalAmount - newForm.dpAmount)
                          }
                        }
                        return newForm
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk field trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Rp {product.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Jumlah Peserta *</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    value={saleForm.participants}
                    onChange={(e) => {
                      const participants = parseInt(e.target.value) || 1
                      setSaleForm(prev => {
                        const newForm = {...prev, participants}
                        // Auto-update outstanding amount if DP is selected
                        if (newForm.paymentStatus === 'dp') {
                          const selectedProduct = products.find(p => p.id === newForm.productId)
                          if (selectedProduct) {
                            const totalAmount = selectedProduct.price * participants
                            const finalAmount = totalAmount - newForm.discount
                            newForm.outstandingAmount = Math.max(0, finalAmount - newForm.dpAmount)
                          }
                        }
                        return newForm
                      })
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Diskon (Rp)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    value={saleForm.discount}
                    onChange={(e) => {
                      const discount = parseInt(e.target.value) || 0
                      setSaleForm(prev => {
                        const newForm = {...prev, discount}
                        // Auto-update outstanding amount if DP is selected
                        if (newForm.paymentStatus === 'dp') {
                          const selectedProduct = products.find(p => p.id === newForm.productId)
                          if (selectedProduct) {
                            const totalAmount = selectedProduct.price * newForm.participants
                            const finalAmount = totalAmount - discount
                            newForm.outstandingAmount = Math.max(0, finalAmount - newForm.dpAmount)
                          }
                        }
                        return newForm
                      })
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="saleDate">Tanggal Penjualan *</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={saleForm.saleDate}
                      onChange={(e) => setSaleForm({...saleForm, saleDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Tanggal Mulai Event</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={saleForm.eventDate}
                        onChange={(e) => {
                          const newEventDate = e.target.value
                          setSaleForm(prev => ({
                            ...prev, 
                            eventDate: newEventDate,
                            // Auto-set end date same as start date if not already set
                            eventEndDate: prev.eventEndDate || newEventDate
                          }))
                        }}
                      />
                      <p className="text-xs text-gray-500">Tanggal pelaksanaan kegiatan</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventEndDate">Tanggal Selesai Event</Label>
                      <Input
                        id="eventEndDate"
                        type="date"
                        value={saleForm.eventEndDate}
                        onChange={(e) => setSaleForm({...saleForm, eventEndDate: e.target.value})}
                        min={saleForm.eventDate}
                      />
                      <p className="text-xs text-gray-500">Kosongkan jika event hanya 1 hari</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                  <Select
                    value={saleForm.paymentMethod}
                    onValueChange={(value) => setSaleForm({...saleForm, paymentMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Status Pembayaran</Label>
                  <Select
                    value={saleForm.paymentStatus}
                    onValueChange={(value) => {
                      const newPaymentStatus = value as 'lunas' | 'dp' | 'tempo'
                      setSaleForm({
                        ...saleForm, 
                        paymentStatus: newPaymentStatus,
                        // Reset DP amount and outstanding when changing status
                        dpAmount: newPaymentStatus === 'dp' ? saleForm.dpAmount : 0,
                        outstandingAmount: newPaymentStatus === 'dp' ? 
                          (calculateAmounts().finalAmount - saleForm.dpAmount) : 0
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunas">Lunas</SelectItem>
                      <SelectItem value="dp">DP</SelectItem>
                      <SelectItem value="tempo">Tempo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {saleForm.paymentStatus === 'dp' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="dpAmount">Jumlah DP (Rp)</Label>
                      <Input
                        id="dpAmount"
                        type="number"
                        min="0"
                        value={saleForm.dpAmount}
                        onChange={(e) => {
                          const dpAmount = parseInt(e.target.value) || 0
                          const totalAmount = calculateAmounts().finalAmount
                          setSaleForm({
                            ...saleForm, 
                            dpAmount: dpAmount,
                            outstandingAmount: Math.max(0, totalAmount - dpAmount)
                          })
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="outstandingAmount">Sisa Pembayaran (Rp)</Label>
                      <Input
                        id="outstandingAmount"
                        type="number"
                        min="0"
                        value={saleForm.outstandingAmount}
                        readOnly
                        className="bg-gray-100"
                        title="Otomatis dihitung dari Total Akhir - Jumlah DP"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status Kegiatan</Label>
                  <Select
                    value={saleForm.status}
                    onValueChange={(value) => setSaleForm({...saleForm, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Doctor Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-pink-800">Tim Dokter</h3>
                <Button type="button" onClick={addDoctor} size="sm" variant="outline">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Tambah Dokter
                </Button>
              </div>
              
              {selectedDoctors.map((doctor, index) => {
                const availableDoctors = doctors.filter(d => 
                  d.id === doctor.id || !selectedDoctors.some(selected => selected.id === d.id)
                )
                
                return (
                  <div key={`${doctor.id}-${index}`} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Dokter</Label>
                      <Select
                        value={doctor.id}
                        onValueChange={(value) => changeDoctorSelection(doctor.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDoctors.map((availableDoctor) => (
                            <SelectItem key={availableDoctor.id} value={availableDoctor.id}>
                              {availableDoctor.name} - {availableDoctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label>Fee (Rp)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={doctor.fee}
                        onChange={(e) => updateDoctorFee(doctor.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeDoctor(doctor.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
              
              {selectedDoctors.length > 0 && (
                <div className="text-sm text-blue-600 font-medium">
                  Total Fee Dokter: Rp {calculateTotalDoctorFees().toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Employee Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-pink-800">Tim Pendamping</h3>
                <Button type="button" onClick={addEmployee} size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Karyawan
                </Button>
              </div>
              
              {selectedEmployees.map((employee, index) => {
                const availableEmployees = employees.filter(e => 
                  e.id === employee.id || !selectedEmployees.some(selected => selected.id === e.id)
                )
                
                return (
                  <div key={`${employee.id}-${index}`} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Karyawan</Label>
                      <Select
                        value={employee.id}
                        onValueChange={(value) => changeEmployeeSelection(employee.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEmployees.map((availableEmployee) => (
                            <SelectItem key={availableEmployee.id} value={availableEmployee.id}>
                              {availableEmployee.name} - {availableEmployee.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label>Bonus (Rp)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={employee.bonus}
                        onChange={(e) => updateEmployeeBonus(employee.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeEmployee(employee.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
              
              {selectedEmployees.length > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Total Bonus Karyawan: Rp {calculateTotalEmployeeBonuses().toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Notes and Price Summary */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Catatan Pembayaran</Label>
                <Textarea
                  id="paymentNotes"
                  value={saleForm.paymentNotes}
                  onChange={(e) => setSaleForm({...saleForm, paymentNotes: e.target.value})}
                  placeholder="Catatan khusus pembayaran (opsional)"
                  rows={2}
                />
              </div>

              {/* Price Summary */}
              {saleForm.productId && (
                <div className="bg-pink-50 p-4 rounded-md space-y-2">
                  <h4 className="font-medium text-pink-800">Ringkasan Harga:</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Harga:</span>
                      <span>Rp {calculateAmounts().totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    {saleForm.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Diskon:</span>
                        <span>- Rp {saleForm.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-pink-800 border-t pt-1">
                      <span>Total Akhir:</span>
                      <span>Rp {calculateAmounts().finalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {loading ? 'Menyimpan...' : editingSale ? 'Perbarui Penjualan' : 'Simpan Penjualan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Cashier Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </DialogTitle>
            <DialogDescription>
              Pilih kasir yang akan dicantumkan dalam dokumen cetak
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePrintWithCashier} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cashierId">Kasir *</Label>
              <Select value={selectedCashierId} onValueChange={setSelectedCashierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasir" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paperSize">Ukuran Kertas</Label>
              <Select value={paperSize} onValueChange={(value) => setPaperSize(value as 'A4' | 'A5')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                  <SelectItem value="A5">A5 (148 x 210 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCashierDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data penjualan field trip ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Customer:</span> {selectedSale.customerName}</div>
                <div><span className="font-medium">Produk:</span> {selectedSale.productName}</div>
                <div><span className="font-medium">Total:</span> Rp {selectedSale.finalAmount.toLocaleString('id-ID')}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}