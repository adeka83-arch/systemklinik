import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Ticket, 
  Clock, 
  AlertCircle, 
  Percent, 
  DollarSign,
  RefreshCw,
  User,
  Calendar,
  Gift
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface VoucherReminder {
  voucherId: string
  recipientId: string
  recipientName: string
  voucherCode: string
  voucherTitle: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  daysUntilExpiry: number
  isUrgent: boolean
  status: string
  assignedDate: string
}

interface VoucherReminderProps {
  accessToken: string
  className?: string
}

export function VoucherReminder({ accessToken, className = "" }: VoucherReminderProps) {
  const [reminders, setReminders] = useState<VoucherReminder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const fetchVoucherReminders = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🎫 Fetching voucher reminders...')
      
      const response = await fetch(`${serverUrl}/vouchers/reminders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('🎫 Voucher reminders response:', data)

      if (data.success) {
        setReminders(data.reminders || [])
        console.log(`📋 Found ${data.reminders?.length || 0} voucher reminders`)
      } else {
        throw new Error(data.error || 'Failed to fetch voucher reminders')
      }
    } catch (error) {
      console.error('❌ Error fetching voucher reminders:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil reminder voucher')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoucherReminders()
    
    // Refresh reminders every 30 minutes
    const interval = setInterval(fetchVoucherReminders, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [accessToken])

  const getUrgencyColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 3) return 'text-red-600'
    if (daysUntilExpiry <= 7) return 'text-orange-600'
    return 'text-yellow-600'
  }

  const getUrgencyBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 3) return 'destructive'
    if (daysUntilExpiry <= 7) return 'secondary'
    return 'outline'
  }

  const getDiscountDisplay = (reminder: VoucherReminder) => {
    if (reminder.discountType === 'percentage') {
      return `${reminder.discountValue}%`
    } else {
      return formatCurrency(reminder.discountValue)
    }
  }

  if (loading && reminders.length === 0) {
    return (
      <Card className={`border-orange-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Gift className="h-5 w-5" />
            Reminder Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Memuat reminder voucher...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Gift className="h-5 w-5" />
            Reminder Voucher
            {reminders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {reminders.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchVoucherReminders}
            disabled={loading}
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ada voucher yang akan kedaluwarsa</p>
            <p className="text-gray-400 text-xs mt-1">Reminder akan muncul 30 hari sebelum voucher kedaluwarsa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => (
              <div
                key={`${reminder.voucherId}-${reminder.recipientId}`}
                className={`p-3 rounded-lg border-2 ${
                  reminder.isUrgent 
                    ? 'border-red-200 bg-red-50' 
                    : reminder.daysUntilExpiry <= 7
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getUrgencyBadge(reminder.daysUntilExpiry)}>
                        {reminder.voucherCode}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getUrgencyColor(reminder.daysUntilExpiry)}`}
                      >
                        {reminder.daysUntilExpiry === 0 
                          ? 'Kedaluwarsa hari ini!' 
                          : `${reminder.daysUntilExpiry} hari lagi`
                        }
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {reminder.voucherTitle}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-24">{reminder.recipientName}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {reminder.discountType === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        <span>{getDiscountDisplay(reminder)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(reminder.expiryDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2">
                    <Clock className={`h-5 w-5 ${getUrgencyColor(reminder.daysUntilExpiry)}`} />
                  </div>
                </div>
              </div>
            ))}

            {reminders.length > 5 && (
              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  +{reminders.length - 5} voucher lainnya akan kedaluwarsa
                </p>
              </div>
            )}

            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                💡 <strong>Tips:</strong> Hubungi pasien untuk mengingatkan mereka menggunakan voucher sebelum kedaluwarsa
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}