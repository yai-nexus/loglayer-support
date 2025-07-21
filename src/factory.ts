/**
 * Logger 工厂模块
 *
 * 实现智能引擎选择和环境隔离
 * 基于 docs/implementation-strategy.md 的设计
 */

import { detectEnvironment } from './environment';
import { validateConfig, getEffectiveOutputs } from './config';
import { EngineLoader, CoreServerLogger, BrowserLogger } from './transports';
import { LogLayerWrapper } from './wrapper';
import type {
  LoggerConfig,
  EnvironmentInfo,
  IEnhancedLogger,
  ILogger,
  ServerOutput,
  ClientOutput,
} from './types';

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
async function createLoggerForEnvironment(
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
    logger = new CoreServerLogger(outputs as ServerOutput[]);
  } else {
    // 客户端使用浏览器引擎
    logger = new BrowserLogger(outputs as ClientOutput[]);
  }

  return new LogLayerWrapper(logger, name, defaultConfig);
}

/**
 * 为 Next.js 创建优化的 Logger
 */
export async function createNextjsLogger(
  name: string,
  config: LoggerConfig
): Promise<IEnhancedLogger> {
  // Next.js 环境检测和优化
  const env = detectEnvironment();

  // 验证配置
  if (!validateConfig(config)) {
    throw new Error('Invalid logger configuration');
  }

  // Next.js 特殊处理：确保客户端代码不引用服务端模块
  if (env.isClient) {
    const clientLogger = EngineLoader.loadClientEngine(config.client.outputs);
    const wrapper = new LogLayerWrapper(clientLogger, name, config);

    wrapper.debug('Next.js client logger initialized', {
      loggerName: name,
      outputTypes: config.client.outputs.map((o) => o.type),
    });

    return wrapper;
  } else {
    // 服务端使用标准流程
    return await createLogger(name, config);
  }
}

/**
 * 同步版本的 Next.js Logger 创建
 */
export function createNextjsLoggerSync(name: string): IEnhancedLogger {
  const env = detectEnvironment();

  const nextjsConfig: LoggerConfig = {
    level: { default: env.environment === 'development' ? 'debug' : 'info' },
    server: {
      outputs: [
        { type: 'stdout' },
        ...(env.environment === 'development'
          ? [
              {
                type: 'file' as const,
                config: { dir: './logs', filename: `${name}.log` },
              },
            ]
          : []),
      ],
    },
    client: {
      outputs: [
        { type: 'console' },
        ...(env.environment === 'production'
          ? [
              {
                type: 'http' as const,
                level: 'error' as const,
                config: { endpoint: '/api/client-logs' },
              },
            ]
          : []),
      ],
    },
  };

  const outputs = getEffectiveOutputs(nextjsConfig, env);

  let logger: ILogger;
  if (env.isServer) {
    logger = new CoreServerLogger(outputs as ServerOutput[]);
  } else {
    logger = new BrowserLogger(outputs as ClientOutput[]);
  }

  const wrapper = new LogLayerWrapper(logger, name, nextjsConfig);

  wrapper.debug('Next.js logger initialized (sync)', {
    loggerName: name,
    environment: env.environment,
    outputCount: outputs.length,
  });

  return wrapper;
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

/**
 * 批量创建多个 Logger
 */
export async function createLoggers(
  configs: Array<{ name: string; config: LoggerConfig }>
): Promise<Record<string, IEnhancedLogger>> {
  const loggers: Record<string, IEnhancedLogger> = {};

  for (const { name, config } of configs) {
    try {
      loggers[name] = await createLogger(name, config);
    } catch (error) {
      // Failed to create logger, skip and continue
      // 继续创建其他 logger
    }
  }

  return loggers;
}

/**
 * Logger 工厂类（面向对象接口）
 */
export class LoggerFactory {
  private static instances: Map<string, IEnhancedLogger> = new Map();

  /**
   * 获取或创建 Logger 实例（单例模式）
   */
  static async getInstance(name: string, config: LoggerConfig): Promise<IEnhancedLogger> {
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    const logger = await createLogger(name, config);
    this.instances.set(name, logger);
    return logger;
  }

  /**
   * 清理所有实例
   */
  static clearInstances(): void {
    this.instances.clear();
  }

  /**
   * 获取所有实例
   */
  static getAllInstances(): Record<string, IEnhancedLogger> {
    const result: Record<string, IEnhancedLogger> = {};
    for (const [name, logger] of this.instances) {
      result[name] = logger;
    }
    return result;
  }
}
