import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Ticket, 
  Clock, 
  AlertCircle, 
  Percent, 
  DollarSign,
  RefreshCw,
  User,
  Calendar,
  Gift,
  Phone,
  MapPin,
  MessageCircle,
  CheckCircle,
  Eye,
  Users,
  TrendingUp,
  Filter
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface VoucherRecipient {
  id: string
  voucherId: string
  recipientId: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  voucherCode: string
  voucherTitle: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  daysUntilExpiry: number
  isUrgent: boolean
  status: 'active' | 'used' | 'expired'
  assignedDate: string
  usedDate?: string
  createdAt: string
  lastCodeRegenerated?: string
  codeRegeneratedBy?: string
}

interface VoucherStats {
  totalActive: number
  totalExpiring: number
  totalUsed: number
  totalExpired: number
}

interface DebugInfo {
  recipients?: {
    count: number
    sample?: any
    breakdown?: any
    allSamples?: any[]
  }
  vouchers?: {
    count: number
    sample?: any
  }
  patients?: {
    count: number
    sample?: any
  }
  promoHistory?: any
  totalRecipients?: number
  totalVouchers?: number
  totalPatients?: number
  breakdown?: any
  voucherHistory?: number
}

interface VoucherReminderListProps {
  accessToken: string
}

export function VoucherReminderList({ accessToken }: VoucherReminderListProps) {
  const [recipients, setRecipients] = useState<VoucherRecipient[]>([])
  const [stats, setStats] = useState<VoucherStats>({
    totalActive: 0,
    totalExpiring: 0,
    totalUsed: 0,
    totalExpired: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTab, setSelectedTab] = useState('expiring')
  const [selectedRecipient, setSelectedRecipient] = useState<VoucherRecipient | null>(null)
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const fetchVoucherRecipients = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🎫 Fetching voucher recipients...')
      console.log('📡 Server URL:', serverUrl)
      console.log('🔑 Access Token exists:', !!accessToken)
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(`${serverUrl}/vouchers/recipients-detailed`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('📡 Error response text:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('🎫 Voucher recipients response:', data)

      if (data.success) {
        // Ensure unique IDs to prevent React key conflicts
        const recipients = (data.recipients || []).map((recipient, index) => ({
          ...recipient,
          id: recipient.id || `fetch_recipient_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        }))
        
        // Remove any potential duplicates based on combination of voucherId, recipientId, and voucherCode
        const uniqueRecipients = recipients.filter((recipient, index, arr) => {
          const key = `${recipient.voucherId}_${recipient.recipientId}_${recipient.voucherCode}`
          const firstIndex = arr.findIndex(r => `${r.voucherId}_${r.recipientId}_${r.voucherCode}` === key)
          return firstIndex === index
        })
        
        setRecipients(uniqueRecipients)
        setStats(data.stats || {
          totalActive: 0,
          totalExpiring: 0,
          totalUsed: 0,
          totalExpired: 0
        })
        
        console.log(`📋 Fetched ${uniqueRecipients.length} unique voucher recipients from ${data.recipients?.length || 0} total`)
        console.log('📊 Stats received:', data.stats)
        
        // Show helpful message if empty but with better context
        if (data.isEmpty && data.message) {
          console.log('💡 Suggestion:', data.message)
          toast.info(`ℹ️ ${data.message}`)
        } else if (uniqueRecipients.length === 0) {
          console.log('⚠️ No voucher recipients found. Database may be empty.')
          toast.info('No voucher recipients found. Try using the tools below to create or import data.')
        } else {
          const expiringCount = data.stats?.totalExpiring || 0
          if (expiringCount > 0) {
            toast.success(`📋 Loaded ${uniqueRecipients.length} voucher recipients. ${expiringCount} vouchers expiring soon!`)
          } else {
            toast.success(`📋 Loaded ${uniqueRecipients.length} voucher recipients successfully.`)
          }
        }
      } else {
        throw new Error(data.error || 'Failed to fetch voucher recipients')
      }
    } catch (error) {
      console.error('❌ Error fetching voucher recipients:', error)
      
      let errorMessage = 'Terjadi kesalahan saat mengambil data voucher'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - server membutuhkan waktu terlalu lama'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setRecipients([])
      setStats({
        totalActive: 0,
        totalExpiring: 0,
        totalUsed: 0,
        totalExpired: 0
      })
      
      // Show toast error with helpful context
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Do a health check first, then fetch recipients
    const initializeData = async () => {
      try {
        console.log('🏥 Checking voucher system health...')
        const healthResponse = await fetch(`${serverUrl}/vouchers/health`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          console.log('🏥 Health check passed:', healthData)
          
          // Only fetch recipients if health check passes
          await fetchVoucherRecipients()
        } else {
          console.log('🏥 Health check failed, falling back to basic fetch')
          // Fallback to basic fetch if health check fails
          await fetchVoucherRecipients()
        }
      } catch (error) {
        console.log('🏥 Health check error, proceeding with fetch anyway:', error)
        // Always try to fetch even if health check fails
        await fetchVoucherRecipients()
      }
    }
    
    if (accessToken) {
      initializeData()
    }
  }, [accessToken])

  // Listen for voucher sent events and auto refresh
  useEffect(() => {
    const handleVoucherSent = (event: CustomEvent) => {
      console.log('🎫 Voucher sent event received:', event.detail)
      const { codes, voucherTitle, count } = event.detail
      
      // Show info about the codes that were sent
      toast.info(`🔄 Auto-refreshing voucher list... ${count} new voucher codes created`)
      
      // Wait a moment for the backend to process, then refresh
      setTimeout(() => {
        fetchVoucherRecipients()
      }, 2000)
    }

    // Add event listener for custom voucher sent event
    window.addEventListener('voucherSent', handleVoucherSent as EventListener)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('voucherSent', handleVoucherSent as EventListener)
    }
  }, [accessToken])

  const debugVoucherData = async () => {
    try {
      const response = await fetch(`${serverUrl}/debug/voucher-data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Ensure debug data has proper structure with safe fallbacks
        const safeDebugInfo = {
          ...data.debug,
          recipients: {
            count: data.debug?.recipients?.count || 0,
            sample: data.debug?.recipients?.sample || null,
            breakdown: data.debug?.recipients?.breakdown || {},
            allSamples: data.debug?.recipients?.allSamples || []
          },
          vouchers: {
            count: data.debug?.vouchers?.count || 0,
            sample: data.debug?.vouchers?.sample || null
          },
          patients: {
            count: data.debug?.patients?.count || 0,
            sample: data.debug?.patients?.sample || null
          },
          promoHistory: data.debug?.promoHistory || {}
        }
        setDebugInfo(safeDebugInfo)
        setShowDebug(true)
        console.log('🔍 Debug data:', safeDebugInfo)
      }
    } catch (error) {
      console.error('Debug error:', error)
    }
  }

  const createTestData = async () => {
    try {
      setLoading(true)
      console.log('🧪 Creating test voucher data...')
      
      const response = await fetch(`${serverUrl}/debug/create-test-voucher-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🧪 Test data created:', data)
        toast.success('✅ Test data berhasil dibuat!')
        
        // Refresh data after creating test data
        await fetchVoucherRecipients()
        
        // If still no data, try to show all data
        setTimeout(() => {
          if (recipients.length === 0) {
            console.log('🔄 No recipients after creating test data, trying to show all data...')
            showAllData()
          }
        }, 1000)
        
      } else {
        const errorData = await response.json()
        console.error('Create test data error response:', errorData)
        toast.error(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Create test data error:', error)
      toast.error('❌ Gagal membuat test data')
    } finally {
      setLoading(false)
    }
  }

  const generateFromHistory = async () => {
    try {
      const response = await fetch(`${serverUrl}/debug/generate-recipients-from-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Berhasil generate ${data.data.recipientsCreated} voucher recipients!`)
        // Refresh data
        fetchVoucherRecipients()
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Generate from history error:', error)
      toast.error('Gagal generate dari history')
    }
  }

  const createRealisticData = async () => {
    try {
      setLoading(true)
      console.log('⭐ Creating realistic voucher recipients...')
      
      const response = await fetch(`${serverUrl}/debug/create-realistic-voucher-recipients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('⭐ Realistic data created:', data)
        toast.success(`✅ Berhasil buat ${data.data.recipientsCreated} recipients realistis!`)
        
        // Refresh data after creating realistic data
        await fetchVoucherRecipients()
        
        // If still no data, try to show all data
        setTimeout(() => {
          if (recipients.length === 0) {
            console.log('🔄 No recipients after creating realistic data, trying to show all data...')
            showAllData()
          }
        }, 1000)
        
      } else {
        const errorData = await response.json()
        console.error('Create realistic data error response:', errorData)
        toast.error(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Create realistic data error:', error)
      toast.error('❌ Gagal membuat data realistis')
    } finally {
      setLoading(false)
    }
  }

  const convertHistoryToRecipients = async () => {
    try {
      setLoading(true)
      console.log('🎯 Converting promo history to voucher recipients...')
      
      const response = await fetch(`${serverUrl}/convert-history-to-recipients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🎯 Convert history response:', data)
        toast.success(`✅ ${data.message}`)
        
        // Refresh data after conversion
        await fetchVoucherRecipients()
        
        // If still no data after conversion, try showing all data
        setTimeout(() => {
          if (recipients.length === 0) {
            console.log('🔄 No recipients after conversion, trying to show all data...')
            showAllData()
          }
        }, 1000)
        
      } else {
        const errorData = await response.json()
        console.error('Convert history error response:', errorData)
        
        if (errorData.suggestion) {
          toast.error(`${errorData.error}\n\n💡 ${errorData.suggestion}`)
          
          // If suggests redirecting to promo, provide helpful guidance
          if (errorData.redirectTo === 'promo') {
            setTimeout(() => {
              toast.info('💡 Tip: Go to "Manajemen Promo" tab, send some vouchers first, then come back here!')
            }, 2000)
          }
        } else {
          toast.error(`Error: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Convert history error:', error)
      toast.error('Gagal convert riwayat voucher')
    } finally {
      setLoading(false)
    }
  }

  const showAllData = async () => {
    try {
      setLoading(true)
      console.log('📋 Fetching all voucher data...')
      
      // Add timeout protection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${serverUrl}/debug/show-all-data`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 ALL VOUCHER DATA:', data)
        
        if (!data.recipients || data.recipients.length === 0) {
          // No recipients found, show helpful message
          console.log('⚠️ No recipients found in show-all-data response')
          toast.info('No voucher recipients found! Try creating some test data or converting history.')
          
          // Still update the display with empty but properly structured data
          setRecipients([])
          setStats({
            totalActive: 0,
            totalExpiring: 0,
            totalUsed: 0,
            totalExpired: 0
          })
          
          // Show debug info in UI with safe fallbacks
          const safeDebugInfo = {
            totalRecipients: data.summary?.totalRecipients || 0,
            totalVouchers: data.summary?.totalVouchers || 0,
            totalPatients: data.summary?.totalPatients || 0,
            breakdown: data.summary?.breakdown || {},
            voucherHistory: data.summary?.voucherHistory || 0,
            recipients: {
              count: data.summary?.totalRecipients || 0,
              sample: null
            },
            vouchers: {
              count: data.summary?.totalVouchers || 0
            },
            patients: {
              count: data.summary?.totalPatients || 0
            }
          }
          setDebugInfo(safeDebugInfo)
          setShowDebug(true)
          
          return
        }
        
        // Process recipients and ensure unique IDs
        const recipients = (data.recipients || []).map((recipient, index) => ({
          ...recipient,
          // Ensure unique ID to prevent React key conflicts
          id: recipient.id || `unique_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        }))
        
        // Remove any potential duplicates based on combination of voucherId, recipientId, and voucherCode
        const uniqueRecipients = recipients.filter((recipient, index, arr) => {
          const key = `${recipient.voucherId}_${recipient.recipientId}_${recipient.voucherCode}`
          const firstIndex = arr.findIndex(r => `${r.voucherId}_${r.recipientId}_${r.voucherCode}` === key)
          return firstIndex === index
        })
        
        console.log(`📊 Processed ${uniqueRecipients.length} unique recipients from ${recipients.length} total`)
        
        setRecipients(uniqueRecipients)
        
        // Calculate stats from processed data
        const stats = {
          totalActive: uniqueRecipients.filter(r => r.status === 'active').length,
          totalExpiring: uniqueRecipients.filter(r => r.status === 'active' && r.daysUntilExpiry <= 30).length,
          totalUsed: uniqueRecipients.filter(r => r.status === 'used').length,
          totalExpired: uniqueRecipients.filter(r => r.status === 'expired').length
        }
        
        setStats(stats)
        
        console.log('📊 Updated stats:', stats)
        toast.success(`✅ Loaded ${uniqueRecipients.length} voucher recipients! ${stats.totalExpiring} will expire soon.`)
        
      } else {
        const errorData = await response.json()
        console.error('Show all data error response:', errorData)
        toast.error(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Show all data error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('❌ Request timeout - server membutuhkan waktu terlalu lama')
      } else {
        toast.error('❌ Gagal menampilkan semua data')
      }
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (daysUntilExpiry: number, status: string) => {
    if (status === 'expired') return 'text-gray-500'
    if (status === 'used') return 'text-green-600'
    if (daysUntilExpiry <= 3) return 'text-red-600'
    if (daysUntilExpiry <= 7) return 'text-orange-600'
    return 'text-blue-600'
  }

  const getUrgencyBadge = (daysUntilExpiry: number, status: string) => {
    if (status === 'expired') return { variant: 'secondary' as const, text: 'KEDALUWARSA' }
    if (status === 'used') return { variant: 'default' as const, text: 'TERPAKAI' }
    if (daysUntilExpiry <= 1) return { variant: 'destructive' as const, text: 'HARI INI' }
    if (daysUntilExpiry <= 3) return { variant: 'destructive' as const, text: 'MENDESAK' }
    if (daysUntilExpiry <= 7) return { variant: 'secondary' as const, text: 'SEGERA' }
    return { variant: 'outline' as const, text: 'AKTIF' }
  }

  const getDiscountDisplay = (recipient: VoucherRecipient) => {
    if (recipient.discountType === 'percentage') {
      return `${recipient.discountValue}%`
    } else {
      return formatCurrency(recipient.discountValue)
    }
  }

  const sendWhatsAppReminder = async (recipient: VoucherRecipient) => {
    if (!recipient.recipientPhone) {
      toast.error('Nomor telepon pasien tidak tersedia')
      return
    }

    setSendingWhatsApp(recipient.id)

    try {
      const response = await fetch(`${serverUrl}/vouchers/send-whatsapp-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          recipientId: recipient.recipientId,
          voucherId: recipient.voucherId,
          voucherCode: recipient.voucherCode,
          recipientName: recipient.recipientName,
          recipientPhone: recipient.recipientPhone,
          voucherTitle: recipient.voucherTitle,
          discountValue: recipient.discountValue,
          discountType: recipient.discountType,
          expiryDate: recipient.expiryDate,
          daysUntilExpiry: recipient.daysUntilExpiry
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Reminder WhatsApp berhasil dikirim ke ${recipient.recipientName}`)
        
        // Auto refresh after successful WhatsApp send
        setTimeout(() => {
          fetchVoucherRecipients()
        }, 1000)
      } else {
        throw new Error(data.error || 'Gagal mengirim reminder WhatsApp')
      }
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error)
      toast.error('Gagal mengirim reminder WhatsApp')
    } finally {
      setSendingWhatsApp(null)
    }
  }

  const regenerateVoucherCode = async (recipient: VoucherRecipient) => {
    if (!recipient.recipientId || !recipient.voucherId) {
      toast.error('Data recipient tidak lengkap')
      return
    }

    setRegeneratingCode(recipient.id)

    try {
      const response = await fetch(`${serverUrl}/vouchers/regenerate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          recipientId: recipient.recipientId,
          voucherId: recipient.voucherId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Kode voucher berhasil di-regenerate: ${data.newCode}`)
        // Refresh data to show new code
        await fetchVoucherRecipients()
      } else {
        throw new Error(data.error || 'Gagal regenerate kode voucher')
      }
    } catch (error) {
      console.error('Error regenerating voucher code:', error)
      toast.error('Gagal regenerate kode voucher')
    } finally {
      setRegeneratingCode(null)
    }
  }

  const fixBrokenVoucherCodes = async () => {
    try {
      setLoading(true)
      console.log('🔧 Starting bulk voucher code repair...')
      
      // Add timeout protection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout for bulk operation
      
      const response = await fetch(`${serverUrl}/vouchers/fix-broken-codes`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔧 Bulk repair response:', data)
        
        if (data.results?.totalFixed > 0) {
          toast.success(`✅ Berhasil memperbaiki ${data.results.totalFixed} kode voucher dari ${data.results.totalChecked} data!`)
        } else {
          toast.info('ℹ️ Tidak ada kode voucher yang perlu diperbaiki.')
        }
        
        // Refresh data after repair
        await fetchVoucherRecipients()
        
      } else {
        const errorData = await response.json()
        console.error('Bulk repair error response:', errorData)
        toast.error(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Fix broken voucher codes error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('❌ Request timeout - operasi membutuhkan waktu terlalu lama')
      } else {
        toast.error('❌ Gagal memperbaiki kode voucher')
      }
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRecipients = () => {
    switch (selectedTab) {
      case 'expiring':
        return recipients.filter(r => r.status === 'active' && r.daysUntilExpiry <= 30)
      case 'active':
        return recipients.filter(r => r.status === 'active')
      case 'used':
        return recipients.filter(r => r.status === 'used')
      case 'expired':
        return recipients.filter(r => r.status === 'expired')
      default:
        return recipients
    }
  }

  const filteredRecipients = getFilteredRecipients()

  if (loading && recipients.length === 0) {
    return (
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Gift className="h-5 w-5" />
            Reminder & Status Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Memuat data voucher recipients...</p>
              <p className="text-xs text-gray-400">Mengambil data dari berbagai sumber voucher</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Gift className="h-5 w-5" />
                Reminder & Status Voucher
              </CardTitle>
              <p className="text-xs text-orange-600 mt-1">
                Terintegrasi dengan data riwayat voucher dari Manajemen Promo
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={showAllData}
                disabled={loading}
                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1"
                title="Tampilkan Semua Data"
              >
                {loading ? '⏳' : '📋'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={convertHistoryToRecipients}
                disabled={loading}
                className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 p-1"
                title="Convert Riwayat Voucher"
              >
                {loading ? '⏳' : '🎯'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={debugVoucherData}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1"
                title="Debug Data"
              >
                🔍
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={createRealisticData}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1"
                title="Buat Data Realistis"
              >
                {loading ? '⏳' : '⭐'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={createTestData}
                disabled={loading}
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1"
                title="Buat Data Test"
              >
                {loading ? '⏳' : '🧪'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fixBrokenVoucherCodes}
                disabled={loading}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
                title="Perbaiki Kode Voucher Rusak"
              >
                {loading ? '⏳' : '🔧'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchVoucherRecipients}
                disabled={loading}
                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading && recipients.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50 mb-4">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-700">
                Sedang memproses data voucher recipients... Harap tunggu.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {showDebug && debugInfo && Object.keys(debugInfo).length > 0 && (
            <Alert className="border-blue-200 bg-blue-50 mb-4">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <div className="text-xs space-y-1">
                  <p><strong>Debug Info:</strong></p>
                  <p>• Recipients: {debugInfo.recipients?.count ?? debugInfo.totalRecipients ?? 0}</p>
                  <p>• Vouchers: {debugInfo.vouchers?.count ?? debugInfo.totalVouchers ?? 0}</p>
                  <p>• Patients: {debugInfo.patients?.count ?? debugInfo.totalPatients ?? 0}</p>
                  {debugInfo.recipients?.allSamples && (
                    <div className="mt-1">
                      <p>• Kode Status:</p>
                      <p className="ml-2">
                        ✅ Punya kode: {debugInfo.recipients.allSamples.filter(s => s.voucherCode).length}
                      </p>
                      <p className="ml-2">
                        ❌ Tanpa kode: {debugInfo.recipients.allSamples.filter(s => !s.voucherCode).length}
                      </p>
                      <p className="ml-2">
                        🔄 Regenerated: {debugInfo.recipients.allSamples.filter(s => s.lastCodeRegenerated).length}
                      </p>
                    </div>
                  )}
                  {debugInfo.recipients?.sample?.voucherCode && (
                    <p>• Sample Recipient Code: <span className="font-mono bg-white px-1 rounded">{debugInfo.recipients.sample.voucherCode}</span></p>
                  )}
                  {debugInfo.recipients?.sample && !debugInfo.recipients.sample.voucherCode && (
                    <p>• Sample Recipient: <span className="text-orange-600">KODE KOSONG</span> (ID: {debugInfo.recipients.sample.id || 'N/A'})</p>
                  )}
                  {debugInfo.breakdown && typeof debugInfo.breakdown === 'object' && (
                    <div className="mt-2">
                      <p><strong>Breakdown:</strong></p>
                      <p>  - Standard: {debugInfo.breakdown.standard ?? 0}</p>
                      <p>  - History: {debugInfo.breakdown.history ?? 0}</p>
                      <p>  - Realistic: {debugInfo.breakdown.realistic ?? 0}</p>
                      <p>  - Test: {debugInfo.breakdown.test ?? 0}</p>
                    </div>
                  )}
                  {/* Show voucher code samples if available */}
                  {debugInfo.recipients?.allSamples && debugInfo.recipients.allSamples.length > 0 && (
                    <div className="mt-2">
                      <p><strong>Sample Voucher Codes:</strong></p>
                      {debugInfo.recipients.allSamples.slice(0, 5).map((sample, index) => (
                        <p key={index} className="ml-2 text-xs">
                          <span className="text-gray-500">#{index + 1}</span>{' '}
                          {sample.voucherCode ? (
                            <span className="font-mono bg-white px-1 rounded text-green-600 border border-green-200">
                              {sample.voucherCode}
                            </span>
                          ) : (
                            <span className="text-orange-600 bg-orange-50 px-1 rounded border border-orange-200">
                              NO CODE (ID: {sample.id?.substring(0, 15) || 'N/A'}...)
                            </span>
                          )}
                          {sample.lastCodeRegenerated && (
                            <span className="ml-1 text-xs text-green-500">[REGENERATED]</span>
                          )}
                        </p>
                      ))}
                      {debugInfo.recipients.allSamples.length > 5 && (
                        <p className="ml-2 text-xs text-gray-400">
                          ... dan {debugInfo.recipients.allSamples.length - 5} lainnya
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDebug(false)}
                    className="mt-1 h-6 text-xs"
                  >
                    Hide
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-red-600">Akan Kedaluwarsa</p>
                  <p className="text-lg font-semibold text-red-700">{stats.totalExpiring}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">Aktif</p>
                  <p className="text-lg font-semibold text-blue-700">{stats.totalActive}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600">Terpakai</p>
                  <p className="text-lg font-semibold text-green-700">{stats.totalUsed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Kedaluwarsa</p>
                  <p className="text-lg font-semibold text-gray-700">{stats.totalExpired}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expiring" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">Akan Kedaluwarsa</span>
                <span className="sm:hidden">Mendesak</span>
                {stats.totalExpiring > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                    {stats.totalExpiring}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                <span className="hidden sm:inline">Aktif</span>
                <span className="sm:hidden">Aktif</span>
              </TabsTrigger>
              <TabsTrigger value="used" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Terpakai</span>
                <span className="sm:hidden">Pakai</span>
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Kedaluwarsa</span>
                <span className="sm:hidden">Expired</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              {filteredRecipients.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">
                    {selectedTab === 'expiring' && 'Tidak ada voucher yang akan kedaluwarsa'}
                    {selectedTab === 'active' && 'Tidak ada voucher aktif'}
                    {selectedTab === 'used' && 'Tidak ada voucher yang terpakai'}
                    {selectedTab === 'expired' && 'Tidak ada voucher yang kedaluwarsa'}
                  </p>
                  {recipients.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400">
                        Belum ada data voucher recipients. Gunakan tools berikut:
                      </p>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          onClick={showAllData}
                          className="bg-green-600 hover:bg-green-700 text-white w-full"
                        >
                          📋 Tampilkan Semua Data
                        </Button>
                        <Button
                          size="sm"
                          onClick={convertHistoryToRecipients}
                          className="bg-pink-600 hover:bg-pink-700 text-white w-full"
                        >
                          🎯 Convert Riwayat Voucher
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={createRealisticData}
                            disabled={loading}
                            className="text-xs"
                          >
                            {loading ? '⏳' : '⭐'} Realistis
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={createTestData}
                            disabled={loading}
                            className="text-xs"
                          >
                            {loading ? '⏳' : '🧪'} Test
                          </Button>
                          <Button
                            size="sm" 
                            variant="outline"
                            onClick={debugVoucherData}
                            disabled={loading}
                            className="text-xs"
                          >
                            🔍 Debug
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-50 to-pink-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700">
                          💡 <strong>Langkah-langkah:</strong> 
                        </p>
                        <ol className="text-xs text-green-600 mt-1 list-decimal list-inside space-y-1">
                          <li>Klik "📋 Tampilkan Semua Data" untuk melihat semua voucher recipients yang tersedia</li>
                          <li>Atau klik "🎯 Convert Riwayat Voucher" untuk menggunakan data dari Manajemen Promo</li>
                          <li>Data akan otomatis muncul di tab-tab reminder setelah proses selesai</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecipients.map((recipient, index) => {
                    const badgeInfo = getUrgencyBadge(recipient.daysUntilExpiry, recipient.status)
                    // Create unique key to prevent duplicate key warnings
                    const uniqueKey = `${recipient.id || 'recipient'}_${recipient.voucherId || 'voucher'}_${recipient.recipientId || 'patient'}_${index}`
                    
                    return (
                      <div
                        key={uniqueKey}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Header with name and badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{recipient.recipientName}</h4>
                              <Badge variant={badgeInfo.variant} className="text-xs">
                                {badgeInfo.text}
                              </Badge>
                            </div>

                            {/* Voucher info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {recipient.status === 'expired' 
                                    ? `Kedaluwarsa ${formatDate(recipient.expiryDate)}`
                                    : recipient.status === 'used'
                                    ? `Digunakan ${formatDate(recipient.usedDate || '')}`
                                    : `Berlaku hingga ${formatDate(recipient.expiryDate)}`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{recipient.recipientPhone || 'Tidak ada nomor'}</span>
                              </div>
                            </div>

                            {/* Address */}
                            {recipient.recipientAddress && (
                              <div className="flex items-start gap-1 text-sm text-gray-600 mb-3">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{recipient.recipientAddress}</span>
                              </div>
                            )}

                            {/* Voucher details */}
                            <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 mr-3">
                                  <p className="font-medium text-pink-800 text-sm">{recipient.voucherTitle}</p>
                                  {/* Enhanced voucher code display */}
                                  <div className="mt-1 p-2 bg-white border border-pink-300 rounded text-center">
                                    {recipient.voucherCode ? (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Kode Voucher:</p>
                                        <p className="text-sm font-bold text-pink-700 font-mono tracking-wide">
                                          {recipient.voucherCode}
                                        </p>
                                        {recipient.lastCodeRegenerated && (
                                          <div className="flex items-center justify-center gap-1 mt-1">
                                            <div className="h-1 w-1 bg-green-400 rounded-full"></div>
                                            <p className="text-xs text-green-600">Kode regenerated</p>
                                            <div className="h-1 w-1 bg-green-400 rounded-full"></div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Kode Voucher:</p>
                                        <p className="text-sm font-bold text-orange-600">
                                          KODE TIDAK TERSEDIA
                                        </p>
                                        <p className="text-xs text-red-500 mt-1">
                                          ID: {recipient.voucherId || 'N/A'}
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => regenerateVoucherCode(recipient)}
                                          disabled={regeneratingCode === recipient.id}
                                          className="mt-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                          {regeneratingCode === recipient.id ? '⏳' : '🔄'} Generate Kode
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-pink-600">
                                    {getDiscountDisplay(recipient)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {recipient.daysUntilExpiry > 0 && recipient.status === 'active'
                                      ? `${recipient.daysUntilExpiry} hari lagi`
                                      : recipient.status === 'expired'
                                      ? 'Kedaluwarsa'
                                      : recipient.status === 'used'
                                      ? 'Sudah digunakan'
                                      : 'Aktif'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            {recipient.recipientPhone && recipient.status === 'active' && recipient.voucherCode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendWhatsAppReminder(recipient)}
                                disabled={sendingWhatsApp === recipient.id}
                                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span className="hidden sm:inline ml-1">WhatsApp</span>
                              </Button>
                            )}
                            
                            {!recipient.voucherCode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => regenerateVoucherCode(recipient)}
                                disabled={regeneratingCode === recipient.id}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                              >
                                {regeneratingCode === recipient.id ? '⏳' : '🔄'}
                                <span className="hidden sm:inline ml-1">
                                  {regeneratingCode === recipient.id ? 'Generating...' : 'Gen Kode'}
                                </span>
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRecipient(recipient)}
                              className="border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Detail</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedTab === 'expiring' && filteredRecipients.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips:</strong> Hubungi pasien untuk mengingatkan mereka menggunakan voucher sebelum kedaluwarsa. 
                Gunakan tombol WhatsApp untuk mengirim reminder otomatis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedRecipient} onOpenChange={() => setSelectedRecipient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-pink-600" />
              Detail Voucher
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecipient && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-2">{selectedRecipient.recipientName}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{selectedRecipient.recipientPhone || 'Tidak ada nomor'}</span>
                  </div>
                  {selectedRecipient.recipientAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      <span>{selectedRecipient.recipientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Voucher Info */}
              <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-md p-4">
                <h4 className="font-medium text-pink-800 mb-3">{selectedRecipient.voucherTitle}</h4>
                
                {/* Enhanced voucher code display in detail modal */}
                <div className="mb-4 p-3 bg-white border border-pink-300 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-2">Kode Voucher</p>
                  {selectedRecipient.voucherCode ? (
                    <div>
                      <p className="text-lg font-bold text-pink-700 font-mono tracking-wider">
                        {selectedRecipient.voucherCode}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="h-1 w-1 bg-pink-400 rounded-full"></div>
                        <p className="text-xs text-pink-600">
                          {selectedRecipient.lastCodeRegenerated ? 'Kode regenerated' : 'Kode unik generated'}
                        </p>
                        <div className="h-1 w-1 bg-pink-400 rounded-full"></div>
                      </div>
                      {selectedRecipient.lastCodeRegenerated && (
                        <p className="text-xs text-green-600 mt-1">
                          Regenerated: {formatDate(selectedRecipient.lastCodeRegenerated)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-bold text-orange-600">KODE TIDAK TERSEDIA</p>
                      <p className="text-xs text-red-500 mt-1">Voucher ID: {selectedRecipient.voucherId || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Klik tombol di bawah untuk generate kode baru</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateVoucherCode(selectedRecipient)}
                        disabled={regeneratingCode === selectedRecipient.id}
                        className="mt-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {regeneratingCode === selectedRecipient.id ? '⏳ Generating...' : '🔄 Generate Kode Baru'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Diskon</p>
                    <p className="font-semibold text-pink-600">{getDiscountDisplay(selectedRecipient)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <Badge variant={getUrgencyBadge(selectedRecipient.daysUntilExpiry, selectedRecipient.status).variant} className="text-xs">
                      {getUrgencyBadge(selectedRecipient.daysUntilExpiry, selectedRecipient.status).text}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Diberikan:</span>
                  <span>{formatFullDate(selectedRecipient.assignedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Berlaku hingga:</span>
                  <span className={getUrgencyColor(selectedRecipient.daysUntilExpiry, selectedRecipient.status)}>
                    {formatFullDate(selectedRecipient.expiryDate)}
                  </span>
                </div>
                {selectedRecipient.usedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Digunakan:</span>
                    <span className="text-green-600">{formatFullDate(selectedRecipient.usedDate)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedRecipient.recipientPhone && selectedRecipient.status === 'active' && (
                <Button
                  onClick={() => {
                    sendWhatsAppReminder(selectedRecipient)
                    setSelectedRecipient(null)
                  }}
                  disabled={sendingWhatsApp === selectedRecipient.id}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim Reminder WhatsApp
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}