/**
 * Jest 测试设置文件
 */

// 扩展 Jest 匹配器
import '@testing-library/jest-dom'

// 全局测试工具
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidLogData(): R
      toHaveLogLevel(level: string): R
    }
  }
}

// 自定义匹配器
expect.extend({
  toBeValidLogData(received) {
    const pass = received && 
                 typeof received.level === 'string' &&
                 typeof received.message === 'string' &&
                 typeof received.timestamp === 'string'
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid log data`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid log data`,
        pass: false
      }
    }
  },
  
  toHaveLogLevel(received, level) {
    const pass = received && received.level === level
    
    if (pass) {
      return {
        message: () => `expected log data not to have level ${level}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected log data to have level ${level}, but got ${received?.level}`,
        pass: false
      }
    }
  }
})

// Mock 浏览器 API
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
})

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://test.example.com',
    origin: 'https://test.example.com',
    pathname: '/test'
  },
  writable: true
})

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)'
  },
  writable: true
})

Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => 123.456),
    timing: {
      navigationStart: 1000,
      loadEventEnd: 2000,
      domContentLoadedEventEnd: 1500
    },
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => [])
  },
  writable: true
})

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  })
) as jest.Mock

// Mock console 方法（避免测试输出污染）
const originalConsole = { ...console }

beforeEach(() => {
  // 重置所有 mock
  jest.clearAllMocks()
  
  // 重置 localStorage mock
  const localStorage = window.localStorage as jest.Mocked<Storage>
  localStorage.getItem.mockReturnValue(null)
  localStorage.setItem.mockImplementation()
  localStorage.removeItem.mockImplementation()
  localStorage.clear.mockImplementation()
  
  // 重置 sessionStorage mock
  const sessionStorage = window.sessionStorage as jest.Mocked<Storage>
  sessionStorage.getItem.mockReturnValue(null)
  sessionStorage.setItem.mockImplementation()
  sessionStorage.removeItem.mockImplementation()
  sessionStorage.clear.mockImplementation()
  
  // 重置 fetch mock
  const fetchMock = global.fetch as jest.Mock
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  })
})

afterEach(() => {
  // 恢复原始 console（如果被 mock 了）
  Object.assign(console, originalConsole)
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// 测试工具函数
export const testUtils = {
  /**
   * 创建模拟的日志数据
   */
  createMockLogData: (overrides = {}) => ({
    level: 'info',
    message: 'Test message',
    timestamp: new Date().toISOString(),
    sessionId: 'test-session-123',
    userAgent: 'Mozilla/5.0 (Test)',
    url: 'https://test.example.com',
    ...overrides
  }),
  
  /**
   * 创建模拟的服务端日志器
   */
  createMockLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logError: jest.fn(),
    child: jest.fn().mockReturnThis(),
    forModule: jest.fn().mockReturnThis(),
    forRequest: jest.fn().mockReturnThis()
  }),
  
  /**
   * 等待异步操作完成
   */
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 创建模拟的 Next.js 请求
   */
  createMockNextRequest: (data = {}) => ({
    json: jest.fn().mockResolvedValue(data),
    headers: new Map([
      ['user-agent', 'Mozilla/5.0 (Test)'],
      ['x-forwarded-for', '192.168.1.1']
    ]),
    method: 'POST',
    url: '/api/logs'
  }),
  
  /**
   * 创建模拟的 Express.js 请求
   */
  createMockExpressRequest: (data = {}) => ({
    body: data,
    headers: {
      'user-agent': 'Mozilla/5.0 (Test)',
      'x-forwarded-for': '10.0.0.1'
    },
    method: 'POST',
    originalUrl: '/api/logs',
    ip: '10.0.0.1'
  }),
  
  /**
   * 创建模拟的 Express.js 响应
   */
  createMockExpressResponse: () => ({
    status: jest.fn().mockReturnValue({
      json: jest.fn()
    }),
    json: jest.fn()
  })
}

// 导出测试工具
export default testUtils
