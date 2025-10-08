import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useSecurityManager, SecurityLevel, getSecurityConfig } from './SecurityManagerV4'

export function SecurityDebugTool() {
  const { 
    config, 
    currentLevel, 
    isPasswordSet, 
    getLevelName, 
    updateConfig 
  } = useSecurityManager()
  
  const [rawConfig, setRawConfig] = useState<any>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [sessionData, setSessionData] = useState<any>({})

  useEffect(() => {
    loadDebugData()
  }, [])

  const loadDebugData = () => {
    try {
      // Load raw config from localStorage
      const storedConfig = localStorage.getItem('falasifah_security_config_v4')
      setRawConfig(storedConfig ? JSON.parse(storedConfig) : null)
      
      // Load session data
      const sessions: any = {}
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('falasifah_security_session_')) {
          try {
            sessions[key] = JSON.parse(sessionStorage.getItem(key) || '{}')
          } catch (e) {
            sessions[key] = 'Invalid JSON'
          }
        }
      })
      setSessionData(sessions)
    } catch (error) {
      console.error('Error loading debug data:', error)
    }
  }

  const clearAllSecurity = () => {
    // Clear localStorage
    localStorage.removeItem('falasifah_security_config_v4')
    
    // Clear all sessions
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('falasifah_security_session_')) {
        sessionStorage.removeItem(key)
      }
    })
    
    toast.success('Semua data keamanan telah dibersihkan')
    loadDebugData()
    
    // Reload page to reset state
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const forceUpdateConfig = () => {
    const newConfig = {
      ...config,
      passwords: {
        [SecurityLevel.STAFF]: 'staff123',
        [SecurityLevel.OWNER]: 'owner456',
        [SecurityLevel.SUPER_USER]: 'super789'
      }
    }
    
    updateConfig(newConfig)
    toast.success('Konfigurasi telah dipaksa update dengan password default')
    loadDebugData()
  }

  const testPasswordValidation = (level: SecurityLevel) => {
    const password = config.passwords[level]
    const isSet = isPasswordSet(level)
    const isEmpty = !password || password.trim() === ''
    
    toast.info(`Level ${getLevelName(level)}: Password="${password}", IsSet=${isSet}, IsEmpty=${isEmpty}`)
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Security Debug Tool
          </CardTitle>
          <CardDescription className="text-orange-700">
            Tool untuk debugging masalah sistem keamanan V4
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-orange-800">Status Saat Ini:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Current Level: <Badge className="ml-2">{getLevelName(currentLevel)}</Badge></div>
              <div>Config Loaded: <Badge className="ml-2">{config ? 'Yes' : 'No'}</Badge></div>
            </div>
          </div>

          <Separator />

          {/* Password Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-orange-800">Status Password:</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {[SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => {
              const password = config.passwords[level]
              const isSet = isPasswordSet(level)
              
              return (
                <div key={level} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${isSet ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-medium">{getLevelName(level)}</span>
                    {showPasswords && (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        "{password || 'EMPTY'}"
                      </code>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isSet ? "default" : "destructive"}>
                      {isSet ? 'Set' : 'Not Set'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testPasswordValidation(level)}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Raw Config Display */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-orange-800">Raw Config (localStorage):</h4>
            <div className="p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(rawConfig, null, 2)}</pre>
            </div>
          </div>

          {/* Session Data */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-orange-800">Session Data:</h4>
            <div className="p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDebugData}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Data
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={forceUpdateConfig}
              className="bg-blue-50 border-blue-200 text-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Set Default Passwords
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={clearAllSecurity}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All Security Data
            </Button>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-yellow-800">
                <p className="font-medium mb-1">Catatan Debugging:</p>
                <ul className="text-xs space-y-1">
                  <li>• "Set Default Passwords" akan mengatur password: staff123, owner456, super789</li>
                  <li>• "Clear All Security Data" akan menghapus semua data dan me-reload halaman</li>
                  <li>• Password kosong atau hanya spasi dianggap "Not Set"</li>
                  <li>• Jika masalah masih ada, coba clear data kemudian set password baru</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}