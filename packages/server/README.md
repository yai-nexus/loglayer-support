# @yai-loglayer/server

[![npm version](https://badge.fury.io/js/@yai-loglayer%2Fserver.svg)](https://www.npmjs.com/package/@yai-loglayer/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🖥️ **服务端日志解决方案** - 为 Node.js 应用提供企业级日志功能

> 这是 `@yai-loglayer/*` 包系列的服务端模块，专为 Node.js 环境优化。

## ✨ 新版特性（推荐）

- 🚀 **极简接入**：从 100+ 行代码简化到 10 行
- 🤖 **智能配置**：支持 `auto` 模式自动检测环境
- 🔧 **配置驱动**：声明式配置，无需手动处理逻辑
- ✅ **友好验证**：完整的配置验证和错误提示
- 🔄 **向后兼容**：保持与现有代码的接口兼容

## 安装

```bash
pnpm add @yai-loglayer/server
```

## 🚀 快速开始（新版 - 推荐）

### 1. 创建配置文件

```typescript
// logger.config.ts
import type { AutoLoggerConfig } from '@yai-loglayer/server';

export const loggerConfig: AutoLoggerConfig = {
  app: {
    name: 'my-app',
    environment: 'auto', // 自动检测环境
    version: 'auto', // 自动从 package.json 读取
  },
  outputs: {
    console: { enabled: 'auto' }, // 开发环境自动启用
    file: {
      enabled: true,
      path: 'auto', // 自动检测项目根目录
      filename: 'app.log',
    },
    sls: {
      enabled: 'auto', // 根据环境变量自动启用
      config: 'env', // 从环境变量自动读取
    },
  },
};

export default loggerConfig;
```

### 2. 创建日志器

```typescript
// server-logger.ts
import { createAutoLogger } from '@yai-loglayer/server';
import loggerConfig from './logger.config';

// 一行代码完成所有配置
export const logger = createAutoLogger(loggerConfig);

// 直接使用，无需 await
logger.info('Hello from server!');
logger.error('Error occurred', { error: 'details' });

export default logger;
```

### 3. 环境变量（可选）

```bash
# .env.local
NODE_ENV=development
SERVICE_NAME=my-app
APP_VERSION=1.0.0

# SLS 配置（可选）
SLS_ENABLED=true
SLS_ENDPOINT=https://your-region.log.aliyuncs.com
SLS_ACCESS_KEY_ID=your-access-key-id
SLS_ACCESS_KEY_SECRET=your-access-key-secret
SLS_PROJECT=your-project
SLS_LOGSTORE=your-logstore
```

## 📊 新旧版本对比

| 方面     | 旧版                  | 新版              |
| -------- | --------------------- | ----------------- |
| 代码行数 | 100+ 行               | 10 行             |
| 配置方式 | 手动处理              | 声明式配置        |
| 环境变量 | 手动检查映射          | 自动检测映射      |
| 路径解析 | 手动实现              | `'auto'` 自动解析 |
| 错误处理 | 分散处理              | 统一处理和回退    |
| 日志调用 | `await logger.info()` | `logger.info()`   |
| 配置验证 | 无                    | 自动验证和提示    |

## 🔧 高级用法

### 基础使用

```typescript
import { createAutoLogger } from '@yai-loglayer/server';
import type { AutoLoggerConfig } from '@yai-loglayer/server';

const config: AutoLoggerConfig = {
  app: { name: 'my-app' },
  outputs: {
    console: { enabled: 'auto' },
    file: { enabled: true, path: 'auto', filename: 'app.log' },
  },
};

const logger = createAutoLogger(config);

// 直接使用
logger.info('应用启动', { port: 3000 });
logger.error('连接失败', { error: 'timeout' });
```

### 高级用法

```typescript
// 自定义追踪ID
const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
logger.info('业务流程开始', { traceId, step: 1 });

// 检查状态
if (logger.isReady()) {
  console.log('日志器已就绪');
}
```

## 📚 迁移指南

### 从传统 API 迁移

如果您之前使用的是传统 API，可以按以下方式迁移：

#### 简化对比

**旧版（复杂）**：

```typescript
// 需要复杂的配置和异步初始化
const logger = await createServerLogger('my-app', complexConfig);
await logger.info('message');
```

**新版（简单）**：

```typescript
// 一行创建，直接使用
const logger = createAutoLogger({ app: { name: 'my-app' } });
logger.info('message');
```

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    业务应用层                                │
├─────────────────────────────────────────────────────────────┤
│  createAutoLogger()  │  SimpleLogger Interface              │
├─────────────────────────────────────────────────────────────┤
│                   配置解析层                                 │
│  ConfigResolver  │  ConfigValidator  │  AutoLoggerConfig    │
├─────────────────────────────────────────────────────────────┤
│                   日志处理层                                 │
│  AutoLoggerImpl  │  LogLayer (loglayer)                     │
├─────────────────────────────────────────────────────────────┤
│                   传输适配层                                 │
│  ServerTransport  │  ServerOutputEngine                     │
├─────────────────────────────────────────────────────────────┤
│                   输出目标层                                 │
│  Console  │  File System  │  SLS  │  Custom Outputs         │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. **配置解析层**

- **ConfigResolver**: 智能解析配置，支持 `auto` 模式
- **ConfigValidator**: 配置验证和友好错误提示
- **AutoLoggerConfig**: 声明式配置接口

#### 2. **日志处理层**

- **AutoLoggerImpl**: 简化的日志器实现
- **LogLayer**: 基于 loglayer 库的核心日志处理

#### 3. **传输适配层**

- **ServerTransport**: 服务端传输器适配
- **ServerOutputEngine**: 多输出目标管理

#### 4. **输出目标层**

- **Console**: 控制台输出（开发环境）
- **File System**: 文件输出（支持轮转）
- **SLS**: 阿里云日志服务
- **Custom**: 自定义输出扩展

## 🔧 工作原理

### 1. 智能配置解析

```typescript
// 用户配置
const config = {
  app: { name: 'my-app', environment: 'auto' },
  outputs: { console: { enabled: 'auto' } }
};

// 内部解析流程
ConfigResolver.resolve(config) → {
  // 1. 环境检测
  environment: detectEnvironment(), // 'development'

  // 2. 路径发现
  logPath: detectProjectRoot() + '/logs',

  // 3. 环境变量映射
  slsConfig: readFromEnvVars(['SLS_ENDPOINT', 'SLS_PROJECT', ...]),

  // 4. 默认值填充
  outputs: mergeWithDefaults(userOutputs, defaultOutputs)
}
```

### 2. 自动初始化机制

```typescript
createAutoLogger(config) → {
  // 1. 配置验证
  const validation = ConfigValidator.validate(config);
  if (!validation.valid) throw new Error(...);

  // 2. 配置解析
  const resolved = await ConfigResolver.resolve(config);

  // 3. 传输器创建
  const transport = new ServerTransport(resolved.outputs);

  // 4. 日志器实例化
  const logLayer = new LogLayer({ transport });

  // 5. 包装为简化接口
  return new AutoLoggerImpl(logLayer, resolved);
}
```

### 3. 多输出路由

```typescript
logger.info('message', data) → {
  // 1. 日志格式化
  const formatted = formatLogEntry(level, message, data, metadata);

  // 2. 输出路由
  if (consoleEnabled) → console.log(formatted);
  if (fileEnabled) → fs.appendFile(logFile, formatted);
  if (slsEnabled) → slsClient.send(formatted);

  // 3. 错误处理
  catch (error) → fallbackToConsole(formatted);
}
```

### 4. 环境自适应

```typescript
// 开发环境
NODE_ENV=development → {
  console: { enabled: true, format: 'pretty', colors: true },
  file: { enabled: true, level: 'debug' },
  sls: { enabled: false }
}

// 生产环境
NODE_ENV=production → {
  console: { enabled: false },
  file: { enabled: true, level: 'info' },
  sls: { enabled: true, level: 'warn' }
}
```

## 🎯 设计原则

### 1. **配置驱动**

- 声明式配置，避免命令式代码
- 支持 `auto` 模式，智能检测环境
- 环境变量优先，支持多种命名约定

### 2. **渐进式增强**

- 零配置启动，开箱即用
- 基础功能简单，高级功能可选
- 向后兼容，平滑升级

### 3. **错误友好**

- 自动配置验证，友好错误提示
- 自动回退机制，确保日志不丢失
- 内置诊断工具，便于问题排查

### 4. **性能优先**

- 异步初始化，不阻塞主线程
- 智能缓冲，批量处理日志
- 内存优化，避免内存泄漏

## 🔍 核心特性详解

### 智能环境检测

```typescript
// 自动检测项目类型
detectProjectType() → {
  if (hasFile('next.config.js')) return 'nextjs';
  if (hasFile('package.json') && hasDep('express')) return 'express';
  return 'generic';
}

// 自动检测项目根目录
detectProjectRoot() → {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (hasFile(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}
```

### 环境变量映射

支持多种命名约定，自动选择可用的环境变量：

```typescript
const ENV_MAPPINGS = {
  APP_NAME: ['NEXT_PUBLIC_SERVICE_NAME', 'SERVICE_NAME', 'APP_NAME'],
  SLS_ENDPOINT: ['NEXT_PUBLIC_SLS_ENDPOINT', 'SLS_ENDPOINT'],
  LOG_LEVEL: ['LOG_LEVEL', 'LOGLEVEL'],
};

// 自动选择第一个可用的环境变量
function getEnvValue(keys) {
  return keys.find((key) => process.env[key]) || undefined;
}
```

### 配置验证机制

```typescript
// 配置验证流程
ConfigValidator.validate(config) → {
  const issues = [];

  // 1. 必需字段检查
  if (!config.app?.name) {
    issues.push({
      type: 'error',
      message: '缺少应用名称',
      suggestion: '请设置 app.name 或环境变量 SERVICE_NAME'
    });
  }

  // 2. SLS 配置完整性检查
  if (config.outputs?.sls?.enabled && !hasSlsCredentials()) {
    issues.push({
      type: 'warning',
      message: 'SLS 已启用但缺少凭证',
      suggestion: '请设置 SLS 相关环境变量'
    });
  }

  // 3. 文件权限检查
  if (config.outputs?.file?.enabled && !canWriteToPath(config.outputs.file.path)) {
    issues.push({
      type: 'error',
      message: '日志目录无写入权限',
      suggestion: '请检查目录权限或更改日志路径'
    });
  }

  return { valid: issues.filter(i => i.type === 'error').length === 0, issues };
}
```

### 故障回退机制

```typescript
// 多层回退保障
class AutoLoggerImpl {
  private fallbackChain = [
    () => this.tryMainLogger(), // 主日志器
    () => this.tryFileLogger(), // 文件回退
    () => this.tryConsoleLogger(), // 控制台回退
    () => this.tryNoOpLogger(), // 静默回退
  ];

  log(level, message, data) {
    for (const fallback of this.fallbackChain) {
      try {
        return fallback(level, message, data);
      } catch (error) {
        continue; // 尝试下一个回退方案
      }
    }
  }
}
```

## 🚀 性能优化

### 1. **延迟初始化**

- 日志器创建时不立即初始化所有组件
- 首次使用时才进行完整初始化
- 减少应用启动时间

### 2. **智能缓冲**

- 批量写入文件，减少 I/O 操作
- 内存缓冲区自动管理
- 进程退出时自动刷新缓冲区

### 3. **连接复用**

- SLS 连接池管理
- HTTP 连接复用
- 减少网络开销

### 4. **内存优化**

- 循环引用检测和清理
- 大对象自动序列化
- 内存使用监控和告警

## 🔒 安全考虑

### 1. **敏感信息过滤**

```typescript
// 自动过滤敏感字段
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key'];

function sanitizeData(data) {
  return Object.keys(data).reduce((clean, key) => {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = data[key];
    }
    return clean;
  }, {});
}
```

### 2. **输出安全**

- 文件路径验证，防止路径遍历攻击
- SLS 传输加密
- 日志内容转义，防止注入攻击

### 3. **权限控制**

- 最小权限原则
- 文件权限检查
- 网络访问控制

## 🔧 扩展性设计

### 自定义输出目标

```typescript
// 扩展自定义输出
class CustomOutput implements ServerOutput {
  type = 'custom';

  async write(logEntry: LogEntry) {
    // 自定义处理逻辑
    await this.sendToCustomService(logEntry);
  }
}

// 在配置中使用
const config: AutoLoggerConfig = {
  app: { name: 'my-app' },
  outputs: {
    custom: {
      enabled: true,
      handler: new CustomOutput(),
    },
  },
};
```

### 中间件支持

```typescript
// 日志中间件
class LogMiddleware {
  process(logEntry: LogEntry): LogEntry {
    // 添加自定义字段
    return {
      ...logEntry,
      hostname: os.hostname(),
      pid: process.pid,
      memory: process.memoryUsage(),
    };
  }
}

// 应用中间件
const logger = createAutoLogger({
  app: { name: 'my-app' },
  middleware: [new LogMiddleware()],
});
```

## 📋 最佳实践

### 1. **结构化日志**

```typescript
// ✅ 推荐：结构化数据
logger.info('用户登录', {
  userId: 12345,
  email: 'user@example.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date().toISOString(),
});

// ❌ 不推荐：字符串拼接
logger.info(`用户 ${userId} 从 ${ip} 登录`);
```

### 2. **错误日志记录**

```typescript
// ✅ 推荐：完整错误信息
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作失败', {
    operation: 'riskyOperation',
    error: error.message,
    stack: error.stack,
    context: { userId, requestId },
  });
}

// ❌ 不推荐：丢失上下文
logger.error('操作失败', error);
```

### 3. **性能监控**

```typescript
// ✅ 推荐：性能追踪
const startTime = Date.now();
try {
  const result = await databaseQuery();
  logger.info('数据库查询成功', {
    query: 'getUserById',
    duration: Date.now() - startTime,
    resultCount: result.length,
  });
} catch (error) {
  logger.error('数据库查询失败', {
    query: 'getUserById',
    duration: Date.now() - startTime,
    error: error.message,
  });
}
```

### 4. **日志级别使用**

```typescript
// DEBUG: 详细的调试信息
logger.debug('函数调用', { function: 'calculateTotal', params: { items, tax } });

// INFO: 一般信息记录
logger.info('用户操作', { action: 'purchase', userId, amount });

// WARN: 警告信息，需要关注但不影响功能
logger.warn('性能警告', { responseTime: 2000, threshold: 1000 });

// ERROR: 错误信息，需要立即处理
logger.error('支付失败', { orderId, error: error.message, amount });
```

### 5. **生产环境配置**

```typescript
// 生产环境推荐配置
const productionConfig: AutoLoggerConfig = {
  app: {
    name: process.env.SERVICE_NAME,
    environment: 'production',
    version: process.env.APP_VERSION,
  },
  outputs: {
    console: { enabled: false }, // 生产环境关闭控制台
    file: {
      enabled: true,
      path: '/var/log/app',
      filename: 'app.log',
      rotation: {
        maxSize: '100MB',
        maxFiles: 10,
        datePattern: 'YYYY-MM-DD',
      },
    },
    sls: {
      enabled: true,
      config: 'env', // 从环境变量读取
    },
  },
  level: 'info', // 生产环境使用 info 级别
};
```

## 🔍 故障排查

### 常见问题

1. **日志文件无法创建**
   - 检查目录权限：`ls -la /path/to/logs`
   - 检查磁盘空间：`df -h`
   - 验证路径配置：确保路径存在且可写

2. **SLS 连接失败**
   - 验证网络连接：`ping your-sls-endpoint`
   - 检查凭证配置：确保 AccessKey 正确
   - 查看错误日志：启用 debug 模式

3. **性能问题**
   - 检查日志级别：避免在生产环境使用 debug
   - 监控内存使用：使用 `process.memoryUsage()`
   - 优化日志频率：避免在循环中大量记录日志

### 调试模式

```typescript
// 启用调试模式
const logger = createAutoLogger({
  app: { name: 'my-app' },
  features: {
    debug: { enabled: true, verbose: true },
  },
});

// 查看内部状态
console.log('Logger ready:', logger.isReady());
console.log('Config:', logger.getConfig());
```

## 相关包

- [`@yai-loglayer/core`](../core/) - 核心类型定义和工具函数
- [`@yai-loglayer/browser`](../browser/) - 浏览器端日志封装
- [`@yai-loglayer/receiver`](../receiver/) - 日志接收器
- [`@yai-loglayer/sls-transport`](../sls-transport/) - SLS 传输组件

## API 文档

详细的 API 文档请参考项目根目录的 docs/ 文件夹。

## 许可证

MIT License
