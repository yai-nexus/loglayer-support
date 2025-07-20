/**
 * 服务端专用日志功能
 * 在 API 路由中使用，支持文件输出
 */

import { createLoggerSync } from '../../../src'
import type { LoggerConfig } from '../../../src/types'

// 创建服务端日志配置
const serverConfig: LoggerConfig = {
  level: {
    default: 'debug',
    loggers: {
      'api': 'info',
      'database': 'debug'
    }
  },
  server: {
    outputs: [
      { type: 'stdout' }, // 控制台输出
      { 
        type: 'file',
        config: { 
          dir: '/Users/harrytang/Documents/GitHub/loglayer-support/logs',
          filename: 'nextjs-development.log'
        }
      }
    ]
  },
  client: {
    outputs: [
      { type: 'console' }
    ]
  }
}

// 创建服务端 logger
console.log('[DEBUG] Creating server logger with config:', JSON.stringify(serverConfig, null, 2));
export const serverLogger = createLoggerSync('nextjs-server', serverConfig)
console.log('[DEBUG] Server logger created successfully');

// 模块特定的 logger
export const apiLogger = serverLogger.forModule('api')
export const dbLogger = serverLogger.forModule('database')

// 兼容导出
export const logger = serverLogger