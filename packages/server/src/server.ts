/**
 * 服务端日志器预设
 *
 * 基于 examples/nextjs/lib/server-logger.ts 重构而来，
 * 解决 Proxy 方案的问题，提供更优雅的异步初始化
 */

import { LogLayer } from 'loglayer'
import type { LogLayerConfig } from 'loglayer'
import type { LoggerConfig, LogLevel, ServerOutput } from '@yai-loglayer/core'
import { ServerTransport } from './server-transport'

// ==================== 核心类型定义 ====================

/**
 * 服务端环境类型
 */
export type ServerEnvironment = 'development' | 'production' | 'test' | 'staging'

/**
 * 日志输出目标
 */
export interface ServerOutputConfig {
  /** 输出类型 */
  type: 'stdout' | 'stderr' | 'file' | 'syslog' | 'custom'
  /** 输出配置 */
  config?: {
    /** 文件输出目录 */
    dir?: string
    /** 文件名 */
    filename?: string
    /** 文件轮转配置 */
    rotation?: {
      maxSize?: string
      maxFiles?: number
      datePattern?: string
    }
    /** 自定义输出处理器 */
    handler?: (logData: any) => void | Promise<void>
  }
}

/**
 * 模块配置
 */
export interface ModuleConfig {
  /** 模块日志级别 */
  level?: string
  /** 模块特定输出 */
  outputs?: ServerOutputConfig[]
  /** 模块上下文 */
  context?: Record<string, any>
  /** 是否继承父级配置 */
  inherit?: boolean
}

/**
 * 路径解析配置
 */
export interface PathConfig {
  /** 项目根目录 */
  projectRoot?: string
  /** 日志目录 */
  logsDir?: string
  /** 自动检测项目根目录 */
  autoDetectRoot?: boolean
  /** 路径解析策略 */
  pathStrategy?: 'relative' | 'absolute' | 'auto'
}

/**
 * 初始化配置
 */
export interface InitializationConfig {
  /** 初始化超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retryAttempts?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 初始化失败时是否回退到控制台 */
  fallbackToConsole?: boolean
  /** 是否记录启动信息 */
  logStartupInfo?: boolean
  /** 启动信息级别 */
  startupLogLevel?: string
}

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用性能监控 */
  enabled?: boolean
  /** 监控间隔（毫秒） */
  interval?: number
  /** 内存使用阈值（MB） */
  memoryThreshold?: number
  /** CPU 使用阈值（%） */
  cpuThreshold?: number
  /** 是否记录 GC 信息 */
  trackGC?: boolean
}

/**
 * 健康检查配置
 */
export interface HealthCheckConfig {
  /** 是否启用健康检查 */
  enabled?: boolean
  /** 检查间隔（毫秒） */
  interval?: number
  /** 健康检查端点 */
  endpoint?: string
  /** 自定义健康检查函数 */
  customCheck?: () => Promise<{ healthy: boolean; details?: any }>
}

// ==================== 主配置接口 ====================

/**
 * 服务端日志器配置
 */
export interface ServerLoggerConfig extends Omit<LoggerConfig, 'server' | 'client'> {
  level: {
    default: LogLevel
    loggers?: Record<string, LogLevel>
  }
  /** 服务端环境 */
  environment?: ServerEnvironment

  /** 路径配置 */
  paths?: PathConfig

  /** 服务端输出配置 */
  outputs?: ServerOutputConfig[]

  /** 模块化配置 */
  modules?: Record<string, ModuleConfig>

  /** 初始化配置 */
  initialization?: InitializationConfig

  /** 性能监控配置 */
  performance?: PerformanceConfig

  /** 健康检查配置 */
  healthCheck?: HealthCheckConfig

  /** 全局上下文 */
  globalContext?: Record<string, any>

  /** 错误处理配置 */
  errorHandling?: {
    /** 是否捕获未处理的异常 */
    captureUncaughtExceptions?: boolean
    /** 是否捕获未处理的 Promise 拒绝 */
    captureUnhandledRejections?: boolean
    /** 错误处理器 */
    errorHandler?: (error: Error, context?: any) => void
  }
}

/**
 * 服务端日志器选项
 */
export interface ServerLoggerOptions {
  /** 是否立即初始化 */
  immediate?: boolean
  /** 初始化超时时间 */
  initTimeout?: number
  /** 是否在开发模式下启用详细日志 */
  verbose?: boolean
  /** 自定义初始化钩子 */
  onInitialized?: (instance: ServerLoggerInstance) => void | Promise<void>
  /** 自定义错误钩子 */
  onError?: (error: Error) => void
}

// ==================== 实例接口 ====================

/**
 * 模块日志器接口
 */
export interface ModuleLogger extends LogLayer {
  /** 模块名称 */
  readonly moduleName: string
  /** 获取模块配置 */
  getModuleConfig(): ModuleConfig
  /** 更新模块配置 */
  updateModuleConfig(config: Partial<ModuleConfig>): void
}

/**
 * 服务端日志器实例接口
 */
export interface ServerLoggerInstance {
  /** 主日志器实例 */
  readonly logger: LogLayer

  /** 获取模块日志器 */
  forModule(moduleName: string): ModuleLogger

  /** 检查是否已准备就绪 */
  isReady(): boolean

  /** 等待初始化完成 */
  waitForReady(): Promise<LogLayer>

  /** 获取所有模块名称 */
  getModuleNames(): string[]

  /** 获取配置 */
  getConfig(): ServerLoggerConfig

