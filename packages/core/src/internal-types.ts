/**
 * 内部实现类型
 *
 * 这些类型仅供内部使用，不应该暴露给最终用户
 */

/**
 * 内部引擎类型
 */
export type ServerEngineType = 'core';
export type ClientEngineType = 'browser';

/**
 * 引擎选择策略
 */
export interface EngineStrategy {
  preferred: ServerEngineType;
  fallback: ServerEngineType;
  guaranteed: ServerEngineType;
}

/**
 * 格式映射配置
 */
export interface FormatMapping {
  format: 'pretty' | 'json' | 'structured';
  options: Record<string, unknown>;
}
