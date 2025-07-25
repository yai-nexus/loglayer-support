/**
 * Next.js 框架适配器
 */

import type { FrameworkAdapter, ResponseData } from '../../receiver'

export class NextjsAdapter implements FrameworkAdapter {
  readonly name = 'nextjs'

  /**
   * 解析 Next.js 请求数据
   */
  async parseRequest(request: any): Promise<any> {
    try {
      return await request.json()
    } catch (error) {
      throw new Error(`Failed to parse request body: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 创建 Next.js 响应
   */
  createResponse(data: ResponseData, status = 200): any {
    // 动态导入 NextResponse 以避免在非 Next.js 环境中出错
    try {
      const { NextResponse } = require('next/server')
      return NextResponse.json(data, { status })
    } catch (error) {
      // 如果 NextResponse 不可用，返回标准响应对象
      return {
        status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    }
  }

  /**
   * 获取请求头
   */
  getHeader(request: any, name: string): string | null {
    try {
      return request.headers?.get?.(name) || request.headers?.[name] || null
    } catch {
      return null
    }
  }

  /**
   * 获取客户端 IP
   */
  getClientIP(request: any): string {
    // Next.js 中获取客户端 IP 的常见方法
    const forwardedFor = this.getHeader(request, 'x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = this.getHeader(request, 'x-real-ip')
    if (realIP) {
      return realIP
    }

    const remoteAddr = this.getHeader(request, 'x-vercel-forwarded-for')
    if (remoteAddr) {
      return remoteAddr
    }

    // 尝试从 request 对象获取 IP
    try {
      return request.ip || request.connection?.remoteAddress || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 获取请求方法
   */
  getMethod(request: any): string {
    return request.method || 'UNKNOWN'
  }

  /**
   * 获取请求 URL
   */
  getURL(request: any): string {
    try {
      if (request.url) {
        return request.url
      }
      
      if (request.nextUrl) {
        return request.nextUrl.toString()
      }
      
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 检查是否在 Next.js 环境中
   */
  static isAvailable(): boolean {
    try {
      require('next/server')
      return true
    } catch {
      return false
    }
  }
}
