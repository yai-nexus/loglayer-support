/**
 * 日志接收器预设
 *
 * 基于 examples/nextjs/app/api/client-logs/route.ts 重构而来，
 * 提供通用的日志接收器，支持不同框架的适配
 */

import type { IEnhancedLogger } from '../core'

// ==================== 核心类型定义 ====================

/**
 * 客户端日志数据结构
 */
export interface ClientLogData {
  level: string
  message: string
  metadata?: Record<string, any>
  timestamp?: string
  userAgent?: string
  url?: string
  sessionId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * 客户端信息
 */
export interface ClientInfo {
  userAgent?: string
  url?: string
  sessionId?: string
  timestamp: string
  ip?: string
  origin?: string
  referer?: string
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * 处理结果
 */
export interface ProcessResult {
  success: boolean
  processed: number
  failed: number
  errors?: Array<{ item: any; error: string }>
}

/**
 * 响应数据
 */
export interface ResponseData {
  success: boolean
  message?: string
  timestamp: string
  data?: any
  error?: string
  details?: any
}

// ==================== 配置接口 ====================

/**
 * 验证配置
 */
export interface ValidationConfig {
  /** 是否要求 level 字段 */
  requireLevel?: boolean
  /** 是否要求 message 字段 */
  requireMessage?: boolean
  /** 允许的日志级别 */
  allowedLevels?: string[]
  /** 消息最大长度 */
  maxMessageLength?: number
  /** 元数据最大大小（字节） */
  maxMetadataSize?: number
  /** 是否验证时间戳格式 */
  validateTimestamp?: boolean
  /** 自定义验证函数 */
  customValidator?: (data: any) => ValidationResult
}

/**
 * 处理配置
 */
export interface ProcessingConfig {
  /** 是否保持客户端日志级别 */
  preserveClientLevel?: boolean
  /** 是否添加服务端上下文 */
  addServerContext?: boolean
  /** 是否记录成功接收的日志 */
  logSuccessfulReceives?: boolean
  /** 是否支持批量处理 */
  supportBatch?: boolean
  /** 批量处理最大数量 */
  maxBatchSize?: number
  /** 消息前缀 */
  messagePrefix?: string
  /** 是否重建错误对象 */
  reconstructErrors?: boolean
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  /** 是否验证来源 */
  validateOrigin?: boolean
  /** 允许的来源列表 */
  allowedOrigins?: string[]
  /** 速率限制配置 */
  rateLimiting?: {
    /** 每分钟最大请求数 */
    maxRequestsPerMinute?: number
    /** 时间窗口（毫秒） */
    windowMs?: number
    /** 是否按 IP 限制 */
    byIP?: boolean
    /** 是否按会话限制 */
    bySession?: boolean
  }
  /** 内容过滤 */
  contentFilter?: {
    /** 是否过滤敏感信息 */
    filterSensitive?: boolean
    /** 敏感字段列表 */
    sensitiveFields?: string[]
    /** 自定义过滤函数 */
    customFilter?: (data: any) => any
  }
}

/**
 * 响应配置
 */
export interface ResponseConfig {
  /** 成功响应消息 */
  successMessage?: string
  /** 错误响应消息 */
  errorMessage?: string
  /** 是否包含详细信息 */
  includeDetails?: boolean
  /** 是否包含处理统计 */
  includeStats?: boolean
  /** 自定义响应构建器 */
  customResponseBuilder?: (result: ProcessResult, data: any) => ResponseData
}

/**
 * 日志接收器配置
 */
export interface LogReceiverConfig {
  /** 验证配置 */
  validation?: ValidationConfig
  /** 处理配置 */
  processing?: ProcessingConfig
  /** 安全配置 */
  security?: SecurityConfig
  /** 响应配置 */
  response?: ResponseConfig
  /** 是否启用调试模式 */
  debug?: boolean
}

/**
 * 日志接收器选项
 */
export interface LogReceiverOptions {
  /** 接收器名称 */
  name?: string
  /** 是否立即初始化 */
  immediate?: boolean
  /** 初始化超时时间 */
  initTimeout?: number
}

// ==================== 框架适配器接口 ====================

/**
 * 框架适配器接口
 */
export interface FrameworkAdapter {
  /** 适配器名称 */
  name: string
  /** 解析请求数据 */
  parseRequest(request: any): Promise<any>
  /** 创建响应 */
  createResponse(data: ResponseData, status?: number): any
  /** 获取请求头 */
  getHeader(request: any, name: string): string | null
  /** 获取客户端 IP */
  getClientIP(request: any): string
  /** 获取请求方法 */
  getMethod(request: any): string
  /** 获取请求 URL */
  getURL(request: any): string
}

/**
 * Next.js 适配器
 */
export interface NextjsAdapter extends FrameworkAdapter {
  name: 'nextjs'
}

/**
 * Express.js 适配器
 */
export interface ExpressAdapter extends FrameworkAdapter {
  name: 'express'
}

/**
 * 通用 HTTP 适配器
 */
export interface GenericAdapter extends FrameworkAdapter {
  name: 'generic'
}

// ==================== 处理器接口 ====================

/**
 * 日志接收器处理器
 */
export interface LogReceiverHandler {
  /** Next.js API Route 处理器 */
  nextjs(request: any): Promise<any>

