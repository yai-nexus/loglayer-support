/**
 * 日志接收器模块统一导出
 */

// 主要类
export { LogReceiver } from './log-receiver'
export { LogReceiverHandlerImpl } from './handler'
export { LogDataValidator } from './validator'
export { LogProcessor } from './processor'

// 适配器
export * from './adapters'

// 类型定义（从父级重新导出）
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
} from '../receiver'
