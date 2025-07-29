/**
 * SLS Transport 工具函数
 */

// 使用 LogLayer 原生类型，无需自定义 Log 接口
import type { LogLevelType } from '@loglayer/transport';
import type {
  SlsTransportConfig,
  SlsTransportInternalConfig,
  SlsLogItem,
  SlsLogContent,
  SlsFieldConfig,
  RetryConfig
} from './types';
import { hostname } from 'os';
import { networkInterfaces } from 'os';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getOrGenerateTraceId, getOrGenerateSpanId, traceContext } from './TraceIdGenerator';
import { OpenTelemetryIntegration } from './OpenTelemetryIntegration';

/**
 * 验证 SLS 配置参数
 */
export function validateSlsConfig(config: SlsTransportConfig): void {
  const requiredFields: (keyof SlsTransportConfig)[] = [
    'endpoint',
    'accessKeyId', 
    'accessKeySecret',
    'project',
    'logstore'
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`SLS Transport 配置缺少必需参数: ${field}`);
    }
  }

  // 验证 endpoint 格式（支持完整 URL 或域名格式）
  if (!config.endpoint.startsWith('http') && !config.endpoint.includes('.log.aliyuncs.com')) {
    throw new Error(`SLS Transport endpoint 必须是完整的 HTTP(S) URL 或阿里云 SLS 域名: ${config.endpoint}`);
  }

  // 验证数值参数
  if (config.batchSize && (config.batchSize < 1 || config.batchSize > 1000)) {
    throw new Error(`SLS Transport batchSize 必须在 1-1000 之间: ${config.batchSize}`);
  }

  if (config.flushInterval && (config.flushInterval < 1000 || config.flushInterval > 300000)) {
    throw new Error(`SLS Transport flushInterval 必须在 1000-300000ms 之间: ${config.flushInterval}`);
  }

  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    throw new Error(`SLS Transport maxRetries 必须在 0-10 之间: ${config.maxRetries}`);
  }
}

// 缓存系统信息，避免重复获取
let cachedHostname: string | null = null;
let cachedHostIP: string | null = null;
let cachedVersion: string | null = null;

/**
 * 获取主机名（缓存）
 */
export function getHostname(): string {
  if (cachedHostname === null) {
    try {
      cachedHostname = hostname();
    } catch (error) {
      cachedHostname = 'unknown';
    }
  }
  return cachedHostname;
}

/**
 * 获取本机IP地址（缓存）
 */
export function getLocalIP(): string {
  if (cachedHostIP === null) {
    try {
      const interfaces = networkInterfaces();

      // 优先获取非回环地址
      for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        if (iface) {
          for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
              cachedHostIP = alias.address;
              return cachedHostIP;
            }
          }
        }
      }

      // 如果没有找到外部IP，使用回环地址
      cachedHostIP = '127.0.0.1';
    } catch (error) {
      cachedHostIP = '127.0.0.1';
    }
  }
  return cachedHostIP;
}

/**
 * 获取应用版本（缓存）
 */
export function getAppVersion(): string {
  if (cachedVersion === null) {
    try {
      // 尝试从环境变量获取
      if (process.env.APP_VERSION) {
        cachedVersion = process.env.APP_VERSION;
      } else {
        // 尝试从package.json获取
        const packagePath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        cachedVersion = packageJson.version || 'unknown';
      }
    } catch (error) {
      cachedVersion = 'unknown';
    }
  }
  return cachedVersion;
}

/**
 * 获取环境标识
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || process.env.ENVIRONMENT || 'unknown';
}

/**
 * 根据logger名称或上下文推断日志分类
 */
export function inferCategory(loggerName?: string, context?: Record<string, unknown>): string {
  // 从上下文中推断
  if (context) {
    if (context.module) return String(context.module);
    if (context.category) return String(context.category);
    if (context.component) return String(context.component);
  }

  // 从logger名称推断
  if (loggerName) {
    if (loggerName.includes('api')) return 'api';
    if (loggerName.includes('db') || loggerName.includes('database')) return 'database';
    if (loggerName.includes('auth')) return 'auth';
    if (loggerName.includes('cache')) return 'cache';
    if (loggerName.includes('queue')) return 'queue';
  }

  return 'application';
}

/**
 * 从上下文中提取TraceId
 * 支持多种常见的TraceId字段名
 */
