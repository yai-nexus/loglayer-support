# Server 日志组件迁移指南

## 概述

新版 Server 日志组件通过配置驱动模式，将业务接入复杂度从 **100+ 行代码简化到 10 行**，同时提供更强大的自动化配置能力。

## 迁移对比

### 🔴 旧版接入方式（复杂）

```typescript
// 原来需要 100+ 行复杂的初始化代码
import { createServerLogger } from '@yai-loglayer/server';
import type { YAILogLayerConfig, LoggerInterface } from './types';
import path from 'path';
import fs from 'fs';

// 手动创建配置
const createConfig = (): YAILogLayerConfig => {
  const nodeEnv = process.env['NODE_ENV'] || 'development';
  const slsEnabled = process.env['NEXT_PUBLIC_SLS_ENABLED'] === 'true';
  
  // 手动检查SLS配置是否完整
  const slsConfigComplete = [
    'NEXT_PUBLIC_SLS_ENDPOINT',
    'NEXT_PUBLIC_SLS_ACCESS_KEY_ID',
    'NEXT_PUBLIC_SLS_ACCESS_KEY_SECRET', 
    'NEXT_PUBLIC_SLS_PROJECT',
    'NEXT_PUBLIC_SLS_LOGSTORE'
  ].every(key => process.env[key]);

  return {
    app: {
      name: process.env['NEXT_PUBLIC_SERVICE_NAME'] || 'yai-investor-insight-webapp',
      environment: nodeEnv as any,
      version: process.env['NEXT_PUBLIC_APP_VERSION'] || '1.0.0'
    },
    sls: {
      endpoint: process.env['NEXT_PUBLIC_SLS_ENDPOINT'] || '',
      accessKeyId: process.env['NEXT_PUBLIC_SLS_ACCESS_KEY_ID'] || '',
      accessKeySecret: process.env['NEXT_PUBLIC_SLS_ACCESS_KEY_SECRET'] || '',
      project: process.env['NEXT_PUBLIC_SLS_PROJECT'] || '',
      logstore: process.env['NEXT_PUBLIC_SLS_LOGSTORE'] || '',
      region: process.env['NEXT_PUBLIC_SLS_REGION'] || 'cn-beijing'
    },
    features: {
      enableBatch: true,
      batchSize: 10,
      flushInterval: 1000,
      enableRetry: true,
      maxRetries: 3,
      enableConsole: nodeEnv === 'development' || !slsConfigComplete,
      enableSls: slsEnabled && slsConfigComplete,
      enableFile: true
    }
  };
};

// 手动获取日志文件路径
const getLogFilePath = (): string => {
  let currentDir = process.cwd();
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const nxJsonPath = path.join(currentDir, 'nx.json');
    
    if (fs.existsSync(packageJsonPath) && fs.existsSync(nxJsonPath)) {
      const logsDir = path.join(currentDir, 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      return path.join(logsDir, 'webapp.server.log');
    }
    currentDir = path.dirname(currentDir);
  }
  
  const fallbackLogsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(fallbackLogsDir)) {
    fs.mkdirSync(fallbackLogsDir, { recursive: true });
  }
  return path.join(fallbackLogsDir, 'webapp.server.log');
};

// 复杂的初始化逻辑
let loggerInstance: any = null;
let initPromise: Promise<any> | null = null;

const initLogger = async () => {
  if (initPromise) return initPromise;

  if (!loggerInstance) {
    initPromise = (async () => {
      try {
        const outputs: any[] = [];
        
        if (config.features.enableConsole) {
          outputs.push({ type: 'stdout' });
        }
        
        if (config.features.enableFile) {
          const logFilePath = getLogFilePath();
          outputs.push({
            type: 'file',
            config: {
              dir: path.dirname(logFilePath),
              filename: path.basename(logFilePath),
              maxSize: '10MB',
              maxFiles: 5
            }
          });
        }

        if (config.features.enableSls && config.sls.endpoint) {
          outputs.push({
            type: 'sls',
            config: {
              endpoint: config.sls.endpoint,
              accessKeyId: config.sls.accessKeyId,
              accessKeySecret: config.sls.accessKeySecret,
              project: config.sls.project,
              logstore: config.sls.logstore,
              region: config.sls.region
            }
          });
        }

        if (outputs.length === 0) {
          outputs.push({ type: 'stdout' });
        }

        const loggerConfig = {
          level: { default: 'debug' as const },
          server: { outputs },
          client: { outputs: [] }
        };
        
        loggerInstance = await createServerLogger(config.app.name, loggerConfig);
        return loggerInstance;
      } catch (error) {
        console.error('Server logger init failed:', error);
        loggerInstance = {
          debug: (msg: string) => console.debug(msg),
          info: (msg: string) => console.info(msg),
          warn: (msg: string) => console.warn(msg),
          error: (msg: string) => console.error(msg)
        };
        return loggerInstance;
      }
    })();
  }

  return initPromise;
};

// 需要 await 的接口
export const logger: LoggerInterface = {
  debug: async (message: string, data?: any) => {
    const log = await initLogger();
    log.debug(message, { data, service: config.app.name, environment: 'server' });
  },
  
  info: async (message: string, data?: any) => {
    const log = await initLogger();
    log.info(message, { data, service: config.app.name, environment: 'server' });
  },
  
  warn: async (message: string, data?: any) => {
    const log = await initLogger();
    log.warn(message, { data, service: config.app.name, environment: 'server' });
  },
  
  error: async (message: string, data?: any) => {
    const log = await initLogger();
    log.error(message, { data, service: config.app.name, environment: 'server' });
  }
};
```

