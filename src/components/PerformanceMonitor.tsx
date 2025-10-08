import React, { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Monitor, RefreshCw, Trash2, Activity } from 'lucide-react'

interface PerformanceData {
  componentName: string
  loadTime: number
  status: 'loading' | 'success' | 'timeout' | 'error'
  timestamp: number
  retryCount: number
}

class PerformanceTracker {
  private static instance: PerformanceTracker
  private data: PerformanceData[] = []
  private listeners: ((data: PerformanceData[]) => void)[] = []

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  track(componentName: string, status: PerformanceData['status'], loadTime = 0) {
    const existing = this.data.find(d => d.componentName === componentName)
    
    if (existing) {
      existing.status = status
      existing.loadTime = status === 'success' ? loadTime : existing.loadTime
      existing.timestamp = Date.now()
      if (status === 'timeout' || status === 'error') {
        existing.retryCount++
      }
    } else {
      this.data.push({
        componentName,
        loadTime,
        status,
        timestamp: Date.now(),
        retryCount: 0
      })
    }

    this.notifyListeners()
  }

  subscribe(listener: (data: PerformanceData[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  clear() {
    this.data = []
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.data]))
  }

  getData() {
    return [...this.data]
  }
}

export const performanceTracker = PerformanceTracker.getInstance()

export const PerformanceMonitor: React.FC = () => {
  const [data, setData] = useState<PerformanceData[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const unsubscribe = performanceTracker.subscribe(setData)
    setData(performanceTracker.getData())
    return unsubscribe
  }, [])

  if (!isVisible) {
    const hasTimeouts = data.some(d => d.status === 'timeout' || d.status === 'error')
    
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant={hasTimeouts ? "destructive" : "outline"}
          className="shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
          {hasTimeouts && (
            <Badge variant="destructive" className="ml-2 text-xs">
              Issues
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: PerformanceData['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'loading': return 'bg-blue-100 text-blue-800'
      case 'timeout': return 'bg-red-100 text-red-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const problematicComponents = data.filter(d => 
    d.status === 'timeout' || d.status === 'error' || d.retryCount > 0
  )

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Monitor className="h-4 w-4 mr-2" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => performanceTracker.clear()}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {data.length === 0 ? (
            <p className="text-sm text-gray-500">No component data yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Problematic components first */}
              {problematicComponents.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-red-600 mb-2">
                    Issues ({problematicComponents.length})
                  </h4>
                  {problematicComponents.map((item, index) => (
                    <div key={`problem-${index}`} className="flex items-center justify-between text-xs py-1 px-2 bg-red-50 rounded">
                      <span className="font-medium truncate">{item.componentName}</span>
                      <div className="flex items-center gap-2">
                        {item.retryCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1">
                            {item.retryCount} retries
                          </Badge>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All components */}
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                All Components ({data.length})
              </h4>
              {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1">
                  <span className="font-medium truncate flex-1">{item.componentName}</span>
                  <div className="flex items-center gap-2">
                    {item.loadTime > 0 && (
                      <span className="text-gray-500">
                        {formatTime(item.loadTime)}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                Clear & Refresh
              </Button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Success: {data.filter(d => d.status === 'success').length}</span>
              <span>Timeouts: {data.filter(d => d.status === 'timeout').length}</span>
              <span>Errors: {data.filter(d => d.status === 'error').length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook untuk tracking performa komponen
export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    const startTime = Date.now()
    performanceTracker.track(componentName, 'loading')

    const successTimeout = setTimeout(() => {
      const loadTime = Date.now() - startTime
      performanceTracker.track(componentName, 'success', loadTime)
    }, 100)

    return () => {
      clearTimeout(successTimeout)
    }
  }, [componentName])

  const trackTimeout = () => {
    performanceTracker.track(componentName, 'timeout')
  }

  const trackError = () => {
    performanceTracker.track(componentName, 'error')
  }

  return { trackTimeout, trackError }
}