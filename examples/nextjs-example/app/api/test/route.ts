import { NextRequest, NextResponse } from 'next/server';
import { createNextjsServerLogger } from '@yai-loglayer/next/server-only';

// 创建专门用于服务器日志的logger实例
let serverLogger: any = null;

async function getServerLogger() {
  if (!serverLogger) {
    serverLogger = await createNextjsServerLogger({
      appName: 'server',
      environment: (process.env.NODE_ENV as any) || 'development',
      level: 'debug',
      enableFileLogging: true,
      logDir: './logs',
      outputs: {
        console: { enabled: true },
        file: { enabled: true, path: './logs/server.log' },
      },
    });
  }
  return serverLogger;
}

/**
 * 测试 API 路由 - 演示服务端日志功能（极简版本）
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const logger = await getServerLogger();

  try {
    // 解析请求体
    const body = await request.json();

    // 记录API请求
    logger.info('收到 API 请求', {
      method: 'POST',
      endpoint: '/api/test',
      requestId,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      bodySize: JSON.stringify(body).length,
      clientMessage: body.message,
    });

    // 如果消息包含特定关键词，触发警告日志
    if (body.message && body.message.includes('warning')) {
      logger.warn('触发测试警告日志', {
        testType: 'sls-warning-test',
        requestId,
        message: body.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (body.message && body.message.includes('error')) {
      logger.error('触发测试错误日志', {
        testType: 'sls-error-test',
        requestId,
        message: body.message,
        timestamp: new Date().toISOString(),
      });
    }

    // 模拟数据库操作
    const dbStartTime = Date.now();
    await simulateDbOperation(body.message || 'test');
    const dbDuration = Date.now() - dbStartTime;

    // 模拟处理时间
    const processingStartTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
    const processingDuration = Date.now() - processingStartTime;

    const responseData = {
      status: 'success',
      message: `处理完成: ${body.message || 'test'}`,
      timestamp: new Date().toISOString(),
      requestId,
      processingTime: Math.round(processingDuration),
    };

    // 记录性能日志
    logger.info('API 处理性能', {
      operation: 'api-test-processing',
      endpoint: '/api/test',
      requestId,
      duration: Math.round(processingDuration),
      responseSize: JSON.stringify(responseData).length,
      dbDuration: Math.round(dbDuration),
    });

    // 记录成功响应
    logger.info('API 请求处理成功', {
      requestId,
      statusCode: 200,
      responseData,
      totalDuration: Math.round(processingDuration),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    // 记录错误
    logger.error('API 请求处理失败', {
      endpoint: '/api/test',
      requestId,
      method: 'POST',
      error: error as Error,
      errorName: (error as Error).name,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
    });

    return NextResponse.json(
      {
        status: 'error',
        message: '服务器内部错误',
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 健康检查端点
 */
export async function GET(request: NextRequest) {
  const requestId = `health_${Date.now()}`;
  const logger = await getServerLogger();

  logger.info('健康检查请求', {
    method: 'GET',
    endpoint: '/api/test',
    requestId,
    userAgent: request.headers.get('user-agent'),
  });

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  };

  logger.info('健康检查完成', {
    requestId,
    statusCode: 200,
    healthData,
  });

  return NextResponse.json(healthData);
}

/**
 * 模拟数据库操作
 */
async function simulateDbOperation(message: string): Promise<void> {
  const requestId = `db_${Date.now()}`;
  const logger = await getServerLogger();

  logger.debug('开始数据库模拟操作', {
    operation: 'simulate-query',
    requestId,
    input: message,
  });

  // 模拟数据库查询延迟
  const delay = Math.random() * 200 + 50; // 50-250ms
  await new Promise((resolve) => setTimeout(resolve, delay));

  // 模拟偶发的数据库错误
  if (Math.random() < 0.1) {
    // 10% 概率
    const dbError = new Error('模拟数据库连接超时');
    logger.error('数据库操作失败', {
      operation: 'simulate-query',
      requestId,
      input: message,
      delay,
      error: dbError,
      errorMessage: dbError.message,
      errorStack: dbError.stack,
    });
    throw dbError;
  }

  logger.debug('数据库操作成功', {
    operation: 'simulate-query',
    requestId,
    input: message,
    delay: Math.round(delay),
    result: 'success',
  });
}
