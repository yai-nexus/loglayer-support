/**
 * 浏览器端日志器预设
 *
 * 基于 examples/nextjs/lib/client-logger.ts 重构而来，
 * 提供开箱即用的浏览器端日志解决方案
 */

import type { LogLayer } from 'loglayer'
import type { LogLevel, LogMetadata, ClientOutput } from '../core'

// ==================== 核心类型定义 ====================

/**
 * 日志数据结构
 */
export interface BrowserLogData {
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

/**
 * 日志级别枚举
 */
export type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志级别优先级映射
 */
export const LOG_LEVEL_PRIORITY: Record<BrowserLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// ==================== 输出器配置 ====================

/**
 * 控制台输出配置
 */
export interface ConsoleOutputConfig {
  enabled: boolean
  /** 是否使用折叠分组显示 */
  groupCollapsed?: boolean
  /** 是否启用彩色显示 */
  colorized?: boolean
  /** 自定义颜色配置 */
  colors?: {
    debug?: string
    info?: string
    warn?: string
    error?: string
  }
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 是否显示元数据表格 */
  showMetadataTable?: boolean
}

/**
 * 本地存储输出配置
 */
export interface LocalStorageOutputConfig {
  enabled: boolean
  /** 存储键名 */
  key?: string
  /** 最大存储条数 */
  maxEntries?: number
  /** 是否启用数据压缩 */
  compress?: boolean
  /** 存储级别过滤 */
  levelFilter?: BrowserLogLevel[]
}

/**
 * HTTP 输出配置
 */
export interface HttpOutputConfig {
  enabled: boolean
  /** 服务端接收端点 */
  endpoint?: string
  /** HTTP 方法 */
  method?: 'POST' | 'PUT'
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 批量发送大小 */
  batchSize?: number
  /** 刷新间隔 (毫秒) */
  flushInterval?: number
  /** 重试次数 */
  retryAttempts?: number
  /** 重试延迟策略 */
  retryDelay?: 'linear' | 'exponential'
  /** 基础重试延迟 (毫秒) */
  baseRetryDelay?: number
  /** 仅发送错误级别 */
  onlyErrors?: boolean
  /** 级别过滤 */
  levelFilter?: BrowserLogLevel[]
  /** 发送前数据转换 */
  transform?: (data: BrowserLogData) => any
  /** 发送成功回调 */
  onSuccess?: (data: BrowserLogData[]) => void
  /** 发送失败回调 */
  onError?: (error: Error, data: BrowserLogData[]) => void
}

/**
 * IndexedDB 输出配置
 */
export interface IndexedDBOutputConfig {
  enabled: boolean
  /** 数据库名称 */
  dbName?: string
  /** 存储对象名称 */
  storeName?: string
  /** 数据库版本 */
  version?: number
  /** 最大存储条数 */
  maxEntries?: number
  /** 自动清理策略 */
  cleanupStrategy?: 'fifo' | 'lru' | 'ttl'
  /** TTL 过期时间 (毫秒) */
  ttl?: number
  /** 级别过滤 */
  levelFilter?: BrowserLogLevel[]
}

// ==================== 主配置接口 ====================

/**
 * 浏览器日志器配置
 */
export interface BrowserLoggerConfig {
  /** 日志级别 */
  level?: BrowserLogLevel

  /** 自定义会话 ID */
  sessionId?: string

  /** 输出器配置 */
  outputs?: {
    console?: boolean | ConsoleOutputConfig
    localStorage?: boolean | LocalStorageOutputConfig
    http?: boolean | HttpOutputConfig
    indexedDB?: boolean | IndexedDBOutputConfig
  }

  /** 上下文配置 */
  context?: {
    /** 是否包含 User Agent */
    includeUserAgent?: boolean
    /** 是否包含当前 URL */
    includeUrl?: boolean
    /** 是否包含时间戳 */
    includeTimestamp?: boolean
    /** 自定义上下文字段 */
    customFields?: Record<string, () => any>
  }

  /** 性能配置 */
  performance?: {
    /** 是否启用性能监控 */
    enablePerformanceLogging?: boolean
    /** 性能日志级别 */
    performanceLogLevel?: BrowserLogLevel
    /** 是否自动记录页面加载性能 */
    autoLogPageLoad?: boolean
    /** 是否自动记录资源加载性能 */
    autoLogResourceLoad?: boolean
  }

  /** 错误处理配置 */
  errorHandling?: {
    /** 是否自动捕获全局错误 */
    captureGlobalErrors?: boolean
    /** 是否自动捕获未处理的 Promise 拒绝 */
    captureUnhandledRejections?: boolean
    /** 错误过滤函数 */
    errorFilter?: (error: Error) => boolean
  }

