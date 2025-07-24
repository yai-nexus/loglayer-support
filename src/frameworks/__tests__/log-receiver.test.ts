/**
 * createLogReceiver 单元测试
 */

import { 
  createLogReceiver, 
  createNextjsLogReceiver, 
  createExpressLogReceiver 
} from '../receiver'

// Mock 服务端日志器
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logError: jest.fn(),
  forModule: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logError: jest.fn()
  })
}

describe('createLogReceiver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础功能', () => {
    it('应该能够创建日志接收器', () => {
      const receiver = createLogReceiver(mockLogger as any)
      
      expect(receiver).toBeDefined()
      expect(typeof receiver.handle).toBe('function')
      expect(typeof receiver.nextjs).toBe('function')
      expect(typeof receiver.express).toBe('function')
      expect(typeof receiver.getStatus).toBe('function')
    })

    it('应该能够处理单条日志', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          requireLevel: true,
          requireMessage: true
        }
      })

      const logData = {
        level: 'info',
        message: 'Test message',
        metadata: { test: true },
        timestamp: new Date().toISOString(),
        sessionId: 'test-session'
      }

      const result = await receiver.handle(logData)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('应该能够处理批量日志', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        processing: {
          supportBatch: true,
          maxBatchSize: 10
        }
      })

      const logDataArray = [
        { level: 'info', message: 'Message 1' },
        { level: 'warn', message: 'Message 2' },
        { level: 'error', message: 'Message 3' }
      ]

      const result = await receiver.handle(logDataArray)

      expect(result.success).toBe(true)
      expect(result.processed).toBe(3)
      expect(result.failed).toBe(0)
    })
  })

  describe('数据验证', () => {
    it('应该验证必需字段', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          requireLevel: true,
          requireMessage: true
        }
      })

      // 缺少 level 字段
      const invalidData = {
        message: 'Test message'
      }

      const result = await receiver.handle(invalidData as any)

      expect(result.success).toBe(false)
      expect(result.processed).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].error).toContain('level')
    })

    it('应该验证日志级别', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          allowedLevels: ['info', 'warn', 'error']
        }
      })

      const invalidData = {
        level: 'invalid-level',
        message: 'Test message'
      }

      const result = await receiver.handle(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors![0].error).toContain('Invalid log level')
    })

    it('应该验证消息长度', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          maxMessageLength: 10
        }
      })

      const invalidData = {
        level: 'info',
        message: 'This message is too long for the limit'
      }

      const result = await receiver.handle(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors![0].error).toContain('Message too long')
    })

    it('应该支持自定义验证', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          customValidator: (data) => {
            if (data.level === 'error' && !data.error) {
              return {
                valid: false,
                errors: ['Error level logs must include error details']
              }
            }
            return { valid: true, errors: [] }
          }
        }
      })

      const invalidData = {
        level: 'error',
        message: 'Error without details'
      }

      const result = await receiver.handle(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors![0].error).toContain('Error level logs must include error details')
    })
  })

  describe('日志处理', () => {
    it('应该根据级别调用相应的日志方法', async () => {
      const moduleLogger = mockLogger.forModule('client-log-receiver')
      const receiver = createLogReceiver(mockLogger as any)

      const testCases = [
        { level: 'debug', method: 'debug' },
        { level: 'info', method: 'info' },
        { level: 'warn', method: 'warn' },
        { level: 'error', method: 'error' }
      ]

      for (const testCase of testCases) {
        await receiver.handle({
          level: testCase.level,
          message: `Test ${testCase.level} message`
        })

        expect(moduleLogger[testCase.method]).toHaveBeenCalledWith(
          expect.stringContaining(`Test ${testCase.level} message`),
          expect.any(Object)
        )
      }
    })

    it('应该重建错误对象', async () => {
      const moduleLogger = mockLogger.forModule('client-log-receiver')
      const receiver = createLogReceiver(mockLogger as any, {
        processing: {
          reconstructErrors: true
        }
      })

      const errorData = {
        level: 'error',
        message: 'JavaScript error occurred',
        error: {
          name: 'TypeError',
          message: 'Cannot read property of undefined',
          stack: 'TypeError: Cannot read property...\n    at test.js:1:1'
        }
      }

      await receiver.handle(errorData)

      expect(moduleLogger.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
        expect.stringContaining('客户端错误')
      )
    })

    it('应该添加服务端上下文', async () => {
      const moduleLogger = mockLogger.forModule('client-log-receiver')
      const receiver = createLogReceiver(mockLogger as any, {
        processing: {
          addServerContext: true
        }
      })

      await receiver.handle({
        level: 'info',
        message: 'Test message'
      })

      expect(moduleLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          receivedAt: expect.any(String),
          source: 'client-browser'
        })
      )
    })
  })

  describe('Next.js 适配器', () => {
    it('应该创建 Next.js 特定的接收器', () => {
      const receiver = createNextjsLogReceiver(mockLogger as any)
      
      expect(typeof receiver).toBe('function')
    })

    it('应该处理 Next.js 请求', async () => {
      const receiver = createNextjsLogReceiver(mockLogger as any)
      
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          level: 'info',
          message: 'Next.js test message'
        }),
        headers: new Map([
          ['user-agent', 'Mozilla/5.0...'],
          ['x-forwarded-for', '192.168.1.1']
        ]),
        method: 'POST',
        url: '/api/logs'
      }

      const response = await receiver(mockRequest)
      
      expect(response).toBeDefined()
      expect(mockRequest.json).toHaveBeenCalled()
    })
  })

  describe('Express.js 适配器', () => {
    it('应该创建 Express.js 特定的接收器', () => {
      const receiver = createExpressLogReceiver(mockLogger as any)
      
      expect(typeof receiver).toBe('function')
    })

    it('应该处理 Express.js 请求', async () => {
      const receiver = createExpressLogReceiver(mockLogger as any)
      
      const mockReq = {
        body: {
          level: 'warn',
          message: 'Express.js test message'
        },
        headers: {
          'user-agent': 'Mozilla/5.0...',
          'x-forwarded-for': '10.0.0.1'
        },
        method: 'POST',
        originalUrl: '/api/logs'
      }

      const mockRes = {
        status: jest.fn().mockReturnValue({
          json: jest.fn()
        })
      }

      await receiver(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })

  describe('状态查询', () => {
    it('应该返回接收器状态', () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          allowedLevels: ['info', 'warn', 'error']
        }
      })

      const status = receiver.getStatus()

      expect(status).toEqual({
        service: 'client-logs-receiver',
        status: 'active',
        timestamp: expect.any(String),
        config: expect.any(Object),
        stats: expect.objectContaining({
          acceptedLogLevels: ['info', 'warn', 'error'],
          supportedMethods: ['POST']
        })
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理解析错误', async () => {
      const receiver = createNextjsLogReceiver(mockLogger as any)
      
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Map(),
        method: 'POST',
        url: '/api/logs'
      }

      const response = await receiver(mockRequest)
      
      // 应该返回错误响应
      expect(response).toBeDefined()
    })

    it('应该处理验证错误', async () => {
      const receiver = createLogReceiver(mockLogger as any, {
        validation: {
          requireLevel: true,
          requireMessage: true
        }
      })

      const invalidData = { message: 'Missing level' }
      const result = await receiver.handle(invalidData as any)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('生命周期管理', () => {
    it('应该能够销毁接收器', async () => {
      const receiver = createLogReceiver(mockLogger as any)
      
      await expect(receiver.destroy()).resolves.not.toThrow()
    })
  })
})
