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

/**
 * 浏览器端预设
 */
export const browser = {
  createLogger: createBrowserLogger,
  createLoggerSync: createBrowserLoggerSync
}

/**
 * 服务端预设
 */
export const server = {
  createLogger: createServerLogger,
  createManager: createServerLoggerManager,
  nextjs: createNextjsServerLogger,
  express: createExpressServerLogger
}

/**
 * 日志接收器预设
 */
export const receiver = {
  create: createLogReceiver,
  nextjs: createNextjsLogReceiver,
  express: createExpressLogReceiver
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
  createBrowserLogger,
  createServerLogger,
  createLogReceiver,

  // 框架特定预设
  nextjs: {
    server: createNextjsServerLogger,
    receiver: createNextjsLogReceiver
  },

  express: {
    server: createExpressServerLogger,
    receiver: createExpressLogReceiver
  }
}
