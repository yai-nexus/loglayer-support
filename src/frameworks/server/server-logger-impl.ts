/**
 * 服务端日志器实现
 */

import type { IEnhancedLogger } from '../../core'
import type { 
  ServerLoggerInstance, 
  ServerLoggerConfig, 
  ModuleLogger,
  ModuleConfig 
} from '../server'
import { PathResolver } from './path-resolver'
import { ModuleLoggerManager } from './module-logger'

export class ServerLoggerInstanceImpl implements ServerLoggerInstance {
  private readonly pathResolver: PathResolver
  private readonly moduleManager: ModuleLoggerManager
  private readonly startTime = Date.now()
  private totalLogs = 0
  private isDestroyed = false

  constructor(
    public readonly logger: IEnhancedLogger,
    private config: ServerLoggerConfig
  ) {
    this.pathResolver = new PathResolver(config.paths)
    this.moduleManager = new ModuleLoggerManager(logger)
    
    // 初始化模块日志器
    this.initializeModules()
    
    // 设置错误处理
    this.setupErrorHandling()
    
    // 记录启动信息
    this.logStartupInfo()
  }

  // ==================== ServerLoggerInstance 接口实现 ====================

  forModule(moduleName: string): ModuleLogger {
    if (this.isDestroyed) {
      throw new Error('ServerLogger has been destroyed')
    }

    const moduleConfig = this.config.modules?.[moduleName]
    return this.moduleManager.getOrCreate(moduleName, moduleConfig)
  }

  isReady(): boolean {
    return !this.isDestroyed
  }

  async waitForReady(): Promise<IEnhancedLogger> {
    if (this.isDestroyed) {
      throw new Error('ServerLogger has been destroyed')
    }
    return this.logger
  }

  getModuleNames(): string[] {
    return this.moduleManager.getModuleNames()
  }

