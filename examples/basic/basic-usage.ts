/**
 * 基础使用示例
 * 
 * 展示新的用户友好配置API的基本用法
 */

import { createLogger, createDefaultConfig, createDevelopmentConfig } from '../../dist/index.js';
import type { LoggerConfig } from '../../dist/index.d.ts';

// =============================================================================
// 示例 1: 使用预设配置
// =============================================================================

async function example1_UsingPresets() {
  console.log('\n=== 示例 1: 使用预设配置 ===');
  
  // 使用默认配置
  const defaultConfig = createDefaultConfig();
  const logger1 = await createLogger('app', defaultConfig);
  
  logger1.info('使用默认配置的日志', { userId: 123 });
  
  // 使用开发环境配置
  const devConfig = createDevelopmentConfig();
  const logger2 = await createLogger('api', devConfig);
  
  logger2.debug('开发环境调试信息', { endpoint: '/api/users' });
  logger2.info('API 请求完成', { statusCode: 200, duration: 150 });
}

// =============================================================================
// 示例 2: 自定义配置
// =============================================================================

async function example2_CustomConfig() {
  console.log('\n=== 示例 2: 自定义配置 ===');
  
  const customConfig: LoggerConfig = {
    level: {
      default: 'info',
      loggers: {
        'database': 'debug',  // 数据库模块显示详细信息
        'auth': 'warn',       // 认证模块只显示警告
        'ui': 'error'         // UI 模块只显示错误
      }
    },
    server: {
      outputs: [
        { type: 'stdout' },                                   // 控制台输出
        {
          type: 'file',
          config: {
            dir: './logs',
            filename: 'basic.log',
            maxSize: '10MB',
            maxFiles: 5
          }
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' },                                  // 浏览器控制台
        { 
          type: 'http',
          level: 'error',                                     // 只上报错误到服务器
          config: { endpoint: '/api/client-logs' }
        }
      ]
    }
  };

  // 创建不同模块的 logger
  const dbLogger = await createLogger('database', customConfig);
  const authLogger = await createLogger('auth', customConfig);
  const uiLogger = await createLogger('ui', customConfig);
  const apiLogger = await createLogger('api', customConfig);  // 使用默认级别

  // 测试不同级别的日志
  dbLogger.debug('数据库连接建立');        // 会输出（database 配置为 debug）
  authLogger.debug('用户认证开始');        // 不会输出（auth 配置为 warn）
  uiLogger.info('页面渲染完成');           // 不会输出（ui 配置为 error）
  apiLogger.info('API 调用成功');          // 会输出（使用默认级别 info）
  
  authLogger.warn('认证失败', { attempts: 3 });
  uiLogger.error('组件渲染失败', { component: 'UserProfile' });
}

// =============================================================================
// 示例 3: 增强功能使用
// =============================================================================

async function example3_EnhancedFeatures() {
  console.log('\n=== 示例 3: 增强功能使用 ===');
  
  const config = createDevelopmentConfig();
  const logger = await createLogger('enhanced-demo', config);
  
  // 上下文绑定
  const requestLogger = logger.forRequest('req_123', 'trace_456');
  const userLogger = logger.forUser('user_789');
  const moduleLogger = logger.forModule('payment');
  
  requestLogger.info('处理用户请求', { endpoint: '/api/payment' });
  userLogger.info('用户操作', { action: 'purchase' });
  moduleLogger.debug('支付流程开始', { amount: 99.99 });
  
  // 错误记录
  try {
    throw new Error('模拟错误');
  } catch (error) {
    logger.logError(error as Error, { context: 'payment-processing' });
  }
  
  // 性能记录
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 100)); // 模拟异步操作
  const duration = Date.now() - startTime;
  
  logger.logPerformance('database-query', duration, { 
    query: 'SELECT * FROM users',
    rowCount: 150 
  });
  
  // 链式调用
  const contextLogger = logger
    .forRequest('req_456')
    .forUser('user_123')
    .forModule('billing');
    
  contextLogger.info('复合上下文日志', { 
    operation: 'create-invoice',
    amount: 199.99 
  });
}

// =============================================================================
// 示例 4: 生产环境配置
// =============================================================================

