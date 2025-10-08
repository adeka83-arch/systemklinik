import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface DoctorDebuggerProps {
  accessToken: string
}

export function DoctorDebugger({ accessToken }: DoctorDebuggerProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testServerHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/health`)
      const result = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      }
      setResults({ type: 'health', result })
      console.log('Health check result:', result)
    } catch (error) {
      setResults({ type: 'health', error: error.message })
      console.error('Health check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testFetchDoctors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.json()
      }
      setResults({ type: 'fetch', result })
      console.log('Fetch doctors result:', result)
    } catch (error) {
      setResults({ type: 'fetch', error: error.message })
      console.error('Fetch doctors error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCreateDoctor = async () => {
    setLoading(true)
    try {
      const testDoctor = {
        name: 'drg. Test Doctor',
        specialization: 'Dokter Gigi Umum',
        phone: '081234567890',
        email: 'test@example.com', 
        licenseNumber: 'SIP-TEST-001',
        shifts: ['09:00-15:00'],
        status: 'active'
      }

      const response = await fetch(`${serverUrl}/doctors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testDoctor)
      })
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        body: await response.json()
      }
      setResults({ type: 'create', result })
      console.log('Create doctor result:', result)
      
      if (response.ok) {
        toast.success('Test doctor created successfully')
      }
    } catch (error) {
      setResults({ type: 'create', error: error.message })
      console.error('Create doctor error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Doctor API Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testServerHealth}
            disabled={loading}
            variant="outline"
            className="border-orange-300"
          >
            Test Server Health
          </Button>
          <Button 
            onClick={testFetchDoctors}
            disabled={loading}
            variant="outline"
            className="border-orange-300"
          >
            Test Fetch Doctors
          </Button>
          <Button 
            onClick={testCreateDoctor}
            disabled={loading}
            variant="outline"
            className="border-orange-300"
          >
            Test Create Doctor
          </Button>
        </div>
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-orange-600 mt-2">Testing...</p>
          </div>
        )}
        
        {results && (
          <div className="mt-4">
            <h4 className="font-medium text-orange-800 mb-2">
              Test Results ({results.type}):
            </h4>
            <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-64">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-orange-600">
          <p><strong>Access Token Present:</strong> {!!accessToken ? 'Yes' : 'No'}</p>
          <p><strong>Server URL:</strong> {serverUrl}</p>
          {accessToken && (
            <p><strong>Token Length:</strong> {accessToken.length}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}