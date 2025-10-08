import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Checkbox } from './ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { 
  Upload, 
  Image as ImageIcon, 
  Send, 
  Users, 
  MessageCircle, 
  Eye, 
  Trash2, 
  Edit,
  Phone,
  RefreshCw,
  User,
  Gift,
  Ticket,
  Percent,
  DollarSign,
  Calendar,
  Copy
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { apiGet, apiPost, apiDelete } from '../utils/api'
import voucherTemplateImage from 'figma:asset/373c2a6004c8c8e8d79b097dbfc91b332180b362.png'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string
  medicalRecordNumber: string
  email?: string
}

interface PromoImage {
  id: string
  filename: string
  originalName: string
  fileUrl: string
  uploadDate: string
  fileSize: number
  mimeType: string
  uploadedBy: string
}

interface Voucher {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  usageLimit: number
  usageCount: number
  isActive: boolean
  createdDate: string
  createdBy: string
  minPurchase?: number
  recipientNames?: string[]
  recipientCount?: number
  // Status fields
  status?: string
  statusColor?: string
  statusText?: string
  currentUsage?: number
}

interface PromoHistory {
  id: string
  type: 'image' | 'voucher'
  title: string
  recipientCount: number
  recipientNames: string[]
  recipientPhones: string[]
  sentDate: string
  sentBy: string
  imageUrl?: string
  voucherCode?: string
}

interface PromoManagerProps {
  accessToken: string
  refreshTrigger?: number
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function PromoManagerImageOnly({ accessToken, refreshTrigger }: PromoManagerProps) {
  // States for image promo
  const [patients, setPatients] = useState<Patient[]>([])
  const [promoImages, setPromoImages] = useState<PromoImage[]>([])
  const [selectedImage, setSelectedImage] = useState<PromoImage | null>(null)
  const [selectedPatientsImage, setSelectedPatientsImage] = useState<string[]>([])
  const [promoTitle, setPromoTitle] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [searchTermImage, setSearchTermImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sendingImage, setSendingImage] = useState(false)
  const [sendProgressImage, setSendProgressImage] = useState(0)
  const [loading, setLoading] = useState(true)

  // States for voucher
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherTitle, setVoucherTitle] = useState('')
  const [voucherDescription, setVoucherDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null)
  const [selectedPatientsVoucher, setSelectedPatientsVoucher] = useState<string[]>([])
  const [searchTermVoucher, setSearchTermVoucher] = useState('')
  const [sendingVoucher, setSendingVoucher] = useState(false)
  const [sendProgressVoucher, setSendProgressVoucher] = useState(0)
  const [deletingVoucher, setDeletingVoucher] = useState<string | null>(null)
  const [refreshingVouchers, setRefreshingVouchers] = useState(false)

