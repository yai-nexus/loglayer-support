/**
 * 配置验证和工具函数
 *
 * 处理配置验证、级别检查和输出配置获取等核心逻辑
 */

import type { LoggerConfig, LogLevel, EnvironmentInfo, ServerOutput, ClientOutput } from './types';

/**
 * 验证配置的有效性
 */
export function validateConfig(config: LoggerConfig): boolean {
  // 检查基本结构
  if (!config.level || typeof config.level.default !== 'string') {
    return false;
  }

  if (!config.server || !Array.isArray(config.server.outputs)) {
    return false;
  }

  if (!config.client || !Array.isArray(config.client.outputs)) {
    return false;
  }

  // 验证日志级别
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(config.level.default)) {
    return false;
  }

  // 验证自定义 logger 级别
  if (config.level.loggers) {
    for (const level of Object.values(config.level.loggers)) {
      if (!validLevels.includes(level)) {
        return false;
      }
    }
  }

  // 验证服务端输出配置
  for (const output of config.server.outputs) {
    const validServerTypes = ['stdout', 'file', 'sls', 'http'];
    if (!validServerTypes.includes(output.type)) {
      return false;
    }

    if (output.level && !validLevels.includes(output.level)) {
      return false;
    }
  }

  // 验证客户端输出配置
  for (const output of config.client.outputs) {
    const validClientTypes = ['console', 'http', 'localstorage'];
    if (!validClientTypes.includes(output.type)) {
      return false;
    }

    if (output.level && !validLevels.includes(output.level)) {
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
export function getEffectiveOutputs(
  config: LoggerConfig,
  env: EnvironmentInfo & { isServer: true }
): ServerOutput[];
export function getEffectiveOutputs(
  config: LoggerConfig,
  env: EnvironmentInfo & { isServer: false }
): ClientOutput[];
export function getEffectiveOutputs(
  config: LoggerConfig,
  env: EnvironmentInfo
): ServerOutput[] | ClientOutput[];
export function getEffectiveOutputs(config: LoggerConfig, env: EnvironmentInfo) {
  if (env.isServer) {
    return config.server.outputs;
  } else {
    return config.client.outputs;
  }
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
        ...overrideConfig.level?.loggers,
      },
    },
    server: {
      outputs: overrideConfig.server?.outputs || baseConfig.server.outputs,
    },
    client: {
      outputs: overrideConfig.client?.outputs || baseConfig.client.outputs,
    },
  };

  return merged;
}
