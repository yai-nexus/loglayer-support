# PackID 机制使用指南

## 概述

PackID 机制是阿里云SLS的核心功能，用于关联同一上下文的日志，支持在SLS控制台进行上下文查询。本实现完全遵循阿里云SLS官方规范。

## PackID 格式

```
格式: 上下文前缀-日志组ID
示例: 3586C5897E69CA5C-1E3
```

- **上下文前缀**: 16位大写十六进制，同一进程内保持不变
- **日志组ID**: 递增的十六进制数字，标识同一上下文内的不同批次

## 快速开始

### 1. 基本配置

```typescript
import { SlsTransport } from '@yai-loglayer/sls-transport';

const transport = new SlsTransport({
  endpoint: 'https://cn-hangzhou.log.aliyuncs.com',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  project: 'your-project',
  logstore: 'your-logstore',
  
  // PackID 和字段配置
  fields: {
    enablePackId: true,           // 启用PackID机制
    includeEnvironment: true,     // 包含环境信息
    includeVersion: true,         // 包含版本信息
    includeHostIP: true,          // 包含主机IP
    includeCategory: true,        // 包含日志分类
    includeLogger: false,         // 包含日志器名称
    includeTraceId: true,         // 包含TraceId
    includeSpanId: false,         // 包含SpanId
    customFields: {               // 自定义字段
      service: 'user-service',
      region: 'cn-hangzhou'
    }
  }
});
```

### 2. 环境变量配置

```bash
# 基础配置
export SLS_ENDPOINT=https://cn-hangzhou.log.aliyuncs.com
export SLS_ACCESS_KEY_ID=your-access-key-id
export SLS_ACCESS_KEY_SECRET=your-access-key-secret
export SLS_PROJECT=your-project
export SLS_LOGSTORE=your-logstore

# PackID 和字段配置
export SLS_ENABLE_PACK_ID=true
export SLS_INCLUDE_ENVIRONMENT=true
export SLS_INCLUDE_VERSION=true
export SLS_INCLUDE_HOST_IP=true
export SLS_INCLUDE_CATEGORY=true
export SLS_INCLUDE_LOGGER=false
export SLS_INCLUDE_TRACE_ID=true
export SLS_INCLUDE_SPAN_ID=false

# 应用信息
export NODE_ENV=production
export APP_VERSION=1.2.3
```

### 3. 使用示例

```typescript
import { LogLayer } from 'loglayer';
import { SlsTransport, createSlsConfigFromEnv } from '@yai-loglayer/sls-transport';

// 从环境变量创建配置
const config = createSlsConfigFromEnv();
const transport = new SlsTransport(config);
const logger = new LogLayer({ transport });

// HTTP请求处理示例
async function handleUserRequest(requestId: string) {
  // 这些日志将共享同一个PackID
  logger.info('HTTP请求开始', { 
    requestId, 
    method: 'POST', 
    path: '/api/users' 
  });
  
  logger.debug('验证用户权限', { 
    requestId, 
    userId: 'user_123' 
  });
  
  logger.info('数据库查询', { 
    requestId, 
    query: 'SELECT * FROM users', 
    duration: 45 
  });
  
  logger.info('HTTP请求完成', { 
    requestId, 
    statusCode: 200, 
    responseTime: 120 
  });
}
```

## 生成的日志字段

每条日志将包含以下字段：

### 必需字段
- `level`: 日志级别 (info, warn, error, debug)
- `message`: 日志消息
- `datetime`: 时间戳 (SLS标准字段 `__time__`)
- `app_name`: 应用名称
- `hostname`: 主机名
- `__pack_id__`: PackID (LogTags中)

### 推荐字段
- `environment`: 环境标识 (development, production, etc.)
- `version`: 应用版本
- `host_ip`: 主机IP地址
- `category`: 日志分类 (api, database, auth, etc.)
- `traceId`: OpenTelemetry标准的TraceId (32位十六进制)

### 可选字段
- `logger`: 日志器名称
- `spanId`: OpenTelemetry标准的SpanId (16位十六进制)
- `pid`: 进程ID
- 自定义字段

## 在SLS控制台使用

### 1. 查看上下文
1. 在日志列表中找到目标日志
2. 点击日志行右侧的"上下文浏览"图标
3. 系统自动显示相同PackID的所有相关日志
4. 当前日志高亮显示，相关日志按时间排序

### 2. 搜索语法
```sql
-- 查找特定PackID的所有日志
__tag__.__pack_id__ : "3586C5897E69CA5C-*"

-- 查找特定上下文前缀的所有日志
__tag__.__pack_id__ : "3586C5897E69CA5C*"

-- 结合其他条件
level: error AND __tag__.__pack_id__ : "3586C5897E69CA5C-*"
```

## 高级用法

### 1. 手动生成PackID

```typescript
import { generatePackId, getGlobalPackIdGenerator } from '@yai-loglayer/sls-transport';

// 快速生成
const packId = generatePackId();

// 获取生成器实例
const generator = getGlobalPackIdGenerator();
const prefix = generator.getContextPrefix();
const currentBatch = generator.getCurrentBatchId();
```

### 2. 自定义字段配置

```typescript
const transport = new SlsTransport({
  // ... 基础配置
  fields: {
    enablePackId: true,
    customFields: {
      service: 'user-service',
      version: process.env.SERVICE_VERSION,
      datacenter: 'us-west-2',
      cluster: 'prod-cluster-01'
    }
  }
});
```

### 3. TraceId 集成

```typescript
import { generateTraceId, generateSpanId, traceContext } from '@yai-loglayer/sls-transport';

// 手动生成TraceId
const traceId = generateTraceId(); // 32位十六进制
const spanId = generateSpanId();   // 16位十六进制

// 设置全局Trace上下文
traceContext.setCurrentTrace(traceId, spanId);

// 后续日志会自动包含TraceId
logger.info('操作开始'); // 自动包含traceId字段

// 在日志上下文中传递TraceId
logger.withContext({
  traceId: 'custom-trace-123',
  spanId: 'custom-span-456',
  userId: 'user_789'
}).info('用户操作完成');
```

### 4. 动态字段

```typescript
// 在日志上下文中添加动态信息
logger.withContext({
  requestId: 'req_123',
  userId: 'user_789',
  operation: 'user-login'
}).info('用户操作完成');
```

## 最佳实践

### 1. 进程级别使用
- 每个进程使用同一个PackID生成器
- 不要在不同进程间共享生成器实例

### 2. 批量发送优化
- 同一批次的日志自动共享日志组ID
- 利用批量发送减少网络开销

### 3. 上下文传递
```typescript
// 在微服务间传递PackID前缀
const contextPrefix = getGlobalPackIdGenerator().getContextPrefix();
// 通过HTTP头或消息队列传递给下游服务
```

### 4. 错误排查
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作失败', {
    error: error.message,
    stack: error.stack,
    context: 'user-registration'
  });
  // 相关的所有日志都可以通过PackID关联查看
}
```

## 性能考虑

- PackID生成成本极低（内存操作）
- 系统信息获取有缓存机制
- 批量发送提升传输效率
- 建议控制字段数量在15个以内

## 故障排查

### 1. PackID未生成
检查配置：`fields.enablePackId` 是否为 `true`

### 2. 上下文查询无结果
确认日志已正确发送到SLS，且PackID格式正确

### 3. 字段缺失
检查字段配置和环境变量设置

## 更多信息

- [阿里云SLS PackID官方文档](https://help.aliyun.com/zh/sls/use-packid-mechanism-to-associate-log-context)
- [SLS上下文查询文档](https://help.aliyun.com/zh/sls/contextual-query)
