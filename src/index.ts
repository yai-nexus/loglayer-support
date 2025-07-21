/**
 * loglayer-support 主入口
 *
 * 提供新的用户友好 API 来创建基于输出手段的日志系统
 * 完全按照 docs/practical-config.md 和 docs/implementation-strategy.md 设计
 */

// =============================================================================
// 公共类型导出（用户需要的类型）
// =============================================================================
export type {
  // 基础类型
  LogLevel,
  LogMetadata,
  IEnhancedLogger,
  EnvironmentInfo,

  // 配置类型
  LoggerConfig,
  ServerOutput,
  ClientOutput,
  ServerOutputConfig,
  ClientOutputConfig,
} from './core';

// =============================================================================
// 核心API导出
// =============================================================================

// 导入核心功能
import {
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory,
} from './factory';
import {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment,
} from './config';
import { detectEnvironment } from './core';
import {
  generateRequestId,
  generateTraceId,
  createPerformanceMeasurer,
  withErrorLogging,
  withAsyncErrorLogging,
} from './wrapper';
import { presets } from './config';

// 核心创建函数
export {
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory,
};

// 配置创建函数
export {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment,
};

// 预设配置
export { presets };

// 实用工具函数
export {
  generateRequestId,
  generateTraceId,
  createPerformanceMeasurer,
  withErrorLogging,
  withAsyncErrorLogging,
  detectEnvironment,
};

// =============================================================================
// 使用说明
// =============================================================================
// 注意：此库采用显式初始化设计，确保日志完整性
// 请使用 createLogger() 或 createLoggerSync() 创建 logger 实例
