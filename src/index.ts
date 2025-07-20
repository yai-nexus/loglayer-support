/**
 * loglayer-support 主入口
 *
 * 提供新的用户友好 API 来创建基于输出手段的日志系统
 * 完全按照 docs/practical-config.md 和 docs/implementation-strategy.md 设计
 */

// 导出所有类型
export type * from "./types";

// 导出核心模块  
export * from "./config";
export * from "./environment";
export * from "./factory";
export * from "./transports";
export * from "./wrapper";

// 导入核心功能
import { 
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory
} from "./factory";
import { 
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment
} from "./config";
import { detectEnvironment } from "./environment";
import { 
  generateRequestId, 
  generateTraceId,
  createPerformanceMeasurer,
  withErrorLogging,
  withAsyncErrorLogging
} from "./wrapper";

// 重新导出主要创建函数
export {
  createLogger,
  createLoggerSync,
  createNextjsLogger,
  createNextjsLoggerSync,
  createResilientLogger,
  LoggerFactory
};

// 重新导出配置创建函数
export {
  createDefaultConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createConfigForEnvironment
};

// 重新导出工具函数
export {
  generateRequestId,
  generateTraceId,
  createPerformanceMeasurer,
  withErrorLogging,
  withAsyncErrorLogging,
  detectEnvironment
};

// 注意：此库采用显式初始化设计，确保日志完整性
// 请使用 createLogger() 或 createLoggerSync() 创建 logger 实例