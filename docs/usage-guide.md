# 详细使用指南

本指南提供 `@yai-nexus/loglayer-support` 的完整使用教程，包含各种场景下的实际应用示例。

## 📖 基础使用

### 1. 基础日志记录

```typescript
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync();

// 不同级别的日志
logger.debug('调试信息');    // 开发环境详细信息
logger.info('一般信息');     // 正常业务流程
logger.warn('警告信息');     // 需要注意但不影响运行
logger.error('错误信息');    // 错误和异常
```

### 2. 结构化日志

```typescript
// ✅ 推荐：使用结构化数据
logger.info('用户登录', {
  userId: '12345',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString(),
  userAgent: 'Chrome/91.0'
});

// ✅ 错误日志最佳实践
try {
  await riskyOperation();
} catch (error) {
  logger.error('操作失败', {
    operation: 'riskyOperation',
    error: error.message,
    stack: error.stack,
    context: { userId: '12345' }
  });
}
```

### 3. 上下文绑定

```typescript
// 创建带上下文的子日志器
const requestLogger = logger.child({
  requestId: 'req-12345',
  userId: 'user-67890'
});

// 所有后续日志都会自动包含上下文
requestLogger.info('开始处理请求');
requestLogger.debug('查询数据库');
requestLogger.info('请求处理完成');

// 输出示例：
// {"level":"info","message":"开始处理请求","requestId":"req-12345","userId":"user-67890"}
```

## 🚀 Next.js 集成

### 1. API 路由完整示例

```typescript
// app/api/users/route.ts
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

const logger = createNextjsLoggerSync({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableFileLogging: true
});

export async function GET(request: Request) {
  // 为每个请求创建独立的日志上下文
  const requestLogger = logger.child({
    requestId: crypto.randomUUID(),
    method: 'GET',
    path: '/api/users'
  });

  requestLogger.info('API 请求开始');

  try {
    requestLogger.debug('开始查询用户数据');
    const users = await getUsersFromDatabase();
    
    requestLogger.info('查询成功', {
      userCount: users.length,
      duration: '150ms'
    });

    return Response.json(users);
    
  } catch (error) {
    requestLogger.error('查询失败', {
      error: error.message,
      stack: error.stack
    });

    return Response.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

### 2. 页面组件中的日志

```typescript
// app/page.tsx
'use client';

import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const logger = createNextjsLoggerSync();
    
    logger.info('页面加载完成', {
      page: 'home',
      timestamp: new Date().toISOString()
    });
    
    // 性能监控
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      logger.info('页面卸载', {
        page: 'home',
        stayDuration: Math.round(loadTime)
      });
    };
  }, []);

  const handleButtonClick = () => {
    const logger = createNextjsLoggerSync();
    logger.info('用户交互', {
      action: 'button_click',
      component: 'HomePage'
    });
  };

  return (
    <div>
      <h1>首页</h1>
      <button onClick={handleButtonClick}>
        点击测试日志
      </button>
    </div>
  );
}
```

### 3. 中间件集成

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createNextjsLoggerSync } from '@yai-nexus/loglayer-support';

export function middleware(request: NextRequest) {
  const logger = createNextjsLoggerSync();
  
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  logger.info('请求开始', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  });

  const response = NextResponse.next();
  
  // 添加请求ID到响应头
  response.headers.set('x-request-id', requestId);
  
  // 记录响应信息
  logger.info('请求完成', {
    requestId,
    duration: Date.now() - startTime,
    status: response.status
  });

  return response;
}

export const config = {
  matcher: '/api/:path*'
};
```

## 🔧 高级配置

### 1. 环境配置

```typescript
// 根据环境自动调整配置
const logger = createNextjsLoggerSync({
  level: process.env.LOG_LEVEL || 'info',
  enableFileLogging: process.env.NODE_ENV === 'production',
  logDir: process.env.LOG_DIR || './logs'
});

// 支持的环境变量：
// LOG_LEVEL=debug|info|warn|error
// LOG_TO_FILE=true|false
// LOG_DIR=./custom-logs
```

### 2. 预设配置使用

```typescript
import { createLoggerWithPreset } from '@yai-nexus/loglayer-support';

// 开发环境：详细日志 + 控制台输出
const devLogger = await createLoggerWithPreset('development');

// 生产环境：文件日志 + 性能优化
const prodLogger = await createLoggerWithPreset('production');

// Next.js 兼容：确保在所有 Next.js 环境中工作
const nextLogger = await createLoggerWithPreset('nextjsCompatible');
```

### 3. 完全自定义配置

```typescript
import { createEnhancedLogger } from '@yai-nexus/loglayer-support';

const logger = await createEnhancedLogger({
  level: 'info',
  transports: ['pino', 'console'],
  enableFileLogging: true,
  logDir: './logs',
  pinoOptions: {
    formatters: {
      level: (label) => ({ level: label })
    }
  },
  redactionOptions: {
    paths: ['password', 'token', 'secret']
  }
});
```

## 🏗️ 实际应用场景

### 1. 电商应用示例

