/**
 * loglayer-support 主入口
 *
 * 提供新的用户友好 API 来创建基于输出手段的日志系统
 * 完全按照 docs/practical-config.md 和 docs/implementation-strategy.md 设计
 */

// =============================================================================
// 公共类型导出（用户需要的类型）
// =============================================================================
export type {
  // 基础类型
  LogLevel,
  LogMetadata,
  EnvironmentInfo,

  // 配置类型
  LoggerConfig,
  ServerOutput,
  ClientOutput,
  ServerOutputConfig,
  ClientOutputConfig,
} from './core';

// =============================================================================
// 核心API导出
// =============================================================================

// 导入核心功能
import {
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory,
} from './factory';
import {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment,
} from './config';
import { detectEnvironment } from './core';
// wrapper 模块已移除，相关功能需要重新实现
import { presets } from './config';

// 核心创建函数
export {
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory,
};

// 配置创建函数
export {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment,
};

// 预设配置
export { presets };

// 实用工具函数
export {
  detectEnvironment,
};

// =============================================================================
// 框架预设导出
// =============================================================================

// 导入框架预设
import * as frameworks from './frameworks';

// 导出框架预设
export { frameworks };

// 便捷访问框架预设 - 重新导出
export const createBrowserLogger = frameworks.createBrowserLogger;
export const createBrowserLoggerSync = frameworks.createBrowserLoggerSync;
export const createServerLogger = frameworks.createServerLogger;
export const createServerLoggerManager = frameworks.createServerLoggerManager;
export const createNextjsServerLogger = frameworks.createNextjsServerLogger;
export const createExpressServerLogger = frameworks.createExpressServerLogger;
export const createLogReceiver = frameworks.createLogReceiver;
export const createNextjsLogReceiver = frameworks.createNextjsLogReceiver;
export const createExpressLogReceiver = frameworks.createExpressLogReceiver;
export const browser = frameworks.browser;
export const server = frameworks.server;
export const receiver = frameworks.receiver;

// 导出框架相关类型
export type {
  // 浏览器端类型
  BrowserLoggerConfig,
  BrowserLoggerOptions,
  IBrowserLogger,
  BrowserLogData,
  BrowserLogLevel,
  ConsoleOutputConfig,
  LocalStorageOutputConfig,
  HttpOutputConfig,
  IndexedDBOutputConfig,

  // 服务端类型
  ServerLoggerConfig,
  ServerLoggerOptions,
  ServerLoggerInstance,
  ServerLoggerManager,
  ModuleLogger,
  ModuleConfig,
  ServerEnvironment,
  PathConfig,
  InitializationConfig,
  PerformanceConfig,
  HealthCheckConfig,

  // 接收器类型
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
  LogReceiverPlugin,
} from './frameworks';

// =============================================================================
// 使用说明
// =============================================================================
// 注意：此库采用显式初始化设计，确保日志完整性
// 请使用 createLogger() 或 createLoggerSync() 创建 logger 实例
