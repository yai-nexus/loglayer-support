import { createNextjsLogReceiver, createNextjsServerLogger } from '@yai-loglayer/next/server-only';
import { NextRequest } from 'next/server';

/**
 * 客户端日志接收端点 - 使用@yai-loglayer/next统一组件
 * 接收并处理来自浏览器的日志数据，输出到browser.log文件
 */

// 创建专门用于浏览器日志的logger实例
let browserLogger: any = null;
let logReceiver: any = null;

async function getBrowserLogger() {
  if (!browserLogger) {
    browserLogger = await createNextjsServerLogger({
      appName: 'browser',
      environment: (process.env.NODE_ENV as any) || 'development',
      level: 'debug',
      enableFileLogging: true,
      logDir: './logs',
      outputs: {
        console: { enabled: true },
        file: { enabled: true, path: './logs/browser.log' },
      },
    });
  }
  return browserLogger;
}

async function getLogReceiver() {
  if (!logReceiver) {
    // 使用专门的浏览器日志器
    const logger = await getBrowserLogger();
    const serverLogger = await logger.withContext({ module: 'browser-logs', source: 'client' });

    logReceiver = createNextjsLogReceiver(serverLogger, {
      validation: {
        requireLevel: true,
        maxMessageLength: 2000,
        allowedLevels: ['debug', 'info', 'warn', 'error'],
      },
      processing: {
        supportBatch: true,
        maxBatchSize: 50,
      },
    });
  }
  return logReceiver;
}

// API路由处理函数
export async function POST(request: NextRequest) {
  const receiver = await getLogReceiver();
  return receiver(request);
}

/**
 * GET 请求 - 返回客户端日志接收服务的状态
 */
export async function GET() {
  return Response.json({
    service: 'client-logs-receiver',
    status: 'active',
    timestamp: new Date().toISOString(),
    message: '日志接收服务运行正常 - 使用@yai-loglayer/next',
    features: {
      batchSupport: true,
      rateLimiting: true,
      validation: true,
      enrichment: true,
    },
  });
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
