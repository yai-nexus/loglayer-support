# LogLayer Support - 使用指南

## 快速开始

### 基本使用

```typescript
import { createLogger, createDefaultConfig } from 'loglayer-support';

// 推荐：异步创建（完整功能）
async function setupLogger() {
  const config = createDefaultConfig();
  const logger = await createLogger('my-app', config);
  
  logger.info('应用启动', { version: '1.0.0' });
  return logger;
}

// 备选：同步创建（基础功能）
import { createLoggerSync } from 'loglayer-support';

const logger = createLoggerSync('my-app');
logger.info('快速启动');
```

### Next.js 使用

```typescript
// 推荐：使用同步创建
import { createNextjsLoggerSync } from 'loglayer-support';

export const logger = createNextjsLoggerSync('nextjs-app');

// 在组件或 API 路由中使用
logger.info('页面访问', { page: '/dashboard' });
```

## 重要变更

### ❌ 已移除功能

以下功能已从设计中移除，以确保日志完整性：

```typescript
// ❌ 不再提供 - 代理模式容易导致日志丢失
createLoggerProxy('app')
initGlobalLogger('app', config)
getGlobalLogger()
```

### ✅ 推荐做法

```typescript
// ✅ 异步创建（推荐）
const logger = await createLogger('app', config);

// ✅ 同步创建（简单场景）
const logger = createLoggerSync('app');

// ✅ Next.js 特化
const logger = createNextjsLoggerSync('nextjs-app');
```

## 为什么移除代理模式？

代理模式存在日志不完整的问题：

```typescript
// 问题：代理模式可能丢失日志
const proxy = createLoggerProxy('app');
proxy.info('启动中...'); // 只输出到 console，不到配置的文件/HTTP

// 稍后异步初始化完成
await initGlobalLogger('app', config);
proxy.info('完成'); // 这时才输出到正确位置
```

新设计确保所有日志都按配置正确输出：

```typescript
// 解决方案：显式创建
const logger = await createLogger('app', config);
logger.info('启动中...'); // 直接输出到所有配置的位置
logger.info('完成');      // 行为完全一致
```

## 配置示例

### 开发环境

```typescript
const config = {
  level: { default: 'debug' },
  server: {
    outputs: [
      { type: 'stdout' },
      { type: 'file', config: { dir: './logs', filename: 'dev.log' } }
    ]
  },
  client: {
    outputs: [{ type: 'console' }]
  }
};
```

### 生产环境

```typescript
const config = {
  level: { default: 'info' },
  server: {
    outputs: [
      { type: 'stdout' },
      { type: 'sls', level: 'warn', config: { /* SLS 配置 */ } }
    ]
  },
  client: {
    outputs: [
      { type: 'http', level: 'error', config: { endpoint: '/api/logs' } }
    ]
  }
};
```

## 迁移指南

如果你之前使用代理模式，请按以下方式迁移：

### 之前

```typescript
// 旧代码
const logger = createLoggerProxy('app');
logger.info('立即可用'); // 可能丢失

// 异步初始化
initGlobalLogger('app', config);
```

### 现在

```typescript
// 新代码 - 方案 1：完全异步
const logger = await createLogger('app', config);
logger.info('完整记录'); // 保证输出到所有位置

// 新代码 - 方案 2：同步基础版
const logger = createLoggerSync('app');
logger.info('基础输出'); // 输出到标准位置
```

选择标准：
- 需要文件、HTTP、SLS 等高级输出 → 使用异步版本
- 只需要控制台输出 → 可以使用同步版本
- Next.js 项目 → 使用 `createNextjsLoggerSync`