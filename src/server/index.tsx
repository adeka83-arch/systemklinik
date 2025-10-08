import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { addSittingFeesEndpoints, addSalesEndpoints, addStockOpnameEndpoints, addExpensesEndpoints, addEmployeesEndpoints, addDentalMaterialsEndpoints, addDentalUsagesEndpoints } from './missing_endpoints.tsx'
import { addPromoImagesEndpoints, addPromoHistoryEndpoints, addPatientsEndpoints, addVouchersEndpoints, createPromoRoutes } from './promo_endpoints.tsx'
import { salariesRoutes } from './salaries_endpoints.tsx'
import { createFeeSettingsRoutes } from './fee_settings_endpoints.tsx'

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

// Add salaries endpoints
console.log('💰 Adding salaries endpoints...')
try {
  salariesRoutes(app)
  console.log('✅ Salaries endpoints added successfully')
} catch (error) {
  console.error('❌ Error adding salaries endpoints:', error)
}

// Add promo endpoints
console.log('📦 Adding promo endpoints...')
try {
  addPromoImagesEndpoints(app)
  addPromoHistoryEndpoints(app)
  addPatientsEndpoints(app)
  addVouchersEndpoints(app)
  console.log('✅ Promo endpoints added successfully with vouchers')
} catch (error) {
  console.error('❌ Error adding promo endpoints:', error)
}

// Add fee settings endpoints
console.log('💰 Adding fee settings endpoints...')
try {
  const { createClient } = await import('npm:@supabase/supabase-js@2')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  createFeeSettingsRoutes(app, supabase)
  console.log('✅ Fee settings endpoints added successfully')
  
  // Add advanced promo/voucher routes with validation and usage tracking
  console.log('🎫 Adding advanced voucher routes...')
  createPromoRoutes(app, supabase)
  console.log('✅ Advanced voucher routes added successfully')
} catch (error) {
  console.error('❌ Error adding fee settings endpoints:', error)
}

// =============== TREATMENTS ENDPOINTS ===============
console.log('🦷 Adding treatments endpoints...')

// Get treatments
app.get('/make-server-73417b67/treatments', async (c) => {
  console.log('🦷 Treatments GET endpoint called')
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const treatments = await kv.getByPrefix('treatment_')
    
    console.log(`📊 Found ${treatments.length} treatments in database`)
    
    // Sort treatments by date (newest first)
    const sortedTreatments = treatments.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || a.created_at || new Date())
      const dateB = new Date(b.date || b.createdAt || b.created_at || new Date())
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`✅ Returning ${sortedTreatments.length} treatments`)
    
    return c.json({
      success: true,
      treatments: sortedTreatments
    })
    
  } catch (error) {
    console.log('💥 Error fetching treatments:', error)
    return c.json({
      success: false,
      error: error.message,
      treatments: []
    }, 500)
  }
})

// Create treatment
app.post('/make-server-73417b67/treatments', async (c) => {
  console.log('🦷 Create treatment called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Treatment data received:', body)
    
    const treatmentRecord = {
      id: `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...body,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save treatment to database...')
    await kv.set(treatmentRecord.id, treatmentRecord)
    console.log('✅ Treatment saved successfully with ID:', treatmentRecord.id)
    
    return c.json({
      success: true,
      message: 'Tindakan berhasil ditambahkan',
      treatment: treatmentRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating treatment:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan tindakan: ${error.message}`
    }, 500)
  }
})

// Update treatment
app.put('/make-server-73417b67/treatments/:id', async (c) => {
  console.log('🦷 Update treatment called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const treatmentId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating treatment ID:', treatmentId)
    
    // Get existing treatment
    const existingTreatment = await kv.get(treatmentId)
    
    if (!existingTreatment) {
      return c.json({
        success: false,
        error: 'Tindakan tidak ditemukan'
      }, 404)
    }
    
    // Update treatment with new data
    const updatedTreatment = {
      ...existingTreatment,
      ...body,
      id: treatmentId,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save updated treatment
    await kv.set(treatmentId, updatedTreatment)
    console.log('✅ Treatment updated:', treatmentId)
    
    return c.json({
      success: true,
      message: 'Tindakan berhasil diperbarui',
      treatment: updatedTreatment
    })
    
  } catch (error) {
    console.log('💥 Error updating treatment:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui tindakan: ${error.message}`
    }, 500)
  }
})

// Delete treatment
app.delete('/make-server-73417b67/treatments/:id', async (c) => {
  console.log('🦷 Delete treatment called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const treatmentId = c.req.param('id')
    
    console.log('🗑️ Deleting treatment ID:', treatmentId)
    
    // Check if treatment exists
    const existingTreatment = await kv.get(treatmentId)
    
    if (!existingTreatment) {
      return c.json({
        success: false,
        error: 'Tindakan tidak ditemukan'
      }, 404)
    }
    
    // Delete treatment
    await kv.del(treatmentId)
    console.log('✅ Treatment deleted:', treatmentId)
    
    return c.json({
      success: true,
      message: 'Tindakan berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting treatment:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus tindakan: ${error.message}`
    }, 500)
  }
})

console.log('✅ Treatments endpoints added successfully')

// =============== MEDICAL RECORDS ENDPOINTS ===============
console.log('📋 Adding medical records endpoints...')

// Get medical records
app.get('/make-server-73417b67/medical-records', async (c) => {
  console.log('📋 Medical Records GET endpoint called')
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const medicalRecords = await kv.getByPrefix('medical_record_')
    
    console.log(`📊 Found ${medicalRecords.length} medical records in database`)
    
    // Sort by date (newest first)
    const sortedRecords = medicalRecords.sort((a, b) => {
      const dateA = new Date(a.visitDate || a.created_at || new Date())
      const dateB = new Date(b.visitDate || b.created_at || new Date())
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`✅ Returning ${sortedRecords.length} medical records`)
    
    return c.json({
      success: true,
      records: sortedRecords
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

// Create medical record
app.post('/make-server-73417b67/medical-records', async (c) => {
  console.log('📋 Create medical record called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Medical record data received:', body)
    
    // Validate required fields
    if (!body.patientId || !body.doctorId || !body.visitDate || !body.complaint || !body.diagnosis || !body.treatment) {
      return c.json({
        error: 'Field wajib: patientId, doctorId, visitDate, complaint, diagnosis, treatment'
      }, 400)
    }
    
    const medicalRecord = {
      id: `medical_record_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      patientId: body.patientId,
      patientName: body.patientName || '',
      medicalRecordNumber: body.medicalRecordNumber || '',
      doctorId: body.doctorId,
      doctorName: body.doctorName || '',
      visitDate: body.visitDate,
      complaint: body.complaint,
      examination: body.examination || '',
      diagnosis: body.diagnosis,
      treatment: body.treatment,
      prescription: body.prescription || '',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save medical record to database...')
    await kv.set(medicalRecord.id, medicalRecord)
    console.log('✅ Medical record saved successfully with ID:', medicalRecord.id)
    
    return c.json({
      success: true,
      message: 'Rekam medis berhasil ditambahkan',
      record: medicalRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating medical record:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan rekam medis: ${error.message}`
    }, 500)
  }
})

// Update medical record
app.put('/make-server-73417b67/medical-records/:id', async (c) => {
  console.log('📋 Update medical record called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const recordId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating medical record ID:', recordId)
    
    // Get existing record
    const existingRecord = await kv.get(recordId)
    
    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Rekam medis tidak ditemukan'
      }, 404)
    }
    
    // Update record with new data
    const updatedRecord = {
      ...existingRecord,
      ...body,
      id: recordId,
      updated_at: new Date().toISOString()
    }
    
    // Save updated record
    await kv.set(recordId, updatedRecord)
    console.log('✅ Medical record updated:', recordId)
    
    return c.json({
      success: true,
      message: 'Rekam medis berhasil diperbarui',
      record: updatedRecord
    })
    
  } catch (error) {
    console.log('💥 Error updating medical record:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui rekam medis: ${error.message}`
    }, 500)
  }
})

// Delete medical record
app.delete('/make-server-73417b67/medical-records/:id', async (c) => {
  console.log('📋 Delete medical record called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const recordId = c.req.param('id')
    
    console.log('🗑️ Deleting medical record ID:', recordId)
    
    // Check if record exists
    const existingRecord = await kv.get(recordId)
    
    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Rekam medis tidak ditemukan'
      }, 404)
    }
    
    // Delete record
    await kv.del(recordId)
    console.log('✅ Medical record deleted:', recordId)
    
    return c.json({
      success: true,
      message: 'Rekam medis berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting medical record:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus rekam medis: ${error.message}`
    }, 500)
  }
})

// =============== X-RAY ENDPOINTS ===============
console.log('📸 Adding X-ray endpoints...')

// Get X-ray images
app.get('/make-server-73417b67/xray-images', async (c) => {
  console.log('📸 X-ray images GET endpoint called')
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const patientId = c.req.query('patientId')
    
    let xrayImages = await kv.getByPrefix('xray_image_')
    
    // Filter by patient if patientId is provided
    if (patientId) {
      xrayImages = xrayImages.filter(image => image.patientId === patientId)
    }
    
    console.log(`📊 Found ${xrayImages.length} X-ray images in database`)
    
    // Sort by upload date (newest first)
    const sortedImages = xrayImages.sort((a, b) => {
      const dateA = new Date(a.uploadDate || a.created_at || new Date())
      const dateB = new Date(b.uploadDate || b.created_at || new Date())
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`✅ Returning ${sortedImages.length} X-ray images`)
    
    return c.json({
      success: true,
      images: sortedImages
    })
    
  } catch (error) {
    console.log('💥 Error fetching X-ray images:', error)
    return c.json({
      success: false,
      error: error.message,
      images: []
    }, 500)
  }
})

// Upload X-ray (placeholder - for actual file upload implementation)
app.post('/make-server-73417b67/xray-upload', async (c) => {
  console.log('📸 X-ray upload called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // For now, return a placeholder response
    // In a real implementation, this would handle file upload to Supabase Storage
    return c.json({
      success: false,
      error: 'X-ray upload feature belum tersedia. Fitur ini memerlukan konfigurasi Supabase Storage yang lebih lanjut.'
    }, 501)
    
  } catch (error) {
    console.log('💥 Error uploading X-ray:', error)
    return c.json({
      success: false,
      error: `Gagal upload X-ray: ${error.message}`
    }, 500)
  }
})

// Delete X-ray image
app.delete('/make-server-73417b67/xray-images/:id', async (c) => {
  console.log('📸 Delete X-ray image called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const imageId = c.req.param('id')
    
    console.log('🗑️ Deleting X-ray image ID:', imageId)
    
    // Check if image exists
    const existingImage = await kv.get(imageId)
    
    if (!existingImage) {
      return c.json({
        success: false,
        error: 'Gambar X-ray tidak ditemukan'
      }, 404)
    }
    
    // Delete image record
    await kv.del(imageId)
    console.log('✅ X-ray image deleted:', imageId)
    
    return c.json({
      success: true,
      message: 'Gambar X-ray berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting X-ray image:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus gambar X-ray: ${error.message}`
    }, 500)
  }
})

console.log('✅ Medical records and X-ray endpoints added successfully')

// =============== BATCH UPDATE MEDICAL RECORDS ===============
app.post('/make-server-73417b67/batch-update-medical-records', async (c) => {
  console.log('🔄 Batch update medical records called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const patients = await kv.getByPrefix('patient_')
    
    const generateMedicalRecordNumber = (index: number) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const sequence = String(index + 1).padStart(3, '0')
      return `RM-${year}${month}${day}-${sequence}`
    }
    
    let updatedCount = 0
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i]
      
      // Check if patient doesn't have medical record number
      if (!patient.nomorRekamMedis && !patient.medicalRecordNumber) {
        const medicalRecordNumber = generateMedicalRecordNumber(i)
        
        const updatedPatient = {
          ...patient,
          nomorRekamMedis: medicalRecordNumber,
          medicalRecordNumber: medicalRecordNumber,
          updated_at: new Date().toISOString()
        }
        
        await kv.set(patient.id, updatedPatient)
        updatedCount++
        
        console.log(`✅ Updated patient ${patient.nama || patient.name} with RM: ${medicalRecordNumber}`)
      }
    }
    
    console.log(`🎉 Batch update completed. Updated ${updatedCount} patients`)
    
    return c.json({
      success: true,
      message: `Berhasil generate ${updatedCount} nomor rekam medis`,
      updatedCount: updatedCount,
      totalPatients: patients.length
    })
    
  } catch (error) {
    console.log('💥 Error in batch update:', error)
    return c.json({
      success: false,
      error: `Gagal batch update: ${error.message}`
    }, 500)
  }
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

// =============== MANUAL VOUCHERS ENDPOINT FIX ===============
// Add a health check endpoint for vouchers
app.get('/make-server-73417b67/health/vouchers', async (c) => {
  console.log('🩺 Vouchers health check called')
  return c.json({
    success: true,
    message: 'Vouchers endpoint is healthy',
    timestamp: new Date().toISOString(),
    endpoint: '/make-server-73417b67/vouchers'
  })
})

console.log('🎫 Registering manual vouchers endpoint...')

app.get('/make-server-73417b67/vouchers', async (c) => {
  console.log('🎫 Manual Vouchers GET endpoint called at:', new Date().toISOString())
  console.log('🎫 Request headers:', c.req.header())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const vouchers = await kv.getByPrefix('voucher_')
    
    console.log(`📊 Found ${vouchers.length} vouchers in database`)
    console.log('📝 Sample voucher data:', vouchers.length > 0 ? vouchers[0] : 'No vouchers found')
    
    // Transform vouchers data and filter out corrupt ones
    const validVouchers = vouchers.filter(voucher => {
      // Check if voucher has all required fields and valid data
      const hasValidCode = voucher.code && voucher.code !== 'CORRUPT' && voucher.code.trim() !== ''
      const hasValidTitle = voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && voucher.title.trim() !== ''
      const hasValidDiscountValue = typeof voucher.discountValue === 'number' && voucher.discountValue >= 0
      const hasValidExpiryDate = voucher.expiryDate && voucher.expiryDate !== 'Invalid Date' && !isNaN(new Date(voucher.expiryDate).getTime())
      
      return hasValidCode && hasValidTitle && hasValidDiscountValue && hasValidExpiryDate
    })
    
    // Transform valid vouchers
    const transformedVouchers = validVouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description || voucher.deskripsi || '',
      discountType: voucher.discountType || voucher.discount_type || 'percentage',
      discountValue: voucher.discountValue || voucher.discount_value || 0,
      expiryDate: voucher.expiryDate || voucher.expiry_date || '',
      usageLimit: voucher.usageLimit || voucher.usage_limit || 0,
      usageCount: voucher.usageCount || voucher.usage_count || voucher.currentUsage || 0,
      isActive: voucher.isActive !== undefined ? voucher.isActive : voucher.is_active !== undefined ? voucher.is_active : true,
      createdDate: voucher.createdDate || voucher.created_date || voucher.created_at || new Date().toISOString(),
      createdBy: voucher.createdBy || voucher.created_by || 'system',
      minPurchase: voucher.minPurchase || voucher.min_purchase || voucher.minAmount || 0,
      created_at: voucher.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedVouchers.length} valid vouchers (filtered out ${vouchers.length - transformedVouchers.length} corrupt entries)`)
    
    return c.json({
      success: true,
      vouchers: transformedVouchers
    })
    
  } catch (error) {
    console.log('💥 Error fetching vouchers:', error)
    return c.json({
      success: false,
      error: error.message,
      vouchers: []
    }, 500)
  }
})

// Create voucher
app.post('/make-server-73417b67/vouchers', async (c) => {
  console.log('🎫 Create voucher called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Voucher data received:', body)
    
    const { 
      code, 
      title, 
      description, 
      discountType, 
      discountValue, 
      expiryDate, 
      usageLimit, 
      minPurchase 
    } = body
    
    // Validate required fields
    if (!code || !title || !discountType || discountValue === undefined || discountValue === null || !expiryDate) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Kode voucher, judul, jenis diskon, nilai diskon, dan tanggal kadaluarsa wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for voucher')
    
    // Create voucher record
    const voucherRecord = {
      id: `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description || '',
      discountType: discountType,
      discountValue: Number(discountValue),
      expiryDate: expiryDate,
      usageLimit: Number(usageLimit) || 0,
      usageCount: 0,
      isActive: true,
      minPurchase: Number(minPurchase) || 0,
      createdDate: new Date().toISOString(),
      createdBy: user.email || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save voucher to database...')
    await kv.set(voucherRecord.id, voucherRecord)
    console.log('✅ Voucher saved successfully with ID:', voucherRecord.id)
    
    return c.json({
      success: true,
      message: 'Voucher berhasil dibuat',
      voucher: voucherRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating voucher:', error)
    return c.json({
      success: false,
      error: `Gagal membuat voucher: ${error.message}`
    }, 500)
  }
})

