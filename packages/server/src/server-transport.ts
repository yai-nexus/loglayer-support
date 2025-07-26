/**
 * 服务端日志传输层
 *
 * 使用原生 Node.js API 的零依赖日志传输实现
 */

import { LoggerlessTransport, type LoggerlessTransportConfig } from '@loglayer/transport'
import type { LogLayerTransportParams, LogLevelType } from '@loglayer/shared'
import type { LogLevel, LogMetadata, ServerOutput } from '@yai-loglayer/core';
import { isBrowserEnvironment, serializeMessages } from '@yai-loglayer/core';
// import { getLocalTimestamp } from './utils'; // 暂时移除，使用内联实现



/**
 * 获取本地时间戳
 */
function getLocalTimestamp(): string {
  return (
    new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-') +
    '.' +
    String(new Date().getMilliseconds()).padStart(3, '0')
  );
}
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

/**
 * 服务端输出引擎（使用原生 Node.js API）
 * 
 * 负责将日志消息路由到不同的输出目标：stdout、file、SLS、HTTP 等
 */
export class ServerOutputEngine {
  private outputs: ServerOutput[];
  private fs?: typeof import('fs');
  private path?: typeof import('path');
  private http?: typeof import('http');

  constructor(outputs: ServerOutput[]) {
    this.outputs = outputs;
    this.initNodeModules();
  }

  private initNodeModules() {
    // Initialize Node.js modules for server environment
    if (!isBrowserEnvironment()) {
      try {
        // 直接使用导入的模块
        this.fs = fs;
        this.path = path;
        this.http = http;
        // Node.js modules loaded successfully
      } catch (error) {
        // Failed to load Node.js modules
      }
    }
  }

  debug(message: string, meta: LogMetadata = {}): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta: LogMetadata = {}): void {
    this.log('error', message, meta);
  }

  private log(level: LogLevel, message: string, meta: LogMetadata): void {
    // Process log message with configured outputs
    this.outputs.forEach((output, _index) => {
      // Process output configuration

      // 检查级别过滤
      if (output.level && !this.shouldLog(level, output.level)) {
        // Skip due to level filter
        return;
      }

      // Execute output type
      switch (output.type) {
        case 'stdout':
          this.writeToStdout(message, meta, level);
          break;
        case 'file':
          this.writeToFile(message, meta, level, output.config);
          break;
        case 'sls':
          this.sendToSls(message, meta, level, output.config).catch(() => {
            // SLS 发送失败，静默处理
          });
          break;
        case 'http':
          this.sendToHttp(message, meta, level, output.config);
          break;
      }
    });
  }

  private shouldLog(messageLevel: LogLevel, outputLevel: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(outputLevel);
  }

  private writeToStdout(message: string, meta: LogMetadata, level: string): void {
    const timestamp = getLocalTimestamp();
    const formatted = `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    console.log(formatted);
  }

  private writeToFile(message: string, meta: LogMetadata, level: string, config: any = {}): void {
    if (!this.fs || !this.path) {
      return;
    }

    const timestamp = getLocalTimestamp();
    const formatted = `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

    try {
      const dir = config?.dir || './logs';
      const filename = config?.filename || 'app.log';
      const filePath = this.path.join(dir, filename);

      // Ensure directory exists
      if (!this.fs.existsSync(dir)) {
        this.fs.mkdirSync(dir, { recursive: true });
      }

      this.fs.appendFileSync(filePath, formatted);
    } catch (error) {
      // Failed to write to file
    }
  }

  private async sendToSls(message: string, meta: LogMetadata, level: string, config: any = {}): Promise<void> {
    // 检查必需的配置参数
    if (
      !config?.endpoint ||
      !config?.project ||
      !config?.logstore ||
      !config?.accessKeyId ||
      !config?.accessKeySecret
    ) {
      // 如果是开发环境，提供友好提示
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[LogLayer SLS] 缺少必需的 SLS 配置，请检查环境变量：SLS_ENDPOINT, SLS_PROJECT, SLS_LOGSTORE, SLS_ACCESS_KEY, SLS_ACCESS_KEY_SECRET'
        );
      }
      return; // 静默失败，保持与其他传输方法一致
    }

    try {
      // 使用 createRequire 来导入 CommonJS 模块
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const Client = require('@alicloud/log');

      // 创建 SLS 客户端
      const client = new Client({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        endpoint: config.endpoint,
      });

      // 构建结构化日志数据 - SLS 格式需要键值对
      const timestamp = Math.floor(Date.now() / 1000); // SLS 需要秒级时间戳
      const logContent = {
        level,
        message,
        hostname: (await import('os')).hostname(),
        pid: String(process.pid), // SLS 需要字符串值
        app_name: config.appName || 'unknown',
        // 将 meta 数据也转换为字符串
        ...Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, String(value)])),
      };

      // 发送日志到 SLS
      const logGroup = {
        logs: [
          {
            content: logContent,
            timestamp: timestamp,
          },
        ],
        topic: config.topic || 'loglayer',
        source: config.source || 'nodejs',
      };

      client.postLogStoreLogs(config.project, config.logstore, logGroup).then(() => {
        // SLS 发送成功，静默处理
      }).catch((error: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[LogLayer SLS] 发送失败:', error?.message || error);
        }
      });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[LogLayer SLS] 发送过程中出现错误:', error?.message || error);
      }
    }
  }

  private sendToHttp(message: string, meta: LogMetadata, level: string, _config: any = {}): void {
    if (!this.http) return;

    // HTTP log data would include:\n    // timestamp, level, message, meta

    // 简单的 HTTP 发送实现\n    // const url = config?.url || '/api/logs';
    // const headers = config?.headers || { 'Content-Type': 'application/json' };

    // 这里应该实现实际的 HTTP 发送
    // HTTP transport not fully implemented
  }
}

/**
 * LogLayer 兼容的服务端 Transport
 */
export interface ServerTransportConfig extends LoggerlessTransportConfig {
  outputs: ServerOutput[]
}

export class ServerTransport extends LoggerlessTransport {
  private outputEngine: ServerOutputEngine

  constructor(outputs: ServerOutput[]) {
    super({ id: 'server-transport' })
    this.outputEngine = new ServerOutputEngine(outputs)
  }

  /**
   * LogLayer 调用此方法发送日志
   */
  shipToLogger(params: LogLayerTransportParams): any[] {
    const { logLevel, messages, data } = params

    // 将 LogLayer 的日志级别映射到我们的类型
    const level = logLevel as LogLevel

    // 使用统一的消息序列化工具
    const message = serializeMessages(messages)
    const meta = data || {}

    // 使用输出引擎处理日志
    this.outputEngine.debug = (msg: string, metadata: LogMetadata = {}) => this.outputEngine['log']('debug', msg, metadata)
    this.outputEngine.info = (msg: string, metadata: LogMetadata = {}) => this.outputEngine['log']('info', msg, metadata)
    this.outputEngine.warn = (msg: string, metadata: LogMetadata = {}) => this.outputEngine['log']('warn', msg, metadata)
    this.outputEngine.error = (msg: string, metadata: LogMetadata = {}) => this.outputEngine['log']('error', msg, metadata)

    // 调用对应的日志方法
    switch (level) {
      case 'debug':
        this.outputEngine.debug(message, meta)
        break
      case 'info':
        this.outputEngine.info(message, meta)
        break
      case 'warn':
        this.outputEngine.warn(message, meta)
        break
      case 'error':
        this.outputEngine.error(message, meta)
        break
      default:
        this.outputEngine.info(message, meta)
    }

    return messages
  }
}
