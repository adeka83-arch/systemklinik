import { serverUrl } from '../supabase/client'
import type {
  AttendanceReport,
  SalaryReport,
  DoctorFeeReport,
  ExpenseReport,
  TreatmentReport,
  SalesReport,
  FinancialSummary,
  FieldTripSaleReport
} from './types'

export const fetchAttendanceReport = async (accessToken: string): Promise<AttendanceReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/attendance`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      console.log('Raw attendance data:', data.attendance?.slice(0, 2))
      
      // Group check-ins and check-outs by doctor and date only (1 record per doctor per date)
      const groupedRecords = new Map()
      
      ;(data.attendance || []).forEach((record: any) => {
        // Use only doctorId and date as key to ensure 1 record per doctor per date
        const key = `${record.doctorId}_${record.date}`
        
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, {
            ...record,
            doctorName: record.doctorName || 'Unknown Doctor',
            loginTime: null,
            logoutTime: null,
            allShifts: [record.shift] // Track all shifts for this doctor on this date
          })
        }
        
        const groupedRecord = groupedRecords.get(key)
        
        // Track all shifts for this doctor on this date
        if (!groupedRecord.allShifts.includes(record.shift)) {
          groupedRecord.allShifts.push(record.shift)
          // Update shift display to show primary shift or combined shifts
          if (groupedRecord.allShifts.length > 1) {
            groupedRecord.shift = groupedRecord.allShifts.join(' + ')
          }
        }
        
        // Set login and logout times based on type
        if (record.type === 'check-in') {
          // Keep earliest check-in time
          if (!groupedRecord.loginTime || record.time < groupedRecord.loginTime) {
            groupedRecord.loginTime = record.time
            groupedRecord.time = record.time // Use check-in time as primary time
          }
        } else if (record.type === 'check-out') {
          // Keep latest check-out time
          if (!groupedRecord.logoutTime || record.time > groupedRecord.logoutTime) {
            groupedRecord.logoutTime = record.time
          }
        }
      })
      
      // Convert to array and clean up allShifts property
      const attendanceRecords = Array.from(groupedRecords.values()).map(record => {
        const { allShifts, ...cleanRecord } = record
        return cleanRecord
      })
      
      console.log('Grouped attendance data (1 per doctor per date):', attendanceRecords.slice(0, 2))
      console.log('Total unique doctor-date records:', attendanceRecords.length)
      return attendanceRecords
    }
    return []
  } catch (error) {
    console.log('Error fetching attendance report:', error)
    return []
  }
}

export const fetchSalaryReport = async (accessToken: string): Promise<SalaryReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/salaries`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      // Transform data to ensure proper structure and add period field
      const transformedSalaries = (data.salaries || []).map((salary: any) => {
        // Create period display format
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ]
        const monthIndex = parseInt(salary.month) - 1
        const period = `${monthNames[monthIndex]} ${salary.year}`
        
        return {
          ...salary,
          period,
          // Ensure numeric fields are properly handled
          baseSalary: typeof salary.baseSalary === 'number' ? salary.baseSalary : parseFloat(salary.baseSalary) || 0,
          bonus: typeof salary.bonus === 'number' ? salary.bonus : parseFloat(salary.bonus) || 0,
          holidayAllowance: typeof salary.holidayAllowance === 'number' ? salary.holidayAllowance : parseFloat(salary.holidayAllowance) || 0,

          totalSalary: typeof salary.totalSalary === 'number' ? salary.totalSalary : parseFloat(salary.totalSalary) || 0
        }
      })
      
      console.log('Transformed salary data with period:', transformedSalaries.slice(0, 2))
      return transformedSalaries
    }
    return []
  } catch (error) {
    console.log('Error fetching salary report:', error)
    return []
  }
}

