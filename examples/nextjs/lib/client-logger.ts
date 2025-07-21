'use client'

/**
 * 客户端专用日志功能
 * 使用轻量级实现避免导入 Node.js 模块
 */

import type { LogLevel, LogMetadata } from 'loglayer-support'

interface LogData {
  level: string
  message: string
  metadata?: LogMetadata
  timestamp: string
  userAgent?: string
  url?: string
  sessionId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class ClientLogger {
  private sessionId: string

  constructor() {
    this.sessionId = this.getSessionId()
  }

  private getSessionId(): string {
    if (typeof sessionStorage === 'undefined') {
      return 'sess_' + Math.random().toString(36).substr(2, 9)
    }
    
    let sessionId = sessionStorage.getItem('log-session-id')
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('log-session-id', sessionId)
    }
    return sessionId
  }

  private createLogData(level: string, message: string, metadata: LogMetadata = {}, error?: Error): LogData {
    const logData: LogData = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId
    }

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    return logData
  }

  private log(level: string, message: string, metadata: LogMetadata = {}, error?: Error) {
    const logData = this.createLogData(level, message, metadata, error)
    
    // 浏览器控制台输出
    this.writeToConsole(logData, error)
    
    // 保存到本地存储
    this.saveToLocalStorage(logData)
    
    // 发送到服务端（仅生产环境的错误级别）
    if (level === 'error' && process.env.NODE_ENV === 'production') {
      this.sendToServer(logData)
    }
  }

  private writeToConsole(logData: LogData, error?: Error) {
    const style = this.getConsoleStyle(logData.level)
    const timestamp = logData.timestamp
    const hasMetadata = Object.keys(logData.metadata || {}).length > 0
    
    if (hasMetadata || error) {
      console.groupCollapsed(`%c${timestamp} [${logData.level.toUpperCase()}] ${logData.message}`, style)
      if (hasMetadata) {
        console.table(logData.metadata)
      }
      if (error) {
        console.error('Error:', error)
      }
      console.groupEnd()
    } else {
      console.log(`%c${timestamp} [${logData.level.toUpperCase()}] ${logData.message}`, style)
    }
  }

  private getConsoleStyle(level: string): string {
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3', 
      warn: 'color: #FF9800',
      error: 'color: #F44336'
    }
    return styles[level as keyof typeof styles] || ''
  }

  private saveToLocalStorage(logData: LogData) {
    try {
      if (typeof localStorage === 'undefined') return
      
      const logs = JSON.parse(localStorage.getItem('app-logs') || '[]')
      logs.push(logData)
      
      // 保持最大100条记录
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('app-logs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  private async sendToServer(logData: LogData) {
    try {
      await fetch('/api/client-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      })
    } catch (error) {
      console.warn('Failed to send log to server:', error)
    }
  }

  info(message: string, metadata: LogMetadata = {}) {
    this.log('info', message, metadata)
  }

  debug(message: string, metadata: LogMetadata = {}) {
    this.log('debug', message, metadata)
  }

  warn(message: string, metadata: LogMetadata = {}) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata: LogMetadata = {}) {
    this.log('error', message, metadata)
  }

  logError(error: Error, metadata: LogMetadata = {}, customMessage?: string) {
    const message = customMessage || error.message
    this.log('error', message, metadata, error)
  }

  logPerformance(operation: string, duration: number, metadata: LogMetadata = {}) {
    const perfData = {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration,
      timestamp: new Date().toISOString(),
      ...metadata
    }
    
    this.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, {
      performance: perfData,
      ...metadata
    })
  }

  // LogLayerWrapper 兼容接口
  forModule(moduleName: string) {
    // 客户端简化实现，返回同一个实例
    return this
  }

  forRequest(requestId: string) {
    // 客户端简化实现，返回同一个实例
    return this
  }
}

// 创建单例实例
export const clientLogger = new ClientLogger()

// 兼容性导出
export const logger = clientLogger
export const uiLogger = clientLogger
export const apiLogger = clientLogger