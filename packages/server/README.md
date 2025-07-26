# @yai-loglayer/server

服务端的 loglayer 封装，提供 Node.js 环境的日志解决方案。

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
import { createServerLoggerSync } from '@yai-loglayer/server'

// 开发环境默认配置
const logger = createServerLoggerSync()

// 自定义配置
const logger = createServerLoggerSync({
  level: 'info',
  outputs: {
    console: { colorized: true },
    file: { 
      filePath: './logs/app.log',
      enableRotation: true 
    }
  }
})

logger.info('Hello from server!')
```

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。