import { useEffect, useRef } from 'react'
import { isMonthlyRefreshNeeded, markMonthlyRefreshDone } from './constants'
import { toast } from 'sonner@2.0.3'

interface UseMonthlyRefreshProps {
  onRefresh: () => void | Promise<void>
  enabled?: boolean
  onError?: (error: Error) => void
  maxRetries?: number
}

export const useMonthlyRefresh = ({ 
  onRefresh, 
  enabled = true, 
  onError,
  maxRetries = 3 
}: UseMonthlyRefreshProps) => {
  const hasCheckedToday = useRef(false)
  const refreshTriggered = useRef(false)
  const retryCount = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const checkAndRefresh = () => {
      const today = new Date().toDateString()
      const lastCheck = localStorage.getItem('lastRefreshCheck')
      
      // Cek sekali per hari untuk mencegah multiple refresh
      if (lastCheck === today && hasCheckedToday.current) {
        return
      }

      hasCheckedToday.current = true
      localStorage.setItem('lastRefreshCheck', today)

      // Cek apakah perlu refresh bulanan
      if (isMonthlyRefreshNeeded() && !refreshTriggered.current) {
        const currentTime = new Date()
        console.log('🔄 Auto refresh: Tanggal 1 bulan baru terdeteksi, memuat data terbaru...')
        console.log('🔄 Auto refresh triggered at:', currentTime.toISOString())
        console.log('🔄 Auto refresh conditions met:', {
          currentDate: currentTime.getDate(),
          currentMonth: currentTime.getMonth() + 1,
          currentYear: currentTime.getFullYear()
        })
        refreshTriggered.current = true
        
        // Delay sedikit untuk memastikan UI sudah ready
        setTimeout(async () => {
          console.log('🔄 Executing auto refresh callback...')
          
          try {
            await Promise.resolve(onRefresh())
            markMonthlyRefreshDone()
            refreshTriggered.current = false
            retryCount.current = 0 // Reset retry count on success
            console.log('🔄 Auto refresh completed successfully')
            
            // Show success notification
            toast.success('🔄 Data laporan diperbarui untuk bulan baru!', {
              description: `Semua data telah dimuat ulang untuk periode ${currentTime.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
            })
            
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error')
            console.error('❌ Auto refresh failed:', err)
            
            // Retry mechanism
            if (retryCount.current < maxRetries) {
              retryCount.current++
              console.log(`🔄 Auto refresh retry ${retryCount.current}/${maxRetries}`)
              
              // Retry with exponential backoff
              setTimeout(() => {
                console.log('🔄 Retrying auto refresh...')
                onRefresh()
              }, retryCount.current * 2000)
              
              toast.error(`❌ Auto refresh gagal, mencoba lagi... (${retryCount.current}/${maxRetries})`, {
                description: err.message
              })
            } else {
              // Max retries reached
              refreshTriggered.current = false
              retryCount.current = 0
              console.error('❌ Auto refresh failed after max retries')
              
              if (onError) {
                onError(err)
              }
              
              toast.error('❌ Auto refresh gagal setelah beberapa percobaan', {
                description: 'Silakan refresh manual atau hubungi admin',
                action: {
                  label: 'Refresh Manual',
                  onClick: () => onRefresh()
                }
              })
            }
          }
        }, 1000)
      }
    }

    // Cek sekarang
    checkAndRefresh()

    // Cek setiap jam untuk menangkap perubahan tanggal
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000) // 1 jam

    return () => clearInterval(interval)
  }, [onRefresh, enabled])

  // Manual trigger untuk testing dengan error handling
  const triggerManualRefresh = async () => {
    const now = new Date()
    console.log('🔄 Manual refresh triggered at:', now.toISOString())
    console.log('🔄 Calling onRefresh function...')
    
    try {
      await Promise.resolve(onRefresh())
      markMonthlyRefreshDone()
      
      console.log('🔄 Manual refresh completed successfully, localStorage updated')
      toast.success('🔄 Manual refresh berhasil!', {
        description: `Data laporan telah dimuat ulang pada ${now.toLocaleTimeString('id-ID')}`
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      console.error('❌ Manual refresh failed:', err)
      
      if (onError) {
        onError(err)
      }
      
      toast.error('❌ Manual refresh gagal!', {
        description: err.message,
        action: {
          label: 'Coba Lagi',
          onClick: () => triggerManualRefresh()
        }
      })
    }
  }

  return {
    triggerManualRefresh
  }
}