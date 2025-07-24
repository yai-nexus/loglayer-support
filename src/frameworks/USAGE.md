# 框架预设使用指南

## 📋 概述

`@yai-nexus/loglayer-support/frameworks` 提供了针对不同框架和环境的开箱即用日志解决方案，包括：

- **浏览器端日志器** (`createBrowserLogger`) - 功能强大的客户端日志记录
- **服务端日志器** (`createServerLogger`) - 企业级服务端日志管理
- **日志接收器** (`createLogReceiver`) - 通用的日志接收和处理

## 🚀 快速开始

### 安装

```bash
npm install @yai-nexus/loglayer-support
```

### 基础导入

```typescript
// 导入所有框架预设
import { frameworks } from '@yai-nexus/loglayer-support'

// 或者按需导入
import { 
  createBrowserLogger,
  createServerLogger,
  createLogReceiver 
} from '@yai-nexus/loglayer-support'

// 或者使用便捷导出
import { browser, server, receiver } from '@yai-nexus/loglayer-support'
```

## 🌐 浏览器端日志器

### 基础用法

```typescript
import { createBrowserLogger } from '@yai-nexus/loglayer-support'

// 创建日志器
const logger = await createBrowserLogger({
  outputs: {
    console: { colorized: true },
    localStorage: { maxEntries: 1000 },
    http: { 
      endpoint: '/api/logs',
      batchSize: 10,
      retryAttempts: 3
    }
  }
})

// 使用日志器
logger.info('用户登录', { userId: '123', method: 'oauth' })
logger.error('API 调用失败', { endpoint: '/api/users', status: 500 })
```

### 高级功能

```typescript
// 错误捕获和性能监控
const logger = await createBrowserLogger({
  errorHandling: {
    captureGlobalErrors: true,
    captureUnhandledRejections: true
  },
  performance: {
    enablePerformanceLogging: true,
    autoLogPageLoad: true
  },
  sampling: {
    rate: 0.1, // 10% 采样
    levelRates: { error: 1.0, warn: 0.5 }
  }
})

// 子日志器
const apiLogger = logger.child({ module: 'api' })
apiLogger.info('API 请求', { endpoint: '/users' })

// 性能日志
const start = performance.now()
await fetchData()
logger.logPerformance('fetchData', performance.now() - start)
```

## 🖥️ 服务端日志器

### Next.js 使用

```typescript
// lib/server-logger.ts
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'

export const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' },
    auth: { level: 'warn' }
  },
  performance: { enabled: true },
  healthCheck: { enabled: true }
})

export const serverLogger = serverInstance.logger
export const apiLogger = serverInstance.forModule('api')
export const dbLogger = serverInstance.forModule('database')

// API 路由中使用
// app/api/users/route.ts
import { apiLogger } from '../../../lib/server-logger'

export async function GET() {
  apiLogger.info('获取用户列表请求')
  // ... 处理逻辑
}
```

### Express.js 使用

```typescript
import express from 'express'
import { createExpressServerLogger } from '@yai-nexus/loglayer-support'

const app = express()

// 创建日志器
const serverInstance = await createExpressServerLogger({
  modules: {
    router: { level: 'info' },
    middleware: { level: 'debug' }
  }
})

const routerLogger = serverInstance.forModule('router')

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

## 📨 日志接收器

### Next.js API Route

```typescript
// app/api/logs/route.ts
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support'
import { serverLogger } from '../../../lib/server-logger'

const logReceiver = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    requireMessage: true,
    maxMessageLength: 2000
  },
  processing: {
    supportBatch: true,
    maxBatchSize: 50
  },
  security: {
    rateLimiting: {
      maxRequestsPerMinute: 100,
      byIP: true
    }
  }
})

export async function POST(request: NextRequest) {
  return logReceiver(request)
}

export async function GET() {
  const status = logReceiver.getStatus()
  return NextResponse.json(status)
}
```

### Express.js 中间件

```typescript
import express from 'express'
import { createExpressLogReceiver } from '@yai-nexus/loglayer-support'

const app = express()

const logReceiver = createExpressLogReceiver(logger, {
  validation: {
    allowedLevels: ['info', 'warn', 'error']
  },
  processing: {
    supportBatch: true
  }
})

// 日志接收端点
app.post('/api/logs', logReceiver)

// 状态查询端点
app.get('/api/logs/status', (req, res) => {
  const status = logReceiver.getStatus()
  res.json(status)
})
```

## 🎯 最佳实践

### 1. 环境配置

```typescript
// 根据环境调整配置
const isDev = process.env.NODE_ENV === 'development'

const logger = await createBrowserLogger({
  level: isDev ? 'debug' : 'info',
  outputs: {
    console: isDev,
    http: {
      enabled: !isDev,
      endpoint: process.env.LOG_ENDPOINT
    }
  },
  sampling: {
    rate: isDev ? 1.0 : 0.1
  }
})
```

### 2. 错误处理

```typescript
// 统一错误处理
const logger = await createServerLogger('app', {
  errorHandling: {
    captureUncaughtExceptions: true,
    errorHandler: (error, context) => {
      // 发送到错误监控服务
      sendToErrorService(error, context)
    }
  }
})
```

### 3. 性能监控

```typescript
// 性能监控配置
const serverInstance = await createServerLogger('app', {
  performance: {
    enabled: true,
    memoryThreshold: 512, // MB
    cpuThreshold: 80      // %
  }
})

// 定期检查
setInterval(async () => {
  const health = await serverInstance.healthCheck()
  if (!health.healthy) {
    console.warn('服务健康检查失败:', health.details)
  }
}, 30000)
```

## 📚 更多资源

- [API 文档](./api-docs.md)
- [配置参考](./config-reference.md)
- [故障排除](./troubleshooting.md)
- [示例项目](../examples/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请查看 [贡献指南](../../CONTRIBUTING.md)。