// Update voucher
app.put('/make-server-73417b67/vouchers/:id', async (c) => {
  console.log('🎫 Update voucher called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const voucherId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('🎫 Updating voucher ID:', voucherId)
    
    // Get existing voucher
    const existingVoucher = await kv.get(voucherId)
    
    if (!existingVoucher) {
      return c.json({
        success: false,
        error: 'Voucher tidak ditemukan'
      }, 404)
    }
    
    // Update voucher with new data
    const updatedVoucher = {
      ...existingVoucher,
      ...body,
      id: voucherId,
      updated_at: new Date().toISOString()
    }
    
    // Save updated voucher
    await kv.set(voucherId, updatedVoucher)
    console.log('✅ Voucher updated:', voucherId)
    
    return c.json({
      success: true,
      message: 'Voucher berhasil diperbarui',
      voucher: updatedVoucher
    })
    
  } catch (error) {
    console.log('💥 Error updating voucher:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui voucher: ${error.message}`
    }, 500)
  }
})

// Delete voucher
app.delete('/make-server-73417b67/vouchers/:id', async (c) => {
  console.log('🎫 Delete voucher called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const voucherId = c.req.param('id')
    
    console.log('🗑️ Deleting voucher ID:', voucherId)
    
    // Check if voucher exists
    const existingVoucher = await kv.get(voucherId)
    
    if (!existingVoucher) {
      return c.json({
        success: false,
        error: 'Voucher tidak ditemukan'
      }, 404)
    }
    
    // Delete voucher
    await kv.del(voucherId)
    console.log('✅ Voucher deleted:', voucherId)
    
    return c.json({
      success: true,
      message: 'Voucher berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting voucher:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus voucher: ${error.message}`
    }, 500)
  }
})

