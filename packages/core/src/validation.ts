/**
 * 配置验证和工具函数
 *
 * 处理配置验证、级别检查和输出配置获取等核心逻辑
 */

import type { LoggerConfig, LogLevel, EnvironmentInfo, ServerOutput, ClientOutput } from './types';

// validateConfig 函数已移除，请使用 @yai-loglayer/core 的 ConfigValidator 类进行配置验证

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
