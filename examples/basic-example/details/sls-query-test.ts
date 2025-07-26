/**
 * SLS 查询测试
 * 
 * 简单测试 SLS 连接和查询功能
 */

import { getSLSConfig } from '../lib/shared-utils.js';

async function testSLSQuery(): Promise<void> {
  console.log('🔍 SLS 连接测试...');
  
  try {
    // 动态导入 SLS SDK
    const { default: Client } = await import('@alicloud/log');
    const config = getSLSConfig();
    
    console.log('配置信息:', {
      endpoint: config.endpoint,
      project: config.project,
      logstore: config.logstore,
      hasAccessKey: !!config.accessKeyId
    });
    
    const client = new Client({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: config.endpoint,
    });
    
    // 查询最近 1 小时的所有日志（不指定查询条件）
    const endTime = new Date();
    const startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 小时前
    
    console.log('查询时间范围:', {
      start: startTime.toISOString(),
      end: endTime.toISOString()
    });
    
    console.log('🔍 查询最近 1 小时的所有日志...');
    const response = await client.getLogs(config.project, config.logstore, startTime, endTime, '', '*', 10, 0, false);
    
    console.log('✅ 查询成功！');
    console.log('结果:', {
      type: typeof response,
      isArray: Array.isArray(response),
      length: response?.length || 0
    });
    
    if (response && response.length > 0) {
      console.log(`📄 找到 ${response.length} 条日志:`);
      response.forEach((log, index) => {
        console.log(`\n--- 日志 ${index + 1} ---`);
        console.log(JSON.stringify(log, null, 2));
      });
    } else {
      console.log('📭 日志库中暂无日志数据');
      console.log('可能原因:');
      console.log('  1. 日志库是新创建的，还没有数据');
      console.log('  2. 查询时间范围内没有日志');
      console.log('  3. 写入权限问题，日志未能成功写入');
    }
    
  } catch (error) {
    console.error('❌ SLS 连接失败:', error.message);
    console.log('请检查:');
    console.log('  1. 网络连接是否正常');
    console.log('  2. SLS 项目和日志库是否存在');
    console.log('  3. 访问密钥是否正确且有相应权限');
  }
}

// 运行测试
testSLSQuery().catch(console.error); 