async function example4_ProductionConfig() {
  console.log('\n=== 示例 4: 生产环境配置 ===');
  
  const productionConfig: LoggerConfig = {
    level: {
      default: 'info',
      loggers: {
        'debug': 'error',       // 生产环境禁用调试模块
        'test': 'error'         // 生产环境禁用测试模块
      }
    },
    server: {
      outputs: [
        { type: 'stdout' },     // 容器化部署标准输出
        { 
          type: 'file',
          config: { 
            dir: './logs',
            filename: 'production.log',
            maxSize: '50MB',
            maxFiles: 10
          }
        },
        {
          type: 'sls',          // 云端日志收集
          level: 'warn',        // 只收集警告及以上级别
          config: {
            endpoint: 'cn-beijing.log.aliyuncs.com',
            project: 'yai-log-test',
            logstore: 'app-log',
            accessKey: 'LTAI5tNpnJzbTm6PBdmAfzKp',
            accessKeySecret: 'pUOfZVW7Qk0L78Ku4Ber1ysr2bvXol',
            appName: 'loglayer-basic-production'
          }
        }
      ]
    },
    client: {
      outputs: [
        {
          type: 'http',         // 生产环境只上报到服务器
          level: 'warn',
          config: {
            endpoint: '/api/client-logs',
            bufferSize: 10,
            flushInterval: 5000
          }
        }
      ]
    }
  };

  const prodLogger = await createLogger('production-app', productionConfig);
  
  prodLogger.info('生产环境应用启动', { 
    version: '1.2.0',
    environment: 'production',
    node_version: process.version
  });
  
  prodLogger.warn('配置警告', { 
    message: 'Using default database connection pool size',
    defaultSize: 10
  });
  
  prodLogger.error('生产环境错误', {
    error: 'Database connection timeout',
    retryCount: 3,
    lastAttempt: new Date().toISOString()
  });
}

// =============================================================================
// 示例 5: 多输出手段配置
// =============================================================================

async function example5_MultipleOutputs() {
  console.log('\n=== 示例 5: 多输出手段配置 ===');
  
  const multiOutputConfig: LoggerConfig = {
    level: { default: 'debug' },
    server: {
      outputs: [
        { type: 'stdout' },                                   // 控制台实时查看
        { 
          type: 'file', 
          config: { dir: './logs', filename: 'all.log' }     // 完整日志文件
        },
        { 
          type: 'file',
          level: 'error',                                     // 只记录错误的文件
          config: { dir: './logs', filename: 'errors.log' }
        },
        {
          type: 'http',
          level: 'warn',                                      // 警告及以上发送到监控系统
          config: { 
            url: 'http://monitoring.example.com/logs',
            headers: { 'Authorization': 'Bearer token123' }
          }
        },
        {
          type: 'sls',                                        // 阿里云日志服务
          level: 'info',                                      // 信息及以上发送到 SLS
          config: {
            endpoint: 'cn-beijing.log.aliyuncs.com',
            project: 'yai-log-test',
            logstore: 'app-log',
            accessKey: 'LTAI5tNpnJzbTm6PBdmAfzKp',
            accessKeySecret: 'pUOfZVW7Qk0L78Ku4Ber1ysr2bvXol',
            appName: 'loglayer-basic-multi'
          }
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' },                                  // 开发者工具
        { 
          type: 'localstorage',
          config: { 
            key: 'app-logs',
            maxEntries: 50,
            ttl: 24 * 60 * 60 * 1000  // 24小时
          }
        },
        {
          type: 'http',
          level: 'error',
          config: { endpoint: '/api/client-errors' }
        }
      ]
    }
  };

  const multiLogger = await createLogger('multi-output', multiOutputConfig);
  
  multiLogger.debug('调试信息');           // 只输出到 stdout 和 all.log
  multiLogger.info('普通信息');            // 输出到 stdout 和 all.log  
  multiLogger.warn('警告信息');            // 输出到 stdout、all.log 和 HTTP
  multiLogger.error('错误信息');           // 输出到所有地方
}

// =============================================================================
// 运行所有示例
// =============================================================================

async function runAllExamples() {
  try {
    await example1_UsingPresets();
    await example2_CustomConfig();
    await example3_EnhancedFeatures();
    await example4_ProductionConfig();
    await example5_MultipleOutputs();
    
    console.log('\n✅ 所有示例执行完成');
  } catch (error) {
    console.error('❌ 示例执行失败:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}