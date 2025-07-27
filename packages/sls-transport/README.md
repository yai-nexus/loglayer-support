# @yai-loglayer/sls-transport

阿里云 SLS (Simple Log Service) transport for LogLayer - 企业级日志传输组件

## 特性

- ✅ **批量发送** - 缓冲队列 + 定时/定量刷新，提升性能
- ✅ **重试机制** - 指数退避重试，确保日志可靠传输
- ✅ **错误处理** - 优雅降级，不影响应用运行
- ✅ **配置验证** - 启动时检查必需参数
- ✅ **TypeScript 支持** - 完整的类型定义
- ✅ **Next.js 兼容** - 解决 ESM/CommonJS 兼容性问题

## 安装

```bash
npm install @yai-loglayer/sls-transport
# 或
pnpm add @yai-loglayer/sls-transport
```

## 使用方法

```typescript
import { LogLayer } from '@yai-loglayer/core';
import { SlsTransport } from '@yai-loglayer/sls-transport';

const slsTransport = new SlsTransport({
  endpoint: process.env.SLS_ENDPOINT!,
  accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
  project: 'my-app-project',
  logstore: 'my-app-logstore',
  // 可选配置
  topic: 'application-logs',
  source: 'nodejs-app',
  batchSize: 100,
  flushInterval: 5000,
  maxRetries: 3,
});

const logger = new LogLayer({
  transports: [slsTransport],
});

logger.info('用户登录成功', { userId: '123' });
logger.error(new Error('数据库连接失败'), { component: 'Database' });
```

## 环境变量

```bash
# 必需配置
SLS_ENDPOINT=https://your-region.log.aliyuncs.com
SLS_ACCESS_KEY_ID=your-access-key-id
SLS_ACCESS_KEY_SECRET=your-access-key-secret
SLS_PROJECT=your-project-name
SLS_LOGSTORE=your-logstore-name

# 可选配置
SLS_TOPIC=application-logs
SLS_SOURCE=nodejs-app
```

## API 文档

### SlsTransportConfig

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `endpoint` | string | ✅ | - | SLS 服务端点 |
| `accessKeyId` | string | ✅ | - | 阿里云访问密钥 ID |
| `accessKeySecret` | string | ✅ | - | 阿里云访问密钥 Secret |
| `project` | string | ✅ | - | SLS 项目名 |
| `logstore` | string | ✅ | - | SLS 日志库名 |
| `topic` | string | ❌ | 'loglayer' | 日志主题 |
| `source` | string | ❌ | 'nodejs' | 日志来源 |
| `batchSize` | number | ❌ | 100 | 批量发送大小 |
| `flushInterval` | number | ❌ | 5000 | 刷新间隔(ms) |
| `maxRetries` | number | ❌ | 3 | 最大重试次数 |

## 许可证

MIT