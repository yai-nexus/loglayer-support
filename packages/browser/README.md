# @yai-loglayer/browser

浏览器端的 loglayer 封装，提供开箱即用的日志解决方案。

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
import { createBrowserLoggerSync } from '@yai-loglayer/browser'

// 开发环境默认配置
const logger = createBrowserLoggerSync()

// 自定义配置
const logger = createBrowserLoggerSync({
  level: 'info',
  outputs: {
    console: { colorized: true, groupCollapsed: true },
    localStorage: { key: 'app-logs', maxEntries: 200 }
  }
})

logger.info('Hello from browser!')
```

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。