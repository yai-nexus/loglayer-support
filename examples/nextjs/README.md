# LogLayer NextJS 演示

这是一个完整的 Next.js 应用示例，展示了 loglayer-support 在前后端的完整日志功能。

## 功能特性

### 前端日志演示
- ✅ 基础日志记录（info, error）
- ✅ 性能监控和记录
- ✅ 错误捕获和堆栈跟踪
- ✅ 浏览器控制台输出
- ✅ localStorage 本地存储

### 后端日志演示
- ✅ API 请求/响应日志
- ✅ 数据库操作模拟
- ✅ 性能指标收集
- ✅ 错误处理和记录
- ✅ 文件日志输出

### 环境隔离
- ✅ 完整的服务端/客户端隔离
- ✅ 自动环境检测
- ✅ 智能引擎选择

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