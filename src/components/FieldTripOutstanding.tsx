import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { AlertTriangle, Calendar, Phone, Building2, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface FieldTripOutstandingProps {
  accessToken: string
  onPaymentUpdate?: () => void // Callback untuk refresh data
}

interface OutstandingFieldTrip {
  id: string
  customerName: string
  customerPhone: string
  organization?: string
  productName: string
  finalAmount: number
  dpAmount: number
  outstandingAmount: number
  saleDate: string
  eventDate?: string
  paymentMethod?: string
  paymentStatus?: string
}

export function FieldTripOutstanding({ accessToken, onPaymentUpdate }: FieldTripOutstandingProps) {
  const [outstandingTrips, setOutstandingTrips] = useState<OutstandingFieldTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<OutstandingFieldTrip | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processLoading, setProcessLoading] = useState(false)

  useEffect(() => {
    fetchOutstandingTrips()
  }, [])

  const fetchOutstandingTrips = async (retryCount = 0) => {
    try {
      setLoading(true)
      console.log(`Fetching outstanding field trips (attempt ${retryCount + 1})...`)
      
      const response = await fetch(`${serverUrl}/field-trip-sales`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const responseText = await response.text()
      console.log('Raw response length:', responseText.length)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.log('JSON parse error:', parseError)
        if (retryCount < 2) {
          console.log('Retrying after parse error...')
          setTimeout(() => fetchOutstandingTrips(retryCount + 1), 1000)
          return
        }
        throw new Error('Invalid JSON response from server')
      }
      
      console.log('Parsed field trip sales response:', data)
      
      if (data.success && data.fieldTripSales) {
        console.log('Total field trip sales:', data.fieldTripSales.length)
        
        // Debug: log all sales with their payment status
        data.fieldTripSales.forEach((sale: any, index: number) => {
          console.log(`Sale ${index + 1}:`, {
            id: sale.id,
            customerName: sale.customerName,
            paymentStatus: sale.paymentStatus,
            outstandingAmount: sale.outstandingAmount,
            finalAmount: sale.finalAmount,
            dpAmount: sale.dpAmount
          })
        })
        
        // Filter DP transactions with outstanding amount > 0 OR tempo transactions
        const outstanding = (data.fieldTripSales || []).filter((sale: any) => {
          const isOutstandingDP = sale.paymentStatus === 'dp' && sale.outstandingAmount && sale.outstandingAmount > 0
          const isTempo = sale.paymentStatus === 'tempo'
          
          console.log(`Sale ${sale.customerName || sale.id}: DP=${isOutstandingDP}, Tempo=${isTempo}`)
          
          return isOutstandingDP || isTempo
        })
        
        console.log('Filtered outstanding trips:', outstanding.length, outstanding)
        setOutstandingTrips(outstanding)
      } else {
        console.log('No field trip sales data found or error response')
        console.log('Response status:', response.status)
        console.log('Response data:', data)
        
        // Only try debug endpoint if we haven't retried yet
        if (retryCount === 0) {
          console.log('Trying debug endpoint...')
          try {
            const debugResponse = await fetch(`${serverUrl}/debug/field-trip-sales`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            })
            const debugResponseText = await debugResponse.text()
            console.log('Debug response raw:', debugResponseText)
            
            const debugData = JSON.parse(debugResponseText)
            console.log('Debug endpoint response:', debugData)
          } catch (debugError) {
            console.log('Debug endpoint error:', debugError)
          }
        }
        
        // Set empty array if no data
        setOutstandingTrips([])
      }
    } catch (error) {
      console.log('Error fetching outstanding field trips:', error)
      if (retryCount < 2) {
        console.log('Retrying after error...')
        setTimeout(() => fetchOutstandingTrips(retryCount + 1), 2000)
        return
      }
      setOutstandingTrips([])
      // Don't show toast error for dashboard components as it's not critical
    } finally {
      setLoading(false)
    }
  }

  const totalOutstanding = outstandingTrips.reduce((sum, trip) => {
    if (trip.paymentStatus === 'tempo') {
      return sum + trip.finalAmount // For tempo, the full amount is outstanding
    }
    return sum + trip.outstandingAmount // For DP, only the remaining amount
  }, 0)

  const handlePaymentComplete = async () => {
    if (!selectedTrip) return

    try {
      setProcessLoading(true)
      
      // Update field trip sale to lunas status
      const updateData = {
        paymentStatus: 'lunas',
        paymentMethod: paymentMethod,
        paymentNotes: paymentNotes,
        dpAmount: selectedTrip.finalAmount, // Set DP amount to full amount
        outstandingAmount: 0, // Clear outstanding
        updatedAt: new Date().toISOString()
      }

      const response = await fetch(`${serverUrl}/field-trip-sales/${selectedTrip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success(`Pelunasan berhasil untuk ${selectedTrip.customerName}`)
        
        // Reset dialog
        setDialogOpen(false)
        setSelectedTrip(null)
        setPaymentMethod('cash')
        setPaymentNotes('')
        
        // Refresh data
        await fetchOutstandingTrips()
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

  const openPaymentDialog = (trip: OutstandingFieldTrip) => {
    setSelectedTrip(trip)
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
            Outstanding Field Trip
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

  if (outstandingTrips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Outstanding Field Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Tidak ada outstanding field trip
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
          Outstanding Field Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Alert */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{outstandingTrips.length} transaksi</strong> dengan total outstanding: 
            <strong className="ml-1">Rp {totalOutstanding.toLocaleString('id-ID')}</strong>
          </AlertDescription>
        </Alert>

        {/* Outstanding List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {outstandingTrips.map((trip) => {
            const isTempoPayment = trip.paymentStatus === 'tempo'
            const displayAmount = isTempoPayment ? trip.finalAmount : trip.outstandingAmount
            const backgroundClass = isTempoPayment ? 'bg-gradient-to-r from-red-50 to-pink-50' : 'bg-gradient-to-r from-orange-50 to-yellow-50'
            const borderClass = isTempoPayment ? 'border-red-200' : 'border-orange-200'
            
            return (
              <div key={trip.id} className={`p-3 border rounded-lg ${isTempoPayment ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{trip.customerName}</h4>
                      <Badge 
                        variant={isTempoPayment ? 'destructive' : 'secondary'}
                        className={`text-xs flex-shrink-0 ${isTempoPayment ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {isTempoPayment ? 'TEMPO' : 'DP'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1 truncate">
                      {trip.productName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {trip.organization}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`font-medium ${isTempoPayment ? 'text-red-700' : 'text-orange-700'}`}>
                      Rp {displayAmount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isTempoPayment ? 'Total Tempo' : 'Outstanding'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    {trip.eventDate ? new Date(trip.eventDate).toLocaleDateString('id-ID') : new Date(trip.saleDate).toLocaleDateString('id-ID')}
                  </div>
                  <Button
                    onClick={() => openPaymentDialog(trip)}
                    size="sm"
                    className={`h-6 px-2 py-0 text-xs ${isTempoPayment ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    {isTempoPayment ? 'Bayar' : 'Lunasi'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pink-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Konfirmasi Pelunasan Field Trip
              </DialogTitle>
              <DialogDescription>
                Konfirmasi untuk melunasi pembayaran field trip outstanding ini. Setelah dikonfirmasi, status pembayaran akan berubah menjadi lunas.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTrip && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{selectedTrip.customerName}</h4>
                    <Badge 
                      variant={selectedTrip.paymentStatus === 'tempo' ? 'destructive' : 'secondary'}
                      className={`text-xs ${selectedTrip.paymentStatus === 'tempo' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {selectedTrip.paymentStatus === 'tempo' ? 'TEMPO' : 'DP'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Produk: {selectedTrip.productName}
                  </p>
                  {selectedTrip.organization && (
                    <p className="text-sm text-gray-600">
                      Organisasi: {selectedTrip.organization}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Total: Rp {selectedTrip.finalAmount.toLocaleString('id-ID')}</p>
                    {selectedTrip.paymentStatus !== 'tempo' && (
                      <>
                        <p>DP: Rp {selectedTrip.dpAmount.toLocaleString('id-ID')}</p>
                        <p className="font-medium text-orange-600">
                          Outstanding: Rp {selectedTrip.outstandingAmount.toLocaleString('id-ID')}
                        </p>
                      </>
                    )}
                    {selectedTrip.paymentStatus === 'tempo' && (
                      <p className="font-medium text-red-600">
                        Jumlah yang harus dibayar: Rp {selectedTrip.finalAmount.toLocaleString('id-ID')}
                      </p>
                    )}
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