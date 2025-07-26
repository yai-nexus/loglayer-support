/**
 * 引擎加载器（已弃用）
 *
 * 注意：此模块已在 v0.7.0 重构中弃用
 * 请使用 factory/core.ts 中的新工厂函数
 */

import type { LogLayer } from 'loglayer'
import type { ServerOutput, ClientOutput } from '../core';
import { BrowserLogger } from './client';
import { isBrowserEnvironment } from '../core';

// 类型定义
type ServerEngineType = 'pino' | 'winston' | 'core';

// 工具函数
async function canImport(moduleName: string): Promise<boolean> {
  try {
    await import(moduleName);
    return true;
  } catch {
    return false;
  }
}

/**
 * 引擎加载器（已弃用）
 * @deprecated 请使用 factory/core.ts 中的新工厂函数
 */
export class EngineLoader {
  /**
   * @deprecated 请使用 createLogger 或 createServerLogger
   */
  static async loadServerEngine(outputs: ServerOutput[]): Promise<LogLayer> {
    throw new Error('EngineLoader.loadServerEngine 已弃用，请使用 createServerLogger');
  }

  /**
   * @deprecated 请使用 createBrowserLogger
   */
  static loadClientEngine(outputs: ClientOutput[]): any {
    // 浏览器环境：直接返回，不做任何 Node.js 库检测
    return new BrowserLogger(outputs);
  }

  /**
   * 检查引擎是否可用
   */
  static async isEngineAvailable(engineType: ServerEngineType): Promise<boolean> {
    if (isBrowserEnvironment()) {
      return false; // 浏览器环境不支持服务端引擎
    }

    switch (engineType) {
      case 'pino':
        return (await canImport('pino')) && (await canImport('@loglayer/transport-pino'));
      case 'winston':
        return (await canImport('winston')) && (await canImport('@loglayer/transport-winston'));
      case 'core':
        return true; // 核心引擎总是可用
      default:
        return false;
    }
  }
}
