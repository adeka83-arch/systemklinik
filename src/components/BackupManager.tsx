import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { AlertCircle, CheckCircle, Clock, Download, Github, Mail, Settings, Database, Zap, Calendar, Bell, History, Shield, Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { createDatabaseBackupService } from '../utils/databaseBackupService'
import { createGitHubBackupService } from '../utils/githubBackupService'
import { createEmailNotificationService } from '../utils/emailNotificationService'
import { getAutoScheduleService } from '../utils/autoScheduleService'
import { serverUrl } from '../utils/supabase/client'
import { 
  loadBackupSecurityConfig, 
  isBackupAllowed, 
  shouldSendEmailNotification, 
  isConfirmationRequired,
  getSecurityStatusSummary,
  type BackupSecurityConfig 
} from '../utils/backupSecurityConfig'

interface BackupManagerProps {
  accessToken: string
}

interface BackupConfig {
  githubUsername: string
  githubRepository: string
  githubToken: string
  adminEmail: string
  webhookUrl: string
  scheduleEnabled: boolean
  scheduleTime: string
}

interface BackupStatus {
  isRunning: boolean
  progress: number
  currentStep: string
  lastBackup?: string
  nextBackup?: string
}

export default function BackupManager({ accessToken }: BackupManagerProps) {
  const [config, setConfig] = useState<BackupConfig>({
    githubUsername: '',
    githubRepository: 'falasifah-clinic-database-backups',
    githubToken: '',
    adminEmail: '',
    webhookUrl: '',
    scheduleEnabled: true,
    scheduleTime: '23:00'
  })

  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    progress: 0,
    currentStep: 'Idle'
  })

  const [backupHistory, setBackupHistory] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [connections, setConnections] = useState({
    database: false,
    github: false,
    scheduler: false
  })

  const [securityConfig, setSecurityConfig] = useState<BackupSecurityConfig>({
    enableAutoBackup: true,
    enableEmailNotification: true,
    enableGithubIntegration: true,
    requireConfirmation: true,
    backupRetentionDays: 30
  })

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const autoScheduler = getAutoScheduleService()

  useEffect(() => {
    loadConfiguration()
    loadBackupHistory()
    loadNotifications()
    loadSecurityConfiguration()
    testConnections()
    setupAutoScheduler()
  }, [])

  // Listen for security config changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'backup-security-config') {
        loadSecurityConfiguration()
        toast.info('Konfigurasi keamanan backup diperbarui')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  /**
   * Load configuration from localStorage
   */
  const loadConfiguration = () => {
    try {
      const saved = localStorage.getItem('backup-config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        setConfig(prevConfig => ({ ...prevConfig, ...savedConfig }))
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
    }
  }

  /**
   * Load security configuration
   */
  const loadSecurityConfiguration = () => {
    const secConfig = loadBackupSecurityConfig()
    setSecurityConfig(secConfig)
  }

  /**
   * Save configuration to localStorage
   */
  const saveConfiguration = (newConfig: BackupConfig) => {
    try {
      localStorage.setItem('backup-config', JSON.stringify(newConfig))
      setConfig(newConfig)
      toast.success('Konfigurasi berhasil disimpan!')
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast.error('Gagal menyimpan konfigurasi')
    }
  }

  /**
   * Load backup history
   */
  const loadBackupHistory = () => {
    const history = autoScheduler.getBackupHistory()
    setBackupHistory(history)
  }

  /**
   * Load notifications
   */
  const loadNotifications = () => {
    const emailService = createEmailNotificationService()
    const notifs = emailService.getStoredNotifications()
    setNotifications(notifs)
  }

  /**
   * Test all connections
   */
  const testConnections = async () => {
    // Test database connection
    try {
      const dbService = createDatabaseBackupService(accessToken, serverUrl)
      const dbResult = await dbService.testConnection()
      setConnections(prev => ({ ...prev, database: dbResult.success }))
    } catch (error) {
      setConnections(prev => ({ ...prev, database: false }))
    }

    // Test GitHub connection
    if (config.githubUsername && config.githubToken) {
      try {
        const githubService = createGitHubBackupService({
          username: config.githubUsername,
          repository: config.githubRepository,
          token: config.githubToken,
          branch: 'main'
        })
        const githubResult = await githubService.testConnection()
        setConnections(prev => ({ ...prev, github: githubResult.success }))
      } catch (error) {
        setConnections(prev => ({ ...prev, github: false }))
      }
    }

    // Test scheduler
    const schedulerStatus = autoScheduler.getStatus()
    setConnections(prev => ({ ...prev, scheduler: schedulerStatus.isRunning }))
  }

  /**
   * Setup auto scheduler
   */
  const setupAutoScheduler = () => {
    autoScheduler.setBackupCallback(async () => {
      // Check security settings before auto backup
      if (securityConfig.enableAutoBackup) {
        await runBackup()
      } else {
        console.log('Auto backup skipped: disabled in security settings')
      }
    })

    // Update schedule if enabled
    if (config.scheduleEnabled && securityConfig.enableAutoBackup) {
      autoScheduler.updateSchedule({
        enabled: true,
        time: config.scheduleTime
      })
    }
  }

  /**
   * Check security and run backup
   */
  const handleBackupRequest = () => {
    // Check if backup is allowed based on security settings
    const { allowed, reasons } = isBackupAllowed(securityConfig)
    
    if (!allowed) {
      toast.error(`Backup tidak diizinkan: ${reasons.join(', ')}`)
      return
    }

    // Check if confirmation is required
    if (isConfirmationRequired(securityConfig)) {
      setShowConfirmDialog(true)
    } else {
      runBackup()
    }
  }

  /**
   * Run backup process
   */
  const runBackup = async () => {
    if (!config.githubUsername || !config.githubToken) {
      toast.error('Konfigurasi GitHub belum lengkap!')
      return
    }

    if (!securityConfig.enableGithubIntegration) {
      toast.error('GitHub integration dinonaktifkan dalam pengaturan keamanan!')
      return
    }

    setBackupStatus({
      isRunning: true,
      progress: 0,
      currentStep: 'Memulai backup...'
    })

    try {
      // Step 1: Create database backup
      setBackupStatus(prev => ({ ...prev, progress: 20, currentStep: 'Mengambil data database...' }))
      const dbService = createDatabaseBackupService(accessToken, serverUrl)
      const backupResult = await dbService.createBackup()

      if (!backupResult.success) {
        throw new Error(backupResult.error || 'Database backup failed')
      }

      // Step 2: Upload to GitHub
      setBackupStatus(prev => ({ ...prev, progress: 60, currentStep: 'Upload ke GitHub...' }))
      const githubService = createGitHubBackupService({
        username: config.githubUsername,
        repository: config.githubRepository,
        token: config.githubToken,
        branch: 'main'
      })

      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 12)
      const uploadResult = await githubService.uploadBackup(backupResult.data!, timestamp)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'GitHub upload failed')
      }

      // Step 3: Send notification (if enabled)
      if (shouldSendEmailNotification(securityConfig)) {
        setBackupStatus(prev => ({ ...prev, progress: 90, currentStep: 'Mengirim notifikasi...' }))
        const emailService = createEmailNotificationService(config.adminEmail, config.webhookUrl)
        
        await emailService.sendBackupSuccess({
          filename: `backup-${timestamp}.sql.gz`,
          size: backupResult.size || 'Unknown',
          downloadUrl: uploadResult.downloadUrl || '#',
          timestamp: new Date().toLocaleString('id-ID')
        })
      }

      // Step 4: Cleanup old backups
      setBackupStatus(prev => ({ ...prev, progress: 95, currentStep: 'Cleanup file lama...' }))
      await githubService.cleanupOldBackups()

      // Complete
      setBackupStatus({
        isRunning: false,
        progress: 100,
        currentStep: 'Backup selesai!',
        lastBackup: new Date().toLocaleString('id-ID')
      })

      toast.success('Backup berhasil dibuat!')
      
      // Refresh data
      loadBackupHistory()
      loadNotifications()
      
    } catch (error) {
      console.error('Backup failed:', error)
      
      setBackupStatus({
        isRunning: false,
        progress: 0,
        currentStep: 'Backup gagal'
      })

      // Send failure notification (if enabled)
      if (config.adminEmail && shouldSendEmailNotification(securityConfig)) {
        const emailService = createEmailNotificationService(config.adminEmail, config.webhookUrl)
        await emailService.sendBackupFailure(error.message)
      }

      toast.error(`Backup gagal: ${error.message}`)
    }
  }

  /**
   * Update schedule configuration
   */
  const updateSchedule = () => {
    const result = autoScheduler.updateSchedule({
      enabled: config.scheduleEnabled,
      time: config.scheduleTime
    })

    if (result.success) {
      setBackupStatus(prev => ({ ...prev, nextBackup: result.nextRunTime }))
      toast.success('Jadwal backup berhasil diperbarui!')
    } else {
      toast.error('Gagal memperbarui jadwal backup')
    }
  }

  const schedulerStatus = autoScheduler.getStatus()
  const securityStatus = getSecurityStatusSummary(securityConfig)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-pink-800">Backup Manager</h2>
          <p className="text-pink-600">Sistem backup otomatis database klinik</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Security Status Badge */}
          <Badge className={`${
            securityStatus.level === 'high' ? 'bg-green-100 text-green-800 border-green-300' :
            securityStatus.level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-red-100 text-red-800 border-red-300'
          }`}>
            <Shield className="h-3 w-3 mr-1" />
            {securityStatus.level === 'high' ? 'Keamanan Tinggi' :
             securityStatus.level === 'medium' ? 'Keamanan Sedang' : 'Keamanan Rendah'}
          </Badge>
          
          {/* Backup Button with Security Check */}
          <Button 
            onClick={handleBackupRequest} 
            disabled={backupStatus.isRunning || !connections.database || !connections.github}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {backupStatus.isRunning ? 'Backup Berjalan...' : 'Backup Sekarang'}
          </Button>
        </div>
      </div>

      {/* Security Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Konfirmasi Backup Database
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Anda akan membuat backup complete database klinik. Proses ini akan:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Mengambil semua data dari database</li>
                  <li>Mengupload ke GitHub repository private</li>
                  {securityConfig.enableEmailNotification && <li>Mengirim notifikasi email</li>}
                  <li>Menyimpan riwayat backup</li>
                </ul>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Peringatan Keamanan</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Pastikan konfigurasi GitHub Anda aman dan repository bersifat private.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowConfirmDialog(false)
                runBackup()
              }}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Ya, Jalankan Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {connections.database ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {connections.database ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GitHub</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {connections.github ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {connections.github ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {schedulerStatus.isEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm">
                {schedulerStatus.isEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Terakhir</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {backupStatus.lastBackup || schedulerStatus.lastRun 
                ? new Date(backupStatus.lastBackup || schedulerStatus.lastRun!).toLocaleDateString('id-ID')
                : 'Belum ada'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keamanan</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                securityStatus.level === 'high' ? 'bg-green-500' :
                securityStatus.level === 'medium' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm">
                {securityStatus.level === 'high' ? 'Tinggi' :
                 securityStatus.level === 'medium' ? 'Sedang' : 'Rendah'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {securityStatus.score}% Aktif
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Progress */}
      {backupStatus.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Backup Sedang Berjalan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{backupStatus.currentStep}</span>
                <span>{backupStatus.progress}%</span>
              </div>
              <Progress value={backupStatus.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Jadwal Auto Backup</TabsTrigger>
          <TabsTrigger value="config">Konfigurasi</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
          <TabsTrigger value="history">Riwayat Backup</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Backup Otomatis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Backup Harian</Label>
                  <p className="text-sm text-gray-600">
                    Backup otomatis setiap hari jam {config.scheduleTime}
                  </p>
                </div>
                <Switch
                  checked={config.scheduleEnabled}
                  onCheckedChange={(checked) => {
                    setConfig(prev => ({ ...prev, scheduleEnabled: checked }))
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleTime">Waktu Backup</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={config.scheduleTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, scheduleTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Berikutnya</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm">
                    {schedulerStatus.nextRun ? (
                      <>
                        <div>{schedulerStatus.nextRun}</div>
                        <div className="text-xs text-gray-500">
                          ({schedulerStatus.timeUntilNext})
                        </div>
                      </>
                    ) : (
                      'Tidak dijadwalkan'
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={updateSchedule}
                className="w-full"
              >
                Update Jadwal Backup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Konfigurasi Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="githubUsername">GitHub Username</Label>
                  <Input
                    id="githubUsername"
                    value={config.githubUsername}
                    onChange={(e) => setConfig(prev => ({ ...prev, githubUsername: e.target.value }))}
                    placeholder="your-github-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="githubRepository">Repository Name</Label>
                  <Input
                    id="githubRepository"
                    value={config.githubRepository}
                    onChange={(e) => setConfig(prev => ({ ...prev, githubRepository: e.target.value }))}
                    placeholder="backup-repository-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
                <Input
                  id="githubToken"
                  type="password"
                  value={config.githubToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                  placeholder="github_pat_xxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500">
                  Token dengan permission 'repo' untuk mengakses repository private
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Administrator</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={config.adminEmail}
                  onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@klinik.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Opsional)</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <p className="text-xs text-gray-500">
                  Discord/Slack webhook untuk notifikasi real-time
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => saveConfiguration(config)}
                  className="flex-1"
                >
                  Simpan Konfigurasi
                </Button>
                <Button 
                  onClick={testConnections}
                  variant="outline"
                >
                  Test Koneksi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pengaturan Keamanan Backup
              </CardTitle>
              <CardDescription>
                Konfigurasi ini sinkron dengan pengaturan di halaman Super User Security Settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Status Summary */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Status Keamanan Backup</h4>
                  <Badge className={`${
                    securityStatus.level === 'high' ? 'bg-green-100 text-green-800 border-green-300' :
                    securityStatus.level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    Level: {securityStatus.level === 'high' ? 'Tinggi' : securityStatus.level === 'medium' ? 'Sedang' : 'Rendah'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${securityConfig.enableAutoBackup ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="text-xs">Auto Backup</div>
                    <div className="text-xs text-gray-500">{securityConfig.enableAutoBackup ? 'Aktif' : 'Nonaktif'}</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${securityConfig.enableEmailNotification ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="text-xs">Email Alert</div>
                    <div className="text-xs text-gray-500">{securityConfig.enableEmailNotification ? 'Aktif' : 'Nonaktif'}</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${securityConfig.enableGithubIntegration ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="text-xs">GitHub Sync</div>
                    <div className="text-xs text-gray-500">{securityConfig.enableGithubIntegration ? 'Aktif' : 'Nonaktif'}</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${securityConfig.requireConfirmation ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="text-xs">Konfirmasi</div>
                    <div className="text-xs text-gray-500">{securityConfig.requireConfirmation ? 'Wajib' : 'Opsional'}</div>
                  </div>
                </div>
              </div>

              {/* Security Features Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Auto Backup</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {securityConfig.enableAutoBackup 
                      ? 'Backup otomatis diaktifkan. Sistem akan melakukan backup sesuai jadwal.'
                      : 'Backup otomatis dinonaktifkan. Backup hanya dapat dilakukan manual.'
                    }
                  </p>
                  <Badge variant={securityConfig.enableAutoBackup ? "default" : "secondary"}>
                    {securityConfig.enableAutoBackup ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Email Notification</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {securityConfig.enableEmailNotification 
                      ? 'Notifikasi email akan dikirim setiap backup selesai atau gagal.'
                      : 'Notifikasi email dinonaktifkan. Tidak ada email yang akan dikirim.'
                    }
                  </p>
                  <Badge variant={securityConfig.enableEmailNotification ? "default" : "secondary"}>
                    {securityConfig.enableEmailNotification ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Github className="h-5 w-5 text-gray-800" />
                    <h4 className="font-medium">GitHub Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {securityConfig.enableGithubIntegration 
                      ? 'Backup akan disimpan ke GitHub repository private.'
                      : 'GitHub integration dinonaktifkan. Backup tidak akan diupload ke GitHub.'
                    }
                  </p>
                  <Badge variant={securityConfig.enableGithubIntegration ? "default" : "secondary"}>
                    {securityConfig.enableGithubIntegration ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium">Konfirmasi Manual</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {securityConfig.requireConfirmation 
                      ? 'Backup manual memerlukan konfirmasi dialog untuk keamanan.'
                      : 'Backup manual dapat dilakukan langsung tanpa konfirmasi.'
                    }
                  </p>
                  <Badge variant={securityConfig.requireConfirmation ? "default" : "secondary"}>
                    {securityConfig.requireConfirmation ? 'Wajib' : 'Opsional'}
                  </Badge>
                </div>
              </div>

              {/* Retention Settings */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">Retention Policy</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Backup akan disimpan selama <strong>{securityConfig.backupRetentionDays} hari</strong> sebelum dihapus otomatis.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {securityConfig.backupRetentionDays} Hari
                  </Badge>
                </div>
              </div>

              {/* Warning if low security */}
              {securityStatus.level === 'low' && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Peringatan Keamanan</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Level keamanan backup Anda rendah. Pertimbangkan untuk mengaktifkan lebih banyak fitur keamanan 
                    di halaman <strong>Pengaturan Keamanan</strong> untuk melindungi data backup dengan lebih baik.
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Informasi</span>
                </div>
                <p className="text-sm text-blue-700">
                  Pengaturan keamanan ini dikontrol oleh Super User melalui halaman <strong>Pengaturan Keamanan</strong>. 
                  Untuk mengubah konfigurasi ini, silakan akses halaman tersebut dengan level akses Super User.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Backup ({backupHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {backupHistory.length > 0 ? (
                  backupHistory.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">
                            {backup.backupInfo?.filename || `Backup ${index + 1}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(backup.timestamp).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {backup.backupInfo?.size || 'Unknown size'}
                        </Badge>
                        {backup.backupInfo?.downloadUrl && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(backup.backupInfo.downloadUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada riwayat backup
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasi ({notifications.filter(n => !n.read).length} belum dibaca)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 border rounded-lg ${!notif.read ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {notif.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium">{notif.subject}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {notif.message.substring(0, 100)}...
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(notif.timestamp).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                        <Badge variant={notif.type === 'success' ? 'default' : 'destructive'}>
                          {notif.type === 'success' ? 'Berhasil' : 'Gagal'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada notifikasi
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}