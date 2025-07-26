/**
 * HTTP 输出器（简化版本）
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

    this.config = { ...defaultConfig, ...config }

    // 如果不是浏览器环境，跳过初始化
    if (!isBrowser()) {
      return
    }

    // 设置定时刷新
    this.scheduleFlush()

    // 监听页面卸载事件，确保日志被发送
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync()
      })
    }
  }

  async write(logData: BrowserLogData): Promise<void> {
    if (this.isDestroyed || !isBrowser()) {
      return
    }

    // 检查级别过滤
    if (this.config.levelFilter && this.config.levelFilter.length > 0) {
      if (!this.config.levelFilter.includes(logData.level as BrowserLogLevel)) {
        return
      }
    }

    // 仅错误过滤
    if (this.config.onlyErrors && !this.isErrorLevel(logData.level as BrowserLogLevel)) {
      return
    }

    // 添加到缓冲区
    this.buffer.push(logData)

    // 检查是否达到批次大小
    if (this.buffer.length >= (this.config.batchSize || 10)) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isDestroyed) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    await this.sendLogs(logs)
  }

  private flushSync(): void {
    if (this.buffer.length === 0 || this.isDestroyed) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    // 使用 sendBeacon 进行同步发送（如果可用）
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && this.config.endpoint) {
      const data = JSON.stringify(logs)
      navigator.sendBeacon(this.config.endpoint, data)
    }
  }

  private async sendLogs(logs: BrowserLogData[]): Promise<void> {
    let attempts = 0
    const maxAttempts = (this.config.retryAttempts || 3) + 1

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(this.config.endpoint!, {
          method: this.config.method || 'POST',
          headers: this.config.headers || { 'Content-Type': 'application/json' },
          body: JSON.stringify(logs)
        })

        if (response.ok) {
          return // 成功发送
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        attempts++
        
        if (attempts >= maxAttempts) {
          // 最终失败，静默处理
          return
        }

        // 计算重试延迟
        const delay = calculateRetryDelay(attempts, this.config.retryDelay || 'exponential', this.config.baseRetryDelay || 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      this.flush().then(() => {
        if (!this.isDestroyed) {
          this.scheduleFlush()
        }
      })
    }, this.config.flushInterval || 5000)
  }

  private isErrorLevel(level: BrowserLogLevel): boolean {
    return level === 'error'
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // 最后一次刷新
    await this.flush()
  }
}