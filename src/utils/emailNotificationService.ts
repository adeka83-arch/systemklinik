// Email Notification Service for Backup System
// Simple email notification using Web APIs

interface EmailNotification {
  to: string
  subject: string
  message: string
  isSuccess: boolean
  backupInfo?: {
    filename: string
    size: string
    downloadUrl: string
    timestamp: string
  }
}

export class EmailNotificationService {
  private webhookUrl: string | null = null
  private adminEmail: string | null = null

  constructor(adminEmail?: string, webhookUrl?: string) {
    this.adminEmail = adminEmail || null
    this.webhookUrl = webhookUrl || null
  }

  /**
   * Send backup success notification
   */
  async sendBackupSuccess(backupInfo: {
    filename: string
    size: string
    downloadUrl: string
    timestamp: string
  }): Promise<{ success: boolean; error?: string }> {
    const notification: EmailNotification = {
      to: this.adminEmail || 'admin@falasifah-clinic.com',
      subject: '✅ Database Backup Berhasil - Falasifah Dental Clinic',
      message: this.generateSuccessMessage(backupInfo),
      isSuccess: true,
      backupInfo
    }

    return await this.sendNotification(notification)
  }

  /**
   * Send backup failure notification
   */
  async sendBackupFailure(error: string): Promise<{ success: boolean; error?: string }> {
    const notification: EmailNotification = {
      to: this.adminEmail || 'admin@falasifah-clinic.com',
      subject: '❌ Database Backup Gagal - Falasifah Dental Clinic',
      message: this.generateFailureMessage(error),
      isSuccess: false
    }

    return await this.sendNotification(notification)
  }

  /**
   * Send notification via multiple channels
   */
  private async sendNotification(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    const results = await Promise.allSettled([
      this.sendViaWebhook(notification),
      this.sendViaLocalStorage(notification),
      this.logToConsole(notification)
    ])

    // Check if at least one method succeeded
    const hasSuccess = results.some(result => 
      result.status === 'fulfilled' && result.value.success
    )

    if (hasSuccess) {
      return { success: true }
    } else {
      const errors = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => result.status === 'rejected' ? result.reason : result.value.error)
        .join(', ')
      
      return { success: false, error: errors }
    }
  }

  /**
   * Send via webhook (Discord/Slack/etc)
   */
  private async sendViaWebhook(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    if (!this.webhookUrl) {
      return { success: false, error: 'Webhook URL not configured' }
    }

    try {
      const payload = {
        content: `🔔 **${notification.subject}**\n\n${notification.message}`,
        embeds: notification.isSuccess ? [{
          color: 0x00ff00, // Green
          title: '✅ Backup Berhasil',
          fields: [
            { name: 'File', value: notification.backupInfo?.filename || 'N/A', inline: true },
            { name: 'Size', value: notification.backupInfo?.size || 'N/A', inline: true },
            { name: 'Waktu', value: notification.backupInfo?.timestamp || 'N/A', inline: true }
          ],
          timestamp: new Date().toISOString()
        }] : [{
          color: 0xff0000, // Red
          title: '❌ Backup Gagal',
          description: notification.message,
          timestamp: new Date().toISOString()
        }]
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        console.log('✅ Webhook notification sent successfully')
        return { success: true }
      } else {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Webhook notification error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Store notification in localStorage for user to see
   */
  private async sendViaLocalStorage(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = JSON.parse(localStorage.getItem('backup-notifications') || '[]')
      
      const newNotification = {
        id: Date.now().toString(),
        type: notification.isSuccess ? 'success' : 'error',
        subject: notification.subject,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
        backupInfo: notification.backupInfo
      }

      notifications.unshift(newNotification)
      
      // Keep only last 50 notifications
      const trimmedNotifications = notifications.slice(0, 50)
      
      localStorage.setItem('backup-notifications', JSON.stringify(trimmedNotifications))
      
      console.log('✅ Notification stored in localStorage')
      return { success: true }
    } catch (error) {
      console.error('localStorage notification error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Log notification to console
   */
  private async logToConsole(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = new Date().toLocaleString('id-ID')
      const prefix = notification.isSuccess ? '✅' : '❌'
      
      console.log(`\n${prefix} BACKUP NOTIFICATION [${timestamp}]`)
      console.log(`Subject: ${notification.subject}`)
      console.log(`Message: ${notification.message}`)
      
      if (notification.backupInfo) {
        console.log(`File: ${notification.backupInfo.filename}`)
        console.log(`Download: ${notification.backupInfo.downloadUrl}`)
      }
      console.log('─'.repeat(50))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate success message
   */
  private generateSuccessMessage(backupInfo: {
    filename: string
    size: string
    downloadUrl: string
    timestamp: string
  }): string {
    return `
🎉 Database backup berhasil dibuat!

📄 File: ${backupInfo.filename}
📊 Size: ${backupInfo.size}
🕒 Waktu: ${backupInfo.timestamp}
🔗 Download: ${backupInfo.downloadUrl}

✅ Backup otomatis berjalan dengan lancar.
📱 Anda dapat mengunduh backup melalui GitHub atau dashboard aplikasi.

---
🏥 Falasifah Dental Clinic
🤖 Automated Backup System
    `.trim()
  }

  /**
   * Generate failure message
   */
  private generateFailureMessage(error: string): string {
    return `
⚠️ Database backup GAGAL!

❌ Error: ${error}
🕒 Waktu: ${new Date().toLocaleString('id-ID')}

🔧 Tindakan yang disarankan:
1. Periksa koneksi internet
2. Periksa GitHub token & repository
3. Coba backup manual dari dashboard
4. Hubungi administrator jika masalah berlanjut

---
🏥 Falasifah Dental Clinic  
🤖 Automated Backup System
    `.trim()
  }

  /**
   * Get stored notifications
   */
  getStoredNotifications(): any[] {
    try {
      return JSON.parse(localStorage.getItem('backup-notifications') || '[]')
    } catch (error) {
      console.error('Error reading notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    try {
      const notifications = this.getStoredNotifications()
      const updated = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
      localStorage.setItem('backup-notifications', JSON.stringify(updated))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    try {
      localStorage.removeItem('backup-notifications')
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }
}

// Export singleton
export const createEmailNotificationService = (adminEmail?: string, webhookUrl?: string) => {
  return new EmailNotificationService(adminEmail, webhookUrl)
}