  /** 更新配置 */
  updateConfig(config: Partial<ServerLoggerConfig>): Promise<void>

  /** 获取运行时统计信息 */
  getStats(): {
    uptime: number
    totalLogs: number
    moduleStats: Record<string, { logCount: number; lastActivity: Date }>
    performance?: {
      memoryUsage: NodeJS.MemoryUsage
      cpuUsage: NodeJS.CpuUsage
    }
  }

  /** 执行健康检查 */
  healthCheck(): Promise<{
    healthy: boolean
    details: {
      logger: boolean
      outputs: Record<string, boolean>
      modules: Record<string, boolean>
      performance?: any
    }
  }>

  /** 刷新所有输出 */
  flush(): Promise<void>

  /** 优雅关闭 */
  shutdown(): Promise<void>

  /** 销毁实例 */
  destroy(): Promise<void>
}

/**
 * 服务端日志器管理器接口
 */
export interface ServerLoggerManager {
  /** 创建新实例 */
  create(name: string, config?: ServerLoggerConfig): Promise<ServerLoggerInstance>

  /** 获取现有实例 */
  get(name: string): ServerLoggerInstance | undefined

  /** 获取所有实例 */
  getAll(): Map<string, ServerLoggerInstance>

  /** 销毁实例 */
  destroy(name: string): Promise<void>

  /** 销毁所有实例 */
  destroyAll(): Promise<void>

  /** 批量健康检查 */
  healthCheckAll(): Promise<Record<string, {
    healthy: boolean
    details: any
  }>>

  /** 获取管理器统计信息 */
  getManagerStats(): {
    totalInstances: number
    activeInstances: number
    totalLogs: number
    uptime: number
  }

  /** 刷新所有实例的日志 */
  flushAll(): Promise<void>
}

// ==================== 兼容接口 ====================

/**
 * 兼容的日志器接口，支持传递对象作为第二个参数
 */
export interface CompatibleLogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  trace?(message: string, metadata?: Record<string, any>): void;
  fatal?(message: string, metadata?: Record<string, any>): void;
}

/**
 * 创建兼容的日志器包装器
 */
function createCompatibleWrapper(logLayer: LogLayer): CompatibleLogger {
  return {
    debug: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).debug(message);
      } else {
        logLayer.debug(message);
      }
    },
    info: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).info(message);
      } else {
        logLayer.info(message);
      }
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).warn(message);
      } else {
        logLayer.warn(message);
      }
    },
    error: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).error(message);
      } else {
        logLayer.error(message);
      }
    },
    trace: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).trace(message);
      } else {
        logLayer.trace(message);
      }
    },
    fatal: (message: string, metadata?: Record<string, any>) => {
      if (metadata && Object.keys(metadata).length > 0) {
        logLayer.withMetadata(metadata).fatal(message);
      } else {
        logLayer.fatal(message);
      }
    }
  };
}

// ==================== 工厂函数 ====================

/**
 * 创建服务端日志器（简化版本）
 *
 * @param name 日志器名称
 * @param config 日志器配置
 * @returns 兼容的日志器实例
 */
export async function createServerLogger(
  name: string,
  config?: ServerLoggerConfig
): Promise<CompatibleLogger> {
  // 简化实现，直接返回 LogLayer 实例
  
  // 转换配置为 ServerOutput 格式
  const outputs: ServerOutput[] = (config?.outputs || [{ type: 'stdout' }]).map(output => ({
    type: output.type as any,
    config: output.config
  }))
  
  // 创建 ServerTransport
  const transport = new ServerTransport(outputs)
  
  // 创建 LogLayer 配置
  const logLayerConfig: LogLayerConfig = {
    transport
  }

  const logLayer = new LogLayer(logLayerConfig)
  return createCompatibleWrapper(logLayer)
}

/**
 * 创建服务端日志器管理器（简化版本）
 *
 * @param globalConfig 全局配置
 * @returns 简化的管理器
 */
export function createServerLoggerManager(
  globalConfig?: Partial<ServerLoggerConfig>
): any {
  // 简化实现，返回基础管理器
  return {
    create: async (name: string, config?: ServerLoggerConfig) => {
      return await createServerLogger(name, config)
    },
    getManagerStats: () => ({
      totalInstances: 0,
      activeInstances: 0,
      totalLogs: 0,
      uptime: 0
    })
  }
}

/**
 * 创建 Next.js 服务端日志器（简化版本）
 *
 * @param config Next.js 特定配置
 * @returns LogLayer 实例
 */
export function createNextjsServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<CompatibleLogger> {
  const nextjsConfig: ServerLoggerConfig = {
    level: { default: 'info' },
    environment: (process.env.NODE_ENV as ServerEnvironment) || 'development',
    outputs: [
      { type: 'stdout' },
      {
        type: 'file',
        config: {
          dir: './logs',
          filename: 'nextjs.log'
        }
      }
    ],
    ...config
  }

  return createServerLogger('nextjs-server', nextjsConfig)
}

/**
 * 创建 Express.js 服务端日志器（简化版本）
 *
 * @param config Express.js 特定配置
 * @returns LogLayer 实例
 */
export function createExpressServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<CompatibleLogger> {
  const expressConfig: ServerLoggerConfig = {
    level: { default: 'info' },
    environment: (process.env.NODE_ENV as ServerEnvironment) || 'development',
    outputs: [
      { type: 'stdout' },
      {
        type: 'file',
        config: {
          dir: './logs',
          filename: 'express.log'
        }
      }
    ],
    ...config
  }

  return createServerLogger('express-server', expressConfig)
}
