import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js 中间件 - 记录所有请求
 * 
 * 注意: 在 middleware 中我们不能直接使用 loglayer-support，
 * 因为 Edge Runtime 环境限制，所以使用简单的 console 记录，
 * 实际的详细日志记录在各个 API 路由中进行
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now()
  
  // 基本请求信息
  const requestInfo = {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    timestamp: new Date().toISOString()
  }

  // 记录请求开始（简单记录）
  console.log(`[MIDDLEWARE] ${requestInfo.method} ${requestInfo.pathname}`, {
    ...requestInfo,
    requestId: `mid_${startTime}_${Math.random().toString(36).substr(2, 6)}`
  })

  // 继续请求处理
  const response = NextResponse.next()

  // 添加一些有用的响应头
  response.headers.set('x-request-timestamp', requestInfo.timestamp)
  response.headers.set('x-request-id', `mid_${startTime}`)
  
  // 记录响应（简单记录）
  const endTime = Date.now()
  const duration = endTime - startTime
  
  console.log(`[MIDDLEWARE] Response ${requestInfo.method} ${requestInfo.pathname}`, {
    ...requestInfo,
    duration,
    status: response.status || 'unknown'
  })

  return response
}

/**
 * 配置中间件匹配规则
 */
export const config = {
  // 匹配所有路径，但排除静态文件和内部 Next.js 路径
  matcher: [
    /*
     * 匹配所有请求路径，除了以下几种:
     * - api (handled by individual route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}