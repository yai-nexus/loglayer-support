# LogLayer 架构简化迁移指南

## 概述

我们简化了 LogLayer 的架构，移除了 `CompatibleLogger` 包装器，统一使用 LogLayer 原生 API 和 `LoggerConfig` 配置格式。

## 主要变更

### 1. 移除 CompatibleLogger

**之前**:
```typescript
import { createServerLogger, type CompatibleLogger } from '@yai-loglayer/server';

const logger: CompatibleLogger = await createServerLogger('app', config);
logger.info('用户登录', { userId: '123', action: 'login' });
```

**现在**:
```typescript
import { createServerLogger } from '@yai-loglayer/server';
import { LogLayer } from 'loglayer';

const logger: LogLayer = await createServerLogger('app', config);
logger.withMetadata({ userId: '123', action: 'login' }).info('用户登录');
```

### 2. 统一配置格式

**之前** (支持两种格式):
```typescript
// ServerLoggerConfig 格式
const config: ServerLoggerConfig = {
  level: { default: 'info' },
  outputs: [{ type: 'stdout' }]
};

// LoggerConfig 格式
const config: LoggerConfig = {
  level: { default: 'info' },
  server: { outputs: [{ type: 'stdout' }] },
  client: { outputs: [{ type: 'console' }] }
};
```

**现在** (只支持 LoggerConfig):
```typescript
const config: LoggerConfig = {
  level: { default: 'info' },
  server: { outputs: [{ type: 'stdout' }] },
  client: { outputs: [{ type: 'console' }] }
};
```

### 3. 便捷配置创建函数

新增了便捷的配置创建函数：

```typescript
import { 
  createServerConfig, 
  createFileLoggerConfig,
  createDevConfig,
  createProdConfig 
} from '@yai-loglayer/core';

// 简单服务端配置
const config = createServerConfig([
  { type: 'stdout' },
  { type: 'file', config: { dir: './logs', filename: 'app.log' } }
]);

// 开发环境配置
const devConfig = createDevConfig('./logs');

// 生产环境配置
const prodConfig = createProdConfig('/var/log/app');
```

## 迁移步骤

### 步骤 1: 更新导入

```typescript
// 移除
import { type CompatibleLogger } from '@yai-loglayer/server';

// 添加
import { LogLayer } from 'loglayer';
```

### 步骤 2: 更新类型声明

```typescript
// 之前
const logger: CompatibleLogger = await createServerLogger('app', config);

// 现在
const logger: LogLayer = await createServerLogger('app', config);
```

### 步骤 3: 更新日志调用

```typescript
// 之前
logger.info('用户操作', { userId: '123', action: 'click' });
logger.error('操作失败', { error: err, userId: '123' });

// 现在
logger.withMetadata({ userId: '123', action: 'click' }).info('用户操作');
logger.withMetadata({ error: err, userId: '123' }).error('操作失败');
```

### 步骤 4: 更新配置格式

```typescript
// 之前 (ServerLoggerConfig)
const config = {
  level: { default: 'info' },
  outputs: [{ type: 'stdout' }]
};

// 现在 (LoggerConfig)
const config = {
  level: { default: 'info' },
  server: { outputs: [{ type: 'stdout' }] },
  client: { outputs: [{ type: 'console' }] }
};

// 或使用便捷函数
const config = createServerConfig([{ type: 'stdout' }]);
```

## 优势

1. **架构简化**: 减少了抽象层，代码更直接
2. **性能提升**: 移除了包装器的开销
3. **标准化**: 统一使用 LogLayer 原生 API
4. **类型安全**: 更好的 TypeScript 支持
5. **便捷配置**: 新增的配置创建函数简化了配置过程

## 注意事项

- `ServerLoggerConfig` 已标记为废弃，将在 v1.0.0 中移除
- 所有示例项目已更新为新的 API
- 如需帮助，请参考 `examples/nextjs-example` 中的完整示例
