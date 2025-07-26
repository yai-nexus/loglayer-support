# Loglayer-Support Packages Export Analysis Report

### 概述

`loglayer-support` 项目通过多个独立的 `package`（`core`, `browser`, `server`, `receiver`）提供了一套模块化、可扩展的日志解决方案。这种架构非常出色，允许用户按需引入功能。本次分析旨在评估每个包的公共 API（即 `export` 的内容），判断其价值，并提出优化建议以提高可用性、降低学习曲线。

### 1. `@yai-loglayer/core`

`core` 包是整个系统的基石，提供了核心的类型定义、工具函数和配置能力。

| 导出成员 | 所属模块 | 价值评估 | 建议 |
| :--- | :--- | :--- | :--- |
| `LogLevel` | `types.ts` | **高** | 定义日志级别的核心类型。保留。 |
| `LogMetadata` | `types.ts` | **高** | 定义日志元数据的核心类型。保留。 |
| `EnvironmentInfo` | `types.ts` | **高** | 环境检测函数的核心返回类型。保留。 |
| `LoggerConfig` | `types.ts` | **高** | 整个库的主要配置接口。保留。 |
| `ServerOutput`, `ClientOutput` | `types.ts` | **高** | 定义日志输出的核心接口。保留。 |
| `ServerOutputConfig`, `ClientOutputConfig` | `types.ts` | **高** | 为输出定义了具体的配置选项。保留。 |
| `ServerEngineType`, `ClientEngineType` | `types.ts` | **低** | 暴露了内部实现细节。建议设为内部类型（不从`index.ts`导出）。 |
| `EngineStrategy`, `FormatMapping` | `types.ts` | **低** | 暴露了内部实现细节。建议设为内部类型。 |
| `ValidationResult`, `ValidationError`, 等 | `config-validation.ts` | **高** | 解读验证结果所必需的接口。保留。 |
| `FieldValidator`, `ConfigValidator` | `config-validation.ts` | **高** | 验证系统的核心类。保留。 |
| `ValidationRules` | `config-validation.ts` | **高** | 一套强大且可扩展的验证规则。保留。 |
| `createConfigValidator`, `createFieldValidator` | `config-validation.ts` | **高** | 验证系统的核心工厂函数。保留。 |
| `formatValidationResult` | `config-validation.ts` | **中** | 对用户反馈有用的辅助函数，但非必需。保留。 |
| `detectEnvironment` | `environment.ts` | **高** | 环境感知逻辑的核心函数。保留。 |
| `canImport` | `environment.ts` | **高** | 用于检查可选依赖的强大工具。保留。 |
| `isBrowserEnvironment`, `isNodeEnvironment`| `environment.ts` | **中**| 有用，但与 `canUse...APIs` 重复。建议移除 `canUse...APIs` 并保留这些。 |
| `canUseNodeAPIs`, `canUseBrowserAPIs`| `environment.ts` | **低** | `is...Environment` 的冗余别名。建议移除，只保留 `is...Environment`。 |
| `getEnvVar` | `environment.ts` | **中** | 一个安全的便利函数。保留。 |
| `ErrorCategory`, `ErrorSeverity`, `RecoveryStrategy`| `error-handling.ts` | **高** | 错误处理系统的基本枚举。保留。 |
| `StandardError`, `ErrorHandlingOptions`| `error-handling.ts` | **高** | 错误处理的核心接口。保留。 |
| `ERROR_CODES` | `error-handling.ts` | **高** | 提供了一种稳定的、非魔术字符串的方式来检查特定错误。保留。 |
| `ErrorHandler` | `error-handling.ts` | **高** | 错误处理系统的主要类。保留。 |
| `createErrorHandler` | `error-handling.ts` | **高** | `ErrorHandler` 的标准工厂函数。保留。 |
| `globalErrorHandler` | `error-handling.ts` | **中** | 方便，但鼓励全局状态。保留，但在文档中说明替代方案。 |
| `serializeMessages` | `message-utils.ts` | **高** | 防止在传输器中重复代码的关键工具。保留。 |
| `separateMessages` | `message-utils.ts` | **高** | 对于以不同方式处理字符串和对象的传输器非常有用。保留。 |
| `serializeMessage`, `hasObjectMessages` | `message-utils.ts` | **中** | 便利的辅助函数。保留。 |
| `createDefaultConfig`, `createDevelopmentConfig`, `createProductionConfig` | `creators.ts` | **高** | 对用户体验和快速设置极好。保留。 |
| `createConfigForEnvironment`| `creators.ts` | **高** | 用于自适应配置的强大函数。保留。 |
| `presets` | `presets.ts` | **中** | 与 `creators.ts` 的功能重复。建议合并到 `creators.ts` 中并移除此文件/导出，以创建单一、清晰的预设API。 |
| `validateConfig` | `validation.ts` | **低** | 过于简单，已被 `ConfigValidator` 取代。建议移除此导出。 |
| `getLoggerLevel`, `shouldLog` | `validation.ts` | **高** | 过滤日志的核心逻辑。必不可少。保留，但考虑移至更合适的模块（如`core-logic.ts`）。 |
| `getEffectiveOutputs` | `validation.ts` | **高** | 有用的类型安全辅助函数。保留，但考虑移动。 |
| `mergeConfigs` | `validation.ts` | **高** | 用于扩展配置的重要工具。保留。 |

