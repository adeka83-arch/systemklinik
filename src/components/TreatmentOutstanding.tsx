import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { AlertTriangle, Calendar, Phone, User, Stethoscope, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface TreatmentOutstandingProps {
  accessToken: string
  onPaymentUpdate?: () => void // Callback untuk refresh data
}

interface OutstandingTreatment {
  id: string
  patientName: string
  patientPhone?: string
  doctorName: string
  totalTindakan: number
  dpAmount: number
  outstandingAmount: number
  date: string
  paymentMethod?: string
  treatmentTypes: Array<{
    id: string
    name: string
    finalPrice: number
  }>
}

export function TreatmentOutstanding({ accessToken, onPaymentUpdate }: TreatmentOutstandingProps) {
  const [outstandingTreatments, setOutstandingTreatments] = useState<OutstandingTreatment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<OutstandingTreatment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processLoading, setProcessLoading] = useState(false)

  useEffect(() => {
    fetchOutstandingTreatments()
  }, [])

  const fetchOutstandingTreatments = async () => {
    try {
      setLoading(true)
      console.log('Fetching outstanding treatments...')
      
      const response = await fetch(`${serverUrl}/treatments?paymentStatus=dp`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Outstanding treatments response:', data)
      
      if (data.treatments) {
        // Filter only DP transactions with outstanding amount > 0
        const outstanding = data.treatments.filter((treatment: any) => 
          treatment.paymentStatus === 'dp' && 
          treatment.outstandingAmount && 
          treatment.outstandingAmount > 0
        )
        setOutstandingTreatments(outstanding)
        console.log('Found outstanding treatments:', outstanding.length)
      } else {
        setOutstandingTreatments([])
      }
    } catch (error) {
      console.log('Error fetching outstanding treatments:', error)
      setOutstandingTreatments([])
      // Don't show toast error for dashboard components as it's not critical
    } finally {
      setLoading(false)
    }
  }

  const totalOutstanding = outstandingTreatments.reduce((sum, treatment) => sum + treatment.outstandingAmount, 0)

  const handlePaymentComplete = async () => {
    if (!selectedTreatment) return

    try {
      setProcessLoading(true)
      
      // Update treatment to lunas status
      const updateData = {
        paymentStatus: 'lunas',
        paymentMethod: paymentMethod,
        paymentNotes: paymentNotes,
        dpAmount: selectedTreatment.totalTindakan, // Set DP amount to full amount
        outstandingAmount: 0, // Clear outstanding
        updatedAt: new Date().toISOString()
      }

      const response = await fetch(`${serverUrl}/treatments/${selectedTreatment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success(`Pelunasan berhasil untuk ${selectedTreatment.patientName}`)
        
        // Reset dialog
        setDialogOpen(false)
        setSelectedTreatment(null)
        setPaymentMethod('cash')
        setPaymentNotes('')
        
        // Refresh data
        await fetchOutstandingTreatments()
        onPaymentUpdate?.() // Callback to parent component
      } else {
        const errorData = await response.json()
        toast.error(`Gagal melakukan pelunasan: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error completing payment:', error)
      toast.error('Gagal melakukan pelunasan')
    } finally {
      setProcessLoading(false)
    }
  }

  const openPaymentDialog = (treatment: OutstandingTreatment) => {
    setSelectedTreatment(treatment)
    setPaymentMethod('cash')
    setPaymentNotes('')
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Outstanding Tindakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (outstandingTreatments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Outstanding Tindakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Tidak ada outstanding tindakan
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Outstanding Tindakan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Alert */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{outstandingTreatments.length} tindakan</strong> dengan total outstanding: 
            <strong className="ml-1">Rp {totalOutstanding.toLocaleString('id-ID')}</strong>
          </AlertDescription>
        </Alert>

        {/* Outstanding List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {outstandingTreatments.map((treatment) => (
            <div key={treatment.id} className="p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{treatment.patientName}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {treatment.patientPhone || '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      {treatment.doctorName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-orange-700">
                    Rp {treatment.outstandingAmount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500">Outstanding</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                <strong>Tindakan:</strong> 
                {treatment.treatmentTypes.slice(0, 2).map(t => t.name).join(', ')}
                {treatment.treatmentTypes.length > 2 && ` (+${treatment.treatmentTypes.length - 2} lainnya)`}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <strong>Total:</strong> Rp {treatment.totalTindakan.toLocaleString('id-ID')}
                </div>
                <div>
                  <strong>DP:</strong> Rp {treatment.dpAmount.toLocaleString('id-ID')}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-orange-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(treatment.date).toLocaleDateString('id-ID')}
                </div>
                <div className="flex items-center gap-2">
                  {treatment.paymentMethod && (
                    <Badge variant="secondary" className="text-xs">
                      {treatment.paymentMethod}
                    </Badge>
                  )}
                  <Button
                    onClick={() => openPaymentDialog(treatment)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 h-7"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Lunasi
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pink-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Konfirmasi Pelunasan
              </DialogTitle>
              <DialogDescription>
                Konfirmasi untuk melunasi pembayaran tindakan outstanding ini. Setelah dikonfirmasi, status pembayaran akan berubah menjadi lunas.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTreatment && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{selectedTreatment.patientName}</h4>
                  <p className="text-sm text-gray-600">
                    Dokter: {selectedTreatment.doctorName}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Total: Rp {selectedTreatment.totalTindakan.toLocaleString('id-ID')}</p>
                    <p>DP: Rp {selectedTreatment.dpAmount.toLocaleString('id-ID')}</p>
                    <p className="font-medium text-orange-600">
                      Outstanding: Rp {selectedTreatment.outstandingAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Pembayaran Pelunasan
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="cc">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan Pelunasan (Opsional)
                    </label>
                    <Textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Catatan untuk pelunasan..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={processLoading}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handlePaymentComplete}
                    disabled={processLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Memproses...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Konfirmasi Pelunasan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}