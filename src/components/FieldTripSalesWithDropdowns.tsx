import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Search, Plus, Edit, Trash2, ShoppingCart, Calendar, User, FileSpreadsheet, Printer, Eye, X } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'

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
                      <TableCell>
                        <div className="text-xs">
                          {sale.selectedDoctors && sale.selectedDoctors.length > 0 && (
                            <div className="text-pink-600 mb-1">
                              👨‍⚕️ {sale.selectedDoctors.length} dokter
                            </div>
                          )}
                          {sale.selectedEmployees && sale.selectedEmployees.length > 0 && (
                            <div className="text-green-600">
                              👥 {sale.selectedEmployees.length} karyawan
                            </div>
                          )}
                          {(!sale.selectedDoctors || sale.selectedDoctors.length === 0) && 
                           (!sale.selectedEmployees || sale.selectedEmployees.length === 0) && (
                            <div className="text-gray-400">Tidak ada</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>Rp {sale.totalAmount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <div>
                          <div>Rp {sale.finalAmount.toLocaleString('id-ID')}</div>
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

      {/* Sale Form Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                      min="1"
                      value={saleForm.participants}
                      onChange={(e) => setSaleForm({...saleForm, participants: parseInt(e.target.value) || 1})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({...saleForm, quantity: parseInt(e.target.value) || 1})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Diskon (Rp)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({...saleForm, discount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Total Akhir</Label>
                    <Input
                      value={`Rp ${finalAmount.toLocaleString('id-ID')}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Detail Acara</CardTitle>
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
                    <Label>Tanggal Acara</Label>
                    <Input
                      type="date"
                      value={saleForm.eventDate}
                      onChange={(e) => setSaleForm({...saleForm, eventDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Catatan</Label>
                  <Textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    placeholder="Catatan tambahan..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tim Pendamping - Doctors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Tim Dokter Pendamping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        addDoctor(e.target.value)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Pilih dokter...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedDoctors.length > 0 && (
                  <div className="space-y-2">
                    {selectedDoctors.map((doctor, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{doctor.doctorName}</div>
                          <div className="text-sm text-gray-500">{doctor.specialization}</div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Fee dokter"
                            value={doctor.fee}
                            onChange={(e) => updateDoctorFee(index, parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeDoctor(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tim Pendamping - Employees */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Tim Karyawan Pendamping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        addEmployee(e.target.value)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Pilih karyawan...</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployees.length > 0 && (
                  <div className="space-y-2">
                    {selectedEmployees.map((employee, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{employee.employeeName}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Bonus"
                            value={employee.bonus}
                            onChange={(e) => updateEmployeeBonus(index, parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeEmployee(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment & Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Pembayaran & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Metode Pembayaran</Label>
                    <select
                      value={saleForm.paymentMethod}
                      onChange={(e) => setSaleForm({...saleForm, paymentMethod: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">Pilih metode...</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Status Pembayaran</Label>
                    <select
                      value={saleForm.paymentStatus}
                      onChange={(e) => setSaleForm({...saleForm, paymentStatus: e.target.value as 'lunas' | 'dp'})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      {paymentStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Status Transaksi *</Label>
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
                </div>

                {/* DP Amount Section */}
                {saleForm.paymentStatus === 'dp' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <Label>Jumlah DP *</Label>
                      <Input
                        type="number"
                        min="0"
                        max={finalAmount - 1}
                        value={saleForm.dpAmount}
                        onChange={(e) => setSaleForm({...saleForm, dpAmount: parseInt(e.target.value) || 0})}
                        placeholder="Masukkan jumlah DP"
                        required
                      />
                    </div>
                    <div>
                      <Label>Outstanding Amount</Label>
                      <Input
                        value={`Rp ${outstandingAmount.toLocaleString('id-ID')}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Catatan Pembayaran</Label>
                  <Textarea
                    value={saleForm.paymentNotes}
                    onChange={(e) => setSaleForm({...saleForm, paymentNotes: e.target.value})}
                    placeholder="Catatan pembayaran..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSaleDialogOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {loading ? 'Menyimpan...' : editingSale ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penjualan Field Trip</DialogTitle>
          </DialogHeader>
          
          {viewingSale && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800">Informasi Customer</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama</Label>
                    <p>{viewingSale.customerName}</p>
                  </div>
                  <div>
                    <Label>Telepon</Label>
                    <p>{viewingSale.customerPhone}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{viewingSale.customerEmail || '-'}</p>
                  </div>
                  <div>
                    <Label>Organisasi</Label>
                    <p>{viewingSale.organization || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Alamat</Label>
                    <p>{viewingSale.customerAddress || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Product & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800">Detail Produk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Produk</Label>
                      <p>{viewingSale.productName}</p>
                    </div>
                    <div>
                      <Label>Jumlah Peserta</Label>
                      <p>{viewingSale.participants}</p>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <p>{viewingSale.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Total</Label>
                      <p>Rp {viewingSale.totalAmount.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <Label>Diskon</Label>
                      <p>Rp {viewingSale.discount.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <Label>Total Akhir</Label>
                      <p className="font-semibold">Rp {viewingSale.finalAmount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800">Informasi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Metode Pembayaran</Label>
                      <p>{viewingSale.paymentMethod || '-'}</p>
                    </div>
                    <div>
                      <Label>Status Pembayaran</Label>
                      <Badge variant={viewingSale.paymentStatus === 'dp' ? 'secondary' : 'default'}>
                        {viewingSale.paymentStatus === 'dp' ? 'DP (Down Payment)' : 'Lunas'}
                      </Badge>
                    </div>
                  </div>
                  
                  {viewingSale.paymentStatus === 'dp' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                      <div>
                        <Label>Jumlah DP</Label>
                        <p className="font-medium">Rp {(viewingSale.dpAmount || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <Label>Outstanding Amount</Label>
                        <p className="font-medium text-orange-600">Rp {(viewingSale.outstandingAmount || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tim Pendamping */}
              {((viewingSale.selectedDoctors && viewingSale.selectedDoctors.length > 0) || 
                (viewingSale.selectedEmployees && viewingSale.selectedEmployees.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-pink-800">Tim Pendamping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {viewingSale.selectedDoctors && viewingSale.selectedDoctors.length > 0 && (
                      <div>
                        <Label className="text-pink-600">Dokter Pendamping</Label>
                        <div className="space-y-2 mt-2">
                          {viewingSale.selectedDoctors.map((doctor, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-pink-50 rounded">
                              <div>
                                <div className="font-medium">{doctor.doctorName}</div>
                                <div className="text-sm text-gray-500">{doctor.specialization}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">Rp {doctor.fee.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {viewingSale.selectedEmployees && viewingSale.selectedEmployees.length > 0 && (
                      <div>
                        <Label className="text-green-600">Karyawan Pendamping</Label>
                        <div className="space-y-2 mt-2">
                          {viewingSale.selectedEmployees.map((employee, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                              <div>
                                <div className="font-medium">{employee.employeeName}</div>
                                <div className="text-sm text-gray-500">{employee.position}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">Rp {employee.bonus.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Event & Other Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800">Detail Acara & Lainnya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal Penjualan</Label>
                      <p>{new Date(viewingSale.saleDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <Label>Tanggal Acara</Label>
                      <p>{viewingSale.eventDate ? new Date(viewingSale.eventDate).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <div>
                      <Label>Status Transaksi</Label>
                      <Badge variant={statusOptions.find(s => s.value === viewingSale.status)?.color as any || 'default'}>
                        {statusOptions.find(s => s.value === viewingSale.status)?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {(viewingSale.notes || viewingSale.paymentNotes) && (
                    <div className="space-y-2">
                      {viewingSale.notes && (
                        <div>
                          <Label>Catatan</Label>
                          <p className="text-sm">{viewingSale.notes}</p>
                        </div>
                      )}
                      {viewingSale.paymentNotes && (
                        <div>
                          <Label>Catatan Pembayaran</Label>
                          <p className="text-sm">{viewingSale.paymentNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}