**`core` 包总结**: 核心包功能强大，但存在一些 API 重复和冗余。通过整合 `creators` 和 `presets`，并移除简陋的 `validation.ts` 中的 `validateConfig`，可以使 API 更加精炼和清晰。

---

### 2. `@yai-loglayer/browser`

`browser` 包提供了在浏览器环境中进行日志记录的完整解决方案。

| 导出成员 | 所属模块 | 价值评估 | 建议 |
| :--- | :--- | :--- | :--- |
| `BrowserLoggerConfig` | `browser.ts` | **高** | 面向浏览器、用户友好的高级配置 API。保留。 |
| 其他所有配置类型 (`BrowserLogLevel`, 等) | `browser.ts` | **高** | `BrowserLoggerConfig` 的必要组成部分。保留。 |
| `createBrowserLogger`, `createBrowserLoggerSync` | `browser.ts` | **高** | 此包用户的主要入口点。保留。 |
| `createBrowserLogLayer` | `browser-factory.ts` | **中** | 中级工厂函数。对某些高级用例有用，但大多数用户应使用 `createBrowserLogger`。保留。 |
| `createDevelopmentBrowserLogger`, `createProductionBrowserLogger` | `browser-factory.ts` | **高** | 非常方便的预设。保留。 |
| `createCustomBrowserLogger` | `browser-factory.ts` | **高** | 允许在仍使用工厂函数的同时进行细粒度控制。保留。 |
| `convertLegacyOutputs` | `browser-factory.ts` | **低** | 一个似乎被导出的内部实现细节。应设为内部。 |
| `LoglayerBrowserTransport` | `browser-transport.ts` | **高** | 核心传输器实现。为高级用户保留。 |
| `BrowserOutputConfig`, `LoglayerBrowserTransportConfig` | `browser-transport.ts` | **高** | 传输器所必需的配置接口。保留。 |

**`browser` 包总结**: 这是一个设计非常完善的包。它通过分层（API -> Factory -> Transport）的设计，同时满足了易用性和灵活性，是其他包的典范。

---

### 3. `@yai-loglayer/server`

`server` 包旨在提供一个功能极其丰富的服务端日志框架。

