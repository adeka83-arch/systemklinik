import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Calculator, Percent, DollarSign, Users, AlertTriangle, CheckCircle, Info, Edit } from 'lucide-react'
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
  feeRule: FeeSettings | null
  feePercentage: number
  calculatedFee: number
  ruleDescription: string
  isManualOverride: boolean
}

interface MultiFeeResult {
  treatmentFees: TreatmentFeeDetail[]
  totalTreatmentAmount: number
  totalFeeAmount: number
  hasConflicts: boolean
  hasManualOverrides: boolean
  averageFeePercentage: number
}

interface MultiFeeCalculatorProps {
  doctorId: string
  selectedTreatments: TreatmentItem[]
  feeSettings: FeeSettings[]
  doctors: Doctor[]
  treatmentProducts: TreatmentProduct[]
  paymentStatus: 'lunas' | 'dp'
  dpAmount?: number
  onMultiFeeCalculated: (result: MultiFeeResult) => void
  className?: string
}

export function MultiFeeCalculator({
  doctorId,
  selectedTreatments,
  feeSettings,
  doctors,
  treatmentProducts,
  paymentStatus,
  dpAmount = 0,
  onMultiFeeCalculated,
  className = ''
}: MultiFeeCalculatorProps) {
  const [treatmentFees, setTreatmentFees] = useState<TreatmentFeeDetail[]>([])
  const [manualOverrides, setManualOverrides] = useState<{ [treatmentId: string]: number }>({})
  const [multiFeeResult, setMultiFeeResult] = useState<MultiFeeResult | null>(null)

  // Smart matching algorithm untuk mencari fee rule terbaik
  const findBestFeeRule = (treatmentItem: TreatmentItem): { rule: FeeSettings | null; score: number } => {
    let bestRule: FeeSettings | null = null
    let bestScore = 0

    for (const feeSetting of feeSettings) {
      let score = 0
      let isMatch = false

      // Check if fee setting applies to this doctor
      const appliesToDoctor = !feeSetting.doctorIds || 
        feeSetting.doctorIds.length === 0 || 
        feeSetting.doctorIds.includes(doctorId)

      if (!appliesToDoctor && !feeSetting.isDefault) {
        continue
      }

      // Check if fee setting applies to this specific treatment
      const appliesToTreatment = !feeSetting.treatmentTypes || 
        feeSetting.treatmentTypes.length === 0 || 
        feeSetting.treatmentTypes.includes(treatmentItem.name)

      // Check category match
      const treatmentProduct = treatmentProducts.find(p => p.name === treatmentItem.name)
      const categoryMatches = feeSetting.category && treatmentProduct?.category === feeSetting.category

      if (appliesToTreatment || feeSetting.isDefault || categoryMatches) {
        isMatch = true

        // Scoring system (higher is better)
        // Specific doctor + specific treatment = highest priority
        if (feeSetting.doctorIds?.includes(doctorId) && feeSetting.treatmentTypes?.includes(treatmentItem.name)) {
          score += 100
        }
        // Specific doctor only
        else if (feeSetting.doctorIds?.includes(doctorId)) {
          score += 50
        }
        // Specific treatment only
        else if (feeSetting.treatmentTypes?.includes(treatmentItem.name)) {
          score += 40
        }
        // Category match
        else if (categoryMatches) {
          score += 30
        }
        // Default rule
        else if (feeSetting.isDefault) {
          score += 10
        }

        // Bonus for more specific rules
        if (feeSetting.description && feeSetting.description.includes('spesifik')) {
          score += 5
        }
      }

      if (isMatch && score > bestScore) {
        bestRule = feeSetting
        bestScore = score
      }
    }

    return { rule: bestRule, score: bestScore }
  }

  // Calculate fee for each treatment
  useEffect(() => {
    if (!doctorId || selectedTreatments.length === 0) {
      setTreatmentFees([])
      setMultiFeeResult(null)
      return
    }

    const selectedDoctor = doctors.find(d => d.id === doctorId)
    const newTreatmentFees: TreatmentFeeDetail[] = []
    let hasConflicts = false

    selectedTreatments.forEach((treatment) => {
      const { rule } = findBestFeeRule(treatment)
      
      // Check for manual override
      const manualFeePercentage = manualOverrides[treatment.id]
      const isManualOverride = manualFeePercentage !== undefined

      let feePercentage = 0
      let ruleDescription = 'Tidak ada aturan fee yang sesuai'

      if (isManualOverride) {
        feePercentage = manualFeePercentage
        ruleDescription = `Manual override: ${feePercentage}%`
      } else if (rule) {
        feePercentage = rule.feePercentage
        
        // Generate descriptive rule text
        if (rule.isDefault) {
          ruleDescription = `Default: ${feePercentage}%`
        } else {
          const parts = []
          if (rule.doctorNames?.length) {
            parts.push(`Dokter: ${rule.doctorNames.join(', ')}`)
          }
          if (rule.treatmentTypes?.length) {
            parts.push(`Tindakan: ${rule.treatmentTypes.join(', ')}`)
          }
          if (rule.category) {
            parts.push(`Kategori: ${rule.category}`)
          }
          ruleDescription = `${parts.join(' + ')}: ${feePercentage}%`
          if (rule.description) {
            ruleDescription += ` (${rule.description})`
          }
        }
      } else {
        hasConflicts = true
      }

      // Calculate fee based on payment status
      let feeBase = treatment.finalPrice
      if (paymentStatus === 'dp') {
        // For DP: fee calculated from outstanding amount for this specific treatment
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
        feeRule: rule,
        feePercentage,
        calculatedFee,
        ruleDescription,
        isManualOverride
      })
    })

    setTreatmentFees(newTreatmentFees)

    const totalTreatmentAmount = selectedTreatments.reduce((sum, t) => sum + t.finalPrice, 0)
    const totalFeeAmount = newTreatmentFees.reduce((sum, fee) => sum + fee.calculatedFee, 0)
    const averageFeePercentage = totalTreatmentAmount > 0 ? (totalFeeAmount / totalTreatmentAmount) * 100 : 0
    
    const result: MultiFeeResult = {
      treatmentFees: newTreatmentFees,
      totalTreatmentAmount,
      totalFeeAmount,
      hasConflicts,
      hasManualOverrides: Object.keys(manualOverrides).length > 0,
      averageFeePercentage
    }

    setMultiFeeResult(result)
    onMultiFeeCalculated(result)
  }, [doctorId, selectedTreatments, feeSettings, doctors, treatmentProducts, paymentStatus, dpAmount, manualOverrides])

  const handleManualFeeChange = (treatmentId: string, feePercentage: string) => {
    const numericFee = parseFloat(feePercentage)
    
    if (isNaN(numericFee) || numericFee < 0 || numericFee > 100) {
      if (feePercentage === '') {
        // Remove manual override
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

  if (selectedTreatments.length === 0) {
    return (
      <Card className={`border-pink-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Pilih tindakan untuk melihat perhitungan multi fee</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-pink-200 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b border-pink-200">
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Calculator className="h-5 w-5" />
          Perhitungan Multi Fee per Tindakan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Alert for conflicts or status */}
        {multiFeeResult?.hasConflicts && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Beberapa tindakan tidak memiliki aturan fee yang sesuai. Gunakan manual override atau tambah aturan fee baru di Pengaturan Fee.
            </AlertDescription>
          </Alert>
        )}

        {multiFeeResult?.hasManualOverrides && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {Object.keys(manualOverrides).length} tindakan menggunakan fee manual override.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'dp' && (
          <Alert className="border-orange-200 bg-orange-50">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Mode DP: Fee dihitung dari outstanding amount setelah dikurangi DP sebesar {formatCurrency(dpAmount)}
            </AlertDescription>
          </Alert>
        )}

        {/* Treatment Fee Details Table */}
        <div className="rounded-lg border border-pink-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50 hover:bg-pink-50">
                <TableHead className="text-pink-800 font-semibold">Tindakan</TableHead>
                <TableHead className="text-pink-800 font-semibold">Harga Final</TableHead>
                <TableHead className="text-pink-800 font-semibold">Aturan Fee</TableHead>
                <TableHead className="text-pink-800 font-semibold">Fee %</TableHead>
                <TableHead className="text-pink-800 font-semibold">Jumlah Fee</TableHead>
                <TableHead className="text-pink-800 font-semibold">Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatmentFees.map((fee) => (
                <TableRow key={fee.treatmentId} className="hover:bg-pink-50/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{fee.treatmentName}</div>
                      {fee.treatmentPrice !== fee.finalPrice && (
                        <div className="text-sm text-gray-500">
                          Harga asli: {formatCurrency(fee.treatmentPrice)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {formatCurrency(fee.finalPrice)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className={`${fee.feeRule ? 'text-gray-900' : 'text-red-600'}`}>
                        {fee.ruleDescription}
                      </div>
                      {fee.isManualOverride && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 mt-1">
                          Manual Override
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${fee.feePercentage > 0 ? 'bg-pink-50 text-pink-700 border-pink-300' : 'bg-gray-50 text-gray-600'}`}
                    >
                      {fee.feePercentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                      {formatCurrency(fee.calculatedFee)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Fee %"
                        value={manualOverrides[fee.treatmentId] || ''}
                        onChange={(e) => handleManualFeeChange(fee.treatmentId, e.target.value)}
                        className="w-20 h-8 text-sm border-pink-200 focus:border-pink-400"
                      />
                      {manualOverrides[fee.treatmentId] !== undefined && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearManualOverride(fee.treatmentId)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
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
        {multiFeeResult && (
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-800">{treatmentFees.length}</div>
                <div className="text-sm text-pink-600">Tindakan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-800">
                  {formatCurrency(multiFeeResult.totalTreatmentAmount)}
                </div>
                <div className="text-sm text-pink-600">Total Tindakan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-800">
                  {multiFeeResult.averageFeePercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-pink-600">Rata-rata Fee</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-800">
                  {formatCurrency(multiFeeResult.totalFeeAmount)}
                </div>
                <div className="text-sm text-pink-600">Total Fee Dokter</div>
              </div>
            </div>

            {paymentStatus === 'dp' && (
              <>
                <Separator className="my-3" />
                <div className="text-sm text-orange-700">
                  <strong>Catatan DP:</strong> Fee dihitung dari outstanding amount per tindakan. 
                  DP: {formatCurrency(dpAmount)} | Outstanding: {formatCurrency(multiFeeResult.totalTreatmentAmount - dpAmount)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Usage Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {treatmentFees.filter(f => f.feeRule && !f.isManualOverride).length}
            </div>
            <div className="text-sm text-blue-700">Auto Rules</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {treatmentFees.filter(f => !f.feeRule && !f.isManualOverride).length}
            </div>
            <div className="text-sm text-yellow-700">No Rules</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {treatmentFees.filter(f => f.isManualOverride).length}
            </div>
            <div className="text-sm text-purple-700">Manual Override</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}