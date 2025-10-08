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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Edit, Trash2, Receipt, Calculator, Check, ChevronsUpDown, FileText, Printer, X, Eye, Maximize2, Percent, Minus, Pill, FileCheck, Search, Filter, Calendar, RotateCcw, ChevronDown, ChevronUp, CreditCard, Settings } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import clinicLogo from 'figma:asset/76c3906f7fa3f41668ba5cb3dd25fd0fc9c97441.png'
import { generateInvoiceWithCashierSignature, generateReceiptWithCashierSignature } from './TreatmentPrintTemplates'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'
import { TreatmentMultiFeeSection } from './TreatmentMultiFeeSection'

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
  calculatedFee: number // Fee dokter dengan formulasi baru: Lunas = totalNominal * %, DP = (totalNominal - dpAmount) * %
  shift: string
  date: string
  // Payment fields
  paymentMethod?: string
  paymentStatus?: 'lunas' | 'dp'
  dpAmount?: number
  outstandingAmount?: number
  paymentNotes?: string
  createdAt: string
}

interface FeeSettings {
  id: string
  doctorIds?: string[] // Changed to support multiple doctors
  doctorNames?: string[] // Changed to support multiple doctor names
  category?: string
  treatmentTypes?: string[] // Changed to support multiple treatment types
  feePercentage: number
  isDefault: boolean
  description?: string
  createdAt: string
}

interface MultiFeeResult {
  treatmentFees: any[]
  totalTreatmentAmount: number
  totalFeeAmount: number
  hasConflicts: boolean
  hasManualOverrides: boolean
  averageFeePercentage: number
}

interface TreatmentsProps {
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

const paymentMethods = [
  'Cash',
  'Debit',
  'QRIS',
  'Credit Card'
]

const paymentStatusOptions = [
  { value: 'lunas', label: 'Lunas' },
  { value: 'dp', label: 'DP (Down Payment)' }
]

export function TreatmentsWithDiscount({ accessToken, refreshTrigger, adminFee: propAdminFee, clinicSettings }: TreatmentsProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [feeSettings, setFeeSettings] = useState<FeeSettings[]>([])
  const [activeTab, setActiveTab] = useState('treatments')
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
    date: '',
    // Payment fields
    paymentMethod: '',
    paymentStatus: 'lunas' as const,
    dpAmount: 0,
    paymentNotes: ''
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
  
  // Cashier selection state
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTreatmentForCashier, setSelectedTreatmentForCashier] = useState<Treatment | null>(null)
  const [printType, setPrintType] = useState<'invoice' | 'receipt'>('invoice')
  
  // Fee Settings state
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeSettings | null>(null)
  const [feeFormData, setFeeFormData] = useState({
    doctorId: '',
    category: '',
    treatmentType: '',
    feePercentage: '',
    isDefault: false,
    description: ''
  })
  
  // Auto-filled fee tracking
  const [isAutoFilledFee, setIsAutoFilledFee] = useState(false)
  const [autoFilledFeeDescription, setAutoFilledFeeDescription] = useState('')
  
  // Multi fee calculation state
  const [isMultiFeeMode, setIsMultiFeeMode] = useState(false)

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

  // Auto-fill fee percentage based on doctor and treatment selection
  useEffect(() => {
    // Only auto-fill if user hasn't manually set fee percentage and it's not empty
    if (formData.feePercentage !== '' && parseFloat(formData.feePercentage) !== 0 && !isAutoFilledFee) {
      return // User has already set a value, don't override
    }

    if (!formData.doctorId || formData.selectedTreatments.length === 0) {
      return // Not enough data to auto-suggest
    }

    const doctorId = formData.doctorId
    const selectedDoctor = doctors.find(d => d.id === doctorId)
    
    // Try to find the best matching fee setting
    let bestMatch: FeeSettings | null = null
    let bestMatchScore = 0

    for (const feeSetting of feeSettings) {
      let score = 0
      let isMatch = false

      // Check if fee setting applies to this doctor (either specific doctor or all doctors)
      const appliesToDoctor = !feeSetting.doctorIds || 
        feeSetting.doctorIds.length === 0 || 
        feeSetting.doctorIds.includes(doctorId)
      
      if (!appliesToDoctor) {
        continue // Skip if doesn't apply to this doctor
      }

      // Check if fee setting applies to selected treatments
      const appliesToTreatments = !feeSetting.treatmentTypes || 
        feeSetting.treatmentTypes.length === 0 || 
        formData.selectedTreatments.some(treatment => 
          feeSetting.treatmentTypes.includes(treatment.name)
        )

      if (!appliesToTreatments) {
        continue // Skip if doesn't apply to selected treatments
      }

      isMatch = true

      // Calculate match score (higher is better)
      // Specific doctor match gets higher score than general
      if (feeSetting.doctorIds && feeSetting.doctorIds.includes(doctorId)) {
        score += 10
      }

      // Specific treatment match gets higher score than general
      if (feeSetting.treatmentTypes && feeSetting.treatmentTypes.length > 0) {
        const matchingTreatments = formData.selectedTreatments.filter(treatment => 
          feeSetting.treatmentTypes.includes(treatment.name)
        ).length
        score += matchingTreatments * 5
      }

      // More specific settings get higher priority
      if (feeSetting.description && feeSetting.description.includes('spesifik')) {
        score += 3
      }

      if (isMatch && score > bestMatchScore) {
        bestMatch = feeSetting
        bestMatchScore = score
      }
    }

    // Auto-fill fee percentage if we found a match
    if (bestMatch) {
      console.log('Auto-filling fee percentage:', bestMatch.feePercentage, '%')
      console.log('Based on fee setting:', bestMatch.description || 'No description')
      console.log('For doctor:', selectedDoctor?.name)
      console.log('For treatments:', formData.selectedTreatments.map(t => t.name).join(', '))
      
      setFormData(prev => ({
        ...prev,
        feePercentage: bestMatch.feePercentage.toString()
      }))

      // Track that fee was auto-filled
      setIsAutoFilledFee(true)
      setAutoFilledFeeDescription(bestMatch.description || 'Pengaturan otomatis')

      toast.success(
        `Fee dokter otomatis diisi: ${bestMatch.feePercentage}% berdasarkan pengaturan${bestMatch.description ? ': ' + bestMatch.description : ''}`
      )
    }
  }, [formData.doctorId, formData.selectedTreatments, feeSettings, doctors, formData.feePercentage])

