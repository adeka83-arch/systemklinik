import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
import { AlertTriangle, CheckCircle, XCircle, User, Shield, Key, Trash2, RefreshCw } from 'lucide-react'

interface DoctorAuthStatus {
  doctorId: string
  name: string
  email: string
  hasLoginAccess: boolean
  authUserId: string | null
  authUserExists: boolean
  authUserEmail: string | null
  authUserMetadata: any
  canLogin: boolean
  issues: string[]
}

interface DiagnosticResult {
  success: boolean
  totalDoctors: number
  totalAuthUsers: number
  canLoginCount: number
  hasIssuesCount: number
  diagnosticResults: DoctorAuthStatus[]
}

export function DoctorAuthDiagnostic() {
  const [loading, setLoading] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticResult | null>(null)
  const [fixingDoctor, setFixingDoctor] = useState<string | null>(null)
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({})

  const runDiagnostic = async () => {
    setLoading(true)
    try {
      console.log('Running doctor auth diagnostic...')
      
      const response = await fetch(`${serverUrl}/debug/doctor-auth-status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Diagnostic result:', data)
        setDiagnosticData(data)
        
        toast.success(`✅ Diagnostic completed!
        
📊 Total Doctors: ${data.totalDoctors}
✅ Can Login: ${data.canLoginCount}
⚠️ Has Issues: ${data.hasIssuesCount}`)
      } else {
        const error = await response.text()
        console.error('Diagnostic error:', error)
        toast.error(`Gagal menjalankan diagnostic: ${error}`)
      }
    } catch (error) {
      console.error('Diagnostic exception:', error)
      toast.error('Terjadi kesalahan saat menjalankan diagnostic')
    } finally {
      setLoading(false)
    }
  }

  const fixDoctorAuth = async (doctorId: string, action: string) => {
    if (action === 'create_auth_user' && !passwords[doctorId]) {
      toast.error('Password diperlukan untuk membuat auth user')
      return
    }

    setFixingDoctor(doctorId)
    try {
      console.log(`Fixing doctor auth: ${doctorId}, action: ${action}`)
      
      const requestBody: any = { doctorId, action }
      if (action === 'create_auth_user') {
        requestBody.password = passwords[doctorId]
      }
      
      const response = await fetch(`${serverUrl}/debug/fix-doctor-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Fix result:', result)
        
        toast.success(result.message)
        
        // Clear password after success
        if (action === 'create_auth_user') {
          setPasswords(prev => ({ ...prev, [doctorId]: '' }))
        }
        
        // Re-run diagnostic to get updated status
        setTimeout(() => runDiagnostic(), 1000)
      } else {
        const error = await response.json()
        console.error('Fix error:', error)
        toast.error(`Gagal fix doctor auth: ${error.error}`)
      }
    } catch (error) {
      console.error('Fix exception:', error)
      toast.error('Terjadi kesalahan saat fix doctor auth')
    } finally {
      setFixingDoctor(null)
    }
  }

  const getStatusBadge = (doctor: DoctorAuthStatus) => {
    if (doctor.canLogin) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Can Login</Badge>
    } else if (doctor.issues.length > 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Has Issues</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ Unknown</Badge>
    }
  }

  useEffect(() => {
    // Auto-run diagnostic on component mount
    runDiagnostic()
  }, [])

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-purple-800 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          🩺 Doctor Auth Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostic}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? 'Running...' : '🔍 Run Diagnostic'}
          </Button>
          
          {diagnosticData && (
            <div className="flex gap-2 text-sm">
              <Badge className="bg-blue-100 text-blue-800">
                📊 Total: {diagnosticData.totalDoctors}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                ✅ Can Login: {diagnosticData.canLoginCount}
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                ⚠️ Issues: {diagnosticData.hasIssuesCount}
              </Badge>
            </div>
          )}
        </div>

        {diagnosticData && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {diagnosticData.diagnosticResults.map((doctor) => (
              <Card key={doctor.doctorId} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.email}</p>
                    </div>
                    {getStatusBadge(doctor)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Login Access: {doctor.hasLoginAccess ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Auth User: {doctor.authUserExists ? '✅' : '❌'}</span>
                    </div>
                  </div>

                  {doctor.issues.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-red-600 mb-1">Issues:</p>
                      <ul className="text-xs space-y-1">
                        {doctor.issues.map((issue, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className={
                              issue.includes('Email mismatch') ? 'text-orange-600' :
                              issue.includes('Auth user not found') ? 'text-red-600' :
                              issue.includes('No authUserId') ? 'text-blue-600' :
                              'text-red-600'
                            }>
                              {issue}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Special case indicator for email already registered */}
                  {doctor.authUserExists && doctor.issues.includes('Email mismatch') && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-xs text-orange-700">
                        <RefreshCw className="h-3 w-3 inline mr-1" />
                        <strong>Auth user sudah ada dengan email ini.</strong> Gunakan "Link Auth" untuk menghubungkan.
                      </p>
                    </div>
                  )}

                  {!doctor.canLogin && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-700">Quick Fixes:</p>
                      
                      {/* Create Auth User - akan auto-detect jika sudah ada */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder={doctor.authUserId ? "Password baru..." : "Password untuk login..."}
                            value={passwords[doctor.doctorId] || ''}
                            onChange={(e) => setPasswords(prev => ({ 
                              ...prev, 
                              [doctor.doctorId]: e.target.value 
                            }))}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => fixDoctorAuth(doctor.doctorId, 'create_auth_user')}
                            disabled={fixingDoctor === doctor.doctorId || !passwords[doctor.doctorId]}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs whitespace-nowrap"
                          >
                            {fixingDoctor === doctor.doctorId ? '...' : 
                              <><Key className="h-3 w-3 mr-1" />{doctor.authUserId ? 'Link Auth' : 'Create Auth'}</>
                            }
                          </Button>
                        </div>
                        {doctor.authUserId && (
                          <p className="text-xs text-orange-600">
                            ⚠️ Auth user sudah ada, akan di-link ke doctor ini
                          </p>
                        )}
                      </div>

                      {/* Reset Password untuk existing auth user */}
                      {doctor.authUserId && doctor.authUserExists && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder="Password baru untuk reset..."
                              value={passwords[`${doctor.doctorId}_reset`] || ''}
                              onChange={(e) => setPasswords(prev => ({ 
                                ...prev, 
                                [`${doctor.doctorId}_reset`]: e.target.value 
                              }))}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                // Use reset password action with different password field
                                const originalPassword = passwords[doctor.doctorId]
                                setPasswords(prev => ({ 
                                  ...prev, 
                                  [doctor.doctorId]: passwords[`${doctor.doctorId}_reset`] 
                                }))
                                fixDoctorAuth(doctor.doctorId, 'reset_password').finally(() => {
                                  setPasswords(prev => ({ 
                                    ...prev, 
                                    [doctor.doctorId]: originalPassword,
                                    [`${doctor.doctorId}_reset`]: ''
                                  }))
                                })
                              }}
                              disabled={fixingDoctor === doctor.doctorId || !passwords[`${doctor.doctorId}_reset`]}
                              className="bg-orange-600 hover:bg-orange-700 text-white text-xs whitespace-nowrap"
                            >
                              {fixingDoctor === doctor.doctorId ? '...' : <><Key className="h-3 w-3 mr-1" />Reset Pass</>}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Enable Login Access */}
                      {doctor.authUserId && !doctor.hasLoginAccess && (
                        <Button
                          size="sm"
                          onClick={() => fixDoctorAuth(doctor.doctorId, 'enable_login_access')}
                          disabled={fixingDoctor === doctor.doctorId}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          {fixingDoctor === doctor.doctorId ? '...' : <><CheckCircle className="h-3 w-3 mr-1" />Enable Login</>}
                        </Button>
                      )}

                      {/* Delete Auth User */}
                      {doctor.authUserId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => fixDoctorAuth(doctor.doctorId, 'delete_auth_user')}
                          disabled={fixingDoctor === doctor.doctorId}
                          className="text-xs"
                        >
                          {fixingDoctor === doctor.doctorId ? '...' : <><Trash2 className="h-3 w-3 mr-1" />Delete Auth</>}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-xs text-purple-700 bg-purple-100 p-3 rounded">
          <p><strong>Instructions:</strong></p>
          <p>• <strong>Create/Link Auth:</strong> Buat auth user baru atau link ke existing auth user</p>
          <p>• <strong>Reset Pass:</strong> Reset password untuk auth user yang sudah ada</p>
          <p>• <strong>Enable Login:</strong> Aktifkan hasLoginAccess untuk dokter</p>
          <p>• <strong>Delete Auth:</strong> Hapus auth user dan nonaktifkan login</p>
          <p className="mt-2 text-orange-700"><strong>⚠️ Auto-Fix:</strong> Jika email sudah terdaftar, sistem akan otomatis link ke existing auth user</p>
        </div>
      </CardContent>
    </Card>
  )
}