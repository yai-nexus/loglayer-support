# @yai-nexus/loglayer-support

🚀 **基于 LogLayer 的统一日志解决方案** - 专为 Next.js 和现代 JavaScript 应用设计

[![npm version](https://badge.fury.io/js/@yai-nexus%2Floglayer-support.svg)](https://www.npmjs.com/package/@yai-nexus/loglayer-support)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 为什么选择这个库？

- **🛡️ 解决 Next.js 兼容性问题**：在 Edge Runtime 和 Serverless 环境中稳定工作
- **🔄 架构解耦设计**：代码与具体日志实现分离，可随时切换底层日志库
- **⚡ 零配置启动**：一行代码即可开始使用，同时保留完全自定义能力
- **📈 生产就绪**：经过实际项目验证，支持高并发和复杂场景

## 📦 安装

```bash
npm install @yai-nexus/loglayer-support
```

## 🚀 快速开始

### Next.js 应用

```typescript
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync();

logger.info('应用启动成功');
logger.error('发生错误', { error: new Error('示例错误') });
```

### Node.js 服务

```typescript
import { createLoggerWithPreset } from '@yai-nexus/loglayer-support';

const logger = await createLoggerWithPreset('production');
logger.info('服务启动', { port: 3000 });
```

### 结构化日志（推荐）

```typescript
// ✅ 使用结构化数据，便于查询和分析
logger.info('用户登录', {
  userId: '12345',
  ip: '192.168.1.1',
  userAgent: 'Chrome/91.0'
});

// ✅ 错误处理最佳实践
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作失败', {
    operation: 'riskyOperation',
    error: error.message,
    context: { userId: '12345' }
  });
}
```

## � 文档导航

- **[详细使用指南](./docs/usage-guide.md)** - 完整的使用教程和高级功能
- **[API 参考文档](./docs/api-reference.md)** - 所有函数和配置选项的详细说明
- **[最佳实践指南](./docs/best-practices.md)** - 性能优化和代码规范建议
- **[故障排除指南](./docs/troubleshooting.md)** - 常见问题解答和解决方案

## 🏗️ 核心特性

- **🔄 可移植性**: 底层日志库可随时切换，业务代码无需修改
- **🛡️ 健壮性**: 自动回退机制，确保在任何环境下都能工作
- **🎯 专业性**: 专为 Next.js 和现代 JavaScript 应用优化
- **📈 可扩展**: 支持插件和自定义传输器

## 📚 示例项目

查看 [`examples/`](./examples/) 目录：

- **[Next.js 完整示例](./examples/nextjs/)** - 包含 API 路由、页面组件、错误处理
- **[基础 API 示例](./examples/basic/)** - 所有功能演示和测试用例

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

**快速开始**: `npm install @yai-nexus/loglayer-support` → [查看使用指南](./docs/usage-guide.md)