export function extractTraceId(context?: Record<string, unknown>): string | null {
  if (!context) return null;

  // 常见的TraceId字段名
  const traceIdFields = [
    'traceId', 'trace_id', 'traceid',
    'x-trace-id', 'x_trace_id',
    'requestId', 'request_id', 'requestid',
    'correlationId', 'correlation_id',
    'transactionId', 'transaction_id'
  ];

  for (const field of traceIdFields) {
    const value = context[field];
    if (value && typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

/**
 * 从上下文中提取SpanId
 * 支持多种常见的SpanId字段名
 */
export function extractSpanId(context?: Record<string, unknown>): string | null {
  if (!context) return null;

  // 常见的SpanId字段名
  const spanIdFields = [
    'spanId', 'span_id', 'spanid',
    'x-span-id', 'x_span_id',
    'parentId', 'parent_id', 'parentid'
  ];

  for (const field of spanIdFields) {
    const value = context[field];
    if (value && typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

/**
 * 获取或生成TraceId用于日志
 * 优先级：上下文中的TraceId > OpenTelemetry TraceId > 全局TraceId > 生成新的TraceId
 */
export async function getTraceIdForLog(context?: Record<string, unknown>): Promise<string> {
  // 1. 尝试从上下文中提取
  const contextTraceId = extractTraceId(context);
  if (contextTraceId) {
    // 如果上下文中有TraceId，更新全局上下文
    const contextSpanId = extractSpanId(context);
    traceContext.setCurrentTrace(contextTraceId, contextSpanId || undefined);
    return contextTraceId;
  }

  // 2. 尝试从 OpenTelemetry 获取
  try {
    const otelTraceId = await OpenTelemetryIntegration.getCurrentTraceId();
    if (otelTraceId && OpenTelemetryIntegration.isValidOTelTraceId(otelTraceId)) {
      // 同时获取 SpanId 并更新全局上下文
      const otelSpanId = await OpenTelemetryIntegration.getCurrentSpanId();
      traceContext.setCurrentTrace(otelTraceId, otelSpanId || undefined);
      return otelTraceId;
    }
  } catch (error) {
    // OpenTelemetry 获取失败，继续使用其他方法
  }

  // 3. 使用全局TraceId或生成新的
  return getOrGenerateTraceId();
}

/**
 * 获取或生成SpanId用于日志
 * 优先级：上下文中的SpanId > OpenTelemetry SpanId > 全局SpanId > 生成新的SpanId
 */
export async function getSpanIdForLog(context?: Record<string, unknown>): Promise<string> {
  // 1. 尝试从上下文中提取
  const contextSpanId = extractSpanId(context);
  if (contextSpanId) {
    return contextSpanId;
  }

  // 2. 尝试从 OpenTelemetry 获取
  try {
    const otelSpanId = await OpenTelemetryIntegration.getCurrentSpanId();
    if (otelSpanId && OpenTelemetryIntegration.isValidOTelSpanId(otelSpanId)) {
      return otelSpanId;
    }
  } catch (error) {
    // OpenTelemetry 获取失败，继续使用其他方法
  }

  // 3. 使用全局SpanId或生成新的
  return getOrGenerateSpanId();
}


/**
 * 将日志数据转换为 SLS 日志条目
 */
export async function convertLogToSlsItem(
  logData: {
    level: LogLevelType;
    message: string;
    time: Date;
    context: Record<string, unknown>;
    err?: Error;
  },
  fieldConfig?: SlsFieldConfig,
  loggerName?: string
): Promise<SlsLogItem> {
  const contents: SlsLogContent[] = [
    { key: 'level', value: logData.level },
    { key: 'message', value: logData.message },
  ];

  // 设置默认字段配置
  const config = {
    enablePackId: true,
    includeEnvironment: true,
    includeVersion: true,
    includeHostIP: true,
    includeCategory: true,
    includeLogger: false,
    includeTraceId: true,
    includeSpanId: false,
    customFields: {},
    ...fieldConfig
  };

  // 添加系统字段
  if (config.includeEnvironment) {
    contents.push({ key: 'environment', value: getEnvironment() });
  }

  if (config.includeVersion) {
    contents.push({ key: 'version', value: getAppVersion() });
  }

  contents.push({ key: 'hostname', value: getHostname() });

  if (config.includeHostIP) {
    contents.push({ key: 'host_ip', value: getLocalIP() });
  }

  if (config.includeCategory) {
    contents.push({ key: 'category', value: inferCategory(loggerName, logData.context) });
  }

  if (config.includeLogger && loggerName) {
    contents.push({ key: 'logger', value: loggerName });
  }

  // 添加TraceId支持
  if (config.includeTraceId) {
    const traceId = await getTraceIdForLog(logData.context);
    contents.push({ key: 'traceId', value: traceId });
  }

  // 添加SpanId支持
  if (config.includeSpanId) {
    const spanId = await getSpanIdForLog(logData.context);
    contents.push({ key: 'spanId', value: spanId });
  }

  // 添加进程ID（替代thread字段）
  contents.push({ key: 'pid', value: String(process.pid) });

  // 添加自定义字段
  if (config.customFields) {
    Object.entries(config.customFields).forEach(([key, value]) => {
      contents.push({ key, value });
    });
  }

  // 添加错误信息
  if (logData.err) {
    contents.push({ key: 'error_message', value: logData.err.message });
    if (logData.err.stack) {
      contents.push({ key: 'error_stack', value: logData.err.stack });
    }
    if (logData.err.name) {
      contents.push({ key: 'error_name', value: logData.err.name });
    }
  }

  // 添加上下文元数据
  if (logData.context && typeof logData.context === 'object') {
    Object.entries(logData.context).forEach(([key, value]) => {
      // 确保键名安全
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
      let stringValue: string;
      
      try {
        stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      } catch (error) {
        stringValue = String(value);
      }
      
      contents.push({ key: safeKey, value: stringValue });
    });
  }

  return {
    time: Math.floor(logData.time.getTime() / 1000), // SLS 需要秒级时间戳
    contents,
  };
}

/**
 * 实现指数退避延迟
 */
export function calculateRetryDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * 异步延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的错误消息提取
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '未知错误';
}

/**
 * 检查错误是否可重试
 */
export function isRetriableError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  
  // 网络相关错误通常可以重试
  const retriablePatterns = [
    /network/i,
    /timeout/i,
    /connect/i,
    /ECONNRESET/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /500/,
    /502/,
    /503/,
    /504/,
  ];

  return retriablePatterns.some(pattern => pattern.test(message));
}

/**
 * 获取当前时间戳字符串（用于日志）
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}