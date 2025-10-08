import React, { Suspense, lazy } from 'react'
import { TimeoutManager, SimpleLoader, ErrorFallback } from './TimeoutManager'
import { ErrorBoundary } from './ErrorBoundary'

interface LazyComponentLoaderProps {
  componentName: string
  importFunction: () => Promise<any>
  accessToken: string
  timeout?: number
  fallbackComponent?: React.ComponentType
  props?: Record<string, any>
}

// Cache untuk menyimpan lazy components
const componentCache = new Map<string, React.LazyExoticComponent<any>>()

// Membuat lazy component dengan error handling
const createLazyComponent = (
  componentName: string, 
  importFunction: () => Promise<any>,
  timeout = 5000
) => {
  // Check cache first
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!
  }

  const LazyComponent = lazy(() => 
    Promise.race([
      importFunction().catch(error => {
        console.error(`Failed to load ${componentName}:`, error)
        throw error
      }),
      new Promise((_, reject) => 
        setTimeout(
          () => reject(new Error(`${componentName} import timeout after ${timeout}ms`)), 
          timeout
        )
      )
    ]).catch(error => {
      console.error(`${componentName} loading failed:`, error)
      // Return minimal fallback component
      return {
        default: () => (
          <ErrorFallback 
            componentName={componentName}
            onRetry={() => {
              // Clear cache and retry
              componentCache.delete(componentName)
              window.location.reload()
            }}
          />
        )
      }
    })
  )

  // Cache the component
  componentCache.set(componentName, LazyComponent)
  return LazyComponent
}

export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({
  componentName,
  importFunction,
  accessToken,
  timeout = 5000,
  fallbackComponent,
  props = {}
}) => {
  const LazyComponent = createLazyComponent(componentName, importFunction, timeout)

  return (
    <ErrorBoundary>
      <TimeoutManager
        componentName={componentName}
        timeout={timeout}
        fallbackComponent={fallbackComponent}
        onTimeout={() => {
          console.warn(`${componentName} component timed out`)
        }}
      >
        <Suspense 
          fallback={<SimpleLoader message={`Memuat ${componentName}...`} />}
        >
          <LazyComponent accessToken={accessToken} {...props} />
        </Suspense>
      </TimeoutManager>
    </ErrorBoundary>
  )
}

// Predefined lazy loaders untuk komponen utama
export const createLazyLoader = (componentName: string, importFunction: () => Promise<any>) => {
  return ({ accessToken, ...props }: { accessToken: string; [key: string]: any }) => (
    <LazyComponentLoader
      componentName={componentName}
      importFunction={importFunction}
      accessToken={accessToken}
      timeout={componentName === 'Doctors' ? 6000 : 5000} // Reduced timeouts
      props={props}
    />
  )
}

// Pre-configured lazy components

export const LazyAttendance = createLazyLoader(
  'Attendance',
  () => import('./Attendance').then(m => ({ default: m.Attendance }))
)

export const LazyEmployeeAttendance = createLazyLoader(
  'EmployeeAttendance',
  () => import('./EmployeeAttendance').then(m => ({ default: m.EmployeeAttendance }))
)

export const LazySalaries = createLazyLoader(
  'Salaries',
  () => import('./Salaries').then(m => ({ default: m.Salaries }))
)

export const LazySittingFees = createLazyLoader(
  'SittingFees',
  () => import('./SittingFeesWithEditDelete').then(m => ({ default: m.SittingFees }))
)

export const LazyTreatmentSystem = createLazyLoader(
  'TreatmentSystem',
  () => import('./TreatmentSystemComplete').then(m => ({ default: m.TreatmentSystemComplete }))
)

export const LazySales = createLazyLoader(
  'Sales',
  () => import('./SalesWithSearchFilter').then(m => ({ default: m.SalesWithSearchFilter }))
)

export const LazyExpenses = createLazyLoader(
  'Expenses',
  () => import('./Expenses').then(m => ({ default: m.Expenses }))
)

export const LazyReports = createLazyLoader(
  'Reports',
  () => import('./ReportsSimplifiedNoAttendance').then(m => ({ default: m.Reports }))
)

export const LazyPatients = createLazyLoader(
  'Patients',
  () => import('./PatientsWithSchedule').then(m => ({ default: m.default }))
)

export const LazyForms = createLazyLoader(
  'Forms',
  () => import('./Forms').then(m => ({ default: m.Forms }))
)

export const LazyProductList = createLazyLoader(
  'ProductList',
  () => import('./ProductList').then(m => ({ default: m.ProductList }))
)

export const LazyProductFieldTrip = createLazyLoader(
  'ProductFieldTrip',
  () => import('./ProductFieldTrip').then(m => ({ default: m.ProductFieldTrip }))
)

export const LazyFieldTripSales = createLazyLoader(
  'FieldTripSales',
  () => import('./FieldTripSalesWithActions').then(m => ({ default: m.FieldTripSalesWithActions }))
)

export const LazyStockOpname = createLazyLoader(
  'StockOpname',
  () => import('./StockOpname').then(m => ({ default: m.StockOpname }))
)

export const LazyPromoManager = createLazyLoader(
  'PromoManager',
  () => import('./PromoManager').then(m => ({ default: m.PromoManager }))
)

export const LazyMedicalRecordSummary = createLazyLoader(
  'MedicalRecordSummary',
  () => import('./MedicalRecordFormComplete').then(m => ({ default: m.MedicalRecordFormComplete }))
)

export const LazyDoctorStatusManager = createLazyLoader(
  'DoctorStatusManager',
  () => import('./DoctorStatusManagerFixed').then(m => ({ default: m.DoctorStatusManager }))
)

export const LazyPasswordGuardSettings = createLazyLoader(
  'PasswordGuardSettings',
  () => import('./PasswordGuardSettings').then(m => ({ default: m.PasswordGuardSettings }))
)

export const LazyBackupManager = createLazyLoader(
  'BackupManager',
  () => import('./BackupManager').then(m => ({ default: m.default }))
)

// Clear component cache function
export const clearComponentCache = () => {
  componentCache.clear()
  console.log('Component cache cleared')
}

// Preload specific components with timeout protection
export const preloadComponents = async (componentNames: string[]) => {
  const PRELOAD_TIMEOUT = 5000 // 5 seconds max per component
  
  const loaders = {
    'DoctorStatusManager': () => import('./DoctorStatusManager'),
    'Dashboard': () => import('./Dashboard'),
    'Attendance': () => import('./Attendance'),
    'Salaries': () => import('./Salaries'),
    'Reports': () => import('./ReportsSimplifiedNoAttendance'),
  }

  const results = await Promise.allSettled(
    componentNames.map(async (name) => {
      if (!loaders[name as keyof typeof loaders]) {
        throw new Error(`Unknown component: ${name}`)
      }

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Preload timeout for ${name}`)), PRELOAD_TIMEOUT)
      )

      try {
        await Promise.race([
          loaders[name as keyof typeof loaders](),
          timeoutPromise
        ])
        console.log(`✅ Preloaded ${name} component`)
        return name
      } catch (error) {
        console.log(`❌ Failed to preload ${name}:`, error.message)
        throw error
      }
    })
  )

  const successful = results.filter(result => result.status === 'fulfilled').length
  const failed = results.filter(result => result.status === 'rejected').length
  
  console.log(`Preload completed: ${successful} successful, ${failed} failed`)
  
  // Return which components failed for potential retry
  return {
    successful,
    failed,
    failedComponents: results
      .map((result, index) => result.status === 'rejected' ? componentNames[index] : null)
      .filter(Boolean)
  }
}