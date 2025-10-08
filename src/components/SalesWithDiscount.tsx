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

export function SalesWithDiscount({ accessToken, clinicSettings }: SalesProps) {
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
    { value: 'Produk Medis', label: 'Produk Medis' },
    { value: 'Obat', label: 'Obat' }
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
      if (!target.closest('.product-search-container')) {
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
        // Filter produk medis dan obat yang memiliki stok > 0
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

  const handleProductSelectFromSearch = (product: Product) => {
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

    // Check stock availability
    const selectedProduct = products.find(p => p.id === formData.productId)
    if (selectedProduct && formData.quantity > selectedProduct.stock) {
      toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stock}`)
      return
    }

    const saleData = {
      patientId: 'walk-in-customer',
      patientName: 'Walk-in Customer',
      items: [{
        productId: formData.productId,
        productName: formData.productName.trim(),
        quantity: formData.quantity,
        pricePerUnit: formData.pricePerUnit,
        total: subtotal
      }],
      category: formData.category, // Simpan kategori
      subtotal: subtotal,
      discount: discountAmount,
      discountType: formData.discountType,
      tax: 0,
      total: total,
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
      discount: sale.discountType === 'percentage' 
        ? (sale.discount / sale.subtotal * 100) 
        : sale.discount,
      discountType: sale.discountType,
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
    setProductSearchTerm('')
    setShowProductDropdown(false)
    setEditingId(null)
  }

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        productId: productId,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        pricePerUnit: selectedProduct.price
      }))
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
      'obat': 'bg-blue-100 text-blue-800',
      'alat': 'bg-emerald-100 text-emerald-800',
      'kosmetik': 'bg-pink-100 text-pink-800',
      'suplemen': 'bg-purple-100 text-purple-800',
      'lainnya': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['lainnya']
  }

  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0)

  // Print functions
  const openCashierDialog = (sale: SimpleSale, type: 'invoice' | 'receipt') => {
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

  // Fungsi untuk konversi angka ke terbilang bahasa Indonesia
  const numberToWords = (num: number): string => {
    if (num === 0) return 'nol'
    
    const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 
                   'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 
                  'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
    
    const convertChunk = (n: number): string => {
      let result = ''
      
      if (n >= 100) {
        if (Math.floor(n / 100) === 1) {
          result += 'seratus '
        } else {
          result += ones[Math.floor(n / 100)] + ' ratus '
        }
        n %= 100
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' '
        n %= 10
      } else if (n >= 10) {
        result += teens[n - 10] + ' '
        return result.trim()
      }
      
      if (n > 0) {
        result += ones[n] + ' '
      }
      
      return result.trim()
    }
    
    if (num < 1000) {
      return convertChunk(num)
    } else if (num < 1000000) {
      const thousands = Math.floor(num / 1000)
      const remainder = num % 1000
      let result = ''
      
      if (thousands === 1) {
        result = 'seribu'
      } else {
        result = convertChunk(thousands) + ' ribu'
      }
      
      if (remainder > 0) {
        result += ' ' + convertChunk(remainder)
      }
      
      return result
    } else if (num < 1000000000) {
      const millions = Math.floor(num / 1000000)
      const remainder = num % 1000000
      let result = convertChunk(millions) + ' juta'
      
      if (remainder > 0) {
        result += ' ' + numberToWords(remainder)
      }
      
      return result
    } else {
      const billions = Math.floor(num / 1000000000)
      const remainder = num % 1000000000
      let result = convertChunk(billions) + ' miliar'
      
      if (remainder > 0) {
        result += ' ' + numberToWords(remainder)
      }
      
      return result
    }
  }

  const generateInvoiceWithCashier = (sale: SimpleSale, cashierName: string, transactionDate: string) => {
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice Penjualan - ${sale.productName}</title>
        <style>
          @page {
            size: A5;
            margin: 12mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #333;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #ec4899;
            padding-bottom: 12px;
          }
          
          .logo {
            max-width: 60px;
            max-height: 45px;
            margin: 0 auto 8px;
            display: block;
          }
          
          .clinic-name {
            font-size: 14px;
            font-weight: bold;
            color: #ec4899;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .clinic-info {
            font-size: 8px;
            color: #666;
            line-height: 1.2;
          }
          
          .document-title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin: 15px 0;
            color: #ec4899;
            text-transform: uppercase;
            border: 2px solid #ec4899;
            padding: 6px;
            letter-spacing: 0.5px;
          }
          
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 9px;
          }
          
          .info-section div {
            flex: 1;
          }
          
          .info-label {
            font-weight: bold;
            color: #ec4899;
            margin-bottom: 2px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 9px;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: left;
            vertical-align: top;
          }
          
          .items-table th {
            background-color: #fce7f3;
            font-weight: bold;
            color: #9d174d;
            text-align: center;
            font-size: 8px;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-right {
            text-align: right;
          }
          
          .total-section {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px solid #ec4899;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 10px;
          }
          
          .total-row.grand-total {
            font-weight: bold;
            font-size: 12px;
            color: #ec4899;
            padding-top: 6px;
            border-top: 1px solid #ddd;
          }

          .discount-row {
            color: #dc2626;
            font-weight: 600;
          }
          
          .amount-words {
            margin-top: 12px;
            padding: 8px;
            background-color: #fef7ff;
            border: 1px solid #f3e8ff;
            border-radius: 4px;
            font-size: 9px;
            font-style: italic;
            color: #7c2d12;
          }
          
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: center;
            font-size: 10px;
          }
          
          .signature-section {
            text-align: center;
            width: 180px;
          }
          
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-weight: bold;
          }
          
          .notes {
            margin-top: 15px;
            font-size: 8px;
            color: #666;
            line-height: 1.3;
          }
          
          .print-date {
            text-align: center;
            margin-top: 15px;
            font-size: 7px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
          <div class="clinic-name">${clinicName}</div>
          <div class="clinic-info">
            Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
            Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
            Telp/WA: 085283228355
          </div>
        </div>
        
        <div class="document-title">INVOICE PENJUALAN</div>
        
        <div class="info-section">
          <div>
            <div class="info-label">Tanggal Transaksi:</div>
            <div>${new Date(transactionDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          <div style="text-align: right;">
            <div class="info-label">Kasir:</div>
            <div>${cashierName}</div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">No</th>
              <th style="width: 35%;">Nama Produk</th>
              <th style="width: 15%;">Kategori</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 16%;">Harga Satuan</th>
              <th style="width: 16%;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>${sale.productName}</td>
              <td class="text-center">${sale.category}</td>
              <td class="text-center">${sale.quantity}</td>
              <td class="text-right">Rp ${sale.pricePerUnit.toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${sale.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rp ${sale.subtotal.toLocaleString('id-ID')}</span>
          </div>
          ${sale.discount > 0 ? `
          <div class="total-row discount-row">
            <span>Diskon (${sale.discountType === 'percentage' ? `${((sale.discount / sale.subtotal) * 100).toFixed(1)}%` : 'Nominal'}):</span>
            <span>-Rp ${sale.discount.toLocaleString('id-ID')}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>TOTAL PEMBAYARAN:</span>
            <span>Rp ${sale.totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div class="amount-words">
          <strong>Terbilang:</strong> ${numberToWords(sale.totalAmount)} rupiah
        </div>
        
        ${sale.notes ? `
        <div class="notes">
          <strong>Catatan:</strong> ${sale.notes}
        </div>
        ` : ''}
        
        <div class="footer">
          <div class="signature-section" style="margin: 0 auto;">
            <div>Kasir</div>
            <div class="signature-line">${cashierName}</div>
          </div>
        </div>
        
        <div class="print-date">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </body>
      </html>
    `

    invoiceWindow.document.write(invoiceHtml)
    invoiceWindow.document.close()
    
    invoiceWindow.onload = function() {
      setTimeout(() => {
        invoiceWindow.print()
      }, 250)
    }
  }

  const generateReceiptWithCashier = (sale: SimpleSale, cashierName: string, transactionDate: string) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kwitansi Penjualan - ${sale.productName}</title>
        <style>
          @page {
            size: A5;
            margin: 12mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
          }
          
          .receipt-container {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #ec4899;
            border-radius: 6px;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            color: white;
            padding: 15px;
            text-align: center;
          }
          
          .logo {
            max-width: 50px;
            max-height: 38px;
            margin: 0 auto 8px;
            display: block;
            filter: brightness(0) invert(1);
          }
          
          .clinic-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .clinic-info {
            font-size: 9px;
            line-height: 1.2;
            opacity: 0.9;
          }
          
          .content {
            padding: 18px;
          }
          
          .document-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #ec4899;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
            font-size: 10px;
          }
          
          .info-label {
            font-weight: bold;
            color: #be185d;
            margin-bottom: 2px;
          }
          
          .amount-section {
            background-color: #fef7ff;
            border: 2px solid #f3e8ff;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
          }
          
          .amount-label {
            font-size: 10px;
            color: #be185d;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .amount-value {
            font-size: 22px;
            font-weight: bold;
            color: #ec4899;
            margin-bottom: 12px;
          }
          
          .amount-words {
            font-size: 10px;
            font-style: italic;
            color: #7c2d12;
            padding: 8px;
            background-color: white;
            border: 1px solid #f3e8ff;
            border-radius: 4px;
          }
          
          .details-section {
            margin: 15px 0;
            border-top: 1px solid #f3e8ff;
            border-bottom: 1px solid #f3e8ff;
            padding: 12px 0;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 10px;
          }
          
          .detail-label {
            font-weight: bold;
            color: #be185d;
          }

          .discount-detail {
            color: #dc2626;
            font-weight: 600;
          }
          
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .signature-section {
            text-align: center;
            width: 160px;
          }
          
          .signature-label {
            font-size: 10px;
            color: #be185d;
            font-weight: bold;
            margin-bottom: 30px;
          }
          
          .signature-line {
            border-top: 1px solid #333;
            padding-top: 4px;
            font-size: 9px;
            font-weight: bold;
          }
          
          .notes {
            margin-top: 15px;
            padding: 12px;
            background-color: #fef7ff;
            border: 1px solid #f3e8ff;
            border-radius: 4px;
            font-size: 9px;
            color: #666;
          }
          
          .print-info {
            text-align: center;
            margin-top: 15px;
            font-size: 8px;
            color: #999;
            border-top: 1px solid #f3e8ff;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
            <div class="clinic-name">${clinicName}</div>
            <div class="clinic-info">
              Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
              Sawangan Lama, Kec. Sawangan, Depok, Jawa Barat<br>
              Telp/WA: 085283228355
            </div>
          </div>
          
          <div class="content">
            <div class="document-title">KWITANSI</div>
            
            <div class="receipt-info">
              <div>
                <div class="info-label">Tanggal:</div>
                <div>${new Date(transactionDate).toLocaleDateString('id-ID')}</div>
              </div>
              <div style="text-align: right;">
                <div class="info-label">Kasir:</div>
                <div>${cashierName}</div>
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">Produk:</span>
                <span>${sale.productName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span>${sale.quantity} unit</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Harga Satuan:</span>
                <span>Rp ${sale.pricePerUnit.toLocaleString('id-ID')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Subtotal:</span>
                <span>Rp ${sale.subtotal.toLocaleString('id-ID')}</span>
              </div>
              ${sale.discount > 0 ? `
              <div class="detail-row discount-detail">
                <span class="detail-label">Diskon:</span>
                <span>-Rp ${sale.discount.toLocaleString('id-ID')}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="amount-section">
              <div class="amount-label">Total yang Diterima</div>
              <div class="amount-value">Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
              <div class="amount-words">
                <strong>Terbilang:</strong> ${numberToWords(sale.totalAmount)} rupiah
              </div>
            </div>
            
            ${sale.notes ? `
            <div class="notes">
              <strong>Catatan:</strong> ${sale.notes}
            </div>
            ` : ''}
            
            <div class="footer">
              <div class="signature-section">
                <div class="signature-label">Kasir</div>
                <div class="signature-line">${cashierName}</div>
              </div>
            </div>
            
            <div class="print-info">
              Dicetak pada: ${new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    receiptWindow.document.write(receiptHtml)
    receiptWindow.document.close()
    
    receiptWindow.onload = function() {
      setTimeout(() => {
        receiptWindow.print()
      }, 250)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-pink-600" />
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
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Item Terjual</p>
                <p className="text-2xl">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Diskon</p>
                <p className="text-2xl">{formatCurrency(totalDiscount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
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
          <p className="text-pink-600">Kelola data penjualan produk medis dengan fitur diskon</p>
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
                Masukkan detail penjualan produk
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Pilih Produk</Label>
                  <Select value={formData.productId} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk dari stok..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)} (Stok: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan tambahan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700">
                  {editingId ? 'Perbarui' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabel Data Penjualan */}
      <Card>
        <CardHeader>
          <h3 className="text-lg text-pink-800">Data Penjualan</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
          ) : (
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
                            <span className="text-red-600 font-medium">
                              -{formatCurrency(sale.discount)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-pink-600">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openCashierDialog(sale, 'invoice')}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openCashierDialog(sale, 'receipt')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(sale)}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(sale.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
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
          )}
        </CardContent>
      </Card>

      {/* Dialog Pilih Kasir untuk Print */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </DialogTitle>
            <DialogDescription>
              Pilih kasir yang akan tercantum pada dokumen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashier">Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasir..." />
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

            <div>
              <Label htmlFor="transactionDate">Tanggal Transaksi</Label>
              <Input
                id="transactionDate"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handlePrintWithCashier} className="flex-1 bg-pink-600 hover:bg-pink-700">
              {printType === 'invoice' ? 'Cetak Invoice' : 'Cetak Kwitansi'}
            </Button>
            <Button variant="outline" onClick={() => setCashierDialogOpen(false)}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}