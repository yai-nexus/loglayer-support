/**
 * 服务端日志器配置
 * 
 * 只在服务端使用，展示新架构的服务端日志器配置
 */

import { serverQuickStart } from '@yai-loglayer/next/server';

// 🚀 一行代码创建服务端日志器
export const logger = serverQuickStart.local('nextjs-example');

// 为不同模块创建专用日志器
export const apiLogger = logger.forModule('api');
export const dbLogger = logger.forModule('database');
export const authLogger = logger.forModule('auth');

// 也可以使用其他预设
export const prodLogger = serverQuickStart.prod('nextjs-example');
export const debugLogger = serverQuickStart.debug('nextjs-example');

// 导出默认日志器
export default logger;
