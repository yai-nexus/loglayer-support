/**
 * 浏览器核心引擎
 *
 * 基于浏览器原生 API 的日志引擎，完全独立于服务端
 */

import type { LogLevel, LogMetadata, ClientOutput } from '@yai-loglayer/core';

/**
 * 浏览器 Logger（基于浏览器原生 API）
 */
export class BrowserLogger {
  private outputs: ClientOutput[];

  constructor(outputs: ClientOutput[]) {
    this.outputs = outputs;
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
    this.outputs.forEach((output) => {
      // 检查级别过滤
      if (output.level && !this.shouldLog(level, output.level)) {
        return;
      }

      switch (output.type) {
        case 'console':
          this.writeToConsole(message, meta, level);
          break;
        case 'http':
          this.sendToServer(message, meta, level, output.config);
          break;
        case 'localstorage':
          this.saveToStorage(message, meta, level, output.config);
          break;
      }
    });
  }

  private shouldLog(messageLevel: LogLevel, outputLevel: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(outputLevel);
  }

  private writeToConsole(message: string, meta: LogMetadata, level: string): void {
    const timestamp = new Date().toISOString();
    const style = this.getConsoleStyle(level);
    const hasMetadata = Object.keys(meta).length > 0;

    if (hasMetadata) {
      console.groupCollapsed(`%c${timestamp} [${level.toUpperCase()}] ${message}`, style);
      console.table(meta);
      console.groupEnd();
    } else {
      console.log(`%c${timestamp} [${level.toUpperCase()}] ${message}`, style);
    }
  }

  private sendToServer(message: string, meta: LogMetadata, level: string, config: any = {}): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
      userAgent:
        typeof (globalThis as any).navigator !== 'undefined'
          ? (globalThis as any).navigator.userAgent
          : 'unknown',
      url:
        typeof (globalThis as any).window !== 'undefined'
          ? (globalThis as any).window.location.href
          : 'unknown',
      sessionId: this.getSessionId(),
    };

    const endpoint = config?.endpoint || '/api/client-logs';
    const headers = config?.headers || { 'Content-Type': 'application/json' };

    fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(logData),
    }).catch(() => {
      // Log upload failed
    });
  }

  private saveToStorage(message: string, meta: LogMetadata, level: string, config: any = {}): void {
    const key = config?.key || 'app-logs';
    const maxEntries = config?.maxEntries || 100;

    try {
      if (typeof (globalThis as any).localStorage === 'undefined') return;
      const logs = JSON.parse((globalThis as any).localStorage.getItem(key) || '[]');
      const newLog = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
      };

      logs.push(newLog);

      // 保持最大条数限制
      if (logs.length > maxEntries) {
        logs.splice(0, logs.length - maxEntries);
      }

      (globalThis as any).localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      // Failed to save to localStorage
    }
  }

  private getConsoleStyle(level: string): string {
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336',
    };
    return styles[level as keyof typeof styles] || '';
  }

  private getSessionId(): string {
    if (typeof (globalThis as any).sessionStorage === 'undefined') {
      return 'sess_' + Math.random().toString(36).substr(2, 9);
    }

    let sessionId = (globalThis as any).sessionStorage.getItem('log-session-id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      (globalThis as any).sessionStorage.setItem('log-session-id', sessionId);
    }
    return sessionId;
  }
}
