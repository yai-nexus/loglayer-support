# 最佳实践指南

本指南提供使用 `@yai-nexus/loglayer-support` 的最佳实践，帮助您构建高质量、可维护的日志系统。

## 🎯 日志级别使用指南

### 正确使用各个级别

```typescript
// ✅ debug: 开发调试信息，生产环境不显示
logger.debug('SQL 查询执行', { 
  query: 'SELECT * FROM users WHERE id = ?', 
  params: [userId],
  executionTime: '15ms'
});

// ✅ info: 正常业务流程，重要的状态变化
logger.info('用户注册成功', { 
  userId: newUser.id, 
  email: newUser.email,
  registrationMethod: 'email'
});

// ✅ warn: 需要关注但不影响功能的情况
logger.warn('API 响应较慢', { 
  endpoint: '/api/data', 
  duration: 2500,
  threshold: 1000
});

// ✅ error: 错误和异常，需要立即处理
logger.error('支付处理失败', { 
  orderId: '12345', 
  error: error.message,
  paymentMethod: 'credit_card',
  amount: 99.99
});
```

### 级别选择原则

- **生产环境**: 使用 `info` 或 `warn` 级别
- **测试环境**: 使用 `debug` 级别
- **开发环境**: 使用 `debug` 级别
- **监控告警**: 主要关注 `error` 和 `warn` 级别

## 📊 结构化日志最佳实践

### ✅ 推荐的做法

```typescript
// 使用结构化数据而不是字符串拼接
logger.info('用户操作', {
  action: 'login',
  userId: '12345',
  ip: '192.168.1.1',
  userAgent: 'Chrome/91.0',
  timestamp: new Date().toISOString(),
  success: true
});

// 为错误提供完整上下文
try {
  await processPayment(order);
} catch (error) {
  logger.error('支付处理异常', {
    orderId: order.id,
    userId: order.userId,
    amount: order.total,
    paymentMethod: order.paymentMethod,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context: {
      retryCount: 0,
      processingTime: Date.now() - startTime
    }
  });
}
```

### ❌ 避免的做法

```typescript
// ❌ 字符串拼接，难以查询和分析
logger.info(`用户 ${userId} 在 ${new Date()} 执行了 ${action} 操作`);

// ❌ 记录敏感信息
logger.info('用户登录', { 
  password: user.password,  // 危险！
  creditCard: user.creditCard
});

// ❌ 过于简单的错误日志
logger.error('出错了');  // 没有上下文信息

// ❌ 在循环中大量日志
for (const item of items) {
  logger.debug('处理项目', { item });  // 可能产生大量日志
}
```

## 🔄 上下文管理

### 请求级别上下文

```typescript
// Next.js API 路由示例
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const requestLogger = logger.child({
    requestId,
    method: 'POST',
    path: '/api/orders',
    userAgent: request.headers.get('user-agent')
  });

  requestLogger.info('API 请求开始');
  
  try {
    const body = await request.json();
    requestLogger.debug('请求体解析完成', { bodySize: JSON.stringify(body).length });
    
    const result = await processOrder(body, requestLogger);
    
    requestLogger.info('请求处理完成', { 
      orderId: result.id,
      processingTime: Date.now() - startTime
    });
    
    return Response.json(result);
  } catch (error) {
    requestLogger.error('请求处理失败', { error: error.message });
    return Response.json({ error: '内部服务器错误' }, { status: 500 });
  }
}
```

### 业务流程上下文

```typescript
async function processOrder(orderData: any, parentLogger: Logger) {
  const orderLogger = parentLogger.child({
    operation: 'processOrder',
    orderId: orderData.id
  });

  orderLogger.info('开始处理订单');
  
  // 验证订单
  orderLogger.debug('验证订单数据');
  await validateOrder(orderData, orderLogger);
  
  // 处理支付
  orderLogger.debug('处理支付');
  const payment = await processPayment(orderData, orderLogger);
  
  // 更新库存
  orderLogger.debug('更新库存');
  await updateInventory(orderData.items, orderLogger);
  
  orderLogger.info('订单处理完成', {
    paymentId: payment.id,
    totalAmount: orderData.total
  });
  
  return { id: orderData.id, status: 'completed' };
}
```

## 📈 性能监控

### 执行时间追踪

```typescript
async function performanceTrackingExample() {
  const startTime = Date.now();
  const perfLogger = logger.child({ operation: 'dataProcessing' });
  
  perfLogger.info('开始数据处理', { recordCount: data.length });
  
  try {
    // 分阶段记录性能
    const step1Start = Date.now();
    const validatedData = await validateData(data);
    perfLogger.debug('数据验证完成', {
      duration: Date.now() - step1Start,
      validRecords: validatedData.length,
      invalidRecords: data.length - validatedData.length
    });
    
    const step2Start = Date.now();
    const processedData = await processData(validatedData);
    perfLogger.debug('数据处理完成', {
      duration: Date.now() - step2Start,
      processedRecords: processedData.length
    });
    
    const step3Start = Date.now();
    await saveData(processedData);
    perfLogger.debug('数据保存完成', {
      duration: Date.now() - step3Start
    });
    
    perfLogger.info('数据处理流程完成', {
      totalDuration: Date.now() - startTime,
      inputRecords: data.length,
      outputRecords: processedData.length,
      successRate: (processedData.length / data.length * 100).toFixed(2) + '%'
    });
    
    return processedData;
  } catch (error) {
    perfLogger.error('数据处理失败', {
      duration: Date.now() - startTime,
      error: error.message,
      failurePoint: 'unknown'
    });
    throw error;
  }
}
```

