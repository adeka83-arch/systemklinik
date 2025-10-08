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
import { Trash2, Edit, Plus, ShoppingCart, TrendingUp, FileText, Receipt, Percent, Calculator, Search, X } from 'lucide-react'
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
  discountType: 'percentage' | 'amount'
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
  subtotal: number
  discount: number
  discountType: 'percentage' | 'amount'
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

// Custom SearchableProductSelect Component
function SearchableProductSelect({ 
  products, 
  value, 
  onSelect, 
  placeholder = "Cari produk obat (ketik untuk mencari)...",
  formatCurrency 
}: {
  products: Product[]
  value: string
  onSelect: (product: Product) => void
  placeholder?: string
  formatCurrency: (amount: number) => string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Find selected product name for display
  const selectedProduct = products.find(p => p.id === value)
  const displayValue = selectedProduct ? selectedProduct.name : ''

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setShowDropdown(true)
  }

  const handleProductSelect = (product: Product) => {
    onSelect(product)
    setSearchTerm(product.name)
    setShowDropdown(false)
  }

  const clearSelection = () => {
    setSearchTerm('')
    setShowDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.product-search-container')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Update search term when value changes externally
  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name)
    } else {
      setSearchTerm('')
    }
  }, [selectedProduct])

  return (
    <div className="relative product-search-container">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="border-pink-200 focus:border-pink-500 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 w-6 p-0 hover:bg-pink-100"
            >
              <X className="h-3 w-3 text-pink-600" />
            </Button>
          )}
          <Search className="h-4 w-4 text-pink-400" />
        </div>
      </div>
      
      {/* Custom Dropdown */}
      {showDropdown && (
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
                          {formatCurrency(product.price)}
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
  )
}

