/**
 * 本地存储输出器
 * 负责将日志存储到浏览器的 localStorage
 */

import type { LogOutput, BrowserLogData, LocalStorageOutputConfig, BrowserLogLevel } from '../../browser'
import { getLocalStorage, safeJsonStringify, safeJsonParse, shouldLog, LOG_LEVEL_PRIORITY } from '../utils'

export class LocalStorageOutput implements LogOutput {
  readonly name = 'localStorage'
  private readonly config: LocalStorageOutputConfig

  constructor(config: LocalStorageOutputConfig) {
    this.config = {
      key: 'app-logs',
      maxEntries: 500,
      compress: false,
      levelFilter: [],
      ...config,
      enabled: config.enabled ?? true
    }
  }

  /**
   * 写入日志到本地存储
   */
  write(data: BrowserLogData): void {
    if (!this.config.enabled || !this.isAvailable()) {
      return
    }

    // 检查级别过滤
    if (!this.shouldLogLevel(data.level as BrowserLogLevel)) {
      return
    }

    try {
      const storage = getLocalStorage()!
      const logs = this.getLogs(storage)
      
      // 添加新日志
      logs.push(data)
      
      // 应用容量限制
      this.applyCapacityLimit(logs)
      
      // 保存回存储
      this.saveLogs(storage, logs)
      
    } catch (error) {
      console.warn('Failed to write log to localStorage:', error)
    }
  }

  /**
   * 获取存储的日志
   */
  private getLogs(storage: Storage): BrowserLogData[] {
    try {
      const stored = storage.getItem(this.config.key!)
      if (!stored) {
        return []
      }

      const parsed = safeJsonParse<BrowserLogData[]>(stored, [])
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('Failed to parse logs from localStorage:', error)
      return []
    }
  }

  /**
   * 保存日志到存储
   */
  private saveLogs(storage: Storage, logs: BrowserLogData[]): void {
    try {
      const serialized = this.config.compress 
        ? this.compressLogs(logs)
        : safeJsonStringify(logs)
      
      storage.setItem(this.config.key!, serialized)
    } catch (error) {
      // 如果存储失败（可能是容量不足），尝试清理旧日志
      if (error instanceof Error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        this.handleQuotaExceeded(storage, logs)
      } else {
        console.warn('Failed to save logs to localStorage:', error)
      }
    }
  }

  /**
   * 应用容量限制
   */
  private applyCapacityLimit(logs: BrowserLogData[]): void {
    const maxEntries = this.config.maxEntries!
    
    if (logs.length > maxEntries) {
      // 移除最旧的日志（FIFO）
      logs.splice(0, logs.length - maxEntries)
    }
  }

  /**
   * 处理存储配额超出
   */
  private handleQuotaExceeded(storage: Storage, logs: BrowserLogData[]): void {
    try {
      // 减少日志数量到一半
      const reducedLogs = logs.slice(-Math.floor(this.config.maxEntries! / 2))
      const serialized = safeJsonStringify(reducedLogs)
      
      storage.setItem(this.config.key!, serialized)
      console.warn('localStorage quota exceeded, reduced log entries')
    } catch (error) {
      // 如果还是失败，清空日志存储
      try {
        storage.removeItem(this.config.key!)
        console.warn('localStorage quota exceeded, cleared all logs')
      } catch (clearError) {
        console.error('Failed to clear localStorage logs:', clearError)
      }
    }
  }

  /**
   * 压缩日志数据（简单实现）
   */
  private compressLogs(logs: BrowserLogData[]): string {
    // 简单的压缩：移除不必要的字段
    const compressed = logs.map(log => ({
      l: log.level,
      m: log.message,
      t: log.timestamp,
      s: log.sessionId,
      ...(log.metadata && Object.keys(log.metadata).length > 0 && { d: log.metadata }),
      ...(log.error && { e: log.error }),
      ...(log.userAgent && { u: log.userAgent }),
      ...(log.url && { r: log.url })
    }))
    
    return safeJsonStringify(compressed)
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLogLevel(level: BrowserLogLevel): boolean {
    if (!this.config.levelFilter || this.config.levelFilter.length === 0) {
      return true
    }
    
    return this.config.levelFilter.some(filterLevel => 
      shouldLog(level, filterLevel)
    )
  }

  /**
   * 刷新缓冲区（localStorage 是同步的，无需刷新）
   */
  async flush(): Promise<void> {
    // localStorage 写入是同步的，无需刷新
  }

  /**
   * 销毁输出器
   */
  async destroy(): Promise<void> {
    // 可选：清理存储的日志
    if (this.isAvailable()) {
      try {
        const storage = getLocalStorage()!
        storage.removeItem(this.config.key!)
      } catch (error) {
        console.warn('Failed to clear localStorage on destroy:', error)
      }
    }
  }

  /**
   * 检查是否可用
   */
  isAvailable(): boolean {
    const storage = getLocalStorage()
    if (!storage) {
      return false
    }

    // 测试是否可以写入
    try {
      const testKey = `${this.config.key!}_test`
      storage.setItem(testKey, 'test')
      storage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取配置
   */
  getConfig(): LocalStorageOutputConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LocalStorageOutputConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 获取存储的日志数量
   */
  getLogCount(): number {
    if (!this.isAvailable()) {
      return 0
    }

    try {
      const storage = getLocalStorage()!
      const logs = this.getLogs(storage)
      return logs.length
    } catch {
      return 0
    }
  }

  /**
   * 清空存储的日志
   */
  clearLogs(): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      const storage = getLocalStorage()!
      storage.removeItem(this.config.key!)
    } catch (error) {
      console.warn('Failed to clear logs from localStorage:', error)
    }
  }

  /**
   * 导出日志数据
   */
  exportLogs(): BrowserLogData[] {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const storage = getLocalStorage()!
      return this.getLogs(storage)
    } catch {
      return []
    }
  }
}
