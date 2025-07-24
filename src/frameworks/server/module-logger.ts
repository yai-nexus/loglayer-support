/**
 * 模块日志器实现
 * 提供模块特定的日志功能和配置管理
 */

import type { IEnhancedLogger, LogMetadata } from '../../core'
import type { ModuleLogger, ModuleConfig } from '../server'

export class ModuleLoggerImpl implements ModuleLogger {
  private config: ModuleConfig
  private stats = {
    logCount: 0,
    lastActivity: new Date()
  }

  constructor(
    private readonly baseLogger: IEnhancedLogger,
    public readonly moduleName: string,
    config: ModuleConfig = {}
  ) {
    this.config = {
      level: 'info',
      inherit: true,
      context: {},
      ...config
    }
  }

  // ==================== IEnhancedLogger 接口实现 ====================

  debug(message: string, metadata: LogMetadata = {}): void {
    this.logWithModule('debug', message, metadata)
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.logWithModule('info', message, metadata)
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.logWithModule('warn', message, metadata)
  }

  error(message: string, metadata: LogMetadata = {}): void {
    this.logWithModule('error', message, metadata)
  }

  logError(error: Error, metadata: LogMetadata = {}, customMessage?: string): void {
    const moduleLogger = this.getModuleLogger()
    moduleLogger.logError(error, this.enrichMetadata(metadata), customMessage)
    this.updateStats()
  }

  child(context: LogMetadata): IEnhancedLogger {
    const moduleLogger = this.getModuleLogger()
    return moduleLogger.child(this.enrichMetadata(context))
  }

  forModule(moduleName: string): IEnhancedLogger {
    const moduleLogger = this.getModuleLogger()
    return moduleLogger.forModule(moduleName)
  }

  forRequest(requestId: string, metadata?: LogMetadata): IEnhancedLogger {
    const moduleLogger = this.getModuleLogger()
    return moduleLogger.forRequest(requestId, this.enrichMetadata(metadata))
  }

  // ==================== ModuleLogger 特定接口 ====================

  getModuleConfig(): ModuleConfig {
    return { ...this.config }
  }

  updateModuleConfig(config: Partial<ModuleConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取模块统计信息
   */
  getStats(): { logCount: number; lastActivity: Date } {
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      logCount: 0,
      lastActivity: new Date()
    }
  }

  /**
   * 获取模块上下文
   */
  getModuleContext(): Record<string, any> {
    return { ...this.config.context }
  }

  /**
   * 更新模块上下文
   */
  updateModuleContext(context: Record<string, any>): void {
    this.config.context = { ...this.config.context, ...context }
  }

  // ==================== 私有方法 ====================

  /**
   * 使用模块信息记录日志
   */
  private logWithModule(level: string, message: string, metadata: LogMetadata): void {
    const moduleLogger = this.getModuleLogger()
    const enrichedMetadata = this.enrichMetadata(metadata)
    
    // 根据级别调用相应的方法
    switch (level) {
      case 'debug':
        moduleLogger.debug(message, enrichedMetadata)
        break
      case 'info':
        moduleLogger.info(message, enrichedMetadata)
        break
      case 'warn':
        moduleLogger.warn(message, enrichedMetadata)
        break
      case 'error':
        moduleLogger.error(message, enrichedMetadata)
        break
      default:
        moduleLogger.info(message, enrichedMetadata)
    }
    
    this.updateStats()
  }

  /**
   * 获取模块日志器
   */
  private getModuleLogger(): IEnhancedLogger {
    if (this.config.inherit) {
      return this.baseLogger.forModule(this.moduleName)
    } else {
      // 如果不继承，直接使用基础日志器
      return this.baseLogger
    }
  }

  /**
   * 丰富元数据
   */
  private enrichMetadata(metadata: LogMetadata = {}): LogMetadata {
    return {
      ...this.config.context,
      ...metadata,
      module: this.moduleName
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.logCount++
    this.stats.lastActivity = new Date()
  }
}

/**
 * 模块日志器管理器
 */
export class ModuleLoggerManager {
  private readonly modules = new Map<string, ModuleLoggerImpl>()

  constructor(private readonly baseLogger: IEnhancedLogger) {}

  /**
   * 获取或创建模块日志器
   */
  getOrCreate(moduleName: string, config?: ModuleConfig): ModuleLoggerImpl {
    let moduleLogger = this.modules.get(moduleName)
    
    if (!moduleLogger) {
      moduleLogger = new ModuleLoggerImpl(this.baseLogger, moduleName, config)
      this.modules.set(moduleName, moduleLogger)
    } else if (config) {
      // 更新配置
      moduleLogger.updateModuleConfig(config)
    }
    
    return moduleLogger
  }

  /**
   * 获取现有模块日志器
   */
  get(moduleName: string): ModuleLoggerImpl | undefined {
    return this.modules.get(moduleName)
  }

  /**
   * 获取所有模块名称
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys())
  }

  /**
   * 获取所有模块统计信息
   */
  getAllStats(): Record<string, { logCount: number; lastActivity: Date }> {
    const stats: Record<string, { logCount: number; lastActivity: Date }> = {}
    
    for (const [moduleName, moduleLogger] of this.modules) {
      stats[moduleName] = moduleLogger.getStats()
    }
    
    return stats
  }

  /**
   * 重置所有模块统计信息
   */
  resetAllStats(): void {
    for (const moduleLogger of this.modules.values()) {
      moduleLogger.resetStats()
    }
  }

  /**
   * 更新模块配置
   */
  updateModuleConfig(moduleName: string, config: Partial<ModuleConfig>): void {
    const moduleLogger = this.modules.get(moduleName)
    if (moduleLogger) {
      moduleLogger.updateModuleConfig(config)
    }
  }

  /**
   * 批量更新模块配置
   */
  updateModulesConfig(configs: Record<string, Partial<ModuleConfig>>): void {
    for (const [moduleName, config] of Object.entries(configs)) {
      this.updateModuleConfig(moduleName, config)
    }
  }

  /**
   * 销毁模块日志器
   */
  destroy(moduleName: string): boolean {
    return this.modules.delete(moduleName)
  }

  /**
   * 销毁所有模块日志器
   */
  destroyAll(): void {
    this.modules.clear()
  }

  /**
   * 获取模块数量
   */
  size(): number {
    return this.modules.size
  }

  /**
   * 检查模块是否存在
   */
  has(moduleName: string): boolean {
    return this.modules.has(moduleName)
  }
}