  getConfig(): ServerLoggerConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  async updateConfig(config: Partial<ServerLoggerConfig>): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('ServerLogger has been destroyed')
    }

    // 更新配置
    this.config = { ...this.config, ...config }
    
    // 更新模块配置
    if (config.modules) {
      this.moduleManager.updateModulesConfig(config.modules)
    }
    
    this.logger.info('服务端日志器配置已更新', { 
      updatedFields: Object.keys(config),
      timestamp: new Date().toISOString()
    })
  }

  getStats(): {
    uptime: number
    totalLogs: number
    moduleStats: Record<string, { logCount: number; lastActivity: Date }>
    performance?: {
      memoryUsage: NodeJS.MemoryUsage
      cpuUsage: NodeJS.CpuUsage
    }
  } {
    const stats: {
      uptime: number
      totalLogs: number
      moduleStats: Record<string, { logCount: number; lastActivity: Date }>
      performance?: {
        memoryUsage: NodeJS.MemoryUsage
        cpuUsage: NodeJS.CpuUsage
      }
    } = {
      uptime: Date.now() - this.startTime,
      totalLogs: this.totalLogs,
      moduleStats: this.moduleManager.getAllStats()
    }

    // 添加性能信息（如果启用）
    if (this.config.performance?.enabled) {
      stats.performance = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    }

    return stats
  }

  async healthCheck(): Promise<{
    healthy: boolean
    details: {
      logger: boolean
      outputs: Record<string, boolean>
      modules: Record<string, boolean>
      performance?: any
    }
  }> {
    const details: {
      logger: boolean
      outputs: Record<string, boolean>
      modules: Record<string, boolean>
      performance?: any
    } = {
      logger: this.isReady(),
      outputs: {} as Record<string, boolean>,
      modules: {} as Record<string, boolean>
    }

    // 检查输出状态（简化实现）
    if (this.config.outputs) {
      for (const output of this.config.outputs) {
        details.outputs[output.type] = true // 简化实现，实际应该检查输出状态
      }
    }

    // 检查模块状态
    for (const moduleName of this.moduleManager.getModuleNames()) {
      details.modules[moduleName] = true // 简化实现
    }

    // 性能检查
    if (this.config.performance?.enabled) {
      const memUsage = process.memoryUsage()
      const memThreshold = (this.config.performance.memoryThreshold || 512) * 1024 * 1024 // MB to bytes
      
      details.performance = {
        memoryUsage: memUsage,
        memoryHealthy: memUsage.heapUsed < memThreshold
      }
    }

    // 自定义健康检查
    if (this.config.healthCheck?.customCheck) {
      try {
        const customResult = await this.config.healthCheck.customCheck()
        Object.assign(details, { custom: customResult })
      } catch (error) {
        details.logger = false
        Object.assign(details, { customCheckError: error.message })
      }
    }

    const healthy = details.logger && 
                   Object.values(details.outputs).every(Boolean) &&
                   Object.values(details.modules).every(Boolean) &&
                   (!details.performance || details.performance.memoryHealthy !== false)

    return { healthy, details }
  }

  async flush(): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    // 这里应该刷新所有输出，简化实现
    this.logger.info('刷新所有日志输出')
  }

  async shutdown(): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    this.logger.info('开始优雅关闭服务端日志器', {
      uptime: Date.now() - this.startTime,
      totalLogs: this.totalLogs,
      modules: this.moduleManager.getModuleNames()
    })

    try {
      // 刷新所有输出
      await this.flush()
      
      // 等待一小段时间确保日志写入完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      this.logger.info('服务端日志器优雅关闭完成')
    } catch (error) {
      console.error('服务端日志器关闭时发生错误:', error)
    }
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    await this.shutdown()
    
    // 清理资源
    this.moduleManager.destroyAll()
    this.isDestroyed = true
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化模块日志器
   */
  private initializeModules(): void {
    if (this.config.modules) {
      for (const [moduleName, moduleConfig] of Object.entries(this.config.modules)) {
        this.moduleManager.getOrCreate(moduleName, moduleConfig)
      }
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    if (!this.config.errorHandling) {
      return
    }

    const { captureUncaughtExceptions, captureUnhandledRejections, errorHandler } = this.config.errorHandling

    if (captureUncaughtExceptions) {
      process.on('uncaughtException', (error) => {
        this.logger.logError(error, {
          source: 'uncaughtException',
          pid: process.pid,
          timestamp: new Date().toISOString()
        }, '捕获到未处理的异常')

        if (errorHandler) {
          try {
            errorHandler(error, { type: 'uncaughtException' })
          } catch (handlerError) {
            console.error('Error handler failed:', handlerError)
          }
        }
      })
    }

    if (captureUnhandledRejections) {
      process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason))
        
        this.logger.logError(error, {
          source: 'unhandledRejection',
          promise: promise.toString(),
          pid: process.pid,
          timestamp: new Date().toISOString()
        }, '捕获到未处理的 Promise 拒绝')

        if (errorHandler) {
          try {
            errorHandler(error, { type: 'unhandledRejection', promise })
          } catch (handlerError) {
            console.error('Error handler failed:', handlerError)
          }
        }
      })
    }
  }

  /**
   * 记录启动信息
   */
  private logStartupInfo(): void {
    if (!this.config.initialization?.logStartupInfo) {
      return
    }

    const level = this.config.initialization?.startupLogLevel || 'info'
    const pathInfo = this.pathResolver.getResolvedPaths()
    
    const startupInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      workingDirectory: process.cwd(),
      projectRoot: pathInfo.projectRoot,
      logsDirectory: pathInfo.logsDir,
      environment: this.config.environment || 'unknown',
      modules: Object.keys(this.config.modules || {}),
      outputs: this.config.outputs?.map(o => o.type) || [],
      startTime: new Date().toISOString()
    }

    switch (level) {
      case 'debug':
        this.logger.debug('服务端日志器启动', startupInfo)
        break
      case 'warn':
        this.logger.warn('服务端日志器启动', startupInfo)
        break
      case 'error':
        this.logger.error('服务端日志器启动', startupInfo)
        break
      default:
        this.logger.info('服务端日志器启动', startupInfo)
    }
  }
}
