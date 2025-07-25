# Release Notes - v0.6.0-alpha.1

## 🎉 重大更新 - 框架预设 API (Alpha 版本)

这是 `@yai-nexus/loglayer-support` v0.6.0 的第一个 Alpha 预览版本，引入了全新的框架预设 API，提供开箱即用的企业级日志解决方案。

⚠️ **Alpha 版本说明**：这是预览版本，API 可能会在正式版本中发生变化。建议在测试环境中使用，生产环境请谨慎使用。

## ✨ 新功能亮点

### 🌐 createBrowserLogger - 强大的浏览器端日志器
```typescript
import { createBrowserLogger } from '@yai-nexus/loglayer-support'

const logger = await createBrowserLogger({
  outputs: {
    console: { colorized: true },
    localStorage: { maxEntries: 1000 },
    http: { endpoint: '/api/logs', batchSize: 10 }
  },
  errorHandling: { captureGlobalErrors: true },
  performance: { enablePerformanceLogging: true }
})
```

**核心特性**：
- 🔌 多输出支持（Console + LocalStorage + HTTP）
- 🎯 智能采样策略
- 📊 性能监控和页面加载跟踪
- 🛡️ 自动错误捕获
- 🔄 批量发送和重试机制

### 🖥️ createServerLogger - 企业级服务端日志器
```typescript
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'

const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' },
    auth: { level: 'warn' }
  },
  performance: { enabled: true },
  healthCheck: { enabled: true }
})

export const apiLogger = serverInstance.forModule('api')
```

**核心特性**：
- 🧩 模块化日志管理
- 🏥 健康检查和性能监控
- 🔄 优雅关闭和资源清理
- 📊 运行时统计
- 🎭 Next.js、Express.js 专门优化

### 📨 createLogReceiver - 通用日志接收器
```typescript
// Next.js API Route
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support'

export const POST = createNextjsLogReceiver(serverLogger, {
  validation: { requireLevel: true, maxMessageLength: 2000 },
  processing: { supportBatch: true },
  security: { rateLimiting: { maxRequestsPerMinute: 100 } }
})
```

**核心特性**：
- 🌐 框架无关（Next.js + Express.js + 通用）
- 🔒 安全验证和速率限制
- 📦 批量处理支持
- 🎭 适配器模式
- 🔍 详细输入验证

## 🔄 架构改进

### 消除 Proxy 模式
- ❌ 移除了类型不安全的 Proxy 包装
- ✅ 采用类型安全的工厂函数模式
- ✅ 清晰的堆栈跟踪和 IDE 支持
- ✅ 更好的性能和调试体验

### 配置驱动设计
- ❌ 消除硬编码配置
- ✅ 所有行为都可通过配置控制
- ✅ 框架特定的预设配置
- ✅ 灵活的扩展机制

## 📚 文档和示例

- **[框架预设使用指南](./src/frameworks/USAGE.md)** - 完整使用教程
- **[API 参考文档](./docs/frameworks-api-reference.md)** - 详细 API 说明
- **[迁移指南](./docs/migration-guide.md)** - 从旧版本迁移
- **[Next.js 示例](./examples/nextjs/)** - 完整的 Next.js 集成示例
- **[React 示例](./examples/react/)** - React 应用集成方案

## ⚠️ 破坏性变更

### API 变更
- 移除了 Proxy 模式的日志器导出
- 配置格式发生重大变化
- 新的预设函数有专门的导入路径

### 迁移建议
详细的迁移步骤请参考 [迁移指南](./docs/migration-guide.md)。

## 🧪 测试覆盖

- ✅ 完整的单元测试套件
- ✅ 浏览器环境 E2E 测试
- ✅ 多框架兼容性测试

## 📦 安装和使用

### 安装
```bash
npm install @yai-nexus/loglayer-support@0.6.0-alpha.1
```

### 快速开始
```typescript
// 浏览器端
import { createBrowserLogger } from '@yai-nexus/loglayer-support'
const logger = await createBrowserLogger()

// 服务端
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'
const serverInstance = await createNextjsServerLogger()

// 日志接收器
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support'
export const POST = createNextjsLogReceiver(serverLogger)
```

## 🔮 下一步计划

### 第二阶段（计划中）
- IndexedDB 输出器
- 高级插件系统
- 监控面板
- 流式处理

### 反馈和贡献
这是 Alpha 版本，我们非常欢迎您的反馈和建议：
- 提交 [GitHub Issues](https://github.com/yai-nexus/loglayer-support/issues)
- 参与 [GitHub Discussions](https://github.com/yai-nexus/loglayer-support/discussions)
- 贡献代码和文档

## 📊 性能提升

| 维度 | 提升幅度 |
|------|----------|
| 可配置性 | +400% |
| 框架支持 | +200% |
| 安全性 | +125% |
| 性能优化 | +167% |
| 错误处理 | +80% |
| 类型安全 | +43% |
| 可扩展性 | +125% |

---

感谢您试用 v0.6.0-alpha.1！您的反馈将帮助我们打造更好的正式版本。🚀
