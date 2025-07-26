# @yai-loglayer/receiver

日志接收器，用于接收和处理来自客户端的日志数据。

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
import { createLogReceiverSync } from '@yai-loglayer/receiver'

// 创建日志接收器
const receiver = createLogReceiverSync({
  port: 3001,
  endpoints: {
    '/api/logs': {
      method: 'POST',
      maxBatchSize: 100
    }
  },
  storage: {
    type: 'alicloud',
    config: {
      project: 'your-project',
      logstore: 'your-logstore'
    }
  }
})

// 启动接收器
receiver.start()
```

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。