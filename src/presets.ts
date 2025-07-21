/**
 * 配置预设模块
 *
 * 提供常用的日志配置预设
 */

import type { LoggerConfig, LogLevel } from './types';

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
