// TEMPORARY FILE - LOGIN FIX FOR DOCTORS AND EMPLOYEES

import { Hono } from 'npm:hono'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './supabase/functions/server/kv_store.tsx'

// This is the complete verify-user endpoint that should be added to the main server file

export const verifyUserEndpoint = `
// ================= DOCTOR/EMPLOYEE USER VERIFICATION =================

// Verify user as doctor or employee for login access
app.post('/make-server-73417b67/verify-user', async (c) => {
  try {
    console.log('🔐 Verifying user for login access...')
    
    const body = await c.req.json()
    const { email } = body
    
    if (!email) {
      return c.json({
        success: false,
        error: 'Email is required'
      }, 400)
    }
    
    console.log('🔍 Looking for user with email:', email)
    
    // Initialize sample doctor/employee data if needed
    await initializeSampleUsers()
    
    // Check if user exists as doctor
    const doctors = await kv.getByPrefix('doctor_')
    const doctor = doctors.find(d => d.email && d.email.toLowerCase() === email.toLowerCase())
    
    if (doctor && doctor.status === 'auth') {
      console.log('✅ Found verified doctor:', doctor.nama)
      return c.json({
        success: true,
        user: {
          name: doctor.nama,
          email: doctor.email,
          role: 'dokter',
          position: doctor.spesialisasi || 'Dokter Umum',
          userType: 'doctor'
        }
      })
    }
    
    // Check if user exists as employee
    const employees = await kv.getByPrefix('employee_')
    const employee = employees.find(e => e.email && e.email.toLowerCase() === email.toLowerCase())
    
    if (employee && employee.status === 'auth') {
      console.log('✅ Found verified employee:', employee.nama)
      return c.json({
        success: true,
        user: {
          name: employee.nama,
          email: employee.email,
          role: 'karyawan',
          position: employee.posisi || 'Staff',
          userType: 'employee'
        }
      })
    }
    
    console.log('❌ User not found or not authorized for login')
    return c.json({
      success: false,
      error: 'User tidak ditemukan atau tidak memiliki akses login'
    }, 403)
    
  } catch (error) {
    console.log('❌ Error verifying user:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// Initialize sample doctor and employee data for login
const initializeSampleUsers = async () => {
  try {
    console.log('🔧 Checking if users need initialization...')
    
    // Check if default user exists
    const defaultUserEmail = 'adeka83@gmail.com'
    const doctors = await kv.getByPrefix('doctor_')
    const employees = await kv.getByPrefix('employee_')
    
    const existingDoctor = doctors.find(d => d.email === defaultUserEmail)
    const existingEmployee = employees.find(e => e.email === defaultUserEmail)
    
    if (!existingDoctor && !existingEmployee) {
      console.log('👨‍⚕️ Creating default doctor user...')
      
      // Create default doctor user
      const doctorId = \`doctor_\${Date.now()}_default\`
      const doctor = {
        id: doctorId,
        nama: 'Dr. Adeka Falasifah',
        email: defaultUserEmail,
        spesialisasi: 'Dokter Gigi Umum',
        telepon: '081234567890',
        alamat: 'Sawangan, Depok',
        status: 'auth', // Status auth means can login
        shift: 'pagi',
        tarif_per_jam: 100000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await kv.set(doctorId, doctor)
      console.log('✅ Default doctor created:', doctor.nama)
    }
    
    // Also create some sample employees if needed
    if (employees.length === 0) {
      console.log('👩‍💼 Creating sample employees...')
      
      const sampleEmployees = [
        {
          id: \`employee_\${Date.now()}_001\`,
          nama: 'Siti Nurhaliza',
          email: 'siti.admin@falasifah.com',
          posisi: 'Administrasi',
          telepon: '081234567891',
          alamat: 'Sawangan, Depok',
          status: 'auth',
          gaji_pokok: 3500000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: \`employee_\${Date.now()}_002\`,  
          nama: 'Budi Santoso',
          email: 'budi.asisten@falasifah.com',
          posisi: 'Asisten Dokter',
          telepon: '081234567892',
          alamat: 'Cinere, Depok',
          status: 'auth',
          gaji_pokok: 4000000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      for (const employee of sampleEmployees) {
        await kv.set(employee.id, employee)
        console.log('✅ Sample employee created:', employee.nama)
      }
    }
    
  } catch (error) {
    console.log('❌ Error initializing sample users:', error)
  }
}

// Create/Setup Supabase Auth user with doctor/employee data
app.post('/make-server-73417b67/setup-auth-user', async (c) => {
  try {
    console.log('🔧 Setting up auth user...')
    
    const body = await c.req.json()
    const { email, password, name, type } = body // type: 'doctor' or 'employee'
    
    if (!email || !password || !name || !type) {
      return c.json({
        success: false,
        error: 'Email, password, name, and type are required'
      }, 400)
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name },
      email_confirm: true // Auto-confirm email
    })
    
    if (authError) {
      console.log('❌ Auth user creation failed:', authError)
      return c.json({
        success: false,
        error: \`Auth user creation failed: \${authError.message}\`
      }, 400)
    }
    
    console.log('✅ Supabase auth user created:', authData.user.email)
    
    // Create corresponding doctor or employee record
    const userId = \`\${type}_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`
    
    let userData
    if (type === 'doctor') {
      userData = {
        id: userId,
        nama: name,
        email: email,
        spesialisasi: 'Dokter Gigi Umum',
        telepon: '',
        alamat: '',
        status: 'auth',
        shift: 'pagi',
        tarif_per_jam: 100000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } else {
      userData = {
        id: userId,
        nama: name,
        email: email,
        posisi: 'Staff',
        telepon: '',
        alamat: '',
        status: 'auth',
        gaji_pokok: 3500000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    await kv.set(userId, userData)
    console.log(\`✅ \${type} record created:\`, userData.nama)
    
    return c.json({
      success: true,
      message: \`User \${name} berhasil dibuat sebagai \${type}\`,
      authUser: authData.user,
      userData: userData
    })
    
  } catch (error) {
    console.log('❌ Error setting up auth user:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})
`

export default verifyUserEndpoint