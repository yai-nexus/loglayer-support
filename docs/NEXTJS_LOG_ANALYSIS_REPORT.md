
# `nextjs-example` 中 SLS 日志丢失问题的分析报告

**作者**: Gemini
**状态**: 待讨论

---

## 1. 问题概述 (TL;DR)

`nextjs-example` 应用程序的服务端日志未能成功发送到 SLS (日志服务) 平台，而 `basic-example` 则运行正常。根本原因是 **`nextjs-example` 的服务端日志记录器 (`server-logger`) 未配置 SLS 作为其输出目标**。解决方案是在其配置中添加 SLS 输出通道，并确保通过环境变量正确加载了 SLS 的凭证信息。

---

## 2. 问题描述

在当前的日志系统实现中，我们观察到以下行为：
- ✅ `basic-example` 能够成功将其日志（特别是 `warn` 及以上级别）发送到配置好的 SLS Logstore。
- ❌ `nextjs-example` 在任何日志级别下，其服务端产生的日志均未在 SLS 平台出现。
- ✅ `nextjs-example` 的日志可以正常输出到控制台 (`stdout`) 和本地文件 (`logs/nextjs.log`)。

此问题阻碍了在类生产环境（Next.js）中对日志进行集中式收集和分析。

---

## 3. 调查与分析

为了定位问题根源，我们对两个示例应用进行了对比分析。

### 3.1. `basic-example` 的有效配置 (参照组)

我们首先检查了 `basic-example` 中与生产环境相关的日志配置，其位于 `examples/basic-example/details/production-config.ts`。

关键配置如下：
```typescript
// examples/basic-example/details/production-config.ts

const productionConfig: LoggerConfig = {
  // ...
  server: {
    outputs: [
      { type: 'stdout' },
      { type: 'file', /* ... */ },
      {
        type: 'sls',          // 重点：显式配置了 SLS 输出
        level: 'warn',
        config: getSLSConfig() // 通过辅助函数加载配置
      }
    ]
  },
  // ...
};

const prodLogger = await createServerLogger('production-app', productionConfig);
```
此外，`getSLSConfig()` 函数在 `examples/basic-example/lib/shared-utils.ts` 中定义，负责从环境变量 (`process.env`) 中读取所有必需的 SLS 连接参数（如 endpoint, project, access keys 等）。

**结论**: `basic-example` 的成功源于其在 `server.outputs` 数组中明确定义了 `sls` 类型的输出。

### 3.2. `nextjs-example` 的缺失配置 (问题组)

随后，我们检查了 `nextjs-example` 的服务端日志配置文件 `examples/nextjs-example/lib/server-logger.ts`。

其配置如下：
```typescript
// examples/nextjs-example/lib/server-logger.ts

const logger = await createServerLogger('nextjs-server', {
  // ...
  server: {
    outputs: [
      { type: 'stdout' }, // 控制台输出
      {
        type: 'file',     // 文件输出
        config: { /* ... */ }
      }
      // 缺少 'sls' 类型的输出配置
    ]
  },
  // ...
});
```
**结论**: `nextjs-example` 的日志记录器 **从未被指示将日志发送到 SLS**。这是导致 SLS 上没有日志的直接原因。

---

## 4. 根本原因

`nextjs-example` 的 `server-logger` 在初始化时，其 `outputs` 配置数组中仅包含了 `stdout` 和 `file` 两种类型，完全遗漏了 `sls` 输出通道的配置。因此，日志数据从未被路由到 SLS 服务。

---

## 5. 解决方案与建议

为了解决此问题并统一项目中的日志最佳实践，我们提出以下修改建议：

### 5.1. 修改 `server-logger.ts`

在 `examples/nextjs-example/lib/server-logger.ts` 文件中添加 SLS 输出配置。

1.  **安装 `dotenv` 依赖**:
    ```bash
    # 在 examples/nextjs-example 目录下运行
    npm install dotenv
    ```

2.  **更新 `server-logger.ts`**:
    - 引入 `dotenv` 以加载环境变量。
    - 添加一个 `getSLSConfig` 辅助函数，用于从 `process.env` 读取配置，并增加必要的健壮性检查。
    - 动态地将 `sls` 输出添加到 `outputs` 数组中，仅当所有必需的环境变量都存在时才启用。

    ```typescript
    // examples/nextjs-example/lib/server-logger.ts

    import { createServerLogger } from '@yai-loglayer/server';
    import type { LoggerConfig } from '@yai-loglayer/core';
    import { LogLayer } from 'loglayer';
    import dotenv from 'dotenv';

    // 加载环境变量
    dotenv.config();

    // 获取 SLS 配置 (新增)
    function getSLSConfig(): Record<string, string> {
      const requiredVars = ['SLS_ENDPOINT', 'SLS_PROJECT', 'SLS_LOGSTORE', 'SLS_ACCESS_KEY_ID', 'SLS_ACCESS_KEY_SECRET', 'SLS_APP_NAME'];
      const missingVars = requiredVars.filter(v => !process.env[v]);

      if (missingVars.length > 0) {
        console.warn(`[LogLayer WARN] Missing SLS environment variables: ${missingVars.join(', ')}. SLS logging will be disabled.`);
        return {};
      }
      
      return {
        endpoint: process.env.SLS_ENDPOINT!,
        project: process.env.SLS_PROJECT!,
        logstore: process.env.SLS_LOGSTORE!,
        accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
        accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
        appName: process.env.SLS_APP_NAME!
      };
    }

    // ...

    const createServerInstance = async (): Promise<LogLayer> => {
      const slsConfig = getSLSConfig();
      const outputs: LoggerConfig['server']['outputs'] = [
        { type: 'stdout' },
        { type: 'file', config: { dir: logsDir, filename: 'nextjs.log' } }
      ];

      // 动态添加 SLS 输出 (新增逻辑)
      if (slsConfig.endpoint) {
        outputs.push({
          type: 'sls',
          level: 'warn', // 与 basic-example 对齐
          config: slsConfig
        });
      }

      const logger = await createServerLogger('nextjs-server', {
        level: { default: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
        server: {
          outputs: outputs // 使用更新后的 outputs
        },
        client: {
          outputs: [{ type: 'console' }]
        }
      });
      
      // ...
    };
    ```

### 5.2. 提供 `.env` 文件

在 `examples/nextjs-example` 目录下创建一个 `.env` 文件，并填入正确的 SLS 凭证，与 `basic-example` 所使用的保持一致。

```
# examples/nextjs-example/.env

SLS_ENDPOINT=...
SLS_PROJECT=...
SLS_LOGSTORE=...
SLS_ACCESS_KEY_ID=...
SLS_ACCESS_KEY_SECRET=...
SLS_APP_NAME=nextjs-app
```

---

## 6. 长期改进建议

为了防止此类配置不一致的问题再次发生，建议：

1.  **创建共享配置包**: 考虑在 `packages/` 目录下创建一个 `config` 或 `utils` 包，用于存放如 `getSLSConfig` 这类跨示例、跨项目的共享函数。
2.  **标准化示例模板**: 为所有新示例项目建立一个标准化的日志记录器模板，确保默认包含所有关键的输出通道（如 `stdout`, `file`, `sls`）。
3.  **完善文档**: 在项目文档中明确指出如何为不同环境（特别是服务端）配置日志输出，并提供清晰的 `.env` 配置示例。 