/**
 * PackID 机制演示示例
 * 
 * 展示如何使用PackID机制进行日志上下文关联
 */

import { SlsTransport, generatePackId, getGlobalPackIdGenerator } from '../src';
import type { SlsTransportConfig } from '../src';

// 模拟配置（实际使用时请设置真实的SLS配置）
const mockConfig: SlsTransportConfig = {
  endpoint: 'https://cn-hangzhou.log.aliyuncs.com',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  project: 'test-project',
  logstore: 'test-logstore',
  topic: 'packid-demo',
  source: 'nodejs-demo',
  fields: {
    enablePackId: true,
    includeEnvironment: true,
    includeVersion: true,
    includeHostIP: true,
    includeCategory: true,
    includeLogger: true,
    customFields: {
      service: 'demo-service',
      region: 'cn-hangzhou'
    }
  }
};

async function demonstratePackIdMechanism() {
  console.log('=== PackID 机制演示 ===\n');

  // 1. 展示PackID生成
  console.log('1. PackID 生成演示:');
  const generator = getGlobalPackIdGenerator();
  console.log(`   上下文前缀: ${generator.getContextPrefix()}`);
  
  for (let i = 0; i < 5; i++) {
    const packId = generatePackId();
    console.log(`   PackID ${i + 1}: ${packId}`);
  }
  console.log();

  // 2. 创建SLS Transport（注意：这里不会真正发送，因为配置是模拟的）
  console.log('2. SLS Transport 配置:');
  try {
    const transport = new SlsTransport(mockConfig);
    console.log('   ✅ SLS Transport 创建成功');
    console.log('   📋 配置信息:');
    console.log(`      - PackID启用: ${mockConfig.fields?.enablePackId}`);
    console.log(`      - 包含环境: ${mockConfig.fields?.includeEnvironment}`);
    console.log(`      - 包含版本: ${mockConfig.fields?.includeVersion}`);
    console.log(`      - 包含主机IP: ${mockConfig.fields?.includeHostIP}`);
    console.log(`      - 包含分类: ${mockConfig.fields?.includeCategory}`);
    console.log(`      - 自定义字段: ${JSON.stringify(mockConfig.fields?.customFields)}`);
    
    // 模拟日志发送（实际不会发送到SLS）
    console.log('\n3. 模拟日志发送:');
    console.log('   注意: 由于使用模拟配置，日志不会真正发送到SLS');
    
    // 模拟一个HTTP请求的日志序列
    console.log('\n   模拟HTTP请求处理流程:');
    const requestId = 'req_' + Date.now();
    
    // 这些日志将共享同一个PackID（同一批次发送）
    transport.shipToLogger({
      logLevel: 'info',
      messages: ['HTTP请求开始'],
      data: { requestId, method: 'POST', path: '/api/users' }
    });
    
    transport.shipToLogger({
      logLevel: 'debug',
      messages: ['验证用户权限'],
      data: { requestId, userId: 'user_123' }
    });
    
    transport.shipToLogger({
      logLevel: 'info',
      messages: ['数据库查询'],
      data: { requestId, query: 'SELECT * FROM users', duration: 45 }
    });
    
    transport.shipToLogger({
      logLevel: 'info',
      messages: ['HTTP请求完成'],
      data: { requestId, statusCode: 200, responseTime: 120 }
    });
    
    console.log('   ✅ 模拟日志已添加到缓冲区');
    console.log('   📝 这些日志将使用相同的PackID进行关联');
    
  } catch (error) {
    console.log('   ⚠️  SLS Transport 创建失败（预期行为，因为使用模拟配置）');
    console.log(`   错误: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n4. PackID 机制优势:');
  console.log('   🔗 同一上下文的日志自动关联');
  console.log('   🔍 在SLS控制台可直接查看上下文');
  console.log('   📊 支持完整的请求链路追踪');
  console.log('   🛠️ 便于问题排查和性能分析');

  console.log('\n5. 在SLS控制台的使用:');
  console.log('   1. 在日志列表中找到目标日志');
  console.log('   2. 点击日志行右侧的"上下文浏览"图标');
  console.log('   3. 系统自动显示相同PackID的所有相关日志');
  console.log('   4. 高亮显示当前日志，上下文日志按时间排序');

  console.log('\n=== 演示完成 ===');
}

// 运行演示
if (require.main === module) {
  demonstratePackIdMechanism().catch(console.error);
}

export { demonstratePackIdMechanism };
