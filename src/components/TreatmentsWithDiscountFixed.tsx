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
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Plus, Edit, Trash2, Receipt, Calculator, Check, ChevronsUpDown, FileText, Printer, X, Eye, Maximize2, Percent, Minus, Pill, FileCheck, Search, Filter, Calendar, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
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

interface Employee {
  id: string
  name: string
  position: string
  phone: string
}

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
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

interface TreatmentItem {
  id: string
  name: string
  price: number
  discount: number // dalam persentase (0-100)
  discountType: 'percentage' | 'nominal' // jenis diskon
  discountAmount: number // jumlah diskon dalam rupiah
  finalPrice: number // harga setelah diskon
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
  subtotal: number // Total sebelum diskon
  totalDiscount: number // Total diskon
  totalNominal: number // Total setelah diskon
  medicationCost: number // Biaya obat
  totalTindakan: number // Total final + admin fee + obat
  feePercentage: number
  adminFeeOverride?: number
  calculatedFee: number
  shift: string
  date: string
  createdAt: string
}

interface TreatmentsProps {
  accessToken: string
  refreshTrigger?: number
  adminFee?: number
}

const shiftOptions = [
  { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

export function TreatmentsWithDiscountFixed({ accessToken, refreshTrigger, adminFee: propAdminFee }: TreatmentsProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [treatmentProducts, setTreatmentProducts] = useState<TreatmentProduct[]>([])
  const [medicationProducts, setMedicationProducts] = useState<MedicationProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
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
    date: ''
  })
  const [adminFee, setAdminFee] = useState(propAdminFee || 0)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [totalNominal, setTotalNominal] = useState(0)
  const [totalTindakan, setTotalTindakan] = useState(0)
  
  // Patient selection state
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [patientSearchValue, setPatientSearchValue] = useState('')
  
  // Treatment selection state  
  const [treatmentSearchOpen, setTreatmentSearchOpen] = useState(false)
  
  // Medication selection state
  const [medicationSearchOpen, setMedicationSearchOpen] = useState(false)
  
  // Print state
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [selectedTreatmentForPrint, setSelectedTreatmentForPrint] = useState<Treatment | null>(null)
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState<'invoice' | 'receipt'>('invoice')
  const [selectedTreatmentForPreview, setSelectedTreatmentForPreview] = useState<Treatment | null>(null)

  // Cashier selection state
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTreatmentForCashier, setSelectedTreatmentForCashier] = useState<Treatment | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')

  // Calculate doctor fees with sitting fee logic
  const [doctorFees, setDoctorFees] = useState<{ [key: string]: number }>({})
  const [sittingFees, setSittingFees] = useState<{ [key: string]: number }>({})

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('')
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [minTotalFilter, setMinTotalFilter] = useState('')
  const [maxTotalFilter, setMaxTotalFilter] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    fetchTreatments()
    fetchDoctors()
    fetchPatients()
    fetchEmployees()
    fetchTreatmentProducts()
    fetchMedicationProducts()
    fetchSittingFees()
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
      fetchSittingFees()
    }
  }, [refreshTrigger])

  // Calculate totals from selected treatments
  useEffect(() => {
    const selectedTreatmentsArray = formData.selectedTreatments || []
    
    const calculatedSubtotal = selectedTreatmentsArray.reduce((sum, item) => sum + item.price, 0)
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

  // Calculate total tindakan and fee when values change
  useEffect(() => {
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const medicationCost = parseFloat(formData.medicationCost) || 0
    const calculatedTotalTindakan = totalNominal + currentAdminFee + medicationCost
    setTotalTindakan(calculatedTotalTindakan)
    
    const percentage = parseFloat(formData.feePercentage) || 0
    // Fee dokter hanya dihitung dari totalNominal (total tindakan setelah diskon), TIDAK termasuk obat dan admin
    const calculated = (totalNominal * percentage / 100)
    setCalculatedFee(Math.max(0, calculated))
  }, [totalNominal, formData.feePercentage, formData.adminFeeOverride, formData.medicationCost, adminFee])

  useEffect(() => {
    calculateDoctorFees()
  }, [treatments, sittingFees])

  const fetchTreatments = async () => {
    try {
      const response = await fetch(`${serverUrl}/treatments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${serverUrl}/patients`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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

  const fetchTreatmentProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filter untuk tindakan, laboratorium, dan konsultasi
        const filteredProducts = (data.products || []).filter((product: TreatmentProduct) => 
          ['Tindakan', 'Laboratorium', 'Konsultasi'].includes(product.category)
        )
        setTreatmentProducts(filteredProducts)
      }
    } catch (error) {
      console.log('Error fetching treatment products:', error)
    }
  }

  const fetchMedicationProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filter untuk obat saja
        const filteredProducts = (data.products || []).filter((product: MedicationProduct) => 
          product.category === 'Obat'
        )
        setMedicationProducts(filteredProducts)
      }
    } catch (error) {
      console.log('Error fetching medication products:', error)
    }
  }

  const fetchSittingFees = async () => {
    try {
      const response = await fetch(`${serverUrl}/sitting-fees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        const fees: { [key: string]: number } = {}
        data.sittingFees?.forEach((fee: any) => {
          const key = `${fee.doctorId}_${fee.shift}_${fee.date}`
          fees[key] = fee.amount
        })
        setSittingFees(fees)
      }
    } catch (error) {
      console.log('Error fetching sitting fees:', error)
    }
  }

  const calculateDoctorFees = () => {
    const treatmentsArray = treatments || []
    const feesByDoctorShiftDate: { [key: string]: { treatments: Treatment[], totalFee: number } } = {}
    
    treatmentsArray.forEach(treatment => {
      const key = `${treatment.doctorId}_${treatment.shift}_${treatment.date}`
      if (!feesByDoctorShiftDate[key]) {
        feesByDoctorShiftDate[key] = { treatments: [], totalFee: 0 }
      }
      feesByDoctorShiftDate[key].treatments.push(treatment)
      // Fee dokter hanya dihitung dari totalNominal (total tindakan setelah diskon), TIDAK termasuk obat dan admin
      const calculatedFee = (treatment.totalNominal || 0) * (treatment.feePercentage / 100)
      feesByDoctorShiftDate[key].totalFee += calculatedFee
    })

    const finalFees: { [key: string]: number } = {}
    
    Object.keys(feesByDoctorShiftDate).forEach(key => {
      const { totalFee } = feesByDoctorShiftDate[key]
      const sittingFee = sittingFees[key] || 0
      
      if (totalFee > 0) {
        finalFees[key] = Math.max(totalFee, sittingFee)
      } else {
        finalFees[key] = sittingFee
      }
    })

    setDoctorFees(finalFees)
  }

  const calculateDiscount = (price: number, discount: number, discountType: 'percentage' | 'nominal'): number => {
    if (discountType === 'percentage') {
      return (price * discount) / 100
    } else {
      return Math.min(discount, price) // Diskon nominal tidak boleh lebih dari harga
    }
  }

  const addTreatment = (product: TreatmentProduct) => {
    const treatmentItem: TreatmentItem = {
      id: product.id,
      name: product.name,
      price: product.price,
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

  const updateTreatmentDiscount = (index: number, discount: number, discountType: 'percentage' | 'nominal') => {
    setFormData(prev => {
      const updatedTreatments = [...prev.selectedTreatments]
      const treatment = updatedTreatments[index]
      
      const discountAmount = calculateDiscount(treatment.price, discount, discountType)
      const finalPrice = treatment.price - discountAmount
      
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

  const removeTreatment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedTreatments: prev.selectedTreatments.filter((_, i) => i !== index)
    }))
  }

  const addMedication = (product: MedicationProduct) => {
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
        date: formData.date
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
          toast.success('Data tindakan berhasil ditambahkan')
          fetchTreatments()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan data tindakan')
        }
      }
    } catch (error) {
      console.log('Error saving treatment:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (treatmentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data tindakan ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/treatments/${treatmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data tindakan berhasil dihapus')
        fetchTreatments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data tindakan')
      }
    } catch (error) {
      console.log('Error deleting treatment:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment)
    setFormData({
      doctorId: treatment.doctorId,
      patientId: treatment.patientId,
      selectedTreatments: treatment.treatmentTypes || [],
      selectedMedications: treatment.selectedMedications || [],
      description: treatment.description,
      feePercentage: treatment.feePercentage.toString(),
      adminFeeOverride: treatment.adminFeeOverride?.toString() || '',
      medicationCost: treatment.medicationCost?.toString() || '',
      shift: treatment.shift,
      date: treatment.date
    })
    setPatientSearchValue(treatment.patientName)
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
      date: ''
    })
    setCalculatedFee(0)
    setSubtotal(0)
    setTotalDiscount(0)
    setTotalNominal(0)
    setTotalTindakan(0)
    setPatientSearchValue('')
    setEditingTreatment(null)
    setDialogOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const openCashierDialog = (treatment: Treatment, type: 'invoice' | 'receipt') => {
    setSelectedTreatmentForCashier(treatment)
    setPrintType(type)
    setTransactionDate(new Date().toISOString().split('T')[0])
    setSelectedCashier('')
    setCashierDialogOpen(true)
  }

  const handlePrintWithCashier = () => {
    if (!selectedCashier || !selectedTreatmentForCashier) {
      toast.error('Pilih kasir terlebih dahulu')
      return
    }

    const cashierName = employees.find(emp => emp.id === selectedCashier)?.name || ''
    
    if (printType === 'invoice') {
      generateInvoiceWithCashier(selectedTreatmentForCashier, cashierName, transactionDate)
    } else {
      generateReceiptWithCashier(selectedTreatmentForCashier, cashierName, transactionDate)
    }
    
    setCashierDialogOpen(false)
  }

  const generateInvoice = (treatment: Treatment) => {
    openCashierDialog(treatment, 'invoice')
  }

  const generateReceipt = (treatment: Treatment) => {
    openCashierDialog(treatment, 'receipt')
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

  const generateInvoiceWithCashier = (treatment: Treatment, cashierName: string, transactionDate: string) => {
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return

    const treatmentRows = (treatment.treatmentTypes || []).map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>Rp ${item.price.toLocaleString('id-ID')}</td>
        <td>${item.discountType === 'percentage' 
          ? `${item.discount}% (Rp ${item.discountAmount.toLocaleString('id-ID')})`
          : `Rp ${item.discountAmount.toLocaleString('id-ID')}`
        }</td>
        <td>Rp ${item.finalPrice.toLocaleString('id-ID')}</td>
      </tr>
    `).join('')

    const medicationRows = (treatment.selectedMedications || []).length > 0 ? `
      <tr>
        <td colspan="5" style="background: #f0f0f0; font-weight: bold; text-align: center;">OBAT-OBATAN</td>
      </tr>
      ${(treatment.selectedMedications || []).map((med, index) => `
        <tr>
          <td>${(treatment.treatmentTypes || []).length + index + 1}</td>
          <td>${med.name} (${med.quantity}x)</td>
          <td>Rp ${med.price.toLocaleString('id-ID')}</td>
          <td>-</td>
          <td>Rp ${med.totalPrice.toLocaleString('id-ID')}</td>
        </tr>
      `).join('')}
    ` : ''

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${treatment.patientName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
        .invoice-container { max-width: 560px; margin: 15px auto; padding: 15px; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .clinic-logo { width: 80px; height: auto; object-fit: contain; }
        .clinic-info-header { text-align: left; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 3px; }
        .clinic-address { font-size: 10px; color: #666; line-height: 1.3; }
        .invoice-title { font-size: 16px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; }
        .invoice-number { text-align: center; font-size: 11px; color: #666; margin-bottom: 20px; }
        .patient-info { background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 15px; }
        .info-row { display: flex; margin-bottom: 6px; }
        .info-label { width: 120px; font-weight: bold; font-size: 11px; }
        .info-value { flex: 1; font-size: 11px; }
        .treatment-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
        .treatment-table th, .treatment-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .treatment-table th { background: #fce7f3; color: #9d174d; font-weight: bold; }
        .treatment-table tr:nth-child(even) { background: #fef7ff; }
        .total-section { text-align: right; margin-top: 15px; font-size: 11px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .total-label { font-weight: bold; }
        .total-value { font-weight: bold; }
        .final-total { font-size: 14px; color: #e91e63; border-top: 2px solid #e91e63; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 30px; display: flex; justify-content: center; }
        .footer-section { text-align: center; width: 200px; }
        .signature-line { border-bottom: 1px solid #333; width: 180px; height: 50px; margin: 15px auto; }
        .signature-text { font-size: 11px; font-weight: bold; }
        .cashier-name { font-size: 10px; margin-top: 3px; }
        @media print {
            @page { size: A5; margin: 10mm; }
            body { margin: 0; font-size: 11px; }
            .invoice-container { margin: 0; padding: 0; max-width: none; }
            .treatment-table { font-size: 9px; }
            .treatment-table th, .treatment-table td { padding: 6px; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo-section">
                <img src="${clinicLogo}" alt="Falasifah Dental Clinic" class="clinic-logo">
                <div class="clinic-info-header">
                    <div class="clinic-name">Falasifah Dental Clinic</div>
                    <div class="clinic-address">
                        Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                        Sawangan Lama, Kec. Sawangan. Depok. Jawa Barat<br>
                        Telp/WA: 085283228355
                    </div>
                </div>
            </div>
        </div>

        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">No: INV/${treatment.id}/${new Date(transactionDate).getFullYear()}</div>

        <div class="patient-info">
            <div class="info-row">
                <span class="info-label">Nama Pasien:</span>
                <span class="info-value">${treatment.patientName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Telepon:</span>
                <span class="info-value">${treatment.patientPhone || '-'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dokter:</span>
                <span class="info-value">${treatment.doctorName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Shift:</span>
                <span class="info-value">${treatment.shift}</span>
            </div>
        </div>

        <table class="treatment-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Jenis Tindakan</th>
                    <th>Harga</th>
                    <th>Diskon</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${treatmentRows}
                ${medicationRows}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span class="total-label">Subtotal Tindakan:</span>
                <span class="total-value">Rp ${treatment.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Total Diskon:</span>
                <span class="total-value">Rp ${treatment.totalDiscount.toLocaleString('id-ID')}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Total Tindakan:</span>
                <span class="total-value">Rp ${treatment.totalNominal.toLocaleString('id-ID')}</span>
            </div>
            ${treatment.medicationCost > 0 ? `
            <div class="total-row">
                <span class="total-label">Biaya Obat:</span>
                <span class="total-value">Rp ${treatment.medicationCost.toLocaleString('id-ID')}</span>
            </div>` : ''}
            <div class="total-row">
                <span class="total-label">Biaya Admin:</span>
                <span class="total-value">Rp ${(treatment.adminFeeOverride || 20000).toLocaleString('id-ID')}</span>
            </div>
            <div class="total-row final-total">
                <span class="total-label">TOTAL PEMBAYARAN:</span>
                <span class="total-value">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</span>
            </div>
            <div style="margin-top: 10px; font-style: italic; font-size: 10px;">
                Terbilang: ${numberToWords(treatment.totalTindakan)} rupiah
            </div>
        </div>

        <div class="footer">
            <div class="footer-section">
                <div class="signature-line"></div>
                <div class="signature-text">Kasir</div>
                <div class="cashier-name">(${cashierName})</div>
            </div>
        </div>
    </div>
</body>
</html>`

    invoiceWindow.document.write(invoiceHTML)
    invoiceWindow.document.close()
    invoiceWindow.print()
  }

  const generateReceiptWithCashier = (treatment: Treatment, cashierName: string, transactionDate: string) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kwitansi - ${treatment.patientName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #333; }
        .receipt-container { max-width: 520px; margin: 15px auto; padding: 20px; border: 2px solid #e91e63; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e91e63; }
        .logo-section { display: flex; align-items: center; gap: 8px; }
        .clinic-logo { width: 60px; height: auto; object-fit: contain; }
        .clinic-info-header { text-align: left; }
        .clinic-name { font-size: 16px; font-weight: bold; color: #e91e63; margin-bottom: 4px; }
        .clinic-address { font-size: 10px; color: #666; line-height: 1.3; }
        .receipt-title { font-size: 16px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; }
        .receipt-number { text-align: center; font-size: 11px; color: #666; margin-bottom: 20px; }
        .receipt-info { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 6px; align-items: flex-start; }
        .info-label { width: 160px; font-weight: normal; flex-shrink: 0; font-size: 12px; }
        .info-separator { margin: 0 8px; flex-shrink: 0; }
        .info-value { flex: 1; font-weight: bold; font-size: 12px; }
        .total-section { margin-top: 20px; padding-top: 15px; border-top: 2px solid #e91e63; }
        .total-amount { text-align: right; font-size: 14px; font-weight: bold; color: #e91e63; }
        .signature-section { margin-top: 35px; display: flex; justify-content: center; }
        .signature-box { text-align: center; width: 180px; }
        .signature-line { border-bottom: 1px solid #333; margin-bottom: 8px; height: 50px; }
        .signature-text { font-size: 12px; font-weight: bold; }
        .cashier-name { font-size: 11px; margin-top: 3px; }
        @media print {
            @page { size: A5; margin: 12mm; }
            body { margin: 0; font-size: 12px; }
            .receipt-container { margin: 0; border: 1px solid #e91e63; padding: 15px; max-width: none; }
            .clinic-logo { width: 50px; }
            .clinic-name { font-size: 14px; }
            .clinic-address { font-size: 9px; }
            .info-label, .info-value { font-size: 11px; }
            .receipt-title { font-size: 14px; }
            .total-amount { font-size: 13px; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="logo-section">
                <img src="${clinicLogo}" alt="Falasifah Dental Clinic" class="clinic-logo">
                <div class="clinic-info-header">
                    <div class="clinic-name">Falasifah Dental Clinic</div>
                    <div class="clinic-address">
                        Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                        Sawangan Lama, Kec. Sawangan. Depok. Jawa Barat<br>
                        Telp/WA: 085283228355
                    </div>
                </div>
            </div>
        </div>

        <div class="receipt-title">KWITANSI</div>
        <div class="receipt-number">No: KWT/${treatment.id}/${new Date(transactionDate).getFullYear()}</div>

        <div class="receipt-info">
            <div class="info-row">
                <span class="info-label">Sudah terima dari</span>
                <span class="info-separator">:</span>
                <span class="info-value">${treatment.patientName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Uang sejumlah</span>
                <span class="info-separator">:</span>
                <span class="info-value">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Terbilang</span>
                <span class="info-separator">:</span>
                <span class="info-value">${numberToWords(treatment.totalTindakan)} rupiah</span>
            </div>
            <div class="info-row">
                <span class="info-label">Untuk pembayaran</span>
                <span class="info-separator">:</span>
                <span class="info-value">Biaya perawatan gigi oleh ${treatment.doctorName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tanggal</span>
                <span class="info-separator">:</span>
                <span class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID')}</span>
            </div>
        </div>

        <div class="total-section">
            <div class="total-amount">
                <strong>Total: Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</strong>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-text">Yang Menerima</div>
                <div class="cashier-name">(${cashierName})</div>
            </div>
        </div>
    </div>
</body>
</html>`

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    receiptWindow.print()
  }

  const openPreviewDialog = (treatment: Treatment, type: 'invoice' | 'receipt') => {
    setSelectedTreatmentForPreview(treatment)
    setPreviewType(type)
    setPreviewOpen(true)
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearchValue.toLowerCase()) ||
    patient.phone.includes(patientSearchValue)
  )

  // Filter treatments based on search criteria
  const filteredTreatments = treatments.filter(treatment => {
    // Search term filter (patient name or doctor name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesPatient = treatment.patientName?.toLowerCase().includes(searchLower)
      const matchesDoctor = treatment.doctorName?.toLowerCase().includes(searchLower)
      if (!matchesPatient && !matchesDoctor) return false
    }

    // Doctor filter
    if (selectedDoctorFilter && treatment.doctorId !== selectedDoctorFilter) {
      return false
    }

    // Shift filter
    if (selectedShiftFilter && treatment.shift !== selectedShiftFilter) {
      return false
    }

    // Date range filter
    if (dateFromFilter && treatment.date < dateFromFilter) {
      return false
    }
    if (dateToFilter && treatment.date > dateToFilter) {
      return false
    }

    // Total amount filter
    const totalAmount = treatment.totalTindakan || 0
    if (minTotalFilter && totalAmount < parseFloat(minTotalFilter)) {
      return false
    }
    if (maxTotalFilter && totalAmount > parseFloat(maxTotalFilter)) {
      return false
    }

    return true
  })

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedDoctorFilter('')
    setSelectedShiftFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setMinTotalFilter('')
    setMaxTotalFilter('')
  }

  const hasActiveFilters = searchTerm || selectedDoctorFilter || selectedShiftFilter || 
    dateFromFilter || dateToFilter || minTotalFilter || maxTotalFilter

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar and Quick Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama pasien atau dokter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter Lanjutan
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Doctor Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Dokter</Label>
                  <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua dokter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua dokter</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Shift</Label>
                  <Select value={selectedShiftFilter} onValueChange={setSelectedShiftFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua shift</SelectItem>
                      {shiftOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm">Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm">Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>

                {/* Min Total Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Total Minimum (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minTotalFilter}
                    onChange={(e) => setMinTotalFilter(e.target.value)}
                    min="0"
                  />
                </div>

                {/* Max Total Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Total Maksimum (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="Tidak terbatas"
                    value={maxTotalFilter}
                    onChange={(e) => setMaxTotalFilter(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Filter aktif:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Pencarian: "{searchTerm}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </Badge>
                )}
                {selectedDoctorFilter && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Dokter: {doctors.find(d => d.id === selectedDoctorFilter)?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDoctorFilter('')} />
                  </Badge>
                )}
                {selectedShiftFilter && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Shift: {shiftOptions.find(s => s.value === selectedShiftFilter)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedShiftFilter('')} />
                  </Badge>
                )}
                {(dateFromFilter || dateToFilter) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tanggal: {dateFromFilter || '...'} - {dateToFilter || '...'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                      setDateFromFilter('')
                      setDateToFilter('')
                    }} />
                  </Badge>
                )}
                {(minTotalFilter || maxTotalFilter) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Total: Rp {minTotalFilter || '0'} - Rp {maxTotalFilter || '∞'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                      setMinTotalFilter('')
                      setMaxTotalFilter('')
                    }} />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Tindakan</p>
                <p className="text-2xl">{filteredTreatments.length}</p>
                <p className="text-xs text-muted-foreground">dari {treatments.length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                <p className="text-2xl">{formatCurrency(filteredTreatments.reduce((sum, t) => sum + (t.totalTindakan || 0), 0))}</p>
                <p className="text-xs text-muted-foreground">
                  dari {formatCurrency(treatments.reduce((sum, t) => sum + (t.totalTindakan || 0), 0))} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm text-muted-foreground">Fee Dokter</p>
                <p className="text-2xl">{formatCurrency(filteredTreatments.reduce((sum, t) => sum + (t.calculatedFee || 0), 0))}</p>
                <p className="text-xs text-muted-foreground">
                  dari {formatCurrency(Object.values(doctorFees).reduce((sum, fee) => sum + fee, 0))} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm text-muted-foreground">Hari Ini</p>
                <p className="text-2xl">{filteredTreatments.filter(t => t.date === new Date().toISOString().split('T')[0]).length}</p>
                <p className="text-xs text-muted-foreground">
                  dari {treatments.filter(t => t.date === new Date().toISOString().split('T')[0]).length} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Treatment Button */}
      <div className="flex justify-between items-center">
        <div></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTreatment(null)
              resetForm()
              setDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tindakan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTreatment ? 'Edit' : 'Tambah'} Tindakan</DialogTitle>
              <DialogDescription>
                {editingTreatment ? 'Edit data tindakan yang sudah ada' : 'Tambah data tindakan baru dengan sistem diskon terintegrasi'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Treatment Form - Rest of the form content goes here... */}
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Form tindakan akan dimuat di sini...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Treatments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Tindakan</span>
            <div className="text-sm text-muted-foreground">
              {filteredTreatments.length > 0 && (
                <span>Menampilkan {filteredTreatments.length} dari {treatments.length} data</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTreatments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {hasActiveFilters ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Tidak ada data yang sesuai dengan filter yang dipilih</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="mt-2"
                    >
                      Reset Filter
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Belum ada data tindakan</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Tindakan</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fee Dokter</TableHead>
                    <TableHead className="w-[200px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>{new Date(treatment.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{treatment.patientName}</p>
                          {treatment.patientPhone && (
                            <p className="text-sm text-muted-foreground">{treatment.patientPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{treatment.doctorName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(treatment.treatmentTypes || []).map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{item.name}</span>
                              {item.discount > 0 && (
                                <span className="text-green-600 ml-2">
                                  (-{item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={treatment.shift.includes('09:00') ? 'default' : 'secondary'}>
                          {treatment.shift.includes('09:00') ? 'Pagi' : 'Sore'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(treatment.totalTindakan)}</p>
                          {treatment.totalDiscount > 0 && (
                            <p className="text-sm text-green-600">Hemat {formatCurrency(treatment.totalDiscount)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-right">{formatCurrency(treatment.calculatedFee)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(treatment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoice(treatment)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateReceipt(treatment)}
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(treatment.id)}
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

      {/* Cashier Selection Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}</DialogTitle>
            <DialogDescription>
              Pilih kasir yang menangani transaksi untuk ditampilkan pada {printType === 'invoice' ? 'invoice' : 'kwitansi'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCashierDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handlePrintWithCashier}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}