import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Calculator, DollarSign, Percent, Check, X, ChevronsUpDown, Edit, Trash2, Receipt, Printer, Eye, Pill, FileText, Search } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { TreatmentMultiFeeSection } from './TreatmentMultiFeeSection'
import { generateInvoiceWithCashierSignature, generateReceiptWithCashierSignature } from './TreatmentPrintTemplates'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface Patient {
  id: string
  name: string
  phone: string
  address: string
}

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
}

interface TreatmentItem {
  id: string
  name: string
  price: number
  quantity: number
  subtotalPrice: number
  discount: number
  discountType: 'percentage' | 'nominal'
  discountAmount: number
  finalPrice: number
}

interface FeeSettings {
  id: string
  doctorIds?: string[]
  doctorNames?: string[]
  category?: string
  treatmentTypes?: string[]
  feePercentage: number
  isDefault: boolean
  description?: string
  createdAt: string
}

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface MedicationProduct {
  id: string
  name: string
  price: number
  category: string
  stock: number
}

interface SelectedMedication {
  id: string
  name: string
  price: number
  quantity: number
  totalPrice: number
}

interface Treatment {
  id: string
  doctorId: string
  doctorName: string
  patientId: string
  patientName: string
  patientPhone?: string
  treatmentTypes: TreatmentItem[]
  selectedMedications?: SelectedMedication[]
  description: string
  subtotal: number
  totalDiscount: number
  totalNominal: number
  medicationCost: number
  totalTindakan: number
  feePercentage: number
  adminFeeOverride?: number
  calculatedFee: number
  shift: string
  date: string
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp'
  dpAmount?: number
  outstandingAmount?: number
  paymentNotes?: string
  createdAt: string
}

interface TreatmentFormWithMultiFeeProps {
  accessToken: string
  refreshTrigger?: number
  adminFee?: number
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
}

