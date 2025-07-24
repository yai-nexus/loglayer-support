# 框架预设 API 参考

## 📋 概述

本文档提供了 `@yai-nexus/loglayer-support/frameworks` 所有 API 的详细参考。

## 🌐 浏览器端 API

### createBrowserLogger

创建功能强大的浏览器端日志器。

```typescript
function createBrowserLogger(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): Promise<IBrowserLogger>
```

#### 参数

- `config` - 日志器配置对象
- `options` - 创建选项

#### 返回值

返回 `Promise<IBrowserLogger>` - 浏览器端日志器实例

#### 示例

```typescript
const logger = await createBrowserLogger({
  level: 'info',
  outputs: {
    console: { colorized: true },
    localStorage: { maxEntries: 1000 },
    http: { endpoint: '/api/logs' }
  }
})
```

### createBrowserLoggerSync

同步创建浏览器端日志器。

```typescript
function createBrowserLoggerSync(
  config?: BrowserLoggerConfig,
  options?: BrowserLoggerOptions
): IBrowserLogger
```

#### 参数

- `config` - 日志器配置对象
- `options` - 创建选项

#### 返回值

返回 `IBrowserLogger` - 浏览器端日志器实例

#### 示例

```typescript
const logger = createBrowserLoggerSync({
  outputs: { console: true }
})
```

### IBrowserLogger 接口

浏览器端日志器实例接口。

#### 方法

- `debug(message: string, metadata?: LogMetadata): void` - 记录调试日志
- `info(message: string, metadata?: LogMetadata): void` - 记录信息日志
- `warn(message: string, metadata?: LogMetadata): void` - 记录警告日志
- `error(message: string, metadata?: LogMetadata): void` - 记录错误日志
- `logError(error: Error, metadata?: LogMetadata, customMessage?: string): void` - 记录错误对象
- `logPerformance(operation: string, duration: number, metadata?: LogMetadata): void` - 记录性能日志
- `child(context: LogMetadata): IBrowserLogger` - 创建子日志器
- `withContext(context: LogMetadata): IBrowserLogger` - 创建带上下文的日志器
- `getSessionId(): string` - 获取会话 ID
- `setSessionId(sessionId: string): void` - 设置会话 ID
- `addOutput(output: LogOutput): void` - 添加输出器
- `removeOutput(output: LogOutput): void` - 移除输出器
- `flush(): Promise<void>` - 刷新所有输出
- `destroy(): Promise<void>` - 销毁日志器
- `isReady(): boolean` - 检查是否就绪
- `getConfig(): BrowserLoggerConfig` - 获取配置

## 🖥️ 服务端 API

### createServerLogger

创建企业级服务端日志器。

```typescript
function createServerLogger(
  name: string,
  config?: ServerLoggerConfig,
  options?: ServerLoggerOptions
): Promise<ServerLoggerInstance>
```

#### 参数

- `name` - 日志器名称
- `config` - 日志器配置对象
- `options` - 创建选项

#### 返回值

返回 `Promise<ServerLoggerInstance>` - 服务端日志器实例

#### 示例

```typescript
const serverInstance = await createServerLogger('my-app', {
  environment: 'production',
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' }
  }
})
```

### createNextjsServerLogger

创建 Next.js 特定的服务端日志器。

```typescript
function createNextjsServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<ServerLoggerInstance>
```

#### 参数

- `config` - Next.js 特定配置

#### 返回值

返回 `Promise<ServerLoggerInstance>` - 服务端日志器实例

#### 示例

```typescript
const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    auth: { level: 'warn' }
  }
})
```

### createExpressServerLogger

创建 Express.js 特定的服务端日志器。

```typescript
function createExpressServerLogger(
  config?: Partial<ServerLoggerConfig>
): Promise<ServerLoggerInstance>
```

### createServerLoggerManager

创建服务端日志器管理器。

```typescript
function createServerLoggerManager(
  globalConfig?: Partial<ServerLoggerConfig>
): ServerLoggerManager
```

#### 参数

- `globalConfig` - 全局配置

#### 返回值

返回 `ServerLoggerManager` - 日志器管理器实例

#### 示例

```typescript
const manager = createServerLoggerManager({
  environment: 'production'
})

const apiService = await manager.create('api-service', {
  modules: { api: { level: 'info' } }
})
```

### ServerLoggerInstance 接口

服务端日志器实例接口。

#### 属性

- `logger: IEnhancedLogger` - 主日志器实例

#### 方法

- `forModule(moduleName: string): ModuleLogger` - 获取模块日志器
- `isReady(): boolean` - 检查是否就绪
- `waitForReady(): Promise<IEnhancedLogger>` - 等待初始化完成
- `getModuleNames(): string[]` - 获取所有模块名称
- `getConfig(): ServerLoggerConfig` - 获取配置
- `updateConfig(config: Partial<ServerLoggerConfig>): Promise<void>` - 更新配置
- `getStats(): RuntimeStats` - 获取运行时统计
- `healthCheck(): Promise<HealthStatus>` - 执行健康检查
- `flush(): Promise<void>` - 刷新所有输出
- `shutdown(): Promise<void>` - 优雅关闭
- `destroy(): Promise<void>` - 销毁实例

## 📨 日志接收器 API

### createLogReceiver

创建通用日志接收器。

```typescript
function createLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig,
  options?: LogReceiverOptions
): LogReceiverHandler
```

#### 参数

