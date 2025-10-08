import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Calculator, Percent, DollarSign, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface TreatmentItem {
  id: string
  name: string
  price: number
  discount: number
  discountType: 'percentage' | 'nominal'
  discountAmount: number
  finalPrice: number
}

interface FeeSettings {
  id: string
  doctorIds?: string[]
  doctorNames?: string[]
  category?: string
  treatmentTypes?: string[]
  feePercentage: number
  isDefault: boolean
  description?: string
  createdAt: string
}

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
}

interface TreatmentFeeDetail {
  treatmentId: string
  treatmentName: string
  treatmentPrice: number
  finalPrice: number
  feePercentage: number
  calculatedFee: number
  ruleDescription: string
  isManualOverride: boolean
}

interface TreatmentMultiFeeSectionProps {
  doctorId: string
  selectedTreatments: TreatmentItem[]
  feeSettings: FeeSettings[]
  doctors: Doctor[]
  treatmentProducts: TreatmentProduct[]
  paymentStatus: 'lunas' | 'dp'
  dpAmount?: number
  singleFeePercentage: string
  onFeeChange: (feePercentage: string, totalFee: number, isMultiFee: boolean) => void
  feeMatchDetails?: any // Smart fee match details from parent
  totalTindakan?: number // Total amount for fee calculation
  className?: string
}

