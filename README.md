# @yai-loglayer/\* - 企业级日志解决方案

🚀 **模块化企业级日志解决方案** - 为现代 Web 应用提供开箱即用的日志功能

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@yai-loglayer%2Fcore.svg)](https://www.npmjs.com/package/@yai-loglayer/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/yai-nexus/loglayer-support?style=social)](https://github.com/yai-nexus/loglayer-support)

> ⚠️ **重要通知**: `@yai-nexus/loglayer-support` 统一包已停止维护，请使用下面的独立模块包，按需安装使用。

## ✨ 新功能亮点 (v0.8.0)

🚀 **模块化架构稳定版** - 企业级、生产就绪、开源贡献！

- **📦 独立模块包** - 按需安装，减少包体积，支持精确的 tree-shaking
- **📝 完善文档系统** - 每个包都有详细的 README、API 文档和使用示例
- **🔧 统一版本管理** - 所有包版本统一，便于维护和升级
- **🤝 开源社区贡献** - 正式向开源社区贡献企业级日志解决方案

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

## 📦 可用模块

我们提供以下独立模块，请根据需要选择安装：

### 🔧 核心模块

```bash
npm install @yai-loglayer/core
```

- 核心类型定义和工具函数
- 配置验证工具
- 环境检测功能

### 🌐 浏览器端模块

```bash
npm install @yai-loglayer/browser
```

- 浏览器端日志封装
- 开箱即用的日志解决方案
- 多输出支持、采样、性能监控

### 🖥️ 服务端模块

```bash
npm install @yai-loglayer/server
```

- Node.js 环境日志解决方案
- 模块化、健康检查、优雅关闭
- 企业级服务端日志器

### 📨 日志接收器模块

```bash
npm install @yai-loglayer/receiver
```

- 接收和处理客户端日志数据
- 多框架支持、安全验证、批量处理
- 通用日志接收器

### ☁️ SLS 传输模块

```bash
npm install @yai-loglayer/sls-transport
```

- 阿里云 SLS (Simple Log Service) 传输组件
- 批量发送、重试机制、错误处理
- 企业级日志传输

## 🚀 快速开始

### 🌐 浏览器端日志器

```typescript
import { createBrowserLogger } from '@yai-loglayer/browser';

// 创建功能强大的浏览器端日志器
const logger = await createBrowserLogger({
  outputs: {
    console: { colorized: true }, // 彩色控制台输出
    localStorage: { maxEntries: 1000 }, // 本地存储
    http: {
      endpoint: '/api/logs', // 发送到服务端
      batchSize: 10, // 批量发送
      retryAttempts: 3, // 重试机制
    },
  },
  errorHandling: {
    captureGlobalErrors: true, // 自动捕获全局错误
  },
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
  userId: '12345',
});

console.log('错误码:', handledError.code); // E2001
console.log('错误类别:', handledError.category); // network
console.log('恢复策略:', handledError.recovery); // retry
```

### 🖥️ 服务端日志器 (Next.js)

```typescript
// lib/server-logger.ts
import { createNextjsServerLogger } from '@yai-loglayer/server';

export const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' }, // API 模块
    database: { level: 'debug' }, // 数据库模块
    auth: { level: 'warn' }, // 认证模块
  },
  performance: { enabled: true }, // 性能监控
  healthCheck: { enabled: true }, // 健康检查
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
import { createNextjsLogReceiver } from '@yai-loglayer/receiver';
import { serverLogger } from '../../../lib/server-logger';

// 一行代码创建完整的日志接收 API
export const POST = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    maxMessageLength: 2000,
  },
  processing: {
    supportBatch: true, // 支持批量处理
    maxBatchSize: 50,
  },
  security: {
    rateLimiting: {
      // 速率限制
      maxRequestsPerMinute: 100,
    },
  },
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
- [功能请求](https://github.com/yai-nexus/loglayer-support/discussions)
- [NPM 组织页面](https://www.npmjs.com/org/yai-loglayer)

## 🤝 贡献指南

我们欢迎社区贡献！无论是 Bug 报告、功能请求还是代码贡献，都非常欢迎。

- 📖 [贡献指南](./CONTRIBUTING.md) - 详细的贡献流程
- 🐛 [问题报告](https://github.com/yai-nexus/loglayer-support/issues/new) - 报告 Bug
- 💡 [功能请求](https://github.com/yai-nexus/loglayer-support/discussions/new) - 提出新想法
- 📚 [文档改进](https://github.com/yai-nexus/loglayer-support/tree/main/docs) - 帮助完善文档

## 📄 许可证

[MIT License](./LICENSE) - 可自由使用于商业和开源项目。

---

**快速开始**: 选择需要的模块安装 → [查看各模块使用指南](./packages/)
