/**
 * @yai-loglayer/core 统一导出
 *
 * 核心类型定义、工具函数和配置功能
 */

// =============================================================================
// 公共 API (Public API)
// 这些是用户应该使用的稳定接口
// =============================================================================

// 核心类型定义
export {
  type LogLevel,
  type LogMetadata,
  type EnvironmentInfo,
  type LoggerConfig,
  type ServerOutput,
  type ServerOutputConfig,
  type ClientOutput,
  type ClientOutputConfig
} from './types';

// 配置验证系统
export {
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSuggestion,
  type ValidationRule,
  FieldValidator,
  ConfigValidator,
  ValidationRules,
  createConfigValidator,
  createFieldValidator,
  formatValidationResult
} from './config-validation';

// 环境检测功能
export {
  detectEnvironment,
  isBrowserEnvironment,
  isNodeEnvironment,
  getEnvVar,
  canImport
} from './environment';

// 错误处理系统
export {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  type StandardError,
  type ErrorHandlingOptions,
  ERROR_CODES,
  ErrorHandler,
  createErrorHandler,
  globalErrorHandler
} from './error-handling';

// 消息处理工具
export {
  serializeMessages,
  serializeMessage,
  hasObjectMessages,
  separateMessages
} from './message-utils';

// 配置创建和预设
export {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment,
  presets
} from './creators';

// 配置验证和工具函数
export {
  getLoggerLevel,
  shouldLog,
  getEffectiveOutputs,
  mergeConfigs
} from './validation';

// =============================================================================
// 内部实现 (Internal Implementation)
// 以下类型和函数仅供内部使用，不对外暴露
// =============================================================================

// internal-types.ts - 内部引擎类型，不导出
// 包含：ServerEngineType, ClientEngineType, EngineStrategy, FormatMapping
