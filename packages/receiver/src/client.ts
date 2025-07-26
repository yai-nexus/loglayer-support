/**
 * Log Receiver Client
 *
 * 一个轻量级的客户端，用于将日志发送到 @yai-loglayer/receiver 端点。
 */

/**
 * Log Receiver 客户端配置选项
 */
export interface LogReceiverClientOptions {
  /**
   * 接收器端点的 URL
   * @default '/api/client-logs'
   */
  url?: string;

  /**
   * 自定义请求头
   */
  headers?: Record<string, string>;

  /**
   * 批处理大小
   * @default 10
   */
  batchSize?: number;

  /**
   * 批处理发送间隔（毫秒）
   * @default 5000
   */
  flushInterval?: number;
}

/**
 * 用于发送日志到 @yai-loglayer/receiver 的客户端
 */
export class LogReceiverClient {
  private options: Required<LogReceiverClientOptions>;
  private buffer: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: LogReceiverClientOptions = {}) {
    this.options = {
      url: options.url || '/api/client-logs',
      headers: options.headers || {},
      batchSize: options.batchSize || 10,
      flushInterval: options.flushInterval || 5000,
    };

    if (typeof window !== 'undefined') {
      this.startFlushTimer();
    }
  }

  /**
   * 发送单条日志
   * @param log - 要发送的日志对象
   */
  log(log: any): void {
    this.buffer.push(log);
    if (this.buffer.length >= this.options.batchSize) {
      this.flush();
    }
  }

  /**
   * 立即发送缓冲区中的所有日志
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0 || typeof fetch === 'undefined') {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        body: JSON.stringify(logsToSend),
        keepalive: true, // 确保在页面卸载时也能发送
      });
    } catch (error) {
      console.error('[LogReceiverClient] Failed to send logs:', error);
      // 发送失败，将日志放回缓冲区以便下次重试
      this.buffer.unshift(...logsToSend);
    }
  }

  /**
   * 启动定时发送器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.options.flushInterval);
  }

  /**
   * 销毁实例，清理定时器
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // 最后一次尝试发送
    this.flush();
  }
}
