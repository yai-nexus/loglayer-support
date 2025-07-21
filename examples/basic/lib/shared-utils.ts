/**
 * 共享工具函数
 * 
 * 提供所有示例共用的工具函数和配置
 */

import { LoggerConfig } from 'loglayer-support';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

/**
 * 获取日志目录路径
 */
export function getLogsDir(): string {
  return path.resolve(rootDir, 'logs');
}

/**
 * 获取 SLS 配置
 */
export function getSLSConfig(appName: string = 'loglayer-basic'): Record<string, string> {
  return {
    endpoint: process.env.SLS_ENDPOINT || 'cn-beijing.log.aliyuncs.com',
    project: process.env.SLS_PROJECT || 'yai-log-test',
    logstore: process.env.SLS_LOGSTORE || 'app-log',
    accessKey: process.env.SLS_ACCESS_KEY || 'LTAI5tNpnJzbTm6PBdmAfzKp',
    accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET || 'pUOfZVW7Qk0L78Ku4Ber1ysr2bvXol',
    appName: process.env.SLS_APP_NAME || appName
  };
}

/**
 * 打印示例标题
 */
export function printExampleTitle(title: string): void {
  console.log(`\n=== ${title} ===`);
}

/**
 * 创建基础文件日志配置
 */
export function createFileLogConfig(filename: string): any {
  return {
    dir: getLogsDir(),
    filename,
    maxSize: '10MB',
    maxFiles: 5
  };
}

/**
 * 模拟异步操作
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建示例运行函数
 */
export function createExampleRunner(exampleFn: () => Promise<void>, title: string): () => Promise<void> {
  return async () => {
    try {
      printExampleTitle(title);
      await exampleFn();
      return Promise.resolve();
    } catch (error) {
      console.error(`示例 "${title}" 执行失败:`, error);
      return Promise.reject(error);
    }
  };
}