export const fetchDoctorFeeReport = async (accessToken: string): Promise<DoctorFeeReport[]> => {
  try {
    console.log('🏥 === FETCHING DOCTOR FEE REPORT DATA (SIMPLIFIED) ===')
    const [treatmentsRes, sittingFeesRes, sittingFeeSettingsRes] = await Promise.all([
      fetch(`${serverUrl}/treatments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`${serverUrl}/sitting-fees`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`${serverUrl}/doctor-sitting-fee-settings`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ])

    const treatmentsData = await treatmentsRes.json()
    const sittingFeesData = await sittingFeesRes.json()
    const sittingFeeSettingsData = await sittingFeeSettingsRes.json()
    
    console.log('📊 Raw treatments data:', treatmentsData.treatments?.slice(0, 2))
    console.log('💰 Raw sitting fees data:', sittingFeesData.sittingFees?.slice(0, 2))
    console.log('⚙️ Raw sitting fee settings:', sittingFeeSettingsData.settings?.slice(0, 2))
    console.log('📈 Total treatments:', treatmentsData.treatments?.length || 0)
    console.log('💵 Total sitting fees:', sittingFeesData.sittingFees?.length || 0)
    console.log('⚙️ Total sitting fee settings:', sittingFeeSettingsData.settings?.length || 0)

    if (treatmentsRes.ok && sittingFeesRes.ok) {
      const treatments = treatmentsData.treatments || []
      const sittingFees = sittingFeesData.sittingFees || []
      const sittingFeeSettings = sittingFeeSettingsData.settings || []
      
      // Helper functions for normalization
      const normalizeDoctor = (doctor: string) => {
        return doctor.trim().toLowerCase().replace(/\s+/g, ' ')
      }
      
      const displayName = (doctor: string) => {
        return doctor.trim().replace(/\s+/g, ' ')
      }

      // STEP 1: Group treatments by doctor + date (IGNORE SHIFT - 1 dokter per hari = 1 record)
      console.log('🏥 === STEP 1: GROUP TREATMENTS BY DOCTOR + DATE (NO SHIFT) ===')
      const doctorDateGroups: { [key: string]: any } = {}
      
      treatments.forEach((treatment: any, index) => {
        const doctorName = treatment.doctorName || treatment.doctor_name || treatment.doctor || 'Unknown'
        const date = treatment.date || treatment.tanggal || new Date().toISOString().split('T')[0]
        const treatmentFeeAmount = Number(treatment.calculatedFee || treatment.fee || 0)
        
        // KEY: hanya dokter + tanggal (NO SHIFT)
        const groupKey = `${normalizeDoctor(doctorName)}_${date}`
        
        if (!doctorDateGroups[groupKey]) {
          doctorDateGroups[groupKey] = {
            doctor: displayName(doctorName), 
            date: date,
            totalTreatmentFee: 0,
            treatmentCount: 0,
            shifts: new Set(), // Track shifts untuk info
            treatments: []
          }
        }
        
        // Akumulasi total fee tindakan untuk dokter ini di tanggal ini
        doctorDateGroups[groupKey].totalTreatmentFee += treatmentFeeAmount
        doctorDateGroups[groupKey].treatmentCount += 1
        doctorDateGroups[groupKey].shifts.add(treatment.shift || '09:00-15:00')
        doctorDateGroups[groupKey].treatments.push({
          id: treatment.id,
          fee: treatmentFeeAmount,
          patientName: treatment.patientName,
          shift: treatment.shift
        })
        
        console.log(`💊 Treatment ${index + 1}: ${doctorName} pada ${date} = +Rp ${treatmentFeeAmount}`)
        console.log(`   Akumulasi total: Rp ${doctorDateGroups[groupKey].totalTreatmentFee} (${doctorDateGroups[groupKey].treatmentCount} tindakan)`)
      })

      console.log(`📊 Created ${Object.keys(doctorDateGroups).length} doctor-date groups`)

      // STEP 2: Map sitting fees by doctor + date (IGNORE SHIFT)  
      console.log('💰 === STEP 2: MAP SITTING FEES BY DOCTOR + DATE (NO SHIFT) ===')
      const sittingFeeMap: { [key: string]: number } = {}
      
      sittingFees.forEach((fee: any, index) => {
        const doctorName = fee.doctorName || fee.doctor_name || fee.doctor || 'Unknown'
        const date = fee.date || fee.tanggal || new Date().toISOString().split('T')[0]
        const amount = Number(fee.amount || fee.uang_duduk || fee.sittingFee || 0)
        
        // KEY: hanya dokter + tanggal (NO SHIFT)
        const feeKey = `${normalizeDoctor(doctorName)}_${date}`
        
        // Ambil uang duduk tertinggi jika ada duplikasi di tanggal yang sama 
        if (!sittingFeeMap[feeKey] || sittingFeeMap[feeKey] < amount) {
          sittingFeeMap[feeKey] = amount
          console.log(`💰 Sitting Fee ${index + 1}: ${doctorName} pada ${date} = Rp ${amount}`)
        } else {
          console.log(`🔄 Sitting Fee ${index + 1}: ${doctorName} pada ${date} = SKIP (lower amount)`)
        }
      })

      // STEP 3: Map sitting fee settings by doctor (for default values)
      console.log('⚙️ === STEP 3: MAP SITTING FEE SETTINGS (DEFAULTS) ===')
      const sittingFeeSettingsMap: { [key: string]: number } = {}
      
      sittingFeeSettings.forEach((setting: any, index) => {
        const doctorName = setting.doctorName || setting.doctor_name || setting.doctor || 'Unknown'
        const amount = setting.amount || setting.jumlah || 100000 // Default 100k
        
        const settingKey = normalizeDoctor(doctorName)
        sittingFeeSettingsMap[settingKey] = Number(amount)
        
        console.log(`⚙️ Default Setting ${index + 1}: ${doctorName} = Rp ${amount}`)
      })

      // STEP 4: Process final fee calculation
      console.log('🧮 === STEP 4: FINAL FEE CALCULATION ===')
      const finalResult: any[] = []
      
      // Process doctor-date groups WITH treatments
      Object.entries(doctorDateGroups).forEach(([groupKey, group]: [string, any]) => {
        const doctorDateKey = groupKey // sama dengan groupKey
        
        // Cari uang duduk untuk dokter ini di tanggal ini
        let sittingFee = sittingFeeMap[doctorDateKey] || 0
        
        // Jika tidak ada uang duduk, gunakan default setting
        if (sittingFee === 0) {
          const doctorKey = normalizeDoctor(group.doctor)
          sittingFee = sittingFeeSettingsMap[doctorKey] || 100000 // Default 100k
          console.log(`🔧 Using default sitting fee for ${group.doctor}: Rp ${sittingFee}`)
        }
        
        // FORMULA: Total Fee = Math.max(total_treatment_fee, sitting_fee)
        const totalFee = Math.max(group.totalTreatmentFee, sittingFee)
        
        const shiftsArray = Array.from(group.shifts)
        const shiftDisplay = shiftsArray.length > 1 ? `${shiftsArray[0]} (+${shiftsArray.length-1} shift lain)` : shiftsArray[0] || '09:00-15:00'
        
        finalResult.push({
          doctorName: group.doctor,
          doctor: group.doctor,
          date: group.date,
          period: group.date,
          shift: shiftDisplay,
          treatmentFee: group.totalTreatmentFee,
          sittingFee: sittingFee,
          totalFee: totalFee,
          finalFee: totalFee,
          treatmentCount: group.treatmentCount,
          formula: `max(${group.totalTreatmentFee}, ${sittingFee}) = ${totalFee}`,
          hasTreatments: true,
          treatments: group.treatments
        })
        
        console.log(`🧮 ${group.doctor} - ${group.date}:`)
        console.log(`   Treatment Fee: Rp ${group.totalTreatmentFee} (${group.treatmentCount} tindakan)`)
        console.log(`   Sitting Fee: Rp ${sittingFee}`)
        console.log(`   TOTAL FEE: Rp ${totalFee} [Formula: max(${group.totalTreatmentFee}, ${sittingFee})]`)
        console.log(`   Shifts: ${shiftsArray.join(', ')}`)
      })

      // STEP 5: Add standalone sitting fees (dokter yang ada uang duduk tapi tidak ada treatment)
      console.log('➕ === STEP 5: ADD STANDALONE SITTING FEES ===')
      Object.entries(sittingFeeMap).forEach(([feeKey, amount]) => {
        // Check apakah sudah ada di finalResult
        const [doctorKey, date] = feeKey.split('_')
        const alreadyExists = finalResult.some(item => 
          normalizeDoctor(item.doctor) === doctorKey && item.date === date
        )
        
        if (!alreadyExists && amount > 0) {
          // Cari nama display dari settings atau data sitting fee
          let displayDoctorName = 'Unknown'
          const settingWithSameName = sittingFeeSettings.find((s: any) => 
            normalizeDoctor(s.doctorName || s.doctor_name || s.doctor || '') === doctorKey
          )
          if (settingWithSameName) {
            displayDoctorName = displayName(settingWithSameName.doctorName || settingWithSameName.doctor_name || settingWithSameName.doctor)
          } else {
            const sittingFeeWithSameName = sittingFees.find((s: any) => 
              normalizeDoctor(s.doctorName || s.doctor_name || s.doctor || '') === doctorKey
            )
            if (sittingFeeWithSameName) {
              displayDoctorName = displayName(sittingFeeWithSameName.doctorName || sittingFeeWithSameName.doctor_name || sittingFeeWithSameName.doctor)
            }
          }
          
          finalResult.push({
            doctorName: displayDoctorName,
            doctor: displayDoctorName,
            date: date,
            period: date,
            shift: 'Tidak ada tindakan',
            treatmentFee: 0,
            sittingFee: amount,
            totalFee: amount,
            finalFee: amount,
            treatmentCount: 0,
            formula: `sitting_fee_only = ${amount}`,
            hasTreatments: false,
            treatments: []
          })
          
          console.log(`➕ Standalone sitting fee: ${displayDoctorName} - ${date} = Rp ${amount}`)
        }
      })

      // Sort by date descending
      finalResult.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log('✅ === FINAL REPORT SUMMARY (SIMPLIFIED) ===')
      console.log('📊 Total unique records:', finalResult.length)
      console.log('🎯 Top 10 records:')
      finalResult.slice(0, 10).forEach((fee, index) => {
        console.log(`   ${index + 1}. ${fee.doctor} - ${fee.date}: ${fee.formula}`)
        console.log(`      Treatments: ${fee.treatmentCount}, Total: Rp ${fee.totalFee?.toLocaleString()}`)
      })
      
      // Final validation: ensure no duplicate doctor-date combinations
      const seenDoctorDates = new Set<string>()
      const validatedResult = finalResult.filter(fee => {
        const key = `${normalizeDoctor(fee.doctor)}_${fee.date}`
        if (seenDoctorDates.has(key)) {
          console.warn(`⚠️ DUPLICATE FOUND AND REMOVED: ${fee.doctor} - ${fee.date}`)
          return false
        }
        seenDoctorDates.add(key)
        return true
      })
      
      console.log(`✅ Final validation: ${finalResult.length} → ${validatedResult.length} (removed duplicates)`)
      return validatedResult
    }
    return []
  } catch (error) {
    console.log('💥 Error fetching doctor fee report:', error)
    return []
  }
}

export const fetchExpenseReport = async (accessToken: string): Promise<ExpenseReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/expenses`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      return data.expenses || []
    }
    return []
  } catch (error) {
    console.log('Error fetching expense report:', error)
    return []
  }
}

export const fetchTreatmentReport = async (accessToken: string): Promise<TreatmentReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/treatments`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      const treatments = (data.treatments || []).map((treatment: any) => {
        // Primary field mapping based on treatment structure
        let nominal = 0
        
        // Priority order for nominal detection - totalTindakan should be first priority
        // because it includes admin fee and medication costs
        if (treatment.totalTindakan !== undefined && treatment.totalTindakan !== null) {
          nominal = treatment.totalTindakan  
        } else if (treatment.totalNominal !== undefined && treatment.totalNominal !== null) {
          nominal = treatment.totalNominal
        } else if (treatment.subtotal !== undefined && treatment.subtotal !== null) {
          nominal = treatment.subtotal
        } else if (treatment.nominal !== undefined && treatment.nominal !== null) {
          nominal = treatment.nominal
        } else if (treatment.amount !== undefined && treatment.amount !== null) {
          nominal = treatment.amount
        } else if (treatment.totalAmount !== undefined && treatment.totalAmount !== null) {
          nominal = treatment.totalAmount
        } else if (treatment.price !== undefined && treatment.price !== null) {
          nominal = treatment.price
        } else if (treatment.total !== undefined && treatment.total !== null) {
          nominal = treatment.total
        }
        
        // Ensure nominal is a valid number
        nominal = typeof nominal === 'string' ? parseFloat(nominal) || 0 : (Number(nominal) || 0)
        
        // Enhanced treatment name detection
        let treatmentName = 'Tindakan'
        
        // Try different field approaches for treatment name
        if (treatment.treatmentTypes && Array.isArray(treatment.treatmentTypes) && treatment.treatmentTypes.length > 0) {
          // If treatmentTypes is an array, get names and join them
          const treatmentNames = treatment.treatmentTypes
            .map((t: any) => t.name || t.treatmentName || t.type)
            .filter(Boolean)
          if (treatmentNames.length > 0) {
            treatmentName = treatmentNames.join(', ')
          }
        } else if (treatment.treatmentType) {
          treatmentName = treatment.treatmentType
        } else if (treatment.treatmentName) {
          treatmentName = treatment.treatmentName
        } else if (treatment.description && treatment.description.trim() !== '') {
          treatmentName = treatment.description
        }
        
        console.log(`Treatment ${treatment.id} mapping:`, {
          originalTreatmentTypes: treatment.treatmentTypes,
          originalTreatmentType: treatment.treatmentType,
          originalTreatmentName: treatment.treatmentName,
          originalDescription: treatment.description,
          finalTreatmentName: treatmentName,
          totalTindakan: treatment.totalTindakan,
          totalNominal: treatment.totalNominal,
          subtotal: treatment.subtotal,
          finalNominal: nominal
        })
        
        return {
          ...treatment,
          amount: nominal,
          nominal: nominal,
          cost: nominal, // Add cost field for backward compatibility
          treatmentName: treatmentName,
          paymentStatus: treatment.paymentStatus || 'Belum Lunas' // Add payment status
        }
      })
      console.log('Treatment data mapping with admin fee complete. Sample data:', treatments.slice(0, 2))
      return treatments
    }
    return []
  } catch (error) {
    console.log('Error fetching treatment report:', error)
    return []
  }
}

export const fetchSalesReport = async (accessToken: string): Promise<SalesReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/sales`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    
    console.log('Raw sales data fetched:', data.sales?.length || 0, 'sales')
    if (data.sales && data.sales.length > 0) {
      console.log('Sample raw sale:', data.sales[0])
    }
    
    if (response.ok) {
      const rawSales = data.sales || []
      
      // Transform sales data to flatten items into individual sale records
      const transformedSales: SalesReport[] = []
      
      rawSales.forEach((sale: any) => {
        const items = sale.items || sale.produk || []
        
        if (items.length === 0) {
          // If no items, create a generic record
          const totalAmount = sale.total || sale.jumlah_total || 0
          const subtotal = sale.subtotal || totalAmount
          const discountAmount = sale.discount || 0
          const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
          
          transformedSales.push({
            id: sale.id,
            productName: 'Penjualan Umum',
            category: 'Umum',
            quantity: 1,
            pricePerUnit: totalAmount,
            subtotal: subtotal,
            discountAmount: discountAmount,
            discountPercentage: discountPercentage,
            totalAmount: totalAmount,
            date: sale.date || sale.tanggal || new Date().toISOString().split('T')[0],
            notes: sale.notes || sale.catatan || ''
          })
        } else {
          // Create a record for each item in the sale
          items.forEach((item: any, index: number) => {
            const quantity = item.quantity || item.jumlah || 1
            const pricePerUnit = item.pricePerUnit || item.harga || item.price || 0
            const itemSubtotal = quantity * pricePerUnit
            
            // Calculate item's share of discount (proportional to item value)
            const saleDiscount = sale.discount || 0
            const saleSubtotal = sale.subtotal || sale.total || 0
            const itemDiscountAmount = saleSubtotal > 0 ? (itemSubtotal / saleSubtotal) * saleDiscount : 0
            const itemDiscountPercentage = itemSubtotal > 0 ? (itemDiscountAmount / itemSubtotal) * 100 : 0
            const itemTotal = itemSubtotal - itemDiscountAmount
            
            transformedSales.push({
              id: `${sale.id}_item_${index}`,
              productName: item.productName || item.nama || item.name || 'Produk Tidak Diketahui',
              productCategory: item.category || item.kategori || 'Umum',
              category: item.category || item.kategori || 'Umum',
              quantity: quantity,
              price: pricePerUnit,
              pricePerUnit: pricePerUnit,
              subtotal: itemSubtotal,
              discountAmount: itemDiscountAmount,
              discountPercentage: itemDiscountPercentage,
              totalAmount: itemTotal > 0 ? itemTotal : itemSubtotal,
              date: sale.date || sale.tanggal || new Date().toISOString().split('T')[0],
              notes: sale.notes || sale.catatan || item.notes || ''
            })
          })
        }
      })
      
      console.log('Transformed sales data:', transformedSales.length, 'records')
      if (transformedSales.length > 0) {
        console.log('Sample transformed sale:', transformedSales[0])
      }
      
      return transformedSales
    }
    return []
  } catch (error) {
    console.log('Error fetching sales report:', error)
    return []
  }
}

