# 内部实现策略

## 🎯 设计原则

**用户零感知 + 自动优化 = 最佳体验**

- 用户完全不需要知道内部用什么引擎
- 系统自动选择最适合的实现
- 基础功能永远可用，性能按需提升

## 🏗️ 三层实现架构

### 1. 核心基础层（必需，零依赖）
```typescript
// 基于 Node.js 原生 API 的基础实现
class CoreLogger {
  // 使用原生 console + fs + http
  // 优点：零依赖，永远可用，轻量
  // 缺点：性能一般，功能基础
}
```

### 2. 性能增强层（可选，自动检测）
```typescript
// 如果检测到有这些库，自动使用高性能引擎
const engines = [
  { name: 'pino', check: () => tryImport('pino') },
  { name: 'winston', check: () => tryImport('winston') },
];
```

### 3. 智能选择层（自动，用户无感知）
```typescript
// 根据环境和可用性自动选择最佳引擎
function selectBestEngine(environment, outputs) {
  // 优先级策略（用户完全感知不到）
}
```

## 🚀 自动选择策略

### 🔍 环境隔离保护
```typescript
function createLogger(name: string, config: LoggerConfig) {
  // 关键：环境检测在引擎选择之前
  const environment = detectEnvironment();
  
  if (environment.isServer) {
    return createServerLogger(name, config);
  } else if (environment.isClient) {
    return createClientLogger(name, config);  // 完全独立的客户端实现
  }
}
```

### 服务端环境（Node.js）
```typescript
const serverEngineStrategy = {
  // 1. 首选：Pino（如果可用）
  preferred: 'pino',
  reason: '高性能，异步，JSON 原生',
  
  // 2. 备选：Winston（如果可用）
  fallback: 'winston', 
  reason: '功能丰富，兼容性好',
  
  // 3. 保底：Core（原生实现）
  guaranteed: 'core',
  reason: '零依赖，永远可用'
};

// 服务端引擎选择（只在服务端执行）
function selectServerEngine() {
  if (canUse('pino')) return new PinoAdapter();
  if (canUse('winston')) return new WinstonAdapter();
  return new CoreServerLogger(); // 服务端原生实现
}
```

### 浏览器环境（完全隔离）
```typescript
const clientEngineStrategy = {
  // 浏览器环境永远不尝试加载 Node.js 库
  guaranteed: 'browser-console',
  reason: '浏览器原生，与服务端完全隔离'
};

// 客户端引擎选择（永远不涉及 pino/winston）
function selectClientEngine() {
  // 直接返回浏览器专用实现，不做任何 Node.js 库检测
  return new BrowserLogger();
}
```

### 🛡️ 关键保护机制
```typescript
class EngineLoader {
  static async loadBestEngine(environment: Environment) {
    // 关键：根据环境完全分离逻辑
    if (environment.isServer) {
      return this.loadServerEngine();  // 只有这里会涉及 pino/winston
    } else {
      return this.loadClientEngine();  // 永远不会尝试加载 Node.js 库
    }
  }
  
  private static async loadServerEngine() {
    // 只在服务端环境执行
    try {
      if (await this.canImport('pino')) {
        const { pino } = await import('pino');
        return new PinoAdapter(pino);
      }
      // ... winston 检测
    } catch (error) {
      // 服务端失败回退
      return new CoreServerLogger();
    }
  }
  
  private static loadClientEngine() {
    // 浏览器环境：直接返回，不做任何动态导入
    return new BrowserLogger();  // 基于浏览器原生 API
  }
}

## 📦 依赖管理策略

### 包依赖结构
```json
{
  "dependencies": {
    "loglayer": "^6.6.0"
  },
  "optionalDependencies": {
    "pino": "^9.0.0",
    "winston": "^3.0.0",
    "@loglayer/transport-pino": "^2.0.0",
    "@loglayer/transport-winston": "^2.0.0"
  }
}
```

### 动态引擎加载
```typescript
class EngineLoader {
  static async loadBestEngine(environment: Environment) {
    try {
      // 尝试加载高性能引擎
      if (environment.isServer) {
        return await this.loadServerEngine();
      } else {
        return await this.loadClientEngine();
      }
    } catch (error) {
      // 任何失败都回退到基础实现
      console.warn('使用基础日志引擎:', error.message);
      return new CoreLogger();
    }
  }
  
  private static async loadServerEngine() {
    // 动态检测和加载
    if (await this.canImport('pino')) {
      const { pino } = await import('pino');
      const { PinoTransport } = await import('@loglayer/transport-pino');
      return new PinoAdapter(pino, PinoTransport);
    }
    
    if (await this.canImport('winston')) {
      const winston = await import('winston');
      const { WinstonTransport } = await import('@loglayer/transport-winston');
      return new WinstonAdapter(winston, WinstonTransport);
    }
    
    // 保底方案
    return new CoreLogger();
  }
}
```

## 🔧 实现示例

### 服务端核心引擎（基础实现）
```typescript
class CoreServerLogger implements ILogger {
  private outputs: OutputConfig[];
  
