import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Ticket, 
  Calendar, 
  Percent, 
  DollarSign, 
  Gift, 
  Clock,
  Sparkles,
  CheckCircle,
  Users,
  AlertTriangle
} from 'lucide-react'

interface VoucherCardProps {
  voucher: {
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
    minPurchase?: number
  }
  variant?: 'default' | 'preview' | 'compact'
  showUsage?: boolean
  onClick?: () => void
  selected?: boolean
}

export function VoucherCard({ 
  voucher, 
  variant = 'default', 
  showUsage = true, 
  onClick,
  selected = false 
}: VoucherCardProps) {
  // Check for corrupt data
  const isCorruptData = (
    !voucher.code || 
    !voucher.title || 
    voucher.discountValue === undefined || 
    voucher.discountValue === null ||
    !voucher.expiryDate || 
    voucher.expiryDate === 'Invalid Date' ||
    isNaN(voucher.discountValue)
  )

  // Safe handling of undefined values with fallbacks for corrupt data
  const safeCode = voucher.code || 'CORRUPT'
  const safeTitle = voucher.title || 'Data Corrupt'
  const safeDiscountValue = (voucher.discountValue !== undefined && !isNaN(voucher.discountValue)) ? voucher.discountValue : 0
  const safeMinPurchase = voucher.minPurchase || 0
  const safeUsageCount = voucher.usageCount || 0
  const safeUsageLimit = voucher.usageLimit || 0
  const safeDiscountType = voucher.discountType || 'percentage'

  const discountText = safeDiscountType === 'percentage' 
    ? `${safeDiscountValue}%`
    : `Rp ${safeDiscountValue.toLocaleString('id-ID')}`

  // Safe date handling
  let isExpired = false
  let safeExpiryDate = 'Invalid Date'
  try {
    if (voucher.expiryDate && voucher.expiryDate !== 'Invalid Date') {
      const expiryDate = new Date(voucher.expiryDate)
      if (!isNaN(expiryDate.getTime())) {
        isExpired = expiryDate < new Date()
        safeExpiryDate = expiryDate.toLocaleDateString('id-ID')
      }
    }
  } catch (error) {
    console.log('Error parsing expiry date:', voucher.expiryDate)
  }

  const isLimitReached = safeUsageLimit > 0 && safeUsageCount >= safeUsageLimit
  const isInactive = !voucher.isActive || isExpired || isLimitReached || isCorruptData

  if (variant === 'preview') {
    return (
      <div className="relative">
        {/* Professional Voucher Preview - Matches the improved template exactly */}
        <div className="w-full max-w-sm mx-auto">
          <div 
            className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 rounded-2xl p-1 shadow-2xl"
            style={{
              aspectRatio: '400/300',
              minHeight: '300px'
            }}
          >
            {/* Inner white content area */}
            <div className="relative w-full h-full bg-white rounded-xl overflow-hidden">
              
              {/* Header section with logo and HEMAT badge */}
              <div className="absolute top-3 left-0 right-0 px-4">
                <div className="flex items-center justify-between">
                  {/* Left: Logo and clinic info */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">🦷</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide leading-tight">VOUCHER DISKON</p>
                      <p className="text-xs font-bold text-gray-800 leading-tight">Falasifah Dental Clinic</p>
                    </div>
                  </div>
                  
                  {/* Right: HEMAT badge */}
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-full">
                    <span className="text-[10px] font-bold">HEMAT {discountText}</span>
                  </div>
                </div>
              </div>

              {/* Main title section - centered */}
              <div className="absolute top-12 left-0 right-0 text-center px-4">
                <h3 className="text-base font-bold text-gray-800 leading-tight">
                  {safeTitle}
                </h3>
              </div>

              {/* Voucher code section - with dashed border */}
              <div className="absolute top-18 left-1/2 transform -translate-x-1/2">
                <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 ${
                  isCorruptData ? 'bg-red-50 border-red-300' : ''
                }`}>
                  <p className="text-[10px] text-gray-600 text-center mb-1">Kode Voucher</p>
                  <p className={`text-sm font-bold text-center tracking-wider ${
                    isCorruptData ? 'text-red-600' : 'text-pink-600'
                  }`}>
                    {safeCode}
                  </p>
                </div>
                
                {/* Description/S&K positioned below voucher code */}
                <div className="mt-2 text-center px-2">
                  <p className="text-xs text-gray-500 leading-tight">
                    {voucher.description && voucher.description.trim() !== '' && voucher.description.length <= 50 
                      ? voucher.description 
                      : 'Syarat dan ketentuan berlaku'}
                  </p>
                </div>
              </div>

              {/* Two-column section for discount and expiry - dinaikkan posisi */}
              <div className="absolute bottom-16 left-0 right-0 px-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Discount - Label di atas dengan spacing yang proporsional */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">DISKON</p>
                    <div className="text-xl font-bold text-pink-600">
                      {discountText}
                    </div>
                  </div>
                  
                  {/* Right: Expiry date - Label di atas dengan spacing yang proporsional */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">BERLAKU HINGGA</p>
                    <div className="text-xs font-bold text-gray-700">
                      {safeExpiryDate !== 'Invalid Date' ? safeExpiryDate : 'Data Invalid'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom info sections - disesuaikan posisi */}
              <div className="absolute bottom-3 left-0 right-0 px-3 space-y-1">
                {/* Minimum purchase info */}
                <div className="text-center">
                  <p className="text-[10px] text-orange-600 font-semibold">
                    💰 {safeMinPurchase > 0 
                      ? `Minimal pembelian: Rp ${safeMinPurchase.toLocaleString('id-ID')}`
                      : 'Minimal pembelian: Rp 300.000'
                    }
                  </p>
                </div>
                
                {/* Usage limit info */}
                <div className="text-center">
                  <p className="text-[10px] text-blue-600 font-semibold">
                    🎫 {safeUsageLimit > 0 
                      ? `Terbatas untuk ${safeUsageLimit} penggunaan pertama`
                      : 'Terbatas untuk 1 penggunaan pertama'
                    }
                  </p>
                </div>
              </div>

              {/* Subtle decorative elements */}
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                </div>
                <div className="absolute bottom-2 left-2">
                  <Gift className="h-3 w-3 text-purple-500" />
                </div>
              </div>

              {/* Error indicator for corrupt data */}
              {isCorruptData && (
                <div className="absolute top-1 left-1 right-1 bg-red-100 border border-red-300 rounded-md p-1">
                  <p className="text-[9px] text-red-700 text-center">⚠️ Data Corrupt</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Info text below card */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">Preview akan sama dengan gambar yang dikirim via WhatsApp</p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          selected 
            ? 'border-pink-500 ring-2 ring-pink-200 bg-pink-50' 
            : isCorruptData 
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 hover:border-pink-300'
        } ${isInactive ? 'opacity-60' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {isCorruptData && (
            <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
              <p className="text-xs text-red-700 flex items-center gap-1">
                ⚠️ Data voucher corrupt - dapat dihapus
              </p>
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className={`h-4 w-4 flex-shrink-0 ${isCorruptData ? 'text-red-500' : 'text-pink-500'}`} />
                <h4 className="text-sm font-semibold truncate">{safeTitle}</h4>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <span className={`px-2 py-1 rounded-full font-mono text-xs ${
                  isCorruptData 
                    ? 'bg-red-100 text-red-700'
                    : 'bg-pink-100 text-pink-700'
                }`}>
                  {safeCode}
                </span>
                <span className="flex items-center gap-1">
                  {safeDiscountType === 'percentage' ? (
                    <Percent className="h-3 w-3" />
                  ) : (
                    <DollarSign className="h-3 w-3" />
                  )}
                  {discountText}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {safeExpiryDate}
                </span>
                {showUsage && safeUsageLimit > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {safeUsageCount}/{safeUsageLimit}
                  </span>
                )}
              </div>
            </div>
            
            {selected && (
              <div className="bg-pink-500 text-white rounded-full p-1 ml-2">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {isInactive && (
            <div className="mt-2 flex flex-wrap gap-1">
              {isCorruptData && (
                <Badge variant="destructive" className="text-xs">
                  Data Corrupt
                </Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="text-xs">
                  Kadaluarsa
                </Badge>
              )}
              {isLimitReached && (
                <Badge variant="secondary" className="text-xs">
                  Limit Tercapai
                </Badge>
              )}
              {!voucher.isActive && !isCorruptData && (
                <Badge variant="secondary" className="text-xs">
                  Tidak Aktif
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected 
          ? 'border-pink-500 ring-2 ring-pink-200 bg-pink-50' 
          : isCorruptData 
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-pink-300'
      } ${isInactive ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {isCorruptData && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700 flex items-center gap-2">
              ⚠️ Voucher ini memiliki data yang corrupt dan dapat dihapus
            </p>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isCorruptData 
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}>
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{safeTitle}</h4>
              <p className="text-sm text-gray-600">Voucher #{safeCode}</p>
            </div>
          </div>
          {selected && (
            <div className="bg-pink-500 text-white rounded-full p-1">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {voucher.description && (
          <p className="text-sm text-gray-600 mb-4">{voucher.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              {voucher.discountType === 'percentage' ? (
                <Percent className="h-4 w-4 text-pink-500" />
              ) : (
                <DollarSign className="h-4 w-4 text-pink-500" />
              )}
            </div>
            <p className="text-xs text-gray-600">Diskon</p>
            <p className="text-lg font-bold text-pink-600">{discountText}</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs text-gray-600">Berlaku Hingga</p>
            <p className="text-sm font-semibold text-gray-700">
              {safeExpiryDate !== 'Invalid Date' ? safeExpiryDate : 'Data Invalid'}
            </p>
          </div>
        </div>

        {safeMinPurchase > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-yellow-700 text-center">
              💰 Minimal pembelian: Rp {safeMinPurchase.toLocaleString('id-ID')}
            </p>
          </div>
        )}

        {showUsage && (
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span>Dibuat: {new Date(voucher.createdDate).toLocaleDateString('id-ID')}</span>
            {safeUsageLimit > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {safeUsageCount}/{safeUsageLimit} terpakai
              </span>
            )}
          </div>
        )}

        {isInactive && (
          <div className="mt-3 flex flex-wrap gap-2">
            {isCorruptData && (
              <Badge variant="destructive" className="text-xs">
                Data Corrupt
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="text-xs">
                Kadaluarsa
              </Badge>
            )}
            {isLimitReached && (
              <Badge variant="secondary" className="text-xs">
                Limit Tercapai
              </Badge>
            )}
            {!voucher.isActive && !isCorruptData && (
              <Badge variant="secondary" className="text-xs">
                Tidak Aktif
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}