/**
 * @yai-loglayer/next 完整使用示例 - 极简主义版本
 * 
 * 展示如何使用预定义的日志器实例，实现极简接入
 */

// =============================================================================
// 1. 服务端使用 - 极简接入
// =============================================================================

// Server Actions
import { actionLogger } from '@yai-loglayer/next/server-only'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  
  // 直接使用，无需配置
  actionLogger.info('开始创建用户', { name, action: 'createUser' })
  
  try {
    // 业务逻辑...
    actionLogger.info('用户创建成功', { name, userId: 'user_123' })
    return { success: true }
  } catch (error) {
    actionLogger.error('用户创建失败', { name, error: (error as Error).message })
    return { success: false, error: 'Creation failed' }
  }
}

// API Routes
import { apiLogger } from '@yai-loglayer/next/server-only'

export async function GET(request: Request) {
  const requestId = `req_${Date.now()}`
  
  apiLogger.info('API请求开始', {
    method: 'GET',
    url: request.url,
    requestId
  })
  
  try {
    const data = { message: 'Hello World' }
    apiLogger.info('API请求成功', { requestId, data })
    return Response.json(data)
  } catch (error) {
    apiLogger.error('API请求失败', { requestId, error })
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Database Operations
import { dbLogger } from '@yai-loglayer/next/server-only'

export async function queryUsers() {
  dbLogger.debug('开始查询用户', { table: 'users' })
  
  try {
    // 模拟数据库查询
    const users = [{ id: 1, name: 'John' }]
    dbLogger.info('查询用户成功', { count: users.length })
    return users
  } catch (error) {
    dbLogger.error('查询用户失败', { error: (error as Error).message })
    throw error
  }
}

// General Server Logging
import { logger } from '@yai-loglayer/next/server-only'

export function initializeApp() {
  logger.info('应用初始化开始', {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  })
  
  // 应用初始化逻辑...
  
  logger.info('应用初始化完成', {
    timestamp: new Date().toISOString()
  })
}

// =============================================================================
// 2. 客户端使用 - React组件
// =============================================================================

// Layout组件
import { LoggerProvider } from '@yai-loglayer/next/client'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LoggerProvider config={{
          appName: 'my-nextjs-app',
          shared: {
            environment: 'development',
            level: 'debug'
          }
        }}>
          {children}
        </LoggerProvider>
      </body>
    </html>
  )
}

// 业务组件
import { useComponentLogger, usePerformanceLogger } from '@yai-loglayer/next/client'

export function UserProfile({ userId }: { userId: string }) {
  const logger = useComponentLogger('UserProfile')
  const { measurePerformance } = usePerformanceLogger()
  
  const handleLogin = measurePerformance(async () => {
    logger.info('用户登录开始', { userId })
    
    try {
      // 登录逻辑...
      logger.info('用户登录成功', { userId })
    } catch (error) {
      logger.error('用户登录失败', { userId, error })
    }
  }, 'user-login')
  
  return (
    <div>
      <h1>用户资料</h1>
      <button onClick={handleLogin}>登录</button>
    </div>
  )
}

// =============================================================================
// 3. 日志接收器 - 处理客户端日志
// =============================================================================

import { NextRequest } from 'next/server'
import { createNextjsLogReceiver, logger } from '@yai-loglayer/next/server-only'

// 创建日志接收器
const logReceiver = createNextjsLogReceiver(
  await logger.withContext({ module: 'client-logs' }),
  {
    validation: {
      requireLevel: true,
      maxMessageLength: 2000,
      allowedLevels: ['debug', 'info', 'warn', 'error']
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 50
    }
  }
)

// API路由处理函数
export async function POST(request: NextRequest) {
  return logReceiver(request)
}

// =============================================================================
// 4. 高级用法 - 自定义配置
// =============================================================================

import { createNextjsServerLogger } from '@yai-loglayer/next/server-only'

// 自定义服务端日志器
export const customLogger = await createNextjsServerLogger({
  appName: 'custom-app',
  environment: 'production',
  level: 'info',
  enableFileLogging: true,
  logDir: './custom-logs',
  outputs: {
    console: { enabled: true },
    file: { enabled: true, path: './custom-logs/app.log' },
    sls: { enabled: true }
  }
})

// 使用自定义日志器
customLogger.info('自定义日志器测试', { feature: 'custom-logging' })

// =============================================================================
// 5. 类型安全使用
// =============================================================================

import type { 
  NextjsLoggerConfig, 
  LoggerContextValue,
  NextjsServerConfig 
} from '@yai-loglayer/next'

// 类型安全的配置
const config: NextjsLoggerConfig = {
  appName: 'typed-app',
  shared: {
    environment: 'development',
    level: 'debug',
    enableSls: false
  },
  server: {
    enableFileLogging: true,
    logDir: './logs'
  },
  browser: {
    enableConsole: true,
    enableHttp: true,
    httpEndpoint: '/api/client-logs'
  }
}

// 类型安全的上下文值
const contextValue: LoggerContextValue = {
  logger: null,
  serverLogger: null,
  browserLogger: null,
  isReady: false,
  error: null
}

export { config, contextValue }
