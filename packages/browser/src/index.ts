/**
 * @yai-loglayer/browser 统一导出
 *
 * 浏览器端日志解决方案
 */

// =============================================================================
// 公共 API (Public API)
// 这些是用户应该使用的稳定接口
// =============================================================================

// 高级浏览器日志器 API
export {
  // 类型定义
  type BrowserLogLevel,
  type ConsoleOutputConfig,
  type LocalStorageOutputConfig,
  type HttpOutputConfig,
  type BrowserLoggerConfig,
  type BrowserLoggerOptions,

  // 主要工厂函数
  createBrowserLogger,
  createBrowserLoggerSync
} from './browser';

// 预设工厂函数
export {
  createDevelopmentBrowserLogger,
  createProductionBrowserLogger,
  createCustomBrowserLogger
} from './browser-factory';

// 底层传输器（供高级用户使用）
export {
  type BrowserOutputConfig,
  type LoglayerBrowserTransportConfig,
  LoglayerBrowserTransport
} from './browser-transport';

// =============================================================================
// 内部实现 (Internal Implementation)
// 以下函数仅供内部使用，不对外暴露
// =============================================================================

// createBrowserLogLayer - 中层工厂函数，已被高级 API 覆盖
// convertLegacyOutputs - 配置转换函数，纯内部实现细节