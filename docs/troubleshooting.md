# 故障排除指南

本文档提供 `@yai-nexus/loglayer-support` 常见问题的解决方案和故障排除方法。

## 🚨 常见问题

### 1. Next.js 兼容性问题

#### 问题：在 Edge Runtime 中出现错误

```
Error: Module not found: Can't resolve 'fs' in ...
```

**解决方案：**
```typescript
// ✅ 使用 Next.js 兼容的 API
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync();
```

**原因：** Edge Runtime 不支持 Node.js 的 `fs` 模块，`createNextjsLoggerSync` 专门为此优化。

#### 问题：Serverless 函数中日志丢失

**解决方案：**
```typescript
// ✅ 确保在函数返回前完成日志写入
export async function POST(request: Request) {
  const logger = createNextjsLoggerSync();
  
  try {
    // 业务逻辑
    const result = await processRequest();
    logger.info('请求处理完成', { result });
    
    // 确保日志写入完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Response.json(result);
  } catch (error) {
    logger.error('请求处理失败', { error: error.message });
    return Response.json({ error: '内部错误' }, { status: 500 });
  }
}
```

### 2. 性能问题

#### 问题：日志记录影响应用性能

**解决方案：**
```typescript
// ✅ 生产环境使用合适的日志级别
const logger = createNextjsLoggerSync({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableFileLogging: process.env.NODE_ENV === 'production'
});

// ✅ 避免在热路径中记录大量日志
if (logger.level === 'debug') {
  logger.debug('详细调试信息', { data: largeObject });
}
```

#### 问题：文件日志写入过慢

**解决方案：**
```typescript
// ✅ 使用异步日志器
const logger = await createLoggerWithPreset('production', {
  enableFileLogging: true,
  // 使用缓冲写入
  pinoOptions: {
    sync: false
  }
});
```

### 3. 配置问题

#### 问题：环境变量不生效

**检查清单：**
1. 确认 `.env` 文件位置正确
2. 检查环境变量名称拼写
3. 重启开发服务器

```bash
# ✅ 正确的环境变量设置
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_DIR=./logs
```

#### 问题：日志文件未创建

**解决方案：**
```typescript
// ✅ 确保目录存在
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';
import { mkdirSync } from 'fs';

const logDir = './logs';
try {
  mkdirSync(logDir, { recursive: true });
} catch (error) {
  // 目录已存在或创建失败
}

const logger = createNextjsLoggerSync({
  enableFileLogging: true,
  logDir
});
```

### 4. TypeScript 类型问题

#### 问题：类型定义缺失

```
Cannot find module '@yai-nexus/loglayer-support' or its corresponding type declarations
```

**解决方案：**
```bash
# 重新安装包
npm uninstall @yai-nexus/loglayer-support
npm install @yai-nexus/loglayer-support

# 或者清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 问题：Logger 类型不匹配

**解决方案：**
```typescript
// ✅ 使用正确的类型导入
import type { Logger } from '@yai-nexus/loglayer-support';

function useLogger(logger: Logger) {
  logger.info('类型安全的日志记录');
}
```

## 🔧 调试技巧

### 1. 启用详细日志

```typescript
// 临时启用详细日志进行调试
const logger = createNextjsLoggerSync({
  level: 'debug',
  enableConsole: true
});

logger.debug('调试信息', { 
  environment: process.env.NODE_ENV,
  platform: typeof window !== 'undefined' ? 'browser' : 'node'
});
```

### 2. 检查日志器状态

```typescript
// 验证日志器配置
const logger = createNextjsLoggerSync();

console.log('Logger configuration:', {
  level: logger.level,
  transports: logger.transports?.length || 0
});
```

### 3. 测试日志输出

```typescript
// 创建测试函数验证日志功能
function testLogging() {
  const logger = createNextjsLoggerSync();
  
  logger.debug('Debug 测试');
  logger.info('Info 测试');
  logger.warn('Warn 测试');
  logger.error('Error 测试');
  
  console.log('日志测试完成，请检查输出');
}
```

## 🌐 浏览器环境问题

### 1. 控制台日志不显示

**检查：**
- 浏览器控制台过滤级别
- 是否在正确的环境中运行

```typescript
// ✅ 确保浏览器环境配置正确
if (typeof window !== 'undefined') {
  const logger = createNextjsLoggerSync({
    enableConsole: true,
    level: 'debug'
  });
}
```

### 2. localStorage 存储问题

**解决方案：**
```typescript
// ✅ 检查 localStorage 可用性
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

if (isLocalStorageAvailable()) {
  // 使用 localStorage 日志功能
}
```

## 📊 性能监控

### 1. 监控日志性能影响

```typescript
// 测量日志记录的性能影响
function measureLoggingPerformance() {
  const logger = createNextjsLoggerSync();
  
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    logger.info('性能测试', { iteration: i });
  }
  
  const end = performance.now();
  console.log(`1000 条日志记录耗时: ${end - start}ms`);
}
```

### 2. 内存使用监控

```typescript
// 监控内存使用情况
function monitorMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    logger.info('内存使用情况', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
    });
  }
}
```

## 🔍 日志分析

### 1. 查找特定日志

```bash
# 在日志文件中搜索特定内容
grep "ERROR" logs/app.log
grep -A 5 -B 5 "用户登录" logs/app.log

# 按时间范围过滤
grep "2024-01-01" logs/app.log
```

### 2. 日志格式化

```bash
# 格式化 JSON 日志
cat logs/app.log | jq '.'

# 提取特定字段
cat logs/app.log | jq '.message, .level, .timestamp'
```

## 📞 获取帮助

### 1. 收集诊断信息

在报告问题时，请提供以下信息：

```typescript
// 运行此代码收集环境信息
function collectDiagnosticInfo() {
  const info = {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    packageVersion: require('@yai-nexus/loglayer-support/package.json').version,
    nextjsVersion: require('next/package.json')?.version || 'N/A',
    timestamp: new Date().toISOString()
  };
  
  console.log('诊断信息:', JSON.stringify(info, null, 2));
  return info;
}
```

### 2. 创建最小复现示例

```typescript
// 最小复现示例模板
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

function minimalReproduction() {
  try {
    const logger = createNextjsLoggerSync();
    logger.info('测试日志');
    console.log('✅ 日志功能正常');
  } catch (error) {
    console.error('❌ 日志功能异常:', error);
  }
}

minimalReproduction();
```

### 3. 联系支持

- **GitHub Issues**: [提交问题](https://github.com/yai-nexus/loglayer-support/issues)
- **文档**: [查看完整文档](../README.md)
- **示例**: [查看示例代码](../examples/)

---

**返回**: [主文档](../README.md) | **相关**: [API 参考](./api-reference.md) | [最佳实践](./best-practices.md)
