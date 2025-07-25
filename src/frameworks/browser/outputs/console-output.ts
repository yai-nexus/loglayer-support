/**
 * 控制台输出器
 * 负责将日志输出到浏览器控制台
 */

import type { LogOutput, BrowserLogData, ConsoleOutputConfig } from '../../browser'
import { isBrowser } from '../utils'

export class ConsoleOutput implements LogOutput {
  readonly name = 'console'
  private readonly config: ConsoleOutputConfig

  constructor(config: ConsoleOutputConfig) {
    const defaultConfig = {
      groupCollapsed: true,
      colorized: true,
      showTimestamp: true,
      showMetadataTable: true,
      colors: {
        debug: '#888',
        info: '#2196F3',
        warn: '#FF9800',
        error: '#F44336'
      }
    }

    this.config = {
      ...defaultConfig,
      ...config
    }
  }

  /**
   * 写入日志到控制台
   */
  write(data: BrowserLogData): void {
    if (!this.config.enabled || !isBrowser()) {
      return
    }

    try {
      const hasMetadata = !!(data.metadata && Object.keys(data.metadata).length > 0)
      const hasError = !!data.error

      if ((hasMetadata || hasError) && this.config.groupCollapsed === true) {
        this.writeGroupedLog(data, hasMetadata, hasError)
      } else {
        this.writeSimpleLog(data)
      }
    } catch (error) {
      // 如果控制台输出失败，使用基础的 console.log
      console.log('Log output failed:', error, data)
    }
  }

  /**
   * 写入分组日志
   */
  private writeGroupedLog(data: BrowserLogData, hasMetadata: boolean, hasError: boolean): void {
    const message = this.formatMessage(data)
    const style = this.getStyle(data.level)

    console.groupCollapsed(`%c${message}`, style)

    if (hasMetadata && this.config.showMetadataTable) {
      console.table(data.metadata)
    }

    if (hasError && data.error) {
      console.error('Error Details:', data.error)
      if (data.error.stack) {
        console.error('Stack Trace:', data.error.stack)
      }
    }

    // 显示完整的日志数据（在开发模式下）
    if (process.env.NODE_ENV === 'development') {
      console.log('Full Log Data:', data)
    }

    console.groupEnd()
  }

  /**
   * 写入简单日志
   */
  private writeSimpleLog(data: BrowserLogData): void {
    const message = this.formatMessage(data)
    const style = this.getStyle(data.level)

    // 根据日志级别选择合适的控制台方法
    switch (data.level.toLowerCase()) {
      case 'debug':
        console.debug(`%c${message}`, style)
        break
      case 'info':
        console.info(`%c${message}`, style)
        break
      case 'warn':
        console.warn(`%c${message}`, style)
        break
      case 'error':
        console.error(`%c${message}`, style)
        break
      default:
        console.log(`%c${message}`, style)
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(data: BrowserLogData): string {
    const parts: string[] = []

    // 添加时间戳
    if (this.config.showTimestamp) {
      const timestamp = new Date(data.timestamp).toLocaleTimeString()
      parts.push(timestamp)
    }

    // 添加日志级别
    parts.push(`[${data.level.toUpperCase()}]`)

    // 添加消息
    parts.push(data.message)

    // 添加会话 ID（在开发模式下）
    if (process.env.NODE_ENV === 'development' && data.sessionId) {
      parts.push(`(${data.sessionId.slice(-8)})`)
    }

    return parts.join(' ')
  }

  /**
   * 获取样式字符串
   */
  private getStyle(level: string): string {
    if (!this.config.colorized) {
      return ''
    }

    const color = this.config.colors?.[level as keyof typeof this.config.colors]
    return color ? `color: ${color}; font-weight: bold;` : ''
  }

  /**
   * 刷新缓冲区（控制台输出无需缓冲）
   */
  async flush(): Promise<void> {
    // 控制台输出是同步的，无需刷新
  }

  /**
   * 销毁输出器
   */
  async destroy(): Promise<void> {
    // 控制台输出无需清理
  }

  /**
   * 检查是否可用
   */
  isAvailable(): boolean {
    return isBrowser() && typeof console !== 'undefined'
  }

  /**
   * 获取配置
   */
  getConfig(): ConsoleOutputConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ConsoleOutputConfig>): void {
    Object.assign(this.config, config)
  }
}
