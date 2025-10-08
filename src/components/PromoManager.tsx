// PromoManager v2.2 - Added timeout protection for all fetch operations - Build: 2025-10-08
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Checkbox } from './ui/checkbox'
import { Progress } from './ui/progress'
import { 
  Upload, 
  Image as ImageIcon, 
  Send, 
  Users, 
  MessageCircle, 
  X, 
  Eye, 
  Download, 
  Trash2, 
  Edit,
  Ticket,
  Percent,
  DollarSign,
  Clock,
  Phone,
  Copy,
  RefreshCw,
  Sparkles,
  CheckCircle,
  ExternalLink,
  BarChart3,
  User
} from 'lucide-react'
import { VoucherCard } from './VoucherCard'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
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
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function PromoManager({ accessToken }: PromoManagerProps) {
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
  const [voucherSendMode, setVoucherSendMode] = useState<'same' | 'individual'>('same')

  // States for history (only voucher history)
  const [promoHistory, setPromoHistory] = useState<PromoHistory[]>([])
  const [deletingHistory, setDeletingHistory] = useState<string | null>(null)

  // Dialog states
  const [previewImage, setPreviewImage] = useState<PromoImage | null>(null)
  const [historyDetail, setHistoryDetail] = useState<PromoHistory | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⏱️ PromoManager initialization timeout - forcing ready state')
        setLoading(false)
        toast.error('Pemuatan data promo memakan waktu lama. Silakan refresh manual jika diperlukan.')
      }
    }, 15000) // 15 second timeout

    fetchInitialData().finally(() => clearTimeout(timeoutId))
    
    return () => clearTimeout(timeoutId)
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      console.log('🚀 Starting to fetch initial promo data...')
      
      // Fetch with individual timeouts to prevent hanging
      const fetchWithTimeout = (promise: Promise<any>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs)
          )
        ])
      }
      
      // Fetch patients first as it's critical for promo functionality
      await fetchWithTimeout(fetchPatients(), 8000).catch(err => {
        console.warn('Patient fetch timeout/error:', err)
      })
      
      // Then fetch other data with timeout protection
      await Promise.allSettled([
        fetchWithTimeout(fetchPromoImages(), 5000).catch(err => console.warn('Images timeout:', err)),
        fetchWithTimeout(fetchVouchers(), 5000).catch(err => console.warn('Vouchers timeout:', err)),
        fetchWithTimeout(fetchPromoHistory(), 5000).catch(err => console.warn('History timeout:', err))
      ])
      
      console.log('✅ Initial promo data fetch completed (with timeout protection)')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients for promo...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log('Patients response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Patients data received:', data)
        setPatients(data.patients || [])
        console.log(`✅ Loaded ${data.patients?.length || 0} patients for promo`)
      } else {
        console.error('Failed to fetch patients:', response.status, response.statusText)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Patient fetch timed out')
      } else {
        console.error('Error fetching patients:', error)
      }
    }
  }

  const fetchPromoImages = async () => {
    try {
      console.log('Fetching promo images...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/promo-images`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log('Promo images response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Promo images data received:', data)
        setPromoImages(data.images || [])
        console.log(`✅ Loaded ${data.images?.length || 0} promo images`)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Promo images fetch timed out')
      } else {
        console.error('Error fetching promo images:', error)
      }
    }
  }

  const fetchVouchers = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/vouchers`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        // Filter out corrupt vouchers and normalize the remaining data
        const validVouchers = (data.vouchers || []).filter((voucher: any) => {
          // Check if voucher has all required fields and valid data
          const hasValidCode = voucher.code && voucher.code !== 'CORRUPT' && voucher.code.trim() !== ''
          const hasValidTitle = voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && voucher.title.trim() !== ''
          const hasValidDiscountValue = typeof voucher.discountValue === 'number' && voucher.discountValue >= 0
          const hasValidExpiryDate = voucher.expiryDate && voucher.expiryDate !== 'Invalid Date' && !isNaN(new Date(voucher.expiryDate).getTime())
          
          return hasValidCode && hasValidTitle && hasValidDiscountValue && hasValidExpiryDate
        })
        
        // Normalize voucher data to ensure safe number values
        const normalizedVouchers = validVouchers.map((voucher: any) => ({
          ...voucher,
          discountValue: voucher.discountValue || 0,
          usageLimit: voucher.usageLimit || 0,
          usageCount: voucher.usageCount || 0,
          minPurchase: voucher.minPurchase || 0
        }))
        
        console.log(`✅ Loaded ${normalizedVouchers.length} valid vouchers (filtered out ${(data.vouchers || []).length - normalizedVouchers.length} corrupt entries)`)
        setVouchers(normalizedVouchers)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Vouchers fetch timed out')
      } else {
        console.error('Error fetching vouchers:', error)
      }
    }
  }

  const fetchPromoHistory = async () => {
    try {
      console.log('📋 Fetching promo history...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/promo-history`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      console.log('📊 Fetch history response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Raw history data:', data)
        
        // Filter voucher history dan validasi data
        const voucherHistory = (data.history || []).filter((item: PromoHistory) => {
          // Filter hanya voucher history
          if (item.type !== 'voucher') return false
          
          // Filter out corrupt data
          const hasValidTitle = item.title && item.title !== 'Data Corrupt' && item.title !== 'CORRUPT' && item.title.trim() !== ''
          const hasValidDate = item.sentDate && !isNaN(new Date(item.sentDate).getTime())
          const hasValidRecipients = Array.isArray(item.recipientNames) && item.recipientNames.length > 0
          
          return hasValidTitle && hasValidDate && hasValidRecipients
        })
        
        console.log('🎫 Valid voucher history:', voucherHistory.length, 'items')
        console.log('🧹 Filtered out', (data.history || []).length - voucherHistory.length, 'corrupt/invalid entries')
        
        if (voucherHistory.length > 0) {
          console.log('📝 Sample voucher history item:', voucherHistory[0])
        }
        
        setPromoHistory(voucherHistory)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Promo history fetch timed out')
      } else {
        console.error('💥 Error fetching promo history:', error)
      }
    }
  }

  const deletePromoHistory = async (historyId: string) => {
    try {
      console.log('🗑️ Attempting to delete history:', historyId)
      console.log('🔗 Server URL:', serverUrl)
      console.log('🎯 Full delete URL:', `${serverUrl}/promo-history/${historyId}`)
      console.log('🔑 Access token:', accessToken ? 'Present (' + accessToken.substring(0, 20) + '...)' : 'Missing')
      
      setDeletingHistory(historyId)
      
      const response = await fetch(`${serverUrl}/promo-history/${historyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log('🔄 Delete response status:', response.status)
      console.log('🔄 Delete response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Delete successful:', result)
        toast.success('Riwayat berhasil dihapus')
        await fetchPromoHistory()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Delete failed:', response.status, errorData)
        toast.error(`Gagal menghapus riwayat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('💥 Error deleting promo history:', error)
      toast.error('Terjadi kesalahan saat menghapus riwayat')
    } finally {
      setDeletingHistory(null)
    }
  }

  // Image promo functions
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
    
    // Debug logging for promo image
    console.log('Debug Promo Image Info:', {
      selectedImage: selectedImage ? 'YES (' + selectedImage.filename + ')' : 'NO',
      selectedPatients: selectedPatientsImage.length,
      promoTitle: promoTitle,
      totalPatients: patients.length
    })
    
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

      const baseMessage = `��� *${promoTitle}* 🎉

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
        fetchPromoHistory()
      }, totalPatients * 1000)

    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim promo')
      setSendingImage(false)
      setSendProgressImage(0)
    }
  }

  // Voucher functions
  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'DENTAL'
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

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

    try {
      const response = await fetch(`${serverUrl}/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: generateVoucherCode(),
          title: voucherTitle,
          description: voucherDescription,
          discountType,
          discountValue: parseFloat(discountValue),
          expiryDate,
          usageLimit: usageLimit ? parseInt(usageLimit) : 0,
          minPurchase: minPurchase ? parseFloat(minPurchase) : 0
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Voucher berhasil dibuat')
        setVoucherTitle('')
        setVoucherDescription('')
        setDiscountValue('')
        setExpiryDate('')
        setUsageLimit('')
        setMinPurchase('')
        fetchVouchers()
      } else {
        toast.error(data.error || 'Gagal membuat voucher')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat membuat voucher')
    }
  }

  const handleDeleteVoucher = async (voucherId: string, forceDelete = false) => {
    const voucher = vouchers.find(v => v.id === voucherId)
    const isCorrupt = !voucher || !voucher.code || !voucher.title || voucher.discountValue === undefined || voucher.expiryDate === 'Invalid Date'
    
    let confirmMessage = 'Apakah Anda yakin ingin menghapus voucher ini?'
    if (isCorrupt) {
      confirmMessage = 'Voucher ini memiliki data yang corrupt. Apakah Anda yakin ingin menghapusnya?'
    } else if (forceDelete) {
      confirmMessage = 'PERINGATAN: Ini akan menghapus voucher secara paksa beserta semua data terkait. Lanjutkan?'
    }
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingVoucher(voucherId)
      
      const url = forceDelete 
        ? `${serverUrl}/vouchers/${voucherId}?force=true`
        : `${serverUrl}/vouchers/${voucherId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        const message = data.wasCorrupt 
          ? 'Voucher dengan data corrupt berhasil dihapus'
          : (data.deletionType === 'forced' ? 'Voucher berhasil dihapus secara paksa' : 'Voucher berhasil dihapus')
        
        toast.success(message)
        
        // Reset selected voucher if it was deleted
        if (selectedVoucher?.id === voucherId) {
          setSelectedVoucher(null)
        }
        
        fetchVouchers()
      } else {
        // If normal delete fails, offer force delete for admins
        if (data.canForceDelete && !forceDelete) {
          const forceConfirm = confirm(`${data.error}\n\nAnda adalah admin. Apakah Anda ingin menghapus secara paksa?`)
          if (forceConfirm) {
            await handleDeleteVoucher(voucherId, true)
            return
          }
        }
        
        toast.error(data.error || 'Gagal menghapus voucher')
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('Terjadi kesalahan saat menghapus voucher')
    } finally {
      setDeletingVoucher(null)
    }
  }

  const handleMakeAdmin = async () => {
    try {
      const response = await fetch(`${serverUrl}/make-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Berhasil dijadikan admin! Silakan refresh halaman.')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(data.error || 'Gagal mengubah role menjadi admin')
      }
    } catch (error) {
      console.error('Error making admin:', error)
      toast.error('Terjadi kesalahan saat mengubah role')
    }
  }

  const handleCleanupCorruptVouchers = async () => {
    try {
      console.log('🧹 Starting voucher cleanup...')
      
      // First, check what corrupt vouchers exist
      const checkResponse = await fetch(`${serverUrl}/vouchers/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ autoFix: false })
      })

      const checkData = await checkResponse.json()
      
      if (!checkResponse.ok) {
        // If unauthorized, offer to make admin
        if (checkResponse.status === 403 && checkData.error?.includes('administrator')) {
          const makeAdminConfirm = confirm('Anda tidak memiliki permission admin. Apakah Anda ingin dijadikan admin sekarang?')
          if (makeAdminConfirm) {
            await handleMakeAdmin()
            return
          }
        }
        toast.error(checkData.error || 'Gagal memeriksa voucher corrupt')
        return
      }

      if (checkData.corruptVouchers === 0) {
        toast.success('Tidak ada voucher corrupt yang ditemukan')
        return
      }

      // Show confirmation with details
      const corruptList = checkData.corruptData.map((v: any) => 
        `- ID: ${v.id} | Code: ${v.code} | Title: ${v.title} | Value: ${v.discountValue}`
      ).join('\n')
      
      const confirmCleanup = confirm(
        `Ditemukan ${checkData.corruptVouchers} voucher dengan data corrupt:\n\n${corruptList}\n\nApakah Anda yakin ingin menghapus semua voucher corrupt ini?`
      )

      if (!confirmCleanup) {
        return
      }

      // Proceed with cleanup
      const cleanupResponse = await fetch(`${serverUrl}/vouchers/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ autoFix: true })
      })

      const cleanupData = await cleanupResponse.json()
      
      if (cleanupResponse.ok && cleanupData.success) {
        toast.success(`Cleanup berhasil! ${cleanupData.cleanedVouchers} voucher corrupt telah dihapus.`)
        fetchVouchers()
      } else {
        toast.error(cleanupData.error || 'Gagal melakukan cleanup')
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
      toast.error('Terjadi kesalahan saat cleanup voucher')
    }
  }

  const handleCleanupAllCorruptData = async () => {
    try {
      console.log('🧹 Starting comprehensive data cleanup...')
      
      const confirmCleanup = confirm(
        'Apakah Anda yakin ingin membersihkan semua data corrupt (voucher dan riwayat promo)?\n\nTindakan ini tidak dapat dibatalkan.'
      )

      if (!confirmCleanup) {
        return
      }

      const response = await fetch(`${serverUrl}/cleanup-corrupt-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 403) {
          const makeAdminConfirm = confirm('Anda perlu akses admin untuk melakukan cleanup. Apakah Anda ingin dijadikan admin?')
          if (makeAdminConfirm) {
            await handleMakeAdmin()
            return
          }
        }
        toast.error(data.error || 'Gagal melakukan cleanup')
        return
      }

      if (response.ok && data.success) {
        toast.success(`✅ ${data.summary}`)
        
        // Refresh data
        await Promise.all([
          fetchVouchers(),
          fetchPromoHistory()
        ])
        
        console.log('Cleanup results:', data.results)
      } else {
        toast.error(data.error || 'Gagal melakukan cleanup')
      }
    } catch (error) {
      console.error('Error during comprehensive cleanup:', error)
      toast.error('Terjadi kesalahan saat cleanup data')
    }
  }

  // Generate voucher image that exactly matches the VoucherCard preview design
  const generateVoucherImage = (voucher: any): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve('')
        return
      }
      
      // Set canvas dimensions with proper aspect ratio (4:3)
      const width = 800
      const height = 600
      canvas.width = width
      canvas.height = height
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#ec4899')   // Pink
      gradient.addColorStop(0.5, '#8b5cf6') // Purple  
      gradient.addColorStop(1, '#ec4899')   // Pink
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      
      // Inner white rounded rectangle with proper margin
      const margin = 8
      const innerWidth = width - (margin * 2)
      const innerHeight = height - (margin * 2)
      const radius = 24
      
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(margin, margin, innerWidth, innerHeight, radius)
      ctx.fill()
      
      // Enhanced text rendering settings
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Header section
      const headerY = 60
      
      // Draw clinic logo (tooth emoji simulation)
      ctx.fillStyle = '#ec4899'
      ctx.beginPath()
      ctx.roundRect(60, headerY - 20, 32, 32, 6)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🦷', 76, headerY - 4)
      
      // Clinic info (left aligned)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial, sans-serif'
      ctx.fillText('VOUCHER DISKON', 110, headerY - 12)
      
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.fillText('Falasifah Dental Clinic', 110, headerY + 8)
      
      // HEMAT badge (top right)
      const badgeX = width - 120
      const badgeY = headerY - 4
      const badgeGradient = ctx.createLinearGradient(badgeX - 40, badgeY - 15, badgeX + 40, badgeY + 15)
      badgeGradient.addColorStop(0, '#ec4899')
      badgeGradient.addColorStop(1, '#8b5cf6')
      
      ctx.fillStyle = badgeGradient
      ctx.beginPath()
      ctx.roundRect(badgeX - 40, badgeY - 15, 80, 30, 15)
      ctx.fill()
      
      const discountText = voucher.discountType === 'percentage' 
        ? `${voucher.discountValue || 0}%`
        : `Rp ${(voucher.discountValue || 0).toLocaleString('id-ID')}`
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`HEMAT ${discountText}`, badgeX, badgeY)
      
      // Main title
      const titleY = 160
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      
      // Auto-adjust font size for long titles
      let titleFont = 32
      let titleMetrics = ctx.measureText(voucher.title || '')
      while (titleMetrics.width > width - 100 && titleFont > 20) {
        titleFont -= 2
        ctx.font = `bold ${titleFont}px Arial, sans-serif`
        titleMetrics = ctx.measureText(voucher.title || '')
      }
      
      ctx.fillText(voucher.title || '', width / 2, titleY)
      
      // Voucher code box with dashed border (moved up slightly)
      const codeBoxY = 220
      const codeBoxWidth = 200
      const codeBoxHeight = 60
      const codeBoxX = (width - codeBoxWidth) / 2
      
      // Dashed border effect
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 3
      ctx.setLineDash([8, 8])
      ctx.strokeRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight)
      ctx.setLineDash([]) // Reset
      
      // Code box background
      ctx.fillStyle = '#f9fafb'
      ctx.fillRect(codeBoxX + 2, codeBoxY + 2, codeBoxWidth - 4, codeBoxHeight - 4)
      
      // Code label
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial, sans-serif'
      ctx.fillText('Kode Voucher', width / 2, codeBoxY + 20)
      
      // Code text
      ctx.fillStyle = '#ec4899'
      ctx.font = 'bold 24px Arial, sans-serif'
      ctx.fillText(voucher.code || '', width / 2, codeBoxY + 45)
      
      // Description/subtitle positioned below voucher code
      ctx.fillStyle = '#6b7280'
      ctx.font = '16px Arial, sans-serif'
      const subtitle = voucher.description && voucher.description.trim() !== '' && voucher.description.length <= 50 
        ? voucher.description 
        : 'Syarat dan ketentuan berlaku'
      ctx.fillText(subtitle, width / 2, codeBoxY + 85)
      
      // Two-column section for discount and expiry (raised higher)
      const bottomSectionY = 350
      
      // Left column - Discount (Label di atas dengan spacing proporsional)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText('DISKON', width * 0.3, bottomSectionY - 15)
      
      ctx.fillStyle = '#ec4899'
      ctx.font = 'bold 48px Arial, sans-serif'
      ctx.fillText(discountText, width * 0.3, bottomSectionY + 15)
      
      // Right column - Expiry (Label di atas dengan spacing proporsional)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText('BERLAKU HINGGA', width * 0.7, bottomSectionY - 15)
      
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 20px Arial, sans-serif'
      const expiryText = new Date(voucher.expiryDate).toLocaleDateString('id-ID')
      ctx.fillText(expiryText, width * 0.7, bottomSectionY + 5)
      
      // Bottom info sections (raised higher)
      let bottomInfoY = 450
      
      // Minimum purchase
      ctx.fillStyle = '#d97706'
      ctx.font = 'bold 16px Arial, sans-serif'
      const minPurchaseText = voucher.minPurchase && voucher.minPurchase > 0
        ? `💰 Minimal pembelian: Rp ${voucher.minPurchase.toLocaleString('id-ID')}`
        : '💰 Minimal pembelian: Rp 300.000'
      ctx.fillText(minPurchaseText, width / 2, bottomInfoY)
      
      // Usage limit
      bottomInfoY += 25
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 16px Arial, sans-serif'
      const usageText = voucher.usageLimit && voucher.usageLimit > 0
        ? `🎫 Terbatas untuk ${voucher.usageLimit} penggunaan pertama`
        : '🎫 Terbatas untuk 1 penggunaan pertama'
      ctx.fillText(usageText, width / 2, bottomInfoY)
      
      // Subtle decorative elements
      ctx.fillStyle = 'rgba(236, 72, 153, 0.1)'
      ctx.font = '24px Arial, sans-serif'
      ctx.fillText('✨', 80, 120)
      ctx.fillText('🎁', width - 80, 500)
      
      resolve(canvas.toDataURL('image/png', 0.95))
    })
  }

  const handleSendVoucher = async () => {
    console.log('🚀 handleSendVoucher called')
    console.log('Selected voucher:', selectedVoucher)
    console.log('Selected patients voucher:', selectedPatientsVoucher)
    console.log('Patients data length:', patients.length)
    
    // Debug logging voucher 
    console.log('Debug Voucher Info:', {
      selectedVoucher: selectedVoucher ? 'YES (' + selectedVoucher.title + ')' : 'NO',
      selectedPatients: selectedPatientsVoucher.length,
      totalPatients: patients.length
    })
    
    if (!selectedVoucher) {
      console.log('❌ No voucher selected')
      toast.error('Pilih voucher terlebih dahulu')
      return
    }

    if (selectedPatientsVoucher.length === 0) {
      console.log('❌ No patients selected for voucher')
      toast.error('Pilih minimal satu pasien')
      return
    }

    try {
      console.log('✅ All voucher validations passed, generating voucher image...')
      setSendingVoucher(true)
      setSendProgressVoucher(0)
      setVoucherSendMode('same')
      
      // Generate voucher image
      const voucherImageDataUrl = await generateVoucherImage(selectedVoucher)
      console.log('📸 Voucher image generated as data URL')
      
      // Upload voucher image to server to get public URL
      console.log('📤 Uploading voucher image to server...')
      
      let publicVoucherImageUrl = null
      try {
        const uploadResponse = await fetch(`${serverUrl}/vouchers/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            imageData: voucherImageDataUrl,
            voucherCode: selectedVoucher.code,
            voucherTitle: selectedVoucher.title
          })
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`)
        }

        const uploadData = await uploadResponse.json()
        
        if (!uploadData.success || !uploadData.imageUrl) {
          throw new Error('Upload response missing image URL')
        }

        publicVoucherImageUrl = uploadData.imageUrl
        console.log('✅ Voucher image uploaded successfully:', publicVoucherImageUrl)
        
        toast.success('Gambar voucher berhasil dibuat dan siap dikirim ke WhatsApp!')
        
      } catch (uploadError) {
        console.error('❌ Error uploading voucher image:', uploadError)
        toast.error('Gagal mengunggah gambar voucher. Menggunakan mode fallback.')
      }
      
      const selectedPatientsData = patients.filter(p => selectedPatientsVoucher.includes(p.id))
      const totalPatients = selectedPatientsData.length

      const discountText = selectedVoucher.discountType === 'percentage' 
        ? `${selectedVoucher.discountValue || 0}%`
        : `Rp ${(selectedVoucher.discountValue || 0).toLocaleString('id-ID')}`

      const minPurchaseText = selectedVoucher.minPurchase 
        ? `\n💰 Minimal pembelian: Rp ${(selectedVoucher.minPurchase || 0).toLocaleString('id-ID')}`
        : ''

      const usageLimitText = selectedVoucher.usageLimit > 0
        ? `\n🎫 Terbatas untuk ${selectedVoucher.usageLimit} penggunaan pertama`
        : ''

      const baseMessage = `🎉 *VOUCHER DISKON SPESIAL* 🎉

✨ ${selectedVoucher.title} ✨

${selectedVoucher.description ? selectedVoucher.description + '\n\n' : ''}🏷️ *Kode Voucher:* ${selectedVoucher.code}
🎯 *Diskon:* ${discountText}${minPurchaseText}${usageLimitText}
⏰ *Berlaku hingga:* ${new Date(selectedVoucher.expiryDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}

${publicVoucherImageUrl ? `🖼️ *Gambar Voucher:* ${publicVoucherImageUrl}

📋 *Gambar voucher sudah siap!* Klik link di atas untuk melihat dan download voucher visual Anda.` : '📎 *PENTING: Gambar voucher sudah didownload ke komputer Anda. Silakan kirim gambar voucher tersebut setelah mengirim pesan ini.*'}

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355
🕒 *Jam Buka:* Senin - Sabtu, 08:00 - 20:00

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang
2. Berlaku untuk semua treatment
3. Tidak dapat digabung dengan promo lain

*Buruan datang sebelum voucher habis!* 🦷✨

#FalasifhDental #VoucherDiskon #PerawatanGigi`

      console.log('📝 Base voucher message created:', baseMessage.substring(0, 100) + '...')

      for (let i = 0; i < selectedPatientsData.length; i++) {
        const patient = selectedPatientsData[i]
        console.log(`📞 Processing voucher patient ${i + 1}/${totalPatients}:`, patient.name, patient.phone)
        
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

        setSendProgressVoucher(Math.round(((i + 1) / totalPatients) * 100))
      }

      setTimeout(async () => {
        await logPromoActivity('voucher', selectedVoucher.title, selectedPatientsData, publicVoucherImageUrl, selectedVoucher.code)
        
        // Show success message with icon test
        const successMessage = publicVoucherImageUrl 
          ? `✅ Voucher dengan gambar berhasil dikirim ke ${selectedPatientsData.length} pasien! 🎉` 
          : `📤 Voucher berhasil dikirim ke ${selectedPatientsData.length} pasien!`
        
        toast.success(successMessage)
        
        setSendingVoucher(false)
        setSendProgressVoucher(0)
        // Reset selections after successful send
        setSelectedVoucher(null)
        setSelectedPatientsVoucher([])
        await fetchPromoHistory()
      }, totalPatients * 1000)

    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim voucher')
      setSendingVoucher(false)
      setSendProgressVoucher(0)
    }
  }

  const logPromoActivity = async (type: 'image' | 'voucher', title: string, recipients: Patient[], imageUrl?: string, voucherCode?: string) => {
    try {
      await fetch(`${serverUrl}/promo-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          type,
          title,
          recipientCount: recipients.length,
          recipientNames: recipients.map(p => p.name),
          recipientPhones: recipients.map(p => p.phone),
          imageUrl,
          voucherCode
        })
      })
    } catch (error) {
      console.error('Failed to log promo activity:', error)
    }
  }

  // Handle sending voucher with unique codes per patient
  const handleSendVoucherPerPatient = async () => {
    console.log('🎫 handleSendVoucherPerPatient called')
    console.log('Selected voucher:', selectedVoucher)
    console.log('Selected patients voucher:', selectedPatientsVoucher)
    
    if (!selectedVoucher) {
      console.log('❌ No voucher selected')
      toast.error('Pilih voucher terlebih dahulu')
      return
    }

    if (selectedPatientsVoucher.length === 0) {
      console.log('❌ No patients selected for voucher')
      toast.error('Pilih minimal satu pasien')
      return
    }

    try {
      console.log('✅ Starting voucher per patient generation...')
      setSendingVoucher(true)
      setSendProgressVoucher(0)
      setVoucherSendMode('individual')
      
      // Generate unique voucher codes per patient
      const generateResponse = await fetch(`${serverUrl}/vouchers/generate-per-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          voucherId: selectedVoucher.id,
          patientIds: selectedPatientsVoucher,
          mode: 'individual'
        })
      })

      if (!generateResponse.ok) {
        throw new Error(`Failed to generate voucher codes: ${generateResponse.status}`)
      }

      const generateData = await generateResponse.json()
      
      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate voucher codes')
      }

      console.log('✅ Generated unique codes:', generateData.generatedCodes)
      toast.success(`Generated ${generateData.count} unique voucher codes`)

      // Generate voucher image template (we'll customize per patient)
      const voucherImageDataUrl = await generateVoucherImage(selectedVoucher)
      
      // Process each patient with their unique code
      const generatedCodes = generateData.generatedCodes
      const totalPatients = generatedCodes.length

      const discountText = selectedVoucher.discountType === 'percentage' 
        ? `${selectedVoucher.discountValue || 0}%`
        : `Rp ${(selectedVoucher.discountValue || 0).toLocaleString('id-ID')}`

      const minPurchaseText = selectedVoucher.minPurchase 
        ? `\n💰 Minimal pembelian: Rp ${(selectedVoucher.minPurchase || 0).toLocaleString('id-ID')}`
        : ''

      for (let i = 0; i < generatedCodes.length; i++) {
        const codeData = generatedCodes[i]
        console.log(`📞 Processing voucher patient ${i + 1}/${totalPatients}:`, codeData.patientName, codeData.voucherCode)
        
        // Generate personalized voucher image with unique code
        const personalizedVoucherImage = await generateVoucherImage({
          ...selectedVoucher,
          code: codeData.voucherCode // Use unique code for each patient
        })

        // Upload personalized voucher image
        let publicVoucherImageUrl = null
        try {
          const uploadResponse = await fetch(`${serverUrl}/vouchers/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              imageData: personalizedVoucherImage,
              voucherCode: codeData.voucherCode,
              voucherTitle: `${selectedVoucher.title} - ${codeData.patientName}`
            })
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            if (uploadData.success && uploadData.imageUrl) {
              publicVoucherImageUrl = uploadData.imageUrl
            }
          }
        } catch (uploadError) {
          console.log('Upload error for patient:', codeData.patientName, uploadError)
        }

        // Create personalized message
        const personalizedMessage = `Halo ${codeData.patientName}!

🎉 *VOUCHER DISKON SPESIAL KHUSUS UNTUK ANDA* 🎉

✨ ${selectedVoucher.title} ✨

${selectedVoucher.description ? selectedVoucher.description + '\n\n' : ''}🏷️ *Kode Voucher Pribadi:* ${codeData.voucherCode}
🎯 *Diskon:* ${discountText}${minPurchaseText}
⏰ *Berlaku hingga:* ${new Date(selectedVoucher.expiryDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}

${publicVoucherImageUrl ? `🖼️ *Gambar Voucher:* ${publicVoucherImageUrl}

📋 *Voucher pribadi Anda sudah siap!* Klik link di atas untuk melihat dan download voucher visual Anda.` : '📎 *PENTING: Gambar voucher sudah didownload ke komputer. Silakan kirim gambar voucher tersebut setelah mengirim pesan ini.*'}

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355
🕒 *Jam Buka:* Senin - Sabtu, 08:00 - 20:00

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang: ${codeData.voucherCode}
2. Berlaku untuk semua treatment
3. Tidak dapat digabung dengan promo lain

*Kode ini khusus untuk ${codeData.patientName} dan tidak dapat dipindahtangankan!* 🦷✨

#FalasifaDental #VoucherDiskon #PerawatanGigi`

        let cleanPhone = codeData.patientPhone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1)
        } else if (!cleanPhone.startsWith('62')) {
          cleanPhone = '62' + cleanPhone
        }

        setTimeout(() => {
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`
          window.open(whatsappUrl, `_blank_voucher_${i}`)
        }, i * 1500) // Slightly longer delay for voucher processing

        setSendProgressVoucher(Math.round(((i + 1) / totalPatients) * 100))
      }

      setTimeout(async () => {
        // Log the activity with individual codes for each patient
        for (const codeData of generatedCodes) {
          await logPromoActivity(
            'voucher', 
            selectedVoucher.title, 
            patients.filter(p => p.id === codeData.patientId), 
            null, 
            codeData.voucherCode // Use actual unique code instead of generic text
          )
        }
        
        toast.success(`✅ Voucher dengan kode unik berhasil dikirim ke ${generatedCodes.length} pasien! 🎉`)
        
        // Auto refresh voucher reminder list after successful send
        try {
          // Trigger refresh event that can be caught by VoucherReminderList
          window.dispatchEvent(new CustomEvent('voucherSent', { 
            detail: { 
              codes: generatedCodes,
              voucherTitle: selectedVoucher.title,
              count: generatedCodes.length
            }
          }))
        } catch (error) {
          console.log('Failed to dispatch voucher sent event:', error)
        }
        
        setSendingVoucher(false)
        setSendProgressVoucher(0)
        // Reset selections after successful send
        setSelectedVoucher(null)
        setSelectedPatientsVoucher([])
        await fetchPromoHistory()
      }, totalPatients * 1500)

    } catch (error) {
      console.error('Error sending voucher per patient:', error)
      toast.error('Terjadi kesalahan saat mengirim voucher per pasien')
      setSendingVoucher(false)
      setSendProgressVoucher(0)
    }
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

  // Debug logging - tampilkan info patients
  console.log('Promo Debug - Total patients:', patients.length)
  console.log('Promo Debug - Search term image:', searchTermImage)
  console.log('Promo Debug - Filtered patients image:', filteredPatientsImage.length)
  console.log('Promo Debug - Search term voucher:', searchTermVoucher)
  console.log('Promo Debug - Filtered patients voucher:', filteredPatientsVoucher.length)

  // History sudah difilter hanya voucher di fetchPromoHistory
  const filteredHistory = promoHistory

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
          <h2 className="text-2xl text-pink-800">Manajemen Promo</h2>
          <p className="text-pink-600 text-sm">Kelola promo gambar dan voucher diskon untuk pasien klinik</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-pink-200 text-pink-700">
            {patients.length} Pasien Aktif
          </Badge>
          <Badge variant="outline" className="border-purple-200 text-purple-700">
            {vouchers.length} Voucher Tersedia
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMakeAdmin}
            className="border-green-200 text-green-700 hover:bg-green-50"
            title="Jadikan Admin (jika belum)"
          >
            <User className="h-4 w-4" />
          </Button>
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
            Voucher Diskon
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

        {/* Tab 2: Voucher */}
        <TabsContent value="voucher" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column - Create Voucher */}
            <div className="space-y-6">
              <Card className="border-pink-200">
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
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
                      <Label>Tipe Diskon *</Label>
                      <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Nilai Diskon *</Label>
                      <Input
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '10' : '50000'}
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Kadaluarsa *</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batas Penggunaan</Label>
                      <Input
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)}
                        placeholder="0 = tidak terbatas"
                        type="number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Minimal Pembelian</Label>
                      <Input
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(e.target.value)}
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateVoucher}
                    className="w-full"
                  >
                    <Ticket className="h-5 w-5 mr-2" />
                    Buat Voucher
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Voucher List */}
            <div className="space-y-6">
              <Card className="border-pink-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Daftar Voucher ({vouchers.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleCleanupCorruptVouchers} 
                        size="sm" 
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        title="Bersihkan voucher dengan data corrupt"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Cleanup
                      </Button>
                      <Button onClick={fetchVouchers} size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-1" />
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
                    <div className="space-y-3">
                      {vouchers.map((voucher) => (
                        <div key={voucher.id} className="relative">
                          <VoucherCard
                            voucher={voucher}
                            variant="compact"
                            selected={selectedVoucher?.id === voucher.id}
                            onClick={() => {
                              // Normalize voucher data when selecting
                              const normalizedVoucher = {
                                ...voucher,
                                discountValue: voucher.discountValue || 0,
                                usageLimit: voucher.usageLimit || 0,
                                usageCount: voucher.usageCount || 0,
                                minPurchase: voucher.minPurchase || 0
                              }
                              setSelectedVoucher(normalizedVoucher)
                              toast.success(`Voucher dipilih: ${voucher.title}`)
                            }}
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Normalize voucher data when previewing
                                const normalizedVoucher = {
                                  ...voucher,
                                  discountValue: voucher.discountValue || 0,
                                  usageLimit: voucher.usageLimit || 0,
                                  usageCount: voucher.usageCount || 0,
                                  minPurchase: voucher.minPurchase || 0
                                }
                                setPreviewVoucher(normalizedVoucher)
                              }}
                              className="h-8 w-8 p-0 hover:bg-pink-100"
                              title="Preview Voucher"
                            >
                              <Eye className="h-4 w-4 text-pink-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteVoucher(voucher.id)
                              }}
                              disabled={deletingVoucher === voucher.id}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                              title="Hapus Voucher"
                            >
                              {deletingVoucher === voucher.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voucher Preview & Patient Selection */}
              {selectedVoucher && (
                <div className="space-y-6">
                  {/* Voucher Preview */}
                  <Card className="border-pink-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Preview Voucher
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-md mx-auto">
                        <VoucherCard voucher={selectedVoucher} variant="preview" showUsage={false} />
                      </div>
                      <div className="mt-4 text-center">
                        <Button
                          onClick={() => {
                            if (selectedVoucher) {
                              // Normalize voucher data when previewing from selected voucher
                              const normalizedVoucher = {
                                ...selectedVoucher,
                                discountValue: selectedVoucher.discountValue || 0,
                                usageLimit: selectedVoucher.usageLimit || 0,
                                usageCount: selectedVoucher.usageCount || 0,
                                minPurchase: selectedVoucher.minPurchase || 0
                              }
                              setPreviewVoucher(normalizedVoucher)
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-pink-600 border-pink-300 hover:bg-pink-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Lihat Full Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient Selection */}
                  <Card className="border-pink-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pilih Penerima Voucher ({selectedPatientsVoucher.length} dipilih)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-pink-800">Voucher yang akan dikirim:</p>
                            <p className="text-sm text-pink-700">{selectedVoucher.title}</p>
                            <p className="text-xs text-pink-600 font-mono bg-white px-2 py-1 rounded mt-1 inline-block">
                              {selectedVoucher.code}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-pink-600">
                              {selectedVoucher.discountType === 'percentage' 
                                ? `${selectedVoucher.discountValue || 0}%`
                                : `Rp ${(selectedVoucher.discountValue || 0).toLocaleString('id-ID')}`
                              }
                            </p>
                            <p className="text-xs text-pink-600">DISKON</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="searchPatientsVoucher">Cari Pasien (Nama, Telepon, atau No. RM)</Label>
                        <Input
                          id="searchPatientsVoucher"
                          value={searchTermVoucher}
                          onChange={(e) => setSearchTermVoucher(e.target.value)}
                          placeholder="Ketik untuk mencari pasien..."
                          className="focus:border-pink-400 focus:ring-pink-200"
                        />
                      </div>

                      <div className="flex items-center space-x-2 py-2 border-b border-pink-200">
                        <Checkbox
                          id="selectAllVoucher"
                          checked={selectedPatientsVoucher.length === filteredPatientsVoucher.length && filteredPatientsVoucher.length > 0}
                          onCheckedChange={handleSelectAllPatientsVoucher}
                        />
                        <Label htmlFor="selectAllVoucher" className="text-pink-700">
                          Pilih Semua ({filteredPatientsVoucher.length} pasien)
                        </Label>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
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
                        ) : filteredPatientsVoucher.length === 0 ? (
                          <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600">Tidak ada pasien yang ditemukan</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Coba ubah kata kunci pencarian
                            </p>
                          </div>
                        ) : (
                          filteredPatientsVoucher.map((patient) => (
                            <div
                              key={patient.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-pink-50 transition-colors"
                            >
                              <Checkbox
                                id={`voucher_${patient.id}`}
                                checked={selectedPatientsVoucher.includes(patient.id)}
                                onCheckedChange={(checked) => handlePatientSelectVoucher(patient.id, checked as boolean)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{patient.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  <span>{patient.phone}</span>
                                  <span>•</span>
                                  <span>{patient.medicalRecordNumber}</span>
                                </div>
                              </div>
                              {selectedPatientsVoucher.includes(patient.id) && (
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-700 mb-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-medium">Mode Pengiriman Voucher</span>
                          </div>
                          <p className="text-xs text-blue-600">
                            <strong>Kode Sama:</strong> Semua pasien mendapat kode voucher yang sama<br/>
                            <strong>Kode Per Pasien:</strong> Setiap pasien mendapat kode voucher unik pribadi
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={handleSendVoucher}
                            disabled={selectedPatientsVoucher.length === 0 || sendingVoucher}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                            size="lg"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {sendingVoucher ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              <>Kode Sama<br/><span className="text-xs opacity-90">({selectedPatientsVoucher.length} pasien)</span></>
                            )}
                          </Button>

                          <Button
                            onClick={handleSendVoucherPerPatient}
                            disabled={selectedPatientsVoucher.length === 0 || sendingVoucher}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                            size="lg"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {sendingVoucher ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>Kode Per Pasien<br/><span className="text-xs opacity-90">({selectedPatientsVoucher.length} unik)</span></>
                            )}
                          </Button>
                        </div>
                      </div>

                      {sendingVoucher && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-600 flex items-center gap-1">
                              <div className="animate-pulse h-2 w-2 bg-purple-500 rounded-full"></div>
                              {voucherSendMode === 'individual' 
                                ? 'Generating kode unik & mengirim voucher...' 
                                : 'Mengirim voucher ke pasien...'}
                            </span>
                            <span className="text-purple-600 font-semibold">{sendProgressVoucher}%</span>
                          </div>
                          <Progress value={sendProgressVoucher} className="h-3 bg-purple-100">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"></div>
                          </Progress>
                          <p className="text-xs text-gray-600 text-center">
                            {voucherSendMode === 'individual' 
                              ? 'Setiap pasien mendapat kode voucher unik & gambar personal'
                              : 'Tab WhatsApp akan terbuka otomatis untuk setiap pasien'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={previewImage !== null} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Gambar Promo</DialogTitle>
            <DialogDescription>
              Lihat preview gambar promo yang akan dikirim kepada pasien.
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <img
                src={previewImage.fileUrl}
                alt={previewImage.originalName}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              <div className="text-sm text-gray-600">
                <p>Nama: {previewImage.originalName}</p>
                <p>Ukuran: {formatFileSize(previewImage.fileSize)}</p>
                <p>Upload: {previewImage.uploadDate ? new Date(previewImage.uploadDate).toLocaleString('id-ID') : 'Unknown'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Voucher Preview Dialog */}
      <Dialog open={previewVoucher !== null} onOpenChange={() => setPreviewVoucher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              Preview Voucher
            </DialogTitle>
            <DialogDescription>
              Lihat preview voucher diskon dan pesan WhatsApp yang akan dikirim kepada pasien.
            </DialogDescription>
          </DialogHeader>
          {previewVoucher && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto">
                <VoucherCard voucher={previewVoucher} variant="preview" showUsage={false} />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Preview Pesan WhatsApp:</h4>
                <div className="bg-white border rounded-lg p-3 text-sm">
                  <div className="whitespace-pre-wrap text-gray-700">
{`🎉 *VOUCHER DISKON SPESIAL* 🎉

✨ ${previewVoucher.title} ✨

${previewVoucher.description ? previewVoucher.description + '\n\n' : ''}🏷️ *Kode Voucher:* ${previewVoucher.code}
🎯 *Diskon:* ${previewVoucher.discountType === 'percentage' 
  ? `${previewVoucher.discountValue}%`
  : `Rp ${previewVoucher.discountValue.toLocaleString('id-ID')}`}${previewVoucher.minPurchase 
  ? `\n💰 Minimal pembelian: Rp ${previewVoucher.minPurchase.toLocaleString('id-ID')}`
  : ''}${previewVoucher.usageLimit > 0
  ? `\n🎫 Terbatas untuk ${previewVoucher.usageLimit} penggunaan pertama`
  : ''}
⏰ *Berlaku hingga:* ${new Date(previewVoucher.expiryDate).toLocaleDateString('id-ID', { 
  day: '2-digit', 
  month: 'long', 
  year: 'numeric' 
})}

📍 *Falasifah Dental Clinic*
📞 *WhatsApp:* 085283228355
🕒 *Jam Buka:* Senin - Sabtu, 08:00 - 20:00

💡 *Cara Pakai:*
1. Tunjukkan kode voucher saat datang
2. Berlaku untuk semua treatment
3. Tidak dapat digabung dengan promo lain

*Buruan datang sebelum voucher habis!* 🦷✨

#FalasifhDental #VoucherDiskon #PerawatanGigi`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={historyDetail !== null} onOpenChange={() => setHistoryDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Riwayat Pengiriman</DialogTitle>
            <DialogDescription>
              Lihat detail lengkap dari riwayat pengiriman promo yang telah dilakukan.
            </DialogDescription>
          </DialogHeader>
          {historyDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe</Label>
                  <p className="text-sm">{historyDetail.type === 'image' ? 'Promo Gambar' : 'Voucher Diskon'}</p>
                </div>
                <div>
                  <Label>Judul</Label>
                  <p className="text-sm">{historyDetail.title}</p>
                </div>
                <div>
                  <Label>Tanggal Kirim</Label>
                  <p className="text-sm">{historyDetail.sentDate ? new Date(historyDetail.sentDate).toLocaleString('id-ID') : 'Unknown'}</p>
                </div>
                <div>
                  <Label>Total Penerima</Label>
                  <p className="text-sm">{historyDetail.recipientCount} pasien</p>
                </div>
              </div>

              {historyDetail.voucherCode && (
                <div>
                  <Label>Kode Voucher</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{historyDetail.voucherCode}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(historyDetail.voucherCode!)
                        toast.success('Kode voucher disalin')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label>Daftar Penerima</Label>
                <div className="max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                  {historyDetail.recipientNames.map((name, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium">{name}</span>
                      <span className="text-gray-500 text-sm">{historyDetail.recipientPhones[index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}