import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Trash2, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Doctor {
  id: string
  name: string
  email: string
  specialization: string
  phone?: string
  createdAt?: string
}

interface CleanupAnalysis {
  total: number
  validDoctors: Doctor[]
  invalidDoctors: Doctor[]
  summary: {
    valid: number
    invalid: number
    total: number
  }
}

interface DoctorCleanupToolProps {
  accessToken: string
  onCleanupComplete?: () => void
}

export function DoctorCleanupTool({ accessToken, onCleanupComplete }: DoctorCleanupToolProps) {
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [showInvalidOnly, setShowInvalidOnly] = useState(false)

  const analyzeData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/doctors/cleanup-analysis`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
        toast.success(`Analisis selesai: ${data.summary.invalid} dokter tidak valid ditemukan`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menganalisis data dokter')
      }
    } catch (error) {
      console.log('Error analyzing doctors:', error)
      toast.error('Terjadi kesalahan saat menganalisis data')
    } finally {
      setLoading(false)
    }
  }

  const cleanupInvalidDoctors = async () => {
    setCleaning(true)
    try {
      const response = await fetch(`${serverUrl}/doctors/cleanup-invalid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        
        // Refresh analysis after cleanup
        await analyzeData()
        
        // Trigger callback if provided
        if (onCleanupComplete) {
          onCleanupComplete()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal membersihkan data dokter')
      }
    } catch (error) {
      console.log('Error cleaning doctors:', error)
      toast.error('Terjadi kesalahan saat membersihkan data')
    } finally {
      setCleaning(false)
    }
  }

  const deleteSpecificDoctor = async (doctorId: string, doctorName: string) => {
    try {
      const response = await fetch(`${serverUrl}/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success(`Dokter "${doctorName}" berhasil dihapus`)
        await analyzeData() // Refresh data
        if (onCleanupComplete) {
          onCleanupComplete()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus dokter')
      }
    } catch (error) {
      console.log('Error deleting doctor:', error)
      toast.error('Terjadi kesalahan saat menghapus dokter')
    }
  }

  const displayedDoctors = analysis ? (
    showInvalidOnly ? analysis.invalidDoctors : [...analysis.validDoctors, ...analysis.invalidDoctors]
  ) : []

  return (
    <div className="space-y-6">
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Tool Pembersihan Data Dokter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Peringatan:</strong> Tool ini akan menghapus permanen data dokter yang tidak memiliki nama valid. 
              Pastikan untuk backup data sebelum melakukan pembersihan.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analyzeData}
              disabled={loading}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Search className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Menganalisis...' : 'Analisis Data'}
            </Button>

            {analysis && analysis.summary.invalid > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={cleaning}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {cleaning ? 'Membersihkan...' : `Hapus ${analysis.summary.invalid} Dokter Tidak Valid`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Pembersihan Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda akan menghapus <strong>{analysis.summary.invalid} dokter</strong> yang tidak memiliki nama valid.
                      Aksi ini tidak dapat dibatalkan. Apakah Anda yakin?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={cleanupInvalidDoctors}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ya, Hapus Semua
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Dokter</p>
                    <p className="text-2xl text-blue-800">{analysis.summary.total}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Dokter Valid</p>
                    <p className="text-2xl text-green-800">{analysis.summary.valid}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Dokter Tidak Valid</p>
                    <p className="text-2xl text-red-800">{analysis.summary.invalid}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && displayedDoctors.length > 0 && (
        <Card className="border-pink-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-pink-800">
                Data Dokter ({showInvalidOnly ? 'Tidak Valid' : 'Semua'})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowInvalidOnly(!showInvalidOnly)}
                  variant="outline"
                  size="sm"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  {showInvalidOnly ? 'Tampilkan Semua' : 'Tampilkan Tidak Valid Saja'}
                </Button>
                <Button
                  onClick={analyzeData}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Spesialisasi</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedDoctors.map((doctor) => {
                    const isValid = doctor.name && doctor.name.trim() !== '' && doctor.name !== '-'
                    
                    return (
                      <TableRow key={doctor.id} className={!isValid ? 'bg-red-50' : 'bg-green-50'}>
                        <TableCell>
                          <Badge 
                            variant={isValid ? "default" : "destructive"}
                            className={isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {isValid ? 'Valid' : 'Tidak Valid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={!isValid ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {doctor.name || 'Tidak ada nama'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={doctor.email === 'No Email' ? 'text-gray-400' : 'text-gray-900'}>
                            {doctor.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={doctor.specialization === 'No Specialization' ? 'text-gray-400' : 'text-gray-900'}>
                            {doctor.specialization}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-500 text-sm">
                            {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('id-ID') : 'Tidak diketahui'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Dokter</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus dokter:
                                  <br />
                                  <strong>Nama:</strong> {doctor.name || 'Tidak ada nama'}
                                  <br />
                                  <strong>Email:</strong> {doctor.email}
                                  <br />
                                  <br />
                                  Aksi ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSpecificDoctor(doctor.id, doctor.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}