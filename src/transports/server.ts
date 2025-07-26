/**
 * 服务端核心引擎
 *
 * 使用原生 Node.js API 的零依赖日志引擎
 */

import type { LogLevel, LogMetadata, ServerOutput } from '../core';
import { isBrowserEnvironment } from '../core';
import { getLocalTimestamp } from './utils';

/**
 * 服务端核心 Logger（使用原生 Node.js API）
 */
export class CoreServerLogger {
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
        // 同步导入 Node.js 模块
        this.fs = require('fs');
        this.path = require('path');
        this.http = require('http');
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
          this.sendToSls(message, meta, level, output.config);
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

  private sendToSls(message: string, meta: LogMetadata, level: string, config: any = {}): void {
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
      // 动态导入 SLS SDK
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
        hostname: require('os').hostname(),
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

      client.postLogStoreLogs(config.project, config.logstore, logGroup).catch(() => {
        // SLS 发送失败，静默处理
      });
    } catch (error) {
      // SLS SDK 不可用或其他错误，静默处理
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
