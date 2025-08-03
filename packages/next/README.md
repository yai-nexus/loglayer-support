# @yai-loglayer/next

Next.js 统一日志组件 - 集成server和browser优化方案

## 概述

`@yai-loglayer/next` 是专为 Next.js 应用设计的统一日志解决方案，集成了server端和browser端的优化方案，提供极简的接入体验和强大的功能。

## 特性

- 🚀 **极简接入**: 一行代码即可开始使用
- 🔄 **统一接口**: server和browser端使用相同的API
- 🎯 **智能配置**: 自动检测环境，智能推断最佳配置
- ⚡ **同步返回**: 立即可用，无需等待异步初始化
- 🛡️ **优雅降级**: 多级降级机制，确保日志功能始终可用
- 📱 **React集成**: 提供React组件和Hooks
- 🔧 **TypeScript**: 完整的TypeScript类型支持

## 安装

```bash
npm install @yai-loglayer/next
# 或
yarn add @yai-loglayer/next
# 或
pnpm add @yai-loglayer/next
```

## 快速开始

### 1. 最简单的使用方式

```typescript
import { createNextjsLogger } from '@yai-loglayer/next';

// 自动根据环境选择server或browser logger
const logger = createNextjsLogger({
  appName: 'my-nextjs-app',
});

// 立即可用
logger.info('应用启动', { version: '1.0.0' });
logger.error('错误信息', { error: 'Something went wrong' });
```

### 2. 在API路由中处理客户端日志

```typescript
// app/api/logs/client/route.ts
import { createNextjsServerLogger, createNextjsLogReceiver } from '@yai-loglayer/next';

const serverLogger = createNextjsServerLogger({
  appName: 'my-nextjs-app',
});

const logReceiver = createNextjsLogReceiver(serverLogger);

export async function POST(req: NextRequest) {
  return logReceiver(req);
}
```

### 3. 在React组件中使用

```tsx
// app/layout.tsx
import { LoggerProvider } from '@yai-loglayer/next';

export default function RootLayout({ children }) {
  return <LoggerProvider config={{ appName: 'my-nextjs-app' }}>{children}</LoggerProvider>;
}

// components/UserProfile.tsx
import { useComponentLogger } from '@yai-loglayer/next';

export function UserProfile({ userId }) {
  const logger = useComponentLogger('UserProfile');

  const handleLogin = () => {
    logger.info('用户登录', { userId });
  };

  return <button onClick={handleLogin}>登录</button>;
}
```

## API 参考

### 统一接口

#### `createNextjsLogger(config)`

创建Next.js统一日志器，自动根据运行环境返回对应的logger。

```typescript
const logger = createNextjsLogger({
  appName: 'my-app',
  shared: {
    environment: 'production',
    level: 'info',
    enableSls: true,
  },
});
```

#### `createNextjsLoggerPair(config)`

同时创建server和browser logger。

```typescript
const { server, browser } = createNextjsLoggerPair({
  appName: 'my-app',
});
```

### Server端

#### `createNextjsServerLogger(config)`

创建Next.js服务端日志器。

```typescript
const serverLogger = createNextjsServerLogger({
  appName: 'my-app',
  environment: 'production',
  enableFileLogging: true,
  enableSls: true,
});
```

### Browser端

#### `createNextjsBrowserLogger(config)`

创建Next.js浏览器端日志器。

```typescript
const browserLogger = createNextjsBrowserLogger({
  appName: 'my-app',
  environment: 'production',
  enableConsole: false,
  enableHttp: true,
});
```

#### 预设配置

```typescript
import {
  createDevelopmentLogger,
  createProductionLogger,
  createLoggerByEnvironment,
} from '@yai-loglayer/next';

// 使用预设
const devLogger = createDevelopmentLogger('my-app');
const prodLogger = createProductionLogger('my-app');

// 自动选择环境
const autoLogger = createLoggerByEnvironment('my-app');
```

### React组件和Hooks

#### `LoggerProvider`

提供logger上下文的Provider组件。

```tsx
<LoggerProvider config={{ appName: 'my-app' }}>
  <App />
</LoggerProvider>
```

#### `useLogger()`

获取logger上下文。

```typescript
const { logger, isReady, error } = useLogger();
```

#### `useComponentLogger(componentName)`

获取组件专用的logger，自动添加组件名称到日志中。

```typescript
const logger = useComponentLogger('UserProfile');
```

### 日志接收器

#### `createNextjsLogReceiver(logger, config?)`

创建处理客户端日志的接收器。

```typescript
const logReceiver = createNextjsLogReceiver(serverLogger, {
  validation: {
    maxMessageLength: 1000,
    allowedLevels: ['info', 'warn', 'error'],
  },
  security: {
    rateLimiting: {
      maxRequestsPerMinute: 100,
    },
  },
});
```

## 环境变量配置

### Server端

```bash
# 日志级别
LOG_LEVEL=info

# SLS配置
SLS_ENDPOINT=https://your-region.log.aliyuncs.com
SLS_ACCESS_KEY_ID=your-access-key-id
SLS_ACCESS_KEY_SECRET=your-access-key-secret
SLS_PROJECT=your-project
SLS_LOGSTORE=your-logstore
SLS_REGION=cn-beijing
```

### Browser端

```bash
# 应用信息
NEXT_PUBLIC_SERVICE_NAME=my-nextjs-app
NEXT_PUBLIC_APP_VERSION=1.0.0

# HTTP接收器
NEXT_PUBLIC_LOG_RECEIVER_ENABLED=true
NEXT_PUBLIC_LOG_HTTP_ENDPOINT=/api/logs/client

# SLS配置（浏览器端）
NEXT_PUBLIC_SLS_ENABLED=true
NEXT_PUBLIC_SLS_ENDPOINT=https://your-region.log.aliyuncs.com
NEXT_PUBLIC_SLS_ACCESS_KEY_ID=your-access-key-id
NEXT_PUBLIC_SLS_ACCESS_KEY_SECRET=your-access-key-secret
NEXT_PUBLIC_SLS_PROJECT=your-project
NEXT_PUBLIC_SLS_LOGSTORE=your-logstore
NEXT_PUBLIC_SLS_REGION=cn-beijing
```

## 高级用法

### 自定义配置

```typescript
const logger = createNextjsLogger({
  appName: 'my-app',
  server: {
    level: 'warn',
    outputs: {
      file: {
        enabled: true,
        path: '/var/log/myapp',
        rotation: { maxSize: '100MB', maxFiles: 10 },
      },
    },
  },
  browser: {
    level: 'error',
    enableConsole: false,
    httpEndpoint: '/api/logs/client',
  },
});
```

### 性能监控

```typescript
import { usePerformanceLogger } from '@yai-loglayer/next';

function MyComponent() {
  const { measurePerformance } = usePerformanceLogger();

  const handleExpensiveOperation = () => {
    measurePerformance('expensive-calculation', () => {
      // 耗时操作
    });
  };
}
```

## 迁移指南

### 从原有复杂配置迁移

**原有方式（100+行代码）:**

```typescript
// 大量的环境变量读取和配置逻辑
const getEnv = (key: string) => {
  /* ... */
};
const createConfig = () => {
  /* ... */
};
let loggerInstance: any = null;
// ... 复杂的异步初始化逻辑

export const logger = {
  debug: async (message: string, data?: any) => {
    const log = await initLogger();
    log.debug(message, { data, service: config.app.name });
  },
  // ...
};
```

**新方式（1行代码）:**

```typescript
export const logger = createNextjsLogger({ appName: 'my-app' });

// 立即可用，无需await
logger.debug('调试信息', { data: 'some data' });
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
