/**
 * 浏览器端日志器模块统一导出
 */

// 主要类
export { BrowserLogger } from './browser-logger'
export { SessionManager } from './session-manager'
export { LogDataBuilder } from './log-data-builder'

// 输出器
export * from './outputs'

// 工具函数
export * from './utils'

// 类型定义（从父级重新导出）
export type {
  BrowserLoggerConfig,
  BrowserLoggerOptions,
  IBrowserLogger,
  LogOutput,
  BrowserLogData,
  BrowserLogLevel,
  ConsoleOutputConfig,
  LocalStorageOutputConfig,
  HttpOutputConfig,
  IndexedDBOutputConfig
} from '../browser'
