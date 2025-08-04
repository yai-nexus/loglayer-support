/**
 * 客户端主入口 - 简化版本
 */

import { createAutoClientLogger, createClientLogger } from './logger';
import { clientPresets, type ClientPresetType } from './presets';

// React 集成
export {
  LoggerProvider, useComponentLogger, useLogger, useLogging,
  usePerformanceLogger
} from './react';

// 主要 API
export {
  createAutoClientLogger, createClientLogger
};

// 预设配置
  export { clientPresets };
  export type { ClientPresetType };

// 快速启动 API
export const clientQuickStart = {
  dev: (appName: string) => createClientLogger(clientPresets.development(appName)),
  prod: (appName: string) => createClientLogger(clientPresets.production(appName)),
  test: (appName: string) => createClientLogger(clientPresets.testing(appName)),
};

// 导出类型
export type {
  ClientLoggerInstance,
  EnvironmentInfo, NextjsLogConfig
} from '../shared/types';

