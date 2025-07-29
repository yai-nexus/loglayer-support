/**
 * OpenTelemetry 集成演示脚本
 * 展示如何将 OpenTelemetry 生成的 TraceId 自动上报到 SLS
 */

console.log('=== OpenTelemetry SLS 集成演示 ===\n');

// 模拟 OpenTelemetry API
class MockOpenTelemetryAPI {
  constructor() {
    this.currentSpan = null;
    this.currentContext = null;
  }

  // 模拟创建 Span
  createSpan(name, traceId, spanId) {
    const span = {
      name,
      spanContext: () => ({
        traceId: traceId || this.generateTraceId(),
        spanId: spanId || this.generateSpanId(),
        traceFlags: 1,
        isValid: () => true
      }),
      getSpanContext: function() {
        return this.spanContext();
      }
    };

    this.currentSpan = span;
    return span;
  }

  // 模拟获取活跃 Span
  getActiveSpan() {
    return this.currentSpan;
  }

  // 模拟获取活跃上下文
  getActiveContext() {
    return this.currentContext || {};
  }

  // 生成 TraceId (32位十六进制)
  generateTraceId() {
    return Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // 生成 SpanId (16位十六进制)
  generateSpanId() {
    return Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // 清除当前 Span
  clearSpan() {
    this.currentSpan = null;
  }
}

// 模拟 OpenTelemetry 集成
class MockOpenTelemetryIntegration {
  constructor(otelAPI) {
    this.otelAPI = otelAPI;
  }

  async getCurrentTraceId() {
    const activeSpan = this.otelAPI.getActiveSpan();
    if (!activeSpan) {
      return null;
    }

    try {
      const spanContext = activeSpan.spanContext();
      if (spanContext && spanContext.isValid()) {
        return spanContext.traceId;
      }
    } catch (error) {
      console.log('获取 TraceId 失败:', error.message);
    }

    return null;
  }

  async getCurrentSpanId() {
    const activeSpan = this.otelAPI.getActiveSpan();
    if (!activeSpan) {
      return null;
    }

    try {
      const spanContext = activeSpan.spanContext();
      if (spanContext && spanContext.isValid()) {
        return spanContext.spanId;
      }
    } catch (error) {
      console.log('获取 SpanId 失败:', error.message);
    }

    return null;
  }

  async getCurrentTraceInfo() {
    const activeSpan = this.otelAPI.getActiveSpan();
    if (!activeSpan) {
      return null;
    }

    try {
      const spanContext = activeSpan.spanContext();
      if (spanContext && spanContext.isValid()) {
        return {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags
        };
      }
    } catch (error) {
      console.log('获取 Trace 信息失败:', error.message);
    }

    return null;
  }

  isValidOTelTraceId(traceId) {
    const traceIdRegex = /^[0-9a-f]{32}$/i;
    return traceIdRegex.test(traceId) && traceId !== '00000000000000000000000000000000';
  }

  isValidOTelSpanId(spanId) {
    const spanIdRegex = /^[0-9a-f]{16}$/i;
    return spanIdRegex.test(spanId) && spanId !== '0000000000000000';
  }
}

// 模拟 SLS Transport 集成
class MockSlsTransportWithOTel {
  constructor(otelIntegration) {
    this.otelIntegration = otelIntegration;
    this.sentLogs = [];
  }

  async getTraceIdForLog(context) {
    // 1. 优先使用上下文中的 TraceId
    if (context && context.traceId) {
      return context.traceId;
    }

    // 2. 尝试从 OpenTelemetry 获取
    const otelTraceId = await this.otelIntegration.getCurrentTraceId();
    if (otelTraceId && this.otelIntegration.isValidOTelTraceId(otelTraceId)) {
      return otelTraceId;
    }

    // 3. 生成新的 TraceId
    return this.generateFallbackTraceId();
  }

  async getSpanIdForLog(context) {
    // 1. 优先使用上下文中的 SpanId
    if (context && context.spanId) {
      return context.spanId;
    }

    // 2. 尝试从 OpenTelemetry 获取
    const otelSpanId = await this.otelIntegration.getCurrentSpanId();
    if (otelSpanId && this.otelIntegration.isValidOTelSpanId(otelSpanId)) {
      return otelSpanId;
    }

    // 3. 生成新的 SpanId
    return this.generateFallbackSpanId();
  }

  generateFallbackTraceId() {
    return Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  generateFallbackSpanId() {
    return Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async logMessage(level, message, context = {}) {
    const traceId = await this.getTraceIdForLog(context);
    const spanId = await this.getSpanIdForLog(context);

    const logEntry = {
      level,
      message,
      time: new Date(),
      traceId,
      spanId,
      context,
      fields: {
        level,
        message,
        datetime: new Date().toISOString(),
        app_name: 'demo-app',
        hostname: 'demo-host',
        environment: 'test',
        version: '1.0.0',
        host_ip: '172.16.0.6',
        category: context.module || 'application',
        pid: String(process.pid),
        traceId,
        spanId
      }
    };

    this.sentLogs.push(logEntry);

    console.log(`📤 [${level.toUpperCase()}] ${message}`);
    console.log(`   🔗 TraceId: ${traceId}`);
    console.log(`   📍 SpanId: ${spanId}`);
    console.log(`   📊 来源: ${traceId === (await this.otelIntegration.getCurrentTraceId()) ? 'OpenTelemetry' : '自生成'}`);
    console.log('');

    return logEntry;
  }

  getSentLogs() {
    return this.sentLogs;
  }
}

// 演示函数
async function demonstrateOTelIntegration() {
  console.log('1. 初始化 OpenTelemetry 和 SLS Transport...\n');

  // 创建 OpenTelemetry API 实例
  const otelAPI = new MockOpenTelemetryAPI();
  const otelIntegration = new MockOpenTelemetryIntegration(otelAPI);
  const slsTransport = new MockSlsTransportWithOTel(otelIntegration);

  console.log('2. 场景1: 没有活跃 Span 的情况\n');
  
  await slsTransport.logMessage('info', '应用启动', { 
    module: 'app',
    action: 'startup' 
  });

  console.log('3. 场景2: 有活跃 Span 的情况\n');

  // 创建一个 Span (模拟 HTTP 请求)
  const httpSpan = otelAPI.createSpan('HTTP GET /api/users');
  console.log(`🎯 创建 HTTP Span: ${httpSpan.spanContext().traceId}`);
  console.log('');

  await slsTransport.logMessage('info', 'HTTP请求开始', {
    module: 'api',
    method: 'GET',
    path: '/api/users',
    requestId: 'req_123'
  });

  await slsTransport.logMessage('debug', '权限验证', {
    module: 'auth',
    userId: 'user_456',
    requestId: 'req_123'
  });

  // 创建子 Span (模拟数据库查询)
  const dbSpan = otelAPI.createSpan('DB Query', httpSpan.spanContext().traceId);
  console.log(`🎯 创建 DB Span: ${dbSpan.spanContext().traceId} -> ${dbSpan.spanContext().spanId}`);
  console.log('');

  await slsTransport.logMessage('info', '数据库查询', {
    module: 'database',
    query: 'SELECT * FROM users',
    duration: 45,
    requestId: 'req_123'
  });

  await slsTransport.logMessage('info', 'HTTP请求完成', {
    module: 'api',
    status: 200,
    duration: 120,
    requestId: 'req_123'
  });

  console.log('4. 场景3: 手动指定 TraceId 的情况\n');

  await slsTransport.logMessage('info', '手动TraceId日志', {
    traceId: 'manual-trace-id-123456789abcdef0',
    spanId: 'manual-span-id-12',
    module: 'manual',
    operation: 'custom-operation'
  });

  console.log('5. 场景4: 清除 Span 后的情况\n');

  otelAPI.clearSpan();
  
  await slsTransport.logMessage('info', '清除Span后的日志', {
    module: 'cleanup',
    action: 'post-request'
  });

  console.log('6. 测试结果分析\n');

  const sentLogs = slsTransport.getSentLogs();
  
  console.log(`📊 总日志数量: ${sentLogs.length}`);
  
  // 分析 TraceId 来源
  let otelTraceCount = 0;
  let manualTraceCount = 0;
  let generatedTraceCount = 0;

  const traceIds = new Set();
  
  sentLogs.forEach((log, index) => {
    traceIds.add(log.traceId);
    
    if (log.context.traceId) {
      manualTraceCount++;
    } else if (log.traceId.length === 32 && /^[0-9a-f]+$/i.test(log.traceId)) {
      if (log.traceId === httpSpan.spanContext().traceId || log.traceId === dbSpan.spanContext().traceId) {
        otelTraceCount++;
      } else {
        generatedTraceCount++;
      }
    }
  });

  console.log(`🔗 TraceId 来源分析:`);
  console.log(`   OpenTelemetry: ${otelTraceCount} 条`);
  console.log(`   手动指定: ${manualTraceCount} 条`);
  console.log(`   自动生成: ${generatedTraceCount} 条`);
  console.log(`   唯一TraceId数量: ${traceIds.size}`);

  // 验证链路追踪
  console.log(`\n🔍 链路追踪验证:`);
  const httpTraceId = httpSpan.spanContext().traceId;
  const httpTraceLogs = sentLogs.filter(log => log.traceId === httpTraceId);
  
  console.log(`   HTTP请求链路 (${httpTraceId}):`);
  httpTraceLogs.forEach(log => {
    console.log(`      [${log.level}] ${log.message} (${log.context.module || 'unknown'})`);
  });

  console.log('\n✅ OpenTelemetry 集成演示完成!');
  console.log('\n📋 集成效果:');
  console.log('   • 自动获取 OpenTelemetry 生成的 TraceId');
  console.log('   • 支持手动指定 TraceId 覆盖');
  console.log('   • 完整的链路追踪支持');
  console.log('   • 兼容现有的日志系统');
  console.log('   • 无缝集成到 SLS 上报');
}

// 运行演示
demonstrateOTelIntegration().catch(console.error);
