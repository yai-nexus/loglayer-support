# @yai-loglayer/next 入口文件说明

## 📁 入口文件结构

@yai-loglayer/next 提供了三个主要的入口文件，每个都有明确的用途：

```
@yai-loglayer/next           # 主入口 - 类型和通用导出
@yai-loglayer/next/client    # 客户端专用 - 浏览器端安全
@yai-loglayer/next/server-only # 服务端专用 - 服务端功能
```

## 🌐 客户端入口 (`/client`)

**文件位置**: `src/client.ts` → `dist/client.js`

**用途**: 专门用于客户端组件、页面和浏览器端代码

**特点**:

- ✅ 客户端构建安全
- ✅ 不包含任何服务端代码
- ✅ 支持 React 组件和 Hooks
- ✅ 支持浏览器端日志记录

### 使用示例

```typescript
// app/layout.tsx - 根布局
import { LoggerProvider } from '@yai-loglayer/next/client'

export default function RootLayout({ children }) {
  return (
    <LoggerProvider config={{ appName: 'my-app' }}>
      {children}
    </LoggerProvider>
  )
}

// components/MyComponent.tsx - 客户端组件
'use client'
import { useComponentLogger } from '@yai-loglayer/next/client'

export function MyComponent() {
  const logger = useComponentLogger('MyComponent')

  const handleClick = () => {
    logger.info('按钮点击', { timestamp: Date.now() })
  }

  return <button onClick={handleClick}>点击我</button>
}
```

## 🖥️ 服务端入口 (`/server-only`)

**文件位置**: `src/server-only.ts` → `dist/server-only.js`

**用途**: 专门用于服务端代码，包括 API 路由、Server Actions 和服务端组件

**特点**:

- ✅ 预定义日志器实例，极简接入
- ✅ 自动环境配置
- ✅ 支持文件日志和 SLS 日志
- ✅ 包含日志接收器功能

### 预定义日志器实例

```typescript
// 四个预定义的日志器实例，开箱即用
import {
  logger, // 通用日志器
  apiLogger, // API 路由专用
  dbLogger, // 数据库操作专用
  actionLogger, // Server Actions 专用
} from '@yai-loglayer/next/server-only';
```

### 使用示例

```typescript
// app/server-actions/actions.ts - Server Actions
'use server';
import { actionLogger } from '@yai-loglayer/next/server-only';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;

  // 一行代码记录日志，无需配置
  actionLogger.info('创建用户', { name, action: 'createUser' });

  try {
    // 业务逻辑...
    actionLogger.info('用户创建成功', { name, userId: 'user_123' });
    return { success: true };
  } catch (error) {
    actionLogger.error('用户创建失败', { name, error });
    return { success: false };
  }
}

// app/api/users/route.ts - API 路由
import { apiLogger, dbLogger } from '@yai-loglayer/next/server-only';

export async function GET() {
  const requestId = `req_${Date.now()}`;

  apiLogger.info('获取用户列表', { requestId });

  try {
    // 数据库查询
    dbLogger.debug('查询用户表', { table: 'users', requestId });
    const users = await queryUsers();

    apiLogger.info('用户列表获取成功', { requestId, count: users.length });
    return Response.json(users);
  } catch (error) {
    apiLogger.error('用户列表获取失败', { requestId, error });
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// lib/database.ts - 数据库操作
import { dbLogger } from '@yai-loglayer/next/server-only';

export async function queryUsers() {
  dbLogger.debug('开始查询用户', { operation: 'SELECT * FROM users' });

  try {
    // 数据库查询逻辑...
    const users = [];
    dbLogger.info('用户查询成功', { count: users.length });
    return users;
  } catch (error) {
    dbLogger.error('用户查询失败', { error: error.message });
    throw error;
  }
}

// app/api/client-logs/route.ts - 日志接收器
import { createNextjsLogReceiver, logger } from '@yai-loglayer/next/server-only';

const logReceiver = createNextjsLogReceiver(await logger.withContext({ module: 'client-logs' }), {
  validation: { requireLevel: true },
  processing: { supportBatch: true },
});

export async function POST(request: Request) {
  return logReceiver(request);
}
```

## 🎯 主入口 (`@yai-loglayer/next`)

**文件位置**: `src/index.ts` → `dist/index.js`

**用途**: 主要导出类型定义和通用接口，客户端构建安全

**特点**:

- ✅ 只导出类型，不导出函数
- ✅ 客户端构建安全
- ✅ 提供完整的 TypeScript 类型支持

### 使用示例

```typescript
// 导入类型定义
import type { NextjsLoggerConfig, NextjsLoggerPair, LoggerContextValue } from '@yai-loglayer/next';

// 类型安全的配置
const config: NextjsLoggerConfig = {
  appName: 'my-app',
  shared: {
    environment: 'development',
    level: 'debug',
  },
};
```

## 📋 最佳实践

### ✅ 正确使用

```typescript
// ✅ 在客户端组件中
import { useComponentLogger } from '@yai-loglayer/next/client';

// ✅ 在 Server Actions 中
import { actionLogger } from '@yai-loglayer/next/server-only';

// ✅ 在 API 路由中
import { apiLogger } from '@yai-loglayer/next/server-only';

// ✅ 类型导入
import type { NextjsLoggerConfig } from '@yai-loglayer/next';
```

### ❌ 错误使用

```typescript
// ❌ 在客户端组件中使用服务端代码
import { logger } from '@yai-loglayer/next/server-only'; // 会导致构建错误

// ❌ 在服务端使用客户端专用代码
import { useComponentLogger } from '@yai-loglayer/next/client'; // 在服务端无效
```

## 🚀 极简接入优势

通过预定义的日志器实例，实现了真正的极简接入：

1. **无需配置**: 自动检测环境，智能配置
2. **一行代码**: 直接导入使用，无需初始化
3. **类型安全**: 完整的 TypeScript 支持
4. **模块化**: 不同场景使用不同的专用日志器

这种设计让开发者可以用最少的代码获得最完整的日志功能！
