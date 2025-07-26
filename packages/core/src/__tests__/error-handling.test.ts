/**
 * 错误处理系统单元测试
 */

import {
  ErrorHandler,
  createErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ERROR_CODES,
  globalErrorHandler
} from '../error-handling'

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = createErrorHandler({
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 100,
      enableFallback: true,
      logErrors: false // 禁用日志以避免测试输出污染
    });
  })

  afterEach(() => {
    errorHandler.resetRetryCount()
  })

  describe('基础功能', () => {
    it('应该能够创建错误处理器', () => {
      expect(errorHandler).toBeDefined()
      expect(typeof errorHandler.handle).toBe('function')
      expect(typeof errorHandler.getStats).toBe('function')
    })

    it('应该能够处理标准 Error 对象', async () => {
      const error = new Error('Test error')
      const result = await errorHandler.handle(error)

      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
      expect(result.message).toBe('Test error')
      expect(result.category).toBeDefined()
      expect(result.severity).toBeDefined()
      expect(result.recovery).toBeDefined()
      expect(result.originalError).toBe(error)
      expect(result.timestamp).toBeDefined()
    })

    it('应该能够处理已标准化的错误', async () => {
      const standardError = {
        code: ERROR_CODES.CONFIG_INVALID,
        message: 'Invalid configuration',
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.HIGH,
        recovery: RecoveryStrategy.FALLBACK,
        timestamp: new Date().toISOString(),
        context: { field: 'test' }
      }

      const result = await errorHandler.handle(standardError, { additional: 'context' })

      expect(result.code).toBe(ERROR_CODES.CONFIG_INVALID)
      expect(result.message).toBe('Invalid configuration')
      expect(result.context).toEqual({
        field: 'test',
        additional: 'context'
      })
    })
  })

  describe('错误推断', () => {
    it('应该正确推断网络超时错误', async () => {
      const error = new Error('Request timeout')
      const result = await errorHandler.handle(error)

      expect(result.code).toBe(ERROR_CODES.NETWORK_TIMEOUT)
      expect(result.category).toBe(ErrorCategory.NETWORK)
      expect(result.severity).toBe(ErrorSeverity.MEDIUM)
      expect(result.recovery).toBe(RecoveryStrategy.RETRY)
    })

    it('应该正确推断连接失败错误', async () => {
      const error = new Error('Connection failed')
      const result = await errorHandler.handle(error)

      expect(result.code).toBe(ERROR_CODES.NETWORK_CONNECTION_FAILED)
      expect(result.category).toBe(ErrorCategory.NETWORK)
      expect(result.recovery).toBe(RecoveryStrategy.RETRY)
    })

    it('应该正确推断验证错误', async () => {
      const error = new Error('Validation failed: invalid format')
      const result = await errorHandler.handle(error)

      expect(result.code).toBe(ERROR_CODES.VALIDATION_INVALID_FORMAT)
      expect(result.category).toBe(ErrorCategory.VALIDATION)
      expect(result.recovery).toBe(RecoveryStrategy.IGNORE)
    })

    it('应该正确推断配置错误', async () => {
      const error = new Error('Configuration is missing')
      const result = await errorHandler.handle(error)

      expect(result.code).toBe(ERROR_CODES.CONFIG_INVALID)
      expect(result.category).toBe(ErrorCategory.CONFIGURATION)
      expect(result.recovery).toBe(RecoveryStrategy.FALLBACK)
    })

    it('应该为未知错误提供默认分类', async () => {
      const error = new Error('Some unknown error')
      const result = await errorHandler.handle(error)

      expect(result.code).toBe('E9999')
      expect(result.category).toBe(ErrorCategory.UNKNOWN)
      expect(result.severity).toBe(ErrorSeverity.MEDIUM)
      expect(result.recovery).toBe(RecoveryStrategy.FALLBACK)
    })
  })

  describe('恢复策略', () => {
    it('应该处理重试策略', async () => {
      const error = new Error('timeout')
      const errorKey = 'test-timeout'

      // 第一次处理
      await errorHandler.handle(error, { key: errorKey })
      let stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(1)

      // 再次处理相同错误
      await errorHandler.handle(error, { key: errorKey })
      stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(1) // 同一个错误键
      expect(stats.totalRetries).toBeGreaterThan(0)
    })

    it('应该在达到最大重试次数后停止重试', async () => {
      const handler = createErrorHandler({
        enableRetry: true,
        maxRetries: 2,
        retryDelay: 10,
        logErrors: false
      })

      const error = new Error('timeout')
      const errorKey = 'max-retry-test'

      // 重试多次
      for (let i = 0; i < 5; i++) {
        await handler.handle(error, { key: errorKey })
      }

      const stats = handler.getStats()
      expect(stats.totalRetries).toBeLessThanOrEqual(2)
    })

    it('应该处理停止策略', async () => {
      const error = {
        code: 'E5001',
        message: 'Critical system error',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        recovery: RecoveryStrategy.STOP,
        timestamp: new Date().toISOString()
      }

      await expect(errorHandler.handle(error)).rejects.toThrow('Critical error')
    })
  })

  describe('自定义处理器', () => {
    it('应该调用自定义错误处理器', async () => {
      const customHandler = jest.fn()
      const handler = createErrorHandler({
        customHandler,
        logErrors: false
      })

      const error = new Error('Test error')
      await handler.handle(error)

      expect(customHandler).toHaveBeenCalledTimes(1)
      expect(customHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          originalError: error
        })
      )
    })

    it('应该处理自定义处理器中的错误', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const customHandler = jest.fn(() => {
        throw new Error('Custom handler failed')
      })

      const handler = createErrorHandler({
        customHandler,
        logErrors: false
      })

      const error = new Error('Test error')
      await expect(handler.handle(error)).resolves.toBeDefined()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Custom error handler failed:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('统计信息', () => {
    it('应该提供准确的统计信息', async () => {
      const error1 = new Error('timeout')
      const error2 = new Error('connection failed')

      await errorHandler.handle(error1, { key: 'error1' })
      await errorHandler.handle(error2, { key: 'error2' })
      await errorHandler.handle(error1, { key: 'error1' }) // 重复错误

      const stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(2) // 两个不同的错误键
      expect(stats.totalRetries).toBeGreaterThan(0)
    })

    it('应该能够重置重试计数', async () => {
      const error = new Error('timeout')
      await errorHandler.handle(error, { key: 'test' })

      let stats = errorHandler.getStats()
      expect(stats.activeRetries).toBeGreaterThan(0)

      errorHandler.resetRetryCount()
      stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(0)
    })

    it('应该能够重置特定错误的重试计数', async () => {
      // 手动设置重试计数（模拟重试场景）
      errorHandler['retryCount'].set('error1', 3)
      errorHandler['retryCount'].set('error2', 1)

      let stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(2)
      expect(stats.totalRetries).toBe(4)

      errorHandler.resetRetryCount('error1')
      stats = errorHandler.getStats()
      expect(stats.activeRetries).toBe(1) // 只剩 error2
      expect(stats.totalRetries).toBe(1)
    })
  })

  describe('全局错误处理器', () => {
    it('应该提供全局错误处理器实例', () => {
      expect(globalErrorHandler).toBeDefined()
      expect(globalErrorHandler).toBeInstanceOf(ErrorHandler)
    })

    it('全局处理器应该能够处理错误', async () => {
      const error = new Error('Global test error')
      const result = await globalErrorHandler.handle(error)

      expect(result).toBeDefined()
      expect(result.message).toBe('Global test error')
    })
  })

  describe('错误码常量', () => {
    it('应该定义所有必需的错误码', () => {
      expect(ERROR_CODES.CONFIG_INVALID).toBe('E1001')
      expect(ERROR_CODES.CONFIG_MISSING).toBe('E1002')
      expect(ERROR_CODES.NETWORK_TIMEOUT).toBe('E2001')
      expect(ERROR_CODES.NETWORK_CONNECTION_FAILED).toBe('E2002')
      expect(ERROR_CODES.VALIDATION_REQUIRED_FIELD).toBe('E3001')
      expect(ERROR_CODES.VALIDATION_INVALID_FORMAT).toBe('E3002')
    })

    it('错误码应该按类别分组', () => {
      // 配置错误 (1000-1999)
      expect(ERROR_CODES.CONFIG_INVALID.startsWith('E1')).toBe(true)
      expect(ERROR_CODES.CONFIG_MISSING.startsWith('E1')).toBe(true)

      // 网络错误 (2000-2999)
      expect(ERROR_CODES.NETWORK_TIMEOUT.startsWith('E2')).toBe(true)
      expect(ERROR_CODES.NETWORK_CONNECTION_FAILED.startsWith('E2')).toBe(true)

      // 验证错误 (3000-3999)
      expect(ERROR_CODES.VALIDATION_REQUIRED_FIELD.startsWith('E3')).toBe(true)
      expect(ERROR_CODES.VALIDATION_INVALID_FORMAT.startsWith('E3')).toBe(true)
    })
  })
})
