/**
 * Next.js React组件和Hooks
 *
 * 提供React应用中的日志功能
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { NextjsLoggerConfig } from '../nextjs';
import { isServer } from '../utils';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * Logger上下文值
 */
export interface LoggerContextValue {
  logger: any | null; // 基于main分支的logger实例
  serverLogger: any | null; // ServerLoggerInstance
  browserLogger: any | null; // BrowserLogger
  isReady: boolean;
  error: string | null;
}

/**
 * LoggerProvider属性
 */
export interface LoggerProviderProps {
  children: ReactNode;
  config: NextjsLoggerConfig;
  fallback?: ReactNode;
}

// =============================================================================
// Context创建
// =============================================================================

const LoggerContext = createContext<LoggerContextValue>({
  logger: null,
  serverLogger: null,
  browserLogger: null,
  isReady: false,
  error: null,
});

// =============================================================================
// LoggerProvider组件
// =============================================================================

/**
 * Logger提供者组件
 */
export function LoggerProvider({ children, config, fallback }: LoggerProviderProps) {
  const [contextValue, setContextValue] = useState<LoggerContextValue>({
    logger: null,
    serverLogger: null,
    browserLogger: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function initializeLogger() {
      try {
        if (isServer()) {
          // 服务端环境 - 不在客户端构建时执行
          // 注意：这个分支只在服务端运行时执行，不会影响客户端构建
          if (mounted) {
            setContextValue({
              logger: null, // 服务端logger需要在服务端组件中单独初始化
              serverLogger: null,
              browserLogger: null,
              isReady: false,
              error: 'Server logger should be initialized in server components',
            });
          }
        } else {
          // 客户端初始化
          const { createNextjsBrowserLogger } = await import('../browser');
          const browserLogger = createNextjsBrowserLogger(config);

          if (mounted) {
            setContextValue({
              logger: browserLogger,
              serverLogger: null,
              browserLogger,
              isReady: true,
              error: null,
            });
          }
        }
      } catch (error) {
        if (mounted) {
          setContextValue((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Unknown error',
            isReady: true,
          }));
        }
      }
    }

    initializeLogger();

    return () => {
      mounted = false;
    };
  }, [config]);

  // 如果还没准备好且提供了fallback，显示fallback
  if (!contextValue.isReady && fallback) {
    return <>{fallback}</>;
  }

  return <LoggerContext.Provider value={contextValue}>{children}</LoggerContext.Provider>;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * 使用Logger的Hook
 */
export function useLogger(): LoggerContextValue {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }

  return context;
}

/**
 * 使用服务端Logger的Hook
 */
export function useServerLogger(): any | null {
  const { serverLogger } = useLogger();
  return serverLogger;
}

/**
 * 使用浏览器端Logger的Hook
 */
export function useBrowserLogger(): any | null {
  const { browserLogger } = useLogger();
  return browserLogger;
}

/**
 * 使用当前环境Logger的Hook
 */
export function useCurrentLogger(): any | null {
  const { logger } = useLogger();
  return logger;
}

// =============================================================================
// 高级Hooks
// =============================================================================

/**
 * 使用日志记录的Hook
 */
export function useLogging() {
  const { logger, isReady, error } = useLogger();

  const log = {
    debug: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.debug(message, data);
      }
    },
    info: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.info(message, data);
      }
    },
    warn: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.warn(message, data);
      }
    },
    error: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.error(message, data);
      }
    },
  };

  return {
    ...log,
    isReady,
    error,
    logger,
  };
}

/**
 * 使用组件日志的Hook
 */
export function useComponentLogger(componentName: string) {
  const { logger, isReady } = useLogger();

  const componentLogger = {
    debug: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.debug(`[${componentName}] ${message}`, { component: componentName, ...data });
      }
    },
    info: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.info(`[${componentName}] ${message}`, { component: componentName, ...data });
      }
    },
    warn: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.warn(`[${componentName}] ${message}`, { component: componentName, ...data });
      }
    },
    error: (message: string, data?: any) => {
      if (logger && isReady) {
        logger.error(`[${componentName}] ${message}`, { component: componentName, ...data });
      }
    },
    mount: () => {
      if (logger && isReady) {
        logger.debug(`[${componentName}] Component mounted`, {
          component: componentName,
          lifecycle: 'mount',
        });
      }
    },
    unmount: () => {
      if (logger && isReady) {
        logger.debug(`[${componentName}] Component unmounted`, {
          component: componentName,
          lifecycle: 'unmount',
        });
      }
    },
  };

  // 自动记录组件挂载和卸载
  useEffect(() => {
    componentLogger.mount();
    return () => {
      componentLogger.unmount();
    };
  }, []);

  return componentLogger;
}

/**
 * 使用性能日志的Hook
 */
export function usePerformanceLogger() {
  const { logger, isReady } = useLogger();

  const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
    if (!logger || !isReady) {
      return typeof fn === 'function' ? fn() : fn;
    }

    const start = performance.now();

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          logger.info(`Performance: ${name}`, {
            type: 'performance',
            operation: name,
            duration: `${duration.toFixed(2)}ms`,
            async: true,
          });
        });
      } else {
        const duration = performance.now() - start;
        logger.info(`Performance: ${name}`, {
          type: 'performance',
          operation: name,
          duration: `${duration.toFixed(2)}ms`,
          async: false,
        });
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Performance: ${name} (failed)`, {
        type: 'performance',
        operation: name,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error),
        failed: true,
      });
      throw error;
    }
  };

  return { measurePerformance };
}

// =============================================================================
// 导出所有内容
// =============================================================================
