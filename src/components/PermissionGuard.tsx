interface PermissionGuardProps {
  userRole?: string
  userType?: string
  allowedRoles?: string[]
  allowedUserTypes?: string[]
  children: React.ReactNode
}

export function PermissionGuard({ 
  userRole, 
  userType,
  allowedRoles = [], 
  allowedUserTypes = [],
  children 
}: PermissionGuardProps) {
  // Check if user has permission based on role or user type
  const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole || '')
  const hasUserTypeAccess = allowedUserTypes.length === 0 || allowedUserTypes.includes(userType || '')
  
  // User needs either role access OR user type access (not both)
  const hasAccess = hasRoleAccess || hasUserTypeAccess
  
  if (!hasAccess) {
    return null // Don't render children if no access
  }
  
  return <>{children}</>
}

// Helper function to check menu permissions
export function getFilteredMenuItems(menuItems: any[], userRole?: string, userType?: string) {
  console.log('🔍 Filtering menu items...')
  console.log('User role:', userRole)
  console.log('User type:', userType)
  console.log('Total menu items:', menuItems.length)
  
  // If no user role or type, show all items for backward compatibility
  if (!userRole && !userType) {
    console.log('⚠️ No user role/type provided, showing all menu items')
    return menuItems
  }
  
  const filteredItems = menuItems.filter(item => {
    // Define access rules for each menu item
    const menuPermissions: Record<string, { roles?: string[], userTypes?: string[] }> = {
      'dashboard': { userTypes: ['employee', 'doctor'] }, // Both can access
      'patients': { userTypes: ['employee'] }, // Only employees
      'forms': { userTypes: ['employee'] }, // Only employees
      'medical-record-summary': { userTypes: ['employee', 'doctor'] }, // Both can access
      'employees': { userTypes: ['employee'] }, // Only employees
      'doctors': { userTypes: ['employee'] }, // Only employees
      'doctor-status': { userTypes: ['employee'] }, // Only employees
      'products': { userTypes: ['employee'] }, // Only employees
      'product-field-trip': { userTypes: ['employee'] }, // Only employees
      'field-trip-sales': { userTypes: ['employee'] }, // Only employees
      'stock-opname': { userTypes: ['employee'] }, // Only employees
      'promo': { userTypes: ['employee'] }, // Only employees
      'attendance': { userTypes: ['employee', 'doctor'] }, // Both can access
      'salaries': { userTypes: ['employee'] }, // Only employees
      'sitting-fees': { userTypes: ['employee', 'doctor'] }, // Both can access
      'treatments': { userTypes: ['employee', 'doctor'] }, // Both can access
      'sales': { userTypes: ['employee'] }, // Only employees
      'expenses': { userTypes: ['employee'] }, // Only employees
      'reports': { userTypes: ['employee'] }, // Only employees
    }
    
    const permission = menuPermissions[item.id]
    
    // If no specific permission defined, allow access for all employees by default
    if (!permission) {
      console.log(`✅ Menu item '${item.id}' has no specific permission, allowing access`)
      return userType === 'employee' || userRole === 'administrator'
    }
    
    // Check role-based access
    if (permission.roles && permission.roles.length > 0) {
      if (permission.roles.includes(userRole || '')) {
        console.log(`✅ Menu item '${item.id}' allowed by role: ${userRole}`)
        return true
      }
    }
    
    // Check user type-based access
    if (permission.userTypes && permission.userTypes.length > 0) {
      if (permission.userTypes.includes(userType || '')) {
        console.log(`✅ Menu item '${item.id}' allowed by userType: ${userType}`)
        return true
      }
    }
    
    console.log(`❌ Menu item '${item.id}' denied for role: ${userRole}, userType: ${userType}`)
    return false
  })
  
  console.log(`📋 Filtered to ${filteredItems.length} menu items:`, filteredItems.map(item => item.id))
  return filteredItems
}