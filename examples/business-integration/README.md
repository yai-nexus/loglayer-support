# 日志器使用示例

## 🎯 示例目标

展示如何使用新版日志器进行极简业务接入，从复杂的 100+ 行代码简化到 10 行。

## 📁 文件说明

```
examples/business-integration/
├── logger.config.ts           # 配置示例（基础配置 + 完整配置）
├── server-logger-new.ts       # 日志器使用示例
├── usage-examples.ts          # 各种场景的使用示例
├── test-new-logger.ts         # 功能测试
├── .env.example              # 环境变量配置示例
├── migration-guide.md         # 迁移指南
└── README.md                  # 本文件
```

## 🚀 快速开始

### 1. 创建配置文件

```typescript
// logger.config.ts
import type { AutoLoggerConfig } from '@yai-loglayer/server';

export const loggerConfig: AutoLoggerConfig = {
  app: {
    name: 'your-app-name',
    environment: 'auto',        // 自动检测
    version: 'auto'             // 自动从 package.json 读取
  },
  outputs: {
    console: { enabled: 'auto' },  // 开发环境自动启用
    file: { 
      enabled: true, 
      path: 'auto',              // 自动检测项目根目录
      filename: 'app.log'
    },
    sls: { 
      enabled: 'auto',           // 根据环境变量自动启用
      config: 'env'              // 从环境变量自动读取
    }
  }
};

export default loggerConfig;
```

### 2. 创建日志器

```typescript
// server-logger.ts
import { createAutoLogger } from '@yai-loglayer/server';
import loggerConfig from './logger.config';

// 一行代码完成所有配置
export const logger = createAutoLogger(loggerConfig);

// 直接使用，无需 await
logger.info('Hello World');
logger.error('Error occurred', { error: 'details' });

export default logger;
```

### 3. 设置环境变量（可选）

参考 `.env.example` 文件进行配置。

## 📝 使用示例

### 基础日志记录
```typescript
import { logger } from './server-logger-new';

logger.info('用户登录', { userId: 123, ip: '192.168.1.1' });
logger.error('数据库错误', { error: 'Connection failed' });
```

### API 请求追踪
```typescript
import { logApiRequest, logApiResponse } from './server-logger-new';

const traceId = logApiRequest('POST', '/api/users', { name: 'John' });
// ... 处理请求
logApiResponse(traceId, 'POST', '/api/users', 200, 150);
```

### 业务流程追踪
```typescript
import { generateTraceId, logger } from './server-logger-new';

const traceId = generateTraceId();
logger.info('开始处理订单', { traceId, orderId: 12345 });
logger.info('订单处理完成', { traceId, orderId: 12345, result: 'success' });
```

## 🧪 测试验证

```bash
# 运行功能测试
npx ts-node examples/business-integration/test-new-logger.ts
```

## 📚 更多示例

- `usage-examples.ts` - 各种场景的详细使用示例
- `migration-guide.md` - 从旧版本迁移的详细指南
- `.env.example` - 环境变量配置示例

## 🔧 核心特性

- ✅ **智能配置**：`auto` 模式自动检测环境和配置
- ✅ **零配置启动**：开发环境无需任何配置即可使用
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **配置验证**：友好的错误提示和建议
- ✅ **多输出支持**：控制台、文件、SLS 等多种输出方式