// =============== DEBUG PATIENTS RAW DATA ===============
app.get('/make-server-73417b67/debug-patients-raw', async (c) => {
  console.log('🔍 Debug Patients Raw Data endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const rawPatients = await kv.getByPrefix('patient_')
    
    console.log(`🔍 Found ${rawPatients.length} patients with prefix 'patient_'`)
    
    // Show first few patients with all their raw fields
    const samplePatients = rawPatients.slice(0, 5).map(patient => {
      console.log(`Patient ID: ${patient.id}`)
      console.log('Raw patient data:', JSON.stringify(patient, null, 2))
      return {
        id: patient.id,
        allFields: Object.keys(patient),
        nama: patient.nama,
        name: patient.name,
        telepon: patient.telepon,
        phone: patient.phone,
        no_rm: patient.no_rm,
        nomor_rm: patient.nomor_rm,
        tanggal_lahir: patient.tanggal_lahir,
        jenis_kelamin: patient.jenis_kelamin,
        status: patient.status,
        created_at: patient.created_at
      }
    })
    
    return c.json({
      success: true,
      message: 'Raw patients debug data',
      totalPatients: rawPatients.length,
      samplePatients: samplePatients,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.log('💥 Error in debug patients raw:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// =============== DOCTORS ENDPOINTS ===============
app.get('/make-server-73417b67/doctors', async (c) => {
  console.log('👨‍⚕️ Doctors GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const doctors = await kv.getByPrefix('dokter_')
    
    console.log(`📊 Found ${doctors.length} doctors in database`)
    
    // Transform doctors data for the new interface
    const transformedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.nama || doctor.name || 'Unknown Doctor',
      specialization: doctor.spesialisasi || doctor.specialization || 'Dokter Gigi Umum',
      phone: doctor.telepon || doctor.phone || '',
      email: doctor.email || '',
      licenseNumber: doctor.no_sip || doctor.lisensi || doctor.license || doctor.licenseNumber || '',
      shifts: doctor.shifts || doctor.shift ? [doctor.shift || doctor.shifts].flat() : [],
      status: doctor.status || 'active',
      isActive: doctor.isActive !== false && doctor.status !== 'nonaktif',
      statusUpdatedAt: doctor.statusUpdatedAt || doctor.status_updated_at,
      statusUpdatedBy: doctor.statusUpdatedBy || doctor.status_updated_by,
      created_at: doctor.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedDoctors.length} doctors`)
    
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

// Get active doctors only
app.get('/make-server-73417b67/doctors/active', async (c) => {
  console.log('👨‍⚕️ Active Doctors GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const allDoctors = await kv.getByPrefix('dokter_')
    
    console.log(`📊 Found ${allDoctors.length} total doctors in database`)
    
    // Filter only active doctors
    const activeDoctors = allDoctors.filter(doctor => 
      doctor.isActive !== false && doctor.status !== 'nonaktif' && doctor.status !== 'inactive'
    )
    
    // Transform doctors data for the new interface
    const transformedDoctors = activeDoctors.map(doctor => ({
      id: doctor.id,
      name: doctor.nama || doctor.name || 'Unknown Doctor',
      specialization: doctor.spesialisasi || doctor.specialization || 'Dokter Gigi Umum',
      phone: doctor.telepon || doctor.phone || '',
      email: doctor.email || '',
      licenseNumber: doctor.no_sip || doctor.lisensi || doctor.license || doctor.licenseNumber || '',
      shifts: doctor.shifts || doctor.shift ? [doctor.shift || doctor.shifts].flat() : [],
      status: doctor.status || 'active',
      isActive: doctor.isActive !== false && doctor.status !== 'nonaktif',
      statusUpdatedAt: doctor.statusUpdatedAt || doctor.status_updated_at,
      statusUpdatedBy: doctor.statusUpdatedBy || doctor.status_updated_by,
      created_at: doctor.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedDoctors.length} active doctors (filtered from ${allDoctors.length} total)`)
    
    return c.json({
      success: true,
      doctors: transformedDoctors
    })
    
  } catch (error) {
    console.log('💥 Error fetching active doctors:', error)
    return c.json({
      success: false,
      error: error.message,
      doctors: []
    }, 500)
  }
})

app.post('/make-server-73417b67/doctors', async (c) => {
  console.log('👨‍⚕️ Create doctor called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Doctor data received:', body)
    
    const { 
      name, 
      specialization, 
      phone, 
      email, 
      licenseNumber, 
      shifts, 
      status = 'active' 
    } = body
    
    // Validate required fields
    if (!name || !specialization || !phone || !email || !licenseNumber) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        error: 'Nama, spesialisasi, telepon, email, dan nomor SIP wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for doctor')
    
    // Create doctor record
    const doctorRecord = {
      id: `dokter_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      nama: name.trim(),
      name: name.trim(),
      spesialisasi: specialization,
      specialization: specialization,
      telepon: phone,
      phone: phone,
      email: email.trim().toLowerCase(),
      no_sip: licenseNumber,
      lisensi: licenseNumber,
      licenseNumber: licenseNumber,
      shifts: shifts || [],
      shift: shifts && shifts.length > 0 ? shifts[0] : '',
      status: status,
      isActive: status === 'active',
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save doctor to database...')
    await kv.set(doctorRecord.id, doctorRecord)
    console.log('✅ Doctor saved successfully with ID:', doctorRecord.id)
    
    return c.json({
      success: true,
      message: 'Dokter berhasil ditambahkan',
      doctor: doctorRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating doctor:', error)
    return c.json({
      error: `Gagal menyimpan data dokter: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/doctors/:id', async (c) => {
  console.log('👨‍⚕️ Update doctor called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const doctorId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating doctor ID:', doctorId)
    console.log('📋 Update data received:', body)
    
    // Get existing doctor
    const existingDoctors = await kv.getByPrefix('dokter_')
    const existingDoctor = existingDoctors.find(d => d.id === doctorId)
    
    if (!existingDoctor) {
      return c.json({
        error: 'Data dokter tidak ditemukan'
      }, 404)
    }
    
    const { 
      name, 
      specialization, 
      phone, 
      email, 
      licenseNumber, 
      shifts, 
      status 
    } = body
    
    // Update doctor with new data
    const updatedDoctor = {
      ...existingDoctor,
      nama: name || existingDoctor.nama,
      name: name || existingDoctor.name,
      spesialisasi: specialization || existingDoctor.spesialisasi,
      specialization: specialization || existingDoctor.specialization,
      telepon: phone || existingDoctor.telepon,
      phone: phone || existingDoctor.phone,
      email: email ? email.trim().toLowerCase() : existingDoctor.email,
      no_sip: licenseNumber || existingDoctor.no_sip,
      lisensi: licenseNumber || existingDoctor.lisensi,
      licenseNumber: licenseNumber || existingDoctor.licenseNumber,
      shifts: shifts !== undefined ? shifts : existingDoctor.shifts,
      shift: shifts && shifts.length > 0 ? shifts[0] : existingDoctor.shift,
      status: status !== undefined ? status : existingDoctor.status,
      isActive: status !== undefined ? status === 'active' : existingDoctor.isActive,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: user.id,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update doctor...')
    await kv.set(doctorId, updatedDoctor)
    console.log('✅ Doctor updated successfully')
    
    return c.json({
      success: true,
      message: 'Data dokter berhasil diperbarui',
      doctor: updatedDoctor
    })
    
  } catch (error) {
    console.log('💥 Error updating doctor:', error)
    return c.json({
      error: `Gagal memperbarui data dokter: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/doctors/:id', async (c) => {
  console.log('👨‍⚕️ Delete doctor called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const doctorId = c.req.param('id')
    
    console.log('🗑️ Deleting doctor ID:', doctorId)
    
    // Check if doctor exists
    const existingDoctors = await kv.getByPrefix('dokter_')
    const existingDoctor = existingDoctors.find(d => d.id === doctorId)
    
    if (!existingDoctor) {
      return c.json({
        error: 'Data dokter tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(doctorId)
    console.log('✅ Doctor deleted successfully')
    
    return c.json({
      success: true,
      message: 'Data dokter berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting doctor:', error)
    return c.json({
      error: `Gagal menghapus data dokter: ${error.message}`
    }, 500)
  }
})

app.patch('/make-server-73417b67/doctors/:id/status', async (c) => {
  console.log('👨‍⚕️ Update doctor status called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const doctorId = c.req.param('id')
    const body = await c.req.json()
    const { isActive } = body
    
    console.log('🔄 Updating doctor status ID:', doctorId, 'isActive:', isActive)
    
    // Get existing doctor
    const existingDoctors = await kv.getByPrefix('dokter_')
    const existingDoctor = existingDoctors.find(d => d.id === doctorId)
    
    if (!existingDoctor) {
      return c.json({
        error: 'Data dokter tidak ditemukan'
      }, 404)
    }
    
    // Update doctor status
    const updatedDoctor = {
      ...existingDoctor,
      isActive: isActive,
      status: isActive ? 'active' : 'inactive',
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: user.id,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update doctor status...')
    await kv.set(doctorId, updatedDoctor)
    console.log('✅ Doctor status updated successfully')
    
    return c.json({
      success: true,
      message: `Status dokter ${existingDoctor.nama || existingDoctor.name} berhasil diperbarui`
    })
    
  } catch (error) {
    console.log('💥 Error updating doctor status:', error)
    return c.json({
      error: `Gagal memperbarui status dokter: ${error.message}`
    }, 500)
  }
})

// =============== CONTROL SCHEDULES ENDPOINTS ===============
app.get('/make-server-73417b67/control-schedules', async (c) => {
  console.log('📅 Control Schedules GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const schedules = await kv.getByPrefix('control_schedule_')
    
    console.log(`📊 Found ${schedules.length} control schedules in database`)
    
    // Transform control schedules data
    const transformedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      patientId: schedule.patientId || schedule.patient_id || '',
      patientName: schedule.patientName || schedule.patient_name || 'Unknown Patient',
      doctorId: schedule.doctorId || schedule.doctor_id || '',
      doctorName: schedule.doctorName || schedule.doctor_name || 'Unknown Doctor',
      controlDate: schedule.controlDate || schedule.control_date || schedule.tanggalKontrol || new Date().toISOString().split('T')[0],
      notes: schedule.notes || schedule.catatan || '',
      status: schedule.status || 'scheduled',
      created_at: schedule.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedSchedules.length} control schedules`)
    
    return c.json({
      success: true,
      schedules: transformedSchedules
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

app.post('/make-server-73417b67/control-schedules', async (c) => {
  console.log('📅 Create control schedule called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📅 Control schedule data received:', body)
    
    const { 
      patientId, 
      patientName,
      doctorId, 
      doctorName,
      controlDate, 
      notes,
      status = 'scheduled'
    } = body
    
    // Validate required fields
    if (!patientId || !doctorId || !controlDate) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Pasien, dokter, dan tanggal kontrol wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for control schedule')
    
    // Create control schedule
    const scheduleData = {
      id: `control_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      patientId: patientId,
      patient_id: patientId,
      patientName: patientName || 'Unknown Patient',
      patient_name: patientName || 'Unknown Patient',
      doctorId: doctorId,
      doctor_id: doctorId,
      doctorName: doctorName || 'Unknown Doctor',
      doctor_name: doctorName || 'Unknown Doctor',
      controlDate: controlDate,
      control_date: controlDate,
      tanggalKontrol: controlDate,
      notes: notes || '',
      catatan: notes || '',
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save control schedule to database...')
    await kv.set(scheduleData.id, scheduleData)
    console.log('✅ Control schedule saved successfully with ID:', scheduleData.id)
    
    return c.json({
      success: true,
      message: 'Jadwal kontrol berhasil ditambahkan',
      schedule: scheduleData
    })
    
  } catch (error) {
    console.log('💥 Error creating control schedule:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan jadwal kontrol: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/control-schedules/:id', async (c) => {
  console.log('📅 Update control schedule called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const scheduleId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📅 Updating control schedule ID:', scheduleId)
    
    // Get existing schedule
    const existingSchedules = await kv.getByPrefix('control_schedule_')
    const existingSchedule = existingSchedules.find(s => s.id === scheduleId)
    
    if (!existingSchedule) {
      return c.json({
        success: false,
        error: 'Jadwal kontrol tidak ditemukan'
      }, 404)
    }
    
    const { 
      patientId, 
      patientName,
      doctorId, 
      doctorName,
      controlDate, 
      notes,
      status
    } = body
    
    // Update schedule with new data
    const updatedSchedule = {
      ...existingSchedule,
      patientId: patientId || existingSchedule.patientId,
      patient_id: patientId || existingSchedule.patient_id,
      patientName: patientName || existingSchedule.patientName,
      patient_name: patientName || existingSchedule.patient_name,
      doctorId: doctorId || existingSchedule.doctorId,
      doctor_id: doctorId || existingSchedule.doctor_id,
      doctorName: doctorName || existingSchedule.doctorName,
      doctor_name: doctorName || existingSchedule.doctor_name,
      controlDate: controlDate || existingSchedule.controlDate,
      control_date: controlDate || existingSchedule.control_date,
      tanggalKontrol: controlDate || existingSchedule.tanggalKontrol,
      notes: notes !== undefined ? notes : existingSchedule.notes,
      catatan: notes !== undefined ? notes : existingSchedule.catatan,
      status: status || existingSchedule.status,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update control schedule...')
    await kv.set(scheduleId, updatedSchedule)
    console.log('✅ Control schedule updated successfully')
    
    return c.json({
      success: true,
      message: 'Jadwal kontrol berhasil diperbarui',
      schedule: updatedSchedule
    })
    
  } catch (error) {
    console.log('💥 Error updating control schedule:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui jadwal kontrol: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/control-schedules/:id', async (c) => {
  console.log('📅 Delete control schedule called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const scheduleId = c.req.param('id')
    
    console.log('🗑️ Deleting control schedule ID:', scheduleId)
    
    // Check if schedule exists
    const existingSchedules = await kv.getByPrefix('control_schedule_')
    const existingSchedule = existingSchedules.find(s => s.id === scheduleId)
    
    if (!existingSchedule) {
      return c.json({
        success: false,
        error: 'Jadwal kontrol tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(scheduleId)
    console.log('✅ Control schedule deleted successfully')
    
    return c.json({
      success: true,
      message: 'Jadwal kontrol berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting control schedule:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus jadwal kontrol: ${error.message}`
    }, 500)
  }
})

// =============== FIELD TRIP PRODUCTS ENDPOINTS ===============
app.get('/make-server-73417b67/field-trip-products', async (c) => {
  console.log('🚐 Field Trip Products GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const products = await kv.getByPrefix('field_trip_product_')
    
    console.log(`📊 Found ${products.length} field trip products in database`)
    
    // Transform field trip products data
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name || product.nama || 'Unknown Product',
      category: product.category || product.kategori || 'Kunjungan Klinik',
      price: product.price || product.harga || 0,
      unit: product.unit || product.satuan || 'paket',
      description: product.description || product.deskripsi || '',
      location: product.location || product.lokasi || '',
      duration: product.duration || product.durasi || '',
      maxParticipants: product.maxParticipants || product.max_participants || 0,
      minParticipants: product.minParticipants || product.min_participants || 0,
      ageRange: product.ageRange || product.age_range || '',
      included: product.included || product.termasuk || '',
      notIncluded: product.notIncluded || product.tidak_termasuk || '',
      requirements: product.requirements || product.persyaratan || '',
      notes: product.notes || product.catatan || '',
      isActive: product.isActive !== false && product.status !== 'nonaktif',
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || product.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedProducts.length} field trip products`)
    
    return c.json({
      success: true,
      products: transformedProducts
    })
    
  } catch (error) {
    console.log('💥 Error fetching field trip products:', error)
    return c.json({
      success: false,
      error: error.message,
      products: []
    }, 500)
  }
})

app.post('/make-server-73417b67/field-trip-products', async (c) => {
  console.log('🚐 Create field trip product called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Field trip product data received:', body)
    
    const { 
      name, 
      category, 
      price, 
      unit, 
      description,
      location,
      duration,
      maxParticipants,
      minParticipants,
      ageRange,
      included,
      notIncluded,
      requirements,
      notes,
      isActive = true
    } = body
    
    // Validate required fields
    if (!name || !category || !price || !unit) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama, kategori, harga, dan satuan wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for field trip product')
    
    // Create field trip product record
    const productRecord = {
      id: `field_trip_product_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      nama: name.trim(),
      category: category,
      kategori: category,
      price: Number(price),
      harga: Number(price),
      unit: unit.trim(),
      satuan: unit.trim(),
      description: description ? description.trim() : '',
      deskripsi: description ? description.trim() : '',
      location: location ? location.trim() : '',
      lokasi: location ? location.trim() : '',
      duration: duration ? duration.trim() : '',
      durasi: duration ? duration.trim() : '',
      maxParticipants: Number(maxParticipants) || 0,
      max_participants: Number(maxParticipants) || 0,
      minParticipants: Number(minParticipants) || 0,
      min_participants: Number(minParticipants) || 0,
      ageRange: ageRange ? ageRange.trim() : '',
      age_range: ageRange ? ageRange.trim() : '',
      included: included ? included.trim() : '',
      termasuk: included ? included.trim() : '',
      notIncluded: notIncluded ? notIncluded.trim() : '',
      tidak_termasuk: notIncluded ? notIncluded.trim() : '',
      requirements: requirements ? requirements.trim() : '',
      persyaratan: requirements ? requirements.trim() : '',
      notes: notes ? notes.trim() : '',
      catatan: notes ? notes.trim() : '',
      isActive: Boolean(isActive),
      status: Boolean(isActive) ? 'aktif' : 'nonaktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save field trip product to database...')
    await kv.set(productRecord.id, productRecord)
    console.log('✅ Field trip product saved successfully with ID:', productRecord.id)
    
    return c.json({
      success: true,
      message: 'Produk field trip berhasil ditambahkan',
      product: productRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating field trip product:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan produk field trip: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/field-trip-products/:id', async (c) => {
  console.log('🚐 Update field trip product called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const productId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating field trip product ID:', productId)
    console.log('📋 Update data received:', body)
    
    // Get existing product
    const existingProducts = await kv.getByPrefix('field_trip_product_')
    const existingProduct = existingProducts.find(p => p.id === productId)
    
    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Produk field trip tidak ditemukan'
      }, 404)
    }
    
    const { 
      name, 
      category, 
      price, 
      unit, 
      description,
      location,
      duration,
      maxParticipants,
      minParticipants,
      ageRange,
      included,
      notIncluded,
      requirements,
      notes,
      isActive
    } = body
    
    // Update product with new data
    const updatedProduct = {
      ...existingProduct,
      name: name || existingProduct.name,
      nama: name || existingProduct.nama,
      category: category || existingProduct.category,
      kategori: category || existingProduct.kategori,
      price: price !== undefined ? Number(price) : existingProduct.price,
      harga: price !== undefined ? Number(price) : existingProduct.harga,
      unit: unit || existingProduct.unit,
      satuan: unit || existingProduct.satuan,
      description: description !== undefined ? description : existingProduct.description,
      deskripsi: description !== undefined ? description : existingProduct.deskripsi,
      location: location !== undefined ? location : existingProduct.location,
      lokasi: location !== undefined ? location : existingProduct.lokasi,
      duration: duration !== undefined ? duration : existingProduct.duration,
      durasi: duration !== undefined ? duration : existingProduct.durasi,
      maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : existingProduct.maxParticipants,
      max_participants: maxParticipants !== undefined ? Number(maxParticipants) : existingProduct.max_participants,
      minParticipants: minParticipants !== undefined ? Number(minParticipants) : existingProduct.minParticipants,
      min_participants: minParticipants !== undefined ? Number(minParticipants) : existingProduct.min_participants,
      ageRange: ageRange !== undefined ? ageRange : existingProduct.ageRange,
      age_range: ageRange !== undefined ? ageRange : existingProduct.age_range,
      included: included !== undefined ? included : existingProduct.included,
      termasuk: included !== undefined ? included : existingProduct.termasuk,
      notIncluded: notIncluded !== undefined ? notIncluded : existingProduct.notIncluded,
      tidak_termasuk: notIncluded !== undefined ? notIncluded : existingProduct.tidak_termasuk,
      requirements: requirements !== undefined ? requirements : existingProduct.requirements,
      persyaratan: requirements !== undefined ? requirements : existingProduct.persyaratan,
      notes: notes !== undefined ? notes : existingProduct.notes,
      catatan: notes !== undefined ? notes : existingProduct.catatan,
      isActive: isActive !== undefined ? Boolean(isActive) : existingProduct.isActive,
      status: isActive !== undefined ? (Boolean(isActive) ? 'aktif' : 'nonaktif') : existingProduct.status,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update field trip product...')
    await kv.set(productId, updatedProduct)
    console.log('✅ Field trip product updated successfully')
    
    return c.json({
      success: true,
      message: 'Produk field trip berhasil diperbarui',
      product: updatedProduct
    })
    
  } catch (error) {
    console.log('💥 Error updating field trip product:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui produk field trip: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/field-trip-products/:id', async (c) => {
  console.log('🚐 Delete field trip product called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const productId = c.req.param('id')
    
    console.log('🗑️ Deleting field trip product ID:', productId)
    
    // Check if product exists
    const existingProducts = await kv.getByPrefix('field_trip_product_')
    const existingProduct = existingProducts.find(p => p.id === productId)
    
    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Produk field trip tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(productId)
    console.log('✅ Field trip product deleted successfully')
    
    return c.json({
      success: true,
      message: 'Produk field trip berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting field trip product:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus produk field trip: ${error.message}`
    }, 500)
  }
})

app.post('/make-server-73417b67/field-trip-products/initialize', async (c) => {
  console.log('🚐 Initialize field trip products called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Sample field trip products
    const sampleProducts = [
      {
        name: 'Paket Kunjungan Klinik Gigi Dasar',
        category: 'Kunjungan Klinik',
        price: 50000,
        unit: 'per anak',
        description: 'Program edukasi kesehatan gigi dan mulut untuk anak-anak dengan pemeriksaan dasar dan demonstrasi cara menyikat gigi yang benar.',
        location: 'Falasifah Dental Clinic',
        duration: '2 jam',
        minParticipants: 10,
        maxParticipants: 30,
        ageRange: '5-12 tahun',
        included: 'Pemeriksaan gigi dasar, edukasi kesehatan gigi, sikat gigi gratis, snack sehat',
        notIncluded: 'Transportasi, perawatan lanjutan',
        requirements: 'Surat izin orang tua, daftar nama peserta',
        notes: 'Disarankan untuk anak sekolah dasar'
      },
      {
        name: 'Paket Kunjungan Klinik Gigi Premium',
        category: 'Kunjungan Klinik',
        price: 75000,
        unit: 'per anak',
        description: 'Program edukasi komprehensif dengan pemeriksaan menyeluruh, fluoride treatment, dan konsultasi individual.',
        location: 'Falasifah Dental Clinic',
        duration: '3 jam',
        minParticipants: 5,
        maxParticipants: 20,
        ageRange: '6-15 tahun',
        included: 'Pemeriksaan lengkap, fluoride treatment, edukasi, goodie bag, sertifikat',
        notIncluded: 'Transportasi, perawatan orthodonti',
        requirements: 'Surat izin orang tua, kartu identitas anak',
        notes: 'Termasuk dokumentasi kegiatan'
      },
      {
        name: 'Program Edukasi Sekolah - Paket Basic',
        category: 'Kunjungan Sekolah',
        price: 200000,
        unit: 'per kelas',
        description: 'Tim dokter gigi berkunjung ke sekolah untuk memberikan edukasi kesehatan gigi dan pemeriksaan sederhana.',
        location: 'Sekolah (dalam kota)',
        duration: '1.5 jam',
        minParticipants: 20,
        maxParticipants: 35,
        ageRange: 'TK - SD',
        included: 'Edukasi interaktif, pemeriksaan singkat, leaflet edukasi',
        notIncluded: 'Perawatan medis, biaya transportasi luar kota',
        requirements: 'Ruang kelas, proyektor, daftar siswa',
        notes: 'Minimal booking 1 minggu sebelumnya'
      },
      {
        name: 'Program Edukasi Sekolah - Paket Premium',
        category: 'Kunjungan Sekolah',
        price: 350000,
        unit: 'per kelas',
        description: 'Program komprehensif dengan edukasi interaktif, pemeriksaan detail, dan laporan kesehatan gigi untuk sekolah.',
        location: 'Sekolah (dalam kota)',
        duration: '2.5 jam',
        minParticipants: 15,
        maxParticipants: 30,
        ageRange: 'SD - SMP',
        included: 'Edukasi multimedia, pemeriksaan lengkap, laporan kesehatan, kit dental care',
        notIncluded: 'Perawatan medis lanjutan, transportasi luar kota',
        requirements: 'Ruang kelas AC, proyektor, sound system, daftar siswa',
        notes: 'Termasuk laporan tertulis untuk pihak sekolah'
      }
    ]
    
    let addedCount = 0
    
    for (const productData of sampleProducts) {
      const productRecord = {
        id: `field_trip_product_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: productData.name,
        nama: productData.name,
        category: productData.category,
        kategori: productData.category,
        price: productData.price,
        harga: productData.price,
        unit: productData.unit,
        satuan: productData.unit,
        description: productData.description,
        deskripsi: productData.description,
        location: productData.location,
        lokasi: productData.location,
        duration: productData.duration,
        durasi: productData.duration,
        maxParticipants: productData.maxParticipants,
        max_participants: productData.maxParticipants,
        minParticipants: productData.minParticipants,
        min_participants: productData.minParticipants,
        ageRange: productData.ageRange,
        age_range: productData.ageRange,
        included: productData.included,
        termasuk: productData.included,
        notIncluded: productData.notIncluded,
        tidak_termasuk: productData.notIncluded,
        requirements: productData.requirements,
        persyaratan: productData.requirements,
        notes: productData.notes,
        catatan: productData.notes,
        isActive: true,
        status: 'aktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await kv.set(productRecord.id, productRecord)
      addedCount++
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    console.log(`✅ Successfully initialized ${addedCount} field trip products`)
    
    return c.json({
      success: true,
      message: `Berhasil menambahkan ${addedCount} produk field trip contoh`,
      count: addedCount
    })
    
  } catch (error) {
    console.log('💥 Error initializing field trip products:', error)
    return c.json({
      success: false,
      error: `Gagal menginisialisasi produk field trip: ${error.message}`
    }, 500)
  }
})

// =============== FIELD TRIP SALES ENDPOINTS ===============
app.get('/make-server-73417b67/field-trip-sales', async (c) => {
  console.log('🚐 Field Trip Sales GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const sales = await kv.getByPrefix('field_trip_sale_')
    
    console.log(`📊 Found ${sales.length} field trip sales in database`)
    
    // Transform field trip sales data
    const transformedSales = sales.map(sale => ({
      id: sale.id,
      customerName: sale.customerName || sale.customer_name || '',
      customerPhone: sale.customerPhone || sale.customer_phone || '',
      customerEmail: sale.customerEmail || sale.customer_email || '',
      customerAddress: sale.customerAddress || sale.customer_address || '',
      organization: sale.organization || sale.organisasi || '',
      productId: sale.productId || sale.product_id || '',
      productName: sale.productName || sale.product_name || '',
      productPrice: sale.productPrice || sale.product_price || 0,
      totalAmount: sale.totalAmount || sale.total_amount || 0,
      discount: sale.discount || sale.diskon || 0,
      finalAmount: sale.finalAmount || sale.final_amount || 0,
      saleDate: sale.saleDate || sale.sale_date || new Date().toISOString().split('T')[0],
      eventDate: sale.eventDate || sale.event_date || '',
      eventEndDate: sale.eventEndDate || sale.event_end_date || '',
      participants: sale.participants || sale.peserta || 1,
      notes: sale.notes || sale.catatan || '',
      status: sale.status || 'draft',
      paymentMethod: sale.paymentMethod || sale.payment_method || '',
      paymentStatus: sale.paymentStatus || sale.payment_status || 'lunas',
      dpAmount: sale.dpAmount || sale.dp_amount || 0,
      outstandingAmount: sale.outstandingAmount || sale.outstanding_amount || 0,
      paymentNotes: sale.paymentNotes || sale.payment_notes || '',
      selectedDoctors: sale.selectedDoctors || sale.selected_doctors || [],
      selectedEmployees: sale.selectedEmployees || sale.selected_employees || [],
      totalDoctorFees: sale.totalDoctorFees || sale.total_doctor_fees || 0,
      totalEmployeeBonuses: sale.totalEmployeeBonuses || sale.total_employee_bonuses || 0,
      created_at: sale.created_at || new Date().toISOString(),
      updated_at: sale.updated_at || sale.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedSales.length} field trip sales`)
    
    return c.json({
      success: true,
      sales: transformedSales
    })
    
  } catch (error) {
    console.log('💥 Error fetching field trip sales:', error)
    return c.json({
      success: false,
      error: error.message,
      sales: []
    }, 500)
  }
})

app.post('/make-server-73417b67/field-trip-sales', async (c) => {
  console.log('🚐 Create field trip sale called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Field trip sale data received:', body)
    
    const { 
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      organization,
      productId,
      productName,
      productPrice,
      totalAmount,
      discount,
      finalAmount,
      saleDate,
      eventDate,
      eventEndDate,
      participants,
      notes,
      status = 'draft',
      paymentMethod,
      paymentStatus = 'lunas',
      dpAmount,
      outstandingAmount,
      paymentNotes,
      selectedDoctors = [],
      selectedEmployees = [],
      totalDoctorFees = 0,
      totalEmployeeBonuses = 0
    } = body
    
    // Validate required fields
    if (!customerName || !customerPhone || !productId) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama pelanggan, telepon, dan produk wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for field trip sale')
    
    // Create field trip sale record
    const saleRecord = {
      id: `field_trip_sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      customerName: customerName.trim(),
      customer_name: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customer_phone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : '',
      customer_email: customerEmail ? customerEmail.trim() : '',
      customerAddress: customerAddress ? customerAddress.trim() : '',
      customer_address: customerAddress ? customerAddress.trim() : '',
      organization: organization ? organization.trim() : '',
      organisasi: organization ? organization.trim() : '',
      productId: productId,
      product_id: productId,
      productName: productName || '',
      product_name: productName || '',
      productPrice: Number(productPrice) || 0,
      product_price: Number(productPrice) || 0,
      totalAmount: Number(totalAmount) || 0,
      total_amount: Number(totalAmount) || 0,
      discount: Number(discount) || 0,
      diskon: Number(discount) || 0,
      finalAmount: Number(finalAmount) || 0,
      final_amount: Number(finalAmount) || 0,
      saleDate: saleDate || new Date().toISOString().split('T')[0],
      sale_date: saleDate || new Date().toISOString().split('T')[0],
      eventDate: eventDate || '',
      event_date: eventDate || '',
      eventEndDate: eventEndDate || '',
      event_end_date: eventEndDate || '',
      participants: Number(participants) || 1,
      peserta: Number(participants) || 1,
      notes: notes || '',
      catatan: notes || '',
      status: status,
      paymentMethod: paymentMethod || '',
      payment_method: paymentMethod || '',
      paymentStatus: paymentStatus,
      payment_status: paymentStatus,
      dpAmount: Number(dpAmount) || 0,
      dp_amount: Number(dpAmount) || 0,
      outstandingAmount: Number(outstandingAmount) || 0,
      outstanding_amount: Number(outstandingAmount) || 0,
      paymentNotes: paymentNotes || '',
      payment_notes: paymentNotes || '',
      selectedDoctors: selectedDoctors,
      selected_doctors: selectedDoctors,
      selectedEmployees: selectedEmployees,
      selected_employees: selectedEmployees,
      totalDoctorFees: Number(totalDoctorFees) || 0,
      total_doctor_fees: Number(totalDoctorFees) || 0,
      totalEmployeeBonuses: Number(totalEmployeeBonuses) || 0,
      total_employee_bonuses: Number(totalEmployeeBonuses) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save field trip sale to database...')
    await kv.set(saleRecord.id, saleRecord)
    console.log('✅ Field trip sale saved successfully with ID:', saleRecord.id)
    
    return c.json({
      success: true,
      message: 'Penjualan field trip berhasil ditambahkan',
      sale: saleRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating field trip sale:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan penjualan field trip: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/field-trip-sales/:id', async (c) => {
  console.log('🚐 Update field trip sale called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const saleId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating field trip sale ID:', saleId)
    console.log('📋 Update data received:', body)
    
    // Get existing sale
    const existingSales = await kv.getByPrefix('field_trip_sale_')
    const existingSale = existingSales.find(s => s.id === saleId)
    
    if (!existingSale) {
      return c.json({
        success: false,
        error: 'Penjualan field trip tidak ditemukan'
      }, 404)
    }
    
    const { 
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      organization,
      productId,
      productName,
      productPrice,
      totalAmount,
      discount,
      finalAmount,
      saleDate,
      eventDate,
      eventEndDate,
      participants,
      notes,
      status,
      paymentMethod,
      paymentStatus,
      dpAmount,
      outstandingAmount,
      paymentNotes,
      selectedDoctors,
      selectedEmployees,
      totalDoctorFees,
      totalEmployeeBonuses
    } = body
    
    // Update sale with new data
    const updatedSale = {
      ...existingSale,
      customerName: customerName || existingSale.customerName,
      customer_name: customerName || existingSale.customer_name,
      customerPhone: customerPhone || existingSale.customerPhone,
      customer_phone: customerPhone || existingSale.customer_phone,
      customerEmail: customerEmail !== undefined ? customerEmail : existingSale.customerEmail,
      customer_email: customerEmail !== undefined ? customerEmail : existingSale.customer_email,
      customerAddress: customerAddress !== undefined ? customerAddress : existingSale.customerAddress,
      customer_address: customerAddress !== undefined ? customerAddress : existingSale.customer_address,
      organization: organization !== undefined ? organization : existingSale.organization,
      organisasi: organization !== undefined ? organization : existingSale.organisasi,
      productId: productId || existingSale.productId,
      product_id: productId || existingSale.product_id,
      productName: productName !== undefined ? productName : existingSale.productName,
      product_name: productName !== undefined ? productName : existingSale.product_name,
      productPrice: productPrice !== undefined ? Number(productPrice) : existingSale.productPrice,
      product_price: productPrice !== undefined ? Number(productPrice) : existingSale.product_price,
      totalAmount: totalAmount !== undefined ? Number(totalAmount) : existingSale.totalAmount,
      total_amount: totalAmount !== undefined ? Number(totalAmount) : existingSale.total_amount,
      discount: discount !== undefined ? Number(discount) : existingSale.discount,
      diskon: discount !== undefined ? Number(discount) : existingSale.diskon,
      finalAmount: finalAmount !== undefined ? Number(finalAmount) : existingSale.finalAmount,
      final_amount: finalAmount !== undefined ? Number(finalAmount) : existingSale.final_amount,
      saleDate: saleDate || existingSale.saleDate,
      sale_date: saleDate || existingSale.sale_date,
      eventDate: eventDate !== undefined ? eventDate : existingSale.eventDate,
      event_date: eventDate !== undefined ? eventDate : existingSale.event_date,
      eventEndDate: eventEndDate !== undefined ? eventEndDate : existingSale.eventEndDate,
      event_end_date: eventEndDate !== undefined ? eventEndDate : existingSale.event_end_date,
      participants: participants !== undefined ? Number(participants) : existingSale.participants,
      peserta: participants !== undefined ? Number(participants) : existingSale.peserta,
      notes: notes !== undefined ? notes : existingSale.notes,
      catatan: notes !== undefined ? notes : existingSale.catatan,
      status: status !== undefined ? status : existingSale.status,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : existingSale.paymentMethod,
      payment_method: paymentMethod !== undefined ? paymentMethod : existingSale.payment_method,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : existingSale.paymentStatus,
      payment_status: paymentStatus !== undefined ? paymentStatus : existingSale.payment_status,
      dpAmount: dpAmount !== undefined ? Number(dpAmount) : existingSale.dpAmount,
      dp_amount: dpAmount !== undefined ? Number(dpAmount) : existingSale.dp_amount,
      outstandingAmount: outstandingAmount !== undefined ? Number(outstandingAmount) : existingSale.outstandingAmount,
      outstanding_amount: outstandingAmount !== undefined ? Number(outstandingAmount) : existingSale.outstanding_amount,
      paymentNotes: paymentNotes !== undefined ? paymentNotes : existingSale.paymentNotes,
      payment_notes: paymentNotes !== undefined ? paymentNotes : existingSale.payment_notes,
      selectedDoctors: selectedDoctors !== undefined ? selectedDoctors : existingSale.selectedDoctors,
      selected_doctors: selectedDoctors !== undefined ? selectedDoctors : existingSale.selected_doctors,
      selectedEmployees: selectedEmployees !== undefined ? selectedEmployees : existingSale.selectedEmployees,
      selected_employees: selectedEmployees !== undefined ? selectedEmployees : existingSale.selected_employees,
      totalDoctorFees: totalDoctorFees !== undefined ? Number(totalDoctorFees) : existingSale.totalDoctorFees,
      total_doctor_fees: totalDoctorFees !== undefined ? Number(totalDoctorFees) : existingSale.total_doctor_fees,
      totalEmployeeBonuses: totalEmployeeBonuses !== undefined ? Number(totalEmployeeBonuses) : existingSale.totalEmployeeBonuses,
      total_employee_bonuses: totalEmployeeBonuses !== undefined ? Number(totalEmployeeBonuses) : existingSale.total_employee_bonuses,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update field trip sale...')
    await kv.set(saleId, updatedSale)
    console.log('✅ Field trip sale updated successfully')
    
    return c.json({
      success: true,
      message: 'Penjualan field trip berhasil diperbarui',
      sale: updatedSale
    })
    
  } catch (error) {
    console.log('💥 Error updating field trip sale:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui penjualan field trip: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/field-trip-sales/:id', async (c) => {
  console.log('🚐 Delete field trip sale called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const saleId = c.req.param('id')
    
    console.log('🗑️ Deleting field trip sale ID:', saleId)
    
    // Check if sale exists
    const existingSales = await kv.getByPrefix('field_trip_sale_')
    const existingSale = existingSales.find(s => s.id === saleId)
    
    if (!existingSale) {
      return c.json({
        success: false,
        error: 'Penjualan field trip tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(saleId)
    console.log('✅ Field trip sale deleted successfully')
    
    return c.json({
      success: true,
      message: 'Penjualan field trip berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting field trip sale:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus penjualan field trip: ${error.message}`
    }, 500)
  }
})

app.post('/make-server-73417b67/field-trip-sales/initialize', async (c) => {
  console.log('🚐 Initialize field trip sales called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get existing products to reference
    const products = await kv.getByPrefix('field_trip_product_')
    
    if (products.length === 0) {
      return c.json({
        success: false,
        error: 'Tidak ada produk field trip tersedia. Silakan tambahkan produk terlebih dahulu.'
      }, 400)
    }
    
    // Sample field trip sales
    const sampleSales = [
      {
        customerName: 'SD Negeri 1 Jakarta',
        customerPhone: '021-12345678',
        customerEmail: 'admin@sdn1jakarta.sch.id',
        customerAddress: 'Jl. Merdeka No. 123, Jakarta Pusat',
        organization: 'SD Negeri 1 Jakarta',
        productId: products[0].id,
        productName: products[0].name,
        productPrice: products[0].price,
        participants: 25,
        totalAmount: products[0].price * 25,
        discount: 50000,
        finalAmount: (products[0].price * 25) - 50000,
        saleDate: new Date().toISOString().split('T')[0],
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        notes: 'Kunjungan edukasi untuk siswa kelas 4-6',
        status: 'confirmed',
        paymentMethod: 'transfer',
        paymentStatus: 'lunas'
      },
      {
        customerName: 'TK Ananda',
        customerPhone: '021-87654321',
        customerEmail: 'info@tkananda.com',
        customerAddress: 'Jl. Pendidikan No. 456, Jakarta Selatan',
        organization: 'TK Ananda',
        productId: products[0].id,
        productName: products[0].name,
        productPrice: products[0].price,
        participants: 15,
        totalAmount: products[0].price * 15,
        discount: 0,
        finalAmount: products[0].price * 15,
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        notes: 'Program edukasi gigi untuk anak usia dini',
        status: 'draft',
        paymentMethod: 'cash',
        paymentStatus: 'dp',
        dpAmount: 200000,
        outstandingAmount: (products[0].price * 15) - 200000
      }
    ]
    
    let addedCount = 0
    
    for (const saleData of sampleSales) {
      const saleRecord = {
        id: `field_trip_sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerName: saleData.customerName,
        customer_name: saleData.customerName,
        customerPhone: saleData.customerPhone,
        customer_phone: saleData.customerPhone,
        customerEmail: saleData.customerEmail,
        customer_email: saleData.customerEmail,
        customerAddress: saleData.customerAddress,
        customer_address: saleData.customerAddress,
        organization: saleData.organization,
        organisasi: saleData.organization,
        productId: saleData.productId,
        product_id: saleData.productId,
        productName: saleData.productName,
        product_name: saleData.productName,
        productPrice: saleData.productPrice,
        product_price: saleData.productPrice,
        totalAmount: saleData.totalAmount,
        total_amount: saleData.totalAmount,
        discount: saleData.discount,
        diskon: saleData.discount,
        finalAmount: saleData.finalAmount,
        final_amount: saleData.finalAmount,
        saleDate: saleData.saleDate,
        sale_date: saleData.saleDate,
        eventDate: saleData.eventDate,
        event_date: saleData.eventDate,
        eventEndDate: '',
        event_end_date: '',
        participants: saleData.participants,
        peserta: saleData.participants,
        notes: saleData.notes,
        catatan: saleData.notes,
        status: saleData.status,
        paymentMethod: saleData.paymentMethod,
        payment_method: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        payment_status: saleData.paymentStatus,
        dpAmount: saleData.dpAmount || 0,
        dp_amount: saleData.dpAmount || 0,
        outstandingAmount: saleData.outstandingAmount || 0,
        outstanding_amount: saleData.outstandingAmount || 0,
        paymentNotes: '',
        payment_notes: '',
        selectedDoctors: [],
        selected_doctors: [],
        selectedEmployees: [],
        selected_employees: [],
        totalDoctorFees: 0,
        total_doctor_fees: 0,
        totalEmployeeBonuses: 0,
        total_employee_bonuses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await kv.set(saleRecord.id, saleRecord)
      addedCount++
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    console.log(`✅ Successfully initialized ${addedCount} field trip sales`)
    
    return c.json({
      success: true,
      message: `Berhasil menambahkan ${addedCount} penjualan field trip contoh`,
      count: addedCount
    })
    
  } catch (error) {
    console.log('💥 Error initializing field trip sales:', error)
    return c.json({
      success: false,
      error: `Gagal menginisialisasi penjualan field trip: ${error.message}`
    }, 500)
  }
})

// =============== START SERVER ===============
console.log('🎯 Server configured with all endpoints, starting...')

// Start the server
Deno.serve(app.fetch)

console.log('✅ Server started successfully with field trip sales endpoint!')

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

// =============== PRODUCTS ENDPOINTS ===============
app.get('/make-server-73417b67/products', async (c) => {
  console.log('🛍️ Products GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const products = await kv.getByPrefix('product_')
    
    console.log(`📊 Found ${products.length} products in database`)
    
    // Transform products data
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.nama || product.name || 'Unknown Product',
      category: product.kategori || product.category || 'Umum',
      price: product.harga || product.price || 0,
      stock: product.stok || product.stock || 0,
      minStock: product.min_stok || product.minStock || 5,
      unit: product.satuan || product.unit || 'pcs',
      description: product.deskripsi || product.description || '',
      supplier: product.supplier || '',
      barcode: product.barcode || '',
      status: product.status || 'aktif',
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || product.created_at || new Date().toISOString()
    }))
    
    // Filter only active products
    const activeProducts = transformedProducts.filter(product => product.status === 'aktif')
    
    console.log(`✅ Returning ${activeProducts.length} active products`)
    
    return c.json({
      success: true,
      products: activeProducts
    })
    
  } catch (error) {
    console.log('💥 Error fetching products:', error)
    return c.json({
      success: false,
      error: error.message,
      products: []
    }, 500)
  }
})

app.post('/make-server-73417b67/products', async (c) => {
  console.log('🛍️ Create product called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Product data received:', body)
    
    const { 
      nama, name, 
      kategori, category, 
      harga, price, 
      stok, stock,
      deskripsi, description,
      supplier,
      unit, satuan,
      minStock, min_stok,
      barcode
    } = body
    
    // Use either Indonesian or English field names
    const productName = nama || name
    const productCategory = kategori || category
    const productPrice = harga || price
    const productStock = stok || stock
    const productDescription = deskripsi || description
    const productUnit = unit || satuan || 'pcs'
    
    // Validate required fields
    if (!productName || !productCategory || productPrice === undefined || productPrice === null) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama produk, kategori, dan harga wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for product')
    
    // Create product record with dual field names for compatibility
    const productRecord = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      // Indonesian field names
      nama: productName.trim(),
      kategori: productCategory,
      harga: parseFloat(productPrice),
      stok: parseInt(productStock) || 0,
      deskripsi: productDescription ? productDescription.trim() : '',
      satuan: productUnit,
      min_stok: parseInt(minStock || min_stok) || 5,
      // English field names for compatibility
      name: productName.trim(),
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock) || 0,
      description: productDescription ? productDescription.trim() : '',
      unit: productUnit,
      minStock: parseInt(minStock || min_stok) || 5,
      supplier: supplier || '',
      barcode: barcode || '',
      status: 'aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save product to database...')
    await kv.set(productRecord.id, productRecord)
    console.log('✅ Product saved successfully with ID:', productRecord.id)
    
    return c.json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      product: productRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating product:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan data produk: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/products/:id', async (c) => {
  console.log('🛍️ Update product called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const productId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating product ID:', productId)
    
    // Get existing product
    const existingProducts = await kv.getByPrefix('product_')
    const existingProduct = existingProducts.find(p => p.id === productId)
    
    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Data produk tidak ditemukan'
      }, 404)
    }
    
    const { 
      nama, name, 
      kategori, category, 
      harga, price, 
      stok, stock,
      deskripsi, description,
      supplier,
      unit, satuan,
      minStock, min_stok,
      barcode
    } = body
    
    // Use either Indonesian or English field names
    const productName = nama || name
    const productCategory = kategori || category
    const productPrice = harga || price
    const productStock = stok || stock
    const productDescription = deskripsi || description
    const productUnit = unit || satuan || 'pcs'
    
    // Update product with new data
    const updatedProduct = {
      ...existingProduct,
      // Indonesian field names
      nama: productName ? productName.trim() : existingProduct.nama,
      kategori: productCategory || existingProduct.kategori,
      harga: productPrice !== undefined ? parseFloat(productPrice) : existingProduct.harga,
      stok: productStock !== undefined ? parseInt(productStock) : existingProduct.stok,
      deskripsi: productDescription !== undefined ? productDescription.trim() : existingProduct.deskripsi,
      satuan: productUnit || existingProduct.satuan,
      min_stok: minStock !== undefined || min_stok !== undefined ? parseInt(minStock || min_stok) : existingProduct.min_stok,
      // English field names for compatibility
      name: productName ? productName.trim() : existingProduct.name,
      category: productCategory || existingProduct.category,
      price: productPrice !== undefined ? parseFloat(productPrice) : existingProduct.price,
      stock: productStock !== undefined ? parseInt(productStock) : existingProduct.stock,
      description: productDescription !== undefined ? productDescription.trim() : existingProduct.description,
      unit: productUnit || existingProduct.unit,
      minStock: minStock !== undefined || min_stok !== undefined ? parseInt(minStock || min_stok) : existingProduct.minStock,
      supplier: supplier !== undefined ? supplier : existingProduct.supplier,
      barcode: barcode !== undefined ? barcode : existingProduct.barcode,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update product...')
    await kv.set(productId, updatedProduct)
    console.log('✅ Product updated successfully')
    
    return c.json({
      success: true,
      message: 'Data produk berhasil diperbarui',
      product: updatedProduct
    })
    
  } catch (error) {
    console.log('💥 Error updating product:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data produk: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/products/:id', async (c) => {
  console.log('🛍️ Delete product called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const productId = c.req.param('id')
    
    console.log('🗑️ Deleting product ID:', productId)
    
    // Check if product exists
    const existingProducts = await kv.getByPrefix('product_')
    const existingProduct = existingProducts.find(p => p.id === productId)
    
    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Data produk tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(productId)
    console.log('✅ Product deleted successfully')
    
    return c.json({
      success: true,
      message: 'Data produk berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting product:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus data produk: ${error.message}`
    }, 500)
  }
})

// =============== TREATMENT PRODUCTS ENDPOINTS ===============
app.get('/make-server-73417b67/treatment-products', async (c) => {
  console.log('🦷 Treatment Products GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const products = await kv.getByPrefix('product_')
    
    console.log(`📊 Found ${products.length} products in database`)
    
    // Filter and transform treatment-related products
    const treatmentProducts = products
      .filter(product => {
        const category = (product.kategori || product.category || '').toLowerCase()
        return category.includes('tindakan') || 
               category.includes('treatment') ||
               category.includes('dental') ||
               category.includes('alat') ||
               category.includes('bahan') ||
               category === 'umum' // Include general products too
      })
      .map(product => ({
        id: product.id,
        name: product.nama || product.name || 'Unknown Product',
        category: product.kategori || product.category || 'Tindakan',
        price: product.harga || product.price || 0,
        stock: product.stok || product.stock || 0,
        unit: product.satuan || product.unit || 'pcs',
        description: product.deskripsi || product.description || '',
        supplier: product.supplier || '',
        status: product.status || 'aktif',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || product.created_at || new Date().toISOString()
      }))
    
    // Filter only active products
    const activeProducts = treatmentProducts.filter(product => product.status === 'aktif')
    
    console.log(`✅ Returning ${activeProducts.length} active treatment products`)
    
    return c.json({
      success: true,
      products: activeProducts
    })
    
  } catch (error) {
    console.log('💥 Error fetching treatment products:', error)
    return c.json({
      success: false,
      error: error.message,
      products: []
    }, 500)
  }
})

// =============== MEDICATION PRODUCTS ENDPOINTS ===============
app.get('/make-server-73417b67/medication-products', async (c) => {
  console.log('💊 Medication Products GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const products = await kv.getByPrefix('product_')
    
    console.log(`📊 Found ${products.length} products in database`)
    
    // Filter and transform medication products
    const medicationProducts = products
      .filter(product => {
        const category = (product.kategori || product.category || '').toLowerCase()
        return category.includes('obat') || 
               category.includes('medication') ||
               category.includes('medicine') ||
               category.includes('farmasi') ||
               category === 'umum' // Include general products too
      })
      .map(product => ({
        id: product.id,
        name: product.nama || product.name || 'Unknown Product',
        category: product.kategori || product.category || 'Obat',
        price: product.harga || product.price || 0,
        stock: product.stok || product.stock || 0,
        unit: product.satuan || product.unit || 'pcs',
        description: product.deskripsi || product.description || '',
        supplier: product.supplier || '',
        expiredDate: product.tanggalKadaluarsa || product.expiredDate || product.expired_date || '',
        batchNumber: product.nomorBatch || product.batchNumber || product.batch_number || '',
        status: product.status || 'aktif',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || product.created_at || new Date().toISOString()
      }))
    
    // Filter only active products
    const activeProducts = medicationProducts.filter(product => product.status === 'aktif')
    
    console.log(`✅ Returning ${activeProducts.length} active medication products`)
    
    return c.json({
      success: true,
      products: activeProducts
    })
    
  } catch (error) {
    console.log('💥 Error fetching medication products:', error)
    return c.json({
      success: false,
      error: error.message,
      products: []
    }, 500)
  }
})

// =============== ATTENDANCE ENDPOINTS ===============
app.get('/make-server-73417b67/attendance', async (c) => {
  console.log('📋 Attendance GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const attendanceRecords = await kv.getByPrefix('attendance_')
    
    console.log(`📊 Found ${attendanceRecords.length} attendance records in database`)
    
    // Transform attendance data to match component interface
    const transformedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      doctorId: record.doctorId || record.doctor_id || '',
      doctorName: record.doctorName || record.doctor_name || 'Unknown Doctor',
      shift: record.shift || '09:00-15:00',
      type: record.type || record.jenis || 'check-in',
      date: record.date || record.tanggal || new Date().toISOString().split('T')[0],
      time: record.time || record.waktu || '00:00',
      createdAt: record.createdAt || record.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedAttendance.length} attendance records`)
    
    return c.json({
      success: true,
      attendance: transformedAttendance
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
  console.log('📋 Create attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Attendance data received:', body)
    
    const { doctorId, shift, type, date, time } = body
    
    // Validate required fields
    if (!doctorId || !shift || !type || !date || !time) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Dokter, shift, jenis, tanggal, dan waktu wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for attendance')
    
    // Get doctor name
    const doctors = await kv.getByPrefix('dokter_')
    const doctor = doctors.find(d => d.id === doctorId)
    const doctorName = doctor ? (doctor.nama || doctor.name || 'Unknown Doctor') : 'Unknown Doctor'
    
    // Create attendance record
    const attendanceRecord = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      doctor_id: doctorId,
      doctorName: doctorName,
      doctor_name: doctorName,
      shift: shift,
      type: type,
      jenis: type,
      date: date,
      tanggal: date,
      time: time,
      waktu: time,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save attendance to database...')
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Attendance saved successfully with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: 'Data absensi berhasil dicatat',
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating attendance:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat absensi: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/attendance/:id', async (c) => {
  console.log('📋 Update attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating attendance ID:', attendanceId)
    
    // Get existing attendance
    const existingAttendance = await kv.get(attendanceId)
    if (!existingAttendance) {
      return c.json({
        success: false,
        error: 'Data absensi tidak ditemukan'
      }, 404)
    }
    
    const { doctorId, shift, type, date, time } = body
    
    // Get doctor name if doctorId changed
    let doctorName = existingAttendance.doctorName || existingAttendance.doctor_name
    if (doctorId && doctorId !== existingAttendance.doctorId) {
      const doctors = await kv.getByPrefix('dokter_')
      const doctor = doctors.find(d => d.id === doctorId)
      doctorName = doctor ? (doctor.nama || doctor.name || 'Unknown Doctor') : 'Unknown Doctor'
    }
    
    // Update attendance record
    const updatedAttendance = {
      ...existingAttendance,
      doctorId: doctorId || existingAttendance.doctorId,
      doctor_id: doctorId || existingAttendance.doctor_id,
      doctorName: doctorName,
      doctor_name: doctorName,
      shift: shift || existingAttendance.shift,
      type: type || existingAttendance.type,
      jenis: type || existingAttendance.jenis,
      date: date || existingAttendance.date,
      tanggal: date || existingAttendance.tanggal,
      time: time || existingAttendance.time,
      waktu: time || existingAttendance.waktu,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update attendance...')
    await kv.set(attendanceId, updatedAttendance)
    console.log('✅ Attendance updated successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi berhasil diperbarui',
      attendance: updatedAttendance
    })
    
  } catch (error) {
    console.log('💥 Error updating attendance:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data absensi: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/attendance/:id', async (c) => {
  console.log('📋 Delete attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    
    console.log('🗑️ Deleting attendance ID:', attendanceId)
    
    // Check if attendance exists
    const existingAttendance = await kv.get(attendanceId)
    if (!existingAttendance) {
      return c.json({
        success: false,
        error: 'Data absensi tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(attendanceId)
    console.log('✅ Attendance deleted successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting attendance:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus data absensi: ${error.message}`
    }, 500)
  }
})

// =============== EMPLOYEE ATTENDANCE ENDPOINTS ===============
app.get('/make-server-73417b67/employee-attendance', async (c) => {
  console.log('👥 Employee Attendance GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const url = new URL(c.req.url)
    const date = url.searchParams.get('date')
    const employeeId = url.searchParams.get('employeeId')
    const type = url.searchParams.get('type')
    
    let attendanceRecords = await kv.getByPrefix('employee_attendance_')
    
    // Apply filters if provided
    if (date) {
      attendanceRecords = attendanceRecords.filter(record => record.date === date)
    }
    if (employeeId) {
      attendanceRecords = attendanceRecords.filter(record => record.employeeId === employeeId)
    }
    if (type) {
      attendanceRecords = attendanceRecords.filter(record => record.type === type)
    }
    
    console.log(`📊 Found ${attendanceRecords.length} employee attendance records in database`)
    
    // Transform attendance data to match component interface
    const transformedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      employeeId: record.employeeId || record.employee_id || '',
      employeeName: record.employeeName || record.employee_name || 'Unknown Employee',
      position: record.position || 'Unknown Position',
      type: record.type || record.jenis || 'check-in',
      date: record.date || record.tanggal || new Date().toISOString().split('T')[0],
      time: record.time || record.waktu || '00:00',
      createdAt: record.createdAt || record.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedAttendance.length} employee attendance records`)
    
    return c.json({
      success: true,
      attendance: transformedAttendance
    })
    
  } catch (error) {
    console.log('💥 Error fetching employee attendance:', error)
    return c.json({
      success: false,
      error: error.message,
      attendance: []
    }, 500)
  }
})

app.post('/make-server-73417b67/employee-attendance', async (c) => {
  console.log('👥 Create employee attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Employee attendance data received:', body)
    
    const { employeeId, type, date, time } = body
    
    // Validate required fields
    if (!employeeId || !type || !date || !time) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'employeeId, type, date, dan time wajib diisi'
      }, 400)
    }
    
    // Get employee name from employees data
    const employees = await kv.getByPrefix('karyawan_')
    const employee = employees.find(emp => emp.id === employeeId)
    const employeeName = employee?.nama || employee?.name || 'Unknown Employee'
    const position = employee?.posisi || employee?.position || 'Unknown Position'
    
    console.log('✅ Validation passed for employee attendance')
    
    // Create attendance record
    const attendanceRecord = {
      id: `employee_attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      employeeId: employeeId,
      employee_id: employeeId,
      employeeName: employeeName,
      employee_name: employeeName,
      position: position,
      type: type,
      jenis: type,
      date: date,
      tanggal: date,
      time: time,
      waktu: time,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      createdBy: user.id,
      created_by: user.id
    }
    
    // Save to database
    console.log('💾 Attempting to save employee attendance to database...')
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Employee attendance saved successfully with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: 'Data absensi karyawan berhasil ditambahkan',
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating employee attendance:', error)
    return c.json({
      success: false,
      error: `Gagal menambahkan data absensi karyawan: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/employee-attendance/:id', async (c) => {
  console.log('👥 Update employee attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating employee attendance ID:', attendanceId)
    console.log('📋 Update data received:', body)
    
    // Get existing attendance
    const existingAttendance = await kv.get(attendanceId)
    if (!existingAttendance) {
      return c.json({
        success: false,
        error: 'Data absensi karyawan tidak ditemukan'
      }, 404)
    }
    
    const { employeeId, type, date, time } = body
    
    // Get employee data
    const employees = await kv.getByPrefix('karyawan_')
    const employee = employees.find(emp => emp.id === employeeId)
    const employeeName = employee?.nama || employee?.name || existingAttendance.employeeName
    const position = employee?.posisi || employee?.position || existingAttendance.position
    
    // Update attendance with new data
    const updatedAttendance = {
      ...existingAttendance,
      employeeId: employeeId || existingAttendance.employeeId,
      employee_id: employeeId || existingAttendance.employee_id,
      employeeName: employeeName,
      employee_name: employeeName,
      position: position,
      type: type || existingAttendance.type,
      jenis: type || existingAttendance.jenis,
      date: date || existingAttendance.date,
      tanggal: date || existingAttendance.tanggal,
      time: time || existingAttendance.time,
      waktu: time || existingAttendance.waktu,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedBy: user.id,
      updated_by: user.id
    }
    
    // Save to database
    console.log('💾 Attempting to update employee attendance...')
    await kv.set(attendanceId, updatedAttendance)
    console.log('✅ Employee attendance updated successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi karyawan berhasil diperbarui',
      attendance: updatedAttendance
    })
    
  } catch (error) {
    console.log('💥 Error updating employee attendance:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data absensi karyawan: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/employee-attendance/:id', async (c) => {
  console.log('👥 Delete employee attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    
    console.log('🗑️ Deleting employee attendance ID:', attendanceId)
    
    // Check if attendance exists
    const existingAttendance = await kv.get(attendanceId)
    if (!existingAttendance) {
      return c.json({
        success: false,
        error: 'Data absensi karyawan tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(attendanceId)
    console.log('✅ Employee attendance deleted successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi karyawan berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting employee attendance:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus data absensi karyawan: ${error.message}`
    }, 500)
  }
})

// =============== DOCTORS ENDPOINTS ===============
app.get('/make-server-73417b67/doctors', async (c) => {
  console.log('👨‍⚕️ Doctors GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const doctors = await kv.getByPrefix('dokter_')
    
    console.log(`📊 Found ${doctors.length} doctors in database`)
    
    // Transform doctors data
    const transformedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.nama || doctor.name || 'Unknown Doctor',
      specialization: doctor.spesialisasi || doctor.specialization || 'Dokter Gigi Umum',
      phone: doctor.telepon || doctor.phone || '',
      email: doctor.email || '',
      license: doctor.license || '',
      shift: doctor.shift || 'pagi',
      shifts: doctor.shifts || [doctor.shift || 'pagi'],
      status: doctor.status || 'aktif',
      created_at: doctor.created_at || new Date().toISOString()
    }))
    
    // Filter only active doctors
    const activeDoctors = transformedDoctors.filter(doctor => doctor.status === 'aktif')
    
    console.log(`✅ Returning ${activeDoctors.length} active doctors`)
    
    return c.json({
      success: true,
      doctors: activeDoctors
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

// =============== EMPLOYEES ENDPOINTS ===============
app.get('/make-server-73417b67/employees', async (c) => {
  console.log('👥 Employees GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const employees = await kv.getByPrefix('karyawan_')
    
    console.log(`📊 Found ${employees.length} employees in database`)
    
    // Transform employees data
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.nama || employee.name || 'Unknown Employee',
      position: employee.posisi || employee.position || 'Staff',
      phone: employee.telepon || employee.phone || '',
      email: employee.email || '',
      joinDate: employee.joinDate || employee.join_date || employee.tanggal_bergabung || '',
      baseSalary: employee.gaji_pokok || employee.baseSalary || 0,
      status: employee.status || 'aktif',
      isActive: employee.isActive !== undefined ? employee.isActive : (employee.status !== 'inactive'),
      authUserId: employee.authUserId || employee.auth_user_id || '',
      hasLoginAccess: employee.hasLoginAccess !== undefined ? employee.hasLoginAccess : true,
      created_at: employee.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedEmployees.length} employees`)
    
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

app.post('/make-server-73417b67/employees', async (c) => {
  console.log('👥 Create employee called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Employee data received:', { ...body, password: body.password ? '[HIDDEN]' : 'Not provided' })
    
    const { name, position, phone, email, password, joinDate, status } = body
    
    // Validate required fields
    if (!name || !email) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama dan email wajib diisi'
      }, 400)
    }
    
    if (!password || password.length < 6) {
      console.log('❌ Validation failed: Password too short')
      return c.json({
        success: false,
        error: 'Password minimal 6 karakter'
      }, 400)
    }
    
    console.log('✅ Validation passed for employee')
    
    // Create Supabase auth user for login access
    let authUserId = null
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        user_metadata: { 
          name: name.trim(),
          role: 'karyawan'
        },
        email_confirm: true
      })
      
      if (authError) {
        console.log('❌ Auth error:', authError.message)
        if (authError.message.includes('already') || authError.message.includes('registered')) {
          return c.json({
            success: false,
            error: 'Email sudah terdaftar. Silakan gunakan email lain.'
          }, 400)
        }
        throw authError
      }
      
      authUserId = authData.user.id
      console.log('✅ Auth user created:', authUserId)
    } catch (authError) {
      console.log('💥 Error creating auth user:', authError)
      return c.json({
        success: false,
        error: `Gagal membuat akun login: ${authError.message}`
      }, 500)
    }
    
    // Create employee record
    const employeeRecord = {
      id: `karyawan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      nama: name.trim(),
      name: name.trim(),
      posisi: position || 'Staff',
      position: position || 'Staff',
      telepon: phone || '',
      phone: phone || '',
      email: email.trim().toLowerCase(),
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      join_date: joinDate || new Date().toISOString().split('T')[0],
      tanggal_bergabung: joinDate || new Date().toISOString().split('T')[0],
      gaji_pokok: 0,
      baseSalary: 0,
      status: status || 'aktif',
      isActive: true,
      authUserId: authUserId,
      auth_user_id: authUserId,
      hasLoginAccess: true,
      role: 'karyawan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save employee to database...')
    await kv.set(employeeRecord.id, employeeRecord)
    console.log('✅ Employee saved successfully with ID:', employeeRecord.id)
    
    return c.json({
      success: true,
      message: `Karyawan ${name} berhasil ditambahkan dengan akses login Administrator`,
      employee: employeeRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating employee:', error)
    return c.json({
      success: false,
      error: `Gagal menambahkan karyawan: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/employees/:id', async (c) => {
  console.log('👥 Update employee called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const employeeId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating employee ID:', employeeId)
    console.log('📋 Update data received:', { ...body, password: body.password ? '[HIDDEN]' : 'Not provided' })
    
    // Get existing employee
    const existingEmployee = await kv.get(employeeId)
    if (!existingEmployee) {
      return c.json({
        success: false,
        error: 'Data karyawan tidak ditemukan'
      }, 404)
    }
    
    const { name, position, phone, email, password, joinDate, status } = body
    
    // Validate required fields
    if (!name || !email) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama dan email wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for employee update')
    
    // Update Supabase auth user if password is provided
    if (password && password.length >= 6) {
      try {
        if (existingEmployee.authUserId || existingEmployee.auth_user_id) {
          const authUserId = existingEmployee.authUserId || existingEmployee.auth_user_id
          const { error: authError } = await supabase.auth.admin.updateUserById(authUserId, {
            password: password,
            user_metadata: {
              name: name.trim(),
              role: 'karyawan'
            }
          })
          
          if (authError) {
            console.log('⚠️ Auth update error:', authError.message)
            // Don't fail the entire update if auth update fails
          } else {
            console.log('✅ Auth user password updated')
          }
        }
      } catch (authError) {
        console.log('⚠️ Error updating auth user:', authError)
        // Don't fail the entire update if auth update fails
      }
    }
    
    // Update employee record
    const updatedEmployee = {
      ...existingEmployee,
      nama: name.trim(),
      name: name.trim(),
      posisi: position || existingEmployee.posisi || 'Staff',
      position: position || existingEmployee.position || 'Staff',
      telepon: phone !== undefined ? phone : existingEmployee.telepon,
      phone: phone !== undefined ? phone : existingEmployee.phone,
      email: email.trim().toLowerCase(),
      joinDate: joinDate || existingEmployee.joinDate || existingEmployee.join_date,
      join_date: joinDate || existingEmployee.join_date || existingEmployee.joinDate,
      tanggal_bergabung: joinDate || existingEmployee.tanggal_bergabung || existingEmployee.joinDate,
      status: status || existingEmployee.status || 'aktif',
      isActive: status !== 'inactive',
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update employee...')
    await kv.set(employeeId, updatedEmployee)
    console.log('✅ Employee updated successfully')
    
    return c.json({
      success: true,
      message: `Data karyawan ${name} berhasil diperbarui`,
      employee: updatedEmployee
    })
    
  } catch (error) {
    console.log('💥 Error updating employee:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data karyawan: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/employees/:id', async (c) => {
  console.log('👥 Delete employee called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const employeeId = c.req.param('id')
    
    console.log('🗑️ Deleting employee ID:', employeeId)
    
    // Check if employee exists
    const existingEmployee = await kv.get(employeeId)
    if (!existingEmployee) {
      return c.json({
        success: false,
        error: 'Data karyawan tidak ditemukan'
      }, 404)
    }
    
    // Delete Supabase auth user if exists
    if (existingEmployee.authUserId || existingEmployee.auth_user_id) {
      try {
        const authUserId = existingEmployee.authUserId || existingEmployee.auth_user_id
        const { error: authError } = await supabase.auth.admin.deleteUser(authUserId)
        
        if (authError) {
          console.log('⚠️ Auth delete error:', authError.message)
          // Don't fail the entire delete if auth delete fails
        } else {
          console.log('✅ Auth user deleted')
        }
      } catch (authError) {
        console.log('⚠️ Error deleting auth user:', authError)
        // Don't fail the entire delete if auth delete fails
      }
    }
    
    // Delete from database
    await kv.del(employeeId)
    console.log('✅ Employee deleted successfully')
    
    return c.json({
      success: true,
      message: `Karyawan ${existingEmployee.nama || existingEmployee.name} berhasil dihapus`
    })
    
  } catch (error) {
    console.log('💥 Error deleting employee:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus karyawan: ${error.message}`
    }, 500)
  }
})

app.patch('/make-server-73417b67/employees/:id/status', async (c) => {
  console.log('👥 Update employee status called')
  
  try {
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const employeeId = c.req.param('id')
    const body = await c.req.json()
    const { isActive } = body
    
    console.log('📋 Updating employee status:', { employeeId, isActive })
    
    // Get existing employee
    const existingEmployee = await kv.get(employeeId)
    if (!existingEmployee) {
      return c.json({
        success: false,
        error: 'Data karyawan tidak ditemukan'
      }, 404)
    }
    
    // Update employee status
    const updatedEmployee = {
      ...existingEmployee,
      isActive: isActive,
      status: isActive ? 'aktif' : 'inactive',
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: user.id,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    await kv.set(employeeId, updatedEmployee)
    console.log('✅ Employee status updated successfully')
    
    return c.json({
      success: true,
      message: `Status karyawan ${existingEmployee.nama || existingEmployee.name} berhasil diubah menjadi ${isActive ? 'aktif' : 'non-aktif'}`,
      employee: updatedEmployee
    })
    
  } catch (error) {
    console.log('💥 Error updating employee status:', error)
    return c.json({
      success: false,
      error: `Gagal mengubah status karyawan: ${error.message}`
    }, 500)
  }
})

// =============== TREATMENTS ENDPOINTS ===============
app.get('/make-server-73417b67/treatments', async (c) => {
  console.log('🦷 Treatments GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const treatments = await kv.getByPrefix('treatment_')
    
    console.log(`📊 Found ${treatments.length} treatments in database`)
    
    // Transform treatments data
    const transformedTreatments = treatments.map(treatment => ({
      id: treatment.id,
      name: treatment.nama || treatment.name || 'Unknown Treatment',
      code: treatment.kode || treatment.code || '',
      category: treatment.kategori || treatment.category || 'Umum',
      basePrice: treatment.hargaDasar || treatment.basePrice || treatment.base_price || 0,
      doctorFee: treatment.feeDoktor || treatment.doctorFee || treatment.doctor_fee || 0,
      clinicFee: treatment.feeKlinik || treatment.clinicFee || treatment.clinic_fee || 0,
      description: treatment.deskripsi || treatment.description || '',
      duration: treatment.durasi || treatment.duration || 0,
      status: treatment.status || 'aktif',
      created_at: treatment.created_at || new Date().toISOString(),
      updated_at: treatment.updated_at || treatment.created_at || new Date().toISOString()
    }))
    
    // Filter only active treatments
    const activeTreatments = transformedTreatments.filter(treatment => treatment.status === 'aktif')
    
    console.log(`✅ Returning ${activeTreatments.length} active treatments`)
    
    return c.json({
      success: true,
      treatments: activeTreatments
    })
    
  } catch (error) {
    console.log('💥 Error fetching treatments:', error)
    return c.json({
      success: false,
      error: error.message,
      treatments: []
    }, 500)
  }
})

// =============== FEE SETTINGS ENDPOINTS ===============
app.get('/make-server-73417b67/fee-settings', async (c) => {
  console.log('💰 Fee Settings GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const feeSettings = await kv.getByPrefix('fee_setting_')
    
    console.log(`📊 Found ${feeSettings.length} fee settings in database`)
    
    // Transform fee settings data
    const transformedFeeSettings = feeSettings.map(setting => ({
      id: setting.id,
      treatmentId: setting.treatmentId || setting.treatment_id || '',
      treatmentName: setting.treatmentName || setting.treatment_name || 'Unknown Treatment',
      doctorId: setting.doctorId || setting.doctor_id || '',
      doctorName: setting.doctorName || setting.doctor_name || 'All Doctors',
      feeType: setting.feeType || setting.fee_type || 'percentage',
      feeValue: setting.feeValue || setting.fee_value || 0,
      isActive: setting.isActive !== undefined ? setting.isActive : setting.is_active !== undefined ? setting.is_active : true,
      notes: setting.notes || setting.catatan || '',
      created_at: setting.created_at || new Date().toISOString(),
      updated_at: setting.updated_at || setting.created_at || new Date().toISOString()
    }))
    
    // Filter only active settings
    const activeFeeSettings = transformedFeeSettings.filter(setting => setting.isActive)
    
    console.log(`✅ Returning ${activeFeeSettings.length} active fee settings`)
    
    return c.json({
      success: true,
      feeSettings: activeFeeSettings
    })
    
  } catch (error) {
    console.log('💥 Error fetching fee settings:', error)
    return c.json({
      success: false,
      error: error.message,
      feeSettings: []
    }, 500)
  }
})

// =============== ATTENDANCE ENDPOINTS ===============
app.get('/make-server-73417b67/attendance', async (c) => {
  console.log('🕒 Attendance GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const attendance = await kv.getByPrefix('attendance_')
    
    console.log(`📊 Found ${attendance.length} attendance records in database`)
    
    // Transform attendance data
    const transformedAttendance = attendance.map(att => ({
      id: att.id,
      doctorId: att.doctorId || att.doctor_id || '',
      doctorName: att.doctorName || att.doctor_name || 'Unknown Doctor',
      shift: att.shift || 'pagi',
      type: att.type || 'check-in',
      date: att.date || new Date().toISOString().split('T')[0],
      time: att.time || '00:00',
      created_at: att.created_at || new Date().toISOString(),
      updated_at: att.updated_at || att.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedAttendance.length} attendance records`)
    
    return c.json({
      success: true,
      attendance: transformedAttendance
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
  console.log('🕒 Create attendance called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Attendance data received:', body)
    
    const { doctorId, shift, type, date, time } = body
    
    // Validate required fields
    if (!doctorId || !shift || !type || !date || !time) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Dokter, shift, jenis absensi, tanggal, dan waktu wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for attendance')
    
    // Get doctor name
    let doctorName = 'Unknown Doctor'
    try {
      const doctors = await kv.getByPrefix('dokter_')
      const doctor = doctors.find(d => d.id === doctorId)
      if (doctor) {
        doctorName = doctor.nama || doctor.name || 'Unknown Doctor'
      }
    } catch (error) {
      console.log('⚠️ Could not fetch doctor name:', error)
    }
    
    // Create attendance record
    const attendanceRecord = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      doctor_id: doctorId,
      doctorName: doctorName,
      doctor_name: doctorName,
      shift: shift,
      type: type,
      date: date,
      time: time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save attendance to database...')
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Attendance saved successfully with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: 'Absensi berhasil dicatat',
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating attendance:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat absensi: ${error.message}`
    }, 500)
  }
})

// =============== PATIENTS ENDPOINTS ===============
app.get('/make-server-73417b67/patients', async (c) => {
  console.log('👥 Patients GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const patients = await kv.getByPrefix('patient_')
    
    console.log(`📊 Found ${patients.length} patients in database`)
    
    // Transform patients data with proper field mapping
    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.nama || patient.name || '',
      phone: patient.telepon || patient.phone || '',
      address: patient.alamat || patient.address || '',
      birthDate: patient.tanggalLahir || patient.birthDate || patient.birth_date || '',
      gender: patient.jenisKelamin || patient.gender || '',
      bloodType: patient.golonganDarah || patient.bloodType || patient.blood_type || '',
      allergies: patient.alergi || patient.allergies || '',
      emergencyContact: patient.kontakDarurat || patient.emergencyContact || patient.emergency_contact || '',
      emergencyPhone: patient.teleponDarurat || patient.emergencyPhone || patient.emergency_phone || '',
      registrationDate: patient.tanggalDaftar || patient.registrationDate || patient.registration_date || patient.created_at || new Date().toISOString(),
      medicalRecordNumber: patient.nomorRekamMedis || patient.medicalRecordNumber || patient.medical_record_number || '',
      created_at: patient.created_at || new Date().toISOString()
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

app.post('/make-server-73417b67/patients', async (c) => {
  console.log('👥 Create patient called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Patient data received:', body)
    
    const { 
      name, 
      phone, 
      address, 
      birthDate, 
      gender, 
      bloodType, 
      allergies, 
      emergencyContact, 
      emergencyPhone,
      registrationDate
    } = body
    
    // Validate required fields
    if (!name || !phone || !address || !birthDate || !gender) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama, telepon, alamat, tanggal lahir, dan jenis kelamin wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for patient')
    
    // Generate medical record number
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    // Get existing patients to calculate sequence
    const existingPatients = await kv.getByPrefix('patient_')
    const todayPatients = existingPatients.filter(p => {
      const regDate = new Date(p.tanggalDaftar || p.registrationDate || p.created_at)
      return regDate.toDateString() === now.toDateString()
    })
    
    const sequence = String(todayPatients.length + 1).padStart(3, '0')
    const medicalRecordNumber = `RM-${year}${month}${day}-${sequence}`
    
    // Create patient record with dual field names for compatibility
    const patientRecord = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      // Indonesian field names
      nama: name.trim(),
      telepon: phone.trim(),
      alamat: address.trim(),
      tanggalLahir: birthDate,
      jenisKelamin: gender,
      golonganDarah: bloodType || '',
      alergi: allergies || '',
      kontakDarurat: emergencyContact || '',
      teleponDarurat: emergencyPhone || '',
      tanggalDaftar: registrationDate || new Date().toISOString(),
      nomorRekamMedis: medicalRecordNumber,
      // English field names for compatibility
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      birthDate: birthDate,
      gender: gender,
      bloodType: bloodType || '',
      allergies: allergies || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      registrationDate: registrationDate || new Date().toISOString(),
      medicalRecordNumber: medicalRecordNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save patient to database...')
    await kv.set(patientRecord.id, patientRecord)
    console.log('✅ Patient saved successfully with ID:', patientRecord.id)
    
    return c.json({
      success: true,
      message: 'Pasien berhasil ditambahkan',
      patient: patientRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating patient:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan data pasien: ${error.message}`
    }, 500)
  }
})

app.put('/make-server-73417b67/patients/:id', async (c) => {
  console.log('👥 Update patient called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const patientId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating patient ID:', patientId)
    
    // Get existing patient
    const existingPatients = await kv.getByPrefix('patient_')
    const existingPatient = existingPatients.find(p => p.id === patientId)
    
    if (!existingPatient) {
      return c.json({
        success: false,
        error: 'Data pasien tidak ditemukan'
      }, 404)
    }
    
    const { 
      name, 
      phone, 
      address, 
      birthDate, 
      gender, 
      bloodType, 
      allergies, 
      emergencyContact, 
      emergencyPhone
    } = body
    
    // Update patient with new data, maintaining dual field names
    const updatedPatient = {
      ...existingPatient,
      // Indonesian field names
      nama: name || existingPatient.nama,
      telepon: phone || existingPatient.telepon,
      alamat: address || existingPatient.alamat,
      tanggalLahir: birthDate || existingPatient.tanggalLahir,
      jenisKelamin: gender || existingPatient.jenisKelamin,
      golonganDarah: bloodType !== undefined ? bloodType : existingPatient.golonganDarah,
      alergi: allergies !== undefined ? allergies : existingPatient.alergi,
      kontakDarurat: emergencyContact !== undefined ? emergencyContact : existingPatient.kontakDarurat,
      teleponDarurat: emergencyPhone !== undefined ? emergencyPhone : existingPatient.teleponDarurat,
      // English field names for compatibility
      name: name || existingPatient.name || existingPatient.nama,
      phone: phone || existingPatient.phone || existingPatient.telepon,
      address: address || existingPatient.address || existingPatient.alamat,
      birthDate: birthDate || existingPatient.birthDate || existingPatient.tanggalLahir,
      gender: gender || existingPatient.gender || existingPatient.jenisKelamin,
      bloodType: bloodType !== undefined ? bloodType : (existingPatient.bloodType || existingPatient.golonganDarah),
      allergies: allergies !== undefined ? allergies : (existingPatient.allergies || existingPatient.alergi),
      emergencyContact: emergencyContact !== undefined ? emergencyContact : (existingPatient.emergencyContact || existingPatient.kontakDarurat),
      emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : (existingPatient.emergencyPhone || existingPatient.teleponDarurat),
      updated_at: new Date().toISOString()
    }
    
    // Save updated patient
    console.log('💾 Attempting to update patient in database...')
    await kv.set(patientId, updatedPatient)
    console.log('✅ Patient updated successfully')
    
    return c.json({
      success: true,
      message: 'Data pasien berhasil diperbarui',
      patient: updatedPatient
    })
    
  } catch (error) {
    console.log('💥 Error updating patient:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data pasien: ${error.message}`
    }, 500)
  }
})

// =============== CONTROL SCHEDULES ENDPOINTS ===============
app.get('/make-server-73417b67/control-schedules', async (c) => {
  console.log('📅 Control Schedules GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const schedules = await kv.getByPrefix('control_schedule_')
    
    console.log(`📊 Found ${schedules.length} control schedules in database`)
    
    // Transform control schedules data
    const transformedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      patientId: schedule.patientId || schedule.patient_id || '',
      patientName: schedule.patientName || schedule.patient_name || 'Unknown Patient',
      treatmentId: schedule.treatmentId || schedule.treatment_id || '',
      treatmentName: schedule.treatmentName || schedule.treatment_name || 'Unknown Treatment',
      doctorId: schedule.doctorId || schedule.doctor_id || '',
      doctorName: schedule.doctorName || schedule.doctor_name || 'Unknown Doctor',
      scheduledDate: schedule.scheduledDate || schedule.scheduled_date || '',
      scheduledTime: schedule.scheduledTime || schedule.scheduled_time || '',
      notes: schedule.notes || schedule.catatan || '',
      status: schedule.status || 'scheduled',
      created_at: schedule.created_at || new Date().toISOString(),
      updated_at: schedule.updated_at || schedule.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedSchedules.length} control schedules`)
    
    return c.json({
      success: true,
      schedules: transformedSchedules
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

// =============== EMPLOYEES ENDPOINTS ===============
app.get('/make-server-73417b67/employees', async (c) => {
  console.log('👥 Employees GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const employees = await kv.getByPrefix('karyawan_')
    
    console.log(`📊 Found ${employees.length} employees in database`)
    
    // Transform employees data
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.nama || employee.name || 'Unknown Employee',
      position: employee.posisi || employee.position || 'Staff',
      phone: employee.telepon || employee.phone || '',
      email: employee.email || '',
      address: employee.alamat || employee.address || '',
      salary: employee.gaji_pokok || employee.salary || 0,
      startDate: employee.tanggal_mulai || employee.startDate || employee.start_date || '',
      status: employee.status || 'aktif',
      created_at: employee.created_at || new Date().toISOString(),
      updated_at: employee.updated_at || employee.created_at || new Date().toISOString()
    }))
    
    // Filter only active employees
    const activeEmployees = transformedEmployees.filter(employee => employee.status === 'aktif')
    
    console.log(`✅ Returning ${activeEmployees.length} active employees`)
    
    return c.json({
      success: true,
      employees: activeEmployees
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

app.post('/make-server-73417b67/employees', async (c) => {
  console.log('👥 Create employee called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Employee data received:', body)
    
    const { 
      name, 
      position, 
      phone, 
      email, 
      address, 
      salary,
      startDate
    } = body
    
    // Validate required fields
    if (!name || !position) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Nama dan posisi wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for employee')
    
    // Create employee record with dual field names for compatibility
    const employeeRecord = {
      id: `karyawan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      // Indonesian field names
      nama: name.trim(),
      posisi: position.trim(),
      telepon: phone || '',
      email: email || '',
      alamat: address || '',
      gaji_pokok: salary || 0,
      tanggal_mulai: startDate || new Date().toISOString(),
      status: 'aktif',
      // English field names for compatibility
      name: name.trim(),
      position: position.trim(),
      phone: phone || '',
      address: address || '',
      salary: salary || 0,
      startDate: startDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save employee to database...')
    await kv.set(employeeRecord.id, employeeRecord)
    console.log('✅ Employee saved successfully with ID:', employeeRecord.id)
    
    return c.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      employee: employeeRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating employee:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan data karyawan: ${error.message}`
    }, 500)
  }
})

// =============== SITTING FEES ENDPOINTS ===============
app.get('/make-server-73417b67/sitting-fees', async (c) => {
  console.log('💰 Sitting Fees GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const sittingFees = await kv.getByPrefix('sitting_fee_')
    
    console.log(`📊 Found ${sittingFees.length} sitting fees records in database`)
    
    // Transform sitting fees data
    const transformedSittingFees = sittingFees.map(fee => ({
      id: fee.id,
      doctorId: fee.doctorId || fee.doctor_id || '',
      doctorName: fee.doctorName || fee.doctor_name || 'Unknown Doctor',
      date: fee.date || fee.tanggal || '',
      shift: fee.shift || 'pagi',
      amount: fee.amount || fee.jumlah || 0,
      hoursWorked: fee.hoursWorked || fee.hours_worked || fee.jam_kerja || 0,
      baseRate: fee.baseRate || fee.base_rate || fee.tarif_dasar || 0,
      notes: fee.notes || fee.catatan || '',
      status: fee.status || 'pending',
      created_at: fee.created_at || new Date().toISOString(),
      updated_at: fee.updated_at || fee.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedSittingFees.length} sitting fees records`)
    
    return c.json({
      success: true,
      sittingFees: transformedSittingFees
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
  console.log('💰 Create sitting fee called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Sitting fee data received:', body)
    
    const { 
      doctorId, 
      date, 
      shift, 
      amount, 
      hoursWorked, 
      baseRate, 
      notes 
    } = body
    
    // Validate required fields
    if (!doctorId || !date || !shift || !amount) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Dokter, tanggal, shift, dan jumlah wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for sitting fee')
    
    // Get doctor name
    let doctorName = 'Unknown Doctor'
    try {
      const doctors = await kv.getByPrefix('dokter_')
      const doctor = doctors.find(d => d.id === doctorId)
      if (doctor) {
        doctorName = doctor.nama || doctor.name || 'Unknown Doctor'
      }
    } catch (error) {
      console.log('⚠️ Could not fetch doctor name:', error)
    }
    
    // Create sitting fee record
    const sittingFeeRecord = {
      id: `sitting_fee_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      doctor_id: doctorId,
      doctorName: doctorName,
      doctor_name: doctorName,
      date: date,
      tanggal: date,
      shift: shift,
      amount: amount,
      jumlah: amount,
      hoursWorked: hoursWorked || 0,
      hours_worked: hoursWorked || 0,
      jam_kerja: hoursWorked || 0,
      baseRate: baseRate || 0,
      base_rate: baseRate || 0,
      tarif_dasar: baseRate || 0,
      notes: notes || '',
      catatan: notes || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save sitting fee to database...')
    await kv.set(sittingFeeRecord.id, sittingFeeRecord)
    console.log('✅ Sitting fee saved successfully with ID:', sittingFeeRecord.id)
    
    return c.json({
      success: true,
      message: 'Uang duduk berhasil dicatat',
      sittingFee: sittingFeeRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating sitting fee:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat uang duduk: ${error.message}`
    }, 500)
  }
})

// =============== SITTING FEE SETTINGS ENDPOINTS ===============
app.get('/make-server-73417b67/sitting-fee-settings', async (c) => {
  console.log('⚙️ Sitting Fee Settings GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const settings = await kv.getByPrefix('sitting_fee_setting_')
    
    console.log(`📊 Found ${settings.length} sitting fee settings in database`)
    
    // Transform sitting fee settings data
    const transformedSettings = settings.map(setting => ({
      id: setting.id,
      doctorId: setting.doctorId || setting.doctor_id || '',
      doctorName: setting.doctorName || setting.doctor_name || 'All Doctors',
      shift: setting.shift || 'all',
      baseRate: setting.baseRate || setting.base_rate || setting.tarif_dasar || 0,
      overtimeMultiplier: setting.overtimeMultiplier || setting.overtime_multiplier || setting.pengali_lembur || 1.0,
      minimumHours: setting.minimumHours || setting.minimum_hours || setting.jam_minimum || 0,
      maximumHours: setting.maximumHours || setting.maximum_hours || setting.jam_maksimum || 24,
      isActive: setting.isActive !== undefined ? setting.isActive : setting.is_active !== undefined ? setting.is_active : true,
      notes: setting.notes || setting.catatan || '',
      created_at: setting.created_at || new Date().toISOString(),
      updated_at: setting.updated_at || setting.created_at || new Date().toISOString()
    }))
    
    // Filter only active settings
    const activeSettings = transformedSettings.filter(setting => setting.isActive)
    
    console.log(`✅ Returning ${activeSettings.length} active sitting fee settings`)
    
    return c.json({
      success: true,
      settings: activeSettings
    })
    
  } catch (error) {
    console.log('💥 Error fetching sitting fee settings:', error)
    return c.json({
      success: false,
      error: error.message,
      settings: []
    }, 500)
  }
})

app.post('/make-server-73417b67/sitting-fee-settings', async (c) => {
  console.log('⚙️ Create sitting fee setting called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Sitting fee setting data received:', body)
    
    const { 
      doctorId, 
      shift, 
      baseRate, 
      overtimeMultiplier, 
      minimumHours, 
      maximumHours, 
      notes 
    } = body
    
    // Validate required fields
    if (!baseRate || baseRate <= 0) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Tarif dasar wajib diisi dan harus lebih dari 0'
      }, 400)
    }
    
    console.log('✅ Validation passed for sitting fee setting')
    
    // Get doctor name if doctorId is provided
    let doctorName = 'All Doctors'
    if (doctorId) {
      try {
        const doctors = await kv.getByPrefix('dokter_')
        const doctor = doctors.find(d => d.id === doctorId)
        if (doctor) {
          doctorName = doctor.nama || doctor.name || 'Unknown Doctor'
        }
      } catch (error) {
        console.log('⚠️ Could not fetch doctor name:', error)
      }
    }
    
    // Create sitting fee setting record
    const settingRecord = {
      id: `sitting_fee_setting_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId || '',
      doctor_id: doctorId || '',
      doctorName: doctorName,
      doctor_name: doctorName,
      shift: shift || 'all',
      baseRate: baseRate,
      base_rate: baseRate,
      tarif_dasar: baseRate,
      overtimeMultiplier: overtimeMultiplier || 1.0,
      overtime_multiplier: overtimeMultiplier || 1.0,
      pengali_lembur: overtimeMultiplier || 1.0,
      minimumHours: minimumHours || 0,
      minimum_hours: minimumHours || 0,
      jam_minimum: minimumHours || 0,
      maximumHours: maximumHours || 24,
      maximum_hours: maximumHours || 24,
      jam_maksimum: maximumHours || 24,
      isActive: true,
      is_active: true,
      notes: notes || '',
      catatan: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save sitting fee setting to database...')
    await kv.set(settingRecord.id, settingRecord)
    console.log('✅ Sitting fee setting saved successfully with ID:', settingRecord.id)
    
    return c.json({
      success: true,
      message: 'Pengaturan uang duduk berhasil disimpan',
      setting: settingRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating sitting fee setting:', error)
    return c.json({
      success: false,
      error: `Gagal menyimpan pengaturan uang duduk: ${error.message}`
    }, 500)
  }
})

// =============== X-RAY IMAGE ENDPOINTS ===============
app.get('/make-server-73417b67/xray-images', async (c) => {
  console.log('📷 X-ray images GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const patientId = c.req.query('patientId')
    
    console.log(`📊 Fetching X-ray images for patient: ${patientId || 'all'}`)
    
    const allImages = await kv.getByPrefix('xray_image_')
    
    // Filter by patient if patientId is provided
    const filteredImages = patientId 
      ? allImages.filter(image => image.patientId === patientId || image.patient_id === patientId)
      : allImages
    
    // Transform X-ray images data
    const transformedImages = filteredImages.map(image => ({
      id: image.id,
      patientId: image.patientId || image.patient_id || '',
      patientName: image.patientName || image.patient_name || 'Unknown Patient',
      fileName: image.fileName || image.file_name || 'unknown.jpg',
      fileUrl: image.fileUrl || image.file_url || '',
      uploadDate: image.uploadDate || image.upload_date || image.created_at || new Date().toISOString().split('T')[0],
      description: image.description || image.deskripsi || '',
      type: image.type || image.jenis || 'other',
      created_at: image.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedImages.length} X-ray images`)
    
    return c.json({
      success: true,
      images: transformedImages
    })
    
  } catch (error) {
    console.log('💥 Error fetching X-ray images:', error)
    return c.json({
      success: false,
      error: error.message,
      images: []
    }, 500)
  }
})

app.post('/make-server-73417b67/xray-upload', async (c) => {
  console.log('📷 X-ray upload endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    
    // Get form data
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string
    const patientName = formData.get('patientName') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    
    console.log('📋 X-ray upload data received:', {
      fileName: file?.name,
      patientId,
      patientName,
      description,
      type,
      fileSize: file?.size
    })
    
    // Validate required fields
    if (!file || !patientId || !patientName) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'File, ID pasien, dan nama pasien wajib diisi'
      }, 400)
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File size too large:', file.size)
      return c.json({
        success: false,
        error: 'Ukuran file maksimal 10MB'
      }, 400)
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type)
      return c.json({
        success: false,
        error: 'File harus berupa gambar'
      }, 400)
    }
    
    console.log('✅ Validation passed for X-ray upload')
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 6)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFileName = `xray_${patientId}_${timestamp}_${randomId}.${fileExtension}`
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)
    
    // For now, we'll store file info in KV and simulate file storage
    // In production, you would upload to Supabase Storage or similar
    const xrayRecord = {
      id: `xray_image_${timestamp}_${randomId}`,
      // English field names
      patientId: patientId,
      patientName: patientName,
      fileName: uniqueFileName,
      originalFileName: file.name,
      fileUrl: `/storage/xray/${uniqueFileName}`, // Simulated URL
      uploadDate: new Date().toISOString().split('T')[0],
      description: description || '',
      type: type || 'other',
      fileSize: file.size,
      mimeType: file.type,
      // Indonesian field names for compatibility
      patient_id: patientId,
      patient_name: patientName,
      file_name: uniqueFileName,
      file_url: `/storage/xray/${uniqueFileName}`,
      upload_date: new Date().toISOString().split('T')[0],
      deskripsi: description || '',
      jenis: type || 'other',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save X-ray record to database...')
    await kv.set(xrayRecord.id, xrayRecord)
    console.log('✅ X-ray record saved successfully with ID:', xrayRecord.id)
    
    // TODO: In production, implement actual file storage
    console.log('⚠️ Note: File storage not implemented - only metadata saved')
    
    return c.json({
      success: true,
      message: 'X-ray berhasil diupload',
      image: xrayRecord
    })
    
  } catch (error) {
    console.log('💥 Error uploading X-ray:', error)
    return c.json({
      success: false,
      error: `Gagal upload X-ray: ${error.message}`
    }, 500)
  }
})

