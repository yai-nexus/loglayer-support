import { NextRequest, NextResponse } from 'next/server'
console.log('[DEBUG] API route: importing server-logger...');
import { apiLogger, dbLogger } from '../../../lib/server-logger'
console.log('[DEBUG] API route: server-logger imported successfully');

/**
 * 测试 API 路由 - 演示服务端日志功能
 */
export async function POST(request: NextRequest) {
  console.log('[DEBUG] API POST called');
  // 创建请求特定的 logger
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  console.log('[DEBUG] About to call apiLogger.forRequest with:', requestId);
  const requestLogger = apiLogger.forRequest(requestId)
  console.log('[DEBUG] requestLogger created successfully');

  try {
    // 解析请求体
    const body = await request.json()
    
    requestLogger.info('收到 API 请求', {
      method: 'POST',
      endpoint: '/api/test',
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      bodySize: JSON.stringify(body).length,
      clientMessage: body.message
    })

    // 模拟一些业务逻辑处理时间
    const processingStart = performance.now()
    
    // 模拟数据库操作
    const dbStart = performance.now()
    await simulateDbOperation(body.message)
    const dbDuration = performance.now() - dbStart
    
    dbLogger.logPerformance('test-query', dbDuration, {
      operation: 'simulate-query',
      requestId,
      query: `SELECT * FROM test WHERE message = '${body.message}'`,
      rowCount: Math.floor(Math.random() * 100)
    })

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
    requestLogger.logPerformance('api-test-processing', processingDuration, {
      endpoint: '/api/test',
      requestId,
      responseSize: JSON.stringify(responseData).length,
      dbDuration: Math.round(dbDuration)
    })

    // 记录成功响应
    requestLogger.info('API 请求处理成功', {
      statusCode: 200,
      responseData,
      totalDuration: Math.round(processingDuration)
    })

    return NextResponse.json(responseData)

  } catch (error) {
    // 记录错误
    requestLogger.logError(error as Error, {
      endpoint: '/api/test',
      requestId,
      method: 'POST'
    }, 'API 请求处理失败')

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
  const requestLogger = apiLogger.forRequest(`health_${Date.now()}`)
  
  requestLogger.info('健康检查请求', {
    method: 'GET',
    endpoint: '/api/test',
    userAgent: request.headers.get('user-agent')
  })

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  }

  requestLogger.info('健康检查完成', {
    statusCode: 200,
    healthData
  })

  return NextResponse.json(healthData)
}

/**
 * 模拟数据库操作
 */
async function simulateDbOperation(message: string): Promise<void> {
  const dbRequestLogger = dbLogger.forRequest(`db_${Date.now()}`)
  
  dbRequestLogger.debug('开始数据库模拟操作', {
    operation: 'simulate-query',
    input: message
  })

  // 模拟数据库查询延迟
  const delay = Math.random() * 200 + 50 // 50-250ms
  await new Promise(resolve => setTimeout(resolve, delay))

  // 模拟偶发的数据库错误
  if (Math.random() < 0.1) { // 10% 概率
    const dbError = new Error('模拟数据库连接超时')
    dbRequestLogger.logError(dbError, {
      operation: 'simulate-query',
      input: message,
      delay
    }, '数据库操作失败')
    throw dbError
  }

  dbRequestLogger.debug('数据库模拟操作完成', {
    operation: 'simulate-query',
    input: message,
    delay: Math.round(delay),
    result: 'success'
  })
}