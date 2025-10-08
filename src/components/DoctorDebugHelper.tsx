import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface DoctorDebugHelperProps {
  accessToken: string
}

interface TestResult {
  name: string
  status: 'success' | 'error'
  response?: any
  error?: string
  url: string
  responseText?: string
}

export function DoctorDebugHelper({ accessToken }: DoctorDebugHelperProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    setResults(null)

    try {
      const tests = []

      // Test 1: Health Check
      try {
        const healthResponse = await fetch(`${serverUrl}/health`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const healthData = await healthResponse.json()
        tests.push({
          name: 'Health Check',
          status: healthResponse.ok ? 'success' : 'error',
          response: healthData,
          url: `${serverUrl}/health`
        })
      } catch (error) {
        tests.push({
          name: 'Health Check',
          status: 'error',
          error: error.message,
          url: `${serverUrl}/health`
        })
      }

      // Test 2: Raw Doctors Endpoint
      try {
        const doctorsResponse = await fetch(`${serverUrl}/doctors`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json()
          tests.push({
            name: 'Doctors Endpoint',
            status: 'success',
            response: doctorsData,
            url: `${serverUrl}/doctors`
          })
        } else {
          const errorText = await doctorsResponse.text()
          tests.push({
            name: 'Doctors Endpoint',
            status: 'error',
            response: { error: errorText, status: doctorsResponse.status },
            url: `${serverUrl}/doctors`
          })
        }
      } catch (error) {
        tests.push({
          name: 'Doctors Endpoint',
          status: 'error',
          error: error.message,
          url: `${serverUrl}/doctors`
        })
      }

      // Test 3: Raw Doctors Data
      try {
        const rawDoctorsResponse = await fetch(`${serverUrl}/debug/doctors-raw`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const rawDoctorsData = await rawDoctorsResponse.json()
        tests.push({
          name: 'Raw Doctors Data',
          status: rawDoctorsResponse.ok ? 'success' : 'error',
          response: rawDoctorsData,
          url: `${serverUrl}/debug/doctors-raw`
        })
      } catch (error) {
        tests.push({
          name: 'Raw Doctors Data',
          status: 'error',
          error: error.message,
          url: `${serverUrl}/debug/doctors-raw`
        })
      }

      // Test 4: General Debug Endpoint
      try {
        const debugResponse = await fetch(`${serverUrl}/debug`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const debugData = await debugResponse.json()
        tests.push({
          name: 'Debug Endpoint',
          status: debugResponse.ok ? 'success' : 'error',
          response: debugData,
          url: `${serverUrl}/debug`
        })
      } catch (error) {
        tests.push({
          name: 'Debug Endpoint',
          status: 'error',
          error: error.message,
          url: `${serverUrl}/debug`
        })
      }

      setResults({
        serverUrl,
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'Missing',
        timestamp: new Date().toISOString(),
        tests
      })

    } catch (error) {
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <AlertCircle className="h-5 w-5" />
          Doctor Data Debug Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testConnection}
            disabled={loading}
            variant="outline"
            className="border-blue-200 text-blue-600"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Server Connection
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-orange-200 text-orange-600"
          >
            Refresh Page
          </Button>
        </div>

        {results && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Connection Info:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Server URL:</strong> {results.serverUrl}</p>
                <p><strong>Access Token:</strong> {results.accessToken}</p>
                <p><strong>Test Time:</strong> {results.timestamp}</p>
              </div>
            </div>

            {results.tests && (
              <div className="space-y-3">
                <h4 className="font-medium">Test Results:</h4>
                {results.tests.map((test: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {test.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{test.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        test.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>URL:</strong> {test.url}
                    </div>

                    {test.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}

                    {/* Special info for Raw Doctors Data */}
                    {test.name === 'Raw Doctors Data' && test.response && test.response.rawDoctors && (
                      <div className="text-xs mt-2 space-y-1">
                        <div className="font-medium text-gray-700">Database Analysis:</div>
                        {test.response.rawDoctors.map((doctor: any, index: number) => (
                          <div key={index} className="bg-blue-50 p-2 rounded">
                            <div><strong>ID:</strong> {doctor.id}</div>
                            <div><strong>Name:</strong> {doctor.nama || doctor.name || 'N/A'}</div>
                            <div><strong>Status:</strong> <span className={doctor.status === 'aktif' ? 'text-green-600' : 'text-red-600'}>{doctor.status || 'N/A'}</span></div>
                            <div><strong>Email:</strong> {doctor.email || 'N/A'}</div>
                            <div><strong>Specialization:</strong> {doctor.spesialisasi || doctor.specialization || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Special info for Doctors Endpoint */}
                    {test.name === 'Doctors Endpoint' && test.response && test.response.doctors && (
                      <div className="text-xs mt-2">
                        <div className="font-medium text-gray-700 mb-1">Processed Doctors ({test.response.doctors.length}):</div>
                        {test.response.doctors.length === 0 ? (
                          <div className="text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ No doctors returned after processing! Check server filtering logic.
                          </div>
                        ) : (
                          <div className="text-green-600 bg-green-50 p-2 rounded">
                            ✅ {test.response.doctors.length} doctors successfully processed and returned.
                          </div>
                        )}
                      </div>
                    )}

                    {test.response && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Response Data
                          {test.name === 'Raw Doctors Data' && test.response.rawDoctors && (
                            <span className="ml-2 text-green-600">
                              ({test.response.rawDoctors.length} doctors found)
                            </span>
                          )}
                          {test.name === 'Doctors Endpoint' && test.response.doctors && (
                            <span className="ml-2 text-blue-600">
                              ({test.response.doctors.length} processed doctors)
                            </span>
                          )}
                        </summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(test.response, null, 2)}
                        </pre>
                      </details>
                    )}

                    {test.responseText && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-purple-600 hover:text-purple-800">
                          View Raw Response
                        </summary>
                        <pre className="mt-2 bg-purple-50 p-2 rounded overflow-auto max-h-40">
                          {test.responseText}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Debug Error:</p>
                <p className="text-red-600 text-sm">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}