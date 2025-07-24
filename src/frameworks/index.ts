/**
 * 框架适配层 - 统一导出
 * 
 * 提供针对不同框架和环境的开箱即用预设函数：
 * - createBrowserLogger: 浏览器端日志器
 * - createServerLogger: Node.js/服务端日志器  
 * - createLogReceiver: 通用日志接收器
 */

// 浏览器端预设
export { createBrowserLogger } from './browser'
export type { BrowserLoggerConfig, BrowserLoggerOptions } from './browser'

// 服务端预设
export { createServerLogger } from './server'
export type { ServerLoggerConfig, ServerLoggerOptions } from './server'

// 日志接收器预设
export { createLogReceiver } from './receiver'
export type { LogReceiverConfig, LogReceiverOptions } from './receiver'

// Next.js 特定预设（基于上述预设的组合）
export { createNextjsLoggerSync, createNextjsLoggerAsync } from './nextjs'
export type { NextjsLoggerConfig } from './nextjs'
