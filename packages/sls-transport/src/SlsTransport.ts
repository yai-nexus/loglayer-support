/**
 * 阿里云 SLS Transport 实现
 * 
 * 提供批量发送、重试机制、错误处理等企业级特性
 */

import { LoggerlessTransport, type LoggerlessTransportConfig } from '@loglayer/transport';
import type { LogLayerTransportParams, LogLevelType, MessageDataType } from '@loglayer/shared';

import type {
  SlsTransportConfig,
  SlsTransportInternalConfig,
  SlsLogItem,
  SlsLogGroup,
  TransportStats
} from './types';

import {
  validateSlsConfig,
  convertLogToSlsItem,
  calculateRetryDelay,
  delay,
  extractErrorMessage,
  isRetriableError,
  getCurrentTimestamp,
  formatBytes
} from './utils';
import { internalLogger } from './logger';
import { SlsRestClient } from './SlsRestClient';

/**
 * 阿里云 SLS Transport 实现类
 */
/**
 * 阿里云 SLS Transport 实现类
 * 使用纯 REST API 实现，无原生模块依赖，解决 Next.js 兼容性问题
 */
export class SlsTransport extends LoggerlessTransport {
  private restClient: SlsRestClient;
  private config: SlsTransportInternalConfig;
  private logBuffer: SlsLogItem[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private stats: TransportStats;
  private isShuttingDown = false;

  constructor(config: SlsTransportConfig) {
    super({ id: 'sls-transport' });
    
    // 验证配置
    validateSlsConfig(config);
    
    // 直接创建内部配置，无需额外函数
    this.config = {
      sdkConfig: {
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
      },
      project: config.project,
      logstore: config.logstore,
      topic: config.topic || 'loglayer',
      source: config.source || 'nodejs',
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000,
      maxRetries: config.maxRetries || 3,
      retryBaseDelay: config.retryBaseDelay || 1000,
    };
    
    // 使用 REST 客户端替代 SDK，避免原生模块依赖
    this.restClient = new SlsRestClient(this.config);
    this.stats = this.initStats();
    
    internalLogger.debug('SlsTransport 初始化完成 (REST API 模式)', {
      project: this.config.project,
      logstore: this.config.logstore,
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushInterval
    });
    
    this.setupFlushTimer();
    this.setupProcessHandlers();
  }

  /**
   * LogLayer 调用此方法发送日志
   */
  shipToLogger(params: LogLayerTransportParams): MessageDataType[] {
    const { messages, data } = params;
    
    // 直接使用 LogLayer 参数，无需自定义 Log 对象
    const logData = {
      level: params.logLevel as LogLevelType,
      message: Array.isArray(messages) ? messages.join(' ') : String(messages),
      time: new Date(),
      context: data || {},
      err: this.extractError(messages)
    };

    // 添加到批量缓冲区
    this.addToBuffer(logData);

    return Array.isArray(messages) ? messages : [messages];
  }

  /**
   * 添加日志到缓冲区
   */
  private addToBuffer(logData: {
    level: LogLevelType;
    message: string;
    time: Date;
    context: Record<string, unknown>;
    err?: Error;
  }): void {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const slsItem = convertLogToSlsItem(logData);
      this.logBuffer.push(slsItem);

      // 检查是否需要立即刷新
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flushBuffer();
      }
    } catch (error) {
      // 转换失败时的处理
      internalLogger.warn(`日志转换失败: ${extractErrorMessage(error)}`);
    }
  }

  /**
   * 刷新缓冲区，发送日志到 SLS
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    // 复制并清空缓冲区
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendLogsWithRetry(logsToSend);
  }

  /**
   * 带重试机制的日志发送
   */
  private async sendLogsWithRetry(logs: SlsLogItem[]): Promise<void> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.sendLogs(logs);
        
        // 发送成功
        this.stats.successCount++;
        this.stats.totalSent += logs.length;
        this.stats.batchCount++;
        this.stats.lastSentAt = new Date();
        
        if (attempt > 0) {
          this.stats.retryCount += attempt;
        }
        
        return;
      } catch (error) {
        lastError = error;
        this.stats.failureCount++;
        this.stats.lastErrorAt = new Date();

        // 最后一次尝试失败
        if (attempt === this.config.maxRetries) {
          break;
        }

        // 检查是否可重试
        if (!isRetriableError(error)) {
          break;
        }

        // 计算重试延迟
        const delayMs = calculateRetryDelay(attempt, this.config.retryBaseDelay);
        await delay(delayMs);
      }
    }

    // 所有重试都失败了
    const errorMsg = extractErrorMessage(lastError);
    internalLogger.warn(`发送失败，已重试 ${this.config.maxRetries} 次: ${errorMsg}`);
  }

  /**
   * 实际发送日志到 SLS (使用 REST API)
   */
  private async sendLogs(logs: SlsLogItem[]): Promise<void> {
    // 使用新的 REST 客户端发送日志
    await this.restClient.putLogs(logs);
    
    internalLogger.debug('成功发送日志到 SLS', { 
      logsCount: logs.length,
      project: this.config.project,
      logstore: this.config.logstore 
    });
  }

  /**
   * 设置定时刷新器
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushBuffer().catch(error => {
          const errorMsg = extractErrorMessage(error);
          internalLogger.warn(`定时刷新失败: ${errorMsg}`);
        });
      }
    }, this.config.flushInterval);

    // 避免 Node.js 进程因为定时器而无法退出
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  /**
   * 设置进程处理器，确保应用退出时刷新缓冲区
   */
  private setupProcessHandlers(): void {
    const flushAndExit = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }
      
      this.isShuttingDown = true;
      
      try {
        // 清理定时器
        if (this.flushTimer) {
          clearInterval(this.flushTimer);
          this.flushTimer = null;
        }

        // 最后一次刷新缓冲区
        if (this.logBuffer.length > 0) {
          await this.flushBuffer();
        }
      } catch (error) {
        // 退出时的错误不再打印，避免影响正常退出
      }
    };

    // 监听进程退出信号
    process.once('SIGINT', () => flushAndExit('SIGINT'));
    process.once('SIGTERM', () => flushAndExit('SIGTERM'));
    process.once('beforeExit', () => flushAndExit('beforeExit'));
  }

  /**
   * 从消息中提取错误对象
   */
  private extractError(messages: unknown): Error | undefined {
    if (!Array.isArray(messages)) {
      return messages instanceof Error ? messages : undefined;
    }

    return messages.find(msg => msg instanceof Error);
  }

  /**
   * 初始化统计信息
   */
  private initStats(): TransportStats {
    return {
      totalSent: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      batchCount: 0,
      lastSentAt: null,
      lastErrorAt: null,
    };
  }

  /**
   * 获取传输统计信息
   */
  public getStats(): Readonly<TransportStats> {
    return { ...this.stats };
  }

  /**
   * 立即刷新缓冲区（公共方法）
   */
  public async flush(): Promise<void> {
    await this.flushBuffer();
  }

  /**
   * 关闭传输器，清理资源
   */
  public async close(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 最后一次刷新
    await this.flushBuffer();
  }

  /**
   * 获取当前缓冲区状态
   */
  public getBufferInfo(): { count: number; estimatedSize: string } {
    const estimatedSize = this.logBuffer.reduce((total, item) => {
      return total + JSON.stringify(item).length;
    }, 0);

    return {
      count: this.logBuffer.length,
      estimatedSize: formatBytes(estimatedSize),
    };
  }
}