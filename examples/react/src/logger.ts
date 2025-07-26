/**
 * React 应用日志器配置
 * 适配 v0.7.0-alpha.2 LogLayer API
 */

import { createBrowserLoggerSync } from '@yai-nexus/loglayer-support'

// 创建应用日志器
export const logger = createBrowserLoggerSync({
  level: import.meta.env.DEV ? 'debug' : 'info',
  outputs: {
    console: {
      colorized: true,
      groupCollapsed: true
    },
    localStorage: {
      key: 'react-app-logs',
      maxEntries: 200
    }
    // 在实际应用中，可以启用HTTP输出
    // http: {
    //   enabled: true,
    //   endpoint: '/api/logs'
    // }
  }
})

// 导出便捷方法
export const logUserAction = (action: string, component: string, metadata = {}) => {
  logger.info(`用户操作: ${action}`, {
    action,
    component,
    timestamp: new Date().toISOString(),
    ...metadata
  })
}

export const logComponentMount = (componentName: string) => {
  logger.debug(`组件挂载: ${componentName}`, {
    component: componentName,
    lifecycle: 'mount'
  })
}

export const logComponentUnmount = (componentName: string) => {
  logger.debug(`组件卸载: ${componentName}`, {
    component: componentName,
    lifecycle: 'unmount'
  })
}

export const logApiCall = (url: string, method: string, duration: number, status?: number) => {
  const level = status && status >= 400 ? 'error' : 'info'
  logger[level](`API 调用: ${method} ${url}`, {
    url,
    method,
    duration: `${duration.toFixed(2)}ms`,
    status,
    type: 'api-call'
  })
}

export const logPerformance = (operation: string, duration: number, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    performanceType: 'measurement',
    type: 'performance',
    ...metadata
  })
}

// 导出主日志器
export default logger
