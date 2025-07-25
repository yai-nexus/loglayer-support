/**
 * createBrowserLogger 使用示例
 * 
 * 这个文件展示了如何使用新的 createBrowserLogger API
 */

import { createBrowserLogger, createBrowserLoggerSync } from '../browser'

// ==================== 基础用法示例 ====================

async function basicUsageExample() {
  // 使用默认配置创建日志器
  const logger = await createBrowserLogger()
  
  // 基础日志记录
  logger.info('应用启动', { version: '1.0.0', environment: 'production' })
  logger.warn('配置项缺失', { missingKey: 'apiEndpoint' })
  logger.error('网络请求失败', { url: '/api/users', status: 500 })
  
  // 错误日志
  try {
    throw new Error('Something went wrong')
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'user-action' })
  }
  
  // 性能日志
  const start = performance.now()
  await new Promise(resolve => setTimeout(resolve, 100))
  logger.logPerformance('async-operation', performance.now() - start)
}

// ==================== 高级配置示例 ====================

async function advancedConfigExample() {
  const logger = await createBrowserLogger({
    level: 'debug',
    outputs: {
      console: {
        enabled: true,
        groupCollapsed: true,
        colorized: true,
        colors: {
          debug: '#666',
          info: '#0066cc',
          warn: '#ff9900',
          error: '#cc0000'
        }
      },
      localStorage: {
        enabled: true,
        key: 'my-app-logs',
        maxEntries: 1000,
        levelFilter: ['warn', 'error']
      },
      http: {
        enabled: true,
        endpoint: '/api/logs',
        batchSize: 20,
        flushInterval: 10000,
        retryAttempts: 5,
        levelFilter: ['error'],
        transform: (data) => ({
          ...data,
          appVersion: '1.0.0',
          buildId: 'abc123'
        })
      }
    },
    context: {
      includeUserAgent: true,
      includeUrl: true,
      customFields: {
        userId: () => getCurrentUserId(),
        sessionType: () => getSessionType()
      }
    },
    performance: {
      enablePerformanceLogging: true,
      autoLogPageLoad: true,
      performanceLogLevel: 'info'
    },
    errorHandling: {
      captureGlobalErrors: true,
      captureUnhandledRejections: true,
      errorFilter: (error) => !error.message.includes('Script error')
    },
    sampling: {
      rate: 0.1, // 10% 采样
      levelRates: {
        error: 1.0,  // 错误 100% 采样
        warn: 0.5,   // 警告 50% 采样
        info: 0.1,   // 信息 10% 采样
        debug: 0.01  // 调试 1% 采样
      }
    }
  })
  
  logger.debug('调试信息', { component: 'user-profile' })
  logger.info('用户操作', { action: 'click', element: 'submit-button' })
}

// ==================== 子日志器示例 ====================

async function childLoggerExample() {
  const logger = await createBrowserLogger()
  
  // 创建模块特定的日志器
  const apiLogger = logger.child({ module: 'api' })
  const uiLogger = logger.child({ module: 'ui', component: 'header' })
  
  // 使用子日志器
  apiLogger.info('API 请求开始', { endpoint: '/users' })
  uiLogger.warn('组件渲染警告', { reason: 'missing-prop' })
  
  // 创建请求特定的日志器
  const requestLogger = apiLogger.child({ requestId: 'req-123' })
  requestLogger.info('请求处理中')
  requestLogger.error('请求失败', { error: 'timeout' })
}

// ==================== 同步版本示例 ====================

function syncVersionExample() {
  // 适用于简单场景，不需要异步初始化
  const logger = createBrowserLoggerSync({
    outputs: {
      console: true,
      localStorage: { enabled: true, maxEntries: 100 }
    }
  })
  
  logger.info('同步日志器创建成功')
}

// ==================== 输出器管理示例 ====================

async function outputManagementExample() {
  const logger = await createBrowserLogger()
  
  // 添加自定义输出器
  const customOutput = {
    name: 'custom',
    write: (data: any) => {
      console.log('Custom output:', data)
    }
  }
  
  logger.addOutput(customOutput)
  logger.info('这条日志会发送到自定义输出器')
  
  // 移除输出器
  logger.removeOutput(customOutput)
  
  // 手动刷新缓冲区
  await logger.flush()
  
  // 销毁日志器
  await logger.destroy()
}

// ==================== 工具函数 ====================

function getCurrentUserId(): string {
  // 模拟获取当前用户 ID
  return 'user-123'
}

function getSessionType(): string {
  // 模拟获取会话类型
  return 'authenticated'
}

// ==================== 导出示例函数 ====================

export {
  basicUsageExample,
  advancedConfigExample,
  childLoggerExample,
  syncVersionExample,
  outputManagementExample
}

// ==================== 自动运行示例（仅在浏览器环境） ====================

if (typeof window !== 'undefined') {
  // 在浏览器环境中自动运行基础示例
  basicUsageExample().catch(console.error)
}