app.delete('/make-server-73417b67/xray-images/:id', async (c) => {
  console.log('📷 Delete X-ray image called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const imageId = c.req.param('id')
    
    console.log('🗑️ Deleting X-ray image ID:', imageId)
    
    // Check if X-ray image exists
    const existingImages = await kv.getByPrefix('xray_image_')
    const existingImage = existingImages.find(img => img.id === imageId)
    
    if (!existingImage) {
      return c.json({
        success: false,
        error: 'Gambar X-ray tidak ditemukan'
      }, 404)
    }
    
    // Delete X-ray image record
    await kv.del(imageId)
    console.log('✅ X-ray image deleted:', imageId)
    
    // TODO: In production, also delete the actual file from storage
    
    return c.json({
      success: true,
      message: 'Gambar X-ray berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting X-ray image:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus gambar X-ray: ${error.message}`
    }, 500)
  }
})

// =============== MEDICAL RECORDS ENDPOINTS ===============
app.get('/make-server-73417b67/medical-records', async (c) => {
  console.log('📋 Medical Records GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const records = await kv.getByPrefix('medical_record_')
    
    console.log(`📊 Found ${records.length} medical records in database`)
    
    // Transform medical records data
    const transformedRecords = records.map(record => ({
      id: record.id,
      patientId: record.patientId || record.patient_id || '',
      patientName: record.patientName || record.patient_name || 'Unknown Patient',
      treatmentId: record.treatmentId || record.treatment_id || '',
      treatmentName: record.treatmentName || record.treatment_name || 'Unknown Treatment',
      doctorId: record.doctorId || record.doctor_id || '',
      doctorName: record.doctorName || record.doctor_name || 'Unknown Doctor',
      treatmentDate: record.treatmentDate || record.treatment_date || '',
      diagnosis: record.diagnosis || record.diagnosa || '',
      treatment: record.treatment || record.tindakan || '',
      notes: record.notes || record.catatan || '',
      totalCost: record.totalCost || record.total_cost || 0,
      paymentStatus: record.paymentStatus || record.payment_status || 'pending',
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || record.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedRecords.length} medical records`)
    
    return c.json({
      success: true,
      records: transformedRecords
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

// =============== START SERVER ===============
console.log('🚀 Starting Falasifah Dental Clinic Server...')
console.log('🌐 All endpoints are ready with prefix: /make-server-73417b67')
console.log('📋 Available endpoints:')
console.log('  - GET /health')
console.log('  - POST /register')
console.log('  - POST /verify-user') 
console.log('  - GET /clinic-settings')
console.log('  - GET /products')
console.log('  - GET /treatment-products')
console.log('  - GET /medication-products')
console.log('  - GET /doctors')
console.log('  - GET /treatments')
console.log('  - GET /fee-settings')
console.log('  - GET /attendance')
console.log('  - POST /attendance')
console.log('  - GET /patients')
console.log('  - POST /patients')
console.log('  - PUT /patients/:id')
console.log('  - GET /employees')
console.log('  - POST /employees')
console.log('  - GET /sitting-fees')
console.log('  - POST /sitting-fees')
console.log('  - GET /sitting-fee-settings')
console.log('  - POST /sitting-fee-settings')
console.log('  - GET /doctor-sitting-fee-settings')
console.log('  - POST /doctor-sitting-fee-settings')
console.log('  - PUT /doctor-sitting-fee-settings/:id')
console.log('  - DELETE /doctor-sitting-fee-settings/:id')
console.log('  - GET /doctor-sitting-fee/:doctorId/:shift')
console.log('  - GET /control-schedules')
console.log('  - GET /medical-records')

// =============== DOCTOR ATTENDANCE ENDPOINTS ===============
app.get('/make-server-73417b67/doctor-attendance', async (c) => {
  console.log('👨‍⚕️ Doctor Attendance GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    
    // Get all attendance records with dual prefix support
    const attendanceRecords = await kv.getByPrefix('doctor_attendance_')
    
    console.log(`📊 Found ${attendanceRecords.length} doctor attendance records in database`)
    
    // Transform attendance data to match component interface
    const transformedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      doctorId: record.doctorId || record.doctor_id || '',
      doctorName: record.doctorName || record.doctor_name || 'Unknown Doctor',
      date: record.date || record.tanggal || new Date().toISOString().split('T')[0],
      shift: record.shift || 'pagi',
      status: record.status || 'tidak_hadir',
      loginTime: record.loginTime || record.login_time || '',
      logoutTime: record.logoutTime || record.logout_time || '',
      notes: record.notes || record.catatan || '',
      createdAt: record.createdAt || record.created_at || new Date().toISOString()
    }))
    
    console.log(`✅ Returning ${transformedAttendance.length} doctor attendance records`)
    
    return c.json({
      success: true,
      attendance: transformedAttendance
    })
    
  } catch (error) {
    console.log('💥 Error fetching doctor attendance:', error)
    return c.json({
      success: false,
      error: error.message,
      attendance: []
    }, 500)
  }
})

app.post('/make-server-73417b67/doctor-attendance', async (c) => {
  console.log('👨‍⚕️ Doctor Attendance POST endpoint called')
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    console.log('📋 Doctor attendance data received:', body)
    
    const { doctorId, doctorName, date, shift, status, loginTime, logoutTime, notes } = body
    
    // Validate required fields
    if (!doctorId || !date || !shift || !status) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Doctor ID, tanggal, shift, dan status wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for doctor attendance')
    
    // Create attendance record with dual field names for compatibility
    const attendanceRecord = {
      id: `doctor_attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      // English field names
      doctorId: doctorId.trim(),
      doctorName: doctorName || 'Unknown Doctor',
      date: date,
      shift: shift,
      status: status,
      loginTime: loginTime || '',
      logoutTime: logoutTime || '',
      notes: notes || '',
      // Indonesian field names for compatibility
      doctor_id: doctorId.trim(),
      doctor_name: doctorName || 'Unknown Doctor',
      tanggal: date,
      shift: shift,
      status: status,
      login_time: loginTime || '',
      logout_time: logoutTime || '',
      catatan: notes || '',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save doctor attendance to database...')
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Doctor attendance saved successfully with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: 'Absensi dokter berhasil dicatat',
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating doctor attendance:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat absensi dokter: ${error.message}`
    }, 500)
  }
})

console.log('  - GET /doctor-attendance')
console.log('  - POST /doctor-attendance')

// Add debug endpoint to list all routes
app.get('/make-server-73417b67/debug/routes', async (c) => {
  return c.json({
    success: true,
    message: 'Available routes',
    routes: [
      'GET /make-server-73417b67/vouchers',
      'POST /make-server-73417b67/vouchers', 
      'PUT /make-server-73417b67/vouchers/:id',
      'DELETE /make-server-73417b67/vouchers/:id',
      'GET /make-server-73417b67/health/vouchers',
      'GET /make-server-73417b67/test-vouchers',
      'GET /make-server-73417b67/debug/routes'
    ],
    timestamp: new Date().toISOString()
  })
})

// =============== ATTENDANCE ENDPOINTS WITH DUPLICATE PREVENTION ===============
console.log('📝 Adding attendance endpoints with duplicate prevention...')

// Get attendance records
app.get('/make-server-73417b67/attendance', async (c) => {
  console.log('📝 Attendance GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const attendance = await kv.getByPrefix('attendance_')
    
    console.log(`📊 Found ${attendance.length} attendance records in database`)
    
    // Transform attendance data
    const transformedAttendance = attendance.map(record => ({
      id: record.id,
      doctorId: record.doctorId || record.doctor_id || '',
      doctorName: record.doctorName || record.doctor_name || 'Unknown Doctor',
      shift: record.shift || '09:00-15:00',
      type: record.type || record.jenis || 'check-in',
      date: record.date || record.tanggal || new Date().toISOString().split('T')[0],
      time: record.time || record.waktu || '00:00',
      status: record.status || 'present',
      notes: record.notes || record.catatan || '',
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || record.created_at || new Date().toISOString()
    }))
    
    // Sort by date and time (newest first)
    const sortedAttendance = transformedAttendance.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime()
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime()
      return dateTimeB - dateTimeA
    })
    
    console.log(`✅ Returning ${sortedAttendance.length} attendance records`)
    
    return c.json({
      success: true,
      attendance: sortedAttendance
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

// Create attendance with duplicate prevention
app.post('/make-server-73417b67/attendance', async (c) => {
  console.log('📝 Create attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    
    console.log('📋 Attendance data received:', body)
    
    const { 
      doctorId, 
      doctorName, 
      shift,
      type, 
      date, 
      time,
      notes 
    } = body
    
    // Validate required fields
    if (!doctorId || !shift || !type) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Dokter, shift, dan jenis absensi wajib diisi'
      }, 400)
    }
    
    // Get today's date if not provided
    const attendanceDate = date || new Date().toISOString().split('T')[0]
    const attendanceTime = time || new Date().toLocaleTimeString('id-ID', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    console.log('🔍 Checking for duplicate attendance...')
    console.log(`Checking: Doctor ${doctorId}, Date ${attendanceDate}, Shift ${shift}, Type ${type}`)
    
    // Get all existing attendance records
    const existingAttendance = await kv.getByPrefix('attendance_')
    
    // Check for existing attendance for the same doctor, date, shift, and type
    const duplicateCheck = existingAttendance.filter(record => {
      const recordDoctorId = record.doctorId || record.doctor_id
      const recordDate = record.date || record.tanggal
      const recordShift = record.shift
      const recordType = record.type || record.jenis
      
      const isDuplicate = recordDoctorId === doctorId && 
             recordDate === attendanceDate && 
             recordShift === shift && 
             recordType === type
      
      if (isDuplicate) {
        console.log('🚨 DUPLICATE FOUND:', {
          existing: { doctorId: recordDoctorId, date: recordDate, shift: recordShift, type: recordType },
          new: { doctorId, date: attendanceDate, shift, type }
        })
      }
      
      return isDuplicate
    })
    
    if (duplicateCheck.length > 0) {
      console.log('❌ Duplicate attendance found:', duplicateCheck[0])
      const duplicateRecord = duplicateCheck[0]
      const existingTime = duplicateRecord.time || duplicateRecord.waktu || '00:00'
      const doctorNameForError = duplicateRecord.doctorName || duplicateRecord.doctor_name || 'dokter ini'
      
      return c.json({
        success: false,
        error: `❌ ${doctorNameForError} sudah melakukan absensi ${type === 'check-in' ? 'masuk' : 'pulang'} pada tanggal ${attendanceDate}, shift ${shift} jam ${existingTime}. Tidak dapat melakukan absensi ${type === 'check-in' ? 'masuk' : 'pulang'} lagi!`,
        duplicate: true,
        existingRecord: {
          date: duplicateRecord.date || duplicateRecord.tanggal,
          time: existingTime,
          type: duplicateRecord.type || duplicateRecord.jenis,
          shift: duplicateRecord.shift,
          doctorName: duplicateRecord.doctorName || duplicateRecord.doctor_name
        }
      }, 409) // 409 Conflict
    }
    
    // For check-out, ensure check-in exists first
    if (type === 'check-out') {
      const checkInExists = existingAttendance.some(record => {
        const recordDoctorId = record.doctorId || record.doctor_id
        const recordDate = record.date || record.tanggal
        const recordShift = record.shift
        const recordType = record.type || record.jenis
        
        return recordDoctorId === doctorId && 
               recordDate === attendanceDate && 
               recordShift === shift && 
               recordType === 'check-in'
      })
      
      if (!checkInExists) {
        console.log('❌ No check-in found for check-out')
        return c.json({
          success: false,
          error: `❌ Belum ada absensi masuk untuk dokter ini pada tanggal ${attendanceDate}, shift ${shift}. Harus absen masuk terlebih dahulu!`
        }, 400)
      }
    }
    
    console.log('✅ Validation passed - no duplicate found')
    
    // Get doctor name if not provided
    let finalDoctorName = doctorName
    if (!finalDoctorName) {
      try {
        const doctors = await kv.getByPrefix('dokter_')
        const doctor = doctors.find(d => d.id === doctorId)
        if (doctor) {
          finalDoctorName = doctor.nama || doctor.name || 'Unknown Doctor'
        }
      } catch (error) {
        console.log('⚠️ Could not fetch doctor name:', error)
        finalDoctorName = 'Unknown Doctor'
      }
    }
    
    // Create attendance record
    const attendanceRecord = {
      id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      doctorId: doctorId,
      doctor_id: doctorId,
      doctorName: finalDoctorName,
      doctor_name: finalDoctorName,
      shift: shift,
      type: type,
      jenis: type,
      date: attendanceDate,
      tanggal: attendanceDate,
      time: attendanceTime,
      waktu: attendanceTime,
      status: 'present',
      notes: notes || '',
      catatan: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to save attendance to database...')
    await kv.set(attendanceRecord.id, attendanceRecord)
    console.log('✅ Attendance saved successfully with ID:', attendanceRecord.id)
    
    return c.json({
      success: true,
      message: `✅ Absensi ${type === 'check-in' ? 'masuk' : 'pulang'} berhasil dicatat untuk ${finalDoctorName} pada ${attendanceDate} jam ${attendanceTime}`,
      attendance: attendanceRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating attendance:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat absensi: ${error.message}`
    }, 500)
  }
})

