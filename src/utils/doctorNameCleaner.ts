/**
 * Utility function to clean doctor names from duplicate "drg." prefixes
 * This ensures consistency across the application
 */

export const cleanDoctorName = (name: string): string => {
  if (!name) return name
  
  let cleaned = name.trim()
  
  // First, normalize all variations of drg (drg, drg., Drg, Drg., DRG, DRG.) to "drg."
  // Handle cases like "drg. drg. Name", "Drg drg Name", "DRG. drg. Name" etc.
  
  // Remove multiple consecutive drg prefixes (case insensitive)
  // This handles: "drg. drg.", "Drg drg", "DRG. drg.", etc.
  cleaned = cleaned.replace(/^(\s*drg\.?\s*)+/gi, 'drg. ')
  
  // Clean up any extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

/**
 * Clean doctor names in an array of doctor objects
 */
export const cleanDoctorNames = <T extends { name: string }>(doctors: T[]): T[] => {
  return doctors.map(doctor => ({
    ...doctor,
    name: cleanDoctorName(doctor.name)
  }))
}

/**
 * Filter out invalid doctor entries (empty names, specializations, etc.)
 */
export const filterValidDoctors = <T extends { id: string; name: string; specialization: string }>(doctors: T[]): T[] => {
  return doctors.filter(doctor => 
    doctor && 
    doctor.id && 
    doctor.name && 
    doctor.name.trim() !== '' && 
    doctor.name !== '-' &&
    doctor.specialization &&
    doctor.specialization.trim() !== '' &&
    doctor.specialization !== '-'
  )
}

/**
 * Combined function to clean and filter doctors
 */
export const processValidDoctors = <T extends { id: string; name: string; specialization: string }>(doctors: T[]): T[] => {
  const cleaned = cleanDoctorNames(doctors)
  return filterValidDoctors(cleaned)
}

/**
 * Add "drg." prefix to a name if it doesn't already have it
 */
export const ensureDoctorPrefix = (name: string): string => {
  if (!name) return name
  
  // Check if name already starts with drg. (case insensitive)
  if (/^drg\.\s*/i.test(name)) {
    return cleanDoctorName(name) // Clean any duplicates
  }
  
  // Add drg. prefix if not present
  return `drg. ${name.trim()}`
}