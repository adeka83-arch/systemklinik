import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://*.vercel.app', 'https://*.supabase.co'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
}))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// Setup lengkap untuk user baru
app.post('/setup-complete-user', async (c) => {
  try {
    console.log('🚀 Starting complete user setup...')
    
    const body = await c.req.json()
    const { email, password, name } = body
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, dan nama harus diisi' }, 400)
    }

    console.log('📧 Setting up user with email:', email)

    // 1. Check if user already exists, if not create
    let authUserId = null
    let userExisted = false
    
    try {
      // Try to find existing user
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
      
      if (!listError && existingUsers?.users) {
        const existingUser = existingUsers.users.find(u => u.email === email)
        if (existingUser) {
          console.log('✅ User already exists in auth:', existingUser.id)
          authUserId = existingUser.id
          userExisted = true
        }
      }
    } catch (listError) {
      console.log('⚠️ Could not check existing users, will try to create')
    }

    // Create user if not exists
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        user_metadata: {
          name: name,
          role: 'Administrator',
          position: 'Pemilik Klinik'
        },
        email_confirm: true // Auto confirm email
      })

      if (authError) {
        // If user already exists error, try to get the user
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          console.log('✅ User already exists, getting user data')
          try {
            // Use listUsers and filter instead of getUserByEmail
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const existingUser = users?.find(u => u.email === email)
            if (existingUser) {
              authUserId = existingUser.id
              userExisted = true
            }
          } catch (getUserError) {
            console.error('❌ Could not get existing user:', getUserError)
            return c.json({ error: 'User sudah ada tapi tidak bisa diakses: ' + authError.message }, 400)
          }
        } else {
          console.error('❌ Auth user creation failed:', authError)
          return c.json({ error: 'Gagal membuat user auth: ' + authError.message }, 400)
        }
      } else if (authData?.user) {
        authUserId = authData.user.id
        console.log('✅ New auth user created successfully:', authUserId)
      }
    }

    if (!authUserId) {
      return c.json({ error: 'Gagal mendapatkan user ID' }, 400)
    }

    console.log(`✅ Auth user ${userExisted ? 'found' : 'created'} with ID:`, authUserId)

    // 2. Create Employee record with auth status
    const employeeId = Date.now().toString()
    const employee = {
      id: employeeId,
      name: name,
      email: email,
      position: 'Pemilik Klinik',
      salary: 0,
      dailyBonus: 0,
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId // Link to auth user
    }

    await kv.set(`employee:${employeeId}`, employee)
    console.log('✅ Employee record created with auth status')

    // 3. Create Doctor record with auth status (optional, tapi bisa berguna)
    const doctorId = Date.now().toString() + '_doc'
    const doctor = {
      id: doctorId,
      name: name,
      email: email,
      specialty: 'Umum',
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId // Link to auth user
    }

    await kv.set(`doctor:${doctorId}`, doctor)
    console.log('✅ Doctor record created with auth status')

    // 4. Create user mapping for quick lookup
    const userMapping = {
      email: email,
      authUserId: authUserId,
      employeeId: employeeId,
      doctorId: doctorId,
      name: name,
      role: 'Administrator',
      position: 'Pemilik Klinik',
      userType: 'employee', // Default as employee
      hasAuthAccess: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`user_mapping:${email}`, userMapping)
    console.log('✅ User mapping created')

    // 5. Add to employees and doctors lists
    try {
      const existingEmployees = await kv.get('employees') || []
      const updatedEmployees = Array.isArray(existingEmployees) ? [...existingEmployees, employee] : [employee]
      await kv.set('employees', updatedEmployees)

      const existingDoctors = await kv.get('doctors') || []
      const updatedDoctors = Array.isArray(existingDoctors) ? [...existingDoctors, doctor] : [doctor]
      await kv.set('doctors', updatedDoctors)

      console.log('✅ Added to employees and doctors lists')
    } catch (listError) {
      console.log('⚠️ Failed to update lists, but user created successfully:', listError)
    }

    return c.json({
      success: true,
      message: `User setup lengkap berhasil ${userExisted ? '(user sudah ada, dibuat mapping baru)' : '(user baru dibuat)'}`,
      user: {
        id: authUserId,
        email: email,
        name: name,
        role: 'Administrator',
        position: 'Pemilik Klinik',
        userType: 'employee',
        hasAuthAccess: true
      }
    })

  } catch (error) {
    console.error('💥 Complete user setup error:', error)
    return c.json({ 
      error: 'Gagal setup user: ' + error.message,
      details: error.stack 
    }, 500)
  }
})

