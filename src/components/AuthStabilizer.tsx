import { useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase/client'

interface AuthStabilizerProps {
  user: any
  onUserLost: () => void
}

export function AuthStabilizer({ user, onUserLost }: AuthStabilizerProps) {
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const sessionLossTimeout = useRef<NodeJS.Timeout | null>(null)
  const isStableRef = useRef(true)

  useEffect(() => {
    if (!user) return

    console.log('🛡️ AuthStabilizer: Protecting session for', user.email)

    // Periodic session health check
    sessionCheckInterval.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session && user && isStableRef.current) {
          console.log('⚠️ AuthStabilizer: Session lost unexpectedly!')
          
          // Give it a moment to see if session recovers
          if (sessionLossTimeout.current) {
            clearTimeout(sessionLossTimeout.current)
          }
          
          sessionLossTimeout.current = setTimeout(() => {
            console.log('💔 AuthStabilizer: Session permanently lost, notifying parent')
            onUserLost()
          }, 2000)
        } else if (session && sessionLossTimeout.current) {
          // Session recovered, cancel the loss timeout
          console.log('💚 AuthStabilizer: Session recovered')
          clearTimeout(sessionLossTimeout.current)
          sessionLossTimeout.current = null
        }
      } catch (error) {
        console.log('⚠️ AuthStabilizer: Session check error:', error)
      }
    }, 10000) // Check every 10 seconds

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
      if (sessionLossTimeout.current) {
        clearTimeout(sessionLossTimeout.current)
      }
    }
  }, [user, onUserLost])

  // Mark as stable after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      isStableRef.current = true
      console.log('🛡️ AuthStabilizer: Session marked as stable')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Mark as unstable when user changes
  useEffect(() => {
    isStableRef.current = false
    const timer = setTimeout(() => {
      isStableRef.current = true
    }, 3000)

    return () => clearTimeout(timer)
  }, [user?.id])

  return null // This is a behavior component, no UI
}