/**
 * 阿里云 SLS Transport 实现
 * 
 * 提供批量发送、重试机制、错误处理等企业级特性
 */

import { LoggerlessTransport, type LoggerlessTransportConfig } from '@loglayer/transport';
import type { LogLayerTransportParams } from '@loglayer/shared';
import type { LogMetadata } from '@yai-loglayer/core';
import Sls20201230 from '@alicloud/sls20201230';

import type {
  Log,
  SlsTransportConfig,
  SlsTransportInternalConfig,
  SlsLogItem,
  SlsLogGroup,
  TransportStats
} from './types';

import {
  createInternalConfig,
  convertLogToSlsItem,
  calculateRetryDelay,
  delay,
  extractErrorMessage,
  isRetriableError,
  getCurrentTimestamp,
  formatBytes
} from './utils';

/**
 * 阿里云 SLS Transport 实现类
 */
export class SlsTransport extends LoggerlessTransport {
  private client: Sls20201230;
  private config: SlsTransportInternalConfig;
  private logBuffer: SlsLogItem[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private stats: TransportStats;
  private isShuttingDown = false;

  constructor(config: SlsTransportConfig) {
    super({ id: 'sls-transport' });
    
    this.config = createInternalConfig(config);
    this.client = new Sls20201230(this.config.sdkConfig as any);
    this.stats = this.initStats();
    
    this.setupFlushTimer();
    this.setupProcessHandlers();
  }

  /**
   * LogLayer 调用此方法发送日志
   */
  shipToLogger(params: LogLayerTransportParams): any[] {
    const { messages, data } = params;
    
    // 构建 Log 对象
    const log: Log = {
      level: params.logLevel as any,
      message: Array.isArray(messages) ? messages.join(' ') : String(messages),
      time: new Date(),
      context: data || {},
      err: this.extractError(messages)
    };

    // 添加到批量缓冲区
    this.addToBuffer(log);

    return Array.isArray(messages) ? messages : [messages];
  }

  /**
   * 添加日志到缓冲区
   */
  private addToBuffer(log: Log): void {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const slsItem = convertLogToSlsItem(log);
      this.logBuffer.push(slsItem);

      // 检查是否需要立即刷新
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flushBuffer();
      }
    } catch (error) {
      // 转换失败时的处理
      console.warn(`[SlsTransport] 日志转换失败: ${extractErrorMessage(error)}`);
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SlsTransport] 发送失败，已重试 ${this.config.maxRetries} 次: ${errorMsg}`);
    }
  }

  /**
   * 实际发送日志到 SLS
   */
  private async sendLogs(logs: SlsLogItem[]): Promise<void> {
    const logGroup = {
      logs,
      topic: this.config.topic,
      source: this.config.source,
    };

    const request = {
      project: this.config.project,
      logstore: this.config.logstore,
      body: {
        logGroup: logGroup,
      },
    };

    await (this.client as any).putLogs(this.config.project, this.config.logstore, request as any);
  }

  /**
   * 设置定时刷新器
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushBuffer().catch(error => {
          const errorMsg = extractErrorMessage(error);
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[SlsTransport] 定时刷新失败: ${errorMsg}`);
          }
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
  private extractError(messages: any): Error | undefined {
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