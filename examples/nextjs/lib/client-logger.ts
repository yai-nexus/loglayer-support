'use client'

/**
 * 客户端专用日志功能 - 适配 v0.7.0-alpha.2 LogLayer API
 * 使用 createBrowserLogger 提供强大的浏览器端日志功能
 */

import { createBrowserLoggerSync } from '@yai-nexus/loglayer-support'
import type { LogLayer } from 'loglayer'

// 创建浏览器端日志器实例
const createClientLogger = (): LogLayer => {
  return createBrowserLoggerSync({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    outputs: {
      console: {
        colorized: true,
        groupCollapsed: true
      },
      localStorage: {
        key: 'app-logs',
        maxEntries: 100
      },
      http: {
        enabled: true,
        endpoint: '/api/client-logs',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  });
};

// 创建客户端日志器实例
const clientLoggerInstance = createClientLogger();

// 导出客户端日志器实例
export const clientLogger = clientLoggerInstance;

// 兼容性导出
export const logger = clientLogger;
export const uiLogger = clientLogger;
export const apiLogger = clientLogger;

// 添加一些便捷方法来展示新功能
export const logPageLoad = () => {
  const loadTime = performance.now();
  clientLogger.info('Performance: page-load', {
    operation: 'page-load',
    duration: loadTime,
    performanceType: 'measurement',
    url: window.location.href,
    userAgent: navigator.userAgent
  });
};

export const logUserAction = (action: string, element: string, metadata: any = {}) => {
  clientLogger.info(`用户操作: ${action}`, {
    action,
    element,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export const logApiCall = (endpoint: string, method: string, duration: number, status?: number) => {
  const level = status && status >= 400 ? 'error' : 'info';
  clientLogger[level](`API 调用: ${method} ${endpoint}`, {
    endpoint,
    method,
    duration: `${duration.toFixed(2)}ms`,
    status,
    timestamp: new Date().toISOString()
  });
};