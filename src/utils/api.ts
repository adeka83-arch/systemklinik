import { supabase, serverUrl } from './supabase/client'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  retries?: number
  timeout?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    console.log('🔄 Refreshing access token...')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Error refreshing token:', error)
      return null
    }
    
    if (session?.access_token) {
      console.log('✅ Token refreshed successfully')
      return session.access_token
    }
    
    console.log('❌ No token in refreshed session')
    return null
  } catch (error) {
    console.log('❌ Token refresh failed:', error)
    return null
  }
}

export async function apiRequest(
  endpoint: string,
  accessToken: string,
  options: ApiRequestOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = 2,
    timeout = 10000
  } = options

  let currentToken = accessToken
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 API Request attempt ${attempt + 1}/${retries + 1}: ${method} ${endpoint}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
        ...headers
      }

      console.log('📋 Request headers:', {
        ...requestHeaders,
        'Authorization': `Bearer ${currentToken.substring(0, 20)}...`
      })

      const response = await fetch(`${serverUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log(`📡 Response status: ${response.status} ${response.statusText}`)

      // If we get 401 and this is not the last attempt, try to refresh token
      if (response.status === 401 && attempt < retries) {
        console.log('🔒 Got 401, attempting token refresh...')
        
        const newToken = await refreshAccessToken()
        if (newToken && newToken !== currentToken) {
          console.log('🔄 Using refreshed token for retry')
          currentToken = newToken
          continue
        } else {
          console.log('❌ Token refresh failed or returned same token')
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ API Error: ${response.status} ${response.statusText}`, errorText)
        throw new ApiError(
          errorText || `HTTP ${response.status} ${response.statusText}`,
          response.status,
          response.statusText
        )
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.log(`⚠️ Non-JSON response received:`, responseText)
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}`)
      }

      // Try to parse JSON with proper error handling
      try {
        const responseText = await response.text()
        console.log(`📄 Raw response text:`, responseText.substring(0, 200))
        
        if (!responseText.trim()) {
          throw new Error('Empty response body')
        }
        
        const data = JSON.parse(responseText)
        console.log('✅ API Request successful')
        return data
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError)
        throw new Error(`JSON Parse Error: ${parseError.message}. Check server response format.`)
      }

    } catch (error) {
      lastError = error as Error
      console.log(`❌ API Request attempt ${attempt + 1} failed:`, error)

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        break
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  console.log('❌ All API request attempts failed')
  throw lastError || new Error('API request failed after all retries')
}

// Convenience methods
export const apiGet = (endpoint: string, accessToken: string, options?: Omit<ApiRequestOptions, 'method'>) =>
  apiRequest(endpoint, accessToken, { ...options, method: 'GET' })

export const apiPost = (endpoint: string, accessToken: string, body: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
  apiRequest(endpoint, accessToken, { ...options, method: 'POST', body })

export const apiPut = (endpoint: string, accessToken: string, body: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
  apiRequest(endpoint, accessToken, { ...options, method: 'PUT', body })

export const apiDelete = (endpoint: string, accessToken: string, options?: Omit<ApiRequestOptions, 'method'>) =>
  apiRequest(endpoint, accessToken, { ...options, method: 'DELETE' })