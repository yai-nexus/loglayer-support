/**
 * 日志器使用示例
 *
 * 展示如何使用新版日志器进行极简接入
 */

import { createAutoLogger } from '../../packages/server/src';
import { basicConfig } from './logger.config';

// ==================== 创建日志器 ====================

/**
 * 一行代码创建日志器
 */
export const logger = createAutoLogger(basicConfig);

// ==================== 基础使用示例 ====================

// 基础日志记录
logger.info('应用启动成功');
logger.error('数据库连接失败', { error: 'Connection timeout' });
logger.debug('调试信息', { userId: 123, action: 'login' });
logger.warn('性能警告', { responseTime: 2000 });

// ==================== 工具函数 ====================

/**
 * 生成追踪ID
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * API 请求日志记录
 */
export function logApiRequest(method: string, path: string, data?: any) {
  const traceId = generateTraceId();
  logger.info('API Request', { method, path, traceId, data });
  return traceId;
}

/**
 * API 响应日志记录
 */
export function logApiResponse(traceId: string, method: string, path: string, status: number, duration: number, error?: any) {
  const logData = { method, path, traceId, status, duration };

  if (error) {
    logger.error('API Error', { ...logData, error: error.message });
  } else if (status >= 400) {
    logger.warn('API Warning', logData);
  } else {
    logger.info('API Success', logData);
  }
}

// ==================== 默认导出 ====================

export default logger;