// Verifikasi user untuk login
app.post('/verify-user', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body
    
    console.log('🔍 Verifying user:', email)

    // Check user mapping first
    const userMapping = await kv.get(`user_mapping:${email}`)
    if (userMapping) {
      console.log('✅ User found in mapping:', userMapping.name)
      return c.json({
        success: true,
        user: {
          name: userMapping.name,
          email: userMapping.email,
          role: userMapping.role,
          position: userMapping.position,
          userType: userMapping.userType,
          hasAuthAccess: userMapping.hasAuthAccess
        }
      })
    }

    // Fallback: Check employees list
    const employees = await kv.get('employees') || []
    const employee = Array.isArray(employees) ? employees.find(emp => emp.email === email && emp.status === 'auth') : null
    
    if (employee) {
      console.log('✅ User found in employees:', employee.name)
      return c.json({
        success: true,
        user: {
          name: employee.name,
          email: employee.email,
          role: 'Employee',
          position: employee.position || 'Staff',
          userType: 'employee',
          hasAuthAccess: true
        }
      })
    }

    // Fallback: Check doctors list
    const doctors = await kv.get('doctors') || []
    const doctor = Array.isArray(doctors) ? doctors.find(doc => doc.email === email && doc.status === 'auth') : null
    
    if (doctor) {
      console.log('✅ User found in doctors:', doctor.name)
      return c.json({
        success: true,
        user: {
          name: doctor.name,
          email: doctor.email,
          role: 'Doctor',
          position: doctor.specialty || 'Dokter',
          userType: 'doctor',
          hasAuthAccess: true
        }
      })
    }

    console.log('❌ User not found or no auth access:', email)
    return c.json({
      error: 'User tidak ditemukan atau tidak memiliki akses login'
    }, 404)

  } catch (error) {
    console.error('❌ User verification error:', error)
    return c.json({
      error: 'Gagal verifikasi user: ' + error.message
    }, 500)
  }
})

