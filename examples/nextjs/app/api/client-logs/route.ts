import { NextRequest, NextResponse } from 'next/server'
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support'
import { getServerInstance } from '../../../lib/server-logger'

/**
 * 客户端日志接收端点 - 使用新的框架预设 API
 * 接收并处理来自浏览器的日志数据
 */

// 创建日志接收器
const createLogReceiver = async () => {
  const serverInstance = await getServerInstance();
  return createNextjsLogReceiver(serverInstance.logger, {
    validation: {
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 2000
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 50,
      addServerContext: true,
      reconstructErrors: true
    },
    security: {
      validateOrigin: false, // 示例项目中禁用，生产环境应启用
      rateLimiting: {
        maxRequestsPerMinute: 100,
        byIP: true
      }
    },
    response: {
      successMessage: '日志已成功接收',
      includeStats: true
    },
    debug: process.env.NODE_ENV === 'development'
  });
};

// 创建接收器实例
const logReceiverPromise = createLogReceiver();

export async function POST(request: NextRequest) {
  const logReceiver = await logReceiverPromise;
  return logReceiver(request);
}

/**
 * GET 请求 - 返回客户端日志接收服务的状态
 */
export async function GET() {
  const logReceiver = await logReceiverPromise;
  const status = logReceiver.getStatus();
  return NextResponse.json(status);
}