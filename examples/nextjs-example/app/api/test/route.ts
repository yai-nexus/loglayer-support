import { NextRequest, NextResponse } from 'next/server'
console.log('[DEBUG] API route: importing server-logger...');
import { dbLogger, getServerInstance } from '../../../lib/server-logger'
console.log('[DEBUG] API route: server-logger imported successfully');

/**
 * 测试 API 路由 - 演示服务端日志功能
 */
export async function POST(request: NextRequest) {
  console.log('[DEBUG] API POST called');
  // 创建请求特定的 logger
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  console.log('[DEBUG] About to call apiLogger.info with:', requestId);
  // 使用异步方式获取日志器实例，避免初始化竞态条件
  const serverInstance = await getServerInstance();
  const requestLogger = serverInstance.withContext({ module: 'api' });
  console.log('[DEBUG] requestLogger created successfully');

  try {
    // 解析请求体
    const body = await request.json()
    
    requestLogger.withMetadata({
      method: 'POST',
      endpoint: '/api/test',
      requestId,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      bodySize: JSON.stringify(body).length,
      clientMessage: body.message
    }).info('收到 API 请求')

    // 如果消息包含特定关键词，触发警告日志（用于测试 SLS）
    if (body.message && body.message.includes('warning')) {
      requestLogger.withMetadata({
        testType: 'sls-warning-test',
        requestId,
        message: body.message,
        timestamp: new Date().toISOString()
      }).warn('触发测试警告日志 - 这条日志应该发送到 SLS')
    }

    if (body.message && body.message.includes('error')) {
      requestLogger.withMetadata({
        testType: 'sls-error-test',
        requestId,
        message: body.message,
        timestamp: new Date().toISOString()
      }).error('触发测试错误日志 - 这条日志应该发送到 SLS')
    }

    // 模拟一些业务逻辑处理时间
    const processingStart = performance.now()
    
    // 模拟数据库操作
    const dbStart = performance.now()
    await simulateDbOperation(body.message)
    const dbDuration = performance.now() - dbStart
    
    dbLogger.withMetadata({
      operation: 'simulate-query',
      requestId,
      duration: Math.round(dbDuration),
      query: `SELECT * FROM test WHERE message = '${body.message}'`,
      rowCount: Math.floor(Math.random() * 100)
    }).info('数据库查询性能')

    // 模拟一些额外的处理
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    
    const processingDuration = performance.now() - processingStart

    // 准备响应数据
    const responseData = {
      success: true,
      message: `服务端收到: ${body.message}`,
      timestamp: new Date().toISOString(),
      requestId,
      processingTime: Math.round(processingDuration)
    }

    // 记录性能日志
    requestLogger.withMetadata({
      operation: 'api-test-processing',
      endpoint: '/api/test',
      requestId,
      duration: Math.round(processingDuration),
      responseSize: JSON.stringify(responseData).length,
      dbDuration: Math.round(dbDuration)
    }).info('API 处理性能')

    // 记录成功响应
    requestLogger.withMetadata({
      requestId,
      statusCode: 200,
      responseData,
      totalDuration: Math.round(processingDuration)
    }).info('API 请求处理成功')

    return NextResponse.json(responseData)

  } catch (error) {
    // 记录错误
    requestLogger.withMetadata({
      endpoint: '/api/test',
      requestId,
      method: 'POST',
      error: error as Error,
      errorName: (error as Error).name,
      errorStack: (error as Error).stack
    }).error('API 请求处理失败')

    return NextResponse.json(
      { 
        success: false, 
        error: '内部服务器错误',
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET 请求处理 - 简单的状态检查
 */
export async function GET(request: NextRequest) {
  const requestId = `health_${Date.now()}`
  // 使用异步方式获取日志器实例，避免初始化竞态条件
  const serverInstance = await getServerInstance();
  const requestLogger = serverInstance.withContext({ module: 'api' });

  requestLogger.withMetadata({
    method: 'GET',
    endpoint: '/api/test',
    requestId,
    userAgent: request.headers.get('user-agent')
  }).info('健康检查请求')

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  }

  requestLogger.withMetadata({
    requestId,
    statusCode: 200,
    healthData
  }).info('健康检查完成')

  return NextResponse.json(healthData)
}

/**
 * 模拟数据库操作
 */
async function simulateDbOperation(message: string): Promise<void> {
  const requestId = `db_${Date.now()}`
  const dbRequestLogger = dbLogger

  dbRequestLogger.withMetadata({
    operation: 'simulate-query',
    requestId,
    input: message
  }).debug('开始数据库模拟操作')

  // 模拟数据库查询延迟
  const delay = Math.random() * 200 + 50 // 50-250ms
  await new Promise(resolve => setTimeout(resolve, delay))

  // 模拟偶发的数据库错误
  if (Math.random() < 0.1) { // 10% 概率
    const dbError = new Error('模拟数据库连接超时')
    dbRequestLogger.withMetadata({
      operation: 'simulate-query',
      requestId,
      input: message,
      delay,
      error: dbError,
      errorName: dbError.name,
      errorStack: dbError.stack
    }).error('数据库操作失败')
    throw dbError
  }

  dbRequestLogger.withMetadata({
    operation: 'simulate-query',
    requestId,
    input: message,
    delay: Math.round(delay),
    result: 'success'
  }).debug('数据库模拟操作完成')
}