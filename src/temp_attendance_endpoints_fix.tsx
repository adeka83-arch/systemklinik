// ATTENDANCE ENDPOINTS DUPLICATE PREVENTION - COMPLETED ✅
// 
// Sistem pencegahan duplikasi absensi telah berhasil diimplementasikan dengan fitur:
//
// 🔒 BACKEND PROTECTION:
// - Validasi ganda pada level database (prefix: attendance_)
// - Pengecekan kombinasi doctorId + date + shift + type
// - Response error 409 (Conflict) dengan detail informasi
// - Validasi pre-requisite (check-in harus ada sebelum check-out)
// 
// 🎯 FRONTEND ENHANCEMENT:  
// - Real-time status checking saat dokter & shift dipilih
// - Auto-suggestion mode absensi berdasarkan status
// - Visual feedback dengan warna berbeda (hijau/merah)
// - Indikator status absensi real-time
// - Tombol disabled untuk mencegah aksi yang tidak valid
// - Reset button untuk ganti dokter/shift
//
// 📋 USER EXPERIENCE:
// - Pesan error yang informatif dengan detail waktu
// - Loading state dengan spinner
// - Status display real-time
// - Visual indicators untuk mode yang dipilih
// - Security notice untuk user awareness
//
// ✅ IMPLEMENTATION STATUS: COMPLETED
// - File ini sudah tidak diperlukan karena semua sudah diintegrasikan ke:
//   * /supabase/functions/server/index.tsx (backend endpoints)
//   * /components/Dashboard.tsx (frontend integration)
//
// 🚀 READY FOR PRODUCTION
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
  app.post('/make-server-73417b67/attendance', async (c: any) => {
    console.log('📝 Create attendance called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
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
      
      // Get all existing attendance records
      const existingAttendance = await kv.getByPrefix('attendance_')
      
      // Check for existing attendance for the same doctor, date, shift, and type
      const duplicateCheck = existingAttendance.filter(record => {
        const recordDoctorId = record.doctorId || record.doctor_id
        const recordDate = record.date || record.tanggal
        const recordShift = record.shift
        const recordType = record.type || record.jenis
        
        return recordDoctorId === doctorId && 
               recordDate === attendanceDate && 
               recordShift === shift && 
               recordType === type
      })
      
      if (duplicateCheck.length > 0) {
        console.log('❌ Duplicate attendance found:', duplicateCheck[0])
        const duplicateRecord = duplicateCheck[0]
        const existingTime = duplicateRecord.time || duplicateRecord.waktu || '00:00'
        
        return c.json({
          success: false,
          error: `❌ Absensi ${type === 'check-in' ? 'masuk' : 'pulang'} sudah tercatat untuk dokter ini pada tanggal ${attendanceDate}, shift ${shift} jam ${existingTime}. Tidak dapat melakukan absensi ganda!`,
          duplicate: true,
          existingRecord: {
            date: duplicateRecord.date || duplicateRecord.tanggal,
            time: existingTime,
            type: duplicateRecord.type || duplicateRecord.jenis,
            shift: duplicateRecord.shift
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
  app.put('/make-server-73417b67/attendance/:id', async (c: any) => {
    console.log('📝 Update attendance called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
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
  app.delete('/make-server-73417b67/attendance/:id', async (c: any) => {
    console.log('📝 Delete attendance called at:', new Date().toISOString())
    
    try {
      const kv = await import('./kv_store.tsx')
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
}