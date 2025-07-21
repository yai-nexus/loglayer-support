# LogLayer 示例配置说明

本目录包含了 LogLayer 的使用示例，展示了如何在不同环境下安全地配置日志系统。

## 🔒 安全配置重要提醒

**⚠️ 敏感信息保护**
- 所有的访问密钥、密码等敏感信息都应该通过环境变量配置
- **绝对不要**将真实的凭据硬编码在代码中
- **绝对不要**将包含敏感信息的 `.env` 文件提交到版本控制系统

## 📁 示例目录

### basic/
基础使用示例，展示各种输出配置和功能特性。这是一个独立的模块化包，包含：
- **模块化设计**：将不同功能拆分为独立的示例文件
- **5个核心示例**：预设配置、自定义配置、增强功能、生产环境、多输出配置
- **独立运行**：每个示例都可以单独运行和测试
- **完整文档**：包含详细的使用说明和配置指南

### nextjs/
Next.js 项目集成示例，展示前后端日志配置。

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

### 运行基础示例

```bash
cd basic/

# 安装依赖（首次运行）
npm install

# 开发模式运行所有示例（推荐）
npm run dev

# 或者运行单个示例
npm run example:presets      # 示例1: 预设配置
npm run example:custom       # 示例2: 自定义配置
npm run example:enhanced     # 示例3: 增强功能
npm run example:production   # 示例4: 生产环境
npm run example:multiple     # 示例5: 多输出配置

# 构建并运行
npm run build
npm start
```

### 运行 Next.js 示例

```bash
cd nextjs/
npm install
npm run dev
```

## 📋 日志文件位置

所有示例的日志文件都会统一输出到项目根目录的 `logs/` 目录下：

- `logs/basic.log` - 基础示例的日志
- `logs/nextjs.log` - Next.js 示例的日志
- `logs/errors.log` - 错误专用日志（如果配置了）

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