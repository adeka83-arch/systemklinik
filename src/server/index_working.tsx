import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { addSittingFeesEndpoints, addSalesEndpoints, addStockOpnameEndpoints, addExpensesEndpoints, addEmployeesEndpoints, addDentalMaterialsEndpoints, addDentalUsagesEndpoints } from './missing_endpoints.tsx'
import { addPromoImagesEndpoints, addPromoHistoryEndpoints, addPatientsEndpoints, addVouchersEndpoints } from './promo_endpoints.tsx'

const app = new Hono()

// Ultra-permissive CORS for all origins
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}))

// Logger middleware
app.use('*', logger(console.log))

console.log('🚀 Starting server with promo endpoints...')

// Add missing endpoints
addSittingFeesEndpoints(app)
addSalesEndpoints(app) 
addStockOpnameEndpoints(app)
addExpensesEndpoints(app)
addEmployeesEndpoints(app)
addDentalMaterialsEndpoints(app)
addDentalUsagesEndpoints(app)

// Add promo endpoints
console.log('📦 Adding promo endpoints...')
try {
  addPromoImagesEndpoints(app)
  addPromoHistoryEndpoints(app)
  addPatientsEndpoints(app)
  addVouchersEndpoints(app)
  console.log('✅ Promo endpoints added successfully')
} catch (error) {
  console.error('❌ Error adding promo endpoints:', error)
}

// =============== HEALTH CHECK ===============
app.get('/make-server-73417b67/health', async (c) => {
  const timestamp = new Date().toISOString()
  console.log('💗 Health check called at:', timestamp)
  
  const authHeader = c.req.header('Authorization')
  console.log('🔑 Auth header present:', !!authHeader)
  
  return c.json({
    success: true,
    message: 'Server is alive!',
    timestamp: timestamp,
    server: 'Falasifah Dental Clinic',
    hasAuth: !!authHeader,
    endpoints: ['vouchers', 'promo-images', 'patients', 'promo-history']
  })
})

// =============== REGISTER ===============
app.post('/make-server-73417b67/register', async (c) => {
  console.log('📝 Register called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return c.json({ 
        success: false, 
        error: 'Server configuration error: Missing environment variables' 
      }, 500)
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const body = await c.req.json()
    const { email, password, name, role = 'karyawan' } = body
    
    console.log('📋 Registration attempt:', {
      email: email ? email.trim().toLowerCase() : 'MISSING',
      name: name ? name.trim() : 'MISSING',
      role: role,
      hasPassword: !!password
    })
    
    // Validate input
    if (!email || !password || !name) {
      return c.json({ 
        success: false, 
        error: 'Email, password, dan nama wajib diisi' 
      }, 400)
    }
    
    // Create Supabase auth user
    console.log('🔐 Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      user_metadata: { 
        name: name.trim(),
        role: role
      },
      email_confirm: true
    })
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
      
      if (authError.message.includes('already') || authError.message.includes('registered')) {
        return c.json({ 
          success: false, 
          error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' 
        }, 400)
      }
      
      return c.json({ 
        success: false, 
        error: `Gagal membuat akun: ${authError.message}` 
      }, 400)
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Save to KV store
    console.log('💾 Saving to database...')
    const kv = await import('./kv_store.tsx')
    
    const userData = {
      id: `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: email.trim().toLowerCase(),
      nama: name.trim(),
      telepon: '',
      alamat: '',
      status: 'aktif',
      created_at: new Date().toISOString(),
      auth_user_id: authData.user.id
    }
    
    // Add role-specific data
    if (role === 'dokter') {
      Object.assign(userData, {
        spesialisasi: 'Dokter Gigi Umum',
        shift: 'pagi',
        tarif_per_jam: 100000
      })
    } else {
      Object.assign(userData, {
        posisi: 'Staff',
        gaji_pokok: 3000000
      })
    }
    
    await kv.set(userData.id, userData)
    console.log('✅ Data saved with ID:', userData.id)
    
    return c.json({
      success: true,
      message: '🎉 Registrasi berhasil! Silakan login.',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.nama,
        role: role
      }
    })
    
  } catch (error) {
    console.log('💥 Register error:', error)
    return c.json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    }, 500)
  }
})

// =============== VERIFY USER ===============
app.post('/make-server-73417b67/verify-user', async (c) => {
  console.log('🔍 Verify user called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    
    const body = await c.req.json()
    const { email } = body
    
    if (!email) {
      return c.json({ success: false, error: 'Email required' }, 400)
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    console.log('🔍 Looking for user:', normalizedEmail)
    
    // Check doctors
    const doctors = await kv.getByPrefix('dokter_')
    const doctor = doctors.find(d => d.email === normalizedEmail && d.status === 'aktif')
    
    if (doctor) {
      console.log('✅ Found doctor:', doctor.nama)
      return c.json({
        success: true,
        user: {
          name: doctor.nama,
          email: doctor.email,
          role: 'dokter',
          userType: 'doctor'
        }
      })
    }
    
    // Check employees
    const employees = await kv.getByPrefix('karyawan_')
    const employee = employees.find(e => e.email === normalizedEmail && e.status === 'aktif')
    
    if (employee) {
      console.log('✅ Found employee:', employee.nama)
      return c.json({
        success: true,
        user: {
          name: employee.nama,
          email: employee.email,
          role: 'karyawan',
          userType: 'employee'
        }
      })
    }
    
    console.log('❌ User not found')
    return c.json({
      success: false,
      error: 'User tidak ditemukan atau tidak aktif',
      needsRegistration: true
    }, 403)
    
  } catch (error) {
    console.log('💥 Verify error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============== CLINIC SETTINGS ===============
app.get('/make-server-73417b67/clinic-settings', async (c) => {
  console.log('🏥 Clinic settings called')
  
  return c.json({
    success: true,
    settings: {
      name: 'Falasifah Dental Clinic',
      address: 'Sawangan, Depok City, West Java, Indonesia',
      adminFee: 20000
    }
  })
})

// =============== TEST VOUCHERS ENDPOINT ===============
app.get('/make-server-73417b67/test-vouchers', async (c) => {
  console.log('🧪 Test vouchers endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const vouchers = await kv.getByPrefix('voucher_')
    
    return c.json({
      success: true,
      message: 'Vouchers endpoint is working!',
      vouchersCount: vouchers.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== START SERVER ===============
console.log('🎯 Server configured with all endpoints, starting...')

// Start the server
Deno.serve(app.fetch)

console.log('✅ Server started successfully with vouchers endpoint!')