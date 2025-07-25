/**
 * 服务端集成测试
 * 
 * 测试服务端日志器的完整工作流程，包括：
 * - 服务端日志器与接收器的协同工作
 * - 模块管理和多实例场景
 * - 健康检查和统计信息收集
 * - 不同适配器的集成效果
 */

import { createServerLogger, createServerLoggerManager } from '../../frameworks/server'
import { createNextjsLogReceiver } from '../../frameworks/receiver'
import type { ServerLoggerConfig } from '../../frameworks/server'

// Mock Node.js 环境
const originalProcess = global.process

beforeAll(() => {
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
    version: 'v18.0.0',
    versions: { node: '18.0.0' }
  } as any
})

afterAll(() => {
  global.process = originalProcess
})

describe('服务端集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('服务端日志器基础集成', () => {
    it('应该成功创建和配置服务端日志器', async () => {
      const config: ServerLoggerConfig = {
        level: { default: 'info' },
        environment: 'test',
        modules: {
          api: { level: 'debug', sampling: 1.0 },
          database: { level: 'warn', sampling: 0.5 }
        },
        outputs: [
          { type: 'stdout' }
        ]
      }

      const serverInstance = await createServerLogger('test-server', config)

      expect(serverInstance).toBeDefined()
      expect(serverInstance.logger).toBeDefined()
      expect(typeof serverInstance.logger.info).toBe('function')
      expect(typeof serverInstance.forModule).toBe('function')
      expect(typeof serverInstance.getStats).toBe('function')
    })

    it('应该正确管理模块日志器', async () => {
      const config: ServerLoggerConfig = {
        level: { default: 'info' },
        modules: {
          auth: { level: 'debug' },
          api: { level: 'info' },
          database: { level: 'warn' }
        }
      }

      const serverInstance = await createServerLogger('module-test', config)

      // 创建模块日志器
      const authLogger = serverInstance.forModule('auth')
      const apiLogger = serverInstance.forModule('api')
      const dbLogger = serverInstance.forModule('database')

      expect(authLogger).toBeDefined()
      expect(apiLogger).toBeDefined()
      expect(dbLogger).toBeDefined()

      // 测试不同模块的日志级别
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      authLogger.debug('Auth debug message') // 应该记录
      apiLogger.debug('API debug message')   // 应该被过滤（api 模块级别是 info）
      dbLogger.info('DB info message')       // 应该被过滤（db 模块级别是 warn）

      expect(consoleSpy).toHaveBeenCalledTimes(1)
      consoleSpy.mockRestore()
    })

    it('应该动态创建新模块', async () => {
      const serverInstance = await createServerLogger('dynamic-test', {
        level: { default: 'info' }
      })

      // 创建未预配置的模块
      const newModuleLogger = serverInstance.forModule('new-module')
      expect(newModuleLogger).toBeDefined()

      // 应该使用默认配置
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      newModuleLogger.info('New module message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('多实例管理集成', () => {
    it('应该管理多个服务端日志器实例', async () => {
      const manager = createServerLoggerManager({
        level: { default: 'info' }
      })

      // 创建多个实例
      const logger1 = await manager.create('service-1', {
        level: { default: 'debug' },
        modules: { api: { level: 'info' } }
      })

      const logger2 = await manager.create('service-2', {
        level: { default: 'warn' },
        modules: { database: { level: 'error' } }
      })

      expect(logger1).toBeDefined()
      expect(logger2).toBeDefined()

      // 验证实例独立性
      const stats = manager.getManagerStats()
      expect(stats.totalInstances).toBe(2)
      expect(stats.activeInstances).toBe(2)
    })

    it('应该正确执行批量健康检查', async () => {
      const manager = createServerLoggerManager()

      await manager.create('healthy-service', {
        level: { default: 'info' },
        healthCheck: {
          enabled: true,
          customChecks: [
            async () => ({ healthy: true, details: { status: 'ok' } })
          ]
        }
      })

      await manager.create('unhealthy-service', {
        level: { default: 'info' },
        healthCheck: {
          enabled: true,
          customChecks: [
            async () => ({ healthy: false, details: { error: 'service down' } })
          ]
        }
      })

      const healthResults = await manager.healthCheckAll()

      expect(healthResults['healthy-service']).toBeDefined()
      expect(healthResults['healthy-service'].healthy).toBe(true)
      expect(healthResults['unhealthy-service']).toBeDefined()
      expect(healthResults['unhealthy-service'].healthy).toBe(false)
    })

    it('应该正确销毁特定实例', async () => {
      const manager = createServerLoggerManager()

      await manager.create('temp-service', { level: { default: 'info' } })
      
      let stats = manager.getManagerStats()
      expect(stats.totalInstances).toBe(1)

      await manager.destroy('temp-service')
      
      stats = manager.getManagerStats()
      expect(stats.totalInstances).toBe(0)
    })
  })

  describe('日志接收器集成', () => {
    it('应该正确处理接收到的日志', async () => {
      const serverLogger = await createServerLogger('receiver-test', {
        level: { default: 'info' }
      })

      const receiver = createNextjsLogReceiver(serverLogger, {
        validation: {
          requireLevel: true,
          maxMessageLength: 1000
        },
        processing: {
          supportBatch: true,
          maxBatchSize: 10
        }
      })

      // 模拟 Next.js 请求对象
      const mockRequest = {
        json: async () => ({
          level: 'info',
          message: 'Test log from client',
          metadata: { userId: '123', action: 'login' },
          timestamp: new Date().toISOString()
        })
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const response = await receiver(mockRequest)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
      
      // 验证日志被正确处理
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该处理批量日志', async () => {
      const serverLogger = await createServerLogger('batch-test', {
        level: { default: 'info' }
      })

      const receiver = createNextjsLogReceiver(serverLogger, {
        processing: { supportBatch: true }
      })

      const batchLogs = [
        { level: 'info', message: 'Log 1', timestamp: new Date().toISOString() },
        { level: 'warn', message: 'Log 2', timestamp: new Date().toISOString() },
        { level: 'error', message: 'Log 3', timestamp: new Date().toISOString() }
      ]

      const mockRequest = {
        json: async () => batchLogs
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const response = await receiver(mockRequest)

      expect(response.status).toBe(200)
      
      // 应该处理所有批量日志
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      consoleSpy.mockRestore()
    })

    it('应该验证和拒绝无效日志', async () => {
      const serverLogger = await createServerLogger('validation-test', {
        level: { default: 'info' }
      })

      const receiver = createNextjsLogReceiver(serverLogger, {
        validation: {
          requireLevel: true,
          maxMessageLength: 10 // 很短的限制
        }
      })

      const invalidLog = {
        // 缺少 level
        message: 'This message is too long for the validation limit',
        timestamp: new Date().toISOString()
      }

      const mockRequest = {
        json: async () => invalidLog
      }

      const response = await receiver(mockRequest)

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.errors).toBeDefined()
      expect(responseData.errors.length).toBeGreaterThan(0)
    })
  })

  describe('统计信息和监控集成', () => {
    it('应该收集准确的运行时统计', async () => {
      const logger = await createServerLogger('stats-test', {
        level: { default: 'info' },
        performance: { enabled: true }
      })

      // 记录一些日志
      logger.info('Test message 1')
      logger.warn('Test message 2')
      logger.error('Test message 3')

      const stats = logger.getStats()

      expect(stats).toBeDefined()
      expect(stats.totalLogs).toBeGreaterThan(0)
      expect(stats.logsByLevel).toBeDefined()
      expect(stats.logsByLevel.info).toBeGreaterThan(0)
      expect(stats.logsByLevel.warn).toBeGreaterThan(0)
      expect(stats.logsByLevel.error).toBeGreaterThan(0)
    })

    it('应该执行健康检查', async () => {
      const logger = await createServerLogger('health-test', {
        level: { default: 'info' },
        healthCheck: {
          enabled: true,
          customChecks: [
            async () => ({
              healthy: true,
              details: { database: 'connected', cache: 'available' }
            })
          ]
        }
      })

      const healthResult = await logger.healthCheck()

      expect(healthResult).toBeDefined()
      expect(healthResult.healthy).toBe(true)
      expect(healthResult.details).toBeDefined()
      expect(healthResult.details.database).toBe('connected')
    })

    it('应该检测不健康状态', async () => {
      const logger = await createServerLogger('unhealthy-test', {
        level: { default: 'info' },
        healthCheck: {
          enabled: true,
          customChecks: [
            async () => ({
              healthy: false,
              details: { error: 'Database connection failed' }
            })
          ]
        }
      })

      const healthResult = await logger.healthCheck()

      expect(healthResult.healthy).toBe(false)
      expect(healthResult.details.error).toBeDefined()
    })
  })

  describe('配置更新和生命周期', () => {
    it('应该支持运行时配置更新', async () => {
      const logger = await createServerLogger('config-update-test', {
        level: { default: 'warn' }
      })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // 初始配置下，info 日志应该被过滤
      logger.info('Info message 1')
      expect(consoleSpy).not.toHaveBeenCalled()

      // 更新配置
      await logger.updateConfig({
        level: { default: 'info' }
      })

      // 更新后，info 日志应该被记录
      logger.info('Info message 2')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('应该正确处理刷新和销毁', async () => {
      const logger = await createServerLogger('lifecycle-test', {
        level: { default: 'info' }
      })

      // 记录一些日志
      logger.info('Message before flush')

      // 刷新应该成功
      await expect(logger.flush()).resolves.not.toThrow()

      // 销毁应该成功
      await expect(logger.destroy()).resolves.not.toThrow()

      // 销毁后的操作应该安全
      expect(() => logger.info('After destroy')).not.toThrow()
    })
  })
})