export const fetchFieldTripSales = async (accessToken: string): Promise<FieldTripSaleReport[]> => {
  try {
    const response = await fetch(`${serverUrl}/field-trip-sales`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    
    if (response.ok) {
      // Use sales data for full field trip information with selectedDoctors and selectedEmployees
      const fieldTripSales = data.sales || data.fieldTripSales || []
      console.log('Field trip sales raw data fetched:', fieldTripSales.length, 'records')
      console.log('Sample field trip data structure:', fieldTripSales[0])
      if (fieldTripSales[0]) {
        console.log('Field trip price fields:', {
          pricePerParticipant: fieldTripSales[0].pricePerParticipant,
          pricePerUnit: fieldTripSales[0].pricePerUnit,
          price: fieldTripSales[0].price,
          totalAmount: fieldTripSales[0].totalAmount,
          participants: fieldTripSales[0].participants,
          quantity: fieldTripSales[0].quantity
        })
      }
      
      // Transform to ensure consistent format and calculate fees/bonuses
      const transformedSales = fieldTripSales.map((sale: any) => {
        // Calculate actual fees and bonuses from selectedDoctors and selectedEmployees
        let totalDoctorFees = 0
        let totalEmployeeBonuses = 0
        
        if (sale.selectedDoctors && Array.isArray(sale.selectedDoctors)) {
          sale.selectedDoctors.forEach((doctor: any) => {
            totalDoctorFees += doctor.fee || 0
          })
        }
        
        if (sale.selectedEmployees && Array.isArray(sale.selectedEmployees)) {
          sale.selectedEmployees.forEach((employee: any) => {
            totalEmployeeBonuses += employee.bonus || 0
          })
        }
        
        // Fallback to aggregated values if available
        if (sale.totalDoctorFees && typeof sale.totalDoctorFees === 'number') {
          totalDoctorFees = sale.totalDoctorFees
        }
        if (sale.totalEmployeeBonuses && typeof sale.totalEmployeeBonuses === 'number') {
          totalEmployeeBonuses = sale.totalEmployeeBonuses
        }
        
        return {
          id: sale.id,
          productName: sale.productName || 'Field Trip Product',
          productCategory: sale.productCategory || 'Field Trip',
          quantity: sale.participants || sale.quantity || 1,
          price: sale.pricePerParticipant || sale.pricePerUnit || sale.price || (sale.totalAmount && sale.participants ? Math.floor(sale.totalAmount / sale.participants) : 0),
          subtotal: sale.subtotal || (sale.participants * sale.pricePerParticipant) || 0,
          discountAmount: sale.discountAmount || sale.discount || 0,
          totalAmount: sale.totalAmount || sale.finalAmount || 0,
          date: sale.eventDate || sale.saleDate || sale.created_at,
          location: sale.location || 'Field Trip Location',
          organization: sale.organization || sale.customerName || 'Organization',
          notes: sale.notes || '',
          
          // Additional fields for financial calculation and display
          doctorName: sale.selectedDoctors?.[0]?.doctorName || '',
          employeeName: sale.selectedEmployees?.[0]?.employeeName || '',
          participants: sale.participants || 1,
          pricePerParticipant: sale.pricePerParticipant || sale.pricePerUnit || sale.price || (sale.totalAmount && sale.participants ? Math.floor(sale.totalAmount / sale.participants) : 0),
          created_at: sale.created_at,
          
          // Include the raw data for detailed calculations
          selectedDoctors: sale.selectedDoctors || [],
          selectedEmployees: sale.selectedEmployees || [],
          totalDoctorFees,
          totalEmployeeBonuses
        }
      })
      
      console.log('Transformed field trip sales with fees/bonuses:', transformedSales.length, 'records')
      if (transformedSales.length > 0) {
        console.log('Sample transformed data:', {
          id: transformedSales[0].id,
          totalDoctorFees: transformedSales[0].totalDoctorFees,
          totalEmployeeBonuses: transformedSales[0].totalEmployeeBonuses,
          selectedDoctors: transformedSales[0].selectedDoctors?.length || 0,
          selectedEmployees: transformedSales[0].selectedEmployees?.length || 0
        })
      }
      
      return transformedSales
    }
    return []
  } catch (error) {
    console.log('Error fetching field trip sales:', error)
    return []
  }
}

export const fetchDoctors = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await fetch(`${serverUrl}/doctors`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      return data.doctors || []
    }
    return []
  } catch (error) {
    console.log('Error fetching doctors:', error)
    return []
  }
}

