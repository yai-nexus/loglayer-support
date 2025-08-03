/**
 * @yai-loglayer/next - Next.js 统一日志组件
 *
 * 客户端安全的导出，避免在浏览器构建时引入服务端代码
 * 服务端专用功能请从 '@yai-loglayer/next/server-only' 导入
 */

// =============================================================================
// 类型导出 (客户端安全)
// =============================================================================

// 重新导出@yai-loglayer/server的核心类型
export type {
  ServerEnvironment,
  ServerLoggerInstance,
  ServerOutputConfig,
} from '@yai-loglayer/server';

// =============================================================================
// Browser端日志组件 (基于main分支@yai-loglayer/browser)
// =============================================================================

export {
  createAutoBrowserLogger,
  // Next.js浏览器端日志器
  createNextjsBrowserLogger,
  type NextjsBrowserConfig,
} from './browser';

// 重新导出@yai-loglayer/browser的核心类型
export type {
  BrowserLogLevel,
  BrowserLoggerConfig,
  BrowserLoggerOptions,
  ConsoleOutputConfig,
  HttpOutputConfig,
  LocalStorageOutputConfig,
} from '@yai-loglayer/browser';

// =============================================================================
// 类型导出 (日志接收器相关，客户端安全)
// =============================================================================

// 重新导出@yai-loglayer/receiver的核心类型
export type { LogReceiverConfig } from '@yai-loglayer/receiver';

// =============================================================================
// Next.js 统一接口类型 (客户端安全)
// =============================================================================

// 重新导出类型（不导出函数，避免客户端构建问题）
export type { NextjsLoggerConfig, NextjsLoggerPair } from './nextjs';

export {
  // React组件和Hooks
  LoggerProvider,
  useComponentLogger,
  useLogger,
  useLogging,
  usePerformanceLogger,
  type LoggerContextValue,
} from './react';

// =============================================================================
// 工具和类型
// =============================================================================

export {
  // 通用类型
  type LogLevel,
  type LogMetadata,
  type LoggerConfig,
} from '@yai-loglayer/core';

export {
  // 环境检测
  detectEnvironment,
  isBrowser,
  isServer,
  type EnvironmentInfo,
} from './utils';
