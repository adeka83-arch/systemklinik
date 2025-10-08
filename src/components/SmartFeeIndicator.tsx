import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, AlertTriangle, Zap, Info } from 'lucide-react'

interface FeeMatchDetails {
  score: number
  matchType: string
  feePercentage: number
  description?: string
}

interface SmartFeeIndicatorProps {
  matchDetails: FeeMatchDetails | null
  calculatedFee: number
  totalTindakan: number
  className?: string
}

export function SmartFeeIndicator({ 
  matchDetails, 
  calculatedFee, 
  totalTindakan,
  className = '' 
}: SmartFeeIndicatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  if (!matchDetails) {
    return (
      <Alert className={`border-gray-200 bg-gray-50 ${className}`}>
        <Info className="h-4 w-4 text-gray-500" />
        <AlertDescription className="text-gray-700 text-sm">
          Pilih dokter dan tindakan untuk melihat perhitungan fee otomatis
        </AlertDescription>
      </Alert>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-50 text-emerald-700 border-emerald-300'
    if (score >= 80) return 'bg-blue-50 text-blue-700 border-blue-300'
    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-300'
    return 'bg-orange-50 text-orange-700 border-orange-300'
  }

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <Zap className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <Card className={`border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={getScoreColor(matchDetails.score)}>
                {getIcon(matchDetails.score)}
              </div>
              <div>
                <div className="font-medium text-pink-800">Smart Fee Calculator</div>
                <div className="text-xs text-pink-600">Fee otomatis berdasarkan aturan</div>
              </div>
            </div>
            <Badge variant="outline" className={getScoreBadgeColor(matchDetails.score)}>
              Match: {matchDetails.score}%
            </Badge>
          </div>

          {/* Match Info */}
          <div className="bg-white/70 rounded-lg p-3 border border-pink-200/50">
            <div className="text-sm text-pink-800 font-medium mb-1">
              {matchDetails.matchType}
            </div>
            {matchDetails.description && (
              <div className="text-xs text-pink-600">
                {matchDetails.description}
              </div>
            )}
          </div>

          {/* Calculation Results */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-sm font-bold text-pink-800">
                {matchDetails.feePercentage}%
              </div>
              <div className="text-xs text-pink-600">Persentase</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-pink-800">
                {formatCurrency(totalTindakan)}
              </div>
              <div className="text-xs text-pink-600">Total Tindakan</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(calculatedFee)}
              </div>
              <div className="text-xs text-green-600">Fee Dokter</div>
            </div>
          </div>

          {/* Quality Indicator */}
          <div className="text-center">
            {matchDetails.score >= 95 && (
              <div className="text-xs text-emerald-600 font-medium">
                ✨ Perfect Match - Aturan Sangat Spesifik
              </div>
            )}
            {matchDetails.score >= 80 && matchDetails.score < 95 && (
              <div className="text-xs text-blue-600 font-medium">
                ⚡ Excellent Match - Aturan Spesifik Dokter
              </div>
            )}
            {matchDetails.score >= 60 && matchDetails.score < 80 && (
              <div className="text-xs text-yellow-600 font-medium">
                ⭐ Good Match - Aturan Kategori
              </div>
            )}
            {matchDetails.score < 60 && (
              <div className="text-xs text-orange-600 font-medium">
                📋 Basic Match - Aturan Default
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}