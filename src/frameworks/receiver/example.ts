/**
 * createLogReceiver 使用示例
 * 
 * 这个文件展示了如何使用新的 createLogReceiver API
 */

import { 
  createLogReceiver, 
  createNextjsLogReceiver, 
  createExpressLogReceiver 
} from '../receiver'

// 模拟服务端日志器
const mockLogger = {
  forModule: (name: string) => ({
    debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta),
    info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta),
    warn: (msg: string, meta?: any) => console.log(`[WARN] ${msg}`, meta),
    error: (msg: string, meta?: any) => console.log(`[ERROR] ${msg}`, meta),
    logError: (error: Error, meta?: any, customMsg?: string) => 
      console.log(`[ERROR] ${customMsg || error.message}`, { error, ...meta })
  })
} as any

// ==================== Next.js 使用示例 ====================

export function nextjsExample() {
  // 创建 Next.js 日志接收器
  const logReceiver = createNextjsLogReceiver(mockLogger, {
    validation: {
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 2000
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 50,
      addServerContext: true,
      messagePrefix: '[客户端]'
    },
    security: {
      validateOrigin: false, // 在示例中禁用
      rateLimiting: {
        maxRequestsPerMinute: 100,
        byIP: true
      }
    },
    response: {
      successMessage: '日志接收成功',
      includeStats: true
    }
  })

  // 模拟 Next.js API Route 使用
  console.log('=== Next.js API Route 示例 ===')
  
  // 模拟请求对象
  const mockRequest = {
    json: async () => ({
      level: 'error',
      message: 'API 调用失败',
      metadata: { endpoint: '/api/users', status: 500 },
      timestamp: new Date().toISOString(),
      sessionId: 'sess_123',
      userAgent: 'Mozilla/5.0...',
      url: 'https://example.com/dashboard'
    }),
    headers: new Map([
      ['user-agent', 'Mozilla/5.0...'],
      ['x-forwarded-for', '192.168.1.1']
    ]),
    method: 'POST',
    url: '/api/logs'
  }

  // 处理请求
  return logReceiver(mockRequest)
}

// ==================== Express.js 使用示例 ====================

export function expressExample() {
  // 创建 Express.js 日志接收器
  const logReceiver = createExpressLogReceiver(mockLogger, {
    validation: {
      allowedLevels: ['info', 'warn', 'error'],
      maxMessageLength: 1000
    },
    processing: {
      supportBatch: true,
      logSuccessfulReceives: true
    }
  })

  console.log('=== Express.js 中间件示例 ===')

  // 模拟 Express.js 请求和响应对象
  const mockReq = {
    body: {
      level: 'warn',
      message: '配置项缺失',
      metadata: { missingKey: 'apiEndpoint' }
    },
    headers: {
      'user-agent': 'Mozilla/5.0...',
      'x-forwarded-for': '10.0.0.1'
    },
    method: 'POST',
    originalUrl: '/api/logs',
    ip: '10.0.0.1'
  }

  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Response ${code}:`, data)
        return data
      }
    })
  }

  // 处理请求
  return logReceiver(mockReq, mockRes)
}

// ==================== 通用处理器示例 ====================

export async function genericExample() {
  // 创建通用日志接收器
  const receiver = createLogReceiver(mockLogger, {
    validation: { 
      requireLevel: true,
      requireMessage: true
    },
    processing: { 
      supportBatch: true,
      messagePrefix: '[浏览器]'
    }
  })

  console.log('=== 通用处理器示例 ===')

  // 处理单条日志
  const singleResult = await receiver.handle({
    level: 'error',
    message: 'JavaScript 错误',
    metadata: { 
      component: 'UserProfile',
      action: 'submit'
    },
    error: {
      name: 'TypeError',
      message: 'Cannot read property of undefined',
      stack: 'TypeError: Cannot read property...\n    at UserProfile.submit...'
    }
  })

  console.log('单条日志处理结果:', singleResult)

  // 处理批量日志
  const batchResult = await receiver.handle([
    {
      level: 'info',
      message: '用户登录',
      metadata: { userId: 'user123', method: 'oauth' }
    },
    {
      level: 'warn',
      message: '会话即将过期',
      metadata: { sessionId: 'sess_456', expiresIn: 300 }
    },
    {
      level: 'debug',
      message: '组件渲染',
      metadata: { component: 'Header', renderTime: 15.2 }
    }
  ])

  console.log('批量日志处理结果:', batchResult)

  // 获取状态
  const status = receiver.getStatus()
  console.log('接收器状态:', status)

  return { singleResult, batchResult, status }
}

// ==================== 高级配置示例 ====================

export async function advancedConfigExample() {
  const receiver = createLogReceiver(mockLogger, {
    validation: {
      requireLevel: true,
      requireMessage: true,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxMessageLength: 500,
      maxMetadataSize: 5120,
      validateTimestamp: true,
      customValidator: (data) => {
        // 自定义验证逻辑
        if (data.level === 'error' && !data.error) {
          return {
            valid: false,
            errors: ['Error level logs must include error details']
          }
        }
        return { valid: true, errors: [] }
      }
    },
    processing: {
      preserveClientLevel: true,
      addServerContext: true,
      supportBatch: true,
      maxBatchSize: 20,
      messagePrefix: '[前端]',
      reconstructErrors: true
    },
    security: {
      validateOrigin: false, // 在示例中禁用
      contentFilter: {
        filterSensitive: true,
        sensitiveFields: ['password', 'token', 'apiKey'],
        customFilter: (data) => {
          // 移除敏感信息
          if (data.metadata) {
            const filtered = { ...data.metadata }
            delete filtered.password
            delete filtered.token
            return { ...data, metadata: filtered }
          }
          return data
        }
      }
    },
    response: {
      successMessage: '日志处理完成',
      errorMessage: '日志处理异常',
      includeDetails: true,
      includeStats: true,
      customResponseBuilder: (result, data) => ({
        success: result.success,
        processed: result.processed,
        failed: result.failed,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substr(2, 9)
      })
    },
    debug: true
  })

  console.log('=== 高级配置示例 ===')

  // 测试自定义验证
  const invalidResult = await receiver.handle({
    level: 'error',
    message: '这是一个错误但没有错误详情'
    // 缺少 error 字段，应该验证失败
  })

  console.log('自定义验证结果:', invalidResult)

  return invalidResult
}

// ==================== 自动运行示例 ====================

if (require.main === module) {
  console.log('运行 createLogReceiver 示例...\n')
  
  // 运行所有示例
  Promise.resolve()
    .then(() => nextjsExample())
    .then((result) => console.log('Next.js 示例结果:', result))
    .then(() => expressExample())
    .then(() => genericExample())
    .then((result) => console.log('通用示例结果:', result))
    .then(() => advancedConfigExample())
    .then((result) => console.log('高级配置示例结果:', result))
    .catch(console.error)
}