// Quick setup untuk development/testing - Direct Implementation
app.post('/quick-setup-adeka', async (c) => {
  try {
    console.log('🚀 Quick setup for Adeka...')

    const email = 'adeka83@gmail.com'
    const password = '1sampai9'
    const name = 'Ade Mardiansyah Eka Putra'

    console.log('📧 Setting up user with email:', email)

    // 1. Check if user already exists, if not create
    let authUserId = null
    let userExisted = false
    
    try {
      // Try to find existing user
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
      
      if (!listError && existingUsers?.users) {
        const existingUser = existingUsers.users.find(u => u.email === email)
        if (existingUser) {
          console.log('✅ User already exists in auth:', existingUser.id)
          authUserId = existingUser.id
          userExisted = true
        }
      }
    } catch (listError) {
      console.log('⚠️ Could not check existing users, will try to create')
    }

    // Create user if not exists
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        user_metadata: {
          name: name,
          role: 'Administrator',
          position: 'Pemilik Klinik'
        },
        email_confirm: true // Auto confirm email
      })

      if (authError) {
        // If user already exists error, try to get the user
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          console.log('✅ User already exists, getting user data')
          try {
            // Use listUsers and filter instead of getUserByEmail (quick-setup)
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const existingUser = users?.find(u => u.email === email)
            if (existingUser) {
              authUserId = existingUser.id
              userExisted = true
            }
          } catch (getUserError) {
            console.error('❌ Could not get existing user:', getUserError)
            return c.json({ error: 'User sudah ada tapi tidak bisa diakses: ' + authError.message }, 400)
          }
        } else {
          console.error('❌ Auth user creation failed:', authError)
          return c.json({ error: 'Gagal membuat user auth: ' + authError.message }, 400)
        }
      } else if (authData?.user) {
        authUserId = authData.user.id
        console.log('✅ New auth user created successfully:', authUserId)
      }
    }

    if (!authUserId) {
      return c.json({ error: 'Gagal mendapatkan user ID' }, 400)
    }

    console.log(`✅ Auth user ${userExisted ? 'found' : 'created'} with ID:`, authUserId)

    // 2. Create Employee record with auth status
    const employeeId = Date.now().toString()
    const employee = {
      id: employeeId,
      name: name,
      email: email,
      position: 'Pemilik Klinik',
      salary: 0,
      dailyBonus: 0,
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId // Link to auth user
    }

    await kv.set(`employee:${employeeId}`, employee)
    console.log('✅ Employee record created with auth status')

    // 3. Create Doctor record with auth status (optional, tapi bisa berguna)
    const doctorId = Date.now().toString() + '_doc'
    const doctor = {
      id: doctorId,
      name: name,
      email: email,
      specialty: 'Umum',
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId // Link to auth user
    }

    await kv.set(`doctor:${doctorId}`, doctor)
    console.log('✅ Doctor record created with auth status')

    // 4. Create user mapping for quick lookup
    const userMapping = {
      email: email,
      authUserId: authUserId,
      employeeId: employeeId,
      doctorId: doctorId,
      name: name,
      role: 'Administrator',
      position: 'Pemilik Klinik',
      userType: 'employee', // Default as employee
      hasAuthAccess: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`user_mapping:${email}`, userMapping)
    console.log('✅ User mapping created')

    // 5. Add to employees and doctors lists
    try {
      const existingEmployees = await kv.get('employees') || []
      const updatedEmployees = Array.isArray(existingEmployees) ? [...existingEmployees, employee] : [employee]
      await kv.set('employees', updatedEmployees)

      const existingDoctors = await kv.get('doctors') || []
      const updatedDoctors = Array.isArray(existingDoctors) ? [...existingDoctors, doctor] : [doctor]
      await kv.set('doctors', updatedDoctors)

      console.log('✅ Added to employees and doctors lists')
    } catch (listError) {
      console.log('⚠️ Failed to update lists, but user created successfully:', listError)
    }

    return c.json({
      success: true,
      message: 'Quick setup Adeka berhasil!',
      instructions: [
        '✅ User auth dibuat dengan email: adeka83@gmail.com',
        '✅ Employee record dibuat dengan status: auth',
        '✅ Doctor record dibuat dengan status: auth',
        '✅ User mapping dibuat untuk login cepat',
        '🎯 Sekarang bisa login dengan email & password yang ditentukan'
      ],
      user: {
        id: authUserId,
        email: email,
        name: name,
        role: 'Administrator',
        position: 'Pemilik Klinik',
        userType: 'employee',
        hasAuthAccess: true
      }
    })

  } catch (error) {
    console.error('💥 Quick setup error:', error)
    return c.json({
      error: 'Quick setup gagal: ' + error.message,
      details: error.stack
    }, 500)
  }
})

