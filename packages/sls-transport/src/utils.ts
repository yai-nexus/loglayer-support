/**
 * SLS Transport 工具函数
 */

// 类型导入已内联到 types.ts 中
import type { Log } from './types';
import type { 
  SlsTransportConfig, 
  SlsTransportInternalConfig, 
  SlsLogItem, 
  SlsLogContent,
  RetryConfig 
} from './types';

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

  // 验证 endpoint 格式
  if (!config.endpoint.startsWith('http')) {
    throw new Error(`SLS Transport endpoint 必须是完整的 HTTP(S) URL: ${config.endpoint}`);
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

/**
 * 创建内部配置（填充默认值）
 */
export function createInternalConfig(config: SlsTransportConfig): SlsTransportInternalConfig {
  validateSlsConfig(config);

  const sdkConfig = {
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
  };

  return {
    sdkConfig,
    project: config.project,
    logstore: config.logstore,
    topic: config.topic || 'loglayer',
    source: config.source || 'nodejs',
    batchSize: config.batchSize || 100,
    flushInterval: config.flushInterval || 5000,
    maxRetries: config.maxRetries || 3,
    retryBaseDelay: config.retryBaseDelay || 1000,
  };
}

/**
 * 将 LogLayer 日志对象转换为 SLS 日志条目
 */
export function convertLogToSlsItem(log: Log): SlsLogItem {
  const contents: SlsLogContent[] = [
    { key: 'level', value: log.level },
    { key: 'message', value: log.message },
  ];

  // 添加错误信息
  if (log.err) {
    contents.push({ key: 'error_message', value: log.err.message });
    if (log.err.stack) {
      contents.push({ key: 'error_stack', value: log.err.stack });
    }
    if (log.err.name) {
      contents.push({ key: 'error_name', value: log.err.name });
    }
  }

  // 添加上下文元数据
  if (log.context && typeof log.context === 'object') {
    Object.entries(log.context).forEach(([key, value]) => {
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
    time: Math.floor(log.time.getTime() / 1000), // SLS 需要秒级时间戳
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