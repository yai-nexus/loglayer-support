/**
 * 浏览器 Transport 工厂函数
 * 
 * 提供便捷的方法来创建和配置 LoglayerBrowserTransport
 */

import { LogLayer } from 'loglayer'
import { LoglayerBrowserTransport, type BrowserOutputConfig, type LoglayerBrowserTransportConfig } from './browser-transport'
import type { ClientOutput } from '@yai-loglayer/core'

/**
 * 从旧的配置格式转换为新的 BrowserOutputConfig
 */
export function convertLegacyOutputs(outputs: ClientOutput[]): BrowserOutputConfig {
  const config: BrowserOutputConfig = {}

  for (const output of outputs) {
    switch (output.type) {
      case 'console':
        config.console = {
          enabled: true,
          colors: true
        }
        break

      case 'http':
        config.http = {
          enabled: true,
          endpoint: output.config?.endpoint || '/api/logs',
          method: 'POST',
          headers: output.config?.headers || {},
          batchSize: output.config?.bufferSize || 10,
          flushInterval: output.config?.flushInterval || 5000,
          retryAttempts: 3,
          onlyErrors: output.level === 'error'
        }
        break

      case 'localstorage':
        config.localStorage = {
          enabled: true,
          key: output.config?.key || 'app-logs',
          maxEntries: output.config?.maxEntries || 100,
          ttl: output.config?.ttl || 24 * 60 * 60 * 1000
        }
        break
    }
  }

  return config
}

/**
 * 创建浏览器 LogLayer 实例
 */
export function createBrowserLogLayer(outputs: ClientOutput[]): LogLayer {
  const browserOutputs = convertLegacyOutputs(outputs)
  
  const transport = new LoglayerBrowserTransport({
    id: 'browser-transport',
    outputs: browserOutputs
  })

  return new LogLayer({
    transport
  })
}

/**
 * 创建预配置的开发环境浏览器 Logger
 */
export function createDevelopmentBrowserLogger(): LogLayer {
  const transport = new LoglayerBrowserTransport({
    id: 'dev-browser-transport',
    outputs: {
      console: {
        enabled: true,
        colors: true
      },
      localStorage: {
        enabled: true,
        key: 'dev-app-logs',
        maxEntries: 50
      }
    }
  })

  return new LogLayer({
    transport
  })
}

/**
 * 创建预配置的生产环境浏览器 Logger
 */
export function createProductionBrowserLogger(httpEndpoint = '/api/logs'): LogLayer {
  const transport = new LoglayerBrowserTransport({
    id: 'prod-browser-transport',
    outputs: {
      console: {
        enabled: false // 生产环境关闭控制台输出
      },
      http: {
        enabled: true,
        endpoint: httpEndpoint,
        method: 'POST',
        batchSize: 20,
        flushInterval: 10000,
        retryAttempts: 3,
        onlyErrors: true // 生产环境只发送错误
      },
      localStorage: {
        enabled: true,
        key: 'prod-app-logs',
        maxEntries: 20,
        ttl: 60 * 60 * 1000 // 1小时
      }
    }
  })

  return new LogLayer({
    transport
  })
}

/**
 * 创建高度定制化的浏览器 Logger
 */
export function createCustomBrowserLogger(config: BrowserOutputConfig): LogLayer {
  const transport = new LoglayerBrowserTransport({
    id: 'custom-browser-transport',
    outputs: config
  })

  return new LogLayer({
    transport
  })
}