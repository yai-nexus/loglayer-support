# LogLayer React 示例

这是一个 React + Vite 应用示例，展示了 loglayer-support v0.6.0 新的 `createBrowserLogger` API 在 React 应用中的使用。

## 🚀 功能特性

### 🌐 浏览器端日志器功能
- ✅ **多输出支持**: Console + LocalStorage
- ✅ **智能采样**: 开发环境全量，生产环境采样
- ✅ **自动错误捕获**: 全局错误和未处理的 Promise 拒绝
- ✅ **性能监控**: 自动记录页面加载和操作性能
- ✅ **彩色控制台**: 分级别的彩色输出
- ✅ **上下文信息**: 自动包含 URL、UserAgent 等信息

### 📊 演示功能
- 基础日志记录（info、warn、error）
- 用户操作跟踪
- API 调用模拟和监控
- 性能测试和记录
- 本地存储日志查看
- 错误处理演示

## 🛠️ 快速开始

### 1. 安装依赖

```bash
cd examples/react
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3001 启动。

### 3. 构建生产版本

```bash
npm run build
npm run preview
```

## 📝 代码示例

### 基础日志器配置

```typescript
import { createBrowserLoggerSync } from '@yai-nexus/loglayer-support'

export const logger = createBrowserLoggerSync({
  level: import.meta.env.DEV ? 'debug' : 'info',
  outputs: {
    console: {
      colorized: true,
      groupCollapsed: true
    },
    localStorage: {
      key: 'react-app-logs',
      maxEntries: 200
    }
  },
  errorHandling: {
    captureGlobalErrors: true,
    captureUnhandledRejections: true
  },
  performance: {
    enablePerformanceLogging: true,
    autoLogPageLoad: true
  }
})
```

### React 组件中使用

```typescript
import { logger, logUserAction, logPerformance } from './logger'

function MyComponent() {
  useEffect(() => {
    logger.info('组件挂载', { component: 'MyComponent' })
    
    return () => {
      logger.debug('组件卸载', { component: 'MyComponent' })
    }
  }, [])

  const handleClick = () => {
    const start = performance.now()
    // 执行操作
    const duration = performance.now() - start
    
    logUserAction('click', 'my-button')
    logPerformance('button-click', duration)
  }

  return <button onClick={handleClick}>点击我</button>
}
```

### 错误处理

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.logError(error as Error, { 
    context: 'user-action',
    userId: '123' 
  }, '操作失败')
}
```

## 🔍 查看日志

### 1. 浏览器控制台
打开开发者工具的 Console 标签，查看彩色分级的日志输出。

### 2. 本地存储
在开发者工具的 Application > Local Storage 中查看 `react-app-logs` 键。

### 3. 应用内显示
应用界面下方有日志输出区域，显示主要的日志活动。

## 🎯 最佳实践

### 1. 环境配置
```typescript
const logger = createBrowserLoggerSync({
  level: import.meta.env.DEV ? 'debug' : 'info',
  sampling: {
    rate: import.meta.env.DEV ? 1.0 : 0.2, // 生产环境采样
    levelRates: {
      error: 1.0, // 错误总是记录
      warn: 0.8,
      info: 0.5,
      debug: 0.1
    }
  }
})
```

### 2. 组件生命周期跟踪
```typescript
const useComponentLogger = (componentName: string) => {
  useEffect(() => {
    logger.debug(`${componentName} 挂载`)
    return () => logger.debug(`${componentName} 卸载`)
  }, [componentName])
}
```

### 3. 性能监控
```typescript
const usePerformanceLogger = () => {
  const logOperation = useCallback((name: string, fn: () => void) => {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    logger.logPerformance(name, duration)
  }, [])
  
  return { logOperation }
}
```

## 📚 相关链接

- [框架预设使用指南](../../src/frameworks/USAGE.md)
- [API 参考文档](../../docs/frameworks-api-reference.md)
- [Next.js 示例](../nextjs/)
- [主项目文档](../../README.md)
