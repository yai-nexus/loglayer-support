/**
 * 日志接收器处理器包装器
 * 提供框架特定的处理函数
 */

import type { IEnhancedLogger } from '../../core'
import type {
  LogReceiverHandler,
  LogReceiverConfig,
  ClientLogData,
  ProcessResult
} from '../receiver'

import { LogReceiver } from './log-receiver'

export class LogReceiverHandlerImpl implements LogReceiverHandler {
  private readonly receiver: LogReceiver
  private readonly logger: IEnhancedLogger
  private readonly config: LogReceiverConfig

  constructor(
    logger: IEnhancedLogger,
    config: LogReceiverConfig = {},
    adapterType: 'nextjs' | 'express' | 'generic' | 'auto' = 'auto'
  ) {
    this.logger = logger
    this.config = config
    this.receiver = new LogReceiver(logger, config, adapterType)
  }

  /**
   * Next.js API Route 处理器
   */
  async nextjs(request: any): Promise<any> {
    const logReceiver = this.logger.forModule('client-log-receiver')
    const adapter = this.receiver.getAdapter()

    try {
      // 解析请求数据
      const requestData = await adapter.parseRequest(request)
      
      // 检查是否为批量数据
      const isArray = Array.isArray(requestData)
      const logData = isArray ? requestData : [requestData]
      
      // 处理日志
      const result = isArray 
        ? await this.receiver.processBatch(logData, { request })
        : await this.receiver.processSingle(logData[0], { request })
      
      // 构建响应
      const responseData = this.receiver.buildResponse(result, requestData)
      const status = result.success ? 200 : 400
      
      return adapter.createResponse(responseData, status)
      
    } catch (error) {
      // 记录处理错误
      logReceiver.logError(error as Error, {
        endpoint: adapter.getURL(request),
        method: adapter.getMethod(request),
        userAgent: adapter.getHeader(request, 'user-agent'),
        contentType: adapter.getHeader(request, 'content-type')
      }, '处理客户端日志时发生错误')

      const errorResponse = this.receiver.buildResponse({
        success: false,
        processed: 0,
        failed: 1,
        errors: [{ item: null, error: error instanceof Error ? error.message : String(error) }]
      })

      return adapter.createResponse(errorResponse, 500)
    }
  }

  /**
   * Express.js 中间件处理器
   */
  async express(req: any, res: any, next?: any): Promise<void> {
    const logReceiver = this.logger.forModule('client-log-receiver')
    const adapter = this.receiver.getAdapter()

    try {
      // 解析请求数据
      const requestData = await adapter.parseRequest(req)
      
      // 检查是否为批量数据
      const isArray = Array.isArray(requestData)
      const logData = isArray ? requestData : [requestData]
      
      // 处理日志
      const result = isArray 
        ? await this.receiver.processBatch(logData, { request: req })
        : await this.receiver.processSingle(logData[0], { request: req })
      
      // 构建响应
      const responseData = this.receiver.buildResponse(result, requestData)
      const status = result.success ? 200 : 400
      
      // 发送响应
      res.status(status).json(responseData)
      
    } catch (error) {
      // 记录处理错误
      logReceiver.logError(error as Error, {
        endpoint: adapter.getURL(req),
        method: adapter.getMethod(req),
        userAgent: adapter.getHeader(req, 'user-agent'),
        contentType: adapter.getHeader(req, 'content-type')
      }, '处理客户端日志时发生错误')

      const errorResponse = this.receiver.buildResponse({
        success: false,
        processed: 0,
        failed: 1,
        errors: [{ item: null, error: error instanceof Error ? error.message : String(error) }]
      })

      res.status(500).json(errorResponse)
    }
  }

  /**
   * 通用处理函数
   */
  async handle(
    data: ClientLogData | ClientLogData[], 
    context?: any
  ): Promise<ProcessResult> {
    if (Array.isArray(data)) {
      return await this.receiver.processBatch(data, context)
    } else {
      return await this.receiver.processSingle(data, context)
    }
  }

  /**
   * 获取状态信息
   */
  getStatus(): {
    service: string
    status: 'active' | 'inactive'
    timestamp: string
    config: LogReceiverConfig
    stats?: any
  } {
    return {
      service: 'client-logs-receiver',
      status: this.receiver.isDestroyed() ? 'inactive' : 'active',
      timestamp: new Date().toISOString(),
      config: this.receiver.getConfig(),
      stats: {
        adapter: this.receiver.getAdapter().name,
        supportedMethods: ['POST'],
        acceptedLogLevels: this.config.validation?.allowedLevels || ['debug', 'info', 'warn', 'error'],
        requiredFields: [
          ...(this.config.validation?.requireLevel ? ['level'] : []),
          ...(this.config.validation?.requireMessage ? ['message'] : [])
        ]
      }
    }
  }

  /**
   * 销毁处理器
   */
  async destroy(): Promise<void> {
    await this.receiver.destroy()
  }

  /**
   * 获取底层接收器
   */
  getReceiver(): LogReceiver {
    return this.receiver
  }
}
