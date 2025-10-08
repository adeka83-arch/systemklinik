import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Database, 
  Palette, 
  Building2, 
  Settings, 
  Shield, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { DatabaseMigrationManager } from './DatabaseMigrationManager'
import { ClinicBrandingManager } from './ClinicBrandingManager'
import { SystemThemeManager } from './SystemThemeManager'
import { AnimatedBackground } from './AnimatedBackground'
import { GlowCard } from './EnhancedInteractions'

interface SystemConfigurationManagerProps {
  accessToken: string
  clinicSettings: any
  onSettingsUpdate: () => void
}

export function SystemConfigurationManager({ 
  accessToken, 
  clinicSettings, 
  onSettingsUpdate 
}: SystemConfigurationManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    theme: 'active',
    branding: 'configured',
    lastUpdate: new Date().toISOString()
  })

  const statusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'configured':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'configured':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const configurationCards = [
    {
      id: 'database',
      title: 'Database Migration',
      description: 'Migrate to new database with zero downtime',
      icon: <Database className="h-6 w-6" />,
      status: systemStatus.database,
      features: [
        'Automatic data migration',
        'Connection validation',
        'Rollback capability',
        'Progress tracking'
      ]
    },
    {
      id: 'branding',
      title: 'Clinic Branding',
      description: 'Update logo, name, and contact information',
      icon: <Building2 className="h-6 w-6" />,
      status: systemStatus.branding,
      features: [
        'Logo management',
        'Clinic information',
        'Auto-update all forms',
        'Print templates sync'
      ]
    },
    {
      id: 'theme',
      title: 'System Theme',
      description: 'Customize colors and appearance',
      icon: <Palette className="h-6 w-6" />,
      status: systemStatus.theme,
      features: [
        'Color scheme editor',
        'Real-time preview',
        'Export/Import themes',
        'Mobile optimization'
      ]
    }
  ]

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground 
        particleCount={20}
        colors={['#fce7f3', '#f3e8ff', '#e0f2fe']}
        speed={0.1}
        className="opacity-20"
      />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl">
              <Settings className="h-8 w-8 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-pink-800">System Configuration Manager</h1>
              <p className="text-pink-600">Advanced system configuration and migration tools</p>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Super User Access Only</strong> - These tools can modify core system settings. 
              Always backup your data before making changes.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* System Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-pink-600" />
                System Status Overview
              </CardTitle>
              <CardDescription>
                Current system configuration and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {configurationCards.map((card) => (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <GlowCard glowColor="pink">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            {card.icon}
                          </div>
                          <Badge className={statusColor(card.status)}>
                            {statusIcon(card.status)}
                            <span className="ml-1 capitalize">{card.status}</span>
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                        <div className="space-y-1">
                          {card.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-pink-50 border-pink-200">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
              >
                <Monitor className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="database" 
                className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
              >
                <Database className="h-4 w-4" />
                Database
              </TabsTrigger>
              <TabsTrigger 
                value="branding" 
                className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger 
                value="theme" 
                className="flex items-center gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white"
              >
                <Palette className="h-4 w-4" />
                Theme
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="border-pink-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-pink-600" />
                    Configuration Impact
                  </CardTitle>
                  <CardDescription>
                    Areas affected by configuration changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { 
                        name: 'Medical Forms (7 Types)', 
                        icon: '📋', 
                        affected: ['Logo', 'Clinic Name', 'Address', 'Contact Info'],
                        details: [
                          'Formulir Tindakan Dokter (A5)',
                          'Informed Consent (A4)', 
                          'Form Ortodontik (A4)',
                          'Resep Obat (Siap Print)',
                          'Rujukan Rontgen (Siap Print)',
                          'Rujukan Spesialis (Siap Print)',
                          'Surat Keterangan Berobat (Siap Print)'
                        ]
                      },
                      { 
                        name: 'Print Reports (10 Types)', 
                        icon: '🖨️', 
                        affected: ['Header Logo', 'Clinic Info', 'Contact Details'],
                        details: [
                          'Laporan Keuangan (Financial)',
                          'Laporan Pengeluaran (Expenses)',
                          'Laporan Absensi Karyawan (Employee Attendance)', 
                          'Laporan Gaji & Bonus (Salary & Bonus)',
                          'Laporan Uang Duduk Dokter (Doctor Fees)',
                          'Laporan Penjualan Produk (Product Sales)',
                          'Laporan Field Trip Sales (Field Trip)',
                          'Laporan Tindakan & Treatment (Medical Treatments)',
                          'Print Stok Opname (Stock Inventory)',
                          'Print Formulir Pengajuan (Purchase Request Form)'
                        ]
                      },
                      { 
                        name: 'Invoices & Receipts (4 Types)', 
                        icon: '🧾', 
                        affected: ['Logo', 'Clinic Name', 'Address', 'Phone/Email'],
                        details: [
                          'Invoice Tindakan (Medical Treatments)',
                          'Invoice Field Trip (Field Trip Services)',
                          'Kwitansi Tindakan (Treatment Receipts)',
                          'Kwitansi Field Trip (Field Trip Receipts)'
                        ]
                      },
                      { 
                        name: 'System Interface', 
                        icon: '🖥️', 
                        affected: ['Logo Display', 'Clinic Name', 'Theme Integration'],
                        details: [
                          'Dashboard Header',
                          'Sidebar Logo',
                          'Login Page Branding',
                          'All UI Components'
                        ]
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">{item.icon}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <p className="text-xs text-gray-600">Auto-update system</p>
                          </div>
                        </div>
                        
                        {/* Update types */}
                        <div className="space-y-1 mb-3">
                          {item.affected.map((affect, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-blue-700">
                              <RefreshCw className="h-3 w-3 text-blue-500" />
                              {affect}
                            </div>
                          ))}
                        </div>
                        
                        {/* Detailed list */}
                        {item.details && (
                          <div className="pt-3 border-t border-blue-200">
                            <p className="text-xs font-medium text-blue-800 mb-2">Mencakup:</p>
                            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                              {item.details.map((detail, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                  {detail}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <DatabaseMigrationManager 
                accessToken={accessToken}
                onMigrationComplete={onSettingsUpdate}
              />
            </TabsContent>

            <TabsContent value="branding">
              <ClinicBrandingManager 
                accessToken={accessToken}
                clinicSettings={clinicSettings}
                onSettingsUpdate={onSettingsUpdate}
              />
            </TabsContent>

            <TabsContent value="theme">
              <SystemThemeManager 
                accessToken={accessToken}
                onThemeUpdate={onSettingsUpdate}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}