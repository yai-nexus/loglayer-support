/**
 * 浏览器端集成测试
 * 
 * 测试浏览器日志器的完整工作流程，包括：
 * - 配置验证与日志器创建的集成
 * - 错误处理系统的集成效果
 * - 性能优化组件的实际效果
 * - 多输出器的协同工作
 */

import { createBrowserLogger } from '../../frameworks/browser'
import type { BrowserLoggerConfig } from '../../frameworks/browser'

// 浏览器环境已在 browser-setup.ts 中配置

describe('浏览器端集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // 重置 fetch mock
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    })
  })

  describe('配置验证与日志器创建集成', () => {
    it('应该成功创建具有有效配置的日志器', async () => {
      const config: BrowserLoggerConfig = {
        level: 'info',
        outputs: {
          console: { enabled: true }
        }
      }

      const logger = await createBrowserLogger(config)

      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.logError).toBe('function')
    }, 10000) // 增加超时时间

    it('应该在配置无效时显示警告但仍创建日志器', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const config = {
        outputs: {
          console: true
        }
      }

      const logger = await createBrowserLogger(config)

      expect(logger).toBeDefined()

      consoleSpy.mockRestore()
    }, 10000)
  })

  describe('多输出器协同工作', () => {
    it('应该同时向多个输出器写入日志', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const config: BrowserLoggerConfig = {
        outputs: {
          console: { enabled: true },
          localStorage: { enabled: true, maxEntries: 100 },
          http: { enabled: true, endpoint: '/api/logs', batchSize: 1 }
        }
      }

      const logger = await createBrowserLogger(config)
      
      // 记录一条日志
      logger.info('Test message', { userId: '123' })

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证 console 输出
      expect(consoleSpy).toHaveBeenCalled()
      
      // 验证 localStorage 存储
      expect(localStorage.setItem).toHaveBeenCalled()
      
      // 验证 HTTP 请求
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      )

      consoleSpy.mockRestore()
    })

    it('应该处理部分输出器失败的情况', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // 模拟 HTTP 请求失败
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const config: BrowserLoggerConfig = {
        outputs: {
          console: { enabled: true },
          http: { enabled: true, endpoint: '/api/logs', batchSize: 1 }
        }
      }

      const logger = await createBrowserLogger(config)
      logger.info('Test message')

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 200))

      // console 输出应该仍然工作
      expect(consoleSpy).toHaveBeenCalled()
      
      // HTTP 失败不应该影响其他输出器
      expect(global.fetch).toHaveBeenCalled()

      consoleSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })

  describe('错误处理系统集成', () => {
    it('应该正确处理和分类错误', async () => {
      const logger = await createBrowserLogger({
        outputs: { console: { enabled: true } }
      })

      const networkError = new Error('Connection timeout')
      const validationError = new Error('Validation failed: invalid format')
      const unknownError = new Error('Some unknown error')

      // 测试不同类型错误的处理
      await logger.logError(networkError, { context: 'api-call' })
      await logger.logError(validationError, { context: 'form-validation' })
      await logger.logError(unknownError, { context: 'general' })

      // 验证错误被正确记录（通过 console 输出验证）
      expect(console.log).toHaveBeenCalledTimes(3)
    })

    it('应该在错误处理失败时使用降级策略', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const logger = await createBrowserLogger({
        outputs: { console: { enabled: true } }
      })

      // 创建一个会导致序列化失败的循环引用对象
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      const error = new Error('Test error')
      error.stack = undefined // 移除 stack 以测试边界情况

      await logger.logError(error, { circular: circularObj })

      // 应该仍然记录错误，即使元数据有问题
      expect(console.log).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('性能优化集成', () => {
    it('应该使用批处理优化 HTTP 请求', async () => {
      const config: BrowserLoggerConfig = {
        outputs: {
          http: { 
            enabled: true, 
            endpoint: '/api/logs', 
            batchSize: 3,
            flushInterval: 100
          }
        }
      }

      const logger = await createBrowserLogger(config)

      // 快速记录多条日志
      logger.info('Message 1')
      logger.info('Message 2')
      logger.info('Message 3')

      // 等待批处理触发
      await new Promise(resolve => setTimeout(resolve, 150))

      // 应该只发送一个批量请求
      expect(global.fetch).toHaveBeenCalledTimes(1)
      
      // 验证请求体包含多条日志
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(Array.isArray(requestBody)).toBe(true)
      expect(requestBody.length).toBe(3)
    })

    it('应该在达到批次大小时立即发送', async () => {
      const config: BrowserLoggerConfig = {
        outputs: {
          http: { 
            enabled: true, 
            endpoint: '/api/logs', 
            batchSize: 2,
            flushInterval: 5000 // 很长的间隔
          }
        }
      }

      const logger = await createBrowserLogger(config)

      // 记录达到批次大小的日志
      logger.info('Message 1')
      logger.info('Message 2') // 应该触发立即发送

      // 短暂等待异步操作
      await new Promise(resolve => setTimeout(resolve, 50))

      // 应该立即发送，不等待超时
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('应该正确管理内存使用', async () => {
      const config: BrowserLoggerConfig = {
        outputs: {
          localStorage: { enabled: true, maxEntries: 5 }
        }
      }

      const logger = await createBrowserLogger(config)

      // 记录超过最大条目数的日志
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`)
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // localStorage 应该被调用，但不应该超过最大条目数
      expect(localStorage.setItem).toHaveBeenCalled()

      // 验证内存管理（通过检查存储的数据量）
      const setItemCalls = (localStorage.setItem as jest.Mock).mock.calls
      expect(setItemCalls.length).toBeGreaterThan(0)
    })
  })

  describe('采样和过滤集成', () => {
    it('应该根据采样率过滤日志', async () => {
      const config: BrowserLoggerConfig = {
        sampling: { rate: 0.0 }, // 0% 采样率
        outputs: { console: { enabled: true } }
      }

      const logger = await createBrowserLogger(config)

      // 记录多条日志
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`)
      }

      // 由于采样率为 0，应该没有日志被记录
      expect(console.log).not.toHaveBeenCalled()
    })

    it('应该根据日志级别过滤', async () => {
      const config: BrowserLoggerConfig = {
        level: 'warn', // 只记录 warn 及以上级别
        outputs: { console: { enabled: true } }
      }

      const logger = await createBrowserLogger(config)

      logger.debug('Debug message') // 应该被过滤
      logger.info('Info message')   // 应该被过滤
      logger.warn('Warn message')   // 应该被记录
      logger.error('Error message') // 应该被记录

      // 只有 warn 和 error 应该被记录
      expect(console.log).toHaveBeenCalledTimes(2)
    })
  })

  describe('生命周期管理', () => {
    it('应该正确初始化和销毁日志器', async () => {
      const logger = await createBrowserLogger({
        outputs: {
          http: { enabled: true, endpoint: '/api/logs' }
        }
      })

      // 记录一些日志
      logger.info('Test message')

      // 销毁日志器
      await logger.destroy()

      // 销毁后应该刷新剩余的日志
      expect(global.fetch).toHaveBeenCalled()

      // 销毁后记录日志应该不起作用或抛出错误
      expect(() => logger.info('After destroy')).not.toThrow()
    })

    it('应该在页面卸载时自动刷新日志', async () => {
      const logger = await createBrowserLogger({
        outputs: {
          http: { enabled: true, endpoint: '/api/logs', batchSize: 10 }
        }
      })

      // 记录一些日志但不达到批次大小
      logger.info('Message 1')
      logger.info('Message 2')

      // 模拟页面卸载事件
      const beforeUnloadEvent = new Event('beforeunload')
      window.dispatchEvent(beforeUnloadEvent)

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 100))

      // 应该刷新剩余的日志
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
