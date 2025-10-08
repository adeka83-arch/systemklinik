import { serverUrl } from './supabase/client'

export interface Doctor {
  id: string
  name: string
  specialization?: string
  email?: string
  phone?: string
  isActive?: boolean
}

export interface Employee {
  id: string
  name: string
  position?: string
  email?: string
  phone?: string
  isActive?: boolean
}

/**
 * Service untuk mengambil data dokter dan karyawan aktif saja
 * Ini akan menjadi utilitas terpusat yang dapat digunakan di semua komponen
 */

export class ActiveDataService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Mengambil daftar dokter aktif saja
   * @returns Promise<Doctor[]>
   */
  async getActiveDoctors(): Promise<Doctor[]> {
    try {
      console.log('🔍 Fetching active doctors only...')
      
      // Coba endpoint khusus untuk dokter aktif
      const response = await fetch(`${serverUrl}/doctors/active`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        const doctors = data.doctors || []
        console.log(`✅ Active doctors loaded: ${doctors.length} records`)
        return doctors
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️ Active doctors endpoint failed, trying fallback...', error)
      
      // Fallback ke endpoint biasa dengan parameter
      try {
        const fallbackResponse = await fetch(`${serverUrl}/doctors?active=true`, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const doctors = fallbackData.doctors || []
          console.log(`✅ Active doctors via fallback: ${doctors.length} records`)
          return doctors
        } else {
          throw new Error(`Fallback failed: HTTP ${fallbackResponse.status}`)
        }
      } catch (fallbackError) {
        console.error('❌ Both active doctors endpoints failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Mengambil daftar karyawan aktif saja
   * @returns Promise<Employee[]>
   */
  async getActiveEmployees(): Promise<Employee[]> {
    try {
      console.log('🔍 Fetching active employees only...')
      
      // Coba endpoint khusus untuk karyawan aktif
      const response = await fetch(`${serverUrl}/employees/active`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        const employees = data.employees || []
        console.log(`✅ Active employees loaded: ${employees.length} records`)
        return employees
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️ Active employees endpoint failed, trying fallback...', error)
      
      // Fallback ke endpoint biasa dengan parameter
      try {
        const fallbackResponse = await fetch(`${serverUrl}/employees?active=true`, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const employees = fallbackData.employees || []
          console.log(`✅ Active employees via fallback: ${employees.length} records`)
          return employees
        } else {
          throw new Error(`Fallback failed: HTTP ${fallbackResponse.status}`)
        }
      } catch (fallbackError) {
        console.error('❌ Both active employees endpoints failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Mengambil semua dokter (termasuk tidak aktif) - untuk keperluan manajemen
   * @returns Promise<Doctor[]>
   */
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        return data.doctors || []
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to fetch all doctors:', error)
      return []
    }
  }

  /**
   * Mengambil semua karyawan (termasuk tidak aktif) - untuk keperluan manajemen
   * @returns Promise<Employee[]>
   */
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        return data.employees || []
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to fetch all employees:', error)
      return []
    }
  }

  /**
   * Update status aktif/non-aktif dokter
   * @param doctorId string
   * @param isActive boolean
   * @returns Promise<boolean>
   */
  async updateDoctorStatus(doctorId: string, isActive: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Doctor status updated: ${data.message}`)
        return true
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to update doctor status:', error)
      return false
    }
  }

  /**
   * Update status aktif/non-aktif karyawan
   * @param employeeId string
   * @param isActive boolean  
   * @returns Promise<boolean>
   */
  async updateEmployeeStatus(employeeId: string, isActive: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Employee status updated: ${data.message}`)
        return true
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to update employee status:', error)
      return false
    }
  }
}

/**
 * Factory function untuk membuat instance ActiveDataService
 * @param accessToken string
 * @returns ActiveDataService
 */
export const createActiveDataService = (accessToken: string): ActiveDataService => {
  return new ActiveDataService(accessToken)
}

/**
 * Hook-style function untuk mengambil dokter aktif
 * @param accessToken string
 * @returns Promise<Doctor[]>
 */
export const fetchActiveDoctors = async (accessToken: string): Promise<Doctor[]> => {
  const service = createActiveDataService(accessToken)
  return service.getActiveDoctors()
}

/**
 * Hook-style function untuk mengambil karyawan aktif
 * @param accessToken string
 * @returns Promise<Employee[]>
 */
export const fetchActiveEmployees = async (accessToken: string): Promise<Employee[]> => {
  const service = createActiveDataService(accessToken)
  return service.getActiveEmployees()
}