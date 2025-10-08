// Test script untuk menambahkan data absensi karyawan
const serverUrl = 'https://adeka83-arch.supabase.co/functions/v1/make-server-73417b67'
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM1MjcwMjE4LCJpYXQiOjE3MzUyNjY2MTgsImlzcyI6Imh0dHBzOi8vYWRla2E4My1hcmNoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjNWRiYzQ0Ny1hNGZiLTRhMzktOTcwNy1iZTFkMDBlODNjYzAiLCJlbWFpbCI6ImFkbWluQGNsaW5pYy5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTczNTI2NjYxOH1dLCJzZXNzaW9uX2lkIjoiYzNhNTI3OGYtOGE4NC00ZmRjLWJkOGYtYWY3ODM3ZWRlMDNmIn0.VQAmZ3Bz5xFsK_-gWV2PoFSWdZCaKWGNMIzZh85gDvQ'

console.log('🧪 Testing Employee Attendance System...')

// Test data karyawan dummy
const testEmployees = [
  {
    name: 'Siti Nurhasanah',
    position: 'Resepsionis',
    email: 'siti@clinic.com',
    phone: '081234567890'
  },
  {
    name: 'Ahmad Fadli',
    position: 'Perawat',
    email: 'ahmad@clinic.com',
    phone: '081234567891'
  },
  {
    name: 'Rina Sari',
    position: 'Admin',
    email: 'rina@clinic.com',
    phone: '081234567892'
  }
]

// Test data absensi dummy
const testAttendanceData = [
  {
    employeeId: 'karyawan_1',
    type: 'check-in',
    date: '2024-12-27',
    time: '08:00'
  },
  {
    employeeId: 'karyawan_1',
    type: 'check-out',
    date: '2024-12-27',
    time: '17:00'
  },
  {
    employeeId: 'karyawan_2',
    type: 'check-in',
    date: '2024-12-27',
    time: '08:30'
  },
  {
    employeeId: 'karyawan_2',
    type: 'check-out',
    date: '2024-12-27',
    time: '17:15'
  },
  {
    employeeId: 'karyawan_3',
    type: 'check-in',
    date: '2024-12-27',
    time: '09:00'
  },
  {
    employeeId: 'karyawan_3',
    type: 'check-out',
    date: '2024-12-27',
    time: '16:45'
  }
]

// Function to create employees first
async function createTestEmployees() {
  console.log('📝 Creating test employees...')
  
  for (let i = 0; i < testEmployees.length; i++) {
    const employee = testEmployees[i]
    const employeeData = {
      ...employee,
      id: `karyawan_${i + 1}`,
      status: 'aktif',
      baseSalary: 3000000,
      joinDate: '2024-01-01'
    }
    
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(employeeData)
      })
      
      if (response.ok) {
        console.log(`✅ Employee created: ${employee.name}`)
      } else {
        const error = await response.json()
        console.error(`❌ Failed to create employee ${employee.name}:`, error)
      }
    } catch (error) {
      console.error(`💥 Error creating employee ${employee.name}:`, error)
    }
  }
}

// Function to create attendance records
async function createTestAttendance() {
  console.log('⏰ Creating test attendance records...')
  
  for (const attendance of testAttendanceData) {
    try {
      const response = await fetch(`${serverUrl}/employee-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(attendance)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Attendance created: ${attendance.employeeId} - ${attendance.type} at ${attendance.time}`)
      } else {
        const error = await response.json()
        console.error(`❌ Failed to create attendance:`, error)
      }
    } catch (error) {
      console.error(`💥 Error creating attendance:`, error)
    }
  }
}

// Function to test fetch attendance
async function testFetchAttendance() {
  console.log('📊 Testing fetch attendance...')
  
  try {
    const response = await fetch(`${serverUrl}/employee-attendance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Fetched ${result.attendance?.length || 0} attendance records`)
      console.log('Sample data:', result.attendance?.slice(0, 2))
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
  console.log('🚀 Starting Employee Attendance Tests...')
  
  // Wait between operations
  await createTestEmployees()
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await createTestAttendance()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testFetchAttendance()
  
  console.log('✅ All tests completed!')
}

// Execute if this script is run directly
if (typeof window !== 'undefined') {
  // Browser environment
  runTests()
} else {
  // Node.js environment
  console.log('Use this script in browser console or include in HTML file')
}