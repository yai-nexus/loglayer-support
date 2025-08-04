/**
 * 服务端预设配置
 * 
 * 为不同环境提供优化的服务端配置
 */

import type { NextjsLogConfig } from '../shared/types';
import { ENVIRONMENTS, LOG_LEVELS, DEFAULT_CONFIG } from '../shared/constants';

/**
 * 服务端预设配置
 */
export const serverPresets = {
  /**
   * 开发环境预设 - 启用控制台输出，禁用文件和SLS
   */
  development: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.DEVELOPMENT,
    level: LOG_LEVELS.DEBUG,
    outputs: {
      console: true,
      file: {
        enabled: false,
      },
      sls: {
        enabled: false,
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
   * 生产环境预设 - 启用文件和SLS输出，禁用控制台
   */
  production: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.PRODUCTION,
    level: LOG_LEVELS.INFO,
    outputs: {
      console: false,
      file: {
        enabled: true,
        path: DEFAULT_CONFIG.FILE.DEFAULT_PATH,
        maxSize: DEFAULT_CONFIG.FILE.DEFAULT_MAX_SIZE,
        maxFiles: DEFAULT_CONFIG.FILE.DEFAULT_MAX_FILES,
      },
      sls: {
        enabled: true,
        project: process.env.SLS_PROJECT,
        logstore: process.env.SLS_LOGSTORE,
        endpoint: process.env.SLS_ENDPOINT,
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
   * 测试环境预设 - 只记录错误，输出到文件
   */
  testing: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.TEST,
    level: LOG_LEVELS.ERROR,
    outputs: {
      console: false,
      file: {
        enabled: true,
        path: './test-logs',
        maxSize: '5MB',
        maxFiles: 2,
      },
      sls: {
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

  /**
   * 调试预设 - 全功能启用，详细日志
   */
  debug: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.DEVELOPMENT,
    level: LOG_LEVELS.DEBUG,
    outputs: {
      console: true,
      file: {
        enabled: true,
        path: './debug-logs',
        maxSize: '50MB',
        maxFiles: 10,
      },
      sls: {
        enabled: false, // 调试模式不发送到SLS
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
   * 高性能预设 - 最小化日志输出，优化性能
   */
  performance: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.PRODUCTION,
    level: LOG_LEVELS.WARN,
    outputs: {
      console: false,
      file: {
        enabled: true,
        path: DEFAULT_CONFIG.FILE.DEFAULT_PATH,
        maxSize: '20MB',
        maxFiles: 3,
      },
      sls: {
        enabled: true,
        project: process.env.SLS_PROJECT,
        logstore: process.env.SLS_LOGSTORE,
        endpoint: process.env.SLS_ENDPOINT,
      },
    },
    advanced: {
      enablePerformanceTracking: false,
      enableDevTools: false,
      enableContextEnrichment: false,
      enableErrorBoundary: true,
    },
  }),

  /**
   * 监控预设 - 专注于监控和告警
   */
  monitoring: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.PRODUCTION,
    level: LOG_LEVELS.INFO,
    outputs: {
      console: false,
      file: {
        enabled: true,
        path: './monitoring-logs',
        maxSize: '100MB',
        maxFiles: 7, // 保留一周的日志
      },
      sls: {
        enabled: true,
        project: process.env.SLS_PROJECT,
        logstore: process.env.SLS_LOGSTORE,
        endpoint: process.env.SLS_ENDPOINT,
      },
    },
    advanced: {
      enablePerformanceTracking: true,
      enableDevTools: false,
      enableContextEnrichment: true,
      enableErrorBoundary: true,
    },
  }),

  /**
   * 本地开发预设 - 适合本地开发调试
   */
  local: (appName: string): NextjsLogConfig => ({
    appName,
    environment: ENVIRONMENTS.DEVELOPMENT,
    level: LOG_LEVELS.DEBUG,
    outputs: {
      console: true,
      file: {
        enabled: true,
        path: './local-logs',
        maxSize: '10MB',
        maxFiles: 3,
      },
      sls: {
        enabled: false,
      },
    },
    advanced: {
      enablePerformanceTracking: true,
      enableDevTools: true,
      enableContextEnrichment: true,
      enableErrorBoundary: true,
    },
  }),
};

/**
 * 预设配置类型
 */
export type ServerPresetType = keyof typeof serverPresets;
