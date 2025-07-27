# LogLayer 与阿里云 SLS 直接集成方案

## 1. 目标

本文档旨在阐述一个直接集成 LogLayer 与阿里云日志服务（SLS）的方案，该方案将使用 `@alicloud/sls20201230` SDK。此方法将绕过 `pino` 或 `winston` 等中间日志库，为 LogLayer 创建一个原生的 SLS transport。

## 2. 背景

目前，将 LogLayer 与云厂商的特定日志服务集成，通常需要一个适配器或桥接器来连接另一个日志库（例如 `pino-sls`）。这种方式虽然有效，但增加了额外的依赖和配置，从而提高了复杂性和潜在的故障点。

通过为 LogLayer 创建一个专用的 `SlsTransport`，我们可以为希望将日志直接发送到阿里云 SLS 的用户提供一个更精简、轻量且高效的解决方案。这也符合 LogLayer 提供简单、健壮且可扩展日志记录的理念。

## 3. 可行性分析

该集成方案是高度可行的。LogLayer 的架构明确支持自定义 transport。Transport 是一个实现简单接口的类，主要包含一个 `log` 方法，负责将日志数据发送到指定目标。

`@alicloud/sls20201230` SDK 提供了与 SLS API 交互所需的客户端和方法。我们提议的 `SlsTransport` 将充当桥梁，将 LogLayer 的日志对象转换为 SLS `PutLogs` 操作所需的格式。

**关键组件:**

*   **LogLayer Core:** 核心日志库，负责捕获和格式化应用日志。
*   **`@yai-loglayer/sls-transport` (新包):** 一个新的 NPM 包，包含 `SlsTransport` 类。
*   **`@alicloud/sls20201230`:** 用于与 SLS API 交互的阿里巴巴云官方 SDK。

## 4. 实施步骤

### 第 1 步: 创建新包 `@yai-loglayer/sls-transport`

我们将在 `packages/` 目录下创建一个新包。该包将存放 SLS transport 的所有逻辑。

**包结构:**
```
packages/
└── sls-transport/
    ├── src/
    │   ├── SlsTransport.ts
    │   └── index.ts
    ├── package.json
    ├── tsconfig.json
    └── tsup.config.ts
```

### 第 2 步: 实现 `SlsTransport` 类

集成的核心是 `SlsTransport.ts` 文件。

```typescript
// src/SlsTransport.ts
import { Log, Transport } from '@yai-loglayer/core';
import Sls20201230, { PutLogsRequest, LogContent } from '@alicloud/sls20201230';
import { Config as SlsSdkConfig } from '@alicloud/openapi-client';

export interface SlsTransportConfig {
  sdkConfig: SlsSdkConfig; // 包括 Endpoint, AccessKey ID/Secret
  project: string;
  logstore: string;
  topic?: string;
  source?: string;
}

export class SlsTransport implements Transport {
  private client: Sls20201230;
  private project: string;
  private logstore: string;
  private topic: string;
  private source?: string;

  constructor(config: SlsTransportConfig) {
    this.client = new Sls20201230(config.sdkConfig);
    this.project = config.project;
    this.logstore = config.logstore;
    this.topic = config.topic || 'default';
    this.source = config.source;
  }

  async log(log: Log): Promise<void> {
    const logItem = {
      // SLS 使用 Unix 时间戳（秒）
      time: Math.floor(log.time.getTime() / 1000), 
      contents: this.formatLogContents(log),
    };

    const putLogsRequest: PutLogsRequest = {
      logstore: this.logstore,
      project: this.project,
      body: {
        logGroup: {
          logs: [logItem],
          topic: this.topic,
          source: this.source,
        },
      },
    };

    try {
      // 注意：对于高流量的日志记录，应考虑实现批处理
      await this.client.putLogs(this.project, this.logstore, putLogsRequest);
    } catch (error) {
      // 适当地处理或记录错误
      console.error('Failed to send log to Alicloud SLS:', error);
    }
  }

  private formatLogContents(log: Log): LogContent[] {
    const contents: LogContent[] = [
      { key: 'level', value: log.level },
      { key: 'message', value: log.message },
    ];

    if (log.err) {
      contents.push({ key: 'error_message', value: log.err.message });
      contents.push({ key: 'error_stack', value: log.err.stack || '' });
    }

    // 添加上下文元数据
    Object.keys(log.context).forEach(key => {
      contents.push({ key, value: JSON.stringify(log.context[key]) });
    });

    return contents;
  }
}
```

**关键考量:**

*   **批处理 (Batching):** 在生产环境中，逐条发送日志是低效的。应增强 `log` 方法以缓冲日志并分批发送，以减少网络开销和 API 调用。可以通过计时器和大小阈值来触发批量发送。
*   **错误处理:** 健壮的错误处理至关重要。这包括网络故障、身份验证问题和来自 SLS 的 API 错误。可以实现带指数退避的重试机制。
*   **配置:** `SlsTransportConfig` 应清晰地定义所有必需的参数。

### 第 3 步: 文档和用法示例

我们需要更新文档，以包含有关新 transport 的说明。

**用法示例:**

```typescript
import { LogLayer } from '@yai-loglayer/core';
import { SlsTransport } from '@yai-loglayer/sls-transport';

const slsTransport = new SlsTransport({
  sdkConfig: {
    endpoint: process.env.ALICLOUD_SLS_ENDPOINT,
    accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
  },
  project: 'my-app-project',
  logstore: 'my-app-logstore',
  topic: 'application-logs',
});

const logger = new LogLayer({
  transports: [slsTransport],
});

logger.info('用户登录成功。', { userId: '123' });
logger.error(new Error('数据库连接失败。'), { component: 'Database' });
```

## 5. 结论

为 LogLayer 创建一个原生的 `SlsTransport` 是一个明确且可实现的目标，它将为在阿里云上部署应用的开发者提供巨大价值。该方案简化了日志记录体系，减少了依赖，并提高了性能和可维护性。此项目与 LogLayer 提供灵活强大日志解决方案的使命完美契合。 