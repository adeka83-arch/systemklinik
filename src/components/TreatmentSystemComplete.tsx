import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Calculator, Percent, Check, X, ChevronsUpDown, Edit, Trash2, Printer, Pill, FileText, Search } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { TreatmentMultiFeeSection } from './TreatmentMultiFeeSection'
import { TreatmentsFeeManagement } from './TreatmentsFeeManagement'
import { SmartFeeIndicator } from './SmartFeeIndicator'
import { generateInvoiceWithCashierSignature, generateReceiptWithCashierSignature } from './TreatmentPrintTemplatesWithVoucher'
import { cleanDoctorNames } from '../utils/doctorNameCleaner'
import { StockDebugComponent } from './StockDebugComponent'
import { VoucherSelector } from './VoucherSelector'
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

interface TreatmentSystemCompleteProps {
  accessToken: string
  refreshTrigger?: number
  adminFee?: number
  clinicSettings?: {
    name: string
    logo: string | null
    logoPath?: string
    adminFee?: number
  }
  onRefreshNeeded?: () => void
}

const shiftOptions = [
  { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

const paymentMethods = ['Cash', 'Debit', 'QRIS', 'Credit Card']

export function TreatmentSystemComplete({ 
  accessToken, 
  refreshTrigger, 
  adminFee: propAdminFee, 
  clinicSettings,
  onRefreshNeeded
}: TreatmentSystemCompleteProps) {
  const [activeTab, setActiveTab] = useState('treatments')
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [treatmentProducts, setTreatmentProducts] = useState<TreatmentProduct[]>([])
  const [medicationProducts, setMedicationProducts] = useState<MedicationProduct[]>([])
  const [feeSettings, setFeeSettings] = useState<FeeSettings[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)

  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    selectedTreatments: [] as TreatmentItem[],
    selectedMedications: [] as SelectedMedication[],
    description: '',
    feePercentage: '',
    adminFeeOverride: '',
    shift: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    paymentStatus: 'lunas' as 'lunas' | 'dp',
    dpAmount: 0,
    paymentNotes: '',
    voucherData: null as {
      voucherId: string
      voucherCode: string
      discountAmount: number
      finalAmount: number
    } | null
  })

  const [adminFee, setAdminFee] = useState(propAdminFee || 20000)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [totalNominal, setTotalNominal] = useState(0)
  const [totalTindakan, setTotalTindakan] = useState(0)
  const [isMultiFeeMode, setIsMultiFeeMode] = useState(false)
  const [feeMatchDetails, setFeeMatchDetails] = useState<any>(null)

  // Calculate current admin fee based on override or default
  const currentAdminFee = formData.adminFeeOverride ? parseFloat(formData.adminFeeOverride) : adminFee

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
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    console.log('TreatmentSystemComplete: Initial data fetch')
    fetchTreatments()
    fetchDoctors()
    fetchPatients()
    fetchEmployees()
    fetchTreatmentProducts()
    fetchMedicationProducts()
    fetchFeeSettings()
  }, [])

  // Force refresh patients if they're empty and we have access token
  useEffect(() => {
    if (accessToken && patients.length === 0) {
      console.log('No patients loaded, refetching...')
      fetchPatients()
    }
  }, [accessToken, patients.length])

  useEffect(() => {
    if (typeof propAdminFee === 'number') {
      setAdminFee(propAdminFee)
    }
  }, [propAdminFee])

  useEffect(() => {
    if (refreshTrigger) {
      fetchTreatments()
      fetchFeeSettings() // Refresh fee settings when other data changes
    }
  }, [refreshTrigger])

  // Calculate totals
  useEffect(() => {
    const calculatedSubtotal = formData.selectedTreatments.reduce((sum, item) => sum + (item.subtotalPrice || item.price * (item.quantity || 1)), 0)
    const calculatedTotalDiscount = formData.selectedTreatments.reduce((sum, item) => sum + item.discountAmount, 0)
    const calculatedTotal = formData.selectedTreatments.reduce((sum, item) => sum + item.finalPrice, 0)
    
    console.log('📊 Calculating subtotals with quantity:', {
      calculatedSubtotal,
      calculatedTotalDiscount,
      calculatedTotal,
      selectedTreatments: formData.selectedTreatments.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        subtotalPrice: item.subtotalPrice || item.price * (item.quantity || 1),
        discount: item.discount,
        discountAmount: item.discountAmount,
        finalPrice: item.finalPrice
      }))
    })
    
    setSubtotal(calculatedSubtotal)
    setTotalDiscount(calculatedTotalDiscount)
    setTotalNominal(calculatedTotal)
  }, [formData.selectedTreatments])

  useEffect(() => {
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const medicationCost = formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0)
    let calculatedTotalTindakan = totalNominal + currentAdminFee + medicationCost
    
    // Apply voucher discount if available
    if (formData.voucherData && formData.voucherData.finalAmount) {
      calculatedTotalTindakan = formData.voucherData.finalAmount
    }
    
    console.log('💰 Total Tindakan calculation (with voucher):', {
      totalNominal,
      currentAdminFee,
      medicationCost,
      beforeVoucher: totalNominal + currentAdminFee + medicationCost,
      voucherDiscount: formData.voucherData?.discountAmount || 0,
      calculatedTotalTindakan,
      subtotal,
      totalDiscount,
      voucherApplied: !!formData.voucherData
    })
    
    setTotalTindakan(calculatedTotalTindakan)
  }, [totalNominal, formData.adminFeeOverride, formData.selectedMedications, formData.voucherData, adminFee])

  // Auto-calculate fee when doctor or treatments change
  useEffect(() => {
    // Only calculate fee when all required values are available
    if (formData.doctorId && 
        formData.selectedTreatments.length > 0 && 
        feeSettings.length > 0 && 
        !isMultiFeeMode &&
        subtotal > 0 &&  // Ensure subtotal is calculated
        totalTindakan > 0) {  // Ensure total is calculated
      
      console.log('🔍 Auto-calculating fee with values:', {
        totalNominal,
        totalTindakan,
        subtotal,
        totalDiscount,
        adminFee: parseFloat(formData.adminFeeOverride) || adminFee,
        medicationCost: formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0)
      })
      
      const feeResult = calculateFeeFromSettings(formData.doctorId, formData.selectedTreatments)
      
      if (feeResult.matchDetails) {
        setFormData(prev => ({
          ...prev,
          feePercentage: feeResult.feePercentage
        }))
        setCalculatedFee(feeResult.calculatedFee)
        setFeeMatchDetails(feeResult.matchDetails)
        
        // Show notification about automatic fee calculation
        if (feeResult.matchDetails.score >= 80) {
          toast.success(`Fee otomatis: ${feeResult.feePercentage}% (${feeResult.matchDetails.matchType})`)
        } else {
          toast.info(`Fee otomatis: ${feeResult.feePercentage}% (${feeResult.matchDetails.matchType})`)
        }
      } else {
        // No matching rule found, clear auto-calculated fee
        setFeeMatchDetails(null)
      }
    }
  }, [formData.doctorId, formData.selectedTreatments, feeSettings, totalTindakan, subtotal, totalNominal, isMultiFeeMode])

  // Calculate fee when user changes fee percentage manually
  useEffect(() => {
    if (!isMultiFeeMode && formData.feePercentage && totalTindakan > 0 && subtotal > 0) {
      const feePercentage = parseFloat(formData.feePercentage)
      if (!isNaN(feePercentage) && feePercentage > 0) {
        const calculatedFee = (totalTindakan * feePercentage) / 100
        console.log('🔢 Manual fee calculation:', {
          totalTindakan,
          feePercentage,
          calculatedFee,
          breakdown: {
            totalNominal,
            adminFee: parseFloat(formData.adminFeeOverride) || adminFee,
            medicationCost: formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0)
          }
        })
        setCalculatedFee(calculatedFee)
      }
    }
  }, [formData.feePercentage, totalTindakan, subtotal, totalNominal, isMultiFeeMode])

  // Force fee recalculation when totalNominal changes significantly
  useEffect(() => {
    if (!isMultiFeeMode && formData.feePercentage && totalNominal > 0 && totalTindakan > totalNominal) {
      const feePercentage = parseFloat(formData.feePercentage)
      if (!isNaN(feePercentage) && feePercentage > 0) {
        const recalculatedFee = (totalTindakan * feePercentage) / 100
        console.log('🔄 Force recalculating fee due to totalNominal change:', {
          totalNominal,
          totalTindakan,
          feePercentage,
          recalculatedFee
        })
        setCalculatedFee(recalculatedFee)
      }
    }
  }, [totalNominal, totalTindakan, formData.feePercentage, isMultiFeeMode])

  const fetchTreatments = async () => {
    try {
      console.log('Fetching treatments from server...')
      const response = await fetch(`${serverUrl}/treatments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Treatment data received:', data)
      
      if (data.treatments) {
        // Sort treatments by date and createdAt in descending order (newest first)
        const sortedTreatments = data.treatments.sort((a: Treatment, b: Treatment) => {
          // First sort by date (main criteria)
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime() // Descending order (newest first)
          }
          
          // If dates are the same, sort by createdAt (secondary criteria)
          const createdA = new Date(a.createdAt)
          const createdB = new Date(b.createdAt)
          return createdB.getTime() - createdA.getTime() // Descending order (newest first)
        })
        
        setTreatments(sortedTreatments)
        console.log('Treatments loaded successfully:', sortedTreatments.length, 'records')
      } else {
        console.log('No treatments found in response')
        setTreatments([])
      }
    } catch (error) {
      console.error('Error fetching treatment data:', error)
      toast.error(`Error fetching treatment data: ${error.message}`)
      setTreatments([]) // Set empty array on error
    }
  }

  const fetchDoctors = async () => {
    try {
      // Menggunakan endpoint khusus untuk dokter aktif saja
      const response = await fetch(`${serverUrl}/doctors/active`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        console.log('✅ Loaded active doctors only:', data.doctors?.length || 0, 'records')
        setDoctors(cleanDoctorNames(data.doctors || []))
      }
    } catch (error) {
      console.log('Error fetching active doctors:', error)
      // Fallback ke endpoint biasa jika endpoint aktif belum tersedia
      try {
        const fallbackResponse = await fetch(`${serverUrl}/doctors?active=true`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const fallbackData = await fallbackResponse.json()
        if (fallbackResponse.ok) {
          console.log('✅ Loaded active doctors via fallback:', fallbackData.doctors?.length || 0, 'records')
          setDoctors(cleanDoctorNames(fallbackData.doctors || []))
        }
      } catch (fallbackError) {
        console.log('Error with fallback doctors endpoint:', fallbackError)
      }
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients for treatment system...')
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      console.log('Patients fetch response:', response.ok, data)
      if (response.ok) {
        const patientsData = data.patients || []
        console.log('Total patients fetched:', patientsData.length)
        setPatients(patientsData)
      } else {
        console.log('Failed to fetch patients:', data)
        toast.error('Gagal mengambil data pasien')
      }
    } catch (error) {
      console.log('Error fetching patients:', error)
      toast.error('Gagal mengambil data pasien')
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
      console.log('Fetching treatment products from server...')
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Treatment products data received:', data)
      
      if (data.products) {
        const filteredProducts = data.products.filter((product: TreatmentProduct) => 
          ['Tindakan', 'Laboratorium', 'Konsultasi'].includes(product.category)
        )
        setTreatmentProducts(filteredProducts)
        console.log('Treatment products loaded:', filteredProducts.length, 'records')
      } else {
        console.log('No products found in response')
        setTreatmentProducts([])
      }
    } catch (error) {
      console.error('Error fetching treatment products:', error)
      toast.error(`Error fetching treatment products: ${error.message}`)
      setTreatmentProducts([])
    }
  }

  const fetchMedicationProducts = async () => {
    try {
      console.log('Fetching medication products from server...')
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Medication products data received:', data)
      
      if (data.products) {
        const filteredProducts = data.products.filter((product: MedicationProduct) => 
          product.category === 'Obat'
        )
        setMedicationProducts(filteredProducts)
        console.log('Medication products loaded:', filteredProducts.length, 'records')
      } else {
        console.log('No products found in response')
        setMedicationProducts([])
      }
    } catch (error) {
      console.error('Error fetching medication products:', error)
      toast.error(`Error fetching medication products: ${error.message}`)
      setMedicationProducts([])
    }
  }

  const fetchFeeSettings = async () => {
    try {
      console.log('Fetching fee settings from server...')
      const response = await fetch(`${serverUrl}/fee-settings`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fee settings data received:', data)
      
      if (data.feeSettings) {
        setFeeSettings(data.feeSettings)
        console.log('Fee settings loaded:', data.feeSettings.length, 'records')
      } else {
        console.log('No fee settings found in response')
        setFeeSettings([])
      }
    } catch (error) {
      console.error('Error fetching fee settings:', error)
      toast.error(`Error fetching fee settings: ${error.message}`)
      setFeeSettings([])
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

  const updateTreatmentQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return

    setFormData(prev => {
      const updatedTreatments = [...prev.selectedTreatments]
      const treatment = updatedTreatments[index]
      
      const subtotalPrice = treatment.price * quantity
      const discountAmount = (subtotalPrice * treatment.discount) / 100
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

  const updateTreatmentDiscount = (index: number, discount: number) => {
    setFormData(prev => {
      const updatedTreatments = [...prev.selectedTreatments]
      const treatment = updatedTreatments[index]
      
      const subtotalPrice = treatment.price * treatment.quantity
      const discountAmount = (subtotalPrice * discount) / 100
      const finalPrice = subtotalPrice - discountAmount
      
      updatedTreatments[index] = {
        ...treatment,
        discount,
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
    if (formData.selectedMedications.some(med => med.id === product.id)) {
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

  // Function to reset all manual discounts
  const resetAllManualDiscounts = () => {
    setFormData(prev => ({
      ...prev,
      selectedTreatments: prev.selectedTreatments.map(treatment => ({
        ...treatment,
        discount: 0,
        discountAmount: 0,
        finalPrice: treatment.price
      }))
    }))
    toast.success('Semua diskon manual telah direset')
  }

  // Smart Fee Matching Algorithm
  const calculateFeeFromSettings = (doctorId: string, selectedTreatments: TreatmentItem[]) => {
    if (!doctorId || selectedTreatments.length === 0 || feeSettings.length === 0) {
      return { feePercentage: '', calculatedFee: 0, matchDetails: null }
    }

    const selectedDoctor = doctors.find(doc => doc.id === doctorId)
    if (!selectedDoctor) return { feePercentage: '', calculatedFee: 0, matchDetails: null }

    // Matching Score System:
    // 100 - Exact doctor + exact treatment match
    // 80 - Exact doctor + category match  
    // 60 - Category match only
    // 40 - Default rule
    
    let bestMatch = null
    let bestScore = 0
    
    for (const setting of feeSettings) {
      let score = 0
      let matchType = ''
      
      // Check doctor match
      const doctorMatch = setting.doctorIds?.includes(doctorId) || 
                         setting.doctorNames?.includes(selectedDoctor.name)
      
      if (doctorMatch) {
        // Check for exact treatment match
        const hasExactTreatmentMatch = selectedTreatments.some(treatment => 
          setting.treatmentTypes?.includes(treatment.name)
        )
        
        if (hasExactTreatmentMatch) {
          score = 100
          matchType = `Dokter ${selectedDoctor.name} + Tindakan Spesifik`
        } else {
          // Check for category match
          const treatmentCategories = selectedTreatments.map(t => {
            const product = treatmentProducts.find(p => p.id === t.id)
            return product?.category
          }).filter(Boolean)
          
          const hasCategoryMatch = treatmentCategories.some(category => 
            category === setting.category
          )
          
          if (hasCategoryMatch) {
            score = 80
            matchType = `Dokter ${selectedDoctor.name} + Kategori ${setting.category}`
          } else {
            score = 75
            matchType = `Dokter ${selectedDoctor.name} - Umum`
          }
        }
      } else {
        // Check category-only match
        const treatmentCategories = selectedTreatments.map(t => {
          const product = treatmentProducts.find(p => p.id === t.id)
          return product?.category
        }).filter(Boolean)
        
        const hasCategoryMatch = treatmentCategories.some(category => 
          category === setting.category
        )
        
        if (hasCategoryMatch) {
          score = 60
          matchType = `Kategori ${setting.category} - Semua Dokter`
        } else if (setting.isDefault) {
          score = 40
          matchType = 'Aturan Default'
        }
      }
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = {
          ...setting,
          score,
          matchType
        }
      }
    }
    
    if (bestMatch) {
      // Use the already calculated totalTindakan from state instead of recalculating
      // This ensures consistency with the displayed total
      const calculatedFee = (totalTindakan * bestMatch.feePercentage) / 100
      
      console.log('🔢 Fee calculation debug:', {
        totalTindakan: totalTindakan,
        feePercentage: bestMatch.feePercentage,
        calculatedFee: calculatedFee,
        matchType: bestMatch.matchType
      })
      
      return {
        feePercentage: bestMatch.feePercentage.toString(),
        calculatedFee: calculatedFee,
        matchDetails: bestMatch
      }
    }
    
    return { feePercentage: '', calculatedFee: 0, matchDetails: null }
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

  // Handle voucher application
  const handleVoucherApplied = (voucherData: {
    voucherId: string
    voucherCode: string
    discountAmount: number
    finalAmount: number
  } | null) => {
    console.log('🎫 Voucher applied:', voucherData)
    setFormData(prev => ({ ...prev, voucherData }))
  }

  // Handle voucher refresh needed (when voucher status needs to be updated globally)
  const handleVoucherRefreshNeeded = () => {
    console.log('🔄 Voucher refresh requested - will trigger on treatment save')
    // Trigger refresh in PromoManager component by calling the onRefreshNeeded prop
    if (onRefreshNeeded) {
      console.log('🔄 Calling parent refresh mechanism')
      onRefreshNeeded()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === formData.doctorId)
      const selectedPatient = patients.find(p => p.id === formData.patientId)
      
      if (!selectedDoctor || !selectedPatient || formData.selectedTreatments.length === 0) {
        toast.error('Lengkapi semua data yang diperlukan')
        setLoading(false)
        return
      }

      const medicationCost = formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0)
      const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
      const outstandingAmount = formData.paymentStatus === 'dp' ? totalTindakan - formData.dpAmount : 0

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
        medicationCost: medicationCost,
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
        paymentNotes: formData.paymentNotes,
        voucherData: formData.voucherData
      }

      console.log('🚀 Sending treatment data to server:', treatmentData)
      console.log('📋 Selected medications for stock reduction:', formData.selectedMedications)

      const url = editingTreatment ? `${serverUrl}/treatments/${editingTreatment.id}` : `${serverUrl}/treatments`
      const method = editingTreatment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(treatmentData)
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('🎉 Treatment saved successfully with response:', responseData)
        
        const baseSuccessMessage = editingTreatment ? 'Data tindakan berhasil diperbarui' : 'Data tindakan berhasil ditambahkan'
        
        // Enhanced success message with stock information
        if (responseData.stockUpdates && responseData.stockUpdates.length > 0) {
          const stockUpdateMessage = responseData.stockUpdates.map(update => 
            `${update.medicationName}: -${update.quantityUsed} (sisa: ${update.newStock})`
          ).join(', ')
          toast.success(`${baseSuccessMessage} • Stok diperbarui: ${stockUpdateMessage}`)
        } else if (formData.selectedMedications && formData.selectedMedications.length > 0) {
          toast.success(`${baseSuccessMessage} • Stok obat otomatis berkurang`)
        } else {
          toast.success(baseSuccessMessage)
        }
        
        // Record voucher usage if a voucher was applied
        if (formData.voucherData && !editingTreatment) {
          try {
            console.log('🎫 Recording voucher usage:', formData.voucherData)
            
            const voucherUsageResponse = await fetch(`${serverUrl}/vouchers/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({
                voucherId: formData.voucherData.voucherId,
                voucherCode: formData.voucherData.voucherCode,
                patientId: formData.patientId,
                patientName: selectedPatient.name,
                originalAmount: totalTindakan + (formData.voucherData.discountAmount || 0), // Original amount before discount
                discountAmount: formData.voucherData.discountAmount,
                finalAmount: formData.voucherData.finalAmount,
                transactionType: 'treatment',
                transactionId: responseData.treatment?.id || null
              })
            })

            if (voucherUsageResponse.ok) {
              console.log('✅ Voucher usage recorded successfully')
              toast.success('Voucher berhasil digunakan!', { duration: 2000 })
              
              // Trigger voucher refresh after successful usage recording
              handleVoucherRefreshNeeded()
            } else {
              console.log('❌ Failed to record voucher usage')
              toast.warning('Treatment saved but failed to record voucher usage')
            }
          } catch (voucherError) {
            console.error('Error recording voucher usage:', voucherError)
            toast.warning('Treatment saved but voucher usage recording failed')
          }
        }

        // Fetch fresh data
        await fetchTreatments()
        await fetchMedicationProducts()
        
        // If it's a new treatment (not editing), show print dialog
        if (!editingTreatment && responseData.treatment) {
          setSelectedTreatmentForCashier(responseData.treatment)
          setCashierDialogOpen(true)
          toast.info('Pilih kasir dan jenis dokumen untuk mencetak')
        }
        
        resetForm()
        setActiveTab('treatments')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menyimpan data tindakan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }

    setLoading(false)
  }

  const deleteTreatment = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data tindakan ini?')) return

    try {
      const response = await fetch(`${serverUrl}/treatments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        toast.success('Data tindakan berhasil dihapus • Stok obat dikembalikan')
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
    setFormData({
      doctorId: treatment.doctorId,
      patientId: treatment.patientId,
      selectedTreatments: treatment.treatmentTypes || [],
      selectedMedications: treatment.selectedMedications || [],
      description: treatment.description || '',
      feePercentage: treatment.feePercentage.toString(),
      adminFeeOverride: treatment.adminFeeOverride?.toString() || '',
      shift: treatment.shift,
      date: treatment.date,
      paymentMethod: treatment.paymentMethod || '',
      paymentStatus: treatment.paymentStatus || 'lunas',
      dpAmount: treatment.dpAmount || 0,
      paymentNotes: treatment.paymentNotes || '',
      voucherData: null // Reset voucher when editing
    })
    
    setCalculatedFee(treatment.calculatedFee)
    setActiveTab('add-treatment')
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
      shift: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      paymentStatus: 'lunas',
      dpAmount: 0,
      paymentNotes: '',
      voucherData: null
    })
    setCalculatedFee(0)
    setSubtotal(0)
    setTotalDiscount(0)
    setTotalNominal(0)
    setTotalTindakan(0)
    setIsMultiFeeMode(false)
    setFeeMatchDetails(null)
    setEditingTreatment(null)
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

    setIsPrinting(true)

    try {
      const treatmentForPrint = {
        ...selectedTreatmentForCashier,
        date: transactionDate
      }

      const clinicData = clinicSettings || { name: 'Falasifah Dental Clinic', logo: clinicLogo }

      if (printType === 'invoice') {
        await generateInvoiceWithCashierSignature(
          treatmentForPrint,
          selectedEmployee.name,
          transactionDate,
          clinicData
        )
        toast.success('✅ Invoice berhasil dicetak! Anda dapat mencetak kwitansi juga jika diperlukan.')
      } else if (printType === 'receipt') {
        await generateReceiptWithCashierSignature(
          treatmentForPrint,
          selectedEmployee.name,
          transactionDate,
          clinicData
        )
        toast.success('✅ Kwitansi berhasil dicetak! Anda dapat mencetak invoice juga jika diperlukan.')
      }

      // Don't close dialog - let user choose to print other document or close manually
      
    } catch (error) {
      console.error('Error printing:', error)
      toast.error('Gagal mencetak dokumen')
    } finally {
      setIsPrinting(false)
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Data Tindakan
          </TabsTrigger>
          <TabsTrigger value="add-treatment" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {editingTreatment ? 'Edit Tindakan' : 'Tambah Tindakan'}
          </TabsTrigger>
          <TabsTrigger value="fee-settings" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Pengaturan Fee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800">Data Tindakan dengan Multi Fee</CardTitle>
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
                          Belum ada data tindakan. Klik "Tambah Tindakan" untuk mulai.
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
                                  {t.name}
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
                            <div className="flex items-center gap-1">
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
                {/* Basic Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-pink-700">Dokter</Label>
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
                    <Label className="text-pink-700">Pasien</Label>
                    <Popover 
                      open={patientSearchOpen} 
                      onOpenChange={(open) => {
                        setPatientSearchOpen(open)
                        if (!open) {
                          setPatientSearchValue('') // Clear search when closing
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between border-pink-200"
                          onClick={() => {
                            console.log('Patient search opened, available patients:', patients.length)
                            setPatientSearchOpen(true)
                          }}
                        >
                          {formData.patientId
                            ? patients.find((patient) => patient.id === formData.patientId)?.name
                            : "Pilih pasien..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Cari pasien..." 
                            value={patientSearchValue}
                            onValueChange={(value) => {
                              console.log('Patient search value changed:', value)
                              setPatientSearchValue(value)
                            }}
                          />
                          <CommandEmpty>
                            <div className="p-4 text-center">
                              {patients.length === 0 ? (
                                <div>
                                  <p className="text-gray-500 mb-2">Belum ada data pasien.</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      console.log('Retry loading patients')
                                      fetchPatients()
                                    }}
                                    className="text-pink-600 border-pink-200"
                                  >
                                    Coba Muat Ulang
                                  </Button>
                                </div>
                              ) : (
                                "Tidak ada pasien ditemukan dengan kata kunci tersebut."
                              )}
                            </div>
                          </CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {(() => {
                              // Manual filtering since we disabled Command's built-in filtering
                              let filteredPatients = patients
                              
                              if (patientSearchValue.trim()) {
                                filteredPatients = patients.filter(patient => {
                                  if (!patient.name || !patient.phone) return false
                                  const searchTerm = patientSearchValue.toLowerCase().trim()
                                  const matchesName = patient.name.toLowerCase().includes(searchTerm)
                                  const matchesPhone = patient.phone.toLowerCase().includes(searchTerm)
                                  return matchesName || matchesPhone
                                })
                              }
                              
                              console.log('Filtered patients:', filteredPatients.length, 'from', patients.length, 'total', 'search:', patientSearchValue)
                              
                              return filteredPatients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={`${patient.name}-${patient.id}`} // Unique value for Command
                                  onSelect={() => {
                                    console.log('Patient selected:', patient.name, patient.id)
                                    setFormData(prev => ({ ...prev, patientId: patient.id }))
                                    setPatientSearchOpen(false)
                                    setPatientSearchValue('')
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
                              ))
                            })()}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Debug info with refresh button */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                      <span>{patients.length} pasien tersedia</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Manual refresh patients clicked')
                          fetchPatients()
                        }}
                        className="h-6 px-2 text-xs text-pink-600 hover:text-pink-800"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-pink-700">Shift</Label>
                    <Select 
                      value={formData.shift} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih shift..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-pink-700">Tanggal</Label>
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
                  <Label className="text-pink-700 mb-2 block">Tindakan</Label>
                  <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between border-pink-200">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Tambah Tindakan
                        </span>
                        <Search className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari tindakan..." />
                        <CommandEmpty>Tidak ada tindakan ditemukan.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {treatmentProducts
                            .filter(product => !formData.selectedTreatments.some(t => t.id === product.id))
                            .map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() => addTreatment(product)}
                              className="flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.category}</div>
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(product.price)}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Selected Treatments */}
                {formData.selectedTreatments.length > 0 && (
                  <div>
                    <Label className="text-pink-700 mb-2 block">Tindakan Terpilih</Label>
                    <div className="space-y-2">
                      {formData.selectedTreatments.map((treatment, index) => (
                        <div key={index} className="flex items-center justify-between bg-pink-50 p-3 rounded border border-pink-200">
                          <div>
                            <div className="font-medium">{treatment.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(treatment.price)} per unit
                              {treatment.quantity > 1 && (
                                <span> × {treatment.quantity} = {formatCurrency(treatment.subtotalPrice)}</span>
                              )}
                              {treatment.discountAmount > 0 && (
                                <span className="text-red-600"> - {formatCurrency(treatment.discountAmount)} = {formatCurrency(treatment.finalPrice)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium text-pink-700">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={treatment.quantity}
                                onChange={(e) => updateTreatmentQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center text-sm border-2 border-pink-400 bg-white font-bold"
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
                                onChange={(e) => updateTreatmentDiscount(index, parseFloat(e.target.value) || 0)}
                                 disabled={!!formData.voucherData}
                                 title={formData.voucherData ? "Tidak dapat memberikan diskon manual saat voucher aktif" : ""}
                                className="w-16 h-8 text-center text-sm border-2 border-pink-300"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTreatment(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medication Section */}
                <div>
                  <Label className="text-pink-700 mb-2 block">Obat (Opsional)</Label>
                  <Popover open={medicationSearchOpen} onOpenChange={setMedicationSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between border-pink-200">
                        <span className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Tambah Obat
                        </span>
                        <Search className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari obat..." />
                        <CommandEmpty>Tidak ada obat ditemukan.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {medicationProducts
                            .filter(product => !formData.selectedMedications.some(m => m.id === product.id))
                            .filter(product => product.stock > 0)
                            .map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() => addMedication(product)}
                              className="flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">Stok: {product.stock}</div>
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(product.price)}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Selected Medications */}
                {formData.selectedMedications.length > 0 && (
                  <div>
                    <Label className="text-pink-700 mb-2 block">Obat Terpilih</Label>
                    <div className="space-y-2">
                      {formData.selectedMedications.map((medication, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-200">
                          <div>
                            <div className="font-medium">{medication.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(medication.price)} per unit
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={medication.quantity}
                                onChange={(e) => updateMedicationQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-sm border-blue-200"
                              />
                            </div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(medication.totalPrice)}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voucher Selector - Only show when we have treatments selected */}
                {formData.selectedTreatments.length > 0 && (
                  <>
                    {/* Warning about discount rules */}
                    {(formData.selectedTreatments.some(t => t.discount > 0) || formData.voucherData) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-600 mt-0.5">⚠️</div>
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Aturan Diskon:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Tidak dapat menggunakan voucher dan diskon manual bersamaan</li>
                              <li>• Pilih salah satu: voucher ATAU diskon manual per tindakan</li>
                              <li>• Untuk mengubah, hapus voucher atau reset diskon manual terlebih dahulu
                               {formData.selectedTreatments.some(t => t.discount > 0) && (
                                 <div className="mt-2">
                                   <Button
                                     type="button"
                                     variant="outline"
                                     size="sm"
                                     onClick={resetAllManualDiscounts}
                                     className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400"
                                   >
                                     Reset Semua Diskon Manual
                                   </Button>
                                 </div>
                               )}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <VoucherSelector
                      accessToken={accessToken}
                      originalAmount={totalNominal + currentAdminFee + formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0)}
                      treatmentAmount={totalNominal}
                      adminFee={currentAdminFee}
                      patientId={formData.patientId}
                      onVoucherApplied={handleVoucherApplied}
                      onRefreshNeeded={handleVoucherRefreshNeeded}
                      className="mt-4"
                      hasManualDiscount={formData.selectedTreatments.some(t => t.discount > 0)}
                    />
                  </>
                )}

                {/* Payment and Admin Fee */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-pink-700">Biaya Admin Override (Opsional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.adminFeeOverride}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminFeeOverride: e.target.value }))}
                      className="border-pink-200"
                      placeholder={`Default: ${formatCurrency(adminFee)}`}
                    />
                  </div>

                  <div>
                    <Label className="text-pink-700">Metode Pembayaran</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih metode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-pink-700">Status Pembayaran</Label>
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
                </div>

                {/* DP Amount */}
                {formData.paymentStatus === 'dp' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-pink-700">Jumlah DP</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.dpAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, dpAmount: parseFloat(e.target.value) || 0 }))}
                        className="border-pink-200"
                        placeholder="Masukkan jumlah DP"
                      />
                    </div>
                    <div>
                      <Label className="text-pink-700">Catatan Pembayaran</Label>
                      <Input
                        value={formData.paymentNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                        className="border-pink-200"
                        placeholder="Catatan untuk pembayaran DP..."
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-pink-700">Keterangan</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border-pink-200"
                    placeholder="Keterangan tambahan..."
                  />
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
                    <Label className="text-pink-700">Fee Dokter Manual (%)</Label>
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-700">Subtotal Tindakan</Label>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700">Total Diskon</Label>
                      <div className="text-lg font-semibold text-red-600">
                        -{formatCurrency(totalDiscount)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700">Total Keseluruhan</Label>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(totalTindakan)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Admin: {formatCurrency(parseFloat(formData.adminFeeOverride) || adminFee)} |
                        Obat: {formatCurrency(formData.selectedMedications.reduce((sum, item) => sum + item.totalPrice, 0))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700">Fee Dokter</Label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(calculatedFee)}
                      </div>
                      {isMultiFeeMode && (
                        <div className="text-xs text-blue-600">Multi Fee Mode</div>
                      )}
                      {/* Debug info */}
                      <div className="text-xs text-gray-400">
                        {formData.feePercentage}% dari {formatCurrency(totalTindakan)}
                      </div>
                    </div>
                  </div>

                  {formData.paymentStatus === 'dp' && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700">Jumlah DP</Label>
                          <div className="text-lg font-semibold text-orange-600">
                            {formatCurrency(formData.dpAmount)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-700">Outstanding</Label>
                          <div className="text-lg font-semibold text-red-600">
                            {formatCurrency(Math.max(0, totalTindakan - formData.dpAmount))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setActiveTab('treatments')
                    }}
                    className="border-gray-300"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.doctorId || !formData.patientId || formData.selectedTreatments.length === 0}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {loading ? 'Menyimpan...' : (editingTreatment ? 'Update Tindakan' : 'Simpan Tindakan')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fee-settings" className="mt-6">
          <TreatmentsFeeManagement
            accessToken={accessToken}
            doctors={doctors}
            treatmentProducts={treatmentProducts}
            onFeeSettingsChange={() => {
              fetchFeeSettings()
              // Trigger recalculation if there's a treatment being edited
              if (editingTreatment && formData.doctorId && formData.selectedTreatments.length > 0) {
                // Re-trigger multi fee calculation
                setCalculatedFee(0)
              }
            }}
          />
        </TabsContent>

        <TabsContent value="stock-debug" className="mt-6">
          <StockDebugComponent accessToken={accessToken} />
        </TabsContent>
      </Tabs>

      {/* Print Dialog */}
      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-pink-800">Pilih Kasir dan Jenis Dokumen</DialogTitle>
            <DialogDescription>
              Pilih kasir yang bertugas dan jenis dokumen yang akan dicetak. Anda dapat mencetak beberapa dokumen dengan mengganti pilihan jenis dokumen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Kasir</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger className="border-pink-200">
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
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="border-pink-200"
              />
            </div>

            <div>
              <Label>Jenis Dokumen</Label>
              <Select value={printType} onValueChange={(value: 'invoice' | 'receipt') => setPrintType(value)}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="receipt">Kwitansi</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">💡 Tips:</div>
                  <div className="text-xs">
                    Dialog ini akan tetap terbuka setelah mencetak. Anda dapat mengganti jenis dokumen dan mencetak dokumen lainnya, atau klik "Batal" untuk menutup.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCashierDialogOpen(false)
                setSelectedCashier('')
                setPrintType('invoice')
              }}
            >
              Tutup
            </Button>
            <Button
              onClick={handlePrintWithCashier}
              disabled={!selectedCashier || isPrinting}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Mencetak...' : `Cetak ${printType === 'invoice' ? 'Invoice' : 'Kwitansi'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}