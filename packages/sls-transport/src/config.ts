/**
 * SLS Transport 配置工厂函数
 */

import type { SlsTransportConfig } from './types';

/**
 * 从环境变量创建 SLS Transport 配置
 */
export function createSlsConfigFromEnv(): SlsTransportConfig | null {
  const requiredVars = [
    'SLS_ENDPOINT',
    'SLS_PROJECT', 
    'SLS_LOGSTORE',
    'SLS_ACCESS_KEY_ID',
    'SLS_ACCESS_KEY_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    // 对于配置错误，使用 console.warn 而非内部日志器，因为这是用户配置问题
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SlsTransport] 缺少 SLS 环境变量: ${missingVars.join(', ')}。SLS 传输已禁用。`);
    }
    return null;
  }

  return {
    endpoint: process.env.SLS_ENDPOINT!,
    accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
    project: process.env.SLS_PROJECT!,
    logstore: process.env.SLS_LOGSTORE!,
    topic: process.env.SLS_TOPIC || 'loglayer',
    source: process.env.SLS_SOURCE || 'nodejs',
    batchSize: parseInt(process.env.SLS_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.SLS_FLUSH_INTERVAL || '5000'),
    maxRetries: parseInt(process.env.SLS_MAX_RETRIES || '3'),
  };
}

/**
 * 检查 SLS 配置是否完整（向后兼容）
 */
export function checkSlsConfig(): boolean {
  return createSlsConfigFromEnv() !== null;
}