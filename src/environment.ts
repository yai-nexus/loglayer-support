/**
 * 环境检测模块
 *
 * 实现完全的服务端/客户端环境隔离
 * 基于 docs/implementation-strategy.md 的设计
 */

import type { EnvironmentInfo } from "./types";

/**
 * 检测当前运行环境（简化版本，专注隔离）
 */
export function detectEnvironment(): EnvironmentInfo {
  const isServer = typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined';
  const isClient = !isServer;

  // 简化的环境检测
  let environment: 'development' | 'production' | 'test' = 'development';
  
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production' || nodeEnv === 'test') {
      environment = nodeEnv as 'production' | 'test';
    }
  }

  return {
    isServer,
    isClient,
    environment,
  };
}

/**
 * 检查是否在浏览器环境中
 */
export function isBrowserEnvironment(): boolean {
  return typeof globalThis !== 'undefined' && 
         typeof (globalThis as any).window !== 'undefined' && 
         typeof (globalThis as any).document !== 'undefined';
}

/**
 * 检查是否在 Node.js 环境中
 */
export function isNodeEnvironment(): boolean {
  return typeof globalThis !== 'undefined' && 
         typeof (globalThis as any).window === 'undefined' && 
         typeof process !== 'undefined' && 
         typeof process.versions?.node !== 'undefined';
}

/**
 * 安全获取环境变量（只在服务端可用）
 */
export function getEnvVar(key: string, defaultValue: string = ""): string {
  if (typeof process === "undefined" || !process.env) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
}

/**
 * 检查是否可以使用 Node.js API
 */
export function canUseNodeAPIs(): boolean {
  return isNodeEnvironment();
}

/**
 * 检查是否可以使用浏览器 API
 */
export function canUseBrowserAPIs(): boolean {
  return isBrowserEnvironment();
}

/**
 * 动态导入检测（用于可选依赖）
 */
export async function canImport(moduleName: string): Promise<boolean> {
  // 浏览器环境永远不尝试导入 Node.js 模块
  if (isBrowserEnvironment()) {
    // 只允许导入浏览器兼容的模块
    const browserCompatibleModules = ['loglayer'];
    return browserCompatibleModules.includes(moduleName);
  }

  // 服务端环境才尝试动态导入
  try {
    await import(moduleName);
    return true;
  } catch {
    return false;
  }
}