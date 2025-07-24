# createLogReceiver API 设计文档

## 🎯 设计目标

基于对 `route.ts` 的分析，设计一个通用的、支持多框架的日志接收器 API，解决现有代码的框架耦合、缺少验证、安全检查等问题。

## 🏗️ 核心设计原则

1. **框架无关**: 通过适配器模式支持多种框架
2. **配置驱动**: 所有行为都通过配置控制
3. **安全优先**: 内置输入验证、速率限制、内容过滤
4. **批量支持**: 支持单条和批量日志处理
5. **插件化**: 支持自定义处理逻辑
6. **类型安全**: 完善的 TypeScript 类型定义

## 📋 API 概览

### 主要接口

```typescript
// 通用创建函数
function createLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig,
  options?: LogReceiverOptions
): LogReceiverHandler

// 框架特定的便捷函数
function createNextjsLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (request: any) => Promise<any>

function createExpressLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (req: any, res: any, next?: any) => Promise<void>
```

### 核心类型

```typescript
interface LogReceiverHandler {
  nextjs(request: any): Promise<any>
  express(req: any, res: any, next?: any): Promise<void>
  handle(data: ClientLogData | ClientLogData[], context?: any): Promise<ProcessResult>
  getStatus(): StatusInfo
  destroy(): Promise<void>
}
```

## 🔧 配置系统

### 1. 验证配置

```typescript
const config: LogReceiverConfig = {
  validation: {
    requireLevel: true,
    requireMessage: true,
    allowedLevels: ['debug', 'info', 'warn', 'error'],
    maxMessageLength: 1000,
    maxMetadataSize: 10240, // 10KB
    validateTimestamp: true,
    customValidator: (data) => {
      // 自定义验证逻辑
      return { valid: true, errors: [] }
    }
  }
}
```

### 2. 处理配置

```typescript
const config: LogReceiverConfig = {
  processing: {
    preserveClientLevel: true,
    addServerContext: true,
    logSuccessfulReceives: false,
    supportBatch: true,
    maxBatchSize: 100,
    messagePrefix: '[客户端]',
    reconstructErrors: true
  }
}
```

### 3. 安全配置

```typescript
const config: LogReceiverConfig = {
  security: {
    validateOrigin: true,
    allowedOrigins: ['https://myapp.com', 'https://staging.myapp.com'],
    rateLimiting: {
      maxRequestsPerMinute: 60,
      windowMs: 60000,
      byIP: true,
      bySession: false
    },
    contentFilter: {
      filterSensitive: true,
      sensitiveFields: ['password', 'token', 'apiKey'],
      customFilter: (data) => {
        // 自定义过滤逻辑
        return data
      }
    }
  }
}
```

### 4. 响应配置

```typescript
const config: LogReceiverConfig = {
  response: {
    successMessage: '日志已成功接收',
    errorMessage: '日志处理失败',
    includeDetails: true,
    includeStats: true,
    customResponseBuilder: (result, data) => ({
      success: result.success,
      processed: result.processed,
      timestamp: new Date().toISOString()
    })
  }
}
```

## 🚀 使用示例

### Next.js 使用示例

```typescript
// app/api/logs/route.ts
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support/frameworks'
import { serverLogger } from '../../../lib/server-logger'

const logReceiver = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    requireMessage: true,
    maxMessageLength: 2000
  },
  processing: {
    supportBatch: true,
    maxBatchSize: 50,
    addServerContext: true
  },
  security: {
    validateOrigin: true,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(','),
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

### Express.js 使用示例

```typescript
import express from 'express'
import { createExpressLogReceiver } from '@yai-nexus/loglayer-support/frameworks'
import { logger } from './logger'

const app = express()

const logReceiver = createExpressLogReceiver(logger, {
  validation: {
    allowedLevels: ['info', 'warn', 'error'],
    maxMessageLength: 1000
  },
  processing: {
    supportBatch: true,
    logSuccessfulReceives: true
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

### 通用处理器使用示例

```typescript
import { createLogReceiver } from '@yai-nexus/loglayer-support/frameworks'

const receiver = createLogReceiver(logger, {
  validation: { requireLevel: true },
  processing: { supportBatch: true }
})

// 处理单条日志
const singleResult = await receiver.handle({
  level: 'error',
  message: 'API 调用失败',
  metadata: { endpoint: '/api/users' }
})

// 处理批量日志
const batchResult = await receiver.handle([
  { level: 'info', message: '用户登录' },
  { level: 'warn', message: '配置缺失' }
])

// 获取状态
const status = receiver.getStatus()
console.log('Receiver status:', status)
```

## 🔌 插件系统

### 自定义插件示例

```typescript
const auditPlugin: LogReceiverPlugin = {
  name: 'audit-plugin',
  
  async beforeValidation(data) {
    // 记录所有接收到的日志
    console.log('Received log data:', data)
    return data
  },
  
  async afterProcessing(data, result) {
    // 发送到审计系统
    await sendToAuditSystem({
      logs: data,
      result,
      timestamp: new Date().toISOString()
    })
  }
}

const receiver = createLogReceiver(logger, config)
receiver.addPlugin(auditPlugin)
```

### 内置插件

```typescript
// 数据脱敏插件
import { DataMaskingPlugin } from '@yai-nexus/loglayer-support/plugins'

const receiver = createLogReceiver(logger, {
  plugins: [
    new DataMaskingPlugin({
      sensitiveFields: ['email', 'phone', 'ssn'],
      maskingStrategy: 'partial' // 'full', 'partial', 'hash'
    })
  ]
})
```

## 🔄 与现有代码的对比

### 现有代码问题

```typescript
// ❌ 紧耦合 Next.js
import { NextRequest, NextResponse } from 'next/server'

// ❌ 硬编码验证
if (!clientLogData.level || !clientLogData.message) {
  // 只检查存在性，不检查类型和格式
}

// ❌ 硬编码响应
return NextResponse.json({
  success: true,
  message: '日志已成功接收'  // 硬编码消息
})

// ❌ 缺少安全检查
// 没有速率限制、来源验证、内容过滤
```

### 新 API 解决方案

```typescript
// ✅ 框架无关
const receiver = createLogReceiver(logger, {
  validation: {
    requireLevel: true,
    requireMessage: true,
    allowedLevels: ['debug', 'info', 'warn', 'error'],
    maxMessageLength: 1000
  },
  security: {
    validateOrigin: true,
    rateLimiting: { maxRequestsPerMinute: 60 },
    contentFilter: { filterSensitive: true }
  },
  response: {
    successMessage: '日志处理成功',
    includeStats: true
  }
})

// ✅ 支持多框架
export const POST = receiver.nextjs  // Next.js
app.post('/logs', receiver.express)  // Express.js
```

## 🎯 设计优势

1. **框架无关**: 支持 Next.js、Express.js 等多种框架
2. **配置驱动**: 所有行为都可配置，消除硬编码
3. **安全优先**: 内置验证、速率限制、内容过滤
4. **批量支持**: 提高处理效率
5. **插件化**: 支持自定义处理逻辑
6. **类型安全**: 完善的 TypeScript 支持
7. **错误处理**: 细致的错误分类和处理
8. **监控友好**: 内置状态查询和统计信息
9. **性能优化**: 支持批量处理和缓存
10. **易于测试**: 清晰的接口和依赖注入

## 📝 下一步

- **任务 1.7**: 实现 `createLogReceiver` 的具体功能
- **重点实现**: 框架适配器、验证器、安全检查、批量处理
- **测试覆盖**: 为所有配置选项和框架适配器编写测试
