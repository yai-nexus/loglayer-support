/**
 * 共享类型定义 - 仅类型，无运行时代码
 * 
 * 这个文件只包含类型定义，可以安全地在 client 和 server 中导入
 */

// 重新导出核心类型
export type { LogLevel, LogMetadata } from '@yai-loglayer/core';
export type { BrowserLogLevel } from '@yai-loglayer/browser';
export type { ServerEnvironment } from '@yai-loglayer/server';

/**
 * Next.js 日志配置接口
 */
export interface NextjsLogConfig {
  appName: string;
  environment?: 'development' | 'test' | 'staging' | 'production';
  level?: 'debug' | 'info' | 'warn' | 'error';
  
  // 统一输出配置
  outputs?: {
    console?: boolean;
    http?: {
      enabled?: boolean;
      endpoint?: string;
      batchSize?: number;
      retryAttempts?: number;
    };
    file?: {
      enabled?: boolean;
      path?: string;
      maxSize?: string;
      maxFiles?: number;
    };
    sls?: {
      enabled?: boolean;
      project?: string;
      logstore?: string;
      endpoint?: string;
    };
    localStorage?: {
      enabled?: boolean;
      key?: string;
      maxEntries?: number;
      ttl?: number;
    };
  };
  
  // 高级配置
  advanced?: {
    enablePerformanceTracking?: boolean;
    enableErrorBoundary?: boolean;
    enableDevTools?: boolean;
    enableContextEnrichment?: boolean;
  };
}

/**
 * 客户端特定配置
 */
export interface ClientLogConfig extends NextjsLogConfig {
  // 客户端特有配置
  httpEndpoint?: string;
  enableLocalStorage?: boolean;
  enableConsole?: boolean;
}

/**
 * 服务端特定配置
 */
export interface ServerLogConfig extends NextjsLogConfig {
  // 服务端特有配置
  enableFileOutput?: boolean;
  enableSlsOutput?: boolean;
  logDirectory?: string;
}

/**
 * Logger 实例接口
 */
export interface LoggerInstance {
  info(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  withContext(context: Record<string, any>): LoggerInstance;
  forModule(moduleName: string): LoggerInstance;
}

/**
 * 客户端 Logger 实例接口
 */
export interface ClientLoggerInstance extends LoggerInstance {
  // 客户端特有方法
  flush(): Promise<void>;
  getStoredLogs(): any[];
  clearStoredLogs(): void;
}

/**
 * 服务端 Logger 实例接口
 */
export interface ServerLoggerInstance extends LoggerInstance {
  // 服务端特有方法
  createReceiver(): any;
  getLogFiles(): string[];
  rotateLogs(): Promise<void>;
}

/**
 * React Context 值类型
 */
export interface LoggerContextValue {
  logger: ClientLoggerInstance | null;
  isReady: boolean;
  error: string | null;
}

/**
 * 预设配置类型
 */
export type PresetType = 'development' | 'production' | 'testing' | 'full';

/**
 * 环境信息接口
 */
export interface EnvironmentInfo {
  isServer: boolean;
  isBrowser: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  nodeEnv: string;
  platform: 'server' | 'browser';
}
