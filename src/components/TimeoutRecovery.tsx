import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface TimeoutRecoveryProps {
  onRecovery: () => void
  onForceReload: () => void
}

export function TimeoutRecovery({ onRecovery, onForceReload }: TimeoutRecoveryProps) {
  const [timeoutDetected, setTimeoutDetected] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Listen for console errors that might indicate timeouts
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('getPage') && message.includes('timeout')) {
        console.log('🔍 TimeoutRecovery: Detected getPage timeout in console')
        setTimeoutDetected(true)
      }
      originalConsoleError.apply(console, args)
    }

    // Auto-recovery countdown
    let countdownInterval: NodeJS.Timeout
    if (timeoutDetected) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            onRecovery()
            return 10
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      console.error = originalConsoleError
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [timeoutDetected, onRecovery])

  if (!timeoutDetected) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Timeout Detected
        </h3>
        <p className="text-gray-600 mb-4">
          The application encountered a timeout error. Auto-recovery in {countdown} seconds.
        </p>
        <div className="space-y-2">
          <Button
            onClick={onRecovery}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recover Now
          </Button>
          <Button
            onClick={onForceReload}
            variant="outline"
            className="w-full"
          >
            Force Reload Page
          </Button>
        </div>
      </div>
    </div>
  )
}