- `logger` - 服务端日志器实例
- `config` - 接收器配置
- `options` - 创建选项

#### 返回值

返回 `LogReceiverHandler` - 日志接收器处理器

#### 示例

```typescript
const receiver = createLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    maxMessageLength: 2000
  },
  processing: {
    supportBatch: true
  }
})
```

### createNextjsLogReceiver

创建 Next.js 特定的日志接收器。

```typescript
function createNextjsLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (request: any) => Promise<any>
```

#### 参数

- `logger` - 服务端日志器实例
- `config` - 接收器配置

#### 返回值

返回 Next.js API Route 处理函数

#### 示例

```typescript
// app/api/logs/route.ts
export const POST = createNextjsLogReceiver(serverLogger, {
  validation: { maxMessageLength: 2000 },
  security: { rateLimiting: { maxRequestsPerMinute: 100 } }
})
```

### createExpressLogReceiver

创建 Express.js 特定的日志接收器。

```typescript
function createExpressLogReceiver(
  logger: IEnhancedLogger,
  config?: LogReceiverConfig
): (req: any, res: any, next?: any) => Promise<void>
```

#### 参数

- `logger` - 服务端日志器实例
- `config` - 接收器配置

#### 返回值

返回 Express.js 中间件函数

#### 示例

```typescript
app.post('/api/logs', createExpressLogReceiver(logger, {
  validation: { allowedLevels: ['info', 'warn', 'error'] }
}))
```

### LogReceiverHandler 接口

日志接收器处理器接口。

#### 方法

- `nextjs(request: any): Promise<any>` - Next.js API Route 处理器
- `express(req: any, res: any, next?: any): Promise<void>` - Express.js 中间件处理器
- `handle(data: ClientLogData | ClientLogData[], context?: any): Promise<ProcessResult>` - 通用处理函数
- `getStatus(): StatusInfo` - 获取状态信息
- `destroy(): Promise<void>` - 销毁处理器

## 🔧 配置接口

### BrowserLoggerConfig

浏览器端日志器配置接口。

```typescript
interface BrowserLoggerConfig {
  level?: BrowserLogLevel
  sessionId?: string
  outputs?: {
    console?: boolean | ConsoleOutputConfig
    localStorage?: boolean | LocalStorageOutputConfig
    http?: boolean | HttpOutputConfig
    indexedDB?: boolean | IndexedDBOutputConfig
  }
  context?: {
    includeUserAgent?: boolean
    includeUrl?: boolean
    includeTimestamp?: boolean
    customFields?: Record<string, () => any>
  }
  performance?: {
    enablePerformanceLogging?: boolean
    performanceLogLevel?: BrowserLogLevel
    autoLogPageLoad?: boolean
    autoLogResourceLoad?: boolean
  }
  errorHandling?: {
    captureGlobalErrors?: boolean
    captureUnhandledRejections?: boolean
    errorFilter?: (error: Error) => boolean
  }
  sampling?: {
    rate?: number
    levelRates?: Partial<Record<BrowserLogLevel, number>>
  }
}
```

### ServerLoggerConfig

服务端日志器配置接口。

```typescript
interface ServerLoggerConfig {
  environment?: ServerEnvironment
  paths?: PathConfig
  outputs?: ServerOutputConfig[]
  modules?: Record<string, ModuleConfig>
  initialization?: InitializationConfig
  performance?: PerformanceConfig
  healthCheck?: HealthCheckConfig
  globalContext?: Record<string, any>
  errorHandling?: {
    captureUncaughtExceptions?: boolean
    captureUnhandledRejections?: boolean
    errorHandler?: (error: Error, context?: any) => void
  }
}
```

### LogReceiverConfig

日志接收器配置接口。

```typescript
interface LogReceiverConfig {
  validation?: ValidationConfig
  processing?: ProcessingConfig
  security?: SecurityConfig
  response?: ResponseConfig
  debug?: boolean
}
```

## 📚 类型定义

### BrowserLogLevel

```typescript
type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error'
```

### ServerEnvironment

```typescript
type ServerEnvironment = 'development' | 'production' | 'test' | 'staging'
```

### ClientLogData

```typescript
interface ClientLogData {
  level: string
  message: string
  metadata?: Record<string, any>
  timestamp?: string
  userAgent?: string
  url?: string
  sessionId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}
```

## 🎯 使用模式

### 1. 基础模式

```typescript
// 创建日志器
const logger = await createBrowserLogger()

// 记录日志
logger.info('用户操作', { action: 'click', element: 'button' })
```

### 2. 配置模式

```typescript
// 高度配置化
const logger = await createBrowserLogger({
  level: 'debug',
  outputs: {
    console: { colorized: true },
    http: { endpoint: '/api/logs', batchSize: 20 }
  },
  sampling: { rate: 0.1 }
})
```

### 3. 企业模式

```typescript
// 企业级服务端日志器
const serverInstance = await createServerLogger('production-app', {
  environment: 'production',
  modules: {
    api: { level: 'info' },
    database: { level: 'warn' }
  },
  performance: { enabled: true },
  healthCheck: { enabled: true }
})

// 模块化使用
const apiLogger = serverInstance.forModule('api')
apiLogger.info('API 请求处理', { endpoint: '/users' })
```

## 🔗 相关链接

- [使用指南](../src/frameworks/USAGE.md)
- [第一阶段总结](./phase-1-summary.md)
- [示例项目](../examples/)
- [贡献指南](../CONTRIBUTING.md)
