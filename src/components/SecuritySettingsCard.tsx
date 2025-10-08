import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Shield, Settings, Lock, Key, Clock } from 'lucide-react'
import { usePasswordGuardConfig } from './PasswordGuardSettings'

interface SecuritySettingsCardProps {
  onNavigate: (tab: string) => void
}

export function SecuritySettingsCard({ onNavigate }: SecuritySettingsCardProps) {
  const config = usePasswordGuardConfig()
  
  // Count protected pages
  const protectedPagesCount = Object.values(config.protectedPages).filter(page => page.enabled).length
  const totalPagesCount = Object.keys(config.protectedPages).length

  // Get list of protected pages
  const protectedPagesList = Object.entries(config.protectedPages)
    .filter(([_, pageConfig]) => pageConfig.enabled)
    .map(([_, pageConfig]) => pageConfig.displayName)

  return (
    <Card className="border-pink-200 hover:border-pink-300 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Shield className="h-5 w-5" />
          Sistem Keamanan
        </CardTitle>
        <CardDescription>
          Status pengaturan PasswordGuard dan halaman yang dilindungi
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Lock className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-800">Halaman Dikunci</span>
            </div>
            <div className="text-lg font-bold text-pink-700">
              {protectedPagesCount}/{totalPagesCount}
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Durasi Sesi</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {config.expiryMinutes}m
            </div>
          </div>
        </div>

        {/* Protected Pages List */}
        {protectedPagesCount > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Halaman yang Dilindungi:
            </h4>
            <div className="flex flex-wrap gap-1">
              {protectedPagesList.slice(0, 3).map((pageName) => (
                <Badge 
                  key={pageName} 
                  variant="outline" 
                  className="text-xs bg-pink-50 text-pink-700 border-pink-200"
                >
                  {pageName}
                </Badge>
              ))}
              {protectedPagesList.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                >
                  +{protectedPagesList.length - 3} lainnya
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Password Status */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-medium text-emerald-800">Password Master</span>
          </div>
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
            Aktif
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onNavigate('security-settings')}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Kelola Keamanan
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Show quick status
              alert(`Status Keamanan:\n\n• ${protectedPagesCount} dari ${totalPagesCount} halaman dikunci\n• Durasi sesi: ${config.expiryMinutes} menit\n• Password master: Aktif\n\nKlik "Kelola Keamanan" untuk mengubah pengaturan.`)
            }}
            size="sm"
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Shield className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded text-center">
          💡 Sistem keamanan melindungi halaman sensitif dengan password terpisah per user
        </div>
      </CardContent>
    </Card>
  )
}