# 浏览器端日志器使用指南

LogLayer v0.6.0-beta.1 浏览器端日志器提供了强大而灵活的客户端日志记录解决方案，支持多种输出方式、智能错误处理和性能优化。

## 🚀 快速开始

### 基础使用

```typescript
import { createBrowserLogger } from 'loglayer'

// 创建日志器
const logger = await createBrowserLogger({
  level: 'info',
  outputs: {
    console: true,
    http: {
      enabled: true,
      endpoint: '/api/logs'
    }
  }
})

// 记录日志
logger.info('用户登录成功', { userId: '12345' })
logger.error('网络请求失败', { url: '/api/data', status: 500 })
```

### 同步创建

```typescript
import { createBrowserLoggerSync } from 'loglayer'

// 同步创建（不支持异步初始化功能）
const logger = createBrowserLoggerSync({
  level: 'debug',
  outputs: { console: true }
})

logger.debug('调试信息', { component: 'UserForm' })
```

## 📋 配置选项

### 日志级别

支持四个日志级别，按优先级排序：

```typescript
type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error'
```

### 输出器配置

#### 1. 控制台输出

```typescript
const logger = await createBrowserLogger({
  outputs: {
    console: {
      enabled: true,
      colorized: true,           // 启用彩色显示
      groupCollapsed: false,     // 不使用折叠分组
      showTimestamp: true,       // 显示时间戳
      showMetadataTable: true,   // 显示元数据表格
      colors: {                  // 自定义颜色
        debug: '#888',
        info: '#2196F3',
        warn: '#FF9800',
        error: '#F44336'
      }
    }
  }
})
```

#### 2. HTTP 输出

```typescript
const logger = await createBrowserLogger({
  outputs: {
    http: {
      enabled: true,
      endpoint: '/api/logs',
      method: 'POST',
      batchSize: 10,             // 批量发送大小
      flushInterval: 5000,       // 5秒刷新间隔
      retryAttempts: 3,          // 重试3次
      retryDelay: 'exponential', // 指数退避
      headers: {                 // 自定义请求头
        'Authorization': 'Bearer token'
      },
      transform: (data) => ({    // 数据转换
        ...data,
        source: 'web-app'
      }),
      onSuccess: (data) => {     // 成功回调
        console.log('日志发送成功', data.length)
      },
      onError: (error, data) => { // 失败回调
        console.error('日志发送失败', error)
      }
    }
  }
})
```

#### 3. 本地存储输出

```typescript
const logger = await createBrowserLogger({
  outputs: {
    localStorage: {
      enabled: true,
      key: 'app-logs',           // 存储键名
      maxEntries: 1000,          // 最大存储条数
      compress: true,            // 启用压缩
      levelFilter: ['warn', 'error'] // 只存储警告和错误
    }
  }
})
```

#### 4. IndexedDB 输出

```typescript
const logger = await createBrowserLogger({
  outputs: {
    indexedDB: {
      enabled: true,
      dbName: 'AppLogs',         // 数据库名称
      storeName: 'logs',         // 存储对象名称
      version: 1,                // 数据库版本
      maxEntries: 10000,         // 最大存储条数
      cleanupStrategy: 'fifo',   // 清理策略：先进先出
      ttl: 7 * 24 * 60 * 60 * 1000 // 7天过期
    }
  }
})
```

## 🔧 高级功能

### 错误处理

```typescript
const logger = await createBrowserLogger({
  errorHandling: {
    captureGlobalErrors: true,        // 自动捕获全局错误
    captureUnhandledRejections: true, // 捕获未处理的Promise拒绝
    errorFilter: (error) => {         // 错误过滤
      return !error.message.includes('Script error')
    }
  }
})

// 手动记录错误
try {
  throw new Error('业务逻辑错误')
} catch (error) {
  logger.logError(error, { 
    context: 'user-action',
    userId: '12345' 
  }, '用户操作失败')
}
```

### 性能监控

```typescript
const logger = await createBrowserLogger({
  performance: {
    enablePerformanceLogging: true,   // 启用性能日志
    performanceLogLevel: 'info',      // 性能日志级别
    autoLogPageLoad: true,            // 自动记录页面加载
    autoLogResourceLoad: true         // 自动记录资源加载
  }
})

// 手动记录性能
const startTime = performance.now()
await someAsyncOperation()
const duration = performance.now() - startTime

logger.logPerformance('数据加载', duration, {
  operation: 'fetchUserData',
  recordCount: 100
})
```

### 上下文管理

```typescript
const logger = await createBrowserLogger({
  context: {
    includeUserAgent: true,    // 包含User Agent
    includeUrl: true,          // 包含当前URL
    includeTimestamp: true,    // 包含时间戳
    customFields: {            // 自定义字段
      buildVersion: () => process.env.BUILD_VERSION,
      userId: () => getCurrentUserId()
    }
  }
})

// 创建子日志器
const userLogger = logger.child({ module: 'user-management' })
userLogger.info('用户创建', { username: 'john' })

// 临时上下文
logger.withContext({ requestId: 'req-123' })
  .info('处理请求', { action: 'getData' })
```

### 采样配置

