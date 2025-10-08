import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { AlertTriangle, Trash2, Eye, RefreshCw, CheckCircle, XCircle, UserCheck, Edit } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Doctor {
  id: string
  name: string
  email: string
  specialization: string
  classification: 'real' | 'test' | 'unknown'
  createdAt?: string
}

interface DoctorDataCleanupToolProps {
  accessToken: string
  onDataCleaned?: () => void
}

export function DoctorDataCleanupTool({ accessToken, onDataCleaned }: DoctorDataCleanupToolProps) {
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showDoctors, setShowDoctors] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<any>(null)

  const listAllDoctors = async () => {
    try {
      setLoading(true)
      console.log('🔍 Listing all doctors for analysis...')
      
      const response = await fetch(`${serverUrl}/debug/list-doctors`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors list')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setDoctors(data.allDoctors || [])
        setShowDoctors(true)
        
        toast.success(`Ditemukan ${data.summary.total} dokter total:
        • ${data.summary.real} dokter real
        • ${data.summary.test} dokter test/dummy
        • ${data.summary.unknown} dokter tidak jelas`)
        
        console.log('✅ Doctor list retrieved:', data.summary)
      } else {
        throw new Error(data.error || 'Failed to list doctors')
      }
    } catch (error) {
      console.error('❌ Error listing doctors:', error)
      toast.error('Gagal mengambil daftar dokter: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const cleanupTestDoctors = async () => {
    try {
      setLoading(true)
      console.log('🧹 Starting cleanup of test/dummy doctors...')
      
      const response = await fetch(`${serverUrl}/debug/cleanup-test-doctors`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to cleanup test doctors')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCleanupResult(data)
        
        toast.success(`✅ Pembersihan berhasil!
        • ${data.deletedDoctors.length} dokter test/dummy dihapus
        • ${data.preservedDoctors.length} dokter real dipertahankan
        • ${data.failedDeletions.length} gagal dihapus`)
        
        console.log('✅ Cleanup completed:', data.summary)
        
        // Refresh doctor list
        await listAllDoctors()
        
        // Notify parent component
        if (onDataCleaned) {
          onDataCleaned()
        }
      } else {
        throw new Error(data.error || 'Failed to cleanup doctors')
      }
    } catch (error) {
      console.error('❌ Error cleaning up doctors:', error)
      toast.error('Gagal membersihkan data dokter: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const cleanupUnknownDoctors = async () => {
    try {
      setLoading(true)
      console.log('🧹 Starting cleanup of unknown doctors (will be treated as dummy)...')
      
      const response = await fetch(`${serverUrl}/debug/cleanup-unknown-doctors`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to cleanup unknown doctors')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCleanupResult(data)
        
        toast.success(`✅ Pembersihan dokter tidak jelas berhasil!
        • ${data.deletedDoctors.length} dokter dihapus
        • ${data.preservedDoctors.length} dokter real dipertahankan`)
        
        console.log('✅ Unknown cleanup completed:', data.summary)
        
        // Refresh doctor list
        await listAllDoctors()
        
        // Notify parent component
        if (onDataCleaned) {
          onDataCleaned()
        }
      } else {
        throw new Error(data.error || 'Failed to cleanup unknown doctors')
      }
    } catch (error) {
      console.error('❌ Error cleaning up unknown doctors:', error)
      toast.error('Gagal membersihkan dokter tidak jelas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const markDoctorAsReal = async (doctorId: string, doctorName: string) => {
    try {
      setLoading(true)
      console.log(`🔄 Marking doctor ${doctorName} as real...`)
      
      const response = await fetch(`${serverUrl}/debug/mark-doctor-real`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId, doctorName })
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark doctor as real')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`✅ ${doctorName} berhasil ditandai sebagai dokter real!`)
        
        // Refresh doctor list
        await listAllDoctors()
        
        // Notify parent component
        if (onDataCleaned) {
          onDataCleaned()
        }
      } else {
        throw new Error(data.error || 'Failed to mark doctor as real')
      }
    } catch (error) {
      console.error('❌ Error marking doctor as real:', error)
      toast.error('Gagal menandai dokter sebagai real: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'real':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Real
          </Badge>
        )
      case 'test':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Test/Dummy
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const realDoctors = doctors.filter(d => d.classification === 'real')
  const testDoctors = doctors.filter(d => d.classification === 'test')
  const unknownDoctors = doctors.filter(d => d.classification === 'unknown')

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Trash2 className="h-5 w-5" />
          Doctor Data Cleanup Tool
        </CardTitle>
        <CardDescription className="text-orange-700">
          Tool untuk membersihkan data dokter dummy/test dan memperbaiki inkonsistensi data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Stats */}
        {doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-gray-800">{doctors.length}</div>
              <div className="text-xs text-gray-600">Total Dokter</div>
            </div>
            <div className="bg-green-50 p-3 rounded border text-center">
              <div className="text-lg font-semibold text-green-800">{realDoctors.length}</div>
              <div className="text-xs text-green-600">Dokter Real</div>
            </div>
            <div className="bg-red-50 p-3 rounded border text-center">
              <div className="text-lg font-semibold text-red-800">{testDoctors.length}</div>
              <div className="text-xs text-red-600">Dokter Test/Dummy</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded border text-center">
              <div className="text-lg font-semibold text-yellow-800">{unknownDoctors.length}</div>
              <div className="text-xs text-yellow-600">Tidak Jelas</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={listAllDoctors}
            disabled={loading}
            className="bg-blue-50 border-blue-200 text-blue-700"
          >
            <Eye className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Analisis Data Dokter
          </Button>
          
          {/* Button untuk menghapus dokter test/dummy - IMPROVED LOGIC */}
          {doctors.length > 0 && (testDoctors.length > 0 || unknownDoctors.length === 0) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={cleanupTestDoctors}
              disabled={loading}
              className="bg-red-50 border-red-200 text-red-700"
            >
              <Trash2 className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {testDoctors.length > 0 ? `Hapus ${testDoctors.length} Dokter Test/Dummy` : 'Bersihkan Data Dummy'}
            </Button>
          )}

          {/* Button untuk menghapus dokter unknown */}
          {unknownDoctors.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={cleanupUnknownDoctors}
              disabled={loading}
              className="bg-yellow-50 border-yellow-200 text-yellow-700"
            >
              <Trash2 className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Hapus {unknownDoctors.length} Dokter Tidak Jelas
            </Button>
          )}
        </div>

        {/* Doctor List */}
        {showDoctors && doctors.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-orange-800">Daftar Dokter Ditemukan:</h4>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-3 bg-white rounded border text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{doctor.name}</div>
                      <div className="text-gray-500 text-xs truncate">{doctor.email}</div>
                      <div className="text-gray-400 text-xs">{doctor.specialization}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {getClassificationBadge(doctor.classification)}
                      
                      {/* Button untuk mark dokter unknown sebagai real */}
                      {doctor.classification === 'unknown' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markDoctorAsReal(doctor.id, doctor.name)}
                          disabled={loading}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 px-2 py-1 h-auto text-xs"
                          title={`Tandai ${doctor.name} sebagai dokter real`}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Real
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cleanup Result */}
        {cleanupResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-orange-800">Hasil Pembersihan:</h4>
              
              <div className="bg-white p-3 rounded border">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Dokter Test/Dummy Dihapus:</span>
                    <span className="font-medium text-red-600">{cleanupResult.deletedDoctors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dokter Real Dipertahankan:</span>
                    <span className="font-medium text-green-600">{cleanupResult.preservedDoctors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gagal Dihapus:</span>
                    <span className="font-medium text-yellow-600">{cleanupResult.failedDeletions.length}</span>
                  </div>
                </div>
              </div>

              {cleanupResult.deletedDoctors.length > 0 && (
                <div className="bg-red-50 p-3 rounded border">
                  <div className="text-xs font-medium text-red-800 mb-2">Dokter yang Dihapus:</div>
                  <div className="space-y-1">
                    {cleanupResult.deletedDoctors.map((doctor: any, index: number) => (
                      <div key={index} className="text-xs text-red-700">
                        • {doctor.name} ({doctor.email})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Warning */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-800">
              <p className="font-medium mb-1">Informasi Penting:</p>
              <ul className="text-xs space-y-1">
                <li>• Tool ini akan menghapus dokter yang mengandung kata: test, dummy, contoh, demo, sample</li>
                <li>• Dokter real dengan email: ekapuspitasari133@gmail.com, lalafalasifah@gmail.com, muhammazwindar@yahoo.com akan dipertahankan</li>
                <li>• Gunakan tombol "Real" di samping dokter Unknown untuk menandai sebagai dokter real</li>
                <li>• Lakukan analisis terlebih dahulu sebelum cleanup untuk memastikan data yang akan dihapus</li>
                <li>• Setelah cleanup, dashboard akan menampilkan jumlah dokter yang benar</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}