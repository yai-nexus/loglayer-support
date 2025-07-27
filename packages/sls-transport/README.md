# @yai-loglayer/sls-transport

阿里云 SLS (Simple Log Service) Transport for LogLayer - 企业级日志传输组件

## 功能特性

- ✅ **批量发送**: 支持自定义批量大小，提高发送效率
- ✅ **重试机制**: 指数退避重试，确保日志可靠传输
- ✅ **错误处理**: 统一的错误处理和内部日志记录
- ✅ **类型安全**: 基于 LogLayer 原生类型，完全类型安全
- ✅ **配置灵活**: 支持环境变量和程序化配置
- ✅ **统计信息**: 提供传输统计和监控能力

## 快速开始

### 安装

```bash
pnpm add @yai-loglayer/sls-transport
```

### 基本使用

```typescript
import { LogLayer } from 'loglayer';
import { SlsTransport, createSlsConfigFromEnv } from '@yai-loglayer/sls-transport';

// 从环境变量创建配置
const slsConfig = createSlsConfigFromEnv();

if (slsConfig) {
  // 创建 SLS Transport
  const transport = new SlsTransport(slsConfig);
  
  // 创建 LogLayer 实例
  const logger = new LogLayer({
    transport
  });
  
  // 使用日志
  logger.info('用户登录', { userId: '12345', ip: '192.168.1.1' });
}
```

### 环境变量配置

```bash
# 必需环境变量
SLS_ENDPOINT=https://your-project.cn-hangzhou.log.aliyuncs.com
SLS_PROJECT=your-project-name
SLS_LOGSTORE=your-logstore-name
SLS_ACCESS_KEY_ID=your-access-key-id
SLS_ACCESS_KEY_SECRET=your-access-key-secret

# 可选环境变量
SLS_TOPIC=loglayer                # 默认: loglayer
SLS_SOURCE=nodejs                 # 默认: nodejs
SLS_BATCH_SIZE=100               # 默认: 100
SLS_FLUSH_INTERVAL=5000          # 默认: 5000ms
SLS_MAX_RETRIES=3                # 默认: 3
```

### 程序化配置

```typescript
import { SlsTransport } from '@yai-loglayer/sls-transport';

const transport = new SlsTransport({
  endpoint: 'https://your-project.cn-hangzhou.log.aliyuncs.com',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  project: 'your-project-name',
  logstore: 'your-logstore-name',
  topic: 'loglayer',
  source: 'nodejs',
  batchSize: 100,
  flushInterval: 5000,
  maxRetries: 3,
  retryBaseDelay: 1000
});
```

## 企业特性

### 批量发送

默认情况下，日志会批量发送以提高性能：

```typescript
const transport = new SlsTransport({
  // ... 其他配置
  batchSize: 50,          // 每批发送50条日志
  flushInterval: 3000,    // 3秒强制刷新一次
});
```

### 重试机制

内置指数退避重试机制：

```typescript
const transport = new SlsTransport({
  // ... 其他配置
  maxRetries: 5,          // 最大重试5次
  retryBaseDelay: 2000,   // 基础延迟2秒
});
```

### 统计信息

```typescript
const stats = transport.getStats();
console.log('发送统计:', {
  总发送: stats.totalSent,
  成功: stats.successCount,
  失败: stats.failureCount,
  重试: stats.retryCount,
  批次: stats.batchCount
});
```

## Next.js 兼容性说明

⚠️ **重要提示**: 由于阿里云 SLS SDK 包含原生模块（lz4），存在与 Next.js 构建系统的兼容性问题。

详细分析请参考: [SLS SDK Next.js 兼容性问题分析报告](../../docs/SLS_SDK_NEXTJS_COMPATIBILITY_ANALYSIS.md)

**推荐解决方案**: 使用基于 REST API 的实现替代当前的 SDK 方式。

## API 参考

### SlsTransport

#### 构造函数

```typescript
constructor(config: SlsTransportConfig)
```

#### 方法

- `getStats(): TransportStats` - 获取传输统计信息
- `flush(): Promise<void>` - 强制刷新缓冲区
- `destroy(): void` - 销毁传输实例

### 工具函数

```typescript
// 配置相关
createSlsConfigFromEnv(): SlsTransportConfig | null
checkSlsConfig(): boolean

// 内部日志配置
configureInternalLogger(config: InternalLoggerConfig): void
```

## 类型定义

详细的类型定义请参考源码中的 `types.ts` 文件。

## 许可证

MIT License