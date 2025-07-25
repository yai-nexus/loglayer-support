/**
 * HTTP 输出器
 * 负责将日志通过 HTTP 发送到服务端
 */

import type { LogOutput, BrowserLogData, HttpOutputConfig, BrowserLogLevel } from '../../browser'
import { shouldLog, calculateRetryDelay, isBrowser } from '../utils'

export class HttpOutput implements LogOutput {
  readonly name = 'http'
  private readonly config: HttpOutputConfig
  private buffer: BrowserLogData[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor(config: HttpOutputConfig) {
    const defaultConfig = {
      endpoint: '/api/logs',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json'
      },
      batchSize: 10,
      flushInterval: 5000,
      retryAttempts: 3,
      retryDelay: 'exponential' as const,
      baseRetryDelay: 1000,
      onlyErrors: false,
      levelFilter: []
    }

    this.config = {
      ...defaultConfig,
      ...config
    }

    // 启动定时刷新
    this.startFlushTimer()
  }

  /**
   * 写入日志到缓冲区
   */
  write(data: BrowserLogData): void {
    if (!this.config.enabled || !isBrowser() || this.isDestroyed) {
      return
    }

    // 检查级别过滤
    if (!this.shouldLogLevel(data.level as BrowserLogLevel)) {
      return
    }

    // 应用数据转换
    const transformedData = this.config.transform ? this.config.transform(data) : data

    // 添加到缓冲区
    this.buffer.push(transformedData)

    // 检查是否需要立即刷新
    if (this.buffer.length >= this.config.batchSize!) {
      this.flush()
    }
  }

  /**
   * 刷新缓冲区，发送日志到服务端
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isDestroyed) {
      return
    }

    const logsToSend = this.buffer.splice(0)
    
    try {
      await this.sendLogs(logsToSend)
      
      // 调用成功回调
      if (this.config.onSuccess) {
        this.config.onSuccess(logsToSend)
      }
    } catch (error) {
      // 发送失败，重新加入缓冲区（在前面，保持顺序）
      this.buffer.unshift(...logsToSend)
      
      // 调用失败回调
      if (this.config.onError) {
        this.config.onError(error as Error, logsToSend)
      }
      
      console.warn('Failed to send logs to server:', error)
    }
  }

  /**
   * 发送日志到服务端（带重试）
   */
  private async sendLogs(logs: BrowserLogData[]): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const response = await fetch(this.config.endpoint!, {
          method: this.config.method,
          headers: this.config.headers,
          body: JSON.stringify(logs)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // 发送成功，返回
        return
      } catch (error) {
        lastError = error as Error
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.retryAttempts!) {
          const delay = calculateRetryDelay(
            attempt,
            this.config.retryDelay!,
            this.config.baseRetryDelay!
          )
          
          await this.sleep(delay)
        }
      }
    }

    // 所有重试都失败了，抛出最后的错误
    throw lastError
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLogLevel(level: BrowserLogLevel): boolean {
    // 如果设置了 onlyErrors，只发送错误级别
    if (this.config.onlyErrors && level !== 'error') {
      return false
    }

    // 检查级别过滤器
    if (!this.config.levelFilter || this.config.levelFilter.length === 0) {
      return true
    }
    
    return this.config.levelFilter.some(filterLevel => 
      shouldLog(level, filterLevel)
    )
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval!)
  }

  /**
   * 停止定时刷新
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 销毁输出器
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true
    this.stopFlushTimer()
    
    // 最后一次刷新，发送剩余的日志
    if (this.buffer.length > 0) {
      try {
        await this.flush()
      } catch (error) {
        console.warn('Failed to flush logs during destroy:', error)
      }
    }
  }

  /**
   * 检查是否可用
   */
  isAvailable(): boolean {
    return isBrowser() && typeof fetch !== 'undefined'
  }

  /**
   * 获取配置
   */
  getConfig(): HttpOutputConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<HttpOutputConfig>): void {
    Object.assign(this.config, config)
    
    // 如果更新了刷新间隔，重启定时器
    if (config.flushInterval !== undefined) {
      this.startFlushTimer()
    }
  }

  /**
   * 获取缓冲区大小
   */
  getBufferSize(): number {
    return this.buffer.length
  }

  /**
   * 清空缓冲区
   */
  clearBuffer(): void {
    this.buffer = []
  }
}
