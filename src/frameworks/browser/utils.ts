/**
 * 浏览器端日志器工具函数
 */

import type { BrowserLogLevel, BrowserLogData } from '../browser'

/**
 * 日志级别优先级映射
 */
export const LOG_LEVEL_PRIORITY: Record<BrowserLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

/**
 * 检查日志级别是否应该被记录
 */
export function shouldLog(messageLevel: BrowserLogLevel, configLevel: BrowserLogLevel): boolean {
  return LOG_LEVEL_PRIORITY[messageLevel] >= LOG_LEVEL_PRIORITY[configLevel]
}

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
}

/**
 * 安全地获取会话存储
 */
export function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null
  } catch {
    return null
  }
}

/**
 * 安全地获取本地存储
 */
export function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

/**
 * 安全地获取导航器信息
 */
export function getUserAgent(): string | undefined {
  try {
    return typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  } catch {
    return undefined
  }
}

/**
 * 安全地获取当前 URL
 */
export function getCurrentUrl(): string | undefined {
  try {
    return typeof window !== 'undefined' ? window.location.href : undefined
  } catch {
    return undefined
  }
}

/**
 * 序列化错误对象
 */
export function serializeError(error: Error): { name: string; message: string; stack?: string } {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  }
}

/**
 * 深度合并对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue)
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue
      }
    }
  }
  
  return result
}

/**
 * 采样决策
 */
export function shouldSample(rate: number): boolean {
  return Math.random() < rate
}

/**
 * 计算重试延迟
 */
export function calculateRetryDelay(
  attempt: number,
  strategy: 'linear' | 'exponential',
  baseDelay: number
): number {
  switch (strategy) {
    case 'linear':
      return baseDelay * attempt
    case 'exponential':
      return baseDelay * Math.pow(2, attempt - 1)
    default:
      return baseDelay
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 安全的 JSON 序列化
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // 处理循环引用
      if (typeof value === 'object' && value !== null) {
        if (value instanceof Error) {
          return serializeError(value)
        }
        // 可以在这里添加更多的特殊对象处理
      }
      return value
    })
  } catch (error) {
    return JSON.stringify({ error: 'Failed to serialize object', message: String(error) })
  }
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * 检查是否在浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 检查是否支持 IndexedDB
 */
export function supportsIndexedDB(): boolean {
  return isBrowser() && 'indexedDB' in window
}

/**
 * 检查是否支持 Web Workers
 */
export function supportsWebWorkers(): boolean {
  return isBrowser() && 'Worker' in window
}

/**
 * 获取性能时间戳
 */
export function getPerformanceNow(): number {
  if (isBrowser() && 'performance' in window && 'now' in performance) {
    return performance.now()
  }
  return Date.now()
}
