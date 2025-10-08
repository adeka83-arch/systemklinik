// Auto Schedule Service for Daily Backups
// Handles automatic backup scheduling at 11 PM daily

interface ScheduleConfig {
  enabled: boolean
  time: string // "23:00" for 11 PM
  timezone: string
  lastRun?: string
  nextRun?: string
}

interface ScheduledBackupResult {
  success: boolean
  message: string
  nextRunTime?: string
  error?: string
}

export class AutoScheduleService {
  private config: ScheduleConfig
  private intervalId: NodeJS.Timeout | null = null
  private backupCallback: (() => Promise<void>) | null = null

  constructor() {
    this.config = this.loadConfig()
    this.startScheduler()
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): ScheduleConfig {
    try {
      const saved = localStorage.getItem('backup-schedule-config')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load schedule config:', error)
    }

    // Default configuration
    return {
      enabled: true,
      time: '23:00', // 11 PM
      timezone: 'Asia/Jakarta',
      lastRun: undefined,
      nextRun: this.calculateNextRun('23:00')
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('backup-schedule-config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save schedule config:', error)
    }
  }

  /**
   * Set backup callback function
   */
  setBackupCallback(callback: () => Promise<void>): void {
    this.backupCallback = callback
  }

  /**
   * Start the scheduler
   */
  startScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkAndRunBackup()
    }, 60000) // 1 minute

    console.log('🕒 Auto backup scheduler started')
    console.log(`📅 Next backup: ${this.config.nextRun}`)
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    console.log('⏹️ Auto backup scheduler stopped')
  }

  /**
   * Check if it's time to run backup
   */
  private async checkAndRunBackup(): Promise<void> {
    if (!this.config.enabled || !this.backupCallback) {
      return
    }

    const now = new Date()
    const currentTime = now.toTimeString().substring(0, 5) // "HH:MM"
    const todayDateString = now.toDateString()

    // Check if it's the scheduled time
    if (currentTime === this.config.time) {
      // Check if we haven't run today already
      const lastRunDate = this.config.lastRun ? new Date(this.config.lastRun).toDateString() : null
      
      if (lastRunDate !== todayDateString) {
        console.log('🕚 Scheduled backup time reached!')
        await this.runScheduledBackup()
      }
    }
  }

  /**
   * Run scheduled backup
   */
  private async runScheduledBackup(): Promise<void> {
    try {
      console.log('🚀 Running scheduled backup...')
      
      this.config.lastRun = new Date().toISOString()
      this.config.nextRun = this.calculateNextRun(this.config.time)
      this.saveConfig()

      if (this.backupCallback) {
        await this.backupCallback()
        console.log('✅ Scheduled backup completed successfully')
      }
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error)
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const nextRun = new Date()
    
    nextRun.setHours(hours, minutes, 0, 0)
    
    // If the time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    
    return nextRun.toLocaleString('id-ID')
  }

  /**
   * Update schedule configuration
   */
  updateSchedule(newConfig: Partial<ScheduleConfig>): ScheduledBackupResult {
    try {
      const oldEnabled = this.config.enabled
      
      this.config = {
        ...this.config,
        ...newConfig,
        nextRun: this.calculateNextRun(newConfig.time || this.config.time)
      }
      
      this.saveConfig()

      // Restart scheduler if enabled status changed
      if (oldEnabled !== this.config.enabled) {
        if (this.config.enabled) {
          this.startScheduler()
        } else {
          this.stopScheduler()
        }
      }

      return {
        success: true,
        message: `Schedule updated successfully. Next backup: ${this.config.nextRun}`,
        nextRunTime: this.config.nextRun
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update schedule',
        error: error.message
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ScheduleConfig {
    return { ...this.config }
  }

  /**
   * Get status information
   */
  getStatus(): {
    isRunning: boolean
    isEnabled: boolean
    nextRun: string | undefined
    lastRun: string | undefined
    timeUntilNext: string
  } {
    const timeUntilNext = this.config.nextRun 
      ? this.calculateTimeUntilNext(this.config.nextRun)
      : 'Not scheduled'

    return {
      isRunning: this.intervalId !== null,
      isEnabled: this.config.enabled,
      nextRun: this.config.nextRun,
      lastRun: this.config.lastRun,
      timeUntilNext
    }
  }

  /**
   * Calculate time until next backup
   */
  private calculateTimeUntilNext(nextRunString: string): string {
    try {
      const nextRun = new Date(nextRunString)
      const now = new Date()
      const diff = nextRun.getTime() - now.getTime()

      if (diff <= 0) {
        return 'Overdue'
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        return `${days} hari, ${hours} jam`
      } else if (hours > 0) {
        return `${hours} jam, ${minutes} menit`
      } else {
        return `${minutes} menit`
      }
    } catch (error) {
      return 'Unknown'
    }
  }

  /**
   * Force run backup now (manual trigger)
   */
  async runBackupNow(): Promise<ScheduledBackupResult> {
    try {
      if (!this.backupCallback) {
        return {
          success: false,
          message: 'Backup callback not set',
          error: 'No backup function available'
        }
      }

      console.log('🚀 Running manual backup...')
      await this.backupCallback()
      
      // Update last run time
      this.config.lastRun = new Date().toISOString()
      this.saveConfig()

      return {
        success: true,
        message: 'Manual backup completed successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Manual backup failed',
        error: error.message
      }
    }
  }

  /**
   * Get backup history from localStorage
   */
  getBackupHistory(): any[] {
    try {
      const notifications = JSON.parse(localStorage.getItem('backup-notifications') || '[]')
      return notifications
        .filter((notif: any) => notif.type === 'success')
        .slice(0, 10) // Last 10 successful backups
    } catch (error) {
      return []
    }
  }

  /**
   * Cleanup - call when component unmounts
   */
  cleanup(): void {
    this.stopScheduler()
  }
}

// Export singleton
let autoScheduleInstance: AutoScheduleService | null = null

export const getAutoScheduleService = (): AutoScheduleService => {
  if (!autoScheduleInstance) {
    autoScheduleInstance = new AutoScheduleService()
  }
  return autoScheduleInstance
}

export const createAutoScheduleService = (): AutoScheduleService => {
  return new AutoScheduleService()
}