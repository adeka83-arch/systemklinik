import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-73417b67`

// Health check function
export const checkServerHealth = async (timeoutMs = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(`${serverUrl}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.log('Server health check failed with status:', response.status)
      return false
    }
    
    const data = await response.json()
    console.log('Server health check successful:', data)
    return data.success === true
  } catch (error) {
    console.log('Server health check error:', error)
    return false
  }
}

// Enhanced fetch with timeout and retry
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeoutMs = 10000,
  retries = 1
) => {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log(`Request timeout (${timeoutMs}ms) on attempt ${attempt + 1}/${retries + 1}`)
      controller.abort()
    }, timeoutMs)
    
    try {
      console.log(`Attempting request to ${url} (attempt ${attempt + 1}/${retries + 1})`)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers
        }
      })
      
      clearTimeout(timeoutId)
      console.log(`Request successful on attempt ${attempt + 1}`)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request aborted due to timeout on attempt ${attempt + 1}`)
      } else {
        console.log(`Request failed on attempt ${attempt + 1}:`, error)
      }
      
      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000)
      console.log(`Waiting ${waitTime}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError || new Error('Request failed after all attempts')
}

// Quick health check with fallback
export const quickHealthCheck = async (): Promise<boolean> => {
  try {
    console.log('Performing quick health check...')
    const response = await fetchWithTimeout(`${serverUrl}/health`, {}, 3000, 0)
    
    if (!response.ok) {
      console.log('Quick health check failed - server returned error')
      return false
    }
    
    const data = await response.json()
    const isHealthy = data.success === true
    console.log('Quick health check result:', isHealthy ? 'healthy' : 'unhealthy')
    return isHealthy
  } catch (error) {
    console.log('Quick health check failed:', error instanceof Error ? error.message : error)
    return false
  }
}