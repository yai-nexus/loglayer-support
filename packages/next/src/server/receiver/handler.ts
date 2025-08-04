/**
 * 服务端日志接收器处理器
 * 
 * 处理来自客户端的日志请求
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ServerLoggerInstance } from '../../shared/types';
import { serializeError } from '../utils';

/**
 * 日志接收器配置
 */
export interface LogReceiverConfig {
  validation?: {
    requireLevel?: boolean;
    maxMessageLength?: number;
    allowedLevels?: string[];
    maxBatchSize?: number;
  };
  processing?: {
    supportBatch?: boolean;
    maxBatchSize?: number;
    enableEnrichment?: boolean;
  };
  security?: {
    rateLimiting?: {
      maxRequestsPerMinute?: number;
    };
    allowedOrigins?: string[];
  };
}

/**
 * 日志接收器处理函数类型
 */
export type LogReceiverHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * 创建日志接收器处理器
 */
export function createLogReceiverHandler(
  logger: ServerLoggerInstance,
  config: LogReceiverConfig = {}
): LogReceiverHandler {
  const {
    validation = {},
    processing = {},
    security = {},
  } = config;

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 安全检查
      if (security.allowedOrigins) {
        const origin = req.headers.get('origin');
        if (origin && !security.allowedOrigins.includes(origin)) {
          return NextResponse.json(
            { success: false, error: 'Origin not allowed' },
            { status: 403 }
          );
        }
      }

      // 解析请求体
      const body = await req.json();
      
      // 验证请求
      const validationResult = validateRequest(body, validation);
      if (!validationResult.valid) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 400 }
        );
      }

      // 处理日志
      await processLogs(body, logger, processing, req);

      // 返回成功响应
      const response = NextResponse.json({ success: true });
      
      // 添加CORS头
      addCorsHeaders(response);
      
      return response;

    } catch (error) {
      // 记录处理错误
      logger.error('Log receiver error', {
        error: serializeError(error),
        url: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent'),
      });

      // 返回错误响应
      const response = NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
      
      addCorsHeaders(response);
      
      return response;
    }
  };
}

/**
 * 验证请求
 */
function validateRequest(
  body: any,
  validation: LogReceiverConfig['validation'] = {}
): { valid: boolean; error?: string } {
  const {
    requireLevel = true,
    maxMessageLength = 2000,
    allowedLevels = ['debug', 'info', 'warn', 'error'],
    maxBatchSize = 100,
  } = validation;

  // 检查是否为批量请求
  const logs = Array.isArray(body) ? body : [body];
  
  if (logs.length > maxBatchSize) {
    return { valid: false, error: `Batch size exceeds maximum of ${maxBatchSize}` };
  }

  // 验证每个日志条目
  for (const log of logs) {
    if (requireLevel && !log.level) {
      return { valid: false, error: 'Log level is required' };
    }

    if (log.level && !allowedLevels.includes(log.level)) {
      return { valid: false, error: `Invalid log level: ${log.level}` };
    }

    if (!log.message) {
      return { valid: false, error: 'Log message is required' };
    }

    if (typeof log.message === 'string' && log.message.length > maxMessageLength) {
      return { valid: false, error: `Message exceeds maximum length of ${maxMessageLength}` };
    }
  }

  return { valid: true };
}

/**
 * 处理日志
 */
async function processLogs(
  body: any,
  logger: ServerLoggerInstance,
  processing: LogReceiverConfig['processing'] = {},
  req: NextRequest
): Promise<void> {
  const {
    supportBatch = true,
    enableEnrichment = true,
  } = processing;

  const logs = Array.isArray(body) ? body : [body];
  
  for (const log of logs) {
    try {
      // 丰富日志上下文
      const enrichedLog = enableEnrichment ? enrichLogContext(log, req) : log;
      
      // 根据级别记录日志
      switch (log.level) {
        case 'debug':
          logger.debug(enrichedLog.message, enrichedLog.data);
          break;
        case 'info':
          logger.info(enrichedLog.message, enrichedLog.data);
          break;
        case 'warn':
          logger.warn(enrichedLog.message, enrichedLog.data);
          break;
        case 'error':
          logger.error(enrichedLog.message, enrichedLog.data);
          break;
        default:
          logger.info(enrichedLog.message, enrichedLog.data);
      }
    } catch (error) {
      // 记录处理单个日志的错误，但不中断整个批次
      logger.error('Failed to process individual log', {
        originalLog: log,
        error: serializeError(error),
      });
    }
  }
}

/**
 * 丰富日志上下文
 */
function enrichLogContext(log: any, req: NextRequest): any {
  const enrichedData = {
    ...log.data,
    // 添加服务端上下文
    server: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      userAgent: req.headers.get('user-agent'),
      ip: getClientIP(req),
      url: req.url,
      method: req.method,
    },
  };

  return {
    ...log,
    data: enrichedData,
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 获取客户端IP
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * 添加CORS头
 */
function addCorsHeaders(response: NextResponse): void {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * 创建OPTIONS处理器
 */
export function createOptionsHandler(): () => NextResponse {
  return () => {
    const response = new NextResponse(null, { status: 200 });
    addCorsHeaders(response);
    return response;
  };
}
