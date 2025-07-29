# OpenTelemetry 集成指南

本文档介绍如何将 OpenTelemetry 生成的 TraceId 自动上报到阿里云 SLS。

## 🎯 功能概述

SLS Transport 现在支持自动从 OpenTelemetry 获取 TraceId 和 SpanId，实现分布式链路追踪与日志的无缝集成。

### 核心特性

- ✅ **自动获取**: 自动从 OpenTelemetry 活跃 Span 获取 TraceId/SpanId
- ✅ **优先级策略**: 上下文 > OpenTelemetry > 自生成
- ✅ **版本兼容**: 支持多个 OpenTelemetry API 版本
- ✅ **错误处理**: 优雅降级，不影响日志功能
- ✅ **零配置**: 检测到 OpenTelemetry 时自动启用

## 📦 安装依赖

```bash
# 安装 OpenTelemetry API (如果还没有)
npm install @opentelemetry/api

# SLS Transport 会自动检测并集成
npm install @yai-loglayer/sls-transport
```

## 🚀 基本使用

### 1. 标准 OpenTelemetry 设置

```typescript
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// 初始化 OpenTelemetry
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### 2. SLS Transport 配置

```typescript
import { LogLayer } from 'loglayer';
import { SlsTransport } from '@yai-loglayer/sls-transport';

const logger = new LogLayer({
  transport: new SlsTransport({
    endpoint: 'https://your-project.log.aliyuncs.com',
    project: 'your-project',
    logstore: 'your-logstore',
    accessKeyId: 'your-access-key-id',
    accessKeySecret: 'your-access-key-secret',
    
    // TraceId 配置
    fields: {
      includeTraceId: true,    // 自动包含 TraceId
      includeSpanId: true,     // 自动包含 SpanId
    }
  })
});
```

### 3. 自动 TraceId 传播

```typescript
import { trace } from '@opentelemetry/api';

// 创建 Span
const tracer = trace.getTracer('my-service');

await tracer.startActiveSpan('http-request', async (span) => {
  // 在 Span 上下文中的所有日志会自动包含相同的 TraceId
  logger.info('请求开始', { 
    method: 'GET', 
    path: '/api/users' 
  });
  
  // 嵌套操作也会继承 TraceId
  await tracer.startActiveSpan('database-query', async (dbSpan) => {
    logger.info('数据库查询', { 
      query: 'SELECT * FROM users' 
    });
    
    dbSpan.end();
  });
  
  logger.info('请求完成', { 
    status: 200,
    duration: 120 
  });
  
  span.end();
});
```

## 🔧 高级配置

### 环境变量配置

```bash
# 启用/禁用 TraceId 集成
export SLS_INCLUDE_TRACE_ID=true
export SLS_INCLUDE_SPAN_ID=true

# 其他字段配置
export SLS_ENABLE_PACK_ID=true
export SLS_INCLUDE_ENVIRONMENT=true
```

### 代码配置

```typescript
const transport = new SlsTransport({
  // ... 基础配置
  
  fields: {
    // TraceId 配置
    includeTraceId: true,        // 包含 TraceId
    includeSpanId: false,        // 不包含 SpanId (可选)
    
    // 其他字段
    enablePackId: true,          // 启用 PackID
    includeEnvironment: true,
    includeVersion: true,
    
    // 自定义字段
    customFields: {
      service: 'user-service',
      region: 'cn-hangzhou'
    }
  }
});
```

## 📊 TraceId 优先级策略

SLS Transport 按以下优先级获取 TraceId：

1. **上下文中的 TraceId** (最高优先级)
2. **OpenTelemetry 活跃 Span 的 TraceId**
3. **全局 TraceId 上下文**
4. **自动生成新的 TraceId** (最低优先级)

### 示例

```typescript
// 1. 手动指定 TraceId (最高优先级)
logger.withContext({
  traceId: 'custom-trace-id-123',
  spanId: 'custom-span-id-456'
}).info('手动指定的 TraceId');

// 2. 使用 OpenTelemetry TraceId (自动)
await tracer.startActiveSpan('operation', async (span) => {
  logger.info('自动使用 OTel TraceId'); // 使用 span 的 TraceId
});

// 3. 没有活跃 Span 时自动生成
logger.info('自动生成 TraceId');
```

## 🔍 调试和监控

### 检查集成状态

```typescript
import { OpenTelemetryIntegration } from '@yai-loglayer/sls-transport';

