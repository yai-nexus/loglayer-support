# 使用示例

这个目录包含了 `@yai-nexus/loglayer-support` 在不同场景下的使用示例。

## 📁 目录结构

- **`basic/`** - 基础使用示例，展示所有主要 API
- **`nextjs/`** - Next.js 项目中的使用示例  
- **`nodejs/`** - Node.js 服务应用中的使用示例

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装核心库
npm install @yai-nexus/loglayer-support loglayer

# 安装传输器（选择一个或多个）
npm install @loglayer/transport-pino pino
npm install @loglayer/transport-winston winston
```

### 2. 选择合适的示例

#### Next.js 项目
查看 `nextjs/` 目录下的示例，特别是：
- `logger.ts` - 基础配置
- `api-route-example.ts` - API 路由中的使用

#### Node.js 服务
查看 `nodejs/server.ts` 了解如何在服务端应用中使用。

#### 基础学习
从 `basic/basic-usage.ts` 开始，了解所有核心功能。

## 📖 主要特性示例

### 环境自适应
```typescript
// 自动检测环境并选择最佳传输器
const logger = createNextjsLoggerSync('my-app');
```

### 结构化日志
```typescript
logger.info('用户登录', {
  userId: '123',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString()
});
```

### 上下文绑定
```typescript
// 为特定请求创建 logger
const requestLogger = logger.forRequest('req-123');
requestLogger.info('开始处理请求');

// 为特定用户创建 logger
const userLogger = logger.forUser('user-456');
userLogger.info('用户操作完成');
```

### 错误处理
```typescript
try {
  // 业务逻辑
} catch (error) {
  logger.logError(error, { context: 'payment' }, '支付处理失败');
}
```

### 性能监控
```typescript
const startTime = Date.now();
// ... 执行操作
logger.logPerformance('db_query', Date.now() - startTime, {
  query: 'SELECT * FROM users'
});
```

## 💡 最佳实践

1. **全局 Logger**: 在应用入口创建一个全局 logger 实例
2. **请求级别**: 为每个请求创建专用的 logger 实例
3. **模块分离**: 为不同模块创建专用的 logger
4. **结构化数据**: 始终使用结构化的元数据
5. **错误上下文**: 记录错误时提供充分的上下文信息

## 🔧 配置建议

### 开发环境
```typescript
const logger = await createLoggerWithPreset('my-app', 'development');
```

### 生产环境  
```typescript
const logger = await createLoggerWithPreset('my-app', 'production');
```

### Next.js 专用
```typescript
const logger = createNextjsLoggerSync('my-nextjs-app');
```