  // Calculate total tindakan and fee when values change
  useEffect(() => {
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const medicationCost = parseFloat(formData.medicationCost) || 0
    const calculatedTotalTindakan = totalNominal + currentAdminFee + medicationCost
    setTotalTindakan(calculatedTotalTindakan)
    
    const percentage = parseFloat(formData.feePercentage) || 0
    
    // NEW FORMULA: Fee calculation based on payment status
    // LUNAS: fee = totalNominal (total tindakan setelah diskon) * persentase
    // DP: fee = (totalNominal - dpAmount) * persentase (fee dari outstanding amount)
    let calculatedFeeBase = totalNominal
    
    if (formData.paymentStatus === 'dp') {
      // For DP: fee = (subtotal tindakan - DP amount) * percentage
      // Fee dihitung dari outstanding amount pada subtotal tindakan
      const outstandingTreatmentAmount = Math.max(0, totalNominal - formData.dpAmount)
      calculatedFeeBase = outstandingTreatmentAmount
    } else {
      // For lunas: fee = total tindakan setelah diskon * percentage (unchanged)
      calculatedFeeBase = totalNominal
    }
    
    const calculated = (calculatedFeeBase * percentage / 100)
    setCalculatedFee(Math.max(0, calculated))
  }, [totalNominal, formData.feePercentage, formData.adminFeeOverride, formData.medicationCost, formData.paymentStatus, formData.dpAmount, adminFee])

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
        // Clean doctor names from duplicate drg. prefix using utility function
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
        
