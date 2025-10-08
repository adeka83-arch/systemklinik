// Test script untuk menambahkan data absensi dokter
const serverUrl = 'https://adeka83-arch.supabase.co/functions/v1/make-server-73417b67'
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM1MjcwMjE4LCJpYXQiOjE3MzUyNjY2MTgsImlzcyI6Imh0dHBzOi8vYWRla2E4My1hcmNoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjNWRiYzQ0Ny1hNGZiLTRhMzktOTcwNy1iZTFkMDBlODNjYzAiLCJlbWFpbCI6ImFkbWluQGNsaW5pYy5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTczNTI2NjYxOH1dLCJzZXNzaW9uX2lkIjoiYzNhNTI3OGYtOGE4NC00ZmRjLWJkOGYtYWY3ODM3ZWRlMDNmIn0.VQAmZ3Bz5xFsK_-gWV2PoFSWdZCaKWGNMIzZh85gDvQ'

console.log('🧪 Testing Doctor Attendance System...')

// Test data dokter dummy
const testDoctors = [
  {
    name: 'Dr. Andi Setiawan, Sp.Ortho',
    specialization: 'Ortodonti',
    email: 'dr.andi@clinic.com',
    phone: '081234567890'
  },
  {
    name: 'Dr. Sarah Permata, Sp.KG',
    specialization: 'Konservasi Gigi',
    email: 'dr.sarah@clinic.com',
    phone: '081234567891'
  },
  {
    name: 'Dr. Budi Hartono, Sp.Bedah',
    specialization: 'Bedah Mulut',
    email: 'dr.budi@clinic.com',
    phone: '081234567892'
  }
]

// Test data absensi dokter dummy untuk sistem existing
const testDoctorAttendanceData = [
  // Dr. Andi - Shift Pagi Hari Ini
  {
    doctorId: 'dokter_1',
    shift: '09:00-15:00',
    type: 'check-in',
    date: '2024-12-27',
    time: '09:00'
  },
  {
    doctorId: 'dokter_1',
    shift: '09:00-15:00',
    type: 'check-out',
    date: '2024-12-27',
    time: '15:00'
  },
  // Dr. Andi - Shift Sore Hari Ini
  {
    doctorId: 'dokter_1',
    shift: '18:00-20:00',
    type: 'check-in',
    date: '2024-12-27',
    time: '18:00'
  },
  {
    doctorId: 'dokter_1',
    shift: '18:00-20:00',
    type: 'check-out',
    date: '2024-12-27',
    time: '20:00'
  },
  // Dr. Sarah - Shift Pagi Hari Ini (Terlambat)
  {
    doctorId: 'dokter_2',
    shift: '09:00-15:00',
    type: 'check-in',
    date: '2024-12-27',
    time: '09:15'
  },
  {
    doctorId: 'dokter_2',
    shift: '09:00-15:00',
    type: 'check-out',
    date: '2024-12-27',
    time: '15:00'
  },
  // Dr. Budi - Shift Sore Hari Ini
  {
    doctorId: 'dokter_3',
    shift: '18:00-20:00',
    type: 'check-in',
    date: '2024-12-27',
    time: '18:00'
  },
  {
    doctorId: 'dokter_3',
    shift: '18:00-20:00',
    type: 'check-out',
    date: '2024-12-27',
    time: '20:30'
  },
  // Data untuk hari kemarin
  {
    doctorId: 'dokter_1',
    shift: '09:00-15:00',
    type: 'check-in',
    date: '2024-12-26',
    time: '09:00'
  },
  {
    doctorId: 'dokter_1',
    shift: '09:00-15:00',
    type: 'check-out',
    date: '2024-12-26',
    time: '15:00'
  },
  {
    doctorId: 'dokter_2',
    shift: '09:00-15:00',
    type: 'check-in',
    date: '2024-12-26',
    time: '09:00'
  },
  {
    doctorId: 'dokter_2',
    shift: '09:00-15:00',
    type: 'check-out',
    date: '2024-12-26',
    time: '15:00'
  },
  {
    doctorId: 'dokter_3',
    shift: '18:00-20:00',
    type: 'check-in',
    date: '2024-12-26',
    time: '18:00'
  },
  {
    doctorId: 'dokter_3',
    shift: '18:00-20:00',
    type: 'check-out',
    date: '2024-12-26',
    time: '20:00'
  }
]

// Function to create doctors first
async function createTestDoctors() {
  console.log('👨‍⚕️ Creating test doctors...')
  
  for (let i = 0; i < testDoctors.length; i++) {
    const doctor = testDoctors[i]
    const doctorData = {
      ...doctor,
      id: `dokter_${i + 1}`,
      status: 'aktif',
      isActive: true,
      feePercentage: 30
    }
    
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(doctorData)
      })
      
      if (response.ok) {
        console.log(`✅ Doctor created: ${doctor.name}`)
      } else {
        const error = await response.json()
        console.error(`❌ Failed to create doctor ${doctor.name}:`, error)
      }
    } catch (error) {
      console.error(`💥 Error creating doctor ${doctor.name}:`, error)
    }
  }
}

// Function to create doctor attendance records using existing system
async function createTestDoctorAttendance() {
  console.log('⏰ Creating test doctor attendance records...')
  
  for (const attendance of testDoctorAttendanceData) {
    try {
      const response = await fetch(`${serverUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(attendance)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Doctor attendance created: ${attendance.doctorId} - ${attendance.shift} - ${attendance.type} (${attendance.time})`)
      } else {
        const error = await response.json()
        console.error(`❌ Failed to create doctor attendance:`, error)
      }
    } catch (error) {
      console.error(`💥 Error creating doctor attendance:`, error)
    }
  }
}

// Function to test fetch doctor attendance from existing system
async function testFetchDoctorAttendance() {
  console.log('📊 Testing fetch doctor attendance from existing system...')
  
  try {
    const response = await fetch(`${serverUrl}/attendance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Fetched ${result.attendance?.length || 0} attendance records from existing system`)
      console.log('Sample data:', result.attendance?.slice(0, 3))
      
      // Group data to show how reports will process it
      const grouped = {}
      result.attendance?.forEach(record => {
        const key = `${record.doctorId}_${record.date}_${record.shift}`
        if (!grouped[key]) {
          grouped[key] = { checkIn: null, checkOut: null, doctorName: record.doctorName, date: record.date, shift: record.shift }
        }
        if (record.type === 'check-in') {
          grouped[key].checkIn = record.time
        } else if (record.type === 'check-out') {
          grouped[key].checkOut = record.time
        }
      })
      
      console.log('📊 Grouped attendance summary:', Object.values(grouped).slice(0, 3))
    } else {
      const error = await response.json()
      console.error('❌ Failed to fetch attendance:', error)
    }
  } catch (error) {
    console.error('💥 Error fetching attendance:', error)
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Doctor Attendance Tests...')
  
  // Wait between operations
  await createTestDoctors()
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await createTestDoctorAttendance()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testFetchDoctorAttendance()
  
  console.log('✅ All doctor attendance tests completed!')
}

// Execute if this script is run directly
if (typeof window !== 'undefined') {
  // Browser environment
  runTests()
} else {
  // Node.js environment
  console.log('Use this script in browser console or include in HTML file')
}