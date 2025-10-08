import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Plus, Edit, Trash2, Search, Filter, X, Package } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Product {
  id: string
  category: string
  name: string
  price: number
  stock: number
  description?: string
  created_at: string
}

interface ProductListProps {
  accessToken: string
}

const CATEGORIES = [
  'Obat',
  'Laboratorium', 
  'Konsultasi',
  'Tindakan',
  'Produk Medis'
]

// Categories that have stock management
const STOCK_CATEGORIES = ['Obat', 'Produk Medis']

// Categories that are services (no stock)
const SERVICE_CATEGORIES = ['Laboratorium', 'Konsultasi', 'Tindakan']

export function ProductList({ accessToken }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [nameSearch, setNameSearch] = useState('')
  const [priceSearch, setPriceSearch] = useState('')
  const [stockSearch, setStockSearch] = useState('')

  // Form states
  const [productForm, setProductForm] = useState({
    category: '',
    name: '',
    price: '',
    stock: '',
    description: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const url = `${serverUrl}/products`
      console.log('🔄 Fetching products from:', url)
      console.log('🔑 Access token available:', !!accessToken)
      console.log('🔑 Access token preview:', accessToken ? `${accessToken.substring(0, 10)}...` : 'None')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      console.log('📤 Request headers:', headers)
      
      const response = await fetch(url, { headers })
      
      console.log('Products fetch response status:', response.status)
      console.log('Products fetch response ok:', response.ok)
      
      const data = await response.json()
      console.log('Products response data:', data)
      
      if (response.ok && data.success) {
        const productsData = data.products || []
        console.log('Setting products data:', productsData)
        console.log('Number of products found:', productsData.length)
        setProducts(productsData)
        
        if (productsData.length === 0) {
          toast.info('Belum ada data produk')
        } else {
          console.log(`Successfully loaded ${productsData.length} products`)
        }
      } else {
        console.error('Failed to fetch products - Server error:', data)
        toast.error('Gagal mengambil data produk: ' + (data.error || response.statusText || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Terjadi kesalahan saat mengambil data produk: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check required fields based on category
    const isStockCategory = STOCK_CATEGORIES.includes(productForm.category)
    const stockRequired = isStockCategory && productForm.stock.trim() === ''
    
    if (!productForm.name.trim() || !productForm.price.trim() || !productForm.category || stockRequired) {
      toast.error('Harap lengkapi semua field yang wajib diisi')
      return
    }

    setLoading(true)

    try {
      const url = editingProduct 
        ? `${serverUrl}/products/${editingProduct.id}`
        : `${serverUrl}/products`
      
      const method = editingProduct ? 'PUT' : 'POST'

      const formData = {
        // Send both formats for compatibility
        nama: productForm.name.trim(),
        name: productForm.name.trim(),
        kategori: productForm.category,
        category: productForm.category,
        harga: parseFloat(productForm.price),
        price: parseFloat(productForm.price),
        stok: isStockCategory ? parseInt(productForm.stock) : 0,
        stock: isStockCategory ? parseInt(productForm.stock) : 0,
        deskripsi: productForm.description.trim(),
        description: productForm.description.trim()
      }

      console.log('📦 Sending product data:', {
        url,
        method,
        formData,
        hasAccessToken: !!accessToken
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })
      
      console.log('📦 Product save response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const data = await response.json()
      console.log('📦 Product save response data:', data)
      
      if (response.ok && data.success) {
        toast.success(editingProduct ? 'Produk berhasil diperbarui' : 'Produk baru berhasil ditambahkan')
        await fetchProducts() // Wait for refresh
        resetForm()
      } else {
        console.error('❌ Product save failed:', {
          status: response.status,
          error: data.error,
          data
        })
        toast.error(data.error || `Gagal menyimpan produk (${response.status})`)
      }
    } catch (error) {
      console.log('Error saving product:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      category: product.category,
      name: product.name,
      price: product.price.toString(),
      stock: STOCK_CATEGORIES.includes(product.category) ? product.stock.toString() : '0',
      description: product.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Produk berhasil dihapus')
        fetchProducts()
      } else {
        toast.error(data.error || 'Gagal menghapus produk')
      }
    } catch (error) {
      console.log('Error deleting product:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProductForm({
      category: '',
      name: '',
      price: '',
      stock: '',
      description: ''
    })
    setEditingProduct(null)
    setDialogOpen(false)
  }

  const handleCategoryChange = (category: string) => {
    setProductForm(prev => ({
      ...prev,
      category,
      stock: STOCK_CATEGORIES.includes(category) ? prev.stock : '0'
    }))
  }

  const resetFilters = () => {
    setCategoryFilter('all')
    setNameSearch('')
    setPriceSearch('')
    setStockSearch('')
  }

  // Test server connectivity
  const testServerConnection = async () => {
    try {
      console.log('🧪 Testing server connection...')
      
      // Test health endpoint
      const healthResponse = await fetch(`${serverUrl}/health`)
      const healthData = await healthResponse.json()
      console.log('💗 Health check:', healthData)
      
      if (!healthData.success) {
        toast.error('Server health check failed')
        return
      }
      
      // Test database
      const dbResponse = await fetch(`${serverUrl}/test-db`)
      const dbData = await dbResponse.json()
      console.log('🗄️ Database test:', dbData)
      
      if (!dbData.success) {
        toast.error(`Database test failed: ${dbData.error}`)
        return
      }
      
      toast.success('Server dan database tersambung dengan baik!')
      
    } catch (error) {
      console.error('🚨 Server test failed:', error)
      toast.error(`Tes koneksi server gagal: ${error.message}`)
    }
  }

  // Add sample data function
  const addSampleData = async () => {
    const sampleProducts = [
      { category: 'Obat', name: 'Cefadroxil 500mg', price: 18000, stock: 10, description: 'Antibiotik untuk infeksi' },
      { category: 'Laboratorium', name: '(LAB-A) Tambah Elemen Gigi', price: 250000, stock: 0, description: 'Prosedur laboratorium tipe A' },
      { category: 'Laboratorium', name: '(LAB-B) Tambah Elemen Gigi', price: 150000, stock: 0, description: 'Prosedur laboratorium tipe B' },
      { category: 'Konsultasi', name: 'Konsultasi Ortodonti', price: 90000, stock: 0, description: 'Konsultasi perawatan ortodonti' },
      { category: 'Obat', name: 'Amoxicillin Syrup', price: 25000, stock: 10, description: 'Antibiotik sirup' },
      { category: 'Obat', name: 'Amoxicillin Tablet 500mg', price: 11000, stock: 5, description: 'Antibiotik tablet' },
      { category: 'Tindakan', name: 'Anastesi', price: 100000, stock: 0, description: 'Prosedur anestesi lokal' },
      { category: 'Produk Medis', name: 'Handpiece High Speed', price: 2500000, stock: 3, description: 'Handpiece kecepatan tinggi' },
      { category: 'Konsultasi', name: 'Kontrol Pasca Cabut', price: 50000, stock: 0, description: 'Konsultasi kontrol setelah pencabutan gigi' },
      { category: 'Tindakan', name: 'Scaling Ultrasonic', price: 150000, stock: 0, description: 'Pembersihan karang gigi dengan ultrasonic' }
    ]

    for (const product of sampleProducts) {
      try {
        await fetch(`${serverUrl}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(product)
        })
      } catch (error) {
        console.log('Error adding sample data:', error)
      }
    }
    
    fetchProducts()
    toast.success('Data sample berhasil ditambahkan')
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    // Category filter
    if (categoryFilter !== 'all' && product.category !== categoryFilter) {
      return false
    }

    // Name search
    if (nameSearch && !product.name.toLowerCase().includes(nameSearch.toLowerCase())) {
      return false
    }

    // Price search
    if (priceSearch) {
      const searchPrice = parseFloat(priceSearch)
      if (!isNaN(searchPrice) && product.price !== searchPrice) {
        return false
      }
    }

    // Stock search (only for stock categories)
    if (stockSearch && STOCK_CATEGORIES.includes(product.category)) {
      const searchStock = parseInt(stockSearch)
      if (!isNaN(searchStock) && product.stock !== searchStock) {
        return false
      }
    }

    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount)
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Obat':
        return 'bg-emerald-100 text-emerald-800'
      case 'Laboratorium':
        return 'bg-purple-100 text-purple-800'
      case 'Konsultasi':
        return 'bg-blue-100 text-blue-800'
      case 'Tindakan':
        return 'bg-pink-100 text-pink-800'
      case 'Produk Medis':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (product: Product) => {
    // For service categories, show "Layanan" status
    if (SERVICE_CATEGORIES.includes(product.category)) {
      return { label: 'Layanan', color: 'bg-blue-100 text-blue-800' }
    }
    
    // For stock categories, show stock status
    if (product.stock === 0) {
      return { label: 'Habis', color: 'bg-red-100 text-red-800' }
    } else if (product.stock <= 5) {
      return { label: 'Rendah', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="border-pink-200 bg-pink-50/30">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-pink-700">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-pink-200 bg-white">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Nama Produk</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" />
                <Input
                  placeholder="Quick Search"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="pl-10 border-pink-200 bg-white"
                />
                {nameSearch && (
                  <X 
                    className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-pink-500 hover:bg-pink-100 rounded"
                    onClick={() => setNameSearch('')}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Harga</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" />
                <Input
                  placeholder="Quick Search"
                  type="number"
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  className="pl-10 border-pink-200 bg-white"
                />
                {priceSearch && (
                  <X 
                    className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-pink-500 hover:bg-pink-100 rounded"
                    onClick={() => setPriceSearch('')}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-pink-700">Stok</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" />
                <Input
                  placeholder="Quick Search"
                  type="number"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="pl-10 border-pink-200 bg-white"
                />
                {stockSearch && (
                  <X 
                    className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-pink-500 hover:bg-pink-100 rounded"
                    onClick={() => setStockSearch('')}
                  />
                )}
              </div>
              <p className="text-xs text-pink-600">*Hanya untuk Obat & Produk Medis</p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={resetFilters}
                variant="outline"
                className="border-pink-600 text-pink-600 hover:bg-pink-50"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Daftar Produk & Inventory
            </CardTitle>
            <div className="flex gap-2">
              {products.length === 0 && (
                <Button
                  onClick={addSampleData}
                  variant="outline"
                  className="border-pink-600 text-pink-600 hover:bg-pink-50"
                >
                  Tambah Data Sample
                </Button>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Produk
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-pink-800">
                      {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </DialogTitle>
                    <DialogDescription className="text-pink-600">
                      {editingProduct ? 'Perbarui informasi produk' : 'Tambahkan produk baru ke dalam inventory'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-pink-700">Kategori *</Label>
                      <Select value={productForm.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="border-pink-200">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-pink-700">Nama Produk *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Nama produk lengkap"
                        className="border-pink-200"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-pink-700">Harga *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="0"
                          className="border-pink-200"
                          required
                        />
                      </div>

                      {STOCK_CATEGORIES.includes(productForm.category) && (
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-pink-700">Stok *</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            placeholder="0"
                            className="border-pink-200"
                            required
                          />
                        </div>
                      )}
                      
                      {SERVICE_CATEGORIES.includes(productForm.category) && (
                        <div className="space-y-2">
                          <Label className="text-pink-700">Jenis</Label>
                          <div className="flex items-center h-10 px-3 border border-pink-200 rounded-md bg-pink-50">
                            <span className="text-pink-600 text-sm">Layanan</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-pink-700">Deskripsi</Label>
                      <Input
                        id="description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Deskripsi opsional..."
                        className="border-pink-200"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="flex-1 border-pink-200 text-pink-600"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                      >
                        {loading ? 'Menyimpan...' : editingProduct ? 'Update' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-pink-50">
                  <TableHead className="text-pink-700">Kategori</TableHead>
                  <TableHead className="text-pink-700">Nama Produk</TableHead>
                  <TableHead className="text-pink-700 text-right">Harga</TableHead>
                  <TableHead className="text-pink-700 text-center">Stok</TableHead>
                  <TableHead className="text-pink-700">Status</TableHead>
                  <TableHead className="text-pink-700">Deskripsi</TableHead>
                  <TableHead className="text-pink-700 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <TableRow key={product.id} className="hover:bg-pink-50/50">
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(product.category)}>
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-pink-800 max-w-xs">
                        <div className="truncate" title={product.name}>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-pink-800">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-pink-800">
                        {STOCK_CATEGORIES.includes(product.category) ? product.stock : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm max-w-xs">
                        <div className="truncate" title={product.description}>
                          {product.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                            className="border-pink-200 text-pink-600 hover:bg-pink-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-pink-600">
                {products.length === 0 
                  ? 'Belum ada data produk' 
                  : 'Tidak ada data yang sesuai dengan filter'
                }
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-pink-700">
              <div>
                <span className="block">Total Item:</span>
                <span className="font-semibold text-pink-800">{filteredProducts.length} dari {products.length} item</span>
              </div>
              <div>
                <span className="block">Produk Stok:</span>
                <span className="font-semibold text-pink-800">
                  {filteredProducts.filter(p => STOCK_CATEGORIES.includes(p.category)).length} item
                </span>
              </div>
              <div>
                <span className="block">Layanan:</span>
                <span className="font-semibold text-blue-800">
                  {filteredProducts.filter(p => SERVICE_CATEGORIES.includes(p.category)).length} item
                </span>
              </div>
              <div>
                <span className="block">Stok Habis:</span>
                <span className="font-semibold text-red-800">
                  {filteredProducts.filter(p => STOCK_CATEGORIES.includes(p.category) && p.stock === 0).length} item
                </span>
              </div>
              <div>
                <span className="block">Stok Rendah:</span>
                <span className="font-semibold text-yellow-800">
                  {filteredProducts.filter(p => STOCK_CATEGORIES.includes(p.category) && p.stock > 0 && p.stock <= 5).length} item
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}