### 🟢 新版接入方式（简化）

#### 1. 创建配置文件 `logger.config.ts`

```typescript
import type { AutoLoggerConfig } from '@yai-loglayer/server';

export const loggerConfig: AutoLoggerConfig = {
  app: {
    name: 'yai-investor-insight-webapp',
    environment: 'auto',  // 自动检测
    version: 'auto'       // 自动从 package.json 读取
  },
  outputs: {
    console: { enabled: 'auto' },  // 开发环境自动启用
    file: { 
      enabled: true, 
      path: 'auto',              // 自动检测项目根目录
      filename: 'webapp.server.log'
    },
    sls: { 
      enabled: 'auto',           // 根据环境变量自动启用
      config: 'env'              // 从环境变量自动读取
    }
  }
};

export default loggerConfig;
```

#### 2. 创建日志器 `server-logger.ts`

```typescript
import { createAutoLogger } from '@yai-loglayer/server';
import loggerConfig from './logger.config';

// 一行代码完成所有配置
export const logger = createAutoLogger(loggerConfig);

// 直接使用，无需 await
logger.info('服务器启动成功');
logger.error('数据库连接失败', { error: 'Connection timeout' });

export default logger;
```

## 核心改进

### 1. 配置简化

| 方面 | 旧版 | 新版 |
|------|------|------|
| 代码行数 | 100+ 行 | 10 行 |
| 配置复杂度 | 手动处理所有逻辑 | 声明式配置 |
| 环境变量处理 | 手动检查和映射 | 自动检测和映射 |
| 路径解析 | 手动实现复杂逻辑 | `'auto'` 自动解析 |
| 错误处理 | 分散在各处 | 统一处理和回退 |

### 2. 使用体验

| 方面 | 旧版 | 新版 |
|------|------|------|
| 日志调用 | `await logger.info()` | `logger.info()` |
| 初始化 | 复杂的异步初始化 | 自动初始化 |
| 错误处理 | 需要手动实现 fallback | 自动 fallback |
| 配置验证 | 无验证 | 自动验证和友好提示 |

### 3. 功能增强

| 功能 | 旧版 | 新版 |
|------|------|------|
| 环境检测 | 手动实现 | 自动检测 |
| 项目类型检测 | 不支持 | 自动检测 Next.js/Express |
| 配置模板 | 不支持 | 内置项目模板 |
| 配置验证 | 不支持 | 完整的验证和提示 |
| 调试信息 | 基础 | 详细的诊断信息 |

## 迁移步骤

### Step 1: 安装新版本

```bash
pnpm add @yai-loglayer/server@latest
```

### Step 2: 创建配置文件

创建 `logger.config.ts`，参考上面的配置示例。

### Step 3: 替换日志器实现

将原来的复杂初始化代码替换为简单的工厂函数调用。

### Step 4: 更新日志调用

移除所有 `await` 关键字，直接调用日志方法。

### Step 5: 设置环境变量

确保环境变量设置正确，新版本会自动读取和验证。

### Step 6: 测试和验证

运行应用，检查日志输出是否正常。

## 环境变量映射

新版本自动支持多种环境变量命名约定：

```bash
# 应用配置
SERVICE_NAME=yai-investor-insight-webapp
# 或 NEXT_PUBLIC_SERVICE_NAME=yai-investor-insight-webapp
# 或 APP_NAME=yai-investor-insight-webapp

# SLS 配置
SLS_ENABLED=true
# 或 NEXT_PUBLIC_SLS_ENABLED=true

SLS_ENDPOINT=https://cn-beijing.log.aliyuncs.com
# 或 NEXT_PUBLIC_SLS_ENDPOINT=https://cn-beijing.log.aliyuncs.com

# 其他配置类似...
```

## 兼容性

新版本完全向后兼容，原有的 `createServerLogger` 等函数仍然可用，建议逐步迁移到新版 API。

## 故障排除

### 配置验证失败

新版本会自动验证配置并提供友好的错误提示：

```typescript
import { ConfigValidator } from '@yai-loglayer/server';

// 验证配置
const validation = ConfigValidator.validateRawConfig(loggerConfig);
if (!validation.valid) {
  console.log('配置问题:', validation.errors);
  console.log('建议:', validation.warnings);
}
```

### 环境变量检查

```typescript
import { ConfigValidator } from '@yai-loglayer/server';

// 检查环境变量
const envValidation = ConfigValidator.validateEnvironmentVariables();
console.log('环境变量状态:', envValidation);
```
