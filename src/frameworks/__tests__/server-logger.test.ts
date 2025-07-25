/**
 * createServerLogger 单元测试
 */

import { 
  createServerLogger, 
  createServerLoggerManager,
  createNextjsServerLogger,
  createExpressServerLogger
} from '../server'

// Mock createLogger 函数
jest.mock('../../core', () => ({
  createLogger: jest.fn().mockResolvedValue({
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
    }),
    child: jest.fn(),
    forRequest: jest.fn()
  })
}))

// Mock fs 模块
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true })
}))

// Mock path 模块
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  isAbsolute: jest.fn((path) => path.startsWith('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/'))
}))

describe('createServerLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础功能', () => {
    it('应该能够创建服务端日志器', async () => {
      const serverInstance = await createServerLogger('test-logger')
      
      expect(serverInstance).toBeDefined()
      expect(serverInstance.logger).toBeDefined()
      expect(typeof serverInstance.forModule).toBe('function')
      expect(typeof serverInstance.isReady).toBe('function')
      expect(typeof serverInstance.getStats).toBe('function')
    })

    it('应该能够创建带配置的服务端日志器', async () => {
      const config = {
        level: { default: 'info' },
        environment: 'production' as const,
        paths: {
          logsDir: './custom-logs'
        },
        modules: {
          api: { level: 'info' },
          database: { level: 'debug' }
        }
      }

      const serverInstance = await createServerLogger('configured-logger', config)
      
      expect(serverInstance).toBeDefined()
      expect(serverInstance.getConfig().environment).toBe('production')
      expect(serverInstance.getModuleNames()).toContain('api')
      expect(serverInstance.getModuleNames()).toContain('database')
    })

    it('应该能够检查就绪状态', async () => {
      const serverInstance = await createServerLogger('ready-test')
      
      expect(serverInstance.isReady()).toBe(true)
      
      const logger = await serverInstance.waitForReady()
      expect(logger).toBeDefined()
    })
  })

  describe('模块管理', () => {
    it('应该能够创建模块日志器', async () => {
      const serverInstance = await createServerLogger('module-test', {
        level: { default: 'info' },
        modules: {
          testModule: {
            level: 'debug',
            context: { service: 'test' }
          }
        }
      })

      const moduleLogger = serverInstance.forModule('testModule')
      
      expect(moduleLogger).toBeDefined()
      expect(moduleLogger.moduleName).toBe('testModule')
      expect(typeof moduleLogger.info).toBe('function')
      expect(typeof moduleLogger.getModuleConfig).toBe('function')
    })

    it('应该能够动态创建新模块', async () => {
      const serverInstance = await createServerLogger('dynamic-module-test')

      const dynamicModule = serverInstance.forModule('dynamicModule')
      
      expect(dynamicModule).toBeDefined()
      expect(dynamicModule.moduleName).toBe('dynamicModule')
      expect(serverInstance.getModuleNames()).toContain('dynamicModule')
    })

    it('应该能够更新模块配置', async () => {
      const serverInstance = await createServerLogger('update-test', {
        level: { default: 'info' },
        modules: {
          updateModule: { level: 'info' }
        }
      })

      const moduleLogger = serverInstance.forModule('updateModule')
      const originalConfig = moduleLogger.getModuleConfig()
      
      moduleLogger.updateModuleConfig({ level: 'debug' })
      const updatedConfig = moduleLogger.getModuleConfig()
      
      expect(originalConfig.level).toBe('info')
      expect(updatedConfig.level).toBe('debug')
    })
  })

  describe('统计信息', () => {
    it('应该提供运行时统计', async () => {
      const serverInstance = await createServerLogger('stats-test')
      
      const stats = serverInstance.getStats()
      
      expect(stats).toEqual({
        uptime: expect.any(Number),
        totalLogs: expect.any(Number),
        moduleStats: expect.any(Object)
      })
      expect(stats.uptime).toBeGreaterThanOrEqual(0)
    })

    it('应该包含性能信息（如果启用）', async () => {
      const serverInstance = await createServerLogger('perf-test', {
        performance: {
          enabled: true
        }
      })
      
      const stats = serverInstance.getStats()
      
      expect(stats.performance).toBeDefined()
      expect(stats.performance!.memoryUsage).toBeDefined()
      expect(stats.performance!.cpuUsage).toBeDefined()
    })
  })

  describe('健康检查', () => {
    it('应该执行基础健康检查', async () => {
      const serverInstance = await createServerLogger('health-test')
      
      const health = await serverInstance.healthCheck()
      
      expect(health).toEqual({
        healthy: expect.any(Boolean),
        details: expect.objectContaining({
          logger: expect.any(Boolean),
          outputs: expect.any(Object),
          modules: expect.any(Object)
        })
      })
    })

    it('应该执行自定义健康检查', async () => {
      const customCheck = jest.fn().mockResolvedValue({
        healthy: true,
        details: { custom: 'test' }
      })

      const serverInstance = await createServerLogger('custom-health-test', {
        healthCheck: {
          enabled: true,
          customCheck
        }
      })
      
      const health = await serverInstance.healthCheck()
      
      expect(customCheck).toHaveBeenCalled()
      expect(health.details).toEqual(
        expect.objectContaining({
          custom: expect.objectContaining({
            healthy: true,
            details: { custom: 'test' }
          })
        })
      )
    })
  })

  describe('配置更新', () => {
    it('应该能够更新配置', async () => {
      const serverInstance = await createServerLogger('config-update-test')
      
      const originalConfig = serverInstance.getConfig()
      
      await serverInstance.updateConfig({
        modules: {
          newModule: { level: 'warn' }
        }
      })
      
      const updatedConfig = serverInstance.getConfig()
      
      expect(originalConfig.modules).not.toEqual(updatedConfig.modules)
      expect(updatedConfig.modules!.newModule).toEqual({ level: 'warn' })
    })
  })

  describe('生命周期管理', () => {
    it('应该能够刷新输出', async () => {
      const serverInstance = await createServerLogger('flush-test')
      
      await expect(serverInstance.flush()).resolves.not.toThrow()
    })

    it('应该能够优雅关闭', async () => {
      const serverInstance = await createServerLogger('shutdown-test')
      
      await expect(serverInstance.shutdown()).resolves.not.toThrow()
    })

    it('应该能够销毁实例', async () => {
      const serverInstance = await createServerLogger('destroy-test')
      
      await expect(serverInstance.destroy()).resolves.not.toThrow()
    })
  })

  describe('Next.js 预设', () => {
    it('应该创建 Next.js 特定配置', async () => {
      const serverInstance = await createNextjsServerLogger()
      
      expect(serverInstance).toBeDefined()
      
      const config = serverInstance.getConfig()
      expect(config.modules).toEqual(
        expect.objectContaining({
          api: expect.any(Object),
          database: expect.any(Object),
          auth: expect.any(Object)
        })
      )
    })

    it('应该支持自定义 Next.js 配置', async () => {
      const customConfig = {
        modules: {
          customModule: { level: 'error' }
        }
      }

      const serverInstance = await createNextjsServerLogger(customConfig)
      
      const config = serverInstance.getConfig()
      expect(config.modules!.customModule).toEqual({ level: 'error' })
    })
  })

  describe('Express.js 预设', () => {
    it('应该创建 Express.js 特定配置', async () => {
      const serverInstance = await createExpressServerLogger()
      
      expect(serverInstance).toBeDefined()
      
      const config = serverInstance.getConfig()
      expect(config.modules).toEqual(
        expect.objectContaining({
          router: expect.any(Object),
          middleware: expect.any(Object),
          database: expect.any(Object)
        })
      )
    })
  })

  describe('管理器模式', () => {
    it('应该创建日志器管理器', () => {
      const manager = createServerLoggerManager()
      
      expect(manager).toBeDefined()
      expect(typeof manager.create).toBe('function')
      expect(typeof manager.get).toBe('function')
      expect(typeof manager.destroyAll).toBe('function')
    })

    it('应该能够创建和管理多个实例', async () => {
      const manager = createServerLoggerManager()
      
      const instance1 = await manager.create('logger1')
      const instance2 = await manager.create('logger2')
      
      expect(manager.get('logger1')).toBe(instance1)
      expect(manager.get('logger2')).toBe(instance2)
      
      const allInstances = manager.getAll()
      expect(allInstances.size).toBe(2)
      expect(allInstances.has('logger1')).toBe(true)
      expect(allInstances.has('logger2')).toBe(true)
    })

    it('应该能够销毁特定实例', async () => {
      const manager = createServerLoggerManager()
      
      await manager.create('temp-logger')
      expect(manager.get('temp-logger')).toBeDefined()
      
      await manager.destroy('temp-logger')
      expect(manager.get('temp-logger')).toBeUndefined()
    })

    it('应该能够批量健康检查', async () => {
      const manager = createServerLoggerManager()
      
      await manager.create('health1')
      await manager.create('health2')
      
      const healthResults = await manager.healthCheckAll()
      
      expect(healthResults).toEqual({
        health1: expect.objectContaining({
          healthy: expect.any(Boolean)
        }),
        health2: expect.objectContaining({
          healthy: expect.any(Boolean)
        })
      })
    })

    it('应该能够销毁所有实例', async () => {
      const manager = createServerLoggerManager()
      
      await manager.create('destroy1')
      await manager.create('destroy2')
      
      expect(manager.getAll().size).toBe(2)
      
      await manager.destroyAll()
      
      expect(manager.getAll().size).toBe(0)
    })
  })

  describe('错误处理', () => {
    it('应该处理重复实例名称', async () => {
      const manager = createServerLoggerManager()
      
      await manager.create('duplicate')
      
      await expect(manager.create('duplicate')).rejects.toThrow(
        'Logger instance with name "duplicate" already exists'
      )
    })
  })
})
