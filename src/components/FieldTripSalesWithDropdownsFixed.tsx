import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Search, Plus, Edit, Trash2, ShoppingCart, Calendar, User, FileSpreadsheet, Printer, Eye, X, Receipt } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'
import { generateFieldTripInvoiceWithCashier, generateFieldTripReceiptWithCashier } from './FieldTripPrintTemplates'

interface FieldTripSalesProps {
  accessToken: string
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
}

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface FieldTripProduct {
  id: string
  name: string
  category: string
  price: number
  unit: string
}

interface FieldTripDoctor {
  id: string
  name: string
  specialization: string
}

interface SelectedFieldTripDoctor {
  doctorId: string
  doctorName: string
  specialization: string
  fee: number
}

interface SelectedFieldTripEmployee {
  employeeId: string
  employeeName: string
  position: string
  bonus: number
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
  quantity: number
  totalAmount: number
  discount: number
  finalAmount: number
  saleDate: string
  eventDate?: string
  participants: number
  notes?: string
  status: 'draft' | 'confirmed' | 'paid' | 'completed' | 'cancelled'
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp'
  dpAmount?: number
  outstandingAmount?: number
  paymentNotes?: string
  // Fields for doctors and employees
  selectedDoctors?: SelectedFieldTripDoctor[]
  selectedEmployees?: SelectedFieldTripEmployee[]
  totalDoctorFees?: number
  totalEmployeeBonuses?: number
  created_at: string
  updated_at?: string
}

