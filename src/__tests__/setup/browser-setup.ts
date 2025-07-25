/**
 * 浏览器测试环境设置
 */

// 扩展 jsdom 环境以支持更多浏览器 API
import 'jest-environment-jsdom'

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
      totalJSHeapSize: 1024 * 1024 * 20, // 20MB
      jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
    }
  },
  writable: true
})

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn()
}

// Mock console methods to avoid test output pollution
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Restore console after each test
afterEach(() => {
  jest.clearAllMocks()
})

// Mock setImmediate for Node.js compatibility
if (!global.setImmediate) {
  global.setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(callback, 0, ...args)
  }
}

// Clean up timers and async operations
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers()
})

// Mock localStorage if not available in jsdom
if (!global.localStorage) {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    },
    writable: true
  })
}

// Mock sessionStorage
if (!global.sessionStorage) {
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    },
    writable: true
  })
}

// Mock IndexedDB
if (!global.indexedDB) {
  Object.defineProperty(global, 'indexedDB', {
    value: {
      open: jest.fn(),
      deleteDatabase: jest.fn(),
      databases: jest.fn()
    },
    writable: true
  })
}

// Mock URL constructor
if (!global.URL) {
  global.URL = class URL {
    constructor(public href: string, base?: string) {
      if (base) {
        this.href = new URL(href, base).href
      }
    }
    
    toString() {
      return this.href
    }
  } as any
}

// Mock crypto for UUID generation
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
      getRandomValues: jest.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      })
    },
    writable: true
  })
}

// Mock navigator
if (!global.navigator) {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Test Environment)',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'Test',
      cookieEnabled: true,
      onLine: true
    },
    writable: true
  })
}

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true
})

// Mock document.hidden
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true
})

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn(cb => setTimeout(cb, 1))
global.cancelIdleCallback = jest.fn(id => clearTimeout(id))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}))

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}))

// Mock EventSource
global.EventSource = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2
}))

// Set up fake timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})
