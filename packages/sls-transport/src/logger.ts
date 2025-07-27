/**
 * SLS Transport 内部日志工具
 * 提供统一的错误处理和调试日志策略
 */

/**
 * 日志级别
 */
export type InternalLogLevel = 'debug' | 'warn' | 'error';

/**
 * 内部日志配置
 */
interface InternalLoggerConfig {
  enabled: boolean;
  level: InternalLogLevel;
  prefix: string;
}

/**
 * SLS Transport 内部日志器
 */
class InternalLogger {
  private config: InternalLoggerConfig;

  constructor(config: Partial<InternalLoggerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production',
      level: 'warn',
      prefix: '[SlsTransport]',
      ...config,
    };
  }

  /**
   * 调试日志 - 仅在开发环境显示
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      console.debug(`${this.config.prefix} ${message}`, ...args);
    }
  }

  /**
   * 警告日志 - 重要但不致命的问题
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.enabled && this.shouldLog('warn')) {
      console.warn(`${this.config.prefix} ${message}`, ...args);
    }
  }

  /**
   * 错误日志 - 严重问题，但不抛出异常
   */
  error(message: string, ...args: unknown[]): void {
    if (this.config.enabled && this.shouldLog('error')) {
      console.error(`${this.config.prefix} ${message}`, ...args);
    }
  }

  /**
   * 静默处理 - 记录但不显示（用于生产环境的统计）
   */
  silent(_message: string, ..._args: unknown[]): void {
    // 在实际应用中，这里可以发送到监控系统
    // 当前实现为静默处理
  }

  private shouldLog(level: InternalLogLevel): boolean {
    const levels: InternalLogLevel[] = ['debug', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 更新配置
   */
  configure(config: Partial<InternalLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 导出单例实例
export const internalLogger = new InternalLogger();

/**
 * 配置内部日志器
 */
export function configureInternalLogger(config: Partial<InternalLoggerConfig>): void {
  internalLogger.configure(config);
}