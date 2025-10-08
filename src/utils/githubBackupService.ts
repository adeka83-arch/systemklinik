// GitHub Backup Service
// Handles all GitHub API interactions for database backup

interface GitHubConfig {
  username: string
  repository: string
  token: string
  branch: string
}

interface BackupFile {
  filename: string
  content: string
  path: string
  message: string
}

export class GitHubBackupService {
  private config: GitHubConfig
  private baseUrl = 'https://api.github.com'

  constructor(config: GitHubConfig) {
    this.config = config
  }

  /**
   * Upload backup file to GitHub repository
   */
  async uploadBackup(backupData: string, timestamp: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      const filename = `backup-${timestamp}.sql.gz`
      const path = `daily/${filename}`
      
      // Compress and encode backup data
      const compressedData = await this.compressData(backupData)
      const encodedContent = btoa(compressedData)
      
      const backupFile: BackupFile = {
        filename,
        content: encodedContent,
        path,
        message: `🤖 Auto backup - ${new Date(timestamp).toLocaleString('id-ID')}`
      }

      const result = await this.createOrUpdateFile(backupFile)
      
      if (result.success) {
        const downloadUrl = `https://github.com/${this.config.username}/${this.config.repository}/blob/${this.config.branch}/${path}`
        return {
          success: true,
          downloadUrl
        }
      } else {
        return result
      }
    } catch (error) {
      console.error('GitHub backup upload error:', error)
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      }
    }
  }

  /**
   * Create or update file in GitHub repository
   */
  private async createOrUpdateFile(file: BackupFile): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if file exists first
      const existingFile = await this.getFileInfo(file.path)
      
      const url = `${this.baseUrl}/repos/${this.config.username}/${this.config.repository}/contents/${file.path}`
      
      const requestBody: any = {
        message: file.message,
        content: file.content,
        branch: this.config.branch
      }

      // If file exists, include SHA for update
      if (existingFile?.sha) {
        requestBody.sha = existingFile.sha
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        console.log(`✅ Backup uploaded successfully: ${file.filename}`)
        return { success: true }
      } else {
        const errorData = await response.json()
        console.error('GitHub API error:', errorData)
        return {
          success: false,
          error: `GitHub API error: ${errorData.message || response.statusText}`
        }
      }
    } catch (error) {
      console.error('GitHub upload error:', error)
      return {
        success: false,
        error: `Network error: ${error.message}`
      }
    }
  }

  /**
   * Get file information if it exists
   */
  private async getFileInfo(path: string): Promise<{ sha: string } | null> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.username}/${this.config.repository}/contents/${path}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return { sha: data.sha }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * List backup files from repository
   */
  async listBackups(): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.username}/${this.config.repository}/contents/daily`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        const files = await response.json()
        const backupFiles = files
          .filter((file: any) => file.name.startsWith('backup-') && file.name.endsWith('.sql.gz'))
          .sort((a: any, b: any) => b.name.localeCompare(a.name)) // Sort by newest first
          .map((file: any) => ({
            name: file.name,
            size: file.size,
            downloadUrl: file.download_url,
            htmlUrl: file.html_url,
            createdAt: this.extractDateFromFilename(file.name)
          }))

        return {
          success: true,
          files: backupFiles
        }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: `Failed to list backups: ${errorData.message}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error.message}`
      }
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.username}/${this.config.repository}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: `Connection failed: ${errorData.message}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error.message}`
      }
    }
  }

  /**
   * Simple compression simulation (in real app, use proper compression)
   */
  private async compressData(data: string): Promise<string> {
    // For demo purposes, just return the data
    // In production, implement proper compression
    return data
  }

  /**
   * Extract date from backup filename
   */
  private extractDateFromFilename(filename: string): string {
    const match = filename.match(/backup-(\d{8}-\d{4})/)
    if (match) {
      const timestamp = match[1]
      const year = timestamp.substring(0, 4)
      const month = timestamp.substring(4, 6)
      const day = timestamp.substring(6, 8)
      const hour = timestamp.substring(9, 11)
      const minute = timestamp.substring(11, 13)
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toLocaleString('id-ID')
    }
    return 'Unknown'
  }

  /**
   * Cleanup old backups (keep only last 30 days)
   */
  async cleanupOldBackups(): Promise<{ success: boolean; deleted?: number; error?: string }> {
    try {
      const { success, files, error } = await this.listBackups()
      
      if (!success || !files) {
        return { success: false, error: error || 'Failed to list backups' }
      }

      // Keep only last 30 files (30 days)
      const filesToDelete = files.slice(30)
      let deletedCount = 0

      for (const file of filesToDelete) {
        try {
          const deleteResult = await this.deleteFile(`daily/${file.name}`)
          if (deleteResult.success) {
            deletedCount++
          }
        } catch (error) {
          console.warn(`Failed to delete ${file.name}:`, error)
        }
      }

      return {
        success: true,
        deleted: deletedCount
      }
    } catch (error) {
      return {
        success: false,
        error: `Cleanup failed: ${error.message}`
      }
    }
  }

  /**
   * Delete a file from repository
   */
  private async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileInfo = await this.getFileInfo(path)
      if (!fileInfo) {
        return { success: false, error: 'File not found' }
      }

      const url = `${this.baseUrl}/repos/${this.config.username}/${this.config.repository}/contents/${path}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `🧹 Auto cleanup old backup`,
          sha: fileInfo.sha,
          branch: this.config.branch
        })
      })

      return { success: response.ok }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Export singleton instance
export const createGitHubBackupService = (config: GitHubConfig) => {
  return new GitHubBackupService(config)
}