# LogLayer Support v0.7.0-beta.1 发布说明

## 🚀 重大架构简化 - Beta 版本

发布日期：2025-01-27

这是一个重大的架构简化版本，我们移除了复杂的包装器和多余的配置格式，统一使用 LogLayer 原生 API，让整个库更加简洁、高效和标准化。

## 💥 破坏性变更

### 1. 移除 CompatibleLogger 接口

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

### 2. 移除 ServerLoggerConfig 接口

**之前** (支持两种格式):
```typescript
// ServerLoggerConfig 格式
const config: ServerLoggerConfig = {
  level: { default: 'info' },
  outputs: [{ type: 'stdout' }]
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

## ✨ 新增功能

### 便捷配置创建函数

新增了多个便捷的配置创建函数，简化配置过程：

```typescript
import { 
  createServerConfig, 
  createClientConfig,
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

## 🔧 改进

### 1. 性能提升
- 移除了 CompatibleLogger 包装器层，减少函数调用开销
- 直接使用 LogLayer 原生 API，性能更优

### 2. 类型安全
- 更好的 TypeScript 类型推断和检查
- 统一的类型定义，减少类型错误

### 3. 代码简化
- 减少抽象层，代码更直接易懂
- 移除复杂的包装器逻辑

### 4. 标准化
- 与 LogLayer 生态标准保持一致
- 更好的生态兼容性

## 📚 迁移指南

详细的迁移指南请参考 `docs/architecture-simplification-guide.md`

### 快速迁移步骤

1. **更新导入**:
   ```typescript
   // 移除
   import { type CompatibleLogger } from '@yai-loglayer/server';
   
   // 添加
   import { LogLayer } from 'loglayer';
   ```

2. **更新类型声明**:
   ```typescript
   // 之前
   const logger: CompatibleLogger = await createServerLogger('app', config);
   
   // 现在
   const logger: LogLayer = await createServerLogger('app', config);
   ```

3. **更新日志调用**:
   ```typescript
   // 之前
   logger.info('用户操作', { userId: '123', action: 'click' });
   
   // 现在
   logger.withMetadata({ userId: '123', action: 'click' }).info('用户操作');
   ```

## ✅ 验证

### 示例项目测试
- ✅ **基础示例**: 所有功能正常，日志文件生成正确
- ✅ **Next.js 示例**: 服务端和客户端日志都正常工作
- ✅ **React 示例**: 浏览器实际访问测试通过

### 功能验证
- ✅ **日志记录**: 所有日志级别正常工作
- ✅ **文件输出**: 日志文件正确生成
- ✅ **控制台输出**: 彩色控制台输出正常
- ✅ **本地存储**: 客户端本地存储功能正常
- ✅ **性能监控**: 性能日志记录正常
- ✅ **错误处理**: 错误日志和堆栈跟踪正常

## 🎯 优势

1. **架构简化**: 减少了抽象层，代码更直接
2. **性能提升**: 移除了包装器的开销
3. **标准化**: 统一使用 LogLayer 原生 API
4. **类型安全**: 更好的 TypeScript 支持
5. **便捷配置**: 新增的配置创建函数简化了配置过程

## 📦 包版本

所有包都已更新到 `0.7.0-beta.1`:

- `@yai-loglayer/core@0.7.0-beta.1`
- `@yai-loglayer/server@0.7.0-beta.1`
- `@yai-loglayer/browser@0.7.0-beta.1`
- `@yai-loglayer/receiver@0.7.0-beta.1`

## 🔗 相关链接

- [架构简化迁移指南](./architecture-simplification-guide.md)
- [API 文档](./api-reference.md)
- [示例项目](../examples/)

---

**注意**: 这是 Beta 版本，建议在测试环境中充分验证后再用于生产环境。
