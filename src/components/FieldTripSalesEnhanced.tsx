import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Search, Plus, Edit, Trash2, ShoppingCart, Calendar, User, FileSpreadsheet, Printer, Eye, Receipt, FileText } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'
import { FieldTripDoctorSection } from './FieldTripDoctorSection'
import { FieldTripEmployeeSection } from './FieldTripEmployeeSection'

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
  paymentNotes?: string
  // New fields for doctors and employees
  selectedDoctors?: SelectedFieldTripDoctor[]
  selectedEmployees?: SelectedFieldTripEmployee[]
  totalDoctorFees?: number
  totalEmployeeBonuses?: number
  created_at: string
  updated_at?: string
}

export function FieldTripSalesEnhanced({ accessToken, clinicSettings }: FieldTripSalesProps) {
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
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<FieldTripSale | null>(null)
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
    'Tunai',
    'Transfer Bank',
    'Kartu Kredit',
    'Debit',
    'QRIS',
    'E-Wallet'
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
      if (response.ok && data.success) {
        setSales(data.sales || [])
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

  const calculateAmounts = () => {
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) return { 
      totalAmount: 0, 
      finalAmount: 0, 
      totalDoctorFees: 0, 
      totalEmployeeBonuses: 0 
    }
    
    const totalAmount = selectedProduct.price * saleForm.quantity
    const totalDoctorFees = selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0)
    const totalEmployeeBonuses = selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0)
    const finalAmount = totalAmount - saleForm.discount
    
    return { totalAmount, finalAmount, totalDoctorFees, totalEmployeeBonuses }
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

    const { totalAmount, finalAmount, totalDoctorFees, totalEmployeeBonuses } = calculateAmounts()
    
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

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(saleData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
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
      if (response.ok && data.success) {
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
      paymentNotes: ''
    })
    setSelectedDoctors([])
    setSelectedEmployees([])
    setEditingSale(null)
    setSaleDialogOpen(false)
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerPhone.includes(searchTerm) ||
      sale.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const { totalAmount, finalAmount } = calculateAmounts()

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
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-24">Final</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-44">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                          <div className="font-medium">{sale.customerName}</div>
                          <div className="text-sm text-gray-500">{sale.customerPhone}</div>
                          {sale.organization && (
                            <div className="text-xs text-gray-400">{sale.organization}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.productName}</div>
                          <div className="text-sm text-gray-500">{sale.participants} peserta</div>
                        </div>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>Rp {sale.totalAmount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <div>
                          Rp {sale.finalAmount.toLocaleString('id-ID')}
                          {sale.discount > 0 && (
                            <div className="text-xs text-red-500">
                              Diskon: Rp {sale.discount.toLocaleString('id-ID')}
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
                            onClick={() => generateInvoice(sale)}
                            title="Cetak Invoice"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateReceipt(sale)}
                            title="Cetak Kwitansi"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Receipt className="h-4 w-4" />
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

      {/* Sale Form Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? 'Edit Penjualan Field Trip' : 'Tambah Penjualan Field Trip'}
            </DialogTitle>
            <DialogDescription>
              {editingSale ? 'Perbarui informasi penjualan field trip' : 'Tambahkan penjualan field trip baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Informasi Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Customer *</Label>
                    <Input
                      value={saleForm.customerName}
                      onChange={(e) => setSaleForm({...saleForm, customerName: e.target.value})}
                      placeholder="Nama lengkap customer"
                      required
                    />
                  </div>
                  <div>
                    <Label>No. Telepon *</Label>
                    <Input
                      value={saleForm.customerPhone}
                      onChange={(e) => setSaleForm({...saleForm, customerPhone: e.target.value})}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={saleForm.customerEmail}
                      onChange={(e) => setSaleForm({...saleForm, customerEmail: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label>Organisasi/Instansi</Label>
                    <Input
                      value={saleForm.organization}
                      onChange={(e) => setSaleForm({...saleForm, organization: e.target.value})}
                      placeholder="Nama sekolah/organisasi"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Alamat</Label>
                  <Textarea
                    value={saleForm.customerAddress}
                    onChange={(e) => setSaleForm({...saleForm, customerAddress: e.target.value})}
                    placeholder="Alamat lengkap customer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product & Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Produk & Harga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Produk Field Trip *</Label>
                    <select
                      value={saleForm.productId}
                      onChange={(e) => setSaleForm({...saleForm, productId: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      required
                    >
                      <option value="">Pilih produk...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Rp {product.price.toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Jumlah Peserta *</Label>
                    <Input
                      type="number"
                      value={saleForm.participants}
                      onChange={(e) => setSaleForm({...saleForm, participants: parseInt(e.target.value) || 1})}
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({...saleForm, quantity: parseInt(e.target.value) || 1})}
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Diskon</Label>
                    <Input
                      type="number"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({...saleForm, discount: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Tim Pendamping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldTripDoctorSection
                  doctors={doctors}
                  selectedDoctors={selectedDoctors}
                  onAddDoctor={addDoctor}
                  onUpdateDoctorFee={updateDoctorFee}
                  onRemoveDoctor={removeDoctor}
                />
                
                <FieldTripEmployeeSection
                  employees={employees}
                  selectedEmployees={selectedEmployees}
                  onAddEmployee={addEmployee}
                  onUpdateEmployeeBonus={updateEmployeeBonus}
                  onRemoveEmployee={removeEmployee}
                />
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Detail Kegiatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tanggal Penjualan *</Label>
                    <Input
                      type="date"
                      value={saleForm.saleDate}
                      onChange={(e) => setSaleForm({...saleForm, saleDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tanggal Event</Label>
                    <Input
                      type="date"
                      value={saleForm.eventDate}
                      onChange={(e) => setSaleForm({...saleForm, eventDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status *</Label>
                    <select
                      value={saleForm.status}
                      onChange={(e) => setSaleForm({...saleForm, status: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      required
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Metode Bayar</Label>
                    <select
                      value={saleForm.paymentMethod}
                      onChange={(e) => setSaleForm({...saleForm, paymentMethod: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">Pilih metode bayar...</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label>Catatan</Label>
                  <Textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    placeholder="Catatan tambahan untuk penjualan ini..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Ringkasan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal Paket:</span>
                      <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    {saleForm.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Diskon:</span>
                        <span>-Rp {saleForm.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Customer:</span>
                      <span>Rp {finalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-pink-600">
                      <span>Fee Dokter:</span>
                      <span>Rp {selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Bonus Karyawan:</span>
                      <span>Rp {selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2 text-purple-600">
                      <span>Total Operasional:</span>
                      <span>Rp {(selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0) + selectedEmployees.reduce((sum, employee) => sum + employee.bonus, 0)).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                {loading ? 'Menyimpan...' : (editingSale ? 'Perbarui' : 'Simpan')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Penjualan Field Trip</DialogTitle>
          </DialogHeader>
          
          {viewingSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{viewingSale.customerName}</p>
                  <p className="text-sm text-gray-500">{viewingSale.customerPhone}</p>
                  {viewingSale.organization && (
                    <p className="text-sm text-gray-500">{viewingSale.organization}</p>
                  )}
                </div>
                <div>
                  <Label>Produk</Label>
                  <p className="font-medium">{viewingSale.productName}</p>
                  <p className="text-sm text-gray-500">
                    {viewingSale.quantity} paket × {viewingSale.participants} peserta
                  </p>
                </div>
              </div>
              
              {viewingSale.selectedDoctors && viewingSale.selectedDoctors.length > 0 && (
                <div>
                  <Label>Dokter Pendamping</Label>
                  <div className="space-y-2">
                    {viewingSale.selectedDoctors.map((doctor, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-pink-50 rounded">
                        <div>
                          <span className="font-medium">{doctor.doctorName}</span>
                          <span className="text-sm text-gray-500 ml-2">({doctor.specialization})</span>
                        </div>
                        <span>Fee: Rp {doctor.fee.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingSale.selectedEmployees && viewingSale.selectedEmployees.length > 0 && (
                <div>
                  <Label>Karyawan Pendamping</Label>
                  <div className="space-y-2">
                    {viewingSale.selectedEmployees.map((employee, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <span className="font-medium">{employee.employeeName}</span>
                          <span className="text-sm text-gray-500 ml-2">({employee.position})</span>
                        </div>
                        <span>Bonus: Rp {employee.bonus.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Total Customer</Label>
                  <p className="font-bold">Rp {viewingSale.finalAmount.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label>Total Operasional</Label>
                  <p className="font-bold text-purple-600">
                    Rp {((viewingSale.totalDoctorFees || 0) + (viewingSale.totalEmployeeBonuses || 0)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cashier Selection Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'} Field Trip
            </DialogTitle>
            <DialogDescription>
              Pilih kasir dan konfirmasi tanggal transaksi sebelum mencetak
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kasir *</Label>
              <select
                value={selectedCashier}
                onChange={(e) => setSelectedCashier(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="">Pilih kasir...</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            
            {selectedSaleForPrint && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Detail Transaksi:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Customer:</strong> {selectedSaleForPrint.customerName}</div>
                  <div><strong>Produk:</strong> {selectedSaleForPrint.productName}</div>
                  <div><strong>Total:</strong> Rp {selectedSaleForPrint.finalAmount.toLocaleString('id-ID')}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handlePrintWithCashier} disabled={!selectedCashier}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </Button>
            <Button variant="outline" onClick={() => setCashierDialogOpen(false)}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Helper functions for printing (simplified versions)
  const generateInvoice = (sale: FieldTripSale) => {
    openCashierDialog(sale, 'invoice')
  }

  const generateReceipt = (sale: FieldTripSale) => {
    openCashierDialog(sale, 'receipt')
  }

  const openCashierDialog = (sale: FieldTripSale, type: 'invoice' | 'receipt') => {
    setSelectedSaleForPrint(sale)
    setPrintType(type)
    setTransactionDate(new Date().toISOString().split('T')[0])
    setSelectedCashier('')
    setCashierDialogOpen(true)
  }

  const handlePrintWithCashier = () => {
    if (!selectedCashier || !selectedSaleForPrint) {
      toast.error('Pilih kasir terlebih dahulu')
      return
    }

    const cashierName = employees.find(emp => emp.id === selectedCashier)?.name || ''
    
    if (printType === 'invoice') {
      generateInvoiceWithCashier(selectedSaleForPrint, cashierName, transactionDate)
    } else {
      generateReceiptWithCashier(selectedSaleForPrint, cashierName, transactionDate)
    }
    
    setCashierDialogOpen(false)
  }

  const generateInvoiceWithCashier = (sale: FieldTripSale, cashierName: string, transactionDate: string) => {
    // Implementation will be similar to original but with doctor/employee info
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

    // Doctors and employees sections for invoice
    const doctorsSection = (sale.selectedDoctors && sale.selectedDoctors.length > 0) ? `
      <div style="margin: 20px 0;">
        <h3 style="color: #be185d; margin-bottom: 10px;">Tim Dokter:</h3>
        ${sale.selectedDoctors.map(doctor => `
          <div style="margin: 5px 0; padding: 5px 10px; background: #fce7f3; border-radius: 3px;">
            <strong>${doctor.doctorName}</strong> (${doctor.specialization}) - Fee: Rp ${doctor.fee.toLocaleString('id-ID')}
          </div>
        `).join('')}
        <div style="text-align: right; margin-top: 10px; font-weight: bold; color: #be185d;">
          Total Fee Dokter: Rp ${sale.totalDoctorFees?.toLocaleString('id-ID') || '0'}
        </div>
      </div>
    ` : ''

    const employeesSection = (sale.selectedEmployees && sale.selectedEmployees.length > 0) ? `
      <div style="margin: 20px 0;">
        <h3 style="color: #be185d; margin-bottom: 10px;">Tim Karyawan:</h3>
        ${sale.selectedEmployees.map(employee => `
          <div style="margin: 5px 0; padding: 5px 10px; background: #f0fdf4; border-radius: 3px;">
            <strong>${employee.employeeName}</strong> (${employee.position}) - Bonus: Rp ${employee.bonus.toLocaleString('id-ID')}
          </div>
        `).join('')}
        <div style="text-align: right; margin-top: 10px; font-weight: bold; color: #059669;">
          Total Bonus Karyawan: Rp ${sale.totalEmployeeBonuses?.toLocaleString('id-ID') || '0'}
        </div>
      </div>
    ` : ''

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice Field Trip - ${sale.customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-container { max-width: 210mm; margin: 0 auto; }
            .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #be185d; padding-bottom: 20px; min-height: 140px; }
            .logo { width: 120px; height: 120px; margin-right: 25px; object-fit: contain; }
            .clinic-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #be185d; margin: 0; }
            .clinic-address { font-size: 16px; color: #666; margin-top: 8px; line-height: 1.4; }
            .invoice-title { text-align: center; font-size: 20px; font-weight: bold; color: #be185d; margin: 20px 0; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .customer-info, .transaction-info { flex: 1; }
            .customer-info h3, .transaction-info h3 { margin: 0 0 10px 0; color: #be185d; }
            .info-row { margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #fce7f3; color: #be185d; padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
            .items-table td { padding: 12px; border: 1px solid #ddd; vertical-align: top; }
            .items-table tr:nth-child(even) { background: #fef7ff; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 18px; color: #be185d; border-top: 2px solid #be185d; padding-top: 10px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
              <div class="clinic-info">
                <h1 class="clinic-name">${clinicName}</h1>
                <div class="clinic-address">
                  Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                  Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
                  Telp/WA: 085283228355
                </div>
              </div>
            </div>

            <div class="invoice-title">INVOICE FIELD TRIP</div>

            <div class="invoice-info">
              <div class="customer-info">
                <h3>Informasi Customer:</h3>
                <div class="info-row"><strong>Nama:</strong> ${sale.customerName}</div>
                <div class="info-row"><strong>Telepon:</strong> ${sale.customerPhone}</div>
                ${sale.customerEmail ? `<div class="info-row"><strong>Email:</strong> ${sale.customerEmail}</div>` : ''}
                ${sale.organization ? `<div class="info-row"><strong>Organisasi:</strong> ${sale.organization}</div>` : ''}
              </div>
              <div class="transaction-info">
                <h3>Informasi Transaksi:</h3>
                <div class="info-row"><strong>No. Invoice:</strong> FT-${sale.id.slice(-8).toUpperCase()}</div>
                <div class="info-row"><strong>Tanggal:</strong> ${new Date(transactionDate).toLocaleDateString('id-ID')}</div>
                <div class="info-row"><strong>Kasir:</strong> ${cashierName}</div>
                ${sale.eventDate ? `<div class="info-row"><strong>Tanggal Event:</strong> ${new Date(sale.eventDate).toLocaleDateString('id-ID')}</div>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Paket Field Trip</th>
                  <th>Harga</th>
                  <th>Qty</th>
                  <th>Peserta</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td><strong>${sale.productName}</strong></td>
                  <td>Rp ${sale.productPrice?.toLocaleString('id-ID')}</td>
                  <td>${sale.quantity}</td>
                  <td>${sale.participants} orang</td>
                  <td>Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            ${doctorsSection}
            ${employeesSection}

            <div class="totals">
              <div class="total-row">Subtotal: Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
              ${sale.discount > 0 ? `<div class="total-row">Diskon: -Rp ${sale.discount.toLocaleString('id-ID')}</div>` : ''}
              <div class="total-row grand-total">TOTAL: Rp ${sale.finalAmount.toLocaleString('id-ID')}</div>
            </div>

            <div class="footer">
              <div class="signature">
                <div>Customer</div>
                <div class="signature-line">${sale.customerName}</div>
              </div>
              <div class="signature">
                <div>Kasir</div>
                <div class="signature-line">${cashierName}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `)
    
    invoiceWindow.document.close()
  }

  const generateReceiptWithCashier = (sale: FieldTripSale, cashierName: string, transactionDate: string) => {
    // Similar implementation for receipt
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kwitansi Field Trip - ${sale.customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 15px; }
            .receipt-container { max-width: 148mm; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { width: 100px; height: 100px; object-fit: contain; }
            .clinic-name { font-size: 22px; font-weight: bold; color: #be185d; margin: 8px 0; }
            .receipt-title { font-size: 16px; font-weight: bold; color: #be185d; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .totals { border-top: 2px solid #be185d; padding-top: 10px; margin-top: 15px; }
            .grand-total { font-weight: bold; font-size: 16px; color: #be185d; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
              <div class="clinic-name">${clinicName}</div>
            </div>

            <div class="receipt-title">KWITANSI FIELD TRIP</div>

            <div class="info-row">
              <span>No. Kwitansi:</span>
              <span>FT-${sale.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span>Customer:</span>
              <span>${sale.customerName}</span>
            </div>
            <div class="info-row">
              <span>Produk:</span>
              <span>${sale.productName}</span>
            </div>

            <div class="totals">
              <div class="info-row">
                <span>Subtotal:</span>
                <span>Rp ${sale.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              ${sale.discount > 0 ? `
              <div class="info-row">
                <span>Diskon:</span>
                <span>-Rp ${sale.discount.toLocaleString('id-ID')}</span>
              </div>
              ` : ''}
              <div class="info-row grand-total">
                <span>TOTAL BAYAR:</span>
                <span>Rp ${sale.finalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <div>Kasir: ${cashierName}</div>
              <div>${new Date().toLocaleString('id-ID')}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `)
    
    receiptWindow.document.close()
  }
}