  // Dialog states
  const [previewImage, setPreviewImage] = useState<PromoImage | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Respond to refresh trigger from external components (like TreatmentSystem after voucher usage)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 External refresh trigger received, refreshing vouchers with trigger:', refreshTrigger)
      fetchVouchers(false) // Don't show toast for external triggers
    }
  }, [refreshTrigger])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      console.log('🚀 Starting to fetch initial promo data...')
      
      // Fetch patients first as it's critical for promo functionality
      await fetchPatients()
      
      // Then fetch other data
      await Promise.all([
        fetchPromoImages(),
        fetchVouchers(false) // Don't show toast during initial load
      ])
      
      console.log('✅ All initial promo data fetched successfully')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('🏥 Fetching patients for promo...')
      const data = await apiGet('/patients', accessToken)
      console.log('Patients data received:', data)
      setPatients(data.patients || [])
      console.log(`✅ Loaded ${data.patients?.length || 0} patients for promo`)
    } catch (error) {
      console.error('❌ Error fetching patients for promo:', error)
      toast.error('Terjadi kesalahan saat memuat data pasien')
    }
  }

  const fetchPromoImages = async () => {
    try {
      console.log('🖼️ Fetching promo images...')
      const data = await apiGet('/promo-images', accessToken)
      console.log('Promo images data received:', data)
      setPromoImages(data.images || [])
      console.log(`✅ Loaded ${data.images?.length || 0} promo images`)
    } catch (error) {
      console.error('❌ Error fetching promo images:', error)
      if (error.status === 401) {
        toast.error('Sesi telah berakhir, silakan login ulang')
      } else {
        toast.error('Terjadi kesalahan saat memuat gambar promo')
      }
    }
  }

  const fetchVouchers = async (showToast = true) => {
    try {
      console.log('🎟️ Fetching vouchers with status...')
      setRefreshingVouchers(true)
      
      const timestamp = new Date().getTime()
      console.log(`🕐 Fetch timestamp: ${timestamp}`)
      
      const data = await apiGet(`/vouchers/status?t=${timestamp}`, accessToken)
      console.log('🎟️ Raw voucher data received:', typeof data, data)
      
      if (data.debug) {
        console.log('🎟️ Server debug info:', data.debug)
      }
      
      // Filter out corrupt vouchers and normalize the remaining data
      const validVouchers = (data.vouchers || []).filter((voucher: any) => {
        // Check if voucher has all required fields and valid data
        const hasValidCode = voucher.code && voucher.code !== 'CORRUPT' && voucher.code.trim() !== ''
        const hasValidTitle = voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && voucher.title.trim() !== ''
        const hasValidDiscountValue = typeof voucher.discountValue === 'number' && voucher.discountValue >= 0
        const hasValidExpiryDate = voucher.expiryDate && voucher.expiryDate !== 'Invalid Date' && !isNaN(new Date(voucher.expiryDate).getTime())
        
        return hasValidCode && hasValidTitle && hasValidDiscountValue && hasValidExpiryDate
      })
      
      // Normalize voucher data to ensure safe number values and include status info
      const normalizedVouchers = validVouchers.map((voucher: any) => ({
        ...voucher,
        discountValue: voucher.discountValue || 0,
        usageLimit: voucher.usageLimit || 0,
        usageCount: voucher.currentUsage || voucher.usageCount || 0,
        minPurchase: voucher.minPurchase || 0,
        recipientNames: voucher.recipientNames || [],
        recipientCount: voucher.recipientCount || 0,
        // Add status fields from server response
        status: voucher.status || 'active',
        statusColor: voucher.statusColor || 'green',
        statusText: voucher.statusText || 'Aktif',
        currentUsage: voucher.currentUsage || 0
      }))
      
      console.log(`✅ Loaded ${normalizedVouchers.length} valid vouchers with status (filtered out ${(data.vouchers || []).length - normalizedVouchers.length} corrupt entries)`)
      console.log('🎟️ Processed vouchers:', normalizedVouchers.map(v => ({
        code: v.code,
        title: v.title,
        status: v.statusText,
        currentUsage: v.currentUsage,
        usageLimit: v.usageLimit
      })))
      
      // Log summary for debugging
      if (data.summary) {
        console.log('🎟️ Server summary:', data.summary)
      }
      
      setVouchers(normalizedVouchers)
      
      if (showToast) {
        toast.success(`✅ Voucher data refreshed! Status: ${data.summary?.active || 0} Aktif, ${data.summary?.used || 0} Terpakai, ${data.summary?.expired || 0} Expired`)
      }
    } catch (error) {
      console.error('❌ Error fetching vouchers:', error)
      if (showToast) {
        toast.error(`Gagal memuat data voucher: ${error.message}`)
      }
    } finally {
      setRefreshingVouchers(false)
    }
  }

  const logPromoActivity = async (type: string, title: string, recipients: Patient[], imageUrl?: string, voucherCode?: string) => {
    try {
      const historyData = {
        type,
        title,
        recipientCount: recipients.length,
        recipientNames: recipients.map(p => p.name),
        recipientPhones: recipients.map(p => p.phone),
        imageUrl,
        voucherCode
      }

      await apiPost('/promo-history', accessToken, historyData)
      console.log('✅ Promo activity logged successfully')
    } catch (error) {
      console.log('⚠️ Error logging promo activity:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') || (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png'))) {
      toast.error('Hanya file JPEG dan PNG yang diperbolehkan')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('image', file)
      formData.append('originalName', file.name)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch(`${serverUrl}/promo-images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Gambar promo berhasil diunggah')
        await fetchPromoImages()
        
        if (data.imageData) {
          setSelectedImage(data.imageData)
        }
        
        event.target.value = ''
      } else {
        toast.error(data.error || 'Gagal mengunggah gambar')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`${serverUrl}/promo-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Gambar promo berhasil dihapus')
        fetchPromoImages()
        if (selectedImage?.id === imageId) {
          setSelectedImage(null)
        }
      } else {
        toast.error(data.error || 'Gagal menghapus gambar')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus')
    }
  }

  const handleSendImagePromo = async () => {
    console.log('🚀 handleSendImagePromo called')
    console.log('Selected image:', selectedImage)
    console.log('Selected patients:', selectedPatientsImage)
    console.log('Promo title:', promoTitle)
    console.log('Patients data length:', patients.length)
    
    if (!selectedImage) {
      console.log('❌ No image selected')
      toast.error('Pilih gambar promo terlebih dahulu')
      return
    }

    if (selectedPatientsImage.length === 0) {
      console.log('❌ No patients selected')
      toast.error('Pilih minimal satu pasien')
      return
    }

    if (!promoTitle.trim()) {
      console.log('❌ No promo title')
      toast.error('Masukkan judul promo')
      return
    }

    try {
      console.log('✅ All validations passed, starting to send promo')
      setSendingImage(true)
      setSendProgressImage(0)
      
      const selectedPatientsData = patients.filter(p => selectedPatientsImage.includes(p.id))
      const totalPatients = selectedPatientsData.length
      
      console.log(`📋 Selected patients data:`, selectedPatientsData)
      console.log(`👥 Total patients to send: ${totalPatients}`)

      const baseMessage = `🎉 *${promoTitle}* 🎉

${promoMessage ? promoMessage + '\n\n' : ''}🖼️ Lihat gambar promo: ${selectedImage.fileUrl}

📍 Falasifah Dental Clinic
📞 WhatsApp: 085283228355

Jangan lewatkan penawaran terbatas ini!

Terima kasih! 🦷✨`

      for (let i = 0; i < selectedPatientsData.length; i++) {
        const patient = selectedPatientsData[i]
        
        let cleanPhone = patient.phone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1)
        } else if (!cleanPhone.startsWith('62')) {
          cleanPhone = '62' + cleanPhone
        }

        const personalizedMessage = `Halo ${patient.name}!\n\n${baseMessage}`

        setTimeout(() => {
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`
          window.open(whatsappUrl, `_blank_${i}`)
        }, i * 1000)

        setSendProgressImage(Math.round(((i + 1) / totalPatients) * 100))
      }

      setTimeout(async () => {
        await logPromoActivity('image', promoTitle, selectedPatientsData, selectedImage.fileUrl)
        toast.success(`Promo gambar berhasil dikirim ke ${selectedPatientsData.length} pasien`)
        setSendingImage(false)
        setSendProgressImage(0)
      }, totalPatients * 1000)

    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim promo')
      setSendingImage(false)
      setSendProgressImage(0)
    }
  }

  // Generate voucher code
  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'DENTAL'
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Create new voucher and send to selected patients
  const handleCreateVoucher = async () => {
    if (!voucherTitle.trim()) {
      toast.error('Masukkan judul voucher')
      return
    }

    if (!discountValue.trim() || parseFloat(discountValue) <= 0) {
      toast.error('Masukkan nilai diskon yang valid')
      return
    }

    if (!expiryDate) {
      toast.error('Pilih tanggal kadaluarsa')
      return
    }

    if (selectedPatientsVoucher.length === 0) {
      toast.error('Pilih minimal satu pasien untuk mengirim voucher')
      return
    }

    try {
      // Get selected patients data for recipient names
      const selectedPatientsData = patients.filter(p => selectedPatientsVoucher.includes(p.id))
      const recipientNames = selectedPatientsData.map(p => p.name)
      
      // First create the voucher
      const voucherCode = generateVoucherCode()
      const data = await apiPost('/vouchers', accessToken, {
        code: voucherCode,
        title: voucherTitle,
        description: voucherDescription,
        discountType,
        discountValue: parseFloat(discountValue),
        expiryDate,
        usageLimit: usageLimit ? parseInt(usageLimit) : 0,
        minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
        recipientNames: recipientNames,
        recipientCount: recipientNames.length
      })
      
      if (data.success) {
        toast.success('Voucher berhasil dibuat!')
        
        // Create voucher object for sending
        const newVoucher = {
          id: data.voucher.id,
          code: voucherCode,
          title: voucherTitle,
          description: voucherDescription,
          discountType,
          discountValue: parseFloat(discountValue),
          expiryDate,
          usageLimit: usageLimit ? parseInt(usageLimit) : 0,
          minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
          usageCount: 0,
          isActive: true,
          createdDate: new Date().toISOString(),
          createdBy: 'System',
          recipientNames: recipientNames,
          recipientCount: recipientNames.length
        }

        // Auto-send voucher to selected patients
        await sendVoucherToPatients(newVoucher)
        
        // Clear form and refresh data
        setVoucherTitle('')
        setVoucherDescription('')
        setDiscountValue('')
        setExpiryDate('')
        setUsageLimit('')
        setMinPurchase('')
        setSelectedPatientsVoucher([])
        fetchVouchers(true)
      } else {
        toast.error(data.error || 'Gagal membuat voucher')
      }
    } catch (error) {
      console.error('Create voucher error:', error)
      toast.error(`Terjadi kesalahan saat membuat voucher: ${error.message}`)
    }
  }

  // Send voucher to patients helper function
  const sendVoucherToPatients = async (voucher: any) => {
    if (selectedPatientsVoucher.length === 0) {
      return
    }

    try {
      setSendingVoucher(true)
      setSendProgressVoucher(0)
      
      const selectedPatientsData = patients.filter(p => selectedPatientsVoucher.includes(p.id))
      const totalPatients = selectedPatientsData.length

      const discountText = voucher.discountType === 'percentage' 
        ? `${voucher.discountValue}%`
        : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`

      const minPurchaseText = voucher.minPurchase 
        ? `\n💰 Minimal pembelian: Rp ${voucher.minPurchase.toLocaleString('id-ID')}`
        : ''

      for (let i = 0; i < selectedPatientsData.length; i++) {
        const patient = selectedPatientsData[i]
        
        const personalizedMessage = `Halo ${patient.name}!

🎉 *VOUCHER DISKON SPESIAL* 🎉

✨ ${voucher.title} ✨

${voucher.description ? voucher.description + '\n\n' : ''}🏷️ *Kode Voucher:* ${voucher.code}
🎯 *Diskon:* ${discountText}${minPurchaseText}
⏰ *Berlaku hingga:* ${new Date(voucher.expiryDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355
🕒 *Jam Buka:* Senin - Sabtu, 08:00 - 20:00

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang: ${voucher.code}
2. Diskon hanya berlaku untuk nilai tindakan (tidak termasuk biaya admin)
3. Berlaku untuk semua treatment
4. Tidak dapat digabung dengan promo lain

*Kode ini khusus untuk ${patient.name}!* 🦷✨

#FalasifaDental #VoucherDiskon #PerawatanGigi`

        let cleanPhone = patient.phone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1)
        } else if (!cleanPhone.startsWith('62')) {
          cleanPhone = '62' + cleanPhone
        }

        setTimeout(() => {
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`
          window.open(whatsappUrl, `_blank_voucher_${i}`)
        }, i * 1500)

        setSendProgressVoucher(Math.round(((i + 1) / totalPatients) * 100))
      }

      setTimeout(async () => {
        await logPromoActivity('voucher', voucher.title, selectedPatientsData, undefined, voucher.code)
        toast.success(`✅ Voucher berhasil dikirim ke ${selectedPatientsData.length} pasien! 🎉`)
        
        setSendingVoucher(false)
        setSendProgressVoucher(0)
      }, totalPatients * 1500)

    } catch (error) {
      console.error('Error sending voucher:', error)
      toast.error('Terjadi kesalahan saat mengirim voucher')
      setSendingVoucher(false)
      setSendProgressVoucher(0)
    }
  }

  // Delete voucher
  const handleDeleteVoucher = async (voucherId: string) => {
    try {
      setDeletingVoucher(voucherId)
      
      const data = await apiDelete(`/vouchers/${voucherId}`, accessToken)
      
      if (data.success) {
        toast.success('Voucher berhasil dihapus')
        
        if (selectedVoucher?.id === voucherId) {
          setSelectedVoucher(null)
        }
        
        fetchVouchers(true)
      } else {
        toast.error(data.error || 'Gagal menghapus voucher')
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error(`Terjadi kesalahan saat menghapus voucher: ${error.message}`)
    } finally {
      setDeletingVoucher(null)
    }
  }

  // Generate voucher image
  const generateVoucherImage = (voucher: any): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve('')
        return
      }

      canvas.width = 800
      canvas.height = 400

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#ec4899')
      gradient.addColorStop(1, '#8b5cf6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // White content area
      const padding = 20
      ctx.fillStyle = 'white'
      ctx.fillRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2)

      // Title
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('VOUCHER DISKON', canvas.width / 2, 80)

      // Clinic name
      ctx.font = '18px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Falasifah Dental Clinic', canvas.width / 2, 110)

      // Voucher title
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#ec4899'
      const maxTitleWidth = canvas.width - 80
      const titleText = voucher.title.length > 35 ? voucher.title.substring(0, 32) + '...' : voucher.title
      ctx.fillText(titleText, canvas.width / 2, 150)

      // Voucher code
      ctx.font = 'bold 28px Arial'
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(canvas.width / 2 - 120, 170, 240, 50)
      ctx.fillStyle = 'white'
      ctx.fillText(voucher.code, canvas.width / 2, 200)

      // Discount value
      ctx.font = 'bold 36px Arial'
      ctx.fillStyle = '#dc2626'
      const discountText = voucher.discountType === 'percentage' 
        ? `${voucher.discountValue}% OFF`
        : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`
      ctx.fillText(discountText, canvas.width / 2, 260)

      // Expiry date
      ctx.font = '16px Arial'
      ctx.fillStyle = '#6b7280'
      const expiryText = `Berlaku hingga: ${new Date(voucher.expiryDate).toLocaleDateString('id-ID')}`
      ctx.fillText(expiryText, canvas.width / 2, 290)

      // Min purchase if exists
      if (voucher.minPurchase) {
        const minPurchaseText = `Minimal pembelian: Rp ${voucher.minPurchase.toLocaleString('id-ID')}`
        ctx.fillText(minPurchaseText, canvas.width / 2, 315)
      }

      // Terms
      ctx.font = '12px Arial'
      ctx.fillText('Tunjukkan voucher ini saat melakukan pembayaran', canvas.width / 2, 350)

      resolve(canvas.toDataURL('image/png'))
    })
  }



  // Patient selection functions for image promo
  const handleSelectAllPatientsImage = (checked: boolean) => {
    if (checked) {
      setSelectedPatientsImage(filteredPatientsImage.map(p => p.id))
    } else {
      setSelectedPatientsImage([])
    }
  }

  const handlePatientSelectImage = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatientsImage(prev => [...prev, patientId])
    } else {
      setSelectedPatientsImage(prev => prev.filter(id => id !== patientId))
    }
  }

  // Patient selection functions for voucher
  const handleSelectAllPatientsVoucher = (checked: boolean) => {
    if (checked) {
      setSelectedPatientsVoucher(filteredPatientsVoucher.map(p => p.id))
    } else {
      setSelectedPatientsVoucher([])
    }
  }

  const handlePatientSelectVoucher = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatientsVoucher(prev => [...prev, patientId])
    } else {
      setSelectedPatientsVoucher(prev => prev.filter(id => id !== patientId))
    }
  }

  // Filtered patients for image promo
  const filteredPatientsImage = patients.filter(patient => {
    const matchesName = patient.name.toLowerCase().includes(searchTermImage.toLowerCase())
    const matchesPhone = patient.phone.includes(searchTermImage)
    const matchesMR = patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTermImage.toLowerCase())
    return matchesName || matchesPhone || matchesMR
  })

  // Filtered patients for voucher
  const filteredPatientsVoucher = patients.filter(patient => {
    const matchesName = patient.name.toLowerCase().includes(searchTermVoucher.toLowerCase())
    const matchesPhone = patient.phone.includes(searchTermVoucher)
    const matchesMR = patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTermVoucher.toLowerCase())
    return matchesName || matchesPhone || matchesMR
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Memuat data promo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pink-800">Manajemen Promo</h1>
          <p className="text-pink-600 mt-1">Kelola promo gambar dan voucher elektronik untuk pasien</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-pink-200 text-pink-700">
            {patients.length} Pasien
          </Badge>
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            {promoImages.length} Gambar
          </Badge>
          <Badge variant="outline" className="border-green-200 text-green-700">
            {vouchers.length} Voucher
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInitialData}
            disabled={loading}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="image-promo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image-promo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Promo Gambar
          </TabsTrigger>
          <TabsTrigger value="voucher" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Voucher Elektronik
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Image Promo */}
        <TabsContent value="image-promo" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Upload & Image Management */}
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Gambar Promo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition-colors">
                <ImageIcon className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Drag & drop gambar promo atau klik untuk memilih
                  </p>
                  <p className="text-xs text-gray-500">
                    Format: JPEG, PNG | Maksimal: 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-pink-600">Mengunggah...</span>
                    <span className="text-pink-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Gallery */}
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Galeri Promo ({promoImages.length})
                </CardTitle>
                <Button
                  onClick={fetchPromoImages}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {promoImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada gambar promo</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {promoImages.map((image) => (
                    <div 
                      key={image.id}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedImage?.id === image.id 
                          ? 'border-pink-500 ring-2 ring-pink-200' 
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <img
                        src={image.fileUrl}
                        alt={image.originalName}
                        className="w-full h-32 object-cover"
                        onClick={() => {
                          setSelectedImage(image)
                          toast.success(`Gambar dipilih: ${image.originalName}`)
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewImage(image)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteImage(image.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2">
                        <p className="text-white text-xs truncate">{image.originalName}</p>
                        <p className="text-white text-xs opacity-75">{formatFileSize(image.fileSize)}</p>
                      </div>

                      {selectedImage?.id === image.id && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-pink-500 text-white rounded-full p-1">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Promo Details & Patient Selection */}
        <div className="space-y-6">
          {/* Promo Details */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Detail Promo Gambar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promoTitle">Judul Promo *</Label>
                <Input
                  id="promoTitle"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="Contoh: Promo Scaling & Polishing 50%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoMessage">Pesan Tambahan (Opsional)</Label>
                <Textarea
                  id="promoMessage"
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  placeholder="Tambahkan detail promo, syarat & ketentuan, atau informasi lainnya..."
                  rows={4}
                />
              </div>

              {selectedImage && (
                <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-3 flex items-center gap-2">
                    ✅ Gambar yang AKAN Dikirim:
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedImage.fileUrl}
                      alt={selectedImage.originalName}
                      className="w-16 h-16 object-cover rounded-md border-2 border-green-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-800 truncate">{selectedImage.originalName}</p>
                      <p className="text-xs text-green-600">{formatFileSize(selectedImage.fileSize)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Selection */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pilih Penerima ({selectedPatientsImage.length} dipilih)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchPatientsImage">Cari Pasien</Label>
                <Input
                  id="searchPatientsImage"
                  value={searchTermImage}
                  onChange={(e) => setSearchTermImage(e.target.value)}
                  placeholder="Cari nama, nomor telepon, atau No. RM..."
                />
              </div>

              <div className="flex items-center space-x-2 py-2 border-b">
                <Checkbox
                  id="selectAllImage"
                  checked={selectedPatientsImage.length === filteredPatientsImage.length && filteredPatientsImage.length > 0}
                  onCheckedChange={handleSelectAllPatientsImage}
                />
                <Label htmlFor="selectAllImage">
                  Pilih Semua ({filteredPatientsImage.length} pasien)
                </Label>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {patients.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-pink-200 rounded-lg">
                    <Users className="h-12 w-12 text-pink-400 mx-auto mb-3" />
                    <p className="text-sm text-pink-600 mb-2">Data pasien belum ter-load</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPatients}
                      className="border-pink-200 text-pink-700 hover:bg-pink-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Muat Ulang Data Pasien
                    </Button>
                  </div>
                ) : filteredPatientsImage.length === 0 ? (
                  <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Tidak ada pasien yang ditemukan</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coba ubah kata kunci pencarian
                    </p>
                  </div>
                ) : (
                  filteredPatientsImage.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-pink-50"
                    >
                      <Checkbox
                        id={`image_${patient.id}`}
                        checked={selectedPatientsImage.includes(patient.id)}
                        onCheckedChange={(checked) => handlePatientSelectImage(patient.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{patient.name}</p>
                        <p className="text-xs text-gray-500">
                          {patient.phone} • {patient.medicalRecordNumber}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button
                onClick={handleSendImagePromo}
                disabled={!selectedImage || selectedPatientsImage.length === 0 || !promoTitle.trim() || sendingImage}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                {sendingImage ? 'Mengirim Promo...' : `Kirim via WhatsApp (${selectedPatientsImage.length} pasien)`}
              </Button>

              {sendingImage && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Mengirim promo...</span>
                    <span className="text-green-600">{sendProgressImage}%</span>
                  </div>
                  <Progress value={sendProgressImage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>

    {/* Tab 2: Voucher Elektronik */}
    <TabsContent value="voucher" className="space-y-6">
      {/* Form Create Voucher */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Buat Voucher Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voucherTitle">Judul Voucher *</Label>
                <Input
                  id="voucherTitle"
                  value={voucherTitle}
                  onChange={(e) => setVoucherTitle(e.target.value)}
                  placeholder="Contoh: Diskon Spesial Pembersihan Gigi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucherDescription">Deskripsi (Opsional)</Label>
                <Textarea
                  id="voucherDescription"
                  value={voucherDescription}
                  onChange={(e) => setVoucherDescription(e.target.value)}
                  placeholder="Tambahkan syarat & ketentuan atau detail voucher..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipe Diskon *</Label>
                  <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe diskon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Persentase
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Nominal Tetap
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Nilai Diskon *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '50000'}
                    min="0"
                    step={discountType === 'percentage' ? '1' : '1000'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Tanggal Kadaluarsa *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Batas Penggunaan</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="0 = tidak terbatas"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Minimal Pembelian</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="0 = tidak ada minimal"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              {/* Pemilihan Penerima Voucher */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  <Label className="text-base font-medium text-pink-800">
                    Pilih Penerima Voucher ({selectedPatientsVoucher.length} dipilih)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="searchPatientsVoucher">Cari Pasien</Label>
                  <Input
                    id="searchPatientsVoucher"
                    value={searchTermVoucher}
                    onChange={(e) => setSearchTermVoucher(e.target.value)}
                    placeholder="Cari nama, nomor telepon, atau No. RM..."
                  />
                </div>

                <div className="flex items-center space-x-2 py-2 border-b">
                  <Checkbox
                    id="selectAllVoucher"
                    checked={selectedPatientsVoucher.length === filteredPatientsVoucher.length && filteredPatientsVoucher.length > 0}
                    onCheckedChange={handleSelectAllPatientsVoucher}
                  />
                  <Label htmlFor="selectAllVoucher">
                    Pilih Semua ({filteredPatientsVoucher.length} pasien)
                  </Label>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                  {patients.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-pink-200 rounded-lg bg-white">
                      <Users className="h-10 w-10 text-pink-400 mx-auto mb-3" />
                      <p className="text-sm text-pink-600 mb-2">Data pasien belum ter-load</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPatients}
                        className="border-pink-200 text-pink-700 hover:bg-pink-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Muat Ulang Data Pasien
                      </Button>
                    </div>
                  ) : filteredPatientsVoucher.length === 0 ? (
                    <div className="text-center py-4 border border-gray-200 rounded-lg bg-white">
                      <p className="text-sm text-gray-600">Tidak ada pasien yang ditemukan</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coba ubah kata kunci pencarian
                      </p>
                    </div>
                  ) : (
                    filteredPatientsVoucher.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center space-x-3 p-2 bg-white border rounded-lg hover:bg-pink-50"
                      >
                        <Checkbox
                          id={`voucher_${patient.id}`}
                          checked={selectedPatientsVoucher.includes(patient.id)}
                          onCheckedChange={(checked) => handlePatientSelectVoucher(patient.id, checked as boolean)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{patient.name}</p>
                          <p className="text-xs text-gray-500">
                            {patient.phone} • {patient.medicalRecordNumber}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Ringkasan Penerima Terpilih */}
                {selectedPatientsVoucher.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Penerima Terpilih ({selectedPatientsVoucher.length} pasien)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {selectedPatientsVoucher.map(patientId => {
                        const patient = patients.find(p => p.id === patientId)
                        if (!patient) return null
                        return (
                          <div key={patientId} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-blue-800 truncate">{patient.name}</div>
                              <div className="text-blue-600">{patient.phone}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePatientSelectVoucher(patientId, false)}
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Default Message Preview */}
              {selectedPatientsVoucher.length > 0 && voucherTitle.trim() && discountValue.trim() && expiryDate && (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Preview Pesan WhatsApp</h4>
                  </div>
                  <div className="bg-white rounded-lg p-3 border text-sm">
                    <div className="text-xs text-gray-500 mb-2">
                      Contoh pesan yang akan dikirim ke {selectedPatientsVoucher.length} penerima:
                    </div>
                    <div className="bg-gray-100 rounded p-2 text-xs font-mono whitespace-pre-wrap">
{`Halo [Nama Pasien]!

🎉 *VOUCHER DISKON SPESIAL* 🎉

✨ ${voucherTitle} ✨

${voucherDescription ? voucherDescription + '\n\n' : ''}🏷️ *Kode Voucher:* [Kode akan dibuat otomatis]
🎯 *Diskon:* ${discountType === 'percentage' ? `${discountValue}%` : `Rp ${parseFloat(discountValue || '0').toLocaleString('id-ID')}`}${minPurchase ? `\n💰 Minimal pembelian: Rp ${parseFloat(minPurchase).toLocaleString('id-ID')}` : ''}
⏰ *Berlaku hingga:* ${new Date(expiryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang
2. Diskon hanya berlaku untuk nilai tindakan (tidak termasuk biaya admin)
3. Berlaku untuk semua treatment  
4. Tidak dapat digabung dengan promo lain

*Kode ini khusus untuk [Nama Pasien]!* 🦷✨`}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateVoucher}
                disabled={sendingVoucher || selectedPatientsVoucher.length === 0}
                className="w-full bg-pink-600 hover:bg-pink-700"
                size="lg"
              >
                <Gift className="h-5 w-5 mr-2" />
                {sendingVoucher ? 'Membuat & Mengirim Voucher...' : 'Buat Voucher dan Kirim via WhatsApp'}
              </Button>

              {sendingVoucher && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Mengirim voucher...</span>
                    <span className="text-green-600">{sendProgressVoucher}%</span>
                  </div>
                  <Progress value={sendProgressVoucher} className="h-2" />
                </div>
              )}
        </CardContent>
      </Card>

      {/* Daftar Voucher */}
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Daftar Voucher ({vouchers.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchVouchers(true)}
                size="sm"
                variant="outline"
                disabled={refreshingVouchers}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshingVouchers ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada voucher</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vouchers.map((voucher) => (
                <div 
                  key={voucher.id}
                  className="relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg bg-white"
                  onClick={() => {
                    setSelectedVoucher(voucher)
                    toast.success(`Voucher dipilih: ${voucher.title}`)
                  }}
                >
                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.statusColor === 'green' ? 'bg-green-100 text-green-800' :
                      voucher.statusColor === 'red' ? 'bg-red-100 text-red-800' :
                      voucher.statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                      voucher.statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        voucher.statusColor === 'green' ? 'bg-green-500' :
                        voucher.statusColor === 'red' ? 'bg-red-500' :
                        voucher.statusColor === 'orange' ? 'bg-orange-500' :
                        voucher.statusColor === 'blue' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      {voucher.statusText || (voucher.isActive ? 'Aktif' : 'Nonaktif')}
                    </div>
                  </div>

                  {/* Voucher Header */}
                  <div className="mb-3 pr-16">
                    <h4 className="font-semibold text-pink-800 text-sm leading-tight mb-1">
                      {voucher.title}
                    </h4>
                    <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded text-xs font-mono">
                      {voucher.code}
                    </div>
                  </div>

                  {/* Voucher Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Diskon:</span>
                      <span className="font-semibold text-pink-600">
                        {voucher.discountType === 'percentage' 
                          ? `${voucher.discountValue}%` 
                          : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Berlaku hingga:</span>
                      <span className="text-gray-700">
                        {new Date(voucher.expiryDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    {voucher.minPurchase && voucher.minPurchase > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Min. pembelian:</span>
                        <span className="text-gray-700">
                          Rp {voucher.minPurchase.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    {voucher.recipientNames && voucher.recipientNames.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 mb-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Penerima ({voucher.recipientNames.length}):</span>
                        </div>
                        <div className="text-blue-600">
                          {voucher.recipientNames.length <= 2 
                            ? voucher.recipientNames.join(', ')
                            : `${voucher.recipientNames.slice(0, 2).join(', ')} +${voucher.recipientNames.length - 2} lainnya`
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {voucher.usageCount || 0} kali digunakan
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingVoucher === voucher.id}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Voucher</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus voucher "{voucher.title}"? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteVoucher(voucher.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Selected Indicator */}
                  {selectedVoucher?.id === voucher.id && (
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-pink-500 text-white rounded-full p-1.5 shadow-lg">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

      {/* Preview Image Dialog */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <img
              src={previewImage.fileUrl}
              alt={previewImage.originalName}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="p-4">
              <h3 className="font-medium truncate">{previewImage.originalName}</h3>
              <p className="text-sm text-gray-500">{formatFileSize(previewImage.fileSize)}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}