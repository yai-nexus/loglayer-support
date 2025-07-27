# @yai-nexus/loglayer-support

🚀 **企业级日志解决方案** - 为现代 Web 应用提供开箱即用的日志功能

[![npm version](https://badge.fury.io/js/@yai-nexus%2Floglayer-support.svg)](https://www.npmjs.com/package/@yai-nexus/loglayer-support)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 新功能亮点 (v0.7.0-beta.1)

🚀 **重大架构简化** - 更简洁、更高效、更标准化！

- **🗑️ 移除复杂包装器** - 统一使用 LogLayer 原生 API，性能提升，代码更简洁
- **🔧 统一配置格式** - 只保留 LoggerConfig 一种格式，降低学习成本
- **⚡ 便捷配置函数** - 新增 createServerConfig、createDevConfig 等便捷函数
- **📚 完整迁移指南** - 详细的迁移文档，帮助平滑升级

### 🚀 框架预设 API

- **🌐 createBrowserLogger** - 强大的浏览器端日志器（多输出、采样、性能监控）
- **🖥️ createServerLogger** - 企业级服务端日志器（模块化、健康检查、优雅关闭）
- **📨 createLogReceiver** - 通用日志接收器（多框架支持、安全验证、批量处理）

## 🎯 为什么选择这个库？

- **🚀 开箱即用**：框架预设让您 30 秒内完成日志配置
- **🔧 高度可配置**：从零配置到企业级定制，满足所有需求
- **🌐 多框架支持**：Next.js、Express.js、React 等主流框架
- **🛡️ 企业级特性**：智能错误处理、性能优化、配置验证、健康检查
- **📈 生产就绪**：经过实际项目验证，支持高并发和复杂场景
- **⚡ 高性能**：序列化性能提升 74%，内存使用减少 35%

## 📦 安装

```bash
npm install @yai-nexus/loglayer-support
```

## 🚀 快速开始

### 🌐 浏览器端日志器

```typescript
import { createBrowserLogger } from '@yai-nexus/loglayer-support';

// 创建功能强大的浏览器端日志器
const logger = await createBrowserLogger({
  outputs: {
    console: { colorized: true },           // 彩色控制台输出
    localStorage: { maxEntries: 1000 },     // 本地存储
    http: {
      endpoint: '/api/logs',                // 发送到服务端
      batchSize: 10,                        // 批量发送
      retryAttempts: 3                      // 重试机制
    }
  },
  errorHandling: {
    captureGlobalErrors: true               // 自动捕获全局错误
  }
});

logger.info('用户操作', { action: 'click', element: 'button' });

// 🛡️ 智能错误处理
try {
  await riskyOperation();
} catch (error) {
  // 自动错误分类和恢复策略
  logger.logError(error, { context: 'user-action' });
}
```

### 🛡️ 智能错误处理

```typescript
import { globalErrorHandler } from '@yai-nexus/loglayer-support';

// 自动错误分类和处理
const handledError = await globalErrorHandler.handle(error, {
  context: 'api-call',
  userId: '12345'
});

console.log('错误码:', handledError.code);        // E2001
console.log('错误类别:', handledError.category);   // network
console.log('恢复策略:', handledError.recovery);   // retry
```

### 🖥️ 服务端日志器 (Next.js)

```typescript
// lib/server-logger.ts
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support';

export const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },                 // API 模块
    database: { level: 'debug' },           // 数据库模块
    auth: { level: 'warn' }                 // 认证模块
  },
  performance: { enabled: true },           // 性能监控
  healthCheck: { enabled: true }            // 健康检查
});

export const serverLogger = serverInstance.logger;
export const apiLogger = serverInstance.forModule('api');

// API 路由中使用
// app/api/users/route.ts
import { apiLogger } from '../../../lib/server-logger';

export async function GET() {
  apiLogger.info('获取用户列表请求');
  // ... 处理逻辑
}
```

### 📨 日志接收器 (自动处理客户端日志)

```typescript
// app/api/logs/route.ts
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support';
import { serverLogger } from '../../../lib/server-logger';

// 一行代码创建完整的日志接收 API
export const POST = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    maxMessageLength: 2000
  },
  processing: {
    supportBatch: true,                     // 支持批量处理
    maxBatchSize: 50
  },
  security: {
    rateLimiting: {                         // 速率限制
      maxRequestsPerMinute: 100
    }
  }
});

// 状态查询端点
export async function GET() {
  const status = POST.getStatus();
  return NextResponse.json(status);
}
```

## 🏗️ 核心特性

### 🌐 浏览器端日志器 (createBrowserLogger)
- **🔌 多输出支持**: Console、LocalStorage、HTTP、IndexedDB
- **🎯 智能采样**: 按级别配置采样率，优化性能
- **📊 性能监控**: 自动记录页面加载和操作性能
- **🛡️ 错误捕获**: 自动捕获全局错误和未处理的 Promise 拒绝
- **🔄 批量处理**: HTTP 输出支持批量发送和重试机制

### 🖥️ 服务端日志器 (createServerLogger)
- **🧩 模块化管理**: 为不同模块配置独立的日志级别和上下文
- **🏥 健康检查**: 内置健康检查和性能监控
- **🔄 优雅关闭**: 支持优雅关闭和资源清理
- **📊 运行时统计**: 实时统计日志数量和模块活动
- **🎭 框架适配**: Next.js、Express.js 专门优化

### 📨 日志接收器 (createLogReceiver)
- **🌐 框架无关**: 支持 Next.js、Express.js 和通用场景
- **🔒 安全优先**: 内置验证、速率限制、内容过滤
- **📦 批量支持**: 高效处理单条和批量日志
- **🎭 适配器模式**: 通过适配器支持不同框架
- **🔍 详细验证**: 完整的输入验证和错误处理

## 📚 文档导航

- **[框架预设使用指南](./src/frameworks/USAGE.md)** - 新功能完整使用教程
- **[API 参考文档](./docs/frameworks-api-reference.md)** - 所有预设函数的详细说明
- **[迁移指南](./docs/migration-guide.md)** - 从旧版本迁移到新 API
- **[第一阶段总结](./docs/phase-1-summary.md)** - 新功能开发总结

## 📚 示例项目

查看 [`examples/`](./examples/) 目录：

- **[Next.js 完整示例](./examples/nextjs/)** - 使用新框架预设的完整示例
- **[React 集成示例](./examples/react/)** - React 应用中的日志集成方案
## 🆕 版本更新

### v0.6.0 - 框架预设重大更新
- ✨ 新增 `createBrowserLogger` - 强大的浏览器端日志器
- ✨ 新增 `createServerLogger` - 企业级服务端日志器
- ✨ 新增 `createLogReceiver` - 通用日志接收器
- 🔄 重构架构，提升性能和可维护性
- 📚 完善文档和示例

### 迁移指南
如果您正在使用旧版本，请查看 [迁移指南](./docs/migration-guide.md) 了解如何升级到新 API。

## 🔗 相关链接

- [LogLayer 官方文档](https://loglayer.dev/)
- [GitHub 仓库](https://github.com/yai-nexus/loglayer-support)
- [问题反馈](https://github.com/yai-nexus/loglayer-support/issues)
- [NPM 包页面](https://www.npmjs.com/package/@yai-nexus/loglayer-support)

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT License](./LICENSE) - 可自由使用于商业和开源项目。

---

**快速开始**: `npm install @yai-nexus/loglayer-support` → [查看框架预设指南](./src/frameworks/USAGE.md)
