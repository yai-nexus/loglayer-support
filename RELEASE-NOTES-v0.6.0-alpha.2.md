# Release Notes - v0.6.0-alpha.2

## 🔧 修复版本 - TypeScript 编译错误修复

这是 `@yai-nexus/loglayer-support` v0.6.0 的第二个 Alpha 版本，主要修复了 alpha.1 版本中的 TypeScript 编译错误，确保 CI/CD 构建成功。

## 🐛 修复内容

### TypeScript 编译错误修复
- **修复 `ServerLoggerConfig` 接口** - 添加了必需的 `level` 字段定义
- **修复 `ModuleLoggerManager` 类** - 实现了缺少的方法：
  - `forUser(userId: string): IEnhancedLogger`
  - `logPerformance(operation: string, duration: number, metadata?: LogMetadata): void`
  - `get raw(): LogLayer`
- **修复测试配置** - 为所有测试配置添加了必需的 `level` 字段
- **修复错误处理** - 修复了 `path-resolver.ts` 中的 unknown 类型错误处理

### 构建和部署
- ✅ 所有 TypeScript 编译错误已解决
- ✅ 本地构建测试通过
- ✅ CI/CD 构建应该能够成功执行

## 📦 安装和使用

### 安装
```bash
npm install @yai-nexus/loglayer-support@0.6.0-alpha.2
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

## 🔄 从 alpha.1 升级

如果您正在使用 alpha.1 版本，只需更新版本号即可：

```bash
npm install @yai-nexus/loglayer-support@0.6.0-alpha.2
```

API 没有变化，只是修复了类型错误。

## ✨ 核心功能（继承自 alpha.1）

### 🌐 createBrowserLogger - 强大的浏览器端日志器
- 🔌 多输出支持（Console + LocalStorage + HTTP）
- 🎯 智能采样策略
- 📊 性能监控和页面加载跟踪
- 🛡️ 自动错误捕获
- 🔄 批量发送和重试机制

### 🖥️ createServerLogger - 企业级服务端日志器
- 🧩 模块化日志管理
- 🏥 健康检查和性能监控
- 🔄 优雅关闭和资源清理
- 📊 运行时统计
- 🎭 Next.js、Express.js 专门优化

### 📨 createLogReceiver - 通用日志接收器
- 🌐 框架无关（Next.js + Express.js + 通用）
- 🔒 安全验证和速率限制
- 📦 批量处理支持
- 🎭 适配器模式
- 🔍 详细输入验证

## 📚 文档和示例

- **[框架预设使用指南](./src/frameworks/USAGE.md)** - 完整使用教程
- **[API 参考文档](./docs/frameworks-api-reference.md)** - 详细 API 说明
- **[迁移指南](./docs/migration-guide.md)** - 从旧版本迁移
- **[Next.js 示例](./examples/nextjs/)** - 完整的 Next.js 集成示例
- **[React 示例](./examples/react/)** - React 应用集成方案

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

## ⚠️ Alpha 版本说明

这仍然是预览版本，API 可能会在正式版本中发生变化。建议在测试环境中使用，生产环境请谨慎使用。

---

感谢您试用 v0.6.0-alpha.2！这个版本主要专注于修复构建问题，确保更好的开发体验。🚀
