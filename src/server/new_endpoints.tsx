// Field Trip Employee Bonus Accumulation Route
app.post('/make-server-73417b67/employee-bonus/accumulate', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const { fieldTripSaleId, month, year } = body
    
    console.log('Accumulating field trip bonuses:', { fieldTripSaleId, month, year })
    
    // Get the field trip sale data
    const fieldTripSale = await kv.get(`field_trip_sale_${fieldTripSaleId}`)
    if (!fieldTripSale) {
      return c.json({ error: 'Field trip sale not found' }, 404)
    }
    
    // Get all employees who have bonuses in this field trip
    const employeeBonuses = fieldTripSale.selectedEmployees || []
    
    if (employeeBonuses.length === 0) {
      return c.json({ success: true, message: 'No employee bonuses to accumulate' })
    }
    
    // Get all existing salaries for the specified month/year
    const allSalaries = await kv.getByPrefix('salary_')
    
    const updatedSalaries = []
    
    for (const empBonus of employeeBonuses) {
      // Find existing salary record for this employee and period
      const existingSalary = allSalaries.find(s => 
        s.employeeId === empBonus.employeeId && 
        s.month === month && 
        s.year === year
      )
      
      if (existingSalary) {
        // Add field trip bonus to existing salary
        const updatedSalary = {
          ...existingSalary,
          bonus: (existingSalary.bonus || 0) + empBonus.bonus,
          totalSalary: existingSalary.baseSalary + ((existingSalary.bonus || 0) + empBonus.bonus) + (existingSalary.holidayAllowance || 0),
          fieldTripBonusLog: [
            ...(existingSalary.fieldTripBonusLog || []),
            {
              fieldTripSaleId,
              eventDate: fieldTripSale.eventDate || fieldTripSale.saleDate,
              organization: fieldTripSale.organization || fieldTripSale.customerName,
              bonusAmount: empBonus.bonus,
              addedAt: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        }
        
        await kv.set(existingSalary.id, updatedSalary)
        updatedSalaries.push(updatedSalary)
        console.log(`Updated salary for employee ${empBonus.employeeName}: +${empBonus.bonus}`)
      } else {
        console.log(`No salary record found for employee ${empBonus.employeeName} in ${month}/${year}`)
      }
    }
    
    return c.json({ 
      success: true, 
      message: `Accumulated bonuses for ${updatedSalaries.length} employees`,
      updatedSalaries: updatedSalaries.length
    })
  } catch (error) {
    console.log('Error accumulating employee bonuses:', error)
    return c.json({ error: 'Failed to accumulate bonuses' }, 500)
  }
})

// Field Trip Sales Routes
app.get('/make-server-73417b67/field-trip-sales', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const fieldTripSales = await kv.getByPrefix('field_trip_sale_')
    
    // Transform data to match FieldTripSaleReport format
    const transformedSales = fieldTripSales.map(sale => ({
      id: sale.id,
      productName: sale.productName || 'Field Trip Product',
      productCategory: sale.productCategory || 'Field Trip',
      quantity: sale.participants || sale.quantity || 1,
      price: sale.pricePerParticipant || sale.pricePerUnit || 0,
      subtotal: sale.subtotal || (sale.participants * sale.pricePerParticipant) || 0,
      discountAmount: sale.discountAmount || 0,
      totalAmount: sale.totalAmount || sale.subtotal || 0,
      date: sale.eventDate || sale.saleDate || sale.created_at,
      location: sale.location || 'Field Trip Location',
      organization: sale.organization || sale.customerName || 'Organization',
      notes: sale.notes || '',
      
      // Additional fields for financial calculation
      doctorName: sale.selectedDoctors?.[0]?.doctorName || '',
      employeeName: sale.selectedEmployees?.[0]?.employeeName || '',
      participants: sale.participants || 1,
      pricePerParticipant: sale.pricePerParticipant || 0,
      created_at: sale.created_at,
      
      // Payment status fields for outstanding calculation
      paymentStatus: sale.paymentStatus || 'lunas',
      paymentMethod: sale.paymentMethod || '',
      dpAmount: sale.dpAmount || 0,
      outstandingAmount: sale.outstandingAmount || 0,
      finalAmount: sale.finalAmount || sale.totalAmount || sale.subtotal || 0,
      customerName: sale.customerName || 'Field Trip Customer',
      customerPhone: sale.customerPhone || '',
      saleDate: sale.saleDate || sale.created_at,
      eventDate: sale.eventDate
    }))
    
    // Sort by date descending
    transformedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    console.log('Field trip sales for financial reports:', transformedSales.length, transformedSales.slice(0, 2))
    
    return c.json({ 
      success: true,
      fieldTripSales: transformedSales,
      total: transformedSales.length
    })
  } catch (error) {
    console.log('Error getting field trip sales:', error)
    return c.json({ error: 'Failed to get field trip sales' }, 500)
  }
})

app.post('/make-server-73417b67/field-trip-sales', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const fieldTripSaleId = `field_trip_sale_${Date.now()}`
    const fieldTripSale = { 
      ...body, 
      id: fieldTripSaleId, 
      created_at: new Date().toISOString() 
    }
    
    await kv.set(fieldTripSaleId, fieldTripSale)
    return c.json({ fieldTripSale })
  } catch (error) {
    console.log('Error creating field trip sale:', error)
    return c.json({ error: 'Failed to create field trip sale' }, 500)
  }
})

