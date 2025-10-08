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
  History,
  Gift,
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
  User,
  AlertTriangle
} from 'lucide-react'
import { VoucherCard } from './VoucherCard'
import { VoucherUsageHistory } from './VoucherUsageHistory'
import { VoucherStatusList } from './VoucherStatusListFixed'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
import voucherTemplateImage from 'figma:asset/373c2a6004c8c8e8d79b097dbfc91b332180b362.png'

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  medicalRecordNumber?: string
}

interface PromoImage {
  id: string
  filename: string
  originalName: string
  fileUrl: string
  uploadDate: string
  fileSize: number
  mimeType: string
  uploadedBy?: string
  created_at: string
}

interface Voucher {
  id: string
  code: string
  title: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  usageLimit: number
  usageCount: number
  isActive: boolean
  createdDate: string
  createdBy?: string
  minPurchase: number
  created_at: string
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
  created_at: string
}

interface PromoManagerProps {
  accessToken: string
  refreshTrigger: number
}

export function PromoManagerFixed({ accessToken, refreshTrigger }: PromoManagerProps) {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [promoImages, setPromoImages] = useState<PromoImage[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [promoHistory, setPromoHistory] = useState<PromoHistory[]>([])

  // Image promo states
  const [selectedImage, setSelectedImage] = useState<PromoImage | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [promoTitle, setPromoTitle] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [selectedPatientsImage, setSelectedPatientsImage] = useState<string[]>([])
  const [searchTermImage, setSearchTermImage] = useState('')
  const [sendingImage, setSendingImage] = useState(false)
  const [sendProgressImage, setSendProgressImage] = useState(0)

  // Voucher states
  const [voucherForm, setVoucherForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    expiryDate: '',
    usageLimit: 0,
    minPurchase: 0
  })
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [selectedPatientsVoucher, setSelectedPatientsVoucher] = useState<string[]>([])
  const [searchTermVoucher, setSearchTermVoucher] = useState('')
  const [sendingVoucher, setSendingVoucher] = useState(false)
  const [sendProgressVoucher, setSendProgressVoucher] = useState(0)
  const [voucherSendMode, setVoucherSendMode] = useState<'individual' | 'bulk'>('individual')
  const [deletingVoucher, setDeletingVoucher] = useState<string | null>(null)

  // Dialog states
  const [previewImage, setPreviewImage] = useState<PromoImage | null>(null)
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null)
  const [historyDetail, setHistoryDetail] = useState<PromoHistory | null>(null)
  const [deletingHistory, setDeletingHistory] = useState<string | null>(null)

  useEffect(() => {
    if (accessToken) {
      fetchInitialData()
    }
  }, [accessToken, refreshTrigger])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchPatients(),
        fetchPromoImages(),
        fetchVouchers(),
        fetchPromoHistory()
      ])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...')
      const response = await fetch(`${serverUrl}/patients`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      console.log('Patients response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Patients data received:', data)
        setPatients(data.patients || [])
        console.log(`✅ Loaded ${data.patients?.length || 0} patients`)
      } else {
        console.error('Failed to fetch patients:', response.status, response.statusText)
        toast.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Terjadi kesalahan saat memuat data pasien')
    }
  }

  const fetchPromoImages = async () => {
    try {
      console.log('Fetching promo images...')
      const response = await fetch(`${serverUrl}/promo-images`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      console.log('Promo images response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Promo images data received:', data)
        setPromoImages(data.images || [])
        console.log(`✅ Loaded ${data.images?.length || 0} promo images`)
      } else {
        console.error('Failed to fetch promo images:', response.status, response.statusText)
        toast.error('Gagal memuat gambar promo')
      }
    } catch (error) {
      console.error('Error fetching promo images:', error)
      toast.error('Terjadi kesalahan saat memuat gambar promo')
    }
  }

  const fetchVouchers = async () => {
    try {
      const response = await fetch(`${serverUrl}/vouchers`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        const validVouchers = (data.vouchers || []).filter((voucher: any) => {
          const hasValidCode = voucher.code && voucher.code !== 'CORRUPT' && voucher.code.trim() !== ''
          const hasValidTitle = voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && voucher.title.trim() !== ''
          const hasValidDiscountValue = typeof voucher.discountValue === 'number' && voucher.discountValue >= 0
          const hasValidExpiryDate = voucher.expiryDate && voucher.expiryDate !== 'Invalid Date' && !isNaN(new Date(voucher.expiryDate).getTime())
          
          return hasValidCode && hasValidTitle && hasValidDiscountValue && hasValidExpiryDate
        })
        
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
      console.error('Error fetching vouchers:', error)
    }
  }

  const fetchPromoHistory = async () => {
    try {
      console.log('📋 Fetching promo history...')
      const response = await fetch(`${serverUrl}/promo-history`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log('📊 Fetch history response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Raw history data:', data)
        
        const voucherHistory = (data.history || []).filter((item: PromoHistory) => {
          if (item.type !== 'voucher') return false
          
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
      } else {
        console.error('❌ Failed to fetch history:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching promo history:', error)
    }
  }

  // **FIXED FUNCTION - Handle Image Promo Send with proper base64 detection**
  const handleSendImagePromo = async () => {
    console.log('🚀 Sending image promo...')
    
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

      // **KEY FIX**: Check if we have a valid image URL (not base64 data URL)
      const isValidImageUrl = selectedImage.fileUrl && !selectedImage.fileUrl.startsWith('data:')
      console.log('🖼️ Image URL check:', { 
        fileUrl: selectedImage.fileUrl?.substring(0, 50) + '...', 
        isValid: isValidImageUrl,
        isBase64: selectedImage.fileUrl?.startsWith('data:')
      })

      // Show appropriate warning/info to user
      if (!isValidImageUrl) {
        toast.info('⚠️ Gambar promo disimpan sebagai data internal. WhatsApp akan menerima pesan teks tanpa link gambar.', {
          duration: 5000
        })
      }

      // **IMPROVED MESSAGE**: Create different messages based on image availability
      const baseMessage = isValidImageUrl 
        ? `🎉 *${promoTitle}* 🎉

${promoMessage ? promoMessage + '\n\n' : ''}🖼️ Lihat gambar promo: ${selectedImage.fileUrl}

📍 Falasifah Dental Clinic
📞 WhatsApp: 085283228355

Jangan lewatkan penawaran terbatas ini!

Terima kasih! 🦷✨`
        : `🎉 *${promoTitle}* 🎉

${promoMessage ? promoMessage + '\n\n' : ''}🖼️ Gambar promo tersedia di klinik kami - silakan tunjukkan pada saat kunjungan

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
        
        // **IMPROVED SUCCESS MESSAGE**: Different messages based on image type
        const successMessage = isValidImageUrl 
          ? `✅ Promo gambar dengan link berhasil dikirim ke ${selectedPatientsData.length} pasien`
          : `📤 Promo berhasil dikirim ke ${selectedPatientsData.length} pasien (gambar tersimpan internal)`
        
        toast.success(successMessage)
        setSendingImage(false)
        setSendProgressImage(0)
        
        // Reset form after successful send
        setPromoTitle('')
        setPromoMessage('')
        setSelectedPatientsImage([])
        setSelectedImage(null)
        
        fetchPromoHistory()
      }, totalPatients * 1000)

    } catch (error) {
      console.error('💥 Error in handleSendImagePromo:', error)
      toast.error(`Terjadi kesalahan saat mengirim promo: ${error.message}`)
      setSendingImage(false)
      setSendProgressImage(0)
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
          
          // **ADDED WARNING**: Check if uploaded image is stored as base64
          if (data.imageData.fileUrl && data.imageData.fileUrl.startsWith('data:')) {
            toast.warning('⚠️ Gambar disimpan sebagai data internal. WhatsApp tidak dapat menampilkan link gambar.', {
              duration: 6000
            })
          }
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
        
        if (selectedImage?.id === imageId) {
          setSelectedImage(null)
        }
        
        fetchPromoImages()
      } else {
        toast.error(data.error || 'Gagal menghapus gambar')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus gambar')
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
      console.error('Error logging promo activity:', error)
    }
  }

  // Patient selection handlers
  const handlePatientSelectImage = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatientsImage(prev => [...prev, patientId])
    } else {
      setSelectedPatientsImage(prev => prev.filter(id => id !== patientId))
    }
  }

  const handleSelectAllPatientsImage = (checked: boolean) => {
    if (checked) {
      setSelectedPatientsImage(filteredPatientsImage.map(p => p.id))
    } else {
      setSelectedPatientsImage([])
    }
  }

  // Filter patients
  const filteredPatientsImage = patients.filter(patient => {
    const matchesName = patient.name.toLowerCase().includes(searchTermImage.toLowerCase())
    const matchesPhone = patient.phone.includes(searchTermImage)
    const matchesMR = patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTermImage.toLowerCase())
    return matchesName || matchesPhone || matchesMR
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculate button disabled state
  const isButtonDisabled = !selectedImage || selectedPatientsImage.length === 0 || !promoTitle.trim() || sendingImage

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
          <h2 className="text-2xl text-pink-800">Manajemen Promo - FIXED</h2>
          <p className="text-pink-600 text-sm">Kelola promo gambar dengan perbaikan pengiriman WhatsApp</p>
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
            onClick={fetchInitialData}
            disabled={loading}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Warning Card for Image Upload */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">Informasi Penting - Pengiriman Gambar Promo</p>
              <p className="text-amber-700">
                Saat ini gambar promo disimpan sebagai data internal (base64). WhatsApp akan menerima pesan teks tanpa link gambar yang dapat diklik. 
                Untuk berbagi gambar, Anda perlu mengirim file gambar secara manual setelah mengirim pesan teks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Tab 1: Image Promo - FIXED */}
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
                          
                          {/* Image Type Indicator */}
                          <div className="absolute top-2 left-2">
                            <Badge 
                              variant={image.fileUrl.startsWith('data:') ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {image.fileUrl.startsWith('data:') ? 'Internal' : 'URL'}
                            </Badge>
                          </div>
                          
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

                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                            <p className="text-xs truncate">{image.originalName}</p>
                            <p className="text-xs text-gray-300">{formatFileSize(image.fileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Send Promo */}
            <div className="space-y-6">
              <Card className="border-pink-200">
                <CardHeader>
                  <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Kirim Promo Gambar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  {/* Selected Image Preview */}
                  {selectedImage && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedImage.fileUrl}
                          alt={selectedImage.originalName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-pink-800">{selectedImage.originalName}</p>
                          <p className="text-xs text-pink-600">{formatFileSize(selectedImage.fileSize)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={selectedImage.fileUrl.startsWith('data:') ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {selectedImage.fileUrl.startsWith('data:') ? 'Data Internal' : 'URL Publik'}
                            </Badge>
                            {selectedImage.fileUrl.startsWith('data:') && (
                              <span className="text-xs text-amber-600">⚠️ Tidak dapat dibagikan via link</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="promoTitle">Judul Promo *</Label>
                    <Input
                      id="promoTitle"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      placeholder="Masukkan judul promo..."
                      className="focus:border-pink-400 focus:ring-pink-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promoMessage">Pesan Tambahan (Opsional)</Label>
                    <Textarea
                      id="promoMessage"
                      value={promoMessage}
                      onChange={(e) => setPromoMessage(e.target.value)}
                      placeholder="Pesan tambahan untuk promo..."
                      rows={3}
                      className="focus:border-pink-400 focus:ring-pink-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="searchPatientsImage">Cari Pasien (Nama, Telepon, atau No. RM)</Label>
                    <Input
                      id="searchPatientsImage"
                      value={searchTermImage}
                      onChange={(e) => setSearchTermImage(e.target.value)}
                      placeholder="Cari nama, nomor telepon, atau No. RM..."
                      className="focus:border-pink-400 focus:ring-pink-200"
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
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('✅ Main button clicked!')
                      handleSendImagePromo()
                    }}
                    disabled={isButtonDisabled}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    size="lg"
                    type="button"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {sendingImage ? 'Mengirim Promo...' : `Kirim via WhatsApp (${selectedPatientsImage.length} pasien)`}
                  </Button>

                  


                  {/* Simple debug info */}
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    Status: Gambar {selectedImage ? '✅' : '❌'} | Pasien: {selectedPatientsImage.length} | Judul: "{promoTitle}" | Disabled: {isButtonDisabled ? 'Ya' : 'Tidak'}
                  </div>

                  {sendingImage && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Mengirim promo...</span>
                        <span className="text-green-600">{sendProgressImage}%</span>
                      </div>
                      <Progress value={sendProgressImage} className="h-2" />
                      <p className="text-xs text-gray-600 text-center">
                        Tab WhatsApp akan terbuka otomatis untuk setiap pasien
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Voucher - Simplified for this fix */}
        <TabsContent value="voucher" className="space-y-6">
          <div className="text-center py-12 border-2 border-dashed border-pink-200 rounded-lg">
            <Ticket className="h-16 w-16 text-pink-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-pink-800 mb-2">Voucher Management</h3>
            <p className="text-pink-600 mb-4">
              Fitur voucher tersedia di PromoManager asli. Ini adalah versi yang difokuskan untuk perbaikan promo gambar.
            </p>
            <Button
              variant="outline"
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              Kembali ke PromoManager Asli
            </Button>
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
              <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Nama:</strong> {previewImage.originalName}</p>
                  <p><strong>Ukuran:</strong> {formatFileSize(previewImage.fileSize)}</p>
                </div>
                <div>
                  <p><strong>Upload:</strong> {previewImage.uploadDate ? new Date(previewImage.uploadDate).toLocaleString('id-ID') : 'Unknown'}</p>
                  <p><strong>Tipe:</strong> {previewImage.fileUrl.startsWith('data:') ? 'Data Internal (Base64)' : 'URL Publik'}</p>
                </div>
              </div>
              {previewImage.fileUrl.startsWith('data:') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      <strong>Perhatian:</strong> Gambar ini disimpan sebagai data internal. WhatsApp tidak dapat menampilkan link yang dapat diklik untuk gambar ini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}