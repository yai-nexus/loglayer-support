# 迁移指南

## 📋 概述

本指南帮助您从旧版本的 `loglayer-support` 迁移到新的框架预设 API。

## 🔄 主要变化

### 1. 浏览器端日志器

#### 旧版本 (client-logger.ts)

```typescript
// ❌ 旧版本 - 硬编码配置
import { createLogger } from '@yai-nexus/loglayer-support'

const clientConfig = {
  level: { default: 'debug' },
  client: {
    outputs: [
      { type: 'console', config: { colorized: true } },
      { type: 'localStorage', config: { key: 'app-logs', maxEntries: 500 } }
    ]
  }
}

const logger = await createLogger('client', clientConfig)
```

#### 新版本 (createBrowserLogger)

```typescript
// ✅ 新版本 - 配置驱动
import { createBrowserLogger } from '@yai-nexus/loglayer-support'

const logger = await createBrowserLogger({
  level: 'debug',
  outputs: {
    console: { colorized: true },
    localStorage: { key: 'app-logs', maxEntries: 500 }
  }
})
```

### 2. 服务端日志器

#### 旧版本 (server-logger.ts)

```typescript
// ❌ 旧版本 - Proxy 方案
import { createLogger } from '@yai-nexus/loglayer-support'

let serverLoggerInstance: IEnhancedLogger | null = null
const serverLoggerPromise = createLogger('server', serverConfig).then(logger => {
  serverLoggerInstance = logger
  return logger
})

export const serverLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger()
    return (logger as any)[prop]
  }
})

export const apiLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger().forModule('api')
    return (logger as any)[prop]
  }
})
```

#### 新版本 (createServerLogger)

```typescript
// ✅ 新版本 - 工厂函数
import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'

export const serverInstance = await createNextjsServerLogger({
  modules: {
    api: { level: 'info' },
    database: { level: 'debug' }
  }
})

export const serverLogger = serverInstance.logger
export const apiLogger = serverInstance.forModule('api')
```

### 3. 日志接收器

#### 旧版本 (route.ts)

```typescript
// ❌ 旧版本 - 框架耦合
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const logReceiver = apiLogger.forModule('client-log-receiver')
  
  try {
    const clientLogData = await request.json()
    
    if (!clientLogData.level || !clientLogData.message) {
      return NextResponse.json({ success: false }, { status: 400 })
    }
    
    // 硬编码的处理逻辑...
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

#### 新版本 (createLogReceiver)

```typescript
// ✅ 新版本 - 框架无关
import { createNextjsLogReceiver } from '@yai-nexus/loglayer-support'
import { serverLogger } from '../../../lib/server-logger'

export const POST = createNextjsLogReceiver(serverLogger, {
  validation: {
    requireLevel: true,
    requireMessage: true,
    maxMessageLength: 2000
  },
  processing: {
    supportBatch: true
  },
  security: {
    rateLimiting: {
      maxRequestsPerMinute: 100
    }
  }
})