  /** Express.js 中间件处理器 */
  express(req: any, res: any, next?: any): Promise<void>

  /** 通用处理函数 */
  handle(data: ClientLogData | ClientLogData[], context?: any): Promise<ProcessResult>

  /** 获取状态信息 */
  getStatus(): {
    service: string
    status: 'active' | 'inactive'
    timestamp: string
    config: LogReceiverConfig
    stats?: any
  }

  /** 销毁处理器 */
  destroy(): Promise<void>
}

/**
 * 日志接收器实例接口
 */
export interface ILogReceiver {
  /** 处理单条日志 */
  processSingle(data: ClientLogData, context?: any): Promise<ProcessResult>

  /** 处理批量日志 */
  processBatch(data: ClientLogData[], context?: any): Promise<ProcessResult>

  /** 验证日志数据 */
  validate(data: any): ValidationResult

  /** 提取客户端信息 */
  extractClientInfo(data: any, request?: any): ClientInfo

  /** 构建响应 */
  buildResponse(result: ProcessResult, data?: any): ResponseData

  /** 获取配置 */
  getConfig(): LogReceiverConfig

  /** 更新配置 */
  updateConfig(config: Partial<LogReceiverConfig>): void
}

// ==================== 插件接口 ====================

/**
 * 日志接收器插件接口
 */
export interface LogReceiverPlugin {
  /** 插件名称 */
  name: string

  /** 请求预处理 */
  beforeRequest?(request: any): Promise<any>

  /** 数据验证前处理 */
  beforeValidation?(data: any): Promise<any>

  /** 数据验证后处理 */
  afterValidation?(data: any, result: ValidationResult): Promise<void>

  /** 日志处理前 */
  beforeProcessing?(data: ClientLogData[]): Promise<ClientLogData[]>

  /** 日志处理后 */
  afterProcessing?(data: ClientLogData[], result: ProcessResult): Promise<void>

  /** 响应前处理 */
  beforeResponse?(response: ResponseData): Promise<ResponseData>
}

// ==================== 工厂函数 ====================

/**
 * 创建日志接收器
 *
 * @param logger 服务端日志器实例
 * @param config 接收器配置
 * @param options 创建选项
 * @returns 日志接收器处理器
 */
export function createLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig,
  options?: LogReceiverOptions
): LogReceiverHandler {
  const { LogReceiverHandlerImpl } = require('./receiver/handler')

  const mergedOptions: LogReceiverOptions = {
    name: 'log-receiver',
    immediate: true,
    initTimeout: 5000,
    ...options
  }

  // 自动检测适配器类型
  const adapterType = 'auto'

  return new LogReceiverHandlerImpl(logger, config, adapterType)
}

/**
 * 创建 Next.js 日志接收器
 *
 * @param logger 服务端日志器实例
 * @param config 接收器配置
 * @returns Next.js API Route 处理函数
 */
export function createNextjsLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (request: any) => Promise<any> {
  const { LogReceiverHandlerImpl } = require('./receiver/handler')
  const receiver = new LogReceiverHandlerImpl(logger, config, 'nextjs')
  return receiver.nextjs.bind(receiver)
}

/**
 * 创建 Express.js 日志接收器
 *
 * @param logger 服务端日志器实例
 * @param config 接收器配置
 * @returns Express.js 中间件函数
 */
export function createExpressLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (req: any, res: any, next?: any) => Promise<void> {
  const { LogReceiverHandlerImpl } = require('./receiver/handler')
  const receiver = new LogReceiverHandlerImpl(logger, config, 'express')
  return receiver.express.bind(receiver)
}
