# LogLayer 示例配置说明 (v0.7.0-alpha.2)

本目录包含了 LogLayer 的使用示例，展示了如何在 v0.7.0-alpha.2 版本下在不同环境中使用新的 LogLayer API。

## 🆕 v0.7.0-alpha.2 重要变更

- **直接使用 LogLayer**：不再使用包装器，直接返回 LogLayer 实例
- **API 简化**：移除了一些旧的方法（如 `logError`、`forModule` 等）
- **类型安全**：更好的 TypeScript 支持和类型安全

## 🔒 安全配置重要提醒

**⚠️ 敏感信息保护**
- 所有的访问密钥、密码等敏感信息都应该通过环境变量配置
- **绝对不要**将真实的凭据硬编码在代码中
- **绝对不要**将包含敏感信息的 `.env` 文件提交到版本控制系统

## 📁 示例目录

### basic/
基础使用示例，展示 v0.7.0-alpha.2 的各种配置和功能特性。这是一个独立的模块化包，包含：
- **适配新 API**：所有示例都已更新为 v0.7.0-alpha.2 的 LogLayer API
- **5个核心示例**：预设配置、自定义配置、增强功能、生产环境、多输出配置
- **API 迁移示例**：展示如何从旧 API 迁移到新 API
- **类型安全**：完整的 TypeScript 支持

### nextjs/
Next.js 项目集成示例，展示 v0.7.0-alpha.2 下的前后端日志配置。
- **服务端适配**：使用新的 `createLogger` API
- **浏览器端适配**：使用新的 `createBrowserLoggerSync` API
- **日志接收器**：适配新的接收器 API

### react/
React 应用示例，展示在 React 环境中使用 v0.7.0-alpha.2。
- **React Hook 适配**：展示在 React 组件中的最佳实践
- **性能监控**：展示如何记录组件性能数据
- **错误处理**：新的错误记录方式

## 🛠️ 配置说明

### SLS (Simple Log Service) 配置

如果要使用阿里云 SLS 功能，需要配置以下环境变量：

```bash
# 对于 basic 示例，复制其目录下的 .env.example
cd basic/
cp .env.example .env

# 对于其他示例，复制项目根目录的 .env.example
cp ../.env.example ../.env

# 编辑 .env 文件，填入你的实际配置
```

**必需的环境变量：**
- `SLS_ENDPOINT` - SLS 服务端点（如：cn-beijing.log.aliyuncs.com）
- `SLS_PROJECT` - SLS 项目名称
- `SLS_LOGSTORE` - SLS 日志库名称
- `SLS_ACCESS_KEY` - 阿里云访问密钥 ID
- `SLS_ACCESS_KEY_SECRET` - 阿里云访问密钥密码（⚠️ 高度敏感）
- `SLS_APP_NAME` - 应用名称（用于标识日志来源）

**可选的环境变量：**
- `SLS_TOPIC` - 日志主题（默认：loglayer）
- `SLS_SOURCE` - 日志源（默认：nodejs）

### 环境变量配置方法

#### 方法1：使用 .env 文件（推荐用于开发环境）

```bash
# 1. 复制示例配置文件
cp .env.example .env

# 2. 编辑 .env 文件
nano .env  # 或使用你喜欢的编辑器

# 3. 确保 .env 文件不被提交到版本控制
echo ".env" >> .gitignore
```

#### 方法2：直接设置环境变量（推荐用于生产环境）

```bash
# Linux/macOS
export SLS_ENDPOINT="cn-beijing.log.aliyuncs.com"
export SLS_PROJECT="your-project"
export SLS_ACCESS_KEY="your-access-key"
export SLS_ACCESS_KEY_SECRET="your-secret"

# Windows (CMD)
set SLS_ENDPOINT=cn-beijing.log.aliyuncs.com
set SLS_PROJECT=your-project
set SLS_ACCESS_KEY=your-access-key
set SLS_ACCESS_KEY_SECRET=your-secret

# Windows (PowerShell)
$env:SLS_ENDPOINT="cn-beijing.log.aliyuncs.com"
$env:SLS_PROJECT="your-project"
$env:SLS_ACCESS_KEY="your-access-key"
$env:SLS_ACCESS_KEY_SECRET="your-secret"
```

