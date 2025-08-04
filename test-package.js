/**
 * 测试 @yai-loglayer/next 包是否正常工作
 */

console.log('🧪 测试 @yai-loglayer/next 包...');

try {
  // 测试客户端导入
  console.log('📦 测试客户端导入...');
  const clientPath = './packages/next/dist/client.js';
  const clientModule = require(clientPath);
  console.log('✅ 客户端模块导入成功');
  console.log('📋 客户端导出:', Object.keys(clientModule));

  // 测试服务端导入
  console.log('📦 测试服务端导入...');
  const serverPath = './packages/next/dist/server.js';
  const serverModule = require(serverPath);
  console.log('✅ 服务端模块导入成功');
  console.log('📋 服务端导出:', Object.keys(serverModule));

  // 测试快速启动
  if (clientModule.clientQuickStart) {
    console.log('🚀 测试客户端快速启动...');
    const logger = clientModule.clientQuickStart.dev('test-app');
    console.log('✅ 客户端日志器创建成功');
    
    // 测试基本日志功能
    logger.info('测试信息日志');
    logger.debug('测试调试日志');
    logger.warn('测试警告日志');
    logger.error('测试错误日志');
    console.log('✅ 客户端日志功能正常');
  }

  if (serverModule.serverQuickStart) {
    console.log('🚀 测试服务端快速启动...');
    serverModule.serverQuickStart.prod('test-app').then(logger => {
      console.log('✅ 服务端日志器创建成功');
      
      // 测试基本日志功能
      logger.info('测试信息日志');
      logger.debug('测试调试日志');
      logger.warn('测试警告日志');
      logger.error('测试错误日志');
      console.log('✅ 服务端日志功能正常');
      
      console.log('🎉 所有测试通过！包工作正常！');
    }).catch(error => {
      console.error('❌ 服务端测试失败:', error.message);
    });
  } else {
    console.log('🎉 客户端测试通过！');
  }

} catch (error) {
  console.error('❌ 包测试失败:', error.message);
  console.error('📍 错误详情:', error.stack);
}
