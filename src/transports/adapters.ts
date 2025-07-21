/**
 * 高性能适配器
 *
 * 为 Pino 和 Winston 等第三方日志库提供适配器，
 * 结合自定义输出配置实现混合日志架构
 */

import type { LogMetadata, ILogger, ServerOutput } from '../core';
import { CoreServerLogger } from './server';

/**
 * Pino 增强适配器 - 支持自定义输出配置
 */
export class PinoAdapter implements ILogger {
  private pino: any;
  private outputs: ServerOutput[];
  private coreLogger: CoreServerLogger;

  constructor(pinoInstance: any, outputs: ServerOutput[]) {
    this.pino = pinoInstance;
    this.outputs = outputs;

    // 过滤掉 stdout 输出，避免与 Pino 重复
    const customOutputs = outputs.filter((output) => output.type !== 'stdout');
    this.coreLogger = new CoreServerLogger(customOutputs);
  }

  debug(message: string, meta: LogMetadata = {}): void {
    // Pino 负责控制台输出（高性能）
    this.pino.debug(meta, message);
    // CoreLogger 负责其他自定义输出（文件、HTTP、SLS 等）
    this.coreLogger.debug(message, meta);
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.pino.info(meta, message);
    this.coreLogger.info(message, meta);
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.pino.warn(meta, message);
    this.coreLogger.warn(message, meta);
  }

  error(message: string, meta: LogMetadata = {}): void {
    this.pino.error(meta, message);
    this.coreLogger.error(message, meta);
  }
}

/**
 * Winston 增强适配器 - 支持自定义输出配置
 */
export class WinstonAdapter implements ILogger {
  private winston: any;
  private outputs: ServerOutput[];
  private coreLogger: CoreServerLogger;

  constructor(winstonInstance: any, outputs: ServerOutput[]) {
    this.winston = winstonInstance;
    this.outputs = outputs;

    // 过滤掉 stdout 输出，避免与 Winston 重复
    const customOutputs = outputs.filter((output) => output.type !== 'stdout');
    this.coreLogger = new CoreServerLogger(customOutputs);
  }

  debug(message: string, meta: LogMetadata = {}): void {
    // Winston 负责控制台输出（高性能）
    this.winston.debug(message, meta);
    // CoreLogger 负责其他自定义输出（文件、HTTP、SLS 等）
    this.coreLogger.debug(message, meta);
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.winston.info(message, meta);
    this.coreLogger.info(message, meta);
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.winston.warn(message, meta);
    this.coreLogger.warn(message, meta);
  }

  error(message: string, meta: LogMetadata = {}): void {
    this.winston.error(message, meta);
    this.coreLogger.error(message, meta);
  }
}