## 🚀 运行示例

### 从项目根目录运行（推荐）

```bash
# 确保项目已构建
npm run build

# 运行所有示例
./scripts/run-all-examples.sh

# 或者运行单个示例
./scripts/run-basic-example.sh    # 基础示例
./scripts/run-nextjs-example.sh   # Next.js 示例
```

### 运行基础示例

```bash
cd examples/basic/

# 安装依赖（首次运行）
npm install

# 运行所有示例
npx ts-node index.ts

# 或者运行单个示例
npx ts-node details/config-presets.ts     # 示例1: 预设配置
npx ts-node details/custom-config.ts      # 示例2: 自定义配置
npx ts-node details/enhanced-features.ts  # 示例3: 增强功能
npx ts-node details/production-config.ts  # 示例4: 生产环境
npx ts-node details/multiple-outputs.ts   # 示例5: 多输出配置
```

### 运行 Next.js 示例

```bash
cd examples/nextjs/
npm install
npm run dev
```

### 运行 React 示例

```bash
cd examples/react/
npm install
npm run dev
```

## 📋 日志文件位置

所有示例的日志文件都会统一输出到项目根目录的 `logs/` 目录下：

- `logs/basic.log` - 基础示例的日志
- `logs/nextjs.log` - Next.js 示例的日志
- `logs/errors.log` - 错误专用日志（如果配置了）
- `logs/multi.log` - 多输出示例的日志

## 🔄 API 迁移指南

如果你正在从老版本迁移到 v0.7.0-alpha.2，以下是主要的 API 变更：

### 服务端 API 变更

```typescript
// 老 API (v0.6.x)
import { createNextjsServerLogger } from 'loglayer-support'
const serverInstance = await createNextjsServerLogger(config)
const logger = serverInstance.logger

// 新 API (v0.7.0-alpha.2)
import { createLogger } from 'loglayer-support'
const logger = await createLogger('app-name', config)

// 错误记录变更
// 老 API
logger.logError(error, metadata, message)

// 新 API
logger.error(message, { ...metadata, error, errorName: error.name, errorStack: error.stack })
```

### 浏览器端 API 变更

```typescript
// 老 API
import type { IBrowserLogger } from 'loglayer-support'
const logger: IBrowserLogger = createBrowserLoggerSync(config)

// 新 API
import type { LogLayer } from 'loglayer'
const logger: LogLayer = createBrowserLoggerSync(config)

// 性能日志变更
// 老 API
logger.logPerformance(operation, duration, metadata)

// 新 API
logger.info(`Performance: ${operation}`, {
  operation,
  duration,
  performanceType: 'measurement',
  ...metadata
})
```

## 🔍 故障排除

### SLS 配置问题

如果看到以下警告信息：
```
[LogLayer SLS] 缺少必需的 SLS 配置，请检查环境变量
```

请检查：
1. 环境变量是否正确设置
2. `.env` 文件是否在正确位置
3. 环境变量名称是否正确拼写

### 权限问题

如果 SLS 发送失败，请检查：
1. 访问密钥是否有效
2. 密钥是否有写入指定 logstore 的权限
3. 网络连接是否正常

## 🛡️ 安全最佳实践

1. **密钥管理**
   - 定期轮换访问密钥
   - 使用最小权限原则配置密钥权限
   - 生产环境使用专用的密钥管理服务

2. **环境隔离**
   - 开发、测试、生产环境使用不同的 SLS 项目和密钥
   - 不同环境的配置完全分离

3. **监控告警**
   - 配置 SLS 使用量监控
   - 设置异常访问告警

4. **代码审查**
   - 确保代码中不包含任何硬编码的敏感信息
   - 定期检查是否有意外提交的密钥信息

## 📚 参考资料

- [LogLayer 官方文档](https://github.com/loglayer/loglayer)
- [v0.7.0-alpha.2 发布说明](../RELEASE-NOTES-v0.7.0-alpha.2.md)
- [迁移指南](../docs/migration-guide.md)
- [最佳实践](../docs/best-practices.md)