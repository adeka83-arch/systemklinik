import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, AlertCircle, User, Database, UserCheck } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface DatabaseSetupNewProps {
  onComplete?: () => void
}

export function DatabaseSetupNew({ onComplete }: DatabaseSetupNewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<'idle' | 'checking' | 'setting-up' | 'complete' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [setupDetails, setSetupDetails] = useState<any>(null)
  const [currentData, setCurrentData] = useState<any>(null)

  const checkCurrentSetup = async () => {
    try {
      setSetupStatus('checking')
      setStatusMessage('Memeriksa status database...')
      
      const response = await fetch(`${serverUrl}/check-setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setCurrentData(result.data)
        setStatusMessage('Status database berhasil diperiksa')
        
        if (result.data.adekaUserExists) {
          setSetupStatus('complete')
          setStatusMessage('✅ User adeka83@gmail.com sudah terdaftar dan siap digunakan!')
        } else {
          setSetupStatus('idle')
          setStatusMessage('Database kosong, perlu setup user baru')
        }
      } else {
        throw new Error(result.error || 'Gagal memeriksa status')
      }
    } catch (error) {
      console.error('Error checking setup:', error)
      setSetupStatus('error')
      setStatusMessage(`Gagal memeriksa database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const setupUserAccount = async () => {
    try {
      setIsLoading(true)
      setSetupStatus('setting-up')
      setStatusMessage('Membuat user account untuk adeka83@gmail.com...')
      
      const response = await fetch(`${serverUrl}/quick-setup-adeka`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setSetupStatus('complete')
        setSetupDetails(result)
        setStatusMessage('✅ User account berhasil dibuat!')
        
        // Auto-refresh current data
        setTimeout(() => {
          checkCurrentSetup()
        }, 1000)
        
        if (onComplete) {
          setTimeout(onComplete, 2000)
        }
      } else {
        throw new Error(result.error || 'Setup gagal')
      }
    } catch (error) {
      console.error('Setup error:', error)
      setSetupStatus('error')
      setStatusMessage(`Setup gagal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (setupStatus) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Database className="h-5 w-5 text-pink-600" />
    }
  }

  const getStatusColor = () => {
    switch (setupStatus) {
      case 'complete':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'setting-up':
      case 'checking':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-pink-50 border-pink-200'
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Database className="h-6 w-6" />
            Setup Database Baru - Falasifah Dental Clinic
          </CardTitle>
          <CardDescription>
            Setup database baru untuk sistem absensi klinik dengan user account untuk login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database Info */}
          <Alert className="border-pink-200 bg-pink-50">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Database URL:</strong> https://bxtefmfkcwbyqoctpfdb.supabase.co<br />
              <strong>Status:</strong> Siap untuk setup user account
            </AlertDescription>
          </Alert>

          {/* User Account Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="flex items-center gap-2 text-purple-800 mb-3">
              <User className="h-5 w-5" />
              Akun User yang Akan Dibuat
            </h3>
            <div className="space-y-2 text-sm">
              <div><strong>Email:</strong> adeka83@gmail.com</div>
              <div><strong>Password:</strong> 1sampai9</div>
              <div><strong>Nama:</strong> Ade Mardiansyah Eka Putra</div>
              <div><strong>Role:</strong> Administrator</div>
              <div><strong>Position:</strong> Pemilik Klinik</div>
              <div><strong>Status:</strong> <Badge variant="secondary">auth (bisa login)</Badge></div>
            </div>
          </div>

          {/* Current Status */}
          {setupStatus !== 'idle' && (
            <Alert className={getStatusColor()}>
              {getStatusIcon()}
              <AlertDescription>
                <strong>Status:</strong> {statusMessage}
                {setupStatus === 'setting-up' && (
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 inline-block mr-2"></div>
                    Membuat user account...
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Data Status */}
          {currentData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-gray-800 mb-3">
                <UserCheck className="h-5 w-5" />
                Status Database Saat Ini
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Total Employees:</strong> {currentData.totalEmployees}
                </div>
                <div>
                  <strong>Total Doctors:</strong> {currentData.totalDoctors}
                </div>
                <div>
                  <strong>Auth Employees:</strong> {currentData.authEmployees}
                </div>
                <div>
                  <strong>Auth Doctors:</strong> {currentData.authDoctors}
                </div>
                <div className="col-span-2">
                  <strong>User Adeka Exists:</strong> {' '}
                  <Badge variant={currentData.adekaUserExists ? "default" : "secondary"}>
                    {currentData.adekaUserExists ? "✅ Ya" : "❌ Tidak"}
                  </Badge>
                </div>
              </div>
              
              {currentData.authEmployeesList?.length > 0 && (
                <div className="mt-3">
                  <strong className="text-sm">Auth Employees:</strong>
                  <ul className="text-sm text-gray-600 mt-1">
                    {currentData.authEmployeesList.map((emp: any, idx: number) => (
                      <li key={idx}>• {emp.name} ({emp.email})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Setup Instructions */}
          {setupDetails && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 mb-3">✅ Setup Berhasil!</h3>
              <div className="space-y-1 text-sm text-green-700">
                {setupDetails.instructions?.map((instruction: string, index: number) => (
                  <div key={index}>{instruction}</div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-green-100 rounded border text-sm">
                <strong>Cara Login:</strong><br />
                1. Refresh halaman ini<br />
                2. Gunakan email: <code>adeka83@gmail.com</code><br />
                3. Gunakan password: <code>1sampai9</code><br />
                4. Klik login dan mulai menggunakan sistem
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={checkCurrentSetup}
              variant="outline"
              disabled={setupStatus === 'checking' || setupStatus === 'setting-up'}
              className="flex-1"
            >
              {setupStatus === 'checking' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
                  Memeriksa...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Periksa Status Database
                </>
              )}
            </Button>

            <Button
              onClick={setupUserAccount}
              disabled={isLoading || setupStatus === 'complete'}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setup User...
                </>
              ) : setupStatus === 'complete' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setup Selesai
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Setup User Account
                </>
              )}
            </Button>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 mb-2">📋 Catatan Penting</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• User akan dibuat sebagai Employee dan Doctor dengan status 'auth'</p>
              <p>• Status 'auth' diperlukan agar user bisa login ke sistem</p>
              <p>• User akan memiliki role Administrator dengan akses penuh</p>
              <p>• Database menggunakan KV Store untuk menyimpan data aplikasi</p>
              <p>• Setup hanya perlu dilakukan sekali untuk database baru</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}