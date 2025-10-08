import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Server, Key } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface HealthCheckResult {
  success: boolean
  message: string
  timestamp: string
  status: string
  environment?: {
    supabase_url: string
    service_role_key: string
  }
  database_test?: string
  kv_test?: string
  error?: string
}

export function DatabaseConnectionTester() {
  const [result, setResult] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runHealthCheck = async () => {
    setLoading(true)
    
    try {
      console.log('🧪 Running health check...')
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      console.log('📊 Health check result:', data)
      setResult(data)
      
    } catch (error) {
      console.log('❌ Health check error:', error)
      setResult({
        success: false,
        message: 'Connection failed',
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string | undefined, fallback = false) => {
    if (status === 'OK' || status?.includes('OK')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (status === 'SET' || status === 'healthy') {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (status === 'MISSING' || status === 'SKIPPED') {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else if (status?.includes('ERROR') || status?.includes('FAILED')) {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else if (fallback) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
    return <AlertCircle className="h-4 w-4 text-gray-400" />
  }

  const getStatusColor = (status: string | undefined) => {
    if (status === 'OK' || status?.includes('OK') || status === 'SET' || status === 'healthy') {
      return 'bg-green-100 text-green-800'
    } else if (status === 'MISSING' || status === 'SKIPPED' || status?.includes('ERROR') || status?.includes('FAILED')) {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-yellow-100 text-yellow-800'
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-pink-600" />
          Database Connection Tester
        </CardTitle>
        <CardDescription>
          Test koneksi ke database dan server untuk mendiagnosis masalah registrasi/login
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Button 
          onClick={runHealthCheck} 
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing Connection...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Run Health Check
            </div>
          )}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </span>
              </AlertDescription>
            </Alert>

            {/* Environment Variables */}
            {result.environment && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Environment Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>SUPABASE_URL</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.environment.supabase_url)}
                      <Badge className={getStatusColor(result.environment.supabase_url)}>
                        {result.environment.supabase_url}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SERVICE_ROLE_KEY</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.environment.service_role_key)}
                      <Badge className={getStatusColor(result.environment.service_role_key)}>
                        {result.environment.service_role_key}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Database Tests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Supabase Auth Connection</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.database_test, true)}
                    <Badge className={getStatusColor(result.database_test)}>
                      {result.database_test || 'UNTESTED'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>KV Store Connection</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.kv_test, true)}
                    <Badge className={getStatusColor(result.kv_test)}>
                      {result.kv_test || 'UNTESTED'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Server Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <strong>Server URL:</strong> {serverUrl}
                </div>
                <div className="text-sm">
                  <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString('id-ID')}
                </div>
                <div className="text-sm">
                  <strong>Status:</strong> {result.status}
                </div>
                {result.error && (
                  <div className="text-sm text-red-600">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-600">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {result.environment?.supabase_url === 'MISSING' && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      ❌ SUPABASE_URL tidak ter-set. Periksa environment variables di Supabase dashboard.
                    </AlertDescription>
                  </Alert>
                )}
                {result.environment?.service_role_key === 'MISSING' && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      ❌ SERVICE_ROLE_KEY tidak ter-set. Periksa environment variables di Supabase dashboard.
                    </AlertDescription>
                  </Alert>
                )}
                {result.database_test?.includes('ERROR') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      ❌ Database connection gagal. Periksa URL dan key, pastikan database aktif.
                    </AlertDescription>
                  </Alert>
                )}
                {result.kv_test?.includes('ERROR') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      ❌ KV Store gagal. Pastikan table kv_store_73417b67 ada di database.
                    </AlertDescription>
                  </Alert>
                )}
                {result.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ Semua koneksi OK. Registrasi dan login seharusnya bekerja normal.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}