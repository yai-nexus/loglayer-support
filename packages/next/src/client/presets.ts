/**
 * 客户端预设配置
 * 
 * 为不同环境提供优化的客户端配置
 */

import type { NextjsLogConfig } from '../shared/types';
import { ENVIRONMENTS, LOG_LEVELS, DEFAULT_CONFIG } from '../shared/constants';

/**
 * 客户端预设配置
 */
export const clientPresets = {
  /**
   * 开发环境预设 - 启用控制台和本地存储
   */
  development: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.DEVELOPMENT,
    level: LOG_LEVELS.DEBUG,
    outputs: {
      console: true,
      http: {
        enabled: false, // 开发环境不发送到服务端
      },
      localStorage: {
        enabled: true,
        key: `${appName}-dev-logs`,
        maxEntries: 200,
        ttl: DEFAULT_CONFIG.LOCAL_STORAGE.DEFAULT_TTL,
      },
    },
    advanced: {
      enablePerformanceTracking: true,
      enableDevTools: true,
      enableContextEnrichment: true,
      enableErrorBoundary: true,
    },
  }),

  /**
   * 生产环境预设 - 只记录警告和错误，发送到服务端
   */
  production: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.PRODUCTION,
    level: LOG_LEVELS.WARN, // 生产环境只记录警告和错误
    outputs: {
      console: false,
      http: {
        enabled: true,
        endpoint: DEFAULT_CONFIG.HTTP.DEFAULT_ENDPOINT,
        batchSize: DEFAULT_CONFIG.HTTP.CLIENT_BATCH_SIZE,
        retryAttempts: DEFAULT_CONFIG.HTTP.DEFAULT_RETRY_ATTEMPTS,
      },
      localStorage: {
        enabled: false, // 生产环境不使用本地存储
      },
    },
    advanced: {
      enablePerformanceTracking: false,
      enableDevTools: false,
      enableContextEnrichment: true,
      enableErrorBoundary: true,
    },
  }),

  /**
   * 测试环境预设 - 只记录错误，不输出到控制台
   */
  testing: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.TEST,
    level: LOG_LEVELS.ERROR,
    outputs: {
      console: false,
      http: {
        enabled: false,
      },
      localStorage: {
        enabled: true,
        key: `${appName}-test-logs`,
        maxEntries: 50,
      },
    },
    advanced: {
      enablePerformanceTracking: false,
      enableDevTools: false,
      enableContextEnrichment: false,
      enableErrorBoundary: false,
    },
  }),

  /**
   * 调试预设 - 全功能启用，用于问题排查
   */
  debug: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.DEVELOPMENT,
    level: LOG_LEVELS.DEBUG,
    outputs: {
      console: true,
      http: {
        enabled: true,
        endpoint: DEFAULT_CONFIG.HTTP.DEFAULT_ENDPOINT,
        batchSize: 5, // 小批次，便于调试
        retryAttempts: 1,
      },
      localStorage: {
        enabled: true,
        key: `${appName}-debug-logs`,
        maxEntries: 500,
      },
    },
    advanced: {
      enablePerformanceTracking: true,
      enableDevTools: true,
      enableContextEnrichment: true,
      enableErrorBoundary: true,
    },
  }),

  /**
   * 静默预设 - 最小化日志输出
   */
  silent: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.PRODUCTION,
    level: LOG_LEVELS.ERROR,
    outputs: {
      console: false,
      http: {
        enabled: true,
        endpoint: DEFAULT_CONFIG.HTTP.DEFAULT_ENDPOINT,
        batchSize: DEFAULT_CONFIG.HTTP.CLIENT_BATCH_SIZE,
        retryAttempts: 1,
      },
      localStorage: {
        enabled: false,
      },
    },
    advanced: {
      enablePerformanceTracking: false,
      enableDevTools: false,
      enableContextEnrichment: false,
      enableErrorBoundary: false,
    },
  }),
};

/**
 * 预设配置类型
 */
export type ClientPresetType = keyof typeof clientPresets;