export const fetchEmployees = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await fetch(`${serverUrl}/employees`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (response.ok) {
      return data.employees || []
    }
    return []
  } catch (error) {
    console.log('Error fetching employees:', error)
    return []
  }
}

export const calculateFinancialData = (
  treatmentData: TreatmentReport[],
  salesData: SalesReport[],
  fieldTripData: FieldTripSaleReport[],
  salaryData: SalaryReport[],
  doctorFeeData: DoctorFeeReport[],
  expenseData: ExpenseReport[]
): FinancialSummary[] => {
  console.log('=== CALCULATING FINANCIAL DATA ===')
  console.log('Treatment data:', treatmentData.length)
  console.log('Sales data:', salesData.length)
  console.log('Field trip data:', fieldTripData.length)
  console.log('Salary data:', salaryData.length)
  console.log('Doctor fee data:', doctorFeeData.length) 
  console.log('Expense data:', expenseData.length)
  
  if (treatmentData.length > 0) {
    console.log('Sample treatment:', treatmentData[0])
  }
  if (salesData.length > 0) {
    console.log('Sample sales:', salesData[0])
  }
  if (fieldTripData.length > 0) {
    console.log('Sample field trip:', fieldTripData[0])
  }
  
  const financialByMonth: { [key: string]: FinancialSummary } = {}
  
  // Helper function to initialize monthly data
  const initializeMonth = (key: string, month: string, year: string) => {
    if (!financialByMonth[key]) {
      financialByMonth[key] = {
        month,
        year,
        treatmentIncome: 0,
        salesIncome: 0,
        fieldTripIncome: 0,
        salaryExpense: 0,
        doctorFeeExpense: 0,
        fieldTripExpense: 0, // New field for field trip fees & bonuses
        expenses: 0,
        netProfit: 0,
        // Legacy fields for backward compatibility
        totalTreatments: 0,
        totalSales: 0,
        totalFieldTripRevenue: 0,
        totalSalaries: 0,
        totalDoctorFees: 0,
        totalExpenses: 0,
        netIncome: 0
      }
    }
  }
  
  // Process treatment data
  treatmentData.forEach(treatment => {
    const date = new Date(treatment.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const nominal = treatment.nominal || treatment.amount || 0
    const amount = typeof nominal === 'number' ? nominal : parseFloat(nominal) || 0
    financialByMonth[key].treatmentIncome! += amount
    financialByMonth[key].totalTreatments! += amount // Legacy
  })

  // Process sales data
  salesData.forEach(sale => {
    const date = new Date(sale.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const totalAmount = typeof sale.totalAmount === 'number' ? sale.totalAmount : parseFloat(sale.totalAmount) || 0
    financialByMonth[key].salesIncome! += totalAmount
    financialByMonth[key].totalSales! += totalAmount // Legacy
  })

  // Process field trip data - This is the key integration
  fieldTripData.forEach(fieldTrip => {
    const date = new Date(fieldTrip.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const totalAmount = typeof fieldTrip.totalAmount === 'number' ? fieldTrip.totalAmount : parseFloat(fieldTrip.totalAmount) || 0
    financialByMonth[key].fieldTripIncome! += totalAmount
    financialByMonth[key].totalFieldTripRevenue! += totalAmount // Legacy
    
    console.log(`Field trip income added: ${totalAmount} to ${key}`)
  })
  
  // Process salary data
  salaryData.forEach(salary => {
    const key = `${salary.month}-${salary.year}`
    initializeMonth(key, salary.month, salary.year)
    const totalSalary = typeof salary.totalSalary === 'number' ? salary.totalSalary : parseFloat(salary.totalSalary) || 0
    financialByMonth[key].salaryExpense! += totalSalary
    financialByMonth[key].totalSalaries! += totalSalary // Legacy
  })

  // Process doctor fee data (regular treatments only)
  doctorFeeData.forEach(fee => {
    const date = new Date(fee.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const finalFee = typeof fee.finalFee === 'number' ? fee.finalFee : parseFloat(fee.finalFee) || 0
    financialByMonth[key].doctorFeeExpense! += finalFee
    financialByMonth[key].totalDoctorFees! += finalFee // Legacy
  })

  // Process field trip fees & bonuses - Add this to separate fieldTripExpense category
  fieldTripData.forEach(fieldTrip => {
    const date = new Date(fieldTrip.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const doctorFees = fieldTrip.totalDoctorFees || 0
    const employeeBonuses = fieldTrip.totalEmployeeBonuses || 0
    const totalFieldTripExpense = doctorFees + employeeBonuses
    
    financialByMonth[key].fieldTripExpense! += totalFieldTripExpense
    
    console.log(`Field trip expenses added: ${totalFieldTripExpense} (doctor fees: ${doctorFees}, employee bonuses: ${employeeBonuses}) to ${key}`)
  })

  // Process expense data
  expenseData.forEach(expense => {
    const date = new Date(expense.date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    const key = `${month}-${year}`
    
    initializeMonth(key, month, year)
    const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount) || 0
    financialByMonth[key].expenses! += amount
    financialByMonth[key].totalExpenses! += amount // Legacy
  })

  // Calculate final profits using the updated formula
  // Formula: laba bersih = pendapatan field trip + pendapatan tindakan + pendapatan penjualan - gaji karyawan - fee dokter - field trip expenses - pengeluaran
  Object.values(financialByMonth).forEach(item => {
    const treatmentIncome = item.treatmentIncome || 0
    const salesIncome = item.salesIncome || 0
    const fieldTripIncome = item.fieldTripIncome || 0
    const salaryExpense = item.salaryExpense || 0
    const doctorFeeExpense = item.doctorFeeExpense || 0
    const fieldTripExpense = (item as any).fieldTripExpense || 0
    const expenses = item.expenses || 0
    
    // Calculate totals
    const totalIncome = fieldTripIncome + treatmentIncome + salesIncome
    const totalExpense = salaryExpense + doctorFeeExpense + fieldTripExpense + expenses
    const profit = totalIncome - totalExpense
    const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0
    
    // Apply the updated formula
    item.netProfit = profit
    
    // Legacy calculation for backward compatibility
    item.netIncome = item.netProfit
    
    // Add fields that match the display component
    ;(item as any).period = `${getMonthName(item.month)}/${item.year}`
    ;(item as any).totalIncome = totalIncome
    ;(item as any).totalExpense = totalExpense
    ;(item as any).profit = profit
    ;(item as any).margin = margin
    
    console.log(`Financial summary for ${item.month}/${item.year}:`, {
      fieldTripIncome,
      treatmentIncome,
      salesIncome,
      totalIncome,
      salaryExpense,
      doctorFeeExpense,
      fieldTripExpense,
      expenses,
      totalExpense,
      profit,
      margin: `${margin.toFixed(1)}%`
    })
  })

  // Helper function to get month name
  function getMonthName(month: string): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ]
    const monthIndex = parseInt(month) - 1
    return monthNames[monthIndex] || month
  }

  return Object.values(financialByMonth).sort((a, b) => 
    `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`)
  )
}