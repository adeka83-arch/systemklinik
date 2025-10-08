import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Search, Plus, Edit, Trash2, Package, MapPin, Calendar, FileSpreadsheet, Printer } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface ProductFieldTripProps {
  accessToken: string
}

interface FieldTripProduct {
  id: string
  name: string
  category: string
  price: number
  unit: string
  description?: string
  location?: string
  duration?: string
  maxParticipants?: number
  minParticipants?: number
  ageRange?: string
  included?: string
  notIncluded?: string
  requirements?: string
  notes?: string
  isActive: boolean
  created_at: string
  updated_at?: string
}

export function ProductFieldTrip({ accessToken }: ProductFieldTripProps) {
  const [products, setProducts] = useState<FieldTripProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FieldTripProduct | null>(null)
  
  // Form state
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: 0,
    unit: '',
    description: '',
    location: '',
    duration: '',
    maxParticipants: 0,
    minParticipants: 0,
    ageRange: '',
    included: '',
    notIncluded: '',
    requirements: '',
    notes: '',
    isActive: true
  })

  const categories = [
    'Kunjungan Klinik',
    'Kunjungan Sekolah'
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching field trip products...')
      const response = await fetch(`${serverUrl}/field-trip-products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      console.log('Fetch response:', { status: response.status, data })
      
      if (response.ok && data.success) {
        setProducts(data.products || [])
        console.log('Loaded products:', data.products?.length || 0)
      } else {
        console.log('Fetch failed:', data)
        toast.error(data.error || 'Gagal mengambil data produk field trip')
      }
    } catch (error) {
      console.log('Error fetching field trip products:', error)
      toast.error('Gagal mengambil data produk field trip')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!productForm.name.trim()) {
      toast.error('Nama produk wajib diisi')
      return
    }
    
    if (!productForm.category) {
      toast.error('Kategori wajib dipilih')
      return
    }
    
    if (productForm.price <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }
    
    if (!productForm.unit.trim()) {
      toast.error('Satuan wajib diisi')
      return
    }
    
    try {
      setLoading(true)
      
      const url = editingProduct 
        ? `${serverUrl}/field-trip-products/${editingProduct.id}`
        : `${serverUrl}/field-trip-products`
      
      const method = editingProduct ? 'PUT' : 'POST'

      // Create clean payload
      const payload = {
        name: productForm.name.trim(),
        category: productForm.category,
        price: Number(productForm.price),
        unit: productForm.unit.trim(),
        description: productForm.description.trim(),
        location: productForm.location.trim(),
        duration: productForm.duration.trim(),
        maxParticipants: Number(productForm.maxParticipants) || 0,
        minParticipants: Number(productForm.minParticipants) || 0,
        ageRange: productForm.ageRange.trim(),
        included: productForm.included.trim(),
        notIncluded: productForm.notIncluded.trim(),
        requirements: productForm.requirements.trim(),
        notes: productForm.notes.trim(),
        isActive: Boolean(productForm.isActive)
      }

      console.log('Sending product data:', payload)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Server response:', data)
      
      if (response.ok && data.success) {
        toast.success(editingProduct ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan')
        fetchProducts()
        resetForm()
      } else {
        console.log('Server error:', data)
        toast.error(data.error || 'Gagal menyimpan produk')
      }
    } catch (error) {
      console.log('Error saving product:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (product: FieldTripProduct) => {
    if (!confirm(`Hapus produk ${product.name}?`)) return

    try {
      setLoading(true)
      console.log('🗑️ Attempting to delete product:', product.id, product.name)
      console.log('🔗 Delete URL:', `${serverUrl}/field-trip-products/${product.id}`)
      
      const response = await fetch(`${serverUrl}/field-trip-products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📨 Delete response status:', response.status)
      
      const data = await response.json()
      console.log('📨 Delete response data:', data)
      
      if (response.ok && data.success) {
        toast.success('Produk berhasil dihapus')
        fetchProducts()
      } else {
        console.log('❌ Delete failed:', data)
        toast.error(data.error || 'Gagal menghapus produk')
      }
    } catch (error) {
      console.log('❌ Error deleting product:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const initializeProducts = async () => {
    try {
      setLoading(true)
      console.log('🔧 Initializing sample field trip products...')
      
      const response = await fetch(`${serverUrl}/field-trip-products/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('📨 Initialize response:', data)
      
      if (response.ok && data.success) {
        toast.success(`Berhasil menambahkan ${data.count} produk field trip contoh`)
        fetchProducts()
      } else {
        console.log('❌ Initialize failed:', data)
        toast.error(data.error || 'Gagal menginisialisasi data')
      }
    } catch (error) {
      console.log('❌ Error initializing products:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const openProductDialog = (product?: FieldTripProduct) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit,
        description: product.description || '',
        location: product.location || '',
        duration: product.duration || '',
        maxParticipants: product.maxParticipants || 0,
        minParticipants: product.minParticipants || 0,
        ageRange: product.ageRange || '',
        included: product.included || '',
        notIncluded: product.notIncluded || '',
        requirements: product.requirements || '',
        notes: product.notes || '',
        isActive: product.isActive
      })
    } else {
      setEditingProduct(null)
      resetForm()
    }
    setProductDialogOpen(true)
  }

  const resetForm = () => {
    setProductForm({
      name: '',
      category: '',
      price: 0,
      unit: '',
      description: '',
      location: '',
      duration: '',
      maxParticipants: 0,
      minParticipants: 0,
      ageRange: '',
      included: '',
      notIncluded: '',
      requirements: '',
      notes: '',
      isActive: true
    })
    setEditingProduct(null)
    setProductDialogOpen(false)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToExcel = () => {
    const today = new Date().toISOString().split('T')[0]
    const fileName = `produk-field-trip-${today}.csv`
    
    let csvContent = 'Nama Produk,Kategori,Harga,Satuan,Lokasi,Durasi,Min Peserta,Max Peserta,Rentang Usia,Status\n'
    
    filteredProducts.forEach(product => {
      const status = product.isActive ? 'Aktif' : 'Nonaktif'
      csvContent += `"${product.name}","${product.category}",${product.price},"${product.unit}","${product.location || '-'}","${product.duration || '-'}",${product.minParticipants || 0},${product.maxParticipants || 0},"${product.ageRange || '-'}","${status}"\n`
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    
    toast.success('Data produk field trip berhasil diekspor')
  }

  const printData = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const today = new Date().toLocaleDateString('id-ID')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daftar Produk Field Trip</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #be185d; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #fce7f3; color: #be185d; font-weight: bold; }
            tr:nth-child(even) { background-color: #fef7ff; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DAFTAR PRODUK FIELD TRIP</h1>
          </div>
          <div class="date">Tanggal: ${today}</div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Satuan</th>
                <th>Lokasi</th>
                <th>Durasi</th>
                <th>Peserta</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map((product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td>Rp ${product.price.toLocaleString('id-ID')}</td>
                  <td>${product.unit}</td>
                  <td>${product.location || '-'}</td>
                  <td>${product.duration || '-'}</td>
                  <td>${product.minParticipants || 0}-${product.maxParticipants || 0} orang</td>
                  <td>${product.isActive ? 'Aktif' : 'Nonaktif'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <p>Total Produk: ${filteredProducts.length}</p>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pink-800">Produk Field Trip</h2>
          <p className="text-pink-600">Kelola produk dan paket field trip untuk klien</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={printData}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={() => openProductDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk, kategori, atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daftar Produk Field Trip ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      {product.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">{product.location}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.duration && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">{product.duration}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(product.minParticipants || product.maxParticipants) && (
                        <span className="text-sm">
                          {product.minParticipants || 0}-{product.maxParticipants || 0} orang
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProductDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-gray-500">
                          {searchTerm ? 'Tidak ada produk yang ditemukan' : 'Belum ada data produk field trip'}
                        </div>
                        {!searchTerm && (
                          <Button
                            onClick={initializeProducts}
                            disabled={loading}
                            className="bg-pink-600 text-white hover:bg-pink-700"
                          >
                            {loading ? 'Memuat...' : 'Inisialisasi Data Contoh'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Produk Field Trip' : 'Tambah Produk Field Trip'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Perbarui informasi produk field trip' : 'Tambahkan produk field trip baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-pink-700">Nama Produk *</Label>
                  <Input 
                    placeholder="Nama produk field trip"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                    required
                    className={!productForm.name.trim() && productForm.name !== '' ? 'border-red-500' : ''}
                  />
                  {!productForm.name.trim() && productForm.name !== '' && (
                    <p className="text-red-500 text-xs mt-1">Nama produk wajib diisi</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-pink-700">Kategori *</Label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      category: e.target.value 
                    }))}
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                      !productForm.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Pilih kategori...</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {!productForm.category && (
                    <p className="text-red-500 text-xs mt-1">Kategori wajib dipilih</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Informasi Harga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-pink-700">Harga *</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      price: parseInt(e.target.value) || 0 
                    }))}
                    required
                    min="1"
                    className={productForm.price <= 0 ? 'border-red-500' : ''}
                  />
                  {productForm.price <= 0 && (
                    <p className="text-red-500 text-xs mt-1">Harga harus lebih dari 0</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-pink-700">Satuan *</Label>
                  <Input 
                    placeholder="paket, orang, grup"
                    value={productForm.unit}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      unit: e.target.value 
                    }))}
                    required
                    className={!productForm.unit.trim() && productForm.unit !== '' ? 'border-red-500' : ''}
                  />
                  {!productForm.unit.trim() && productForm.unit !== '' && (
                    <p className="text-red-500 text-xs mt-1">Satuan wajib diisi</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Deskripsi</h3>
              <div>
                <Label className="text-pink-700">Deskripsi Produk</Label>
                <Textarea 
                  placeholder="Deskripsi produk field trip..."
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Location & Duration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Lokasi & Waktu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-pink-700">Lokasi</Label>
                  <Input 
                    placeholder="Lokasi field trip"
                    value={productForm.location}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      location: e.target.value 
                    }))}
                  />
                </div>
                
                <div>
                  <Label className="text-pink-700">Durasi</Label>
                  <Input 
                    placeholder="1 hari, 2 hari 1 malam, dst"
                    value={productForm.duration}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      duration: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Informasi Peserta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-pink-700">Min Peserta</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={productForm.minParticipants}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      minParticipants: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label className="text-pink-700">Max Peserta</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={productForm.maxParticipants}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      maxParticipants: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label className="text-pink-700">Rentang Usia</Label>
                  <Input 
                    placeholder="5-12 tahun, Semua usia"
                    value={productForm.ageRange}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      ageRange: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Detail Paket</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-pink-700">Termasuk</Label>
                  <Textarea 
                    placeholder="Apa saja yang termasuk dalam paket..."
                    value={productForm.included}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      included: e.target.value 
                    }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label className="text-pink-700">Tidak Termasuk</Label>
                  <Textarea 
                    placeholder="Apa saja yang tidak termasuk..."
                    value={productForm.notIncluded}
                    onChange={(e) => setProductForm(prev => ({ 
                      ...prev, 
                      notIncluded: e.target.value 
                    }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-pink-700">Persyaratan</Label>
                <Textarea 
                  placeholder="Persyaratan atau ketentuan khusus..."
                  value={productForm.requirements}
                  onChange={(e) => setProductForm(prev => ({ 
                    ...prev, 
                    requirements: e.target.value 
                  }))}
                  rows={2}
                />
              </div>

              <div className="mt-4">
                <Label className="text-pink-700">Catatan</Label>
                <Textarea 
                  placeholder="Catatan tambahan..."
                  value={productForm.notes}
                  onChange={(e) => setProductForm(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Status & Actions */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-pink-800">Status & Tindakan</h3>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm(prev => ({ 
                    ...prev, 
                    isActive: e.target.checked 
                  }))}
                  className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <Label htmlFor="isActive" className="text-pink-700">Produk aktif</Label>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {loading ? 'Menyimpan...' : (editingProduct ? 'Update Produk' : 'Simpan Produk')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}