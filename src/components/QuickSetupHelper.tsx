import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Loader2, CheckCircle, XCircle, User, Settings, Database, Shield } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface SetupStatus {
  email: string
  name: string
  kvUserExists: boolean
  authUserExists: boolean
  canLogin: boolean
  userType: string
  setupComplete: boolean
}

interface SetupResponse {
  success: boolean
  message: string
  details: SetupStatus
  loginInstructions?: {
    email: string
    password: string
    message: string
  }
  error?: string
}

export function QuickSetupHelper() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<SetupResponse | null>(null)

  const handleQuickSetup = async () => {
    setIsLoading(true)
    setSetupResult(null)

    try {
      console.log('🚀 Starting quick setup for adeka user...')
      
      const response = await fetch(`${serverUrl}/quick-setup-adeka`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Quick setup completed:', data)
        setSetupResult(data)
      } else {
        console.error('❌ Quick setup failed:', data)
        setSetupResult({
          success: false,
          message: data.error || 'Setup gagal',
          details: {} as SetupStatus,
          error: data.error
        })
      }
    } catch (error) {
      console.error('❌ Network error during quick setup:', error)
      setSetupResult({
        success: false,
        message: 'Koneksi ke server gagal',
        details: {} as SetupStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderSetupStatus = (details: SetupStatus) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Database KV Store</span>
              {details.kvUserExists ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tersedia
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Belum Tersedia
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Supabase Auth</span>
              {details.authUserExists ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tersedia
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Belum Tersedia
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium">Tipe User</span>
              <Badge variant="outline">
                {details.userType === 'doctor' ? 'Dokter' : 
                 details.userType === 'employee' ? 'Karyawan' : 'Tidak Diketahui'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Status Login</span>
              {details.canLogin ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Bisa Login
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Tidak Bisa Login
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detail User:</h4>
          <div className="text-sm text-gray-600">
            <div><strong>Email:</strong> {details.email}</div>
            <div><strong>Nama:</strong> {details.name}</div>
            <div><strong>Setup Complete:</strong> {details.setupComplete ? 'Ya' : 'Tidak'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-pink-600" />
          Quick Setup User Login
        </CardTitle>
        <p className="text-sm text-gray-600">
          Setup otomatis untuk user dengan email <code className="bg-gray-100 px-1 rounded">adeka83@gmail.com</code> dan password <code className="bg-gray-100 px-1 rounded">1sampai9</code>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleQuickSetup}
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? 'Memproses Setup...' : 'Jalankan Quick Setup'}
          </Button>
          
          {setupResult?.success && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Setup Berhasil
            </Badge>
          )}
        </div>

        {setupResult && (
          <div className="space-y-4">
            <Alert className={setupResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={setupResult.success ? 'text-green-800' : 'text-red-800'}>
                {setupResult.message}
              </AlertDescription>
            </Alert>

            {setupResult.success && setupResult.details && (
              <div className="space-y-4">
                {renderSetupStatus(setupResult.details)}
                
                {setupResult.loginInstructions && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      <strong>Instruksi Login:</strong><br />
                      Email: <code className="bg-blue-100 px-1 rounded">{setupResult.loginInstructions.email}</code><br />
                      Password: <code className="bg-blue-100 px-1 rounded">{setupResult.loginInstructions.password}</code><br />
                      {setupResult.loginInstructions.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!setupResult.success && setupResult.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {setupResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
          <strong>Catatan:</strong> Tool ini akan membuat user doctor dengan email adeka83@gmail.com yang bisa login ke sistem. 
          User akan terdaftar di database KV store dengan status 'auth' dan juga dibuat di Supabase Auth jika belum ada.
        </div>
      </CardContent>
    </Card>
  )
}