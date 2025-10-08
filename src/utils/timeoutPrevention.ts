// Timeout Prevention Utility
// Helps prevent getPage timeout errors and other hanging operations

export interface TimeoutConfig {
  timeout: number
  operation: string
  fallback?: () => void
  onTimeout?: (operation: string) => void
}

export class TimeoutManager {
  private static timeouts: Map<string, NodeJS.Timeout> = new Map()
  
  /**
   * Create a protected operation with timeout
   */
  static createProtectedOperation<T>(
    operation: () => Promise<T>,
    config: TimeoutConfig
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const { timeout, operation: operationName, fallback, onTimeout } = config
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ Operation "${operationName}" timed out after ${timeout}ms`)
        
        if (onTimeout) {
          onTimeout(operationName)
        }
        
        if (fallback) {
          try {
            fallback()
            resolve(undefined as T)
          } catch (error: any) {
            reject(new Error(`Operation "${operationName}" timed out and fallback failed: ${error.message}`))
          }
        } else {
          reject(new Error(`Operation "${operationName}" timed out after ${timeout}ms`))
        }
      }, timeout)
      
      // Store timeout reference
      this.timeouts.set(operationName, timeoutId)
      
      // Execute operation
      operation()
        .then((result) => {
          clearTimeout(timeoutId)
          this.timeouts.delete(operationName)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timeoutId)
          this.timeouts.delete(operationName)
          reject(error)
        })
    })
  }
  
  /**
   * Clear all active timeouts
   */
  static clearAllTimeouts(): void {
    this.timeouts.forEach((timeout, operation) => {
      console.log(`Clearing timeout for operation: ${operation}`)
      clearTimeout(timeout)
    })
    this.timeouts.clear()
  }
  
  /**
   * Clear specific timeout
   */
  static clearTimeout(operationName: string): boolean {
    const timeout = this.timeouts.get(operationName)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(operationName)
      return true
    }
    return false
  }
  
  /**
   * Get active timeout count
   */
  static getActiveTimeoutCount(): number {
    return this.timeouts.size
  }
  
  /**
   * List active operations
   */
  static getActiveOperations(): string[] {
    return Array.from(this.timeouts.keys())
  }
}

/**
 * Protected window.open with timeout
 */
export const protectedWindowOpen = (
  url: string = '',
  target: string = '_blank',
  features: string = '',
  timeout: number = 10000
): Promise<Window | null> => {
  return TimeoutManager.createProtectedOperation(
    async () => {
      const newWindow = window.open(url, target, features)
      
      if (!newWindow || newWindow.closed) {
        throw new Error('Failed to open window')
      }
      
      return newWindow
    },
    {
      timeout,
      operation: 'window.open',
      fallback: () => {
        console.warn('Window.open timed out, popup may be blocked')
      },
      onTimeout: () => {
        console.warn('Window.open operation timed out')
      }
    }
  )
}

/**
 * Protected fetch with timeout
 */
export const protectedFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout: number = 10000
): Promise<Response> => {
  return TimeoutManager.createProtectedOperation(
    async () => {
      const controller = new AbortController()
      const fetchInit = {
        ...init,
        signal: controller.signal
      }
      
      return fetch(input, fetchInit)
    },
    {
      timeout,
      operation: `fetch-${input.toString()}`,
      onTimeout: () => {
        console.warn(`Fetch operation timed out: ${input}`)
      }
    }
  )
}

/**
 * Protected component loading - Fixed version to avoid JSX conflict
 */
export function protectedComponentLoad<T>(
  loader: () => Promise<T>,
  componentName: string,
  timeout: number = 15000
): Promise<T> {
  return TimeoutManager.createProtectedOperation(
    loader,
    {
      timeout,
      operation: `component-load-${componentName}`,
      fallback: () => {
        console.warn(`Component ${componentName} load timed out, using fallback`)
      },
      onTimeout: (operation) => {
        console.warn(`Component loading timed out: ${operation}`)
      }
    }
  )
}

/**
 * Safe DOM operation with timeout - Fixed version to avoid JSX conflict
 */
export function safeDOMOperation<T>(
  operation: () => T,
  operationName: string,
  timeout: number = 5000
): Promise<T> {
  return TimeoutManager.createProtectedOperation(
    async () => operation(),
    {
      timeout,
      operation: `dom-${operationName}`,
      onTimeout: () => {
        console.warn(`DOM operation timed out: ${operationName}`)
      }
    }
  )
}

/**
 * Emergency cleanup function
 */
export const emergencyCleanup = (): void => {
  console.log('🚨 Performing emergency cleanup...')
  
  // Clear all managed timeouts
  TimeoutManager.clearAllTimeouts()
  
  // Stop any ongoing fetch operations
  if (typeof window !== 'undefined') {
    try {
      if (window.stop) {
        window.stop()
      }
    } catch (error) {
      console.log('Could not stop window operations:', error)
    }
  }
  
  // Clear any hanging intervals
  const highestIntervalId = setInterval(() => {}, 0)
  for (let i = 0; i < highestIntervalId; i++) {
    clearInterval(i)
  }
  clearInterval(highestIntervalId)
  
  console.log('✅ Emergency cleanup completed')
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    TimeoutManager.clearAllTimeouts()
  })
  
  // Handle visibility change to prevent background hanging
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page hidden, clearing timeouts to prevent hanging')
      TimeoutManager.clearAllTimeouts()
    }
  })
}