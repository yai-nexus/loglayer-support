/**
 * 客户端工具函数 - 简化版本
 */

import type { EnvironmentInfo } from '../shared/types';

/**
 * 获取环境信息
 */
export function detectEnvironment(): EnvironmentInfo {
  const nodeEnv = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';

  return {
    isServer: false,
    isBrowser: true,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
    nodeEnv,
    platform: 'browser',
  };
}

/**
 * 获取用户代理信息
 */
export function getUserAgent(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return 'unknown';
}

/**
 * 获取当前URL
 */
export function getCurrentUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return 'unknown';
}

/**
 * 获取性能信息
 */
export function getPerformanceInfo(): Record<string, any> | undefined {
  if (typeof performance === 'undefined') {
    return undefined;
  }
  
  const info: Record<string, any> = {};
  
  // 内存信息
  if ((performance as any).memory) {
    info.memory = {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  
  // 导航时间信息
  if (performance.getEntriesByType) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      info.navigation = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: navigation.responseEnd - navigation.requestStart,
      };
    }
  }
  
  return info;
}

/**
 * 获取Next.js路由信息
 */
export function getRouteInfo(): Record<string, any> {
  if (typeof window !== 'undefined') {
    const nextData = (window as any).__NEXT_DATA__;
    if (nextData) {
      return {
        page: nextData.page,
        query: nextData.query,
        buildId: nextData.buildId,
        assetPrefix: nextData.assetPrefix,
      };
    }
  }
  
  return {};
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
 * 格式化错误对象
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
 * 安全获取环境变量（客户端）
 */
export function getPublicEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const publicKey = key.startsWith('NEXT_PUBLIC_') ? key : `NEXT_PUBLIC_${key}`;
    return process.env[publicKey] || defaultValue;
  }
  return defaultValue;
}

/**
 * 检查是否在Next.js应用中
 */
export function isNextjsApp(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).__NEXT_DATA__ !== 'undefined';
}
