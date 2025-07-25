/**
 * 端到端集成测试
 * 
 * 测试完整的日志流程，从浏览器端到服务端：
 * - 浏览器日志器 → HTTP 输出器 → 服务端接收器 → 服务端日志器
 * - 网络故障和恢复场景
 * - 性能在真实场景下的表现
 * - 错误传播和处理链
 */

import { createBrowserLogger } from '../../frameworks/browser'
import { createServerLogger } from '../../frameworks/server'
import { createNextjsLogReceiver } from '../../frameworks/receiver'
import type { BrowserLoggerConfig, ServerLoggerConfig } from '../../frameworks/browser'

// Mock HTTP 服务器
class MockHttpServer {
  private handlers = new Map<string, Function>()
  private requestHistory: Array<{ url: string, method: string, body: any, headers: any }> = []

  on(path: string, handler: Function) {
    this.handlers.set(path, handler)
  }

  async request(url: string, options: any) {
    const handler = this.handlers.get(url)
    
    // 记录请求历史
    this.requestHistory.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
      headers: options.headers
    })

    if (handler) {
      const mockRequest = {
        json: async () => JSON.parse(options.body)
      }
      return await handler(mockRequest)
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    }
  }

  getRequestHistory() {
    return this.requestHistory
  }

  clearHistory() {
    this.requestHistory = []
  }
}

