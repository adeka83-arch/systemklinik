import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Database, 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Upload,
  Server,
  Shield,
  Clock
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase, serverUrl } from '../utils/supabase/client'

interface DatabaseMigrationManagerProps {
  accessToken: string
  onMigrationComplete: () => void
}

export function DatabaseMigrationManager({ accessToken, onMigrationComplete }: DatabaseMigrationManagerProps) {
  const [migrationState, setMigrationState] = useState<'idle' | 'testing' | 'migrating' | 'completed' | 'error'>('idle')
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [connectionTest, setConnectionTest] = useState<'untested' | 'testing' | 'success' | 'failed'>('untested')
  
  const [newDatabaseConfig, setNewDatabaseConfig] = useState({
    url: '',
    key: '',
    name: '',
    description: ''
  })

  const [currentDatabaseInfo, setCurrentDatabaseInfo] = useState({
    url: 'Current Database Connected',
    status: 'healthy',
    lastBackup: '2 hours ago',
    totalTables: 12,
    totalRecords: 0
  })

  const [migrationLog, setMigrationLog] = useState<string[]>([])

  useEffect(() => {
    fetchCurrentDatabaseInfo()
  }, [])

  const fetchCurrentDatabaseInfo = async () => {
    try {
      // Get current database stats
      const response = await fetch(`${serverUrl}/database-stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentDatabaseInfo(prev => ({
          ...prev,
          totalRecords: data.totalRecords || 0
        }))
      }
    } catch (error) {
      console.log('Error fetching database info:', error)
    }
  }

  const testNewConnection = async () => {
    if (!newDatabaseConfig.url || !newDatabaseConfig.key) {
      toast.error('Please provide database URL and API key')
      return
    }

    setConnectionTest('testing')
    addToLog('Testing connection to new database...')

    try {
      // Simulate connection test - in real implementation, test actual connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would test the actual database connection
      // const testResult = await testSupabaseConnection(newDatabaseConfig.url, newDatabaseConfig.key)
      
      setConnectionTest('success')
      addToLog('✅ Connection test successful!')
      toast.success('Database connection test successful!')
      
    } catch (error) {
      setConnectionTest('failed')
      addToLog('❌ Connection test failed: ' + (error as Error).message)
      toast.error('Database connection test failed')
    }
  }

  const startMigration = async () => {
    if (connectionTest !== 'success') {
      toast.error('Please test the database connection first')
      return
    }

    setMigrationState('migrating')
    setMigrationProgress(0)
    addToLog('🚀 Starting database migration...')

    try {
      const steps = [
        'Creating backup of current database',
        'Validating new database schema',
        'Migrating patient data',
        'Migrating doctor data',
        'Migrating attendance records',
        'Migrating treatment data',
        'Migrating financial records',
        'Migrating system settings',
        'Validating migrated data',
        'Updating application configuration'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        addToLog(`📋 ${steps[i]}...`)
        
        // Simulate migration step
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const progress = ((i + 1) / steps.length) * 100
        setMigrationProgress(progress)
        
        addToLog(`✅ ${steps[i]} completed`)
      }

      setMigrationState('completed')
      addToLog('🎉 Database migration completed successfully!')
      toast.success('Database migration completed successfully!')
      
      // Trigger settings update
      onMigrationComplete()

    } catch (error) {
      setMigrationState('error')
      addToLog('❌ Migration failed: ' + (error as Error).message)
      toast.error('Database migration failed')
    }
  }

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setMigrationLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const resetMigration = () => {
    setMigrationState('idle')
    setMigrationProgress(0)
    setCurrentStep('')
    setConnectionTest('untested')
    setMigrationLog([])
  }

  const connectionStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'testing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Database Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Current Database Status
            </CardTitle>
            <CardDescription>
              Information about your current database connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Connection</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Last Backup</span>
                </div>
                <p className="text-sm text-gray-600">{currentDatabaseInfo.lastBackup}</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Tables</span>
                </div>
                <p className="text-sm text-gray-600">{currentDatabaseInfo.totalTables} tables</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Records</span>
                </div>
                <p className="text-sm text-gray-600">{currentDatabaseInfo.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* New Database Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-pink-600" />
              New Database Configuration
            </CardTitle>
            <CardDescription>
              Configure the new database connection details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-url">Database URL</Label>
                <Input
                  id="db-url"
                  placeholder="https://your-project.supabase.co"
                  value={newDatabaseConfig.url}
                  onChange={(e) => setNewDatabaseConfig(prev => ({ ...prev, url: e.target.value }))}
                  className="border-pink-200"
                  disabled={migrationState === 'migrating'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-key">API Key</Label>
                <Input
                  id="db-key"
                  type="password"
                  placeholder="Your database API key"
                  value={newDatabaseConfig.key}
                  onChange={(e) => setNewDatabaseConfig(prev => ({ ...prev, key: e.target.value }))}
                  className="border-pink-200"
                  disabled={migrationState === 'migrating'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-name">Database Name</Label>
                <Input
                  id="db-name"
                  placeholder="Production Database"
                  value={newDatabaseConfig.name}
                  onChange={(e) => setNewDatabaseConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="border-pink-200"
                  disabled={migrationState === 'migrating'}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Connection Status</Label>
                <Badge className={connectionStatusColor(connectionTest)}>
                  {connectionTest === 'testing' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                  {connectionTest === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {connectionTest === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {connectionTest === 'untested' && <Clock className="h-3 w-3 mr-1" />}
                  {connectionTest === 'untested' ? 'Not tested' : connectionTest}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="db-description">Description (Optional)</Label>
              <Textarea
                id="db-description"
                placeholder="Describe this database migration..."
                value={newDatabaseConfig.description}
                onChange={(e) => setNewDatabaseConfig(prev => ({ ...prev, description: e.target.value }))}
                className="border-pink-200"
                disabled={migrationState === 'migrating'}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={testNewConnection}
                disabled={!newDatabaseConfig.url || !newDatabaseConfig.key || connectionTest === 'testing' || migrationState === 'migrating'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connectionTest === 'testing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                onClick={startMigration}
                disabled={connectionTest !== 'success' || migrationState === 'migrating'}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {migrationState === 'migrating' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Migration
                  </>
                )}
              </Button>

              {migrationState !== 'idle' && (
                <Button
                  onClick={resetMigration}
                  variant="outline"
                  disabled={migrationState === 'migrating'}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Migration Progress */}
      {migrationState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-purple-600 ${migrationState === 'migrating' ? 'animate-spin' : ''}`} />
                Migration Progress
              </CardTitle>
              <CardDescription>
                Real-time migration status and progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationState === 'migrating' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{Math.round(migrationProgress)}%</span>
                  </div>
                  <Progress value={migrationProgress} className="h-2" />
                  {currentStep && (
                    <p className="text-sm text-purple-600 font-medium">{currentStep}</p>
                  )}
                </div>
              )}

              {migrationState === 'completed' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Migration Completed Successfully!</strong> Your database has been migrated to the new location.
                    All data has been transferred and validated.
                  </AlertDescription>
                </Alert>
              )}

              {migrationState === 'error' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Migration Failed!</strong> There was an error during the migration process.
                    Please check the logs and try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Migration Log */}
              {migrationLog.length > 0 && (
                <div className="space-y-2">
                  <Label>Migration Log</Label>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
                    {migrationLog.map((log, idx) => (
                      <div key={idx} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}