export async function GET() {
  const status = POST.getStatus()
  return NextResponse.json(status)
}
```

## 📝 迁移步骤

### 步骤 1: 更新依赖

确保您使用的是最新版本的 `loglayer-support`：

```bash
npm update @yai-nexus/loglayer-support
```

### 步骤 2: 迁移浏览器端日志器

1. **替换导入**：
   ```typescript
   // 旧版本
   import { createLogger } from '@yai-nexus/loglayer-support'
   
   // 新版本
   import { createBrowserLogger } from '@yai-nexus/loglayer-support'
   ```

2. **更新配置格式**：
   ```typescript
   // 旧版本
   const config = {
     level: { default: 'info' },
     client: {
       outputs: [
         { type: 'console', config: { colorized: true } }
       ]
     }
   }
   
   // 新版本
   const config = {
     level: 'info',
     outputs: {
       console: { colorized: true }
     }
   }
   ```

3. **更新创建方式**：
   ```typescript
   // 旧版本
   const logger = await createLogger('client', config)
   
   // 新版本
   const logger = await createBrowserLogger(config)
   ```

### 步骤 3: 迁移服务端日志器

1. **移除 Proxy 代码**：
   ```typescript
   // ❌ 删除这些代码
   export const serverLogger = new Proxy({} as IEnhancedLogger, {
     get(target, prop) {
       const logger = getServerLogger()
       return (logger as any)[prop]
     }
   })
   ```

2. **使用新的工厂函数**：
   ```typescript
   // ✅ 替换为
   import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'
   
   export const serverInstance = await createNextjsServerLogger({
     modules: {
       api: { level: 'info' },
       database: { level: 'debug' }
     }
   })
   
   export const serverLogger = serverInstance.logger
   export const apiLogger = serverInstance.forModule('api')
   ```

### 步骤 4: 迁移日志接收器

1. **替换 API Route 实现**：
   ```typescript
   // 旧版本 - 删除整个手动实现
   export async function POST(request: NextRequest) {
     // 大量手动代码...
   }
   
   // 新版本 - 使用预设函数
   export const POST = createNextjsLogReceiver(serverLogger, {
     validation: { requireLevel: true, requireMessage: true },
     processing: { supportBatch: true }
   })
   ```

2. **添加状态端点**：
   ```typescript
   export async function GET() {
     const status = POST.getStatus()
     return NextResponse.json(status)
   }
   ```

### 步骤 5: 更新类型导入

```typescript
// 旧版本
import type { IEnhancedLogger, LoggerConfig } from '@yai-nexus/loglayer-support'

// 新版本
import type { 
  IBrowserLogger, 
  BrowserLoggerConfig,
  ServerLoggerInstance,
  ServerLoggerConfig 
} from '@yai-nexus/loglayer-support'
```

## ⚠️ 注意事项

### 1. 破坏性变化

- **Proxy 移除**：不再使用 Proxy 模式，需要更新所有相关代码
- **配置格式**：配置结构有显著变化，需要重新配置
- **导入路径**：新的预设函数有不同的导入路径

### 2. 兼容性

- **Node.js 版本**：需要 Node.js 16+ 
- **TypeScript 版本**：需要 TypeScript 4.5+
- **浏览器支持**：现代浏览器（ES2020+）

### 3. 性能影响

- **初始化**：新版本的初始化可能稍慢，但运行时性能更好
- **内存使用**：移除 Proxy 后内存使用更少
- **类型检查**：更好的类型安全性可能增加编译时间

## 🔧 故障排除

### 常见问题

1. **"Cannot read property of undefined" 错误**
   - 原因：Proxy 移除后的访问方式变化
   - 解决：使用新的工厂函数创建日志器

2. **配置不生效**
   - 原因：配置格式变化
   - 解决：参考新的配置格式更新配置

3. **类型错误**
   - 原因：类型定义变化
   - 解决：更新类型导入和使用方式

### 调试技巧

1. **启用调试模式**：
   ```typescript
   const logger = await createBrowserLogger({
     level: 'debug',
     debug: true
   })
   ```

2. **检查配置**：
   ```typescript
   console.log('Logger config:', logger.getConfig())
   ```

3. **监控状态**：
   ```typescript
   const stats = serverInstance.getStats()
   console.log('Logger stats:', stats)
   ```

## 📚 更多资源

- [使用指南](../src/frameworks/USAGE.md)
- [API 参考](./frameworks-api-reference.md)
- [示例项目](../examples/)
- [第一阶段总结](./phase-1-summary.md)

## 🤝 获取帮助

如果在迁移过程中遇到问题：

1. 查看 [故障排除指南](./troubleshooting.md)
2. 参考 [示例项目](../examples/)
3. 提交 [GitHub Issue](https://github.com/yai-nexus/loglayer-support/issues)
4. 加入社区讨论
