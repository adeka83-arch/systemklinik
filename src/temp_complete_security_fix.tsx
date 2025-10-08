import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Shield, 
  Key, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Zap,
  Bug
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useSecurityManager, SecurityLevel, initializeDefaultPasswords } from './SecurityManagerV4'

interface QuickFixButtonsProps {
  localConfig: any
  setLocalConfig: any
  setHasChanges: any
  handleResetToDefaults: () => void
  handleGenerateAllPasswords: () => void
  handleClearAllPasswords: () => void
  handleDebugStorage: () => void
  getLevelName: (level: SecurityLevel) => string
}

export function QuickFixButtons({
  localConfig,
  setLocalConfig,
  setHasChanges,
  handleResetToDefaults,
  handleGenerateAllPasswords,
  handleClearAllPasswords,
  handleDebugStorage,
  getLevelName
}: QuickFixButtonsProps) {

  // Emergency fix - initialize missing passwords
  const handleEmergencyFix = () => {
    const fixedConfig = initializeDefaultPasswords()
    setLocalConfig(fixedConfig)
    setHasChanges(true)
    toast.success('🚨 Emergency fix applied - passwords initialized!')
  }

  // Force reload config from localStorage
  const handleForceReload = () => {
    try {
      const stored = localStorage.getItem('falasifah_security_config_v4')
      if (stored) {
        const parsed = JSON.parse(stored)
        setLocalConfig(parsed)
        setHasChanges(false)
        toast.success('Config reloaded from localStorage')
      } else {
        toast.error('No config found in localStorage')
      }
    } catch (error) {
      console.error('❌ Error reloading config:', error)
      toast.error('Error reloading config')
    }
  }

  // Test password functionality
  const handleTestPasswords = () => {
    const testResults = []
    
    const passwords = localConfig.passwords
    Object.entries(passwords).forEach(([level, password]) => {
      const levelNum = parseInt(level) as SecurityLevel
      if (levelNum !== SecurityLevel.DOCTOR) {
        const result = password && password.trim() !== '' ? '✅' : '❌'
        testResults.push(`${getLevelName(levelNum)}: ${result}`)
      }
    })
    
    console.log('🧪 Password Test Results:', testResults)
    toast.success(`Test complete: ${testResults.join(', ')}`)
  }

  return (
    <>
      <Separator />
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Quick Actions & Debug Tools
        </h4>
        
        {/* Row 1: Basic Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAllPasswords}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Generate Semua
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Set Default
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAllPasswords}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Semua
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDebugStorage}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug Storage
          </Button>
        </div>

        {/* Row 2: Emergency Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEmergencyFix}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Zap className="h-3 w-3 mr-1" />
            Emergency Fix
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleForceReload}
            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Force Reload
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestPasswords}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <Bug className="h-3 w-3 mr-1" />
            Test Passwords
          </Button>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <p>• <strong>Generate Semua:</strong> Membuat password baru untuk semua level</p>
          <p>• <strong>Set Default:</strong> staff123, owner456, super789</p>
          <p>• <strong>Clear Semua:</strong> Menghapus semua password (reset)</p>
          <p>• <strong>Debug Storage:</strong> Menampilkan config localStorage di console</p>
          <p>• <strong>Emergency Fix:</strong> 🚨 Inisialisasi ulang semua password dengan default</p>
          <p>• <strong>Force Reload:</strong> Reload config dari localStorage tanpa menyimpan</p>
          <p>• <strong>Test Passwords:</strong> Cek status semua password dan tampilkan hasil</p>
        </div>

        {/* Password Status Indicators */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Current Password Status:</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.STAFF] ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Staff: {localConfig.passwords[SecurityLevel.STAFF] ? 'SET' : 'EMPTY'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.OWNER] ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Owner: {localConfig.passwords[SecurityLevel.OWNER] ? 'SET' : 'EMPTY'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.SUPER_USER] ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Super User: {localConfig.passwords[SecurityLevel.SUPER_USER] ? 'SET' : 'EMPTY'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}