### 资源使用监控

```typescript
function logResourceUsage(operation: string) {
  const memUsage = process.memoryUsage();
  logger.info('资源使用情况', {
    operation,
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    uptime: Math.round(process.uptime()) + 's'
  });
}
```

## 🔒 安全和隐私

### 敏感信息处理

```typescript
// ✅ 正确的敏感信息处理
function sanitizeUserData(user: any) {
  return {
    id: user.id,
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
    phone: user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    // 完全移除敏感字段
    // password: user.password,  // 永远不要记录
    // creditCard: user.creditCard,  // 永远不要记录
  };
}

logger.info('用户登录', sanitizeUserData(user));

// 使用内置的数据脱敏功能
const logger = await createEnhancedLogger({
  redactionOptions: {
    paths: ['password', 'token', 'secret', 'creditCard', 'ssn']
  }
});
```

### API 密钥和令牌处理

```typescript
// ✅ 安全的 API 调用日志
async function callExternalAPI(apiKey: string, data: any) {
  const apiLogger = logger.child({
    operation: 'externalAPICall',
    endpoint: 'https://api.example.com/data'
  });
  
  apiLogger.info('调用外部 API', {
    dataSize: JSON.stringify(data).length,
    // 只记录 API 密钥的前几位和后几位
    apiKeyHint: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
  });
  
  try {
    const response = await fetch('https://api.example.com/data', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(data)
    });
    
    apiLogger.info('API 调用成功', {
      statusCode: response.status,
      responseSize: response.headers.get('content-length')
    });
    
    return await response.json();
  } catch (error) {
    apiLogger.error('API 调用失败', {
      error: error.message,
      // 不要记录完整的请求头或响应体
    });
    throw error;
  }
}
```

## 🏗️ 架构模式

### 分层日志架构

```typescript
// 应用层
class UserService {
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      service: 'UserService'
    });
  }
  
  async createUser(userData: any) {
    const operationLogger = this.logger.child({
      operation: 'createUser',
      userId: userData.id
    });
    
    operationLogger.info('开始创建用户');
    
    try {
      // 业务逻辑
      const user = await this.userRepository.create(userData, operationLogger);
      operationLogger.info('用户创建成功');
      return user;
    } catch (error) {
      operationLogger.error('用户创建失败', { error: error.message });
      throw error;
    }
  }
}

// 数据访问层
class UserRepository {
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      layer: 'repository',
      entity: 'User'
    });
  }
  
  async create(userData: any, parentLogger?: Logger) {
    const logger = parentLogger || this.logger;
    const dbLogger = logger.child({ operation: 'database.insert' });
    
    dbLogger.debug('执行数据库插入', {
      table: 'users',
      fields: Object.keys(userData)
    });
    
    // 数据库操作
    const result = await db.users.create(userData);
    
    dbLogger.info('数据库插入完成', {
      insertedId: result.id,
      affectedRows: 1
    });
    
    return result;
  }
}
```

## 📊 监控和告警

### 错误率监控

```typescript
class ErrorTracker {
  private errorCounts = new Map<string, number>();
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      component: 'ErrorTracker'
    });
    
    // 每分钟报告错误统计
    setInterval(() => this.reportErrorStats(), 60000);
  }
  
  trackError(error: Error, context: any) {
    const errorKey = `${error.name}:${context.operation}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    this.logger.error('错误发生', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      errorCount: currentCount + 1
    });
    
    // 错误率过高时发出警告
    if (currentCount + 1 > 10) {
      this.logger.warn('错误率过高', {
        errorType: errorKey,
        count: currentCount + 1,
        timeWindow: '1分钟'
      });
    }
  }
  
  private reportErrorStats() {
    if (this.errorCounts.size > 0) {
      this.logger.info('错误统计报告', {
        errors: Object.fromEntries(this.errorCounts),
        totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
      });
      
      // 重置计数器
      this.errorCounts.clear();
    }
  }
}
```

## 🧪 测试环境配置

### 测试友好的日志配置

```typescript
// 测试环境配置
function createTestLogger() {
  if (process.env.NODE_ENV === 'test') {
    // 测试环境下减少日志输出
    return createNextjsLoggerSync({
      level: 'error',  // 只显示错误
      enableConsole: false,  // 不输出到控制台
      enableFileLogging: false  // 不写入文件
    });
  }
  
  return createNextjsLoggerSync();
}

// 在测试中验证日志
describe('UserService', () => {
  let logSpy: jest.SpyInstance;
  
  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    logSpy.mockRestore();
  });
  
  it('should log user creation', async () => {
    const userService = new UserService();
    await userService.createUser({ name: 'Test User' });
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('用户创建成功')
    );
  });
});
```

---

**返回**: [主文档](../README.md) | **相关**: [API 参考](./api-reference.md) | **下一步**: [使用指南](./usage-guide.md)
