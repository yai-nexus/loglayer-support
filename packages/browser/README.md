# @yai-loglayer/browser

[![npm version](https://badge.fury.io/js/@yai-loglayer%2Fbrowser.svg)](https://www.npmjs.com/package/@yai-loglayer/browser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **浏览器端日志解决方案** - 为现代 Web 应用提供开箱即用的浏览器端日志功能

> 这是 `@yai-loglayer/*` 包系列的浏览器端模块，专为浏览器环境优化。

## 特性

- 🌐 浏览器环境优化
- 📱 本地存储支持
- 🔄 批量上报功能
- 🎨 Console 彩色输出
- 📊 会话管理

## 安装

```bash
pnpm add @yai-loglayer/browser
```

## 快速开始

```typescript
import { createBrowserLoggerSync } from '@yai-loglayer/browser';

// 开发环境默认配置
const logger = createBrowserLoggerSync();

// 自定义配置
const logger = createBrowserLoggerSync({
  level: 'info',
  outputs: {
    console: { colorized: true, groupCollapsed: true },
    localStorage: { key: 'app-logs', maxEntries: 200 },
  },
});

logger.info('Hello from browser!');
```

## 高级用法

### 批量上报

```typescript
import { createBrowserLoggerSync } from '@yai-loglayer/browser';

const logger = createBrowserLoggerSync({
  outputs: {
    http: {
      url: '/api/logs',
      method: 'POST',
      batchSize: 10,
      flushInterval: 5000,
    },
  },
});
```

### 本地存储

```typescript
const logger = createBrowserLoggerSync({
  outputs: {
    localStorage: {
      key: 'my-app-logs',
      maxEntries: 500,
      serialize: true,
    },
  },
});
```

## 相关包

- [`@yai-loglayer/core`](../core/) - 核心类型定义和工具函数
- [`@yai-loglayer/server`](../server/) - 服务端日志解决方案
- [`@yai-loglayer/receiver`](../receiver/) - 日志接收器
- [`@yai-loglayer/sls-transport`](../sls-transport/) - SLS 传输组件

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。

## 许可证

MIT License
