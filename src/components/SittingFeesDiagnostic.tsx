import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface SittingFeesDiagnosticProps {
  accessToken: string
}

export function SittingFeesDiagnostic({ accessToken }: SittingFeesDiagnosticProps) {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (name: string, path: string): Promise<any> => {
    try {
      const fullUrl = `${serverUrl}${path}`
      console.log(`🔍 Testing ${name} at:`, fullUrl)
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const responseText = await response.text()
      console.log(`📡 ${name} response:`, response.status, responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText }
      }
      
      return {
        status: response.status,
        ok: response.ok,
        data,
        url: fullUrl
      }
    } catch (error) {
      console.error(`❌ ${name} error:`, error)
      return {
        status: 'ERROR',
        ok: false,
        error: error.message,
        url: `${serverUrl}${path}`
      }
    }
  }

  const runDiagnostics = async () => {
    setLoading(true)
    
    const tests = [
      { name: 'Health Check', path: '/health' },
      { name: 'Doctors', path: '/doctors' },
      { name: 'Sitting Fees', path: '/sitting-fees' },
      { name: 'Settings', path: '/doctor-sitting-fee-settings' }
    ]
    
    const newResults: Record<string, any> = {}
    
    for (const test of tests) {
      newResults[test.name] = await testEndpoint(test.name, test.path)
    }
    
    setResults(newResults)
    setLoading(false)
  }

  const getStatusIcon = (result: any) => {
    if (!result) return <AlertCircle className="h-4 w-4 text-gray-400" />
    if (result.ok) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = (result: any) => {
    if (!result) return 'text-gray-600'
    if (result.ok) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="text-purple-800 flex items-center justify-between">
          Sitting Fees API Diagnostic
          <Button
            onClick={runDiagnostics}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-purple-600 mb-4">
          <strong>Base URL:</strong> {serverUrl}
        </div>
        
        <div className="space-y-3">
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result)}
                  <span className="font-medium">{name}</span>
                </div>
                <span className={`${getStatusColor(result)} font-medium`}>
                  {result?.status || 'Not tested'}
                </span>
              </div>
              
              {result && (
                <div className="space-y-2 text-sm">
                  <div><strong>URL:</strong> {result.url}</div>
                  <div><strong>Status:</strong> {result.status}</div>
                  
                  {result.error && (
                    <div><strong>Error:</strong> <span className="text-red-600">{result.error}</span></div>
                  )}
                  
                  {result.data && (
                    <div>
                      <strong>Response:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {Object.keys(results).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Click "Run Tests" to diagnose API endpoints</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}