  /** 采样配置 */
  sampling?: {
    /** 采样率 (0-1) */
    rate?: number
    /** 按级别采样 */
    levelRates?: Partial<Record<BrowserLogLevel, number>>
  }
}

/**
 * 浏览器日志器选项
 */
export interface BrowserLoggerOptions {
  /** 是否立即初始化 */
  immediate?: boolean
  /** 初始化超时时间 */
  initTimeout?: number
  /** 是否在开发模式下启用详细日志 */
  verbose?: boolean
}

// ==================== 日志器接口 ====================

/**
 * 浏览器日志器实例接口
 */
export interface IBrowserLogger {
  // 基础日志方法
  debug(message: string, metadata?: LogMetadata): void
  info(message: string, metadata?: LogMetadata): void
  warn(message: string, metadata?: LogMetadata): void
  error(message: string, metadata?: LogMetadata): void

  // 专用日志方法
  logError(error: Error, metadata?: LogMetadata, customMessage?: string): void
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void

  // 上下文管理
  child(context: LogMetadata): IBrowserLogger
  withContext(context: LogMetadata): IBrowserLogger

  // 会话管理
  getSessionId(): string
  setSessionId(sessionId: string): void

  // 输出器管理
  addOutput(output: LogOutput): void
  removeOutput(output: LogOutput): void

  // 控制方法
  flush(): Promise<void>
  destroy(): Promise<void>

  // 状态查询
  isReady(): boolean
  getConfig(): BrowserLoggerConfig
}

/**
 * 日志输出器接口
 */
export interface LogOutput {
  name: string
  write(data: BrowserLogData): Promise<void> | void
  flush?(): Promise<void>
  destroy?(): Promise<void>
}

// ==================== 工具函数 ====================

/**
 * 将 BrowserLoggerConfig 转换为 ClientOutput[]
 */
function convertBrowserConfigToClientOutputs(config: BrowserLoggerConfig): ClientOutput[] {
  const outputs: ClientOutput[] = []
  
  if (!config.outputs) {
    // 默认只启用控制台输出
    return [{ type: 'console' }]
  }
  
  // 转换 console 配置
  if (config.outputs.console) {
    if (typeof config.outputs.console === 'boolean') {
      outputs.push({ type: 'console' })
    } else {
      outputs.push({ 
        type: 'console', 
        config: config.outputs.console as any 
      })
    }
  }
  
  // 转换 localStorage 配置
  if (config.outputs.localStorage) {
    if (typeof config.outputs.localStorage === 'boolean') {
      outputs.push({ type: 'localstorage' })
    } else {
      outputs.push({ 
        type: 'localstorage', 
        config: config.outputs.localStorage as any
      })
    }
  }
  
  // 转换 http 配置
  if (config.outputs.http) {
    if (typeof config.outputs.http === 'boolean') {
      outputs.push({ type: 'http' })
    } else {
      outputs.push({ 
        type: 'http', 
        config: config.outputs.http as any
      })
    }
  }
  
  return outputs.length > 0 ? outputs : [{ type: 'console' }]
}

// ==================== 工厂函数 ====================

/**
 * 创建浏览器端日志器
 *
 * @param config 日志器配置
 * @param options 创建选项
 * @returns 日志器实例
 */
export async function createBrowserLogger(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): Promise<LogLayer> {
  const { LogLayer } = await import('loglayer')
  const { createBrowserLogLayer } = await import('../transports/browser-factory')
  
  // 如果没有提供配置，使用默认配置
  if (!config) {
    const { createDevelopmentBrowserLogger } = await import('../transports/browser-factory')
    return createDevelopmentBrowserLogger()
  }

  // 转换配置格式并使用新的 browser factory 创建 LogLayer 实例
  const clientOutputs = convertBrowserConfigToClientOutputs(config)
  return createBrowserLogLayer(clientOutputs)
}

/**
 * 创建浏览器端日志器 (同步版本)
 *
 * @param config 日志器配置
 * @param options 创建选项
 * @returns 日志器实例
 */
export function createBrowserLoggerSync(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): LogLayer {
  const { LogLayer } = require('loglayer')
  const { createBrowserLogLayer } = require('../transports/browser-factory')
  
  // 如果没有提供配置，使用默认配置
  if (!config || !config.outputs) {
    const { createDevelopmentBrowserLogger } = require('../transports/browser-factory')
    return createDevelopmentBrowserLogger()
  }

  // 转换配置格式并使用新的 browser factory 创建 LogLayer 实例
  const clientOutputs = convertBrowserConfigToClientOutputs(config)
  return createBrowserLogLayer(clientOutputs)
}
