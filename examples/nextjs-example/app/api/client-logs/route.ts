import { NextRequest, NextResponse } from 'next/server'
import { createNextjsLogReceiver } from '@yai-loglayer/receiver'
import { getServerInstance } from '../../../lib/server-logger'

/**
 * 客户端日志接收端点 - 使用新的框架预设 API
 * 接收并处理来自浏览器的日志数据
 */

// 创建日志接收器
const createLogReceiver = async () => {
  const serverLogger = await getServerInstance();
  return createNextjsLogReceiver(serverLogger, {
    validation: {
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 2000
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 50,
      enableFiltering: true,
      enableFormatting: true,
      preserveMetadata: true
    },
    adapter: 'nextjs'
  });
};

// 创建接收器实例
const logReceiverPromise = createLogReceiver();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logReceiver = await logReceiverPromise;
  const result = await logReceiver(request);
  const data = await result.json();
  return NextResponse.json(data, { status: result.status });
}

/**
 * GET 请求 - 返回客户端日志接收服务的状态
 */
export async function GET() {
  try {
    const logReceiver = await logReceiverPromise;
    // 简化状态返回，因为 logReceiver 可能不再有 getStatus 方法
    const status = {
      service: 'client-logs-receiver',
      status: 'active',
      timestamp: new Date().toISOString(),
      message: '日志接收服务运行正常'
    };
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({
      service: 'client-logs-receiver',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    }, { status: 500 });
  }
}