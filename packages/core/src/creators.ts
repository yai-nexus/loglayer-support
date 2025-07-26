/**
 * 配置创建和预设函数
 *
 * 提供各种预设配置的创建函数，便于快速启动项目
 * 合并了原来的 creators.ts 和 presets.ts 功能
 */

import type { LoggerConfig, EnvironmentInfo, LogLevel } from './types';

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

// =============================================================================
// 预设配置（原 presets.ts 内容）
// =============================================================================

/**
 * 通用日志配置工厂函数
 */
function createLoggerConfig(level: LogLevel): LoggerConfig {
  return {
    level: {
      default: level,
    },
    server: {
      outputs: [
        {
          type: 'stdout',
          level,
        },
        {
          type: 'file',
          level,
          config: {
            dir: 'logs',
            filename: 'app.log',
          },
        },
      ],
    },
    client: {
      outputs: [
        {
          type: 'console',
          level,
        },
      ],
    },
  };
}

/**
 * 预设配置工厂函数
 */
export const presets = {
  /**
   * 开发环境预设
   */
  development: (): LoggerConfig => createLoggerConfig('debug'),

  /**
   * 生产环境预设
   */
  production: (): LoggerConfig => ({
    level: {
      default: 'info',
    },
    server: {
      outputs: [
        {
          type: 'stdout',
          level: 'info',
        },
        {
          type: 'file',
          level: 'info',
          config: {
            dir: 'logs',
            filename: 'app.log',
          },
        },
        {
          type: 'file',
          level: 'error',
          config: {
            dir: 'logs',
            filename: 'error.log',
          },
        },
      ],
    },
    client: {
      outputs: [
        {
          type: 'console',
          level: 'warn',
        },
      ],
    },
  }),

  /**
   * Next.js 兼容预设
   * 解决 Next.js webpack 兼容性问题
   */
  nextjsCompatible: (): LoggerConfig => createLoggerConfig('debug'),

  /**
   * 测试环境预设
   */
  test: (): LoggerConfig => createLoggerConfig('error'),

  /**
   * 控制台专用预设
   */
  consoleOnly: (): LoggerConfig => ({
    level: {
      default: 'debug',
    },
    server: {
      outputs: [
        {
          type: 'stdout',
        },
      ],
    },
    client: {
      outputs: [
        {
          type: 'console',
        },
      ],
    },
  }),
};

// =============================================================================
// 便捷配置创建函数
// =============================================================================

/**
 * 创建服务端配置（只包含服务端输出）
 */
export function createServerConfig(outputs: import('./types').ServerOutput[]): LoggerConfig {
  return {
    level: { default: 'info' },
    server: { outputs },
    client: { outputs: [{ type: 'console' }] }, // 默认客户端配置
  };
}

/**
 * 创建客户端配置（只包含客户端输出）
 */
export function createClientConfig(outputs: import('./types').ClientOutput[]): LoggerConfig {
  return {
    level: { default: 'info' },
    server: { outputs: [{ type: 'stdout' }] }, // 默认服务端配置
    client: { outputs },
  };
}

/**
 * 创建简单的文件日志配置
 */
export function createFileLoggerConfig(
  logDir: string = './logs',
  filename: string = 'app.log'
): LoggerConfig {
  return createServerConfig([
    { type: 'stdout' },
    {
      type: 'file',
      config: { dir: logDir, filename },
    },
  ]);
}

/**
 * 创建开发环境配置（详细日志 + 文件输出）
 */
export function createDevConfig(logDir: string = './logs'): LoggerConfig {
  return {
    level: { default: 'debug' },
    server: {
      outputs: [
        { type: 'stdout' },
        {
          type: 'file',
          config: { dir: logDir, filename: 'dev.log' },
        },
      ],
    },
    client: {
      outputs: [{ type: 'console' }],
    },
  };
}

/**
 * 创建生产环境配置（优化的日志级别 + 文件轮转）
 */
export function createProdConfig(logDir: string = '/var/log/app'): LoggerConfig {
  return {
    level: { default: 'info' },
    server: {
      outputs: [
        { type: 'stdout', level: 'warn' }, // 只输出警告和错误到控制台
        {
          type: 'file',
          level: 'info',
          config: {
            dir: logDir,
            filename: 'app.log',
            maxSize: '10MB',
            maxFiles: 5,
          },
        },
        {
          type: 'file',
          level: 'error',
          config: {
            dir: logDir,
            filename: 'error.log',
            maxSize: '5MB',
            maxFiles: 10,
          },
        },
      ],
    },
    client: {
      outputs: [
        { type: 'console', level: 'error' }, // 生产环境只显示错误
      ],
    },
  };
}
