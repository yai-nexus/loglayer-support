/**
 * 配置创建和预设函数
 * 
 * 提供各种预设配置的创建函数，便于快速启动项目
 */

import type { LoggerConfig, EnvironmentInfo } from '../core';

/**
 * 创建默认配置
 */
export function createDefaultConfig(): LoggerConfig {
  return {
    level: {
      default: 'info',
    },
    server: {
      outputs: [{ type: 'stdout' }],
    },
    client: {
      outputs: [{ type: 'console' }],
    },
  };
}

/**
 * 为开发环境创建推荐配置
 */
export function createDevelopmentConfig(): LoggerConfig {
  return {
    level: {
      default: 'debug',
    },
    server: {
      outputs: [
        { type: 'stdout' },
        {
          type: 'file',
          config: {
            dir: './logs',
            filename: 'app.log',
          },
        },
      ],
    },
    client: {
      outputs: [{ type: 'console' }],
    },
  };
}

/**
 * 为生产环境创建推荐配置
 */
export function createProductionConfig(): LoggerConfig {
  return {
    level: {
      default: 'info',
      loggers: {
        debug: 'error',
        test: 'error',
      },
    },
    server: {
      outputs: [
        { type: 'stdout' },
        {
          type: 'file',
          config: {
            dir: '/var/log/app',
            filename: 'app.log',
            maxSize: '10MB',
            maxFiles: 5,
          },
        },
      ],
    },
    client: {
      outputs: [
        {
          type: 'http',
          level: 'warn',
          config: {
            endpoint: '/api/client-logs',
          },
        },
      ],
    },
  };
}

/**
 * 基于环境自动创建配置
 */
export function createConfigForEnvironment(env: EnvironmentInfo): LoggerConfig {
  switch (env.environment) {
    case 'development':
      return createDevelopmentConfig();
    case 'production':
      return createProductionConfig();
    case 'test':
      return {
        level: { default: 'error' },
        server: {
          outputs: [{ type: 'stdout' }],
        },
        client: {
          outputs: [{ type: 'console' }],
        },
      };
    default:
      return createDefaultConfig();
  }
}