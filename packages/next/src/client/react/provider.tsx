/**
 * React Logger Provider - 客户端专用
 * 
 * 只在客户端使用，不会被服务端代码引用
 */

'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ERROR_MESSAGES } from '../../shared/constants';
import type { ClientLoggerInstance, LoggerContextValue, NextjsLogConfig } from '../../shared/types';
import { createClientLogger } from '../logger';

// 创建 Context
const LoggerContext = createContext<LoggerContextValue | null>(null);

/**
 * Logger Provider Props
 */
interface LoggerProviderProps {
  config: NextjsLogConfig;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Logger Provider 组件
 */
export function LoggerProvider({ config, children, fallback }: LoggerProviderProps) {
  const [contextValue, setContextValue] = useState<LoggerContextValue>({
    logger: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function initializeLogger() {
      try {
        // 创建客户端日志器
        const logger = createClientLogger(config);

        if (mounted) {
          setContextValue({
            logger,
            isReady: true,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setContextValue({
            logger: null,
            isReady: true,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
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

/**
 * 使用 Logger 的 Hook
 */
export function useLogger(): LoggerContextValue {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error(ERROR_MESSAGES.PROVIDER_REQUIRED);
  }

  return context;
}

/**
 * 使用组件专用 Logger 的 Hook
 */
export function useComponentLogger(componentName: string): ClientLoggerInstance {
  const { logger, isReady, error } = useLogger();

  if (!isReady || !logger) {
    // 返回一个空的 logger 实例，避免组件报错
    return createEmptyLogger();
  }

  if (error) {
    console.warn(`Logger error in component ${componentName}:`, error);
    return createEmptyLogger();
  }

  return logger.forModule(componentName) as ClientLoggerInstance;
}

/**
 * 使用日志记录的 Hook
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
 * 性能日志 Hook
 */
export function usePerformanceLogger(componentName: string) {
  const logger = useComponentLogger(componentName);

  const measureRender = (renderName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logger.debug(`Render performance: ${renderName}`, {
        duration: `${duration.toFixed(2)}ms`,
        component: componentName,
      });
    };
  };

  const measureAsync = async (operationName: string, operation: () => Promise<any>): Promise<any> => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info(`Async operation completed: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
        component: componentName,
        success: true,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.error(`Async operation failed: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
        component: componentName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };

  return {
    measureRender,
    measureAsync,
    logger,
  };
}

/**
 * 创建空的 logger 实例，用于错误情况下的降级
 */
function createEmptyLogger(): ClientLoggerInstance {
  const emptyFn = () => {};
  const emptyAsyncFn = async () => {};
  
  return {
    info: emptyFn,
    debug: emptyFn,
    warn: emptyFn,
    error: emptyFn,
    withContext: () => createEmptyLogger(),
    forModule: () => createEmptyLogger(),
    flush: emptyAsyncFn,
    getStoredLogs: () => [],
    clearStoredLogs: emptyFn,
  };
}