| 导出成员 | 所属模块 | 价值评估 | 建议 |
| :--- | :--- | :--- | :--- |
| `ServerLoggerConfig` | `server.ts` | **高** | 高级服务端日志框架的核心配置接口。保留。 |
| 其他所有配置类型 (`PathConfig`, `ModuleConfig`, 等) | `server.ts` | **高** | `ServerLoggerConfig` 的必要组成部分。保留。 |
| `ServerLoggerInstance`, `ServerLoggerManager` | `server.ts` | **高** | 定义了强大的实例和管理器 API，是关键特性。保留。 |
| `ModuleLogger`, `CompatibleLogger` | `server.ts` | **高** | 模块化和兼容性系统的重要接口。保留。 |
| `createServerLogger` | `server.ts` | **高** | 创建服务端日志器的主要工厂函数。保留。 |
| `createServerLoggerManager` | `server.ts` | **高** | 实例管理器的主要工厂函数。保留。 |
| `createNextjsServerLogger`, `createExpressServerLogger` | `server.ts` | **高** | 用于与流行框架轻松集成的高价值辅助函数。保留。 |
| `ServerTransport` | `server-transport.ts` | **高** | 核心传输器。为需要直接访问的用户保留。 |
| `ServerTransportConfig`| `server-transport.ts` | **高** | 传输器的配置接口。保留。 |
| `ServerOutputEngine` | `server-transport.ts` | **中** | 设计良好的内部引擎。可考虑为希望在其上构建自定义传输器的超高级用户导出，但对于公共 API 不是必需的。 |

**`server` 包总结**: 该包的设计非常有野心，提供了一个企业级的日志管理方案。目前的工厂函数被标记为“简化版本”，表明未来还有很大的发展空间。其 API 设计是目前项目中最复杂但也最强大的。

---

### 4. `@yai-loglayer/receiver`

`receiver` 包负责在服务端接收来自客户端的日志，是远程日志记录链路的终点。

| 导出成员 | 所属模块 | 价值评估 | 建议 |
| :--- | :--- | :--- | :--- |
| `LogReceiverConfig` | `receiver.ts` | **高** | 接收器端点的主要配置。保留。 |
| `NextjsLogReceiver` | `receiver.ts` | **高** | Next.js 适配器所必需的类型定义。保留。 |
| `createNextjsLogReceiver` | `receiver.ts` | **高** | 关键特性，提供无缝的 Next.js 集成。保留。 |
| `createExpressLogReceiver` | `receiver.ts` | **高** | 关键特性，提供无缝的 Express.js 集成。保留。 |
| `createLogReceiver` | `receiver.ts` | **中** | 通用版本，不如框架特定版本有用。作为备用选项保留。 |
| `LogReceiverClient` | `client.ts` | **高** | 用于向接收器发送日志的客户端实现。保留。 |
| `LogReceiverClientOptions` | `client.ts` | **高** | 客户端的配置。保留。 |

**`receiver` 包总结**: `receiver` 包与 `browser` 包的 `http` 输出功能完美配合，提供了一个完整的端到端远程日志解决方案。框架适配器的存在使其价值倍增。

### 最终结论与整体建议

1.  **API 精炼**: `core` 包是所有其他包的基础，对其 API 进行精炼（如合并 `creators` 和 `presets`，移除冗余验证函数）将对整个生态系统产生积极影响。
2.  **保持分层设计**: `browser` 和 `server` 包都体现了良好的分层设计（高级 API -> 工厂 -> 底层实现）。应继续保持这种模式，它能很好地平衡易用性与灵活性。
3.  **文档是关键**: `server` 包的 API 非常强大但也相对复杂。清晰的文档和使用示例对于帮助用户理解和使用 `ServerLoggerManager`, `ModuleLogger` 等高级概念至关重要。
4.  **明确价值定位**: 每个包的价值都很清晰：
    *   `core`: 基础与核心。
    *   `browser`: 简单易用的浏览器日志。
    *   `server`: 强大的企业级服务端日志。
    *   `receiver`: 开箱即用的远程日志接收。

这份报告分析了当前所有导出的价值。我们可以基于此讨论，确定下一步的优化方向，比如是先精简 `core` 包的 API，还是优先为 `server` 包撰写更详细的文档。 