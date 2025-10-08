import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Trash2, Edit, Plus, ShoppingCart, TrendingUp, FileText, Receipt, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'

interface Sale {
  id: string
  invoiceNumber: string
  patientId: string
  patientName: string
  items: Array<{
    productId?: string
    productName: string
    quantity: number
    pricePerUnit: number
    total: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: string
  date: string
  notes?: string
  created_at: string
}

// Helper interface untuk kompatibilitas dengan UI
interface SimpleSale {
  id: string
  productName: string
  category: string
  quantity: number
  pricePerUnit: number
  totalAmount: number
  date: string
  notes?: string
  createdAt: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  description?: string
}

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface SalesProps {
  accessToken: string
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
}

export function SalesWithSearchableProducts({ accessToken, clinicSettings }: SalesProps) {
  const [sales, setSales] = useState<SimpleSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    category: '',
    quantity: 1,
    pricePerUnit: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SimpleSale | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')

  const categories = [
    { value: 'Produk Medis', label: 'Produk Medis' }
  ]

  useEffect(() => {
    fetchSales()
    fetchProducts()
    fetchEmployees()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false)
      }
    }

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProductDropdown])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/sales`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        // Convert complex sale data to simple format for UI
        const simpleSales: SimpleSale[] = (data.sales || []).map((sale: Sale) => {
          const firstItem = sale.items && sale.items.length > 0 ? sale.items[0] : null
          return {
            id: sale.id,
            productName: firstItem ? firstItem.productName : 'Unknown Product',
            category: 'Produk Medis', // Default category
            quantity: firstItem ? firstItem.quantity : 0,
            pricePerUnit: firstItem ? firstItem.pricePerUnit : 0,
            totalAmount: sale.total || 0,
            date: sale.date,
            notes: sale.notes,
            createdAt: sale.created_at
          }
        })
        setSales(simpleSales)
      } else {
        toast.error(data.error || 'Gagal mengambil data penjualan')
      }
    } catch (error) {
      console.log('Error fetching sales:', error)
      toast.error('Gagal mengambil data penjualan')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        // Filter hanya produk medis yang memiliki stok > 0
        const medicalProducts = (data.products || []).filter((product: Product) => 
          product.category === 'Produk Medis' && product.stock > 0
        )
        setProducts(medicalProducts)
      }
    } catch (error) {
      console.log('Error fetching products:', error)
      toast.error('Gagal mengambil data produk')
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching employees:', error)
    }
  }

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  const handleProductSearch = (term: string) => {
    setProductSearchTerm(term)
    setShowProductDropdown(true)
    if (term.trim() === '') {
      setFormData(prev => ({
        ...prev,
        productId: '',
        productName: '',
        category: '',
        pricePerUnit: 0
      }))
    }
  }

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      category: product.category,
      pricePerUnit: product.price
    }))
    setProductSearchTerm(product.name)
    setShowProductDropdown(false)
  }

  const clearProductSelection = () => {
    setFormData(prev => ({
      ...prev,
      productId: '',
      productName: '',
      category: '',
      pricePerUnit: 0
    }))
    setProductSearchTerm('')
    setShowProductDropdown(false)
  }

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      category: '',
      quantity: 1,
      pricePerUnit: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setProductSearchTerm('')
    setShowProductDropdown(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productName.trim() || !formData.category || formData.quantity <= 0 || formData.pricePerUnit <= 0) {
      toast.error('Mohon lengkapi semua field yang diperlukan')
      return
    }

    // Check stock availability
    const selectedProduct = products.find(p => p.id === formData.productId)
    if (selectedProduct && formData.quantity > selectedProduct.stock) {
      toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stock}`)
      return
    }

    const totalAmount = formData.quantity * formData.pricePerUnit

    const saleData = {
      patientId: 'walk-in-customer',
      patientName: 'Walk-in Customer',
      items: [{
        productId: formData.productId,
        productName: formData.productName.trim(),
        quantity: formData.quantity,
        pricePerUnit: formData.pricePerUnit,
        total: totalAmount
      }],
      subtotal: totalAmount,
      discount: 0,
      tax: 0,
      total: totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      date: formData.date,
      notes: formData.notes.trim()
    }

    try {
      const url = editingId ? `${serverUrl}/sales/${editingId}` : `${serverUrl}/sales`
      const method = editingId ? 'PUT' : 'POST'
      
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
        if (data.updatedStock !== undefined) {
          toast.success(
            `${editingId ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan'}. Stok ${formData.productName} tersisa: ${data.updatedStock}`
          )
        } else {
          toast.success(editingId ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan')
        }
        fetchSales()
        fetchProducts() // Refresh product list to show updated stock
        resetForm()
        setDialogOpen(false)
      } else {
        toast.error(data.error || 'Gagal menyimpan data penjualan')
      }
    } catch (error) {
      console.log('Error saving sale:', error)
      toast.error('Gagal menyimpan data penjualan')
    }
  }

  const handleEdit = (sale: SimpleSale) => {
    // Find matching product if it exists in current inventory
    const matchingProduct = products.find(p => p.name === sale.productName)
    
    setFormData({
      productId: matchingProduct?.id || '',
      productName: sale.productName,
      category: sale.category,
      quantity: sale.quantity,
      pricePerUnit: sale.pricePerUnit,
      date: sale.date,
      notes: sale.notes || ''
    })
    setProductSearchTerm(sale.productName)
    setEditingId(sale.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data penjualan ini?')) return

    try {
      const response = await fetch(`${serverUrl}/sales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        toast.success('Penjualan berhasil dihapus')
        fetchSales()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus penjualan')
      }
    } catch (error) {
      console.log('Error deleting sale:', error)
      toast.error('Gagal menghapus penjualan')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Calculate totals
  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-pink-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-pink-200 rounded"></div>
            <div className="h-4 bg-pink-200 rounded w-5/6"></div>
            <div className="h-4 bg-pink-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 mb-1">Total Penjualan</p>
                <p className="text-2xl text-pink-800">{formatCurrency(totalSalesAmount)}</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Total Item Terjual</p>
                <p className="text-2xl text-blue-800">{totalItems}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">Transaksi</p>
                <p className="text-2xl text-green-800">{sales.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="text-green-600 text-lg">#</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Management */}
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-pink-800">Data Penjualan</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={() => {
                    resetForm()
                    fetchProducts() // Refresh products when opening dialog
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Penjualan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-pink-600">
                    {editingId 
                      ? 'Perbarui informasi penjualan produk yang dipilih.' 
                      : 'Lengkapi form berikut untuk mencatat penjualan produk baru.'
                    }
                  </DialogDescription>
                </DialogHeader>
                {products.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Peringatan:</strong> Tidak ada produk medis dengan stok tersedia di inventory. 
                      Silakan tambah produk medis terlebih dahulu di menu Daftar Produk.
                    </p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nama Produk</Label>
                    <div className="relative product-dropdown-container">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Cari produk obat (ketik untuk mencari)..."
                          value={productSearchTerm}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          onFocus={() => setShowProductDropdown(true)}
                          className="border-pink-200 focus:border-pink-500 pr-20"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          {productSearchTerm && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearProductSelection}
                              className="h-6 w-6 p-0 hover:bg-pink-100"
                            >
                              <X className="h-3 w-3 text-pink-600" />
                            </Button>
                          )}
                          <Search className="h-4 w-4 text-pink-400" />
                        </div>
                      </div>
                      
                      {/* Custom Dropdown */}
                      {showProductDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-pink-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {products.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              <div className="text-yellow-600 mb-1">⚠️ Tidak ada produk tersedia</div>
                              <div className="text-xs">Silakan tambah produk di menu Daftar Produk terlebih dahulu</div>
                            </div>
                          ) : filteredProducts.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              <div className="text-blue-600 mb-1">🔍 Tidak ditemukan</div>
                              <div className="text-xs">Coba kata kunci lain untuk mencari produk</div>
                            </div>
                          ) : (
                            <>
                              <div className="p-2 border-b border-pink-100 bg-pink-50">
                                <div className="text-xs text-pink-600 font-medium">
                                  📋 {filteredProducts.length} produk ditemukan
                                </div>
                              </div>
                              {filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => handleProductSelect(product)}
                                  className="p-3 hover:bg-pink-50 cursor-pointer border-b border-pink-50 last:border-b-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900 mb-1">
                                        {product.name}
                                      </div>
                                      <div className="text-xs text-gray-500 mb-1">
                                        Kategori: {product.category}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className={`px-2 py-1 rounded-full ${
                                          product.stock > 10 
                                            ? 'bg-green-100 text-green-700' 
                                            : product.stock > 0 
                                            ? 'bg-yellow-100 text-yellow-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          Stok: {product.stock}
                                        </span>
                                        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                          Rp {product.price.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.productName && (
                      <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        ✅ Produk terpilih: <strong>{formData.productName}</strong>
                        <div className="text-xs text-gray-600 mt-1">
                          Harga: Rp {formData.pricePerUnit.toLocaleString('id-ID')} | Kategori: {formData.category}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <div className="flex items-center h-10 px-3 border border-pink-200 rounded-md bg-pink-50">
                      <span className="text-pink-600 text-sm">{formData.category || 'Produk Medis'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Jumlah</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={formData.productId ? products.find(p => p.id === formData.productId)?.stock || 1 : undefined}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="border-pink-200"
                        disabled={!formData.productId}
                      />
                      {formData.productId && (
                        <div className="text-xs text-gray-600">
                          Max: {products.find(p => p.id === formData.productId)?.stock || 0}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">Harga Satuan</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        min="0"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                        className="border-pink-200"
                        disabled={!formData.productId}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="border-pink-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Tambahkan catatan tentang penjualan ini..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="border-pink-200"
                      rows={2}
                    />
                  </div>
                  
                  {formData.productId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm text-blue-800 mb-2">Ringkasan Penjualan</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Produk:</span>
                          <span className="font-medium">{formData.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jumlah:</span>
                          <span>{formData.quantity} x {formatCurrency(formData.pricePerUnit)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-blue-800 border-t border-blue-200 pt-1">
                          <span>Total:</span>
                          <span>{formatCurrency(formData.quantity * formData.pricePerUnit)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setDialogOpen(false)
                      }}
                      className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={!formData.productId || formData.quantity <= 0}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                    >
                      {editingId ? 'Update' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-pink-50">
                  <TableHead className="text-pink-700">Produk</TableHead>
                  <TableHead className="text-pink-700">Kategori</TableHead>
                  <TableHead className="text-pink-700">Qty</TableHead>
                  <TableHead className="text-pink-700">Harga Satuan</TableHead>
                  <TableHead className="text-pink-700">Total</TableHead>
                  <TableHead className="text-pink-700">Tanggal</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Belum ada data penjualan
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-pink-50/50">
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                          {sale.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sale)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sale.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  )
}