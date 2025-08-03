/**
 * @yai-loglayer/next 完整使用示例
 * 
 * 展示如何在Next.js应用中使用统一的日志组件
 */

import {
  // 统一接口
  createNextjsLogger,
  createNextjsLoggerPair,
  
  // Server端
  createAutoLogger,
  createNextjsServerLogger,
  
  // Browser端
  createAppLogger,
  createNextjsBrowserLogger,
  createDevelopmentLogger,
  createProductionLogger,
  
  // React组件
  LoggerProvider,
  useLogger,
  useComponentLogger,
  
  // 日志接收器
  createNextjsLogReceiver,
  
  // 工具
  detectEnvironment,
  isServer
} from '@yai-loglayer/next'

// =============================================================================
// 1. 最简单的使用方式
// =============================================================================

// 自动根据环境选择server或browser logger
const logger = createNextjsLogger({
  appName: 'my-nextjs-app'
})

// 立即可用
logger.info('应用启动', { version: '1.0.0' })

// =============================================================================
// 2. 分别创建server和browser logger
// =============================================================================

const loggerPair = createNextjsLoggerPair({
  appName: 'my-nextjs-app',
  shared: {
    environment: 'production',
    level: 'info',
    enableSls: true
  },
  server: {
    outputs: {
      file: { enabled: true, path: './logs' }
    }
  },
  browser: {
    enableConsole: false,
    httpEndpoint: '/api/logs/client'
  }
})

// 在server端使用
if (isServer()) {
  loggerPair.server.info('Server started')
} else {
  loggerPair.browser.info('Client initialized')
}

// =============================================================================
// 3. 在Next.js API路由中使用
// =============================================================================

// pages/api/logs/client.ts 或 app/api/logs/client/route.ts
import { NextRequest, NextResponse } from 'next/server'

// 创建服务端logger
const serverLogger = createNextjsServerLogger({
  appName: 'my-nextjs-app',
  environment: 'production'
})

// 创建日志接收器
const logReceiver = createNextjsLogReceiver(serverLogger, {
  validation: {
    maxMessageLength: 1000,
    allowedLevels: ['info', 'warn', 'error']
  },
  security: {
    rateLimiting: {
      maxRequestsPerMinute: 100
    }
  }
})

// API路由处理函数
export async function POST(req: NextRequest) {
  return logReceiver(req)
}

// =============================================================================
// 4. 在React组件中使用
// =============================================================================

// app/layout.tsx
import { LoggerProvider } from '@yai-loglayer/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LoggerProvider 
          config={{
            appName: 'my-nextjs-app',
            shared: { environment: 'production' }
          }}
        >
          {children}
        </LoggerProvider>
      </body>
    </html>
  )
}

// components/UserProfile.tsx
import { useComponentLogger } from '@yai-loglayer/next'

export function UserProfile({ userId }: { userId: string }) {
  const logger = useComponentLogger('UserProfile')
  
  const handleLogin = () => {
    logger.info('用户登录', { userId })
  }
  
  const handleError = (error: Error) => {
    logger.error('登录失败', { userId, error: error.message })
  }
  
  return (
    <div>
      <button onClick={handleLogin}>登录</button>
    </div>
  )
}

// =============================================================================
// 5. 在Server Actions中使用
// =============================================================================

// app/actions.ts
'use server'

const serverLogger = createNextjsServerLogger({
  appName: 'my-nextjs-app'
})

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  
  try {
    serverLogger.info('创建用户开始', { name })
    
    // 业务逻辑
    const user = await db.user.create({ data: { name } })
    
    serverLogger.info('创建用户成功', { userId: user.id, name })
    return { success: true, user }
  } catch (error) {
    serverLogger.error('创建用户失败', { name, error })
    return { success: false, error: 'Failed to create user' }
  }
}

// =============================================================================
// 6. 在Middleware中使用
// =============================================================================

// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const middlewareLogger = createNextjsServerLogger({
  appName: 'my-nextjs-app-middleware'
})

export function middleware(request: NextRequest) {
  const start = Date.now()
  
  middlewareLogger.info('请求开始', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent')
  })
  
  const response = NextResponse.next()
  
  // 添加响应时间
  const duration = Date.now() - start
  middlewareLogger.info('请求完成', {
    url: request.url,
    method: request.method,
    duration: `${duration}ms`,
    status: response.status
  })
  
  return response
}

// =============================================================================
// 7. 环境特定配置
// =============================================================================

// 开发环境
const devLogger = createDevelopmentLogger('my-nextjs-app')
devLogger.debug('开发环境日志', { feature: 'hot-reload' })

// 生产环境
const prodLogger = createProductionLogger('my-nextjs-app')
prodLogger.warn('生产环境警告', { metric: 'high-memory-usage' })

// =============================================================================
// 8. 高级配置示例
// =============================================================================

// 完全自定义的logger
const customLogger = createNextjsLogger({
  appName: 'my-nextjs-app',
  server: {
    app: {
      name: 'my-nextjs-app-server',
      environment: 'production',
      version: '2.0.0'
    },
    level: 'warn',
    outputs: {
      console: { enabled: false },
      file: {
        enabled: true,
        path: '/var/log/myapp',
        filename: 'app.log',
        rotation: {
          maxSize: '100MB',
          maxFiles: 10
        }
      },
      sls: {
        enabled: true,
        config: 'env'
      }
    }
  },
  browser: {
    level: 'error',
    enableConsole: false,
    enableHttp: true,
    enableSls: true,
    httpEndpoint: '/api/logs/client'
  }
})

// =============================================================================
// 9. 性能监控示例
// =============================================================================

import { usePerformanceLogger } from '@yai-loglayer/next'

function ExpensiveComponent() {
  const { measurePerformance } = usePerformanceLogger()
  
  const handleExpensiveOperation = () => {
    measurePerformance('expensive-calculation', () => {
      // 耗时操作
      for (let i = 0; i < 1000000; i++) {
        Math.random()
      }
    })
  }
  
  return <button onClick={handleExpensiveOperation}>执行耗时操作</button>
}

// =============================================================================
// 10. 错误边界集成
// =============================================================================

import { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

class LoggerErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  private logger = createNextjsBrowserLogger({
    appName: 'my-nextjs-app-error-boundary'
  })
  
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    this.logger.error('React错误边界捕获错误', {
      error: error.message,
      stack: error.stack,
      errorInfo
    })
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    
    return this.props.children
  }
}

export default customLogger
