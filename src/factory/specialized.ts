/**
 * 特殊场景 Logger 工厂函数
 *
 * 提供针对特定场景的 Logger 创建功能，如 Next.js 优化、批量创建等
 */

import { detectEnvironment } from '../core';
import { validateConfig, getEffectiveOutputs } from '../config';
import { EngineLoader } from '../transports';
import { LogLayerWrapper } from '../wrapper';
import { createLogger } from './core';
import type { LoggerConfig, IEnhancedLogger, ILogger, ServerOutput, ClientOutput } from '../core';

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
    const { CoreServerLogger } = require('../transports');
    logger = new CoreServerLogger(outputs as ServerOutput[]);
  } else {
    const { BrowserLogger } = require('../transports');
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

// 注意：createLoggerForEnvironment 被视为内部实现，不在此处导出
