/**
 * createBrowserLogger 单元测试
 */

import { createBrowserLogger, createBrowserLoggerSync } from '../browser'

// Mock 浏览器环境
const mockWindow = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  location: {
    href: 'https://example.com/test'
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Test Browser)'
  },
  performance: {
    now: jest.fn(() => 123.45)
  },
  addEventListener: jest.fn(),
  fetch: jest.fn()
}

// 设置全局 mock
Object.assign(global, mockWindow)

describe('createBrowserLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 重置 localStorage mock
    mockWindow.localStorage.getItem.mockReturnValue(null)
    mockWindow.sessionStorage.getItem.mockReturnValue(null)
  })

  describe('基础功能', () => {
    it('应该能够创建默认配置的日志器', async () => {
      const logger = await createBrowserLogger()
      
      expect(logger).toBeDefined()
      expect(logger.isReady()).toBe(true)
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.getSessionId).toBe('function')
    })

    it('应该能够创建自定义配置的日志器', async () => {
      const config = {
        level: 'debug' as const,
        outputs: {
          console: { enabled: true, colorized: false },
          localStorage: { enabled: true, maxEntries: 200 }
        }
      }

      const logger = await createBrowserLogger(config)
      
      expect(logger).toBeDefined()
      expect(logger.getConfig().level).toBe('debug')
    })

    it('应该能够记录不同级别的日志', async () => {
      const logger = await createBrowserLogger({
        outputs: { console: true }
      })

      // Mock console methods
      const consoleSpy = {
        debug: jest.spyOn(console, 'debug').mockImplementation(),
        info: jest.spyOn(console, 'info').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation()
      }

      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      // 验证控制台输出被调用
      expect(consoleSpy.debug).toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalled()

      // 清理
      Object.values(consoleSpy).forEach(spy => spy.mockRestore())
    })
  })

  describe('会话管理', () => {
    it('应该生成唯一的会话 ID', async () => {
      const logger1 = await createBrowserLogger()
      const logger2 = await createBrowserLogger()
      
      const sessionId1 = logger1.getSessionId()
      const sessionId2 = logger2.getSessionId()
      
      expect(sessionId1).toBeDefined()
      expect(sessionId2).toBeDefined()
      expect(sessionId1).not.toBe(sessionId2)
      expect(sessionId1).toMatch(/^sess_/)
    })

    it('应该能够设置自定义会话 ID', async () => {
      const customSessionId = 'custom-session-123'
      const logger = await createBrowserLogger({
        sessionId: customSessionId
      })
      
      expect(logger.getSessionId()).toBe(customSessionId)
    })

    it('应该能够更新会话 ID', async () => {
      const logger = await createBrowserLogger()
      const originalSessionId = logger.getSessionId()
      
      const newSessionId = 'new-session-456'
      logger.setSessionId(newSessionId)
      
      expect(logger.getSessionId()).toBe(newSessionId)
      expect(logger.getSessionId()).not.toBe(originalSessionId)
    })
  })

  describe('本地存储输出', () => {
    it('应该能够将日志保存到 localStorage', async () => {
      const logger = await createBrowserLogger({
        outputs: {
          localStorage: { 
            enabled: true, 
            key: 'test-logs',
            maxEntries: 10
          }
        }
      })

      logger.info('Test message', { test: true })

      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
        'test-logs',
        expect.stringContaining('Test message')
      )
    })

    it('应该应用容量限制', async () => {
      // Mock 现有日志
      const existingLogs = Array.from({ length: 15 }, (_, i) => ({
        level: 'info',
        message: `Message ${i}`,
        timestamp: new Date().toISOString()
      }))
      
      mockWindow.localStorage.getItem.mockReturnValue(JSON.stringify(existingLogs))

      const logger = await createBrowserLogger({
        outputs: {
          localStorage: { 
            enabled: true,
            maxEntries: 10
          }
        }
      })

      logger.info('New message')

      // 验证保存的日志数量不超过限制
      const saveCall = mockWindow.localStorage.setItem.mock.calls[0]
      if (saveCall) {
        const savedLogs = JSON.parse(saveCall[1])
        expect(savedLogs.length).toBeLessThanOrEqual(10)
      }
    })
  })

  describe('HTTP 输出', () => {
    it('应该能够发送日志到服务端', async () => {
      const mockFetch = mockWindow.fetch as jest.Mock
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const logger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/test-logs',
            batchSize: 1 // 立即发送
          }
        }
      })

      logger.error('Test error message')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test-logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test error message')
        })
      )
    })

    it('应该支持批量发送', async () => {
      const mockFetch = mockWindow.fetch as jest.Mock
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const logger = await createBrowserLogger({
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/batch-logs',
            batchSize: 3
          }
        }
      })

      // 发送多条日志
      logger.info('Message 1')
      logger.info('Message 2')
      logger.info('Message 3') // 这条应该触发批量发送

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      const callArgs = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body)
      expect(Array.isArray(requestBody)).toBe(true)
      expect(requestBody.length).toBe(3)
    })
  })

  describe('错误处理', () => {
    it('应该能够记录错误对象', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const logger = await createBrowserLogger({
        outputs: { console: true }
      })

      const testError = new Error('Test error')
      testError.stack = 'Error: Test error\n    at test.js:1:1'
      
      logger.logError(testError, { context: 'test' })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该能够记录性能日志', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      const logger = await createBrowserLogger({
        outputs: { console: true }
      })

      logger.logPerformance('test-operation', 123.45, { component: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance: test-operation'),
        expect.objectContaining({
          performance: expect.objectContaining({
            operation: 'test-operation',
            duration: '123.45ms'
          })
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('子日志器', () => {
    it('应该能够创建子日志器', async () => {
      const logger = await createBrowserLogger()
      
      const childLogger = logger.child({ module: 'test-module' })
      
      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
    })

    it('子日志器应该继承上下文', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      const logger = await createBrowserLogger({
        outputs: { console: true }
      })
      
      const childLogger = logger.child({ module: 'test-module' })
      childLogger.info('Child message')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          module: 'test-module'
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('同步版本', () => {
    it('应该能够同步创建日志器', () => {
      const logger = createBrowserLoggerSync()
      
      expect(logger).toBeDefined()
      expect(logger.isReady()).toBe(true)
      expect(typeof logger.info).toBe('function')
    })

    it('同步版本应该与异步版本功能一致', () => {
      const syncLogger = createBrowserLoggerSync({
        outputs: { console: true }
      })
      
      expect(syncLogger.getSessionId()).toBeDefined()
      expect(typeof syncLogger.logError).toBe('function')
      expect(typeof syncLogger.logPerformance).toBe('function')
    })
  })

  describe('生命周期管理', () => {
    it('应该能够刷新所有输出', async () => {
      const logger = await createBrowserLogger({
        outputs: {
          http: { enabled: true, endpoint: '/api/logs' }
        }
      })

      await expect(logger.flush()).resolves.not.toThrow()
    })

    it('应该能够销毁日志器', async () => {
      const logger = await createBrowserLogger()
      
      await expect(logger.destroy()).resolves.not.toThrow()
      expect(logger.isReady()).toBe(false)
    })
  })
})
