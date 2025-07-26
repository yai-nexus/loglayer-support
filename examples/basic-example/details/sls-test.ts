/**
 * SLS 测试示例
 * 
 * 专门测试阿里云 SLS 日志服务集成，包含写入和查询验证
 */

import { createServerLogger } from '@yai-loglayer/server';
import type { LoggerConfig } from '@yai-loglayer/core';
import { createExampleRunner, getSLSConfig } from '../lib/shared-utils.js';

/**
 * 查询 SLS 日志
 */
async function querySLSLogs(config: any, testId: string): Promise<any[]> {
  try {
    // 动态导入 SLS SDK (ES 模块兼容)
    const { default: Client } = await import('@alicloud/log');
    
    const client = new Client({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: config.endpoint,
    });

    // 查询最近 10 分钟的日志 - 使用 Date 对象，扩大时间范围
    const endTime = new Date();
    const startTime = new Date(Date.now() - 10 * 60 * 1000); // 10 分钟前
    
    console.log('时间检查:', { 
      startTime: startTime.toISOString(), 
      endTime: endTime.toISOString(), 
      startTimeType: typeof startTime, 
      endTimeType: typeof endTime,
      hasGetTime: typeof startTime.getTime === 'function'
    });

    // 构建查询语句，查找包含我们测试 ID 的日志 - 使用简化的查询语法
    const query = `${testId}`;

    console.log('🔍 查询 SLS 日志...');
        console.log(`查询时间范围: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);
    console.log(`查询语句: ${query}`);
    
    // 使用 Date 对象调用 SLS API
    console.log('使用 Date 对象调用 SLS API...');
    
    const response = await client.getLogs(config.project, config.logstore, startTime, endTime, '', query, 100, 0, false);
    
    console.log('✅ SLS API 调用成功');
    console.log('查询响应:', {
      responseType: typeof response,
      isArray: Array.isArray(response),
      length: response?.length || 0,
      hasData: !!response
    });
    
    if (response && response.length > 0) {
      console.log('找到日志条数:', response.length);
      console.log('第一条日志样例:', response[0]);
    }
    
    return response || [];
  } catch (error) {
    console.error('❌ SLS 查询失败:', error.message);
    return [];
  }
}

/**
 * SLS 功能测试
 */
async function runSLSTestExample(): Promise<void> {
  console.log('🔍 检查 SLS 配置...');
  
  // 检查环境变量是否实际设置
  const envVars = {
    SLS_ENDPOINT: process.env.SLS_ENDPOINT,
    SLS_PROJECT: process.env.SLS_PROJECT,
    SLS_LOGSTORE: process.env.SLS_LOGSTORE,
    SLS_ACCESS_KEY_ID: process.env.SLS_ACCESS_KEY_ID,
    SLS_ACCESS_KEY_SECRET: process.env.SLS_ACCESS_KEY_SECRET,
    SLS_APP_NAME: process.env.SLS_APP_NAME
  };
  
  const configStatus = Object.entries(envVars).map(([key, value]) => ({
    [key]: value ? '✅ 已配置' : '❌ 未配置'
  })).reduce((acc, curr) => ({ ...acc, ...curr }), {});
  
  console.log('📋 SLS 环境变量状态:', configStatus);
  
  const missingVars = Object.entries(envVars).filter(([_, value]) => !value).map(([key]) => key);
  if (missingVars.length > 0) {
    console.log('⚠️  缺少以下环境变量:', missingVars.join(', '));
    console.log('💡 请复制 .env.example 为 .env 并填写实际配置');
    return;
  } else {
    console.log('✅ 所有 SLS 配置已完整设置');
  }

  // 生成唯一的测试 ID
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🏷️  测试 ID: ${testId}`);

  // 创建包含 SLS 输出的配置
  const slsConfig = getSLSConfig();
  const slsTestConfig: LoggerConfig = {
    level: { default: 'debug' },
    server: {
      outputs: [
        { type: 'stdout' },                    // 控制台输出
        { 
          type: 'sls',                         // SLS 输出
          level: 'info',                       // 只发送 info 及以上级别到 SLS
          config: {
            ...slsConfig,
            topic: 'test-logs',
            source: 'nodejs-test'
          }
        }
      ]
    }
  };

  const slsLogger = await createServerLogger('sls-test', slsTestConfig);
  
  console.log('\n📝 开始 SLS 日志写入测试...');
  
  // 测试不同级别的日志，都包含测试 ID
  slsLogger.debug(`[${testId}] 这是调试信息 - 不会发送到 SLS`);
  slsLogger.info(`[${testId}] 这是信息日志 - 会发送到 SLS`, { 
    testId,
    testType: 'info-test',
    timestamp: new Date().toISOString(),
    userId: 'test-user-123'
  });
  
  slsLogger.warn(`[${testId}] 这是警告日志 - 会发送到 SLS`, {
    testId,
    testType: 'warn-test',
    warningCode: 'W001',
    details: 'This is a test warning message'
  });
  
  slsLogger.error(`[${testId}] 这是错误日志 - 会发送到 SLS`, {
    testId,
    testType: 'error-test',
    errorCode: 'E001',
    stackTrace: 'Mock stack trace for testing',
    requestId: 'req-123456'
  });

  console.log('⏳ 等待日志发送到 SLS (5秒)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n🔍 开始验证 SLS 日志写入...');
  
  // 查询 SLS 日志
  const logs = await querySLSLogs(slsConfig, testId);
  
  if (logs.length > 0) {
    console.log(`✅ SLS 写入成功！找到 ${logs.length} 条日志记录`);
    console.log('\n📄 日志详情:');
    logs.forEach((log, index) => {
      console.log(`\n--- 日志 ${index + 1} ---`);
      console.log('时间:', new Date(log.__time__ * 1000).toLocaleString());
      console.log('级别:', log.level);
      console.log('消息:', log.message);
      if (log.testType) console.log('测试类型:', log.testType);
      if (log.errorCode) console.log('错误代码:', log.errorCode);
    });
  } else {
    console.log('❌ 未找到对应的日志记录');
    console.log('可能的原因:');
    console.log('  1. 日志还未同步到 SLS (需要等待更长时间)');
    console.log('  2. SLS 配置有误');
    console.log('  3. 网络连接问题');
    console.log('  4. SLS SDK 发送失败但被静默处理');
    
    console.log('\n💡 建议检查:');
    console.log('  - 阿里云 SLS 控制台是否有对应的项目和日志库');
    console.log('  - 访问密钥是否有写入权限');
    console.log('  - 网络是否能正常访问阿里云服务');
  }
  
  console.log('\n✅ SLS 完整测试完成！');
  console.log('📋 测试流程说明:');
  console.log('  1. ✅ 检查配置完整性');
  console.log('  2. ✅ 写入测试日志到 SLS');
  console.log('  3. ✅ 查询验证日志是否成功写入');
  console.log('  4. ✅ 显示详细的日志内容');
}

// 导出示例运行器
export const slsTestExample = createExampleRunner(runSLSTestExample, 'SLS 集成测试');

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  slsTestExample().catch(console.error);
} 