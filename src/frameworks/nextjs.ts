/**
 * Next.js 特定预设
 * 
 * 基于 browser.ts 和 server.ts 的组合，
 * 提供 Next.js 应用的完整日志解决方案
 */

import type { BrowserLoggerConfig } from './browser'
import type { ServerLoggerConfig } from './server'

// TODO: 将在后续任务中完善这些类型定义和实现
export interface NextjsLoggerConfig {
  // 客户端配置
  client?: BrowserLoggerConfig
  
  // 服务端配置  
  server?: ServerLoggerConfig
  
  // Next.js 特定配置
  nextjs?: {
    apiEndpoint?: string
    enableClientToServerLogging?: boolean
    sharedSessionId?: boolean
  }
}

// 同步版本 - 用于客户端组件
export function createNextjsLoggerSync(config?: NextjsLoggerConfig): any {
  throw new Error('createNextjsLoggerSync not implemented yet - will be implemented later')
}

// 异步版本 - 用于服务端组件和 API 路由
export function createNextjsLoggerAsync(config?: NextjsLoggerConfig): Promise<any> {
  throw new Error('createNextjsLoggerAsync not implemented yet - will be implemented later')
}
