/**
 * 输出器工厂函数
 */

import type { LogOutput, ConsoleOutputConfig, LocalStorageOutputConfig, HttpOutputConfig } from '../../browser'
import { ConsoleOutput } from './console-output'
import { LocalStorageOutput } from './localstorage-output'
import { HttpOutput } from './http-output'

/**
 * 创建控制台输出器
 */
export function createConsoleOutput(config: ConsoleOutputConfig): LogOutput {
  return new ConsoleOutput(config)
}

/**
 * 创建本地存储输出器
 */
export function createLocalStorageOutput(config: LocalStorageOutputConfig): LogOutput {
  return new LocalStorageOutput(config)
}

/**
 * 创建 HTTP 输出器
 */
export function createHttpOutput(config: HttpOutputConfig): LogOutput {
  return new HttpOutput(config)
}

/**
 * 输出器类型映射
 */
export const OUTPUT_FACTORIES = {
  console: createConsoleOutput,
  localStorage: createLocalStorageOutput,
  http: createHttpOutput
} as const

/**
 * 根据类型创建输出器
 */
export function createOutput(type: keyof typeof OUTPUT_FACTORIES, config: any): LogOutput {
  const factory = OUTPUT_FACTORIES[type]
  if (!factory) {
    throw new Error(`Unknown output type: ${type}`)
  }
  return factory(config)
}
