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
        batchSize: 1, // 立即发送，适合示例
        retryAttempts: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    context: {
      includeUserAgent: true,
      includeUrl: true,
      includeTimestamp: true
    },
    errorHandling: {
      captureGlobalErrors: true,
      captureUnhandledRejections: true
    },
    performance: {
      enablePerformanceLogging: true,
      autoLogPageLoad: true
    },
    sampling: {
      rate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 生产环境采样
      levelRates: {
        error: 1.0, // 错误日志总是记录
        warn: 0.8,
        info: 0.5,
        debug: 0.1
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