app.put('/make-server-73417b67/field-trip-sales/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const body = await c.req.json()
    
    const existingFieldTripSale = await kv.get(id)
    if (!existingFieldTripSale) {
      return c.json({ error: 'Field trip sale not found' }, 404)
    }
    
    const updatedFieldTripSale = { 
      ...body, 
      id, 
      created_at: existingFieldTripSale.created_at,
      updated_at: new Date().toISOString()
    }
    
    await kv.set(id, updatedFieldTripSale)
    return c.json({ fieldTripSale: updatedFieldTripSale })
  } catch (error) {
    console.log('Error updating field trip sale:', error)
    return c.json({ error: 'Failed to update field trip sale' }, 500)
  }
})

app.delete('/make-server-73417b67/field-trip-sales/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting field trip sale:', error)
    return c.json({ error: 'Failed to delete field trip sale' }, 500)
  }
})

// Create sample field trip outstanding data for testing
app.post('/make-server-73417b67/field-trip-sales/create-sample-outstanding', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    console.log('Creating sample outstanding field trip data...')

    const currentTime = Date.now()
    
    // Sample DP outstanding
    const dpSampleId = `field_trip_sale_${currentTime}_dp`
    const dpSample = {
      id: dpSampleId,
      customerName: 'John Doe',
      customerPhone: '081234567890',
      organization: 'SD Merdeka',
      productName: 'Edukasi Kesehatan Gigi',
      participants: 25,
      pricePerParticipant: 50000,
      subtotal: 1250000,
      discountAmount: 0,
      totalAmount: 1250000,
      finalAmount: 1250000,
      paymentStatus: 'dp',
      paymentMethod: 'cash',
      dpAmount: 500000,
      outstandingAmount: 750000,
      saleDate: new Date().toISOString(),
      eventDate: new Date(currentTime + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'SD Merdeka Jakarta',
      notes: 'Sample DP outstanding',
      created_at: new Date().toISOString()
    }

    // Sample TEMPO outstanding  
    const tempoSampleId = `field_trip_sale_${currentTime + 1}_tempo`
    const tempoSample = {
      id: tempoSampleId,
      customerName: 'Jane Smith',
      customerPhone: '082345678901',
      organization: 'SMP Harapan',
      productName: 'Workshop Dental Care',
      participants: 30,
      pricePerParticipant: 75000,
      subtotal: 2250000,
      discountAmount: 0,
      totalAmount: 2250000,
      finalAmount: 2250000,
      paymentStatus: 'tempo',
      paymentMethod: '',
      dpAmount: 0,
      outstandingAmount: 0,
      saleDate: new Date().toISOString(),
      eventDate: new Date(currentTime + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'SMP Harapan Bandung',
      notes: 'Sample TEMPO outstanding',
      created_at: new Date().toISOString()
    }

    console.log('Saving DP sample:', dpSampleId)
    await kv.set(dpSampleId, dpSample)
    console.log('DP sample saved successfully')
    
    console.log('Saving TEMPO sample:', tempoSampleId)
    await kv.set(tempoSampleId, tempoSample)
    console.log('TEMPO sample saved successfully')

    const response = { 
      success: true, 
      message: 'Sample outstanding field trip data created successfully',
      data: {
        dpSample: dpSampleId,
        tempoSample: tempoSampleId
      }
    }
    
    console.log('Returning response:', response)
    return c.json(response)
    
  } catch (error) {
    console.log('Error creating sample data:', error)
    console.log('Error stack:', error.stack)
    return c.json({ 
      success: false,
      error: 'Failed to create sample data',
      details: error.message 
    }, 500)
  }
})

// Debug endpoint to check all field trip sales data
app.get('/make-server-73417b67/debug/field-trip-sales', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const allFieldTripSales = await kv.getByPrefix('field_trip_sale_')
    console.log('Debug: All field trip sales from KV store:', allFieldTripSales.length)
    
    allFieldTripSales.forEach((sale, index) => {
      console.log(`Debug Sale ${index + 1}:`, {
        id: sale.id,
        customerName: sale.customerName,
        paymentStatus: sale.paymentStatus,
        outstandingAmount: sale.outstandingAmount,
        finalAmount: sale.finalAmount,
        dpAmount: sale.dpAmount
      })
    })

    return c.json({ 
      success: true,
      total: allFieldTripSales.length,
      fieldTripSales: allFieldTripSales
    })
  } catch (error) {
    console.log('Error in debug endpoint:', error)
    return c.json({ error: 'Failed to debug field trip sales' }, 500)
  }
})

// Field Trip Doctor Fee Report Route
app.get('/make-server-73417b67/field-trip-doctor-fees', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get all field trip sales that have doctor fees
    const fieldTripSales = await kv.getByPrefix('field_trip_sale_')
    
    const doctorFeeReports = []
    
    fieldTripSales.forEach(sale => {
      if (sale.selectedDoctors && sale.selectedDoctors.length > 0) {
        sale.selectedDoctors.forEach(doctor => {
          doctorFeeReports.push({
            id: `${sale.id}_${doctor.doctorId}`,
            saleId: sale.id,
            doctorId: doctor.doctorId,
            doctorName: doctor.doctorName,
            specialization: doctor.specialization,
            fee: doctor.fee,
            eventDate: sale.eventDate || sale.saleDate,
            saleDate: sale.saleDate,
            customerName: sale.customerName,
            organization: sale.organization,
            productName: sale.productName,
            participants: sale.participants,
            status: sale.status,
            created_at: sale.created_at
          })
        })
      }
    })
    
    // Sort by event date descending
    doctorFeeReports.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    
    return c.json({ success: true, doctorFees: doctorFeeReports })
  } catch (error) {
    console.log('Error getting field trip doctor fees:', error)
    return c.json({ error: 'Failed to get field trip doctor fees' }, 500)
  }
})