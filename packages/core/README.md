# @yai-loglayer/core

[![npm version](https://badge.fury.io/js/@yai-loglayer%2Fcore.svg)](https://www.npmjs.com/package/@yai-loglayer/core)

loglayer-support 的核心类型定义和工具函数包。

> 这是 `@yai-loglayer/*` 包系列的核心模块，提供通用的类型定义和工具函数。

## 特性

- 🔧 核心类型定义
- ⚙️ 配置验证工具
- 🛠️ 通用工具函数
- 🎯 环境检测功能

## 安装

```bash
pnpm add @yai-loglayer/core
```

## 使用

```typescript
import { LoggerConfig, validateConfig } from '@yai-loglayer/core';

const config: LoggerConfig = {
  level: 'info',
  outputs: {
    console: { colorized: true },
  },
};

validateConfig(config);
```

## 相关包

- [`@yai-loglayer/browser`](../browser/) - 浏览器端日志封装
- [`@yai-loglayer/server`](../server/) - 服务端日志解决方案
- [`@yai-loglayer/receiver`](../receiver/) - 日志接收器
- [`@yai-loglayer/sls-transport`](../sls-transport/) - SLS 传输组件

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。

## 许可证

MIT License
