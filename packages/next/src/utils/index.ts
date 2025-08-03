/**
 * Next.js 日志组件工具函数
 */

// =============================================================================
// 环境检测
// =============================================================================

/**
 * 环境信息接口
 */
export interface EnvironmentInfo {
  isServer: boolean;
  isBrowser: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  nodeEnv: string;
  platform: 'server' | 'browser';
}

/**
 * 检测是否为服务端环境
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * 检测是否为浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 检测是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 检测是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检测是否为测试环境
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * 获取当前环境信息
 */
export function detectEnvironment(): EnvironmentInfo {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    isServer: isServer(),
    isBrowser: isBrowser(),
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isTest: isTest(),
    nodeEnv,
    platform: isServer() ? 'server' : 'browser',
  };
}

// =============================================================================
// 配置工具
// =============================================================================

/**
 * 安全获取环境变量
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  try {
    if (isServer()) {
      return process.env[key] || defaultValue;
    } else {
      // 浏览器端从Next.js公开的环境变量获取
      return (process.env as any)[key] || defaultValue;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * 获取Next.js公开的环境变量
 */
export function getPublicEnvVar(key: string, defaultValue?: string): string | undefined {
  const publicKey = key.startsWith('NEXT_PUBLIC_') ? key : `NEXT_PUBLIC_${key}`;
  return getEnvVar(publicKey, defaultValue);
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

// =============================================================================
// 日志工具
// =============================================================================

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
 * 获取用户代理信息
 */
export function getUserAgent(): string {
  if (isBrowser() && typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return 'unknown';
}

/**
 * 获取当前URL
 */
export function getCurrentUrl(): string {
  if (isBrowser() && typeof window !== 'undefined') {
    return window.location.href;
  }
  return 'unknown';
}

/**
 * 获取性能信息
 */
export function getPerformanceInfo(): Record<string, any> | undefined {
  if (isBrowser() && typeof performance !== 'undefined') {
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
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        info.navigation = {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: navigation.responseEnd - navigation.requestStart,
        };
      }
    }

    return info;
  }

  return undefined;
}

// =============================================================================
// Next.js特定工具
// =============================================================================

/**
 * 检测Next.js版本
 */
export function getNextjsVersion(): string | undefined {
  try {
    // 尝试从package.json获取
    if (isServer()) {
      const pkg = require('next/package.json');
      return pkg.version;
    }
  } catch {
    // 忽略错误
  }

  return undefined;
}

/**
 * 检测是否在Next.js应用中
 */
export function isNextjsApp(): boolean {
  try {
    if (isServer()) {
      require('next');
      return true;
    } else {
      // 浏览器端检查Next.js特有的全局变量
      return typeof (window as any).__NEXT_DATA__ !== 'undefined';
    }
  } catch {
    return false;
  }
}

/**
 * 获取Next.js路由信息
 */
export function getRouteInfo(): Record<string, any> {
  if (isBrowser() && typeof window !== 'undefined') {
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

// =============================================================================
// 调试工具
// =============================================================================

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
    const start = performance.now();

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          console.debug(`Performance: ${functionName} took ${duration.toFixed(2)}ms`);
        });
      } else {
        const duration = performance.now() - start;
        console.debug(`Performance: ${functionName} took ${duration.toFixed(2)}ms`);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      console.debug(`Performance: ${functionName} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  }) as T;
}
