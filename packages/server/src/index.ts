/**
 * @yai-loglayer/server 统一导出
 *
 * 服务端日志解决方案
 */

// =============================================================================
// 公共 API (Public API)
// 这些是用户应该使用的稳定接口
// =============================================================================

// 高级服务端日志器 API
export {
  // 类型定义
  type ServerEnvironment,
  type ServerOutputConfig,
  type ModuleConfig,
  type PathConfig,
  type InitializationConfig,
  type PerformanceConfig,
  type HealthCheckConfig,
  type ServerLoggerConfig,
  type ServerLoggerOptions,
  type ModuleLogger,
  type ServerLoggerInstance,
  type ServerLoggerManager,
  type CompatibleLogger,

  // 主要工厂函数
  createServerLogger,
  createServerLoggerManager,
  createNextjsServerLogger,
  createExpressServerLogger
} from './server';

// 底层传输器（供高级用户使用）
export {
  ServerTransport,
  type ServerTransportConfig
} from './server-transport';

// =============================================================================
// 内部实现 (Internal Implementation)
// 以下类和函数仅供内部使用，不对外暴露
// =============================================================================

// ServerOutputEngine - 传输器的内部实现细节，用户应通过 ServerTransport 配置使用