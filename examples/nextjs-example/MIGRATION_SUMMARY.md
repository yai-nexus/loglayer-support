# Next.js Example 迁移总结

## 概述

已成功将 `examples/nextjs-example` 从使用多个独立的 `@yai-loglayer/*` 包迁移到使用统一的 `@yai-loglayer/next` 包。

## 🔄 迁移内容

### 删除的文件和依赖

#### 删除的文件

- `lib/client-logger.ts` - 原有的复杂客户端日志配置
- `lib/server-logger.ts` - 原有的复杂服务端日志配置
- `examples/business-integration/` - 旧的业务集成示例目录

#### 删除的依赖

```json
// 原有依赖
"@yai-loglayer/browser": "workspace:*",
"@yai-loglayer/core": "workspace:*",
"@yai-loglayer/receiver": "workspace:*",
"@yai-loglayer/server": "workspace:*",
"@yai-loglayer/sls-transport": "workspace:*",
"dotenv": "^16.6.1",
"loglayer": "^6.6.0"

// 新依赖（只需要一个）
"@yai-loglayer/next": "workspace:*"
```

### 新增的文件

#### 核心页面

- `app/layout.tsx` - 更新为使用 `LoggerProvider`
- `app/page.tsx` - 更新为使用新的 Hooks API
- `app/components/page.tsx` - 新增组件日志演示页面
- `app/server-actions/page.tsx` - 新增 Server Actions 演示页面
- `app/server-actions/actions.ts` - Server Actions 实现

#### API路由

- `app/api/client-logs/route.ts` - 更新为使用 `createNextjsLogReceiver`

#### 测试和配置

- `__tests__/logger.test.ts` - 新增单元测试
- `jest.config.js` - Jest 配置
- `jest.setup.js` - Jest 设置
- `README.md` - 完全重写的文档
- `MIGRATION_SUMMARY.md` - 本迁移总结文档

## 📊 代码简化对比

### 原有的复杂实现

#### lib/client-logger.ts (100+ 行)

```typescript
// 复杂的环境变量读取
const getEnv = (key: string, defaultValue = ''): string => {
  try {
    return (
      process.env[key] ||
      (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.[key]) ||
      defaultValue
    );
  } catch {
    return defaultValue;
  }
};

// 复杂的配置构建
const createConfig = (): YAILogLayerConfig => {
  const nodeEnv = getEnv('NODE_ENV', 'development');
  const slsEnabled = getEnv('NEXT_PUBLIC_SLS_ENABLED') === 'true';
  // ... 大量配置逻辑
};

// 异步初始化
let loggerInstance: any = null;
let initPromise: Promise<any> | null = null;

const initLogger = async () => {
  // ... 复杂的异步初始化逻辑
};

export const logger: LoggerInterface = {
  debug: async (message: string, data?: any) => {
    const log = await initLogger();
    log.debug(message, { data, service: config.app.name, environment: 'client' });
  },
  // ... 其他异步方法
};
```

#### lib/server-logger.ts (80+ 行)

```typescript
// 复杂的服务端配置
const createServerConfig = (): ServerLoggerConfig => {
  // ... 大量配置逻辑
};

// 异步初始化
let serverLoggerInstance: any = null;
let serverInitPromise: Promise<any> | null = null;

export const getServerInstance = async (): Promise<any> => {
  // ... 复杂的异步初始化逻辑
};
```

### 新的简化实现

#### app/layout.tsx (简单配置)

```tsx
import { LoggerProvider } from '@yai-loglayer/next';

export default function RootLayout({ children }) {
  return (
    <LoggerProvider
      config={{
        appName: 'nextjs-example',
        shared: {
          environment: (process.env.NODE_ENV as any) || 'development',
          level: 'debug',
          enableSls: process.env.NODE_ENV === 'production',
        },
      }}
    >
      {children}
    </LoggerProvider>
  );
}
```

#### 组件中使用 (极简)

```tsx
import { useComponentLogger } from '@yai-loglayer/next';

function MyComponent() {
  const logger = useComponentLogger('MyComponent');

  // 立即可用，无需 await
  logger.info('组件操作', { action: 'button-click' });
}
```

#### Server Actions (简单)

```tsx
'use server';
import { createNextjsServerLogger } from '@yai-loglayer/next';

const serverLogger = createNextjsServerLogger({
  appName: 'nextjs-example-actions',
});

export async function createUser(formData: FormData) {
  serverLogger.info('开始创建用户', { name: formData.get('name') });
  // ... 业务逻辑
}
```

## 🎯 功能增强

### 新增功能

1. **React 深度集成**
   - `LoggerProvider` 组件
   - `useComponentLogger` Hook
   - `usePerformanceLogger` Hook
   - `useLogging` Hook

2. **自动化功能**
   - 自动组件生命周期日志
   - 自动性能测量
   - 智能配置推断

3. **更好的开发体验**
   - 同步返回，立即可用
   - 完整的 TypeScript 类型支持
   - 更好的错误处理和降级

### 保持的功能

1. **所有原有输出方式**
   - Console 输出
   - HTTP 上报
   - 文件日志（服务端）
   - SLS 上报

2. **配置灵活性**
   - 环境变量自动读取
   - 自定义配置支持
   - 多环境适配

## 📈 改进效果

| 方面         | 原有实现  | 新实现   | 改善程度 |
| ------------ | --------- | -------- | -------- |
| 配置代码行数 | 180+      | 10       | 减少95%  |
| 依赖包数量   | 7个       | 1个      | 减少86%  |
| 异步处理     | 需要await | 同步返回 | 完全简化 |
| React集成    | 无        | 原生支持 | 全新功能 |
| 类型安全     | 部分      | 完整     | 显著提升 |
| 开发体验     | 复杂      | 极简     | 大幅改善 |

## 🧪 测试覆盖

### 新增测试

- 单元测试：`__tests__/logger.test.ts`
- 功能测试：各个演示页面
- 集成测试：API 路由和 Server Actions

### 测试场景

- 基础日志功能
- React Hooks 集成
- Server Actions 日志
- 错误处理和降级
- 性能监控

## 🚀 部署和使用

### 开发环境

```bash
npm install
npm run dev
```

### 生产环境

```bash
npm run build
npm start
```

### 测试

```bash
npm test
npm run test:e2e
```

## 📝 迁移指南

对于其他项目想要迁移到 `@yai-loglayer/next`：

1. **替换依赖**

   ```bash
   npm uninstall @yai-loglayer/browser @yai-loglayer/server @yai-loglayer/receiver
   npm install @yai-loglayer/next
   ```

2. **更新代码**
   - 删除复杂的配置文件
   - 在根布局中添加 `LoggerProvider`
   - 使用新的 Hooks API

3. **更新 API 路由**
   - 使用 `createNextjsLogReceiver`
   - 简化配置

4. **更新 Server Actions**
   - 使用 `createNextjsServerLogger`
   - 简化日志记录

## ✅ 验证清单

- [x] 删除所有旧的依赖和文件
- [x] 更新为使用 `@yai-loglayer/next`
- [x] 实现 React 集成（Provider + Hooks）
- [x] 创建组件日志演示
- [x] 创建 Server Actions 演示
- [x] 更新 API 路由
- [x] 添加单元测试
- [x] 更新文档
- [x] 验证所有功能正常工作

## 🎉 总结

这次迁移成功地将复杂的多包配置简化为单一的统一包，大幅提升了开发体验，同时保持了所有原有功能并新增了 React 深度集成功能。新的实现更加简洁、类型安全，并且提供了更好的开发者体验。
