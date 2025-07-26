# LogLayer NextJS 演示 - v0.7.0-alpha.2

这是一个完整的 Next.js 应用示例，展示了 loglayer-support v0.7.0-alpha.2 的新 LogLayer API 功能。

## 🆕 新功能展示

### 🌐 浏览器端日志器 (createBrowserLoggerSync)
- ✅ 直接返回 LogLayer 实例
- ✅ 多输出支持（Console + LocalStorage + HTTP）
- ✅ 类型安全的 TypeScript 支持
- ✅ 彩色控制台输出
- ✅ 简洁的配置API

### 🖥️ 服务端日志器 (createLogger)
- ✅ 直接返回 LogLayer 实例
- ✅ 自动 pino/winston transport 回退
- ✅ 统一的配置格式
- ✅ 更好的错误处理
- ✅ 文件和控制台输出

### 📨 日志接收器 (createNextjsLogReceiver)
- ✅ 适配新的 LogLayer API
- ✅ 自动验证和安全检查
- ✅ 批量处理支持
- ✅ 速率限制
- ✅ 错误重建

## 🆕 v0.7.0-alpha.2 主要变更

- **API 简化**：直接使用 LogLayer 实例，不再使用包装器
- **方法更新**：`logError` → `error` + metadata
- **类型安全**：更好的 TypeScript 支持

## 快速开始

### 1. 安装依赖

```bash
cd examples/nextjs
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问: http://localhost:3000

## 📝 API 迁移示例

该示例展示了如何从 v0.6.x 迁移到 v0.7.0-alpha.2：

### 服务端变更
```typescript
// 老 API
import { createNextjsServerLogger } from '@yai-loglayer/server'
const serverInstance = await createNextjsServerLogger(config)
const logger = serverInstance.logger

// 新 API
import { createLogger } from '@yai-loglayer/server'
const logger = await createLogger('nextjs-server', config)
```

### 错误处理变更
```typescript
// 老 API
logger.logError(error, metadata, 'Custom message')

// 新 API
logger.error('Custom message', {
  ...metadata,
  error,
  errorName: error.name,
  errorStack: error.stack
})
```

## 日志输出位置

### 客户端日志
- **浏览器控制台**: 实时查看所有客户端日志
- **localStorage**: 本地持久化存储（key: `app-logs`）
- **HTTP 上报**: 发送到 `/api/client-logs` 端点

### 服务端日志
- **控制台输出**: 开发时实时查看
- **文件输出**: `logs/nextjs-server.log`（如果配置了文件输出）

## 测试功能

### 客户端测试按钮
- **触发 Info 日志**: 测试普通信息日志
- **触发 Error 日志**: 测试错误日志和堆栈跟踪
- **性能测试**: 测试性能监控功能
- **模拟崩溃**: 测试错误捕获和上报

### 服务端测试
- **调用测试 API**: 触发服务端日志、数据库操作模拟、性能监控

## Playwright 测试

所有交互元素都设置了 `data-testid` 属性，便于自动化测试：

- `info-log-btn`: Info 日志按钮
- `error-log-btn`: Error 日志按钮  
- `performance-test-btn`: 性能测试按钮
- `crash-simulation-btn`: 崩溃模拟按钮
- `api-call-btn`: API 调用按钮
- `api-status`: API 状态显示
- `log-display`: 日志显示区域

### 示例测试代码

```typescript
import { test, expect } from '@playwright/test';

test('logging functionality', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 测试客户端日志
  await page.click('[data-testid="info-log-btn"]');
  await page.click('[data-testid="error-log-btn"]');
  
  // 测试 API 调用
  await page.click('[data-testid="api-call-btn"]');
  
  // 验证状态更新
  await expect(page.locator('[data-testid="api-status"]'))
    .toContainText('✅ 成功');
  
  // 验证日志显示
  await expect(page.locator('[data-testid="log-display"]'))
    .toContainText('已触发 Info 日志');
});
```

## 配置说明

### 开发环境配置
- 客户端：控制台输出
- 服务端：控制台 + 文件输出

### 生产环境配置  
- 客户端：HTTP 上报（仅错误级别）
- 服务端：SLS 上报（警告及以上级别）

## API 端点

### `/api/test`
- **POST**: 测试服务端日志功能
- **GET**: 健康检查

### `/api/client-logs`  
- **POST**: 接收客户端日志上报
- **GET**: 查看日志服务状态

## 文件结构

```
examples/nextjs/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面（所有演示功能）
│   └── api/
│       ├── test/route.ts   # 测试 API
│       └── client-logs/route.ts  # 客户端日志接收
├── middleware.ts           # Next.js 中间件
├── logger.ts              # Logger 配置
├── package.json           # 项目配置
├── next.config.js         # Next.js 配置
└── tsconfig.json          # TypeScript 配置
```

这个示例展示了 loglayer-support 在真实 Next.js 项目中的完整使用方式，包括前后端隔离、性能监控、错误处理等所有核心功能。