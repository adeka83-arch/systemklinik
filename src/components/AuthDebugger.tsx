import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { RefreshCw, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { getAuthDebugInfo, getFreshSession, validateTokenWithServer } from '../utils/authHelpers'
import { serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface AuthDebuggerProps {
  accessToken?: string
  onTokenUpdate?: (token: string) => void
}

export function AuthDebugger({ accessToken, onTokenUpdate }: AuthDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleDebugAuth = async () => {
    setLoading(true)
    try {
      const info = await getAuthDebugInfo()
      setDebugInfo(info)
      console.log('Debug info:', info)
    } catch (error) {
      console.error('Debug failed:', error)
      toast.error('Gagal mendapatkan info debug')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setLoading(true)
    try {
      const result = await getFreshSession(2)
      if (result.accessToken) {
        onTokenUpdate?.(result.accessToken)
        toast.success('Token berhasil diperbarui')
        // Refresh debug info
        await handleDebugAuth()
      } else {
        toast.error('Gagal refresh: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Error saat refresh token')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateToken = async () => {
    if (!accessToken) {
      toast.error('Tidak ada token untuk divalidasi')
      return
    }

    setLoading(true)
    try {
      const result = await validateTokenWithServer(accessToken, serverUrl)
      setValidationResult(result)
      
      if (result.valid) {
        toast.success('Token valid!')
      } else {
        toast.error('Token tidak valid: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Validation failed:', error)
      toast.error('Error saat validasi token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-pink-600" />
          Auth Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleDebugAuth}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Check Auth State
          </Button>
          
          <Button
            onClick={handleRefreshSession}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          
          {accessToken && (
            <Button
              onClick={handleValidateToken}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Token
            </Button>
          )}
        </div>

        {debugInfo && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <h4 className="font-medium">Auth State:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span>Has User:</span>
                <Badge variant={debugInfo.hasUser ? "default" : "destructive"}>
                  {debugInfo.hasUser ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Has Session:</span>
                <Badge variant={debugInfo.hasSession ? "default" : "destructive"}>
                  {debugInfo.hasSession ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Has Access Token:</span>
                <Badge variant={debugInfo.hasAccessToken ? "default" : "destructive"}>
                  {debugInfo.hasAccessToken ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Session Valid:</span>
                <Badge variant={debugInfo.sessionValid ? "default" : "destructive"}>
                  {debugInfo.sessionValid ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            
            {debugInfo.userEmail && (
              <div className="text-sm">
                <span className="font-medium">Email:</span> {debugInfo.userEmail}
              </div>
            )}
            
            {debugInfo.tokenLength && (
              <div className="text-sm">
                <span className="font-medium">Token Length:</span> {debugInfo.tokenLength}
              </div>
            )}
            
            {debugInfo.tokenPreview && (
              <div className="text-sm font-mono text-xs bg-white p-2 rounded border">
                <span className="font-medium">Token Preview:</span> {debugInfo.tokenPreview}
              </div>
            )}
          </div>
        )}

        {validationResult && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Token Validation:</h4>
            <div className="flex items-center gap-2">
              <Badge variant={validationResult.valid ? "default" : "destructive"}>
                {validationResult.valid ? "Valid" : "Invalid"}
              </Badge>
              {validationResult.error && (
                <span className="text-sm text-red-600">{validationResult.error}</span>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-2">
          <p>Use this tool to diagnose authentication issues. Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  )
}