import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { RefreshCw, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface DoctorDataSyncToolProps {
  accessToken: string
  onSyncComplete?: () => void
}

interface SyncResult {
  preservedDoctors: Array<{
    id: string
    name: string
    email: string
    specialization: string
    note?: string
  }>
  deletedDoctors: Array<{
    id: string
    name: string
    email: string
    reason: string
  }>
  invalidDoctors: Array<{
    id: string
    name: string
    reason: string
  }>
  summary: {
    total: number
    preserved: number
    deleted: number
    message: string
  }
}

export function DoctorDataSyncTool({ accessToken, onSyncComplete }: DoctorDataSyncToolProps) {
  const [loading, setLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const handleSyncCleanup = async () => {
    try {
      setLoading(true)
      console.log('🔄 Starting doctor data sync cleanup...')

      const response = await fetch(`${serverUrl}/doctors/sync-cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to sync doctor data')
      }

      const result = await response.json()
      console.log('✅ Doctor sync cleanup result:', result)

      setSyncResult(result)
      toast.success(result.summary.message)
      
      if (onSyncComplete) {
        onSyncComplete()
      }

    } catch (error) {
      console.error('❌ Error syncing doctor data:', error)
      toast.error('Gagal membersihkan data dokter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sinkronisasi Data Dokter
        </CardTitle>
        <p className="text-sm text-orange-600">
          Bersihkan data dokter yang tidak valid dan sinkronkan dengan data yang benar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!syncResult ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Tool ini akan:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                <li>Mempertahankan data dokter yang valid (3 dokter aktif)</li>
                <li>Menghapus data dokter yang tidak valid atau duplikat</li>
                <li>Menghapus data test/dummy yang tidak diperlukan</li>
                <li>Menyinkronkan jumlah dokter di dashboard</li>
              </ul>
            </div>
            
            <Button
              onClick={handleSyncCleanup}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Membersihkan Data...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bersihkan & Sinkronkan Data Dokter
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Sinkronisasi Selesai</span>
              </div>
              <p className="text-sm text-green-700">{syncResult.summary.message}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{syncResult.summary.total}</p>
                  <p className="text-xs text-green-600">Total Sebelumnya</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{syncResult.summary.preserved}</p>
                  <p className="text-xs text-blue-600">Dipertahankan</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{syncResult.summary.deleted}</p>
                  <p className="text-xs text-red-600">Dihapus</p>
                </div>
              </div>
            </div>

            {/* Preserved Doctors */}
            {syncResult.preservedDoctors.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Dokter yang Dipertahankan ({syncResult.preservedDoctors.length})
                </h4>
                <div className="space-y-2">
                  {syncResult.preservedDoctors.map((doctor, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">{doctor.name}</p>
                          <p className="text-sm text-green-600">{doctor.specialization}</p>
                          <p className="text-xs text-green-500">{doctor.email}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Valid
                        </Badge>
                      </div>
                      {doctor.note && (
                        <p className="text-xs text-orange-600 mt-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {doctor.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deleted Doctors */}
            {syncResult.deletedDoctors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Dokter yang Dihapus ({syncResult.deletedDoctors.length})
                </h4>
                <div className="space-y-2">
                  {syncResult.deletedDoctors.map((doctor, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800">{doctor.name || 'Unknown'}</p>
                          <p className="text-sm text-red-600">{doctor.email || 'No email'}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {doctor.reason}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid Structure Doctors */}
            {syncResult.invalidDoctors.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Data Tidak Valid ({syncResult.invalidDoctors.length})
                </h4>
                <div className="space-y-2">
                  {syncResult.invalidDoctors.map((doctor, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-orange-800">{doctor.name || 'Invalid Entry'}</p>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                          {doctor.reason}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setSyncResult(null)}
                variant="outline"
                className="flex-1"
              >
                Tutup Hasil
              </Button>
              <Button
                onClick={handleSyncCleanup}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Ulang
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}