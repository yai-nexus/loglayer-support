/**
 * createServerLogger 使用示例
 * 
 * 这个文件展示了如何使用新的 createServerLogger API
 */

import { 
  createServerLogger, 
  createServerLoggerManager,
  createNextjsServerLogger,
  createExpressServerLogger
} from '../server'

// ==================== 基础用法示例 ====================

export async function basicUsageExample() {
  console.log('=== 基础用法示例 ===')
  
  // 创建服务端日志器
  const serverInstance = await createServerLogger('my-app', {
    environment: 'development',
    paths: {
      logsDir: './logs',
      autoDetectRoot: true
    },
    outputs: [
      { type: 'stdout' },
      {
        type: 'file',
        config: {
          filename: 'app.log',
          rotation: {
            maxSize: '10m',
            maxFiles: 5
          }
        }
      }
    ],
    modules: {
      api: { level: 'info', context: { service: 'api-gateway' } },
      database: { level: 'debug', context: { component: 'db-layer' } },
      auth: { level: 'warn', context: { security: true } }
    },
    initialization: {
      logStartupInfo: true,
      fallbackToConsole: true
    }
  })

  // 使用主日志器
  serverInstance.logger.info('应用启动', { 
    version: '1.0.0',
    environment: 'development'
  })

  // 使用模块日志器
  const apiLogger = serverInstance.forModule('api')
  apiLogger.info('API 服务启动', { port: 3000 })

  const dbLogger = serverInstance.forModule('database')
  dbLogger.debug('数据库连接建立', { 
    host: 'localhost',
    database: 'myapp'
  })

  const authLogger = serverInstance.forModule('auth')
  authLogger.warn('认证配置检查', { 
    jwtSecret: '***',
    sessionTimeout: 3600
  })

  // 获取统计信息
  const stats = serverInstance.getStats()
  console.log('日志器统计:', stats)

  // 健康检查
  const health = await serverInstance.healthCheck()
  console.log('健康检查结果:', health)

  return serverInstance
}

// ==================== Next.js 使用示例 ====================

export async function nextjsExample() {
  console.log('=== Next.js 使用示例 ===')
  
  // 创建 Next.js 特定的服务端日志器
  const serverInstance = await createNextjsServerLogger({
    modules: {
      api: { level: 'info' },
      database: { level: 'debug' },
      auth: { level: 'warn' },
      middleware: { level: 'debug' }
    },
    performance: {
      enabled: true,
      interval: 60000,
      memoryThreshold: 512
    },
    healthCheck: {
      enabled: true,
      interval: 30000
    },
    errorHandling: {
      captureUncaughtExceptions: true,
      captureUnhandledRejections: true
    }
  })

  // 模拟 Next.js API 路由使用
  const apiLogger = serverInstance.forModule('api')
  apiLogger.info('处理 API 请求', {
    method: 'GET',
    path: '/api/users',
    userAgent: 'Mozilla/5.0...',
    ip: '192.168.1.1'
  })

  // 模拟数据库操作
  const dbLogger = serverInstance.forModule('database')
  dbLogger.debug('执行数据库查询', {
    sql: 'SELECT * FROM users WHERE active = ?',
    params: [true],
    duration: 45
  })

  // 模拟认证检查
  const authLogger = serverInstance.forModule('auth')
  authLogger.warn('JWT 令牌即将过期', {
    userId: 'user123',
    expiresIn: 300,
    shouldRefresh: true
  })

  return serverInstance
}

// ==================== Express.js 使用示例 ====================

export async function expressExample() {
  console.log('=== Express.js 使用示例 ===')
  
  // 创建 Express.js 特定的服务端日志器
  const serverInstance = await createExpressServerLogger({
    modules: {
      router: { level: 'info' },
      middleware: { level: 'debug' },
      database: { level: 'debug' },
      security: { level: 'warn' }
    },
    initialization: {
      logStartupInfo: true
    }
  })

  // 模拟 Express.js 中间件使用
  const middlewareLogger = serverInstance.forModule('middleware')
  middlewareLogger.debug('请求中间件处理', {
    middleware: 'cors',
    origin: 'https://example.com',
    method: 'POST'
  })

  // 模拟路由处理
  const routerLogger = serverInstance.forModule('router')
  routerLogger.info('路由匹配', {
    route: '/api/users/:id',
    method: 'GET',
    params: { id: '123' }
  })

  // 模拟安全检查
  const securityLogger = serverInstance.forModule('security')
  securityLogger.warn('可疑请求检测', {
    ip: '10.0.0.1',
    userAgent: 'suspicious-bot',
    reason: 'high-frequency-requests'
  })

  return serverInstance
}

// ==================== 管理器模式示例 ====================

