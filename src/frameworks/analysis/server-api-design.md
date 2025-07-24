# createServerLogger API 设计文档

## 🎯 设计目标

基于对 `server-logger.ts` 的分析，设计一个更优雅的服务端日志器 API，彻底解决 Proxy 方案的问题，提供类型安全、调试友好的异步初始化方案。

## 🏗️ 核心设计原则

1. **消除 Proxy**：使用工厂函数 + 缓存模式替代 Proxy
2. **类型安全**：完整的 TypeScript 类型定义，无 `any` 类型
3. **调试友好**：清晰的堆栈跟踪，优秀的 IDE 支持
4. **异步优先**：优雅处理异步初始化，提供同步访问方式
5. **模块化管理**：支持模块特定的日志配置
6. **企业级特性**：性能监控、健康检查、优雅关闭

## 📋 API 概览

### 主要接口

```typescript
// 基础创建函数
function createServerLogger(
  name: string,
  config?: ServerLoggerConfig,
  options?: ServerLoggerOptions
): Promise<ServerLoggerInstance>

// 框架特定的便捷函数
function createNextjsServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<ServerLoggerInstance>

function createExpressServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<ServerLoggerInstance>

// 管理器模式
function createServerLoggerManager(
  globalConfig?: Partial<ServerLoggerConfig>
): ServerLoggerManager
```

### 核心类型

```typescript
interface ServerLoggerInstance {
  readonly logger: IEnhancedLogger
  forModule(moduleName: string): ModuleLogger
  isReady(): boolean
  waitForReady(): Promise<IEnhancedLogger>
  getStats(): RuntimeStats
  healthCheck(): Promise<HealthStatus>
  shutdown(): Promise<void>
}
```

## 🔧 配置系统

### 1. 基础配置

```typescript
const config: ServerLoggerConfig = {
  environment: 'production',
  paths: {
    projectRoot: '/app',
    logsDir: './logs',
    autoDetectRoot: true
  },
  outputs: [
    { type: 'stdout' },
    {
      type: 'file',
      config: {
        dir: './logs',
        filename: 'app.log',
        rotation: {
          maxSize: '10m',
          maxFiles: 5,
          datePattern: 'YYYY-MM-DD'
        }
      }
    }
  ]
}
```

### 2. 模块化配置

```typescript
const config: ServerLoggerConfig = {
  modules: {
    api: {
      level: 'info',
      context: { service: 'api-gateway' },
      outputs: [
        {
          type: 'file',
          config: { filename: 'api.log' }
        }
      ]
    },
    database: {
      level: 'debug',
      context: { component: 'db-layer' },
      inherit: true // 继承父级配置
    },
    auth: {
      level: 'warn',
      context: { security: true }
    }
  }
}
```

### 3. 高级功能配置

```typescript
const config: ServerLoggerConfig = {
  // 性能监控
  performance: {
    enabled: true,
    interval: 60000,
    memoryThreshold: 512, // MB
    cpuThreshold: 80,     // %
    trackGC: true
  },
  
  // 健康检查
  healthCheck: {
    enabled: true,
    interval: 30000,
    endpoint: '/health/logger',
    customCheck: async () => ({
      healthy: await checkDiskSpace(),
      details: { diskUsage: await getDiskUsage() }
    })
  },
  
  // 错误处理
  errorHandling: {
    captureUncaughtExceptions: true,
    captureUnhandledRejections: true,
    errorHandler: (error, context) => {
      // 自定义错误处理逻辑
      console.error('Logger error:', error, context)
    }
  },
  
  // 初始化配置
  initialization: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    fallbackToConsole: true,
    logStartupInfo: true
  }
}
```

## 🚀 使用示例

### 基础用法

```typescript
import { createServerLogger } from '@yai-nexus/loglayer-support/frameworks'

// 创建服务端日志器
const serverInstance = await createServerLogger('my-app', {
  environment: 'production',
  outputs: [
    { type: 'stdout' },
    { type: 'file', config: { filename: 'app.log' } }
  ],
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' }
  }
})

// 使用主日志器
serverInstance.logger.info('应用启动', { version: '1.0.0' })

// 使用模块日志器
const apiLogger = serverInstance.forModule('api')
apiLogger.info('API 请求处理', { endpoint: '/users', method: 'GET' })

const dbLogger = serverInstance.forModule('database')
dbLogger.debug('数据库查询', { sql: 'SELECT * FROM users', duration: 45 })
```

