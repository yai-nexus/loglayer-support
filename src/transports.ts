/**
 * 输出引擎模块
 *
 * 实现基于输出手段的架构，完全按照 docs/implementation-strategy.md 设计
 * 包含服务端核心引擎、浏览器核心引擎和高性能适配器
 */

import type {
  LogLevel,
  LogMetadata,
  ILogger,
  ServerOutput,
  ClientOutput,
  ServerEngineType,
  FormatMapping
} from "./types";
import { isBrowserEnvironment, canImport } from "./environment";

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 生成本地时间格式的时间戳
 */
function getLocalTimestamp(): string {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-') + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
}

// =============================================================================
// 格式映射配置（自动绑定）
// =============================================================================

const serverFormatMapping: Record<string, FormatMapping> = {
  stdout: {
    format: 'pretty',
    options: { colorize: true, timestamp: true }
  },
  file: {
    format: 'pretty', 
    options: { timestamp: true, level: true, colorize: false }
  },
  sls: {
    format: 'structured',
    options: { timestamp: true, hostname: true, pid: true }
  },
  http: {
    format: 'json',
    options: { timestamp: true }
  }
};

const clientFormatMapping: Record<string, FormatMapping> = {
  console: {
    format: 'pretty',
    options: { colorize: true, groupCollapsed: true }
  },
  http: {
    format: 'json',
    options: { 
      timestamp: true, 
      userAgent: true, 
      url: true,
      sessionId: true 
    }
  },
  localstorage: {
    format: 'json',
    options: { timestamp: true, compact: true }
  }
};

// =============================================================================
// 服务端核心引擎（基础实现，零依赖）
// =============================================================================

/**
 * 服务端核心 Logger（使用原生 Node.js API）
 */
export class CoreServerLogger implements ILogger {
  private outputs: ServerOutput[];
  private fs?: typeof import('fs');
  private path?: typeof import('path');
  private http?: typeof import('http');

  constructor(outputs: ServerOutput[]) {
    this.outputs = outputs;
    this.initNodeModules();
  }

  private initNodeModules() {
    console.log('[DEBUG] CoreServerLogger: initNodeModules called');
    console.log('[DEBUG] isBrowserEnvironment():', isBrowserEnvironment());
    if (!isBrowserEnvironment()) {
      try {
        // 同步导入 Node.js 模块
        this.fs = require('fs');
        this.path = require('path');
        this.http = require('http');
        console.log('[DEBUG] Node.js modules loaded successfully:', {
          fs: !!this.fs,
          path: !!this.path,
          http: !!this.http
        });
      } catch (error) {
        console.warn('Failed to load Node.js modules:', error);
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
    console.log(`[DEBUG] CoreServerLogger.log called: level=${level}, message="${message}", outputs count=${this.outputs.length}`);
    this.outputs.forEach((output, index) => {
      console.log(`[DEBUG] Processing output ${index}:`, output);
      
      // 检查级别过滤
      if (output.level && !this.shouldLog(level, output.level)) {
        console.log(`[DEBUG] Skipping output ${index} due to level filter: message=${level}, required=${output.level}`);
        return;
      }

      console.log(`[DEBUG] Executing output ${index} type: ${output.type}`);
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
    console.log('[DEBUG] writeToFile called with config:', config);
    console.log('[DEBUG] fs and path available:', { fs: !!this.fs, path: !!this.path });
    
    if (!this.fs || !this.path) {
      console.log('[DEBUG] Missing fs or path modules, skipping file write');
      return;
    }
    
    const timestamp = getLocalTimestamp();
    const formatted = `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
    
    try {
      const dir = config?.dir || './logs';
      const filename = config?.filename || 'app.log';
      const filePath = this.path.join(dir, filename);
      
      console.log('[DEBUG] File write details:', { dir, filename, filePath });
      
      // 确保目录存在
      if (!this.fs.existsSync(dir)) {
        console.log('[DEBUG] Directory does not exist, creating:', dir);
        this.fs.mkdirSync(dir, { recursive: true });
        console.log('[DEBUG] Directory created successfully');
      } else {
        console.log('[DEBUG] Directory already exists:', dir);
      }
      
      console.log('[DEBUG] Writing to file:', filePath);
      console.log('[DEBUG] Content to write:', formatted.trim());
      this.fs.appendFileSync(filePath, formatted);
      console.log('[DEBUG] File write successful');
    } catch (error) {
      console.error('[DEBUG] Failed to write to file:', error);
    }
  }

  private sendToSls(message: string, meta: LogMetadata, level: string, config: any = {}): void {
    // SLS 实现（结构化格式）
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
      hostname: require('os').hostname?.() || 'unknown',
      pid: process.pid
    };

    // 这里应该调用实际的 SLS SDK
    console.log(`[SLS] ${JSON.stringify(logData)}`);
  }

  private sendToHttp(message: string, meta: LogMetadata, level: string, config: any = {}): void {
    if (!this.http) return;

    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    // 简单的 HTTP 发送实现
    const url = config?.url || '/api/logs';
    const headers = config?.headers || { 'Content-Type': 'application/json' };

    // 这里应该实现实际的 HTTP 发送
    console.log(`[HTTP] Sending to ${url}:`, logData);
  }
}

// =============================================================================
// 浏览器核心引擎（完全独立）
// =============================================================================

/**
 * 浏览器 Logger（基于浏览器原生 API）
 */
export class BrowserLogger implements ILogger {
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
    this.outputs.forEach(output => {
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
      userAgent: typeof (globalThis as any).navigator !== 'undefined' ? (globalThis as any).navigator.userAgent : 'unknown',
      url: typeof (globalThis as any).window !== 'undefined' ? (globalThis as any).window.location.href : 'unknown',
      sessionId: this.getSessionId()
    };

    const endpoint = config?.endpoint || '/api/client-logs';
    const headers = config?.headers || { 'Content-Type': 'application/json' };

    fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(logData)
    }).catch(err => console.warn('日志上报失败:', err));
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
        ...meta
      };
      
      logs.push(newLog);
      
      // 保持最大条数限制
      if (logs.length > maxEntries) {
        logs.splice(0, logs.length - maxEntries);
      }
      
      (globalThis as any).localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private getConsoleStyle(level: string): string {
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3', 
      warn: 'color: #FF9800',
      error: 'color: #F44336'
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

// =============================================================================
// 高性能适配器（可选增强）
// =============================================================================

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
    const customOutputs = outputs.filter(output => output.type !== 'stdout');
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
    const customOutputs = outputs.filter(output => output.type !== 'stdout');
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

// =============================================================================
// 引擎加载器（智能选择）
// =============================================================================

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
        const pinoLogger = pino({
          level: 'debug',
          base: { service: 'loglayer-support' },
        });
        return new PinoAdapter(pinoLogger, outputs);
      }

      // 2. 备选：Winston（如果可用） 
      if (await canImport('winston')) {
        const winston = await import('winston');
        const winstonLogger = winston.createLogger({
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          transports: [
            new winston.transports.Console()
          ]
        });
        return new WinstonAdapter(winstonLogger, outputs);
      }

      // 3. 保底：Core（原生实现）
      return new CoreServerLogger(outputs);
    } catch (error) {
      console.warn('Failed to load preferred server engine, using core:', error);
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
        return await canImport('pino') && await canImport('@loglayer/transport-pino');
      case 'winston':
        return await canImport('winston') && await canImport('@loglayer/transport-winston');
      case 'core':
        return true; // 核心引擎总是可用
      default:
        return false;
    }
  }
}