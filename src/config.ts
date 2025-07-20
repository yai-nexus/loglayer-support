/**
 * 配置管理模块
 * 
 * 处理新的用户友好配置格式
 * 基于 docs/practical-config.md 的设计
 */

import type { LoggerConfig, LogLevel, EnvironmentInfo } from './types';

/**
 * 验证配置的有效性
 */
export function validateConfig(config: LoggerConfig): boolean {
  // 检查基本结构
  if (!config.level || typeof config.level.default !== 'string') {
    console.error('Logger config validation failed: level.default is required');
    return false;
  }

  if (!config.server || !Array.isArray(config.server.outputs)) {
    console.error('Logger config validation failed: server.outputs must be an array');
    return false;
  }

  if (!config.client || !Array.isArray(config.client.outputs)) {
    console.error('Logger config validation failed: client.outputs must be an array');
    return false;
  }

  // 验证日志级别
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(config.level.default)) {
    console.error(`Logger config validation failed: invalid default level "${config.level.default}"`);
    return false;
  }

  // 验证自定义 logger 级别
  if (config.level.loggers) {
    for (const [loggerName, level] of Object.entries(config.level.loggers)) {
      if (!validLevels.includes(level)) {
        console.error(`Logger config validation failed: invalid level "${level}" for logger "${loggerName}"`);
        return false;
      }
    }
  }

  // 验证服务端输出配置
  for (const output of config.server.outputs) {
    const validServerTypes = ['stdout', 'file', 'sls', 'http'];
    if (!validServerTypes.includes(output.type)) {
      console.error(`Logger config validation failed: invalid server output type "${output.type}"`);
      return false;
    }

    if (output.level && !validLevels.includes(output.level)) {
      console.error(`Logger config validation failed: invalid output level "${output.level}" for server output`);
      return false;
    }
  }

  // 验证客户端输出配置
  for (const output of config.client.outputs) {
    const validClientTypes = ['console', 'http', 'localstorage'];
    if (!validClientTypes.includes(output.type)) {
      console.error(`Logger config validation failed: invalid client output type "${output.type}"`);
      return false;
    }

    if (output.level && !validLevels.includes(output.level)) {
      console.error(`Logger config validation failed: invalid output level "${output.level}" for client output`);
      return false;
    }
  }

  return true;
}

/**
 * 获取 logger 的有效级别
 */
export function getLoggerLevel(loggerName: string, config: LoggerConfig): LogLevel {
  // 优先使用专用配置，否则使用默认配置
  return config.level.loggers?.[loggerName] || config.level.default;
}

/**
 * 检查消息是否应该被记录
 */
export function shouldLog(messageLevel: LogLevel, configLevel: LogLevel): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  const messageLevelIndex = levels.indexOf(messageLevel);
  const configLevelIndex = levels.indexOf(configLevel);
  
  return messageLevelIndex >= configLevelIndex;
}

/**
 * 获取有效的输出配置（基于环境）
 */
export function getEffectiveOutputs(config: LoggerConfig, env: EnvironmentInfo) {
  if (env.isServer) {
    return config.server.outputs;
  } else {
    return config.client.outputs;
  }
}

/**
 * 创建默认配置
 */
export function createDefaultConfig(): LoggerConfig {
  return {
    level: {
      default: 'info'
    },
    server: {
      outputs: [
        { type: 'stdout' }
      ]
    },
    client: {
      outputs: [
        { type: 'console' }
      ]
    }
  };
}

/**
 * 合并配置（深度合并）
 */
export function mergeConfigs(
  baseConfig: LoggerConfig,
  overrideConfig: Partial<LoggerConfig>
): LoggerConfig {
  const merged: LoggerConfig = {
    level: {
      default: overrideConfig.level?.default || baseConfig.level.default,
      loggers: {
        ...baseConfig.level.loggers,
        ...overrideConfig.level?.loggers
      }
    },
    server: {
      outputs: overrideConfig.server?.outputs || baseConfig.server.outputs
    },
    client: {
      outputs: overrideConfig.client?.outputs || baseConfig.client.outputs
    }
  };

  return merged;
}

/**
 * 为开发环境创建推荐配置
 */
export function createDevelopmentConfig(): LoggerConfig {
  return {
    level: {
      default: 'debug'
    },
    server: {
      outputs: [
        { type: 'stdout' },
        { 
          type: 'file', 
          config: { 
            dir: './logs',
            filename: 'app.log'
          } 
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' }
      ]
    }
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
        'debug': 'error',
        'test': 'error'
      }
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
            maxFiles: 5
          }
        }
      ]
    },
    client: {
      outputs: [
        { 
          type: 'http',
          level: 'warn',
          config: {
            endpoint: '/api/client-logs'
          }
        }
      ]
    }
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
          outputs: [{ type: 'stdout' }]
        },
        client: {
          outputs: [{ type: 'console' }]
        }
      };
    default:
      return createDefaultConfig();
  }
}