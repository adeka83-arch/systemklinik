import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { 
  Ticket, 
  Check, 
  X, 
  AlertCircle, 
  Percent, 
  DollarSign,
  Search,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
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

interface VoucherValidationResult {
  valid: boolean
  discountAmount?: number
  finalAmount?: number
  message?: string
  voucher?: Voucher
}

interface VoucherSelectorProps {
  accessToken: string
  originalAmount: number
  treatmentAmount?: number
  adminFee?: number
  patientId: string
  onVoucherApplied: (voucherData: {
    voucherId: string
    voucherCode: string
    discountAmount: number
    finalAmount: number
    originalTreatmentAmount?: number
    discountedTreatmentAmount?: number
    adminFee?: number
  } | null) => void
  onRefreshNeeded?: () => void
  className?: string
  hasManualDiscount?: boolean
}

export function VoucherSelector({ 
  accessToken, 
  originalAmount, 
  treatmentAmount,
  adminFee = 0,
  patientId, 
  onVoucherApplied,
  onRefreshNeeded,
  className = "",
  hasManualDiscount = false
}: VoucherSelectorProps) {
  const [voucherCode, setVoucherCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidationResult | null>(null)
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
      month: 'long',
      year: 'numeric'
    })
  }

  const validateVoucher = async (code: string) => {
    if (!code.trim()) {
      setError('Masukkan kode voucher')
      return
    }

    if (originalAmount <= 0) {
      setError('Total transaksi harus lebih dari 0')
      return
    }

    setValidating(true)
    setError('')

    try {
      console.log('🎫 Validating voucher:', { code, originalAmount, patientId })
      
      const response = await fetch(`${serverUrl}/vouchers/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          amount: originalAmount,
          treatmentAmount: treatmentAmount || originalAmount,
          adminFee: adminFee,
          patientId,
          transactionType: 'treatment'
        })
      })

      const data = await response.json()
      console.log('🎫 Validation response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Gagal validasi voucher')
      }

      if (data.valid) {
        const voucherResult: VoucherValidationResult = {
          valid: true,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          voucher: data.voucher
        }
        
        setAppliedVoucher(voucherResult)
        
        // Notify parent component
        onVoucherApplied({
          voucherId: data.voucher.id,
          voucherCode: data.voucher.code,
          discountAmount: data.discountAmount,
          finalAmount: data.finalTotalAmount || data.finalAmount,
          originalTreatmentAmount: data.originalTreatmentAmount,
          discountedTreatmentAmount: data.discountedTreatmentAmount,
          adminFee: data.adminFee
        })

        toast.success(`Voucher berhasil diterapkan! Hemat ${formatCurrency(data.discountAmount)}`)
      } else {
        setError(data.message || 'Voucher tidak valid')
        setAppliedVoucher(null)
        onVoucherApplied(null)
      }
    } catch (error) {
      console.error('❌ Voucher validation error:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat validasi voucher')
      setAppliedVoucher(null)
      onVoucherApplied(null)
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    await validateVoucher(voucherCode)
  }

  const removeVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCode('')
    setError('')
    onVoucherApplied(null)
    toast.info('Voucher dihapus')
  }

  const calculateSavings = () => {
    if (appliedVoucher?.discountAmount) {
      const savingsPercentage = (appliedVoucher.discountAmount / originalAmount) * 100
      return savingsPercentage.toFixed(1)
    }
    return '0'
  }

  return (
    <Card className={`border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Ticket className="h-5 w-5" />
          Voucher Diskon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!appliedVoucher ? (
          <div className="space-y-4">
            <div>
              <Label className="text-orange-700">Kode Voucher</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder={hasManualDiscount ? "Tidak dapat menggunakan voucher saat ada diskon manual" : "Masukkan kode voucher..."}
                  className="border-orange-200 focus:border-orange-400"
                  disabled={validating || hasManualDiscount}
                   title={hasManualDiscount ? "Hapus diskon manual terlebih dahulu untuk menggunakan voucher" : ""}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={validating || !voucherCode.trim() || hasManualDiscount}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4"
                >
                  {validating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {hasManualDiscount && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>Voucher tidak dapat digunakan:</strong> Terdapat diskon manual aktif pada tindakan. 
                  Hapus semua diskon manual terlebih dahulu untuk menggunakan voucher.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total saat ini: <span className="font-medium">{formatCurrency(originalAmount)}</span>
              </p>
              {treatmentAmount && adminFee ? (
                <div className="text-xs text-orange-600 mt-2 space-y-1">
                  <div>• Nilai Tindakan: {formatCurrency(treatmentAmount)}</div>
                  <div>• Biaya Admin: {formatCurrency(adminFee)}</div>
                  <div className="font-medium">• Diskon voucher hanya berlaku untuk nilai tindakan</div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Applied Voucher Display */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {appliedVoucher.voucher?.code}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-green-800 mb-1">
                    {appliedVoucher.voucher?.title}
                  </h4>
                  
                  {appliedVoucher.voucher?.description && (
                    <p className="text-sm text-green-700 mb-2">
                      {appliedVoucher.voucher.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-green-700">
                    <div className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {appliedVoucher.voucher?.discountType === 'percentage' 
                        ? `${appliedVoucher.voucher.discountValue}%`
                        : formatCurrency(appliedVoucher.voucher?.discountValue || 0)
                      }
                    </div>
                    
                    {appliedVoucher.voucher?.expiryDate && (
                      <div className="text-xs text-green-600">
                        Berlaku hingga {formatDate(appliedVoucher.voucher.expiryDate)}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeVoucher}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              {treatmentAmount && adminFee ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nilai Tindakan:</span>
                    <span>{formatCurrency(treatmentAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon Tindakan ({calculateSavings()}%):</span>
                    <span>-{formatCurrency(appliedVoucher.discountAmount || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal Tindakan:</span>
                    <span className="text-green-600">{formatCurrency((treatmentAmount || 0) - (appliedVoucher.discountAmount || 0))}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Admin:</span>
                    <span>{formatCurrency(adminFee)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Bayar:</span>
                    <span className="text-green-600">
                      {formatCurrency(appliedVoucher.finalAmount || originalAmount)}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Hemat {formatCurrency(appliedVoucher.discountAmount || 0)}
                    </Badge>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-blue-700 text-center">
                      ℹ️ Diskon voucher hanya berlaku untuk nilai tindakan, tidak termasuk biaya admin
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(originalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon ({calculateSavings()}%):</span>
                    <span>-{formatCurrency(appliedVoucher.discountAmount || 0)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      {formatCurrency(appliedVoucher.finalAmount || originalAmount)}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Hemat {formatCurrency(appliedVoucher.discountAmount || 0)}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}