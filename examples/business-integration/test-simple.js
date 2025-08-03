/**
 * 简单的功能测试
 */

const { createAutoLogger } = require('../../packages/server/dist');

// 测试配置
const testConfig = {
  app: {
    name: 'test-app',
    environment: 'development',
    version: '1.0.0'
  },
  outputs: {
    console: { enabled: true, format: 'pretty' },
    file: { enabled: false }, // 禁用文件输出避免权限问题
    sls: { enabled: false }
  },
  features: {
    debug: { enabled: true, verbose: true }
  },
  level: 'debug'
};

console.log('🧪 开始日志器功能测试\n');

try {
  // 创建日志器
  const logger = createAutoLogger(testConfig);
  console.log('🚀 日志器创建: ✅ 成功');
  
  // 基础日志测试
  logger.debug('调试日志测试', { testType: 'debug' });
  logger.info('信息日志测试', { testType: 'info', userId: 12345 });
  logger.warn('警告日志测试', { testType: 'warn', responseTime: 2000 });
  logger.error('错误日志测试', { testType: 'error', error: 'Test error' });
  
  // 追踪ID 测试
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  logger.info('追踪测试', { traceId, action: 'user_login' });
  
  console.log('📝 基础功能测试: ✅ 完成');
  
  // 检查状态
  setTimeout(() => {
    if (logger.isReady()) {
      console.log('\n📋 日志器状态: ✅ 就绪');
      console.log('🎉 所有测试完成！');
    }
  }, 100);
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error(error.stack);
}
