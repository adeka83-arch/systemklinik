import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { VoucherUsage } from './VoucherUsage'
import { 
  ShoppingCart,
  User,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface VoucherUsageDemoProps {
  accessToken: string
}

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

export function VoucherUsageDemo({ accessToken }: VoucherUsageDemoProps) {
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedTreatment, setSelectedTreatment] = useState('')
  const [treatmentPrice, setTreatmentPrice] = useState(0)
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(0)
  const [processing, setProcessing] = useState(false)

  // serverUrl imported from utils/supabase/client

  // Mock data
  const mockPatients = [
    { id: 'patient_1', name: 'Ahmad Fadli', phone: '081234567890' },
    { id: 'patient_2', name: 'Siti Nurhaliza', phone: '081234567891' },
    { id: 'patient_3', name: 'Budi Santoso', phone: '081234567892' }
  ]

  const mockTreatments = [
    { id: 'treatment_1', name: 'Scaling', price: 150000 },
    { id: 'treatment_2', name: 'Tambal Gigi', price: 200000 },
    { id: 'treatment_3', name: 'Cabut Gigi', price: 100000 },
    { id: 'treatment_4', name: 'Pemutihan Gigi', price: 500000 },
    { id: 'treatment_5', name: 'Pasang Behel', price: 2000000 }
  ]

  const handleTreatmentChange = (treatmentId: string) => {
    setSelectedTreatment(treatmentId)
    const treatment = mockTreatments.find(t => t.id === treatmentId)
    if (treatment) {
      setTreatmentPrice(treatment.price)
      setFinalAmount(treatment.price)
    } else {
      setTreatmentPrice(0)
      setFinalAmount(0)
    }
    
    // Reset voucher when treatment changes
    if (appliedVoucher) {
      setAppliedVoucher(null)
      setDiscountAmount(0)
    }
  }

  const handleVoucherApplied = (voucher: Voucher | null, discount: number) => {
    setAppliedVoucher(voucher)
    setDiscountAmount(discount)
    setFinalAmount(treatmentPrice - discount)
  }

  const processTransaction = async () => {
    if (!selectedPatient || !selectedTreatment) {
      toast.error('Pilih pasien dan tindakan terlebih dahulu')
      return
    }

    try {
      setProcessing(true)

      const patient = mockPatients.find(p => p.id === selectedPatient)
      const treatment = mockTreatments.find(t => t.id === selectedTreatment)

      if (!patient || !treatment) {
        throw new Error('Data tidak valid')
      }

      // Create treatment record (mock)
      const treatmentData = {
        patientId: patient.id,
        patientName: patient.name,
        treatmentName: treatment.name,
        originalAmount: treatmentPrice,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        voucherUsed: appliedVoucher ? {
          id: appliedVoucher.id,
          code: appliedVoucher.code,
          title: appliedVoucher.title
        } : null
      }

      console.log('Processing treatment with voucher:', treatmentData)

      // Record voucher usage if voucher is applied
      if (appliedVoucher && discountAmount > 0) {
        await fetch(`${serverUrl}/vouchers/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            voucherId: appliedVoucher.id,
            voucherCode: appliedVoucher.code,
            patientId: patient.id,
            patientName: patient.name,
            originalAmount: treatmentPrice,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            transactionType: 'treatment',
            transactionId: `treatment_${Date.now()}`
          })
        })
      }

      toast.success('Transaksi berhasil diproses!')
      
      // Reset form
      setSelectedPatient('')
      setSelectedTreatment('')
      setTreatmentPrice(0)
      setAppliedVoucher(null)
      setDiscountAmount(0)
      setFinalAmount(0)

    } catch (error) {
      console.error('Error processing transaction:', error)
      toast.error('Gagal memproses transaksi')
    } finally {
      setProcessing(false)
    }
  }

  const selectedPatientData = mockPatients.find(p => p.id === selectedPatient)
  const selectedTreatmentData = mockTreatments.find(t => t.id === selectedTreatment)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Demo Penggunaan Voucher di Sistem Tindakan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Fitur:</strong> Ini adalah demonstrasi bagaimana voucher diskon dapat diintegrasikan dengan sistem tindakan. 
              Pilih pasien dan tindakan, lalu gunakan voucher untuk mendapatkan diskon.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Transaction Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient">Pilih Pasien</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pasien..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.phone}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="treatment">Pilih Tindakan</Label>
                <Select value={selectedTreatment} onValueChange={handleTreatmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tindakan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTreatments.map((treatment) => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{treatment.name}</span>
                          <span className="text-green-600 font-medium ml-4">
                            Rp {treatment.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTreatmentData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{selectedTreatmentData.name}</p>
                      <p className="text-sm text-gray-600">Tindakan yang dipilih</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        Rp {selectedTreatmentData.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-600">Harga tindakan</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Transaction Summary */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Ringkasan Transaksi
                </h3>
                
                {selectedPatientData && (
                  <div className="mb-3">
                    <p className="text-sm text-blue-600">Pasien:</p>
                    <p className="font-medium text-blue-900">{selectedPatientData.name}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga Tindakan:</span>
                    <span className="font-medium">Rp {treatmentPrice.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {appliedVoucher && (
                    <>
                      <div className="flex justify-between text-red-600">
                        <span>Diskon ({appliedVoucher.code}):</span>
                        <span className="font-medium">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                    <span>Total Bayar:</span>
                    <span>Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {appliedVoucher && (
                  <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Voucher Diterapkan</p>
                        <p className="text-xs text-green-700">
                          Hemat Rp {discountAmount.toLocaleString('id-ID')} dengan "{appliedVoucher.title}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={processTransaction}
                disabled={!selectedPatient || !selectedTreatment || processing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                {processing ? 'Memproses...' : 'Proses Transaksi'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Voucher Section */}
          <VoucherUsage
            accessToken={accessToken}
            onVoucherApplied={handleVoucherApplied}
            originalAmount={treatmentPrice}
            patientId={selectedPatient}
            patientName={selectedPatientData?.name}
            transactionType="treatment"
            disabled={treatmentPrice === 0}
          />
        </CardContent>
      </Card>
    </div>
  )
}