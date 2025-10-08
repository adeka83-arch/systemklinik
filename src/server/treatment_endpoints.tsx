// =============== TREATMENT ENDPOINTS ===============
app.get('/make-server-73417b67/treatments', async (c) => {
  console.log('🦷 Treatments GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const treatments = await kv.getByPrefix('treatment_')
    
    console.log(`📊 Found ${treatments.length} treatments in database`)
    
    // Transform treatments data
    const transformedTreatments = treatments.map(treatment => ({
      id: treatment.id,
      patientId: treatment.patientId || treatment.patient_id,
      patientName: treatment.patientName || treatment.patient_name || 'Unknown Patient',
      doctorId: treatment.doctorId || treatment.doctor_id,
      doctorName: treatment.doctorName || treatment.doctor_name || 'Unknown Doctor',
      treatmentItems: treatment.treatmentItems || treatment.treatment_items || [],
      totalAmount: treatment.totalAmount || treatment.total_amount || 0,
      adminFee: treatment.adminFee || treatment.admin_fee || 0,
      finalAmount: treatment.finalAmount || treatment.final_amount || 0,
      paymentStatus: treatment.paymentStatus || treatment.payment_status || 'pending',
      date: treatment.date || treatment.created_at,
      createdAt: treatment.created_at || treatment.createdAt || new Date().toISOString(),
      notes: treatment.notes || '',
      status: treatment.status || 'active'
    }))
    
    console.log(`✅ Returning ${transformedTreatments.length} treatments`)
    
    return c.json({
      success: true,
      treatments: transformedTreatments
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

app.post('/make-server-73417b67/treatments', async (c) => {
  console.log('🦷 Create treatment called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Treatment data received:', body)
    
    const { 
      patientId, 
      patientName, 
      doctorId, 
      doctorName, 
      treatmentItems, 
      totalAmount, 
      adminFee, 
      finalAmount,
      paymentStatus,
      notes 
    } = body
    
    // Validate required fields
    if (!patientId || !doctorId || !treatmentItems || treatmentItems.length === 0) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Pasien, dokter, dan item tindakan wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for treatment')
    
    // Create treatment record
    const treatmentRecord = {
      id: `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      patientId: patientId,
      patient_id: patientId, // dual field for compatibility
      patientName: patientName || 'Unknown Patient',
      patient_name: patientName || 'Unknown Patient', // dual field for compatibility
      doctorId: doctorId,
      doctor_id: doctorId, // dual field for compatibility
      doctorName: doctorName || 'Unknown Doctor',
      doctor_name: doctorName || 'Unknown Doctor', // dual field for compatibility
      treatmentItems: treatmentItems,
      treatment_items: treatmentItems, // dual field for compatibility
      totalAmount: parseFloat(totalAmount) || 0,
      total_amount: parseFloat(totalAmount) || 0, // dual field for compatibility
      adminFee: parseFloat(adminFee) || 0,
      admin_fee: parseFloat(adminFee) || 0, // dual field for compatibility
      finalAmount: parseFloat(finalAmount) || 0,
      final_amount: parseFloat(finalAmount) || 0, // dual field for compatibility
      paymentStatus: paymentStatus || 'pending',
      payment_status: paymentStatus || 'pending', // dual field for compatibility
      notes: notes || '',
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString() // dual field for compatibility
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

app.put('/make-server-73417b67/treatments/:id', async (c) => {
  console.log('🦷 Update treatment called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const treatmentId = c.req.param('id')
    const body = await c.req.json()
    
    console.log('📋 Updating treatment ID:', treatmentId)
    console.log('📋 Update data:', body)
    
    // Get existing treatment
    const existingTreatments = await kv.getByPrefix('treatment_')
    const existingTreatment = existingTreatments.find(t => t.id === treatmentId)
    
    if (!existingTreatment) {
      return c.json({
        success: false,
        error: 'Tindakan tidak ditemukan'
      }, 404)
    }
    
    const { 
      patientId, 
      patientName, 
      doctorId, 
      doctorName, 
      treatmentItems, 
      totalAmount, 
      adminFee, 
      finalAmount,
      paymentStatus,
      notes 
    } = body
    
    // Update treatment with new data
    const updatedTreatment = {
      ...existingTreatment,
      patientId: patientId || existingTreatment.patientId,
      patient_id: patientId || existingTreatment.patientId,
      patientName: patientName || existingTreatment.patientName,
      patient_name: patientName || existingTreatment.patientName,
      doctorId: doctorId || existingTreatment.doctorId,
      doctor_id: doctorId || existingTreatment.doctorId,
      doctorName: doctorName || existingTreatment.doctorName,
      doctor_name: doctorName || existingTreatment.doctorName,
      treatmentItems: treatmentItems || existingTreatment.treatmentItems,
      treatment_items: treatmentItems || existingTreatment.treatmentItems,
      totalAmount: parseFloat(totalAmount) || existingTreatment.totalAmount,
      total_amount: parseFloat(totalAmount) || existingTreatment.totalAmount,
      adminFee: parseFloat(adminFee) || existingTreatment.adminFee,
      admin_fee: parseFloat(adminFee) || existingTreatment.adminFee,
      finalAmount: parseFloat(finalAmount) || existingTreatment.finalAmount,
      final_amount: parseFloat(finalAmount) || existingTreatment.finalAmount,
      paymentStatus: paymentStatus || existingTreatment.paymentStatus,
      payment_status: paymentStatus || existingTreatment.paymentStatus,
      notes: notes !== undefined ? notes : existingTreatment.notes,
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

app.delete('/make-server-73417b67/treatments/:id', async (c) => {
  console.log('🦷 Delete treatment called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const treatmentId = c.req.param('id')
    
    console.log('🗑️ Deleting treatment ID:', treatmentId)
    
    // Check if treatment exists
    const existingTreatments = await kv.getByPrefix('treatment_')
    const existingTreatment = existingTreatments.find(t => t.id === treatmentId)
    
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

// =============== PATIENTS ENDPOINTS ===============
app.get('/make-server-73417b67/patients', async (c) => {
  console.log('👥 Patients GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const patients = await kv.getByPrefix('patient_')
    
    console.log(`📊 Found ${patients.length} patients in database`)
    
    // Transform patients data
    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.nama || patient.name || 'Unknown Patient',
      phone: patient.telepon || patient.phone || '',
      email: patient.email || '',
      address: patient.alamat || patient.address || '',
      birthDate: patient.tanggal_lahir || patient.birth_date || '',
      gender: patient.jenis_kelamin || patient.gender || '',
      status: patient.status || 'aktif',
      created_at: patient.created_at || new Date().toISOString(),
      updated_at: patient.updated_at || patient.created_at || new Date().toISOString()
    }))
    
    // Filter only active patients
    const activePatients = transformedPatients.filter(patient => patient.status === 'aktif')
    
    console.log(`✅ Returning ${activePatients.length} active patients`)
    
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

app.post('/make-server-73417b67/patients', async (c) => {
  console.log('👥 Create patient called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Patient data received:', body)
    
    const { nama, name, telepon, phone, email, alamat, address, tanggal_lahir, birth_date, jenis_kelamin, gender } = body
    
    // Extract patient data with fallbacks
    const patientName = nama || name
    const patientPhone = telepon || phone || ''
    const patientEmail = email || ''
    const patientAddress = alamat || address || ''
    const patientBirthDate = tanggal_lahir || birth_date || ''
    const patientGender = jenis_kelamin || gender || ''
    
    // Validate required fields
    if (!patientName || patientName.trim() === '') {
      console.log('❌ Validation failed: Patient name is required')
      return c.json({
        success: false,
        error: 'Nama pasien wajib diisi'
      }, 400)
    }
    
    console.log('✅ Validation passed for patient:', patientName)
    
    // Create patient record
    const patientRecord = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      nama: patientName.trim(),
      name: patientName.trim(), // dual field for compatibility
      telepon: patientPhone.trim(),
      phone: patientPhone.trim(), // dual field for compatibility
      email: patientEmail.trim(),
      alamat: patientAddress.trim(),
      address: patientAddress.trim(), // dual field for compatibility
      tanggal_lahir: patientBirthDate,
      birth_date: patientBirthDate, // dual field for compatibility
      jenis_kelamin: patientGender,
      gender: patientGender, // dual field for compatibility
      status: 'aktif',
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
      error: `Gagal menyimpan pasien: ${error.message}`
    }, 500)
  }
})