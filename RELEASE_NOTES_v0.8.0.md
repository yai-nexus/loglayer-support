# 🚀 @yai-loglayer/\* v0.8.0 发布说明

## 📅 发布日期: 2025-01-31

### 🎯 版本亮点

这是 `@yai-loglayer/*` 包系列的一个重要里程碑版本，标志着模块化架构的成熟和稳定。我们专注于提供企业级的日志解决方案，现在所有包都达到了生产就绪的质量标准。

### 🚨 重要变更

- **废弃统一包**: `@yai-nexus/loglayer-support` 已停止维护
- **推荐模块化使用**: 请根据需要安装对应的独立模块
- **版本统一**: 所有包版本统一升级到 0.8.0

### 📦 可用模块

#### 🔧 [@yai-loglayer/core@0.8.0](https://www.npmjs.com/package/@yai-loglayer/core)

- 核心类型定义和工具函数
- 配置验证工具
- 环境检测功能

#### 🌐 [@yai-loglayer/browser@0.8.0](https://www.npmjs.com/package/@yai-loglayer/browser)

- 浏览器端日志封装
- 本地存储支持
- 批量上报功能
- Console 彩色输出

#### 🖥️ [@yai-loglayer/server@0.8.0](https://www.npmjs.com/package/@yai-loglayer/server)

- Node.js 环境日志解决方案
- 文件日志输出和轮转
- Next.js 集成支持
- 多传输器支持

#### 📨 [@yai-loglayer/receiver@0.8.0](https://www.npmjs.com/package/@yai-loglayer/receiver)

- 日志接收和处理
- 批量日志处理
- 数据验证和清洗
- Next.js API 路由集成

#### ☁️ [@yai-loglayer/sls-transport@0.8.0](https://www.npmjs.com/package/@yai-loglayer/sls-transport)

- 阿里云 SLS 传输组件
- 批量发送和重试机制
- 企业级错误处理
- 统计信息监控

### ✨ 新增功能

- **完善的文档系统**: 每个包都有详细的 README 和使用示例
- **统一的包结构**: 标准化的项目结构和配置
- **npm 徽章支持**: 所有包都添加了版本和许可证徽章
- **交叉引用链接**: 包之间有完整的相互引用

### 🔧 技术改进

- ✅ 通过完整的 TypeScript 类型检查
- ✅ 通过 ESLint 代码质量检查
- ✅ 通过构建验证
- ✅ 优化了包的元数据

### 📚 文档更新

- 完善了所有包的 README 文档
- 添加了高级用法示例
- 统一了文档格式和风格
- 创建了详细的迁移指南

### 🚀 快速开始

```bash
# 根据需要安装对应的包
npm install @yai-loglayer/browser    # 浏览器端
npm install @yai-loglayer/server     # 服务端
npm install @yai-loglayer/receiver   # 日志接收器
npm install @yai-loglayer/core       # 核心功能
npm install @yai-loglayer/sls-transport  # SLS 传输
```

### 🔄 从旧版本迁移

如果你正在使用 `@yai-nexus/loglayer-support`，请参考 [迁移指南](./MIGRATION.md) 了解如何迁移到新的模块化架构。

### 🤝 贡献

我们欢迎社区贡献！这个版本的发布标志着项目向开源社区的正式贡献。

- 📝 [GitHub 仓库](https://github.com/yai-nexus/loglayer-support)
- 🐛 [问题反馈](https://github.com/yai-nexus/loglayer-support/issues)
- 📖 [文档](https://github.com/yai-nexus/loglayer-support/tree/main/packages)

### 📄 许可证

MIT License - 可自由用于商业和开源项目

---

**感谢使用 @yai-loglayer/\* 包系列！** 🎉
