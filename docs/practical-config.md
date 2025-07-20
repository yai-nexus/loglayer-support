# 实用配置设计

## 🎯 用户真实需求分析

基于实际使用场景，用户真正需要配置的是：

### 1. 日志级别配置
- **全局默认级别**：整个应用的基础日志级别
- **按 logger name 配置**：不同模块可以有不同的日志级别

### 2. 服务端输出配置
- **多种输出手段**：stdout、file、sls 可以同时启用
- **输出格式自动绑定**：每种输出手段使用最适合的格式
- **输出位置配置**：文件路径、SLS 地址等

### 3. 客户端输出配置
- **浏览器环境**：console、http 等
- **格式和配置**：适合前端的输出方式

## 🔧 新配置接口设计

### 基础配置结构
```typescript
interface LoggerConfig {
  // 1. 日志级别配置
  level: {
    default: LogLevel;                    // 全局默认级别
    loggers?: Record<string, LogLevel>;   // 按 logger name 单独配置
  };
  
  // 2. 服务端输出配置
  server: {
    outputs: ServerOutput[];              // 多种输出手段
  };
  
  // 3. 客户端输出配置
  client: {
    outputs: ClientOutput[];              // 浏览器输出手段
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 服务端输出选项
interface ServerOutput {
  type: 'stdout' | 'file' | 'sls' | 'http';
  level?: LogLevel;      // 可选：这个输出的专用级别
  config?: ServerOutputConfig;
  // 格式自动绑定：
  // stdout → pretty (彩色易读)
  // file → pretty (易读的文本日志)
  // sls → structured (云服务优化)
  // http → json (标准接口)
}

interface ServerOutputConfig {
  // file 类型配置
  dir?: string;              // 文件目录
  filename?: string;         // 文件名
  maxSize?: string;          // 轮转大小
  maxFiles?: number;         // 保留文件数
  
  // sls 类型配置
  endpoint?: string;         // SLS 端点
  project?: string;          // 项目名
  logstore?: string;         // 日志库
  accessKey?: string;        // 访问密钥
  
  // http 类型配置
  url?: string;              // HTTP 端点
  headers?: Record<string, string>;  // 请求头
  
  // stdout 类型通常无需配置
}

// 客户端输出选项  
interface ClientOutput {
  type: 'console' | 'http' | 'localstorage';
  level?: LogLevel;      // 可选：这个输出的专用级别
  config?: ClientOutputConfig;
  // 格式自动绑定：
  // console → pretty (开发者工具友好)
  // http → json (服务器接口)
  // localstorage → json (结构化存储)
}

interface ClientOutputConfig {
  // console 类型：无需配置位置（固定输出到浏览器开发者工具）
  
  // http 类型：需要配置服务器端点
  endpoint?: string;         // 服务器接收日志的端点
  bufferSize?: number;       // 批量发送的缓冲区大小
  flushInterval?: number;    // 发送间隔（毫秒）
  headers?: Record<string, string>;  // 自定义请求头
  
  // localstorage 类型：需要配置存储 key
  key?: string;              // localStorage 的 key
  maxEntries?: number;       // 最大存储条数
  ttl?: number;              // 过期时间（毫秒）
}
```

### 实际使用示例

#### 1. 简单配置（90% 用户）
```typescript
const logger = createLogger('my-app', {
  level: { default: 'info' },
  server: {
    outputs: [
      { type: 'stdout' },                            // 自动 pretty 格式
      { type: 'file', config: { dir: './logs' } }   // 自动 pretty 格式，易读的文本日志
    ]
  },
  client: {
    outputs: [
      { type: 'console' }                            // 自动 pretty 格式
    ]
  }
});
```

#### 2. 按模块配置日志级别
```typescript
const logger = createLogger('my-app', {
  level: {
    default: 'info',                   // 全局默认
    loggers: {
      'database': 'debug',             // 数据库模块显示 debug
      'auth': 'warn',                  // 认证模块只显示 warn 以上
      'payment': 'debug',              // 支付模块显示详细信息
      'ui': 'error'                    // UI 模块只显示错误
    }
  },
  server: {
    outputs: [
      { type: 'stdout' },                                 // 自动 pretty 格式
      { 
        type: 'file', 
        config: { 
          dir: './logs',
          filename: 'app.log',
          maxSize: '10MB',
          maxFiles: 5
        }
      },
      {
        type: 'sls',
        level: 'warn',                                    // SLS 只记录警告以上
        config: {
          endpoint: 'https://sls.aliyun.com',
          project: 'my-project',
          logstore: 'app-logs',
          accessKey: process.env.SLS_ACCESS_KEY
        }
      }
    ]
  },
  client: {
    outputs: [
      { type: 'console' },                                // 自动 pretty 格式
      {
        type: 'http',
        level: 'error',                                   // 只上报错误到服务器
        config: {
          endpoint: '/api/client-logs',
          bufferSize: 10,
          flushInterval: 5000
        }
      }
    ]
  }
});
```

