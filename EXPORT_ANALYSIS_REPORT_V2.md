# 包导出 API 分析报告 V2 (EXPORT_ANALYSIS_REPORT_V2.md)

## 1. 报告目标

本报告旨在深入分析 `loglayer-support` 项目中每个 `package` 通过其入口文件 (`index.ts`) 对外暴露的公共 API。V2 版本将更聚焦于**每一个具体的导出成员**，评估其对最终用户的价值，识别潜在的冗余和应作为内部实现的成员，为下一轮 API 精炼提供更精确的指导。

---

## 2. `@yai-loglayer/core` 包导出分析

`core` 包是整个系统的基石，其 API 的清晰度至关重要。

| 导出成员 | 类型 | 评估 | 建议与说明 |
| :--- | :--- | :--- | :--- |
| **配置与类型** |
| `LoggerConfig` & 相关类型 | `interface` | **价值高** | 定义了库的核心配置结构，是所有功能的基础。 |
| `LogLevel`, `LogMetadata` | `type` | **价值高** | 基础类型，必不可少。 |
| `EnvironmentInfo` | `interface` | **价值高** | `detectEnvironment` 的返回类型，对于环境判断逻辑至关重要。 |
| `ServerEngineType`, `ClientEngineType` | `type` | **应为内部** | 这些是引擎的实现细节，用户不应关心。移除导出可使未来更换引擎更容易。 |
| `EngineStrategy`, `FormatMapping` | `interface` | **应为内部** | 同上，纯粹的内部实现细节，暴露会使用户困惑并限制重构。 |
| **配置验证** |
| `ConfigValidator`, `FieldValidator` | `class` | **价值高** | 强大的验证系统核心，为高级用户提供了极大的灵活性。 |
| `ValidationRules` | `const` | **价值高** | 提供了一套丰富的预定义验证规则，非常实用。 |
| `ValidationResult` & 相关类型 | `interface` | **价值高** | 使用验证系统所必需的返回类型。 |
| `createConfigValidator` | `function` | **价值高** | 创建验证器的主要入口点。 |
| `validateConfig` | `function` | **疑似冗余** | 功能过于简单，且完全被 `ConfigValidator` 的能力所覆盖，应移除。 |
| **环境检测** |
| `detectEnvironment` | `function` | **价值高** | 核心功能，用于实现环境自适应。 |
| `canImport` | `function` | **价值高** | 检查可选依赖的强大工具，对实现“渐进增强”功能很有帮助。 |
| `isBrowserEnvironment`, `isNodeEnvironment`| `function`| **疑似冗余** | 与 `canUse...APIs` 功能完全重复，建议只保留这一组，移除别名。 |
| `canUseNodeAPIs`, `canUseBrowserAPIs`| `function`| **疑似冗余** | `is...Environment` 的别名，应移除以简化 API。 |
| **错误处理** |
| `ErrorHandler` | `class` | **价值高** | 结构化错误处理的核心。 |
| `ERROR_CODES` & 相关类型/枚举 | `const` | **价值高** | 提供了标准的错误定义，必不可少。 |
| `createErrorHandler` | `function` | **价值高** | 创建 `ErrorHandler` 实例的标准方式。 |
| `globalErrorHandler` | `const` | **价值低** | 虽然方便，但鼓励了全局单例模式，不利于测试和隔离。建议保留但文档中应主推 `createErrorHandler`。 |
| **工具函数** |
| `serializeMessages`, `separateMessages` | `function` | **价值高** | 极其实用的工具，在所有 transport 中都需要，避免了代码重复。 |
| `getLoggerLevel`, `shouldLog` | `function` | **价值高** | 日志过滤的核心判断逻辑，必须导出。 |
| `mergeConfigs` | `function` | **价值高** | 允许用户优雅地扩展和覆盖默认配置，非常重要。 |
| **配置创建** |
| `createDefaultConfig` & 其他创建函数 | `function` | **价值高** | 极大地改善了用户入门体验，提供了最佳实践。 |
| `presets` | `const` | **疑似冗余** | 与 `create...Config` 系列函数功能高度重叠，建议将 `presets` 的逻辑合并到 `creators.ts` 中，移除此导出。 |

---

## 3. `@yai-loglayer/browser` 包导出分析

`browser` 包的 API 设计分层清晰，是很好的典范。

