import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, AlertCircle, Key, Database, UserPlus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export function DirectDatabaseTester() {
  const [supabaseUrl, setSupabaseUrl] = useState('https://bxtefmfkcwbyqoctpfdb.supabase.co')
  const [serviceRoleKey, setServiceRoleKey] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      setResult({
        success: false,
        error: 'URL dan Service Role Key wajib diisi'
      })
      return
    }

    setLoading(true)
    
    try {
      console.log('🧪 Testing direct connection...')
      
      // Test connection
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      
      // Test 1: List users
      console.log('Testing auth.admin.listUsers...')
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        setResult({
          success: false,
          error: `Auth test failed: ${usersError.message}`,
          details: usersError
        })
        return
      }
      
      // Test 2: Check if KV table exists by trying to query it
      console.log('Testing database query...')
      const { data: tableData, error: tableError } = await supabase
        .from('kv_store_73417b67')
        .select('*')
        .limit(1)
      
      const kvStatus = tableError 
        ? `ERROR: ${tableError.message}` 
        : `OK (${tableData?.length || 0} records found)`
      
      setResult({
        success: true,
        message: 'Database connection successful!',
        tests: {
          auth: `OK (${usersData.users.length} users)`,
          kv_store: kvStatus,
          url: supabaseUrl,
          key_valid: 'YES'
        }
      })
      
    } catch (error) {
      console.log('❌ Direct test error:', error)
      setResult({
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Periksa URL dan Service Role Key'
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    if (!result?.success) {
      alert('Tes koneksi database dulu!')
      return
    }

    setLoading(true)
    
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      
      console.log('👤 Creating test user...')
      
      // Buat user di auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'adeka83@gmail.com',
        password: '1sampai9',
        user_metadata: { name: 'Dr. Adeka Falasifah' },
        email_confirm: true
      })
      
      if (authError && !authError.message.includes('already registered')) {
        alert(`Auth error: ${authError.message}`)
        return
      }
      
      // Buat doctor record menggunakan direct database insert
      const doctorData = {
        id: `doctor_${Date.now()}`,
        nama: 'Dr. Adeka Falasifah',
        email: 'adeka83@gmail.com',
        spesialisasi: 'Dokter Gigi Umum',
        telepon: '081234567890',
        alamat: 'Sawangan, Depok',
        status: 'administrator',
        shift: 'pagi',
        tarif_per_jam: 100000,
        created_at: new Date().toISOString()
      }
      
      // Insert ke kv_store menggunakan SQL function atau direct insert
      try {
        // Method 1: Direct table insert
        const { error: insertError } = await supabase
          .from('kv_store_73417b67')
          .insert({
            key: doctorData.id,
            value: doctorData,
            created_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.log('Direct insert error:', insertError)
          throw insertError
        }
        
        alert('✅ User berhasil dibuat!\n\nEmail: adeka83@gmail.com\nPassword: 1sampai9\n\nSilakan login!')
        
      } catch (insertError) {
        console.log('Insert error:', insertError)
        alert(`❌ Gagal simpan doctor record: ${insertError}`)
      }
      
    } catch (error) {
      console.log('❌ Create user error:', error)
      alert(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Direct Database Connection Tester
        </CardTitle>
        <CardDescription>
          Test koneksi langsung ke database tanpa server function
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="url">Supabase URL</Label>
            <Input
              id="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"
            />
          </div>
          <div>
            <Label htmlFor="key">Service Role Key</Label>
            <Input
              id="key"
              type="password"
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              placeholder="Paste service role key dari Settings > API"
            />
            <p className="text-xs text-gray-500 mt-1">
              Buka Supabase Dashboard {'>'} Settings {'>'} API {'>'} Copy "service_role" key
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Test Connection
              </div>
            )}
          </Button>

          {result?.success && (
            <Button 
              onClick={createTestUser} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Default User
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message || result.error}
                </span>
              </AlertDescription>
            </Alert>

            {result.tests && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auth Connection</span>
                    <Badge className="bg-green-100 text-green-800">
                      {result.tests.auth}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KV Store</span>
                    <Badge className={result.tests.kv_store.includes('ERROR') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {result.tests.kv_store}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database URL</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      ✅ VALID
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.suggestion && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {result.suggestion}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-600">Cara Dapat Service Role Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="space-y-1">
              <p>1. Buka <strong>https://supabase.com/dashboard/projects</strong></p>
              <p>2. Pilih project: <strong>bxtefmfkcwbyqoctpfdb</strong></p>
              <p>3. Klik <strong>Settings</strong> (ikon gear) di sidebar kiri</p>
              <p>4. Klik <strong>API</strong></p>
              <p>5. Copy key yang ada di <strong>"service_role"</strong> (bukan anon key)</p>
              <p>6. Paste di field "Service Role Key" di atas</p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}