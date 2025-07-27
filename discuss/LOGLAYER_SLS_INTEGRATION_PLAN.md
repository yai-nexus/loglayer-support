
# LogLayer 与阿里云 SLS 集成实施方案

**作者**: Gemini
**状态**: 待实施
**原则**: 扩展而非修改 (Open for Extension, Closed for Modification)

---

## 1. 目标与背景

当前，我们的日志系统（基于 `LogLayer`）无法将日志从 Next.js 服务端环境发送到阿里云 SLS，其根本原因是底层依赖的阿里云官方 SDK 与 Next.js 的 Webpack/Turbopack 打包环境存在兼容性问题。

本方案旨在利用项目**已有的 `LogLayer` 和 `Pino` 技术栈**，通过引入一个社区提供的、基于 Pino Transport 机制的 SLS 发送器 (`@wddv/pino-aliyun-sls`)，以**最小侵入性**的方式解决此问题。

最终实现一个**平台无关**（可同时在 ACK 和 Vercel 等环境运行）的、高性能、高可靠的服务端日志上报链路。

---

## 2. 核心架构

我们将采用 **`LogLayer -> Pino Bridge Transport -> Pino Core -> Pino SLS Transport (Worker Thread)`** 的分层架构。

**架构图:**
```
+------------------------+   (1. API Call)   +----------------------------+
|                        |  ---------------> |                            |
|  业务代码 (Next.js)    |                   |  LogLayer (现有实例)       |
|  `logger.info(...)`    |  <--------------- |                            |
|                        |     (Existing API)  +----------------------------+
+------------------------+                             | (2. Extends)
                                                       |
                                                       v
                                         +----------------------------------+
                                         | PinoBridgeTransport (新创建)     |
                                         | - 将 LogLayer 对象转换           |
                                         | - 调用 Pino 实例                 |
                                         +----------------------------------+
                                                       | (3. Calls)
                                                       |
+------------------------------------------------------+
|                                                      |
|   +---------------------------------------------+    v
|   | Pino Core (新实例，配置 SLS Transport)        |  ------> [ Worker Thread ] ----> SLS
|   | - 负责管理 Worker Thread 的生命周期            |
|   +---------------------------------------------+
|
| (应用主线程)
+------------------------------------------------------
```

**关键优势**:
*   **非侵入式**: 业务代码完全不变，继续使用现有的 `logger` 实例。
*   **关注点分离**: `LogLayer` 负责日志 API，`PinoBridgeTransport` 负责格式转换，`Pino` 负责管理异步 Worker，`pino-aliyun-sls` 负责与 SLS 通信。每一层职责清晰。
*   **兼容性解决**: 所有不兼容的依赖 (`aliyun-sdk`) 都被安全地隔离在 Pino 的 Worker Thread 中，不影响主应用。

---

## 3. 实施步骤

### 第 1 步：安装依赖

在 `package.json` 中添加新的开发依赖。

```bash
npm install --save @wddv/pino-aliyun-sls
# 或者
yarn add @wddv/pino-aliyun-sls
```

### 第 2 步：创建 Pino 实例 (日志核心)

创建一个新的文件，用于初始化一个专门用于上报 SLS 的 Pino 实例。这个实例将是所有日志最终的出口。

```typescript
// in lib/pino-sls-instance.ts (或项目适用的其它位置)

import pino from 'pino';
import type { Level } from 'pino';

// 从环境变量读取配置，确保敏感信息不硬编码
const slsOptions = {
  accessKeyId: process.env.SLS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SLS_ACCESS_KEY_SECRET,
  endpoint: process.env.SLS_ENDPOINT,
  projectName: process.env.SLS_PROJECT,
  logStoreName: process.env.SLS_LOGSTORE,
  // 可选：增加一些通用字段
  topic: 'nextjs-server',
  source: process.env.HOSTNAME || 'unknown',
};

// 校验关键环境变量是否存在，如果缺失则不启用 transport
const isEnabled = slsOptions.accessKeyId && slsOptions.projectName;

// 动态设置日志级别
const logLevel: Level = (process.env.LOG_LEVEL || 'info') as Level;

// 创建 Pino Transport 配置。
// 这是定义日志“目的地”和“方式”的配置对象，而不是一个可直接调用的 logger 实例。
const slsTransport = isEnabled
  ? pino.transport({
      target: '@wddv/pino-aliyun-sls',
      level: logLevel,
      options: slsOptions,
    })
  : undefined;

// 我们只在需要时（在 Bridge Transport 内部）创建临时的 Pino 实例来包裹这个 transport。
// 因此，不再导出一个全局的 logger 实例。
// export const pinoSlsLogger = pino(transport); // 旧代码，将被移除

// 在模块加载时打印一条信息，用于验证 transport 是否被正确配置
if (isEnabled) {
  console.log('[INFO] Pino SLS transport has been configured.');
} else {
  console.warn('[WARN] Pino SLS transport is disabled due to missing environment variables.');
}

// 导出 transport 配置本身，供桥接层使用
export { slsTransport };
```

