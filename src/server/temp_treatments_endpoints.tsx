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