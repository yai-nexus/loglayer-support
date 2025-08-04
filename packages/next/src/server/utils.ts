/**
 * 服务端工具函数
 * 
 * 只在服务端环境中使用的工具函数
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { EnvironmentInfo } from '../shared/types';
import { PLATFORMS, ENVIRONMENTS } from '../shared/constants';

/**
 * 检测是否为服务端环境
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * 检测是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT;
}

/**
 * 检测是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION;
}

/**
 * 检测是否为测试环境
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.TEST;
}

/**
 * 获取环境信息
 */
export function detectEnvironment(): EnvironmentInfo {
  const nodeEnv = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;
  
  return {
    isServer: true,
    isBrowser: false,
    isProduction: nodeEnv === ENVIRONMENTS.PRODUCTION,
    isDevelopment: nodeEnv === ENVIRONMENTS.DEVELOPMENT,
    isTest: nodeEnv === ENVIRONMENTS.TEST,
    nodeEnv,
    platform: PLATFORMS.SERVER,
  };
}

/**
 * 安全获取环境变量
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * 检查环境变量是否存在且非空
 */
export function hasEnvVar(key: string): boolean {
  const value = getEnvVar(key);
  return value !== undefined && value.trim() !== '';
}

/**
 * 批量检查环境变量
 */
export function hasAllEnvVars(keys: string[]): boolean {
  return keys.every((key) => hasEnvVar(key));
}

/**
 * 格式化错误对象为可序列化的格式
 */
export function serializeError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as any).cause,
    };
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { error: String(error) };
    }
  }

  return { error: String(error) };
}

/**
 * 生成唯一ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 检测Next.js版本
 */
export function getNextjsVersion(): string | undefined {
  try {
    const pkg = require('next/package.json');
    return pkg.version;
  } catch {
    return undefined;
  }
}

/**
 * 检测是否在Next.js应用中
 */
export function isNextjsApp(): boolean {
  try {
    require('next');
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 获取文件大小
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * 解析文件大小字符串（如 "10MB"）
 */
export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
  if (!match) {
    return parseInt(sizeStr) || 0;
  }

  const [, size, unit] = match;
  const multiplier = units[unit.toUpperCase()] || 1;
  return Math.floor(parseFloat(size) * multiplier);
}

/**
 * 获取日志文件列表
 */
export async function getLogFiles(logDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(logDir);
    return files
      .filter(file => file.endsWith('.log'))
      .map(file => path.join(logDir, file))
      .sort();
  } catch {
    return [];
  }
}

/**
 * 清理旧日志文件
 */
export async function cleanupLogFiles(logDir: string, maxFiles: number): Promise<void> {
  const files = await getLogFiles(logDir);
  
  if (files.length <= maxFiles) {
    return;
  }

  // 按修改时间排序，删除最旧的文件
  const filesWithStats = await Promise.all(
    files.map(async (file) => {
      const stats = await fs.stat(file);
      return { file, mtime: stats.mtime };
    })
  );

  filesWithStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

  const filesToDelete = filesWithStats.slice(0, filesWithStats.length - maxFiles);
  
  await Promise.all(
    filesToDelete.map(({ file }) => fs.unlink(file).catch(() => {}))
  );
}

/**
 * 创建调试日志函数
 */
export function createDebugLogger(namespace: string) {
  const isDebugEnabled = isDevelopment() || getEnvVar('DEBUG') === 'true';

  return {
    log: (...args: any[]) => {
      if (isDebugEnabled) {
        console.log(`[DEBUG:${namespace}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (isDebugEnabled) {
        console.warn(`[DEBUG:${namespace}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      if (isDebugEnabled) {
        console.error(`[DEBUG:${namespace}]`, ...args);
      }
    },
  };
}

/**
 * 性能测量装饰器
 */
export function measurePerformance<T extends (...args: any[]) => any>(fn: T, name?: string): T {
  const functionName = name || fn.name || 'anonymous';

  return ((...args: any[]) => {
    const start = process.hrtime.bigint();

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result.finally(() => {
          const end = process.hrtime.bigint();
          const duration = Number(end - start) / 1000000; // 转换为毫秒
          console.debug(`Performance: ${functionName} took ${duration.toFixed(2)}ms`);
        });
      } else {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // 转换为毫秒
        console.debug(`Performance: ${functionName} took ${duration.toFixed(2)}ms`);
        return result;
      }
    } catch (error) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // 转换为毫秒
      console.debug(`Performance: ${functionName} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  }) as T;
}