```typescript
const logger = await createBrowserLogger({
  sampling: {
    rate: 0.1,                 // 10% 采样率
    levelRates: {              // 按级别采样
      debug: 0.01,             // debug 1% 采样
      info: 0.1,               // info 10% 采样
      warn: 0.5,               // warn 50% 采样
      error: 1.0               // error 100% 采样
    }
  }
})
```

## 🎯 实际使用示例

### React 应用集成

```typescript
// hooks/useLogger.ts
import { createBrowserLogger, IBrowserLogger } from 'loglayer'
import { useEffect, useState } from 'react'

export function useLogger() {
  const [logger, setLogger] = useState<IBrowserLogger | null>(null)

  useEffect(() => {
    const initLogger = async () => {
      const loggerInstance = await createBrowserLogger({
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        outputs: {
          console: {
            enabled: process.env.NODE_ENV === 'development',
            colorized: true
          },
          http: {
            enabled: true,
            endpoint: '/api/logs',
            batchSize: 20,
            flushInterval: 10000
          }
        },
        errorHandling: {
          captureGlobalErrors: true,
          captureUnhandledRejections: true
        },
        context: {
          includeUrl: true,
          customFields: {
            userId: () => localStorage.getItem('userId'),
            sessionId: () => sessionStorage.getItem('sessionId')
          }
        }
      })

      setLogger(loggerInstance)
    }

    initLogger()
  }, [])

  return logger
}

// components/UserForm.tsx
import { useLogger } from '../hooks/useLogger'

export function UserForm() {
  const logger = useLogger()

  const handleSubmit = async (data: FormData) => {
    logger?.info('表单提交开始', { formType: 'user-registration' })
    
    try {
      const result = await submitForm(data)
      logger?.info('表单提交成功', { 
        userId: result.userId,
        duration: result.processingTime 
      })
    } catch (error) {
      logger?.logError(error, { 
        formData: sanitizeFormData(data) 
      }, '表单提交失败')
    }
  }

  return (
    // 表单组件
  )
}
```

### Vue 应用集成

```typescript
// plugins/logger.ts
import { createBrowserLogger } from 'loglayer'
import type { App } from 'vue'

export default {
  install(app: App) {
    const logger = createBrowserLoggerSync({
      level: 'info',
      outputs: {
        console: { enabled: true },
        http: { 
          enabled: true, 
          endpoint: '/api/logs',
          batchSize: 15
        }
      }
    })

    app.config.globalProperties.$logger = logger
    app.provide('logger', logger)
  }
}

// main.ts
import { createApp } from 'vue'
import loggerPlugin from './plugins/logger'

const app = createApp(App)
app.use(loggerPlugin)

// 组件中使用
export default {
  inject: ['logger'],
  methods: {
    async fetchData() {
      this.logger.info('开始获取数据')
      try {
        const data = await api.getData()
        this.logger.info('数据获取成功', { count: data.length })
      } catch (error) {
        this.logger.logError(error, { context: 'data-fetch' })
      }
    }
  }
}
```

## 🔄 生命周期管理

```typescript
const logger = await createBrowserLogger(config)

// 检查就绪状态
if (logger.isReady()) {
  logger.info('日志器已就绪')
}

// 手动刷新缓冲区
await logger.flush()

// 页面卸载时清理
window.addEventListener('beforeunload', async () => {
  await logger.flush()
  await logger.destroy()
})
```

## 📊 性能优化

v0.6.0-beta.1 包含多项性能优化：

- **智能批处理**: 自动批量发送HTTP请求，减少网络开销
- **快速序列化**: 优化的JSON序列化，支持缓存
- **内存管理**: 自动内存监控和压缩
- **采样控制**: 灵活的采样策略，控制日志量

```typescript
// 启用所有性能优化
const logger = await createBrowserLogger({
  outputs: {
    http: {
      enabled: true,
      endpoint: '/api/logs',
      batchSize: 50,        // 大批次提高效率
      flushInterval: 30000  // 30秒间隔
    }
  },
  sampling: {
    rate: 0.1             // 10% 采样减少负载
  }
})
```

## 🚨 错误处理最佳实践

```typescript
const logger = await createBrowserLogger({
  errorHandling: {
    captureGlobalErrors: true,
    captureUnhandledRejections: true,
    errorFilter: (error) => {
      // 过滤掉第三方脚本错误
      if (error.message === 'Script error.') return false
      // 过滤掉网络错误（由HTTP输出器处理）
      if (error.message.includes('NetworkError')) return false
      return true
    }
  },
  outputs: {
    http: {
      enabled: true,
      endpoint: '/api/logs',
      onError: (error, data) => {
        // HTTP发送失败时的降级处理
        console.warn('日志发送失败，存储到本地', error)
        localStorage.setItem('failed-logs', JSON.stringify(data))
      }
    }
  }
})
```

## 🔧 故障排除

### 常见问题

1. **日志不显示**: 检查日志级别配置
2. **HTTP发送失败**: 检查端点URL和网络连接
3. **性能问题**: 调整批处理大小和采样率
4. **存储空间不足**: 配置合适的maxEntries和清理策略

### 调试模式

```typescript
const logger = await createBrowserLogger({
  level: 'debug',
  outputs: {
    console: {
      enabled: true,
      showMetadataTable: true
    }
  }
}, {
  verbose: true  // 启用详细日志
})
```
