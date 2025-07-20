import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '../../../lib/server-logger'

/**
 * 客户端日志接收端点
 * 接收并处理来自浏览器的日志数据
 */
export async function POST(request: NextRequest) {
  const logReceiver = apiLogger.forModule('client-log-receiver')
  
  try {
    // 解析客户端发送的日志数据
    const clientLogData = await request.json()
    
    // 验证必要字段
    if (!clientLogData.level || !clientLogData.message) {
      logReceiver.warn('收到格式不正确的客户端日志', {
        receivedData: clientLogData,
        missingFields: {
          level: !clientLogData.level,
          message: !clientLogData.message
        }
      })
      
      return NextResponse.json(
        { error: '日志格式不正确，缺少必要字段' },
        { status: 400 }
      )
    }

    // 提取客户端信息
    const clientInfo = {
      userAgent: clientLogData.userAgent || request.headers.get('user-agent'),
      url: clientLogData.url || 'unknown',
      sessionId: clientLogData.sessionId || 'unknown',
      timestamp: clientLogData.timestamp || new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    }

    // 记录接收到的客户端日志
    const logMessage = `[客户端] ${clientLogData.message}`
    const logMeta = {
      originalLevel: clientLogData.level,
      clientInfo,
      clientMetadata: clientLogData.metadata || {},
      receivedAt: new Date().toISOString(),
      source: 'client-browser'
    }

    // 根据客户端日志级别，在服务端记录相应级别的日志
    switch (clientLogData.level.toLowerCase()) {
      case 'debug':
        logReceiver.debug(logMessage, logMeta)
        break
      case 'info':
        logReceiver.info(logMessage, logMeta)
        break
      case 'warn':
        logReceiver.warn(logMessage, logMeta)
        break
      case 'error':
        // 对于错误日志，提取错误信息
        if (clientLogData.error) {
          const clientError = new Error(clientLogData.error.message || clientLogData.message)
          clientError.stack = clientLogData.error.stack || 'No stack trace available'
          logReceiver.logError(clientError, {
            ...logMeta,
            clientErrorName: clientLogData.error.name,
            clientErrorStack: clientLogData.error.stack
          }, `客户端错误: ${clientLogData.message}`)
        } else {
          logReceiver.error(logMessage, logMeta)
        }
        break
      default:
        logReceiver.info(logMessage, {
          ...logMeta,
          unknownLevel: clientLogData.level
        })
    }

    // 记录成功接收的统计信息
    logReceiver.debug('客户端日志接收成功', {
      logLevel: clientLogData.level,
      messageLength: clientLogData.message.length,
      hasMetadata: !!clientLogData.metadata,
      hasError: !!clientLogData.error,
      clientInfo
    })

    return NextResponse.json({
      success: true,
      message: '日志已成功接收',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    // 记录处理客户端日志时的错误
    logReceiver.logError(error as Error, {
      endpoint: '/api/client-logs',
      method: 'POST',
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    }, '处理客户端日志时发生错误')

    return NextResponse.json(
      { 
        success: false,
        error: '服务端处理日志失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET 请求 - 返回客户端日志接收服务的状态
 */
export async function GET() {
  const statusLogger = apiLogger.forModule('client-log-status')
  
  const status = {
    service: 'client-logs-receiver',
    status: 'active',
    timestamp: new Date().toISOString(),
    supportedMethods: ['POST'],
    acceptedLogLevels: ['debug', 'info', 'warn', 'error'],
    requiredFields: ['level', 'message']
  }

  statusLogger.debug('客户端日志服务状态查询', {
    endpoint: '/api/client-logs',
    method: 'GET',
    status
  })

  return NextResponse.json(status)
}