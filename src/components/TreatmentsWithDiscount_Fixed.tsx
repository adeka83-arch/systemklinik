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
import { Plus, Edit, Trash2, Receipt, Calculator, Check, ChevronsUpDown, FileText, Printer, X, Eye, Maximize2, Percent, Minus, Pill, FileCheck } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

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

export function TreatmentsWithDiscount({ accessToken, refreshTrigger, adminFee: propAdminFee }: TreatmentsProps) {
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
        body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
        .invoice-container { max-width: 800px; margin: 20px auto; padding: 20px; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; border-bottom: 2px solid #e91e63; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .clinic-logo { width: 60px; height: 60px; object-fit: contain; }
        .clinic-info-header { text-align: left; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-address { font-size: 12px; color: #666; line-height: 1.4; }
        .invoice-title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 20px 0; text-align: center; }
        .patient-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { width: 150px; font-weight: bold; }
        .info-value { flex: 1; }
        .treatment-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .treatment-table th, .treatment-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .treatment-table th { background: #fce7f3; color: #9d174d; font-weight: bold; }
        .treatment-table tr:nth-child(even) { background: #fef7ff; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-label { font-weight: bold; }
        .total-amount { font-weight: bold; }
        .grand-total { font-size: 18px; color: #e91e63; border-top: 2px solid #e91e63; padding-top: 10px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        @media print {
            body { margin: 0; }
            .invoice-container { margin: 0; padding: 15px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo-section">
                <svg class="clinic-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#e91e63" stroke="#fff" stroke-width="2"/>
                    <text x="50" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">DENTAL</text>
                    <text x="50" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">🦷</text>
                    <text x="50" y="65" text-anchor="middle" fill="white" font-family="Arial" font-size="10">CLINIC</text>
                </svg>
                <div class="clinic-info-header">
                    <div class="clinic-name">Falasifah Dental Clinic</div>
                    <div class="clinic-address">
                        Jl. Raya Dental No. 123, Bandung<br>
                        Telp: (022) 1234567 | WA: 081234567890<br>
                        Email: info@falasifah.com
                    </div>
                </div>
            </div>
        </div>
        
        <div class="invoice-title">INVOICE PEMBAYARAN</div>
        
        <div class="patient-info">
            <div class="info-row">
                <div class="info-label">Nama Pasien:</div>
                <div class="info-value">${treatment.patientName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. Telp:</div>
                <div class="info-value">${treatment.patientPhone || '-'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter:</div>
                <div class="info-value">${treatment.doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Transaksi:</div>
                <div class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
            </div>
        </div>

        <table class="treatment-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Jenis Tindakan</th>
                    <th>Harga Asli</th>
                    <th>Diskon</th>
                    <th>Harga Final</th>
                </tr>
            </thead>
            <tbody>
                ${treatmentRows}
                ${medicationRows}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <div class="total-label">Subtotal Tindakan:</div>
                <div class="total-amount">Rp ${treatment.subtotal.toLocaleString('id-ID')}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Total Diskon:</div>
                <div class="total-amount">-Rp ${treatment.totalDiscount.toLocaleString('id-ID')}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Total Tindakan:</div>
                <div class="total-amount">Rp ${treatment.totalNominal.toLocaleString('id-ID')}</div>
            </div>
            ${treatment.medicationCost > 0 ? `
                <div class="total-row">
                    <div class="total-label">Biaya Obat:</div>
                    <div class="total-amount">Rp ${treatment.medicationCost.toLocaleString('id-ID')}</div>
                </div>
            ` : ''}
            <div class="total-row">
                <div class="total-label">Biaya Admin:</div>
                <div class="total-amount">Rp ${(treatment.adminFeeOverride || 20000).toLocaleString('id-ID')}</div>
            </div>
            <div class="total-row grand-total">
                <div class="total-label">TOTAL PEMBAYARAN:</div>
                <div class="total-amount">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</div>
            </div>
        </div>

        <div style="margin-top: 20px; font-style: italic; text-align: center;">
            <p>Terbilang: ${numberToWords(treatment.totalTindakan)} rupiah</p>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <p>Kasir</p>
                <div class="signature-line">${cashierName}</div>
            </div>
        </div>

        <div class="footer">
            <p>Terima kasih atas kepercayaan Anda kepada Falasifah Dental Clinic</p>
            <p>Tanggal Transaksi: ${new Date(transactionDate).toLocaleDateString('id-ID')}</p>
            <p>Invoice ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            }
        }
    </script>
</body>
</html>
    `

    invoiceWindow.document.write(invoiceHTML)
    invoiceWindow.document.close()
  }

  const generateReceiptWithCashier = (treatment: Treatment, cashierName: string, transactionDate: string) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    // Generate nomor kwitansi dengan format KWT/YYYY/MM/XXXXXX
    const date = new Date(transactionDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const receiptNumber = `KWT/${year}/${month}/${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kwitansi - ${treatment.patientName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
        .receipt-container { max-width: 800px; margin: 20px auto; padding: 20px; border: 2px solid #e91e63; }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 2px solid #e91e63; padding-bottom: 15px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .clinic-logo { width: 50px; height: 50px; object-fit: contain; }
        .clinic-info-header { text-align: left; }
        .clinic-name { font-size: 20px; font-weight: bold; color: #e91e63; margin-bottom: 3px; }
        .clinic-address { font-size: 11px; color: #666; line-height: 1.3; }
        .receipt-title { font-size: 18px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; text-transform: uppercase; }
        .receipt-number { text-align: center; margin-bottom: 20px; font-weight: bold; color: #e91e63; }
        .receipt-info { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { width: 180px; }
        .info-separator { width: 20px; text-align: center; }
        .info-value { flex: 1; font-weight: bold; }
        .amount-section { margin: 30px 0; padding: 15px; background: #fef7ff; border: 1px solid #e91e63; }
        .amount-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
        .amount-label { font-weight: bold; }
        .amount-value { font-weight: bold; color: #e91e63; }
        .amount-words { text-align: center; margin-top: 15px; font-style: italic; font-weight: bold; }
        .signature-section { margin-top: 40px; display: flex; justify-content: flex-end; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 12px; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
        @media print {
            body { margin: 0; }
            .receipt-container { margin: 0; padding: 15px; border: 2px solid #000; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="logo-section">
                <svg class="clinic-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#e91e63" stroke="#fff" stroke-width="2"/>
                    <text x="50" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">DENTAL</text>
                    <text x="50" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">🦷</text>
                    <text x="50" y="65" text-anchor="middle" fill="white" font-family="Arial" font-size="10">CLINIC</text>
                </svg>
                <div class="clinic-info-header">
                    <div class="clinic-name">Falasifah Dental Clinic</div>
                    <div class="clinic-address">
                        Jl. Raya Dental No. 123, Bandung<br>
                        Telp: (022) 1234567 | WA: 081234567890<br>
                        Email: info@falasifah.com
                    </div>
                </div>
            </div>
        </div>
        
        <div class="receipt-title">Kwitansi Pembayaran</div>
        <div class="receipt-number">No: ${receiptNumber}</div>
        
        <div class="receipt-info">
            <div class="info-row">
                <div class="info-label">Telah terima dari</div>
                <div class="info-separator">:</div>
                <div class="info-value">${treatment.patientName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Uang sejumlah</div>
                <div class="info-separator">:</div>
                <div class="info-value">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Terbilang</div>
                <div class="info-separator">:</div>
                <div class="info-value">${numberToWords(treatment.totalTindakan)} rupiah</div>
            </div>
            <div class="info-row">
                <div class="info-label">Untuk pembayaran</div>
                <div class="info-separator">:</div>
                <div class="info-value">Perawatan gigi dan mulut</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter yang menangani</div>
                <div class="info-separator">:</div>
                <div class="info-value">${treatment.doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal transaksi</div>
                <div class="info-separator">:</div>
                <div class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
            </div>
        </div>

        <div class="amount-section">
            <div class="amount-row">
                <div class="amount-label">JUMLAH YANG DIBAYARKAN:</div>
                <div class="amount-value">Rp ${treatment.totalTindakan.toLocaleString('id-ID')}</div>
            </div>
            <div class="amount-words">
                (${numberToWords(treatment.totalTindakan)} rupiah)
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <p>Bandung, ${new Date(transactionDate).toLocaleDateString('id-ID')}</p>
                <p style="margin-top: 10px;">Yang menerima,</p>
                <div class="signature-line">${cashierName}</div>
            </div>
        </div>

        <div class="footer">
            <p>Terima kasih atas kepercayaan Anda kepada Falasifah Dental Clinic</p>
            <p>Kwitansi ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            }
        }
    </script>
</body>
</html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Add Treatment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tindakan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingTreatment ? 'Edit data tindakan yang dipilih' : 'Tambahkan data tindakan baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Doctor Selection */}
              <div>
                <Label>Dokter</Label>
                <Select 
                  value={formData.doctorId} 
                  onValueChange={(value) => setFormData(prev => ({...prev, doctorId: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokter" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Selection */}
              <div>
                <Label>Pasien</Label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="w-full justify-between"
                    >
                      {formData.patientId
                        ? patients.find(patient => patient.id === formData.patientId)?.name
                        : "Pilih pasien..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari pasien..." />
                      <CommandEmpty>Pasien tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {patients.map(patient => (
                          <CommandItem
                            key={patient.id}
                            value={patient.name}
                            onSelect={() => {
                              setFormData(prev => ({...prev, patientId: patient.id}))
                              setPatientSearchValue(patient.name)
                              setPatientSearchOpen(false)
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.patientId === patient.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{patient.name}</span>
                              <span className="text-sm text-gray-500">{patient.phone}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Shift Selection */}
              <div>
                <Label>Shift</Label>
                <Select 
                  value={formData.shift} 
                  onValueChange={(value) => setFormData(prev => ({...prev, shift: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftOptions.map(shift => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Input */}
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                  required
                />
              </div>
            </div>

            {/* Treatment Selection */}
            <div>
              <Label>Jenis Tindakan</Label>
              <div className="space-y-2">
                <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Tindakan
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari tindakan..." />
                      <CommandEmpty>Tindakan tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {treatmentProducts.map(product => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => addTreatment(product)}
                          >
                            <div className="flex flex-col w-full">
                              <span>{product.name}</span>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>{product.category}</span>
                                <span>{formatCurrency(product.price)}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Treatments */}
                {formData.selectedTreatments.map((treatment, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{treatment.name}</h4>
                        <p className="text-sm text-gray-600">
                          Harga asli: {formatCurrency(treatment.price)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeTreatment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Discount Controls */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Jenis Diskon</Label>
                        <Select
                          value={treatment.discountType}
                          onValueChange={(value: 'percentage' | 'nominal') => {
                            updateTreatmentDiscount(index, treatment.discount, value)
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Persentase (%)</SelectItem>
                            <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Diskon</Label>
                        <Input
                          type="number"
                          min="0"
                          max={treatment.discountType === 'percentage' ? 100 : treatment.price}
                          value={treatment.discount}
                          onChange={(e) => updateTreatmentDiscount(index, parseFloat(e.target.value) || 0, treatment.discountType)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Harga Final</Label>
                        <div className="h-8 px-3 border rounded flex items-center bg-gray-50 text-sm font-medium">
                          {formatCurrency(treatment.finalPrice)}
                        </div>
                      </div>
                    </div>
                    
                    {treatment.discountAmount > 0 && (
                      <p className="text-xs text-green-600">
                        Diskon: -{formatCurrency(treatment.discountAmount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Medication Selection */}
            <div>
              <Label>Obat-obatan (Opsional)</Label>
              <div className="space-y-2">
                <Popover open={medicationSearchOpen} onOpenChange={setMedicationSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Pill className="mr-2 h-4 w-4" />
                      Tambah Obat
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari obat..." />
                      <CommandEmpty>Obat tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {medicationProducts.map(product => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => addMedication(product)}
                          >
                            <div className="flex flex-col w-full">
                              <span>{product.name}</span>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Stok: {product.stock}</span>
                                <span>{formatCurrency(product.price)}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Medications */}
                {formData.selectedMedications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium">{medication.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(medication.price)} per unit
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateMedicationQuantity(index, medication.quantity - 1)}
                          disabled={medication.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{medication.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateMedicationQuantity(index, medication.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <div className="ml-2 text-sm font-medium">
                          {formatCurrency(medication.totalPrice)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee and Admin Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fee Dokter (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.feePercentage}
                  onChange={(e) => setFormData(prev => ({...prev, feePercentage: e.target.value}))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Override Biaya Admin (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.adminFeeOverride}
                  onChange={(e) => setFormData(prev => ({...prev, adminFeeOverride: e.target.value}))}
                  placeholder={`Default: ${adminFee.toLocaleString('id-ID')}`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Keterangan Tambahan</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Tambahkan catatan atau keterangan..."
              />
            </div>

            {/* Summary */}
            {formData.selectedTreatments.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Ringkasan Biaya</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal Tindakan:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Total Diskon:</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tindakan:</span>
                    <span>{formatCurrency(totalNominal)}</span>
                  </div>
                  {parseFloat(formData.medicationCost) > 0 && (
                    <div className="flex justify-between">
                      <span>Biaya Obat:</span>
                      <span>{formatCurrency(parseFloat(formData.medicationCost))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Biaya Admin:</span>
                    <span>{formatCurrency(parseFloat(formData.adminFeeOverride) || adminFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-pink-600 border-t pt-1">
                    <span>Total Final:</span>
                    <span>{formatCurrency(totalTindakan)}</span>
                  </div>
                  {parseFloat(formData.feePercentage) > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Fee Dokter ({formData.feePercentage}%):</span>
                      <span>{formatCurrency(calculatedFee)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading || formData.selectedTreatments.length === 0}>
                {loading ? 'Menyimpan...' : (editingTreatment ? 'Update' : 'Simpan')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                {editingTreatment ? 'Batal' : 'Reset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cashier Selection Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kasir</DialogTitle>
            <DialogDescription>
              Pilih kasir dan tanggal transaksi untuk {printType === 'invoice' ? 'invoice' : 'kwitansi'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasir" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrintWithCashier} disabled={!selectedCashier}>
                <Printer className="h-4 w-4 mr-2" />
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
              </Button>
              <Button variant="outline" onClick={() => setCashierDialogOpen(false)}>
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Treatments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tindakan</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment) => {
                  const feeKey = `${treatment.doctorId}_${treatment.shift}_${treatment.date}`
                  const calculatedDoctorFee = doctorFees[feeKey] || 0
                  
                  return (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        {new Date(treatment.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{treatment.patientName}</p>
                          {treatment.patientPhone && (
                            <p className="text-sm text-gray-600">{treatment.patientPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{treatment.doctorName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(treatment.treatmentTypes || []).map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{item.name}</span>
                              {item.discountAmount > 0 && (
                                <span className="text-green-600 ml-1">
                                  (-{formatCurrency(item.discountAmount)})
                                </span>
                              )}
                              <br />
                              <span className="text-gray-600">
                                {formatCurrency(item.finalPrice)}
                              </span>
                            </div>
                          ))}
                          {(treatment.selectedMedications || []).length > 0 && (
                            <div className="text-sm text-blue-600">
                              + {treatment.selectedMedications?.length} obat
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {treatment.shift}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold">
                            {formatCurrency(treatment.totalTindakan)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Tindakan: {formatCurrency(treatment.totalNominal)}
                            {treatment.medicationCost > 0 && (
                              <><br />Obat: {formatCurrency(treatment.medicationCost)}</>
                            )}
                            <br />Admin: {formatCurrency(treatment.adminFeeOverride || 20000)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatCurrency(calculatedDoctorFee)}
                          </div>
                          <div className="text-gray-600">
                            {treatment.feePercentage}% dari {formatCurrency(treatment.totalNominal)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(treatment)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(treatment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateInvoice(treatment)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateReceipt(treatment)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {treatments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada data tindakan. Klik "Tambah Tindakan" untuk menambahkan data baru.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}