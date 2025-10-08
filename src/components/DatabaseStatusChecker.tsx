import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Loader2, CheckCircle, XCircle, Database, Users, Shield, Info } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface DatabaseStatus {
  kvStore: {
    doctors: number
    employees: number
    patients: number
    hasAdekaUser: boolean
    adekaUserDetails?: any
  }
  supabaseAuth: {
    totalUsers: number
    hasAdekaUser: boolean
    adekaUserDetails?: any
  }
  serverHealth: {
    online: boolean
    responseTime?: number
  }
}

export function DatabaseStatusChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [error, setError] = useState('')

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    setError('')
    setStatus(null)

    try {
      console.log('🔍 Checking database status...')

      // Check server health first
      const healthStart = Date.now()
      const healthResponse = await fetch(`${serverUrl}/health`)
      const healthTime = Date.now() - healthStart

      if (!healthResponse.ok) {
        throw new Error('Server tidak dapat dijangkau')
      }

      // Check user status specifically for adeka
      const userStatusResponse = await fetch(`${serverUrl}/debug-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'adeka83@gmail.com' })
      })

      if (!userStatusResponse.ok) {
        throw new Error('Gagal mengecek status user')
      }

      const userStatusData = await userStatusResponse.json()

      // Get general stats
      const doctorsResponse = await fetch(`${serverUrl}/doctors`)
      const employeesResponse = await fetch(`${serverUrl}/employees`)
      const patientsResponse = await fetch(`${serverUrl}/patients`)

      const doctorsData = doctorsResponse.ok ? await doctorsResponse.json() : { doctors: [] }
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : { employees: [] }
      const patientsData = patientsResponse.ok ? await patientsResponse.json() : { patients: [] }

      const databaseStatus: DatabaseStatus = {
        kvStore: {
          doctors: doctorsData.doctors?.length || 0,
          employees: employeesData.employees?.length || 0,
          patients: patientsData.patients?.length || 0,
          hasAdekaUser: userStatusData.status?.kvStore?.hasDoctor || userStatusData.status?.kvStore?.hasEmployee || false,
          adekaUserDetails: userStatusData.status?.kvStore?.doctor || userStatusData.status?.kvStore?.employee || null
        },
        supabaseAuth: {
          totalUsers: 0, // We don't have direct access to this from frontend
          hasAdekaUser: userStatusData.status?.supabaseAuth?.hasUser || false,
          adekaUserDetails: userStatusData.status?.supabaseAuth?.user || null
        },
        serverHealth: {
          online: true,
          responseTime: healthTime
        }
      }

      console.log('✅ Database status check completed:', databaseStatus)
      setStatus(databaseStatus)

    } catch (error) {
      console.error('❌ Error checking database status:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsChecking(false)
    }
  }

  const renderStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    if (condition) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {trueText}
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {falseText}
        </Badge>
      )
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Database Status Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Cek status database, user auth, dan konektivitas server
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={checkDatabaseStatus}
            disabled={isChecking}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isChecking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isChecking ? 'Mengecek Status...' : 'Cek Status Database'}
          </Button>
          
          {status?.serverHealth.online && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Server Online ({status.serverHealth.responseTime}ms)
            </Badge>
          )}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {status && (
          <div className="space-y-6">
            {/* KV Store Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">KV Store Database</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Dokter</span>
                    <Badge variant="outline">{status.kvStore.doctors}</Badge>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Karyawan</span>
                    <Badge variant="outline">{status.kvStore.employees}</Badge>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Pasien</span>
                    <Badge variant="outline">{status.kvStore.patients}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User adeka83@gmail.com di KV Store</span>
                  {renderStatusBadge(status.kvStore.hasAdekaUser, 'Tersedia', 'Tidak Tersedia')}
                </div>
                {status.kvStore.adekaUserDetails && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Nama:</strong> {status.kvStore.adekaUserDetails.nama}<br />
                    <strong>Status:</strong> {status.kvStore.adekaUserDetails.status}<br />
                    <strong>ID:</strong> {status.kvStore.adekaUserDetails.id}
                  </div>
                )}
              </div>
            </div>

            {/* Supabase Auth Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium">Supabase Authentication</h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User adeka83@gmail.com di Auth</span>
                  {renderStatusBadge(status.supabaseAuth.hasAdekaUser, 'Tersedia', 'Tidak Tersedia')}
                </div>
                {status.supabaseAuth.adekaUserDetails && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Email:</strong> {status.supabaseAuth.adekaUserDetails.email}<br />
                    <strong>Confirmed:</strong> {status.supabaseAuth.adekaUserDetails.email_confirmed_at ? 'Ya' : 'Tidak'}<br />
                    <strong>Created:</strong> {new Date(status.supabaseAuth.adekaUserDetails.created_at).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <Alert className={status.kvStore.hasAdekaUser ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
              <Info className="h-4 w-4" />
              <AlertDescription className={status.kvStore.hasAdekaUser ? 'text-green-800' : 'text-orange-800'}>
                <strong>Status Login:</strong> {status.kvStore.hasAdekaUser 
                  ? 'User dapat login dengan email adeka83@gmail.com' 
                  : 'User belum dapat login - perlu setup'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
          <strong>Informasi:</strong> Tool ini mengecek status database KV store, Supabase Auth, dan kesiapan sistem untuk login.
          Pastikan user adeka83@gmail.com tersedia di KV store dengan status 'auth' untuk bisa login.
        </div>
      </CardContent>
    </Card>
  )
}