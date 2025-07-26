/**
 * 核心 Logger 工厂函数
 *
 * 直接使用 LogLayer 和 Transport，不再使用包装器
 */

import { LogLayer } from 'loglayer';
import { detectEnvironment, serializeMessages } from '../core';
import { validateConfig, getEffectiveOutputs } from '../config';
import type {
  LoggerConfig,
  EnvironmentInfo,
  ServerOutput,
  ClientOutput,
} from '../core';

/**
 * 创建 Logger 的主要工厂函数
 */
export async function createLogger(name: string, config: LoggerConfig): Promise<LogLayer> {
  // 1. 验证配置
  if (!validateConfig(config)) {
    throw new Error('Invalid logger configuration');
  }

  // 2. 检测环境
  const env = detectEnvironment();

  // 3. 根据环境创建相应的 logger
  const logger = await createLogLayerForEnvironment(name, config, env);

  // 4. 记录初始化信息
  logger.debug('Logger initialized');

  return logger;
}

/**
 * 为特定环境创建 LogLayer 实例
 */
export async function createLogLayerForEnvironment(
  name: string,
  config: LoggerConfig,
  env: EnvironmentInfo
): Promise<LogLayer> {
  const outputs = getEffectiveOutputs(config, env);

  if (env.isServer) {
    // 服务端：使用 loglayer transport
    return await createServerLogLayer(name, outputs as ServerOutput[]);
  } else {
    // 客户端：使用新的 LoglayerBrowserTransport
    const { createBrowserLogLayer } = await import('../transports/browser-factory');
    return createBrowserLogLayer(outputs as ClientOutput[]);
  }
}

/**
 * 同步创建 Logger（使用默认配置）
 */
export function createLoggerSync(name: string): LogLayer {
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

  if (env.isServer) {
    // 服务端使用简单的 LogLayer 实例
    return createSimpleServerLogLayer(name, outputs as ServerOutput[]);
  } else {
    // 客户端使用新的 browser factory
    const { createBrowserLogLayer } = require('../transports/browser-factory');
    return createBrowserLogLayer(outputs as ClientOutput[]);
  }
}

/**
 * 创建带回退机制的 Logger
 */
export async function createResilientLogger(
  name: string,
  config: LoggerConfig
): Promise<LogLayer> {
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
    const logger = await createLogLayerForEnvironment(name, fallbackConfig, env);

    logger.warn('Logger created with fallback configuration');

    return logger;
  }
}

/**
 * 创建服务端 LogLayer 实例
 */
async function createServerLogLayer(name: string, outputs: ServerOutput[]): Promise<LogLayer> {
  // 检查是否有文件输出，如果有则使用自定义 transport
  const hasFileOutput = outputs.some(output => output.type === 'file');

  if (hasFileOutput) {
    // 使用自定义的 server transport 来处理文件输出
    const { ServerTransport } = await import('../transports/server');
    const transport = new ServerTransport(outputs);
    return new LogLayer({
      transport
    });
  }

  // 如果只有控制台输出，使用标准的 pino/winston transport
  try {
    const { PinoTransport } = await import('@loglayer/transport-pino');
    const pino = await import('pino');
    const transport = new PinoTransport({ logger: pino.default() });
    return new LogLayer({
      transport
    });
  } catch (error) {
    // 回退到 winston transport
    try {
      const { WinstonTransport } = await import('@loglayer/transport-winston');
      const winston = await import('winston');
      const logger = winston.default.createLogger({
        transports: [new winston.default.transports.Console()]
      });
      const transport = new WinstonTransport({ logger });
      return new LogLayer({
        transport
      });
    } catch (winstonError) {
      throw new Error('Neither pino nor winston transport available');
    }
  }
}

/**
 * 创建简单的服务端 LogLayer 实例（同步）
 */
function createSimpleServerLogLayer(name: string, outputs: ServerOutput[]): LogLayer {
  // 使用控制台 transport
  try {
    const { ConsoleTransport } = require('@loglayer/transport-simple-pretty-terminal');
    return new LogLayer({
      transport: new ConsoleTransport({})
    });
  } catch (error) {
    // 如果没有可用的 transport，创建基础配置
    return new LogLayer({
      transport: {
        shipToLogger: (params) => {
          // 使用统一的消息序列化工具
          const message = serializeMessages(params.messages)
          console.log(message)
          return params.messages
        },
        _sendToLogger: (params) => {
          // 使用统一的消息序列化工具
          const message = serializeMessages(params.messages)
          console.log(message)
        },
        getLoggerInstance: () => console,
        enabled: true
      }
    });
  }
}

// 临时包装器函数已移除，现在直接使用 LoglayerBrowserTransport
