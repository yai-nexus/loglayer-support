/**
 * 引擎加载器
 *
 * 智能选择最佳日志引擎，实现环境隔离和引擎优先级策略
 */

import type { ILogger, ServerOutput, ClientOutput, ServerEngineType } from '../core';
import { isBrowserEnvironment, canImport } from '../core';
import { CoreServerLogger } from './server';
import { BrowserLogger } from './client';
import { PinoAdapter, WinstonAdapter } from './adapters';

/**
 * 引擎加载器 - 自动选择最佳引擎
 */
export class EngineLoader {
  /**
   * 为服务端环境加载最佳引擎
   */
  static async loadServerEngine(outputs: ServerOutput[]): Promise<ILogger> {
    // 环境隔离：只在服务端执行
    if (isBrowserEnvironment()) {
      throw new Error('Cannot load server engine in browser environment');
    }

    try {
      // 1. 首选：Pino（如果可用）
      if (await canImport('pino')) {
        const { pino } = await import('pino');

        // 配置 pretty 格式用于 stdout 输出
        const pinoLogger = pino({
          level: 'debug',
          base: { service: 'loglayer-support' },
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname,service',
              messageFormat: '{msg}',
              customPrettifiers: {
                // 保持 meta 数据为 JSON 格式
                '*': (value: unknown) => JSON.stringify(value),
              },
            },
          },
        });
        return new PinoAdapter(pinoLogger, outputs);
      }

      // 2. 备选：Winston（如果可用）
      if (await canImport('winston')) {
        const winston = await import('winston');

        // 配置 pretty 格式用于 stdout 输出
        const winstonLogger = winston.createLogger({
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss.SSS',
            }),
            winston.format.printf((info: any) => {
              const { timestamp, level, message, ...meta } = info;
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
            })
          ),
          transports: [new winston.transports.Console()],
        });
        return new WinstonAdapter(winstonLogger, outputs);
      }

      // 3. 保底：Core（原生实现）
      return new CoreServerLogger(outputs);
    } catch (error) {
      // Failed to load preferred server engine, using core
      return new CoreServerLogger(outputs);
    }
  }

  /**
   * 为客户端环境加载引擎
   */
  static loadClientEngine(outputs: ClientOutput[]): ILogger {
    // 浏览器环境：直接返回，不做任何 Node.js 库检测
    return new BrowserLogger(outputs);
  }

  /**
   * 检查引擎是否可用
   */
  static async isEngineAvailable(engineType: ServerEngineType): Promise<boolean> {
    if (isBrowserEnvironment()) {
      return false; // 浏览器环境不支持服务端引擎
    }

    switch (engineType) {
      case 'pino':
        return (await canImport('pino')) && (await canImport('@loglayer/transport-pino'));
      case 'winston':
        return (await canImport('winston')) && (await canImport('@loglayer/transport-winston'));
      case 'core':
        return true; // 核心引擎总是可用
      default:
        return false;
    }
  }
}
