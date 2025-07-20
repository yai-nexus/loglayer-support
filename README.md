# @yai-nexus/loglayer-support

🚀 **基于 LogLayer 的统一日志解决方案** - 专为 Next.js 和现代 JavaScript 应用设计

[![npm version](https://badge.fury.io/js/@yai-nexus%2Floglayer-support.svg)](https://www.npmjs.com/package/@yai-nexus/loglayer-support)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 为什么选择这个库？

**解决 Next.js 日志痛点**：在 Next.js 的 Edge Runtime 和 Serverless 环境中，传统日志库经常出现兼容性问题。本库提供开箱即用的解决方案。

**架构解耦设计**：您的代码与具体日志实现完全分离，可以随时无缝切换底层日志库，无需修改业务代码。

**零配置启动**：一行代码即可开始使用，同时保留完全的自定义能力。

## 📦 安装

```bash
npm install @yai-nexus/loglayer-support
```

## 🚀 快速开始

### Next.js 应用（推荐方式）

```typescript
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

// 一行代码创建日志器
const logger = createNextjsLoggerSync();

// 立即开始使用
logger.info('应用启动成功');
logger.error('发生错误', { error: new Error('示例错误') });
```

### Node.js 服务

```typescript
import { createLoggerWithPreset } from '@yai-nexus/loglayer-support';

// 使用预设配置
const logger = await createLoggerWithPreset('production');

logger.info('服务启动', { port: 3000 });
```

## 📖 使用指南

### 1. 基础日志记录

```typescript
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync();

// 不同级别的日志
logger.debug('调试信息');    // 开发环境详细信息
logger.info('一般信息');     // 正常业务流程
logger.warn('警告信息');     // 需要注意但不影响运行
logger.error('错误信息');    // 错误和异常
```

### 2. 结构化日志（推荐）

```typescript
// ✅ 推荐：使用结构化数据
logger.info('用户登录', {
  userId: '12345',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString(),
  userAgent: 'Chrome/91.0'
});

// ✅ 错误日志最佳实践
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作失败', {
    operation: 'riskyOperation',
    error: error.message,
    stack: error.stack,
    context: { userId: '12345' }
  });
}
```

### 3. 上下文绑定

```typescript
// 创建带上下文的子日志器
const requestLogger = logger.child({
  requestId: 'req-12345',
  userId: 'user-67890'
});

// 所有后续日志都会自动包含上下文
requestLogger.info('开始处理请求');
requestLogger.debug('查询数据库');
requestLogger.info('请求处理完成');

// 输出示例：
// {"level":"info","message":"开始处理请求","requestId":"req-12345","userId":"user-67890"}
```

### 4. Next.js API 路由完整示例

```typescript
// app/api/users/route.ts
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableFileLogging: true
});

export async function GET(request: Request) {
  // 为每个请求创建独立的日志上下文
  const requestLogger = logger.child({
    requestId: crypto.randomUUID(),
    method: 'GET',
    path: '/api/users'
  });

  requestLogger.info('API 请求开始');

  try {
    requestLogger.debug('开始查询用户数据');
    const users = await getUsersFromDatabase();
    
    requestLogger.info('查询成功', {
      userCount: users.length,
      duration: '150ms'
    });

    return Response.json(users);
    
  } catch (error) {
    requestLogger.error('查询失败', {
      error: error.message,
      stack: error.stack
    });

    return Response.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

### 5. 环境配置

```typescript
// 根据环境自动调整配置
const logger = createNextjsLoggerSync({
  level: process.env.LOG_LEVEL || 'info',
  enableFileLogging: process.env.NODE_ENV === 'production',
  logDir: process.env.LOG_DIR || './logs'
});

// 支持的环境变量：
// LOG_LEVEL=debug|info|warn|error
// LOG_TO_FILE=true|false
// LOG_DIR=./custom-logs
```

## 🔧 API 参考

### `createNextjsLoggerSync(options?)`

**最常用的 API**，适合 Next.js 和需要同步创建的场景。

```typescript
interface NextjsLoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';  // 默认: 'info'
  enableFileLogging?: boolean;                   // 默认: false
  logDir?: string;                              // 默认: './logs'
  enableConsole?: boolean;                      // 默认: true
}

const logger = createNextjsLoggerSync({
  level: 'debug',
  enableFileLogging: true,
  logDir: './my-logs'
});
```

### `createLoggerWithPreset(preset, options?)`

使用预设配置快速创建日志器。

```typescript
// 可用预设
type Preset = 'development' | 'production' | 'nextjsCompatible';

// 开发环境：详细日志 + 控制台输出
const devLogger = await createLoggerWithPreset('development');

// 生产环境：文件日志 + 性能优化
const prodLogger = await createLoggerWithPreset('production');

// Next.js 兼容：确保在所有 Next.js 环境中工作
const nextLogger = await createLoggerWithPreset('nextjsCompatible');
```

### `createEnhancedLogger(config)`

完全自定义配置。

```typescript
const logger = await createEnhancedLogger({
  level: 'info',
  transports: ['pino', 'console'],  // 可选: 'pino' | 'winston' | 'console'
  enableFileLogging: true,
  logDir: './logs',
  pinoOptions: {
    // Pino 特定配置
    formatters: {
      level: (label) => ({ level: label })
    }
  }
});
```

## 💡 最佳实践

### 1. 日志级别使用指南

```typescript
// debug: 开发调试信息
logger.debug('SQL 查询', { query: 'SELECT * FROM users', params: [1, 2, 3] });

// info: 正常业务流程
logger.info('用户注册成功', { userId: newUser.id, email: newUser.email });

// warn: 需要关注但不影响功能
logger.warn('API 响应较慢', { endpoint: '/api/data', duration: 2500 });

// error: 错误和异常
logger.error('支付处理失败', { orderId: '12345', error: error.message });
```

### 2. 性能监控

```typescript
async function processLargeDataset(data: any[]) {
  const startTime = Date.now();
  const processLogger = logger.child({ operation: 'processLargeDataset' });
  
  processLogger.info('开始处理数据', { recordCount: data.length });
  
  try {
    const result = await heavyProcessing(data);
    
    processLogger.info('处理完成', {
      duration: Date.now() - startTime,
      inputCount: data.length,
      outputCount: result.length,
      successRate: (result.length / data.length * 100).toFixed(2) + '%'
    });
    
    return result;
  } catch (error) {
    processLogger.error('处理失败', {
      duration: Date.now() - startTime,
      error: error.message,
      processedCount: 0
    });
    throw error;
  }
}
```

### 3. 避免常见错误

```typescript
// ❌ 避免：字符串拼接
logger.info(`用户 ${userId} 执行了 ${action} 操作`);

// ✅ 推荐：结构化数据
logger.info('用户操作', { userId, action });

// ❌ 避免：敏感信息
logger.info('用户登录', { password: user.password });

// ✅ 推荐：过滤敏感信息
logger.info('用户登录', { 
  userId: user.id, 
  email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2') 
});
```

## 🏗️ 架构优势

- **🔄 可移植性**: 底层日志库可随时切换，业务代码无需修改
- **🛡️ 健壮性**: 自动回退机制，确保在任何环境下都能工作
- **🎯 专业性**: 专为 Next.js 和现代 JavaScript 应用优化
- **📈 可扩展**: 支持插件和自定义传输器

## 📚 示例项目

查看 [`examples/`](./examples/) 目录：

- **[Next.js 完整示例](./examples/nextjs/)** - 包含 API 路由、页面组件、错误处理
- **[Node.js 服务示例](./examples/nodejs/)** - Express 服务器集成
- **[基础 API 示例](./examples/basic/)** - 所有功能演示

## 🔗 相关链接

- [LogLayer 官方文档](https://loglayer.dev/)
- [GitHub 仓库](https://github.com/yai-nexus/loglayer-support)
- [问题反馈](https://github.com/yai-nexus/loglayer-support/issues)

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT License](./LICENSE) - 可自由使用于商业和开源项目。
