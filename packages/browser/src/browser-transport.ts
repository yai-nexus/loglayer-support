/**
 * LogLayer 浏览器专用 Transport
 * 
 * 实现符合 LogLayer 规范的浏览器端 Transport，
 * 整合现有的 console、http、localStorage 功能
 */

import { LoggerlessTransport, type LoggerlessTransportConfig, type LogLayerTransportParams, type LogLevelType } from '@loglayer/transport'
import { serializeMessages } from '@yai-loglayer/core'

// 浏览器端输出配置
export interface BrowserOutputConfig {
  console?: {
    enabled?: boolean
    colors?: boolean
  }
  http?: {
    enabled?: boolean
    endpoint?: string
    method?: 'POST' | 'PUT'
    headers?: Record<string, string>
    batchSize?: number
    flushInterval?: number
    retryAttempts?: number
    onlyErrors?: boolean
  }
  localStorage?: {
    enabled?: boolean
    key?: string
    maxEntries?: number
    ttl?: number
  }
}

export interface LoglayerBrowserTransportConfig extends LoggerlessTransportConfig {
  outputs: BrowserOutputConfig
}

/**
 * 浏览器专用 LogLayer Transport
 * 
 * 特性：
 * - 多输出支持：console、HTTP、localStorage
 * - 智能批处理和重试
 * - 离线存储能力
 * - 性能优化
 */
export class LoglayerBrowserTransport extends LoggerlessTransport {
  private outputs: BrowserOutputConfig
  private httpBuffer: Array<{ level: LogLevelType; message: string; data?: any; timestamp: number }> = []
  private flushTimer: NodeJS.Timeout | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor(config: LoglayerBrowserTransportConfig) {
    super(config)
    
    this.outputs = {
      console: { enabled: true, colors: true },
      http: { 
        enabled: false, 
        endpoint: '/api/logs',
        method: 'POST',
        batchSize: 10,
        flushInterval: 5000,
        retryAttempts: 3,
        onlyErrors: false
      },
      localStorage: { 
        enabled: false, 
        key: 'app-logs',
        maxEntries: 100,
        ttl: 24 * 60 * 60 * 1000 // 24小时
      },
      ...config.outputs
    }

    // 监听网络状态
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true })
      window.addEventListener('offline', () => { this.isOnline = false })
    }

    // 启动HTTP批处理定时器
    if (this.outputs.http?.enabled) {
      this.startFlushTimer()
    }
  }

  /**
   * LogLayer 调用此方法发送日志
   */
  shipToLogger(params: LogLayerTransportParams): any[] {
    const { logLevel, messages, data } = params
    const timestamp = Date.now()

    // 使用统一的消息序列化工具
    const message = serializeMessages(messages)

    // 构造统一的日志对象
    const logEntry = {
      level: logLevel,
      message,
      data,
      timestamp
    }

    // 发送到各个输出
    if (this.outputs.console?.enabled) {
      this.sendToConsole(logEntry)
    }

    if (this.outputs.http?.enabled) {
      this.sendToHttp(logEntry)
    }

    if (this.outputs.localStorage?.enabled) {
      this.sendToLocalStorage(logEntry)
    }

    return messages
  }

  /**
   * 发送到浏览器控制台
   */
  private sendToConsole(logEntry: any) {
    const { level, message, data } = logEntry
    const consoleMethod = this.getConsoleMethod(level)
    
    if (this.outputs.console?.colors && data) {
      console[consoleMethod](`%c${message}`, this.getConsoleStyle(level), data)
    } else if (data) {
      console[consoleMethod](message, data)
    } else {
      console[consoleMethod](message)
    }
  }

  /**
   * 发送到HTTP端点（批处理）
   */
  private sendToHttp(logEntry: any) {
    const httpConfig = this.outputs.http!
    
    // 如果只记录错误且当前不是错误级别，跳过
    if (httpConfig.onlyErrors && !['error', 'fatal'].includes(logEntry.level)) {
      return
    }

    // 添加到缓冲区
    this.httpBuffer.push(logEntry)

    // 如果达到批处理大小，立即发送
    if (this.httpBuffer.length >= (httpConfig.batchSize || 10)) {
      this.flushHttpBuffer()
    }
  }

  /**
   * 发送到 localStorage
   */
  private sendToLocalStorage(logEntry: any) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const config = this.outputs.localStorage!
    const key = config.key || 'app-logs'
    
    try {
      // 获取现有日志
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]')
      
      // 添加新日志
      existingLogs.push(logEntry)
      
      // 限制数量
      const maxEntries = config.maxEntries || 100
      if (existingLogs.length > maxEntries) {
        existingLogs.splice(0, existingLogs.length - maxEntries)
      }
      
      // 保存回 localStorage
      localStorage.setItem(key, JSON.stringify(existingLogs))
    } catch (error) {
      // localStorage 可能已满，静默失败
      console.warn('Failed to save log to localStorage:', error)
    }
  }

  /**
   * 批量发送HTTP缓冲区
   */
  private async flushHttpBuffer() {
    if (this.httpBuffer.length === 0 || !this.isOnline) {
      return
    }

    const httpConfig = this.outputs.http!
    const logsToSend = [...this.httpBuffer]
    this.httpBuffer = []

    try {
      const response = await fetch(httpConfig.endpoint || '/api/logs', {
        method: httpConfig.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...httpConfig.headers
        },
        body: JSON.stringify({ logs: logsToSend })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      // 发送失败，可以考虑重试逻辑
      console.warn('Failed to send logs to server:', error)
      
      // 简单的重试：放回缓冲区（实际实现可以更复杂）
      if (httpConfig.retryAttempts && httpConfig.retryAttempts > 0) {
        this.httpBuffer.unshift(...logsToSend.slice(0, 5)) // 只重试前5条
      }
    }
  }

  /**
   * 启动定时刷新器
   */
  private startFlushTimer() {
    const interval = this.outputs.http?.flushInterval || 5000
    
    this.flushTimer = setInterval(() => {
      this.flushHttpBuffer()
    }, interval)
  }

  /**
   * 获取对应的 console 方法
   */
  private getConsoleMethod(level: LogLevelType): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'error'
      case 'warn':
        return 'warn'
      case 'info':
        return 'info'
      case 'debug':
      case 'trace':
      default:
        return 'log'
    }
  }

  /**
   * 获取控制台样式
   */
  private getConsoleStyle(level: LogLevelType): string {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'color: #ff6b6b; font-weight: bold;'
      case 'warn':
        return 'color: #ffa500; font-weight: bold;'
      case 'info':
        return 'color: #4ecdc4; font-weight: bold;'
      case 'debug':
        return 'color: #95a5a6;'
      case 'trace':
        return 'color: #bdc3c7;'
      default:
        return ''
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    // 最后一次刷新
    this.flushHttpBuffer()
  }
}