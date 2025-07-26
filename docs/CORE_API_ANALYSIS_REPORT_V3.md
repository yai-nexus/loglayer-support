# `@yai-loglayer/core` API 分析报告 (V3)

## 1. 包概述

`@yai-loglayer/core` 是整个 `loglayer-support` 系统的基石。它提供了所有其他包共享的核心类型定义、配置结构、验证工具和底层实用程序。此包的 API 清晰度和稳定性至关重要。

经过最新一轮的 API 精炼，该包的公共 API 已经变得更加聚焦和健壮。

---

## 2. 公共 API 成员评估

以下是当前从 `@yai-loglayer/core` 包导出的所有公共 API 成员的详细评估。

| 导出成员 | 类型 | 评估 | 建议与说明 |
| :--- | :--- | :--- | :--- |
| **核心类型** |
| `LoggerConfig` & 相关类型 | `interface` | **价值高** | 定义了库的核心配置结构，是所有功能的基础。 |
| `LogLevel`, `LogMetadata` | `type` | **价值高** | 基础类型，必不可少。 |
| `EnvironmentInfo` | `interface` | **价值高** | `detectEnvironment` 的返回类型，对于环境判断逻辑至关重要。 |
| **配置验证** |
| `ConfigValidator`, `FieldValidator` | `class` | **价值高** | 强大的验证系统核心，为高级用户提供了极大的灵活性。 |
| `ValidationRules` | `const` | **价值高** | 提供了一套丰富的预定义验证规则，非常实用。 |
| `ValidationResult` & 相关类型 | `interface` | **价值高** | 使用验证系统所必需的返回类型。 |
| `createConfigValidator` | `function` | **价值高** | 创建验证器的主要入口点。 |
| **环境检测** |
| `detectEnvironment` | `function` | **价值高** | 核心功能，用于实现环境自适应。 |
| `isBrowserEnvironment`, `isNodeEnvironment`| `function`| **价值高** | 清晰、直观的环境判断函数。 |
| `canImport` | `function` | **价值高** | 检查可选依赖的强大工具，对实现“渐进增强”功能很有帮助。 |
| **错误处理** |
| `ErrorHandler` | `class` | **价值高** | 结构化错误处理的核心。 |
| `ERROR_CODES` & 相关类型/枚举 | `const` | **价值高** | 提供了标准的错误定义，必不可少。 |
| `createErrorHandler` | `function` | **价值高** | 创建 `ErrorHandler` 实例的标准方式。 |
| `globalErrorHandler` | `const` | **价值中** | 虽然方便，但鼓励了全局单例模式。当前保留，但在文档中应主推 `createErrorHandler`。 |
| **工具函数** |
| `serializeMessages`, `separateMessages` | `function` | **价值高** | 极其实用的工具，在所有 transport 中都需要，避免了代码重复。 |
| `getLoggerLevel`, `shouldLog` | `function` | **价值高** | 日志过滤的核心判断逻辑，必须导出。 |
| `mergeConfigs` | `function` | **价值高** | 允许用户优雅地扩展和覆盖默认配置，非常重要。 |
| **配置创建** |
| `createDefaultConfig` & 其他创建函数 | `function` | **价值高** | 极大地改善了用户入门体验，提供了最佳实践。 |
| `presets` | `const` | **价值高** | 作为 `creators.ts` 的一部分，提供了便捷的预设集合。 |

---

## 3. 内部实现（已隐藏）

以下成员已被确认为内部实现细节，并且**不再对外导出**，这是本次 API 优化的关键成果：

*   **内部类型**: `ServerEngineType`, `ClientEngineType`, `EngineStrategy`, `FormatMapping`。
    *   **理由**: 这些是引擎的内部实现细节，隐藏它们可以使未来更换或重构引擎更容易，而不会影响用户。
*   **冗余函数**: `validateConfig` (功能被 `ConfigValidator` 覆盖), `canUseNodeAPIs`, `canUseBrowserAPIs` (与 `is...Environment` 重复)。
    *   **理由**: 移除了这些冗余和功能较弱的 API，使用户的选择更清晰。

## 4. 结论与未来建议

`@yai-loglayer/core` 的 API 现在非常清晰和健壮。

*   **优点**:
    *   **API 表面最小化**: 只暴露了用户真正需要的工具和类型。
    *   **职责明确**: 每个导出的成员都有清晰、不可替代的用途。
    *   **采用了显式导出**: 彻底杜绝了意外暴露内部实现的风险。
*   **未来建议**:
    *   **保持稳定**: `core` 包作为基础，其 API 应保持高度稳定。任何未来的变更都应经过严格的评审。
    *   **完善文档**: 为每个导出的公共 API 成员撰写详细的 JSDoc 注释，解释其用途和示例用法。 