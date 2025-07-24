/**
 * 框架适配器统一导出和工厂
 */

import type { FrameworkAdapter } from '../../receiver'
import { NextjsAdapter } from './nextjs-adapter'
import { ExpressAdapter } from './express-adapter'
import { GenericAdapter } from './generic-adapter'

// 导出所有适配器
export { NextjsAdapter } from './nextjs-adapter'
export { ExpressAdapter } from './express-adapter'
export { GenericAdapter } from './generic-adapter'

/**
 * 适配器类型
 */
export type AdapterType = 'nextjs' | 'express' | 'generic' | 'auto'

/**
 * 适配器工厂
 */
export class AdapterFactory {
  private static adapters = new Map<string, new () => FrameworkAdapter>([
    ['nextjs', NextjsAdapter],
    ['express', ExpressAdapter],
    ['generic', GenericAdapter]
  ])

  /**
   * 创建适配器
   */
  static create(type: AdapterType): FrameworkAdapter {
    if (type === 'auto') {
      return this.createAuto()
    }

    const AdapterClass = this.adapters.get(type)
    if (!AdapterClass) {
      throw new Error(`Unknown adapter type: ${type}`)
    }

    return new AdapterClass()
  }

  /**
   * 自动检测并创建适配器
   */
  static createAuto(): FrameworkAdapter {
    // 按优先级检测可用的适配器
    if (NextjsAdapter.isAvailable()) {
      return new NextjsAdapter()
    }

    if (ExpressAdapter.isAvailable()) {
      return new ExpressAdapter()
    }

    // 默认使用通用适配器
    return new GenericAdapter()
  }

  /**
   * 注册自定义适配器
   */
  static register(name: string, AdapterClass: new () => FrameworkAdapter): void {
    this.adapters.set(name, AdapterClass)
  }

  /**
   * 获取所有可用的适配器类型
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * 检查适配器是否可用
   */
  static isAvailable(type: string): boolean {
    const AdapterClass = this.adapters.get(type)
    if (!AdapterClass) {
      return false
    }

    // 检查适配器类是否有 isAvailable 静态方法
    if ('isAvailable' in AdapterClass && typeof AdapterClass.isAvailable === 'function') {
      return AdapterClass.isAvailable()
    }

    return true
  }
}
