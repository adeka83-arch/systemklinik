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
  created_at: string
  updated_at?: string
}

export function FieldTripSales({ accessToken, clinicSettings }: FieldTripSalesProps) {
  const [sales, setSales] = useState<FieldTripSale[]>([])
  const [products, setProducts] = useState<FieldTripProduct[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
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
      // Menggunakan endpoint khusus untuk karyawan aktif saja
      const response = await fetch(`${serverUrl}/employees/active`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('✅ Loaded active employees only:', data.employees?.length || 0, 'records')
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching active employees:', error)
      // Fallback ke endpoint biasa jika endpoint aktif belum tersedia
      try {
        const fallbackResponse = await fetch(`${serverUrl}/employees?active=true`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        const fallbackData = await fallbackResponse.json()
        if (fallbackResponse.ok) {
          console.log('✅ Loaded active employees via fallback:', fallbackData.employees?.length || 0, 'records')
          setEmployees(fallbackData.employees || [])
        }
      } catch (fallbackError) {
        console.log('Error with fallback employees endpoint:', fallbackError)
      }
    }
  }

  const calculateAmounts = () => {
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) return { totalAmount: 0, finalAmount: 0 }
    
    const totalAmount = selectedProduct.price * saleForm.quantity
    const finalAmount = totalAmount - saleForm.discount
    
    return { totalAmount, finalAmount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedProduct = products.find(p => p.id === saleForm.productId)
    if (!selectedProduct) {
      toast.error('Produk harus dipilih')
      return
    }

    const { totalAmount, finalAmount } = calculateAmounts()
    
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
        finalAmount
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

  const exportToExcel = () => {
    const today = new Date().toISOString().split('T')[0]
    const fileName = `penjualan-field-trip-${today}.csv`
    
    let csvContent = 'Tanggal,Customer,Organisasi,Produk,Jumlah,Total,Diskon,Final,Status,Event Date\n'
    
    filteredSales.forEach(sale => {
      csvContent += `"${sale.saleDate}","${sale.customerName}","${sale.organization || '-'}","${sale.productName}",${sale.quantity},${sale.totalAmount},${sale.discount},${sale.finalAmount},"${sale.status}","${sale.eventDate || '-'}"\n`
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    
    toast.success('Data penjualan field trip berhasil diekspor')
  }

  const printData = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const today = new Date().toLocaleDateString('id-ID')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Penjualan Field Trip</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #be185d; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #fce7f3; color: #be185d; font-weight: bold; }
            tr:nth-child(even) { background-color: #fef7ff; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { text-align: right; margin-bottom: 20px; }
            .summary { margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN PENJUALAN FIELD TRIP</h1>
          </div>
          <div class="date">Tanggal: ${today}</div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Customer</th>
                <th>Produk</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Final</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map((sale, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString('id-ID')}</td>
                  <td>${sale.customerName}</td>
                  <td>${sale.productName}</td>
                  <td>${sale.quantity}</td>
                  <td>Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
                  <td>Rp ${sale.finalAmount.toLocaleString('id-ID')}</td>
                  <td>${sale.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <p><strong>Total Transaksi: ${filteredSales.length}</strong></p>
            <p><strong>Total Pendapatan: Rp ${filteredSales.reduce((sum, sale) => sum + sale.finalAmount, 0).toLocaleString('id-ID')}</strong></p>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.print()
  }

  // Print functions for individual sales
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

  const generateInvoice = (sale: FieldTripSale) => {
    openCashierDialog(sale, 'invoice')
  }

  const generateReceipt = (sale: FieldTripSale) => {
    openCashierDialog(sale, 'receipt')
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

  const generateInvoiceWithCashier = (sale: FieldTripSale, cashierName: string, transactionDate: string) => {
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

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
            .amount-words { margin: 20px 0; padding: 15px; background: #fef7ff; border: 1px solid #fce7f3; border-radius: 5px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
            @media print { 
              body { margin: 0; } 
              .invoice-container { max-width: 100%; } 
              .logo { width: 110px; height: 110px; }
              .clinic-name { font-size: 26px; }
              .clinic-address { font-size: 15px; }
            }
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
                ${sale.customerAddress ? `<div class="info-row"><strong>Alamat:</strong> ${sale.customerAddress}</div>` : ''}
              </div>
              <div class="transaction-info">
                <h3>Informasi Transaksi:</h3>
                <div class="info-row"><strong>No. Invoice:</strong> FT-${sale.id.slice(-8).toUpperCase()}</div>
                <div class="info-row"><strong>Tanggal:</strong> ${new Date(transactionDate).toLocaleDateString('id-ID')}</div>
                <div class="info-row"><strong>Kasir:</strong> ${cashierName}</div>
                <div class="info-row"><strong>Status:</strong> ${statusOptions.find(s => s.value === sale.status)?.label}</div>
                ${sale.eventDate ? `<div class="info-row"><strong>Tanggal Event:</strong> ${new Date(sale.eventDate).toLocaleDateString('id-ID')}</div>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Paket Field Trip</th>
                  <th>Harga Satuan</th>
                  <th>Qty</th>
                  <th>Peserta</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>${sale.productName}</strong><br>
                    <small style="color: #666;">${products.find(p => p.id === sale.productId)?.category || ''}</small>
                    ${sale.eventDate ? `<br><small style="color: #666;">Event: ${new Date(sale.eventDate).toLocaleDateString('id-ID')}</small>` : ''}
                  </td>
                  <td>Rp ${sale.productPrice?.toLocaleString('id-ID')}</td>
                  <td>${sale.quantity}</td>
                  <td>${sale.participants} orang</td>
                  <td>Rp ${sale.totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">Subtotal: Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
              ${sale.discount > 0 ? `<div class="total-row">Diskon: -Rp ${sale.discount.toLocaleString('id-ID')}</div>` : ''}
              <div class="total-row grand-total">TOTAL: Rp ${sale.finalAmount.toLocaleString('id-ID')}</div>
            </div>

            <div class="amount-words">
              <strong>Terbilang:</strong> ${numberToWords(sale.finalAmount)} rupiah
            </div>

            ${sale.notes ? `<div style="margin: 20px 0;"><strong>Catatan:</strong> ${sale.notes}</div>` : ''}

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
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #be185d; padding-bottom: 15px; min-height: 120px; }
            .logo { width: 100px; height: 100px; margin-bottom: 15px; object-fit: contain; }
            .clinic-name { font-size: 22px; font-weight: bold; color: #be185d; margin: 8px 0; }
            .clinic-address { font-size: 14px; color: #666; line-height: 1.4; }
            .receipt-title { text-align: center; font-size: 16px; font-weight: bold; color: #be185d; margin: 15px 0; }
            .receipt-info { margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .info-label { font-weight: bold; }
            .separator { border-top: 1px dashed #ccc; margin: 15px 0; }
            .items { margin: 15px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .item-name { flex: 1; }
            .item-price { text-align: right; font-weight: bold; }
            .totals { border-top: 2px solid #be185d; padding-top: 10px; margin-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 16px; color: #be185d; }
            .amount-words { margin: 15px 0; padding: 10px; background: #fef7ff; border: 1px solid #fce7f3; border-radius: 3px; font-size: 12px; }
            .footer { margin-top: 20px; text-align: center; }
            .thank-you { font-style: italic; color: #666; }
            .receipt-footer { margin-top: 15px; font-size: 12px; text-align: center; color: #666; }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .receipt-container { max-width: 100%; } 
              .logo { width: 90px; height: 90px; }
              .clinic-name { font-size: 20px; }
              .clinic-address { font-size: 13px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="${logoSrc}" alt="Logo Klinik" class="logo" />
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-address">
                Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                Sawangan Lama, Kec. Sawangan<br>
                Depok, Jawa Barat<br>
                Telp/WA: 085283228355
              </div>
            </div>

            <div class="receipt-title">KWITANSI FIELD TRIP</div>

            <div class="receipt-info">
              <div class="info-row">
                <span class="info-label">No. Kwitansi:</span>
                <span>FT-${sale.id.slice(-8).toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span>${new Date(transactionDate).toLocaleDateString('id-ID')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer:</span>
                <span>${sale.customerName}</span>
              </div>
              ${sale.organization ? `
              <div class="info-row">
                <span class="info-label">Organisasi:</span>
                <span>${sale.organization}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Telepon:</span>
                <span>${sale.customerPhone}</span>
              </div>
              ${sale.eventDate ? `
              <div class="info-row">
                <span class="info-label">Tanggal Event:</span>
                <span>${new Date(sale.eventDate).toLocaleDateString('id-ID')}</span>
              </div>
              ` : ''}
            </div>

            <div class="separator"></div>

            <div class="items">
              <div class="item-row">
                <div class="item-name">
                  <strong>${sale.productName}</strong><br>
                  <small>${products.find(p => p.id === sale.productId)?.category || ''}</small><br>
                  <small>${sale.quantity} paket × ${sale.participants} peserta</small>
                </div>
                <div class="item-price">Rp ${sale.totalAmount.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>Rp ${sale.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              ${sale.discount > 0 ? `
              <div class="total-row">
                <span>Diskon:</span>
                <span>-Rp ${sale.discount.toLocaleString('id-ID')}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>TOTAL BAYAR:</span>
                <span>Rp ${sale.finalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div class="amount-words">
              <strong>Terbilang:</strong><br>
              ${numberToWords(sale.finalAmount)} rupiah
            </div>

            ${sale.paymentMethod ? `
            <div class="separator"></div>
            <div class="info-row">
              <span class="info-label">Metode Bayar:</span>
              <span>${sale.paymentMethod}</span>
            </div>
            ` : ''}

            ${sale.notes ? `
            <div class="separator"></div>
            <div style="margin: 10px 0;">
              <strong>Catatan:</strong><br>
              <small>${sale.notes}</small>
            </div>
            ` : ''}

            <div class="footer">
              <div class="thank-you">Terima kasih atas kepercayaan Anda!</div>
              <div class="receipt-footer">
                Kasir: ${cashierName}<br>
                ${new Date().toLocaleString('id-ID')}
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
    
    receiptWindow.document.close()
  }

  const { totalAmount, finalAmount } = calculateAmounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pink-800">Penjualan Field Trip</h2>
          <p className="text-pink-600">Kelola transaksi penjualan paket field trip</p>
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
          <Button onClick={() => openSaleDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Penjualan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari customer, organisasi, atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">Semua Status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Daftar Penjualan ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {filteredSales.map((sale, index) => (
                  <TableRow key={sale.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {new Date(sale.saleDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customerName}</div>
                        {sale.organization && (
                          <div className="text-sm text-gray-500">{sale.organization}</div>
                        )}
                        <div className="text-sm text-gray-500">{sale.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.productName}</div>
                        <div className="text-sm text-gray-500">
                          {sale.participants} peserta
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>Rp {sale.totalAmount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {sale.finalAmount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          sale.status === 'completed' ? 'default' :
                          sale.status === 'cancelled' ? 'destructive' : 'secondary'
                        }
                      >
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
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'Tidak ada penjualan yang ditemukan' : 'Belum ada data penjualan field trip'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? 'Edit Penjualan Field Trip' : 'Tambah Penjualan Field Trip'}
            </DialogTitle>
            <DialogDescription>
              {editingSale ? 'Perbarui informasi penjualan' : 'Tambahkan penjualan field trip baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Informasi Customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nama Customer *</Label>
                  <Input 
                    placeholder="Nama lengkap customer"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      customerName: e.target.value 
                    }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>No. Telepon *</Label>
                  <Input 
                    placeholder="08xxxxxxxxxx"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      customerPhone: e.target.value 
                    }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="email@example.com"
                    value={saleForm.customerEmail}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      customerEmail: e.target.value 
                    }))}
                  />
                </div>
                
                <div>
                  <Label>Organisasi/Instansi</Label>
                  <Input 
                    placeholder="Nama sekolah/organisasi"
                    value={saleForm.organization}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      organization: e.target.value 
                    }))}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Alamat</Label>
                <Textarea 
                  placeholder="Alamat lengkap customer"
                  value={saleForm.customerAddress}
                  onChange={(e) => setSaleForm(prev => ({ 
                    ...prev, 
                    customerAddress: e.target.value 
                  }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Product & Pricing */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Produk & Harga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Produk Field Trip *</Label>
                  <select
                    value={saleForm.productId}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      productId: e.target.value 
                    }))}
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
                    placeholder="0"
                    value={saleForm.participants}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      participants: parseInt(e.target.value) || 1 
                    }))}
                    required
                    min="1"
                  />
                </div>
                
                <div>
                  <Label>Quantity *</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 1 
                    }))}
                    required
                    min="1"
                  />
                </div>
                
                <div>
                  <Label>Diskon</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={saleForm.discount}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      discount: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                  />
                </div>
              </div>

              {/* Price Calculation */}
              {saleForm.productId && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diskon:</span>
                      <span>- Rp {saleForm.discount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total Final:</span>
                      <span>Rp {finalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event & Status */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Detail Event & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tanggal Penjualan *</Label>
                  <Input 
                    type="date"
                    value={saleForm.saleDate}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      saleDate: e.target.value 
                    }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>Tanggal Event</Label>
                  <Input 
                    type="date"
                    value={saleForm.eventDate}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      eventDate: e.target.value 
                    }))}
                  />
                </div>
                
                <div>
                  <Label>Status *</Label>
                  <select
                    value={saleForm.status}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      status: e.target.value as any 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment & Notes */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Pembayaran & Catatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Metode Pembayaran</Label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm(prev => ({ 
                      ...prev, 
                      paymentMethod: e.target.value 
                    }))}
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
              </div>
              
              <div className="mt-4">
                <Label>Catatan Pembayaran</Label>
                <Textarea 
                  placeholder="Catatan tambahan untuk pembayaran..."
                  value={saleForm.paymentNotes}
                  onChange={(e) => setSaleForm(prev => ({ 
                    ...prev, 
                    paymentNotes: e.target.value 
                  }))}
                  rows={2}
                />
              </div>
              
              <div className="mt-4">
                <Label>Catatan</Label>
                <Textarea 
                  placeholder="Catatan tambahan untuk penjualan..."
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
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
                  <Label>Status</Label>
                  <div>
                    <Badge 
                      variant={
                        viewingSale.status === 'completed' ? 'default' :
                        viewingSale.status === 'cancelled' ? 'destructive' : 'secondary'
                      }
                    >
                      {statusOptions.find(s => s.value === viewingSale.status)?.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Produk</Label>
                  <p className="font-medium">{viewingSale.productName}</p>
                </div>
                
                <div>
                  <Label>Peserta</Label>
                  <p>{viewingSale.participants} orang</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Penjualan</Label>
                  <p>{new Date(viewingSale.saleDate).toLocaleDateString('id-ID')}</p>
                </div>
                
                {viewingSale.eventDate && (
                  <div>
                    <Label>Tanggal Event</Label>
                    <p>{new Date(viewingSale.eventDate).toLocaleDateString('id-ID')}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <Label>Rincian Harga</Label>
                <div className="bg-gray-50 p-3 rounded-lg mt-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity x Harga:</span>
                      <span>{viewingSale.quantity} x Rp {viewingSale.productPrice?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {viewingSale.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diskon:</span>
                      <span>- Rp {viewingSale.discount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total Final:</span>
                      <span>Rp {viewingSale.finalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {viewingSale.paymentMethod && (
                <div>
                  <Label>Metode Pembayaran</Label>
                  <p>{viewingSale.paymentMethod}</p>
                </div>
              )}
              
              {viewingSale.notes && (
                <div>
                  <Label>Catatan</Label>
                  <p className="text-sm">{viewingSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cashier Selection Dialog for Printing */}
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
}