// 检查 OpenTelemetry 是否可用
const isAvailable = await OpenTelemetryIntegration.isOpenTelemetryAvailable();
console.log('OpenTelemetry 可用:', isAvailable);

// 获取详细状态
const status = await OpenTelemetryIntegration.getIntegrationStatus();
console.log('集成状态:', status);

// 获取当前 Trace 信息
const traceInfo = await OpenTelemetryIntegration.getCurrentTraceInfo();
console.log('当前 Trace:', traceInfo);
```

### 验证 TraceId 格式

```typescript
import { OpenTelemetryIntegration } from '@yai-loglayer/sls-transport';

const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
const spanId = '4bf92f3577b34da6';

console.log('TraceId 有效:', OpenTelemetryIntegration.isValidOTelTraceId(traceId));
console.log('SpanId 有效:', OpenTelemetryIntegration.isValidOTelSpanId(spanId));
```

## 📈 SLS 控制台使用

### 1. 链路查询

在 SLS 控制台中，可以使用 TraceId 查询完整的请求链路：

```sql
* | WHERE traceId = '4bf92f3577b34da6a3ce929d0e0e4736'
  | ORDER BY __time__ ASC
```

### 2. 上下文浏览

点击任意日志条目的"上下文浏览"按钮，SLS 会自动显示：
- 相同 TraceId 的所有日志
- 相同 PackID 的关联日志
- 时间序列上的上下文日志

### 3. 链路分析

结合 SLS 的链路分析功能：

```sql
* | SELECT 
    traceId,
    spanId,
    COUNT(*) as log_count,
    MIN(__time__) as start_time,
    MAX(__time__) as end_time,
    MAX(__time__) - MIN(__time__) as duration
  | GROUP BY traceId, spanId
  | ORDER BY start_time ASC
```

## 🛠️ 故障排除

### 常见问题

1. **TraceId 没有自动获取**
   ```typescript
   // 检查 OpenTelemetry 是否正确初始化
   import { trace } from '@opentelemetry/api';
   
   const activeSpan = trace.getActiveSpan();
   console.log('活跃 Span:', activeSpan);
   ```

2. **TraceId 格式不正确**
   ```typescript
   // 验证 TraceId 格式
   const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
   console.log('TraceId 有效:', OpenTelemetryIntegration.isValidOTelTraceId(traceId));
   ```

3. **集成不工作**
   ```typescript
   // 检查集成状态
   const status = await OpenTelemetryIntegration.getIntegrationStatus();
   console.log('集成状态:', status);
   ```

### 调试模式

```typescript
// 启用详细日志
process.env.SLS_DEBUG = 'true';

// 或在代码中设置
import { internalLogger } from '@yai-loglayer/sls-transport';
internalLogger.setLevel('debug');
```

## 🎯 最佳实践

### 1. Span 命名规范

```typescript
// 使用有意义的 Span 名称
await tracer.startActiveSpan('http-get-users', async (span) => {
  // 添加有用的属性
  span.setAttributes({
    'http.method': 'GET',
    'http.url': '/api/users',
    'user.id': userId
  });
  
  logger.info('处理用户请求', { userId, action: 'get-users' });
});
```

### 2. 错误处理

```typescript
await tracer.startActiveSpan('risky-operation', async (span) => {
  try {
    // 业务逻辑
    logger.info('操作开始');
    
  } catch (error) {
    // 记录错误并设置 Span 状态
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    
    logger.error('操作失败', { 
      error: error.message,
      stack: error.stack 
    });
    
    throw error;
  } finally {
    span.end();
  }
});
```

### 3. 性能监控

```typescript
await tracer.startActiveSpan('database-operation', async (span) => {
  const startTime = Date.now();
  
  try {
    const result = await database.query('SELECT * FROM users');
    
    const duration = Date.now() - startTime;
    span.setAttributes({
      'db.duration': duration,
      'db.rows': result.length
    });
    
    logger.info('数据库查询完成', { 
      duration,
      rowCount: result.length 
    });
    
    return result;
  } finally {
    span.end();
  }
});
```

## 🔗 相关文档

- [OpenTelemetry JavaScript 文档](https://opentelemetry.io/docs/instrumentation/js/)
- [阿里云 SLS 文档](https://help.aliyun.com/product/28958.html)
- [PackID 使用指南](./README-PACKID.md)

## 📞 支持

如果遇到问题，请：

1. 检查 OpenTelemetry 是否正确初始化
2. 验证 SLS Transport 配置
3. 查看调试日志
4. 提交 Issue 到项目仓库
