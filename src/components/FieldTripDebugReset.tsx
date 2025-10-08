import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { AlertTriangle, Database, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface FieldTripDebugProps {
  accessToken: string
}

export function FieldTripDebugReset({ accessToken }: FieldTripDebugProps) {
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/debug/field-trip-data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setDebugData(data)
        console.log('Debug data:', data)
        toast.success('Data debug berhasil diambil')
      } else {
        toast.error(data.error || 'Gagal mengambil data debug')
      }
    } catch (error) {
      console.log('Error fetching debug data:', error)
      toast.error('Gagal mengambil data debug')
    } finally {
      setLoading(false)
    }
  }

  const resetAllData = async () => {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA data field trip (penjualan dan produk). Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/reset/field-trip-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Data berhasil direset: ${data.deletedCounts.sales} penjualan, ${data.deletedCounts.products} produk dihapus`)
        setDebugData(null)
        // Refresh page untuk memastikan semua komponen terupdate
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error(data.error || 'Gagal mereset data')
      }
    } catch (error) {
      console.log('Error resetting data:', error)
      toast.error('Gagal mereset data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Debug & Reset Field Trip Data
        </CardTitle>
        <p className="text-sm text-orange-700">
          Gunakan tools ini untuk debugging masalah data field trip dan mereset data jika diperlukan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={fetchDebugData}
            disabled={loading}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Database className="h-4 w-4 mr-2" />
            {loading ? 'Memuat...' : 'Periksa Data'}
          </Button>
          
          <Button
            onClick={resetAllData}
            disabled={loading}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? 'Mereset...' : 'Reset Semua Data'}
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Halaman
          </Button>
        </div>

        {debugData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-800">Penjualan Field Trip</div>
                <div className="text-2xl font-bold text-blue-600">{debugData.summary.salesCount}</div>
                <div className="text-sm text-blue-600">Record ditemukan</div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-800">Produk Field Trip</div>
                <div className="text-2xl font-bold text-green-600">{debugData.summary.productsCount}</div>
                <div className="text-sm text-green-600">Record ditemukan</div>
              </div>
            </div>

            {debugData.fieldTripSales && debugData.fieldTripSales.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Data Penjualan Field Trip:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {debugData.fieldTripSales.map((sale: any, index: number) => (
                    <div key={sale.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{index + 1}. {sale.customerName || 'No Customer'}</div>
                          <div className="text-gray-600">{sale.productName || 'No Product'}</div>
                          <div className="text-xs text-gray-500">ID: {sale.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Rp {(sale.finalAmount || 0).toLocaleString('id-ID')}</div>
                          <div className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString('id-ID')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugData.fieldTripProducts && debugData.fieldTripProducts.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Data Produk Field Trip:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {debugData.fieldTripProducts.map((product: any, index: number) => (
                    <div key={product.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{index + 1}. {product.name}</div>
                          <div className="text-xs text-gray-500">ID: {product.id}</div>
                        </div>
                        <div className="text-right">
                          <div>Rp {(product.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}