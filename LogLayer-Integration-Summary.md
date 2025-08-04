# LogLayer 集成总结

## 🎯 核心理念

按照您的建议，我们直接使用 `loglayer` 的日志能力进行扩展，而不是重复造轮子。这样做的好处是：

1. **复用成熟的日志基础设施** - LogLayer 已经提供了完整的日志传输和格式化能力
2. **保持架构简洁** - 我们只需要在 LogLayer 基础上添加 Next.js 特定的功能
3. **更好的维护性** - 底层日志能力由 LogLayer 团队维护，我们专注于 Next.js 集成

## 🏗️ 基于 LogLayer 的新架构

### 客户端实现

```typescript
// src/client/logger.ts
import { LogLayer, ConsoleTransport } from 'loglayer';

export function createClientLogger(config?: NextjsLogConfig): ClientLoggerInstance {
  // 创建基础 LogLayer 实例
  const logLayer = new LogLayer({
    transport: new ConsoleTransport({
      logger: console,
    }),
  });
  
  // 添加 Next.js 特定的上下文
  const contextLogger = logLayer.withContext({
    service: config.appName,
    environment: config.environment,
    framework: 'nextjs',
    platform: 'browser',
    userAgent: getUserAgent(),
    url: getCurrentUrl(),
  });
  
  // 包装为 Next.js 特定的接口
  return wrapLogLayer(contextLogger, config);
}
```

### 服务端实现

```typescript
// src/server/logger.ts
import { LogLayer, ConsoleTransport } from 'loglayer';

export async function createServerLogger(config?: NextjsLogConfig): Promise<ServerLoggerInstance> {
  // 创建基础 LogLayer 实例
  const logLayer = new LogLayer({
    transport: new ConsoleTransport({
      logger: console,
    }),
  });
  
  // 添加服务端特定的上下文
  const contextLogger = logLayer.withContext({
    service: config.appName,
    environment: config.environment,
    framework: 'nextjs',
    platform: 'server',
    nodeVersion: process.version,
    pid: process.pid,
  });
  
  return wrapServerLogger(contextLogger, config);
}
```

## 🔧 LogLayer 功能利用

### 1. 基础日志功能
```typescript
// 直接使用 LogLayer 的日志方法
log.info('Hello world!')
log.debug('Debug message')
log.warn('Warning message')
log.error('Error message')
```

### 2. 元数据支持
```typescript
// 使用 LogLayer 的 withMetadata 功能
log.withMetadata({ user: 'john' }).info('User logged in')
```

### 3. 上下文持久化
```typescript
// 使用 LogLayer 的 withContext 功能
const contextLog = log.withContext({ requestId: '123' })
contextLog.info('Processing request') // 自动包含 requestId
```

### 4. 错误处理
```typescript
// 使用 LogLayer 的 withError 功能
log.withError(new Error('Something went wrong')).error('Failed to process request')
```

## 🚀 Next.js 特定增强

在 LogLayer 基础上，我们添加了 Next.js 特定的功能：

### 1. 环境检测和配置
```typescript
// 自动检测 Next.js 环境
const env = detectEnvironment();
const contextLogger = logLayer.withContext({
  framework: 'nextjs',
  platform: env.isServer ? 'server' : 'browser',
  environment: env.nodeEnv,
});
```

### 2. React 集成
```typescript
// React hooks 基于 LogLayer
export function useComponentLogger(componentName: string): ClientLoggerInstance {
  const { logger } = useLogger();
  return logger.forModule(componentName); // 内部使用 logLayer.withContext({ module: componentName })
}
```

### 3. 自动 API 路由
```typescript
// 服务端日志接收器
export const { POST, OPTIONS } = logger.createReceiver();
// 内部使用 LogLayer 处理接收到的日志
```

### 4. 预设配置
```typescript
// 基于 LogLayer 的预设配置
export const clientQuickStart = {
  dev: (appName: string) => createClientLogger({
    appName,
    // LogLayer transport 配置
    outputs: { console: true }
  }),
  prod: (appName: string) => createClientLogger({
    appName,
    // LogLayer transport 配置  
    outputs: { console: false, http: { enabled: true } }
  }),
};
```

## 📊 架构优势

### 1. 复用成熟基础设施
- **传输层**: 使用 LogLayer 的 transport 系统
- **格式化**: 使用 LogLayer 的日志格式化
- **上下文管理**: 使用 LogLayer 的 context 和 metadata 功能

### 2. 专注 Next.js 集成
- **环境检测**: Next.js 特定的 server/client 环境检测
- **React 集成**: 专门为 React 组件设计的 hooks
- **路由集成**: 自动生成的 API 路由处理器

### 3. 保持简洁性
- **最小化包装**: 只在必要时包装 LogLayer 功能
- **直接暴露**: 大部分功能直接使用 LogLayer API
- **类型安全**: 在 LogLayer 基础上提供 TypeScript 类型

## 🎯 使用示例

### 基础使用（直接使用 LogLayer 能力）
```typescript
import { clientQuickStart } from '@yai-loglayer/next/client';

const logger = clientQuickStart.dev('my-app');

// 基础日志 - 直接使用 LogLayer
logger.info('Hello world!');

// 带元数据 - 使用 LogLayer 的 withMetadata
logger.withMetadata({ user: 'john' }).info('User logged in');

// 带上下文 - 使用 LogLayer 的 withContext  
const contextLogger = logger.withContext({ requestId: '123' });
contextLogger.info('Processing request');
```

### Next.js 特定功能
```typescript
// React 组件中使用
function MyComponent() {
  const logger = useComponentLogger('MyComponent'); // Next.js 特定
  
  useEffect(() => {
    logger.info('Component mounted'); // 自动包含组件上下文
  }, []);
}

// 服务端 API 路由
export const { POST, OPTIONS } = logger.createReceiver(); // Next.js 特定
```

## 🎉 总结

通过基于 LogLayer 的重构，我们实现了：

1. **不重复造轮子** - 复用 LogLayer 的成熟日志基础设施
2. **专注核心价值** - 专注于 Next.js 特定的集成和优化
3. **保持架构简洁** - 最小化包装，直接暴露 LogLayer 能力
4. **提供完整体验** - 在 LogLayer 基础上提供完整的 Next.js 日志解决方案

这种架构既利用了 LogLayer 的强大能力，又为 Next.js 开发者提供了极简的使用体验。
