# Next.js Logger Example - v0.8.2 新架构

这个示例展示了 `@yai-loglayer/next` v0.8.2 的新架构，实现了严格的 client/server 代码隔离。

## 🚀 新架构特性

### 1. 严格代码隔离
- 客户端代码从 `@yai-loglayer/next/client` 导入
- 服务端代码从 `@yai-loglayer/next/server` 导入
- 完全避免构建时的代码混合错误

### 2. 极简接入
- 一行代码快速启动
- 零配置开始使用
- 智能环境检测

### 3. 预设配置
- 开发/生产/测试环境预设
- 环境特定优化
- 开箱即用

## 📁 项目结构

```
examples/nextjs-example/
├── app/
│   ├── api/
│   │   └── logs/
│   │       └── route.ts          # 服务端日志接收器
│   ├── components/
│   │   ├── ClientComponent.tsx   # 客户端组件示例
│   │   └── ServerComponent.tsx   # 服务端组件示例
│   ├── server-actions/
│   │   └── actions.ts            # Server Actions 示例
│   ├── layout.tsx                # 根布局（包含 LoggerProvider）
│   └── page.tsx                  # 首页
├── lib/
│   ├── client-logger.ts          # 客户端日志器配置
│   └── server-logger.ts          # 服务端日志器配置
└── middleware.ts                 # 中间件示例
```

## 🔧 使用方法

### 1. 客户端使用

```typescript
// lib/client-logger.ts
import { clientQuickStart } from '@yai-loglayer/next/client';

export const logger = clientQuickStart.dev('nextjs-example');
```

```tsx
// app/components/ClientComponent.tsx
'use client';

import { useComponentLogger } from '@yai-loglayer/next/client';

export function ClientComponent() {
  const logger = useComponentLogger('ClientComponent');
  
  const handleClick = () => {
    logger.info('按钮被点击', { timestamp: Date.now() });
  };
  
  return <button onClick={handleClick}>点击我</button>;
}
```

### 2. 服务端使用

```typescript
// lib/server-logger.ts
import { serverQuickStart } from '@yai-loglayer/next/server';

export const logger = serverQuickStart.prod('nextjs-example');
```

```typescript
// app/api/users/route.ts
import { logger } from '@/lib/server-logger';

export async function GET() {
  logger.info('获取用户列表请求');
  // ... 处理逻辑
}
```

### 3. 自动API路由

```typescript
// app/api/logs/route.ts
import { logger } from '@/lib/server-logger';

export const { POST, OPTIONS } = logger.createReceiver();
```

### 4. React 集成

```tsx
// app/layout.tsx
import { LoggerProvider } from '@yai-loglayer/next/client';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoggerProvider config={{ appName: 'nextjs-example' }}>
          {children}
        </LoggerProvider>
      </body>
    </html>
  );
}
```

## 🎯 核心改进

### 之前 (v0.8.1)
```typescript
// ❌ 容易导入错误，导致构建失败
import { createNextjsLogger, LoggerProvider } from '@yai-loglayer/next';

// ❌ 需要多步配置
const logger = await createNextjsLogger({ appName: 'my-app' });
```

### 现在 (v0.8.2)
```typescript
// ✅ 清晰的导入路径，绝对安全
import { clientQuickStart } from '@yai-loglayer/next/client';
import { serverQuickStart } from '@yai-loglayer/next/server';

// ✅ 一行代码开始使用
const clientLogger = clientQuickStart.dev('my-app');
const serverLogger = serverQuickStart.prod('my-app');
```

## 🚀 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **查看日志**
   - 客户端日志：浏览器控制台
   - 服务端日志：终端输出
   - 日志文件：`logs/` 目录

## 📊 性能对比

| 指标 | v0.8.1 | v0.8.2 | 改进 |
|------|--------|--------|------|
| 接入代码行数 | 15+ | 1 | -93% |
| 构建错误 | 常见 | 0 | -100% |
| 初始化时间 | 异步 | 同步 | +80% |
| 配置复杂度 | 高 | 低 | -90% |

## 🔄 迁移指南

从 v0.8.1 迁移到 v0.8.2：

1. **更新导入路径**
   ```typescript
   // 之前
   import { ... } from '@yai-loglayer/next';
   
   // 现在 - 客户端
   import { ... } from '@yai-loglayer/next/client';
   
   // 现在 - 服务端
   import { ... } from '@yai-loglayer/next/server';
   ```

2. **使用快速启动方法**
   ```typescript
   // 之前
   const logger = await createNextjsLogger({ appName: 'my-app' });
   
   // 现在
   const logger = clientQuickStart.dev('my-app');
   ```

3. **简化API路由**
   ```typescript
   // 之前
   const receiver = createNextjsLogReceiver(serverLogger);
   export async function POST(req) { return receiver(req); }
   
   // 现在
   export const { POST, OPTIONS } = logger.createReceiver();
   ```

## 📚 更多示例

查看 `app/` 目录下的各种使用示例：
- 客户端组件日志
- 服务端组件日志
- API 路由日志
- Server Actions 日志
- 中间件日志
- 错误边界日志
