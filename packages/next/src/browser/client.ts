/**
 * @yai-loglayer/next 客户端专用导出
 */

// Browser端日志器
export {
  createAutoBrowserLogger,
  createNextjsBrowserLogger,
  type NextjsBrowserConfig,
} from './nextjs-browser';

// React组件和Hooks
export {
  LoggerProvider,
  useComponentLogger,
  useLogger,
  useLogging,
  usePerformanceLogger,
  type LoggerContextValue,
} from '../react';

// 核心类型
export type { LogLevel, LogMetadata, LoggerConfig } from '@yai-loglayer/core';

// 工具函数
export { detectEnvironment, isBrowser, isServer, type EnvironmentInfo } from '../utils';