| 导出成员 | 类型 | 评估 | 建议与说明 |
| :--- | :--- | :--- | :--- |
| `BrowserLoggerConfig` & 相关类型 | `interface` | **价值高** | 用户友好的高级配置 API，是此包的核心。 |
| `createBrowserLogger`, `createBrowserLoggerSync` | `function` | **价值高** | 用户创建浏览器 logger 的主要入口点，封装了底层细节。 |
| `createDevelopmentBrowserLogger`, etc. | `function` | **价值高** | 便捷的预设工厂函数，简化了常见场景的配置。 |
| `LoglayerBrowserTransport` | `class` | **价值高** | 底层 transport 实现，为需要深度定制的高级用户保留。 |
| `convertLegacyOutputs` | `function` | **应为内部** | 纯粹的内部辅助函数，用于转换配置格式，不应对外暴露。 |
| `createBrowserLogLayer` | `function` | **价值低** | 一个中层工厂函数，其功能已被更高级的 `createBrowserLogger` 覆盖。可以考虑设为内部函数。 |

---

## 4. `@yai-loglayer/server` 包导出分析

`server` 包的 API 功能强大，但也可以隐藏一些实现细节。

| 导出成员 | 类型 | 评估 | 建议与说明 |
| :--- | :--- | :--- | :--- |
| `ServerLoggerConfig` & 相关类型 | `interface` | **价值高** | 功能强大的服务端日志框架的核心配置。 |
| `ServerLoggerInstance`, `ServerLoggerManager` | `interface` | **价值高** | 定义了此包的核心价值——日志实例和管理器的强大能力。 |
| `createServerLogger`, `createServerLoggerManager` | `function` | **价值高** | 创建实例和管理器的主要入口点。 |
| `createNextjsServerLogger`, etc. | `function` | **价值高** | 框架适配器是“杀手级特性”，极大地提升了易用性。 |
| `ServerTransport` | `class` | **价值高** | 底层 transport 实现，为高级用户保留。 |
| `ServerOutputEngine` | `class` | **应为内部** | 这是 `ServerTransport` 的一个实现细节。用户应通过 `ServerTransport` 的配置来使用其功能，而非直接与引擎交互。 |

---

## 5. `@yai-loglayer/receiver` 包导出分析

`receiver` 包的 API 非常干净和聚焦。

| 导出成员 | 类型 | 评估 | 建议与说明 |
| :--- | :--- | :--- | :--- |
| `createNextjsLogReceiver`, `createExpressLogReceiver` | `function` | **价值高** | 此包的核心功能，提供了与主流框架的无缝集成。 |
| `LogReceiverClient` | `class` | **价值高** | 提供了与接收器配套的客户端，形成了端到端的闭环。 |
| `LogReceiverConfig` & 相关类型 | `interface` | **价值高** | 接收器和客户端所必需的配置与类型。 |
| `createLogReceiver` | `function` | **价值低** | 通用版本，在框架适配器的光环下显得价值较低，但可作为备用选项保留。 |

## 6. 总结论与 V2 建议

基于以上更精细的分析，V2 版本的优化建议如下：

1.  **首要任务：精简 `core` 包**
    *   **移除冗余**：合并 `presets` 到 `creators`；移除 `validateConfig` 函数；移除 `canUse...APIs` 别名。
    *   **隐藏内部细节**：将 `EngineStrategy` 等多个内部类型移出公共 API。
    *   **目标**：将 `core` 包的导出成员数量减少约 1/3，使其 API 更加聚焦和易于学习。

2.  **清理其他包的 API**
    *   在 `browser` 包中将 `convertLegacyOutputs` 设为内部。
    *   在 `server` 包中将 `ServerOutputEngine` 设为内部。

3.  **重新审视“价值低”的成员**
    *   对于 `globalErrorHandler` 和 `createLogReceiver` 等，虽然价值相对较低，但移除它们会造成更大的破坏性变更。现阶段建议**保留**，但在文档中明确引导用户使用更高价值的替代方案。

4.  **建立 API 导出规范**
    *   在 `index.ts` 中使用 `// Public API` 和 `// For internal use only` 等注释块来明确区分。
    *   考虑使用 `eslint-plugin-boundaries` 等工具来强制执行导出规则，防止未来再次意外暴露内部实现。

完成以上步骤后，`loglayer-support` 的整个 API 表面将更加专业、易用和健壮。 