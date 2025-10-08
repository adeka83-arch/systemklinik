import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'

const app = new Hono()

// Ultra-permissive CORS for all origins
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}))

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
    hasAuth: !!authHeader
  })
})

// =============== BASIC DEBUG ===============
app.get('/make-server-73417b67/debug', async (c) => {
  const timestamp = new Date().toISOString()
  console.log('🔍 Debug called at:', timestamp)
  
  try {
    const authHeader = c.req.header('Authorization')
    console.log('🔑 Auth header present:', !!authHeader)
    
    const envCheck = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Set' : 'Missing',
      timestamp: timestamp,
      hasAuthHeader: !!authHeader
    }
    
    console.log('📊 Environment check:', envCheck)
    
    return c.json({
      success: true,
      message: 'Debug endpoint working!',
      environment: envCheck,
      server: 'Complete dental clinic system'
    })
    
  } catch (error) {
    console.log('💥 Debug error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
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

// =============== DOCTORS ENDPOINTS ===============
app.get('/make-server-73417b67/doctors', async (c) => {
  console.log('👨‍⚕️ Doctors endpoint called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const doctors = await kv.getByPrefix('dokter_')
    
    console.log(`📊 Found ${doctors.length} doctors in database`)
    
    const transformedDoctors = doctors
      .filter(doctor => doctor.status === 'aktif')
      .map(doctor => ({
        id: doctor.id,
        name: doctor.nama || doctor.name || 'Unknown Doctor',
        specialization: doctor.spesialisasi || 'Dokter Gigi Umum',
        shifts: ['09:00-15:00', '18:00-20:00'],
        email: doctor.email,
        phone: doctor.telepon || '',
        address: doctor.alamat || '',
        status: doctor.status,
        created_at: doctor.created_at
      }))
    
    console.log(`✅ Returning ${transformedDoctors.length} active doctors`)
    
    return c.json({
      success: true,
      doctors: transformedDoctors
    })
    
  } catch (error) {
    console.log('💥 Error fetching doctors:', error)
    return c.json({
      success: false,
      error: error.message,
      doctors: []
    }, 500)
  }
})

// =============== PATIENTS ENDPOINTS ===============
app.get('/make-server-73417b67/patients', async (c) => {
  console.log('👥 Patients endpoint called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const patients = await kv.getByPrefix('patient_')
    
    console.log(`📊 Found ${patients.length} patients in database`)
    
    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.nama || patient.name || 'Unknown Patient',
      email: patient.email || '',
      phone: patient.telepon || patient.phone || '',
      address: patient.alamat || patient.address || '',
      birthDate: patient.tanggal_lahir || patient.birthDate || '',
      gender: patient.jenis_kelamin || patient.gender || '',
      medicalRecordNumber: patient.no_rm || patient.medicalRecordNumber || '',
      createdAt: patient.created_at || patient.createdAt || new Date().toISOString(),
      status: patient.status || 'aktif'
    }))
    
    console.log(`✅ Returning ${transformedPatients.length} patients`)
    
    return c.json({
      success: true,
      patients: transformedPatients
    })
    
  } catch (error) {
    console.log('💥 Error fetching patients:', error)
    return c.json({
      success: false,
      error: error.message,
      patients: []
    }, 500)
  }
})

// =============== EMPLOYEES ENDPOINTS ===============
app.get('/make-server-73417b67/employees', async (c) => {
  console.log('👥 Employees endpoint called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const employees = await kv.getByPrefix('karyawan_')
    
    console.log(`📊 Found ${employees.length} employees in database`)
    
    const transformedEmployees = employees
      .filter(employee => employee.status === 'aktif')
      .map(employee => ({
        id: employee.id,
        name: employee.nama || employee.name || 'Unknown Employee',
        position: employee.posisi || employee.position || 'Staff',
        email: employee.email,
        phone: employee.telepon || employee.phone || '',
        joinDate: employee.created_at || new Date().toISOString(),
        status: employee.status === 'aktif' ? 'active' : 'inactive',
        authUserId: employee.auth_user_id,
        hasLoginAccess: !!employee.auth_user_id,
        role: 'karyawan',
        isActive: employee.status === 'aktif',
        createdAt: employee.created_at || new Date().toISOString()
      }))
    
    console.log(`✅ Returning ${transformedEmployees.length} active employees`)
    
    return c.json({
      success: true,
      employees: transformedEmployees
    })
    
  } catch (error) {
    console.log('💥 Error fetching employees:', error)
    return c.json({
      success: false,
      error: error.message,
      employees: []
    }, 500)
  }
})

