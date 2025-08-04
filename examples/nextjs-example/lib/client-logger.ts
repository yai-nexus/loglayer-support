/**
 * 客户端日志器配置
 * 
 * 只在客户端使用，展示新架构的客户端日志器配置
 */

'use client';

import { clientQuickStart } from '@yai-loglayer/next/client';

// 🚀 一行代码创建客户端日志器
export const logger = clientQuickStart.dev('nextjs-example');

// 也可以使用其他预设
export const prodLogger = clientQuickStart.prod('nextjs-example');
export const debugLogger = clientQuickStart.debug('nextjs-example');

// 导出给组件使用
export default logger;
