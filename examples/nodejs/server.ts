/**
 * Node.js 服务器使用示例
 * 
 * 展示如何在 Node.js 服务器中使用新的日志系统
 */

import { createLogger, createProductionConfig, createDevelopmentConfig } from '../../src';
import { createPerformanceMeasurer, withAsyncErrorLogging } from '../../src/wrapper';
import type { LoggerConfig } from '../../src/types';

// =============================================================================
// 服务器专用配置
// =============================================================================

function createServerConfig(): LoggerConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      level: {
        default: 'info',
        loggers: {
          'database': 'warn',    // 生产环境减少数据库日志
          'debug': 'error'       // 禁用调试模块
        }
      },
      server: {
        outputs: [
          { type: 'stdout' },                               // 容器标准输出
          { 
            type: 'file',
            config: {
              dir: '/var/log/app',
              filename: 'server.log',
              maxSize: '100MB',
              maxFiles: 10
            }
          },
          {
            type: 'file',
            level: 'error',                                 // 错误专用文件
            config: {
              dir: '/var/log/app',
              filename: 'errors.log',
              maxSize: '50MB',
              maxFiles: 5
            }
          },
          {
            type: 'sls',                                    // 云端日志收集
            level: 'warn',
            config: {
              endpoint: process.env.SLS_ENDPOINT,
              project: process.env.SLS_PROJECT,
              logstore: 'server-logs',
              accessKey: process.env.SLS_ACCESS_KEY
            }
          }
        ]
      },
      client: {
        outputs: [] // 服务器不需要客户端输出
      }
    };
  } else {
    return {
      level: {
        default: 'debug',
        loggers: {
          'database': 'debug',
          'auth': 'debug'
        }
      },
      server: {
        outputs: [
          { type: 'stdout' },                               // 开发环境控制台
          { 
            type: 'file',
            config: {
              dir: './logs',
              filename: 'development.log'
            }
          }
        ]
      },
      client: {
        outputs: []
      }
    };
  }
}

// =============================================================================
// 创建应用 Logger
// =============================================================================

async function initializeLogger() {
  const config = createServerConfig();
  return await createLogger('server-app', config);
}

// =============================================================================
// 模拟服务器功能
// =============================================================================

class DatabaseService {
  private logger: any;
  
  constructor(logger: any) {
    this.logger = logger.forModule('database');
  }
  
  async connect() {
    this.logger.info('正在连接数据库...');
    
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.info('数据库连接成功', {
      host: 'localhost',
      port: 5432,
      database: 'app_db'
    });
  }
  
  async findUser(userId: string) {
    const dbLogger = this.logger.forRequest(`db_${Date.now()}`);
    const measurer = createPerformanceMeasurer(dbLogger, 'user-query');
    
    dbLogger.debug('查询用户', { userId });
    
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const user = { id: userId, name: 'John Doe', email: 'john@example.com' };
    
    measurer.finish({ userId, found: true });
    dbLogger.info('用户查询完成', { userId, userFound: true });
    
    return user;
  }
  
  async createUser(userData: any) {
    const dbLogger = this.logger.forRequest(`create_${Date.now()}`);
    
    dbLogger.info('创建新用户', { email: userData.email });
    
    try {
      // 模拟数据库写入
      await new Promise(resolve => setTimeout(resolve, 80));
      
      if (userData.email === 'invalid@test.com') {
        throw new Error('Email already exists');
      }
      
      const newUser = { id: `user_${Date.now()}`, ...userData };
      
      dbLogger.info('用户创建成功', { 
        userId: newUser.id,
        email: newUser.email 
      });
      
      return newUser;
    } catch (error) {
      dbLogger.logError(error as Error, userData, '用户创建失败');
      throw error;
    }
  }
}

class AuthService {
  private logger: any;
  
  constructor(logger: any) {
    this.logger = logger.forModule('auth');
  }
  
  async login(email: string, password: string) {
    const authLogger = this.logger.forRequest(`auth_${Date.now()}`);
    const measurer = createPerformanceMeasurer(authLogger, 'user-login');
    
    authLogger.info('用户登录尝试', { email });
    
    try {
      // 模拟认证逻辑
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (password === 'wrong') {
        authLogger.warn('登录失败：密码错误', { 
          email, 
          attempts: 1,
          ip: '192.168.1.100' 
        });
        throw new Error('Invalid password');
      }
      
      const token = `token_${Date.now()}`;
      
      measurer.finish({ email, success: true });
      authLogger.info('用户登录成功', { 
        email, 
        tokenGenerated: true 
      });
      
      return { token, email };
    } catch (error) {
      measurer.finish({ email, success: false });
      authLogger.logError(error as Error, { email }, '登录失败');
      throw error;
    }
  }
  
  async logout(token: string) {
    const authLogger = this.logger.forUser('user_from_token');
    
    authLogger.info('用户登出', { tokenRevoked: true });
    
    // 模拟token撤销
    await new Promise(resolve => setTimeout(resolve, 50));
    
    authLogger.info('登出完成');
  }
}

