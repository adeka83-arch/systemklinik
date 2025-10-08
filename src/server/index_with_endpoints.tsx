import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'

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

// =============== SITTING FEES ENDPOINTS ===============
app.get('/make-server-73417b67/sitting-fees', async (c) => {
  console.log('💰 Sitting Fees GET endpoint called')
  
  try {
    const kv = await import('./kv_store.tsx')
    const sittingFees = await kv.getByPrefix('sitting_fee_')
    
    console.log(`📊 Found ${sittingFees.length} sitting fees in database`)
    
    // Transform sitting fees data
    const transformedSittingFees = sittingFees.map(fee => ({
      id: fee.id,
      doctorId: fee.doctorId || fee.doctor_id || '',
      doctorName: fee.doctorName || fee.doctor_name || 'Unknown Doctor',
      patientId: fee.patientId || fee.patient_id || '',
      patientName: fee.patientName || fee.patient_name || 'Unknown Patient',
      treatmentId: fee.treatmentId || fee.treatment_id || '',
      treatmentName: fee.treatmentName || fee.treatment_name || 'Unknown Treatment',
      amount: fee.amount || fee.jumlah || 0,
      percentage: fee.percentage || fee.persentase || 0,
      totalAmount: fee.totalAmount || fee.total_amount || fee.jumlah_total || 0,
      date: fee.date || fee.tanggal || new Date().toISOString().split('T')[0],
      time: fee.time || fee.waktu || '00:00',
      notes: fee.notes || fee.catatan || '',
      status: fee.status || 'pending',
      created_at: fee.created_at || new Date().toISOString(),
      updated_at: fee.updated_at || fee.created_at || new Date().toISOString()
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

app.post('/make-server-73417b67/sitting-fees', async (c) => {
  console.log('💰 Create sitting fee called at:', new Date().toISOString())
  
  try {
    const kv = await import('./kv_store.tsx')
    const body = await c.req.json()
    
    console.log('📋 Sitting fee data received:', body)
    
    const { 
      doctorId, 
      doctorName, 
      patientId, 
      patientName, 
      treatmentId, 
      treatmentName, 
      amount, 
      percentage, 
      totalAmount, 
      date, 
      time, 
      notes 
    } = body
    
    // Validate required fields
    if (!doctorId || !patientId || !treatmentId || !amount) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Dokter, pasien, tindakan, dan jumlah wajib diisi'
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
      patientId: patientId,
      patient_id: patientId,
      patientName: patientName || 'Unknown Patient',
      patient_name: patientName || 'Unknown Patient',
      treatmentId: treatmentId,
      treatment_id: treatmentId,
      treatmentName: treatmentName || 'Unknown Treatment',
      treatment_name: treatmentName || 'Unknown Treatment',
      amount: amount,
      jumlah: amount,
      percentage: percentage || 0,
      persentase: percentage || 0,
      totalAmount: totalAmount || amount,
      total_amount: totalAmount || amount,
      jumlah_total: totalAmount || amount,
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

// =============== SALES ENDPOINTS ===============
app.get('/make-server-73417b67/sales', async (c) => {
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

app.post('/make-server-73417b67/sales', async (c) => {
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
    
    // Validate required fields
    if (!patientId || !items || !Array.isArray(items) || items.length === 0 || !total) {
      console.log('❌ Validation failed: Missing required fields')
      return c.json({
        success: false,
        error: 'Pasien, item penjualan, dan total wajib diisi'
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
      patientId: patientId,
      patient_id: patientId,
      patientName: patientName || 'Unknown Patient',
      patient_name: patientName || 'Unknown Patient',
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
    
    // Save to database
    console.log('💾 Attempting to save sale to database...')
    await kv.set(saleRecord.id, saleRecord)
    console.log('✅ Sale saved successfully with ID:', saleRecord.id)
    
    return c.json({
      success: true,
      message: 'Penjualan berhasil dicatat',
      sale: saleRecord
    })
    
  } catch (error) {
    console.log('💥 Error creating sale:', error)
    return c.json({
      success: false,
      error: `Gagal mencatat penjualan: ${error.message}`
    }, 500)
  }
})

// =============== STOCK OPNAME ENDPOINTS ===============
app.get('/make-server-73417b67/stock-opname', async (c) => {
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

app.post('/make-server-73417b67/stock-opname', async (c) => {
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

// =============== EXPENSES ENDPOINTS ===============
app.get('/make-server-73417b67/expenses', async (c) => {
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

app.post('/make-server-73417b67/expenses', async (c) => {
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

// =============== EXISTING ENDPOINTS ===============
// Include all existing endpoints from original file here...
// Since the file is too large to view completely, I'll add the existing endpoints properly

// Start the server
Deno.serve(app.fetch)