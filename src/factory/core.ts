/**
 * 核心 Logger 工厂函数
 * 
 * 提供基础的 Logger 创建功能，包括异步创建、同步创建和容错创建
 */

import { detectEnvironment } from '../core';
import { validateConfig, getEffectiveOutputs } from '../config';
import { EngineLoader } from '../transports';
import { LogLayerWrapper } from '../wrapper';
import type {
  LoggerConfig,
  EnvironmentInfo,
  IEnhancedLogger,
  ILogger,
  ServerOutput,
  ClientOutput,
} from '../core';

/**
 * 创建 Logger 的主要工厂函数
 */
export async function createLogger(name: string, config: LoggerConfig): Promise<IEnhancedLogger> {
  // 1. 验证配置
  if (!validateConfig(config)) {
    throw new Error('Invalid logger configuration');
  }

  // 2. 检测环境
  const env = detectEnvironment();

  // 3. 根据环境创建相应的 logger
  const logger = await createLoggerForEnvironment(name, config, env);

  // 4. 创建增强包装器
  const wrapper = new LogLayerWrapper(logger, name, config);

  // 5. 记录初始化信息
  wrapper.debug('Logger initialized', {
    loggerName: name,
    environment: env.environment,
    isServer: env.isServer,
    outputCount: getEffectiveOutputs(config, env).length,
  });

  return wrapper;
}

/**
 * 为特定环境创建 Logger
 */
export async function createLoggerForEnvironment(
  name: string,
  config: LoggerConfig,
  env: EnvironmentInfo
): Promise<ILogger> {
  const outputs = getEffectiveOutputs(config, env);

  if (env.isServer) {
    // 服务端：智能引擎选择
    return await EngineLoader.loadServerEngine(outputs as ServerOutput[]);
  } else {
    // 客户端：固定使用浏览器引擎
    return EngineLoader.loadClientEngine(outputs as ClientOutput[]);
  }
}

/**
 * 同步创建 Logger（使用默认配置）
 */
export function createLoggerSync(name: string): IEnhancedLogger {
  const env = detectEnvironment();

  // 创建简单的默认配置
  const defaultConfig: LoggerConfig = {
    level: { default: 'info' },
    server: {
      outputs: [{ type: 'stdout' }],
    },
    client: {
      outputs: [{ type: 'console' }],
    },
  };

  const outputs = getEffectiveOutputs(defaultConfig, env);

  // 同步创建基础引擎
  let logger: ILogger;
  if (env.isServer) {
    // 服务端使用核心引擎（同步）
    const { CoreServerLogger } = require('../transports');
    logger = new CoreServerLogger(outputs as ServerOutput[]);
  } else {
    // 客户端使用浏览器引擎
    const { BrowserLogger } = require('../transports');
    logger = new BrowserLogger(outputs as ClientOutput[]);
  }

  return new LogLayerWrapper(logger, name, defaultConfig);
}

/**
 * 创建带回退机制的 Logger
 */
export async function createResilientLogger(
  name: string,
  config: LoggerConfig
): Promise<IEnhancedLogger> {
  try {
    return await createLogger(name, config);
  } catch (error) {
    // Failed to create logger with provided config, using fallback

    // 回退到最简单的配置
    const fallbackConfig: LoggerConfig = {
      level: { default: 'info' },
      server: {
        outputs: [{ type: 'stdout' }],
      },
      client: {
        outputs: [{ type: 'console' }],
      },
    };

    const env = detectEnvironment();
    const logger = await createLoggerForEnvironment(name, fallbackConfig, env);
    const wrapper = new LogLayerWrapper(logger, name, fallbackConfig);

    wrapper.warn('Logger created with fallback configuration', {
      loggerName: name,
      originalError: (error as Error).message,
    });

    return wrapper;
  }
}