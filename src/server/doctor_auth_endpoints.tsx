import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export function createDoctorAuthRoutes(app: Hono) {
  
  // Enhanced endpoint to create test doctor with full integration
  app.post('/make-server-73417b67/debug/create-test-doctor', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const testEmail = 'test.dokter@example.com'
      const testPassword = 'testpassword123'
      const testName = 'Dr. Test Dokter'
      
      console.log('🩺 Creating comprehensive test doctor...')
      console.log('Email:', testEmail)
      console.log('Password:', testPassword)
      console.log('Name:', testName)
      
      // Step 1: Clean up any existing test data first
      console.log('🧹 Cleaning up existing test data...')
      
      // Delete existing auth user
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      if (existingUsers) {
        for (const user of existingUsers.users) {
          if (user.email === testEmail) {
            await supabase.auth.admin.deleteUser(user.id)
            console.log('🗑️ Deleted existing auth user:', user.id)
          }
        }
      }
      
      // Delete existing doctor record
      const existingDoctors = await kv.getByPrefix('doctor_')
      for (const doctor of existingDoctors) {
        if (doctor.email === testEmail) {
          await kv.del(doctor.id)
          console.log('🗑️ Deleted existing doctor record:', doctor.id)
        }
      }
      
      // Step 2: Create Supabase auth user
      console.log('🔐 Creating Supabase auth user...')
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: { 
          name: testName,
          role: 'Dokter',
          userType: 'doctor',
          access_level: 'Dokter',
          position: 'Dokter Umum',
          specialization: 'Umum'
        },
        email_confirm: true
      })

      if (authError) {
        console.log('❌ Auth user creation failed:', authError)
        return c.json({ error: `Failed to create auth user: ${authError.message}` }, 400)
      }

      console.log('✅ Auth user created:', authUser.user?.id)
      
      // Step 3: Create doctor record in KV store
      console.log('📋 Creating doctor record in KV store...')
      const doctorId = `doctor_${Date.now()}`
      const doctorRecord = {
        id: doctorId,
        name: testName,
        email: testEmail,
        specialization: 'Umum',
        phone: '081234567890',
        licenseNumber: 'SIP-TEST-2024',
        shifts: ['09:00-15:00', '15:00-21:00'],
        status: 'active',
        hasLoginAccess: true,
        authUserId: authUser.user?.id,
        role: 'Dokter',
        createdAt: new Date().toISOString()
      }
      
      await kv.set(doctorId, doctorRecord)
      console.log('✅ Doctor record created:', doctorId)
      
      // Step 4: Verify the creation by testing verification endpoint
      console.log('🔍 Verifying test doctor can be found...')
      try {
        const verifyRequest = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ email: testEmail })
        }
        
        const verifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')?.replace('https://', '')?.replace('.supabase.co', '')}.supabase.co/functions/v1/make-server-73417b67/verify-user`, verifyRequest)
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          console.log('✅ Verification test passed:', verifyData)
        } else {
          console.log('⚠️ Verification test failed, but doctor was created')
        }
      } catch (verifyError) {
        console.log('⚠️ Verification test error:', verifyError)
      }
      
      console.log('🎉 Test doctor creation completed!')
      
      return c.json({ 
        success: true,
        message: 'Test doctor created successfully with full integration',
        doctor: doctorRecord,
        authUser: {
          id: authUser.user?.id,
          email: authUser.user?.email,
          user_metadata: authUser.user?.user_metadata
        },
        credentials: {
          email: testEmail,
          password: testPassword
        }
      })
    } catch (error) {
      console.log('❌ Error creating test doctor:', error)
      return c.json({ error: 'Failed to create test doctor' }, 500)
    }
  })
  
  // Debug endpoint to list all doctors
  app.get('/make-server-73417b67/debug/doctors', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const doctors = await kv.getByPrefix('doctor_')
      console.log('📋 Found doctors in KV store:', doctors.length)
      
      const doctorsWithAuth = doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        hasLoginAccess: doc.hasLoginAccess,
        status: doc.status
      }))
      
      return c.json({ 
        doctors: doctorsWithAuth,
        count: doctors.length
      })
    } catch (error) {
      console.log('Error listing doctors:', error)
      return c.json({ error: 'Failed to list doctors' }, 500)
    }
  })

  // Debug endpoint to list auth users
  app.get('/make-server-73417b67/debug/auth-users', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        throw listError
      }
      
      const filteredUsers = users.users.map(user => ({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at
      }))
      
      return c.json({ 
        users: filteredUsers,
        count: filteredUsers.length
      })
    } catch (error) {
      console.log('Error listing auth users:', error)
      return c.json({ error: 'Failed to list auth users' }, 500)
    }
  })

  // Cleanup test users endpoint
  app.post('/make-server-73417b67/debug/cleanup-test-users', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      let deletedUsers = 0
      let deletedDoctors = 0

      // Delete test auth users
      const { data: users } = await supabase.auth.admin.listUsers()
      if (users) {
        for (const user of users.users) {
          if (user.email?.includes('test') || user.email?.includes('example.com')) {
            await supabase.auth.admin.deleteUser(user.id)
            deletedUsers++
          }
        }
      }

      // Delete test doctors from KV store
      const doctors = await kv.getByPrefix('doctor_')
      for (const doctor of doctors) {
        if (doctor.email?.includes('test') || doctor.email?.includes('example.com')) {
          await kv.del(`doctor_${doctor.id}`)
          deletedDoctors++
        }
      }

      return c.json({ 
        summary: `Deleted ${deletedUsers} auth users and ${deletedDoctors} doctors`,
        deletedUsers,
        deletedDoctors
      })
    } catch (error) {
      console.log('Error during cleanup:', error)
      return c.json({ error: 'Failed to cleanup' }, 500)
    }
  })
  
  // Note: verify-user endpoint is already defined in main server index.tsx
  // Removed duplicate endpoint to prevent routing conflicts

}