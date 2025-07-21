/**
 * 类型定义
 *
 * 定义新的用户友好配置接口和内部实现类型
 */

import type { LogLayer } from 'loglayer';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志元数据
 */
export type LogMetadata = Record<string, unknown>;

/**
 * 增强 Logger 接口
 */
export interface IEnhancedLogger {
  // 基础日志方法
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;

  // 上下文绑定方法
  child(bindings: LogMetadata): IEnhancedLogger;
  forRequest(requestId: string, traceId?: string): IEnhancedLogger;
  forUser(userId: string): IEnhancedLogger;
  forModule(moduleName: string): IEnhancedLogger;

  // 增强方法
  logError(error: Error, context?: LogMetadata, message?: string): void;
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void;

  // 原始 logger 访问
  get raw(): LogLayer;
}

/**
 * 环境检测结果
 */
export interface EnvironmentInfo {
  isServer: boolean;
  isClient: boolean;
  environment: 'development' | 'production' | 'test';
}

// =============================================================================
// 新的用户配置接口（基于 docs/practical-config.md）
// =============================================================================

/**
 * 用户日志配置接口
 */
export interface LoggerConfig {
  // 1. 日志级别配置
  level: {
    default: LogLevel; // 全局默认级别
    loggers?: Record<string, LogLevel>; // 按 logger name 单独配置
  };

  // 2. 服务端输出配置
  server: {
    outputs: ServerOutput[]; // 多种输出手段
  };

  // 3. 客户端输出配置
  client: {
    outputs: ClientOutput[]; // 浏览器输出手段
  };
}

/**
 * 服务端输出配置
 */
export interface ServerOutput {
  type: 'stdout' | 'file' | 'sls' | 'http';
  level?: LogLevel; // 可选：这个输出的专用级别
  config?: ServerOutputConfig;
  // 格式自动绑定：
  // stdout → pretty (彩色易读)
  // file → pretty (易读的文本日志)
  // sls → structured (云服务优化)
  // http → json (标准接口)
}

/**
 * 服务端输出配置选项
 */
export interface ServerOutputConfig {
  // file 类型配置
  dir?: string; // 文件目录
  filename?: string; // 文件名
  maxSize?: string; // 轮转大小
  maxFiles?: number; // 保留文件数

  // sls 类型配置
  endpoint?: string; // SLS 端点
  project?: string; // 项目名
  logstore?: string; // 日志库
  accessKey?: string; // 访问密钥

  // http 类型配置
  url?: string; // HTTP 端点
  headers?: Record<string, string>; // 请求头

  // stdout 类型通常无需配置
}

/**
 * 客户端输出配置
 */
export interface ClientOutput {
  type: 'console' | 'http' | 'localstorage';
  level?: LogLevel; // 可选：这个输出的专用级别
  config?: ClientOutputConfig;
  // 格式自动绑定：
  // console → pretty (开发者工具友好)
  // http → json (服务器接口)
  // localstorage → json (结构化存储)
}

/**
 * 客户端输出配置选项
 */
export interface ClientOutputConfig {
  // console 类型：无需配置位置（固定输出到浏览器开发者工具）

  // http 类型：需要配置服务器端点
  endpoint?: string; // 服务器接收日志的端点
  bufferSize?: number; // 批量发送的缓冲区大小
  flushInterval?: number; // 发送间隔（毫秒）
  headers?: Record<string, string>; // 自定义请求头

  // localstorage 类型：需要配置存储 key
  key?: string; // localStorage 的 key
  maxEntries?: number; // 最大存储条数
  ttl?: number; // 过期时间（毫秒）
}

// =============================================================================
// 内部实现类型（基于 docs/implementation-strategy.md）
// =============================================================================

/**
 * 内部引擎类型
 */
export type ServerEngineType = 'pino' | 'winston' | 'core';
export type ClientEngineType = 'browser';

/**
 * 内部日志引擎接口
 */
export interface ILogger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

/**
 * 引擎选择策略
 */
export interface EngineStrategy {
  preferred: ServerEngineType;
  fallback: ServerEngineType;
  guaranteed: ServerEngineType;
}

/**
 * 格式映射配置
 */
export interface FormatMapping {
  format: 'pretty' | 'json' | 'structured';
  options: Record<string, unknown>;
}