// =============== ATTENDANCE ENDPOINTS ===============
app.get('/make-server-73417b67/attendance', async (c) => {
  console.log('📅 Attendance endpoint called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const attendance = await kv.getByPrefix('attendance_')
    
    console.log(`📊 Found ${attendance.length} attendance records`)
    
    return c.json({
      success: true,
      attendance: attendance || []
    })
    
  } catch (error) {
    console.log('💥 Error fetching attendance:', error)
    return c.json({
      success: false,
      error: error.message,
      attendance: []
    }, 500)
  }
})

app.post('/make-server-73417b67/attendance', async (c) => {
  console.log('📝 Create attendance called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    const { doctorId, shift, type, date, time } = body
    
    console.log('📋 Attendance data:', { doctorId, shift, type, date })
    
    if (!doctorId || !shift || !type || !date) {
      return c.json({
        success: false,
        error: 'Missing required fields: doctorId, shift, type, date'
      }, 400)
    }
    
    const attendanceRecord = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      shift: shift,
      type: type,
      date: date,
      time: time || new Date().toLocaleTimeString('id-ID'),
      created_at: new Date().toISOString()
    }
    
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Attendance saved with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating attendance:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== SITTING FEES ENDPOINTS ===============
app.get('/make-server-73417b67/sitting-fees', async (c) => {
  console.log('💰 Sitting fees endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const sittingFees = await kv.getByPrefix('sitting_fee_')
    
    console.log(`📊 Found ${sittingFees.length} sitting fee records`)
    
    return c.json({
      success: true,
      sittingFees: sittingFees || []
    })
    
  } catch (error) {
    console.log('💥 Error fetching sitting fees:', error)
    return c.json({
      success: false,
      error: error.message,
      sittingFees: []
    }, 500)
  }
})

app.post('/make-server-73417b67/sitting-fees', async (c) => {
  console.log('💰 Create sitting fee called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    const { doctorId, doctorName, shift, amount, date } = body
    
    console.log('📋 Sitting fee data:', { doctorId, doctorName, shift, amount, date })
    
    if (!doctorId || !shift || !amount || !date) {
      return c.json({
        success: false,
        error: 'Missing required fields: doctorId, shift, amount, date'
      }, 400)
    }
    
    const sittingFeeRecord = {
      id: `sitting_fee_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      doctorName: doctorName,
      shift: shift,
      amount: parseFloat(amount),
      date: date,
      created_at: new Date().toISOString()
    }
    
    await kv.set(sittingFeeRecord.id, sittingFeeRecord)
    console.log('✅ Sitting fee saved with ID:', sittingFeeRecord.id)
    
    return c.json({
      success: true,
      message: 'Sitting fee recorded successfully',
      sittingFee: sittingFeeRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating sitting fee:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== DOCTOR SITTING FEE SETTINGS ===============
app.get('/make-server-73417b67/doctor-sitting-fee/:doctorId/:shift', async (c) => {
  console.log('⚙️ Doctor sitting fee settings called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const doctorId = c.req.param('doctorId')
    const shift = decodeURIComponent(c.req.param('shift'))
    
    console.log('🔍 Looking for setting:', { doctorId, shift })
    
    const settings = await kv.getByPrefix('doctor_sitting_fee_setting_')
    const setting = settings.find(s => 
      s.doctorId === doctorId && 
      s.shift === shift
    )
    
    if (setting) {
      console.log('✅ Found setting:', setting.amount)
      return c.json({
        success: true,
        setting: setting
      })
    } else {
      console.log('❌ No setting found, using default')
      return c.json({
        success: true,
        setting: {
          doctorId: doctorId,
          shift: shift,
          amount: 50000
        }
      })
    }
    
  } catch (error) {
    console.log('💥 Error fetching doctor sitting fee setting:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== OTHER ENDPOINTS ===============
app.get('/make-server-73417b67/control-schedules', async (c) => {
  console.log('📅 Control schedules endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const schedules = await kv.getByPrefix('control_schedule_')
    
    console.log(`📊 Found ${schedules.length} control schedules`)
    
    return c.json({
      success: true,
      schedules: schedules || []
    })
    
  } catch (error) {
    console.log('💥 Error fetching control schedules:', error)
    return c.json({
      success: false,
      error: error.message,
      schedules: []
    }, 500)
  }
})

app.get('/make-server-73417b67/medical-records', async (c) => {
  console.log('📋 Medical records endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const records = await kv.getByPrefix('medical_record_')
    
    console.log(`📊 Found ${records.length} medical records`)
    
    return c.json({
      success: true,
      records: records || []
    })
    
  } catch (error) {
    console.log('💥 Error fetching medical records:', error)
    return c.json({
      success: false,
      error: error.message,
      records: []
    }, 500)
  }
})

// =============== SAMPLE DATA INITIALIZATION ===============
app.post('/make-server-73417b67/init-sample-data', async (c) => {
  console.log('🎲 Initialize sample data called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    
    // Check if data already exists
    const existingDoctors = await kv.getByPrefix('dokter_')
    const existingPatients = await kv.getByPrefix('patient_')
    const existingEmployees = await kv.getByPrefix('karyawan_')
    
    if (existingDoctors.length > 0 || existingPatients.length > 0 || existingEmployees.length > 0) {
      return c.json({
        success: true,
        message: 'Sample data already exists',
        stats: {
          doctors: existingDoctors.length,
          patients: existingPatients.length,
          employees: existingEmployees.length
        }
      })
    }
    
    console.log('📝 Creating sample data...')
    
    // Create sample doctors
    const sampleDoctors = [
      {
        id: `dokter_${Date.now()}_1`,
        nama: 'drg. Falasifah',
        email: 'lalafalasifah@gmail.com',
        spesialisasi: 'Dokter Gigi Umum',
        telepon: '0812-3456-7890',
        alamat: 'Depok, Jawa Barat',
        status: 'aktif',
        shift: 'pagi',
        tarif_per_jam: 150000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      },
      {
        id: `dokter_${Date.now()}_2`,
        nama: 'drg. Ahmad Santoso',
        email: 'ahmad.santoso@clinic.com',
        spesialisasi: 'Ortodonti',
        telepon: '0812-9876-5432',
        alamat: 'Jakarta, DKI Jakarta',
        status: 'aktif',
        shift: 'sore',
        tarif_per_jam: 200000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      },
      {
        id: `dokter_${Date.now()}_3`,
        nama: 'drg. Maria Dewi',
        email: 'maria.dewi@clinic.com',
        spesialisasi: 'Bedah Mulut',
        telepon: '0813-1111-2222',
        alamat: 'Bogor, Jawa Barat',
        status: 'aktif',
        shift: 'pagi',
        tarif_per_jam: 175000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      }
    ]
    
    // Create sample patients
    const samplePatients = [
      {
        id: `patient_${Date.now()}_1`,
        nama: 'John Doe',
        email: 'john.doe@email.com',
        telepon: '0812-1234-5678',
        alamat: 'Jl. Merdeka No. 123, Jakarta',
        tanggal_lahir: '1990-05-15',
        jenis_kelamin: 'Laki-laki',
        no_rm: 'RM001',
        status: 'aktif',
        created_at: new Date().toISOString()
      },
      {
        id: `patient_${Date.now()}_2`,
        nama: 'Jane Smith',
        email: 'jane.smith@email.com',
        telepon: '0813-9876-5432',
        alamat: 'Jl. Sudirman No. 456, Depok',
        tanggal_lahir: '1985-08-22',
        jenis_kelamin: 'Perempuan',
        no_rm: 'RM002',
        status: 'aktif',
        created_at: new Date().toISOString()
      },
      {
        id: `patient_${Date.now()}_3`,
        nama: 'Budi Santoso',
        email: 'budi.santoso@email.com',
        telepon: '0814-5555-6666',
        alamat: 'Jl. Kebon Jeruk No. 789, Bogor',
        tanggal_lahir: '1992-12-10',
        jenis_kelamin: 'Laki-laki',
        no_rm: 'RM003',
        status: 'aktif',
        created_at: new Date().toISOString()
      },
      {
        id: `patient_${Date.now()}_4`,
        nama: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@email.com',
        telepon: '0815-7777-8888',
        alamat: 'Jl. Diponegoro No. 321, Bekasi',
        tanggal_lahir: '1995-03-18',
        jenis_kelamin: 'Perempuan',
        no_rm: 'RM004',
        status: 'aktif',
        created_at: new Date().toISOString()
      }
    ]
    
    // Create sample employees
    const sampleEmployees = [
      {
        id: `karyawan_${Date.now()}_1`,
        nama: 'Siti Nurjanah',
        posisi: 'Resepsionis',
        email: 'siti.nurjanah@clinic.com',
        telepon: '0812-1111-2222',
        status: 'aktif',
        gaji_pokok: 3000000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      },
      {
        id: `karyawan_${Date.now()}_2`,
        nama: 'Andi Prasetyo',
        posisi: 'Perawat Dental',
        email: 'andi.prasetyo@clinic.com',
        telepon: '0813-3333-4444',
        status: 'aktif',
        gaji_pokok: 3500000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      },
      {
        id: `karyawan_${Date.now()}_3`,
        nama: 'Maya Sari',
        posisi: 'Admin Keuangan',
        email: 'maya.sari@clinic.com',
        telepon: '0814-5555-6666',
        status: 'aktif',
        gaji_pokok: 4000000,
        created_at: new Date().toISOString(),
        auth_user_id: null
      }
    ]
    
    // Save sample doctors
    for (const doctor of sampleDoctors) {
      await kv.set(doctor.id, doctor)
      console.log('👨‍⚕️ Created doctor:', doctor.nama)
    }
    
    // Save sample patients  
    for (const patient of samplePatients) {
      await kv.set(patient.id, patient)
      console.log('👥 Created patient:', patient.nama)
    }
    
    // Save sample employees
    for (const employee of sampleEmployees) {
      await kv.set(employee.id, employee)
      console.log('👥 Created employee:', employee.nama)
    }
    
    console.log('✅ Sample data created successfully')
    
    return c.json({
      success: true,
      message: 'Sample data initialized successfully',
      created: {
        doctors: sampleDoctors.length,
        patients: samplePatients.length,
        employees: sampleEmployees.length
      }
    })
    
  } catch (error) {
    console.log('💥 Error creating sample data:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== CATCH ALL ===============
app.all('*', (c) => {
  console.log('❓ Unknown request:', c.req.method, c.req.path)
  
  const availableEndpoints = [
    '/make-server-73417b67/health',
    '/make-server-73417b67/debug', 
    '/make-server-73417b67/register',
    '/make-server-73417b67/verify-user',
    '/make-server-73417b67/clinic-settings',
    '/make-server-73417b67/doctors',
    '/make-server-73417b67/patients',
    '/make-server-73417b67/employees',
    '/make-server-73417b67/attendance',
    '/make-server-73417b67/sitting-fees',
    '/make-server-73417b67/doctor-sitting-fee/:doctorId/:shift',
    '/make-server-73417b67/control-schedules',
    '/make-server-73417b67/medical-records',
    '/make-server-73417b67/init-sample-data'
  ]
  
  return c.json({
    success: false,
    error: 'Endpoint not found',
    path: c.req.path,
    method: c.req.method,
    availableEndpoints: availableEndpoints
  }, 404)
})

// =============== START SERVER ===============
console.log('🚀 Falasifah Dental Clinic - Complete Server Starting...')
console.log('📍 Available endpoints:')
console.log('  ✅ /health - Server health check')
console.log('  ✅ /debug - Debug information')
console.log('  ✅ /register - User registration')
console.log('  ✅ /verify-user - User verification')
console.log('  ✅ /clinic-settings - Clinic configuration')
console.log('  ✅ /doctors - Doctor management')
console.log('  ✅ /patients - Patient management')
console.log('  ✅ /employees - Employee management')
console.log('  ✅ /attendance - Attendance management')
console.log('  ✅ /sitting-fees - Sitting fee management')
console.log('  ✅ /control-schedules - Schedule management')
console.log('  ✅ /medical-records - Medical records')
console.log('  ✅ /init-sample-data - Sample data initialization')
console.log('📡 Server ready to handle all requests!')

Deno.serve(app.fetch)