        // Remove duplicates by name to prevent key conflicts
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
      console.log('=== FETCHING MEDICATION PRODUCTS ===')
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
        console.log('Medication products fetched:', filteredProducts.length)
        filteredProducts.forEach(product => {
          console.log(`- ${product.name}: Stock ${product.stock} (ID: ${product.id})`)
        })
        setMedicationProducts(filteredProducts)
        console.log('=== END FETCHING MEDICATION PRODUCTS ===')
      }
    } catch (error) {
      console.log('Error fetching medication products:', error)
    }
  }

  const fetchFeeSettings = async () => {
    try {
      const response = await fetch(`${serverUrl}/fee-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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
      return Math.min(discount, price) // Diskon nominal tidak boleh lebih dari harga
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
    console.log('=== ADDING MEDICATION TO FORM ===')
    console.log('Selected medication product:', {
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: product.price,
      category: product.category
    })
    
    // Check if medication already added
    const existingMedication = formData.selectedMedications.find(med => med.id === product.id)
    if (existingMedication) {
      console.log('Medication already exists in selection')
      toast.error(`Obat ${product.name} sudah ditambahkan`)
      return
    }

    // Check stock availability
    if (product.stock <= 0) {
      console.log('Insufficient stock for medication')
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
    
    console.log('Created medication item:', medicationItem)
    console.log('=== END ADDING MEDICATION ===')

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
      
      // Find current stock for this medication
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

  // Handle manual fee percentage changes
  const handleFeePercentageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      feePercentage: value
    }))
    
    // Reset auto-fill tracking if user manually changes fee percentage
    if (isAutoFilledFee && value !== formData.feePercentage) {
      setIsAutoFilledFee(false)
      setAutoFilledFeeDescription('')
    }
    
    // Reset multi fee mode if user manually enters fee
    setIsMultiFeeMode(false)
  }

  // Handle fee changes from multi fee component
  const handleFeeChange = (feePercentage: string, totalFee: number, isMultiFee: boolean) => {
    setIsMultiFeeMode(isMultiFee)
    setCalculatedFee(totalFee)
    
    if (!isMultiFee) {
      // Update single fee percentage if not in multi fee mode
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
        // Payment data
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        dpAmount: formData.dpAmount,
        outstandingAmount: outstandingAmount,
        paymentNotes: formData.paymentNotes
      }
      
      console.log('=== TREATMENT DATA DEBUG ===')
      console.log('Treatment data being sent to server:', treatmentData)
      console.log('Selected medications with details:', formData.selectedMedications)
      console.log('Number of medications:', formData.selectedMedications?.length || 0)
      if (formData.selectedMedications && formData.selectedMedications.length > 0) {
        formData.selectedMedications.forEach((med, index) => {
          console.log(`Medication ${index + 1}:`, {
            id: med.id,
            name: med.name,
            quantity: med.quantity,
            price: med.price,
            totalPrice: med.totalPrice
          })
        })
      }
      console.log('=== END DEBUG ===')

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
          fetchMedicationProducts() // Refresh medication products in case stock was affected
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
          console.log('=== FRONTEND RESPONSE DEBUG ===')
          console.log('Response from server:', responseData)
          console.log('Stock updates from server:', responseData.stockUpdates)
          console.log('=== END FRONTEND DEBUG ===')
          
          let successMessage = 'Data tindakan berhasil ditambahkan'
          
          // Add medication stock information if medications were used
          if (formData.selectedMedications && formData.selectedMedications.length > 0) {
            const medicationNames = formData.selectedMedications.map(med => `${med.name} (${med.quantity})`).join(', ')
            successMessage += `. Stok obat telah dikurangi: ${medicationNames}`
            
            // Show detailed stock update information if available
            if (responseData.stockUpdates && responseData.stockUpdates.length > 0) {
              const stockDetails = responseData.stockUpdates.map(update => 
                `${update.productName}: ${update.previousStock} ��� ${update.newStock}`
              ).join(', ')
              console.log('Detailed stock changes:', stockDetails)
            }
          }
          
          toast.success(successMessage)
          
          // Add a small delay before refreshing to ensure backend has completed
          setTimeout(() => {
            console.log('Refreshing medication products and treatments...')
            fetchTreatments()
            fetchMedicationProducts() // Refresh medication products to show updated stock
          }, 1000)
          
          resetForm()
        } else {
          const data = await response.json()
          console.log('=== FRONTEND ERROR DEBUG ===')
          console.log('Error response from server:', data)
          console.log('=== END ERROR DEBUG ===')
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
    console.log('Edit treatment triggered:', treatment)
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
      date: treatment.date,
      // Payment fields
      paymentMethod: treatment.paymentMethod || '',
      paymentStatus: treatment.paymentStatus || 'lunas',
      dpAmount: treatment.dpAmount || 0,
      paymentNotes: treatment.paymentNotes || ''
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
      date: '',
      // Payment fields
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
    setPatientSearchValue('')
    setEditingTreatment(null)
    setDialogOpen(false)
    
    // Reset auto-fill tracking
    setIsAutoFilledFee(false)
    setAutoFilledFeeDescription('')
  }

  const resetFeeForm = () => {
    setFeeFormData({
      doctorId: '',
      category: '',
      treatmentType: '',
      feePercentage: '',
      isDefault: false,
      description: ''
    })
    setEditingFee(null)
    setFeeDialogOpen(false)
  }

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === feeFormData.doctorId)

      if (parseFloat(feeFormData.feePercentage) <= 0 || parseFloat(feeFormData.feePercentage) > 100) {
        toast.error('Persentase fee harus antara 0-100%')
        setLoading(false)
        return
      }

      const feeData = {
        doctorId: feeFormData.doctorId || null,
        doctorName: selectedDoctor?.name || null,
        category: feeFormData.category || null,
        treatmentType: feeFormData.treatmentType || null,
        feePercentage: parseFloat(feeFormData.feePercentage),
        isDefault: feeFormData.isDefault,
        description: feeFormData.description
      }

      if (editingFee) {
        const response = await fetch(`${serverUrl}/fee-settings/${editingFee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(feeData)
        })

        if (response.ok) {
          toast.success('Pengaturan fee berhasil diperbarui')
          fetchFeeSettings()
          resetFeeForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui pengaturan fee')
        }
      } else {
        const response = await fetch(`${serverUrl}/fee-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(feeData)
        })

        if (response.ok) {
          toast.success('Pengaturan fee berhasil ditambahkan')
          fetchFeeSettings()
          resetFeeForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan pengaturan fee')
        }
      }
    } catch (error) {
      console.log('Error saving fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleFeeEdit = (feeSetting: FeeSettings) => {
    setEditingFee(feeSetting)
    setFeeFormData({
      doctorId: feeSetting.doctorId || '',
      category: feeSetting.category || '',
      treatmentType: feeSetting.treatmentType || '',
      feePercentage: feeSetting.feePercentage.toString(),
      isDefault: feeSetting.isDefault,
      description: feeSetting.description || ''
    })
    setFeeDialogOpen(true)
  }

  const handleFeeDelete = async (feeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengaturan fee ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/fee-settings/${feeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Pengaturan fee berhasil dihapus')
        fetchFeeSettings()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus pengaturan fee')
      }
    } catch (error) {
      console.log('Error deleting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const getDefaultFeePercentage = (doctorId: string, treatmentItems: TreatmentItem[]) => {
    // Priority: Specific doctor + treatment type > Category > Doctor > Default
    for (const item of treatmentItems) {
      // 1. Check for specific doctor + treatment type
      const specificSetting = feeSettings.find(fs => 
        fs.doctorId === doctorId && fs.treatmentType === item.name
      )
      if (specificSetting) {
        return specificSetting.feePercentage
      }

      // 2. Check for category-specific setting for this doctor
      const product = treatmentProducts.find(p => p.id === item.id)
      if (product) {
        const categorySetting = feeSettings.find(fs => 
          fs.doctorId === doctorId && fs.category === product.category
        )
        if (categorySetting) {
          return categorySetting.feePercentage
        }
      }
    }

    // 3. Check for general doctor setting
    const doctorSetting = feeSettings.find(fs => 
      fs.doctorId === doctorId && !fs.category && !fs.treatmentType
    )
    if (doctorSetting) {
      return doctorSetting.feePercentage
    }

    // 4. Check for default setting
    const defaultSetting = feeSettings.find(fs => fs.isDefault)
    if (defaultSetting) {
      return defaultSetting.feePercentage
    }

    return 0
  }

  // Auto-fill fee percentage when doctor is selected
  useEffect(() => {
    if (formData.doctorId && formData.selectedTreatments.length > 0 && !editingTreatment) {
      const defaultPercentage = getDefaultFeePercentage(formData.doctorId, formData.selectedTreatments)
      if (defaultPercentage > 0) {
        setFormData(prev => ({
          ...prev,
          feePercentage: defaultPercentage.toString()
        }))
      }
    }
  }, [formData.doctorId, formData.selectedTreatments, feeSettings, editingTreatment])

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
      generateInvoiceWithCashierSignature(selectedTreatmentForCashier, cashierName, transactionDate, clinicSettings)
    } else {
      generateReceiptWithCashierSignature(selectedTreatmentForCashier, cashierName, transactionDate, clinicSettings)
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

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'

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

    const finalAmount = treatment.totalTindakan
    const finalAmountInWords = numberToWords(finalAmount).charAt(0).toUpperCase() + numberToWords(finalAmount).slice(1) + ' rupiah'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${treatment.patientName}</title>
        <style>
          @media print {
            @page { size: A5; margin: 0.5cm; }
            body { font-size: 10px; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 15px; }
          .clinic-info { margin: 10px 0; }
          .clinic-name { font-size: 18px; font-weight: bold; color: #333; margin: 5px 0; }
          .clinic-details { font-size: 11px; color: #666; line-height: 1.4; }
          .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; font-size: 12px; }
          .patient-info, .invoice-details { background: #f9f9f9; padding: 10px; border-radius: 5px; width: 45%; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .total-row { background: #f9f9f9; font-weight: bold; }
          .final-total { background: #e8f5e8; font-weight: bold; font-size: 12px; }
          .amount-words { margin: 15px 0; padding: 10px; background: #f0f8ff; border-left: 4px solid #007bff; font-style: italic; }
          .signature { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature div { text-align: center; width: 30%; }
          .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 50px; }
          .payment-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .notes { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
            <img src="${logoSrc}" alt="Logo Klinik" style="height: 60px; object-fit: contain;">
            <div class="clinic-info">
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-details">
                Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                Sawangan Lama, Kec. Sawangan. Depok. Jawa Barat<br>
                Telp/WA: 085283228355
              </div>
            </div>
          </div>
        </div>

        <h2 style="text-align: center; color: #333; margin: 20px 0; font-size: 16px;">INVOICE TINDAKAN MEDIS</h2>

        <div class="invoice-info">
          <div class="patient-info">
            <h4 style="margin: 0 0 10px 0; color: #333;">INFORMASI PASIEN</h4>
            <p><strong>Nama:</strong> ${treatment.patientName}</p>
            <p><strong>Telepon:</strong> ${treatment.patientPhone || '-'}</p>
            <p><strong>Tanggal:</strong> ${new Date(treatment.date).toLocaleDateString('id-ID')}</p>
            <p><strong>Dokter:</strong> ${treatment.doctorName}</p>
          </div>
          <div class="invoice-details">
            <h4 style="margin: 0 0 10px 0; color: #333;">DETAIL INVOICE</h4>
            <p><strong>No. Invoice:</strong> INV-${treatment.id.slice(-6).toUpperCase()}</p>
            <p><strong>Tanggal Cetak:</strong> ${new Date(transactionDate).toLocaleDateString('id-ID')}</p>
            <p><strong>Shift:</strong> ${treatment.shift}</p>
            <p><strong>Kasir:</strong> ${cashierName}</p>
          </div>
        </div>

        ${treatment.paymentMethod || treatment.paymentStatus ? `
          <div class="payment-info">
            <h4 style="margin: 0 0 8px 0; color: #856404;">INFORMASI PEMBAYARAN</h4>
            ${treatment.paymentMethod ? `<p><strong>Metode:</strong> ${treatment.paymentMethod}</p>` : ''}
            ${treatment.paymentStatus ? `<p><strong>Status:</strong> ${treatment.paymentStatus === 'dp' ? 'DP (Down Payment)' : 'Lunas'}</p>` : ''}
            ${treatment.paymentStatus === 'dp' && treatment.dpAmount ? `<p><strong>Jumlah DP:</strong> Rp ${treatment.dpAmount.toLocaleString('id-ID')}</p>` : ''}
            ${treatment.outstandingAmount && treatment.outstandingAmount > 0 ? `<p style="color: #dc3545;"><strong>Outstanding:</strong> Rp ${treatment.outstandingAmount.toLocaleString('id-ID')}</p>` : ''}
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 8%;">No</th>
              <th style="width: 40%;">Deskripsi</th>
              <th style="width: 18%;">Harga</th>
              <th style="width: 16%;">Diskon</th>
              <th style="width: 18%;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${treatmentRows}
            ${medicationRows}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><strong>Subtotal Tindakan:</strong></td>
              <td><strong>Rp ${treatment.totalNominal.toLocaleString('id-ID')}</strong></td>
            </tr>
            ${treatment.medicationCost > 0 ? `
              <tr class="total-row">
                <td colspan="4" style="text-align: right;"><strong>Total Obat:</strong></td>
                <td><strong>Rp ${treatment.medicationCost.toLocaleString('id-ID')}</strong></td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><strong>Biaya Admin:</strong></td>
              <td><strong>Rp ${(treatment.adminFeeOverride || clinicSettings?.adminFee || 0).toLocaleString('id-ID')}</strong></td>
            </tr>
            <tr class="final-total">
              <td colspan="4" style="text-align: right;"><strong>TOTAL KESELURUHAN:</strong></td>
              <td><strong>Rp ${finalAmount.toLocaleString('id-ID')}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="amount-words">
          <strong>Terbilang:</strong> ${finalAmountInWords}
        </div>

        ${treatment.description ? `
          <div class="notes">
            <h4 style="margin: 0 0 8px 0;">KETERANGAN:</h4>
            <p style="margin: 0;">${treatment.description}</p>
          </div>
        ` : ''}

        ${treatment.paymentNotes ? `
          <div class="notes">
            <h4 style="margin: 0 0 8px 0;">CATATAN PEMBAYARAN:</h4>
            <p style="margin: 0;">${treatment.paymentNotes}</p>
          </div>
        ` : ''}

        <div class="signature">
          <div>
            <div class="signature-line"></div>
            <strong>Kasir</strong><br>
            ${cashierName}
          </div>
          <div>
            <div class="signature-line"></div>
            <strong>Dokter</strong><br>
            ${treatment.doctorName}
          </div>
          <div>
            <div class="signature-line"></div>
            <strong>Pasien</strong><br>
            ${treatment.patientName}
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
          <p>Terima kasih atas kepercayaan Anda kepada ${clinicName}</p>
          <p style="font-style: italic;">Invoice ini adalah bukti sah pembayaran</p>
        </div>
      </body>
      </html>
    `

    invoiceWindow.document.write(htmlContent)
    invoiceWindow.document.close()
    
    setTimeout(() => {
      invoiceWindow.print()
      invoiceWindow.close()
    }, 1000)
  }

  const generateReceiptWithCashier = (treatment: Treatment, cashierName: string, transactionDate: string) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const logoSrc = clinicSettings?.logo || clinicLogo
    const clinicName = clinicSettings?.name || 'Falasifah Dental Clinic'
    const finalAmount = treatment.totalTindakan
    const finalAmountInWords = numberToWords(finalAmount).charAt(0).toUpperCase() + numberToWords(finalAmount).slice(1) + ' rupiah'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi - ${treatment.patientName}</title>
        <style>
          @media print {
            @page { size: A5; margin: 0.5cm; }
            body { font-size: 11px; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #333; padding-bottom: 15px; }
          .clinic-info { margin: 10px 0; }
          .clinic-name { font-size: 20px; font-weight: bold; color: #333; margin: 8px 0; }
          .clinic-details { font-size: 12px; color: #666; line-height: 1.5; }
          .receipt-title { text-align: center; font-size: 18px; font-weight: bold; margin: 25px 0; color: #333; text-decoration: underline; }
          .receipt-content { margin: 20px 0; line-height: 2; }
          .receipt-row { display: flex; margin: 8px 0; }
          .receipt-label { width: 150px; font-weight: bold; }
          .receipt-value { flex: 1; border-bottom: 1px dotted #999; padding-left: 10px; }
          .amount-box { border: 2px solid #333; padding: 15px; margin: 20px 0; text-align: center; background: #f9f9f9; }
          .amount-number { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .amount-words { font-style: italic; color: #333; }
          .signature { display: flex; justify-content: space-between; margin-top: 50px; }
          .signature div { text-align: center; width: 45%; }
          .signature-line { border-bottom: 2px solid #333; margin-bottom: 8px; height: 60px; }
          .date-location { text-align: right; margin: 20px 0; }
          .payment-info { background: #fff3cd; border: 2px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .notes { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <img src="${logoSrc}" alt="Logo Klinik" style="height: 70px; object-fit: contain;">
            <div class="clinic-info">
              <div class="clinic-name">${clinicName}</div>
              <div class="clinic-details">
                Jl Raihan, Villa Rizki Ilhami 2 Ruko RA/19<br>
                Sawangan Lama, Kec. Sawangan. Depok. Jawa Barat<br>
                Telp/WA: 085283228355
              </div>
            </div>
          </div>
        </div>

        <div class="receipt-title">KWITANSI PEMBAYARAN</div>

        <div class="date-location">
          Depok, ${new Date(transactionDate).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>

        <div class="receipt-content">
          <div class="receipt-row">
            <div class="receipt-label">Telah terima dari</div>
            <div class="receipt-value">${treatment.patientName}</div>
          </div>
          
          <div class="receipt-row">
            <div class="receipt-label">Uang sebesar</div>
            <div class="receipt-value">Rp ${finalAmount.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="receipt-row">
            <div class="receipt-label">Terbilang</div>
            <div class="receipt-value">${finalAmountInWords}</div>
          </div>
          
          <div class="receipt-row">
            <div class="receipt-label">Untuk pembayaran</div>
            <div class="receipt-value">Tindakan medis oleh ${treatment.doctorName}</div>
          </div>
          
          <div class="receipt-row">
            <div class="receipt-label">Tanggal tindakan</div>
            <div class="receipt-value">${new Date(treatment.date).toLocaleDateString('id-ID')}</div>
          </div>

          <div class="receipt-row">
            <div class="receipt-label">No. Kwitansi</div>
            <div class="receipt-value">KWT-${treatment.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        ${treatment.paymentMethod || treatment.paymentStatus ? `
          <div class="payment-info">
            <h4 style="margin: 0 0 10px 0; color: #856404;">INFORMASI PEMBAYARAN</h4>
            ${treatment.paymentMethod ? `<p><strong>Metode:</strong> ${treatment.paymentMethod}</p>` : ''}
            ${treatment.paymentStatus ? `<p><strong>Status:</strong> ${treatment.paymentStatus === 'dp' ? 'DP (Down Payment)' : 'Lunas'}</p>` : ''}
            ${treatment.paymentStatus === 'dp' && treatment.dpAmount ? `<p><strong>Jumlah DP:</strong> Rp ${treatment.dpAmount.toLocaleString('id-ID')}</p>` : ''}
            ${treatment.outstandingAmount && treatment.outstandingAmount > 0 ? `<p style="color: #dc3545;"><strong>Outstanding:</strong> Rp ${treatment.outstandingAmount.toLocaleString('id-ID')}</p>` : ''}
          </div>
        ` : ''}

        <div class="amount-box">
          <div class="amount-number">Rp ${finalAmount.toLocaleString('id-ID')}</div>
          <div class="amount-words">(${finalAmountInWords})</div>
        </div>

        ${treatment.paymentNotes ? `
          <div class="notes">
            <h4 style="margin: 0 0 10px 0;">CATATAN PEMBAYARAN:</h4>
            <p style="margin: 0;">${treatment.paymentNotes}</p>
          </div>
        ` : ''}

        <div class="signature">
          <div>
            <div class="signature-line"></div>
            <strong>Yang Membayar</strong><br>
            ${treatment.patientName}
          </div>
          <div>
            <div class="signature-line"></div>
            <strong>Yang Menerima</strong><br>
            ${cashierName}<br>
            <small>${clinicName}</small>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666;">
          <p>Kwitansi ini adalah bukti sah pembayaran</p>
          <p style="font-style: italic;">Terima kasih atas kepercayaan Anda kepada ${clinicName}</p>
        </div>
      </body>
      </html>
    `

    receiptWindow.document.write(htmlContent)
    receiptWindow.document.close()
    
    setTimeout(() => {
      receiptWindow.print()
      receiptWindow.close()
    }, 1000)
  }

  const { totalTindakan: calculatedTotalTindakan, outstandingAmount } = calculateAmounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <FileCheck className="h-6 w-6" />
              Manajemen Tindakan & Fee Dokter
            </CardTitle>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tindakan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Treatments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead className="w-24">Tanggal</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead className="w-32">Tindakan</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-24">Fee</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : treatments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Belum ada data tindakan
                    </TableCell>
                  </TableRow>
                ) : (
                  treatments.map((treatment, index) => (
                    <TableRow key={treatment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(treatment.date).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{treatment.patientName}</div>
                          <div className="text-sm text-gray-500">{treatment.patientPhone || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{treatment.doctorName}</div>
                          <div className="text-sm text-gray-500">{treatment.shift}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {treatment.treatmentTypes.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="mb-1">
                              {item.name}
                            </div>
                          ))}
                          {treatment.treatmentTypes.length > 2 && (
                            <div className="text-gray-400">
                              +{treatment.treatmentTypes.length - 2} lainnya
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>Rp {treatment.totalTindakan.toLocaleString('id-ID')}</div>
                          {treatment.paymentStatus === 'dp' && treatment.outstandingAmount && treatment.outstandingAmount > 0 && (
                            <div className="text-xs text-orange-600 mt-1 font-medium">
                              Outstanding: Rp {treatment.outstandingAmount.toLocaleString('id-ID')}
                            </div>
                          )}
                          {treatment.paymentMethod && (
                            <div className="text-xs text-blue-600 mt-1">
                              {treatment.paymentMethod} • {treatment.paymentStatus === 'dp' ? 'DP' : 'Lunas'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>Rp {treatment.calculatedFee.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-gray-500">
                            {treatment.feePercentage}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {treatment.paymentStatus && (
                            <Badge variant={treatment.paymentStatus === 'dp' ? 'secondary' : 'default'} className="text-xs">
                              {treatment.paymentStatus === 'dp' ? 'DP' : 'Lunas'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(treatment)}
                            title="Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoice(treatment)}
                            title="Invoice"
                            className="h-8 w-8 p-0"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateReceipt(treatment)}
                            title="Kwitansi"
                            className="h-8 w-8 p-0"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(treatment.id)}
                            title="Hapus"
                            className="h-8 w-8 p-0"
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

      {/* Treatment Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'Edit Data Tindakan' : 'Tambah Data Tindakan'}
            </DialogTitle>
            <DialogDescription>
              {editingTreatment ? 'Perbarui informasi tindakan medis' : 'Tambahkan data tindakan medis baru'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor & Patient Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Pilih Dokter & Pasien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dokter *</Label>
                    <Select value={formData.doctorId} onValueChange={(value) => setFormData({...formData, doctorId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter..." />
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

                  <div>
                    <Label>Pasien *</Label>
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={patientSearchOpen}
                          className="w-full justify-between"
                        >
                          {patientSearchValue || "Pilih pasien..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Cari pasien..." />
                          <CommandEmpty>Tidak ada pasien ditemukan.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={`${patient.name} ${patient.phone}`}
                                onSelect={() => {
                                  setFormData({...formData, patientId: patient.id})
                                  setPatientSearchValue(patient.name)
                                  setPatientSearchOpen(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.patientId === patient.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div>
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-sm text-gray-500">{patient.phone}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shift *</Label>
                    <Select value={formData.shift} onValueChange={(value) => setFormData({...formData, shift: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih shift..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tanggal Tindakan *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800">Pilih Jenis Tindakan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={treatmentSearchOpen}
                      className="w-full justify-between"
                    >
                      Tambah tindakan...
                      <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari tindakan..." />
                      <CommandEmpty>Tidak ada tindakan ditemukan.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {treatmentProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.name} ${product.category}`}
                            onSelect={() => addTreatment(product)}
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.category} - Rp {product.price.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {formData.selectedTreatments.length > 0 && (
                  <div className="space-y-3">
                    {formData.selectedTreatments.map((treatment, index) => (
                      <div key={index} className="p-4 border border-pink-200 rounded-lg bg-pink-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{treatment.name}</h4>
                            <p className="text-sm text-gray-600">
                              Harga: Rp {treatment.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeTreatment(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Jenis Diskon</Label>
                            <Select 
                              value={treatment.discountType} 
                              onValueChange={(value: 'percentage' | 'nominal') => {
                                updateTreatmentDiscount(index, treatment.discount, value)
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Persentase (%)</SelectItem>
                                <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">
                              Diskon {treatment.discountType === 'percentage' ? '(%)' : '(Rp)'}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={treatment.discountType === 'percentage' ? 100 : treatment.price}
                              value={treatment.discount}
                              onChange={(e) => updateTreatmentDiscount(index, parseFloat(e.target.value) || 0, treatment.discountType)}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Potongan</Label>
                            <Input
                              value={`Rp ${treatment.discountAmount.toLocaleString('id-ID')}`}
                              readOnly
                              className="h-8 text-xs bg-gray-100"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Final</Label>
                            <Input
                              value={`Rp ${treatment.finalPrice.toLocaleString('id-ID')}`}
                              readOnly
                              className="h-8 text-xs bg-green-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Pilih Obat-obatan (Opsional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={medicationSearchOpen} onOpenChange={setMedicationSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={medicationSearchOpen}
                      className="w-full justify-between"
                    >
                      Tambah obat...
                      <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari obat..." />
                      <CommandEmpty>Tidak ada obat ditemukan.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {medicationProducts
                          .filter(product => !formData.selectedMedications.find(med => med.id === product.id))
                          .map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.name}`}
                            onSelect={() => addMedication(product)}
                          >
                            <div className="flex justify-between items-center w-full">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">
                                  Rp {product.price.toLocaleString('id-ID')}
                                </div>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                Stok: {product.stock}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {formData.selectedMedications.length > 0 && (
                  <div className="space-y-2">
                    {formData.selectedMedications.map((medication, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{medication.name}</div>
                          <div className="text-sm text-gray-500">Rp {medication.price.toLocaleString('id-ID')}/unit</div>
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Jumlah</Label>
                          <Input
                            type="number"
                            min="1"
                            value={medication.quantity}
                            onChange={(e) => updateMedicationQuantity(index, parseInt(e.target.value) || 1)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Total</Label>
                          <Input
                            value={`Rp ${medication.totalPrice.toLocaleString('id-ID')}`}
                            readOnly
                            className="h-8 text-xs bg-gray-100"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeMedication(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Metode Pembayaran</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status Pembayaran</Label>
                    <Select value={formData.paymentStatus} onValueChange={(value: 'lunas' | 'dp') => setFormData({...formData, paymentStatus: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fee Dokter (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.feePercentage}
                      onChange={(e) => setFormData({...formData, feePercentage: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* DP Section */}
                {formData.paymentStatus === 'dp' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <Label>Jumlah DP *</Label>
                      <Input
                        type="number"
                        min="0"
                        max={calculatedTotalTindakan - 1}
                        value={formData.dpAmount}
                        onChange={(e) => setFormData({...formData, dpAmount: parseInt(e.target.value) || 0})}
                        placeholder="Masukkan jumlah DP"
                        required
                      />
                    </div>
                    <div>
                      <Label>Outstanding Amount</Label>
                      <Input
                        value={`Rp ${outstandingAmount.toLocaleString('id-ID')}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Catatan Pembayaran</Label>
                  <Textarea
                    value={formData.paymentNotes}
                    onChange={(e) => setFormData({...formData, paymentNotes: e.target.value})}
                    placeholder="Catatan pembayaran..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fee Calculation & Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Ringkasan & Fee Dokter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Biaya Admin Override (Kosongkan untuk default)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.adminFeeOverride}
                      onChange={(e) => setFormData({...formData, adminFeeOverride: e.target.value})}
                      placeholder={`Default: Rp ${adminFee.toLocaleString('id-ID')}`}
                    />
                  </div>
                  <div>
                    <Label>Deskripsi Tindakan</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Deskripsi singkat tindakan..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal Tindakan:</span>
                      <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Diskon:</span>
                      <span className="text-red-600">-Rp {totalDiscount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setelah Diskon:</span>
                      <span>Rp {totalNominal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Obat:</span>
                      <span>Rp {(parseFloat(formData.medicationCost) || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Admin:</span>
                      <span>Rp {(parseFloat(formData.adminFeeOverride) || adminFee).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Keseluruhan:</span>
                      <span className="text-green-600">Rp {calculatedTotalTindakan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Fee Dokter ({formData.feePercentage || 0}%):
                        {formData.paymentStatus === 'dp' && (
                          <span className="text-xs text-gray-500 block">
                            *Dari outstanding tindakan
                          </span>
                        )}
                      </span>
                      <span className="text-blue-600">Rp {calculatedFee.toLocaleString('id-ID')}</span>
                    </div>
                    {formData.paymentStatus === 'dp' && (
                      <>
                        <div className="flex justify-between">
                          <span>Jumlah DP:</span>
                          <span className="text-orange-600">Rp {formData.dpAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Outstanding:</span>
                          <span className="text-red-600">Rp {outstandingAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                          <div className="text-xs text-blue-700">
                            <strong>Perhitungan Fee DP:</strong><br />
                            Fee = (Subtotal Tindakan - DP) × {formData.feePercentage || 0}%<br />
                            Fee = (Rp {totalNominal.toLocaleString('id-ID')} - Rp {formData.dpAmount.toLocaleString('id-ID')}) × {formData.feePercentage || 0}%<br />
                            Fee = Rp {Math.max(0, totalNominal - formData.dpAmount).toLocaleString('id-ID')} × {formData.feePercentage || 0}% = <strong>Rp {calculatedFee.toLocaleString('id-ID')}</strong>
                          </div>
                          <div className="text-xs text-blue-600 mt-2 italic">
                            Contoh: Subtotal Rp 250.000, DP Rp 150.000, Fee 40% → (250.000 - 150.000) × 40% = Rp 40.000
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {loading ? 'Menyimpan...' : editingTreatment ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cashier Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kasir untuk {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}</DialogTitle>
            <DialogDescription>
              Pilih kasir yang melayani transaksi ini untuk keperluan cetak dokumen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasir..." />
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
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCashierDialogOpen(false)}
            >
              Batal
            </Button>
            <Button 
              onClick={handlePrintWithCashier}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak {printType === 'invoice' ? 'Invoice' : 'Kwitansi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}