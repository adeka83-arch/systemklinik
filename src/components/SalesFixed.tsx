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
import { Trash2, Edit, Plus, ShoppingCart, TrendingUp, FileText, Receipt, Package } from 'lucide-react'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'

interface Sale {
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

export function SalesFixed({ accessToken, clinicSettings }: SalesProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    category: 'Produk Medis',
    quantity: 1,
    pricePerUnit: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Print dialog states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')

  const categories = [
    { value: 'Produk Medis', label: 'Produk Medis' },
    { value: 'Obat', label: 'Obat' },
    { value: 'Alat', label: 'Alat' },
    { value: 'Kosmetik', label: 'Kosmetik' },
    { value: 'Suplemen', label: 'Suplemen' }
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
        const simpleSales: Sale[] = (data.sales || []).map((sale: any) => {
          const firstItem = sale.items && sale.items.length > 0 ? sale.items[0] : null
          return {
            id: sale.id,
            productName: firstItem ? firstItem.productName : 'Unknown Product',
            category: firstItem ? (firstItem.category || 'Produk Medis') : 'Produk Medis',
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
        // Filter hanya produk yang memiliki stok > 0
        const availableProducts = (data.products || []).filter((product: Product) => 
          product.stock > 0
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

    // Data penjualan tanpa ketergantungan pasien
    const saleData = {
      items: [{
        productId: formData.productId,
        productName: formData.productName.trim(),
        category: formData.category,
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

  const handleEdit = (sale: Sale) => {
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
    setEditingId(sale.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data penjualan ini?\n\nStok produk akan dikembalikan secara otomatis.')) return

    try {
      const response = await fetch(`${serverUrl}/sales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await response.json()
      if (response.ok) {
        if (data.restoredStock !== null && data.restoredStock !== undefined) {
          toast.success(`Penjualan berhasil dihapus. Stok dikembalikan, tersisa: ${data.restoredStock}`)
        } else {
          toast.success('Penjualan berhasil dihapus')
        }
        fetchSales()
        fetchProducts() // Refresh to show updated stock
      } else {
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
      category: 'Produk Medis',
      quantity: 1,
      pricePerUnit: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
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
      'Alat': 'bg-emerald-100 text-emerald-800',
      'Kosmetik': 'bg-pink-100 text-pink-800',
      'Suplemen': 'bg-purple-100 text-purple-800',
      'Lainnya': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['Lainnya']
  }

  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  // Print functions
  const openCashierDialog = (sale: Sale, type: 'invoice' | 'receipt') => {
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

  const generateInvoiceWithCashier = (sale: Sale, cashierName: string, transactionDate: string) => {
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

  const generateReceiptWithCashier = (sale: Sale, cashierName: string, transactionDate: string) => {
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
              Sawangan, Depok, Jawa Barat<br>
              WA: 085283228355
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
              <div class="amount-label">Jumlah yang Diterima</div>
              <div class="amount-value">${formatCurrency(sale.totalAmount)}</div>
              <div class="amount-words">
                <strong>Terbilang:</strong> ${numberToWords(sale.totalAmount)} rupiah
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">Untuk Pembayaran:</span>
                <span>${sale.productName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Kategori:</span>
                <span>${sale.category}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span>${sale.quantity}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Harga Satuan:</span>
                <span>${formatCurrency(sale.pricePerUnit)}</span>
              </div>
            </div>
            
            ${sale.notes ? `
            <div class="notes">
              <strong>Catatan:</strong> ${sale.notes}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div class="signature-section">
              <div class="signature-label">Yang Menerima</div>
              <div class="signature-line">${cashierName}</div>
            </div>
          </div>
          
          <div class="print-info">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
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
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-pink-600">Memuat data penjualan...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-8 w-8 text-pink-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-500">Total Penjualan</div>
                <div className="text-2xl text-pink-600">{sales.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-500">Total Item</div>
                <div className="text-2xl text-emerald-600">{totalItems}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-500">Total Nilai</div>
                <div className="text-2xl text-blue-600">{formatCurrency(totalSalesAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl text-pink-800">Data Penjualan Produk</h2>
            <p className="text-sm text-pink-600">Kelola penjualan produk klinik</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Penjualan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Penjualan' : 'Tambah Penjualan Baru'}
                </DialogTitle>
                <DialogDescription>
                  Masukkan detail penjualan produk
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Pilih Produk</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={handleProductSelect}
                  >
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

                {!formData.productId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="productName">Nama Produk Manual</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                        placeholder="Masukkan nama produk"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">Harga Satuan</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Catatan tambahan..."
                    rows={3}
                  />
                </div>

                {formData.quantity > 0 && formData.pricePerUnit > 0 && (
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                    <div className="text-sm text-pink-800">
                      <strong>Total: {formatCurrency(formData.quantity * formData.pricePerUnit)}</strong>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 flex-1">
                    {editingId ? 'Perbarui' : 'Simpan'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada data penjualan</p>
              <p className="text-sm text-gray-400">Tambahkan penjualan pertama Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, index) => (
                    <TableRow key={sale.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{sale.productName}</div>
                          {sale.notes && (
                            <div className="text-xs text-gray-500">{sale.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryBadgeColor(sale.category)}>
                          {sale.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency(sale.pricePerUnit)}</TableCell>
                      <TableCell className="text-blue-600">{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sale)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCashierDialog(sale, 'invoice')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCashierDialog(sale, 'receipt')}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cashier Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </DialogTitle>
            <DialogDescription>
              Pilih kasir yang akan ditampilkan pada dokumen cetak
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kasir</Label>
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

            <div className="space-y-2">
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handlePrintWithCashier} 
                className="bg-pink-600 hover:bg-pink-700 flex-1"
                disabled={!selectedCashier}
              >
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCashierDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}