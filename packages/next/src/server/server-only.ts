/**
 * @yai-loglayer/next 服务端专用导出
 */

// Server端日志组件
export {
  createAutoServerLogger,
  createNextjsServerLogger,
  logger,
  type NextjsServerConfig,
} from './nextjs-server';

// Log Receiver
export {
  createNextjsLogReceiver,
  type LogReceiverConfig,
  type LogReceiverHandler,
  type NextjsLogReceiverConfig,
} from '../receiver';

// 核心类型
export type { LogLevel, LogMetadata, LoggerConfig } from '@yai-loglayer/core';

// 工具函数
export { detectEnvironment, isBrowser, isServer, type EnvironmentInfo } from '../utils';
