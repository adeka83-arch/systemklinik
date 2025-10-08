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
import { Plus, Edit, Trash2, Receipt, Calculator, Check, ChevronsUpDown, FileText, Printer, X, Eye, Maximize2 } from 'lucide-react'
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

export function TreatmentsWithPreview({ accessToken, refreshTrigger, adminFee: propAdminFee }: TreatmentsProps) {
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
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState<'invoice' | 'receipt'>('invoice')
  const [selectedTreatmentForPreview, setSelectedTreatmentForPreview] = useState<Treatment | null>(null)

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

  const openPreview = (treatment: Treatment, type: 'invoice' | 'receipt') => {
    setSelectedTreatmentForPreview(treatment)
    setPreviewType(type)
    setPreviewOpen(true)
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

  const renderPreviewContent = () => {
    if (!selectedTreatmentForPreview) return null

    const treatment = selectedTreatmentForPreview

    if (previewType === 'invoice') {
      return (
        <div className="max-w-4xl mx-auto p-8 bg-white">
          <div className="text-center mb-8 border-b-2 border-pink-600 pb-6">
            <h1 className="text-3xl font-bold text-pink-600 mb-2">Falasifah Dental Clinic</h1>
            <p className="text-gray-600">Klinik Gigi Terpercaya</p>
          </div>
          
          <h2 className="text-2xl font-bold text-pink-600 mb-6 text-center">INVOICE PEMBAYARAN</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Nama Pasien:</span>
                <span className="ml-2">{treatment.patientName}</span>
              </div>
              <div>
                <span className="font-semibold">No. Telp:</span>
                <span className="ml-2">{treatment.patientPhone || '-'}</span>
              </div>
              <div>
                <span className="font-semibold">Tanggal:</span>
                <span className="ml-2">
                  {new Date(treatment.date).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold">Dokter:</span>
                <span className="ml-2">{treatment.doctorName}</span>
              </div>
              <div>
                <span className="font-semibold">Shift:</span>
                <span className="ml-2">{treatment.shift}</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-pink-100">
                  <th className="border border-gray-300 p-3 text-left font-semibold text-pink-800">No</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold text-pink-800">Jenis Tindakan</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold text-pink-800">Harga</th>
                </tr>
              </thead>
              <tbody>
                {(treatment.treatmentTypes || []).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-pink-50'}>
                    <td className="border border-gray-300 p-3">{index + 1}</td>
                    <td className="border border-gray-300 p-3">{item.name}</td>
                    <td className="border border-gray-300 p-3">{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {treatment.description && (
            <div className="mb-6">
              <strong>Catatan:</strong><br />
              <p className="mt-2">{treatment.description}</p>
            </div>
          )}
          
          <div className="text-right">
            <div className="inline-block border-t-2 border-pink-600 pt-4">
              <div className="text-xl font-bold text-pink-600">
                TOTAL PEMBAYARAN: {formatCurrency(treatment.totalNominal || 0)}
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center text-gray-600">
            <p>Terima kasih atas kepercayaan Anda kepada Falasifah Dental Clinic</p>
            <p>Invoice ini dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="max-w-md mx-auto p-6 bg-white border-2 border-pink-600 rounded-lg">
          <div className="text-center mb-6 border-b border-pink-600 pb-4">
            <h1 className="text-xl font-bold text-pink-600 mb-1">Falasifah Dental Clinic</h1>
            <p className="text-sm text-gray-600">Klinik Gigi Terpercaya</p>
          </div>
          
          <h2 className="text-lg font-bold text-pink-600 mb-4 text-center">KWITANSI PEMBAYARAN</h2>
          
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pasien:</span>
              <span className="font-semibold">{treatment.patientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tanggal:</span>
              <span className="font-semibold">{new Date(treatment.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dokter:</span>
              <span className="font-semibold">{treatment.doctorName}</span>
            </div>
          </div>
          
          <div className="border-t border-dashed border-gray-400 my-4"></div>
          
          <div className="mb-4 space-y-2">
            {(treatment.treatmentTypes || []).map((item, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-right text-pink-600 font-semibold">{formatCurrency(item.price)}</div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-dashed border-gray-400 my-4"></div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-pink-600 border-2 border-pink-600 p-3 rounded">
              TOTAL: {formatCurrency(treatment.totalNominal || 0)}
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-600 border-t border-pink-600 pt-3">
            <p>Terima kasih</p>
            <p>{new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing form dialog and table */}
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
                    {editingTreatment ? 'Edit Data Tindakan' : 'Tambah Data Tindakan'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTreatment ? 'Perbarui informasi tindakan dan fee dokter' : 'Masukkan data tindakan dan hitung fee dokter'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doctorId">Dokter *</Label>
                      <Select 
                        value={formData.doctorId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih dokter" />
                        </SelectTrigger>
                        <SelectContent>
                          {(doctors || []).map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="shift">Shift *</Label>
                      <Select 
                        value={formData.shift} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih shift" />
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Pasien *</Label>
                      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={patientSearchOpen}
                            className="w-full justify-between"
                          >
                            {patientSearchValue || "Cari pasien..."}
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
                              {(patients || [])
                                .filter(patient => 
                                  patient.name.toLowerCase().includes(patientSearchValue.toLowerCase()) ||
                                  patient.phone.includes(patientSearchValue)
                                )
                                .map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={patient.name}
                                  onSelect={() => {
                                    setPatientSearchValue(patient.name)
                                    setFormData(prev => ({ ...prev, patientId: patient.id }))
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

                    <div>
                      <Label htmlFor="date">Tanggal *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Jenis Tindakan *</Label>
                    <Popover open={treatmentSearchOpen} onOpenChange={setTreatmentSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={treatmentSearchOpen}
                          className="w-full justify-between"
                        >
                          {(formData.selectedTreatments || []).length > 0 
                            ? `${(formData.selectedTreatments || []).length} tindakan dipilih` 
                            : "Pilih jenis tindakan..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Cari tindakan..." />
                          <CommandEmpty>Tidak ada tindakan ditemukan.</CommandEmpty>
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
                                  onChange={(checked) => handleTreatmentSelection(treatment.id, checked)}
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
                    
                    {(formData.selectedTreatments || []).length > 0 && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-sm text-gray-600">Tindakan yang dipilih:</Label>
                        <div className="flex flex-wrap gap-2">
                          {(formData.selectedTreatments || []).map(treatmentId => {
                            const treatment = (treatmentProducts || []).find(t => t.id === treatmentId)
                            if (!treatment) return null
                            return (
                              <Badge key={treatmentId} variant="secondary" className="flex items-center gap-1">
                                {treatment.name} - {formatCurrency(treatment.price)}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => removeTreatment(treatmentId)}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Catatan/Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Catatan tambahan tindakan..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feePercentage">Persentase Fee (%) *</Label>
                      <Input
                        id="feePercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.feePercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, feePercentage: e.target.value }))}
                        placeholder="Contoh: 10"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="adminFeeOverride">Biaya Admin Override</Label>
                      <Input
                        id="adminFeeOverride"
                        type="number"
                        min="0"
                        value={formData.adminFeeOverride}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminFeeOverride: e.target.value }))}
                        placeholder={`Default: ${formatCurrency(adminFee)}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Kosongkan untuk menggunakan biaya admin default
                      </p>
                    </div>
                  </div>

                  <Card className="bg-pink-50 border-pink-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-pink-600" />
                        <span className="font-medium text-pink-800">Kalkulasi Fee</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Nominal:</span>
                          <span className="font-semibold ml-2">{formatCurrency(totalNominal)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Biaya Admin:</span>
                          <span className="font-semibold ml-2">
                            {formatCurrency(parseFloat(formData.adminFeeOverride) || adminFee)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Fee Dokter:</span>
                          <span className="font-bold text-pink-600 ml-2 text-lg">
                            {formatCurrency(calculatedFee)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={resetForm}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-pink-600 hover:bg-pink-700"
                      disabled={loading}
                    >
                      {loading ? 'Menyimpan...' : (editingTreatment ? 'Perbarui' : 'Simpan')}
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
                  <TableHead>Fee %</TableHead>
                  <TableHead>Fee Dokter</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(treatments || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Belum ada data tindakan
                    </TableCell>
                  </TableRow>
                ) : (
                  (treatments || []).map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        {new Date(treatment.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{treatment.patientName}</div>
                          {treatment.patientPhone && (
                            <div className="text-sm text-gray-500">{treatment.patientPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{treatment.doctorName}</TableCell>
                      <TableCell>{treatment.shift}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(treatment.treatmentTypes || []).map((type, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{type.name}</span>
                              <span className="text-gray-500 ml-2">{formatCurrency(type.price)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(treatment.totalNominal)}
                      </TableCell>
                      <TableCell>{treatment.feePercentage}%</TableCell>
                      <TableCell className="font-semibold text-pink-600">
                        {formatCurrency(treatment.calculatedFee)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(treatment, 'invoice')}
                            className="h-8 w-8 p-0"
                            title="Preview Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(treatment, 'receipt')}
                            className="h-8 w-8 p-0"
                            title="Preview Kwitansi"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint(treatment)}
                            className="h-8 w-8 p-0"
                            title="Cetak Dokumen"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(treatment)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(treatment.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Hapus"
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden fullscreen-transition">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-pink-800 flex items-center gap-2">
                <Maximize2 className="h-5 w-5" />
                Preview {previewType === 'invoice' ? 'Invoice' : 'Kwitansi'} - {selectedTreatmentForPreview?.patientName}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedTreatmentForPreview && generateInvoice(selectedTreatmentForPreview)}
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={previewType !== 'invoice'}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Invoice
                </Button>
                <Button
                  onClick={() => selectedTreatmentForPreview && generateReceipt(selectedTreatmentForPreview)}
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={previewType !== 'receipt'}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Kwitansi
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] full-screen-preview">
            <div className="print-content">
              {renderPreviewContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Selection Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-pink-800">Pilih Jenis Dokumen</DialogTitle>
            <DialogDescription>
              Pilih jenis dokumen yang ingin dicetak untuk pasien {selectedTreatmentForPrint?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => {
                if (selectedTreatmentForPrint) {
                  openPreview(selectedTreatmentForPrint, 'invoice')
                  setPrintDialogOpen(false)
                }
              }}
              className="h-24 flex flex-col gap-2 bg-pink-600 hover:bg-pink-700"
            >
              <FileText className="h-8 w-8" />
              <span>Preview Invoice</span>
            </Button>
            
            <Button
              onClick={() => {
                if (selectedTreatmentForPrint) {
                  openPreview(selectedTreatmentForPrint, 'receipt')
                  setPrintDialogOpen(false)
                }
              }}
              className="h-24 flex flex-col gap-2 bg-pink-600 hover:bg-pink-700"
            >
              <Receipt className="h-8 w-8" />
              <span>Preview Kwitansi</span>
            </Button>
          </div>
          
          <div className="flex justify-center pt-4 border-t">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Fee Tindakan</TableHead>
                  <TableHead>Uang Duduk</TableHead>
                  <TableHead>Final Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getDoctorFeeSummary().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Belum ada data fee dokter
                    </TableCell>
                  </TableRow>
                ) : (
                  getDoctorFeeSummary().map((summary, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{summary.doctor}</TableCell>
                      <TableCell>
                        {new Date(summary.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>{summary.shift}</TableCell>
                      <TableCell>{formatCurrency(summary.treatmentFee)}</TableCell>
                      <TableCell>{formatCurrency(summary.sittingFee)}</TableCell>
                      <TableCell className="font-semibold text-pink-600">
                        {formatCurrency(summary.finalFee)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={summary.hasTreatments ? "default" : "secondary"}>
                          {summary.hasTreatments ? "Ada Tindakan" : "Uang Duduk"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}