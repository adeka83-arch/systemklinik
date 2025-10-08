import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Stethoscope, RefreshCw, Plus } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface DoctorsMinimalProps {
  accessToken: string
}

export function DoctorsMinimal({ accessToken }: DoctorsMinimalProps) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || data || [])
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      // Non-blocking background fetch
      setTimeout(() => fetchDoctors(), 100)
    }
  }, [accessToken])

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Manajemen Dokter (Minimal)
              </CardTitle>
              <p className="text-sm text-pink-600 mt-1">
                Versi ringan untuk mencegah timeout
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchDoctors}
                disabled={loading}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => toast.info('Fitur tambah dokter tersedia di versi lengkap')}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Dokter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-pink-600">Memuat data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Total dokter: {doctors.length}
              </div>
              
              {doctors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {doctors.map((doctor: any, index) => (
                    <div key={doctor.id || index} className="p-4 border border-pink-200 rounded-lg">
                      <h3 className="font-medium text-pink-800">{doctor.name || 'Nama tidak tersedia'}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialization || 'Spesialisasi tidak tersedia'}</p>
                      <p className="text-xs text-gray-500 mt-2">{doctor.email || 'Email tidak tersedia'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-pink-600">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-pink-300" />
                  <p>Belum ada data dokter atau data belum dimuat</p>
                  <Button 
                    onClick={fetchDoctors}
                    className="mt-4"
                    variant="outline"
                  >
                    Muat Data
                  </Button>
                </div>
              )}
              
              <div className="text-center pt-4 border-t border-pink-200">
                <p className="text-xs text-gray-500">
                  Ini adalah versi minimal untuk mencegah timeout. 
                  Fitur lengkap tersedia setelah perbaikan server.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}