import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Search, Package, Edit, FileSpreadsheet, Printer, Plus, Trash2, Check, ChevronsUpDown, ShoppingCart, Calendar, User } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { cn } from './ui/utils'

interface Product {
  id: string
  name: string
  category: string
  stock: number
  unit: string
  price: number
  created_at: string
}

interface DentalMaterial {
  id: string
  name: string
  stock: number
  unit: string
  location?: string
  notes?: string
  created_at: string
}

interface DentalUsage {
  id: string
  materialId: string
  materialName: string
  quantity: number
  unit: string
  usedBy: string
  usageDate: string
  notes?: string
  created_at: string
}

interface PurchaseRequestItem {
  id: string
  name: string
  category: string
  currentStock: number
  unit: string
  requestedQuantity: number
  notes?: string
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Urgent'
}

interface PurchaseRequest {
  id?: string
  requestNumber: string
  requestDate: string
  requestedBy: string
  department: string
  items: PurchaseRequestItem[]
  totalItems: number
  notes?: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  created_at?: string
}



interface StockOpnameProps {
  accessToken: string
}

interface Employee {
  id: string
  name: string
  role: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
}

export function StockOpname({ accessToken }: StockOpnameProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [dentalMaterials, setDentalMaterials] = useState<DentalMaterial[]>([])
  const [dentalUsages, setDentalUsages] = useState<DentalUsage[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('obat')
  
  // Dialog states
  const [editStockDialogOpen, setEditStockDialogOpen] = useState(false)
  const [dentalMaterialDialogOpen, setDentalMaterialDialogOpen] = useState(false)
  const [dentalUsageDialogOpen, setDentalUsageDialogOpen] = useState(false)
  const [purchaseRequestDialogOpen, setPurchaseRequestDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingDentalMaterial, setEditingDentalMaterial] = useState<DentalMaterial | null>(null)
  
  // Form states
  const [stockUpdateForm, setStockUpdateForm] = useState({
    currentStock: 0,
    newStock: 0,
    notes: ''
  })

  const [dentalMaterialForm, setDentalMaterialForm] = useState({
    name: '',
    stock: 0,
    unit: '',
    location: '',
    notes: ''
  })

  const [dentalUsageForm, setDentalUsageForm] = useState({
    materialId: '',
    quantity: 0,
    usedBy: '',
    usageDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Purchase Request states
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest>({
    requestNumber: '',
    requestDate: new Date().toISOString().split('T')[0],
    requestedBy: '',
    department: 'Klinik',
    items: [],
    totalItems: 0,
    notes: '',
    status: 'Draft'
  })
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<{[key: string]: number}>({})
  const [itemPriorities, setItemPriorities] = useState<{[key: string]: string}>({})
  const [itemNotes, setItemNotes] = useState<{[key: string]: string}>({})

  // Search states for comboboxes
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false)
  const [staffSearchOpen, setStaffSearchOpen] = useState(false)



  useEffect(() => {
    fetchProducts()
    fetchDentalMaterials()
    fetchDentalUsages()
    fetchEmployees()
    fetchDoctors()
  }, [])

  // Auto-refresh data when purchase request dialog is opened
  useEffect(() => {
    if (purchaseRequestDialogOpen) {
      fetchProducts()
      fetchDentalMaterials()
      fetchEmployees()
      fetchDoctors()
    }
  }, [purchaseRequestDialogOpen])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('StockOpname: Fetching products from:', `${serverUrl}/products`)
      console.log('StockOpname: Using accessToken:', accessToken ? 'Available' : 'Missing')
      
      const response = await fetch(`${serverUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('StockOpname: Products fetch response status:', response.status)
      console.log('StockOpname: Products fetch response ok:', response.ok)
      
      const data = await response.json()
      console.log('StockOpname: Products response data:', data)
      
      if (response.ok && data.success) {
        const productsData = data.products || []
        console.log('StockOpname: Setting products data:', productsData)
        console.log('StockOpname: Number of products found:', productsData.length)
        setProducts(productsData)
        
        if (productsData.length === 0) {
          toast.info('Belum ada data produk untuk stock opname')
        } else {
          console.log(`StockOpname: Successfully loaded ${productsData.length} products`)
        }
      } else {
        console.error('StockOpname: Failed to fetch products - Server error:', data)
        toast.error('Gagal mengambil data produk: ' + (data.error || response.statusText || 'Unknown error'))
      }
    } catch (error) {
      console.error('StockOpname: Error fetching products:', error)
      toast.error('Terjadi kesalahan saat mengambil data produk: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDentalMaterials = async () => {
    try {
      console.log('StockOpname: Fetching dental materials from:', `${serverUrl}/dental-materials`)
      
      const response = await fetch(`${serverUrl}/dental-materials`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('StockOpname: Dental materials fetch response status:', response.status)
      const data = await response.json()
      console.log('StockOpname: Dental materials response data:', data)
      
      if (response.ok && data.success) {
        const materialsData = data.materials || []
        console.log('StockOpname: Setting dental materials data:', materialsData)
        setDentalMaterials(materialsData)
      } else {
        console.error('StockOpname: Failed to fetch dental materials:', data)
        toast.error('Gagal mengambil data bahan dental: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('StockOpname: Error fetching dental materials:', error)
      toast.error('Terjadi kesalahan saat mengambil data bahan dental: ' + error.message)
    }
  }

  const fetchDentalUsages = async () => {
    try {
      console.log('StockOpname: Fetching dental usages from:', `${serverUrl}/dental-usages`)
      
      const response = await fetch(`${serverUrl}/dental-usages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('StockOpname: Dental usages fetch response status:', response.status)
      const data = await response.json()
      console.log('StockOpname: Dental usages response data:', data)
      
      if (response.ok && data.success) {
        const usagesData = data.usages || []
        console.log('StockOpname: Setting dental usages data:', usagesData)
        setDentalUsages(usagesData)
      } else {
        console.error('StockOpname: Failed to fetch dental usages:', data)
        toast.error('Gagal mengambil data pemakaian bahan dental: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('StockOpname: Error fetching dental usages:', error)
      toast.error('Terjadi kesalahan saat mengambil data pemakaian bahan dental: ' + error.message)
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



  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      setLoading(true)
      
      const updatedProduct = {
        ...editingProduct,
        stock: stockUpdateForm.newStock
      }

      const response = await fetch(`${serverUrl}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updatedProduct)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Stok berhasil diperbarui')
        fetchProducts()
        resetStockForm()
      } else {
        toast.error(data.error || 'Gagal memperbarui stok')
      }
    } catch (error) {
      console.log('Error updating stock:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDentalMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const url = editingDentalMaterial 
        ? `${serverUrl}/dental-materials/${editingDentalMaterial.id}`
        : `${serverUrl}/dental-materials`
      
      const method = editingDentalMaterial ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(dentalMaterialForm)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(editingDentalMaterial ? 'Bahan dental berhasil diperbarui' : 'Bahan dental berhasil ditambahkan')
        fetchDentalMaterials()
        resetDentalMaterialForm()
      } else {
        toast.error(data.error || 'Gagal menyimpan bahan dental')
      }
    } catch (error) {
      console.log('Error saving dental material:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDentalUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Find selected material to get name and validate stock
      const selectedMaterial = dentalMaterials.find(m => m.id === dentalUsageForm.materialId)
      if (!selectedMaterial) {
        toast.error('Pilih bahan dental terlebih dahulu')
        return
      }
      
      if (selectedMaterial.stock === 0) {
        toast.error(`Bahan dental "${selectedMaterial.name}" tidak tersedia (stok habis)`)
        return
      }
      
      if (selectedMaterial.stock < dentalUsageForm.quantity) {
        toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedMaterial.stock} ${selectedMaterial.unit}`)
        return
      }

      const usageData = {
        ...dentalUsageForm,
        materialName: selectedMaterial.name,
        unit: selectedMaterial.unit
      }

      const response = await fetch(`${serverUrl}/dental-usages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(usageData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Penggunaan bahan dental berhasil dicatat')
        fetchDentalUsages()
        fetchDentalMaterials() // Refresh untuk update stok
        resetDentalUsageForm()
      } else {
        toast.error(data.error || 'Gagal mencatat penggunaan bahan dental')
      }
    } catch (error) {
      console.log('Error saving dental usage:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }





  const openStockUpdateDialog = (product: Product) => {
    setEditingProduct(product)
    setStockUpdateForm({
      currentStock: product.stock,
      newStock: product.stock,
      notes: ''
    })
    setEditStockDialogOpen(true)
  }

  const openDentalMaterialDialog = (material?: DentalMaterial) => {
    if (material) {
      setEditingDentalMaterial(material)
      setDentalMaterialForm({
        name: material.name,
        stock: material.stock,
        unit: material.unit,
        location: material.location || '',
        notes: material.notes || ''
      })
    } else {
      setEditingDentalMaterial(null)
      resetDentalMaterialForm()
    }
    setDentalMaterialDialogOpen(true)
  }

  const openDentalUsageDialog = () => {
    resetDentalUsageForm()
    setDentalUsageDialogOpen(true)
  }

  const handleDeleteDentalMaterial = async (material: DentalMaterial) => {
    if (!confirm(`Hapus bahan dental ${material.name}?`)) return

    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/dental-materials/${material.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Bahan dental berhasil dihapus')
        fetchDentalMaterials()
      } else {
        toast.error(data.error || 'Gagal menghapus bahan dental')
      }
    } catch (error) {
      console.log('Error deleting dental material:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDentalUsage = async (usage: DentalUsage) => {
    if (!confirm(`Hapus catatan penggunaan ${usage.materialName}?`)) return

    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/dental-usages/${usage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Catatan penggunaan berhasil dihapus')
        fetchDentalUsages()
        fetchDentalMaterials() // Refresh untuk mengembalikan stok
      } else {
        toast.error(data.error || 'Gagal menghapus catatan penggunaan')
      }
    } catch (error) {
      console.log('Error deleting dental usage:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }



  const resetStockForm = () => {
    setStockUpdateForm({
      currentStock: 0,
      newStock: 0,
      notes: ''
    })
    setEditingProduct(null)
    setEditStockDialogOpen(false)
  }

  const resetDentalMaterialForm = () => {
    setDentalMaterialForm({
      name: '',
      stock: 0,
      unit: '',
      location: '',
      notes: ''
    })
    setEditingDentalMaterial(null)
    setDentalMaterialDialogOpen(false)
  }

  const resetDentalUsageForm = () => {
    setDentalUsageForm({
      materialId: '',
      quantity: 0,
      usedBy: '',
      usageDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setMaterialSearchOpen(false)
    setStaffSearchOpen(false)
    setDentalUsageDialogOpen(false)
  }

  // Purchase Request Functions
  const generateRequestNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `PR-${year}${month}${day}-${random}`
  }

  const openPurchaseRequestDialog = () => {
    const requestNumber = generateRequestNumber()
    setPurchaseRequest(prev => ({
      ...prev,
      requestNumber,
      requestDate: new Date().toISOString().split('T')[0],
      items: [],
      totalItems: 0
    }))
    setSelectedItems(new Set())
    setItemQuantities({})
    setItemPriorities({})
    setItemNotes({})
    setPurchaseRequestDialogOpen(true)
  }

  const getAllAvailableItems = () => {
    // Filter hanya kategori yang dibutuhkan: Obat, Produk Medis, Stok Bahan
    const allowedCategories = ['Obat', 'Produk Medis', 'Stok Bahan']
    
    const allItems = [
      // Filter produk hanya yang memiliki kategori yang diizinkan
      ...products
        .filter(p => allowedCategories.includes(p.category))
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          currentStock: p.stock,
          unit: p.unit,
          type: 'product'
        })),
      // Ubah kategori dental materials menjadi "Stok Bahan"
      ...dentalMaterials.map(m => ({
        id: m.id,
        name: m.name,
        category: 'Stok Bahan',
        currentStock: m.stock,
        unit: m.unit,
        type: 'material'
      }))
    ]
    return allItems
  }

  const handleItemSelection = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems)
    if (selected) {
      newSelected.add(itemId)
      // Set default values
      setItemQuantities(prev => ({ ...prev, [itemId]: 1 }))
      setItemPriorities(prev => ({ ...prev, [itemId]: 'Sedang' }))
    } else {
      newSelected.delete(itemId)
      // Remove from other states
      setItemQuantities(prev => {
        const newQuantities = { ...prev }
        delete newQuantities[itemId]
        return newQuantities
      })
      setItemPriorities(prev => {
        const newPriorities = { ...prev }
        delete newPriorities[itemId]
        return newPriorities
      })
      setItemNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[itemId]
        return newNotes
      })
    }
    setSelectedItems(newSelected)
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }))
  }

  const updateItemPriority = (itemId: string, priority: string) => {
    setItemPriorities(prev => ({ ...prev, [itemId]: priority }))
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: notes }))
  }

  const generatePurchaseRequest = () => {
    if (selectedItems.size === 0) {
      toast.error('Pilih minimal satu item untuk pengajuan pembelian')
      return
    }

    if (!purchaseRequest.requestedBy.trim()) {
      toast.error('Nama pengaju harus dipilih dari daftar karyawan')
      return
    }

    if (employees.length === 0 && doctors.length === 0) {
      toast.error('Data karyawan/dokter tidak tersedia. Pastikan sudah menambahkan data karyawan atau dokter.')
      return
    }

    const allItems = getAllAvailableItems()
    const requestItems: PurchaseRequestItem[] = Array.from(selectedItems).map(itemId => {
      const item = allItems.find(i => i.id === itemId)!
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        requestedQuantity: itemQuantities[itemId] || 1,
        priority: (itemPriorities[itemId] || 'Sedang') as any,
        notes: itemNotes[itemId] || ''
      }
    })

    const finalRequest: PurchaseRequest = {
      ...purchaseRequest,
      items: requestItems,
      totalItems: requestItems.length,
      status: 'Draft'
    }

    printPurchaseRequest(finalRequest)
  }

  const printPurchaseRequest = (request: PurchaseRequest) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const today = new Date().toLocaleDateString('id-ID')
    
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Formulir Pengajuan Pembelian - ${request.requestNumber}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .title { font-size: 16px; font-weight: bold; margin: 20px 0; text-align: center; }
        .request-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .request-info div { width: 48%; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { width: 120px; font-weight: bold; }
        .info-value { flex: 1; border-bottom: 1px dotted #333; padding-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #fce7f3; font-weight: bold; color: #9d174d; text-align: center; }
        .text-center { text-align: center; }
        .priority-urgent { color: #dc2626; font-weight: bold; }
        .priority-tinggi { color: #ea580c; font-weight: bold; }
        .priority-sedang { color: #d97706; }
        .priority-rendah { color: #059669; }
        .notes-section { margin-top: 20px; }
        .notes-label { font-weight: bold; margin-bottom: 8px; }
        .notes-box { border: 1px solid #333; min-height: 60px; padding: 8px; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 30%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; font-size: 10px; }
        .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .status-draft { background-color: #f3f4f6; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-name">Falasifah Dental Clinic</div>
        <div>Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama</div>
        <div>Kec. Sawangan, Depok, Jawa Barat - Telp/WA: 085283228355</div>
    </div>

    <div class="title">FORMULIR PENGAJUAN PEMBELIAN OBAT & BAHAN MEDIS</div>
    
    <div class="request-info">
        <div>
            <div class="info-row">
                <span class="info-label">No. Pengajuan:</span>
                <span class="info-value">${request.requestNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span class="info-value">${new Date(request.requestDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Departemen:</span>
                <span class="info-value">${request.department}</span>
            </div>
        </div>
        <div>
            <div class="info-row">
                <span class="info-label">Nama Pengaju:</span>
                <span class="info-value">${request.requestedBy}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Item:</span>
                <span class="info-value">${request.totalItems} item</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                    <span class="status-badge status-draft">${request.status}</span>
                </span>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 15%;">Kategori</th>
                <th style="width: 25%;">Nama Item</th>
                <th style="width: 10%;">Stok Saat Ini</th>
                <th style="width: 10%;">Jumlah Diminta</th>
                <th style="width: 8%;">Satuan</th>
                <th style="width: 10%;">Prioritas</th>
                <th style="width: 17%;">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            ${request.items.map((item, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.category}</td>
                    <td>${item.name}</td>
                    <td class="text-center">${item.currentStock}</td>
                    <td class="text-center">${item.requestedQuantity}</td>
                    <td class="text-center">${item.unit}</td>
                    <td class="text-center">
                        <span class="priority-${item.priority.toLowerCase()}">${item.priority}</span>
                    </td>
                    <td>${item.notes || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    ${request.notes ? `
    <div class="notes-section">
        <div class="notes-label">Catatan Tambahan:</div>
        <div class="notes-box">${request.notes}</div>
    </div>
    ` : `
    <div class="notes-section">
        <div class="notes-label">Catatan Tambahan:</div>
        <div class="notes-box"></div>
    </div>
    `}

    <div class="signature">
        <div class="signature-box">
            <div>Pengaju</div>
            <div class="signature-line">${request.requestedBy}</div>
        </div>
        <div class="signature-box">
            <div>Supervisor</div>
            <div class="signature-line">(_________________)</div>
        </div>
        <div class="signature-box">
            <div>Manager</div>
            <div class="signature-line">(_________________)</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`

    printWindow.document.write(printHTML)
    printWindow.document.close()
    toast.success('Formulir pengajuan pembelian sedang dicetak')
    setPurchaseRequestDialogOpen(false)
  }



  const exportToExcel = () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Export stock data
    const stockFileName = `stock-inventori-${today}.csv`
    let stockContent = 'Kategori,Nama Item,Stok Saat Ini,Satuan,Lokasi,Status\n'
    
    // Add medicines
    const medicines = products.filter(p => p.category === 'Obat')
    medicines.forEach(item => {
      const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
      stockContent += `Obat,"${item.name}",${item.stock},"${item.unit}","-","${status}"\n`
    })
    
    // Add medical products
    const medicalProducts = products.filter(p => p.category === 'Produk Medis')
    medicalProducts.forEach(item => {
      const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
      stockContent += `Produk Medis,"${item.name}",${item.stock},"${item.unit}","-","${status}"\n`
    })
    
    // Add dental materials
    dentalMaterials.forEach(item => {
      const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
      stockContent += `Bahan Dental,"${item.name}",${item.stock},"${item.unit}","${item.location || '-'}","${status}"\n`
    })
    
    const stockBlob = new Blob([stockContent], { type: 'text/csv;charset=utf-8;' })
    const stockLink = document.createElement('a')
    stockLink.href = URL.createObjectURL(stockBlob)
    stockLink.download = stockFileName
    stockLink.click()
    
    // Export usage data if there's any
    if (dentalUsages.length > 0) {
      const usageFileName = `pemakaian-bahan-dental-${today}.csv`
      let usageContent = 'Tanggal,Nama Bahan,Jumlah Digunakan,Satuan,Digunakan Oleh,Catatan\n'
      
      dentalUsages.forEach(usage => {
        usageContent += `"${new Date(usage.usageDate).toLocaleDateString('id-ID')}","${usage.materialName}",${usage.quantity},"${usage.unit}","${usage.usedBy}","${usage.notes || '-'}"\n`
      })
      
      setTimeout(() => {
        const usageBlob = new Blob([usageContent], { type: 'text/csv;charset=utf-8;' })
        const usageLink = document.createElement('a')
        usageLink.href = URL.createObjectURL(usageBlob)
        usageLink.download = usageFileName
        usageLink.click()
      }, 1000)
    }
    
    toast.success('Data berhasil diekspor')
  }

  const printStockOpname = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const today = new Date().toLocaleDateString('id-ID')
    
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Stok Opname - ${today}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }
        .clinic-name { font-size: 20px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .title { font-size: 16px; font-weight: bold; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #fce7f3; font-weight: bold; color: #9d174d; }
        .category-header { background-color: #e91e63; color: white; font-weight: bold; text-align: center; }
        tbody tr:nth-child(even) { background-color: #fef7ff; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 30%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-name">Falasifah Dental Clinic</div>
        <div>Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19, Sawangan Lama</div>
        <div>Kec. Sawangan, Depok, Jawa Barat - Telp/WA: 085283228355</div>
    </div>

    <div class="title">LAPORAN STOK OPNAME</div>
    <p>Tanggal: ${today}</p>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Kategori</th>
                <th>Nama Item</th>
                <th>Stok Saat Ini</th>
                <th>Satuan</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${products.filter(p => p.category === 'Obat').map((item, index) => {
              const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
              return `
                <tr>
                    <td>${index + 1}</td>
                    <td>Obat</td>
                    <td>${item.name}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${status}</td>
                </tr>
            `}).join('')}
            ${products.filter(p => p.category === 'Produk Medis').map((item, index) => {
              const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
              const startIndex = products.filter(p => p.category === 'Obat').length
              return `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>Produk Medis</td>
                    <td>${item.name}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${status}</td>
                </tr>
            `}).join('')}
            ${dentalMaterials.map((item, index) => {
              const status = item.stock === 0 ? 'Habis' : item.stock <= 5 ? 'Menipis' : 'Aman'
              const startIndex = products.filter(p => p.category === 'Obat' || p.category === 'Produk Medis').length
              return `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>Bahan Dental</td>
                    <td>${item.name}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${status}</td>
                </tr>
            `}).join('')}

        </tbody>
    </table>

    <div class="signature">
        <div class="signature-box">
            <div>Penanggung Jawab</div>
            <div class="signature-line">(_________________)</div>
        </div>
        <div class="signature-box">
            <div>Supervisor</div>
            <div class="signature-line">(_________________)</div>
        </div>
        <div class="signature-box">
            <div>Manager</div>
            <div class="signature-line">(_________________)</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`

    printWindow.document.write(printHTML)
    printWindow.document.close()
    toast.success('Laporan stok opname sedang dicetak')
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Habis</Badge>
    if (stock <= 5) return <Badge className="bg-yellow-100 text-yellow-800">Menipis</Badge>
    return <Badge className="bg-green-100 text-green-800">Aman</Badge>
  }

  const filteredProducts = (category: string) => {
    return products
      .filter(p => p.category === category)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  const filteredDentalMaterials = dentalMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDentalUsages = dentalUsages.filter(u => 
    u.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.usedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Combine employees and doctors for dropdown
  const staffOptions = [
    ...employees.map(emp => ({ value: emp.name, label: `${emp.name} (${emp.role})`, type: 'Karyawan' })),
    ...doctors.map(doc => ({ value: doc.name, label: `${doc.name} (Dokter ${doc.specialization})`, type: 'Dokter' }))
  ].sort((a, b) => a.label.localeCompare(b.label))



  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-pink-800">Stock Opname</h2>
          <p className="text-pink-600">Kelola dan pantau stok inventori obat, produk medis, dan bahan dental</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={printStockOpname} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nama item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="obat" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Obat ({filteredProducts('Obat').length})
          </TabsTrigger>
          <TabsTrigger value="produk-medis" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produk Medis ({filteredProducts('Produk Medis').length})
          </TabsTrigger>
          <TabsTrigger value="stock-dental" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Bahan ({filteredDentalMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="usage-dental" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pemakaian ({filteredDentalUsages.length})
          </TabsTrigger>
          <TabsTrigger value="purchase-request" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pengajuan Pembelian
          </TabsTrigger>
        </TabsList>

        {/* Obat Tab */}
        <TabsContent value="obat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stok Obat (Auto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Obat</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts('Obat').map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-center font-bold">{product.stock}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{getStockStatus(product.stock)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStockUpdateDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts('Obat').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          {searchTerm ? 'Tidak ada obat yang ditemukan' : 'Belum ada data obat'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produk Medis Tab */}
        <TabsContent value="produk-medis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stok Produk Medis (Auto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts('Produk Medis').map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-center font-bold">{product.stock}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{getStockStatus(product.stock)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStockUpdateDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts('Produk Medis').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          {searchTerm ? 'Tidak ada produk medis yang ditemukan' : 'Belum ada data produk medis'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Bahan Dental Tab */}
        <TabsContent value="stock-dental">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Bahan Dental
                </CardTitle>
                <Button onClick={() => openDentalMaterialDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Bahan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Bahan</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDentalMaterials.map((material, index) => (
                      <TableRow key={material.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell className="text-center font-bold">{material.stock}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>{material.location || '-'}</TableCell>
                        <TableCell>{getStockStatus(material.stock)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDentalMaterialDialog(material)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDentalMaterial(material)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDentalMaterials.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          {searchTerm ? 'Tidak ada bahan dental yang ditemukan' : 'Belum ada data bahan dental'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pemakaian Bahan Dental Tab */}
        <TabsContent value="usage-dental">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pemakaian Bahan Dental
                </CardTitle>
                <Button onClick={openDentalUsageDialog} disabled={dentalMaterials.length === 0 || staffOptions.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Input Pemakaian
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(dentalMaterials.length === 0 || staffOptions.length === 0) && (
                <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  {dentalMaterials.length === 0 && (
                    <>
                      <p className="text-gray-600">Belum ada stock bahan dental di sistem</p>
                      <p className="text-sm text-gray-500">Tambahkan stock bahan dental terlebih dahulu di tab "Stock Bahan"</p>
                    </>
                  )}
                  {staffOptions.length === 0 && dentalMaterials.length > 0 && (
                    <>
                      <p className="text-gray-600">Belum ada data karyawan/dokter di sistem</p>
                      <p className="text-sm text-gray-500">Tambahkan data karyawan atau dokter terlebih dahulu di menu terkait</p>
                    </>
                  )}
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama Bahan</TableHead>
                      <TableHead>Jumlah Digunakan</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Digunakan Oleh</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDentalUsages.map((usage, index) => (
                      <TableRow key={usage.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(usage.usageDate).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="font-medium">{usage.materialName}</TableCell>
                        <TableCell className="text-center font-bold">{usage.quantity}</TableCell>
                        <TableCell>{usage.unit}</TableCell>
                        <TableCell>{usage.usedBy}</TableCell>
                        <TableCell>{usage.notes || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDentalUsage(usage)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDentalUsages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500">
                          {searchTerm ? 'Tidak ada data pemakaian yang ditemukan' : 'Belum ada data pemakaian bahan dental'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Request Tab */}
        <TabsContent value="purchase-request">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pengajuan Pembelian Obat & Bahan Medis
                </CardTitle>
                <Button onClick={openPurchaseRequestDialog} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Pengajuan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Buat Pengajuan Pembelian</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Pilih item dari stok yang tersedia untuk membuat formulir pengajuan pembelian obat dan bahan medis.
                </p>
                <Button onClick={openPurchaseRequestDialog} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Mulai Pengajuan Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Stock Update Dialog */}
      <Dialog open={editStockDialogOpen} onOpenChange={setEditStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stok - {editingProduct?.name}</DialogTitle>
            <DialogDescription>
              Perbarui jumlah stok untuk item ini
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div>
              <Label>Stok Saat Ini</Label>
              <Input 
                type="number"
                value={stockUpdateForm.currentStock}
                disabled
              />
            </div>
            
            <div>
              <Label>Stok Baru *</Label>
              <Input 
                type="number"
                value={stockUpdateForm.newStock}
                onChange={(e) => setStockUpdateForm(prev => ({ 
                  ...prev, 
                  newStock: parseInt(e.target.value) || 0 
                }))}
                required
                min="0"
              />
            </div>
            
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea 
                placeholder="Alasan perubahan stok..."
                value={stockUpdateForm.notes}
                onChange={(e) => setStockUpdateForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={resetStockForm}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dental Material Dialog */}
      <Dialog open={dentalMaterialDialogOpen} onOpenChange={setDentalMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDentalMaterial ? 'Edit Bahan Dental' : 'Tambah Bahan Dental'}
            </DialogTitle>
            <DialogDescription>
              {editingDentalMaterial ? 'Perbarui data bahan dental' : 'Tambahkan bahan dental baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDentalMaterialSubmit} className="space-y-4">
            <div>
              <Label>Nama Bahan *</Label>
              <Input 
                placeholder="Nama bahan dental"
                value={dentalMaterialForm.name}
                onChange={(e) => setDentalMaterialForm(prev => ({ 
                  ...prev, 
                  name: e.target.value 
                }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stok *</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={dentalMaterialForm.stock}
                  onChange={(e) => setDentalMaterialForm(prev => ({ 
                    ...prev, 
                    stock: parseInt(e.target.value) || 0 
                  }))}
                  required
                  min="0"
                />
              </div>
              
              <div>
                <Label>Satuan *</Label>
                <Input 
                  placeholder="pcs, box, botol, dll"
                  value={dentalMaterialForm.unit}
                  onChange={(e) => setDentalMaterialForm(prev => ({ 
                    ...prev, 
                    unit: e.target.value 
                  }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Lokasi Penyimpanan</Label>
              <Input 
                placeholder="Rak A1, Lemari B2, dll"
                value={dentalMaterialForm.location}
                onChange={(e) => setDentalMaterialForm(prev => ({ 
                  ...prev, 
                  location: e.target.value 
                }))}
              />
            </div>
            
            <div>
              <Label>Catatan</Label>
              <Textarea 
                placeholder="Catatan tambahan..."
                value={dentalMaterialForm.notes}
                onChange={(e) => setDentalMaterialForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDentalMaterialForm}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dental Usage Dialog */}
      <Dialog open={dentalUsageDialogOpen} onOpenChange={setDentalUsageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Pemakaian Bahan Dental</DialogTitle>
            <DialogDescription>
              Catat pemakaian bahan dental yang akan mengurangi stok. Gunakan fitur pencarian untuk mempermudah pemilihan bahan dental dan karyawan/dokter.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDentalUsageSubmit} className="space-y-4">
            <div>
              <Label>Bahan Dental *</Label>
              <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialSearchOpen}
                    className="w-full justify-between text-left font-normal"
                  >
                    {dentalUsageForm.materialId 
                      ? (() => {
                          const selectedMaterial = dentalMaterials.find(m => m.id === dentalUsageForm.materialId)
                          return selectedMaterial 
                            ? `${selectedMaterial.name} (Stok: ${selectedMaterial.stock} ${selectedMaterial.unit})`
                            : "Pilih bahan dental..."
                        })()
                      : "Pilih bahan dental..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari bahan dental..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada bahan dental ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {dentalMaterials.map((material) => (
                          <CommandItem
                            key={material.id}
                            value={`${material.name} ${material.stock} ${material.unit}`}
                            onSelect={() => {
                              setDentalUsageForm(prev => ({ 
                                ...prev, 
                                materialId: material.id 
                              }))
                              setMaterialSearchOpen(false)
                            }}
                            className={cn(
                              "flex items-center justify-between",
                              material.stock === 0 && "opacity-50"
                            )}
                            disabled={material.stock === 0}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{material.name}</span>
                              <span className="text-sm text-gray-500">
                                Stok: {material.stock} {material.unit}
                                {material.location && ` • ${material.location}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {material.stock === 0 && (
                                <Badge variant="destructive" className="text-xs">Habis</Badge>
                              )}
                              {material.stock > 0 && material.stock <= 5 && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Menipis</Badge>
                              )}
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  dentalUsageForm.materialId === material.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {dentalMaterials.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  ⚠️ Belum ada stock bahan dental. Tambahkan stock terlebih dahulu di tab "Stock Bahan".
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jumlah Digunakan *</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={dentalUsageForm.quantity}
                  onChange={(e) => setDentalUsageForm(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  required
                  min="1"
                />
              </div>
              
              <div>
                <Label>Tanggal Pemakaian *</Label>
                <Input 
                  type="date"
                  value={dentalUsageForm.usageDate}
                  onChange={(e) => setDentalUsageForm(prev => ({ 
                    ...prev, 
                    usageDate: e.target.value 
                  }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Digunakan Oleh *</Label>
              <Popover open={staffSearchOpen} onOpenChange={setStaffSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={staffSearchOpen}
                    className="w-full justify-between text-left font-normal"
                  >
                    {dentalUsageForm.usedBy 
                      ? (() => {
                          const selectedStaff = staffOptions.find(s => s.value === dentalUsageForm.usedBy)
                          return selectedStaff ? selectedStaff.label : "Pilih karyawan/dokter..."
                        })()
                      : "Pilih karyawan/dokter..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari karyawan/dokter..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada karyawan/dokter ditemukan.</CommandEmpty>
                      <CommandGroup heading="Karyawan">
                        {staffOptions.filter(staff => staff.type === 'Karyawan').map((staff) => (
                          <CommandItem
                            key={staff.value}
                            value={staff.label}
                            onSelect={() => {
                              setDentalUsageForm(prev => ({ 
                                ...prev, 
                                usedBy: staff.value 
                              }))
                              setStaffSearchOpen(false)
                            }}
                            className="flex items-center justify-between"
                          >
                            <span>{staff.label}</span>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                dentalUsageForm.usedBy === staff.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Dokter">
                        {staffOptions.filter(staff => staff.type === 'Dokter').map((staff) => (
                          <CommandItem
                            key={staff.value}
                            value={staff.label}
                            onSelect={() => {
                              setDentalUsageForm(prev => ({ 
                                ...prev, 
                                usedBy: staff.value 
                              }))
                              setStaffSearchOpen(false)
                            }}
                            className="flex items-center justify-between"
                          >
                            <span>{staff.label}</span>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                dentalUsageForm.usedBy === staff.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {staffOptions.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  ⚠️ Data karyawan/dokter tidak tersedia. Pastikan sudah menambahkan data karyawan atau dokter.
                </p>
              )}
              {staffOptions.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Tersedia {staffOptions.length} karyawan/dokter dalam daftar
                </p>
              )}
            </div>
            
            <div>
              <Label>Catatan</Label>
              <Textarea 
                placeholder="Catatan pemakaian (opsional)..."
                value={dentalUsageForm.notes}
                onChange={(e) => setDentalUsageForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Catat Pemakaian'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDentalUsageForm}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Purchase Request Dialog - Fixed Positioning */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          purchaseRequestDialogOpen ? 'block' : 'hidden'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <div className="relative w-full max-w-7xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-b bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-pink-800 flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
                  Formulir Pengajuan Pembelian Obat & Bahan Medis
                </h2>
                <p className="text-pink-600 mt-1 text-sm lg:text-base">
                  Pilih item dan isi form untuk membuat pengajuan pembelian
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPurchaseRequestDialogOpen(false)}
                className="text-pink-600 hover:text-pink-800 hover:bg-pink-100 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
          </div>
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="space-y-6">
              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border">
                <div>
                  <Label className="text-sm lg:text-base font-semibold text-gray-700">No. Pengajuan</Label>
                  <Input
                    value={purchaseRequest.requestNumber}
                    disabled
                    className="bg-white mt-1 lg:mt-2 text-sm lg:text-base h-10 lg:h-12 border-2"
                  />
                </div>
                <div>
                  <Label className="text-sm lg:text-base font-semibold text-gray-700">Tanggal Pengajuan</Label>
                  <Input
                    type="date"
                    value={purchaseRequest.requestDate}
                    onChange={(e) => setPurchaseRequest(prev => ({
                      ...prev,
                      requestDate: e.target.value
                    }))}
                    className="mt-1 lg:mt-2 text-sm lg:text-base h-10 lg:h-12 border-2"
                  />
                </div>
                <div>
                  <Label className="text-sm lg:text-base font-semibold text-gray-700">Departemen</Label>
                  <Input
                    value={purchaseRequest.department}
                    onChange={(e) => setPurchaseRequest(prev => ({
                      ...prev,
                      department: e.target.value
                    }))}
                    className="mt-1 lg:mt-2 text-sm lg:text-base h-10 lg:h-12 border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <Label className="text-sm lg:text-base font-semibold text-gray-700">Nama Pengaju *</Label>
                  <Select
                    value={purchaseRequest.requestedBy}
                    onValueChange={(value) => setPurchaseRequest(prev => ({
                      ...prev,
                      requestedBy: value
                    }))}
                    disabled={employees.length === 0 && doctors.length === 0}
                  >
                    <SelectTrigger className="mt-1 lg:mt-2 text-sm lg:text-base h-10 lg:h-12 border-2">
                      <SelectValue placeholder={
                        employees.length === 0 && doctors.length === 0 
                          ? "Tidak ada data karyawan/dokter" 
                          : "Pilih nama pengaju..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 && doctors.length === 0 ? (
                        <SelectItem value="no-data" disabled className="text-gray-500">
                          Tidak ada data karyawan/dokter
                        </SelectItem>
                      ) : (
                        <>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.name} className="text-sm lg:text-base">
                              {employee.name} - {employee.role}
                            </SelectItem>
                          ))}
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.name} className="text-sm lg:text-base">
                              {doctor.name} - Dokter {doctor.specialization}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {employees.length === 0 && doctors.length === 0 && (
                    <p className="text-xs lg:text-sm text-red-500 mt-1 lg:mt-2">
                      ⚠️ Tambahkan data karyawan atau dokter terlebih dahulu di menu terkait
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm lg:text-base font-semibold text-gray-700">Catatan Tambahan</Label>
                  <Textarea
                    placeholder="Catatan pengajuan (opsional)..."
                    value={purchaseRequest.notes}
                    onChange={(e) => setPurchaseRequest(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={2}
                    className="mt-1 lg:mt-2 text-sm lg:text-base border-2"
                  />
                </div>
              </div>

              {/* Items Selection */}
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3">
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-800">Pilih Item untuk Pengajuan</h3>
                    <p className="text-sm lg:text-base text-gray-600 mt-1">
                      Kategori tersedia: <span className="font-semibold">Obat</span>, <span className="font-semibold">Produk Medis</span>, dan <span className="font-semibold">Stok Bahan</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="secondary" className="text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-2">
                      {selectedItems.size} item dipilih
                    </Badge>
                    <Badge variant="outline" className="text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-2">
                      {getAllAvailableItems().length} item tersedia
                    </Badge>
                  </div>
                </div>

                <div className="border-2 rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-pink-100 to-purple-100">
                          <TableHead className="w-12 lg:w-16 text-center">
                            <Checkbox
                              checked={selectedItems.size === getAllAvailableItems().length && getAllAvailableItems().length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const allIds = getAllAvailableItems().map(item => item.id)
                                  setSelectedItems(new Set(allIds))
                                  // Set default values for all
                                  const newQuantities: {[key: string]: number} = {}
                                  const newPriorities: {[key: string]: string} = {}
                                  allIds.forEach(id => {
                                    newQuantities[id] = 1
                                    newPriorities[id] = 'Sedang'
                                  })
                                  setItemQuantities(newQuantities)
                                  setItemPriorities(newPriorities)
                                } else {
                                  setSelectedItems(new Set())
                                  setItemQuantities({})
                                  setItemPriorities({})
                                  setItemNotes({})
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-sm lg:text-base font-bold text-pink-800 min-w-[100px]">Kategori</TableHead>
                          <TableHead className="text-sm lg:text-base font-bold text-pink-800 min-w-[150px]">Nama Item</TableHead>
                          <TableHead className="text-center text-sm lg:text-base font-bold text-pink-800 min-w-[80px]">Stok</TableHead>
                          <TableHead className="text-center text-sm lg:text-base font-bold text-pink-800 min-w-[70px]">Satuan</TableHead>
                          <TableHead className="text-center text-sm lg:text-base font-bold text-pink-800 min-w-[100px]">Jumlah</TableHead>
                          <TableHead className="text-center text-sm lg:text-base font-bold text-pink-800 min-w-[100px]">Prioritas</TableHead>
                          <TableHead className="text-sm lg:text-base font-bold text-pink-800 min-w-[120px]">Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getAllAvailableItems().map((item) => (
                          <TableRow 
                            key={item.id} 
                            className={`${selectedItems.has(item.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} transition-colors`}
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={(checked) => handleItemSelection(item.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.category === 'Obat' ? 'default' : 
                                        item.category === 'Produk Medis' ? 'secondary' : 'outline'}
                                className="text-xs lg:text-sm px-2 lg:px-3 py-1"
                              >
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-sm lg:text-base text-gray-800">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm lg:text-base font-bold ${
                                item.currentStock === 0 ? 'text-red-600' : 
                                item.currentStock <= 5 ? 'text-yellow-600' : 
                                'text-green-600'
                              }`}>
                                {item.currentStock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm lg:text-base">{item.unit}</TableCell>
                            <TableCell className="text-center">
                              {selectedItems.has(item.id) ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={itemQuantities[item.id] || 1}
                                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 lg:w-24 text-center text-sm lg:text-base h-8 lg:h-10 border-2"
                                />
                              ) : (
                                <span className="text-gray-400 text-sm lg:text-base">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {selectedItems.has(item.id) ? (
                                <Select
                                  value={itemPriorities[item.id] || 'Sedang'}
                                  onValueChange={(value) => updateItemPriority(item.id, value)}
                                >
                                  <SelectTrigger className="w-20 lg:w-28 text-xs lg:text-base h-8 lg:h-10 border-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Rendah" className="text-green-600 text-xs lg:text-sm">Rendah</SelectItem>
                                    <SelectItem value="Sedang" className="text-blue-600 text-xs lg:text-sm">Sedang</SelectItem>
                                    <SelectItem value="Tinggi" className="text-orange-600 text-xs lg:text-sm">Tinggi</SelectItem>
                                    <SelectItem value="Urgent" className="text-red-600 text-xs lg:text-sm">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-gray-400 text-sm lg:text-base">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {selectedItems.has(item.id) ? (
                                <Input
                                  placeholder="Keterangan..."
                                  value={itemNotes[item.id] || ''}
                                  onChange={(e) => updateItemNotes(item.id, e.target.value)}
                                  className="min-w-28 lg:min-w-40 text-xs lg:text-base h-8 lg:h-10 border-2"
                                />
                              ) : (
                                <span className="text-gray-400 text-sm lg:text-base">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {getAllAvailableItems().length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8 lg:py-12">
                              <Package className="h-8 w-8 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-2 lg:mb-4" />
                              <p className="text-base lg:text-lg">Belum ada data obat, produk medis, atau stok bahan di sistem</p>
                              <p className="text-sm lg:text-base text-gray-400 mt-1 lg:mt-2">Tambahkan data produk terlebih dahulu untuk membuat pengajuan</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {selectedItems.size > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-xl border-2 border-blue-200">
                  <h4 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 text-blue-800">Ringkasan Pengajuan:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
                    <div className="text-center">
                      <span className="text-gray-600 text-sm lg:text-base">Total Item:</span>
                      <p className="text-xl lg:text-2xl font-bold text-blue-600">{selectedItems.size}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-600 text-sm lg:text-base">Prioritas Urgent:</span>
                      <p className="text-xl lg:text-2xl font-bold text-red-600">
                        {Array.from(selectedItems).filter(id => itemPriorities[id] === 'Urgent').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-600 text-sm lg:text-base">Prioritas Tinggi:</span>
                      <p className="text-xl lg:text-2xl font-bold text-orange-600">
                        {Array.from(selectedItems).filter(id => itemPriorities[id] === 'Tinggi').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-600 text-sm lg:text-base">Status:</span>
                      <p className="text-xl lg:text-2xl font-bold text-blue-600">Draft</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-gray-50 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setPurchaseRequestDialogOpen(false)}
                className="text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-3 h-10 lg:h-12 order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button 
                onClick={generatePurchaseRequest} 
                disabled={selectedItems.size === 0 || !purchaseRequest.requestedBy.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-sm lg:text-base px-6 lg:px-8 py-2 lg:py-3 h-10 lg:h-12 order-1 sm:order-2"
              >
                <Printer className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Cetak Formulir Pengajuan
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}