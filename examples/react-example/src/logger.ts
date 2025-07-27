/**
 * React 应用日志器配置
 * 适配 v0.7.0-alpha.2 LogLayer API
 */

import { createBrowserLoggerSync } from '@yai-loglayer/browser'

// 创建应用日志器
export const logger = createBrowserLoggerSync({
  level: 'debug', // 开发环境使用 debug 级别
  outputs: {
    console: {
      enabled: true,
      colorized: true,
      groupCollapsed: true
    },
    localStorage: {
      enabled: true,
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
  logger.withMetadata({
    action,
    component,
    timestamp: new Date().toISOString(),
    ...metadata
  }).info(`用户操作: ${action}`)
}

export const logComponentMount = (componentName: string) => {
  logger.withMetadata({
    component: componentName,
    lifecycle: 'mount'
  }).debug(`组件挂载: ${componentName}`)
}

export const logComponentUnmount = (componentName: string) => {
  logger.withMetadata({
    component: componentName,
    lifecycle: 'unmount'
  }).debug(`组件卸载: ${componentName}`)
}

export const logApiCall = (url: string, method: string, duration: number, status?: number) => {
  const level = status && status >= 400 ? 'error' : 'info'
  const metadata = {
    url,
    method,
    duration: `${duration.toFixed(2)}ms`,
    status,
    type: 'api-call'
  }

  if (level === 'error') {
    logger.withMetadata(metadata).error(`API 调用: ${method} ${url}`)
  } else {
    logger.withMetadata(metadata).info(`API 调用: ${method} ${url}`)
  }
}

export const logPerformance = (operation: string, duration: number, metadata = {}) => {
  logger.withMetadata({
    operation,
    duration,
    performanceType: 'measurement',
    type: 'performance',
    ...metadata
  }).info(`Performance: ${operation}`)
}

// 导出主日志器
export default logger
