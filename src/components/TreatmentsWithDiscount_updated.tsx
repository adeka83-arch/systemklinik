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
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e91e63; padding-bottom: 20px; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-info { font-size: 12px; color: #666; }
        .invoice-title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 20px 0; }
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
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
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
            <div class="clinic-name">Falasifah Dental Clinic</div>
            <div class="clinic-info">Klinik Gigi Terpercaya</div>
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
                <div class="info-label">Tanggal:</div>
                <div class="info-value">${new Date(treatment.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Transaksi:</div>
                <div class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter:</div>
                <div class="info-value">${treatment.doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Shift:</div>
                <div class="info-value">${treatment.shift}</div>
            </div>
        </div>
        
        <table class="treatment-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Jenis Item</th>
                    <th>Harga Asli</th>
                    <th>Diskon/Qty</th>
                    <th>Harga Final</th>
                </tr>
            </thead>
            <tbody>
                ${(treatment.treatmentTypes || []).map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name} <span style="font-size: 11px; color: #9d174d; font-weight: bold;">[TINDAKAN]</span></td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${formatCurrency(item.discountAmount || 0)}</td>
                        <td>${formatCurrency(item.finalPrice || item.price)}</td>
                    </tr>
                `).join('')}
                ${(treatment.selectedMedications || []).map((item, index) => `
                    <tr>
                        <td>${(treatment.treatmentTypes || []).length + index + 1}</td>
                        <td>${item.name} <span style="font-size: 11px; color: #059669; font-weight: bold;">[OBAT]</span></td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>Qty: ${item.quantity}</td>
                        <td>${formatCurrency(item.totalPrice)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${treatment.description ? `
        <div style="margin-bottom: 20px;">
            <strong>Catatan:</strong><br>
            ${treatment.description}
        </div>
        ` : ''}
        
        <div class="total-section">
            <div class="total-row">
                <div class="total-label">Subtotal Tindakan:</div>
                <div class="total-amount">${formatCurrency(treatment.subtotal || 0)}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Total Diskon:</div>
                <div class="total-amount">-${formatCurrency(treatment.totalDiscount || 0)}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Total Tindakan (setelah diskon):</div>
                <div class="total-amount">${formatCurrency(treatment.totalNominal || 0)}</div>
            </div>
            ${(treatment.medicationCost || 0) > 0 ? `
            <div class="total-row">
                <div class="total-label">Biaya Obat:</div>
                <div class="total-amount">${formatCurrency(treatment.medicationCost || 0)}</div>
            </div>
            ` : ''}
            <div class="total-row grand-total">
                <div class="total-label">TOTAL PEMBAYARAN:</div>
                <div class="total-amount">${formatCurrency((treatment.totalNominal || 0) + (treatment.medicationCost || 0))}</div>
            </div>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    Kasir<br>
                    ${cashierName}
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    Pasien/Keluarga<br>
                    ${treatment.patientName}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Terima kasih atas kepercayaan Anda kepada Falasifah Dental Clinic</p>
            <p>Tanggal Transaksi: ${new Date(transactionDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Invoice ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background: #e91e63; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cetak Invoice</button>
            <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Tutup</button>
        </div>
    </div>
</body>
</html>`

    invoiceWindow.document.write(invoiceHTML)
    invoiceWindow.document.close()
  }

  const generateReceiptWithCashier = (treatment: Treatment, cashierName: string, transactionDate: string) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    // Generate receipt number based on date and treatment ID
    const receiptNumber = `KWT/${new Date(transactionDate).getFullYear()}/${String(new Date(transactionDate).getMonth() + 1).padStart(2, '0')}/${treatment.id.slice(-6).toUpperCase()}`
    
    // Calculate total payment
    const totalPayment = (treatment.totalNominal || 0) + (treatment.medicationCost || 0)
    const totalPaymentWords = numberToWords(totalPayment)

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
        .header { text-align: center; margin-bottom: 30px; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #e91e63; margin-bottom: 5px; }
        .clinic-info { font-size: 12px; color: #666; margin-bottom: 20px; }
        .receipt-title { font-size: 20px; font-weight: bold; color: #e91e63; margin: 20px 0; text-decoration: underline; }
        .receipt-number { font-size: 14px; color: #333; margin-bottom: 20px; }
        .receipt-info { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { width: 200px; font-weight: bold; }
        .info-value { flex: 1; }
        .amount-section { margin: 30px 0; }
        .amount-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .amount-label { font-weight: bold; }
        .amount-value { font-weight: bold; }
        .total-amount { font-size: 18px; color: #e91e63; border: 2px solid #e91e63; padding: 10px; margin: 20px 0; }
        .words-section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; background: #f8f9fa; }
        .words-label { font-weight: bold; margin-bottom: 5px; }
        .words-value { font-style: italic; text-transform: capitalize; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        @media print {
            body { margin: 0; }
            .receipt-container { margin: 0; padding: 15px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="clinic-name">Falasifah Dental Clinic</div>
            <div class="clinic-info">Klinik Gigi Terpercaya</div>
        </div>
        
        <div class="receipt-title">KWITANSI PEMBAYARAN</div>
        <div class="receipt-number">No. Kwitansi: ${receiptNumber}</div>
        
        <div class="receipt-info">
            <div class="info-row">
                <div class="info-label">Sudah terima dari:</div>
                <div class="info-value">${treatment.patientName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">No. Telp:</div>
                <div class="info-value">${treatment.patientPhone || '-'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal Transaksi:</div>
                <div class="info-value">${new Date(transactionDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter yang menangani:</div>
                <div class="info-value">${treatment.doctorName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Untuk pembayaran:</div>
                <div class="info-value">Tindakan medis gigi dan obat-obatan</div>
            </div>
        </div>
        
        <div class="amount-section">
            <div class="amount-row">
                <div class="amount-label">Total Tindakan (setelah diskon):</div>
                <div class="amount-value">${formatCurrency(treatment.totalNominal || 0)}</div>
            </div>
            ${(treatment.medicationCost || 0) > 0 ? `
            <div class="amount-row">
                <div class="amount-label">Biaya Obat:</div>
                <div class="amount-value">${formatCurrency(treatment.medicationCost || 0)}</div>
            </div>
            ` : ''}
            <div class="total-amount">
                <div class="amount-row">
                    <div class="amount-label">TOTAL YANG DIBAYAR:</div>
                    <div class="amount-value">${formatCurrency(totalPayment)}</div>
                </div>
            </div>
        </div>
        
        <div class="words-section">
            <div class="words-label">Terbilang:</div>
            <div class="words-value">${totalPaymentWords} rupiah</div>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    Kasir<br>
                    ${cashierName}
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    Yang Menerima<br>
                    ${treatment.patientName}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Kwitansi ini merupakan bukti pembayaran yang sah</p>
            <p>Tanggal Transaksi: ${new Date(transactionDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Kwitansi ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background: #e91e63; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cetak Kwitansi</button>
            <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Tutup</button>
        </div>
    </div>
</body>
</html>`

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  const handlePreview = (treatment: Treatment, type: 'invoice' | 'receipt') => {
    setSelectedTreatmentForPreview(treatment)
    setPreviewType(type)
    setPreviewOpen(true)
  }

  const handlePrint = (treatment: Treatment) => {
    setSelectedTreatmentForPrint(treatment)
    setPrintDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manajemen Tindakan dan Obat</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTreatment(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tindakan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTreatment ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTreatment ? 'Perbarui data tindakan' : 'Isi form di bawah untuk menambahkan data tindakan baru'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Doctor Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="doctor">Dokter</Label>
                      <Select 
                        value={formData.doctorId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Dokter" />
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

                    {/* Patient Selection */}
                    <div className="space-y-2">
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
                              ? patientSearchValue
                              : "Pilih pasien..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Cari pasien..."
                              value={patientSearchValue}
                              onValueChange={setPatientSearchValue}
                            />
                            <CommandEmpty>Tidak ada pasien ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {patients
                                .filter(patient =>
                                  patient.name.toLowerCase().includes(patientSearchValue.toLowerCase()) ||
                                  patient.phone.includes(patientSearchValue)
                                )
                                .map((patient) => (
                                  <CommandItem
                                    key={patient.id}
                                    value={patient.id}
                                    onSelect={(currentValue) => {
                                      setFormData(prev => ({ ...prev, patientId: currentValue }))
                                      setPatientSearchValue(patient.name)
                                      setPatientSearchOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${formData.patientId === patient.id ? "opacity-100" : "opacity-0"}`}
                                    />
                                    <div>
                                      <div>{patient.name}</div>
                                      <div className="text-sm text-gray-500">{patient.phone}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Date Selection */}
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

                    {/* Shift Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="shift">Shift</Label>
                      <Select 
                        value={formData.shift} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Shift" />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftOptions.map((shift) => (
                            <SelectItem key={shift.value} value={shift.value}>
                              {shift.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Treatment Selection */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Jenis Tindakan</Label>
                      <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Tindakan
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <Command>
                            <CommandInput placeholder="Cari tindakan..." />
                            <CommandEmpty>Tidak ada tindakan ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {treatmentProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() => addTreatment(product)}
                                >
                                  <div className="flex justify-between w-full">
                                    <span>{product.name}</span>
                                    <span className="text-sm text-gray-500">
                                      {formatCurrency(product.price)}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {formData.selectedTreatments.length > 0 && (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tindakan</TableHead>
                              <TableHead>Harga Asli</TableHead>
                              <TableHead>Diskon</TableHead>
                              <TableHead>Harga Final</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.selectedTreatments.map((treatment, index) => (
                              <TableRow key={index}>
                                <TableCell>{treatment.name}</TableCell>
                                <TableCell>{formatCurrency(treatment.price)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2 items-center">
                                    <Select
                                      value={treatment.discountType}
                                      onValueChange={(value: 'percentage' | 'nominal') => 
                                        updateTreatmentDiscount(index, treatment.discount, value)
                                      }
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percentage">%</SelectItem>
                                        <SelectItem value="nominal">Rp</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      value={treatment.discount}
                                      onChange={(e) => 
                                        updateTreatmentDiscount(index, parseFloat(e.target.value) || 0, treatment.discountType)
                                      }
                                      className="w-20"
                                      min="0"
                                      max={treatment.discountType === 'percentage' ? 100 : treatment.price}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>{formatCurrency(treatment.finalPrice)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTreatment(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Medication Selection */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Obat-obatan (Opsional)</Label>
                      <Popover open={medicationSearchOpen} onOpenChange={setMedicationSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pill className="h-4 w-4 mr-2" />
                            Tambah Obat
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <Command>
                            <CommandInput placeholder="Cari obat..." />
                            <CommandEmpty>Tidak ada obat ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {medicationProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() => addMedication(product)}
                                >
                                  <div className="flex justify-between w-full">
                                    <div>
                                      <span>{product.name}</span>
                                      <div className="text-xs text-gray-500">
                                        Stok: {product.stock}
                                      </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {formatCurrency(product.price)}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {formData.selectedMedications.length > 0 && (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Obat</TableHead>
                              <TableHead>Harga Satuan</TableHead>
                              <TableHead>Jumlah</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.selectedMedications.map((medication, index) => (
                              <TableRow key={index}>
                                <TableCell>{medication.name}</TableCell>
                                <TableCell>{formatCurrency(medication.price)}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={medication.quantity}
                                    onChange={(e) => 
                                      updateMedicationQuantity(index, parseInt(e.target.value) || 1)
                                    }
                                    className="w-20"
                                    min="1"
                                  />
                                </TableCell>
                                <TableCell>{formatCurrency(medication.totalPrice)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMedication(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Calculation Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal Tindakan:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Diskon:</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tindakan (setelah diskon):</span>
                      <span>{formatCurrency(totalNominal)}</span>
                    </div>
                    {parseFloat(formData.medicationCost) > 0 && (
                      <div className="flex justify-between">
                        <span>Biaya Obat:</span>
                        <span>{formatCurrency(parseFloat(formData.medicationCost))}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Keseluruhan:</span>
                      <span>{formatCurrency(totalNominal + parseFloat(formData.medicationCost || '0'))}</span>
                    </div>
                  </div>

                  {/* Fee Calculation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feePercentage">Persentase Fee Dokter (%)</Label>
                      <Input
                        id="feePercentage"
                        type="number"
                        value={formData.feePercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, feePercentage: e.target.value }))}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calculatedFee">Fee Dokter (Terhitung)</Label>
                      <div className="bg-gray-100 p-2 rounded border">
                        {formatCurrency(calculatedFee)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminFeeOverride">Admin Fee Override (Opsional)</Label>
                      <Input
                        id="adminFeeOverride"
                        type="number"
                        value={formData.adminFeeOverride}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminFeeOverride: e.target.value }))}
                        placeholder={`Default: ${formatCurrency(adminFee)}`}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Catatan (Opsional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tambahkan catatan untuk tindakan ini..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : editingTreatment ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fee Dokter</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      Belum ada data tindakan
                    </TableCell>
                  </TableRow>
                ) : (
                  treatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        {new Date(treatment.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{treatment.patientName}</div>
                          {treatment.patientPhone && (
                            <div className="text-sm text-gray-500">{treatment.patientPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{treatment.doctorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{treatment.shift}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {treatment.treatmentTypes?.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.name}
                              {item.discountAmount > 0 && (
                                <span className="text-red-500 ml-1">
                                  (-{formatCurrency(item.discountAmount)})
                                </span>
                              )}
                            </div>
                          ))}
                          {treatment.selectedMedications?.map((med, index) => (
                            <div key={index} className="text-sm text-green-600">
                              {med.name} (x{med.quantity})
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>Tindakan: {formatCurrency(treatment.totalNominal || 0)}</div>
                          {(treatment.medicationCost || 0) > 0 && (
                            <div className="text-sm text-green-600">
                              Obat: {formatCurrency(treatment.medicationCost || 0)}
                            </div>
                          )}
                          <div className="font-semibold border-t pt-1">
                            Total: {formatCurrency((treatment.totalNominal || 0) + (treatment.medicationCost || 0))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {treatment.feePercentage}% dari {formatCurrency(treatment.totalNominal || 0)}
                          </div>
                          <div className="font-semibold">
                            {formatCurrency(treatment.calculatedFee || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(treatment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(treatment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateInvoice(treatment)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateReceipt(treatment)}
                          >
                            <FileCheck className="h-4 w-4" />
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

      {/* Cashier Selection Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kasir dan Tanggal Transaksi</DialogTitle>
            <DialogDescription>
              Pilih kasir yang bertugas dan konfirmasi tanggal transaksi sebelum mencetak {printType === 'invoice' ? 'invoice' : 'kwitansi'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Tanggal Transaksi</Label>
              <Input
                id="transactionDate"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kasir" />
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCashierDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handlePrintWithCashier}>
                <Printer className="h-4 w-4 mr-2" />
                Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}