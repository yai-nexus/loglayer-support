# 贡献指南

感谢您对 @yai-loglayer/\* 项目的关注！我们欢迎所有形式的贡献。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yai-nexus/loglayer-support.git
cd loglayer-support

# 安装依赖
pnpm install

# 构建所有包
pnpm build:packages

# 运行测试
pnpm test

# 运行示例
pnpm dev:nextjs  # Next.js 示例
pnpm dev:react   # React 示例
pnpm dev:basic   # 基础示例
```

## 📦 项目结构

```
loglayer-support/
├── packages/          # 核心包
│   ├── core/         # 核心类型和工具
│   ├── browser/      # 浏览器端日志器
│   ├── server/       # 服务端日志器
│   ├── receiver/     # 日志接收器
│   ├── next/         # Next.js 集成
│   └── sls-transport/ # 阿里云 SLS 传输
├── examples/         # 示例项目
│   ├── nextjs-example/
│   ├── react-example/
│   └── basic-example/
└── docs/            # 文档
```

## 🛠️ 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发和测试

```bash
# 开发时实时构建
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format
```

### 3. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat: add new logging feature"
git commit -m "fix: resolve memory leak issue"
git commit -m "docs: update API documentation"
```

### 4. 创建 Pull Request

- 确保所有测试通过
- 更新相关文档
- 添加变更日志（如果需要）

## 📝 代码规范

### TypeScript

- 使用严格的 TypeScript 配置
- 优先使用类型推断
- 避免使用 `any` 类型
- 为公共 API 提供完整的类型定义

### 代码风格

- 使用 Prettier 进行代码格式化
- 使用 ESLint 进行代码检查
- 遵循项目的 `.eslintrc.js` 配置

### 测试

- 为新功能编写单元测试
- 确保测试覆盖率不降低
- 使用 Jest 作为测试框架

## 📚 文档

### API 文档

- 使用 JSDoc 注释
- 提供使用示例
- 说明参数和返回值

### README 更新

- 新功能需要更新相关包的 README
- 保持示例代码的准确性
- 更新版本兼容性信息

## 🔄 发布流程

我们使用 [Changesets](https://github.com/changesets/changesets) 管理版本：

```bash
# 添加变更集
pnpm changeset

# 版本更新
pnpm changeset:version

# 发布
pnpm changeset:publish
```

## 🐛 问题报告

### Bug 报告

请包含以下信息：

- 环境信息（Node.js 版本、操作系统等）
- 重现步骤
- 期望行为
- 实际行为
- 错误日志（如果有）

### 功能请求

请描述：

- 使用场景
- 期望的 API 设计
- 是否愿意贡献实现

## 🤝 社区

- [GitHub Issues](https://github.com/yai-nexus/loglayer-support/issues) - 问题报告和功能请求
- [GitHub Discussions](https://github.com/yai-nexus/loglayer-support/discussions) - 社区讨论

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](./LICENSE) 下发布。

---

再次感谢您的贡献！🎉