```typescript
// 订单处理服务
class OrderService {
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      service: 'OrderService'
    });
  }
  
  async processOrder(orderData: any) {
    const orderLogger = this.logger.child({
      orderId: orderData.id,
      userId: orderData.userId
    });
    
    orderLogger.info('开始处理订单', {
      items: orderData.items.length,
      total: orderData.total
    });
    
    try {
      // 验证订单
      await this.validateOrder(orderData, orderLogger);
      
      // 处理支付
      const payment = await this.processPayment(orderData, orderLogger);
      
      // 更新库存
      await this.updateInventory(orderData.items, orderLogger);
      
      orderLogger.info('订单处理完成', {
        paymentId: payment.id,
        status: 'completed'
      });
      
      return { success: true, orderId: orderData.id };
    } catch (error) {
      orderLogger.error('订单处理失败', {
        error: error.message,
        step: error.step || 'unknown'
      });
      throw error;
    }
  }
  
  private async validateOrder(orderData: any, logger: Logger) {
    logger.debug('验证订单数据');
    // 验证逻辑
  }
  
  private async processPayment(orderData: any, logger: Logger) {
    logger.debug('处理支付', { amount: orderData.total });
    // 支付逻辑
    return { id: 'payment-123' };
  }
  
  private async updateInventory(items: any[], logger: Logger) {
    logger.debug('更新库存', { itemCount: items.length });
    // 库存更新逻辑
  }
}
```

### 2. 用户认证系统

```typescript
// 认证服务
class AuthService {
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      service: 'AuthService'
    });
  }
  
  async login(email: string, password: string, request: Request) {
    const sessionId = crypto.randomUUID();
    const authLogger = this.logger.child({
      sessionId,
      email: this.maskEmail(email),
      ip: this.getClientIP(request)
    });
    
    authLogger.info('登录尝试开始');
    
    try {
      // 查找用户
      authLogger.debug('查找用户');
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        authLogger.warn('用户不存在');
        throw new Error('用户名或密码错误');
      }
      
      // 验证密码
      authLogger.debug('验证密码');
      const isValid = await this.verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        authLogger.warn('密码错误');
        throw new Error('用户名或密码错误');
      }
      
      // 创建会话
      authLogger.debug('创建用户会话');
      const token = await this.createSession(user.id, sessionId);
      
      authLogger.info('登录成功', {
        userId: user.id,
        lastLogin: user.lastLogin
      });
      
      return { token, user: this.sanitizeUser(user) };
      
    } catch (error) {
      authLogger.error('登录失败', {
        error: error.message,
        reason: error.code || 'unknown'
      });
      throw error;
    }
  }
  
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
  
  private getClientIP(request: Request): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }
  
  private sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
```

### 3. 数据处理管道

```typescript
// 数据处理管道
class DataPipeline {
  private logger: Logger;
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      component: 'DataPipeline'
    });
  }
  
  async processDataBatch(batchId: string, data: any[]) {
    const batchLogger = this.logger.child({
      batchId,
      recordCount: data.length
    });
    
    const startTime = Date.now();
    batchLogger.info('开始处理数据批次');
    
    try {
      // 阶段1：数据验证
      const validationStart = Date.now();
      const validData = await this.validateData(data, batchLogger);
      batchLogger.debug('数据验证完成', {
        duration: Date.now() - validationStart,
        validRecords: validData.length,
        invalidRecords: data.length - validData.length
      });
      
      // 阶段2：数据转换
      const transformStart = Date.now();
      const transformedData = await this.transformData(validData, batchLogger);
      batchLogger.debug('数据转换完成', {
        duration: Date.now() - transformStart,
        transformedRecords: transformedData.length
      });
      
      // 阶段3：数据存储
      const saveStart = Date.now();
      await this.saveData(transformedData, batchLogger);
      batchLogger.debug('数据存储完成', {
        duration: Date.now() - saveStart
      });
      
      const totalDuration = Date.now() - startTime;
      batchLogger.info('数据批次处理完成', {
        totalDuration,
        throughput: Math.round(data.length / (totalDuration / 1000)),
        successRate: (transformedData.length / data.length * 100).toFixed(2) + '%'
      });
      
      return {
        processed: transformedData.length,
        failed: data.length - transformedData.length,
        duration: totalDuration
      };
      
    } catch (error) {
      batchLogger.error('数据批次处理失败', {
        error: error.message,
        duration: Date.now() - startTime,
        stage: error.stage || 'unknown'
      });
      throw error;
    }
  }
  
  private async validateData(data: any[], logger: Logger) {
    logger.debug('开始数据验证');
    // 验证逻辑
    return data.filter(item => item.isValid);
  }
  
  private async transformData(data: any[], logger: Logger) {
    logger.debug('开始数据转换');
    // 转换逻辑
    return data.map(item => ({ ...item, transformed: true }));
  }
  
  private async saveData(data: any[], logger: Logger) {
    logger.debug('开始数据存储');
    // 存储逻辑
  }
}
```

## 🔍 监控和分析

### 1. 应用健康监控

```typescript
class HealthMonitor {
  private logger: Logger;
  private metrics = {
    requests: 0,
    errors: 0,
    responseTime: [] as number[]
  };
  
  constructor() {
    this.logger = createNextjsLoggerSync().child({
      component: 'HealthMonitor'
    });
    
    // 每分钟报告健康状态
    setInterval(() => this.reportHealth(), 60000);
  }
  
  recordRequest(duration: number, success: boolean) {
    this.metrics.requests++;
    this.metrics.responseTime.push(duration);
    
    if (!success) {
      this.metrics.errors++;
    }
    
    // 保持最近1000个响应时间记录
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }
  
  private reportHealth() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;
    
    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2)
      : '0.00';
    
    this.logger.info('应用健康报告', {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: errorRate + '%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      timestamp: new Date().toISOString()
    });
    
    // 重置计数器
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: []
    };
  }
}
```

---

**返回**: [主文档](../README.md) | **相关**: [API 参考](./api-reference.md) | [最佳实践](./best-practices.md)