// Update attendance
app.put('/make-server-73417b67/attendance/:id', async (c) => {
  console.log('📝 Update attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating attendance ID:', attendanceId)
    
    // Get existing attendance
    const existingAttendance = await kv.getByPrefix('attendance_')
    const existingRecord = existingAttendance.find(a => a.id === attendanceId)
    
    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Data absensi tidak ditemukan'
      }, 404)
    }
    
    const { doctorId, doctorName, shift, type, date, time, notes } = body
    
    // Check for duplicates if key fields are changed
    if (doctorId !== existingRecord.doctorId || 
        shift !== existingRecord.shift || 
        type !== existingRecord.type || 
        date !== existingRecord.date) {
      
      // Check for duplicates excluding current record
      const duplicateCheck = existingAttendance.filter(record => {
        const recordDoctorId = record.doctorId || record.doctor_id
        const recordDate = record.date || record.tanggal
        const recordShift = record.shift
        const recordType = record.type || record.jenis
        
        return record.id !== attendanceId &&
               recordDoctorId === doctorId && 
               recordDate === date && 
               recordShift === shift && 
               recordType === type
      })
      
      if (duplicateCheck.length > 0) {
        console.log('❌ Duplicate attendance found during update')
        return c.json({
          success: false,
          error: `❌ Absensi ${type === 'check-in' ? 'masuk' : 'pulang'} sudah tercatat untuk dokter ini pada tanggal dan shift yang sama!`,
          duplicate: true
        }, 409)
      }
    }
    
    // Update attendance with new data
    const updatedAttendance = {
      ...existingRecord,
      doctorId: doctorId || existingRecord.doctorId,
      doctor_id: doctorId || existingRecord.doctor_id,
      doctorName: doctorName || existingRecord.doctorName,
      doctor_name: doctorName || existingRecord.doctor_name,
      shift: shift || existingRecord.shift,
      type: type || existingRecord.type,
      jenis: type || existingRecord.jenis,
      date: date || existingRecord.date,
      tanggal: date || existingRecord.tanggal,
      time: time || existingRecord.time,
      waktu: time || existingRecord.waktu,
      notes: notes !== undefined ? notes : existingRecord.notes,
      catatan: notes !== undefined ? notes : existingRecord.catatan,
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    console.log('💾 Attempting to update attendance...')
    await kv.set(attendanceId, updatedAttendance)
    console.log('✅ Attendance updated successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi berhasil diperbarui',
      attendance: updatedAttendance
    })
    
  } catch (error) {
    console.log('💥 Error updating attendance:', error)
    return c.json({
      success: false,
      error: `Gagal memperbarui data absensi: ${error.message}`
    }, 500)
  }
})

// Delete attendance
app.delete('/make-server-73417b67/attendance/:id', async (c) => {
  console.log('📝 Delete attendance called at:', new Date().toISOString())
  
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const kv = await import('./kv_store.tsx')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const attendanceId = c.req.param('id')
    
    console.log('🗑️ Deleting attendance ID:', attendanceId)
    
    // Check if attendance exists
    const existingAttendance = await kv.getByPrefix('attendance_')
    const existingRecord = existingAttendance.find(a => a.id === attendanceId)
    
    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Data absensi tidak ditemukan'
      }, 404)
    }
    
    // Delete from database
    await kv.del(attendanceId)
    console.log('✅ Attendance deleted successfully')
    
    return c.json({
      success: true,
      message: 'Data absensi berhasil dihapus'
    })
    
  } catch (error) {
    console.log('💥 Error deleting attendance:', error)
    return c.json({
      success: false,
      error: `Gagal menghapus data absensi: ${error.message}`
    }, 500)
  }
})

console.log('✅ Attendance endpoints with duplicate prevention added successfully')

console.log('✅ All endpoints registered successfully')
console.log('🚀 Server ready with attendance endpoints')

Deno.serve(app.fetch)