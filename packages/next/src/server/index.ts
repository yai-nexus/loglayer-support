/**
 * 服务端主入口
 *
 * 只包含服务端代码，不会引入任何客户端代码
 */

import type { NextjsLogConfig, ServerLoggerInstance } from '../shared/types';
import { ServerConfigManager } from './config';
import { createAutoServerLogger, createServerLogger, createServerLoggerSync } from './logger';
import { serverPresets, type ServerPresetType } from './presets';

// 日志接收器
export {
    createAutoApiRoute,
    createDefaultApiRoute, createDevelopmentApiRoute,
    createEnvironmentApiRoute, createLogReceiverHandler,
    createOptionsHandler, createProductionApiRoute, generateApiRouteCommand, generateApiRouteFile,
    writeApiRouteFile, type ApiRouteHandlers, type LogReceiverConfig,
    type LogReceiverHandler
} from './receiver';

// 工具函数
export {
    cleanupLogFiles,
    createDebugLogger, detectEnvironment, ensureDir, generateId, getEnvVar, getFileSize, getLogFiles, getNextjsVersion, hasAllEnvVars, hasEnvVar, isDevelopment, isNextjsApp, isProduction, isServer, isTest, measurePerformance, parseFileSize, serializeError
} from './utils';

/**
 * 服务端日志器初始化
 */
export async function initServerLogger(config: NextjsLogConfig): Promise<ServerLoggerInstance> {
  const configManager = ServerConfigManager.getInstance();
  configManager.setConfig(config);

  return createServerLogger(config);
}

/**
 * 同步服务端日志器初始化
 */
export function initServerLoggerSync(config: NextjsLogConfig): ServerLoggerInstance {
  const configManager = ServerConfigManager.getInstance();
  configManager.setConfig(config);

  return createServerLoggerSync(config);
}

/**
 * 服务端快速启动方法
 */
export const serverQuickStart = {
  /**
   * 开发环境快速启动
   */
  dev: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.development(appName));
  },

  /**
   * 生产环境快速启动
   */
  prod: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.production(appName));
  },

  /**
   * 测试环境快速启动
   */
  test: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.testing(appName));
  },

  /**
   * 调试模式快速启动
   */
  debug: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.debug(appName));
  },

  /**
   * 高性能模式快速启动
   */
  performance: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.performance(appName));
  },

  /**
   * 监控模式快速启动
   */
  monitoring: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.monitoring(appName));
  },

  /**
   * 本地开发快速启动
   */
  local: (appName: string): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets.local(appName));
  },

  /**
   * 自定义预设快速启动
   */
  preset: (appName: string, presetType: ServerPresetType): ServerLoggerInstance => {
    return initServerLoggerSync(serverPresets[presetType](appName));
  },

  /**
   * 异步版本 - 开发环境
   */
  devAsync: async (appName: string): Promise<ServerLoggerInstance> => {
    return initServerLogger(serverPresets.development(appName));
  },

  /**
   * 异步版本 - 生产环境
   */
  prodAsync: async (appName: string): Promise<ServerLoggerInstance> => {
    return initServerLogger(serverPresets.production(appName));
  },
};

/**
 * 创建服务端日志器（高级API）
 */
export async function createNextjsServerLogger(config: NextjsLogConfig): Promise<ServerLoggerInstance> {
  return createServerLogger(config);
}

/**
 * 创建自动配置的服务端日志器
 */
export async function createAutoNextjsServerLogger(appName: string): Promise<ServerLoggerInstance> {
  return createAutoServerLogger(appName);
}

/**
 * 同步创建服务端日志器
 */
export function createNextjsServerLoggerSync(config: NextjsLogConfig): ServerLoggerInstance {
  return createServerLoggerSync(config);
}

/**
 * 获取服务端配置管理器实例
 */
export function getServerConfigManager(): ServerConfigManager {
  return ServerConfigManager.getInstance();
}

/**
 * 创建预配置的日志器实例（兼容旧API）
 */
export const logger = serverQuickStart.prod('nextjs-app');

/**
 * 为特定模块创建日志器
 */
export const apiLogger = logger.forModule('api');
export const dbLogger = logger.forModule('database');
export const authLogger = logger.forModule('auth');
export const cacheLogger = logger.forModule('cache');

// 导出预设配置
export { serverPresets };
export type { ServerPresetType };

// 导出类型
    export type {
        EnvironmentInfo, NextjsLogConfig,
        ServerLogConfig,
        ServerLoggerInstance
    } from '../shared/types';