export async function managerExample() {
  console.log('=== 管理器模式示例 ===')
  
  // 创建日志器管理器
  const manager = createServerLoggerManager({
    environment: 'production',
    outputs: [
      { type: 'stdout' },
      { type: 'file', config: { filename: 'global.log' } }
    ],
    errorHandling: {
      captureUncaughtExceptions: true,
      captureUnhandledRejections: true
    }
  })

  // 创建多个服务实例
  const apiService = await manager.create('api-service', {
    modules: {
      api: { level: 'info' },
      validation: { level: 'debug' }
    },
    outputs: [
      { type: 'file', config: { filename: 'api.log' } }
    ]
  })

  const dbService = await manager.create('db-service', {
    modules: {
      database: { level: 'debug' },
      migration: { level: 'info' }
    },
    outputs: [
      { type: 'file', config: { filename: 'database.log' } }
    ]
  })

  // 使用不同的服务日志器
  const apiLogger = apiService.forModule('api')
  apiLogger.info('API 服务处理请求', { endpoint: '/users' })

  const dbLogger = dbService.forModule('database')
  dbLogger.debug('数据库查询执行', { table: 'users', operation: 'SELECT' })

  // 获取管理器统计
  const managerStats = manager.getManagerStats()
  console.log('管理器统计:', managerStats)

  // 批量健康检查
  const healthResults = await manager.healthCheckAll()
  console.log('批量健康检查:', healthResults)

  // 批量刷新
  await manager.flushAll()

  return { manager, apiService, dbService }
}

// ==================== 高级功能示例 ====================

export async function advancedFeaturesExample() {
  console.log('=== 高级功能示例 ===')
  
  const serverInstance = await createServerLogger('advanced-app', {
    environment: 'production',
    
    // 性能监控
    performance: {
      enabled: true,
      interval: 30000,
      memoryThreshold: 256,
      cpuThreshold: 70,
      trackGC: true
    },
    
    // 健康检查
    healthCheck: {
      enabled: true,
      interval: 15000,
      customCheck: async () => {
        // 自定义健康检查逻辑
        const memUsage = process.memoryUsage()
        return {
          healthy: memUsage.heapUsed < 500 * 1024 * 1024, // 500MB
          details: {
            memoryUsage: memUsage,
            uptime: process.uptime()
          }
        }
      }
    },
    
    // 错误处理
    errorHandling: {
      captureUncaughtExceptions: true,
      captureUnhandledRejections: true,
      errorHandler: (error, context) => {
        console.error('自定义错误处理:', error.message, context)
        // 这里可以发送到错误监控服务
      }
    },
    
    // 全局上下文
    globalContext: {
      service: 'advanced-app',
      version: '2.0.0',
      deployment: 'production'
    }
  }, {
    // 创建选项
    onInitialized: async (instance) => {
      console.log('日志器初始化完成回调')
      const stats = instance.getStats()
      console.log('初始统计:', stats)
    },
    onError: (error) => {
      console.error('日志器创建错误:', error)
    }
  })

  // 测试模块配置更新
  await serverInstance.updateConfig({
    modules: {
      newModule: {
        level: 'info',
        context: { feature: 'dynamic-module' }
      }
    }
  })

  const newModuleLogger = serverInstance.forModule('newModule')
  newModuleLogger.info('动态添加的模块', { test: true })

  return serverInstance
}

// ==================== 生命周期管理示例 ====================

export async function lifecycleExample() {
  console.log('=== 生命周期管理示例 ===')
  
  const serverInstance = await createServerLogger('lifecycle-test', {
    initialization: {
      logStartupInfo: true
    }
  })

  // 正常使用
  serverInstance.logger.info('应用运行中')

  // 模拟优雅关闭
  console.log('开始优雅关闭...')
  await serverInstance.shutdown()
  
  console.log('优雅关闭完成')
  
  // 最终销毁
  await serverInstance.destroy()
  console.log('资源清理完成')
}

// ==================== 自动运行示例 ====================

if (require.main === module) {
  console.log('运行 createServerLogger 示例...\n')
  
  // 运行所有示例
  Promise.resolve()
    .then(() => basicUsageExample())
    .then((instance) => {
      console.log('基础示例完成\n')
      return instance.destroy()
    })
    .then(() => nextjsExample())
    .then((instance) => {
      console.log('Next.js 示例完成\n')
      return instance.destroy()
    })
    .then(() => expressExample())
    .then((instance) => {
      console.log('Express.js 示例完成\n')
      return instance.destroy()
    })
    .then(() => managerExample())
    .then(({ manager }) => {
      console.log('管理器示例完成\n')
      return manager.destroyAll()
    })
    .then(() => advancedFeaturesExample())
    .then((instance) => {
      console.log('高级功能示例完成\n')
      return instance.destroy()
    })
    .then(() => lifecycleExample())
    .then(() => {
      console.log('生命周期示例完成\n')
      console.log('所有示例运行完成！')
    })
    .catch(console.error)
}
