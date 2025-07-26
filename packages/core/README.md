# @yai-loglayer/core

loglayer-support 的核心类型定义和工具函数包。

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
import { LoggerConfig, validateConfig } from '@yai-loglayer/core'

const config: LoggerConfig = {
  level: 'info',
  outputs: {
    console: { colorized: true }
  }
}

validateConfig(config)
```

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。