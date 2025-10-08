import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { RefreshCw, TestTube, Eye } from 'lucide-react'

interface StockDebugProps {
  accessToken: string
}

interface Product {
  id: string
  name: string
  stock: number
  category: string
  price: number
  lastStockReduction?: {
    treatmentId: string
    quantity: number
    date: string
    reason: string
  }
  lastStockRestore?: {
    treatmentId: string
    quantity: number
    date: string
    reason: string
  }
}

export function StockDebugComponent({ accessToken }: StockDebugProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [testProductId, setTestProductId] = useState('')
  const [testQuantity, setTestQuantity] = useState(1)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const medicationProducts = data.products.filter((p: Product) => p.category === 'Obat')
        setProducts(medicationProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal mengambil data produk')
    } finally {
      setLoading(false)
    }
  }

  const testStockReduction = async () => {
    if (!testProductId || testQuantity <= 0) {
      toast.error('Pilih produk dan masukkan jumlah yang valid')
      return
    }

    try {
      // Create test treatment to trigger stock reduction
      const testTreatment = {
        doctorId: 'test_doctor',
        doctorName: 'Test Doctor',
        patientId: 'test_patient',
        patientName: 'Test Patient',
        patientPhone: '123456789',
        treatmentTypes: [],
        selectedMedications: [{
          id: testProductId,
          name: 'Test Medication',
          price: 10000,
          quantity: testQuantity,
          totalPrice: 10000 * testQuantity
        }],
        description: 'Test stock reduction',
        subtotal: 0,
        totalDiscount: 0,
        totalNominal: 0,
        medicationCost: 10000 * testQuantity,
        totalTindakan: 10000 * testQuantity,
        feePercentage: 0,
        calculatedFee: 0,
        shift: 'Pagi',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        paymentStatus: 'lunas',
        dpAmount: 0,
        outstandingAmount: 0,
        paymentNotes: 'Test treatment for stock reduction'
      }

      console.log('🧪 Testing stock reduction with:', testTreatment)
      
      const response = await fetch(`${serverUrl}/treatments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(testTreatment)
      })

      if (response.ok) {
        toast.success(`✅ Test berhasil! Stok produk berkurang ${testQuantity} unit`)
        // Refresh products to see the changes
        setTimeout(fetchProducts, 1000)
      } else {
        const error = await response.json()
        toast.error(`Gagal test stock reduction: ${error.error}`)
      }
    } catch (error) {
      console.error('Test stock reduction error:', error)
      toast.error('Terjadi kesalahan saat test')
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Debug & Test Stock Reduction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fetchProducts} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Lihat Stok Obat'}
          </Button>
          
          <Button 
            onClick={fetchProducts} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {products.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`p-3 rounded border-2 cursor-pointer transition-colors ${
                    testProductId === product.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                  onClick={() => setTestProductId(product.id)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    Stok: <Badge variant={product.stock <= 5 ? 'destructive' : 'secondary'}>
                      {product.stock}
                    </Badge>
                  </div>
                  {product.lastStockReduction && (
                    <div className="text-xs text-red-600 mt-1">
                      📉 Last reduction: -{product.lastStockReduction.quantity} ({product.lastStockReduction.reason})
                    </div>
                  )}
                  {product.lastStockRestore && (
                    <div className="text-xs text-green-600 mt-1">
                      📈 Last restore: +{product.lastStockRestore.quantity} ({product.lastStockRestore.reason})
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Test Stock Reduction</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={testQuantity}
                  onChange={(e) => setTestQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Jumlah"
                  className="w-20"
                />
                <Button 
                  onClick={testStockReduction}
                  disabled={!testProductId}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Kurangi Stok
                </Button>
              </div>
              {testProductId && (
                <div className="text-xs text-gray-600 mt-1">
                  Akan mengurangi stok produk terpilih sebanyak {testQuantity} unit
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Klik "Lihat Stok Obat" untuk memuat data
          </div>
        )}
      </CardContent>
    </Card>
  )
}