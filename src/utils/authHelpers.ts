// Authentication helper utilities
import { supabase } from './supabase/client'

export interface AuthDebugInfo {
  hasUser: boolean
  hasSession: boolean
  hasAccessToken: boolean
  tokenLength?: number
  userEmail?: string
  tokenPreview?: string
  sessionValid: boolean
  lastRefresh?: string
}

// Debug current authentication state
export const getAuthDebugInfo = async (): Promise<AuthDebugInfo> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    const info: AuthDebugInfo = {
      hasUser: !!session?.user,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionValid: !error && !!session?.access_token,
      userEmail: session?.user?.email,
      tokenLength: session?.access_token?.length,
      tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : undefined,
      lastRefresh: session?.refresh_token ? 'Available' : 'No refresh token'
    }
    
    console.log('🔍 Auth Debug Info:', info)
    return info
  } catch (error) {
    console.error('❌ Error getting auth debug info:', error)
    return {
      hasUser: false,
      hasSession: false,
      hasAccessToken: false,
      sessionValid: false
    }
  }
}

// Force refresh session with proper error handling
export const forceRefreshSession = async (): Promise<{ success: boolean; accessToken?: string; error?: string }> => {
  try {
    console.log('🔄 Force refreshing session...')
    
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('❌ Session refresh error:', error)
      return { success: false, error: error.message }
    }
    
    if (!session?.access_token) {
      console.error('❌ No access token after refresh')
      return { success: false, error: 'No access token in refreshed session' }
    }
    
    console.log('✅ Session refreshed successfully')
    return { 
      success: true, 
      accessToken: session.access_token 
    }
  } catch (error) {
    console.error('❌ Exception during session refresh:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Validate token with server
export const validateTokenWithServer = async (accessToken: string, serverUrl: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    console.log('🔍 Validating token with server...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.log('⚠️ Token validation timeout')
    }, 8000)
    
    const response = await fetch(`${serverUrl}/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Token validation failed:', response.status, errorText)
      return { valid: false, error: `Server returned ${response.status}: ${errorText}` }
    }
    
    const result = await response.json()
    console.log('✅ Token validation successful:', result?.user?.email || 'No user info')
    return { valid: true }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⚠️ Token validation timed out')
      return { valid: false, error: 'Validation timeout' }
    }
    
    console.error('❌ Token validation error:', error)
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get fresh session with retry logic
export const getFreshSession = async (maxRetries = 3): Promise<{ session: any; accessToken?: string; error?: string }> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Getting fresh session (attempt ${attempt}/${maxRetries})...`)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          return { session: null, error: error.message }
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }
      
      if (!session) {
        console.log(`⚠️ Attempt ${attempt}: No session found`)
        if (attempt === maxRetries) {
          return { session: null, error: 'No session found after all attempts' }
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }
      
      if (!session.access_token) {
        console.log(`⚠️ Attempt ${attempt}: Session found but no access token`)
        if (attempt === maxRetries) {
          return { session, error: 'No access token in session' }
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }
      
      console.log(`✅ Fresh session obtained on attempt ${attempt}`)
      return { session, accessToken: session.access_token }
    } catch (error) {
      console.error(`❌ Exception on attempt ${attempt}:`, error)
      if (attempt === maxRetries) {
        return { 
          session: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return { session: null, error: 'Failed to get session after all attempts' }
}