#### 3. 生产环境配置
```typescript
const logger = createLogger('my-app', {
  level: {
    default: 'info',
    loggers: {
      'database': 'warn',              // 生产环境减少数据库日志
      'debug': 'error'                 // 调试模块只记录错误
    }
  },
  server: {
    outputs: [
      { type: 'stdout' },              // 容器化部署标准输出
      { 
        type: 'file',
        config: { 
          dir: '/var/log/app',
          filename: 'app.log',
          rotate: true
        }
      },
      {
        type: 'sls',                   // 云端日志收集
        config: {
          endpoint: process.env.SLS_ENDPOINT,
          project: process.env.SLS_PROJECT,
          logstore: 'production-logs'
        }
      }
    ]
  },
  client: {
    outputs: [
      {
        type: 'http',                  // 生产环境只上报到服务器
        level: 'warn',
        config: {
          endpoint: '/api/client-logs',
          batch: true
        }
      }
    ]
  }
});
```

## 📋 输出格式自动绑定

用户无需配置格式，系统为每种输出手段自动选择最佳格式：

### 服务端输出格式（自动绑定）
```typescript
const serverFormatMapping = {
  stdout: {
    format: 'pretty',                 // 彩色、易读，开发友好
    options: { colorize: true, timestamp: true }
  },
  file: {
    format: 'pretty',                 // 易读的文本格式，方便查看
    options: { timestamp: true, level: true, colorize: false }
  },
  sls: {
    format: 'structured',             // 云服务专用格式
    options: { timestamp: true, hostname: true, pid: true }
  },
  http: {
    format: 'json',                   // 标准 JSON，接口友好
    options: { timestamp: true }
  }
};
```

### 客户端输出格式（自动绑定）
```typescript
const clientFormatMapping = {
  console: {
    format: 'pretty',                 // 浏览器开发者工具友好
    options: { colorize: true, groupCollapsed: true }
  },
  http: {
    format: 'json',                   // 上报到服务器
    options: { 
      timestamp: true, 
      userAgent: true, 
      url: true,
      sessionId: true 
    }
  },
  localstorage: {
    format: 'json',                   // 本地存储
    options: { timestamp: true, compact: true }
  }
};
```

## 🎯 使用方式

### 创建不同模块的 logger
```typescript
// lib/logger.ts - 全局配置
export const loggerConfig = { /* 上面的配置 */ };

// 不同模块使用
const dbLogger = createLogger('database', loggerConfig);    // 使用 database 级别配置
const authLogger = createLogger('auth', loggerConfig);      // 使用 auth 级别配置  
const uiLogger = createLogger('ui', loggerConfig);          // 使用 ui 级别配置
const apiLogger = createLogger('api', loggerConfig);        // 使用默认级别配置

// 使用示例
dbLogger.debug('数据库连接建立');        // 如果 database 配置为 debug，会输出
authLogger.debug('用户认证开始');        // 如果 auth 配置为 warn，不会输出
uiLogger.info('页面渲染完成');           // 如果 ui 配置为 error，不会输出
```

### 运行时效果
```typescript
// 不同输出手段的实际效果

// stdout 输出（彩色 pretty 格式）
2025-07-20 21:30:15 [INFO] database: 查询用户信息 userId=123

// file 输出（JSON 格式，保存到 ./logs/app.log）
{"timestamp":"2025-07-20T21:30:15.123Z","level":"info","logger":"database","message":"查询用户信息","userId":123}

// SLS 输出（结构化格式，发送到阿里云）
timestamp=2025-07-20T21:30:15.123Z level=info logger=database message="查询用户信息" userId=123 hostname=web-01 pid=12345

// 客户端 console 输出（浏览器友好）
[INFO] ui: 页面渲染完成 {"component":"LoginForm","renderTime":150}

// 客户端 HTTP 输出（发送到 /api/client-logs）
{"timestamp":"2025-07-20T21:30:15.123Z","level":"error","logger":"ui","message":"组件渲染失败","userAgent":"Chrome/91.0","url":"/login","sessionId":"sess_123"}
```

## ✨ 优势

1. **符合直觉**：用户按照实际需求配置，不需要理解技术概念
2. **灵活性强**：多种输出手段并行，按模块配置级别
3. **格式自动**：每种输出手段自动使用最适合的格式
4. **易于扩展**：新增输出手段只需要添加格式映射
5. **生产就绪**：支持文件轮转、云端收集、批量上报等生产特性