const shiftOptions = [
  { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

const paymentMethods = ['Cash', 'Debit', 'QRIS', 'Credit Card']
const paymentStatusOptions = [
  { value: 'lunas', label: 'Lunas' },
  { value: 'dp', label: 'DP (Down Payment)' }
]

export function TreatmentFormWithMultiFee({ 
  accessToken, 
  refreshTrigger, 
  adminFee: propAdminFee, 
  clinicSettings 
}: TreatmentFormWithMultiFeeProps) {
  const [activeTab, setActiveTab] = useState('treatments')
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [treatmentProducts, setTreatmentProducts] = useState<TreatmentProduct[]>([])
  const [medicationProducts, setMedicationProducts] = useState<MedicationProduct[]>([])
  const [feeSettings, setFeeSettings] = useState<FeeSettings[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    selectedTreatments: [] as TreatmentItem[],
    selectedMedications: [] as SelectedMedication[],
    description: '',
    feePercentage: '',
    adminFeeOverride: '',
    medicationCost: '',
    shift: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    paymentStatus: 'lunas' as 'lunas' | 'dp',
    dpAmount: 0,
    paymentNotes: ''
  })

  const [adminFee, setAdminFee] = useState(propAdminFee || 20000)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [totalNominal, setTotalNominal] = useState(0)
  const [totalTindakan, setTotalTindakan] = useState(0)
  const [isMultiFeeMode, setIsMultiFeeMode] = useState(false)

  // Search states
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [patientSearchValue, setPatientSearchValue] = useState('')
  const [treatmentSearchOpen, setTreatmentSearchOpen] = useState(false)
  const [medicationSearchOpen, setMedicationSearchOpen] = useState(false)

  // Print states
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTreatmentForCashier, setSelectedTreatmentForCashier] = useState<Treatment | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')

  useEffect(() => {
    fetchTreatments()
    fetchDoctors()
    fetchPatients()
    fetchEmployees()
    fetchTreatmentProducts()
    fetchMedicationProducts()
    fetchFeeSettings()
  }, [])

  // Update adminFee when prop changes
  useEffect(() => {
    if (typeof propAdminFee === 'number') {
      setAdminFee(propAdminFee)
    }
  }, [propAdminFee])

  // Re-fetch data when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchTreatments()
    }
  }, [refreshTrigger])

  // Calculate totals from selected treatments
  useEffect(() => {
    const selectedTreatmentsArray = formData.selectedTreatments || []
    
    const calculatedSubtotal = selectedTreatmentsArray.reduce((sum, item) => sum + item.subtotalPrice, 0)
    const calculatedTotalDiscount = selectedTreatmentsArray.reduce((sum, item) => sum + item.discountAmount, 0)
    const calculatedTotal = calculatedSubtotal - calculatedTotalDiscount
    
    setSubtotal(calculatedSubtotal)
    setTotalDiscount(calculatedTotalDiscount)
    setTotalNominal(calculatedTotal)
  }, [formData.selectedTreatments])

  // Calculate medication cost from selected medications
  useEffect(() => {
    const selectedMedicationsArray = formData.selectedMedications || []
    const calculatedMedicationCost = selectedMedicationsArray.reduce((sum, item) => sum + item.totalPrice, 0)
    
    setFormData(prev => ({
      ...prev,
      medicationCost: calculatedMedicationCost.toString()
    }))
  }, [formData.selectedMedications])

  // Calculate total tindakan when values change
  useEffect(() => {
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const medicationCost = parseFloat(formData.medicationCost) || 0
    const calculatedTotalTindakan = totalNominal + currentAdminFee + medicationCost
    setTotalTindakan(calculatedTotalTindakan)
  }, [totalNominal, formData.adminFeeOverride, formData.medicationCost, adminFee])

  const fetchTreatments = async () => {
    try {
      const response = await fetch(`${serverUrl}/treatments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTreatments(data.treatments || [])
      }
    } catch (error) {
      console.log('Error fetching treatments:', error)
      toast.error('Gagal mengambil data tindakan')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        const cleanedDoctors = cleanDoctorNames(data.doctors || [])
        setDoctors(cleanedDoctors)
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.log('Error fetching patients:', error)
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

  const fetchTreatmentProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        const filteredProducts = (data.products || []).filter((product: TreatmentProduct) => 
          ['Tindakan', 'Laboratorium', 'Konsultasi'].includes(product.category)
        )
        
        const uniqueProducts = filteredProducts.reduce((unique: TreatmentProduct[], product: TreatmentProduct) => {
          if (!unique.find(p => p.name === product.name && p.category === product.category)) {
            unique.push(product)
          }
          return unique
        }, [])
        
        setTreatmentProducts(uniqueProducts)
      }
    } catch (error) {
      console.log('Error fetching treatment products:', error)
    }
  }

  const fetchMedicationProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        const filteredProducts = (data.products || []).filter((product: MedicationProduct) => 
          product.category === 'Obat'
        )
        setMedicationProducts(filteredProducts)
      }
    } catch (error) {
      console.log('Error fetching medication products:', error)
    }
  }

  const fetchFeeSettings = async () => {
    try {
      const response = await fetch(`${serverUrl}/fee-settings`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setFeeSettings(data.feeSettings || [])
      }
    } catch (error) {
      console.log('Error fetching fee settings:', error)
    }
  }

  const calculateDiscount = (price: number, discount: number, discountType: 'percentage' | 'nominal'): number => {
    if (discountType === 'percentage') {
      return (price * discount) / 100
    } else {
      return Math.min(discount, price)
    }
  }

  const calculateAmounts = () => {
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const medicationCost = parseFloat(formData.medicationCost) || 0
    const calculatedTotalTindakan = totalNominal + currentAdminFee + medicationCost
    const outstandingAmount = formData.paymentStatus === 'dp' ? calculatedTotalTindakan - formData.dpAmount : 0
    
    return { 
      totalTindakan: calculatedTotalTindakan, 
      outstandingAmount 
    }
  }

  const addTreatment = (product: TreatmentProduct) => {
    const treatmentItem: TreatmentItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      subtotalPrice: product.price,
      discount: 0,
      discountType: 'percentage',
      discountAmount: 0,
      finalPrice: product.price
    }

    setFormData(prev => ({
      ...prev,
      selectedTreatments: [...prev.selectedTreatments, treatmentItem]
    }))
    setTreatmentSearchOpen(false)
  }

  const removeTreatment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedTreatments: prev.selectedTreatments.filter((_, i) => i !== index)
    }))
  }

  const updateTreatmentQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return

    setFormData(prev => {
      const updatedTreatments = [...prev.selectedTreatments]
      const treatment = updatedTreatments[index]
      
      const subtotalPrice = treatment.price * quantity
      const discountAmount = calculateDiscount(subtotalPrice, treatment.discount, treatment.discountType)
      const finalPrice = subtotalPrice - discountAmount
      
      updatedTreatments[index] = {
        ...treatment,
        quantity,
        subtotalPrice,
        discountAmount,
        finalPrice
      }
      
      return {
        ...prev,
        selectedTreatments: updatedTreatments
      }
    })
  }

  const updateTreatmentDiscount = (index: number, discount: number, discountType: 'percentage' | 'nominal') => {
    setFormData(prev => {
      const updatedTreatments = [...prev.selectedTreatments]
      const treatment = updatedTreatments[index]
      
      const discountAmount = calculateDiscount(treatment.subtotalPrice, discount, discountType)
      const finalPrice = treatment.subtotalPrice - discountAmount
      
      updatedTreatments[index] = {
        ...treatment,
        discount,
        discountType,
        discountAmount,
        finalPrice
      }
      
      return {
        ...prev,
        selectedTreatments: updatedTreatments
      }
    })
  }

  const addMedication = (product: MedicationProduct) => {
    const existingMedication = formData.selectedMedications.find(med => med.id === product.id)
    if (existingMedication) {
      toast.error(`Obat ${product.name} sudah ditambahkan`)
      return
    }

    if (product.stock <= 0) {
      toast.error(`Stok obat ${product.name} tidak tersedia`)
      return
    }

    const medicationItem: SelectedMedication = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      totalPrice: product.price
    }

    setFormData(prev => ({
      ...prev,
      selectedMedications: [...prev.selectedMedications, medicationItem]
    }))
    setMedicationSearchOpen(false)
  }

  const updateMedicationQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return

    setFormData(prev => {
      const updatedMedications = [...prev.selectedMedications]
      const medication = updatedMedications[index]
      
      const currentProduct = medicationProducts.find(p => p.id === medication.id)
      if (currentProduct && quantity > currentProduct.stock) {
        toast.error(`Jumlah melebihi stok tersedia. Stok ${medication.name}: ${currentProduct.stock}`)
        return prev
      }
      
      updatedMedications[index] = {
        ...medication,
        quantity,
        totalPrice: medication.price * quantity
      }
      
      return {
        ...prev,
        selectedMedications: updatedMedications
      }
    })
  }

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMedications: prev.selectedMedications.filter((_, i) => i !== index)
    }))
  }

  const handleFeeChange = (feePercentage: string, totalFee: number, isMultiFee: boolean) => {
    setIsMultiFeeMode(isMultiFee)
    setCalculatedFee(totalFee)
    
    if (!isMultiFee) {
      setFormData(prev => ({
        ...prev,
        feePercentage: feePercentage
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === formData.doctorId)
      const selectedPatient = patients.find(p => p.id === formData.patientId)
      
      if (!selectedDoctor) {
        toast.error('Pilih dokter terlebih dahulu')
        setLoading(false)
        return
      }
      
      if (!selectedPatient) {
        toast.error('Pilih pasien terlebih dahulu')
        setLoading(false)
        return
      }
      
      if (formData.selectedTreatments.length === 0) {
        toast.error('Pilih minimal satu jenis tindakan')
        setLoading(false)
        return
      }

      if (formData.paymentStatus === 'dp' && formData.dpAmount >= calculateAmounts().totalTindakan) {
        toast.error('Jumlah DP tidak boleh lebih besar atau sama dengan total tindakan')
        setLoading(false)
        return
      }

      const { totalTindakan, outstandingAmount } = calculateAmounts()

      const treatmentData = {
        doctorId: formData.doctorId,
        doctorName: selectedDoctor.name,
        patientId: formData.patientId,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        treatmentTypes: formData.selectedTreatments,
        selectedMedications: formData.selectedMedications,
        description: formData.description,
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        totalNominal: totalNominal,
        medicationCost: parseFloat(formData.medicationCost) || 0,
        totalTindakan: totalTindakan,
        feePercentage: parseFloat(formData.feePercentage) || 0,
        adminFeeOverride: parseFloat(formData.adminFeeOverride) || null,
        calculatedFee: calculatedFee,
        shift: formData.shift,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        dpAmount: formData.dpAmount,
        outstandingAmount: outstandingAmount,
        paymentNotes: formData.paymentNotes
      }

      if (editingTreatment) {
        const response = await fetch(`${serverUrl}/treatments/${editingTreatment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(treatmentData)
        })

        if (response.ok) {
          toast.success('Data tindakan berhasil diperbarui')
          fetchTreatments()
          fetchMedicationProducts()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui data tindakan')
        }
      } else {
        const response = await fetch(`${serverUrl}/treatments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(treatmentData)
        })

        if (response.ok) {
          const responseData = await response.json()
          toast.success('Data tindakan berhasil ditambahkan')
          fetchTreatments()
          fetchMedicationProducts()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan data tindakan')
        }
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }

    setLoading(false)
  }

  const deleteTreatment = async (id: string) => {
    try {
      const response = await fetch(`${serverUrl}/treatments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data tindakan berhasil dihapus')
        fetchTreatments()
        fetchMedicationProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data tindakan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const editTreatment = (treatment: Treatment) => {
    setEditingTreatment(treatment)
    
    // Ensure existing treatments have quantity field with default value 1
    const selectedTreatments = (treatment.treatmentTypes || []).map(t => ({
      ...t,
      quantity: t.quantity || 1,
      subtotalPrice: t.subtotalPrice || (t.price * (t.quantity || 1))
    }))
    
    setFormData({
      doctorId: treatment.doctorId,
      patientId: treatment.patientId,
      selectedTreatments: selectedTreatments,
      selectedMedications: treatment.selectedMedications || [],
      description: treatment.description || '',
      feePercentage: treatment.feePercentage.toString(),
      adminFeeOverride: treatment.adminFeeOverride?.toString() || '',
      medicationCost: treatment.medicationCost?.toString() || '0',
      shift: treatment.shift,
      date: treatment.date,
      paymentMethod: treatment.paymentMethod || '',
      paymentStatus: treatment.paymentStatus || 'lunas',
      dpAmount: treatment.dpAmount || 0,
      paymentNotes: treatment.paymentNotes || ''
    })
    
    // Set calculated values
    setCalculatedFee(treatment.calculatedFee)
    
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      doctorId: '',
      patientId: '',
      selectedTreatments: [],
      selectedMedications: [],
      description: '',
      feePercentage: '',
      adminFeeOverride: '',
      medicationCost: '',
      shift: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      paymentStatus: 'lunas',
      dpAmount: 0,
      paymentNotes: ''
    })
    setCalculatedFee(0)
    setSubtotal(0)
    setTotalDiscount(0)
    setTotalNominal(0)
    setTotalTindakan(0)
    setIsMultiFeeMode(false)
    setEditingTreatment(null)
    setDialogOpen(false)
  }

  const handlePrintTreatment = (treatment: Treatment) => {
    setSelectedTreatmentForCashier(treatment)
    setCashierDialogOpen(true)
  }

  const handlePrintWithCashier = async () => {
    if (!selectedTreatmentForCashier || !selectedCashier) {
      toast.error('Pilih kasir terlebih dahulu')
      return
    }

    const selectedEmployee = employees.find(emp => emp.id === selectedCashier)
    if (!selectedEmployee) {
      toast.error('Data kasir tidak ditemukan')
      return
    }

    try {
      const treatmentForPrint = {
        ...selectedTreatmentForCashier,
        date: transactionDate
      }

      if (printType === 'invoice') {
        await generateInvoiceWithCashierSignature(
          treatmentForPrint,
          selectedEmployee.name,
          clinicSettings || { name: 'Falasifah Dental Clinic', logo: clinicLogo }
        )
      } else {
        await generateReceiptWithCashierSignature(
          treatmentForPrint,
          selectedEmployee.name,
          clinicSettings || { name: 'Falasifah Dental Clinic', logo: clinicLogo }
        )
      }

      setCashierDialogOpen(false)
      setSelectedCashier('')
      toast.success(`${printType === 'invoice' ? 'Invoice' : 'Kwitansi'} berhasil dicetak`)
    } catch (error) {
      console.error('Error printing:', error)
      toast.error('Gagal mencetak dokumen')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Data Tindakan
          </TabsTrigger>
          <TabsTrigger value="add-treatment" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Tindakan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800">Data Tindakan Multi Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pink-50 hover:bg-pink-50">
                      <TableHead className="text-pink-800">Tanggal</TableHead>
                      <TableHead className="text-pink-800">Dokter</TableHead>
                      <TableHead className="text-pink-800">Pasien</TableHead>
                      <TableHead className="text-pink-800">Tindakan</TableHead>
                      <TableHead className="text-pink-800">Total</TableHead>
                      <TableHead className="text-pink-800">Fee Dokter</TableHead>
                      <TableHead className="text-pink-800">Status</TableHead>
                      <TableHead className="text-pink-800">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          Belum ada data tindakan
                        </TableCell>
                      </TableRow>
                    ) : (
                      treatments.map((treatment) => (
                        <TableRow key={treatment.id} className="hover:bg-pink-50/50">
                          <TableCell>
                            <div className="text-sm">
                              {new Date(treatment.date).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">{treatment.shift}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{treatment.doctorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{treatment.patientName}</div>
                            <div className="text-xs text-gray-500">{treatment.patientPhone}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {treatment.treatmentTypes?.map((t, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {t.name} {t.quantity && t.quantity > 1 ? `(${t.quantity}x)` : ''}
                                </Badge>
                              )) || []}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {formatCurrency(treatment.totalTindakan)}
                            </div>
                            {treatment.paymentStatus === 'dp' && (
                              <div className="text-xs text-orange-600">
                                DP: {formatCurrency(treatment.dpAmount || 0)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(treatment.calculatedFee)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {treatment.feePercentage}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={treatment.paymentStatus === 'lunas' 
                                ? 'bg-green-50 text-green-700 border-green-300' 
                                : 'bg-orange-50 text-orange-700 border-orange-300'
                              }
                            >
                              {treatment.paymentStatus === 'lunas' ? 'Lunas' : 'DP'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editTreatment(treatment)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintTreatment(treatment)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTreatment(treatment.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
        </TabsContent>

        <TabsContent value="add-treatment" className="mt-6">
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800">
                {editingTreatment ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
              </CardTitle>
            </CardHeader>
            <CardContent>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="doctorId" className="text-pink-700">Dokter</Label>
                    <Select 
                      value={formData.doctorId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih dokter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="patientId" className="text-pink-700">Pasien</Label>
                    <Select 
                      value={formData.patientId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih pasien..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shift" className="text-pink-700">Shift</Label>
                    <Select 
                      value={formData.shift} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih shift..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00-15:00">Shift Pagi (09:00-15:00)</SelectItem>
                        <SelectItem value="18:00-20:00">Shift Sore (18:00-20:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date" className="text-pink-700">Tanggal</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="border-pink-200"
                    />
                  </div>
                </div>

                {/* Treatment Selection */}
                <div>
                  <Label className="text-pink-700 mb-2 block">Pilih Tindakan</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-pink-200 rounded p-2">
                    {treatmentProducts.map((product) => (
                      <Button
                        key={product.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTreatment(product)}
                        className="justify-start text-left h-auto p-2 border-pink-200 hover:bg-pink-50"
                        disabled={formData.selectedTreatments.some(t => t.id === product.id)}
                      >
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(product.price)}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected Treatments */}
                {formData.selectedTreatments.length > 0 && (
                  <div>
                    <Label className="text-pink-700 mb-2 block">Tindakan Terpilih</Label>
                    <div className="space-y-2">
                      {formData.selectedTreatments.map((treatment, index) => (
                        <div key={index} className="bg-pink-50 p-3 rounded border border-pink-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{treatment.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency(treatment.price)} × {treatment.quantity} = {formatCurrency(treatment.subtotalPrice)}
                                {treatment.discountAmount > 0 && (
                                  <span className="text-red-600"> - {formatCurrency(treatment.discountAmount)} = {formatCurrency(treatment.finalPrice)}</span>
                                )}
                              </div>
                            </div>
                            <div className="font-medium text-green-600">
                              Total: {formatCurrency(treatment.finalPrice)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-pink-700">Qty:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={treatment.quantity}
                                  onChange={(e) => updateTreatmentQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-20 h-9 text-center text-lg font-bold border-2 border-pink-400 bg-white"
                                />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-pink-700">Diskon:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={treatment.discount || ''}
                                  onChange={(e) => updateTreatmentDiscount(index, parseFloat(e.target.value) || 0, 'percentage')}
                                  className="w-20 h-9 text-center border-2 border-pink-300"
                                />
                                <span className="text-sm text-gray-600">%</span>
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTreatment(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentStatus" className="text-pink-700">Status Pembayaran</Label>
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value as 'lunas' | 'dp' }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lunas">Lunas</SelectItem>
                        <SelectItem value="dp">DP (Down Payment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.paymentStatus === 'dp' && (
                    <div>
                      <Label htmlFor="dpAmount" className="text-pink-700">Jumlah DP</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.dpAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, dpAmount: parseFloat(e.target.value) || 0 }))}
                        className="border-pink-200"
                        placeholder="Masukkan jumlah DP"
                      />
                    </div>
                  )}
                </div>

                {/* Multi Fee Calculator */}
                {formData.doctorId && formData.selectedTreatments.length > 0 && (
                  <TreatmentMultiFeeSection
                    doctorId={formData.doctorId}
                    selectedTreatments={formData.selectedTreatments}
                    feeSettings={feeSettings}
                    doctors={doctors}
                    treatmentProducts={treatmentProducts}
                    paymentStatus={formData.paymentStatus}
                    dpAmount={formData.dpAmount}
                    singleFeePercentage={formData.feePercentage}
                    onFeeChange={handleFeeChange}
                  />
                )}

                {/* Manual Fee Input (for single fee mode) */}
                {!isMultiFeeMode && (
                  <div>
                    <Label htmlFor="feePercentage" className="text-pink-700">Fee Dokter (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.feePercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, feePercentage: e.target.value }))}
                      className="border-pink-200"
                      placeholder="Masukkan persentase fee"
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Total Tindakan</Label>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(formData.selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700">Total Fee Dokter</Label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(calculatedFee)}
                      </div>
                    </div>
                  </div>
                  {isMultiFeeMode && (
                    <div className="mt-2 text-sm text-blue-600">
                      Mode: Multi Fee (Fee berbeda per tindakan)
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-gray-300"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.doctorId || !formData.patientId || formData.selectedTreatments.length === 0}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-600">
          <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">Demo sistem multi fee dokter</p>
          <p className="text-sm text-gray-500">
            Sistem akan otomatis menghitung fee berbeda untuk setiap tindakan berdasarkan aturan yang telah dibuat
          </p>
        </div>
      </CardContent>
    </Card>
  )
}