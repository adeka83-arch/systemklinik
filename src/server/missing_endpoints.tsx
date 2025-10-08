// =============== SITTING FEES ENDPOINTS ===============
export const addSittingFeesEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/sitting-fees', async (c: any) => {
    console.log('💰 Sitting Fees GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const sittingFees = await kv.getByPrefix('sitting_fee_')
      
      console.log(`📊 Found ${sittingFees.length} sitting fees in database`)
      
      // Transform sitting fees data to match component interface
      const transformedSittingFees = sittingFees.map(fee => ({
        id: fee.id,
        doctorId: fee.doctorId || fee.doctor_id || '',
        doctorName: fee.doctorName || fee.doctor_name || 'Unknown Doctor',
        shift: fee.shift || '09:00-15:00', // Default shift
        amount: fee.amount || fee.jumlah || 0,
        date: fee.date || fee.tanggal || new Date().toISOString().split('T')[0],
        createdAt: fee.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedSittingFees.length} sitting fees`)
      
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

  app.post('/make-server-73417b67/sitting-fees', async (c: any) => {
    console.log('💰 Create sitting fee called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Sitting fee data received:', body)
      
      const { 
        doctorId, 
        doctorName, 
        shift,
        amount, 
        date, 
        time, 
        notes 
      } = body
      
      // Validate required fields
      if (!doctorId || !shift || !amount) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Dokter, shift, dan nominal wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for sitting fee')
      
      // Create sitting fee record
      const sittingFeeRecord = {
        id: `sitting_fee_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        doctorId: doctorId,
        doctor_id: doctorId,
        doctorName: doctorName || 'Unknown Doctor',
        doctor_name: doctorName || 'Unknown Doctor',
        shift: shift,
        amount: amount,
        jumlah: amount,
        date: date || new Date().toISOString().split('T')[0],
        tanggal: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        waktu: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
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

  app.put('/make-server-73417b67/sitting-fees/:id', async (c: any) => {
    console.log('💰 Update sitting fee called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const sittingFeeId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('📋 Updating sitting fee ID:', sittingFeeId)
      
      // Get existing sitting fee
      const existingSittingFees = await kv.getByPrefix('sitting_fee_')
      const existingSittingFee = existingSittingFees.find(f => f.id === sittingFeeId)
      
      if (!existingSittingFee) {
        return c.json({
          success: false,
          error: 'Data uang duduk tidak ditemukan'
        }, 404)
      }
      
      const { doctorId, doctorName, shift, amount, date } = body
      
      // Update sitting fee with new data
      const updatedSittingFee = {
        ...existingSittingFee,
        doctorId: doctorId || existingSittingFee.doctorId,
        doctor_id: doctorId || existingSittingFee.doctor_id,
        doctorName: doctorName || existingSittingFee.doctorName,
        doctor_name: doctorName || existingSittingFee.doctor_name,
        shift: shift || existingSittingFee.shift,
        amount: amount !== undefined ? amount : existingSittingFee.amount,
        jumlah: amount !== undefined ? amount : existingSittingFee.jumlah,
        date: date || existingSittingFee.date,
        tanggal: date || existingSittingFee.tanggal,
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update sitting fee...')
      await kv.set(sittingFeeId, updatedSittingFee)
      console.log('✅ Sitting fee updated successfully')
      
      return c.json({
        success: true,
        message: 'Data uang duduk berhasil diperbarui',
        sittingFee: updatedSittingFee
      })
      
    } catch (error) {
      console.log('💥 Error updating sitting fee:', error)
      return c.json({
        success: false,
        error: `Gagal memperbarui data uang duduk: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/sitting-fees/:id', async (c: any) => {
    console.log('💰 Delete sitting fee called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const sittingFeeId = c.req.param('id')
      
      console.log('🗑️ Deleting sitting fee ID:', sittingFeeId)
      
      // Check if sitting fee exists
      const existingSittingFees = await kv.getByPrefix('sitting_fee_')
      const existingSittingFee = existingSittingFees.find(f => f.id === sittingFeeId)
      
      if (!existingSittingFee) {
        return c.json({
          success: false,
          error: 'Data uang duduk tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(sittingFeeId)
      console.log('✅ Sitting fee deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data uang duduk berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting sitting fee:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data uang duduk: ${error.message}`
      }, 500)
    }
  })

  // =============== DOCTOR SITTING FEE SETTINGS ENDPOINTS ===============
  app.get('/make-server-73417b67/doctor-sitting-fee-settings', async (c: any) => {
    console.log('💰 Doctor Sitting Fee Settings GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const settings = await kv.getByPrefix('doctor_sitting_fee_setting_')
      
      console.log(`📊 Found ${settings.length} sitting fee settings in database`)
      
      // Transform settings data
      const transformedSettings = settings.map(setting => ({
        id: setting.id,
        doctorId: setting.doctorId || setting.doctor_id || '',
        doctorName: setting.doctorName || setting.doctor_name || 'Unknown Doctor',
        shift: setting.shift || '',
        amount: setting.amount || setting.jumlah || 0,
        createdAt: setting.createdAt || setting.created_at || new Date().toISOString(),
        updatedAt: setting.updatedAt || setting.updated_at || setting.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedSettings.length} sitting fee settings`)
      
      return c.json({
        success: true,
        settings: transformedSettings
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

  app.post('/make-server-73417b67/doctor-sitting-fee-settings', async (c: any) => {
    console.log('💰 Create sitting fee setting called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Sitting fee setting data received:', body)
      
      const { doctorId, doctorName, shift, amount } = body
      
      // Validate required fields
      if (!doctorId || !shift || !amount) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Dokter, shift, dan nominal wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for sitting fee setting')
      
      // Create sitting fee setting record
      const settingRecord = {
        id: `doctor_sitting_fee_setting_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        doctorId: doctorId,
        doctor_id: doctorId,
        doctorName: doctorName || 'Unknown Doctor',
        doctor_name: doctorName || 'Unknown Doctor',
        shift: shift,
        amount: amount,
        jumlah: amount,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  app.put('/make-server-73417b67/doctor-sitting-fee-settings/:id', async (c: any) => {
    console.log('💰 Update sitting fee setting called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const settingId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('📋 Updating sitting fee setting ID:', settingId)
      
      // Get existing setting
      const existingSettings = await kv.getByPrefix('doctor_sitting_fee_setting_')
      const existingSetting = existingSettings.find(s => s.id === settingId)
      
      if (!existingSetting) {
        return c.json({
          success: false,
          error: 'Pengaturan uang duduk tidak ditemukan'
        }, 404)
      }
      
      const { doctorId, doctorName, shift, amount } = body
      
      // Update setting with new data
      const updatedSetting = {
        ...existingSetting,
        doctorId: doctorId || existingSetting.doctorId,
        doctor_id: doctorId || existingSetting.doctor_id,
        doctorName: doctorName || existingSetting.doctorName,
        doctor_name: doctorName || existingSetting.doctor_name,
        shift: shift || existingSetting.shift,
        amount: amount !== undefined ? amount : existingSetting.amount,
        jumlah: amount !== undefined ? amount : existingSetting.jumlah,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update sitting fee setting...')
      await kv.set(settingId, updatedSetting)
      console.log('✅ Sitting fee setting updated successfully')
      
      return c.json({
        success: true,
        message: 'Pengaturan uang duduk berhasil diperbarui',
        setting: updatedSetting
      })
      
    } catch (error) {
      console.log('💥 Error updating sitting fee setting:', error)
      return c.json({
        success: false,
        error: `Gagal memperbarui pengaturan uang duduk: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/doctor-sitting-fee-settings/:id', async (c: any) => {
    console.log('💰 Delete sitting fee setting called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const settingId = c.req.param('id')
      
      console.log('🗑️ Deleting sitting fee setting ID:', settingId)
      
      // Check if setting exists
      const existingSettings = await kv.getByPrefix('doctor_sitting_fee_setting_')
      const existingSetting = existingSettings.find(s => s.id === settingId)
      
      if (!existingSetting) {
        return c.json({
          success: false,
          error: 'Pengaturan uang duduk tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(settingId)
      console.log('✅ Sitting fee setting deleted successfully')
      
      return c.json({
        success: true,
        message: 'Pengaturan uang duduk berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting sitting fee setting:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus pengaturan uang duduk: ${error.message}`
      }, 500)
    }
  })

  // Get specific sitting fee setting by doctor and shift
  app.get('/make-server-73417b67/doctor-sitting-fee/:doctorId/:shift', async (c: any) => {
    console.log('💰 Get specific sitting fee setting called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const doctorId = c.req.param('doctorId')
      const shift = decodeURIComponent(c.req.param('shift'))
      
      console.log('🔍 Looking for setting:', { doctorId, shift })
      
      // Get all settings and find matching one
      const settings = await kv.getByPrefix('doctor_sitting_fee_setting_')
      const matchingSetting = settings.find(s => 
        (s.doctorId === doctorId || s.doctor_id === doctorId) && s.shift === shift
      )
      
      if (matchingSetting) {
        console.log('✅ Found matching setting:', matchingSetting)
        return c.json({
          success: true,
          setting: {
            id: matchingSetting.id,
            doctorId: matchingSetting.doctorId || matchingSetting.doctor_id,
            doctorName: matchingSetting.doctorName || matchingSetting.doctor_name,
            shift: matchingSetting.shift,
            amount: matchingSetting.amount || matchingSetting.jumlah
          }
        })
      } else {
        console.log('❌ No matching setting found')
        return c.json({
          success: false,
          error: 'Pengaturan tidak ditemukan',
          setting: null
        }, 404)
      }
      
    } catch (error) {
      console.log('💥 Error fetching specific sitting fee setting:', error)
      return c.json({
        success: false,
        error: error.message,
        setting: null
      }, 500)
    }
  })

  // Create sample sitting fee settings for testing
  app.post('/make-server-73417b67/doctor-sitting-fee-settings/create-sample', async (c: any) => {
    console.log('💰 Creating sample sitting fee settings...')
    
    try {
      const kv = await import('./kv_store.tsx')
      
      // Get doctors first
      const doctors = await kv.getByPrefix('dokter_')
      
      if (doctors.length === 0) {
        return c.json({
          success: false,
          error: 'No doctors found. Please create doctors first.'
        }, 400)
      }

      const sampleSettings = []
      const currentTime = Date.now()
      
      // Create default sitting fee settings for each doctor and shift
      for (let i = 0; i < doctors.length; i++) {
        const doctor = doctors[i]
        const doctorName = doctor.nama || doctor.name || 'Unknown Doctor'
        const doctorId = doctor.id
        
        // Default shifts with amounts
        const shifts = [
          { shift: '09:00-15:00', amount: 100000 },
          { shift: '18:00-20:00', amount: 50000 }
        ]
        
        for (const shiftData of shifts) {
          const settingId = `doctor_sitting_fee_setting_${currentTime + i * 100 + Math.random().toString(36).substr(2, 3)}`
          const setting = {
            id: settingId,
            doctorId: doctorId,
            doctor_id: doctorId,
            doctorName: doctorName,
            doctor_name: doctorName,
            shift: shiftData.shift,
            amount: shiftData.amount,
            jumlah: shiftData.amount,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          await kv.set(settingId, setting)
          sampleSettings.push(setting)
          
          console.log(`✅ Created setting: ${doctorName} - ${shiftData.shift} - Rp ${shiftData.amount.toLocaleString()}`)
        }
      }
      
      return c.json({
        success: true,
        message: `Created ${sampleSettings.length} sitting fee settings`,
        settings: sampleSettings
      })
      
    } catch (error) {
      console.log('💥 Error creating sample sitting fee settings:', error)
      return c.json({
        success: false,
        error: `Failed to create sample settings: ${error.message}`
      }, 500)
    }
  })
}

// =============== SALES ENDPOINTS ===============
export const addSalesEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/sales', async (c: any) => {
    console.log('🛒 Sales GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const sales = await kv.getByPrefix('sale_')
      
      console.log(`📊 Found ${sales.length} sales in database`)
      
      // Transform sales data
      const transformedSales = sales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber || sale.invoice_number || sale.nomor_invoice || '',
        patientId: sale.patientId || sale.patient_id || '',
        patientName: sale.patientName || sale.patient_name || 'Unknown Patient',
        doctorId: sale.doctorId || sale.doctor_id || '',
        doctorName: sale.doctorName || sale.doctor_name || 'Unknown Doctor',
        items: sale.items || sale.produk || [],
        subtotal: sale.subtotal || sale.sub_total || 0,
        discount: sale.discount || sale.diskon || 0,
        tax: sale.tax || sale.pajak || 0,
        total: sale.total || sale.jumlah_total || 0,
        paymentMethod: sale.paymentMethod || sale.payment_method || sale.metode_pembayaran || 'cash',
        paymentStatus: sale.paymentStatus || sale.payment_status || sale.status_pembayaran || 'pending',
        date: sale.date || sale.tanggal || new Date().toISOString().split('T')[0],
        time: sale.time || sale.waktu || '00:00',
        notes: sale.notes || sale.catatan || '',
        created_at: sale.created_at || new Date().toISOString(),
        updated_at: sale.updated_at || sale.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedSales.length} sales`)
      
      return c.json({
        success: true,
        sales: transformedSales
      })
      
    } catch (error) {
      console.log('💥 Error fetching sales:', error)
      return c.json({
        success: false,
        error: error.message,
        sales: []
      }, 500)
    }
  })

  app.post('/make-server-73417b67/sales', async (c: any) => {
    console.log('🛒 Create sale called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Sale data received:', body)
      
      const { 
        invoiceNumber,
        patientId, 
        patientName, 
        doctorId, 
        doctorName, 
        items, 
        subtotal, 
        discount, 
        tax, 
        total, 
        paymentMethod, 
        paymentStatus, 
        date, 
        time, 
        notes 
      } = body
      
      // Validate required fields (penjualan tidak memerlukan pasien)
      if (!items || !Array.isArray(items) || items.length === 0 || !total) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Item penjualan dan total wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for sale')
      
      // Generate invoice number if not provided
      const generatedInvoiceNumber = invoiceNumber || `INV-${Date.now()}`
      
      // Create sale record
      const saleRecord = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        invoiceNumber: generatedInvoiceNumber,
        invoice_number: generatedInvoiceNumber,
        nomor_invoice: generatedInvoiceNumber,
        patientId: patientId || 'walk-in-customer',
        patient_id: patientId || 'walk-in-customer',
        patientName: patientName || 'Walk-in Customer',
        patient_name: patientName || 'Walk-in Customer',
        doctorId: doctorId || '',
        doctor_id: doctorId || '',
        doctorName: doctorName || '',
        doctor_name: doctorName || '',
        items: items,
        produk: items,
        subtotal: subtotal || 0,
        sub_total: subtotal || 0,
        discount: discount || 0,
        diskon: discount || 0,
        tax: tax || 0,
        pajak: tax || 0,
        total: total,
        jumlah_total: total,
        paymentMethod: paymentMethod || 'cash',
        payment_method: paymentMethod || 'cash',
        metode_pembayaran: paymentMethod || 'cash',
        paymentStatus: paymentStatus || 'completed',
        payment_status: paymentStatus || 'completed',
        status_pembayaran: paymentStatus || 'completed',
        date: date || new Date().toISOString().split('T')[0],
        tanggal: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        waktu: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: notes || '',
        catatan: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Update product stock if productId is provided
      let updatedStock = null
      if (items.length > 0 && items[0].productId) {
        try {
          const products = await kv.getByPrefix('product_')
          const product = products.find(p => p.id === items[0].productId)
          
          if (product) {
            const newStock = (product.stok || product.stock || 0) - items[0].quantity
            const updatedProduct = {
              ...product,
              stok: newStock,
              stock: newStock,
              updated_at: new Date().toISOString()
            }
            
            await kv.set(product.id, updatedProduct)
            updatedStock = newStock
            console.log(`✅ Stock updated for product ${product.nama || product.name}: ${updatedStock}`)
          }
        } catch (error) {
          console.log('⚠️ Error updating stock:', error)
        }
      }

      // Save to database
      console.log('💾 Attempting to save sale to database...')
      await kv.set(saleRecord.id, saleRecord)
      console.log('✅ Sale saved successfully with ID:', saleRecord.id)
      
      return c.json({
        success: true,
        message: 'Penjualan berhasil dicatat',
        sale: saleRecord,
        updatedStock: updatedStock
      })
      
    } catch (error) {
      console.log('💥 Error creating sale:', error)
      return c.json({
        success: false,
        error: `Gagal mencatat penjualan: ${error.message}`
      }, 500)
    }
  })

  app.put('/make-server-73417b67/sales/:id', async (c: any) => {
    console.log('🛒 Update sale called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const saleId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('📋 Updating sale ID:', saleId)
      
      // Get existing sale
      const existingSales = await kv.getByPrefix('sale_')
      const existingSale = existingSales.find(s => s.id === saleId)
      
      if (!existingSale) {
        return c.json({
          success: false,
          error: 'Data penjualan tidak ditemukan'
        }, 404)
      }
      
      const { patientId, patientName, items, subtotal, discount, tax, total, paymentMethod, paymentStatus, date, notes } = body
      
      // Handle stock adjustment if quantity changed
      let updatedStock = null
      if (items && items.length > 0) {
        const newItem = items[0]
        const oldItems = existingSale.items || existingSale.produk || []
        const oldItem = oldItems.length > 0 ? oldItems[0] : null
        
        if (newItem.productId && oldItem && newItem.productId === oldItem.productId) {
          const quantityDifference = newItem.quantity - oldItem.quantity
          
          if (quantityDifference !== 0) {
            try {
              const products = await kv.getByPrefix('product_')
              const product = products.find(p => p.id === newItem.productId)
              
              if (product) {
                const newStock = (product.stok || product.stock || 0) - quantityDifference
                
                if (newStock < 0) {
                  return c.json({
                    success: false,
                    error: `Stok tidak mencukupi. Stok tersedia: ${product.stok || product.stock || 0}`
                  }, 400)
                }
                
                const updatedProduct = {
                  ...product,
                  stok: newStock,
                  stock: newStock,
                  updated_at: new Date().toISOString()
                }
                
                await kv.set(product.id, updatedProduct)
                updatedStock = newStock
                console.log(`✅ Stock adjusted for product ${product.nama || product.name}: ${updatedStock}`)
              }
            } catch (error) {
              console.log('⚠️ Error adjusting stock:', error)
            }
          }
        }
      }
      
      // Update sale with new data
      const updatedSale = {
        ...existingSale,
        patientId: patientId || existingSale.patientId,
        patient_id: patientId || existingSale.patient_id,
        patientName: patientName || existingSale.patientName,
        patient_name: patientName || existingSale.patient_name,
        items: items || existingSale.items,
        produk: items || existingSale.produk,
        subtotal: subtotal !== undefined ? subtotal : existingSale.subtotal,
        sub_total: subtotal !== undefined ? subtotal : existingSale.sub_total,
        discount: discount !== undefined ? discount : existingSale.discount,
        diskon: discount !== undefined ? discount : existingSale.diskon,
        tax: tax !== undefined ? tax : existingSale.tax,
        pajak: tax !== undefined ? tax : existingSale.pajak,
        total: total !== undefined ? total : existingSale.total,
        jumlah_total: total !== undefined ? total : existingSale.jumlah_total,
        paymentMethod: paymentMethod || existingSale.paymentMethod,
        payment_method: paymentMethod || existingSale.payment_method,
        metode_pembayaran: paymentMethod || existingSale.metode_pembayaran,
        paymentStatus: paymentStatus || existingSale.paymentStatus,
        payment_status: paymentStatus || existingSale.payment_status,
        status_pembayaran: paymentStatus || existingSale.status_pembayaran,
        date: date || existingSale.date,
        tanggal: date || existingSale.tanggal,
        notes: notes !== undefined ? notes : existingSale.notes,
        catatan: notes !== undefined ? notes : existingSale.catatan,
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update sale...')
      await kv.set(saleId, updatedSale)
      console.log('✅ Sale updated successfully')
      
      return c.json({
        success: true,
        message: 'Data penjualan berhasil diperbarui',
        sale: updatedSale,
        updatedStock: updatedStock
      })
      
    } catch (error) {
      console.log('💥 Error updating sale:', error)
      return c.json({
        success: false,
        error: `Gagal memperbarui data penjualan: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/sales/:id', async (c: any) => {
    console.log('🛒 Delete sale called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const saleId = c.req.param('id')
      
      console.log('🗑️ Deleting sale ID:', saleId)
      
      // Check if sale exists
      const existingSales = await kv.getByPrefix('sale_')
      const existingSale = existingSales.find(s => s.id === saleId)
      
      if (!existingSale) {
        return c.json({
          success: false,
          error: 'Data penjualan tidak ditemukan'
        }, 404)
      }
      
      // Restore product stock if productId exists in the sale
      let restoredStock = null
      const items = existingSale.items || existingSale.produk || []
      
      if (items.length > 0 && items[0].productId) {
        try {
          const products = await kv.getByPrefix('product_')
          const product = products.find(p => p.id === items[0].productId)
          
          if (product) {
            const newStock = (product.stok || product.stock || 0) + items[0].quantity
            const updatedProduct = {
              ...product,
              stok: newStock,
              stock: newStock,
              updated_at: new Date().toISOString()
            }
            
            await kv.set(product.id, updatedProduct)
            restoredStock = newStock
            console.log(`✅ Stock restored for product ${product.nama || product.name}: ${restoredStock}`)
          }
        } catch (error) {
          console.log('⚠️ Error restoring stock:', error)
        }
      }
      
      // Delete from database
      await kv.del(saleId)
      console.log('✅ Sale deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data penjualan berhasil dihapus',
        restoredStock: restoredStock
      })
      
    } catch (error) {
      console.log('💥 Error deleting sale:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data penjualan: ${error.message}`
      }, 500)
    }
  })
}

// =============== DENTAL MATERIALS ENDPOINTS ===============
export const addDentalMaterialsEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/dental-materials', async (c: any) => {
    console.log('🦷 Dental Materials GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const materials = await kv.getByPrefix('dental_material_')
      
      console.log(`📊 Found ${materials.length} dental materials in database`)
      
      // Transform dental materials data
      const transformedMaterials = materials.map(material => ({
        id: material.id,
        name: material.name || material.nama || 'Unknown Material',
        stock: material.stock || material.stok || 0,
        unit: material.unit || material.satuan || 'pcs',
        location: material.location || material.lokasi || '',
        notes: material.notes || material.catatan || '',
        created_at: material.created_at || new Date().toISOString(),
        updated_at: material.updated_at || material.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedMaterials.length} dental materials`)
      
      return c.json({
        success: true,
        materials: transformedMaterials
      })
      
    } catch (error) {
      console.log('💥 Error fetching dental materials:', error)
      return c.json({
        success: false,
        error: error.message,
        materials: []
      }, 500)
    }
  })

  app.post('/make-server-73417b67/dental-materials', async (c: any) => {
    console.log('🦷 Create dental material called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Dental material data received:', body)
      
      const { name, stock, unit, location, notes } = body
      
      // Validate required fields
      if (!name || stock === undefined || stock === null || !unit) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Nama bahan, stok, dan satuan wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for dental material')
      
      // Create dental material record
      const materialRecord = {
        id: `dental_material_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim(),
        nama: name.trim(),
        stock: parseInt(stock) || 0,
        stok: parseInt(stock) || 0,
        unit: unit.trim(),
        satuan: unit.trim(),
        location: location ? location.trim() : '',
        lokasi: location ? location.trim() : '',
        notes: notes ? notes.trim() : '',
        catatan: notes ? notes.trim() : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to save dental material to database...')
      await kv.set(materialRecord.id, materialRecord)
      console.log('✅ Dental material saved successfully with ID:', materialRecord.id)
      
      return c.json({
        success: true,
        message: 'Bahan dental berhasil ditambahkan',
        material: materialRecord
      })
      
    } catch (error) {
      console.log('💥 Error creating dental material:', error)
      return c.json({
        success: false,
        error: `Gagal menyimpan bahan dental: ${error.message}`
      }, 500)
    }
  })

  app.put('/make-server-73417b67/dental-materials/:id', async (c: any) => {
    console.log('🦷 Update dental material called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const materialId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('📋 Updating dental material ID:', materialId)
      
      // Get existing material
      const existingMaterials = await kv.getByPrefix('dental_material_')
      const existingMaterial = existingMaterials.find(m => m.id === materialId)
      
      if (!existingMaterial) {
        return c.json({
          success: false,
          error: 'Data bahan dental tidak ditemukan'
        }, 404)
      }
      
      const { name, stock, unit, location, notes } = body
      
      // Update material with new data
      const updatedMaterial = {
        ...existingMaterial,
        name: name ? name.trim() : existingMaterial.name,
        nama: name ? name.trim() : existingMaterial.nama,
        stock: stock !== undefined ? parseInt(stock) : existingMaterial.stock,
        stok: stock !== undefined ? parseInt(stock) : existingMaterial.stok,
        unit: unit ? unit.trim() : existingMaterial.unit,
        satuan: unit ? unit.trim() : existingMaterial.satuan,
        location: location !== undefined ? (location ? location.trim() : '') : existingMaterial.location,
        lokasi: location !== undefined ? (location ? location.trim() : '') : existingMaterial.lokasi,
        notes: notes !== undefined ? (notes ? notes.trim() : '') : existingMaterial.notes,
        catatan: notes !== undefined ? (notes ? notes.trim() : '') : existingMaterial.catatan,
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update dental material...')
      await kv.set(materialId, updatedMaterial)
      console.log('✅ Dental material updated successfully')
      
      return c.json({
        success: true,
        message: 'Data bahan dental berhasil diperbarui',
        material: updatedMaterial
      })
      
    } catch (error) {
      console.log('💥 Error updating dental material:', error)
      return c.json({
        success: false,
        error: `Gagal memperbarui data bahan dental: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/dental-materials/:id', async (c: any) => {
    console.log('🦷 Delete dental material called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const materialId = c.req.param('id')
      
      console.log('🗑️ Deleting dental material ID:', materialId)
      
      // Check if material exists
      const existingMaterials = await kv.getByPrefix('dental_material_')
      const existingMaterial = existingMaterials.find(m => m.id === materialId)
      
      if (!existingMaterial) {
        return c.json({
          success: false,
          error: 'Data bahan dental tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(materialId)
      console.log('✅ Dental material deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data bahan dental berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting dental material:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data bahan dental: ${error.message}`
      }, 500)
    }
  })
}

// =============== DENTAL USAGES ENDPOINTS ===============
export const addDentalUsagesEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/dental-usages', async (c: any) => {
    console.log('🦷 Dental Usages GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const usages = await kv.getByPrefix('dental_usage_')
      
      console.log(`📊 Found ${usages.length} dental usages in database`)
      
      // Transform dental usages data
      const transformedUsages = usages.map(usage => ({
        id: usage.id,
        materialId: usage.materialId || usage.material_id || '',
        materialName: usage.materialName || usage.material_name || 'Unknown Material',
        quantity: usage.quantity || usage.jumlah || 0,
        unit: usage.unit || usage.satuan || 'pcs',
        usedBy: usage.usedBy || usage.used_by || usage.digunakan_oleh || '',
        usageDate: usage.usageDate || usage.usage_date || usage.tanggal_pakai || new Date().toISOString().split('T')[0],
        notes: usage.notes || usage.catatan || '',
        created_at: usage.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedUsages.length} dental usages`)
      
      return c.json({
        success: true,
        usages: transformedUsages
      })
      
    } catch (error) {
      console.log('💥 Error fetching dental usages:', error)
      return c.json({
        success: false,
        error: error.message,
        usages: []
      }, 500)
    }
  })

  app.post('/make-server-73417b67/dental-usages', async (c: any) => {
    console.log('🦷 Create dental usage called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Dental usage data received:', body)
      
      const { materialId, materialName, quantity, unit, usedBy, usageDate, notes } = body
      
      // Validate required fields
      if (!materialId || !quantity || !usedBy || !usageDate) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Bahan dental, jumlah, digunakan oleh, dan tanggal wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for dental usage')
      
      // Get material to check stock and update it
      const materials = await kv.getByPrefix('dental_material_')
      const material = materials.find(m => m.id === materialId)
      
      if (!material) {
        return c.json({
          success: false,
          error: 'Bahan dental tidak ditemukan'
        }, 404)
      }
      
      const currentStock = material.stock || material.stok || 0
      const usageQuantity = parseInt(quantity)
      
      if (currentStock < usageQuantity) {
        return c.json({
          success: false,
          error: `Stok tidak mencukupi. Stok tersedia: ${currentStock} ${material.unit || material.satuan}`
        }, 400)
      }
      
      // Create dental usage record
      const usageRecord = {
        id: `dental_usage_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        materialId: materialId,
        material_id: materialId,
        materialName: materialName || material.name || material.nama,
        material_name: materialName || material.name || material.nama,
        quantity: usageQuantity,
        jumlah: usageQuantity,
        unit: unit || material.unit || material.satuan,
        satuan: unit || material.unit || material.satuan,
        usedBy: usedBy.trim(),
        used_by: usedBy.trim(),
        digunakan_oleh: usedBy.trim(),
        usageDate: usageDate,
        usage_date: usageDate,
        tanggal_pakai: usageDate,
        notes: notes ? notes.trim() : '',
        catatan: notes ? notes.trim() : '',
        created_at: new Date().toISOString()
      }
      
      // Update material stock
      const newStock = currentStock - usageQuantity
      const updatedMaterial = {
        ...material,
        stock: newStock,
        stok: newStock,
        updated_at: new Date().toISOString()
      }
      
      // Save both records
      console.log('💾 Attempting to save dental usage and update stock...')
      await kv.set(usageRecord.id, usageRecord)
      await kv.set(material.id, updatedMaterial)
      
      console.log('✅ Dental usage saved and stock updated successfully')
      
      return c.json({
        success: true,
        message: 'Penggunaan bahan dental berhasil dicatat',
        usage: usageRecord,
        updatedStock: newStock
      })
      
    } catch (error) {
      console.log('💥 Error creating dental usage:', error)
      return c.json({
        success: false,
        error: `Gagal mencatat penggunaan bahan dental: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/dental-usages/:id', async (c: any) => {
    console.log('🦷 Delete dental usage called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const usageId = c.req.param('id')
      
      console.log('🗑️ Deleting dental usage ID:', usageId)
      
      // Check if usage exists
      const existingUsages = await kv.getByPrefix('dental_usage_')
      const existingUsage = existingUsages.find(u => u.id === usageId)
      
      if (!existingUsage) {
        return c.json({
          success: false,
          error: 'Data penggunaan bahan dental tidak ditemukan'
        }, 404)
      }
      
      // Restore stock to material
      const materials = await kv.getByPrefix('dental_material_')
      const material = materials.find(m => m.id === (existingUsage.materialId || existingUsage.material_id))
      
      if (material) {
        const currentStock = material.stock || material.stok || 0
        const usageQuantity = existingUsage.quantity || existingUsage.jumlah || 0
        const newStock = currentStock + usageQuantity
        
        const updatedMaterial = {
          ...material,
          stock: newStock,
          stok: newStock,
          updated_at: new Date().toISOString()
        }
        
        await kv.set(material.id, updatedMaterial)
        console.log(`✅ Stock restored for material ${material.name || material.nama}: ${newStock}`)
      }
      
      // Delete usage record
      await kv.del(usageId)
      console.log('✅ Dental usage deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data penggunaan bahan dental berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting dental usage:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data penggunaan bahan dental: ${error.message}`
      }, 500)
    }
  })
}

// =============== STOCK OPNAME ENDPOINTS ===============
export const addStockOpnameEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/stock-opname', async (c: any) => {
    console.log('📦 Stock Opname GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const stockOpname = await kv.getByPrefix('stock_opname_')
      
      console.log(`📊 Found ${stockOpname.length} stock opname records in database`)
      
      // Transform stock opname data
      const transformedStockOpname = stockOpname.map(record => ({
        id: record.id,
        productId: record.productId || record.product_id || '',
        productName: record.productName || record.product_name || 'Unknown Product',
        category: record.category || record.kategori || 'Umum',
        unit: record.unit || record.satuan || 'pcs',
        systemStock: record.systemStock || record.system_stock || record.stok_sistem || 0,
        physicalStock: record.physicalStock || record.physical_stock || record.stok_fisik || 0,
        difference: record.difference || record.selisih || 0,
        reason: record.reason || record.alasan || '',
        notes: record.notes || record.catatan || '',
        date: record.date || record.tanggal || new Date().toISOString().split('T')[0],
        time: record.time || record.waktu || '00:00',
        checkedBy: record.checkedBy || record.checked_by || record.diperiksa_oleh || '',
        status: record.status || 'pending',
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || record.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedStockOpname.length} stock opname records`)
      
      return c.json({
        success: true,
        stockOpname: transformedStockOpname
      })
      
    } catch (error) {
      console.log('💥 Error fetching stock opname:', error)
      return c.json({
        success: false,
        error: error.message,
        stockOpname: []
      }, 500)
    }
  })

  app.post('/make-server-73417b67/stock-opname', async (c: any) => {
    console.log('📦 Create stock opname called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Stock opname data received:', body)
      
      const { 
        productId, 
        productName, 
        category, 
        unit, 
        systemStock, 
        physicalStock, 
        reason, 
        notes, 
        date, 
        time, 
        checkedBy 
      } = body
      
      // Validate required fields
      if (!productId || systemStock === undefined || physicalStock === undefined) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Produk, stok sistem, dan stok fisik wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for stock opname')
      
      // Calculate difference
      const difference = physicalStock - systemStock
      
      // Create stock opname record
      const stockOpnameRecord = {
        id: `stock_opname_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        productId: productId,
        product_id: productId,
        productName: productName || 'Unknown Product',
        product_name: productName || 'Unknown Product',
        category: category || 'Umum',
        kategori: category || 'Umum',
        unit: unit || 'pcs',
        satuan: unit || 'pcs',
        systemStock: systemStock,
        system_stock: systemStock,
        stok_sistem: systemStock,
        physicalStock: physicalStock,
        physical_stock: physicalStock,
        stok_fisik: physicalStock,
        difference: difference,
        selisih: difference,
        reason: reason || '',
        alasan: reason || '',
        notes: notes || '',
        catatan: notes || '',
        date: date || new Date().toISOString().split('T')[0],
        tanggal: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        waktu: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        checkedBy: checkedBy || '',
        checked_by: checkedBy || '',
        diperiksa_oleh: checkedBy || '',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to save stock opname to database...')
      await kv.set(stockOpnameRecord.id, stockOpnameRecord)
      console.log('✅ Stock opname saved successfully with ID:', stockOpnameRecord.id)
      
      return c.json({
        success: true,
        message: 'Stock opname berhasil dicatat',
        stockOpname: stockOpnameRecord
      })
      
    } catch (error) {
      console.log('💥 Error creating stock opname:', error)
      return c.json({
        success: false,
        error: `Gagal mencatat stock opname: ${error.message}`
      }, 500)
    }
  })
}

// =============== EXPENSES ENDPOINTS ===============
export const addExpensesEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/expenses', async (c: any) => {
    console.log('💸 Expenses GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const expenses = await kv.getByPrefix('expense_')
      
      console.log(`📊 Found ${expenses.length} expenses in database`)
      
      // Transform expenses data
      const transformedExpenses = expenses.map(expense => ({
        id: expense.id,
        category: expense.category || expense.kategori || 'Umum',
        description: expense.description || expense.deskripsi || '',
        amount: expense.amount || expense.jumlah || 0,
        date: expense.date || expense.tanggal || new Date().toISOString().split('T')[0],
        time: expense.time || expense.waktu || '00:00',
        paymentMethod: expense.paymentMethod || expense.payment_method || expense.metode_pembayaran || 'cash',
        receipt: expense.receipt || expense.nota || '',
        vendor: expense.vendor || expense.pemasok || '',
        notes: expense.notes || expense.catatan || '',
        approvedBy: expense.approvedBy || expense.approved_by || expense.disetujui_oleh || '',
        status: expense.status || 'pending',
        created_at: expense.created_at || new Date().toISOString(),
        updated_at: expense.updated_at || expense.created_at || new Date().toISOString()
      }))
      
      console.log(`✅ Returning ${transformedExpenses.length} expenses`)
      
      return c.json({
        success: true,
        expenses: transformedExpenses
      })
      
    } catch (error) {
      console.log('💥 Error fetching expenses:', error)
      return c.json({
        success: false,
        error: error.message,
        expenses: []
      }, 500)
    }
  })

  app.post('/make-server-73417b67/expenses', async (c: any) => {
    console.log('💸 Create expense called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const body = await c.req.json()
      
      console.log('📋 Expense data received:', body)
      
      const { 
        category, 
        description, 
        amount, 
        date, 
        time, 
        paymentMethod, 
        receipt, 
        vendor, 
        notes, 
        approvedBy 
      } = body
      
      // Validate required fields
      if (!category || !description || !amount) {
        console.log('❌ Validation failed: Missing required fields')
        return c.json({
          success: false,
          error: 'Kategori, deskripsi, dan jumlah wajib diisi'
        }, 400)
      }
      
      console.log('✅ Validation passed for expense')
      
      // Create expense record
      const expenseRecord = {
        id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        category: category,
        kategori: category,
        description: description,
        deskripsi: description,
        amount: amount,
        jumlah: amount,
        date: date || new Date().toISOString().split('T')[0],
        tanggal: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        waktu: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentMethod: paymentMethod || 'cash',
        payment_method: paymentMethod || 'cash',
        metode_pembayaran: paymentMethod || 'cash',
        receipt: receipt || '',
        nota: receipt || '',
        vendor: vendor || '',
        pemasok: vendor || '',
        notes: notes || '',
        catatan: notes || '',
        approvedBy: approvedBy || '',
        approved_by: approvedBy || '',
        disetujui_oleh: approvedBy || '',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to save expense to database...')
      await kv.set(expenseRecord.id, expenseRecord)
      console.log('✅ Expense saved successfully with ID:', expenseRecord.id)
      
      return c.json({
        success: true,
        message: 'Pengeluaran berhasil dicatat',
        expense: expenseRecord
      })
      
    } catch (error) {
      console.log('💥 Error creating expense:', error)
      return c.json({
        success: false,
        error: `Gagal mencatat pengeluaran: ${error.message}`
      }, 500)
    }
  })

  app.put('/make-server-73417b67/expenses/:id', async (c: any) => {
    console.log('💸 Update expense called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const expenseId = c.req.param('id')
      const body = await c.req.json()
      
      console.log('📋 Updating expense ID:', expenseId)
      
      // Get existing expense
      const existingExpenses = await kv.getByPrefix('expense_')
      const existingExpense = existingExpenses.find(e => e.id === expenseId)
      
      if (!existingExpense) {
        return c.json({
          success: false,
          error: 'Data pengeluaran tidak ditemukan'
        }, 404)
      }
      
      const { category, description, amount, date, time, paymentMethod, receipt, vendor, notes, approvedBy } = body
      
      // Update expense with new data
      const updatedExpense = {
        ...existingExpense,
        category: category || existingExpense.category,
        kategori: category || existingExpense.kategori,
        description: description || existingExpense.description,
        deskripsi: description || existingExpense.deskripsi,
        amount: amount !== undefined ? amount : existingExpense.amount,
        jumlah: amount !== undefined ? amount : existingExpense.jumlah,
        date: date || existingExpense.date,
        tanggal: date || existingExpense.tanggal,
        time: time || existingExpense.time,
        waktu: time || existingExpense.waktu,
        paymentMethod: paymentMethod || existingExpense.paymentMethod,
        payment_method: paymentMethod || existingExpense.payment_method,
        metode_pembayaran: paymentMethod || existingExpense.metode_pembayaran,
        receipt: receipt !== undefined ? receipt : existingExpense.receipt,
        nota: receipt !== undefined ? receipt : existingExpense.nota,
        vendor: vendor !== undefined ? vendor : existingExpense.vendor,
        pemasok: vendor !== undefined ? vendor : existingExpense.pemasok,
        notes: notes !== undefined ? notes : existingExpense.notes,
        catatan: notes !== undefined ? notes : existingExpense.catatan,
        approvedBy: approvedBy !== undefined ? approvedBy : existingExpense.approvedBy,
        approved_by: approvedBy !== undefined ? approvedBy : existingExpense.approved_by,
        disetujui_oleh: approvedBy !== undefined ? approvedBy : existingExpense.disetujui_oleh,
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      console.log('💾 Attempting to update expense...')
      await kv.set(expenseId, updatedExpense)
      console.log('✅ Expense updated successfully')
      
      return c.json({
        success: true,
        message: 'Data pengeluaran berhasil diperbarui',
        expense: updatedExpense
      })
      
    } catch (error) {
      console.log('💥 Error updating expense:', error)
      return c.json({
        success: false,
        error: `Gagal memperbarui data pengeluaran: ${error.message}`
      }, 500)
    }
  })

  app.delete('/make-server-73417b67/expenses/:id', async (c: any) => {
    console.log('💸 Delete expense called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
      const expenseId = c.req.param('id')
      
      console.log('🗑️ Deleting expense ID:', expenseId)
      
      // Check if expense exists
      const existingExpenses = await kv.getByPrefix('expense_')
      const existingExpense = existingExpenses.find(e => e.id === expenseId)
      
      if (!existingExpense) {
        return c.json({
          success: false,
          error: 'Data pengeluaran tidak ditemukan'
        }, 404)
      }
      
      // Delete from database
      await kv.del(expenseId)
      console.log('✅ Expense deleted successfully')
      
      return c.json({
        success: true,
        message: 'Data pengeluaran berhasil dihapus'
      })
      
    } catch (error) {
      console.log('💥 Error deleting expense:', error)
      return c.json({
        success: false,
        error: `Gagal menghapus data pengeluaran: ${error.message}`
      }, 500)
    }
  })
}

// =============== EMPLOYEES ENDPOINTS ===============
export const addEmployeesEndpoints = (app: any) => {
  
  app.get('/make-server-73417b67/employees', async (c: any) => {
    console.log('👥 Employees GET endpoint called')
    
    try {
      const kv = await import('./kv_store.tsx')
      const employees = await kv.getByPrefix('karyawan_')
      
      console.log(`📊 Found ${employees.length} employees in database`)
      
      // Transform employees data
      const transformedEmployees = employees.map(employee => ({
        id: employee.id,
        name: employee.nama || employee.name || 'Unknown Employee',
        email: employee.email || '',
        phone: employee.telepon || employee.phone || '',
        address: employee.alamat || employee.address || '',
        position: employee.posisi || employee.position || 'Staff',
        role: 'karyawan',
        salary: employee.gaji_pokok || employee.salary || 0,
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
}