class ApiService {
  private logger: any;
  private dbService: DatabaseService;
  private authService: AuthService;
  
  constructor(logger: any) {
    this.logger = logger.forModule('api');
    this.dbService = new DatabaseService(logger);
    this.authService = new AuthService(logger);
  }
  
  async handleRequest(method: string, path: string, data?: any) {
    const requestId = `req_${Date.now()}`;
    const apiLogger = this.logger.forRequest(requestId);
    const measurer = createPerformanceMeasurer(apiLogger, `api-${method}-${path}`);
    
    apiLogger.info(`API请求开始: ${method} ${path}`, {
      method,
      path,
      hasData: !!data,
      userAgent: 'Node.js Server',
      ip: '127.0.0.1'
    });
    
    try {
      let result;
      
      switch (`${method} ${path}`) {
        case 'GET /users/:id':
          result = await this.dbService.findUser(data.userId);
          break;
          
        case 'POST /users':
          result = await this.dbService.createUser(data);
          break;
          
        case 'POST /auth/login':
          result = await this.authService.login(data.email, data.password);
          break;
          
        case 'POST /auth/logout':
          result = await this.authService.logout(data.token);
          break;
          
        default:
          throw new Error(`Unknown endpoint: ${method} ${path}`);
      }
      
      const duration = measurer.finish({ 
        statusCode: 200,
        responseSize: JSON.stringify(result).length 
      });
      
      apiLogger.info(`API请求成功: ${method} ${path}`, {
        statusCode: 200,
        duration,
        responseSize: JSON.stringify(result).length
      });
      
      return { statusCode: 200, data: result };
      
    } catch (error) {
      const duration = measurer.finish({ 
        statusCode: 500,
        error: (error as Error).message 
      });
      
      apiLogger.logError(error as Error, {
        method,
        path,
        data,
        duration
      }, `API请求失败: ${method} ${path}`);
      
      return { 
        statusCode: 500, 
        error: { 
          message: (error as Error).message,
          requestId 
        } 
      };
    }
  }
}

// =============================================================================
// 服务器应用类
// =============================================================================

class ServerApp {
  private logger: any;
  private dbService: DatabaseService;
  private apiService: ApiService;
  
  constructor(logger: any) {
    this.logger = logger;
    this.dbService = new DatabaseService(logger);
    this.apiService = new ApiService(logger);
  }
  
  async start() {
    this.logger.info('服务器启动中...', {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      pid: process.pid
    });
    
    // 初始化数据库连接
    await this.dbService.connect();
    
    // 模拟一些API请求
    await this.simulateTraffic();
    
    this.logger.info('服务器启动完成', {
      port: 3000,
      uptime: Date.now()
    });
  }
  
  private async simulateTraffic() {
    this.logger.info('模拟API流量...');
    
    // 模拟各种API请求
    const requests = [
      { method: 'GET', path: '/users/:id', data: { userId: 'user_123' } },
      { method: 'POST', path: '/users', data: { email: 'new@user.com', name: 'New User' } },
      { method: 'POST', path: '/auth/login', data: { email: 'user@test.com', password: 'correct' } },
      { method: 'POST', path: '/auth/login', data: { email: 'user@test.com', password: 'wrong' } },
      { method: 'POST', path: '/users', data: { email: 'invalid@test.com', name: 'Invalid User' } },
      { method: 'POST', path: '/auth/logout', data: { token: 'token_123' } },
    ];
    
    for (const request of requests) {
      await this.apiService.handleRequest(request.method, request.path, request.data);
      // 模拟请求间隔
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  async shutdown() {
    this.logger.info('服务器关闭中...');
    
    // 模拟清理工作
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.logger.info('服务器已关闭');
  }
}

// =============================================================================
// 错误处理和进程监控
// =============================================================================

async function setupErrorHandling(logger: any) {
  // 未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.logError(error, { 
      type: 'uncaughtException',
      pid: process.pid 
    }, '未捕获的异常');
    
    // 优雅关闭
    process.exit(1);
  });
  
  // 未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝', {
      reason: reason,
      promise: promise.toString(),
      type: 'unhandledRejection'
    });
  });
  
  // 进程退出
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，准备优雅关闭');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，准备优雅关闭');
    process.exit(0);
  });
}

// =============================================================================
// 主函数
// =============================================================================

async function main() {
  try {
    // 初始化日志系统
    const logger = await initializeLogger();
    
    // 设置错误处理
    await setupErrorHandling(logger);
    
    // 创建并启动服务器
    const app = new ServerApp(logger);
    await app.start();
    
    // 模拟运行一段时间
    logger.info('服务器正在运行...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 关闭服务器
    await app.shutdown();
    
    console.log('\n✅ Node.js 服务器示例运行完成');
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}