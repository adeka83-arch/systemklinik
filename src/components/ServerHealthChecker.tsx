import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface ServerHealthCheckerProps {
  accessToken: string
}

export function ServerHealthChecker({ accessToken }: ServerHealthCheckerProps) {
  const [healthStatus, setHealthStatus] = useState<{
    health: boolean | null
    doctors: boolean | null
    sittingFees: boolean | null
    settings: boolean | null
  }>({
    health: null,
    doctors: null,
    sittingFees: null,
    settings: null
  })
  
  const [loading, setLoading] = useState(false)

  const checkEndpoint = async (path: string): Promise<boolean> => {
    try {
      console.log(`🔍 Checking endpoint: ${serverUrl}${path}`)
      const response = await fetch(`${serverUrl}${path}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`📡 ${path} response:`, response.status, response.statusText)
      return response.ok
    } catch (error) {
      console.error(`❌ ${path} error:`, error)
      return false
    }
  }

  const runHealthCheck = async () => {
    setLoading(true)
    
    try {
      console.log('🏥 Starting comprehensive health check...')
      console.log('🔗 Server URL:', serverUrl)
      
      const [health, doctors, sittingFees, settings] = await Promise.all([
        checkEndpoint('/health'),
        checkEndpoint('/doctors'),
        checkEndpoint('/sitting-fees'),
        checkEndpoint('/doctor-sitting-fee-settings')
      ])
      
      setHealthStatus({
        health,
        doctors,
        sittingFees,
        settings
      })
      
      console.log('✅ Health check completed:', { health, doctors, sittingFees, settings })
    } catch (error) {
      console.error('💥 Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runHealthCheck()
  }, [])

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Clock className="h-4 w-4 text-gray-400" />
    if (status) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Checking...'
    if (status) return 'OK'
    return 'Failed'
  }

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'text-gray-600'
    if (status) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center justify-between">
          Server Health Check
          <Button
            onClick={runHealthCheck}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-blue-600 mb-4">
          <strong>Server URL:</strong> {serverUrl}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <StatusIcon status={healthStatus.health} />
              <span className="font-medium">Health Endpoint</span>
            </div>
            <span className={`${getStatusColor(healthStatus.health)} font-medium`}>
              {getStatusText(healthStatus.health)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <StatusIcon status={healthStatus.doctors} />
              <span className="font-medium">Doctors Endpoint</span>
            </div>
            <span className={`${getStatusColor(healthStatus.doctors)} font-medium`}>
              {getStatusText(healthStatus.doctors)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <StatusIcon status={healthStatus.sittingFees} />
              <span className="font-medium">Sitting Fees Endpoint</span>
            </div>
            <span className={`${getStatusColor(healthStatus.sittingFees)} font-medium`}>
              {getStatusText(healthStatus.sittingFees)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <StatusIcon status={healthStatus.settings} />
              <span className="font-medium">Settings Endpoint</span>
            </div>
            <span className={`${getStatusColor(healthStatus.settings)} font-medium`}>
              {getStatusText(healthStatus.settings)}
            </span>
          </div>
        </div>

        {Object.values(healthStatus).some(status => status === false) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-red-800 font-medium mb-2">Issues Detected</h4>
            <div className="text-sm text-red-700 space-y-1">
              {!healthStatus.health && <p>• Health endpoint is not responding</p>}
              {!healthStatus.doctors && <p>• Doctors endpoint is not responding</p>}
              {!healthStatus.sittingFees && <p>• Sitting fees endpoint is not responding</p>}
              {!healthStatus.settings && <p>• Settings endpoint is not responding</p>}
            </div>
          </div>
        )}

        {Object.values(healthStatus).every(status => status === true) && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-green-800 font-medium mb-2">All Systems Operational</h4>
            <p className="text-sm text-green-700">
              All server endpoints are responding correctly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}