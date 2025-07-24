# createBrowserLogger API 设计文档

## 🎯 设计目标

基于对 `client-logger.ts` 的分析，设计一个更灵活、更强大的浏览器端日志器 API，解决现有代码的硬编码、缺少批量处理、重试机制等问题。

## 🏗️ 核心设计原则

1. **配置驱动**: 所有行为都通过配置控制，消除硬编码
2. **插件化架构**: 支持多种输出器，可扩展
3. **类型安全**: 完善的 TypeScript 类型定义
4. **性能优化**: 支持批量处理、采样、异步操作
5. **错误恢复**: 内置重试机制和错误处理
6. **开发友好**: 提供丰富的调试和监控功能

## 📋 API 概览

### 主要接口

```typescript
// 异步创建 (推荐)
function createBrowserLogger(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): Promise<IBrowserLogger>

// 同步创建 (简单场景)
function createBrowserLoggerSync(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): IBrowserLogger
```

### 核心类型

```typescript
interface IBrowserLogger {
  // 基础日志方法
  debug(message: string, metadata?: LogMetadata): void
  info(message: string, metadata?: LogMetadata): void
  warn(message: string, metadata?: LogMetadata): void
  error(message: string, metadata?: LogMetadata): void
  
  // 专用方法
  logError(error: Error, metadata?: LogMetadata, customMessage?: string): void
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void
  
  // 上下文管理
  child(context: LogMetadata): IBrowserLogger
  withContext(context: LogMetadata): IBrowserLogger
  
  // 控制方法
  flush(): Promise<void>
  destroy(): Promise<void>
}
```

## 🔧 配置系统

### 1. 基础配置

```typescript
const config: BrowserLoggerConfig = {
  level: 'info',                    // 日志级别过滤
  sessionId: 'custom-session-123',  // 自定义会话ID
}
```

### 2. 输出器配置

```typescript
const config: BrowserLoggerConfig = {
  outputs: {
    // 控制台输出
    console: {
      enabled: true,
      groupCollapsed: true,
      colorized: true,
      showTimestamp: true,
      colors: {
        debug: '#888',
        info: '#2196F3',
        warn: '#FF9800',
        error: '#F44336'
      }
    },
    
    // 本地存储
    localStorage: {
      enabled: true,
      key: 'app-logs',
      maxEntries: 500,
      compress: true,
      levelFilter: ['warn', 'error']
    },
    
    // HTTP 上报
    http: {
      enabled: true,
      endpoint: '/api/logs',
      batchSize: 10,
      flushInterval: 5000,
      retryAttempts: 3,
      retryDelay: 'exponential',
      levelFilter: ['error'],
      transform: (data) => ({ ...data, source: 'browser' })
    },
    
    // IndexedDB 存储
    indexedDB: {
      enabled: true,
      dbName: 'AppLogs',
      maxEntries: 10000,
      cleanupStrategy: 'fifo'
    }
  }
}
```

### 3. 高级功能配置

```typescript
const config: BrowserLoggerConfig = {
  // 上下文配置
  context: {
    includeUserAgent: true,
    includeUrl: true,
    customFields: {
      buildVersion: () => process.env.BUILD_VERSION,
      userId: () => getCurrentUserId()
    }
  },
  
  // 性能监控
  performance: {
    enablePerformanceLogging: true,
    autoLogPageLoad: true,
    performanceLogLevel: 'info'
  },
  
  // 错误处理
  errorHandling: {
    captureGlobalErrors: true,
    captureUnhandledRejections: true,
    errorFilter: (error) => !error.message.includes('Script error')
  },
  
  // 采样配置
  sampling: {
    rate: 0.1,  // 10% 采样率
    levelRates: {
      error: 1.0,  // 错误日志 100% 采样
      warn: 0.5,   // 警告日志 50% 采样
      info: 0.1,   // 信息日志 10% 采样
      debug: 0.01  // 调试日志 1% 采样
    }
  }
}
```

## 🚀 使用示例

### 基础用法

```typescript
import { createBrowserLogger } from '@yai-nexus/loglayer-support/frameworks'

// 使用默认配置
const logger = await createBrowserLogger()

logger.info('用户登录', { userId: '123', method: 'oauth' })
logger.error('API 调用失败', { endpoint: '/api/users', status: 500 })
```

### 高级用法

```typescript
// 自定义配置
const logger = await createBrowserLogger({
  level: 'debug',
  outputs: {
    console: true,
    http: {
      enabled: true,
      endpoint: '/api/logs',
      batchSize: 20,
      retryAttempts: 5
    }
  },
  errorHandling: {
    captureGlobalErrors: true
  }
})

// 创建子日志器
const apiLogger = logger.child({ module: 'api' })
apiLogger.info('请求开始', { url: '/api/users' })

// 性能日志
const start = performance.now()
await fetchUsers()
logger.logPerformance('fetchUsers', performance.now() - start)

// 错误日志
try {
  await riskyOperation()
} catch (error) {
  logger.logError(error, { operation: 'riskyOperation' })
}
```

### 同步版本

```typescript
// 适用于简单场景，不需要异步初始化
const logger = createBrowserLoggerSync({
  outputs: {
    console: true,
    localStorage: { maxEntries: 100 }
  }
})

logger.info('应用启动')
```

## 🔄 与现有代码的对比

### 现有代码问题

```typescript
// ❌ 硬编码的发送条件
if (level === 'error' && process.env.NODE_ENV === 'production') {
  this.sendToServer(logData)
}

// ❌ 硬编码的端点和配置
await fetch('/api/client-logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(logData)
})

// ❌ 固定的存储容量
if (logs.length > 100) {
  logs.splice(0, logs.length - 100)
}
```

### 新 API 解决方案

```typescript
// ✅ 配置驱动的行为
const logger = await createBrowserLogger({
  outputs: {
    http: {
      enabled: true,
      endpoint: '/api/logs',
      levelFilter: ['error', 'warn'],
      batchSize: 10,
      retryAttempts: 3
    },
    localStorage: {
      enabled: true,
      maxEntries: 1000,
      levelFilter: ['error']
    }
  }
})
```

## 🎯 设计优势

1. **消除硬编码**: 所有行为都可配置
2. **插件化架构**: 支持自定义输出器
3. **批量处理**: 减少网络请求，提高性能
4. **智能重试**: 指数退避重试机制
5. **大容量存储**: 支持 IndexedDB
6. **类型安全**: 完善的 TypeScript 支持
7. **性能监控**: 内置性能日志功能
8. **错误恢复**: 自动错误捕获和处理
9. **采样支持**: 高流量场景下的智能采样
10. **开发友好**: 丰富的调试功能

## 📝 下一步

- **任务 1.4**: 实现 `createBrowserLogger` 的具体功能
- **重点实现**: 配置解析、输出器管理、批量处理、重试机制
- **测试覆盖**: 为所有配置选项编写单元测试
