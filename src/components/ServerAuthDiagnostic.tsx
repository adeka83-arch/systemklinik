import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { supabase, serverUrl } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface ServerAuthDiagnosticProps {
  accessToken?: string
}

export function ServerAuthDiagnostic({ accessToken }: ServerAuthDiagnosticProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runCompleteServerTest = async () => {
    setLoading(true)
    setResults(null)

    const testResults = {
      timestamp: new Date().toLocaleTimeString(),
      serverUrl,
      projectId,
      publicAnonKey: publicAnonKey ? 'Valid' : 'Missing',
      accessToken: accessToken ? 'Provided' : 'Missing',
      tests: [] as any[]
    }

    try {
      // Test 1: Basic server health
      console.log('🔍 Testing server health...')
      try {
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const responseData = response.ok ? await response.json() : null
        
        testResults.tests.push({
          name: 'Server Health (No Auth)',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Server responding' : `HTTP ${response.status}`,
          data: responseData
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Server Health (No Auth)',
          status: 'error',
          result: error.message
        })
      }

      // Test 1B: Absolute no-auth test endpoint
      console.log('🔍 Testing absolute no-auth endpoint...')
      try {
        const response = await fetch(`${serverUrl}/debug/no-auth-test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const responseData = response.ok ? await response.json() : null
        
        testResults.tests.push({
          name: 'Enhanced No-Auth Test',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Enhanced no-auth endpoint working' : `HTTP ${response.status}`,
          data: responseData
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Enhanced No-Auth Test',
          status: 'error',
          result: error.message
        })
      }

      // Test 1C: Pure isolated test endpoint
      console.log('🔍 Testing pure isolated endpoint...')
      try {
        const response = await fetch(`${serverUrl}/debug/pure-test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const responseData = response.ok ? await response.json() : null
        
        testResults.tests.push({
          name: 'Pure Isolated Test',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Pure JS endpoint working' : `HTTP ${response.status}`,
          data: responseData
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Pure Isolated Test',
          status: 'error',
          result: error.message
        })
      }

      // Test 2: Test clinic settings without auth
      console.log('🔍 Testing clinic settings without auth...')
      try {
        const response = await fetch(`${serverUrl}/clinic-settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const responseData = response.ok ? await response.json() : null
        
        testResults.tests.push({
          name: 'Clinic Settings (No Auth)',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Access granted' : `HTTP ${response.status}`,
          data: responseData
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Clinic Settings (No Auth)',
          status: 'error',
          result: error.message
        })
      }

      // Test 2B: Test with public anon key 
      console.log('🔍 Testing with public anon key...')
      try {
        const response = await fetch(`${serverUrl}/clinic-settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        testResults.tests.push({
          name: 'Clinic Settings (Anon Key)',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Access granted' : `HTTP ${response.status}`
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Clinic Settings (Anon Key)',
          status: 'error',
          result: error.message
        })
      }

      // Test 2C: Test health endpoint with anon key (like what works)
      console.log('🔍 Testing health endpoint with anon key...')
      try {
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        const responseData = response.ok ? await response.json() : null
        
        testResults.tests.push({
          name: 'Health (With Anon Key)',
          status: response.ok ? 'success' : 'fail',
          statusCode: response.status,
          result: response.ok ? 'Health works with anon key' : `HTTP ${response.status}`,
          data: responseData
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Health (With Anon Key)',
          status: 'error',
          result: error.message
        })
      }

      // Test 3: Test with access token (if provided)
      if (accessToken) {
        console.log('🔍 Testing with access token...')
        try {
          const response = await fetch(`${serverUrl}/verify-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ email: 'lalafalasifah@gmail.com' })
          })
          
          const data = await response.json()
          testResults.tests.push({
            name: 'Verify User (Access Token)',
            status: response.ok ? 'success' : 'fail',
            statusCode: response.status,
            result: response.ok ? 'Token valid' : `HTTP ${response.status}`,
            data: data
          })
        } catch (error) {
          testResults.tests.push({
            name: 'Verify User (Access Token)',
            status: 'error',
            result: error.message
          })
        }
      }

      // Test 4: Test auth session directly
      console.log('🔍 Testing Supabase session...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        testResults.tests.push({
          name: 'Supabase Session',
          status: session && !error ? 'success' : 'fail',
          result: session ? 'Valid session' : 'No session',
          sessionEmail: session?.user?.email,
          sessionExpiry: session ? new Date(session.expires_at! * 1000).toLocaleString() : 'N/A',
          error: error?.message
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Supabase Session',
          status: 'error',
          result: error.message
        })
      }

      // Test 5: Test manual login flow
      console.log('🔍 Testing manual login flow...')
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'lalafalasifah@gmail.com',
          password: 'falasifah123' // Gunakan password yang benar
        })

        testResults.tests.push({
          name: 'Manual Login Test',
          status: !error && data.session ? 'success' : 'fail',
          result: !error ? 'Login successful' : error.message,
          sessionId: data.session?.access_token ? 'Generated' : 'Missing',
          userId: data.user?.id || 'Missing'
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Manual Login Test',
          status: 'error',
          result: error.message
        })
      }

    } catch (error) {
      console.error('Server test error:', error)
    }

    setResults(testResults)
    setLoading(false)
  }

  const fixServerAuth = async () => {
    setLoading(true)
    
    try {
      console.log('🔧 Attempting to fix server auth...')
      
      // Get fresh session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        // Try to sign in with known credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'lalafalasifah@gmail.com',
          password: 'falasifah123'
        })
        
        if (signInError) {
          alert(`Login failed: ${signInError.message}`)
          setLoading(false)
          return
        }
        
        alert('Login successful! Please refresh the page.')
      } else {
        alert('Session is valid. The issue may be with server endpoints.')
      }
      
    } catch (error) {
      alert(`Fix attempt failed: ${error.message}`)
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Server Authentication Diagnostic
        </CardTitle>
        <p className="text-sm text-gray-600">
          Diagnose server authentication and authorization issues
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runCompleteServerTest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '🔄 Testing...' : '🔍 Run Server Auth Test'}
          </Button>
          
          <Button 
            onClick={fixServerAuth}
            disabled={loading}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {loading ? '🔄 Fixing...' : '🔧 Fix Auth Issues'}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Server URL:</strong> {results.serverUrl}
              </div>
              <div>
                <strong>Timestamp:</strong> {results.timestamp}
              </div>
              <div>
                <strong>Project ID:</strong> {results.projectId}
              </div>
              <div>
                <strong>Public Key:</strong> {results.publicAnonKey}
              </div>
              <div>
                <strong>Access Token:</strong> {results.accessToken}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Test Results:</h3>
              
              {results.tests.map((test: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{test.name}</span>
                    <Badge 
                      variant={test.status === 'success' ? 'default' : 'destructive'}
                      className={test.status === 'success' ? 'bg-green-600' : ''}
                    >
                      {test.status === 'success' ? '✅' : test.status === 'fail' ? '❌' : '⚠️'} {test.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div><strong>Result:</strong> {test.result}</div>
                    {test.statusCode && (
                      <div><strong>Status Code:</strong> {test.statusCode}</div>
                    )}
                    {test.sessionEmail && (
                      <div><strong>Session Email:</strong> {test.sessionEmail}</div>
                    )}
                    {test.sessionExpiry && (
                      <div><strong>Session Expiry:</strong> {test.sessionExpiry}</div>
                    )}
                    {test.userId && (
                      <div><strong>User ID:</strong> {test.userId}</div>
                    )}
                    {test.sessionId && (
                      <div><strong>Session Token:</strong> {test.sessionId}</div>
                    )}
                    {test.error && (
                      <div className="text-red-600"><strong>Error:</strong> {test.error}</div>
                    )}
                    {test.data && (
                      <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                        <strong>Response Data:</strong> {JSON.stringify(test.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Analysis */}
            <Separator />
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-2">📊 Quick Analysis:</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                {results.tests.filter((t: any) => t.status === 'fail').length === 0 ? (
                  <div>✅ All tests passed - authentication should be working</div>
                ) : (
                  <div>❌ {results.tests.filter((t: any) => t.status === 'fail').length} test(s) failed - authentication issues detected</div>
                )}
                
                {results.tests.find((t: any) => t.name.includes('Anon Key') && t.status === 'fail') && (
                  <div>🔑 Issue: Server not accepting anon key authorization</div>
                )}
                
                {results.tests.find((t: any) => t.name.includes('Access Token') && t.status === 'fail') && (
                  <div>🎫 Issue: Access token invalid or not accepted by server</div>
                )}
                
                {results.tests.find((t: any) => t.name.includes('Session') && t.status === 'fail') && (
                  <div>📱 Issue: Supabase session problem</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}