### 第 3 步：创建 LogLayer 的桥接 Transport (扩展点)

这是连接现有 `LogLayer` 和新 `pinoSlsLogger` 的关键。我们创建一个新的 Transport 类。

```typescript
// in transports/pino-bridge-transport.ts (或项目适用的其它位置)

import { BaseTransport, LogLayerObject } from '@loglayer/core'; // 请替换为项目中实际的类型路径
import pino from 'pino';
import { slsTransport } from '../lib/pino-sls-instance'; // 引入上一步创建的 transport 配置

// 只有当 transport 被成功配置时，我们才创建一个包裹它的 pino 实例。
// 这个实例只在当前模块内部使用，作为一次性的发送工具。
const pinoSlsSender = slsTransport ? pino(slsTransport) : null;

export class PinoBridgeTransport extends BaseTransport {
  log(logObject: LogLayerObject) {
    // 如果 pinoSlsSender 未初始化（例如，环境变量缺失），则不执行任何操作。
    if (!pinoSlsSender) {
      return;
    }

    // 从 LogLayer 的日志对象中提取关键信息
    const { level, message, metadata } = logObject;

    // Pino 的标准调用方式是将元数据对象作为第一个参数
    // 我们检查 pino 实例上是否存在对应级别的方法，以提供健壮性
    if (typeof pinoSlsSender[level] === 'function') {
      pinoSlsSender[level](metadata, message);
    } else {
      // 如果级别不匹配，默认使用 info 级别
      pinoSlsSender.info(metadata, message);
    }
  }
}
```

### 第 4 步：在 LogLayer 配置中启用新的 Transport

现在，我们需要修改 `LogLayer` 的初始化逻辑，将我们新创建的 `PinoBridgeTransport` 添加进去。**这是对现有代码的唯一“修改点”**，但它遵循了扩展的原则。

```typescript
// in lib/server-logger.ts (或 LogLayer 的配置文件)

import { LogLayer } from 'loglayer';
import { PinoBridgeTransport } from '../transports/pino-bridge-transport';
// ... 你现有的其他 Transport

// 假设这是你现有的 LogLayer 实例
const serverLogger = new LogLayer({
  // ...你现有的配置...
  transports: [
    // ...保留你现有的 transports，例如用于控制台输出的 transport
    new ConsoleTransport(), // 举例

    // **新增的扩展点**
    // 只在生产环境启用 SLS 上报
    ...(process.env.NODE_ENV === 'production' ? [new PinoBridgeTransport()] : []),
  ],
});

export default serverLogger;
```

### 第 5 步：配置环境变量

在你的部署环境中（无论是 ACK 的 `Deployment` YAML 中的 `envFrom` 还是 Vercel 的项目设置），确保以下环境变量被正确设置：
- `SLS_ACCESS_KEY_ID`
- `SLS_ACCESS_KEY_SECRET`
- `SLS_ENDPOINT`
- `SLS_PROJECT`
- `SLS_LOGSTORE`
- `LOG_LEVEL` (可选, 如 'info', 'warn')

---

## 4. 验证与回滚

*   **验证**: 部署后，通过在代码中调用 `logger.warn('This is a test message for SLS.')`，然后前往阿里云 SLS 控制台检查日志是否成功上报。同时，应该能看到应用启动时打印的 "Pino SLS transport has been configured." 日志。
*   **回滚**: 如果出现任何问题，只需在 `LogLayer` 的配置中注释掉 `new PinoBridgeTransport()` 这一行，即可恢复到之前的状态。风险极低。

该方案以最小的成本和风险，优雅地解决了核心问题，并增强了现有日志系统的能力。 