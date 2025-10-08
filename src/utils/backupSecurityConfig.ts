/**
 * Backup Security Configuration Utility
 * Mengintegrasikan pengaturan keamanan backup dari SuperUserConfigPanel
 */

export interface BackupSecurityConfig {
  enableAutoBackup: boolean
  enableEmailNotification: boolean
  enableGithubIntegration: boolean
  requireConfirmation: boolean
  backupRetentionDays: number
}

export interface ExtendedBackupConfig {
  githubUsername: string
  githubRepository: string
  githubToken: string
  adminEmail: string
  webhookUrl: string
  scheduleEnabled: boolean
  scheduleTime: string
  // Security configurations
  enableAutoBackup: boolean
  enableEmailNotification: boolean
  enableGithubIntegration: boolean
  requireConfirmation: boolean
  backupRetentionDays: number
}

/**
 * Load backup security configuration from localStorage
 */
export function loadBackupSecurityConfig(): BackupSecurityConfig {
  try {
    const saved = localStorage.getItem('backup-security-config')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load backup security config:', error)
  }

  // Default configuration
  return {
    enableAutoBackup: true,
    enableEmailNotification: true,
    enableGithubIntegration: true,
    requireConfirmation: true,
    backupRetentionDays: 30
  }
}

/**
 * Save backup security configuration to localStorage
 */
export function saveBackupSecurityConfig(config: BackupSecurityConfig): boolean {
  try {
    localStorage.setItem('backup-security-config', JSON.stringify(config))
    return true
  } catch (error) {
    console.error('Failed to save backup security config:', error)
    return false
  }
}

/**
 * Merge security config with backup config
 */
export function mergeBackupConfigs(
  backupConfig: any,
  securityConfig: BackupSecurityConfig
): ExtendedBackupConfig {
  return {
    ...backupConfig,
    ...securityConfig
  }
}

/**
 * Check if backup operation is allowed based on security settings
 */
export function isBackupAllowed(securityConfig: BackupSecurityConfig): {
  allowed: boolean
  reasons: string[]
} {
  const reasons: string[] = []

  if (!securityConfig.enableAutoBackup) {
    reasons.push('Auto backup is disabled in security settings')
  }

  if (!securityConfig.enableGithubIntegration) {
    reasons.push('GitHub integration is disabled in security settings')
  }

  return {
    allowed: reasons.length === 0,
    reasons
  }
}

/**
 * Check if email notification should be sent
 */
export function shouldSendEmailNotification(securityConfig: BackupSecurityConfig): boolean {
  return securityConfig.enableEmailNotification
}

/**
 * Check if confirmation is required for manual backup
 */
export function isConfirmationRequired(securityConfig: BackupSecurityConfig): boolean {
  return securityConfig.requireConfirmation
}

/**
 * Get retention period in days
 */
export function getRetentionPeriod(securityConfig: BackupSecurityConfig): number {
  return securityConfig.backupRetentionDays
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: BackupSecurityConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.backupRetentionDays < 1) {
    errors.push('Retention period must be at least 1 day')
  }

  if (config.backupRetentionDays > 365) {
    errors.push('Retention period cannot exceed 365 days')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get security status summary
 */
export function getSecurityStatusSummary(config: BackupSecurityConfig): {
  level: 'high' | 'medium' | 'low'
  score: number
  features: {
    autoBackup: boolean
    emailNotification: boolean
    githubIntegration: boolean
    confirmation: boolean
  }
} {
  const features = {
    autoBackup: config.enableAutoBackup,
    emailNotification: config.enableEmailNotification,
    githubIntegration: config.enableGithubIntegration,
    confirmation: config.requireConfirmation
  }

  const enabledCount = Object.values(features).filter(Boolean).length
  const score = (enabledCount / 4) * 100

  let level: 'high' | 'medium' | 'low'
  if (score >= 75) {
    level = 'high'
  } else if (score >= 50) {
    level = 'medium'
  } else {
    level = 'low'
  }

  return {
    level,
    score,
    features
  }
}