// Setup khusus untuk user yang sudah ada di auth
app.post('/setup-existing-user', async (c) => {
  try {
    console.log('🔄 Setting up existing auth user...')
    
    const body = await c.req.json()
    const { email, name } = body
    
    if (!email) {
      return c.json({ error: 'Email harus diisi' }, 400)
    }

    const userName = name || 'Ade Mardiansyah Eka Putra'
    console.log('📧 Setting up existing user:', email)

    // 1. Get existing auth user
    let authUserId = null
    try {
      // List all users and find by email (getUserByEmail doesn't exist in JS client)
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ Error listing users:', listError)
        return c.json({ error: 'Gagal mengakses user: ' + listError.message }, 500)
      }
      
      const existingUser = users.find(u => u.email === email)
      
      if (!existingUser) {
        return c.json({ error: 'User tidak ditemukan di Supabase Auth' }, 404)
      }
      
      authUserId = existingUser.id
      console.log('✅ Found existing auth user:', authUserId)
    } catch (error) {
      console.error('❌ Error getting user:', error)
      return c.json({ error: 'Gagal mengakses user: ' + error.message }, 500)
    }

    // 2. Create Employee record with auth status
    const employeeId = Date.now().toString()
    const employee = {
      id: employeeId,
      name: userName,
      email: email,
      position: 'Pemilik Klinik',
      salary: 0,
      dailyBonus: 0,
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId
    }

    await kv.set(`employee:${employeeId}`, employee)
    console.log('✅ Employee record created with auth status')

    // 3. Create Doctor record with auth status
    const doctorId = Date.now().toString() + '_doc'
    const doctor = {
      id: doctorId,
      name: userName,
      email: email,
      specialty: 'Umum',
      status: 'auth', // PENTING: Status auth untuk bisa login
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authUserId: authUserId
    }

    await kv.set(`doctor:${doctorId}`, doctor)
    console.log('✅ Doctor record created with auth status')

    // 4. Create user mapping for quick lookup
    const userMapping = {
      email: email,
      authUserId: authUserId,
      employeeId: employeeId,
      doctorId: doctorId,
      name: userName,
      role: 'Administrator',
      position: 'Pemilik Klinik',
      userType: 'employee',
      hasAuthAccess: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`user_mapping:${email}`, userMapping)
    console.log('✅ User mapping created')

    // 5. Add to employees and doctors lists
    try {
      const existingEmployees = await kv.get('employees') || []
      const updatedEmployees = Array.isArray(existingEmployees) ? [...existingEmployees, employee] : [employee]
      await kv.set('employees', updatedEmployees)

      const existingDoctors = await kv.get('doctors') || []
      const updatedDoctors = Array.isArray(existingDoctors) ? [...existingDoctors, doctor] : [doctor]
      await kv.set('doctors', updatedDoctors)

      console.log('✅ Added to employees and doctors lists')
    } catch (listError) {
      console.log('⚠️ Failed to update lists, but user created successfully:', listError)
    }

    return c.json({
      success: true,
      message: 'Setup untuk user yang sudah ada berhasil!',
      user: {
        id: authUserId,
        email: email,
        name: userName,
        role: 'Administrator',
        position: 'Pemilik Klinik',
        userType: 'employee',
        hasAuthAccess: true
      }
    })

  } catch (error) {
    console.error('💥 Existing user setup error:', error)
    return c.json({ 
      error: 'Gagal setup existing user: ' + error.message,
      details: error.stack 
    }, 500)
  }
})

// Check current data status
app.get('/check-setup', async (c) => {
  try {
    const employees = await kv.get('employees') || []
    const doctors = await kv.get('doctors') || []
    const adekaMapping = await kv.get('user_mapping:adeka83@gmail.com')

    const authEmployees = Array.isArray(employees) ? employees.filter(emp => emp.status === 'auth') : []
    const authDoctors = Array.isArray(doctors) ? doctors.filter(doc => doc.status === 'auth') : []

    return c.json({
      success: true,
      data: {
        totalEmployees: Array.isArray(employees) ? employees.length : 0,
        totalDoctors: Array.isArray(doctors) ? doctors.length : 0,
        authEmployees: authEmployees.length,
        authDoctors: authDoctors.length,
        adekaUserExists: !!adekaMapping,
        authEmployeesList: authEmployees.map(emp => ({ name: emp.name, email: emp.email })),
        authDoctorsList: authDoctors.map(doc => ({ name: doc.name, email: doc.email }))
      }
    })
  } catch (error) {
    return c.json({
      error: 'Gagal check setup: ' + error.message
    }, 500)
  }
})

export default app