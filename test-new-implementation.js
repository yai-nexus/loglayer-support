/**
 * 测试新实现的快速验证脚本
 * 
 * 这个脚本用于验证重构后的代码是否正常工作
 * 注意：本测试使用显式的异步 Logger 创建，确保日志完整性
 */

const { createLogger, createDefaultConfig, createLoggerSync } = require('./dist');

async function testBasicFunctionality() {
  console.log('\n🧪 测试基础功能...');
  
  try {
    // 测试 1: 异步创建 Logger
    console.log('\n📝 测试 1: 异步创建 Logger');
    const config = createDefaultConfig();
    const logger = await createLogger('test-app', config);
    
    logger.info('异步 Logger 创建成功!', { test: 'async-creation' });
    logger.debug('这是调试信息');
    logger.warn('这是警告信息', { warning: true });
    logger.error('这是错误信息', { error: true });
    
    // 测试 2: 同步创建 Logger
    console.log('\n📝 测试 2: 同步创建 Logger');
    const syncLogger = createLoggerSync('sync-test');
    
    syncLogger.info('同步 Logger 创建成功!', { test: 'sync-creation' });
    
    // 测试 3: 上下文绑定
    console.log('\n📝 测试 3: 上下文绑定');
    const childLogger = logger.child({ module: 'test-module' });
    const requestLogger = logger.forRequest('req_123', 'trace_456');
    const userLogger = logger.forUser('user_789');
    
    childLogger.info('子 Logger 测试');
    requestLogger.info('请求 Logger 测试');
    userLogger.info('用户 Logger 测试');
    
    // 测试 4: 错误记录
    console.log('\n📝 测试 4: 错误记录');
    try {
      throw new Error('测试错误');
    } catch (error) {
      logger.logError(error, { context: 'test' }, '错误记录测试');
    }
    
    // 测试 5: 性能记录
    console.log('\n📝 测试 5: 性能记录');
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 50));
    const duration = Date.now() - startTime;
    
    logger.logPerformance('test-operation', duration, { success: true });
    
    console.log('\n✅ 基础功能测试完成');
    
  } catch (error) {
    console.error('\n❌ 基础功能测试失败:', error);
    throw error;
  }
}

async function testCustomConfig() {
  console.log('\n🧪 测试自定义配置...');
  
  try {
    const customConfig = {
      level: {
        default: 'info',
        loggers: {
          'test-module': 'debug',
          'quiet-module': 'error'
        }
      },
      server: {
        outputs: [
          { type: 'stdout' },
          { 
            type: 'file', 
            config: { 
              dir: './test-logs', 
              filename: 'test.log' 
            } 
          }
        ]
      },
      client: {
        outputs: [
          { type: 'console' }
        ]
      }
    };
    
    const testLogger = await createLogger('test-module', customConfig);
    const quietLogger = await createLogger('quiet-module', customConfig);
    
    console.log('\n📝 测试模块级别配置');
    testLogger.debug('测试模块的调试信息'); // 应该显示
    testLogger.info('测试模块的普通信息');
    
    quietLogger.debug('安静模块的调试信息'); // 不应该显示
    quietLogger.info('安静模块的普通信息'); // 不应该显示
    quietLogger.error('安静模块的错误信息'); // 应该显示
    
    console.log('\n✅ 自定义配置测试完成');
    
  } catch (error) {
    console.error('\n❌ 自定义配置测试失败:', error);
    throw error;
  }
}

async function testMultipleOutputs() {
  console.log('\n🧪 测试多输出手段...');
  
  try {
    const multiConfig = {
      level: { default: 'debug' },
      server: {
        outputs: [
          { type: 'stdout' },
          { 
            type: 'file',
            config: { dir: './test-logs', filename: 'all.log' }
          },
          { 
            type: 'file',
            level: 'error',
            config: { dir: './test-logs', filename: 'errors.log' }
          }
        ]
      },
      client: {
        outputs: [
          { type: 'console' }
        ]
      }
    };
    
    const multiLogger = await createLogger('multi-output', multiConfig);
    
    console.log('\n📝 测试多输出');
    multiLogger.debug('调试信息 - 应该只在 stdout 和 all.log');
    multiLogger.info('普通信息 - 应该在 stdout 和 all.log');
    multiLogger.warn('警告信息 - 应该在 stdout 和 all.log');
    multiLogger.error('错误信息 - 应该在所有输出');
    
    console.log('\n✅ 多输出测试完成');
    
  } catch (error) {
    console.error('\n❌ 多输出测试失败:', error);
    throw error;
  }
}

async function testPerformance() {
  console.log('\n🧪 测试性能...');
  
  try {
    const logger = await createLogger('perf-test', createDefaultConfig());
    
    const iterations = 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      logger.info(`性能测试 ${i}`, { iteration: i, timestamp: Date.now() });
    }
    
    const duration = Date.now() - startTime;
    const logsPerSecond = Math.round((iterations / duration) * 1000);
    
    console.log(`\n📊 性能测试结果:`);
    console.log(`   - 总日志数: ${iterations}`);
    console.log(`   - 总耗时: ${duration}ms`);
    console.log(`   - 每秒日志数: ${logsPerSecond}`);
    
    console.log('\n✅ 性能测试完成');
    
  } catch (error) {
    console.error('\n❌ 性能测试失败:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 开始新实现验证测试...\n');
  
  try {
    await testBasicFunctionality();
    await testCustomConfig();
    await testMultipleOutputs();
    await testPerformance();
    
    console.log('\n🎉 所有测试通过! 新实现工作正常。\n');
    
    // 清理测试文件
    const fs = require('fs');
    const path = require('path');
    
    try {
      const testLogsDir = './test-logs';
      if (fs.existsSync(testLogsDir)) {
        const files = fs.readdirSync(testLogsDir);
        for (const file of files) {
          fs.unlinkSync(path.join(testLogsDir, file));
        }
        fs.rmdirSync(testLogsDir);
        console.log('🧹 测试文件已清理');
      }
    } catch (cleanupError) {
      console.warn('⚠️  测试文件清理失败:', cleanupError.message);
    }
    
  } catch (error) {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBasicFunctionality,
  testCustomConfig,
  testMultipleOutputs,
  testPerformance,
  runAllTests
};