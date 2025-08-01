# @yai-loglayer/server

[![npm version](https://badge.fury.io/js/@yai-loglayer%2Fserver.svg)](https://www.npmjs.com/package/@yai-loglayer/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🖥️ **服务端日志解决方案** - 为 Node.js 应用提供企业级日志功能

> 这是 `@yai-loglayer/*` 包系列的服务端模块，专为 Node.js 环境优化。

## 特性

- 🖥️ Node.js 环境优化
- 📁 文件日志输出
- 🔄 日志轮转支持
- 🎯 多种传输器支持 (Pino, Winston)
- ⚙️ 灵活的配置选项

## 安装

```bash
pnpm add @yai-loglayer/server
```

## 快速开始

```typescript
import { createServerLogger } from '@yai-loglayer/server'

// 开发环境默认配置
const logger = await createServerLogger('my-app')

// 自定义配置
const logger = await createServerLogger('my-app', {
  level: { default: 'info' },
  server: {
    outputs: [
      { type: 'stdout' },
      {
        type: 'file',
        config: {
          dir: './logs',
          filename: 'app.log'
        }
      }
    ]
  }
})

logger.info('Hello from server!')
```

## 高级用法

### Next.js 集成

```typescript
import { createNextjsServerLogger } from '@yai-loglayer/server'

export const serverLogger = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' },
    auth: { level: 'warn' }
  },
  performance: { enabled: true },
  healthCheck: { enabled: true }
})
```

### 文件日志轮转

```typescript
const logger = await createServerLogger('my-app', {
  level: { default: 'info' },
  server: {
    outputs: [
      {
        type: 'file',
        config: {
          dir: './logs',
          filename: 'app.log',
          rotation: {
            maxSize: '10MB',
            maxFiles: 5
          }
        }
      }
    ]
  }
})
```

### SLS (阿里云日志服务) 支持

```typescript
const logger = await createServerLogger('my-app', {
  level: { default: 'info' },
  server: {
    outputs: [
      { type: 'stdout' },
      {
        type: 'sls',
        config: {
          accessKeyId: 'your-access-key-id',
          accessKeySecret: 'your-access-key-secret',
          endpoint: 'your-sls-endpoint',
          project: 'your-project',
          logstore: 'your-logstore'
        }
      }
    ]
  }
})
```

## 相关包

- [`@yai-loglayer/core`](../core/) - 核心类型定义和工具函数
- [`@yai-loglayer/browser`](../browser/) - 浏览器端日志封装
- [`@yai-loglayer/receiver`](../receiver/) - 日志接收器
- [`@yai-loglayer/sls-transport`](../sls-transport/) - SLS 传输组件

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。

## 许可证

MIT License