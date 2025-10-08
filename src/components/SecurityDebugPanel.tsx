import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useCentralizedSecurity, SecurityLevel } from './CentralizedSecurityManager'

const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Pasien' },
  { id: 'forms', label: 'Formulir Medis' },
  { id: 'treatments', label: 'Tindakan & Fee' },
  { id: 'medical-record-summary', label: 'Rekapan RM' },
  { id: 'products', label: 'Daftar Produk' },
  { id: 'product-field-trip', label: 'Produk Field Trip' },
  { id: 'field-trip-sales', label: 'Field Trip Sales' },
  { id: 'doctor-status', label: 'Karyawan & Dokter' },
  { id: 'attendance', label: 'Absensi' },
  { id: 'sitting-fees', label: 'Uang Duduk' },
  { id: 'sales', label: 'Penjualan' },
  { id: 'stock-opname', label: 'Stok Opname' },
  { id: 'promo', label: 'Manajemen Promo' },
  { id: 'expenses', label: 'Pengeluaran' },
  { id: 'salaries', label: 'Gaji Karyawan' },
  { id: 'reports', label: 'Laporan' },
  { id: 'security-settings', label: 'Pengaturan Keamanan' }
]

interface SecurityDebugPanelProps {
  isVisible: boolean
  onToggle: () => void
}

export function SecurityDebugPanel({ isVisible, onToggle }: SecurityDebugPanelProps) {
  const { 
    currentLevel, 
    hasAccess, 
    getPageAccess, 
    getLevelName, 
    getLevelIcon,
    pageAccessConfig
  } = useCentralizedSecurity()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          <Shield className="h-4 w-4 mr-1" />
          Debug Security
        </Button>
      </div>
    )
  }

  const accessibleItems = ALL_MENU_ITEMS.filter(item => {
    const requiredLevel = getPageAccess(item.id)
    return hasAccess(requiredLevel)
  })

  const blockedItems = ALL_MENU_ITEMS.filter(item => {
    const requiredLevel = getPageAccess(item.id)
    return !hasAccess(requiredLevel)
  })

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case SecurityLevel.STAFF: return 'bg-blue-100 text-blue-800 border-blue-300'
      case SecurityLevel.OWNER: return 'bg-purple-100 text-purple-800 border-purple-300'
      case SecurityLevel.SUPER_USER: return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="border-purple-200 bg-white shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-purple-800">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Debug Panel
            </div>
            <Button onClick={onToggle} size="sm" variant="ghost">
              <EyeOff className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Level */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Access Level</h4>
            <Badge className={getLevelColor(currentLevel)}>
              {getLevelIcon(currentLevel)} {getLevelName(currentLevel)} (Level {currentLevel})
            </Badge>
          </div>

          {/* Accessible Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              Accessible ({accessibleItems.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {accessibleItems.map(item => {
                const requiredLevel = getPageAccess(item.id)
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
                    <span className="text-green-800">{item.label}</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                      {getLevelIcon(requiredLevel)} {getLevelName(requiredLevel)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Blocked Items */}
          {blockedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Blocked ({blockedItems.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {blockedItems.map(item => {
                  const requiredLevel = getPageAccess(item.id)
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-red-50 p-2 rounded">
                      <span className="text-red-800">{item.label}</span>
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                        Need {getLevelIcon(requiredLevel)} {getLevelName(requiredLevel)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-sm font-medium">System Status</h4>
            <div className="text-xs space-y-1">
              <div>Total Menu Items: {ALL_MENU_ITEMS.length}</div>
              <div>Visible Items: {accessibleItems.length}</div>
              <div>Hidden Items: {blockedItems.length}</div>
              <div className="text-purple-600">
                Access Rate: {Math.round((accessibleItems.length / ALL_MENU_ITEMS.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Quick Test */}
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Quick Test: "treatments" page</h4>
            <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
              <div>Required Level: {getLevelName(getPageAccess('treatments'))} ({getPageAccess('treatments')})</div>
              <div>Current Level: {getLevelName(currentLevel)} ({currentLevel})</div>
              <div className={`font-medium ${hasAccess(getPageAccess('treatments')) ? 'text-green-600' : 'text-red-600'}`}>
                Access: {hasAccess(getPageAccess('treatments')) ? '✅ ALLOWED' : '❌ BLOCKED'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}