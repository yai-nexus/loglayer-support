/**
 * 日志接收器预设
 *
 * 简化版本，提供基础的日志接收功能
 */

import type { LogLayer } from 'loglayer'

// ==================== 核心类型定义 ====================

/**
 * 日志接收器配置
 */
export interface LogReceiverConfig {
  /** 验证配置 */
  validation?: {
    /** 是否要求日志级别 */
    requireLevel?: boolean
    /** 是否要求消息内容 */
    requireMessage?: boolean
    /** 是否要求时间戳 */
    requireTimestamp?: boolean
    /** 最大消息长度 */
    maxMessageLength?: number
    /** 允许的日志级别 */
    allowedLevels?: string[]
    /** 严格模式 */
    strictMode?: boolean
  }
  /** 处理配置 */
  processing?: {
    /** 是否支持批量处理 */
    supportBatch?: boolean
    /** 最大批量大小 */
    maxBatchSize?: number
    /** 是否启用过滤 */
    enableFiltering?: boolean
    /** 是否启用格式化 */
    enableFormatting?: boolean
    /** 是否保留元数据 */
    preserveMetadata?: boolean
  }
  /** 适配器类型 */
  adapter?: 'nextjs' | 'express' | 'fastify' | 'generic'
}

/**
 * Next.js 日志接收器函数类型
 */
export type NextjsLogReceiver = (request: any) => Promise<{
  status: number
  json: () => Promise<any>
}>

// ==================== 工厂函数 ====================

/**
 * 创建日志接收器（简化版本）
 *
 * @param logger 服务端日志器实例
 * @param config 接收器配置
 * @returns 简化的日志接收器
 */
export function createLogReceiver(
  logger: LogLayer,
  config?: LogReceiverConfig
): any {
  // 简化实现，直接返回基础处理器
  return {
    handle: async (request: any) => {
      try {
        const data = await request.json()
        logger.info('Received log', data)
        return { success: true }
      } catch (error) {
        logger.error('Failed to process log', String(error))
        return { success: false, error: 'Invalid request' }
      }
    }
  }
}

/**
 * 创建 Next.js 日志接收器（简化版本）
 *
 * @param logger 服务端日志器实例
 * @param config Next.js 特定配置
 * @returns Next.js 日志接收器处理器
 */
export function createNextjsLogReceiver(
  logger: LogLayer,
  config?: LogReceiverConfig
): NextjsLogReceiver {
  // 简化实现
  return async (request: any) => {
    try {
      const data = await request.json()
      
      // 处理批量日志
      if (Array.isArray(data)) {
        data.forEach(log => {
          logger.info(log.message || 'Log from client', log.metadata || {})
        })
        return {
          status: 200,
          json: async () => ({ success: true, processed: data.length })
        }
      } else {
        logger.info(data.message || 'Log from client', data.metadata || {})
        return {
          status: 200,
          json: async () => ({ success: true, processed: 1 })
        }
      }
    } catch (error) {
      logger.error('Next.js log receiver error: ' + (error instanceof Error ? error.message : String(error)))

      return {
        status: 500,
        json: async () => ({ 
          success: false, 
          error: 'Internal server error' 
        })
      }
    }
  }
}

/**
 * 创建 Express.js 日志接收器（简化版本）
 *
 * @param logger 服务端日志器实例
 * @param config 接收器配置
 * @returns Express.js 中间件函数
 */
export function createExpressLogReceiver(
  logger: LogLayer,
  config?: LogReceiverConfig
): (req: any, res: any, next?: any) => Promise<void> {
  return async (req: any, res: any, next?: any) => {
    try {
      const data = req.body
      
      if (Array.isArray(data)) {
        data.forEach(log => {
          logger.info(log.message || 'Log from client', log.metadata || {})
        })
        res.json({ success: true, processed: data.length })
      } else {
        logger.info(data.message || 'Log from client', data.metadata || {})
        res.json({ success: true, processed: 1 })
      }
    } catch (error) {
      logger.error('Express log receiver error: ' + (error instanceof Error ? error.message : String(error)))
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
}