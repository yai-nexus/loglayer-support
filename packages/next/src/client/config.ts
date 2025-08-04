/**
 * 客户端配置 - 简化版本
 */

import type { NextjsLogConfig } from '../shared/types';

/**
 * 获取默认客户端配置
 */
export function getDefaultClientConfig(appName: string): NextjsLogConfig {
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

  return {
    appName,
    environment: isDev ? 'development' : 'production',
    level: isDev ? 'debug' : 'info',
  };
}
