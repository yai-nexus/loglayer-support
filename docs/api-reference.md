# API 参考文档

本文档提供 `@yai-nexus/loglayer-support` 所有 API 的详细说明。

## 核心 API

### `createNextjsLoggerSync(options?)`

**最常用的 API**，适合 Next.js 和需要同步创建的场景。

#### 参数

```typescript
interface NextjsLoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';  // 默认: 'info'
  enableFileLogging?: boolean;                   // 默认: false
  logDir?: string;                              // 默认: './logs'
  enableConsole?: boolean;                      // 默认: true
}
```

#### 使用示例

```typescript
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

// 基础使用
const logger = createNextjsLoggerSync();

// 自定义配置
const logger = createNextjsLoggerSync({
  level: 'debug',
  enableFileLogging: true,
  logDir: './my-logs',
  enableConsole: false
});
```

#### 返回值

返回一个 `Logger` 实例，包含以下方法：

- `debug(message: string, meta?: object): void`
- `info(message: string, meta?: object): void`
- `warn(message: string, meta?: object): void`
- `error(message: string, meta?: object): void`
- `child(meta: object): Logger` - 创建子日志器

---

### `createLoggerWithPreset(preset, options?)`

使用预设配置快速创建日志器。

#### 参数

```typescript
type Preset = 'development' | 'production' | 'nextjsCompatible';

interface PresetOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  logDir?: string;
  enableFileLogging?: boolean;
}
```

#### 预设说明

- **`development`**: 详细日志 + 控制台输出，适合开发环境
- **`production`**: 文件日志 + 性能优化，适合生产环境
- **`nextjsCompatible`**: 确保在所有 Next.js 环境中工作

#### 使用示例

```typescript
import { createLoggerWithPreset } from '@yai-nexus/loglayer-support';

// 开发环境
const devLogger = await createLoggerWithPreset('development');

// 生产环境
const prodLogger = await createLoggerWithPreset('production');

// Next.js 兼容模式
const nextLogger = await createLoggerWithPreset('nextjsCompatible');

// 自定义选项
const customLogger = await createLoggerWithPreset('production', {
  level: 'warn',
  logDir: './custom-logs'
});
```

---

### `createEnhancedLogger(config)`

完全自定义配置的高级 API。

#### 参数

```typescript
interface EnhancedLoggerConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  transports?: ('pino' | 'winston' | 'console')[];
  enableFileLogging?: boolean;
  logDir?: string;
  pinoOptions?: PinoOptions;
  winstonOptions?: WinstonOptions;
  redactionOptions?: RedactionOptions;
}
```

#### 使用示例

```typescript
import { createEnhancedLogger } from '@yai-nexus/loglayer-support';

const logger = await createEnhancedLogger({
  level: 'info',
  transports: ['pino', 'console'],
  enableFileLogging: true,
  logDir: './logs',
  pinoOptions: {
    formatters: {
      level: (label) => ({ level: label })
    }
  },
  redactionOptions: {
    paths: ['password', 'token', 'secret']
  }
});
```

## 日志器方法

### 基础日志方法

```typescript
// 调试信息（仅在 debug 级别显示）
logger.debug('调试信息', { query: 'SELECT * FROM users' });

// 一般信息
logger.info('用户登录', { userId: '12345' });

// 警告信息
logger.warn('API 响应较慢', { duration: 2500 });

// 错误信息
logger.error('操作失败', { error: error.message });
```

### 子日志器

```typescript
// 创建带上下文的子日志器
const requestLogger = logger.child({
  requestId: 'req-12345',
  userId: 'user-67890'
});

// 所有后续日志都会自动包含上下文
requestLogger.info('开始处理请求');
requestLogger.debug('查询数据库');
```

## 配置选项详解

### 日志级别

- **`debug`**: 详细的调试信息，仅在开发环境使用
- **`info`**: 一般信息，记录正常的业务流程
- **`warn`**: 警告信息，需要注意但不影响功能
- **`error`**: 错误信息，记录异常和错误

### 传输器选项

- **`pino`**: 高性能 JSON 日志库，适合生产环境
- **`winston`**: 功能丰富的日志库，支持多种格式
- **`console`**: 控制台输出，适合开发环境

### 文件日志配置

```typescript
{
  enableFileLogging: true,    // 启用文件日志
  logDir: './logs',          // 日志目录
  // 文件会自动按日期轮转：app-2024-01-01.log
}
```

## 环境变量支持

可以通过环境变量配置日志行为：

```bash
# 日志级别
LOG_LEVEL=debug|info|warn|error

# 是否启用文件日志
LOG_TO_FILE=true|false

# 日志目录
LOG_DIR=./custom-logs

# 是否启用控制台输出
LOG_TO_CONSOLE=true|false
```

## 类型定义

```typescript
interface Logger {
  debug(message: string, meta?: object): void;
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
  child(meta: object): Logger;
}

interface LogMeta {
  [key: string]: any;
}
```

## 错误处理

所有 API 都包含内置的错误处理机制：

- 如果首选传输器失败，会自动回退到控制台输出
- 文件写入失败不会影响应用程序运行
- 配置错误会显示警告但不会中断程序

## 性能考虑

- `createNextjsLoggerSync` 是同步的，适合需要立即使用的场景
- `createLoggerWithPreset` 和 `createEnhancedLogger` 是异步的，但提供更多功能
- 在生产环境中，建议使用 `info` 或更高级别以减少日志量
- 结构化日志比字符串拼接性能更好，也更易于查询

## 兼容性

- **Node.js**: 16.0.0+
- **Next.js**: 12.0.0+（推荐 14.0.0+）
- **TypeScript**: 4.5.0+
- **浏览器**: 支持现代浏览器（ES2020+）

## 迁移指南

### 从其他日志库迁移

```typescript
// 从 console 迁移
// 之前
console.log('用户登录', userId);

// 之后
logger.info('用户登录', { userId });

// 从 winston 迁移
// 之前
winston.info('用户登录', { userId });

// 之后
const logger = createNextjsLoggerSync();
logger.info('用户登录', { userId });
```

---

**返回**: [主文档](../README.md) | **下一步**: [使用指南](./usage-guide.md)
