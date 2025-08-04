/**
 * 服务端配置 - 简化版本
 */

import type { NextjsLogConfig } from '../shared/types';

/**
 * 获取默认服务端配置
 */
export function getDefaultServerConfig(appName: string): NextjsLogConfig {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    appName,
    environment: isProd ? 'production' : 'development',
    level: isProd ? 'info' : 'debug',
  };
}
