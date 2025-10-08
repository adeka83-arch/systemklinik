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
import { Plus, Edit, Trash2, Receipt, Calculator, Check, ChevronsUpDown, FileText, Printer, X } from 'lucide-react'
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

interface TreatmentProduct {
  id: string
  name: string
  price: number
}

interface Treatment {
  id: string
  doctorId: string
  doctorName: string
  patientId: string
  patientName: string
  patientPhone?: string
  treatmentTypes: Array<{
    id: string
    name: string
    price: number
  }>
  description: string
  totalNominal: number // Total nominal semua tindakan
  feePercentage: number // Persentase fee dokter
  adminFeeOverride?: number // Biaya admin custom untuk tindakan ini
  calculatedFee: number // Fee yang dihitung
  shift: string
  date: string
  createdAt: string
}

interface TreatmentsProps {
  accessToken: string
  refreshTrigger?: number // Optional prop to trigger data refresh
  adminFee?: number // Admin fee from clinic settings
}

const shiftOptions = [
  { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

export function Treatments({ accessToken, refreshTrigger, adminFee: propAdminFee }: TreatmentsProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [treatmentProducts, setTreatmentProducts] = useState<TreatmentProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    selectedTreatments: [] as string[],
    description: '',
    feePercentage: '',
    adminFeeOverride: '',
    shift: '',
    date: ''
  })
  const [adminFee, setAdminFee] = useState(propAdminFee || 0)
  const [calculatedFee, setCalculatedFee] = useState(0)
  const [totalNominal, setTotalNominal] = useState(0)
  
  // Patient selection state
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [patientSearchValue, setPatientSearchValue] = useState('')
  
  // Treatment selection state  
  const [treatmentSearchOpen, setTreatmentSearchOpen] = useState(false)
  
  // Print state
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [selectedTreatmentForPrint, setSelectedTreatmentForPrint] = useState<Treatment | null>(null)

  // Calculate doctor fees with sitting fee logic
  const [doctorFees, setDoctorFees] = useState<{ [key: string]: number }>({})
  const [sittingFees, setSittingFees] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    fetchTreatments()
    fetchDoctors()
    fetchPatients()
    fetchTreatmentProducts()
    fetchSittingFees()
  }, [])

  // Update adminFee when prop changes
  useEffect(() => {
    console.log('Treatments received adminFee prop:', propAdminFee)
    if (typeof propAdminFee === 'number') {
      console.log('Setting adminFee to:', propAdminFee)
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

  // Calculate total nominal from selected treatments
  useEffect(() => {
    const selectedTreatmentsArray = formData.selectedTreatments || []
    const treatmentProductsArray = treatmentProducts || []
    const total = selectedTreatmentsArray.reduce((sum, treatmentId) => {
      const treatment = treatmentProductsArray.find(t => t.id === treatmentId)
      return sum + (treatment?.price || 0)
    }, 0)
    setTotalNominal(total)
  }, [formData.selectedTreatments, treatmentProducts])

  // Calculate fee when nominal or percentage changes
  useEffect(() => {
    const percentage = parseFloat(formData.feePercentage) || 0
    // Use override admin fee if provided, otherwise use global admin fee
    const currentAdminFee = parseFloat(formData.adminFeeOverride) || adminFee
    const calculated = (totalNominal * percentage / 100) - currentAdminFee
    setCalculatedFee(Math.max(0, calculated)) // Fee tidak boleh negatif
  }, [totalNominal, formData.feePercentage, formData.adminFeeOverride, adminFee])

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

  const fetchTreatmentProducts = async () => {
    try {
      const response = await fetch(`${serverUrl}/products?category=Tindakan`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setTreatmentProducts(data.products || [])
      }
    } catch (error) {
      console.log('Error fetching treatment products:', error)
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
    
    // Group treatments by doctor, shift, and date
    treatmentsArray.forEach(treatment => {
      const key = `${treatment.doctorId}_${treatment.shift}_${treatment.date}`
      if (!feesByDoctorShiftDate[key]) {
        feesByDoctorShiftDate[key] = { treatments: [], totalFee: 0 }
      }
      feesByDoctorShiftDate[key].treatments.push(treatment)
      feesByDoctorShiftDate[key].totalFee += treatment.calculatedFee
    })

    // Calculate final fees based on sitting fee logic
    const finalFees: { [key: string]: number } = {}
    
    Object.keys(feesByDoctorShiftDate).forEach(key => {
      const { totalFee } = feesByDoctorShiftDate[key]
      const sittingFee = sittingFees[key] || 0
      
      if (totalFee > 0) {
        // If there are treatments, sitting fee is lost
        // But if treatment fee is less than sitting fee, doctor gets sitting fee amount
        finalFees[key] = Math.max(totalFee, sittingFee)
      } else {
        // No treatments, doctor gets sitting fee
        finalFees[key] = sittingFee
      }
    })

    setDoctorFees(finalFees)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = (doctors || []).find(doc => doc.id === formData.doctorId)
      const selectedPatient = (patients || []).find(p => p.id === formData.patientId)
      
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
      
      if ((formData.selectedTreatments || []).length === 0) {
        toast.error('Pilih minimal satu jenis tindakan')
        setLoading(false)
        return
      }

      const selectedTreatmentsArray = formData.selectedTreatments || []
      const treatmentProductsArray = treatmentProducts || []
      const selectedTreatmentData = selectedTreatmentsArray.map(id => {
        const treatment = treatmentProductsArray.find(t => t.id === id)
        return {
          id: treatment?.id || '',
          name: treatment?.name || '',
          price: treatment?.price || 0
        }
      })

      const treatmentData = {
        doctorId: formData.doctorId,
        doctorName: selectedDoctor.name,
        patientId: formData.patientId,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        treatmentTypes: selectedTreatmentData,
        description: formData.description,
        totalNominal: totalNominal,
        feePercentage: parseFloat(formData.feePercentage) || 0,
        adminFeeOverride: parseFloat(formData.adminFeeOverride) || null,
        calculatedFee: calculatedFee,
        shift: formData.shift,
        date: formData.date
      }

      if (editingTreatment) {
        // Update existing treatment
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
        // Create new treatment
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
    const treatmentTypes = treatment.treatmentTypes || []
    setFormData({
      doctorId: treatment.doctorId,
      patientId: treatment.patientId,
      selectedTreatments: treatmentTypes.map(t => t.id),
      description: treatment.description,
      feePercentage: treatment.feePercentage.toString(),
      adminFeeOverride: treatment.adminFeeOverride?.toString() || '',
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
      description: '',
      feePercentage: '',
      adminFeeOverride: '',
      shift: '',
      date: ''
    })
    setCalculatedFee(0)
    setTotalNominal(0)
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

  // Get unique doctor-shift-date combinations for fee summary
  const getDoctorFeeSummary = () => {
    const treatmentsArray = treatments || []
    const doctorsArray = doctors || []
    const summary: { [key: string]: { 
      doctor: string, 
      shift: string, 
      date: string, 
      treatmentFee: number, 
      sittingFee: number,
      finalFee: number,
      hasTreatments: boolean
    } } = {}

    treatmentsArray.forEach(treatment => {
      const key = `${treatment.doctorId}_${treatment.shift}_${treatment.date}`
      if (!summary[key]) {
        summary[key] = {
          doctor: treatment.doctorName,
          shift: treatment.shift,
          date: treatment.date,
          treatmentFee: 0,
          sittingFee: sittingFees[key] || 0,
          finalFee: doctorFees[key] || 0,
          hasTreatments: false
        }
      }
      summary[key].treatmentFee += treatment.calculatedFee
      summary[key].hasTreatments = true
    })

    // Add sitting fees for dates without treatments
    Object.keys(sittingFees).forEach(key => {
      if (!summary[key]) {
        const [doctorId, shift, date] = key.split('_')
        const doctor = doctorsArray.find(d => d.id === doctorId)
        if (doctor) {
          summary[key] = {
            doctor: doctor.name,
            shift,
            date,
            treatmentFee: 0,
            sittingFee: sittingFees[key],
            finalFee: sittingFees[key],
            hasTreatments: false
          }
        }
      }
    })

    return Object.values(summary)
  }

  const handlePrint = (treatment: Treatment) => {
    setSelectedTreatmentForPrint(treatment)
    setPrintDialogOpen(true)
  }

  const generateInvoice = (treatment: Treatment) => {
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
                    <th>Jenis Tindakan</th>
                    <th>Harga</th>
                </tr>
            </thead>
            <tbody>
                ${(treatment.treatmentTypes || []).map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${formatCurrency(item.price)}</td>
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
            <div class="total-row grand-total">
                <div class="total-label">TOTAL PEMBAYARAN:</div>
                <div class="total-amount">${formatCurrency(treatment.totalNominal || 0)}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Terima kasih atas kepercayaan Anda kepada Falasifah Dental Clinic</p>
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

  const generateReceipt = (treatment: Treatment) => {
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
        body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333; }
        .receipt-container { max-width: 400px; margin: 20px auto; padding: 20px; border: 2px solid #e91e63; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #e91e63; padding-bottom: 15px; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #e91e63; margin-bottom: 3px; }
        .clinic-info { font-size: 11px; color: #666; }
        .receipt-title { font-size: 16px; font-weight: bold; color: #e91e63; margin: 15px 0; text-align: center; }
        .receipt-info { margin-bottom: 15px; }
        .info-row { display: flex; margin-bottom: 5px; font-size: 13px; }
        .info-label { width: 100px; }
        .info-value { flex: 1; font-weight: bold; }
        .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
        .treatment-list { margin-bottom: 15px; }
        .treatment-item { margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 3px; }
        .treatment-name { font-weight: bold; font-size: 13px; }
        .treatment-price { text-align: right; color: #e91e63; font-weight: bold; }
        .total-section { text-align: center; margin-top: 15px; }
        .total-amount { font-size: 18px; font-weight: bold; color: #e91e63; border: 2px solid #e91e63; padding: 10px; border-radius: 5px; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e91e63; padding-top: 10px; }
        @media print {
            body { margin: 0; }
            .receipt-container { margin: 0; padding: 15px; border: 1px solid #000; }
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
        
        <div class="receipt-info">
            <div class="info-row">
                <div class="info-label">Pasien:</div>
                <div class="info-value">${treatment.patientName}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tanggal:</div>
                <div class="info-value">${new Date(treatment.date).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dokter:</div>
                <div class="info-value">${treatment.doctorName}</div>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="treatment-list">
            ${(treatment.treatmentTypes || []).map(item => `
                <div class="treatment-item">
                    <div class="treatment-name">${item.name}</div>
                    <div class="treatment-price">${formatCurrency(item.price)}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="divider"></div>
        
        <div class="total-section">
            <div class="total-amount">
                TOTAL: ${formatCurrency(treatment.totalNominal || 0)}
            </div>
        </div>
        
        <div class="footer">
            <p>Terima kasih</p>
            <p>${new Date().toLocaleDateString('id-ID')}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 15px;">
            <button onclick="window.print()" style="background: #e91e63; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; font-size: 12px;">Cetak</button>
            <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-left: 8px; font-size: 12px;">Tutup</button>
        </div>
    </div>
</body>
</html>`

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  const handleTreatmentSelection = (treatmentId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedTreatments: [...(prev.selectedTreatments || []), treatmentId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedTreatments: (prev.selectedTreatments || []).filter(id => id !== treatmentId)
      }))
    }
  }

  const removeTreatment = (treatmentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTreatments: (prev.selectedTreatments || []).filter(id => id !== treatmentId)
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Manajemen Tindakan & Fee Dokter
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tindakan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-pink-800">
                    {editingTreatment ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-pink-600">
                    {editingTreatment 
                      ? 'Perbarui informasi tindakan medis dan perhitungan fee dokter.' 
                      : 'Lengkapi form berikut untuk mencatat tindakan medis dan menghitung fee dokter otomatis.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor" className="text-pink-700">Dokter</Label>
                      <Select value={formData.doctorId} onValueChange={(value) => setFormData({ ...formData, doctorId: value })}>
                        <SelectTrigger className="border-pink-200">
                          <SelectValue placeholder="Pilih dokter" />
                        </SelectTrigger>
                        <SelectContent>
                          {(doctors || []).map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shift" className="text-pink-700">Shift</Label>
                      <Select value={formData.shift} onValueChange={(value) => setFormData({ ...formData, shift: value })}>
                        <SelectTrigger className="border-pink-200">
                          <SelectValue placeholder="Pilih shift" />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientName" className="text-pink-700">Nama Pasien</Label>
                      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={patientSearchOpen}
                            className="w-full justify-between border-pink-200"
                          >
                            {patientSearchValue || "Pilih pasien..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari pasien..." />
                            <CommandEmpty>Pasien tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {(patients || []).map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={patient.name}
                                  onSelect={() => {
                                    setFormData({ ...formData, patientId: patient.id })
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

                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-pink-700">Tanggal</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="border-pink-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-pink-700">Jenis Tindakan</Label>
                    <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={treatmentSearchOpen}
                          className="w-full justify-between border-pink-200"
                        >
                          {(formData.selectedTreatments || []).length > 0 
                            ? `${(formData.selectedTreatments || []).length} tindakan dipilih`
                            : "Pilih tindakan..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Cari tindakan..." />
                          <CommandEmpty>Tindakan tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {(treatmentProducts || []).map((treatment) => (
                              <CommandItem
                                key={treatment.id}
                                value={treatment.name}
                                onSelect={() => {
                                  const isSelected = (formData.selectedTreatments || []).includes(treatment.id)
                                  handleTreatmentSelection(treatment.id, !isSelected)
                                }}
                              >
                                <Checkbox
                                  checked={(formData.selectedTreatments || []).includes(treatment.id)}
                                  onChange={(e) => handleTreatmentSelection(treatment.id, e.target.checked)}
                                  className="mr-2"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{treatment.name}</div>
                                  <div className="text-sm text-gray-500">{formatCurrency(treatment.price)}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Selected treatments display */}
                    {(formData.selectedTreatments || []).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-pink-700 text-sm">Tindakan Terpilih:</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {(formData.selectedTreatments || []).map(treatmentId => {
                            const treatment = (treatmentProducts || []).find(t => t.id === treatmentId)
                            if (!treatment) return null
                            return (
                              <div key={treatmentId} className="flex items-center justify-between bg-pink-50 p-2 rounded border">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{treatment.name}</div>
                                  <div className="text-xs text-gray-500">{formatCurrency(treatment.price)}</div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTreatment(treatmentId)}
                                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-pink-700">Deskripsi Tindakan</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border-pink-200"
                      placeholder="Deskripsi detail tindakan yang dilakukan"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-pink-700">Total Nominal Tindakan</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(totalNominal)}
                          readOnly
                          className="border-pink-200 bg-pink-50 font-semibold text-pink-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feePercentage" className="text-pink-700">Persentase Fee (%)</Label>
                      <div className="relative">
                        <Input
                          id="feePercentage"
                          type="number"
                          value={formData.feePercentage}
                          onChange={(e) => setFormData({ ...formData, feePercentage: e.target.value })}
                          required
                          className="border-pink-200 pr-8"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-600 text-sm pointer-events-none">
                          %
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminFeeOverride" className="text-pink-700">
                      Biaya Admin 
                      <span className="text-pink-500 text-xs ml-1">
                        (Opsional - default: {formatCurrency(adminFee)})
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminFeeOverride"
                        type="number"
                        value={formData.adminFeeOverride}
                        onChange={(e) => setFormData({ ...formData, adminFeeOverride: e.target.value })}
                        className="border-pink-200 pl-10"
                        placeholder={`${adminFee}`}
                        min="0"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600 text-sm pointer-events-none">
                        Rp
                      </div>
                    </div>
                    <p className="text-xs text-pink-500">
                      Kosongkan untuk menggunakan biaya admin default dari pengaturan klinik
                    </p>
                  </div>

                  {/* Fee Calculation Display */}
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-pink-700">Total Nominal Tindakan:</span>
                      <span className="font-medium">{formatCurrency(totalNominal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-pink-700">Persentase Fee ({formData.feePercentage || 0}%):</span>
                      <span className="font-medium">{formatCurrency(totalNominal * (parseFloat(formData.feePercentage) || 0) / 100)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-pink-700">Biaya Admin:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(parseFloat(formData.adminFeeOverride) || adminFee)}
                        {formData.adminFeeOverride && (
                          <span className="text-xs text-pink-500 ml-1">(custom)</span>
                        )}
                      </span>
                    </div>
                    <div className="border-t border-pink-300 pt-2">
                      <div className="flex justify-between items-center font-semibold text-pink-800">
                        <span>Fee Dokter Final:</span>
                        <span className="text-lg">{formatCurrency(calculatedFee)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1 border-pink-200 text-pink-600"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                    >
                      {loading ? 'Menyimpan...' : (editingTreatment ? 'Update' : 'Simpan')}
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
                  <TableHead className="text-pink-700">Dokter</TableHead>
                  <TableHead className="text-pink-700">Pasien</TableHead>
                  <TableHead className="text-pink-700">Tindakan</TableHead>
                  <TableHead className="text-pink-700">Total</TableHead>
                  <TableHead className="text-pink-700">Fee (%)</TableHead>
                  <TableHead className="text-pink-700">Biaya Admin</TableHead>
                  <TableHead className="text-pink-700">Fee Final</TableHead>
                  <TableHead className="text-pink-700">Shift</TableHead>
                  <TableHead className="text-pink-700">Tanggal</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(treatments || []).map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>{treatment.doctorName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{treatment.patientName}</div>
                        {treatment.patientPhone && (
                          <div className="text-sm text-gray-600">{treatment.patientPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="space-y-1">
                          {(treatment.treatmentTypes || []).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>
                        {treatment.description && (
                          <div className="text-sm text-gray-600 mt-2 italic">{treatment.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(treatment.totalNominal || 0)}</TableCell>
                    <TableCell>{treatment.feePercentage}%</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCurrency(treatment.adminFeeOverride || adminFee)}
                        {treatment.adminFeeOverride && (
                          <span className="text-xs text-pink-500 block">(custom)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(treatment.calculatedFee)}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                        {treatment.shift}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(treatment.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(treatment)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Cetak Invoice/Kwitansi"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(treatment)}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(treatment.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(treatments || []).length === 0 && (
              <div className="text-center py-8 text-pink-600">
                Belum ada data tindakan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Cetak Dokumen</DialogTitle>
            <DialogDescription className="text-pink-600">
              Pilih format dokumen yang ingin dicetak untuk pasien {selectedTreatmentForPrint?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => {
                if (selectedTreatmentForPrint) {
                  generateInvoice(selectedTreatmentForPrint)
                  setPrintDialogOpen(false)
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Cetak Invoice
            </Button>
            <Button
              onClick={() => {
                if (selectedTreatmentForPrint) {
                  generateReceipt(selectedTreatmentForPrint)
                  setPrintDialogOpen(false)
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Cetak Kwitansi
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrintDialogOpen(false)}
              className="w-full border-pink-200 text-pink-600"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Doctor Fee Summary */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ringkasan Fee Dokter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-pink-700">Dokter</TableHead>
                  <TableHead className="text-pink-700">Shift</TableHead>
                  <TableHead className="text-pink-700">Tanggal</TableHead>
                  <TableHead className="text-pink-700">Fee Tindakan</TableHead>
                  <TableHead className="text-pink-700">Uang Duduk</TableHead>
                  <TableHead className="text-pink-700">Fee Final</TableHead>
                  <TableHead className="text-pink-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(getDoctorFeeSummary() || []).map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell>{summary.doctor}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                        {summary.shift}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(summary.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatCurrency(summary.treatmentFee)}
                    </TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatCurrency(summary.sittingFee)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(summary.finalFee)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        summary.hasTreatments 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {summary.hasTreatments ? 'Ada Tindakan' : 'Duduk Saja'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(getDoctorFeeSummary() || []).length === 0 && (
              <div className="text-center py-8 text-pink-600">
                Belum ada data fee dokter
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}