### Next.js 使用示例

```typescript
// lib/server-logger.ts
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support/frameworks'

export const serverLoggerInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' },
    auth: { level: 'warn' }
  },
  performance: { enabled: true },
  healthCheck: { enabled: true }
})

// 导出便捷访问器
export const serverLogger = serverLoggerInstance.logger
export const apiLogger = serverLoggerInstance.forModule('api')
export const dbLogger = serverLoggerInstance.forModule('database')
export const authLogger = serverLoggerInstance.forModule('auth')

// API 路由中使用
// app/api/users/route.ts
import { apiLogger } from '../../../lib/server-logger'

export async function GET() {
  apiLogger.info('获取用户列表请求')
  // ... 处理逻辑
}
```

### Express.js 使用示例

```typescript
import express from 'express'
import { createExpressServerLogger } from '@yai-nexus/loglayer-support/frameworks'

const app = express()

// 创建日志器
const serverInstance = await createExpressServerLogger({
  modules: {
    router: { level: 'info' },
    middleware: { level: 'debug' }
  }
})

const routerLogger = serverInstance.forModule('router')
const middlewareLogger = serverInstance.forModule('middleware')

// 中间件中使用
app.use((req, res, next) => {
  middlewareLogger.debug('请求处理', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  })
  next()
})

// 路由中使用
app.get('/users', (req, res) => {
  routerLogger.info('获取用户列表')
  res.json({ users: [] })
})

// 优雅关闭
process.on('SIGTERM', async () => {
  await serverInstance.shutdown()
  process.exit(0)
})
```

### 管理器模式示例

```typescript
import { createServerLoggerManager } from '@yai-nexus/loglayer-support/frameworks'

// 创建管理器
const loggerManager = createServerLoggerManager({
  environment: 'production',
  outputs: [{ type: 'stdout' }]
})

// 创建多个日志器实例
const apiInstance = await loggerManager.create('api-service', {
  modules: { api: { level: 'info' } }
})

const dbInstance = await loggerManager.create('db-service', {
  modules: { database: { level: 'debug' } }
})

// 获取现有实例
const existingInstance = loggerManager.get('api-service')

// 批量操作
const allInstances = loggerManager.getAll()
console.log('活跃的日志器实例:', allInstances.size)

// 优雅关闭所有实例
await loggerManager.destroyAll()
```

## 🔄 与现有代码的对比

### 现有代码问题

```typescript
// ❌ Proxy 导致的问题
export const serverLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger(); // 可能抛出异常
    return (logger as any)[prop];     // 类型不安全
  }
});

// ❌ 错误处理不当
export const getServerLogger = () => {
  if (!serverLoggerInstance) {
    throw new Error('Server logger not initialized yet');
  }
  return serverLoggerInstance;
};

// ❌ 重复创建模块日志器
export const apiLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger().forModule('api'); // 每次都创建
    return (logger as any)[prop];
  }
});
```

### 新 API 解决方案

```typescript
// ✅ 类型安全的工厂函数
const serverInstance = await createServerLogger('my-app', config)

// ✅ 缓存的模块日志器
const apiLogger = serverInstance.forModule('api') // 缓存复用

// ✅ 优雅的异步处理
if (serverInstance.isReady()) {
  serverInstance.logger.info('立即记录')
} else {
  const logger = await serverInstance.waitForReady()
  logger.info('等待初始化完成后记录')
}

// ✅ 完整的生命周期管理
await serverInstance.shutdown() // 优雅关闭
```

## 🎯 设计优势

1. **消除 Proxy**：无性能开销，调试友好
2. **类型安全**：完整的 TypeScript 支持，无 `any` 类型
3. **异步优先**：优雅处理异步初始化
4. **模块化**：支持模块特定配置和缓存
5. **企业级**：性能监控、健康检查、优雅关闭
6. **框架适配**：Next.js、Express.js 特定优化
7. **管理器模式**：支持多实例管理
8. **配置丰富**：路径解析、文件轮转、错误处理
9. **监控友好**：运行时统计、健康检查
10. **生产就绪**：完整的生命周期管理

## 📝 下一步

- **任务 1.10**: 实现 `createServerLogger` 的具体功能
- **重点实现**: 工厂函数、模块缓存、异步初始化、生命周期管理
- **测试覆盖**: 为所有配置选项和生命周期方法编写测试
