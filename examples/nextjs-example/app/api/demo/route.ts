/**
 * 演示API路由 - 展示服务端日志使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/server-logger';

export async function GET(request: NextRequest) {
  // 🚀 新架构：使用预配置的API日志器
  apiLogger.info('API请求开始', {
    method: 'GET',
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  try {
    // 模拟业务逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const data = {
      message: '这是一个演示API',
      timestamp: new Date().toISOString(),
      version: '0.8.2',
      features: [
        '严格代码隔离',
        '极简接入',
        '预设配置',
        '自动API路由'
      ]
    };

    apiLogger.info('API请求成功', {
      method: 'GET',
      status: 200,
      responseSize: JSON.stringify(data).length
    });

    return NextResponse.json(data);
    
  } catch (error) {
    apiLogger.error('API请求失败', {
      method: 'GET',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  apiLogger.info('POST API请求开始', {
    method: 'POST',
    url: request.url,
    contentType: request.headers.get('content-type')
  });

  try {
    const body = await request.json();
    
    apiLogger.info('接收到POST数据', {
      method: 'POST',
      bodyKeys: Object.keys(body),
      bodySize: JSON.stringify(body).length
    });

    // 模拟处理逻辑
    const result = {
      received: body,
      processed: true,
      timestamp: new Date().toISOString()
    };

    apiLogger.info('POST请求处理完成', {
      method: 'POST',
      status: 200,
      processed: true
    });

    return NextResponse.json(result);
    
  } catch (error) {
    apiLogger.error('POST请求处理失败', {
      method: 'POST',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Bad Request' },
      { status: 400 }
    );
  }
}
