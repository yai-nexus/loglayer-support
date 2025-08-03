# @yai-loglayer/receiver

[![npm version](https://badge.fury.io/js/@yai-loglayer%2Freceiver.svg)](https://www.npmjs.com/package/@yai-loglayer/receiver)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

📨 **日志接收器** - 用于接收和处理来自客户端的日志数据

> 这是 `@yai-loglayer/*` 包系列的日志接收器模块，提供企业级日志收集功能。

## 特性

- 📡 HTTP 日志接收
- 🔄 批量日志处理
- 🎯 多种存储后端支持
- 🛡️ 数据验证和清洗
- 📊 统计和监控功能

## 安装

```bash
pnpm add @yai-loglayer/receiver
```

## 快速开始

```typescript
import { createLogReceiverSync } from '@yai-loglayer/receiver';

// 创建日志接收器
const receiver = createLogReceiverSync({
  port: 3001,
  endpoints: {
    '/api/logs': {
      method: 'POST',
      maxBatchSize: 100,
    },
  },
  storage: {
    type: 'alicloud',
    config: {
      project: 'your-project',
      logstore: 'your-logstore',
    },
  },
});

// 启动接收器
receiver.start();
```

## 高级用法

### Next.js API 路由集成

```typescript
// app/api/logs/route.ts
import { createNextjsLogReceiver } from '@yai-loglayer/receiver';
import { serverLogger } from '../../../lib/server-logger';

export const POST = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    maxMessageLength: 2000,
  },
  processing: {
    supportBatch: true,
    maxBatchSize: 50,
  },
  security: {
    rateLimiting: {
      maxRequestsPerMinute: 100,
    },
  },
});
```

### 自定义存储后端

```typescript
const receiver = createLogReceiverSync({
  storage: {
    type: 'custom',
    handler: async (logs) => {
      // 自定义存储逻辑
      await saveToDatabase(logs);
    },
  },
});
```

### 数据验证和清洗

```typescript
const receiver = createLogReceiverSync({
  validation: {
    schema: {
      level: { required: true, type: 'string' },
      message: { required: true, maxLength: 1000 },
      timestamp: { required: true, type: 'number' },
    },
    sanitize: true,
    dropInvalid: false,
  },
});
```

## 相关包

- [`@yai-loglayer/core`](../core/) - 核心类型定义和工具函数
- [`@yai-loglayer/browser`](../browser/) - 浏览器端日志封装
- [`@yai-loglayer/server`](../server/) - 服务端日志解决方案
- [`@yai-loglayer/sls-transport`](../sls-transport/) - SLS 传输组件

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。

## 许可证

MIT License
