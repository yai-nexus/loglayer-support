/**
 * 框架适配层统一导出
 *
 * 这个模块提供了针对不同框架的日志器预设，
 * 包括浏览器端、服务端和日志接收器的完整解决方案
 */

// ==================== 浏览器端日志器 ====================

// 主要工厂函数
export {
  createBrowserLogger,
  createBrowserLoggerSync
} from './browser'

// 浏览器端类型定义
export type {
  BrowserLoggerConfig,
  BrowserLoggerOptions,
  IBrowserLogger,
  BrowserLogData,
  BrowserLogLevel,
  ConsoleOutputConfig,
  LocalStorageOutputConfig,
  HttpOutputConfig,
  IndexedDBOutputConfig
} from './browser'

// ==================== 服务端日志器 ====================

// 主要工厂函数
export {
  createServerLogger,
  createServerLoggerManager,
  createNextjsServerLogger,
  createExpressServerLogger
} from './server'

// 服务端类型定义
export type {
  ServerLoggerConfig,
  ServerLoggerOptions,
  ServerLoggerInstance,
  ServerLoggerManager,
  ModuleLogger,
  ModuleConfig,
  ServerEnvironment,
  ServerOutputConfig,
  PathConfig,
  InitializationConfig,
  PerformanceConfig,
  HealthCheckConfig
} from './server'

// ==================== 日志接收器 ====================

// 主要工厂函数
export {
  createLogReceiver,
  createNextjsLogReceiver,
  createExpressLogReceiver
} from './receiver'

// 接收器类型定义
export type {
  LogReceiverConfig,
  LogReceiverOptions,
  LogReceiverHandler,
  ILogReceiver,
  ClientLogData,
  ClientInfo,
  ValidationResult,
  ProcessResult,
  ResponseData,
  FrameworkAdapter,
  ValidationConfig,
  ProcessingConfig,
  SecurityConfig,
  ResponseConfig,
  LogReceiverPlugin
} from './receiver'

// ==================== 便捷导出 ====================

// 导入所有函数以便在便捷导出中使用
import {
  createBrowserLogger as _createBrowserLogger,
  createBrowserLoggerSync as _createBrowserLoggerSync
} from './browser'
import {
  createServerLogger as _createServerLogger,
  createServerLoggerManager as _createServerLoggerManager,
  createNextjsServerLogger as _createNextjsServerLogger,
  createExpressServerLogger as _createExpressServerLogger
} from './server'
import {
  createLogReceiver as _createLogReceiver,
  createNextjsLogReceiver as _createNextjsLogReceiver,
  createExpressLogReceiver as _createExpressLogReceiver
} from './receiver'

/**
 * 浏览器端预设
 */
export const browser = {
  createLogger: _createBrowserLogger,
  createLoggerSync: _createBrowserLoggerSync
}

/**
 * 服务端预设
 */
export const server = {
  createLogger: _createServerLogger,
  createManager: _createServerLoggerManager,
  nextjs: _createNextjsServerLogger,
  express: _createExpressServerLogger
}

/**
 * 日志接收器预设
 */
export const receiver = {
  create: _createLogReceiver,
  nextjs: _createNextjsLogReceiver,
  express: _createExpressLogReceiver
}

// ==================== 默认导出 ====================

/**
 * 默认导出 - 包含所有主要功能
 */
export default {
  browser,
  server,
  receiver,

  // 直接访问工厂函数
  createBrowserLogger: _createBrowserLogger,
  createServerLogger: _createServerLogger,
  createLogReceiver: _createLogReceiver,

  // 框架特定预设
  nextjs: {
    server: _createNextjsServerLogger,
    receiver: _createNextjsLogReceiver
  },

  express: {
    server: _createExpressServerLogger,
    receiver: _createExpressLogReceiver
  }
}