describe('端到端集成测试', () => {
  let mockServer: MockHttpServer
  let serverLogger: any
  let logReceiver: any
  const originalProcess = global.process

  beforeEach(async () => {
    jest.clearAllMocks()

    // Mock Node.js 环境
    global.process = {
      ...originalProcess,
      env: { ...originalProcess.env, NODE_ENV: 'test' },
      cwd: jest.fn(() => '/test/directory'),
      memoryUsage: jest.fn(() => ({
        rss: 50 * 1024 * 1024,
        heapTotal: 40 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024
      })),
      platform: 'linux',
      version: 'v18.0.0'
    } as any
    
    // 设置模拟服务器
    mockServer = new MockHttpServer()
    
    // 创建服务端日志器
    serverLogger = await createServerLogger('e2e-server', {
      level: { default: 'info' },
      outputs: [
        { type: 'stdout' }
      ]
    } as ServerLoggerConfig)

    // 创建日志接收器
    logReceiver = createNextjsLogReceiver(serverLogger, {
      validation: { requireLevel: true },
      processing: { supportBatch: true }
    })

    // 注册接收器到模拟服务器
    mockServer.on('/api/logs', logReceiver)

    // Mock fetch 使用模拟服务器
    global.fetch = jest.fn().mockImplementation((url, options) => {
      return mockServer.request(url, options)
    })

    // 浏览器环境已在 browser-setup.ts 中配置
  })

  afterEach(async () => {
    if (serverLogger) {
      await serverLogger.destroy()
    }
    mockServer.clearHistory()
    global.process = originalProcess
  })

  describe('完整日志流程', () => {
    it('应该成功完成浏览器到服务端的日志传输', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // 创建浏览器日志器
      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1, // 立即发送
            flushInterval: 100
          }
        }
      } as BrowserLoggerConfig)

      // 记录日志
      browserLogger.info('End-to-end test message', {
        userId: 'user123',
        action: 'test',
        timestamp: new Date().toISOString()
      })

      // 等待异步传输完成
      await new Promise(resolve => setTimeout(resolve, 200))

      // 验证请求历史
      const requests = mockServer.getRequestHistory()
      expect(requests).toHaveLength(1)
      expect(requests[0].url).toBe('/api/logs')
      expect(requests[0].method).toBe('POST')
      expect(requests[0].body).toBeDefined()
      expect(Array.isArray(requests[0].body)).toBe(true)
      expect(requests[0].body[0].message).toBe('End-to-end test message')

      // 验证服务端接收并处理了日志
      expect(consoleSpy).toHaveBeenCalled()

      await browserLogger.destroy()
      consoleSpy.mockRestore()
    })

    it('应该正确处理批量日志传输', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 3,
            flushInterval: 100
          }
        }
      } as BrowserLoggerConfig)

      // 记录多条日志
      browserLogger.info('Batch message 1')
      browserLogger.warn('Batch message 2')
      browserLogger.error('Batch message 3')

      await new Promise(resolve => setTimeout(resolve, 200))

      // 验证批量传输
      const requests = mockServer.getRequestHistory()
      expect(requests).toHaveLength(1)
      expect(requests[0].body).toHaveLength(3)

      // 验证服务端处理了所有日志
      expect(consoleSpy).toHaveBeenCalledTimes(3)

      await browserLogger.destroy()
      consoleSpy.mockRestore()
    })

    it('应该传输完整的日志元数据', async () => {
      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1
          }
        }
      } as BrowserLoggerConfig)

      const testMetadata = {
        userId: 'user456',
        sessionId: 'session789',
        feature: 'authentication',
        performance: { loadTime: 1234 }
      }

      browserLogger.info('Metadata test', testMetadata)

      await new Promise(resolve => setTimeout(resolve, 200))

      const requests = mockServer.getRequestHistory()
      const logData = requests[0].body[0]

      expect(logData.metadata).toBeDefined()
      expect(logData.metadata.userId).toBe('user456')
      expect(logData.metadata.sessionId).toBe('session789')
      expect(logData.metadata.feature).toBe('authentication')
      expect(logData.metadata.performance.loadTime).toBe(1234)

      await browserLogger.destroy()
    })
  })

  describe('网络故障和恢复', () => {
    it('应该处理网络请求失败', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // 模拟网络失败
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const browserLogger = await createBrowserLogger({
        outputs: {
          console: { enabled: true }, // 备用输出
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1,
            retryAttempts: 1
          }
        }
      } as BrowserLoggerConfig)

      browserLogger.info('Message during network failure')

      await new Promise(resolve => setTimeout(resolve, 300))

      // 网络失败不应该阻止其他输出器工作
      expect(console.log).toHaveBeenCalled()

      await browserLogger.destroy()
      consoleSpy.mockRestore()
    })

    it('应该在网络恢复后重试发送', async () => {
      let failCount = 0
      ;(global.fetch as jest.Mock).mockImplementation((url, options) => {
        failCount++
        if (failCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return mockServer.request(url, options)
      })

      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1,
            retryAttempts: 3,
            retryDelay: 'exponential',
            baseRetryDelay: 50
          }
        }
      } as BrowserLoggerConfig)

      browserLogger.info('Retry test message')

      // 等待重试完成
      await new Promise(resolve => setTimeout(resolve, 500))

      // 验证最终成功发送
      const requests = mockServer.getRequestHistory()
      expect(requests).toHaveLength(1)
      expect(requests[0].body[0].message).toBe('Retry test message')

      await browserLogger.destroy()
    })
  })

  describe('性能和压力测试', () => {
    it('应该处理大量并发日志', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 50,
            flushInterval: 200
          }
        }
      } as BrowserLoggerConfig)

      // 快速记录大量日志
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          browserLogger.info(`Stress test message ${i}`, { index: i })
        )
      }

      await Promise.all(promises)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 验证所有日志都被处理
      const requests = mockServer.getRequestHistory()
      const totalLogs = requests.reduce((sum, req) => sum + req.body.length, 0)
      expect(totalLogs).toBe(100)

      // 验证服务端处理了所有日志
      expect(consoleSpy).toHaveBeenCalledTimes(100)

      await browserLogger.destroy()
      consoleSpy.mockRestore()
    })

    it('应该在高负载下保持性能', async () => {
      const startTime = Date.now()

      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 20
          }
        }
      } as BrowserLoggerConfig)

      // 记录大量日志
      for (let i = 0; i < 200; i++) {
        browserLogger.info(`Performance test ${i}`, {
          data: new Array(100).fill('x').join(''), // 较大的数据
          timestamp: Date.now()
        })
      }

      await browserLogger.destroy()

      const endTime = Date.now()
      const duration = endTime - startTime

      // 性能断言（应该在合理时间内完成）
      expect(duration).toBeLessThan(5000) // 5秒内完成

      // 验证所有日志都被发送
      const requests = mockServer.getRequestHistory()
      const totalLogs = requests.reduce((sum, req) => sum + req.body.length, 0)
      expect(totalLogs).toBe(200)
    })
  })

  describe('错误传播和处理', () => {
    it('应该正确传播和处理错误', async () => {
      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1
          }
        }
      } as BrowserLoggerConfig)

      const testError = new Error('Test error for propagation')
      testError.stack = 'Error: Test error\n    at test.js:1:1'

      await browserLogger.logError(testError, {
        context: 'error-propagation-test',
        userId: 'user123'
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      const requests = mockServer.getRequestHistory()
      const errorLog = requests[0].body[0]

      expect(errorLog.level).toBe('error')
      expect(errorLog.message).toContain('Test error for propagation')
      expect(errorLog.metadata.context).toBe('error-propagation-test')
      expect(errorLog.metadata.errorCode).toBeDefined()
      expect(errorLog.metadata.errorCategory).toBeDefined()

      await browserLogger.destroy()
    })

    it('应该处理服务端验证错误', async () => {
      // 配置严格的服务端验证
      const strictReceiver = createNextjsLogReceiver(serverLogger, {
        validation: {
          requireLevel: true,
          maxMessageLength: 10 // 很短的限制
        }
      })

      mockServer.on('/api/logs', strictReceiver)

      const browserLogger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 1
          }
        }
      } as BrowserLoggerConfig)

      // 发送会被服务端拒绝的日志
      browserLogger.info('This message is too long for server validation')

      await new Promise(resolve => setTimeout(resolve, 200))

      // 验证请求被发送但被服务端拒绝
      const requests = mockServer.getRequestHistory()
      expect(requests).toHaveLength(1)

      await browserLogger.destroy()
    })
  })
})
