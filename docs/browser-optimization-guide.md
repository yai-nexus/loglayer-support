# Browser日志组件优化方案

## 概述

本次优化基于"简单易用，复杂度统一放在组件内部"的设计原则，对browser日志组件进行了全面重构，大幅简化了业务接入的复杂度。

## 优化成果对比

### 原有接入方式

```typescript
// 需要100+行配置代码
const getEnv = (key: string, defaultValue = '') => {
  /* 复杂的环境变量读取逻辑 */
};
const createConfig = () => {
  /* 大量配置逻辑 */
};
let loggerInstance: any = null;
let initPromise: Promise<any> | null = null;
const initLogger = async () => {
  /* 复杂的异步初始化 */
};

export const logger: LoggerInterface = {
  debug: async (message: string, data?: any) => {
    const log = await initLogger(); // 每次都需要await
    log.debug(message, { data, service: config.app.name, environment: 'client' });
  },
  // ... 其他异步方法
};
```

### 新的接入方式

```typescript
// 只需要1行代码
export const logger = createAppLogger({ appName: 'my-app' });

// 立即可用，无需await
logger.info('应用启动', { version: '1.0.0' });
```

## 核心优化内容

### 1. 极简接入API

#### 基础用法

```typescript
import { createAppLogger } from '@yai-loglayer/browser';

// 最简单的用法
const logger = createAppLogger({ appName: 'my-app' });

// 指定环境
const logger = createAppLogger({
  appName: 'my-app',
  environment: 'production',
});
```

#### 预设配置

```typescript
import {
  createDevelopmentLogger,
  createProductionLogger,
  createLoggerByEnvironment,
} from '@yai-loglayer/browser';

// 使用预设
const devLogger = createDevelopmentLogger('my-app');
const prodLogger = createProductionLogger('my-app');

// 自动选择环境
const autoLogger = createLoggerByEnvironment('my-app');
```

#### 配置构建器

```typescript
import { createLoggerBuilder } from '@yai-loglayer/browser';

const logger = createLoggerBuilder('my-app')
  .environment('production')
  .level('warn')
  .console(false)
  .http(true, '/api/logs')
  .sls(true)
  .build();
```

### 2. 智能配置推断

组件内部自动检测环境变量，智能推断最佳配置：

- **日志级别**: 开发环境默认debug，生产环境默认warn
- **控制台输出**: 开发/测试环境启用，生产环境禁用
- **HTTP上报**: 生产/预发布环境启用
- **SLS上报**: 仅在配置完整且生产环境时启用
- **缓冲区大小**: 根据环境调整（开发5条，生产50条）
- **刷新间隔**: 根据环境调整（开发2秒，生产10秒）

### 3. 同步返回机制

- **立即可用**: logger实例同步返回，无需等待异步初始化
- **内部缓存**: 初始化期间的日志会被缓存，初始化完成后批量发送
- **透明代理**: 与LogLayer接口完全兼容

### 4. 原生SLS支持

在browser-transport中原生支持阿里云SLS：

```typescript
// 自动构建SLS格式
const slsLogs = logsToSend.map((log) => ({
  time: Math.floor(log.timestamp / 1000),
  contents: [
    { key: 'level', value: log.level },
    { key: 'message', value: log.message },
    { key: 'data', value: JSON.stringify(log.data || {}) },
  ],
}));
```

### 5. 多级降级机制

实现了优雅的错误处理和多级降级：

1. **基本控制台输出** (优先级最高)
2. **localStorage输出**
3. **控制台+localStorage组合**
4. **原生console** (最后降级)

```typescript
// 错误处理示例
const logger = safeExecute(
  () => createBrowserLogLayer(outputs),
  globalErrorHandler.handleError(error), // 自动降级
  LoggerErrorType.INITIALIZATION_FAILED,
  'Logger creation failed'
);
```

### 6. 预设配置模板

提供多种预设配置，覆盖常见场景：

- **环境预设**: development, test, staging, production
- **场景预设**: debug, silent, offline, performance
- **自定义预设**: 支持基于预设进行定制

## 文件结构

```
packages/browser/src/
├── app-logger.ts          # 简化的业务接入API
├── sync-logger-wrapper.ts # 同步Logger包装器
├── error-handler.ts       # 错误处理和降级机制
├── presets.ts            # 预设配置模板
├── browser-transport.ts   # 增强的Transport（支持SLS）
└── index.ts              # 统一导出
```

## 使用建议

### 推荐的接入方式

1. **快速开始**: 使用`createAppLogger({ appName: 'your-app' })`
2. **环境区分**: 使用`createLoggerByEnvironment('your-app')`
3. **特殊需求**: 使用配置构建器或预设定制

### 迁移指南

原有的复杂配置代码可以完全删除，替换为：

```typescript
// 替换原有的100+行配置代码
export const logger = createAppLogger({
  appName: process.env.NEXT_PUBLIC_SERVICE_NAME || 'your-app',
});
```

## 性能优化

- **智能批处理**: 根据环境调整批处理大小和间隔
- **离线缓存**: 网络断开时自动缓存，恢复后批量发送
- **内存管理**: 限制缓存大小，防止内存泄漏
- **错误恢复**: 发送失败时的重试机制

## 兼容性

- 完全向后兼容现有的LogLayer API
- 支持所有现有的输出类型（console, http, localStorage, sls）
- 保持与@yai-loglayer/core的类型兼容性

## 总结

通过这次优化，我们实现了：

1. **接入复杂度降低95%**: 从100+行配置代码减少到1行
2. **使用体验提升**: 同步返回，立即可用
3. **功能完整性**: 支持所有原有功能，新增SLS原生支持
4. **稳定性增强**: 多级降级机制，确保任何情况下都能工作
5. **开发效率提升**: 预设配置覆盖常见场景，开箱即用

这个优化方案完美体现了"简单易用，复杂度统一放在组件内部"的设计原则，为业务方提供了极致简化的接入体验。