export function SalesWithSearchFilter({ accessToken, clinicSettings }: SalesProps) {
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
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'amount',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SimpleSale | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')

  const categories = [
    { value: 'Produk Medis', label: 'Produk Medis' },
    { value: 'Obat', label: 'Obat' }
  ]

  useEffect(() => {
    fetchSales()
    fetchProducts()
    fetchEmployees()
  }, [])

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
            category: sale.category || 'Produk Medis', // Use saved category or default
            quantity: firstItem ? firstItem.quantity : 0,
            pricePerUnit: firstItem ? firstItem.pricePerUnit : 0,
            subtotal: sale.subtotal || 0,
            discount: sale.discount || 0,
            discountType: sale.discountType || 'percentage',
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
        // Filter produk medis DAN obat yang memiliki stok > 0
        const availableProducts = (data.products || []).filter((product: Product) => 
          (product.category === 'Produk Medis' || product.category === 'Obat') && product.stock > 0
        )
        setProducts(availableProducts)
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

  // Fungsi untuk menghitung subtotal, diskon, dan total
  const calculateTotals = () => {
    const subtotal = formData.quantity * formData.pricePerUnit
    let discountAmount = 0
    
    if (formData.discount > 0) {
      if (formData.discountType === 'percentage') {
        // Validasi persentase diskon maksimal 100%
        const validDiscount = Math.min(formData.discount, 100)
        discountAmount = (subtotal * validDiscount) / 100
      } else {
        // Validasi diskon nominal tidak boleh melebihi subtotal
        discountAmount = Math.min(formData.discount, subtotal)
      }
    }
    
    const total = subtotal - discountAmount
    
    return {
      subtotal,
      discountAmount,
      total: Math.max(total, 0) // Pastikan total tidak negatif
    }
  }

  const { subtotal, discountAmount, total } = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productName.trim() || !formData.category || formData.quantity <= 0 || formData.pricePerUnit <= 0) {
      toast.error('Mohon lengkapi semua field yang diperlukan')
      return
    }

    // Validasi diskon
    if (formData.discount < 0) {
      toast.error('Diskon tidak boleh negatif')
      return
    }
    
    if (formData.discountType === 'percentage' && formData.discount > 100) {
      toast.error('Diskon persentase tidak boleh lebih dari 100%')
      return
    }
    
    if (formData.discountType === 'amount' && formData.discount > subtotal) {
      toast.error('Diskon nominal tidak boleh melebihi subtotal')
      return
    }

    // Check stock availability for products from inventory
    const selectedProduct = products.find(p => p.id === formData.productId)
    if (selectedProduct) {
      if (formData.quantity > selectedProduct.stock) {
        toast.error(`🚫 Stok tidak mencukupi! Stok tersedia: ${selectedProduct.stock} ${selectedProduct.category}`)
        return
      }
      
      // Warning for low stock
      if (selectedProduct.stock - formData.quantity <= 5 && selectedProduct.stock - formData.quantity > 0) {
        toast.warning(`⚠️ Peringatan: Setelah penjualan ini, stok ${selectedProduct.name} akan tinggal ${selectedProduct.stock - formData.quantity}`)
      }
    }

    const saleData = {
      patientId: 'walk-in-customer',
      patientName: 'Walk-in Customer',
      items: [{
        productId: formData.productId,
        productName: formData.productName.trim(),
        quantity: formData.quantity,
        pricePerUnit: formData.pricePerUnit,
        total: total
      }],
      subtotal: subtotal,
      discount: discountAmount,
      discountType: formData.discountType,
      tax: 0,
      total: total,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      date: formData.date,
      notes: formData.notes.trim(),
      category: formData.category
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
        
        // Refresh data to show updated stock and sales
        console.log('🔄 Refreshing sales and product data after transaction...')
        await Promise.all([
          fetchSales(),
          fetchProducts() // Critical: refresh to show updated stock levels
        ])
        console.log('✅ Data refresh completed')
        
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
      discount: sale.discountType === 'percentage' 
        ? (sale.discount / sale.subtotal * 100) 
        : sale.discount,
      discountType: sale.discountType,
      date: sale.date,
      notes: sale.notes || ''
    })
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
        const data = await response.json()
        if (data.restoredStock !== undefined) {
          toast.success(`Penjualan berhasil dihapus. Stok dikembalikan: ${data.restoredStock}`)
        } else {
          toast.success('Penjualan berhasil dihapus')
        }
        
        // Refresh data to show restored stock levels
        console.log('🔄 Refreshing data after sale deletion (stock restoration)...')
        await Promise.all([
          fetchSales(),
          fetchProducts() // Critical: refresh to show restored stock levels
        ])
        console.log('✅ Stock restoration refresh completed')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus penjualan')
      }
    } catch (error) {
      console.log('Error deleting sale:', error)
      toast.error('Gagal menghapus penjualan')
    }
  }

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      category: '',
      quantity: 1,
      pricePerUnit: 0,
      discount: 0,
      discountType: 'percentage',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setEditingId(null)
  }

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      category: product.category,
      pricePerUnit: product.price
    }))
    
    // Show stock warning if low
    if (product.stock <= 5) {
      toast.warning(`⚠️ Stok ${product.name} rendah: ${product.stock} tersisa`)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Produk Medis': 'bg-gray-100 text-gray-800',
      'Obat': 'bg-blue-100 text-blue-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  // Calculate totals for display
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Penjualan</p>
                <p className="text-2xl">{formatCurrency(totalSalesAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-2xl">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header dengan Tombol Tambah */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl text-pink-800 mb-2">Manajemen Penjualan</h2>
          <p className="text-pink-600">Kelola data penjualan produk medis & obat dengan fitur diskon dan manajemen stok otomatis</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true) }} className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penjualan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-pink-800">
                {editingId ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
              </DialogTitle>
              <DialogDescription>
                Masukkan detail penjualan produk medis atau obat (stok akan otomatis berkurang)
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Pilih Produk</Label>
                  <SearchableProductSelect
                    products={products}
                    value={formData.productId}
                    onSelect={handleProductSelect}
                    formatCurrency={formatCurrency}
                    placeholder="Cari produk medis atau obat (ketik untuk mencari)..."
                  />
                </div>

                <div>
                  <Label htmlFor="productName">Nama Produk Manual</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerUnit">Harga Satuan</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Section Diskon */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-pink-600" />
                  Diskon (Opsional)
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountType">Jenis Diskon</Label>
                    <Select value={formData.discountType} onValueChange={(value: 'percentage' | 'amount') => setFormData(prev => ({ ...prev, discountType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                        <SelectItem value="amount">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discount">
                      Nilai Diskon {formData.discountType === 'percentage' ? '(%)' : '(Rp)'}
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Preview Perhitungan */}
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {formData.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>
                          Diskon ({formData.discountType === 'percentage' ? `${Math.min(formData.discount, 100)}%` : 'Nominal'}):
                        </span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-1">
                      <span>Total:</span>
                      <span className="text-pink-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                  {editingId ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg text-pink-800">Data Penjualan</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Belum ada data penjualan
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(sale.category)}>
                          {sale.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                      <TableCell>{formatCurrency(sale.subtotal)}</TableCell>
                      <TableCell>
                        {sale.discount > 0 ? (
                          <span className="text-red-600">
                            -{formatCurrency(sale.discount)} ({sale.discountType === 'percentage' ? '%' : 'Rp'})
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
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