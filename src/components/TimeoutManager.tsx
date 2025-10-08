import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui/button'
import { performanceTracker } from './PerformanceMonitor'

interface TimeoutManagerProps {
  children: React.ReactNode
  componentName: string
  timeout?: number
  onTimeout?: () => void
  fallbackComponent?: React.ComponentType
}

interface TimeoutState {
  isLoading: boolean
  hasTimedOut: boolean
  loadingTime: number
  canRetry: boolean
}

export const TimeoutManager: React.FC<TimeoutManagerProps> = ({
  children,
  componentName,
  timeout = 5000, // Default 5 detik - more aggressive
  onTimeout,
  fallbackComponent: FallbackComponent
}) => {
  const [state, setState] = useState<TimeoutState>({
    isLoading: true,
    hasTimedOut: false,
    loadingTime: 0,
    canRetry: true
  })

  const resetState = useCallback(() => {
    setState({
      isLoading: true,
      hasTimedOut: false,
      loadingTime: 0,
      canRetry: true
    })
  }, [])

  const handleSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      hasTimedOut: false
    }))
    performanceTracker.track(componentName, 'success', Date.now())
  }, [componentName])

  const handleTimeout = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      hasTimedOut: true
    }))
    performanceTracker.track(componentName, 'timeout')
    onTimeout?.()
  }, [componentName, onTimeout])

  const handleRetry = useCallback(() => {
    resetState()
    // Force re-render component
    setTimeout(() => {
      handleSuccess()
    }, 100)
  }, [resetState, handleSuccess])

  const goToDashboard = useCallback(() => {
    window.location.hash = '#dashboard'
    window.location.reload()
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let intervalId: NodeJS.Timeout

    if (state.isLoading && !state.hasTimedOut) {
      // Track loading start
      performanceTracker.track(componentName, 'loading')
      
      // Set timeout
      timeoutId = setTimeout(handleTimeout, timeout)

      // Update loading time counter
      intervalId = setInterval(() => {
        setState(prev => ({
          ...prev,
          loadingTime: prev.loadingTime + 1
        }))
      }, 1000)

      // Auto-success after minimal time to prevent immediate timeout
      const successTimeout = setTimeout(handleSuccess, 300) // Faster success

      return () => {
        clearTimeout(timeoutId)
        clearTimeout(successTimeout)
        clearInterval(intervalId)
      }
    }

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [state.isLoading, state.hasTimedOut, timeout, handleTimeout, handleSuccess, componentName])

  // Loading state
  if (state.isLoading && !state.hasTimedOut) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
          <div>
            <p className="text-pink-600">Memuat {componentName}...</p>
            {state.loadingTime > 3 && (
              <p className="text-sm text-gray-500 mt-2">
                Loading {state.loadingTime}s...
              </p>
            )}
            {state.loadingTime > 5 && (
              <Button
                onClick={handleSuccess}
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
              >
                Lewati Loading
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Timeout state
  if (state.hasTimedOut) {
    if (FallbackComponent) {
      return <FallbackComponent />
    }

    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Komponen {componentName} Timeout
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Komponen membutuhkan waktu lebih lama dari {timeout/1000} detik untuk dimuat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={!state.canRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
            
            <Button
              onClick={goToDashboard}
              variant="outline"
              className="border-pink-600 text-pink-600 hover:bg-pink-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Refresh Halaman
            </Button>
          </div>

          {/* Quick recovery options */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => { 
                  localStorage.clear(); 
                  window.location.reload(); 
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear Cache
              </button>
              <span className="text-xs text-gray-300">•</span>
              <button
                onClick={() => {
                  setState(prev => ({ ...prev, canRetry: true }))
                  handleRetry()
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Force Retry
              </button>
              <span className="text-xs text-gray-300">•</span>
              <button
                onClick={() => window.location.hash = '#dashboard'}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Go Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render children
  return <>{children}</>
}

// Hook untuk timeout management yang lebih sederhana
export const useTimeoutManager = (componentName: string, timeout = 8000) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true)
        setIsLoading(false)
        console.warn(`${componentName} timed out after ${timeout}ms`)
      }
    }, timeout)

    // Auto-resolve after minimal loading time
    const resolveTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 300) // Faster resolution

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(resolveTimeout)
    }
  }, [componentName, timeout, isLoading])

  const retry = () => {
    setIsLoading(true)
    setHasTimedOut(false)
  }

  return {
    isLoading,
    hasTimedOut,
    retry
  }
}

// Simple Loading Component
export const SimpleLoader: React.FC<{ message?: string }> = ({ 
  message = "Memuat..." 
}) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-3"></div>
      <p className="text-pink-600 text-sm">{message}</p>
    </div>
  </div>
)

// Error Fallback Component
export const ErrorFallback: React.FC<{ 
  componentName: string
  onRetry?: () => void 
}> = ({ componentName, onRetry }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
      <p className="text-red-600 mb-4">Error loading {componentName}</p>
      <div className="space-x-2">
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry
          </Button>
        )}
        <Button 
          onClick={() => window.location.hash = '#dashboard'} 
          size="sm"
        >
          Dashboard
        </Button>
      </div>
    </div>
  </div>
)