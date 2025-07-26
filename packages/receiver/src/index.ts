/**
 * @yai-loglayer/receiver 统一导出
 *
 * 日志接收器解决方案
 */

// =============================================================================
// 公共 API (Public API)
// 这些是用户应该使用的稳定接口
// =============================================================================

// 日志接收器 API（框架适配器和通用接收器）
export {
  type LogReceiverConfig,
  type NextjsLogReceiver,
  createLogReceiver,
  createNextjsLogReceiver,
  createExpressLogReceiver
} from './receiver';

// 客户端传输（与接收器配套的客户端实现）
export {
  type LogReceiverClientOptions,
  LogReceiverClient
} from './client';

// =============================================================================
// 内部实现 (Internal Implementation)
// receiver 包的 API 设计良好，暂无需要隐藏的内部实现
// =============================================================================