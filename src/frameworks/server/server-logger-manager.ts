/**
 * 服务端日志器管理器实现
 */

import { createLogger } from '../../core'
import type { 
  ServerLoggerManager, 
  ServerLoggerInstance, 
  ServerLoggerConfig 
} from '../server'
import { ServerLoggerInstanceImpl } from './server-logger-impl'

export class ServerLoggerManagerImpl implements ServerLoggerManager {
  private readonly instances = new Map<string, ServerLoggerInstance>()
  private readonly globalConfig: Partial<ServerLoggerConfig>

  constructor(globalConfig: Partial<ServerLoggerConfig> = {}) {
    this.globalConfig = globalConfig
  }

  /**
   * 创建新的日志器实例
   */
  async create(name: string, config?: ServerLoggerConfig): Promise<ServerLoggerInstance> {
    if (this.instances.has(name)) {
      throw new Error(`Logger instance with name "${name}" already exists`)
    }

    try {
      // 合并全局配置和实例配置
      const mergedConfig = this.mergeConfigs(this.globalConfig, config)
      
      // 创建底层日志器
      const logger = await createLogger(name, this.buildLoggerConfig(mergedConfig))
      
      // 创建服务端日志器实例
      const instance = new ServerLoggerInstanceImpl(logger, mergedConfig)
      
      // 缓存实例
      this.instances.set(name, instance)
      
      return instance
    } catch (error) {
      throw new Error(`Failed to create logger instance "${name}": ${error.message}`)
    }
  }

  /**
   * 获取现有实例
   */
  get(name: string): ServerLoggerInstance | undefined {
    return this.instances.get(name)
  }

  /**
   * 获取所有实例
   */
  getAll(): Map<string, ServerLoggerInstance> {
    return new Map(this.instances)
  }

  /**
   * 销毁指定实例
   */
  async destroy(name: string): Promise<void> {
    const instance = this.instances.get(name)
    if (instance) {
      await instance.destroy()
      this.instances.delete(name)
    }
  }

  /**
   * 销毁所有实例
   */
  async destroyAll(): Promise<void> {
    const destroyPromises = Array.from(this.instances.values()).map(instance => 
      instance.destroy()
    )
    
    await Promise.all(destroyPromises)
    this.instances.clear()
  }

  /**
   * 获取管理器统计信息
   */
  getManagerStats(): {
    totalInstances: number
    instanceNames: string[]
    globalConfig: Partial<ServerLoggerConfig>
  } {
    return {
      totalInstances: this.instances.size,
      instanceNames: Array.from(this.instances.keys()),
      globalConfig: { ...this.globalConfig }
    }
  }

  /**
   * 批量健康检查
   */
  async healthCheckAll(): Promise<Record<string, {
    healthy: boolean
    details: any
  }>> {
    const results: Record<string, any> = {}
    
    for (const [name, instance] of this.instances) {
      try {
        results[name] = await instance.healthCheck()
      } catch (error) {
        results[name] = {
          healthy: false,
          details: { error: error.message }
        }
      }
    }
    
    return results
  }

  /**
   * 批量刷新
   */
  async flushAll(): Promise<void> {
    const flushPromises = Array.from(this.instances.values()).map(instance => 
      instance.flush()
    )
    
    await Promise.all(flushPromises)
  }

  /**
   * 批量优雅关闭
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.instances.values()).map(instance => 
      instance.shutdown()
    )
    
    await Promise.all(shutdownPromises)
  }

  // ==================== 私有方法 ====================

  /**
   * 合并配置
   */
  private mergeConfigs(
    globalConfig: Partial<ServerLoggerConfig>,
    instanceConfig?: ServerLoggerConfig
  ): ServerLoggerConfig {
    const merged: ServerLoggerConfig = {
      environment: 'development',
      paths: {
        autoDetectRoot: true,
        pathStrategy: 'auto',
        logsDir: './logs'
      },
      outputs: [
        { type: 'stdout' }
      ],
      modules: {},
      initialization: {
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        fallbackToConsole: true,
        logStartupInfo: true
      },
      performance: {
        enabled: false
      },
      healthCheck: {
        enabled: false
      },
      errorHandling: {
        captureUncaughtExceptions: false,
        captureUnhandledRejections: false
      },
      ...globalConfig,
      ...instanceConfig
    }

    // 深度合并嵌套对象
    if (globalConfig.paths && instanceConfig?.paths) {
      merged.paths = { ...globalConfig.paths, ...instanceConfig.paths }
    }
    
    if (globalConfig.modules && instanceConfig?.modules) {
      merged.modules = { ...globalConfig.modules, ...instanceConfig.modules }
    }
    
    if (globalConfig.initialization && instanceConfig?.initialization) {
      merged.initialization = { ...globalConfig.initialization, ...instanceConfig.initialization }
    }
    
    if (globalConfig.performance && instanceConfig?.performance) {
      merged.performance = { ...globalConfig.performance, ...instanceConfig.performance }
    }
    
    if (globalConfig.healthCheck && instanceConfig?.healthCheck) {
      merged.healthCheck = { ...globalConfig.healthCheck, ...instanceConfig.healthCheck }
    }
    
    if (globalConfig.errorHandling && instanceConfig?.errorHandling) {
      merged.errorHandling = { ...globalConfig.errorHandling, ...instanceConfig.errorHandling }
    }

    return merged
  }

  /**
   * 构建底层日志器配置
   */
  private buildLoggerConfig(config: ServerLoggerConfig): any {
    // 将 ServerLoggerConfig 转换为底层 LoggerConfig
    return {
      level: {
        default: 'info',
        loggers: this.buildModuleLevels(config.modules || {})
      },
      server: {
        outputs: this.buildServerOutputs(config.outputs || [])
      },
      client: {
        outputs: [{ type: 'console' }] // 服务端不需要客户端输出
      }
    }
  }

  /**
   * 构建模块级别配置
   */
  private buildModuleLevels(modules: Record<string, any>): Record<string, string> {
    const levels: Record<string, string> = {}
    
    for (const [moduleName, moduleConfig] of Object.entries(modules)) {
      if (moduleConfig.level) {
        levels[moduleName] = moduleConfig.level
      }
    }
    
    return levels
  }

  /**
   * 构建服务端输出配置
   */
  private buildServerOutputs(outputs: any[]): any[] {
    return outputs.map(output => {
      switch (output.type) {
        case 'file':
          return {
            type: 'file',
            config: {
              dir: output.config?.dir || './logs',
              filename: output.config?.filename || 'server.log',
              ...output.config
            }
          }
        case 'stdout':
        case 'stderr':
        default:
          return {
            type: output.type || 'stdout',
            config: output.config || {}
          }
      }
    })
  }
}
