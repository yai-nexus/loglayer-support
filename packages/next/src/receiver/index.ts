/**
 * Next.js 日志接收器 - 基于main分支的@yai-loglayer/receiver
 *
 * 处理来自客户端的日志请求
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createNextjsLogReceiver as createBaseReceiver,
  type LogReceiverConfig as BaseConfig,
} from '@yai-loglayer/receiver';
import type { ServerLoggerInstance } from '@yai-loglayer/server';

// =============================================================================
// 类型定义 - 基于main分支的@yai-loglayer/receiver
// =============================================================================

/**
 * Next.js日志接收器配置 - 扩展基础配置
 */
export interface NextjsLogReceiverConfig extends BaseConfig {
  /** Next.js特定的增强配置 */
  nextjs?: {
    enrichMetadata?: (req: NextRequest) => Record<string, any>;
  };
}

/**
 * 日志接收器处理函数
 */
export type LogReceiverHandler = (req: NextRequest) => Promise<NextResponse>;

// 重新导出基础类型
export type { LogReceiverConfig } from '@yai-loglayer/receiver';

// =============================================================================
// Next.js日志接收器实现
// =============================================================================

/**
 * 创建Next.js日志接收器 - 基于main分支的@yai-loglayer/receiver
 */
export function createNextjsLogReceiver(
  logger: any, // 使用any类型避免类型冲突
  config: NextjsLogReceiverConfig = {}
): LogReceiverHandler {
  // 使用main分支的receiver实现
  const baseReceiver = createBaseReceiver(logger, config);

  // 返回Next.js兼容的处理函数
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 调用基础receiver
      const result = await baseReceiver(req);

      // 创建Next.js响应
      const response = NextResponse.json(result, { status: 200 });

      // 添加CORS头
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    } catch (error) {
      // 错误处理
      const response = NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );

      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    }
  };
}

/**
 * 极简日志接收器 - 一行代码创建
 */
export function createAutoLogReceiver(logger: ServerLoggerInstance) {
  return createNextjsLogReceiver(logger);
}