export function FieldTripSalesWithDropdowns({ accessToken, clinicSettings }: FieldTripSalesProps) {
  const [sales, setSales] = useState<FieldTripSale[]>([])
  const [products, setProducts] = useState<FieldTripProduct[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [doctors, setDoctors] = useState<FieldTripDoctor[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialog states
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<FieldTripSale | null>(null)
  const [viewingSale, setViewingSale] = useState<FieldTripSale | null>(null)
  
  // Cashier Dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<FieldTripSale | null>(null)
  const [cashierName, setCashierName] = useState('')
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')
  
  // Form state
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    organization: '',
    productId: '',
    quantity: 1,
    discount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    eventDate: '',
    participants: 1,
    notes: '',
    status: 'draft' as const,
    paymentMethod: '',
    paymentStatus: 'lunas' as const,
    dpAmount: 0,
    paymentNotes: ''
  })

  // Doctor and Employee selection states
  const [selectedDoctors, setSelectedDoctors] = useState<SelectedFieldTripDoctor[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedFieldTripEmployee[]>([])

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'secondary' },
    { value: 'confirmed', label: 'Terkonfirmasi', color: 'default' },
    { value: 'paid', label: 'Lunas', color: 'default' },
    { value: 'completed', label: 'Selesai', color: 'default' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'destructive' }
  ]

  const paymentMethods = [
    'Cash',
    'Debit',
    'QRIS',
    'Credit Card'
  ]

  const paymentStatusOptions = [
    { value: 'lunas', label: 'Lunas' },
    { value: 'dp', label: 'DP (Down Payment)' }
  ]

  useEffect(() => {
    fetchSales()
    fetchProducts()
    fetchEmployees()
    fetchDoctors()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/field-trip-sales`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      console.log('Field trip sales response:', data)
      if (response.ok) {
        // Handle response format from server
        const salesData = data.sales || []
        console.log('Sales data loaded:', salesData.length)
        if (salesData.length > 0) {
          console.log('Sample sale data:', salesData[0])
        }
        setSales(salesData)
      } else {
        console.log('Error response:', data)
        toast.error(data.error || 'Gagal mengambil data penjualan field trip')
      }
    } catch (error) {
      console.log('Error fetching field trip sales:', error)
      toast.error('Gagal mengambil data penjualan field trip')
    } finally {
      setLoading(false)
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
      if (response.ok && data.success) {
        setProducts(data.products?.filter((p: FieldTripProduct) => p.isActive) || [])
      }
    } catch (error) {
      console.log('Error fetching field trip products:', error)
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

  // Fixed filter function with null checks
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

  const calculateAmounts = () => {
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) return { 
      totalAmount: 0, 
      finalAmount: 0, 
      totalDoctorFees: 0, 
      totalEmployeeBonuses: 0,
      outstandingAmount: 0
    }
    
    const totalAmount = selectedProduct.price * saleForm.quantity
    const totalDoctorFees = selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0)
    const totalEmployeeBonuses = selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0)
    const finalAmount = totalAmount - saleForm.discount
    const outstandingAmount = saleForm.paymentStatus === 'dp' ? finalAmount - saleForm.dpAmount : 0
    
    return { totalAmount, finalAmount, totalDoctorFees, totalEmployeeBonuses, outstandingAmount }
  }

  // Doctor management functions
  const addDoctor = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (!doctor) return
    
    // Check if doctor already selected
    if (selectedDoctors.find(d => d.doctorId === doctorId)) {
      toast.error('Dokter sudah dipilih')
      return
    }
    
    const newDoctor: SelectedFieldTripDoctor = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      fee: 0
    }
    
    setSelectedDoctors([...selectedDoctors, newDoctor])
  }

  const updateDoctorFee = (index: number, fee: number) => {
    const updatedDoctors = [...selectedDoctors]
    updatedDoctors[index].fee = fee
    setSelectedDoctors(updatedDoctors)
  }

  const removeDoctor = (index: number) => {
    setSelectedDoctors(selectedDoctors.filter((_, i) => i !== index))
  }

  // Employee management functions
  const addEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return
    
    // Check if employee already selected
    if (selectedEmployees.find(e => e.employeeId === employeeId)) {
      toast.error('Karyawan sudah dipilih')
      return
    }
    
    const newEmployee: SelectedFieldTripEmployee = {
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      bonus: 0
    }
    
    setSelectedEmployees([...selectedEmployees, newEmployee])
  }

  const updateEmployeeBonus = (index: number, bonus: number) => {
    const updatedEmployees = [...selectedEmployees]
    updatedEmployees[index].bonus = bonus
    setSelectedEmployees(updatedEmployees)
  }

  const removeEmployee = (index: number) => {
    setSelectedEmployees(selectedEmployees.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) {
      toast.error('Produk harus dipilih')
      return
    }

    if (saleForm.paymentStatus === 'dp' && saleForm.dpAmount >= calculateAmounts().finalAmount) {
      toast.error('Jumlah DP tidak boleh lebih besar atau sama dengan total akhir')
      return
    }

    const { totalAmount, finalAmount, totalDoctorFees, totalEmployeeBonuses, outstandingAmount } = calculateAmounts()
    
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
        outstandingAmount,
        selectedDoctors,
        selectedEmployees,
        totalDoctorFees,
        totalEmployeeBonuses
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(saleData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(editingSale ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan')
        fetchSales()
        resetForm()
      } else {
        toast.error(data.error || 'Gagal menyimpan penjualan')
      }
    } catch (error) {
      console.log('Error saving sale:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sale: FieldTripSale) => {
    if (!confirm(`Hapus penjualan untuk ${sale.customerName}?`)) return

    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/field-trip-sales/${sale.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Penjualan berhasil dihapus')
        fetchSales()
      } else {
        toast.error(data.error || 'Gagal menghapus penjualan')
      }
    } catch (error) {
      console.log('Error deleting sale:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const openSaleDialog = (sale?: FieldTripSale) => {
    if (sale) {
      setEditingSale(sale)
      setSaleForm({
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerEmail: sale.customerEmail || '',
        customerAddress: sale.customerAddress || '',
        organization: sale.organization || '',
        productId: sale.productId,
        quantity: sale.quantity,
        discount: sale.discount,
        saleDate: sale.saleDate,
        eventDate: sale.eventDate || '',
        participants: sale.participants,
        notes: sale.notes || '',
        status: sale.status,
        paymentMethod: sale.paymentMethod || '',
        paymentStatus: sale.paymentStatus || 'lunas',
        dpAmount: sale.dpAmount || 0,
        paymentNotes: sale.paymentNotes || ''
      })
      setSelectedDoctors(sale.selectedDoctors || [])
      setSelectedEmployees(sale.selectedEmployees || [])
    } else {
      setEditingSale(null)
      resetForm()
    }
    setSaleDialogOpen(true)
  }

  const openDetailDialog = (sale: FieldTripSale) => {
    setViewingSale(sale)
    setDetailDialogOpen(true)
  }

  const resetForm = () => {
    setSaleForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      organization: '',
      productId: '',
      quantity: 1,
      discount: 0,
      saleDate: new Date().toISOString().split('T')[0],
      eventDate: '',
      participants: 1,
      notes: '',
      status: 'draft',
      paymentMethod: '',
      paymentStatus: 'lunas',
      dpAmount: 0,
      paymentNotes: ''
    })
    setSelectedDoctors([])
    setSelectedEmployees([])
    setEditingSale(null)
    setSaleDialogOpen(false)
  }

  // Print Functions
  const openCashierDialog = (sale: FieldTripSale, type: 'invoice' | 'receipt') => {
    setSelectedSaleForPrint(sale)
    setPrintType(type)
    setCashierName('')
    setCashierDialogOpen(true)
  }

  const handlePrintWithCashier = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSaleForPrint || !cashierName.trim()) {
      toast.error('Nama kasir harus diisi')
      return
    }

    // Transform field trip sale to match print template interface
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
        quantity: selectedSaleForPrint.quantity,
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

    if (printType === 'invoice') {
      generateFieldTripInvoiceWithCashier(saleForPrint, cashierName, transactionDate, clinicSettings)
    } else {
      generateFieldTripReceiptWithCashier(saleForPrint, cashierName, transactionDate, clinicSettings)
    }

    setCashierDialogOpen(false)
    setCashierName('')
    setSelectedSaleForPrint(null)
    
    toast.success(`${printType === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil dicetak`)
  }

  const { totalAmount, finalAmount, outstandingAmount } = calculateAmounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-pink-600" />
              <CardTitle className="text-pink-800">Kelola Transaksi Field Trip</CardTitle>
            </div>
            <Button 
              onClick={() => openSaleDialog()}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penjualan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
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
            <Button variant="outline" onClick={() => window.location.reload()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
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
                  <TableHead className="w-24">Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-16">Qty</TableHead>
                  <TableHead className="w-32">Tim Pendamping</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Final</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Belum ada data penjualan field trip
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale, index) => (
                    <TableRow key={sale.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(sale.saleDate).toLocaleDateString('id-ID')}</div>
                          {sale.eventDate && (
                            <div className="text-xs text-gray-500">
                              Event: {new Date(sale.eventDate).toLocaleDateString('id-ID')}
                            </div>
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
                        </div>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {sale.selectedDoctors && sale.selectedDoctors.length > 0 && (
                            <div className="text-pink-600 mb-1">
                              <div>👨‍⚕️ {sale.selectedDoctors.length} dokter</div>
                              <div className="text-xs text-pink-500">
                                Fee: Rp {(sale.totalDoctorFees || 0).toLocaleString('id-ID')}
                              </div>
                            </div>
                          )}
                          {sale.selectedEmployees && sale.selectedEmployees.length > 0 && (
                            <div className="text-green-600">
                              <div>👥 {sale.selectedEmployees.length} karyawan</div>
                              <div className="text-xs text-green-500">
                                Bonus: Rp {(sale.totalEmployeeBonuses || 0).toLocaleString('id-ID')}
                              </div>
                            </div>
                          )}
                          {(!sale.selectedDoctors || sale.selectedDoctors.length === 0) && 
                           (!sale.selectedEmployees || sale.selectedEmployees.length === 0) && (
                            <div className="text-gray-400">Tidak ada</div>
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
                              {sale.paymentMethod} • {sale.paymentStatus === 'dp' ? 'DP' : 'Lunas'}
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
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailDialog(sale)}
                            title="Lihat Detail"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSaleDialog(sale)}
                            title="Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(sale)}
                            title="Hapus"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Field Trip Sales Form Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? 'Edit Penjualan Field Trip' : 'Tambah Penjualan Field Trip'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi formulir penjualan field trip di bawah ini
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-pink-800">Informasi Customer</h3>
                
                <div>
                  <Label htmlFor="customerName">Nama Customer *</Label>
                  <Input
                    id="customerName"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Telepon Customer *</Label>
                  <Input
                    id="customerPhone"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email Customer</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={saleForm.customerEmail}
                    onChange={(e) => setSaleForm({ ...saleForm, customerEmail: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="organization">Organisasi/Instansi</Label>
                  <Input
                    id="organization"
                    value={saleForm.organization}
                    onChange={(e) => setSaleForm({ ...saleForm, organization: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerAddress">Alamat Customer</Label>
                  <Textarea
                    id="customerAddress"
                    value={saleForm.customerAddress}
                    onChange={(e) => setSaleForm({ ...saleForm, customerAddress: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Product and Event Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-pink-800">Informasi Produk & Event</h3>
                
                <div>
                  <Label htmlFor="productId">Produk Field Trip *</Label>
                  <select
                    id="productId"
                    value={saleForm.productId}
                    onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - Rp {product.price.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="participants">Jumlah Peserta *</Label>
                    <Input
                      id="participants"
                      type="number"
                      min="1"
                      value={saleForm.participants}
                      onChange={(e) => setSaleForm({ ...saleForm, participants: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="saleDate">Tanggal Penjualan *</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={saleForm.saleDate}
                      onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="eventDate">Tanggal Event</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={saleForm.eventDate}
                      onChange={(e) => setSaleForm({ ...saleForm, eventDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={saleForm.status}
                    onChange={(e) => setSaleForm({ ...saleForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-pink-800 mb-4">Informasi Pembayaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount">Diskon (Rp)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    value={saleForm.discount}
                    onChange={(e) => setSaleForm({ ...saleForm, discount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                  <select
                    id="paymentMethod"
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Pilih Metode</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="paymentStatus">Status Pembayaran</Label>
                  <select
                    id="paymentStatus"
                    value={saleForm.paymentStatus}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {paymentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {saleForm.paymentStatus === 'dp' && (
                <div className="mt-4">
                  <Label htmlFor="dpAmount">Jumlah DP (Rp) *</Label>
                  <Input
                    id="dpAmount"
                    type="number"
                    min="0"
                    value={saleForm.dpAmount}
                    onChange={(e) => setSaleForm({ ...saleForm, dpAmount: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              )}
              
              <div className="mt-4">
                <Label htmlFor="paymentNotes">Catatan Pembayaran</Label>
                <Textarea
                  id="paymentNotes"
                  value={saleForm.paymentNotes}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Price Summary */}
            {saleForm.productId && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2">Ringkasan Harga</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Harga Produk:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {saleForm.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span>- Rp {saleForm.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  {/* Tim Pendamping Costs */}
                  {(selectedDoctors.length > 0 || selectedEmployees.length > 0) && (
                    <>
                      <div className="border-t border-pink-200 my-2"></div>
                      <div className="text-xs text-pink-700 font-medium mb-1">Biaya Tim Pendamping:</div>
                      {selectedDoctors.length > 0 && (
                        <div className="flex justify-between text-pink-600">
                          <span>• Fee Dokter ({selectedDoctors.length} orang):</span>
                          <span>Rp {selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {selectedEmployees.length > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>• Bonus Karyawan ({selectedEmployees.length} orang):</span>
                          <span>Rp {selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="border-t border-pink-200 my-2"></div>
                  <div className="flex justify-between font-medium text-pink-800">
                    <span>Total Akhir:</span>
                    <span>Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {saleForm.paymentStatus === 'dp' && saleForm.dpAmount > 0 && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>DP Dibayar:</span>
                        <span>Rp {saleForm.dpAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 font-medium">
                        <span>Outstanding:</span>
                        <span>Rp {outstandingAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Doctor Management Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-pink-800 mb-4">Tim Dokter Pendamping</h3>
              
              {/* Add Doctor */}
              <div className="flex gap-2 mb-4">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      addDoctor(e.target.value)
                      e.target.value = '' // Reset dropdown
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Pilih Dokter Pendamping</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Tambah Dokter"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected Doctors List */}
              {selectedDoctors.length > 0 && (
                <div className="space-y-2">
                  <Label>Dokter Terpilih:</Label>
                  {selectedDoctors.map((doctor, index) => (
                    <div key={index} className="bg-pink-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-pink-800">{doctor.doctorName}</span>
                          <span className="text-sm text-gray-600 ml-2">({doctor.specialization})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDoctor(index)}
                          className="h-8 w-8 p-0"
                          title="Hapus Dokter"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`doctorFee_${index}`} className="text-sm">Fee Kegiatan:</Label>
                        <Input
                          id={`doctorFee_${index}`}
                          type="number"
                          min="0"
                          value={doctor.fee}
                          onChange={(e) => updateDoctorFee(index, parseInt(e.target.value) || 0)}
                          className="w-32"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">Rupiah</span>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-pink-600 font-medium">
                    Total Fee Dokter: Rp {selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>

            {/* Employee Management Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-pink-800 mb-4">Tim Karyawan Pendamping</h3>
              
              {/* Add Employee */}
              <div className="flex gap-2 mb-4">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      addEmployee(e.target.value)
                      e.target.value = '' // Reset dropdown
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Pilih Karyawan Pendamping</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Tambah Karyawan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected Employees List */}
              {selectedEmployees.length > 0 && (
                <div className="space-y-2">
                  <Label>Karyawan Terpilih:</Label>
                  {selectedEmployees.map((employee, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-green-800">{employee.employeeName}</span>
                          <span className="text-sm text-gray-600 ml-2">({employee.position})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmployee(index)}
                          className="h-8 w-8 p-0"
                          title="Hapus Karyawan"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`employeeBonus_${index}`} className="text-sm">Bonus Kegiatan:</Label>
                        <Input
                          id={`employeeBonus_${index}`}
                          type="number"
                          min="0"
                          value={employee.bonus}
                          onChange={(e) => updateEmployeeBonus(index, parseInt(e.target.value) || 0)}
                          className="w-32"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">Rupiah</span>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-green-600 font-medium">
                    Total Bonus Karyawan: Rp {selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                rows={3}
                placeholder="Catatan khusus untuk penjualan ini..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                {loading ? 'Menyimpan...' : (editingSale ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penjualan Field Trip</DialogTitle>
            <DialogDescription>
              Informasi lengkap penjualan field trip
            </DialogDescription>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2">Informasi Customer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Nama:</strong> {viewingSale.customerName}</div>
                  <div><strong>Telepon:</strong> {viewingSale.customerPhone || '-'}</div>
                  <div><strong>Email:</strong> {viewingSale.customerEmail || '-'}</div>
                  <div><strong>Organisasi:</strong> {viewingSale.organization || '-'}</div>
                  {viewingSale.customerAddress && (
                    <div className="col-span-2"><strong>Alamat:</strong> {viewingSale.customerAddress}</div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Informasi Produk & Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Produk:</strong> {viewingSale.productName || 'Tidak ada'}</div>
                  <div><strong>Quantity:</strong> {viewingSale.quantity}</div>
                  <div><strong>Peserta:</strong> {viewingSale.participants} orang</div>
                  <div><strong>Status:</strong> 
                    <Badge className="ml-2" variant={statusOptions.find(s => s.value === viewingSale.status)?.color as any || 'default'}>
                      {statusOptions.find(s => s.value === viewingSale.status)?.label}
                    </Badge>
                  </div>
                  <div><strong>Tanggal Penjualan:</strong> {new Date(viewingSale.saleDate).toLocaleDateString('id-ID')}</div>
                  {viewingSale.eventDate && (
                    <div><strong>Tanggal Event:</strong> {new Date(viewingSale.eventDate).toLocaleDateString('id-ID')}</div>
                  )}
                </div>
              </div>

              {/* Team Information */}
              {((viewingSale.selectedDoctors && viewingSale.selectedDoctors.length > 0) || 
                (viewingSale.selectedEmployees && viewingSale.selectedEmployees.length > 0)) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Tim Pendamping</h4>
                  
                  {viewingSale.selectedDoctors && viewingSale.selectedDoctors.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-pink-700 mb-2">Dokter ({viewingSale.selectedDoctors.length} orang):</h5>
                      <div className="space-y-1">
                        {viewingSale.selectedDoctors.map((doctor, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded">
                            <div>
                              <span className="font-medium">{doctor.doctorName}</span>
                              <span className="text-sm text-gray-600 ml-2">({doctor.specialization})</span>
                            </div>
                            <span className="text-pink-600 font-medium">
                              Rp {doctor.fee.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                        <div className="text-right text-pink-700 font-medium">
                          Total Fee Dokter: Rp {(viewingSale.totalDoctorFees || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingSale.selectedEmployees && viewingSale.selectedEmployees.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">Karyawan ({viewingSale.selectedEmployees.length} orang):</h5>
                      <div className="space-y-1">
                        {viewingSale.selectedEmployees.map((employee, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded">
                            <div>
                              <span className="font-medium">{employee.employeeName}</span>
                              <span className="text-sm text-gray-600 ml-2">({employee.position})</span>
                            </div>
                            <span className="text-green-600 font-medium">
                              Rp {employee.bonus.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                        <div className="text-right text-green-700 font-medium">
                          Total Bonus Karyawan: Rp {(viewingSale.totalEmployeeBonuses || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Informasi Pembayaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Total Harga:</strong> Rp {(viewingSale.totalAmount || 0).toLocaleString('id-ID')}</div>
                  {viewingSale.discount > 0 && (
                    <div><strong>Diskon:</strong> <span className="text-red-600">Rp {viewingSale.discount.toLocaleString('id-ID')}</span></div>
                  )}
                  <div><strong>Total Akhir:</strong> <span className="font-medium">Rp {(viewingSale.finalAmount || 0).toLocaleString('id-ID')}</span></div>
                  {viewingSale.paymentMethod && (
                    <div><strong>Metode Pembayaran:</strong> {viewingSale.paymentMethod}</div>
                  )}
                  <div><strong>Status Pembayaran:</strong> 
                    <span className={viewingSale.paymentStatus === 'dp' ? 'text-orange-600' : 'text-green-600'}>
                      {viewingSale.paymentStatus === 'dp' ? 'DP' : 'Lunas'}
                    </span>
                  </div>
                  {viewingSale.paymentStatus === 'dp' && viewingSale.dpAmount && (
                    <>
                      <div><strong>DP Dibayar:</strong> <span className="text-blue-600">Rp {viewingSale.dpAmount.toLocaleString('id-ID')}</span></div>
                      <div><strong>Outstanding:</strong> <span className="text-orange-600 font-medium">Rp {(viewingSale.outstandingAmount || 0).toLocaleString('id-ID')}</span></div>
                    </>
                  )}
                </div>
                {viewingSale.paymentNotes && (
                  <div className="mt-2"><strong>Catatan Pembayaran:</strong> {viewingSale.paymentNotes}</div>
                )}
              </div>

              {/* Notes */}
              {viewingSale.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Catatan Tambahan</h4>
                  <p className="text-sm">{viewingSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}