import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Search, Plus, Edit, Trash2, ShoppingCart, FileSpreadsheet, Printer, Eye, Receipt } from 'lucide-react'
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
  selectedDoctors?: any[]
  selectedEmployees?: any[]
  totalDoctorFees?: number
  totalEmployeeBonuses?: number
  created_at: string
  updated_at?: string
}

export function FieldTripSalesWithPrint({ accessToken, clinicSettings }: FieldTripSalesProps) {
  const [sales, setSales] = useState<FieldTripSale[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<FieldTripSale | null>(null)
  const [cashierName, setCashierName] = useState('')
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4')
  
  // Edit/Delete dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<FieldTripSale | null>(null)

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'secondary' },
    { value: 'confirmed', label: 'Terkonfirmasi', color: 'default' },
    { value: 'paid', label: 'Lunas', color: 'default' },
    { value: 'completed', label: 'Selesai', color: 'default' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'destructive' }
  ]

  useEffect(() => {
    fetchSales()
    fetchEmployees()
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

  const openCashierDialog = (sale: FieldTripSale, type: 'invoice' | 'receipt') => {
    setSelectedSaleForPrint(sale)
    setPrintType(type)
    setCashierName('')
    setPaperSize('A4') // Default ke A4
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

    if (paperSize === 'A4') {
      if (printType === 'invoice') {
        generateFieldTripInvoiceA4(saleForPrint, cashierName, transactionDate, clinicSettings)
      } else {
        generateFieldTripReceiptA4(saleForPrint, cashierName, transactionDate, clinicSettings)
      }
    } else {
      if (printType === 'invoice') {
        generateFieldTripInvoiceWithCashier(saleForPrint, cashierName, transactionDate, clinicSettings)
      } else {
        generateFieldTripReceiptWithCashier(saleForPrint, cashierName, transactionDate, clinicSettings)
      }
    }

    setCashierDialogOpen(false)
    setCashierName('')
    setPaperSize('A4')
    setSelectedSaleForPrint(null)
    
    toast.success(`${printType === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil dicetak (${paperSize})`)
  }

  const handleEdit = (sale: FieldTripSale) => {
    setSelectedSale(sale)
    setEditDialogOpen(true)
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
                  <TableHead className="w-24">Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-16">Qty</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Final</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-40">Aksi</TableHead>
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
                        <div className="flex gap-1 flex-wrap">
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
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

      {/* Cashier Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </DialogTitle>
            <DialogDescription>
              Masukkan nama kasir yang akan dicetak pada {printType === 'invoice' ? 'invoice' : 'kwitansi'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePrintWithCashier} className="space-y-4">
            <div>
              <Label htmlFor="cashierName">Nama Kasir *</Label>
              <select
                id="cashierName"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
              >
                <option value="">Pilih Kasir...</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="paperSize">Ukuran Kertas *</Label>
              <select
                id="paperSize"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'A4' | 'A5')}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
              >
                <option value="A4">A4 - Format Profesional (210 x 297mm)</option>
                <option value="A5">A5 - Format Kompak (148 x 210mm)</option>
              </select>
            </div>
            
            {selectedSaleForPrint && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                <div className="text-sm">
                  <div className="font-medium text-pink-800">Detail Transaksi:</div>
                  <div className="mt-1 space-y-1">
                    <div>Customer: {selectedSaleForPrint.customerName}</div>
                    <div>Produk: {selectedSaleForPrint.productName}</div>
                    <div>Total: Rp {selectedSaleForPrint.finalAmount.toLocaleString('id-ID')}</div>
                    <div>Tanggal: {new Date(selectedSaleForPrint.saleDate).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCashierDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'} ({paperSize})
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}