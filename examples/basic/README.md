# LogLayer Basic 使用示例

这是一个独立的 LogLayer 基础使用示例包，展示了 LogLayer 的各种配置和使用方式。

## 📦 项目结构

```
examples/basic/
├── package.json          # 独立包配置
├── tsconfig.json         # TypeScript 配置
├── .env.example          # 环境变量示例
├── README.md             # 本文档
├── index.ts              # 主入口文件
├── details/              # 具体示例实现
│   ├── config-presets.ts     # 示例1: 预设配置
│   ├── custom-config.ts      # 示例2: 自定义配置
│   ├── enhanced-features.ts  # 示例3: 增强功能
│   ├── production-config.ts  # 示例4: 生产环境
│   └── multiple-outputs.ts   # 示例5: 多输出
└── lib/
    └── shared-utils.ts   # 共享工具函数
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd examples/basic
npm install
```

### 2. 配置环境变量（可选）

如果需要使用阿里云 SLS 等云端日志服务：

```bash
cp .env.example .env
# 编辑 .env 文件，填写你的实际配置
```

### 3. 运行示例

```bash
# 开发模式运行（推荐）
npm run dev

# 或者构建后运行
npm run build
npm start
```

## 📚 示例说明

### 示例1: 预设配置 (config-presets.ts)
展示如何使用 LogLayer 提供的预设配置：
- `createDefaultConfig()` - 默认配置
- `createDevelopmentConfig()` - 开发环境配置

### 示例2: 自定义配置 (custom-config.ts)
展示如何创建自定义的日志配置：
- 不同模块的日志级别设置
- 多种输出方式配置
- 服务端和客户端分别配置

### 示例3: 增强功能 (enhanced-features.ts)
展示 LogLayer 的高级功能：
- 上下文绑定 (`forRequest`, `forUser`, `forModule`)
- 错误记录 (`logError`)
- 性能记录 (`logPerformance`)
- 链式调用

### 示例4: 生产环境配置 (production-config.ts)
展示适合生产环境的配置：
- 安全的日志级别设置
- 文件日志轮转
- 云端日志收集 (SLS)
- 性能优化配置

### 示例5: 多输出配置 (multiple-outputs.ts)
展示如何配置多种输出方式：
- 控制台输出
- 文件输出（全量和错误分离）
- HTTP 远程输出
- 本地存储输出
- 云端日志服务

## 🛠️ 开发脚本

```bash
npm run dev      # 开发模式运行（使用 tsx）
npm run build    # 构建 TypeScript
npm start        # 运行构建后的 JavaScript
npm run clean    # 清理构建文件
npm test         # 构建并测试
```

## 🔧 配置说明

### 环境变量

项目支持通过环境变量配置 SLS 等云端服务：

- `SLS_ENDPOINT` - 阿里云 SLS 端点
- `SLS_PROJECT` - SLS 项目名称
- `SLS_LOGSTORE` - SLS 日志库名称
- `SLS_ACCESS_KEY` - 阿里云访问密钥 ID
- `SLS_ACCESS_KEY_SECRET` - 阿里云访问密钥密码
- `SLS_APP_NAME` - 应用名称

### 日志输出

日志文件默认输出到项目根目录的 `logs/` 目录：
- `logs/basic.log` - 基础示例日志
- `logs/all.log` - 完整日志
- `logs/errors.log` - 错误日志

## 📖 相关文档

- [LogLayer 主文档](../../README.md)
- [配置指南](../../docs/practical-config.md)
- [实现策略](../../docs/implementation-strategy.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这些示例！