  constructor(config: LoggerConfig) {
    this.outputs = config.server.outputs;
  }
  
  info(message: string, meta?: object) {
    this.outputs.forEach(output => {
      switch (output.type) {
        case 'stdout':
          this.writeToStdout(message, meta, 'info');
          break;
        case 'file':
          this.writeToFile(message, meta, 'info', output.config);
          break;
        case 'http':
          this.sendToHttp(message, meta, 'info', output.config);
          break;
      }
    });
  }
  
  private writeToStdout(message: string, meta: object, level: string) {
    // 服务端：使用 Node.js console
    const timestamp = new Date().toISOString();
    const formatted = `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`;
    console.log(formatted);
  }
  
  private writeToFile(message: string, meta: object, level: string, config: any) {
    // 服务端：使用 Node.js fs
    const fs = require('fs');
    const path = require('path');
    
    const timestamp = new Date().toISOString();
    const formatted = `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}\n`;
    
    const filePath = path.join(config.dir || './logs', config.filename || 'app.log');
    fs.appendFileSync(filePath, formatted);
  }
}
```

### 浏览器核心引擎（完全独立）
```typescript
class BrowserLogger implements ILogger {
  private outputs: ClientOutputConfig[];
  
  constructor(config: LoggerConfig) {
    this.outputs = config.client.outputs;
  }
  
  info(message: string, meta?: object) {
    this.outputs.forEach(output => {
      switch (output.type) {
        case 'console':
          this.writeToConsole(message, meta, 'info');
          break;
        case 'http':
          this.sendToServer(message, meta, 'info', output.config);
          break;
        case 'localstorage':
          this.saveToStorage(message, meta, 'info', output.config);
          break;
      }
    });
  }
  
  private writeToConsole(message: string, meta: object, level: string) {
    // 浏览器：使用浏览器 console API
    const timestamp = new Date().toISOString();
    const style = this.getConsoleStyle(level);
    console.log(`%c${timestamp} [${level.toUpperCase()}] ${message}`, style, meta);
  }
  
  private sendToServer(message: string, meta: object, level: string, config: any) {
    // 浏览器：使用 fetch API
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.warn('日志上报失败:', err));
  }
  
  private getConsoleStyle(level: string): string {
    // 浏览器控制台样式
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336'
    };
    return styles[level] || '';
  }
}
```

### 高性能适配器
```typescript
class PinoAdapter implements ILogger {
  private pino: any;
  
  constructor(pinoInstance: any) {
    this.pino = pinoInstance;
  }
  
  info(message: string, meta?: object) {
    // 使用 Pino 的高性能实现
    this.pino.info(meta, message);
  }
}
```

## 🎯 用户体验

### 用户视角（完全透明）
```typescript
// 用户只需要这样使用，完全不知道内部用什么
const logger = createLogger('my-app', {
  level: { default: 'info' },
  server: {
    outputs: [
      { type: 'stdout' },
      { type: 'file', config: { dir: './logs' } }
    ]
  }
});

logger.info('用户登录', { userId: 123 });
// 内部自动选择最佳引擎，用户无感知
```

### 内部自动优化
```typescript
// 场景1：用户安装了 pino
// 内部自动使用：PinoAdapter + 高性能异步写入

// 场景2：用户没安装任何额外依赖  
// 内部自动使用：CoreLogger + 原生同步写入

// 场景3：某个依赖加载失败
// 内部自动降级：CoreLogger + 错误提示但不中断服务
```

## ✨ 优势总结

1. **用户零负担**：完全不需要了解内部实现
2. **性能最优**：自动使用最佳可用引擎
3. **永远可用**：基础功能不依赖外部库
4. **体积最小**：核心只有必需依赖
5. **渐进增强**：安装可选依赖自动提升性能

## 📋 实现优先级

### Phase 1: 核心基础（必须）
- 实现 CoreLogger（原生 console + fs + http）
- 基础的 stdout、file、http 输出
- 简单的 pretty 格式化

### Phase 2: 智能检测（重要）
- 实现引擎检测逻辑
- 实现 PinoAdapter 和 WinstonAdapter
- 自动选择和降级机制

### Phase 3: 优化增强（可选）
- 性能优化（批量写入、异步队列）
- 更多输出格式支持
- 高级功能（日志轮转、压缩等）

这样的实现策略让用户获得最佳体验：
- **新手**：零配置，自动用最简单可靠的实现
- **进阶**：安装 pino，自动获得高性能
- **专家**：所有功能都可用，但不需要手动配置