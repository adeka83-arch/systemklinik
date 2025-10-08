import * as kv from './kv_store.tsx'

// =============== PROMO IMAGES ENDPOINTS ===============
export const addPromoImagesEndpoints = (app: any) => {

  // Get all promo images
  app.get('/make-server-73417b67/promo-images', async (c: any) => {
    console.log('🖼️ Promo Images GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const images = await kv.getByPrefix('promo_image_')
      
      console.log(`📊 Found ${images.length} promo images in database`)
      
      // Transform promo images data
      const transformedImages = images.map(image => ({
        id: image.id,
        filename: image.filename || 'unknown.jpg',
        originalName: image.originalName || image.original_name || 'unknown.jpg',
        fileUrl: image.fileUrl || image.file_url || '',
        uploadDate: image.uploadDate || image.upload_date || image.created_at || new Date().toISOString(),
        fileSize: image.fileSize || image.file_size || 0,
        mimeType: image.mimeType || image.mime_type || 'image/jpeg',
        uploadedBy: image.uploadedBy || image.uploaded_by || 'system',
        created_at: image.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedImages.length} promo images`)
      
      return c.json({
        success: true,
        images: transformedImages
      })
      
    } catch (error) {
      console.log('💥 Error fetching promo images:', error)
      return c.json({
        success: false,
        error: error.message,
        images: []
      }, 500)
    }
  })

  // Upload promo image
  app.post('/make-server-73417b67/promo-images/upload', async (c: any) => {
    console.log('🖼️ Upload promo image called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      
      // Parse FormData
      const formData = await c.req.formData()
      const file = formData.get('image') as File
      const originalName = formData.get('originalName') as string
      
      console.log('📋 Upload data received:', {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        originalName: originalName
      })
      
      // Validate file
      if (!file) {
        console.log('❌ No file provided')
        return c.json({
          success: false,
          error: 'File gambar wajib diunggah'
        }, 400)
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        console.log('❌ Invalid file type:', file.type)
        return c.json({
          success: false,
          error: 'Hanya file JPEG dan PNG yang diperbolehkan'
        }, 400)
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        console.log('❌ File too large:', file.size)
        return c.json({
          success: false,
          error: 'Ukuran file maksimal 5MB'
        }, 400)
      }
      
      console.log('✅ File validation passed')
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `promo_${timestamp}.${extension}`
      
      console.log('📁 Generated filename:', filename)
      
      // Convert to base64 for storage (simulating file upload)
      const base64 = btoa(String.fromCharCode(...uint8Array))
      const dataUrl = `data:${file.type};base64,${base64}`
      
      // Create image record
      const imageRecord = {
        id: `promo_image_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
        filename: filename,
        originalName: originalName || file.name,
        original_name: originalName || file.name,
        fileUrl: dataUrl, // In production, this would be a real URL
        file_url: dataUrl,
        fileSize: file.size,
        file_size: file.size,
        mimeType: file.type,
        mime_type: file.type,
        uploadDate: new Date().toISOString(),
        upload_date: new Date().toISOString(),
        uploadedBy: 'user', // In production, get from auth
        uploaded_by: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to save promo image to database...')
      await kv.set(imageRecord.id, imageRecord)
      console.log('✅ Promo image saved successfully with ID:', imageRecord.id)
      
      return c.json({
        success: true,
        message: 'Gambar promo berhasil diunggah',
        imageData: imageRecord
      })
      
    } catch (error) {
      console.log('💥 Error uploading promo image:', error)
      return c.json({
        success: false,
        error: `Gagal mengunggah gambar: ${error.message}`
      }, 500)
    }
  })

  // Delete promo image
  app.delete('/make-server-73417b67/promo-images/:id', async (c: any) => {
    console.log('🖼️ Delete promo image called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const imageId = c.req.param('id')
      
      console.log('🗑️ Deleting promo image ID:', imageId)
      
      // Check if image exists
      const existingImages = await kv.getByPrefix('promo_image_')
      const existingImage = existingImages.find(img => img.id === imageId)
      
      if (!existingImage) {
        return c.json({
          success: false,
          error: 'Gambar promo tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(imageId)
      console.log('✅ Promo image deleted successfully')
      
      return c.json({
        success: true,
        message: 'Gambar promo berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting promo image:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus gambar: ${error.message}`
      }, 500)
    }
  })
}

// =============== PROMO HISTORY ENDPOINTS ===============
export const addPromoHistoryEndpoints = (app: any) => {

  // Get all promo history
  app.get('/make-server-73417b67/promo-history', async (c: any) => {
    console.log('📋 Promo History GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const history = await kv.getByPrefix('promo_history_')
      
      console.log(`📊 Found ${history.length} promo history records in database`)
      
      // Transform promo history data
      const transformedHistory = history.map(item => ({
        id: item.id,
        type: item.type || 'voucher',
        title: item.title || 'Unknown Promo',
        recipientCount: item.recipientCount || item.recipient_count || 0,
        recipientNames: item.recipientNames || item.recipient_names || [],
        recipientPhones: item.recipientPhones || item.recipient_phones || [],
        sentDate: item.sentDate || item.sent_date || item.created_at || new Date().toISOString(),
        sentBy: item.sentBy || item.sent_by || 'system',
        imageUrl: item.imageUrl || item.image_url || '',
        voucherCode: item.voucherCode || item.voucher_code || '',
        created_at: item.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedHistory.length} promo history records`)
      
      return c.json({
        success: true,
        history: transformedHistory
      })
      
    } catch (error) {
      console.log('💥 Error fetching promo history:', error)
      return c.json({
        success: false,
        error: error.message,
        history: []
      }, 500)
    }
  })

  // Delete promo history
  app.delete('/make-server-73417b67/promo-history/:id', async (c: any) => {
    console.log('📋 Delete promo history called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const historyId = c.req.param('id')
      
      console.log('🗑️ Deleting promo history ID:', historyId)
      
      // Check if history exists
      const existingHistory = await kv.getByPrefix('promo_history_')
      const existingItem = existingHistory.find(item => item.id === historyId)
      
      if (!existingItem) {
        return c.json({
          success: false,
          error: 'Riwayat promo tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(historyId)
      console.log('✅ Promo history deleted successfully')
      
      return c.json({
        success: true,
        message: 'Riwayat promo berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting promo history:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus riwayat: ${error.message}`
      }, 500)
    }
  })
}

// =============== PATIENTS ENDPOINTS FOR PROMO ===============
export const addPatientsEndpoints = (app: any) => {

  // Get all patients
  app.get('/make-server-73417b67/patients', async (c: any) => {
    console.log('👥 Patients GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const patients = await kv.getByPrefix('patient_')
      
      console.log(`📊 Found ${patients.length} patients in database`)
      
      // Transform patients data with comprehensive field mapping according to database structure
      const transformedPatients = patients.map(patient => {
        // Helper function to handle null/undefined values
        const safeString = (value: any) => {
          if (value === null || value === undefined || value === 'null') return ''
          return String(value).trim()
        }
        
        const transformedPatient = {
          id: patient.id,
          // Name fields - from database structure
          name: safeString(patient.nama || patient.name) || 'Unknown Patient',
          nama: safeString(patient.nama || patient.name) || 'Unknown Patient',
          // Phone fields - from database structure
          phone: safeString(patient.telepon || patient.phone),
          telepon: safeString(patient.telepon || patient.phone),
          // Email field
          email: safeString(patient.email),
          // Address fields - from database structure
          address: safeString(patient.alamat || patient.address),
          alamat: safeString(patient.alamat || patient.address),
          // Birth date fields - handle null values properly
          birthDate: safeString(patient.tanggal_lahir || patient.birthDate || patient.birth_date),
          tanggal_lahir: safeString(patient.tanggal_lahir || patient.birthDate),
          birth_date: safeString(patient.birth_date || patient.tanggal_lahir),
          // Gender fields - from database structure
          gender: safeString(patient.jenis_kelamin || patient.gender),
          jenis_kelamin: safeString(patient.jenis_kelamin || patient.gender),
          // Blood type fields - from database structure
          bloodType: safeString(patient.golongan_darah || patient.bloodType || patient.blood_type),
          golongan_darah: safeString(patient.golongan_darah || patient.bloodType),
          blood_type: safeString(patient.blood_type || patient.golongan_darah),
          // Allergies fields - from database structure
          allergies: safeString(patient.riwayat_alergi || patient.allergies),
          riwayat_alergi: safeString(patient.riwayat_alergi || patient.allergies),
          // Emergency contact fields - from database structure
          emergencyContact: safeString(patient.kontak_darurat || patient.emergencyContact || patient.emergency_contact),
          kontak_darurat: safeString(patient.kontak_darurat || patient.emergencyContact),
          emergency_contact: safeString(patient.emergency_contact || patient.kontak_darurat),
          emergencyPhone: safeString(patient.telepon_darurat || patient.emergencyPhone || patient.emergency_phone),
          telepon_darurat: safeString(patient.telepon_darurat || patient.emergencyPhone),
          emergency_phone: safeString(patient.emergency_phone || patient.telepon_darurat),
          // Medical record number fields - from database structure
          medicalRecordNumber: safeString(patient.no_rm || patient.nomor_rm || patient.medicalRecordNumber || patient.medical_record_number),
          no_rm: safeString(patient.no_rm || patient.nomor_rm || patient.medicalRecordNumber),
          nomor_rm: safeString(patient.nomor_rm || patient.no_rm || patient.medicalRecordNumber),
          medical_record_number: safeString(patient.medical_record_number || patient.no_rm || patient.nomor_rm),
          // Registration date fields - from database structure
          registrationDate: patient.tanggal_mendaftar || patient.registrationDate || patient.registration_date || patient.created_at || new Date().toISOString(),
          tanggal_mendaftar: patient.tanggal_mendaftar || patient.registrationDate || patient.created_at,
          registration_date: patient.registration_date || patient.tanggal_mendaftar || patient.created_at,
          // Status field - normalize to 'aktif'
          status: patient.status === 'active' ? 'aktif' : (patient.status || 'aktif'),
          // Timestamps
          created_at: patient.created_at || new Date().toISOString(),
          updated_at: patient.updated_at || patient.created_at || new Date().toISOString()
        }
        
        console.log(`🔄 Patient ${transformedPatient.id} mapped:`, {
          original_status: patient.status,
          mapped_status: transformedPatient.status,
          name: transformedPatient.name,
          phone: transformedPatient.phone,
          birthDate: transformedPatient.birthDate,
          gender: transformedPatient.gender,
          registrationDate: transformedPatient.registrationDate,
          medicalRecord: transformedPatient.medicalRecordNumber,
          hasNullFields: {
            tanggal_lahir: patient.tanggal_lahir === null,
            jenis_kelamin: patient.jenis_kelamin === null,
            alamat: patient.alamat === null
          }
        })
        
        return transformedPatient
      })
      
      // Filter only active patients - handle both "aktif" and "active" status
      const activePatients = transformedPatients.filter(patient => 
        patient.status === 'aktif' || patient.status === 'active' || !patient.status || patient.status === ''
      )
      
      console.log(`✅ Returning ${activePatients.length} active patients (total ${patients.length} in DB)`)
      
      return c.json({
        success: true,
        patients: activePatients
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

  // Create new patient
  app.post('/make-server-73417b67/patients', async (c: any) => {
    console.log('👥 Create patient called at:', new Date().toISOString())
    
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
      console.log('👥 Patient data received:', body)
      
      // Extract data using both Indonesian and English field names
      const patientName = body.nama || body.name
      const patientPhone = body.telepon || body.phone || ''
      const patientAddress = body.alamat || body.address
      const birthDate = body.tanggal_lahir || body.birthDate
      const gender = body.jenis_kelamin || body.gender
      
      // Validate required fields
      if (!patientName || !patientAddress || !birthDate || !gender) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Nama, alamat, tanggal lahir, dan jenis kelamin wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for patient')
      
      // Generate medical record number
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      
      // Get today's patients to generate sequence
      const existingPatients = await kv.getByPrefix('patient_')
      const todayPatients = existingPatients.filter(p => {
        const regDate = new Date(p.tanggal_mendaftar || p.created_at)
        return regDate.toDateString() === now.toDateString()
      })
      
      const sequence = String(todayPatients.length + 1).padStart(3, '0')
      const medicalRecordNumber = `RM-${year}${month}${day}-${sequence}`
      
      // Create patient record with comprehensive field mapping
      const patientRecord = {
        id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        // Indonesian field names (primary)
        nama: patientName.trim(),
        telepon: patientPhone.trim(),
        alamat: patientAddress.trim(),
        tanggal_lahir: birthDate,
        jenis_kelamin: gender,
        golongan_darah: body.golongan_darah || body.bloodType || '',
        riwayat_alergi: body.riwayat_alergi || body.allergies || '',
        kontak_darurat: body.kontak_darurat || body.emergencyContact || '',
        telepon_darurat: body.telepon_darurat || body.emergencyPhone || '',
        no_rm: medicalRecordNumber,
        nomor_rm: medicalRecordNumber,
        tanggal_mendaftar: new Date().toISOString(),
        // English field names (compatibility)
        name: patientName.trim(),
        phone: patientPhone.trim(),
        address: patientAddress.trim(),
        birthDate: birthDate,
        birth_date: birthDate,
        gender: gender,
        bloodType: body.golongan_darah || body.bloodType || '',
        blood_type: body.golongan_darah || body.bloodType || '',
        allergies: body.riwayat_alergi || body.allergies || '',
        emergencyContact: body.kontak_darurat || body.emergencyContact || '',
        emergency_contact: body.kontak_darurat || body.emergencyContact || '',
        emergencyPhone: body.telepon_darurat || body.emergencyPhone || '',
        emergency_phone: body.telepon_darurat || body.emergencyPhone || '',
        medicalRecordNumber: medicalRecordNumber,
        medical_record_number: medicalRecordNumber,
        registrationDate: new Date().toISOString(),
        registration_date: new Date().toISOString(),
        status: 'aktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to save patient to database...')
      await kv.set(patientRecord.id, patientRecord)
      console.log('✅ Patient saved successfully with ID:', patientRecord.id, 'and RM:', medicalRecordNumber)
      
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

  // Update patient
  app.put('/make-server-73417b67/patients/:id', async (c: any) => {
    console.log('👥 Update patient called at:', new Date().toISOString())
    
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
      
      const patientId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('👥 Updating patient ID:', patientId)
      
      // Get existing patient
      const existingPatients = await kv.getByPrefix('patient_')
      const existingPatient = existingPatients.find(p => p.id === patientId)
      
      if (!existingPatient) {
        return c.json({
          success: false,
          error: 'Data pasien tidak ditemukan'
        }, 404)
      }
      
      // Extract data using both Indonesian and English field names
      const patientName = body.nama || body.name
      const patientPhone = body.telepon || body.phone
      const patientAddress = body.alamat || body.address
      const birthDate = body.tanggal_lahir || body.birthDate
      const gender = body.jenis_kelamin || body.gender
      
      // Update patient with new data, preserving existing values if not provided
      const updatedPatient = {
        ...existingPatient,
        // Indonesian field names (primary)
        nama: patientName ? patientName.trim() : existingPatient.nama,
        telepon: patientPhone !== undefined ? patientPhone.trim() : existingPatient.telepon,
        alamat: patientAddress ? patientAddress.trim() : existingPatient.alamat,
        tanggal_lahir: birthDate || existingPatient.tanggal_lahir,
        jenis_kelamin: gender || existingPatient.jenis_kelamin,
        golongan_darah: body.golongan_darah || body.bloodType || existingPatient.golongan_darah,
        riwayat_alergi: body.riwayat_alergi !== undefined ? body.riwayat_alergi : (body.allergies !== undefined ? body.allergies : existingPatient.riwayat_alergi),
        kontak_darurat: body.kontak_darurat !== undefined ? body.kontak_darurat : (body.emergencyContact !== undefined ? body.emergencyContact : existingPatient.kontak_darurat),
        telepon_darurat: body.telepon_darurat !== undefined ? body.telepon_darurat : (body.emergencyPhone !== undefined ? body.emergencyPhone : existingPatient.telepon_darurat),
        // English field names (compatibility)
        name: patientName ? patientName.trim() : existingPatient.name,
        phone: patientPhone !== undefined ? patientPhone.trim() : existingPatient.phone,
        address: patientAddress ? patientAddress.trim() : existingPatient.address,
        birthDate: birthDate || existingPatient.birthDate,
        birth_date: birthDate || existingPatient.birth_date,
        gender: gender || existingPatient.gender,
        bloodType: body.golongan_darah || body.bloodType || existingPatient.bloodType,
        blood_type: body.golongan_darah || body.bloodType || existingPatient.blood_type,
        allergies: body.riwayat_alergi !== undefined ? body.riwayat_alergi : (body.allergies !== undefined ? body.allergies : existingPatient.allergies),
        emergencyContact: body.kontak_darurat !== undefined ? body.kontak_darurat : (body.emergencyContact !== undefined ? body.emergencyContact : existingPatient.emergencyContact),
        emergency_contact: body.kontak_darurat !== undefined ? body.kontak_darurat : (body.emergencyContact !== undefined ? body.emergencyContact : existingPatient.emergency_contact),
        emergencyPhone: body.telepon_darurat !== undefined ? body.telepon_darurat : (body.emergencyPhone !== undefined ? body.emergencyPhone : existingPatient.emergencyPhone),
        emergency_phone: body.telepon_darurat !== undefined ? body.telepon_darurat : (body.emergencyPhone !== undefined ? body.emergencyPhone : existingPatient.emergency_phone),
        medicalRecordNumber: existingPatient.medicalRecordNumber || existingPatient.no_rm || existingPatient.nomor_rm,
        medical_record_number: existingPatient.medical_record_number || existingPatient.no_rm || existingPatient.nomor_rm,
        registrationDate: existingPatient.registrationDate || existingPatient.tanggal_mendaftar,
        registration_date: existingPatient.registration_date || existingPatient.tanggal_mendaftar,
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update patient...')
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

  // Delete patient
  app.delete('/make-server-73417b67/patients/:id', async (c: any) => {
    console.log('👥 Delete patient called at:', new Date().toISOString())
    
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
      
      const patientId = c.req.param('id')
      
      console.log('🗑️ Deleting patient ID:', patientId)
      
      // Check if patient exists
      const existingPatients = await kv.getByPrefix('patient_')
      const existingPatient = existingPatients.find(p => p.id === patientId)
      
      if (!existingPatient) {
        return c.json({
          success: false,
          error: 'Data pasien tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(patientId)
      console.log('✅ Patient deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data pasien berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting patient:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data pasien: ${error.message}`
      }, 500)
    }
  })
}

// =============== VOUCHERS ENDPOINTS FOR PROMO ===============
export const addVouchersEndpoints = (app: any) => {

  // Get all vouchers
  app.get('/make-server-73417b67/vouchers', async (c: any) => {
    console.log('🎫 Vouchers GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const vouchers = await kv.getByPrefix('voucher_')
      
      console.log(`📊 Found ${vouchers.length} vouchers in database`)
      
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

  // Create new voucher
  app.post('/make-server-73417b67/vouchers', async (c: any) => {
    console.log('🎫 Create voucher called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
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
        description: description ? description.trim() : '',
        deskripsi: description ? description.trim() : '',
        discountType: discountType,
        discount_type: discountType,
        discountValue: parseFloat(discountValue),
        discount_value: parseFloat(discountValue),
        expiryDate: expiryDate,
        expiry_date: expiryDate,
        usageLimit: parseInt(usageLimit) || 0,
        usage_limit: parseInt(usageLimit) || 0,
        usageCount: 0,
        usage_count: 0,
        currentUsage: 0,
        isActive: true,
        is_active: true,
        minPurchase: parseFloat(minPurchase) || 0,
        min_purchase: parseFloat(minPurchase) || 0,
        minAmount: parseFloat(minPurchase) || 0,
        createdDate: new Date().toISOString(),
        created_date: new Date().toISOString(),
        createdBy: 'user',
        created_by: 'user',
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

  // Delete voucher
  app.delete('/make-server-73417b67/vouchers/:id', async (c: any) => {
    console.log('🎫 Delete voucher called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const voucherId = c.req.param('id')
      const forceDelete = c.req.query('force') === 'true'
      
      console.log('🗑️ Deleting voucher ID:', voucherId, '| Force:', forceDelete)
      
      // Check if voucher exists
      const existingVouchers = await kv.getByPrefix('voucher_')
      const existingVoucher = existingVouchers.find(v => v.id === voucherId)
      
      if (!existingVoucher) {
        return c.json({
          success: false,
          error: 'Voucher tidak ditemukan'
        }, 404)
      }
      
      // Check if voucher is corrupt
      const isCorrupt = !existingVoucher.code || existingVoucher.code === 'CORRUPT' || 
                       !existingVoucher.title || existingVoucher.title === 'Data Corrupt' ||
                       typeof existingVoucher.discountValue !== 'number' ||
                       existingVoucher.expiryDate === 'Invalid Date'
      
      // Delete from database
      await kv.del(voucherId)
      console.log('✅ Voucher deleted successfully')
      
      const message = isCorrupt 
        ? 'Voucher dengan data corrupt berhasil dihapus'
        : (forceDelete ? 'Voucher berhasil dihapus secara paksa' : 'Voucher berhasil dihapus')
      
      return c.json({
        success: true,
        message: message,
        wasCorrupt: isCorrupt,
        deletionType: forceDelete ? 'forced' : 'normal'
      })
      
    } catch (error) {
      console.log('💥 Error deleting voucher:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus voucher: ${error.message}`
      }, 500)
    }
  })
}

// Promo management endpoints - FIXED VERSION WITH PROPER STATUS LOGIC
export function createPromoRoutes(app: any, supabase: any) {
  
  // Health check endpoint for voucher system
  app.get('/make-server-73417b67/vouchers/health', async (c: any) => {
    try {
      console.log('🏥 Voucher health check called')
      
      const startTime = Date.now()
      
      // Quick test of KV store access
      const kv = await import('./kv_store.tsx')
      const testVouchers = await kv.getByPrefix('voucher_')
      const testRecipients = await kv.getByPrefix('voucher_recipient_')
      
      const responseTime = Date.now() - startTime
      
      return c.json({
        success: true,
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        data: {
          vouchersCount: testVouchers.length,
          recipientsCount: testRecipients.length,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.log('🏥 Health check failed:', error)
      return c.json({ 
        success: false, 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500)
    }
  })

  // Test endpoint for voucher system
  app.get('/make-server-73417b67/vouchers/test', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      console.log('🧪 Voucher test endpoint called, token present:', !!accessToken)
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        console.log('🧪 Test endpoint: Unauthorized')
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🧪 Test endpoint: User authenticated:', user.email)

      // Test KV store access
      const kv = await import('./kv_store.tsx')
      const vouchers = await kv.getByPrefix('voucher_')
      const usages = await kv.getByPrefix('voucher_usage_')
      
      console.log('🧪 Test endpoint: Found vouchers:', vouchers.length)
      console.log('🧪 Test endpoint: Found usages:', usages.length)

      return c.json({
        success: true,
        message: 'Voucher system test passed',
        data: {
          vouchersCount: vouchers.length,
          usagesCount: usages.length,
          user: user.email,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.log('🧪 Test endpoint error:', error)
      return c.json({ error: 'Test endpoint failed', details: error.message }, 500)
    }
  })
  
  // Validate voucher for usage
  app.post('/make-server-73417b67/vouchers/validate', async (c: any) => {
    try {
      console.log('🎫 Voucher validation endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      console.log('🎫 Access token present:', !!accessToken)
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        console.log('🎫 Unauthorized user in validation')
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🎫 User authenticated:', user.email)

      const { 
        code, 
        amount, 
        treatmentAmount, 
        adminFee, 
        patientId, 
        transactionType 
      } = await c.req.json()
      
      // Calculate separate amounts - voucher discount only applies to treatment amount
      const actualTreatmentAmount = treatmentAmount || amount || 0
      const actualAdminFee = adminFee || 0
      const totalAmount = actualTreatmentAmount + actualAdminFee
      
      console.log('🎫 Validating voucher:', { 
        code, 
        amount, 
        treatmentAmount: actualTreatmentAmount,
        adminFee: actualAdminFee,
        totalAmount,
        patientId, 
        transactionType 
      })

      if (!code) {
        return c.json({ 
          valid: false, 
          error: 'Kode voucher diperlukan' 
        }, 400)
      }

      // Find voucher by code
      const kv = await import('./kv_store.tsx')
      const vouchers = await kv.getByPrefix('voucher_')
      const voucher = vouchers.find(v => v.code === code.toUpperCase() && v.isActive)

      if (!voucher) {
        console.log('❌ Voucher not found or inactive:', code)
        return c.json({
          valid: false,
          message: 'Voucher tidak ditemukan atau tidak aktif'
        })
      }

      console.log('✅ Voucher found:', voucher.title)

      // Check expiry date
      if (voucher.expiryDate) {
        const expiryDate = new Date(voucher.expiryDate)
        const now = new Date()
        if (now > expiryDate) {
          console.log('❌ Voucher expired:', voucher.expiryDate)
          return c.json({
            valid: false,
            message: 'Voucher sudah kadaluarsa'
          })
        }
      }

      // Check usage limit
      if (voucher.usageLimit && voucher.currentUsage >= voucher.usageLimit) {
        console.log('❌ Voucher usage limit reached:', voucher.currentUsage, '/', voucher.usageLimit)
        return c.json({
          valid: false,
          message: 'Voucher sudah mencapai batas penggunaan'
        })
      }

      // Check minimum amount - now based on treatment amount only (excluding admin fee)
      if (voucher.minAmount && actualTreatmentAmount < voucher.minAmount) {
        console.log('❌ Treatment amount below minimum:', actualTreatmentAmount, '<', voucher.minAmount)
        return c.json({
          valid: false,
          message: `Minimum nilai tindakan untuk voucher ini adalah Rp ${voucher.minAmount.toLocaleString('id-ID')} (tidak termasuk biaya admin)`
        })
      }

      // Also check minimum purchase if it exists  
      if (voucher.minPurchase && actualTreatmentAmount < voucher.minPurchase) {
        console.log('❌ Treatment amount below minimum purchase:', actualTreatmentAmount, '<', voucher.minPurchase)
        return c.json({
          valid: false,
          message: `Minimum nilai tindakan untuk voucher ini adalah Rp ${voucher.minPurchase.toLocaleString('id-ID')} (tidak termasuk biaya admin)`
        })
      }

      // Check if this specific voucher has been used (based on global usage limit)
      // Note: We allow any patient to use any voucher as long as it hasn't reached usage limit
      const voucherUsages = await kv.getByPrefix('voucher_usage_')
      const voucherUsageCount = voucherUsages.filter(usage => 
        usage.voucherId === voucher.id
      ).length

      console.log('🎫 Current voucher usage count:', voucherUsageCount, 'of limit:', voucher.usageLimit)

      // If there's a usage limit, check if it's been reached
      if (voucher.usageLimit && voucherUsageCount >= voucher.usageLimit) {
        console.log('❌ Voucher usage limit reached globally:', voucherUsageCount, '/', voucher.usageLimit)
        return c.json({
          valid: false,
          message: 'Voucher sudah mencapai batas penggunaan'
        })
      }

      // Optional: Check if the same patient already used this voucher (uncomment if needed)
      // if (patientId) {
      //   const existingUsage = voucherUsages.find(usage => 
      //     usage.voucherId === voucher.id && usage.patientId === patientId
      //   )
      //   if (existingUsage) {
      //     console.log('❌ Patient already used this voucher:', patientId)
      //     return c.json({
      //       valid: false,
      //       message: 'Pasien sudah menggunakan voucher ini sebelumnya'
      //     })
      //   }
      // }

      // Calculate discount amount - ONLY applies to treatment amount, NOT admin fee
      let discountAmount = 0
      if (voucher.discountType === 'percentage') {
        discountAmount = (actualTreatmentAmount * voucher.discountValue) / 100
        
        // Apply max discount limit if set
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount
        }
      } else {
        // Fixed amount discount
        discountAmount = voucher.discountValue
      }

      // Make sure discount doesn't exceed the treatment amount (not total amount)
      if (discountAmount > actualTreatmentAmount) {
        discountAmount = actualTreatmentAmount
      }

      // Calculate final amounts
      const discountedTreatmentAmount = actualTreatmentAmount - discountAmount
      const finalTotalAmount = discountedTreatmentAmount + actualAdminFee

      console.log('✅ Voucher validation successful', {
        originalTreatmentAmount: actualTreatmentAmount,
        adminFee: actualAdminFee,
        originalTotalAmount: totalAmount,
        discountAmount,
        discountedTreatmentAmount,
        finalTotalAmount,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        note: 'Diskon hanya berlaku untuk nilai tindakan, tidak termasuk biaya admin'
      })
      
      return c.json({
        valid: true,
        voucher: voucher,
        discountAmount: discountAmount,
        originalTreatmentAmount: actualTreatmentAmount,
        discountedTreatmentAmount: discountedTreatmentAmount,
        adminFee: actualAdminFee,
        originalTotalAmount: totalAmount,
        finalTotalAmount: finalTotalAmount,
        // Legacy fields for backward compatibility
        finalAmount: finalTotalAmount,
        originalAmount: totalAmount,
        message: 'Voucher valid dan dapat digunakan. Diskon hanya berlaku untuk nilai tindakan, tidak termasuk biaya admin.'
      })

    } catch (error) {
      console.log('💥 Error validating voucher:', error)
      return c.json({ error: 'Failed to validate voucher' }, 500)
    }
  })

  // Record voucher usage
  app.post('/make-server-73417b67/vouchers/use', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const kv = await import('./kv_store.tsx')
      
      const { 
        voucherId, 
        voucherCode,
        patientId, 
        patientName,
        originalAmount, 
        originalTreatmentAmount,
        discountAmount, 
        finalAmount,
        finalTotalAmount,
        adminFee,
        transactionType,
        transactionId 
      } = await c.req.json()

      console.log('🎫 Recording voucher usage:', { 
        voucherId, 
        voucherCode, 
        patientName, 
        discountAmount,
        originalTreatmentAmount,
        adminFee,
        note: 'Diskon hanya untuk nilai tindakan'
      })

      // Validate required fields
      if (!voucherId || !voucherCode || !originalAmount) {
        return c.json({ error: 'Missing required fields' }, 400)
      }

      // Create usage record with detailed breakdown
      const usageId = `voucher_usage_${Date.now()}`
      const usage = {
        id: usageId,
        voucherId,
        voucherCode,
        patientId: patientId || null,
        patientName: patientName || 'Unknown',
        originalAmount,
        originalTreatmentAmount: originalTreatmentAmount || originalAmount,
        adminFee: adminFee || 0,
        discountAmount,
        finalAmount,
        finalTotalAmount: finalTotalAmount || finalAmount,
        usedDate: new Date().toISOString(),
        usedBy: user.id,
        transactionType: transactionType || 'treatment',
        transactionId: transactionId || null,
        note: 'Diskon voucher hanya berlaku untuk nilai tindakan, tidak termasuk biaya admin',
        created_at: new Date().toISOString()
      }

      await kv.set(usageId, usage)

      // Update voucher usage count
      const voucher = await kv.get(voucherId)
      if (voucher) {
        voucher.currentUsage = (voucher.currentUsage || 0) + 1
        voucher.updated_at = new Date().toISOString()
        await kv.set(voucherId, voucher)
        console.log('✅ Updated voucher usage count:', voucher.currentUsage)
      }

      console.log('✅ Voucher usage recorded successfully')
      return c.json({ 
        success: true, 
        usage: usage,
        message: 'Penggunaan voucher berhasil dicatat'
      })

    } catch (error) {
      console.log('💥 Error recording voucher usage:', error)
      return c.json({ error: 'Failed to record voucher usage' }, 500)
    }
  })

  // Get voucher usage history
  app.get('/make-server-73417b67/vouchers/usage', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const kv = await import('./kv_store.tsx')
      const usages = await kv.getByPrefix('voucher_usage_')
      
      // Sort by usage date descending
      const sortedUsages = usages.sort((a, b) => 
        new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime()
      )

      console.log('✅ Voucher usage history fetched:', sortedUsages.length, 'records')
      return c.json({ 
        success: true, 
        usages: sortedUsages 
      })

    } catch (error) {
      console.log('💥 Error getting voucher usage:', error)
      return c.json({ error: 'Failed to get voucher usage' }, 500)
    }
  })

  // Get voucher usage statistics
  app.get('/make-server-73417b67/vouchers/stats', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const kv = await import('./kv_store.tsx')
      const vouchers = await kv.getByPrefix('voucher_')
      const usages = await kv.getByPrefix('voucher_usage_')

      const stats = {
        totalVouchers: vouchers.length,
        activeVouchers: vouchers.filter(v => v.isActive).length,
        totalUsages: usages.length,
        totalDiscountGiven: usages.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0),
        totalSavings: usages.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0),
        avgDiscountPerUsage: usages.length > 0 ? 
          usages.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0) / usages.length : 0,
        usagesByType: {
          treatment: usages.filter(u => u.transactionType === 'treatment').length,
          sale: usages.filter(u => u.transactionType === 'sale').length
        },
        recentUsages: usages
          .sort((a, b) => new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime())
          .slice(0, 10)
      }

      console.log('✅ Voucher statistics calculated')
      return c.json({ 
        success: true, 
        stats: stats 
      })

    } catch (error) {
      console.log('💥 Error getting voucher stats:', error)
      return c.json({ error: 'Failed to get voucher statistics' }, 500)
    }
  })

  // Get voucher status with recipients and usage details
  app.get('/make-server-73417b67/vouchers/status', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🎫 Voucher status endpoint called for user:', user.email)

      const kv = await import('./kv_store.tsx')
      const vouchers = await kv.getByPrefix('voucher_')
      const recipients = await kv.getByPrefix('voucher_recipient_')
      const usages = await kv.getByPrefix('voucher_usage_')
      
      console.log(`📊 Found ${vouchers.length} vouchers, ${recipients.length} recipients, ${usages.length} usages`)
      
      // Process vouchers with status
      const vouchersWithStatus = vouchers.map(voucher => {
        const voucherRecipients = recipients.filter(r => r.voucherId === voucher.id)
        const voucherUsages = usages.filter(u => u.voucherId === voucher.id)
        const currentUsage = voucherUsages.length
        
        // Determine status
        const now = new Date()
        const expiryDate = new Date(voucher.expiryDate || voucher.expiry_date)
        const isExpired = expiryDate < now
        const usageLimit = voucher.usageLimit || voucher.usage_limit || 0
        const isUsedUp = usageLimit > 0 && currentUsage >= usageLimit
        const isActive = voucher.isActive !== undefined ? voucher.isActive : voucher.is_active !== undefined ? voucher.is_active : true
        
        let status = 'active'
        let statusColor = 'green'
        let statusText = 'Aktif'
        
        if (!isActive) {
          status = 'inactive'
          statusColor = 'gray'
          statusText = 'Tidak Aktif'
        } else if (isExpired) {
          status = 'expired'
          statusColor = 'red'
          statusText = 'Kadaluarsa'
        } else if (isUsedUp) {
          status = 'used_up'
          statusColor = 'orange'
          statusText = 'Kuota Habis'
        }
        
        return {
          id: voucher.id,
          code: voucher.code,
          title: voucher.title,
          description: voucher.description || '',
          discountType: voucher.discountType || voucher.discount_type || 'percentage',
          discountValue: voucher.discountValue || voucher.discount_value || 0,
          expiryDate: voucher.expiryDate || voucher.expiry_date,
          usageLimit: usageLimit,
          currentUsage: currentUsage,
          isActive: isActive,
          created_at: voucher.created_at || voucher.createdDate || new Date().toISOString(),
          status: status,
          statusColor: statusColor,
          statusText: statusText,
          recipients: voucherRecipients.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            assignedDate: r.assignedDate || r.created_at,
            used: voucherUsages.some(u => u.patientId === r.patientId)
          })),
          usages: voucherUsages.map(u => ({
            id: u.id,
            patientName: u.patientName,
            usedDate: u.usedDate || u.created_at,
            discountAmount: u.discountAmount || 0
          }))
        }
      })
      
      console.log(`✅ Returning ${vouchersWithStatus.length} vouchers with status`)
      
      return c.json({
        success: true,
        vouchers: vouchersWithStatus
      })
      
    } catch (error) {
      console.log('💥 Error fetching voucher status:', error)
      return c.json({ error: 'Failed to get voucher status', details: error.message }, 500)
    }
  })

  // Get voucher reminders for dashboard
  app.get('/make-server-73417b67/vouchers/reminders', async (c: any) => {
    try {
      console.log('📋 Voucher reminders endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get all active vouchers
      const vouchers = await kv.getByPrefix('voucher_')
      const activeVouchers = vouchers.filter(v => v.isActive)

      // Get all voucher assignments (who received which vouchers)
      const assignments = await kv.getByPrefix('voucher_assignment_')
      
      // Get all voucher usages to check which vouchers have been used
      const usages = await kv.getByPrefix('voucher_usage_')

      // Get patients for name lookup
      const patients = await kv.getByPrefix('patient_')

      const now = new Date()
      const reminders = []

      for (const assignment of assignments) {
        const voucher = activeVouchers.find(v => v.id === assignment.voucherId)
        if (!voucher || !voucher.expiryDate) continue

        const patient = patients.find(p => p.id === assignment.patientId)
        if (!patient) continue

        // Check if voucher has been used by this patient
        const voucherUsed = usages.some(usage => 
          usage.voucherId === voucher.id && usage.patientId === assignment.patientId
        )

        if (voucherUsed) continue

        const expiryDate = new Date(voucher.expiryDate)
        const timeDiff = expiryDate.getTime() - now.getTime()
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24))

        // Only show reminders for vouchers expiring within 30 days
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          reminders.push({
            voucherId: voucher.id,
            recipientId: assignment.patientId,
            recipientName: patient.name,
            voucherCode: voucher.code,
            voucherTitle: voucher.title,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            expiryDate: voucher.expiryDate,
            daysUntilExpiry,
            isUrgent: daysUntilExpiry <= 3,
            status: 'active',
            assignedDate: assignment.assignedDate
          })
        }
      }

      // Sort by urgency (expiring soon first)
      reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

      console.log(`📋 Found ${reminders.length} voucher reminders`)

      return c.json({
        success: true,
        reminders,
        count: reminders.length
      })
    } catch (error) {
      console.log('❌ Error fetching voucher reminders:', error)
      return c.json({ 
        error: 'Gagal mengambil reminder voucher', 
        details: error.message 
      }, 500)
    }
  })

  // Debug endpoint to fix corrupted vouchers
  app.post('/make-server-73417b67/vouchers/debug/fix', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🔧 Starting voucher corruption fix...')
      
      const allVouchers = await kv.getByPrefix('voucher_')
      let fixedCount = 0
      let deletedCount = 0
      
      for (const voucher of allVouchers) {
        const isCorrupt = !voucher.code || voucher.code === 'CORRUPT' || voucher.code === 'UNDEFINED' ||
                         !voucher.title || voucher.title === 'Data Corrupt' || voucher.title === 'Corrupted Voucher' || voucher.title === 'UNDEFINED' ||
                         typeof voucher.discountValue !== 'number' || voucher.discountValue < 0 || isNaN(voucher.discountValue) ||
                         !voucher.expiryDate || voucher.expiryDate === 'Invalid Date' || isNaN(new Date(voucher.expiryDate).getTime())

        if (isCorrupt) {
          console.log('🔧 Attempting to fix corrupt voucher:', voucher.id)
          
          // Try to fix if some data is salvageable
          if (voucher.id && voucher.id !== 'UNDEFINED') {
            try {
              const fixedVoucher = {
                ...voucher,
                code: voucher.code && voucher.code !== 'CORRUPT' && voucher.code !== 'UNDEFINED' 
                  ? voucher.code 
                  : `FIXED${Date.now()}`,
                title: voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && voucher.title !== 'UNDEFINED'
                  ? voucher.title 
                  : 'Fixed Voucher',
                discountValue: typeof voucher.discountValue === 'number' && voucher.discountValue > 0 
                  ? voucher.discountValue 
                  : 10,
                expiryDate: voucher.expiryDate && !isNaN(new Date(voucher.expiryDate).getTime())
                  ? voucher.expiryDate
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: false, // Mark as inactive since it was corrupted
                updated_at: new Date().toISOString(),
                fixedAt: new Date().toISOString()
              }
              
              await kv.set(voucher.id, fixedVoucher)
              fixedCount++
              console.log('✅ Fixed voucher:', voucher.id)
            } catch (fixError) {
              // If can't fix, delete it
              await kv.del(voucher.id)
              deletedCount++
              console.log('🗑️ Deleted unfixable voucher:', voucher.id)
            }
          } else {
            // Delete if no salvageable ID
            await kv.del(voucher.id)
            deletedCount++
            console.log('🗑️ Deleted voucher with corrupt ID:', voucher.id)
          }
        }
      }
      
      console.log(`✅ Fix operation complete: ${fixedCount} fixed, ${deletedCount} deleted`)
      
      return c.json({
        success: true,
        message: `Fix operation complete: ${fixedCount} vouchers fixed, ${deletedCount} deleted`,
        fixed: fixedCount,
        deleted: deletedCount
      })
    } catch (error) {
      console.log('❌ Error in fix operation:', error)
      return c.json({ error: 'Fix operation failed' }, 500)
    }
  })

  // Debug endpoint to clean orphaned voucher data
  app.post('/make-server-73417b67/vouchers/debug/clean', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🧹 Starting orphaned data cleanup...')
      
      const allVouchers = await kv.getByPrefix('voucher_')
      const allAssignments = await kv.getByPrefix('voucher_assignment_')
      const allRecipients = await kv.getByPrefix('voucher_recipient_')
      const allUsages = await kv.getByPrefix('voucher_usage_')
      
      const validVoucherIds = new Set(allVouchers.map(v => v.id))
      let cleanedCount = 0
      
      // Clean orphaned assignments
      for (const assignment of allAssignments) {
        if (!validVoucherIds.has(assignment.voucherId) || 
            !assignment.voucherId || assignment.voucherId === 'undefined' ||
            !assignment.patientId || assignment.patientId === 'undefined') {
          await kv.del(assignment.id)
          cleanedCount++
          console.log('🧹 Cleaned orphaned assignment:', assignment.id)
        }
      }
      
      // Clean orphaned recipients
      for (const recipient of allRecipients) {
        if (!validVoucherIds.has(recipient.voucherId) || 
            !recipient.voucherId || recipient.voucherId === 'undefined' ||
            !recipient.patientId || recipient.patientId === 'undefined') {
          await kv.del(recipient.id)
          cleanedCount++
          console.log('🧹 Cleaned orphaned recipient:', recipient.id)
        }
      }
      
      // Clean orphaned usages
      for (const usage of allUsages) {
        if (!validVoucherIds.has(usage.voucherId) ||
            !usage.voucherId || usage.voucherId === 'undefined') {
          await kv.del(usage.id)
          cleanedCount++
          console.log('🧹 Cleaned orphaned usage:', usage.id)
        }
      }
      
      console.log(`✅ Cleanup complete: ${cleanedCount} orphaned records removed`)
      
      return c.json({
        success: true,
        message: `Cleanup complete: ${cleanedCount} orphaned records removed`,
        cleaned: cleanedCount
      })
    } catch (error) {
      console.log('❌ Error in cleanup operation:', error)
      return c.json({ error: 'Cleanup operation failed' }, 500)
    }
  })

  // Get all vouchers with their status
  app.get('/make-server-73417b67/vouchers/status', async (c: any) => {
    try {
      const timestamp = new Date().toISOString()
      console.log('📋 Voucher status endpoint called at:', timestamp)
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get all vouchers
      const vouchers = await kv.getByPrefix('voucher_')
      console.log(`📋 Found ${vouchers.length} total vouchers in database`)
      
      // Get all voucher usages to check which vouchers have been used
      const usages = await kv.getByPrefix('voucher_usage_')
      console.log(`📋 Found ${usages.length} total voucher usages`)
      
      // Get all voucher assignments 
      const assignments = await kv.getByPrefix('voucher_assignment_')
      console.log(`📋 Found ${assignments.length} total voucher assignments`)
      
      // Get patients for name lookup
      const patients = await kv.getByPrefix('patient_')

      const now = new Date()
      console.log(`📋 Current timestamp: ${now.toISOString()}`)
      
      const vouchersWithStatus = vouchers.map((voucher, index) => {
        let status = 'active'
        let statusColor = 'green'
        let statusText = 'Aktif'
        
        // Get usage count for this voucher with detailed logging
        const voucherUsageCount = usages.filter(usage => usage.voucherId === voucher.id).length
        const storedUsageCount = voucher.currentUsage || voucher.usageCount || 0
        
        console.log(`📋 Voucher ${index + 1} (${voucher.code}):`, {
          id: voucher.id,
          title: voucher.title,
          isActive: voucher.isActive,
          calculatedUsageCount: voucherUsageCount,
          storedUsageCount: storedUsageCount,
          usageLimit: voucher.usageLimit,
          expiryDate: voucher.expiryDate
        })
        
        // Debug: Show all usages for this voucher
        const voucherUsages = usages.filter(usage => usage.voucherId === voucher.id)
        if (voucherUsages.length > 0) {
          console.log(`📋   -> Usages for ${voucher.code}:`, voucherUsages.map(u => ({
            id: u.id,
            patientName: u.patientName,
            usedDate: u.usedDate,
            discountAmount: u.discountAmount
          })))
        }
        
        // Priority 1: Check if inactive (manual disable)
        if (!voucher.isActive) {
          status = 'inactive'
          statusColor = 'gray'
          statusText = 'Tidak Aktif'
          console.log(`📋   -> Status: ${statusText} (manually disabled)`)
        }
        // Priority 2: Check if voucher has been used (terpakai) - HIGHEST PRIORITY after inactive
        else if (voucherUsageCount > 0) {
          status = 'used'
          statusColor = 'blue'
          statusText = 'Terpakai'
          console.log(`📋   -> Status: ${statusText} (${voucherUsageCount} usages found)`)
        }
        // Priority 3: Check if expired (kadaluwarsa)
        else if (voucher.expiryDate) {
          const expiryDate = new Date(voucher.expiryDate)
          if (now > expiryDate) {
            status = 'expired'
            statusColor = 'red'
            statusText = 'Kadaluwarsa'
            console.log(`📋   -> Status: ${statusText} (expired ${expiryDate.toISOString()})`)
          } else {
            console.log(`📋   -> Status: ${statusText} (expires ${expiryDate.toISOString()})`)
          }
        }
        // Priority 4: Check if usage limit reached
        else if (voucher.usageLimit && voucherUsageCount >= voucher.usageLimit) {
          status = 'used_up'
          statusColor = 'orange'
          statusText = 'Habis Terpakai'
          console.log(`📋   -> Status: ${statusText} (${voucherUsageCount}/${voucher.usageLimit} limit reached)`)
        }
        else {
          console.log(`📋   -> Status: ${statusText} (no conditions met)`)
        }
        
        // Get recipients
        const recipients = assignments
          .filter(assignment => assignment.voucherId === voucher.id)
          .map(assignment => {
            const patient = patients.find(p => p.id === assignment.patientId)
            return {
              patientId: assignment.patientId,
              patientName: patient?.name || 'Unknown',
              assignedDate: assignment.assignedDate,
              used: usages.some(usage => usage.voucherId === voucher.id && usage.patientId === assignment.patientId)
            }
          })

        const result = {
          ...voucher,
          status,
          statusColor,
          statusText,
          currentUsage: Math.max(voucherUsageCount, storedUsageCount), // Use the higher count
          recipients,
          usages: voucherUsages,
          // Add debug fields
          debug: {
            calculatedUsageCount: voucherUsageCount,
            storedUsageCount: storedUsageCount,
            lastCalculatedAt: timestamp
          }
        }
        
        console.log(`📋   -> Final result: ${result.statusText} (${result.currentUsage} usages)`)
        return result
      })

      // Sort by creation date descending
      vouchersWithStatus.sort((a, b) => 
        new Date(b.created_at || b.createdDate).getTime() - new Date(a.created_at || a.createdDate).getTime()
      )

      const summary = {
        total: vouchersWithStatus.length,
        active: vouchersWithStatus.filter(v => v.status === 'active').length,
        used: vouchersWithStatus.filter(v => v.status === 'used').length,
        expired: vouchersWithStatus.filter(v => v.status === 'expired').length,
        usedUp: vouchersWithStatus.filter(v => v.status === 'used_up').length,
        inactive: vouchersWithStatus.filter(v => v.status === 'inactive').length
      }

      console.log(`📋 Voucher status summary:`, summary)
      console.log(`📋 Returning ${vouchersWithStatus.length} vouchers with status`)

      return c.json({
        success: true,
        vouchers: vouchersWithStatus,
        count: vouchersWithStatus.length,
        summary,
        debug: {
          timestamp,
          totalVouchers: vouchers.length,
          totalUsages: usages.length,
          totalAssignments: assignments.length
        }
      })
    } catch (error) {
      console.log('❌ Error fetching voucher status:', error)
      return c.json({ 
        error: 'Gagal mengambil status voucher', 
        details: error.message 
      }, 500)
    }
  })
  // Initialize promo images storage bucket
  const initializePromoBucket = async () => {
    const bucketName = 'make-73417b67-promo-images'
    try {
      console.log('Initializing promo images storage bucket...')
      
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName)
      if (!bucketExists) {
        console.log('Creating new bucket with public access...')
        const { data, error } = await supabase.storage.createBucket(bucketName, { 
          public: true,  // Make bucket public for easier access
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (error) {
          console.log('Error creating bucket:', error)
          // Try without advanced options
          await supabase.storage.createBucket(bucketName, { public: true })
        }
        
        console.log('Promo images bucket created with public access')
      } else {
        console.log('Promo images bucket already exists')
        
        // Try to update bucket to be public if it exists
        try {
          await supabase.storage.updateBucket(bucketName, { public: true })
          console.log('Updated existing bucket to be public')
        } catch (updateError) {
          console.log('Could not update bucket to public:', updateError)
        }
      }
    } catch (error) {
      console.log('Error initializing promo bucket:', error)
    }
  }

  // Initialize bucket on startup
  initializePromoBucket()

  // ==== AGGRESSIVE ANTI-CORRUPTION SYSTEM ====
  // Auto-cleanup every 10 minutes (aggressive mode)
  const startAntiCorruptionSystem = () => {
    console.log('🛡️ Starting Anti-Corruption System...')
    
    const runCleanup = async () => {
      try {
        console.log('🧹 Running scheduled corruption cleanup...')
        
        // Get all vouchers and clean silently
        const allVouchers = await kv.getByPrefix('voucher_')
        let cleanedCount = 0
        
        for (const voucher of allVouchers) {
          const isCorrupt = !voucher.code || voucher.code === 'CORRUPT' || voucher.code === 'UNDEFINED' ||
                           !voucher.title || voucher.title === 'Data Corrupt' || voucher.title === 'Corrupted Voucher' || voucher.title === 'UNDEFINED' ||
                           typeof voucher.discountValue !== 'number' || voucher.discountValue < 0 || isNaN(voucher.discountValue) ||
                           !voucher.expiryDate || voucher.expiryDate === 'Invalid Date' || isNaN(new Date(voucher.expiryDate).getTime())

          if (isCorrupt) {
            console.log('🗑️ Auto-cleaning corrupt voucher:', voucher.id)
            await kv.del(voucher.id)
            cleanedCount++
          }
        }
        
        // Clean corrupt history
        const allHistory = await kv.getByPrefix('promo_history_')
        for (const history of allHistory) {
          const isCorrupt = !history.type || typeof history.type !== 'string' ||
                           !history.title || history.title === 'Data Corrupt' || history.title === 'CORRUPT' ||
                           !history.sentDate || isNaN(new Date(history.sentDate).getTime()) ||
                           !Array.isArray(history.recipientNames) || history.recipientNames.length === 0 ||
                           typeof history.recipientCount !== 'number' || history.recipientCount <= 0

          if (isCorrupt) {
            console.log('🗑️ Auto-cleaning corrupt history:', history.id)
            await kv.del(history.id)
            cleanedCount++
          }
        }
        
        // Clean corrupt assignments
        const allAssignments = await kv.getByPrefix('voucher_assignment_')
        for (const assignment of allAssignments) {
          const isCorrupt = !assignment.voucherId || assignment.voucherId === 'undefined' ||
                           !assignment.patientId || assignment.patientId === 'undefined' ||
                           !assignment.voucherCode || assignment.voucherCode === 'UNDEFINED' ||
                           !assignment.patientName || assignment.patientName === 'undefined'

          if (isCorrupt) {
            console.log('🗑️ Auto-cleaning corrupt assignment:', assignment.id)
            await kv.del(assignment.id)
            cleanedCount++
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`✅ Anti-corruption cleaned ${cleanedCount} corrupt records`)
        } else {
          console.log('✅ Anti-corruption: No corrupt data found')
        }
        
      } catch (error) {
        console.log('❌ Anti-corruption system error:', error)
      }
    }
    
    // Run immediately
    runCleanup()
    
    // Schedule every 10 minutes (600000ms)
    setInterval(runCleanup, 10 * 60 * 1000)
  }
  
  // Start the anti-corruption system
  startAntiCorruptionSystem()

  // ==== DATA SANITIZATION PIPELINE ====
  const sanitizeVoucherData = (data: any) => {
    console.log('🧼 Sanitizing voucher data:', data)
    
    return {
      id: data.id || `voucher_${Date.now()}`,
      code: (data.code || '').toString().trim().toUpperCase() || `AUTO${Date.now()}`,
      title: (data.title || '').toString().trim() || 'Auto Generated Voucher',
      description: (data.description || '').toString().trim() || 'Voucher description',
      discountType: data.discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Math.max(0, Number(data.discountValue) || 0),
      maxDiscount: data.maxDiscount ? Math.max(0, Number(data.maxDiscount)) : null,
      minAmount: data.minAmount ? Math.max(0, Number(data.minAmount)) : null,
      minPurchase: data.minPurchase ? Math.max(0, Number(data.minPurchase)) : null,
      usageLimit: data.usageLimit ? Math.max(1, Number(data.usageLimit)) : null,
      currentUsage: Math.max(0, Number(data.currentUsage) || 0),
      expiryDate: data.expiryDate && !isNaN(new Date(data.expiryDate).getTime()) 
        ? data.expiryDate 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      isActive: Boolean(data.isActive !== false), // Default true
      imageUrl: (data.imageUrl || '').toString().trim() || null,
      recipientNames: Array.isArray(data.recipientNames) ? data.recipientNames : [],
      recipientCount: data.recipientCount ? Math.max(0, Number(data.recipientCount)) : 0,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdBy: data.createdBy || 'system'
    }
  }

  // Get all promo images
  app.get('/make-server-73417b67/promo-images', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const images = await kv.getByPrefix('promo_image_')
      
      // Sort by upload date descending
      const sortedImages = images.sort((a: any, b: any) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )

      // Generate fresh URLs for each image with fallbacks
      const imagesWithUrls = await Promise.all(
        sortedImages.map(async (image: any) => {
          try {
            console.log('Refreshing URL for image:', image.id, image.filename)
            
            // Try signed URL first
            const { data: signedUrl, error: signedError } = await supabase.storage
              .from('make-73417b67-promo-images')
              .createSignedUrl(image.filename, 60 * 60 * 24) // 24 hours

            if (!signedError && signedUrl?.signedUrl) {
              console.log('Signed URL refreshed successfully for:', image.id)
              return {
                ...image,
                fileUrl: signedUrl.signedUrl
              }
            }
            
            console.log('Signed URL failed, trying public URL for:', image.id, signedError)
            
            // Fallback to public URL
            const { data: publicUrl } = supabase.storage
              .from('make-73417b67-promo-images')
              .getPublicUrl(image.filename)
            
            if (publicUrl?.publicUrl) {
              console.log('Public URL used for:', image.id)
              return {
                ...image,
                fileUrl: publicUrl.publicUrl
              }
            }
            
            console.log('Both URL methods failed, using existing URL for:', image.id)
            return image
            
          } catch (error) {
            console.log('Error generating URL for image:', image.id, error)
            return image
          }
        })
      )

      return c.json({ success: true, images: imagesWithUrls })
    } catch (error) {
      console.log('Error getting promo images:', error)
      return c.json({ error: 'Failed to get promo images' }, 500)
    }
  })

  // Upload promo image
  app.post('/make-server-73417b67/promo-images/upload', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const formData = await c.req.formData()
      const file = formData.get('image') as File
      const originalName = formData.get('originalName') as string
      
      if (!file) {
        return c.json({ error: 'No file provided' }, 400)
      }

      // Validate file type
      if (!file.type.startsWith('image/') || 
          (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png'))) {
        return c.json({ error: 'Only JPEG and PNG files are allowed' }, 400)
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return c.json({ error: 'File size must be less than 5MB' }, 400)
      }

      const fileName = `promo_${Date.now()}_${file.name}`
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('make-73417b67-promo-images')
        .upload(fileName, file)

      if (uploadError) {
        console.log('Upload error:', uploadError)
        return c.json({ error: 'Failed to upload image' }, 500)
      }

      // Generate signed URL with error handling
      let fileUrl = null
      try {
        console.log('Generating signed URL for file:', fileName)
        const { data: signedUrl, error: signedUrlError } = await supabase.storage
          .from('make-73417b67-promo-images')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year
        
        if (signedUrlError) {
          console.log('Signed URL error:', signedUrlError)
          throw signedUrlError
        }
        
        if (signedUrl?.signedUrl) {
          fileUrl = signedUrl.signedUrl
          console.log('Signed URL generated successfully:', fileUrl.substring(0, 60) + '...')
        } else {
          console.log('No signed URL returned from Supabase')
          throw new Error('No signed URL returned')
        }
      } catch (signedUrlError) {
        console.log('Failed to create signed URL, trying public URL:', signedUrlError)
        
        // Fallback: try to create public URL
        try {
          const { data: publicUrl } = supabase.storage
            .from('make-73417b67-promo-images')
            .getPublicUrl(fileName)
          
          if (publicUrl?.publicUrl) {
            fileUrl = publicUrl.publicUrl
            console.log('Public URL used as fallback:', fileUrl)
          }
        } catch (publicUrlError) {
          console.log('Public URL fallback also failed:', publicUrlError)
        }
      }

      if (!fileUrl) {
        console.log('No valid URL could be generated for the image')
        return c.json({ error: 'Failed to generate image URL' }, 500)
      }

      // Save image metadata to KV store
      const imageId = `promo_image_${Date.now()}`
      const imageData = {
        id: imageId,
        filename: fileName,
        originalName: originalName || file.name,
        fileUrl: fileUrl,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user.id
      }

      await kv.set(imageId, imageData)

      console.log('✅ Image upload successful, returning data:', imageData)
      return c.json({ 
        success: true, 
        imageData: imageData,
        image: imageData // Keep both for compatibility
      })
    } catch (error) {
      console.log('Error uploading promo image:', error)
      return c.json({ error: 'Failed to upload promo image' }, 500)
    }
  })

  // Delete promo image
  app.delete('/make-server-73417b67/promo-images/:id', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const imageId = c.req.param('id')
      
      // Get image data
      const imageData = await kv.get(imageId)
      if (!imageData) {
        return c.json({ error: 'Image not found' }, 404)
      }

      // Delete from storage
      try {
        const { error: deleteError } = await supabase.storage
          .from('make-73417b67-promo-images')
          .remove([imageData.filename])

        if (deleteError) {
          console.log('Error deleting from storage:', deleteError)
          // Continue with metadata deletion even if storage deletion fails
        }
      } catch (storageError) {
        console.log('Storage deletion error:', storageError)
      }

      // Delete metadata from KV store
      await kv.del(imageId)

      return c.json({ success: true })
    } catch (error) {
      console.log('Error deleting promo image:', error)
      return c.json({ error: 'Failed to delete promo image' }, 500)
    }
  })

  // Log promo activity
  app.post('/make-server-73417b67/promo-logs', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const logId = `promo_log_${Date.now()}`
      const logData = {
        id: logId,
        ...body,
        loggedBy: user.id,
        loggedAt: new Date().toISOString()
      }

      await kv.set(logId, logData)

      return c.json({ success: true, log: logData })
    } catch (error) {
      console.log('Error logging promo activity:', error)
      return c.json({ error: 'Failed to log promo activity' }, 500)
    }
  })

  // Get promo logs
  app.get('/make-server-73417b67/promo-logs', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const logs = await kv.getByPrefix('promo_log_')
      
      // Sort by log date descending
      const sortedLogs = logs.sort((a: any, b: any) => 
        new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
      )

      return c.json({ success: true, logs: sortedLogs })
    } catch (error) {
      console.log('Error getting promo logs:', error)
      return c.json({ error: 'Failed to get promo logs' }, 500)
    }
  })

  // Test image URL endpoint for debugging
  app.get('/make-server-73417b67/promo-images/test/:filename', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const filename = c.req.param('filename')
      console.log('Testing URL generation for filename:', filename)

      const results = {
        filename,
        tests: {} as any
      }

      // Test 1: Signed URL (short term)
      try {
        const { data: signedUrl, error: signedError } = await supabase.storage
          .from('make-73417b67-promo-images')
          .createSignedUrl(filename, 60 * 5) // 5 minutes
        
        results.tests.signedUrl = {
          success: !signedError,
          url: signedUrl?.signedUrl || null,
          error: signedError?.message || null
        }
      } catch (error) {
        results.tests.signedUrl = {
          success: false,
          url: null,
          error: error.message
        }
      }

      // Test 2: Public URL
      try {
        const { data: publicUrl } = supabase.storage
          .from('make-73417b67-promo-images')
          .getPublicUrl(filename)
        
        results.tests.publicUrl = {
          success: !!publicUrl?.publicUrl,
          url: publicUrl?.publicUrl || null,
          error: null
        }
      } catch (error) {
        results.tests.publicUrl = {
          success: false,
          url: null,
          error: error.message
        }
      }

      // Test 3: Check if file exists
      try {
        const { data, error } = await supabase.storage
          .from('make-73417b67-promo-images')
          .download(filename)
        
        results.tests.fileExists = {
          success: !error,
          fileSize: data ? data.size : null,
          error: error?.message || null
        }
      } catch (error) {
        results.tests.fileExists = {
          success: false,
          fileSize: null,
          error: error.message
        }
      }

      console.log('URL test results:', results)
      return c.json({ success: true, results })
    } catch (error) {
      console.log('Error testing image URL:', error)
      return c.json({ error: 'Failed to test image URL' }, 500)
    }
  })

  // Get vouchers
  app.get('/make-server-73417b67/vouchers', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const vouchers = await kv.getByPrefix('voucher_')
      console.log('✅ Vouchers fetched:', vouchers.length, 'records')
      
      // Sort vouchers by creation date descending
      const sortedVouchers = vouchers.sort((a: any, b: any) => 
        new Date(b.created_at || b.createdDate || 0).getTime() - new Date(a.created_at || a.createdDate || 0).getTime()
      )
      
      return c.json({ 
        success: true, 
        vouchers: sortedVouchers
      })
    } catch (error) {
      console.log('Error fetching vouchers:', error)
      return c.json({ error: 'Failed to fetch vouchers' }, 500)
    }
  })

  // Create voucher
  app.post('/make-server-73417b67/vouchers', async (c: any) => {
    try {
      console.log('📝 Creating new voucher...')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const rawData = await c.req.json()
      console.log('📝 Raw voucher data received:', rawData)
      
      // STRICT SANITIZATION - NO CORRUPT DATA ALLOWED
      const voucherData = sanitizeVoucherData({
        ...rawData,
        createdBy: user.id
      })
      console.log('📝 Sanitized voucher data:', voucherData)
      
      // Additional validation
      if (!voucherData.code || !voucherData.title || !voucherData.discountType || 
          !voucherData.discountValue || !voucherData.expiryDate) {
        return c.json({ error: 'Missing required fields after sanitization' }, 400)
      }

      await kv.set(voucherData.id, voucherData)
      console.log('✅ Voucher created successfully:', voucherData.id)

      return c.json({ 
        success: true, 
        voucher: voucherData,
        message: 'Voucher berhasil dibuat'
      })
    } catch (error) {
      console.log('❌ Error creating voucher:', error)
      return c.json({ error: 'Failed to create voucher' }, 500)
    }
  })

  // Delete voucher (legacy endpoint, redirects to new comprehensive delete)
  app.delete('/make-server-73417b67/vouchers/:id', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const voucherId = c.req.param('id')
      console.log('🗑️ Legacy delete voucher endpoint called for:', voucherId)
      
      // Check if voucher exists
      const voucherData = await kv.get(voucherId)
      if (!voucherData) {
        return c.json({ error: 'Voucher not found' }, 404)
      }

      console.log('🗑️ Found voucher to delete:', voucherData.code)

      // Use comprehensive delete logic
      await kv.del(voucherId)

      // Delete related assignments
      const assignments = await kv.getByPrefix('voucher_assignment_')
      const relatedAssignments = assignments.filter(assignment => assignment.voucherId === voucherId)
      
      for (const assignment of relatedAssignments) {
        console.log('🗑️ Deleting related assignment:', assignment.id)
        await kv.del(assignment.id)
      }

      // Delete related recipients
      const recipients = await kv.getByPrefix('voucher_recipient_')
      const relatedRecipients = recipients.filter(recipient => recipient.voucherId === voucherId)
      
      for (const recipient of relatedRecipients) {
        console.log('🗑️ Deleting related recipient:', recipient.id)
        await kv.del(recipient.id)
      }

      // Delete related usages
      const usages = await kv.getByPrefix('voucher_usage_')
      const relatedUsages = usages.filter(usage => usage.voucherId === voucherId)
      
      for (const usage of relatedUsages) {
        console.log('🗑��� Deleting related usage:', usage.id)
        await kv.del(usage.id)
      }

      const deletedCount = 1 + relatedAssignments.length + relatedRecipients.length + relatedUsages.length

      console.log(`✅ Voucher "${voucherData.code}" deleted successfully with ${deletedCount} total records`)

      return c.json({
        success: true,
        message: `Voucher "${voucherData.code}" berhasil dihapus`,
        deletedCount,
        details: {
          voucher: 1,
          assignments: relatedAssignments.length,
          recipients: relatedRecipients.length,
          usages: relatedUsages.length
        }
      })
    } catch (error) {
      console.log('❌ Error deleting voucher:', error)
      return c.json({ error: 'Failed to delete voucher' }, 500)
    }
  })

  // Upload voucher image (generated from canvas)
  app.post('/make-server-73417b67/vouchers/upload-image', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { imageData, voucherCode, voucherTitle } = body
      
      if (!imageData || !voucherCode) {
        return c.json({ error: 'Missing image data or voucher code' }, 400)
      }

      // Convert base64 to blob
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      let buffer
      try {
        buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      } catch (decodeError) {
        console.log('Error decoding base64 image data:', decodeError)
        return c.json({ error: 'Invalid image data format' }, 400)
      }
      
      const fileName = `voucher_${voucherCode}_${Date.now()}.png`
      
      // Upload to Supabase Storage with public access
      const { data, error: uploadError } = await supabase.storage
        .from('make-73417b67-promo-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false
        })

      if (uploadError) {
        console.log('Voucher image upload error:', uploadError)
        return c.json({ error: 'Failed to upload voucher image' }, 500)
      }

      // Get public URL for the voucher image
      const { data: publicUrl } = supabase.storage
        .from('make-73417b67-promo-images')
        .getPublicUrl(fileName)

      if (!publicUrl?.publicUrl) {
        console.log('Failed to get public URL for voucher image')
        return c.json({ error: 'Failed to get voucher image URL' }, 500)
      }

      // Save voucher image metadata
      const voucherImageId = `voucher_image_${Date.now()}`
      const voucherImageData = {
        id: voucherImageId,
        filename: fileName,
        voucherCode,
        voucherTitle: voucherTitle || 'Voucher Diskon',
        fileUrl: publicUrl.publicUrl,
        uploadDate: new Date().toISOString(),
        uploadedBy: user.id,
        type: 'voucher'
      }

      await kv.set(voucherImageId, voucherImageData)

      console.log('✅ Voucher image uploaded successfully:', fileName)
      return c.json({ 
        success: true, 
        imageUrl: publicUrl.publicUrl,
        voucherImageData
      })
    } catch (error) {
      console.log('Error uploading voucher image:', error)
      return c.json({ error: 'Failed to upload voucher image' }, 500)
    }
  })

  // Get promo history
  app.get('/make-server-73417b67/promo-history', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const allHistory = await kv.getByPrefix('promo_history_')
      console.log('📦 Raw promo history fetched:', allHistory.length, 'records')
      
      // Filter out corrupt data
      const validHistory = allHistory.filter((item: any) => {
        const hasValidType = item.type && typeof item.type === 'string' && item.type.trim() !== ''
        const hasValidTitle = item.title && typeof item.title === 'string' && item.title !== 'Data Corrupt' && item.title !== 'CORRUPT' && item.title.trim() !== ''
        const hasValidDate = item.sentDate && !isNaN(new Date(item.sentDate).getTime())
        const hasValidRecipients = Array.isArray(item.recipientNames) && item.recipientNames.length > 0 && item.recipientNames.every((name: any) => name && typeof name === 'string' && name.trim() !== '')
        const hasValidCount = typeof item.recipientCount === 'number' && item.recipientCount > 0
        
        return hasValidType && hasValidTitle && hasValidDate && hasValidRecipients && hasValidCount
      })
      
      console.log('✅ Valid promo history:', validHistory.length, 'records')
      console.log('🧹 Filtered out', allHistory.length - validHistory.length, 'corrupt entries')
      
      // Sort history by sent date descending
      const sortedHistory = validHistory.sort((a: any, b: any) => 
        new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime()
      )
      
      return c.json({ 
        success: true, 
        history: sortedHistory,
        totalFetched: allHistory.length,
        validCount: validHistory.length,
        filteredOut: allHistory.length - validHistory.length
      })
    } catch (error) {
      console.log('❌ Error fetching promo history:', error)
      return c.json({ error: 'Failed to fetch promo history' }, 500)
    }
  })

  // Create promo history
  app.post('/make-server-73417b67/promo-history', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { type, title, recipientCount, recipientNames, recipientPhones, imageUrl, voucherCode } = body
      
      // Comprehensive validation to prevent corrupt data
      if (!type || typeof type !== 'string' || type.trim() === '') {
        console.log('❌ Invalid type:', type)
        return c.json({ error: 'Invalid type field' }, 400)
      }
      
      if (!title || typeof title !== 'string' || title.trim() === '' || title === 'Data Corrupt' || title === 'CORRUPT') {
        console.log('❌ Invalid title:', title)
        return c.json({ error: 'Invalid title field' }, 400)
      }
      
      if (!recipientCount || typeof recipientCount !== 'number' || recipientCount <= 0) {
        console.log('❌ Invalid recipientCount:', recipientCount)
        return c.json({ error: 'Invalid recipient count' }, 400)
      }
      
      if (!Array.isArray(recipientNames) || recipientNames.length === 0 || recipientNames.some(name => !name || typeof name !== 'string' || name.trim() === '')) {
        console.log('❌ Invalid recipientNames:', recipientNames)
        return c.json({ error: 'Invalid recipient names' }, 400)
      }
      
      if (!Array.isArray(recipientPhones) || recipientPhones.length === 0 || recipientPhones.some(phone => !phone || typeof phone !== 'string' || phone.trim() === '')) {
        console.log('❌ Invalid recipientPhones:', recipientPhones)
        return c.json({ error: 'Invalid recipient phones' }, 400)
      }

      const historyId = `promo_history_${Date.now()}`
      const historyData = {
        id: historyId,
        type: type.trim(),
        title: title.trim(),
        recipientCount: parseInt(recipientCount),
        recipientNames: recipientNames.map((name: string) => name.trim()),
        recipientPhones: recipientPhones.map((phone: string) => phone.trim()),
        sentDate: new Date().toISOString(),
        sentBy: user.id,
        imageUrl: imageUrl || null,
        voucherCode: voucherCode || null
      }

      // Final validation before saving
      if (!historyData.title || historyData.title === 'Data Corrupt' || historyData.recipientNames.length === 0) {
        console.log('❌ Data validation failed before saving:', historyData)
        return c.json({ error: 'Data validation failed' }, 400)
      }

      await kv.set(historyId, historyData)
      console.log('✅ Valid promo history saved:', historyId)

      return c.json({ 
        success: true, 
        history: historyData
      })
    } catch (error) {
      console.log('❌ Error logging promo history:', error)
      return c.json({ error: 'Failed to log promo history' }, 500)
    }
  })

  // Delete promo history
  app.delete('/make-server-73417b67/promo-history/:id', async (c: any) => {
    try {
      console.log('🗑️ DELETE promo history endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      console.log('🔑 Access token present:', !!accessToken)
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      console.log('👤 User auth result:', { userId: user?.id, error: error?.message })
      
      if (!user?.id) {
        console.log('❌ Unauthorized: No user ID')
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const historyId = c.req.param('id')
      console.log('🆔 History ID to delete:', historyId)
      
      // Check if history exists
      const historyData = await kv.get(historyId)
      console.log('📋 History data found:', !!historyData)
      
      if (!historyData) {
        console.log('❌ History record not found:', historyId)
        return c.json({ error: 'History record not found' }, 404)
      }

      console.log('📝 History details:', {
        id: historyData.id,
        type: historyData.type,
        title: historyData.title,
        sentBy: historyData.sentBy,
        requestingUser: user.id
      })

      // Check if user has permission to delete (only creator or admin)
      if (historyData.sentBy !== user.id && user.user_metadata?.role !== 'admin') {
        console.log('❌ Insufficient permissions:', {
          sentBy: historyData.sentBy,
          userId: user.id,
          userRole: user.user_metadata?.role
        })
        return c.json({ error: 'Insufficient permissions to delete this history record' }, 403)
      }

      // Delete history from KV store
      console.log('����️ Deleting from KV store...')
      await kv.del(historyId)

      console.log(`✅ Promo history deleted successfully: ${historyId} by user: ${user.id}`)
      return c.json({ success: true, message: 'History deleted successfully' })
    } catch (error) {
      console.log('💥 Error deleting promo history:', error)
      return c.json({ error: 'Failed to delete promo history' }, 500)
    }
  })

  // ============= VOUCHER CRUD ENDPOINTS =============
  
  // Get all vouchers
  app.get('/make-server-73417b67/vouchers', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const allVouchers = await kv.getByPrefix('voucher_')
      console.log('📦 Raw vouchers fetched:', allVouchers.length, 'records')
      
      // Filter out corrupt vouchers
      const validVouchers = allVouchers.filter((voucher: any) => {
        // Check for corrupt data markers
        const hasValidCode = voucher.code && voucher.code !== 'CORRUPT' && typeof voucher.code === 'string' && voucher.code.trim() !== ''
        const hasValidTitle = voucher.title && voucher.title !== 'Data Corrupt' && voucher.title !== 'Corrupted Voucher' && typeof voucher.title === 'string' && voucher.title.trim() !== ''
        const hasValidDiscountValue = typeof voucher.discountValue === 'number' && voucher.discountValue >= 0 && !isNaN(voucher.discountValue)
        const hasValidExpiryDate = voucher.expiryDate && voucher.expiryDate !== 'Invalid Date' && !isNaN(new Date(voucher.expiryDate).getTime())
        const hasValidDiscountType = voucher.discountType === 'percentage' || voucher.discountType === 'fixed'
        
        return hasValidCode && hasValidTitle && hasValidDiscountValue && hasValidExpiryDate && hasValidDiscountType
      })
      
      console.log('✅ Valid vouchers:', validVouchers.length, 'records')
      console.log('🧹 Filtered out', allVouchers.length - validVouchers.length, 'corrupt vouchers')
      
      // Sort by creation date descending
      const sortedVouchers = validVouchers.sort((a: any, b: any) => 
        new Date(b.createdDate || b.created_at || 0).getTime() - new Date(a.createdDate || a.created_at || 0).getTime()
      )
      
      return c.json({ 
        success: true, 
        vouchers: sortedVouchers,
        totalFetched: allVouchers.length,
        validCount: validVouchers.length,
        filteredOut: allVouchers.length - validVouchers.length
      })
    } catch (error) {
      console.log('❌ Error fetching vouchers:', error)
      return c.json({ error: 'Failed to fetch vouchers' }, 500)
    }
  })

  // Create new voucher
  app.post('/make-server-73417b67/vouchers', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { code, title, description, discountType, discountValue, expiryDate, usageLimit, minPurchase } = body
      
      console.log('🎫 Creating new voucher:', { code, title, discountType, discountValue })

      // Comprehensive validation
      if (!code || typeof code !== 'string' || code.trim() === '' || code === 'CORRUPT') {
        return c.json({ error: 'Kode voucher tidak valid' }, 400)
      }
      
      if (!title || typeof title !== 'string' || title.trim() === '' || title === 'Data Corrupt' || title === 'Corrupted Voucher') {
        return c.json({ error: 'Judul voucher tidak valid' }, 400)
      }
      
      if (!discountType || (discountType !== 'percentage' && discountType !== 'fixed')) {
        return c.json({ error: 'Tipe diskon tidak valid' }, 400)
      }
      
      const parsedDiscountValue = parseFloat(discountValue)
      if (!discountValue || isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
        return c.json({ error: 'Nilai diskon tidak valid' }, 400)
      }
      
      if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
        return c.json({ error: 'Tanggal kadaluarsa tidak valid' }, 400)
      }

      // Check if voucher code already exists (filter out corrupt vouchers first)
      const existingVouchers = await kv.getByPrefix('voucher_')
      const validExistingVouchers = existingVouchers.filter(v => 
        v.code && v.code !== 'UNDEFINED' && typeof v.code === 'string'
      )
      const codeExists = validExistingVouchers.some(v => v.code === code.toUpperCase().trim())
      if (codeExists) {
        return c.json({ error: 'Kode voucher sudah ada' }, 400)
      }

      const voucherId = `voucher_${Date.now()}`
      const voucher = {
        id: voucherId,
        code: code.toUpperCase().trim(),
        title: title.trim(),
        description: (description || '').trim(),
        discountType,
        discountValue: parsedDiscountValue,
        expiryDate: new Date(expiryDate).toISOString(),
        usageLimit: usageLimit ? Math.max(0, parseInt(usageLimit) || 0) : 0,
        usageCount: 0,
        currentUsage: 0,
        minPurchase: minPurchase ? Math.max(0, parseFloat(minPurchase) || 0) : 0,
        isActive: true,
        createdDate: new Date().toISOString(),
        createdBy: user.id,
        created_at: new Date().toISOString(),
        minAmount: minPurchase ? Math.max(0, parseFloat(minPurchase) || 0) : 0
      }

      // Final validation before saving
      if (!voucher.code || voucher.code === 'CORRUPT' || !voucher.title || voucher.title === 'Data Corrupt' || voucher.discountValue <= 0) {
        console.log('❌ Final validation failed:', voucher)
        return c.json({ error: 'Validasi data voucher gagal' }, 400)
      }

      await kv.set(voucherId, voucher)
      console.log('✅ Voucher created successfully:', voucherId, voucher.code, voucher.title)
      
      return c.json({ 
        success: true, 
        voucher: voucher 
      })
    } catch (error) {
      console.log('❌ Error creating voucher:', error)
      return c.json({ error: 'Failed to create voucher' }, 500)
    }
  })

  // Update voucher
  app.put('/make-server-73417b67/vouchers/:id', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const voucherId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('🎫 Updating voucher:', voucherId)

      // Get existing voucher
      const existingVoucher = await kv.get(voucherId)
      if (!existingVoucher) {
        return c.json({ error: 'Voucher not found' }, 404)
      }

      // Check if code change conflicts with existing vouchers
      if (body.code && body.code.toUpperCase() !== existingVoucher.code) {
        const allVouchers = await kv.getByPrefix('voucher_')
        const codeExists = allVouchers.some(v => v.id !== voucherId && v.code === body.code.toUpperCase())
        if (codeExists) {
          return c.json({ error: 'Kode voucher sudah ada' }, 400)
        }
      }

      const updatedVoucher = {
        ...existingVoucher,
        ...body,
        id: voucherId,
        code: body.code ? body.code.toUpperCase() : existingVoucher.code,
        discountValue: body.discountValue ? parseFloat(body.discountValue) : existingVoucher.discountValue,
        usageLimit: body.usageLimit !== undefined ? parseInt(body.usageLimit) : existingVoucher.usageLimit,
        minPurchase: body.minPurchase !== undefined ? parseFloat(body.minPurchase) : existingVoucher.minPurchase,
        createdDate: existingVoucher.createdDate,
        createdBy: existingVoucher.createdBy,
        created_at: existingVoucher.created_at,
        updated_at: new Date().toISOString()
      }

      await kv.set(voucherId, updatedVoucher)
      console.log('✅ Voucher updated successfully:', voucherId)
      
      return c.json({ 
        success: true, 
        voucher: updatedVoucher 
      })
    } catch (error) {
      console.log('❌ Error updating voucher:', error)
      return c.json({ error: 'Failed to update voucher' }, 500)
    }
  })

  // Delete voucher
  app.delete('/make-server-73417b67/vouchers/:id', async (c: any) => {
    try {
      console.log('🗑️ DELETE voucher endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      console.log('🔑 Access token present:', !!accessToken)
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      console.log('👤 User auth result:', { userId: user?.id, error: error?.message })
      
      if (!user?.id) {
        console.log('❌ Unauthorized: No user ID')
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const voucherId = c.req.param('id')
      const forceDelete = c.req.query('force') === 'true'
      console.log('🆔 Voucher ID to delete:', voucherId, 'Force delete:', forceDelete)
      
      // Check if voucher exists
      const voucherData = await kv.get(voucherId)
      console.log('🎫 Voucher data found:', !!voucherData)
      
      if (!voucherData) {
        console.log('❌ Voucher not found:', voucherId)
        return c.json({ error: 'Voucher not found' }, 404)
      }

      // Normalize voucher data to handle corrupt data
      const normalizedVoucher = {
        id: voucherData.id || voucherId,
        code: voucherData.code || 'CORRUPT',
        title: voucherData.title || 'Corrupted Voucher',
        discountValue: voucherData.discountValue || 0,
        discountType: voucherData.discountType || 'percentage',
        expiryDate: voucherData.expiryDate || new Date().toISOString(),
        createdBy: voucherData.createdBy || user.id,
        isActive: voucherData.isActive !== undefined ? voucherData.isActive : true
      }

      console.log('🎫 Normalized voucher details:', {
        id: normalizedVoucher.id,
        code: normalizedVoucher.code,
        title: normalizedVoucher.title,
        discountValue: normalizedVoucher.discountValue,
        createdBy: normalizedVoucher.createdBy,
        requestingUser: user.id,
        isCorrupt: voucherData.code === undefined || voucherData.title === undefined
      })

      // Check if data is corrupt
      const isCorruptData = (
        voucherData.code === undefined || 
        voucherData.title === undefined ||
        voucherData.discountValue === undefined ||
        voucherData.expiryDate === undefined ||
        voucherData.expiryDate === 'Invalid Date' ||
        isNaN(voucherData.discountValue)
      )

      if (isCorruptData) {
        console.log('⚠️ Detected corrupt voucher data, allowing deletion')
      }

      // For admin users, allow force deletion of any voucher
      const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'Administrator'
      const isCreator = normalizedVoucher.createdBy === user.id

      // Check permissions (relaxed for corrupt data and admin force delete)
      if (!isCreator && !isAdmin && !isCorruptData) {
        console.log('❌ Insufficient permissions:', {
          createdBy: normalizedVoucher.createdBy,
          userId: user.id,
          userRole: user.user_metadata?.role,
          isAdmin,
          isCorruptData
        })
        return c.json({ error: 'Insufficient permissions to delete this voucher' }, 403)
      }

      // Check if voucher has been used (skip for corrupt data or force delete)
      if (!isCorruptData && !forceDelete) {
        const usages = await kv.getByPrefix('voucher_usage_')
        const voucherUsages = usages.filter(usage => usage.voucherId === voucherId)
        
        if (voucherUsages.length > 0) {
          console.log('⚠️ Voucher has been used, cannot delete:', voucherUsages.length, 'times')
          
          // Allow admin to force delete even used vouchers
          if (!isAdmin) {
            return c.json({ 
              error: 'Voucher tidak dapat dihapus karena sudah pernah digunakan. Gunakan force delete jika Anda admin.',
              usageCount: voucherUsages.length,
              canForceDelete: isAdmin
            }, 400)
          } else {
            console.log('🔧 Admin force deleting used voucher')
          }
        }
      }

      // Delete voucher from KV store
      console.log('🗑️ Deleting voucher from KV store...')
      await kv.del(voucherId)

      // Also delete any assignments for this voucher
      const assignments = await kv.getByPrefix('voucher_assignment_')
      const voucherAssignments = assignments.filter(assignment => assignment.voucherId === voucherId)
      
      for (const assignment of voucherAssignments) {
        console.log('🗑️ Deleting voucher assignment:', assignment.id)
        await kv.del(assignment.id)
      }

      // If force delete, also remove usage records for this voucher
      if (forceDelete && isAdmin) {
        const usages = await kv.getByPrefix('voucher_usage_')
        const voucherUsages = usages.filter(usage => usage.voucherId === voucherId)
        
        for (const usage of voucherUsages) {
          console.log('🗑️ Force deleting voucher usage:', usage.id)
          await kv.del(usage.id)
        }
        
        console.log(`🔧 Force deleted ${voucherUsages.length} usage records`)
      }

      const deletionType = isCorruptData ? 'corrupt' : (forceDelete ? 'forced' : 'normal')
      console.log(`✅ Voucher deleted successfully (${deletionType}): ${voucherId} by user: ${user.id}`)
      
      return c.json({ 
        success: true, 
        message: isCorruptData ? 'Voucher dengan data corrupt berhasil dihapus' : 'Voucher berhasil dihapus',
        deletedAssignments: voucherAssignments.length,
        deletionType: deletionType,
        wasCorrupt: isCorruptData
      })
    } catch (error) {
      console.log('💥 Error deleting voucher:', error)
      return c.json({ error: 'Failed to delete voucher' }, 500)
    }
  })

  // Clean up corrupt voucher data
  app.post('/make-server-73417b67/vouchers/cleanup', async (c: any) => {
    try {
      console.log('🧹 Voucher cleanup endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Only allow admin users to run cleanup
      const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'Administrator'
      if (!isAdmin) {
        return c.json({ error: 'Only administrators can run voucher cleanup' }, 403)
      }

      console.log('🔧 Admin user running voucher cleanup:', user.email)

      // Get all vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      console.log('📋 Total vouchers found:', allVouchers.length)

      const corruptVouchers = []
      const cleanedVouchers = []

      for (const voucher of allVouchers) {
        const isCorrupt = (
          voucher.code === undefined || 
          voucher.title === undefined ||
          voucher.discountValue === undefined ||
          voucher.expiryDate === undefined ||
          voucher.expiryDate === 'Invalid Date' ||
          isNaN(voucher.discountValue) ||
          voucher.discountValue === null
        )

        if (isCorrupt) {
          console.log('🚨 Found corrupt voucher:', voucher.id, {
            code: voucher.code,
            title: voucher.title,
            discountValue: voucher.discountValue,
            expiryDate: voucher.expiryDate
          })
          corruptVouchers.push(voucher)
        }
      }

      console.log(`🧹 Found ${corruptVouchers.length} corrupt vouchers`)

      // Parse request body for options
      const { autoFix = false, checkOnly = false } = await c.req.json().catch(() => ({ autoFix: false, checkOnly: false }))

      if (corruptVouchers.length > 0 && autoFix) {
        console.log('🔧 Auto-fixing corrupt vouchers...')
        
        for (const voucher of corruptVouchers) {
          try {
            // Delete the corrupt voucher
            await kv.del(voucher.id)
            
            // Delete related assignments
            const assignments = await kv.getByPrefix('voucher_assignment_')
            const voucherAssignments = assignments.filter(assignment => assignment.voucherId === voucher.id)
            for (const assignment of voucherAssignments) {
              await kv.del(assignment.id)
            }
            
            // Delete related usages
            const usages = await kv.getByPrefix('voucher_usage_')
            const voucherUsages = usages.filter(usage => usage.voucherId === voucher.id)
            for (const usage of voucherUsages) {
              await kv.del(usage.id)
            }

            cleanedVouchers.push(voucher.id)
            console.log('✅ Cleaned corrupt voucher:', voucher.id)
          } catch (cleanupError) {
            console.log('❌ Error cleaning voucher:', voucher.id, cleanupError)
          }
        }
      }

      return c.json({
        success: true,
        totalVouchers: allVouchers.length,
        corruptVouchers: corruptVouchers.length,
        cleanedVouchers: cleanedVouchers.length,
        corruptData: corruptVouchers.map(v => ({
          id: v.id,
          code: v.code || 'UNDEFINED',
          title: v.title || 'UNDEFINED',
          discountValue: v.discountValue || 'UNDEFINED',
          expiryDate: v.expiryDate || 'UNDEFINED'
        })),
        cleanedIds: cleanedVouchers,
        message: autoFix 
          ? `Cleanup completed. ${cleanedVouchers.length} corrupt vouchers removed.`
          : `Found ${corruptVouchers.length} corrupt vouchers. Use autoFix: true to clean them.`
      })
    } catch (error) {
      console.log('💥 Error in voucher cleanup:', error)
      return c.json({ error: 'Failed to cleanup vouchers' }, 500)
    }
  })

  // Upload voucher image endpoint
  app.post('/make-server-73417b67/vouchers/upload-image', async (c: any) => {
    try {
      console.log('📤 Voucher image upload endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { imageData, voucherCode, voucherTitle } = body
      
      if (!imageData) {
        return c.json({ error: 'No image data provided' }, 400)
      }

      console.log('🖼️ Processing voucher image upload for:', voucherCode)

      // Convert base64 to blob
      const base64Data = imageData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      const fileName = `voucher_${voucherCode}_${Date.now()}.png`
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('make-73417b67-promo-images')
        .upload(fileName, blob)

      if (uploadError) {
        console.log('❌ Upload error:', uploadError)
        return c.json({ error: 'Failed to upload voucher image' }, 500)
      }

      // Generate public URL
      const { data: publicUrl } = supabase.storage
        .from('make-73417b67-promo-images')
        .getPublicUrl(fileName)

      if (!publicUrl?.publicUrl) {
        console.log('❌ Failed to generate public URL')
        return c.json({ error: 'Failed to generate image URL' }, 500)
      }

      console.log('✅ Voucher image uploaded successfully:', fileName)
      
      return c.json({ 
        success: true, 
        imageUrl: publicUrl.publicUrl,
        fileName: fileName
      })
    } catch (error) {
      console.log('💥 Error uploading voucher image:', error)
      return c.json({ error: 'Failed to upload voucher image' }, 500)
    }
  })

  // Generate unique voucher codes per patient for WhatsApp sending
  app.post('/make-server-73417b67/vouchers/generate-per-patient', async (c: any) => {
    try {
      console.log('🎫 Generate voucher codes per patient endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { voucherId, patientIds, mode = 'individual' } = body
      
      console.log('📋 Request details:', { voucherId, patientCount: patientIds?.length, mode })

      if (!voucherId || !patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
        return c.json({ error: 'Missing voucher ID or patient IDs' }, 400)
      }

      // Get base voucher template
      const baseVoucher = await kv.get(voucherId)
      if (!baseVoucher) {
        return c.json({ error: 'Base voucher template not found' }, 404)
      }

      console.log('🎫 Base voucher found:', baseVoucher.title)

      // Get patient data
      const patients = await kv.getByPrefix('patient_')
      const selectedPatients = patients.filter(p => patientIds.includes(p.id))
      
      if (selectedPatients.length !== patientIds.length) {
        return c.json({ error: 'Some patients not found' }, 404)
      }

      console.log('👥 Selected patients:', selectedPatients.length)

      // Generate unique codes per patient
      const generatedCodes = []
      const assignments = []

      for (const patient of selectedPatients) {
        // Generate unique code format: BASEPREFIX + PatientInitials + Random
        const patientInitials = patient.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 3)
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
        const basePrefix = baseVoucher.code ? baseVoucher.code.substring(0, 6) : 'DENTAL'
        const uniqueCode = `${basePrefix}${patientInitials}${randomSuffix}`

        // Create individual voucher record
        const individualVoucherId = `voucher_individual_${Date.now()}_${patient.id}`
        const individualVoucher = {
          id: individualVoucherId,
          parentVoucherId: voucherId,
          code: uniqueCode,
          title: baseVoucher.title,
          description: baseVoucher.description,
          discountType: baseVoucher.discountType,
          discountValue: baseVoucher.discountValue,
          expiryDate: baseVoucher.expiryDate,
          usageLimit: 1, // Individual vouchers are single-use
          usageCount: 0,
          minPurchase: baseVoucher.minPurchase,
          isActive: true,
          isIndividual: true,
          assignedTo: patient.id,
          assignedToName: patient.name,
          createdDate: new Date().toISOString(),
          createdBy: user.id
        }

        // Save individual voucher
        await kv.set(individualVoucherId, individualVoucher)

        // Create assignment record with validation
        const assignmentId = `voucher_assignment_${Date.now()}_patient_${patient.id}`
        const assignment = {
          id: assignmentId,
          voucherId: individualVoucherId || voucherId,
          parentVoucherId: voucherId,
          patientId: patient.id || 'unknown',
          patientName: patient.name || 'Unknown Patient',
          voucherCode: uniqueCode || 'GENERATED_CODE',
          assignedDate: new Date().toISOString(),
          assignedBy: user.id,
          status: 'assigned'
        }

        // Validate assignment data before saving
        if (!assignment.voucherId || !assignment.patientId || !assignment.voucherCode) {
          console.log('❌ Invalid assignment data, skipping:', assignment)
          continue
        }

        await kv.set(assignmentId, assignment)

        generatedCodes.push({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          voucherCode: uniqueCode,
          individualVoucherId: individualVoucherId
        })

        assignments.push(assignment)
      }

      console.log(`✅ Generated ${generatedCodes.length} unique voucher codes`)

      return c.json({
        success: true,
        message: `Successfully generated ${generatedCodes.length} unique voucher codes`,
        baseVoucher: {
          id: baseVoucher.id,
          title: baseVoucher.title,
          discountType: baseVoucher.discountType,
          discountValue: baseVoucher.discountValue
        },
        generatedCodes,
        assignments,
        count: generatedCodes.length
      })

    } catch (error) {
      console.log('💥 Error generating voucher codes per patient:', error)
      return c.json({ error: 'Failed to generate voucher codes per patient' }, 500)
    }
  })

  // Get individual voucher assignments for a patient
  app.get('/make-server-73417b67/vouchers/assignments/:patientId', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const patientId = c.req.param('patientId')
      console.log('🔍 Getting voucher assignments for patient:', patientId)

      const assignments = await kv.getByPrefix('voucher_assignment_')
      const patientAssignments = assignments.filter(assignment => assignment.patientId === patientId)

      // Get voucher usage data to check which codes have been used
      const usages = await kv.getByPrefix('voucher_usage_')

      const enrichedAssignments = patientAssignments.map(assignment => {
        const usage = usages.find(u => u.voucherCode === assignment.voucherCode)
        return {
          ...assignment,
          used: !!usage,
          usedDate: usage?.usedDate || null,
          usageDetails: usage || null
        }
      })

      console.log(`✅ Found ${enrichedAssignments.length} voucher assignments for patient`)

      return c.json({
        success: true,
        assignments: enrichedAssignments,
        count: enrichedAssignments.length
      })

    } catch (error) {
      console.log('💥 Error getting voucher assignments:', error)
      return c.json({ error: 'Failed to get voucher assignments' }, 500)
    }
  })

  // Cleanup corrupt data endpoint
  app.post('/make-server-73417b67/cleanup-corrupt-data', async (c: any) => {
    try {
      console.log('🧹 Cleanup corrupt data endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Parse request body for options
      const { checkOnly = false } = await c.req.json().catch(() => ({ checkOnly: false }))

      // Only allow admins to run cleanup (but anyone can check)
      if (!checkOnly && user.user_metadata?.role !== 'admin') {
        return c.json({ error: 'Admin access required for cleanup' }, 403)
      }

      const cleanupResults = {
        corruptVouchers: 0,
        corruptHistory: 0,
        corruptAssignments: 0,
        deletedVouchers: [],
        deletedHistory: [],
        deletedAssignments: []
      }

      // Clean up corrupt vouchers
      console.log('🧹 Cleaning up corrupt vouchers...')
      const allVouchers = await kv.getByPrefix('voucher_')
      
      for (const voucher of allVouchers) {
        const isCorrupt = !voucher.code || voucher.code === 'CORRUPT' || voucher.code === 'UNDEFINED' ||
                         !voucher.title || voucher.title === 'Data Corrupt' || voucher.title === 'Corrupted Voucher' || voucher.title === 'UNDEFINED' ||
                         typeof voucher.discountValue !== 'number' || voucher.discountValue < 0 || isNaN(voucher.discountValue) ||
                         !voucher.expiryDate || voucher.expiryDate === 'Invalid Date' || isNaN(new Date(voucher.expiryDate).getTime())

        if (isCorrupt) {
          if (checkOnly) {
            console.log('🔍 Found corrupt voucher:', voucher.id, voucher.code, voucher.title)
            cleanupResults.corruptVouchers++
          } else {
            console.log('🗑️ Deleting corrupt voucher:', voucher.id, voucher.code, voucher.title)
            await kv.del(voucher.id)
            cleanupResults.corruptVouchers++
            cleanupResults.deletedVouchers.push({
              id: voucher.id,
              code: voucher.code || 'CORRUPT',
              title: voucher.title || 'Data Corrupt'
            })
          }
        }
      }

      // Clean up corrupt promo history
      console.log('🧹 Cleaning up corrupt promo history...')
      const allHistory = await kv.getByPrefix('promo_history_')
      
      for (const history of allHistory) {
        const isCorrupt = !history.type || typeof history.type !== 'string' ||
                         !history.title || history.title === 'Data Corrupt' || history.title === 'CORRUPT' ||
                         !history.sentDate || isNaN(new Date(history.sentDate).getTime()) ||
                         !Array.isArray(history.recipientNames) || history.recipientNames.length === 0 ||
                         typeof history.recipientCount !== 'number' || history.recipientCount <= 0

        if (isCorrupt) {
          if (checkOnly) {
            console.log('🔍 Found corrupt history:', history.id, history.title)
            cleanupResults.corruptHistory++
          } else {
            console.log('🗑️ Deleting corrupt history:', history.id, history.title)
            await kv.del(history.id)
            cleanupResults.corruptHistory++
            cleanupResults.deletedHistory.push({
              id: history.id,
              title: history.title || 'Data Corrupt',
              type: history.type || 'unknown'
            })
          }
        }
      }

      // Clean up corrupt voucher assignments
      console.log('🧹 Cleaning up corrupt voucher assignments...')
      const allAssignments = await kv.getByPrefix('voucher_assignment_')
      
      for (const assignment of allAssignments) {
        const isCorrupt = !assignment.voucherId || assignment.voucherId === 'undefined' ||
                         !assignment.patientId || assignment.patientId === 'undefined' ||
                         !assignment.voucherCode || assignment.voucherCode === 'UNDEFINED' ||
                         !assignment.patientName || assignment.patientName === 'undefined'

        if (isCorrupt) {
          if (checkOnly) {
            console.log('🔍 Found corrupt assignment:', assignment.id)
            cleanupResults.corruptAssignments++
          } else {
            console.log('🗑️ Deleting corrupt assignment:', assignment.id)
            await kv.del(assignment.id)
            cleanupResults.corruptAssignments++
            cleanupResults.deletedAssignments.push({
              id: assignment.id,
              voucherId: assignment.voucherId || 'UNDEFINED',
              patientName: assignment.patientName || 'UNDEFINED'
            })
          }
        }
      }

      // If check-only mode, return counts without deleting
      if (checkOnly) {
        console.log(`🔍 Check completed: Found ${cleanupResults.corruptVouchers} corrupt vouchers, ${cleanupResults.corruptHistory} corrupt history records, ${cleanupResults.corruptAssignments} corrupt assignments`)
        
        return c.json({
          success: true,
          checkOnly: true,
          message: 'Check completed successfully',
          results: cleanupResults,
          summary: cleanupResults.corruptVouchers + cleanupResults.corruptHistory + cleanupResults.corruptAssignments === 0 
            ? 'No corrupt data found' 
            : `Found ${cleanupResults.corruptVouchers} corrupt vouchers, ${cleanupResults.corruptHistory} corrupt history records, and ${cleanupResults.corruptAssignments} corrupt assignments`
        })
      }

      console.log(`✅ Cleanup completed: ${cleanupResults.corruptVouchers} vouchers, ${cleanupResults.corruptHistory} history records, ${cleanupResults.corruptAssignments} assignments deleted`)

      return c.json({
        success: true,
        message: `Cleanup completed successfully`,
        results: cleanupResults,
        summary: `Deleted ${cleanupResults.corruptVouchers} corrupt vouchers, ${cleanupResults.corruptHistory} corrupt history records, and ${cleanupResults.corruptAssignments} corrupt assignments`
      })

    } catch (error) {
      console.log('💥 Error during cleanup:', error)
      return c.json({ error: 'Failed to cleanup corrupt data' }, 500)
    }
  })

  // Delete specific voucher
  app.delete('/make-server-73417b67/vouchers/:voucherId', async (c: any) => {
    try {
      console.log('🗑️ Delete voucher endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { voucherId } = c.req.param()
      console.log('🗑️ Deleting voucher:', voucherId)

      if (!voucherId) {
        return c.json({ error: 'Voucher ID required' }, 400)
      }

      // Get voucher first to get code for logging
      const voucher = await kv.get(voucherId)
      if (!voucher) {
        return c.json({ error: 'Voucher not found' }, 404)
      }

      console.log('🗑️ Found voucher to delete:', voucher.code)

      // Delete voucher
      await kv.del(voucherId)

      // Delete related assignments
      const assignments = await kv.getByPrefix('voucher_assignment_')
      const relatedAssignments = assignments.filter(assignment => assignment.voucherId === voucherId)
      
      for (const assignment of relatedAssignments) {
        console.log('🗑️ Deleting related assignment:', assignment.id)
        await kv.del(assignment.id)
      }

      // Delete related recipients
      const recipients = await kv.getByPrefix('voucher_recipient_')
      const relatedRecipients = recipients.filter(recipient => recipient.voucherId === voucherId)
      
      for (const recipient of relatedRecipients) {
        console.log('🗑️ Deleting related recipient:', recipient.id)
        await kv.del(recipient.id)
      }

      // Delete related usages
      const usages = await kv.getByPrefix('voucher_usage_')
      const relatedUsages = usages.filter(usage => usage.voucherId === voucherId)
      
      for (const usage of relatedUsages) {
        console.log('🗑️ Deleting related usage:', usage.id)
        await kv.del(usage.id)
      }

      const deletedCount = 1 + relatedAssignments.length + relatedRecipients.length + relatedUsages.length

      console.log(`✅ Voucher "${voucher.code}" deleted successfully with ${deletedCount} total records`)

      return c.json({
        success: true,
        message: `Voucher "${voucher.code}" berhasil dihapus`,
        deletedCount,
        details: {
          voucher: 1,
          assignments: relatedAssignments.length,
          recipients: relatedRecipients.length,
          usages: relatedUsages.length
        }
      })

    } catch (error) {
      console.log('❌ Delete voucher error:', error)
      return c.json({ error: 'Failed to delete voucher' }, 500)
    }
  })

  // Nuclear cleanup endpoint - Destroys ALL corrupt data
  app.post('/make-server-73417b67/nuclear-cleanup', async (c: any) => {
    try {
      console.log('☢️ NUCLEAR CLEANUP INITIATED')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Only allow admins
      if (user.user_metadata?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403)
      }

      const results = {
        deletedVouchers: 0,
        deletedHistory: 0,
        deletedAssignments: 0,
        deletedUsages: 0,
        deletedRecipients: 0,
        totalDeleted: 0
      }

      // PHASE 1: Delete ALL potentially corrupt vouchers
      console.log('☢️ Phase 1: Eliminating corrupt vouchers...')
      const allVouchers = await kv.getByPrefix('voucher_')
      for (const voucher of allVouchers) {
        const isCorrupt = !voucher.code || 
                         voucher.code === 'CORRUPT' || 
                         voucher.code === 'UNDEFINED' ||
                         voucher.code.includes('undefined') ||
                         !voucher.title || 
                         voucher.title === 'Data Corrupt' || 
                         voucher.title === 'Corrupted Voucher' || 
                         voucher.title === 'UNDEFINED' ||
                         voucher.title.includes('corrupt') ||
                         typeof voucher.discountValue !== 'number' || 
                         voucher.discountValue < 0 || 
                         isNaN(voucher.discountValue) ||
                         !voucher.expiryDate || 
                         voucher.expiryDate === 'Invalid Date' || 
                         isNaN(new Date(voucher.expiryDate).getTime())

        if (isCorrupt) {
          await kv.del(voucher.id)
          results.deletedVouchers++
          console.log('☢️ Deleted corrupt voucher:', voucher.id)
        }
      }

      // PHASE 2: Delete ALL corrupt history
      console.log('☢️ Phase 2: Eliminating corrupt history...')
      const allHistory = await kv.getByPrefix('promo_history_')
      for (const history of allHistory) {
        const isCorrupt = !history.type || 
                         !history.title || 
                         history.title.includes('corrupt') ||
                         history.title === 'CORRUPT' ||
                         !history.sentDate || 
                         isNaN(new Date(history.sentDate).getTime()) ||
                         !Array.isArray(history.recipientNames) || 
                         history.recipientNames.length === 0 ||
                         typeof history.recipientCount !== 'number' || 
                         history.recipientCount <= 0

        if (isCorrupt) {
          await kv.del(history.id)
          results.deletedHistory++
          console.log('☢️ Deleted corrupt history:', history.id)
        }
      }

      // PHASE 3: Delete ALL corrupt assignments
      console.log('☢️ Phase 3: Eliminating corrupt assignments...')
      const allAssignments = await kv.getByPrefix('voucher_assignment_')
      for (const assignment of allAssignments) {
        const isCorrupt = !assignment.voucherId || 
                         assignment.voucherId === 'undefined' ||
                         !assignment.patientId || 
                         assignment.patientId === 'undefined' ||
                         !assignment.voucherCode || 
                         assignment.voucherCode === 'UNDEFINED' ||
                         !assignment.patientName || 
                         assignment.patientName === 'undefined'

        if (isCorrupt) {
          await kv.del(assignment.id)
          results.deletedAssignments++
          console.log('☢️ Deleted corrupt assignment:', assignment.id)
        }
      }

      // PHASE 4: Delete corrupt usages
      console.log('☢️ Phase 4: Eliminating corrupt usages...')
      const allUsages = await kv.getByPrefix('voucher_usage_')
      for (const usage of allUsages) {
        const isCorrupt = !usage.voucherId || 
                         !usage.voucherCode ||
                         usage.voucherCode === 'UNDEFINED' ||
                         !usage.usedDate ||
                         isNaN(new Date(usage.usedDate).getTime()) ||
                         typeof usage.discountAmount !== 'number' ||
                         isNaN(usage.discountAmount)

        if (isCorrupt) {
          await kv.del(usage.id)
          results.deletedUsages++
          console.log('☢️ Deleted corrupt usage:', usage.id)
        }
      }

      // PHASE 5: Delete corrupt recipients
      console.log('☢️ Phase 5: Eliminating corrupt recipients...')
      const allRecipients = await kv.getByPrefix('voucher_recipient_')
      for (const recipient of allRecipients) {
        const isCorrupt = !recipient.voucherId || 
                         !recipient.patientId ||
                         recipient.patientId === 'undefined' ||
                         !recipient.patientName ||
                         recipient.patientName === 'undefined'

        if (isCorrupt) {
          await kv.del(recipient.id)
          results.deletedRecipients++
          console.log('☢️ Deleted corrupt recipient:', recipient.id)
        }
      }

      results.totalDeleted = results.deletedVouchers + results.deletedHistory + results.deletedAssignments + results.deletedUsages + results.deletedRecipients

      console.log(`☢️ NUCLEAR CLEANUP COMPLETE: ${results.totalDeleted} total records eliminated`)

      return c.json({
        success: true,
        message: 'Nuclear cleanup completed successfully',
        results,
        summary: `☢️ TOTAL DESTRUCTION: ${results.totalDeleted} corrupt records eliminated`
      })

    } catch (error) {
      console.log('☢️ Nuclear cleanup error:', error)
      return c.json({ error: 'Nuclear cleanup failed' }, 500)
    }
  })

  // ============= VOUCHER REMINDER ENDPOINTS =============
  
  // Get voucher recipients with detailed information for reminders
  app.get('/make-server-73417b67/vouchers/recipients-detailed', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🎫 Fetching detailed voucher recipients...')
      
      // Get ALL voucher recipients with different prefixes (with logging for timeout debugging)
      console.log('📦 Starting to fetch recipients from different prefixes...')
      const standardRecipients = await kv.getByPrefix('voucher_recipient_')
      console.log('📦 Standard recipients:', standardRecipients.length)
      
      const historyRecipients = await kv.getByPrefix('voucher_recipient_history_')
      console.log('📦 History recipients:', historyRecipients.length)
      
      const realisticRecipients = await kv.getByPrefix('voucher_recipient_realistic_')
      console.log('📦 Realistic recipients:', realisticRecipients.length)
      
      const testRecipients = await kv.getByPrefix('voucher_recipient_test_')
      console.log('📦 Test recipients:', testRecipients.length)
      
      const allRecipients = [...standardRecipients, ...historyRecipients, ...realisticRecipients, ...testRecipients]
      
      console.log('📦 Voucher recipients breakdown:')
      console.log('  - Standard:', standardRecipients.length)
      console.log('  - History:', historyRecipients.length) 
      console.log('  - Realistic:', realisticRecipients.length)
      console.log('  - Test:', testRecipients.length)
      console.log('  - TOTAL:', allRecipients.length)
      
      // If no recipients found, return empty state but indicate this
      if (allRecipients.length === 0) {
        console.log('⚠️ No voucher recipients found in database')
        return c.json({
          success: true,
          recipients: [],
          stats: {
            totalActive: 0,
            totalExpiring: 0,
            totalUsed: 0,
            totalExpired: 0
          },
          message: 'No voucher recipients found. Use debug tools to create sample data.',
          isEmpty: true
        })
      }
      
      // Get all vouchers for mapping
      const allVouchers = await kv.getByPrefix('voucher_')
      const vouchersMap = new Map()
      allVouchers.forEach(voucher => {
        if (voucher.id) {
          vouchersMap.set(voucher.id, voucher)
        }
      })
      console.log('📋 Total vouchers for mapping:', vouchersMap.size)
      
      // Get all patients for mapping
      const allPatients = await kv.getByPrefix('patient_')
      const patientsMap = new Map()
      allPatients.forEach(patient => {
        if (patient.id) {
          patientsMap.set(patient.id, patient)
        }
      })
      console.log('👥 Total patients for mapping:', patientsMap.size)
      
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
      
      const detailedRecipients = []
      let stats = {
        totalActive: 0,
        totalExpiring: 0,
        totalUsed: 0,
        totalExpired: 0
      }
      
      // Process recipients in batches to prevent timeout
      const batchSize = 100
      const totalBatches = Math.ceil(allRecipients.length / batchSize)
      console.log(`📦 Processing ${allRecipients.length} recipients in ${totalBatches} batches of ${batchSize}`)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize
        const end = Math.min(start + batchSize, allRecipients.length)
        const batch = allRecipients.slice(start, end)
        
        console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} items)`)
        
        for (const recipient of batch) {
          try {
            if (!recipient.voucherId || !recipient.recipientId) continue
            
            const voucher = vouchersMap.get(recipient.voucherId)
            const patient = patientsMap.get(recipient.recipientId)
            
            if (!voucher || !patient) continue
          
          const expiryDate = new Date(voucher.expiryDate)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          // Determine status
          let status = 'active'
          if (recipient.usedDate) {
            status = 'used'
          } else if (expiryDate < now) {
            status = 'expired'
          }
          
          // Generate voucher code if missing
          let voucherCode = recipient.voucherCode || voucher.code || ''
          
          // If still no code, generate a proper one
          if (!voucherCode || voucherCode === '1 kode unik generated' || voucherCode.length < 8) {
            const generateVoucherCode = (length = 8) => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
              let result = 'DENTAL'
              for (let i = 0; i < length - 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
              }
              return result
            }
            
            voucherCode = generateVoucherCode(10) // Generate DENTAL + 4 random chars
            
            // Update the recipient record with the new code
            const recipientKey = recipient.id
            const updatedRecipient = {
              ...recipient,
              voucherCode: voucherCode,
              lastCodeRegenerated: new Date().toISOString(),
              codeRegeneratedBy: 'auto_system',
              updated_at: new Date().toISOString()
            }
            
            // Save the updated recipient record
            try {
              await kv.set(recipientKey, updatedRecipient)
              console.log(`✅ Auto-generated voucher code for recipient ${recipient.id}: ${voucherCode}`)
            } catch (error) {
              console.error(`❌ Failed to save auto-generated code for ${recipient.id}:`, error)
            }
          }

          const detailedRecipient = {
            id: recipient.id || `recipient_${recipient.voucherId || 'unknown'}_${recipient.recipientId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            voucherId: recipient.voucherId,
            recipientId: recipient.recipientId,
            recipientName: patient.name || 'Nama tidak tersedia',
            recipientPhone: patient.phone || '',
            recipientAddress: patient.address || '',
            voucherCode: voucherCode,
            voucherTitle: voucher.title || 'Voucher',
            discountType: voucher.discountType || 'percentage',
            discountValue: voucher.discountValue || 0,
            expiryDate: voucher.expiryDate,
            daysUntilExpiry: Math.max(0, daysUntilExpiry),
            isUrgent: daysUntilExpiry <= 3 && status === 'active',
            status,
            assignedDate: recipient.assignedDate || recipient.createdAt || new Date().toISOString(),
            usedDate: recipient.usedDate || null,
            createdAt: recipient.createdAt || new Date().toISOString(),
            lastCodeRegenerated: recipient.lastCodeRegenerated || null,
            codeRegeneratedBy: recipient.codeRegeneratedBy || null
          }
          
          detailedRecipients.push(detailedRecipient)
          
          // Update stats
          if (status === 'active') {
            stats.totalActive++
            if (expiryDate <= thirtyDaysFromNow) {
              stats.totalExpiring++
            }
          } else if (status === 'used') {
            stats.totalUsed++
          } else if (status === 'expired') {
            stats.totalExpired++
          }
          
          } catch (error) {
            console.error('Error processing recipient:', recipient.id, error)
            continue
          }
        }
        
        // Log progress after each batch and add small delay to prevent overwhelming
        console.log(`📦 Completed batch ${batchIndex + 1}/${totalBatches}, total processed: ${detailedRecipients.length}`)
        
        // Add small delay between batches to prevent overwhelming the system
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 10)) // 10ms delay
        }
      }
      
      // Sort by urgency and expiry date
      detailedRecipients.sort((a, b) => {
        // Urgent first
        if (a.isUrgent && !b.isUrgent) return -1
        if (!a.isUrgent && b.isUrgent) return 1
        
        // Then by days until expiry (ascending for active, descending for others)
        if (a.status === 'active' && b.status === 'active') {
          return a.daysUntilExpiry - b.daysUntilExpiry
        }
        
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      console.log('✅ Processed voucher recipients:', detailedRecipients.length)
      console.log('📊 Stats:', stats)
      
      return c.json({
        success: true,
        recipients: detailedRecipients,
        stats,
        totalProcessed: allRecipients.length
      })
      
    } catch (error) {
      console.error('❌ Error fetching voucher recipients:', error)
      return c.json({ error: 'Failed to fetch voucher recipients' }, 500)
    }
  })

  // Send WhatsApp reminder for voucher
  app.post('/make-server-73417b67/vouchers/send-whatsapp-reminder', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const body = await c.req.json()
      const { 
        recipientId, 
        voucherId, 
        voucherCode, 
        recipientName, 
        recipientPhone, 
        voucherTitle, 
        discountValue, 
        discountType, 
        expiryDate, 
        daysUntilExpiry 
      } = body
      
      if (!recipientPhone || !voucherCode) {
        return c.json({ error: 'Nomor telepon dan kode voucher diperlukan' }, 400)
      }
      
      console.log('📱 Sending WhatsApp voucher reminder to:', recipientName, recipientPhone)
      
      // Format discount
      const discountText = discountType === 'percentage' 
        ? `${discountValue}%` 
        : new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(discountValue)
      
      // Format expiry date
      const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      
      // Create urgency message
      let urgencyMessage = ''
      if (daysUntilExpiry <= 1) {
        urgencyMessage = '⚠️ *PERHATIAN: Voucher Anda akan kedaluwarsa HARI INI!*'
      } else if (daysUntilExpiry <= 3) {
        urgencyMessage = `⚠️ *PERHATIAN: Voucher Anda akan kedaluwarsa dalam ${daysUntilExpiry} hari!*`
      } else if (daysUntilExpiry <= 7) {
        urgencyMessage = `⏰ Voucher Anda akan kedaluwarsa dalam ${daysUntilExpiry} hari.`
      }
      
      // Create WhatsApp message
      const message = `🦷 *FALASIFAH DENTAL CLINIC*
${urgencyMessage ? urgencyMessage + '\\n\\n' : ''}Halo ${recipientName}! 👋

Kami ingin mengingatkan Anda tentang voucher yang masih berlaku:

🎫 *${voucherTitle}*
📝 Kode: *${voucherCode}*
💰 Diskon: *${discountText}*
⏰ Berlaku hingga: *${formattedExpiryDate}*

Jangan sampai terlewat! Segera gunakan voucher Anda untuk mendapatkan pelayanan terbaik di klinik kami.

📞 Untuk reservasi: 
📍 Kunjungi klinik kami untuk informasi lebih lanjut

Terima kasih! 🙏`

      // Create WhatsApp URL
      const cleanPhone = recipientPhone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      
      // Log reminder activity
      const reminderLog = {
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'voucher_reminder',
        recipientId,
        voucherId,
        recipientName,
        recipientPhone,
        voucherCode,
        voucherTitle,
        discountValue,
        discountType,
        expiryDate,
        daysUntilExpiry,
        sentDate: new Date().toISOString(),
        sentBy: user.id,
        method: 'whatsapp',
        message: message.substring(0, 500) + (message.length > 500 ? '...' : '')
      }
      
      await kv.set(`voucher_reminder_${reminderLog.id}`, reminderLog)
      
      console.log('✅ Voucher reminder logged:', reminderLog.id)
      
      return c.json({
        success: true,
        message: 'Reminder WhatsApp berhasil disiapkan',
        whatsappUrl,
        reminderLogId: reminderLog.id
      })
      
    } catch (error) {
      console.error('❌ Error sending voucher reminder:', error)
      return c.json({ error: 'Failed to send voucher reminder' }, 500)
    }
  })

  // Get voucher reminder history
  app.get('/make-server-73417b67/vouchers/reminder-history', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('📋 Fetching voucher reminder history...')
      
      const allReminders = await kv.getByPrefix('voucher_reminder_')
      console.log('📦 Total voucher reminders found:', allReminders.length)
      
      // Sort by sent date descending
      const sortedReminders = allReminders.sort((a: any, b: any) => 
        new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime()
      )
      
      return c.json({
        success: true,
        reminders: sortedReminders,
        totalCount: allReminders.length
      })
      
    } catch (error) {
      console.error('❌ Error fetching voucher reminder history:', error)
      return c.json({ error: 'Failed to fetch voucher reminder history' }, 500)
    }
  })

  // Debug endpoint to check voucher-related data
  app.get('/make-server-73417b67/debug/voucher-data', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🔍 Debug: Checking voucher-related data...')
      
      // Get ALL voucher recipients with different prefixes
      const standardRecipients = await kv.getByPrefix('voucher_recipient_')
      const historyRecipients = await kv.getByPrefix('voucher_recipient_history_')
      const realisticRecipients = await kv.getByPrefix('voucher_recipient_realistic_')
      const testRecipients = await kv.getByPrefix('voucher_recipient_test_')
      
      const allRecipients = [...standardRecipients, ...historyRecipients, ...realisticRecipients, ...testRecipients]
      
      console.log('📦 Voucher recipients breakdown:')
      console.log('  - Standard (voucher_recipient_):', standardRecipients.length)
      console.log('  - History (voucher_recipient_history_):', historyRecipients.length)
      console.log('  - Realistic (voucher_recipient_realistic_):', realisticRecipients.length)
      console.log('  - Test (voucher_recipient_test_):', testRecipients.length)
      console.log('  - TOTAL:', allRecipients.length)
      
      // Get all vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      console.log('📦 Total vouchers found:', allVouchers.length)
      
      // Get all patients
      const allPatients = await kv.getByPrefix('patient_')
      console.log('📦 Total patients found:', allPatients.length)
      
      // Get promo history for context
      const promoHistory = await kv.getByPrefix('promo_history_')
      const voucherHistory = promoHistory.filter(h => h.type === 'voucher')
      console.log('📦 Promo history (voucher type):', voucherHistory.length)
      
      // Sample data
      const sampleRecipient = allRecipients[0]
      const sampleVoucher = allVouchers[0]
      const samplePatient = allPatients[0]
      
      console.log('📋 Sample recipient:', sampleRecipient ? {
        id: sampleRecipient.id,
        voucherId: sampleRecipient.voucherId,
        recipientId: sampleRecipient.recipientId,
        voucherCode: sampleRecipient.voucherCode
      } : 'None')
      
      console.log('📋 Sample voucher:', sampleVoucher ? {
        id: sampleVoucher.id,
        code: sampleVoucher.code,
        title: sampleVoucher.title,
        expiryDate: sampleVoucher.expiryDate
      } : 'None')
      
      console.log('📋 Sample patient:', samplePatient ? {
        id: samplePatient.id,
        name: samplePatient.name,
        phone: samplePatient.phone
      } : 'None')
      
      return c.json({
        success: true,
        debug: {
          recipients: {
            count: allRecipients.length,
            breakdown: {
              standard: standardRecipients.length,
              history: historyRecipients.length,
              realistic: realisticRecipients.length,
              test: testRecipients.length
            },
            sample: sampleRecipient ? {
              id: sampleRecipient.id,
              voucherId: sampleRecipient.voucherId,
              recipientId: sampleRecipient.recipientId,
              voucherCode: sampleRecipient.voucherCode,
              assignedDate: sampleRecipient.assignedDate,
              prefix: sampleRecipient.id.split('_').slice(0, 3).join('_')
            } : null,
            allSamples: allRecipients.slice(0, 5).map(r => ({
              id: r.id,
              prefix: r.id.split('_').slice(0, 3).join('_'),
              voucherCode: r.voucherCode
            }))
          },
          vouchers: {
            count: allVouchers.length,
            sample: sampleVoucher ? {
              id: sampleVoucher.id,
              code: sampleVoucher.code,
              title: sampleVoucher.title,
              expiryDate: sampleVoucher.expiryDate,
              discountType: sampleVoucher.discountType,
              discountValue: sampleVoucher.discountValue
            } : null
          },
          patients: {
            count: allPatients.length,
            sample: samplePatient ? {
              id: samplePatient.id,
              name: samplePatient.name,
              phone: samplePatient.phone,
              address: samplePatient.address
            } : null
          },
          promoHistory: {
            total: promoHistory.length,
            voucherHistory: voucherHistory.length,
            sample: voucherHistory[0] ? {
              id: voucherHistory[0].id,
              title: voucherHistory[0].title,
              voucherCode: voucherHistory[0].voucherCode,
              recipientCount: voucherHistory[0].recipientCount
            } : null
          }
        }
      })
      
    } catch (error) {
      console.error('❌ Error in debug endpoint:', error)
      return c.json({ error: 'Failed to debug voucher data' }, 500)
    }
  })

  // Create test data for voucher reminders (for testing purposes)
  app.post('/make-server-73417b67/debug/create-test-voucher-data', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🧪 Creating test voucher data...')
      
      // Create test voucher
      const testVoucherId = `voucher_test_${Date.now()}`
      const testVoucher = {
        id: testVoucherId,
        code: 'DENTALMNAXUF',
        title: 'Diskon Kemerdekaan',
        description: 'Diskon spesial HUT RI',
        discountType: 'percentage',
        discountValue: 17,
        expiryDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 days from now
        usageLimit: 100,
        usageCount: 0,
        minPurchase: 0,
        isActive: true,
        createdDate: new Date().toISOString(),
        createdBy: user.id
      }
      
      await kv.set(testVoucherId, testVoucher)
      console.log('✅ Test voucher created:', testVoucherId)
      
      // Create test patient
      const testPatientId = `patient_test_${Date.now()}`
      const testPatient = {
        id: testPatientId,
        name: 'Najwa Nurhaliza',
        phone: '081234567890',
        address: 'Jl. Test Address No. 123',
        email: 'najwa@test.com',
        birthDate: '1990-01-01',
        gender: 'Perempuan',
        created_at: new Date().toISOString()
      }
      
      await kv.set(testPatientId, testPatient)
      console.log('✅ Test patient created:', testPatientId)
      
      // Create test voucher recipient
      const testRecipientId = `voucher_recipient_test_${Date.now()}`
      const testRecipient = {
        id: testRecipientId,
        voucherId: testVoucherId,
        recipientId: testPatientId,
        voucherCode: 'DENTALMNAXUF',
        assignedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        usedDate: null // Not used yet
      }
      
      await kv.set(testRecipientId, testRecipient)
      console.log('✅ Test voucher recipient created:', testRecipientId)
      
      return c.json({
        success: true,
        message: 'Test voucher data created successfully',
        testData: {
          voucher: testVoucher,
          patient: testPatient,
          recipient: testRecipient
        }
      })
      
    } catch (error) {
      console.error('❌ Error creating test data:', error)
      return c.json({ error: 'Failed to create test data' }, 500)
    }
  })

  // Generate voucher recipients from existing voucher history
  app.post('/make-server-73417b67/debug/generate-recipients-from-history', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🔄 Generating voucher recipients from existing history...')
      
      // Get all voucher history
      const allHistory = await kv.getByPrefix('voucher_history_')
      console.log('📋 Found voucher history records:', allHistory.length)
      
      // Get all vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      const vouchersMap = new Map()
      allVouchers.forEach(voucher => {
        if (voucher.id) {
          vouchersMap.set(voucher.code, voucher) // Map by code for easier lookup
        }
      })
      
      // Get all patients
      const allPatients = await kv.getByPrefix('patient_')
      console.log('👥 Found patients:', allPatients.length)
      
      if (!allPatients.length) {
        // Create sample patients for testing
        const samplePatients = [
          {
            id: `patient_sample_${Date.now()}_1`,
            name: 'Annisa Rizqi Fakhina',
            phone: '08517272040',
            address: 'Villa Rizki Ilhami, Cluster Mentari',
            email: 'annisa@example.com',
            gender: 'Perempuan',
            created_at: new Date().toISOString()
          },
          {
            id: `patient_sample_${Date.now()}_2`, 
            name: 'Safira Farah Kamilah',
            phone: '085939414760',
            address: 'Jl. Merdeka No. 123',
            email: 'safira@example.com',
            gender: 'Perempuan',
            created_at: new Date().toISOString()
          }
        ]
        
        for (const patient of samplePatients) {
          await kv.set(patient.id, patient)
          allPatients.push(patient)
        }
        console.log('✅ Created sample patients')
      }
      
      let recipientsCreated = 0
      
      // Process each voucher history record
      for (const history of allHistory) {
        try {
          // Find corresponding voucher
          const voucher = vouchersMap.get(history.voucherCode)
          if (!voucher) {
            console.log('⚠️ Voucher not found for code:', history.voucherCode)
            continue
          }
          
          // Assign to random patient for demo
          const randomPatient = allPatients[Math.floor(Math.random() * allPatients.length)]
          
          // Create voucher recipient
          const recipientId = `voucher_recipient_${Date.now()}_${recipientsCreated}`
          const recipient = {
            id: recipientId,
            voucherId: voucher.id,
            recipientId: randomPatient.id,
            voucherCode: history.voucherCode,
            assignedDate: history.sentDate || new Date().toISOString(),
            createdAt: history.sentDate || new Date().toISOString(),
            usedDate: null // Set as not used for reminder purposes
          }
          
          await kv.set(recipientId, recipient)
          recipientsCreated++
          
          console.log(`✅ Created recipient ${recipientsCreated}: ${randomPatient.name} -> ${history.voucherCode}`)
          
        } catch (itemError) {
          console.log('⚠️ Error processing history item:', itemError)
        }
      }
      
      return c.json({
        success: true,
        message: `Successfully generated ${recipientsCreated} voucher recipients from history`,
        data: {
          recipientsCreated,
          historyProcessed: allHistory.length,
          patientsAvailable: allPatients.length,
          vouchersAvailable: vouchersMap.size
        }
      })
      
    } catch (error) {
      console.error('❌ Error generating recipients from history:', error)
      return c.json({ error: 'Failed to generate recipients from history' }, 500)
    }
  })

  // Create realistic voucher recipients from active vouchers 
  app.post('/make-server-73417b67/debug/create-realistic-voucher-recipients', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🎯 Creating realistic voucher recipients...')
      
      // Get all active vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      const activeVouchers = allVouchers.filter(voucher => voucher.isActive !== false)
      console.log('📋 Found active vouchers:', activeVouchers.length)
      
      if (!activeVouchers.length) {
        return c.json({ error: 'No active vouchers found' }, 400)
      }
      
      // Get all patients
      const allPatients = await kv.getByPrefix('patient_')
      console.log('👥 Found patients:', allPatients.length)
      
      if (!allPatients.length) {
        // Create sample patients for testing
        const samplePatients = [
          {
            id: `patient_sample_${Date.now()}_1`,
            name: 'Annisa Rizqi Fakhina',
            phone: '08517272040',
            address: 'Villa Rizki Ilhami, Cluster Mentari',
            email: 'annisa@example.com',
            birthDate: '1995-05-15',
            gender: 'Perempuan',
            created_at: new Date().toISOString()
          },
          {
            id: `patient_sample_${Date.now()}_2`, 
            name: 'Safira Farah Kamilah',
            phone: '085939414760',
            address: 'Jl. Merdeka No. 123',
            email: 'safira@example.com',
            birthDate: '1992-08-20',
            gender: 'Perempuan',
            created_at: new Date().toISOString()
          },
          {
            id: `patient_sample_${Date.now()}_3`,
            name: 'Ahmad Fadli Rahman',
            phone: '081234567890',
            address: 'Jl. Sudirman No. 45',
            email: 'ahmad@example.com',
            birthDate: '1988-12-10',
            gender: 'Laki-laki',
            created_at: new Date().toISOString()
          }
        ]
        
        for (const patient of samplePatients) {
          await kv.set(patient.id, patient)
          allPatients.push(patient)
        }
        console.log('✅ Created sample patients')
      }
      
      let recipientsCreated = 0
      const now = new Date()
      
      // Create recipients for each active voucher with varied expiry scenarios
      for (const voucher of activeVouchers) {
        try {
          // Create multiple recipients per voucher for testing
          const recipientCount = Math.min(3, allPatients.length)
          
          for (let i = 0; i < recipientCount; i++) {
            const patient = allPatients[i % allPatients.length]
            
            // Create voucher recipient with realistic expiry dates
            const recipientId = `voucher_recipient_realistic_${Date.now()}_${recipientsCreated}`
            
            // Vary the assigned dates and expiry scenarios
            let assignedDate = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date in last 30 days
            let usedDate = null
            
            // 30% chance the voucher is already used
            if (Math.random() < 0.3) {
              usedDate = new Date(assignedDate.getTime() + (Math.random() * 15 * 24 * 60 * 60 * 1000)).toISOString()
            }
            
            const recipient = {
              id: recipientId,
              voucherId: voucher.id,
              recipientId: patient.id,
              voucherCode: voucher.code,
              assignedDate: assignedDate.toISOString(),
              createdAt: assignedDate.toISOString(),
              usedDate
            }
            
            await kv.set(recipientId, recipient)
            recipientsCreated++
            
            console.log(`✅ Created realistic recipient ${recipientsCreated}: ${patient.name} -> ${voucher.code} (${usedDate ? 'USED' : 'ACTIVE'})`)
          }
          
        } catch (itemError) {
          console.log('⚠️ Error processing voucher:', itemError)
        }
      }
      
      return c.json({
        success: true,
        message: `Successfully created ${recipientsCreated} realistic voucher recipients`,
        data: {
          recipientsCreated,
          vouchersProcessed: activeVouchers.length,
          patientsUsed: allPatients.length
        }
      })
      
    } catch (error) {
      console.error('❌ Error creating realistic recipients:', error)
      return c.json({ error: 'Failed to create realistic recipients' }, 500)
    }
  })

  // INTEGRATION: Convert promo history to voucher recipients for reminder dashboard
  app.post('/make-server-73417b67/convert-history-to-recipients', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🔄 Converting promo history to voucher recipients...')
      
      // Get all promo history (voucher only)
      const allHistory = await kv.getByPrefix('promo_history_')
      const voucherHistory = allHistory.filter(history => 
        history.type === 'voucher' && 
        history.voucherCode && 
        Array.isArray(history.recipientNames) && 
        Array.isArray(history.recipientPhones) &&
        history.recipientNames.length > 0 &&
        history.recipientPhones.length > 0
      )
      console.log(`📋 Found ${voucherHistory.length} valid voucher history records`)
      
      if (!voucherHistory.length) {
        return c.json({ 
          success: false, 
          error: 'No voucher history found to convert',
          suggestion: 'Go to Manajemen Promo > tab Voucher Diskon and send some vouchers first',
          redirectTo: 'promo'
        })
      }
      
      // Get all vouchers for mapping
      const allVouchers = await kv.getByPrefix('voucher_')
      const vouchersMap = new Map()
      allVouchers.forEach(voucher => {
        if (voucher.code) {
          vouchersMap.set(voucher.code, voucher)
        }
      })
      console.log(`📦 Found ${vouchersMap.size} vouchers for mapping`)
      
      // Get all patients for mapping
      const allPatients = await kv.getByPrefix('patient_')
      const patientsMap = new Map()
      allPatients.forEach(patient => {
        if (patient.phone) {
          // Normalize phone number for matching
          const normalizedPhone = patient.phone.replace(/\D/g, '')
          patientsMap.set(normalizedPhone, patient)
          patientsMap.set(patient.phone, patient) // Keep original format too
        }
      })
      console.log(`👥 Found ${patientsMap.size} patients for mapping`)
      
      let recipientsCreated = 0
      let recipientsUpdated = 0
      
      // Process each voucher history record
      for (const history of voucherHistory) {
        try {
          const voucher = vouchersMap.get(history.voucherCode)
          if (!voucher) {
            console.log(`⚠️ Voucher not found for code: ${history.voucherCode}`)
            continue
          }
          
          // Create recipients for each phone number in this history
          for (let i = 0; i < history.recipientPhones.length; i++) {
            const phone = history.recipientPhones[i]
            const name = history.recipientNames?.[i] || 'Unknown'
            
            if (!phone || !name) {
              console.log(`⚠️ Skipping invalid recipient at index ${i}: phone=${phone}, name=${name}`)
              continue
            }
            
            // Try to find patient by phone
            const normalizedPhone = phone.replace(/\D/g, '')
            const patient = patientsMap.get(phone) || patientsMap.get(normalizedPhone)
            const recipientId = patient?.id || `temp_patient_${normalizedPhone}`
            
            // Create voucher recipient ID based on history and patient
            const voucherRecipientId = `voucher_recipient_history_${history.id}_${i}`
            
            // Check if already exists
            const existingRecipient = await kv.get(voucherRecipientId)
            
            const recipient = {
              id: voucherRecipientId,
              voucherId: voucher.id,
              recipientId,
              voucherCode: history.voucherCode,
              assignedDate: history.sentDate,
              createdAt: history.sentDate,
              usedDate: null, // Set as not used to appear in reminders
              // Store original history reference
              fromHistoryId: history.id,
              recipientName: name,
              recipientPhone: phone,
              recipientAddress: patient?.address || 'Alamat tidak tersedia'
            }
            
            await kv.set(voucherRecipientId, recipient)
            
            if (existingRecipient) {
              recipientsUpdated++
              console.log(`🔄 Updated recipient: ${name} (${phone}) -> ${history.voucherCode}`)
            } else {
              recipientsCreated++
              console.log(`✅ Created recipient: ${name} (${phone}) -> ${history.voucherCode}`)
            }
          }
          
        } catch (itemError) {
          console.log('⚠️ Error processing history item:', itemError)
        }
      }
      
      console.log(`✅ Conversion complete: ${recipientsCreated} created, ${recipientsUpdated} updated`)
      
      return c.json({
        success: true,
        message: `Successfully converted history to recipients: ${recipientsCreated} created, ${recipientsUpdated} updated`,
        data: {
          recipientsCreated,
          recipientsUpdated,
          historyProcessed: voucherHistory.length,
          vouchersAvailable: vouchersMap.size,
          patientsAvailable: patientsMap.size
        }
      })
      
    } catch (error) {
      console.error('❌ Error converting history to recipients:', error)
      return c.json({ error: 'Failed to convert history to recipients' }, 500)
    }
  })

  // Show all voucher data in human readable format
  app.get('/make-server-73417b67/debug/show-all-data', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('📋 Showing ALL voucher data...')
      
      // Get ALL voucher recipients
      const standardRecipients = await kv.getByPrefix('voucher_recipient_')
      const historyRecipients = await kv.getByPrefix('voucher_recipient_history_')
      const realisticRecipients = await kv.getByPrefix('voucher_recipient_realistic_')
      const testRecipients = await kv.getByPrefix('voucher_recipient_test_')
      
      const allRecipients = [...standardRecipients, ...historyRecipients, ...realisticRecipients, ...testRecipients]
      
      // Get all vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      const vouchersMap = new Map()
      allVouchers.forEach(v => vouchersMap.set(v.id, v))
      
      // Get all patients
      const allPatients = await kv.getByPrefix('patient_')
      const patientsMap = new Map()
      allPatients.forEach(p => patientsMap.set(p.id, p))
      
      // Get promo history
      const promoHistory = await kv.getByPrefix('promo_history_')
      const voucherHistory = promoHistory.filter(h => h.type === 'voucher')
      
      // Process recipients for display
      const now = new Date()
      const processedRecipients = allRecipients.map(recipient => {
        const voucher = vouchersMap.get(recipient.voucherId)
        const patient = patientsMap.get(recipient.recipientId)
        
        // Determine status more accurately
        let status = 'active'
        if (recipient.usedDate) {
          status = 'used'
        } else if (voucher?.expiryDate && new Date(voucher.expiryDate) < now) {
          status = 'expired'
        }
        
        const expiryDate = voucher?.expiryDate
        const daysUntilExpiry = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
        
        // Handle voucher code generation for show-all-data endpoint
        let voucherCode = recipient.voucherCode || voucher?.code || ''
        if (!voucherCode || voucherCode === '1 kode unik generated' || voucherCode === 'N/A' || voucherCode.length < 8) {
          const generateVoucherCode = (length = 8) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = 'DENTAL'
            for (let i = 0; i < length - 6; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
          }
          voucherCode = generateVoucherCode(10)
        }
        
        return {
          id: recipient.id,
          voucherId: recipient.voucherId,
          recipientId: recipient.recipientId,
          source: recipient.id.split('_')[2] || 'standard', // history/realistic/test/standard
          voucherCode: voucherCode,
          voucherTitle: voucher?.title || 'Unknown Voucher',
          patientName: recipient.recipientName || patient?.name || 'Unknown Patient',
          patientPhone: recipient.recipientPhone || patient?.phone || 'No phone',
          patientAddress: recipient.recipientAddress || patient?.address || '',
          assignedDate: recipient.assignedDate || recipient.createdAt || new Date().toISOString(),
          usedDate: recipient.usedDate || null,
          status,
          expiryDate: voucher?.expiryDate || null,
          daysUntilExpiry,
          isUrgent: status === 'active' && daysUntilExpiry <= 3,
          discountValue: voucher?.discountValue || 0,
          discountType: voucher?.discountType || 'percentage',
          createdAt: recipient.createdAt || recipient.assignedDate || new Date().toISOString()
        }
      })
      
      return c.json({
        success: true,
        summary: {
          totalRecipients: allRecipients.length,
          breakdown: {
            standard: standardRecipients.length,
            history: historyRecipients.length,
            realistic: realisticRecipients.length,
            test: testRecipients.length
          },
          totalVouchers: allVouchers.length,
          totalPatients: allPatients.length,
          voucherHistory: voucherHistory.length
        },
        recipients: processedRecipients.map((r, index) => ({
          id: r.id || `unique_recipient_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          voucherId: r.voucherId,
          recipientId: r.recipientId,
          recipientName: r.patientName,
          recipientPhone: r.patientPhone,
          recipientAddress: r.patientAddress,
          voucherCode: r.voucherCode,
          voucherTitle: r.voucherTitle,
          discountType: r.discountType,
          discountValue: r.discountValue,
          expiryDate: r.expiryDate,
          daysUntilExpiry: r.daysUntilExpiry,
          isUrgent: r.isUrgent,
          status: r.status,
          assignedDate: r.assignedDate,
          usedDate: r.usedDate,
          createdAt: r.createdAt
        })),
        vouchers: allVouchers.map(v => ({
          id: v.id,
          code: v.code,
          title: v.title,
          discountValue: v.discountValue,
          discountType: v.discountType,
          expiryDate: v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('id-ID') : 'Unknown',
          isActive: v.isActive !== false
        })),
        voucherHistory: voucherHistory.map(h => ({
          id: h.id,
          title: h.title,
          voucherCode: h.voucherCode,
          recipientCount: h.recipientCount,
          sentDate: h.sentDate ? new Date(h.sentDate).toLocaleDateString('id-ID') : 'Unknown'
        }))
      })
      
    } catch (error) {
      console.error('❌ Error showing all data:', error)
      return c.json({ error: 'Failed to show all data' }, 500)
    }
  })

  // Fix all broken voucher codes (bulk repair)
  app.post('/make-server-73417b67/vouchers/fix-broken-codes', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      console.log('🔧 Starting bulk voucher code repair...')

      // Get all voucher recipients from all prefixes
      const prefixes = ['voucher_recipient_', 'voucher_recipient_history_', 'voucher_recipient_realistic_', 'voucher_recipient_test_']
      let totalFixed = 0
      let totalChecked = 0
      const fixedRecords = []

      for (const prefix of prefixes) {
        const recipients = await kv.getByPrefix(prefix)
        console.log(`🔍 Checking ${recipients.length} recipients with prefix: ${prefix}`)

        for (const recipient of recipients) {
          totalChecked++
          let needsFix = false
          
          // Check if voucher code is missing or broken
          if (!recipient.voucherCode || 
              recipient.voucherCode === '1 kode unik generated' || 
              recipient.voucherCode === 'N/A' || 
              recipient.voucherCode === '' ||
              recipient.voucherCode.length < 6) {
            needsFix = true
          }

          if (needsFix) {
            // Generate proper voucher code
            const generateVoucherCode = (length = 8) => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
              let result = 'DENTAL'
              for (let i = 0; i < length - 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
              }
              return result
            }

            const newCode = generateVoucherCode(10)
            
            // Update recipient record
            const updatedRecipient = {
              ...recipient,
              voucherCode: newCode,
              lastCodeRegenerated: new Date().toISOString(),
              codeRegeneratedBy: user.id,
              fixedBulkRepair: true,
              updated_at: new Date().toISOString()
            }

            await kv.set(recipient.id, updatedRecipient)
            
            fixedRecords.push({
              id: recipient.id,
              oldCode: recipient.voucherCode || 'EMPTY',
              newCode: newCode,
              recipientName: recipient.recipientName || 'Unknown'
            })
            
            totalFixed++
            console.log(`✅ Fixed voucher code for ${recipient.id}: ${recipient.voucherCode} �� ${newCode}`)
          }
        }
      }

      console.log(`🎯 Bulk repair completed: ${totalFixed}/${totalChecked} records fixed`)

      return c.json({
        success: true,
        message: `Bulk voucher code repair completed successfully`,
        results: {
          totalChecked,
          totalFixed,
          fixedRecords: fixedRecords.slice(0, 10), // Show first 10 for reference
          totalShown: Math.min(fixedRecords.length, 10)
        }
      })

    } catch (error) {
      console.error('❌ Error during bulk voucher code repair:', error)
      return c.json({ error: 'Failed to repair voucher codes' }, 500)
    }
  })

  // Regenerate voucher code for recipient
  app.post('/make-server-73417b67/vouchers/regenerate-code', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { recipientId, voucherId } = await c.req.json()
      
      if (!recipientId || !voucherId) {
        return c.json({ error: 'recipientId dan voucherId diperlukan' }, 400)
      }

      console.log('🔄 Regenerating voucher code for recipient:', recipientId, 'voucher:', voucherId)

      // Find the recipient record from all possible prefixes
      const prefixes = ['voucher_recipient_', 'voucher_recipient_history_', 'voucher_recipient_realistic_', 'voucher_recipient_test_']
      let recipientRecord = null
      let recipientKey = null

      for (const prefix of prefixes) {
        const recipients = await kv.getByPrefix(prefix)
        const found = recipients.find(r => r.recipientId === recipientId && r.voucherId === voucherId)
        if (found) {
          recipientRecord = found
          recipientKey = found.id || `${prefix}${found.recipientId}_${found.voucherId}`
          break
        }
      }

      if (!recipientRecord) {
        return c.json({ error: 'Voucher recipient tidak ditemukan' }, 404)
      }

      // Get voucher details
      const voucher = await kv.get(voucherId)
      if (!voucher) {
        return c.json({ error: 'Voucher tidak ditemukan' }, 404)
      }

      // Generate new unique code
      const generateVoucherCode = (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      // Generate unique code (ensure it's not duplicate)
      let newCode
      let attempts = 0
      const maxAttempts = 10

      do {
        newCode = generateVoucherCode()
        attempts++
        
        // Check if code already exists
        const allRecipients = []
        for (const prefix of prefixes) {
          const recipients = await kv.getByPrefix(prefix)
          allRecipients.push(...recipients)
        }
        
        const existingWithCode = allRecipients.find(r => r.voucherCode === newCode)
        if (!existingWithCode) break
        
      } while (attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        return c.json({ error: 'Gagal generate kode unik setelah beberapa percobaan' }, 500)
      }

      // Update recipient record with new code
      const updatedRecipient = {
        ...recipientRecord,
        voucherCode: newCode,
        lastCodeRegenerated: new Date().toISOString(),
        codeRegeneratedBy: user.id,
        updated_at: new Date().toISOString()
      }

      await kv.set(recipientKey, updatedRecipient)

      console.log('✅ Voucher code regenerated successfully:', newCode)

      return c.json({
        success: true,
        message: 'Kode voucher berhasil di-regenerate',
        newCode,
        recipientId,
        voucherId,
        updatedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Error regenerating voucher code:', error)
      return c.json({ error: 'Failed to regenerate voucher code' }, 500)
    }
  })

  // Generate unique voucher codes per patient
  app.post('/make-server-73417b67/vouchers/generate-per-patient', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { voucherId, patientIds, mode } = await c.req.json()
      
      if (!voucherId || !patientIds || !Array.isArray(patientIds)) {
        return c.json({ error: 'voucherId and patientIds array required' }, 400)
      }

      console.log('🎫 Generating voucher codes per patient:', { voucherId, patientCount: patientIds.length, mode })

      // Get voucher details
      const voucher = await kv.get(voucherId)
      if (!voucher) {
        return c.json({ error: 'Voucher not found' }, 404)
      }

      // Get patient details
      const patients = []
      for (const patientId of patientIds) {
        const patient = await kv.get(patientId)
        if (patient) {
          patients.push(patient)
        }
      }

      if (patients.length === 0) {
        return c.json({ error: 'No valid patients found' }, 400)
      }

      // Generate unique voucher codes for each patient
      const generateVoucherCode = (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = 'DENTAL'
        for (let i = 0; i < length - 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const generatedCodes = []
      const now = new Date().toISOString()

      // Get all existing recipients to avoid duplicate codes
      const allRecipients = await kv.getByPrefix('voucher_recipient_')
      const existingCodes = new Set(allRecipients.map(r => r.voucherCode).filter(Boolean))

      for (const patient of patients) {
        // Generate unique code
        let newCode
        let attempts = 0
        const maxAttempts = 10

        do {
          newCode = generateVoucherCode()
          attempts++
        } while (existingCodes.has(newCode) && attempts < maxAttempts)

        if (attempts >= maxAttempts) {
          return c.json({ error: 'Failed to generate unique codes after multiple attempts' }, 500)
        }

        // Add to existing codes set to avoid duplicates in this batch
        existingCodes.add(newCode)

        // Create voucher recipient record
        const recipientId = `voucher_recipient_${patient.id}_${voucherId}_${Date.now()}`
        const voucherRecipient = {
          id: recipientId,
          voucherId: voucherId,
          recipientId: patient.id,
          recipientName: patient.name,
          recipientPhone: patient.phone,
          recipientAddress: patient.address,
          voucherCode: newCode,
          voucherTitle: voucher.title,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          expiryDate: voucher.expiryDate,
          assignedDate: now,
          createdAt: now,
          createdBy: user.id,
          mode: mode || 'individual',
          status: 'active'
        }

        await kv.set(recipientId, voucherRecipient)

        generatedCodes.push({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          voucherCode: newCode,
          recipientId: recipientId
        })

        console.log(`✅ Generated voucher code for ${patient.name}: ${newCode}`)
      }

      console.log(`🎯 Successfully generated ${generatedCodes.length} voucher codes`)

      return c.json({
        success: true,
        message: `Generated ${generatedCodes.length} unique voucher codes`,
        count: generatedCodes.length,
        generatedCodes,
        voucherId,
        voucherTitle: voucher.title
      })

    } catch (error) {
      console.error('❌ Error generating voucher codes per patient:', error)
      return c.json({ error: 'Failed to generate voucher codes' }, 500)
    }
  })

  // Send WhatsApp reminder for voucher recipient
  app.post('/make-server-73417b67/vouchers/send-whatsapp-reminder', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const {
        recipientId,
        voucherId,
        voucherCode,
        recipientName,
        recipientPhone,
        voucherTitle,
        discountValue,
        discountType,
        expiryDate,
        daysUntilExpiry
      } = await c.req.json()

      console.log('📲 Sending WhatsApp reminder:', { recipientName, voucherCode, daysUntilExpiry })

      // Here you would integrate with WhatsApp API
      // For now, we'll just log the reminder and return success
      console.log(`📤 WhatsApp reminder sent to ${recipientName} (${recipientPhone})`)
      console.log(`   Voucher: ${voucherTitle}`)
      console.log(`   Code: ${voucherCode}`)
      console.log(`   Expires in: ${daysUntilExpiry} days`)

      return c.json({
        success: true,
        message: `WhatsApp reminder sent to ${recipientName}`,
        recipientName,
        voucherCode,
        sentAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Error sending WhatsApp reminder:', error)
      return c.json({ error: 'Failed to send WhatsApp reminder' }, 500)
    }
  })

  // Upload voucher image endpoint
  app.post('/make-server-73417b67/vouchers/upload-image', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { imageData, voucherCode, voucherTitle } = await c.req.json()

      if (!imageData) {
        return c.json({ error: 'Image data required' }, 400)
      }

      console.log('📷 Uploading voucher image:', { voucherCode, voucherTitle })

      // Initialize voucher images bucket
      const bucketName = 'make-73417b67-voucher-images'
      try {
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
        if (!bucketExists) {
          await supabase.storage.createBucket(bucketName, { public: true })
          console.log('✅ Voucher images bucket created')
        }
      } catch (bucketError) {
        console.log('❌ Error with voucher images bucket:', bucketError)
      }

      // Convert base64 to blob
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      const blob = new Uint8Array(atob(base64Data).split('').map(char => char.charCodeAt(0)))

      // Upload to storage
      const fileName = `voucher_${voucherCode}_${Date.now()}.png`
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.log('❌ Upload error:', uploadError)
        return c.json({ error: 'Failed to upload image' }, 500)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      console.log('✅ Voucher image uploaded successfully:', urlData.publicUrl)

      return c.json({
        success: true,
        imageUrl: urlData.publicUrl,
        fileName,
        voucherCode
      })

    } catch (error) {
      console.error('❌ Error uploading voucher image:', error)
      return c.json({ error: 'Failed to upload voucher image' }, 500)
    }
  })

  // Get voucher status with detailed information
  app.get('/make-server-73417b67/vouchers/status', async (c: any) => {
    try {
      console.log('📊 Voucher status endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get all vouchers
      const allVouchers = await kv.getByPrefix('voucher_')
      console.log('📦 Raw vouchers fetched:', allVouchers.length)

      // Get all voucher recipients 
      const allRecipients = await kv.getByPrefix('voucher_recipient_')
      console.log('📦 Raw recipients fetched:', allRecipients.length)

      // Get all voucher usages
      const allUsages = await kv.getByPrefix('voucher_usage_')
      console.log('📦 Raw usages fetched:', allUsages.length)

      // Process each voucher and calculate status
      const vouchersWithStatus = allVouchers.map((voucher: any) => {
        // Basic validation with more permissive checks
        if (!voucher.id) {
          console.log('⚠️ Skipping voucher without ID:', voucher)
          return null
        }

        // Use fallback values for missing data instead of filtering out
        const voucherData = {
          id: voucher.id,
          code: voucher.code || 'NO_CODE',
          title: voucher.title || 'Voucher Tanpa Judul',
          description: voucher.description || '',
          discountType: voucher.discountType || 'percentage',
          discountValue: Number(voucher.discountValue) || 0,
          expiryDate: voucher.expiryDate || null,
          usageLimit: Number(voucher.usageLimit) || 0,
          isActive: voucher.isActive !== false,
          created_at: voucher.created_at || voucher.createdDate || new Date().toISOString()
        }

        // Get recipients for this voucher
        const voucherRecipients = allRecipients.filter((r: any) => r.voucherId === voucher.id)
        
        // Get usages for this voucher
        const voucherUsages = allUsages.filter((u: any) => u.voucherId === voucher.id)

        // Calculate current usage
        const currentUsage = voucherUsages.length

        // Determine status
        const now = new Date()
        const expiryDate = voucherData.expiryDate ? new Date(voucherData.expiryDate) : null
        const isExpired = expiryDate && expiryDate < now
        const isUsedUp = voucherData.usageLimit > 0 && currentUsage >= voucherData.usageLimit
        const isInactive = !voucherData.isActive

        let status = 'active'
        let statusText = 'aktif'  
        let statusColor = 'green'

        if (isInactive) {
          status = 'inactive'
          statusText = 'non aktif'
          statusColor = 'gray'
        } else if (isUsedUp) {
          status = 'used_up'
          statusText = 'terpakai'
          statusColor = 'orange'
        } else if (isExpired) {
          status = 'expired'
          statusText = 'kadaluwarsa'
          statusColor = 'red'
        }

        // Format recipients data
        const recipients = voucherRecipients.map((recipient: any) => ({
          patientId: recipient.recipientId || recipient.patientId || 'unknown',
          patientName: recipient.recipientName || recipient.patientName || 'Unknown',
          assignedDate: recipient.assignedDate || recipient.createdAt || new Date().toISOString(),
          used: voucherUsages.some((usage: any) => usage.recipientId === recipient.recipientId)
        }))

        // Format usages data
        const usages = voucherUsages.map((usage: any) => ({
          id: usage.id,
          patientName: usage.patientName || 'Unknown',
          usedDate: usage.usedDate || usage.createdAt || new Date().toISOString(),
          discountAmount: usage.discountAmount || 0
        }))

        return {
          ...voucherData,
          currentUsage,
          status,
          statusColor,
          statusText,
          recipients,
          usages
        }
      }).filter(Boolean) // Remove null entries

      console.log('✅ Processed vouchers with status:', vouchersWithStatus.length)
      console.log('📊 Raw vouchers vs processed:', allVouchers.length, 'vs', vouchersWithStatus.length)

      // Sort by creation date descending
      const sortedVouchers = vouchersWithStatus.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return c.json({
        success: true,
        vouchers: sortedVouchers,
        totalCount: sortedVouchers.length,
        rawCount: allVouchers.length,
        stats: {
          active: sortedVouchers.filter(v => v.status === 'active').length,
          expired: sortedVouchers.filter(v => v.status === 'expired').length,
          used_up: sortedVouchers.filter(v => v.status === 'used_up').length,
          inactive: sortedVouchers.filter(v => v.status === 'inactive').length
        }
      })

    } catch (error) {
      console.log('❌ Error fetching voucher status:', error)
      return c.json({ error: 'Failed to fetch voucher status' }, 500)
    }
  })

  return app
}