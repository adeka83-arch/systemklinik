import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { 
  Ticket,
  Check,
  X,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  User,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { VoucherCard } from './VoucherCard'
import { serverUrl } from '../utils/supabase/client'

interface Voucher {
  id: string
  title: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minAmount?: number
  maxDiscount?: number
  expiryDate?: string
  usageLimit?: number
  currentUsage?: number
  isActive: boolean
  description?: string
  created_at: string
}

interface VoucherUsage {
  id: string
  voucherId: string
  voucherCode: string
  patientId: string
  patientName: string
  originalAmount: number
  discountAmount: number
  finalAmount: number
  usedDate: string
  usedBy: string
  transactionType: 'treatment' | 'sale'
  transactionId?: string
}

interface VoucherUsageProps {
  accessToken: string
  onVoucherApplied?: (voucher: Voucher, discountAmount: number) => void
  originalAmount?: number
  patientId?: string
  patientName?: string
  transactionType?: 'treatment' | 'sale'
  disabled?: boolean
}

export function VoucherUsage({ 
  accessToken, 
  onVoucherApplied, 
  originalAmount = 0,
  patientId,
  patientName,
  transactionType = 'treatment',
  disabled = false
}: VoucherUsageProps) {
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // serverUrl imported from utils/supabase/client

  const validateVoucher = async (code: string) => {
    if (!code.trim()) {
      setError('Masukkan kode voucher')
      return null
    }

    try {
      setLoading(true)
      setError('')
      
      console.log('🎫 Validating voucher:', { 
        code: code.trim().toUpperCase(), 
        amount: originalAmount, 
        patientId, 
        transactionType,
        serverUrl,
        accessToken: accessToken ? 'present' : 'missing'
      })

      const response = await fetch(`${serverUrl}/vouchers/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          amount: originalAmount,
          patientId,
          transactionType
        })
      }).catch(err => {
        console.error('Fetch error:', err)
        throw new Error(`Network error: ${err.message}`)
      })

      console.log('🎫 Validation response status:', response.status)

      const data = await response.json()
      console.log('🎫 Validation response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.valid) {
        throw new Error(data.message || 'Voucher tidak valid')
      }

      console.log('✅ Voucher validation successful:', data.voucher.title)
      return data.voucher
    } catch (error) {
      console.error('Error validating voucher:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
      return null
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscount = (voucher: Voucher, amount: number) => {
    let discount = 0

    if (voucher.discountType === 'percentage') {
      discount = (amount * voucher.discountValue) / 100
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount
      }
    } else {
      discount = voucher.discountValue
    }

    // Pastikan diskon tidak melebihi total amount
    return Math.min(discount, amount)
  }

  const handleApplyVoucher = async () => {
    const voucher = await validateVoucher(voucherCode)
    
    if (!voucher) {
      return
    }

    // Check minimum amount
    if (voucher.minAmount && originalAmount < voucher.minAmount) {
      setError(`Minimum transaksi untuk voucher ini adalah Rp ${voucher.minAmount.toLocaleString('id-ID')}`)
      return
    }

    const discount = calculateDiscount(voucher, originalAmount)
    
    setAppliedVoucher(voucher)
    setDiscountAmount(discount)
    setError('')
    
    toast.success(`Voucher "${voucher.title}" berhasil diterapkan!`)
    
    if (onVoucherApplied) {
      onVoucherApplied(voucher, discount)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setDiscountAmount(0)
    setVoucherCode('')
    setError('')
    
    if (onVoucherApplied) {
      onVoucherApplied(null as any, 0)
    }
    
    toast.success('Voucher dihapus')
  }

  const finalAmount = originalAmount - discountAmount

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Voucher Diskon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!appliedVoucher ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="voucherCode">Kode Voucher</Label>
                <div className="flex gap-2">
                  <Input
                    id="voucherCode"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 focus:border-purple-400 focus:ring-purple-200"
                    disabled={disabled || loading}
                  />
                  <Button
                    onClick={handleApplyVoucher}
                    disabled={disabled || loading || !voucherCode.trim() || originalAmount === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Terapkan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {originalAmount === 0 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Masukkan total transaksi terlebih dahulu untuk menggunakan voucher
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">{appliedVoucher.title}</p>
                      <p className="text-sm text-green-600">Kode: {appliedVoucher.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveVoucher}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Asli</p>
                    <p className="font-semibold">Rp {originalAmount.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-red-600">Diskon</p>
                    <p className="font-semibold text-red-600">
                      - Rp {discountAmount.toLocaleString('id-ID')}
                      {appliedVoucher.discountType === 'percentage' && (
                        <span className="text-xs ml-1">({appliedVoucher.discountValue}%)</span>
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-600">Total Setelah Diskon</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {finalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {appliedVoucher.description && (
                  <div className="mt-3 p-2 bg-purple-50 rounded-md">
                    <p className="text-xs text-purple-700">{appliedVoucher.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voucher Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Detail Voucher
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap voucher yang sedang digunakan.
            </DialogDescription>
          </DialogHeader>
          {appliedVoucher && (
            <div className="space-y-4">
              <VoucherCard voucher={appliedVoucher} variant="preview" showUsage={false} />
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-gray-800 text-sm">Rincian Penggunaan:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Transaksi:</span>
                    <span className="ml-1 capitalize">{transactionType === 'treatment' ? 'Tindakan' : 'Penjualan'}</span>
                  </div>
                  {patientName && (
                    <div>
                      <span className="text-gray-600">Pasien:</span>
                      <span className="ml-1">{patientName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Total Asli:</span>
                    <span className="ml-1">Rp {originalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Diskon:</span>
                    <span className="ml-1 text-red-600">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Total Bayar:</span>
                    <span className="ml-1 font-semibold text-green-600">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}