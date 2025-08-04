/**
 * 共享常量定义 - 仅常量，无运行时逻辑
 */

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  APP_NAME: 'nextjs-app',
  LOG_LEVEL: {
    DEVELOPMENT: 'debug' as const,
    PRODUCTION: 'info' as const,
    TEST: 'warn' as const,
  },
  HTTP: {
    DEFAULT_ENDPOINT: '/api/logs',
    DEFAULT_BATCH_SIZE: 10,
    DEFAULT_RETRY_ATTEMPTS: 3,
    CLIENT_BATCH_SIZE: 20,
    SERVER_BATCH_SIZE: 50,
  },
  FILE: {
    DEFAULT_PATH: './logs',
    DEFAULT_MAX_SIZE: '10MB',
    DEFAULT_MAX_FILES: 5,
  },
  LOCAL_STORAGE: {
    DEFAULT_KEY: 'nextjs-app-logs',
    DEFAULT_MAX_ENTRIES: 100,
    DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

/**
 * 环境常量
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging',
} as const;

/**
 * 日志级别常量
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

/**
 * 平台常量
 */
export const PLATFORMS = {
  SERVER: 'server',
  BROWSER: 'browser',
} as const;

/**
 * 输出类型常量
 */
export const OUTPUT_TYPES = {
  CONSOLE: 'console',
  HTTP: 'http',
  FILE: 'file',
  SLS: 'sls',
  LOCAL_STORAGE: 'localStorage',
} as const;

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  CONFIG_REQUIRED: 'Configuration is required',
  APP_NAME_REQUIRED: 'appName is required in configuration',
  INVALID_LOG_LEVEL: 'Invalid log level provided',
  INVALID_ENVIRONMENT: 'Invalid environment provided',
  CLIENT_ONLY: 'This function can only be used in client-side code',
  SERVER_ONLY: 'This function can only be used in server-side code',
  PROVIDER_REQUIRED: 'LoggerProvider is required to use this hook',
} as const;

/**
 * 功能标志常量
 */
export const FEATURE_FLAGS = {
  ENABLE_PERFORMANCE_TRACKING: 'enablePerformanceTracking',
  ENABLE_ERROR_BOUNDARY: 'enableErrorBoundary',
  ENABLE_DEV_TOOLS: 'enableDevTools',
  ENABLE_CONTEXT_ENRICHMENT: 'enableContextEnrichment',
} as const;
