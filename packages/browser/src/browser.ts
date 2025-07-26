/**
 * 浏览器端日志器预设
 * 提供基于 LogLayer 的浏览器端日志解决方案
 */

import { LogLayer } from 'loglayer'
import type { LogMetadata, ClientOutput } from '@yai-loglayer/core'
import { createBrowserLogLayer, createDevelopmentBrowserLogger } from './browser-factory'

// ==================== 核心类型定义 ====================

/**
 * 浏览器日志级别
 */
export type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 控制台输出配置
 */
export interface ConsoleOutputConfig {
  enabled: boolean
  colorized?: boolean
  groupCollapsed?: boolean
}

/**
 * 本地存储输出配置
 */
export interface LocalStorageOutputConfig {
  enabled: boolean
  key?: string
  maxEntries?: number
}

/**
 * HTTP 输出配置
 */
export interface HttpOutputConfig {
  enabled: boolean
  endpoint?: string
  method?: 'POST' | 'PUT'
  headers?: Record<string, string>
  batchSize?: number
  retryAttempts?: number
  retryDelay?: number
}

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
  }
  
  /** 上下文配置 */
  context?: {
    includeUserAgent?: boolean
    includeUrl?: boolean
    includeTimestamp?: boolean
    customFields?: Record<string, () => any>
  }
  
  /** 错误处理配置 */
  errorHandling?: {
    captureGlobalErrors?: boolean
    captureUnhandledRejections?: boolean
    errorFilter?: (error: Error) => boolean
  }
  
  /** 性能配置 */
  performance?: {
    enablePerformanceLogging?: boolean
    performanceLogLevel?: BrowserLogLevel
    autoLogPageLoad?: boolean
    autoLogResourceLoad?: boolean
  }
  
  /** 采样配置 */
  sampling?: {
    rate?: number
    levelRates?: Partial<Record<BrowserLogLevel, number>>
  }
}

/**
 * 浏览器日志器选项
 */
export interface BrowserLoggerOptions {
  immediate?: boolean
  initTimeout?: number
  verbose?: boolean
}

// ==================== 工具函数 ====================

/**
 * 将 BrowserLoggerConfig 转换为 ClientOutput[]
 */
function convertBrowserConfigToClientOutputs(config: BrowserLoggerConfig): ClientOutput[] {
  const outputs: ClientOutput[] = []
  
  if (!config.outputs) {
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
 */
export async function createBrowserLogger(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): Promise<LogLayer> {
  if (!config) {
    return createDevelopmentBrowserLogger()
  }

  const clientOutputs = convertBrowserConfigToClientOutputs(config)
  return createBrowserLogLayer(clientOutputs)
}

/**
 * 创建浏览器端日志器 (同步版本)
 */
export function createBrowserLoggerSync(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): LogLayer {
  if (!config || !config.outputs) {
    return createDevelopmentBrowserLogger()
  }

  const clientOutputs = convertBrowserConfigToClientOutputs(config)
  return createBrowserLogLayer(clientOutputs)
}