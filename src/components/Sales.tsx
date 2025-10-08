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
import { Trash2, Edit, Plus, ShoppingCart, TrendingUp, FileText, Receipt, Search, X, Gift, CheckCircle, RefreshCw, Sparkles } from 'lucide-react'
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
  subtotal: number
  discountAmount: number
  discountPercentage: number
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

interface Voucher {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  usageLimit: number
  usageCount: number
  isActive: boolean
  minPurchase?: number
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

export function Sales({ accessToken, clinicSettings }: SalesProps) {
  const [sales, setSales] = useState<SimpleSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
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
    discountType: 'amount', // 'amount' or 'percentage'
    voucherCode: '', // Tambahan untuk kode voucher
    appliedVoucher: null as Voucher | null, // Tambahan untuk voucher yang dipakai
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Voucher states
  const [voucherInput, setVoucherInput] = useState('')
  const [validatingVoucher, setValidatingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState('')
  
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
    fetchVouchers()
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
          const quantity = firstItem ? firstItem.quantity : 0
          const pricePerUnit = firstItem ? firstItem.pricePerUnit : 0
          const subtotal = quantity * pricePerUnit
          const discountAmount = sale.discount || 0
          const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
          
          return {
            id: sale.id,
            productName: firstItem ? firstItem.productName : 'Unknown Product',
            category: 'Produk Medis', // Default category
            quantity: quantity,
            pricePerUnit: pricePerUnit,
            subtotal: subtotal,
            discountAmount: discountAmount,
            discountPercentage: discountPercentage,
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

  const fetchVouchers = async () => {
    try {
      const response = await fetch(`${serverUrl}/vouchers`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter hanya voucher yang aktif dan belum expired
        const activeVouchers = (data.vouchers || []).filter((voucher: Voucher) => {
          const isActive = voucher.isActive
          const notExpired = new Date(voucher.expiryDate) >= new Date()
          const hasUsageLeft = voucher.usageCount < voucher.usageLimit
          const isValid = voucher.code && voucher.code.trim() !== '' && voucher.code !== 'CORRUPT'
          return isActive && notExpired && hasUsageLeft && isValid
        })
        setVouchers(activeVouchers)
        console.log(`✅ Loaded ${activeVouchers.length} active vouchers`)
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    }
  }

  const validateVoucher = async (code: string) => {
    if (!code.trim()) {
      setVoucherError('')
      setFormData(prev => ({ ...prev, appliedVoucher: null, voucherCode: '' }))
      return
    }

    setValidatingVoucher(true)
    setVoucherError('')

    try {
      // Cari voucher di list yang sudah difilter
      const voucher = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase())
      
      if (!voucher) {
        setVoucherError('Kode voucher tidak valid atau sudah tidak aktif')
        setFormData(prev => ({ ...prev, appliedVoucher: null }))
        return
      }

      // Validasi minimum purchase jika ada
      const subtotal = formData.quantity * formData.pricePerUnit
      if (voucher.minPurchase && subtotal < voucher.minPurchase) {
        setVoucherError(`Minimum pembelian untuk voucher ini adalah ${formatCurrency(voucher.minPurchase)}`)
        setFormData(prev => ({ ...prev, appliedVoucher: null }))
        return
      }

      // Voucher valid
      setFormData(prev => ({ 
        ...prev, 
        appliedVoucher: voucher, 
        voucherCode: voucher.code,
        discount: 0, // Reset manual discount
        discountType: 'amount'
      }))
      toast.success(`Voucher "${voucher.title}" berhasil diterapkan!`)
    } catch (error) {
      console.error('Error validating voucher:', error)
      setVoucherError('Terjadi kesalahan saat memvalidasi voucher')
      setFormData(prev => ({ ...prev, appliedVoucher: null }))
    } finally {
      setValidatingVoucher(false)
    }
  }

  const removeVoucher = () => {
    setFormData(prev => ({ ...prev, appliedVoucher: null, voucherCode: '' }))
    setVoucherInput('')
    setVoucherError('')
    toast.success('Voucher dihapus')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productName.trim() || !formData.category || formData.quantity <= 0 || formData.pricePerUnit <= 0) {
      toast.error('Mohon lengkapi semua field yang diperlukan')
      return
    }

    // Validate discount
    if (formData.discountType === 'percentage' && formData.discount > 100) {
      toast.error('Diskon persentase tidak boleh lebih dari 100%')
      return
    }

    if (formData.discount < 0) {
      toast.error('Diskon tidak boleh negatif')
      return
    }

    // Check stock availability
    const selectedProduct = products.find(p => p.id === formData.productId)
    if (selectedProduct && formData.quantity > selectedProduct.stock) {
      toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stock}`)
      return
    }

    const subtotal = formData.quantity * formData.pricePerUnit
    
    // Hitung diskon dari voucher atau manual discount
    let discountAmount = 0
    if (formData.appliedVoucher) {
      // Gunakan diskon dari voucher
      discountAmount = formData.appliedVoucher.discountType === 'percentage'
        ? (subtotal * formData.appliedVoucher.discountValue / 100)
        : formData.appliedVoucher.discountValue
    } else {
      // Gunakan manual discount
      discountAmount = formData.discountType === 'percentage' 
        ? (subtotal * formData.discount / 100)
        : formData.discount
    }
    
    const totalAmount = subtotal - discountAmount

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
      subtotal: subtotal,
      discount: discountAmount,
      tax: 0,
      total: totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      date: formData.date,
      notes: formData.notes.trim(),
      voucherCode: formData.voucherCode || undefined,
      voucherId: formData.appliedVoucher?.id || undefined
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
        // Update voucher usage count jika menggunakan voucher
        if (formData.appliedVoucher && !editingId) {
          try {
            const usageData = {
              voucherId: formData.appliedVoucher.id,
              voucherCode: formData.appliedVoucher.code,
              patientId: saleData.patientId,
              patientName: saleData.patientName,
              originalAmount: subtotal,
              discountAmount: discountAmount,
              finalAmount: totalAmount,
              transactionType: 'sale',
              transactionId: data.sale?.id || null,
              adminFee: 0
            }

            const voucherResponse = await fetch(`${serverUrl}/vouchers/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify(usageData)
            })

            if (voucherResponse.ok) {
              console.log('✅ Voucher usage count updated successfully')
            } else {
              const voucherError = await voucherResponse.json()
              console.error('❌ Failed to update voucher usage:', voucherError)
            }
          } catch (error) {
            console.error('❌ Error updating voucher usage:', error)
          }
        }

        if (data.updatedStock !== undefined) {
          toast.success(
            `${editingId ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan'}. Stok ${formData.productName} tersisa: ${data.updatedStock}`
          )
        } else {
          toast.success(editingId ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil ditambahkan')
        }
        fetchSales()
        fetchProducts() // Refresh product list to show updated stock
        fetchVouchers() // Refresh voucher list
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
      discount: 0,
      discountType: 'amount',
      voucherCode: '',
      appliedVoucher: null,
      date: sale.date,
      notes: sale.notes || ''
    })
    setVoucherInput('')
    setVoucherError('')
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

  const handleProductSelect = (productIdOrProduct: string | Product) => {
    // Handle both string ID (from Select) and Product object (from old dropdown)
    let product: Product | undefined
    
    if (typeof productIdOrProduct === 'string') {
      // It's a product ID from Select component
      product = products.find(p => p.id === productIdOrProduct)
    } else {
      // It's a Product object
      product = productIdOrProduct
    }

    if (product) {
      setFormData(prev => ({
        ...prev,
        productId: product!.id,
        productName: product!.name,
        category: product!.category,
        pricePerUnit: product!.price
      }))
      setProductSearchTerm(product.name)
      setShowProductDropdown(false)
    }
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
      discount: 0,
      discountType: 'amount',
      voucherCode: '',
      appliedVoucher: null,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setProductSearchTerm('')
    setShowProductDropdown(false)
    setVoucherInput('')
    setVoucherError('')
    setEditingId(null)
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
              <td class="text-right">Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total-section">
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
            
            <div class="amount-section">
              <div class="amount-label">Telah Terima Dari Pelanggan Sejumlah</div>
              <div class="amount-value">Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
              <div class="amount-words">
                <strong>Terbilang:</strong><br>
                ${numberToWords(sale.totalAmount)} rupiah
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">Untuk Pembayaran:</span>
                <span>Pembelian ${sale.productName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Kategori:</span>
                <span>${sale.category}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Jumlah:</span>
                <span>${sale.quantity} unit</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Harga Satuan:</span>
                <span>Rp ${sale.pricePerUnit.toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            ${sale.notes ? `
            <div class="notes">
              <strong>Catatan:</strong><br>
              ${sale.notes}
            </div>
            ` : ''}
            
            <div class="footer">
              <div class="signature-section" style="margin: 0 auto;">
                <div class="signature-label">Kasir</div>
                <div class="signature-line">${cashierName}</div>
              </div>
            </div>
            
            <div class="print-info">
              Dicetak pada: ${new Date().toLocaleString('id-ID')}<br>
              Kwitansi ini merupakan bukti pembayaran yang sah
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
                    <Select value={formData.productId} onValueChange={handleProductSelect}>
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih produk dari inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            Tidak ada produk medis dengan stok tersedia
                          </div>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{product.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  (Stok: {product.stock}, Harga: {formatCurrency(product.price)})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formData.productName && (
                      <div className="text-xs text-gray-600">
                        Produk terpilih: <strong>{formData.productName}</strong>
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
                          Stok tersedia: {products.find(p => p.id === formData.productId)?.stock || 0}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">Harga per Unit</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        min="0"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({ ...formData, pricePerUnit: parseInt(e.target.value) || 0 })}
                        className="border-pink-200"
                        disabled={!formData.productId}
                      />
                      <div className="text-xs text-gray-500">
                        *Harga akan terisi otomatis saat memilih produk
                      </div>
                    </div>
                  </div>
                  
                  {/* Voucher Section */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-pink-600" />
                      Kode Voucher (Opsional)
                    </Label>
                    {!formData.appliedVoucher ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                validateVoucher(voucherInput)
                              }
                            }}
                            placeholder="Masukkan kode voucher"
                            className="border-pink-200 uppercase"
                            disabled={validatingVoucher}
                          />
                          <Button
                            type="button"
                            onClick={() => validateVoucher(voucherInput)}
                            disabled={validatingVoucher || !voucherInput.trim()}
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            {validatingVoucher ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Cek
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Terapkan
                              </>
                            )}
                          </Button>
                        </div>
                        {voucherError && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {voucherError}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Masukkan kode voucher untuk mendapatkan diskon otomatis
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                {formData.appliedVoucher.title}
                              </span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              {formData.appliedVoucher.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-600 text-white text-xs">
                                {formData.appliedVoucher.code}
                              </Badge>
                              <span className="text-xs text-green-600">
                                Diskon: {formData.appliedVoucher.discountType === 'percentage' 
                                  ? `${formData.appliedVoucher.discountValue}%`
                                  : formatCurrency(formData.appliedVoucher.discountValue)
                                }
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeVoucher}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discount Section - Only show if no voucher applied */}
                  {!formData.appliedVoucher && (
                    <div className="space-y-2">
                      <Label>Diskon Manual (Opsional)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Select 
                            value={formData.discountType} 
                            onValueChange={(value) => setFormData({ ...formData, discountType: value as 'amount' | 'percentage' })}
                          >
                            <SelectTrigger className="border-pink-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="amount">Nominal</SelectItem>
                              <SelectItem value="percentage">Persentase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            max={formData.discountType === 'percentage' ? 100 : undefined}
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                            placeholder={formData.discountType === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
                            className="border-pink-200"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formData.discountType === 'percentage' 
                          ? 'Masukkan persentase diskon (0-100)'
                          : 'Masukkan nominal diskon dalam rupiah'
                        }
                      </div>
                    </div>
                  )}
                  
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
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Catatan tambahan..."
                      className="border-pink-200"
                    />
                  </div>
                  
                  <div className="bg-pink-50 p-3 rounded-lg space-y-2">
                    {(() => {
                      const subtotal = formData.quantity * formData.pricePerUnit
                      
                      // Hitung diskon dari voucher atau manual
                      let discountAmount = 0
                      let discountLabel = 'Diskon'
                      let discountDetail = ''
                      
                      if (formData.appliedVoucher) {
                        discountAmount = formData.appliedVoucher.discountType === 'percentage'
                          ? (subtotal * formData.appliedVoucher.discountValue / 100)
                          : formData.appliedVoucher.discountValue
                        discountLabel = `Diskon Voucher (${formData.appliedVoucher.code})`
                        discountDetail = formData.appliedVoucher.discountType === 'percentage'
                          ? `${formData.appliedVoucher.discountValue}%`
                          : ''
                      } else if (formData.discount > 0) {
                        discountAmount = formData.discountType === 'percentage' 
                          ? (subtotal * formData.discount / 100)
                          : formData.discount
                        discountDetail = formData.discountType === 'percentage'
                          ? `${formData.discount}%`
                          : ''
                      }
                      
                      const total = subtotal - discountAmount
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-pink-600">Subtotal:</span>
                            <span className="text-green-600 font-medium">{formatCurrency(subtotal)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-pink-600 flex items-center gap-1">
                                {formData.appliedVoucher && <Gift className="h-3 w-3" />}
                                {discountLabel}:
                              </span>
                              <span className="text-red-600 font-medium">
                                -{formatCurrency(discountAmount)}
                                {discountDetail && (
                                  <span className="text-xs text-gray-500 ml-1">({discountDetail})</span>
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-pink-700 font-medium">Total:</span>
                            <span className="text-purple-600 font-bold text-lg">{formatCurrency(total)}</span>
                          </div>
                        </>
                      )
                    })()}
                    {formData.productId && formData.quantity > 0 && (
                      <p className="text-xs text-pink-600 mt-1">
                        Sisa stok setelah penjualan: {(products.find(p => p.id === formData.productId)?.stock || 0) - formData.quantity}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      disabled={!formData.productId || products.length === 0}
                    >
                      {editingId ? 'Perbarui' : 'Simpan'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      className="border-pink-200"
                    >
                      Batal
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
                <TableRow>
                  <TableHead className="text-pink-700">Tanggal</TableHead>
                  <TableHead className="text-pink-700">Produk</TableHead>
                  <TableHead className="text-pink-700">Kategori</TableHead>
                  <TableHead className="text-pink-700">Qty</TableHead>
                  <TableHead className="text-pink-700">Harga Satuan</TableHead>
                  <TableHead className="text-pink-700">Subtotal</TableHead>
                  <TableHead className="text-pink-700">Diskon</TableHead>
                  <TableHead className="text-pink-700">Total</TableHead>
                  <TableHead className="text-pink-700">Catatan</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadgeColor(sale.category)}>
                        {sale.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(sale.subtotal)}
                    </TableCell>
                    <TableCell>
                      {sale.discountAmount > 0 ? (
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(sale.discountAmount)}
                          {sale.discountPercentage > 0 && (
                            <span className="text-xs text-gray-500 block">
                              ({sale.discountPercentage.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-purple-600">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell>{sale.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCashierDialog(sale, 'invoice')}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                          title="Cetak Invoice"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCashierDialog(sale, 'receipt')}
                          className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          title="Cetak Kwitansi"
                        >
                          <Receipt className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(sale.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sales.length === 0 && (
              <div className="text-center py-8 text-pink-600">
                Belum ada data penjualan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cashier Selection Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {printType === 'invoice' ? 'Cetak Invoice' : 'Cetak Kwitansi'} Penjualan
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              Pilih kasir dan tanggal transaksi untuk {printType === 'invoice' ? 'invoice' : 'kwitansi'} penjualan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate" className="text-pink-700">Tanggal Transaksi</Label>
              <Input
                id="transactionDate"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="border-pink-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cashier" className="text-pink-700">Pilih Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger className="border-pink-200">
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
            
            {selectedSaleForPrint && (
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <p className="text-sm text-pink-700 mb-2"><strong>Detail Penjualan:</strong></p>
                <p className="text-xs text-pink-600">Produk: {selectedSaleForPrint.productName}</p>
                <p className="text-xs text-pink-600">Jumlah: {selectedSaleForPrint.quantity} unit</p>
                <p className="text-xs text-pink-600">Total: {formatCurrency(selectedSaleForPrint.totalAmount)}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCashierDialogOpen(false)}
                className="flex-1 border-pink-200 text-pink-600"
              >
                Batal
              </Button>
              <Button
                onClick={handlePrintWithCashier}
                disabled={!selectedCashier}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {printType === 'invoice' ? 'Cetak Invoice' : 'Cetak Kwitansi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}