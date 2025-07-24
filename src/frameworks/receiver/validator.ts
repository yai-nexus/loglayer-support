/**
 * 日志数据验证器
 */

import type { ValidationResult, ValidationConfig, ClientLogData } from '../receiver'

export class LogDataValidator {
  private readonly config: ValidationConfig

  constructor(config: ValidationConfig = {}) {
    this.config = {
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 1000,
      maxMetadataSize: 10240, // 10KB
      validateTimestamp: false,
      ...config
    }
  }

  /**
   * 验证单条日志数据
   */
  validate(data: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础类型检查
    if (typeof data !== 'object' || data === null) {
      errors.push('Log data must be an object')
      return { valid: false, errors, warnings }
    }

    // 验证必需字段
    if (this.config.requireLevel) {
      if (!data.level) {
        errors.push('Missing required field: level')
      } else if (typeof data.level !== 'string') {
        errors.push('Field "level" must be a string')
      } else if (this.config.allowedLevels && !this.config.allowedLevels.includes(data.level.toLowerCase())) {
        errors.push(`Invalid log level: ${data.level}. Allowed levels: ${this.config.allowedLevels.join(', ')}`)
      }
    }

    if (this.config.requireMessage) {
      if (!data.message) {
        errors.push('Missing required field: message')
      } else if (typeof data.message !== 'string') {
        errors.push('Field "message" must be a string')
      } else if (this.config.maxMessageLength && data.message.length > this.config.maxMessageLength) {
        errors.push(`Message too long: ${data.message.length} characters (max: ${this.config.maxMessageLength})`)
      }
    }

    // 验证可选字段
    if (data.metadata !== undefined) {
      if (typeof data.metadata !== 'object' || data.metadata === null) {
        errors.push('Field "metadata" must be an object')
      } else if (this.config.maxMetadataSize) {
        const metadataSize = this.calculateObjectSize(data.metadata)
        if (metadataSize > this.config.maxMetadataSize) {
          errors.push(`Metadata too large: ${metadataSize} bytes (max: ${this.config.maxMetadataSize})`)
        }
      }
    }

    if (data.timestamp !== undefined) {
      if (typeof data.timestamp !== 'string') {
        errors.push('Field "timestamp" must be a string')
      } else if (this.config.validateTimestamp) {
        const timestamp = new Date(data.timestamp)
        if (isNaN(timestamp.getTime())) {
          errors.push('Field "timestamp" must be a valid ISO date string')
        }
      }
    }

    if (data.userAgent !== undefined && typeof data.userAgent !== 'string') {
      errors.push('Field "userAgent" must be a string')
    }

    if (data.url !== undefined && typeof data.url !== 'string') {
      errors.push('Field "url" must be a string')
    }

    if (data.sessionId !== undefined && typeof data.sessionId !== 'string') {
      errors.push('Field "sessionId" must be a string')
    }

    // 验证错误对象
    if (data.error !== undefined) {
      if (typeof data.error !== 'object' || data.error === null) {
        errors.push('Field "error" must be an object')
      } else {
        if (data.error.name !== undefined && typeof data.error.name !== 'string') {
          errors.push('Field "error.name" must be a string')
        }
        if (data.error.message !== undefined && typeof data.error.message !== 'string') {
          errors.push('Field "error.message" must be a string')
        }
        if (data.error.stack !== undefined && typeof data.error.stack !== 'string') {
          errors.push('Field "error.stack" must be a string')
        }
      }
    }

    // 自定义验证
    if (this.config.customValidator) {
      try {
        const customResult = this.config.customValidator(data)
        if (!customResult.valid) {
          errors.push(...customResult.errors)
          if (customResult.warnings) {
            warnings.push(...customResult.warnings)
          }
        }
      } catch (error) {
        errors.push(`Custom validation failed: ${error.message}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * 验证批量日志数据
   */
  validateBatch(data: any[]): ValidationResult[] {
    if (!Array.isArray(data)) {
      return [{
        valid: false,
        errors: ['Batch data must be an array'],
        warnings: undefined
      }]
    }

    return data.map(item => this.validate(item))
  }

  /**
   * 计算对象大小（字节）
   */
  private calculateObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size
    } catch {
      // 如果 Blob 不可用，使用字符串长度估算
      return JSON.stringify(obj).length * 2 // UTF-16 编码，每字符约 2 字节
    }
  }

  /**
   * 获取配置
   */
  getConfig(): ValidationConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 创建默认验证器
   */
  static createDefault(): LogDataValidator {
    return new LogDataValidator()
  }

  /**
   * 创建宽松验证器（只验证基本字段）
   */
  static createLenient(): LogDataValidator {
    return new LogDataValidator({
      requireLevel: true,
      requireMessage: true,
      allowedLevels: undefined, // 允许任何级别
      maxMessageLength: undefined, // 无长度限制
      maxMetadataSize: undefined, // 无大小限制
      validateTimestamp: false
    })
  }

  /**
   * 创建严格验证器（验证所有字段）
   */
  static createStrict(): LogDataValidator {
    return new LogDataValidator({
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 500,
      maxMetadataSize: 5120, // 5KB
      validateTimestamp: true
    })
  }
}
