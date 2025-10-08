import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    role?: string
    position?: string
  }
  created_at: string
}

interface Props {
  accessToken: string
}

export function SupabaseAuthDebugger({ accessToken }: Props) {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchAuthUsers = async () => {
    setLoading(true)
    try {
      console.log('=== FETCHING SUPABASE AUTH USERS ===')
      
      const response = await fetch(`${serverUrl}/debug/auth-users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      console.log('Auth users response status:', response.status)
      console.log('Auth users response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Auth users data:', data)
        setAuthUsers(data.users || [])
        toast.success(`Berhasil mengambil ${data.users?.length || 0} auth users`)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch auth users:', errorData)
        toast.error('Gagal mengambil data auth users')
      }
    } catch (error) {
      console.error('Error fetching auth users:', error)
      toast.error('Error saat mengambil data auth users')
    } finally {
      setLoading(false)
    }
  }

  const createTestAuthUser = async () => {
    try {
      console.log('=== CREATING TEST AUTH USER ===')
      
      // Let server generate unique email automatically
      const testUser = {
        // email will be auto-generated if not provided
        password: 'testpassword123',
        name: `Test Dokter ${Date.now()}`
      }
      
      const response = await fetch(`${serverUrl}/debug/create-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(testUser)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Test auth user created:', data)
        if (data.note) {
          toast.success(`Test auth user berhasil dibuat! (${data.note})`)
        } else {
          toast.success(`Test auth user berhasil dibuat! Email: ${data.user?.email}`)
        }
        fetchAuthUsers() // Refresh
      } else {
        const errorData = await response.json()
        console.error('Failed to create test auth user:', errorData)
        toast.error(`Gagal membuat test auth user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating test auth user:', error)
      toast.error('Error saat membuat test auth user')
    }
  }

  const cleanupTestUsers = async () => {
    setDeleting('cleanup')
    try {
      console.log('=== CLEANING UP TEST USERS ===')
      
      const response = await fetch(`${serverUrl}/debug/cleanup-test-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Cleanup result:', data)
        toast.success(data.summary || 'Test users berhasil dibersihkan!')
        fetchAuthUsers() // Refresh
      } else {
        const errorData = await response.json()
        console.error('Failed to cleanup test users:', errorData)
        toast.error(`Gagal cleanup test users: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error cleaning up test users:', error)
      toast.error('Error saat cleanup test users')
    } finally {
      setDeleting(null)
    }
  }

  const deleteUserByEmail = async (email: string) => {
    setDeleting(email)
    try {
      console.log('=== DELETING USER BY EMAIL ===', email)
      
      const response = await fetch(`${serverUrl}/debug/delete-user-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Delete result:', data)
        toast.success(`User ${email} berhasil dihapus!`)
        fetchAuthUsers() // Refresh
      } else {
        const errorData = await response.json()
        console.error('Failed to delete user:', errorData)
        toast.error(`Gagal hapus user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error saat hapus user')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-pink-800">🔍 Supabase Auth Debugger</CardTitle>
        <p className="text-sm text-pink-600">
          Tool untuk debug masalah Supabase Authentication
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={fetchAuthUsers}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? '🔄 Loading...' : '👥 List Auth Users'}
          </Button>
          
          <Button 
            onClick={createTestAuthUser}
            disabled={deleting !== null}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            🧪 Create Test User
          </Button>
          
          <Button 
            onClick={cleanupTestUsers}
            disabled={deleting !== null}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting === 'cleanup' ? '🔄 Cleaning...' : '🗑️ Cleanup Test Users'}
          </Button>
        </div>

        {authUsers.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <strong className="text-blue-800">📋 Auth Users di Supabase ({authUsers.length}):</strong>
              <ul className="mt-2 space-y-2">
                {authUsers.map(user => {
                  const isTestUser = user.email?.includes('test.dokter') || 
                                   user.email?.includes('@example.com') ||
                                   user.user_metadata?.role === 'Test'
                  
                  return (
                    <li key={user.id} className="text-sm text-blue-700 border-b border-blue-200 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong>Email:</strong> {user.email}
                          {isTestUser && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">TEST</span>}
                        </div>
                        <div>
                          <strong>Name:</strong> {user.user_metadata?.name || 'N/A'}
                        </div>
                        <div>
                          <strong>Role:</strong> {user.user_metadata?.role || 'N/A'}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>ID:</strong> {user.id.substring(0, 8)}...
                          </div>
                          {isTestUser && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUserByEmail(user.email!)}
                              disabled={deleting !== null}
                              className="h-6 px-2 text-xs"
                            >
                              {deleting === user.email ? '🔄' : '🗑️'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}