export function TreatmentMultiFeeSection({
  doctorId,
  selectedTreatments,
  feeSettings,
  doctors,
  treatmentProducts,
  paymentStatus,
  dpAmount = 0,
  singleFeePercentage,
  onFeeChange,
  feeMatchDetails,
  totalTindakan = 0,
  className = ''
}: TreatmentMultiFeeSectionProps) {
  const [treatmentFees, setTreatmentFees] = useState<TreatmentFeeDetail[]>([])
  const [manualOverrides, setManualOverrides] = useState<{ [treatmentId: string]: number }>({})
  const [totalFeeAmount, setTotalFeeAmount] = useState(0)

  // Smart matching algorithm
  const findBestFeeRule = (treatmentItem: TreatmentItem) => {
    let bestRule: FeeSettings | null = null
    let bestScore = 0

    for (const feeSetting of feeSettings) {
      let score = 0
      let isMatch = false

      // Check doctor applicability
      const appliesToDoctor = !feeSetting.doctorIds || 
        feeSetting.doctorIds.length === 0 || 
        feeSetting.doctorIds.includes(doctorId)

      if (!appliesToDoctor && !feeSetting.isDefault) {
        continue
      }

      // Check treatment applicability
      const appliesToTreatment = !feeSetting.treatmentTypes || 
        feeSetting.treatmentTypes.length === 0 || 
        feeSetting.treatmentTypes.includes(treatmentItem.name)

      // Check category match
      const treatmentProduct = treatmentProducts.find(p => p.name === treatmentItem.name)
      const categoryMatches = feeSetting.category && treatmentProduct?.category === feeSetting.category

      if (appliesToTreatment || feeSetting.isDefault || categoryMatches) {
        isMatch = true

        // Scoring system
        if (feeSetting.doctorIds?.includes(doctorId) && feeSetting.treatmentTypes?.includes(treatmentItem.name)) {
          score += 100
        } else if (feeSetting.doctorIds?.includes(doctorId)) {
          score += 50
        } else if (feeSetting.treatmentTypes?.includes(treatmentItem.name)) {
          score += 40
        } else if (categoryMatches) {
          score += 30
        } else if (feeSetting.isDefault) {
          score += 10
        }

        if (feeSetting.description && feeSetting.description.includes('spesifik')) {
          score += 5
        }
      }

      if (isMatch && score > bestScore) {
        bestRule = feeSetting
        bestScore = score
      }
    }

    return bestRule
  }

  // Calculate fees - Always use multi fee calculation
  useEffect(() => {
    if (!doctorId || selectedTreatments.length === 0) {
      setTreatmentFees([])
      setTotalFeeAmount(0)
      return
    }

    // Multi fee calculation
    const newTreatmentFees: TreatmentFeeDetail[] = []

    selectedTreatments.forEach((treatment) => {
      const rule = findBestFeeRule(treatment)
      const manualFeePercentage = manualOverrides[treatment.id]
      const isManualOverride = manualFeePercentage !== undefined

      let feePercentage = 0
      let ruleDescription = 'Tidak ada aturan fee'

      if (isManualOverride) {
        feePercentage = manualFeePercentage
        ruleDescription = `Manual: ${feePercentage}%`
      } else if (rule) {
        feePercentage = rule.feePercentage
        
        if (rule.isDefault) {
          ruleDescription = `Default: ${feePercentage}%`
        } else {
          const parts = []
          if (rule.doctorNames?.length) parts.push(`Dr: ${rule.doctorNames[0]}`)
          if (rule.treatmentTypes?.length) parts.push(`${rule.treatmentTypes[0]}`)
          if (rule.category) parts.push(`Cat: ${rule.category}`)
          ruleDescription = `${parts.join(' + ')}: ${feePercentage}%`
        }
      }

      // Calculate fee based on payment status
      let feeBase = treatment.finalPrice
      if (paymentStatus === 'dp') {
        const totalTreatmentAmount = selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0)
        const treatmentDpPortion = (treatment.finalPrice / totalTreatmentAmount) * dpAmount
        feeBase = Math.max(0, treatment.finalPrice - treatmentDpPortion)
      }

      const calculatedFee = (feeBase * feePercentage) / 100

      newTreatmentFees.push({
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        treatmentPrice: treatment.price,
        finalPrice: treatment.finalPrice,
        feePercentage,
        calculatedFee,
        ruleDescription,
        isManualOverride
      })
    })

    setTreatmentFees(newTreatmentFees)
    const totalFee = newTreatmentFees.reduce((sum, fee) => sum + fee.calculatedFee, 0)
    setTotalFeeAmount(totalFee)
    onFeeChange('', totalFee, true)
  }, [doctorId, selectedTreatments, feeSettings, treatmentProducts, paymentStatus, dpAmount, manualOverrides])

  const handleManualFeeChange = (treatmentId: string, feePercentage: string) => {
    const numericFee = parseFloat(feePercentage)
    
    if (isNaN(numericFee) || numericFee < 0 || numericFee > 100) {
      if (feePercentage === '') {
        setManualOverrides(prev => {
          const newOverrides = { ...prev }
          delete newOverrides[treatmentId]
          return newOverrides
        })
      }
      return
    }

    setManualOverrides(prev => ({
      ...prev,
      [treatmentId]: numericFee
    }))
  }

  const clearManualOverride = (treatmentId: string) => {
    setManualOverrides(prev => {
      const newOverrides = { ...prev }
      delete newOverrides[treatmentId]
      return newOverrides
    })
    toast.success('Manual override dibatalkan')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const hasConflicts = treatmentFees.some(fee => fee.feePercentage === 0 && !fee.isManualOverride)
  const hasManualOverrides = Object.keys(manualOverrides).length > 0

  if (selectedTreatments.length === 0) {
    return (
      <Card className={`border-pink-200 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Calculator className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Pilih tindakan untuk melihat perhitungan fee</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-pink-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-pink-800 text-base">
            <Calculator className="h-4 w-4" />
            Perhitungan Fee Dokter
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Sistem Multi Fee
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Tindakan Terpilih dengan Diskon */}
        <div className="rounded-lg border border-pink-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50 hover:bg-pink-50">
                <TableHead className="text-pink-800 text-sm font-semibold">Tindakan</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Harga Asli</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Diskon</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Harga Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedTreatments.map((treatment, index) => (
                <TableRow key={treatment.id} className="hover:bg-pink-50/50">
                  <TableCell className="py-2">
                    <div className="font-medium text-sm">{treatment.name}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">
                      {formatCurrency(treatment.price)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-pink-600 font-medium">Diskon:</span>
                      {treatment.discount > 0 ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                          -{treatment.discount}% = {formatCurrency(treatment.discountAmount)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                          Tidak ada diskon
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      {formatCurrency(treatment.finalPrice)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Alerts */}
        {hasConflicts && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Beberapa tindakan tidak memiliki aturan fee. Gunakan manual override atau buat aturan baru.
            </AlertDescription>
          </Alert>
        )}

        {hasManualOverrides && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              {Object.keys(manualOverrides).length} tindakan menggunakan manual override.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'dp' && (
          <Alert className="border-orange-200 bg-orange-50">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              Mode DP: Fee dihitung dari outstanding {formatCurrency(selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0) - dpAmount)}
            </AlertDescription>
          </Alert>
        )}

        {/* Multi Fee Table */}
        <div className="rounded-lg border border-pink-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50 hover:bg-pink-50">
                <TableHead className="text-pink-800 text-sm font-semibold">Tindakan</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Harga</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Fee %</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Jumlah Fee</TableHead>
                <TableHead className="text-pink-800 text-sm font-semibold">Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatmentFees.map((fee) => (
                <TableRow key={fee.treatmentId} className="hover:bg-pink-50/50">
                  <TableCell className="py-2">
                    <div>
                      <div className="font-medium text-sm">{fee.treatmentName}</div>
                      <div className="text-xs text-gray-500">{fee.ruleDescription}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      {formatCurrency(fee.finalPrice)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${fee.feePercentage > 0 ? 'bg-pink-50 text-pink-700 border-pink-300' : 'bg-gray-50 text-gray-600'}`}
                    >
                      {fee.feePercentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                      {formatCurrency(fee.calculatedFee)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Fee %"
                        value={manualOverrides[fee.treatmentId] || ''}
                        onChange={(e) => handleManualFeeChange(fee.treatmentId, e.target.value)}
                        className="w-16 h-7 text-xs border-pink-200 focus:border-pink-400"
                      />
                      {manualOverrides[fee.treatmentId] !== undefined && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearManualOverride(fee.treatmentId)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-pink-800">{selectedTreatments.length}</div>
              <div className="text-xs text-pink-600">Tindakan</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-800">
                {formatCurrency(selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0))}
              </div>
              <div className="text-xs text-pink-600">Total Tindakan</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-800">
                {formatCurrency(totalFeeAmount)}
              </div>
              <div className="text-xs text-pink-600">Total Fee</div>
            </div>
          </div>

          <Separator className="my-2" />
          <div className="text-center">
            <div className="text-sm font-medium text-pink-700">
              Rata-rata Fee: {selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0) > 0 
                ? ((totalFeeAmount / selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0)) * 100).toFixed(1) 
                : 0}%
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <div className="text-lg font-bold text-blue-600">
              {treatmentFees.filter(f => f.feePercentage > 0 && !f.isManualOverride).length}
            </div>
            <div className="text-xs text-blue-700">Auto Rules</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">
              {treatmentFees.filter(f => f.feePercentage === 0 && !f.isManualOverride).length}
            </div>
            <div className="text-xs text-yellow-700">No Rules</div>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-200">
            <div className="text-lg font-bold text-purple-600">
              {treatmentFees.filter(f => f.isManualOverride).length}
            </div>
            <div className="text-xs text-purple-700">Manual</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}