// FILE SUDAH DIPINDAHKAN KE promo_endpoints.tsx - FILE INI TIDAK DIGUNAKAN LAGI
  
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

  // Get all vouchers with their status - FIXED VERSION
  app.get('/make-server-73417b67/vouchers/status', async (c: any) => {
    try {
      console.log('📋 Voucher status endpoint called')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user?.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get all vouchers
      const vouchers = await kv.getByPrefix('voucher_')
      
      // Get all voucher usages to check which vouchers have been used
      const usages = await kv.getByPrefix('voucher_usage_')
      
      // Get all voucher assignments 
      const assignments = await kv.getByPrefix('voucher_assignment_')
      
      // Get patients for name lookup
      const patients = await kv.getByPrefix('patient_')

      const now = new Date()
      const vouchersWithStatus = vouchers.map(voucher => {
        let status = 'active'
        let statusColor = 'green'
        let statusText = 'Aktif'
        
        // Get usage count for this voucher
        const voucherUsageCount = usages.filter(usage => usage.voucherId === voucher.id).length
        
        // Priority 1: Check if inactive (manual disable)
        if (!voucher.isActive) {
          status = 'inactive'
          statusColor = 'gray'
          statusText = 'Tidak Aktif'
        }
        // Priority 2: Check if voucher has been used (terpakai) - HIGHEST PRIORITY after inactive
        else if (voucherUsageCount > 0) {
          status = 'used'
          statusColor = 'blue'
          statusText = 'Terpakai'
        }
        // Priority 3: Check if expired (kadaluwarsa)
        else if (voucher.expiryDate) {
          const expiryDate = new Date(voucher.expiryDate)
          if (now > expiryDate) {
            status = 'expired'
            statusColor = 'red'
            statusText = 'Kadaluwarsa'
          }
        }
        // Priority 4: Check if usage limit reached (should be rare since Priority 2 covers this)
        else if (voucher.usageLimit && voucherUsageCount >= voucher.usageLimit) {
          status = 'used_up'
          statusColor = 'orange'
          statusText = 'Habis Terpakai'
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

        return {
          ...voucher,
          status,
          statusColor,
          statusText,
          currentUsage: voucherUsageCount,
          recipients,
          usages: usages.filter(usage => usage.voucherId === voucher.id)
        }
      })

      // Sort by creation date descending
      vouchersWithStatus.sort((a, b) => 
        new Date(b.created_at || b.createdDate).getTime() - new Date(a.created_at || a.createdDate).getTime()
      )

      console.log(`📋 Found ${vouchersWithStatus.length} vouchers with status`)

      return c.json({
        success: true,
        vouchers: vouchersWithStatus,
        count: vouchersWithStatus.length,
        summary: {
          total: vouchersWithStatus.length,
          active: vouchersWithStatus.filter(v => v.status === 'active').length,
          used: vouchersWithStatus.filter(v => v.status === 'used').length,
          expired: vouchersWithStatus.filter(v => v.status === 'expired').length,
          usedUp: vouchersWithStatus.filter(v => v.status === 'used_up').length,
          inactive: vouchersWithStatus.filter(v => v.status === 'inactive').length
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

  // Existing initialization code continues...
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

  // Existing anti-corruption system and other code...
  console.log('✅ Promo routes with FIXED voucher status logic created successfully')
}