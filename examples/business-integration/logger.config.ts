/**
 * 日志器配置示例
 *
 * 这是业务侧唯一需要的配置文件，替代原来复杂的 100+ 行初始化代码
 */

import type { AutoLoggerConfig } from '../../packages/server/src';

/**
 * 基础配置示例
 */
export const basicConfig: AutoLoggerConfig = {
  app: {
    name: 'my-app',
    environment: 'auto',    // 自动检测环境
    version: 'auto'         // 自动从 package.json 读取
  },
  outputs: {
    console: { enabled: 'auto' },  // 开发环境自动启用
    file: {
      enabled: true,
      path: 'auto',              // 自动检测项目根目录
      filename: 'app.log'
    }
  }
};

/**
 * 完整配置示例（包含 SLS）
 */
export const fullConfig: AutoLoggerConfig = {
  app: {
    name: 'yai-investor-webapp',
    environment: 'auto',
    version: 'auto'
  },
  outputs: {
    console: {
      enabled: 'auto',
      format: 'pretty',
      colors: 'auto'
    },
    file: {
      enabled: true,
      path: 'auto',
      filename: 'webapp.server.log',
      rotation: {
        maxSize: '10MB',
        maxFiles: 5
      }
    },
    sls: {
      enabled: 'auto',        // 根据环境变量自动启用
      config: 'env'           // 从环境变量读取配置
    }
  },
  features: {
    debug: {
      enabled: 'auto',
      verbose: false
    }
  },
  level: 'auto'
};

// 默认导出基础配置
export default basicConfig;
