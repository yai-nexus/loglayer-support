/**
 * 通用框架适配器
 * 用于不特定于任何框架的场景
 */

import type { FrameworkAdapter, ResponseData } from '../../receiver'

export class GenericAdapter implements FrameworkAdapter {
  readonly name = 'generic'

  /**
   * 解析通用请求数据
   */
  async parseRequest(request: any): Promise<any> {
    // 如果已经是解析过的对象，直接返回
    if (typeof request === 'object' && request !== null && !request.body && !request.json) {
      return request
    }

    // 尝试各种解析方法
    if (request.json && typeof request.json === 'function') {
      return await request.json()
    }

    if (request.body) {
      return request.body
    }

    // 如果是字符串，尝试解析为 JSON
    if (typeof request === 'string') {
      try {
        return JSON.parse(request)
      } catch (error) {
        throw new Error(`Failed to parse request string: ${error.message}`)
      }
    }

    // 如果有 data 属性
    if (request.data) {
      return request.data
    }

    throw new Error('Unable to parse request data')
  }

  /**
   * 创建通用响应
   */
  createResponse(data: ResponseData, status = 200): any {
    return {
      status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      data
    }
  }

  /**
   * 获取请求头
   */
  getHeader(request: any, name: string): string | null {
    try {
      // 尝试多种获取头部的方法
      if (request.headers) {
        return request.headers[name] || 
               request.headers[name.toLowerCase()] ||
               null
      }

      if (request.getHeader && typeof request.getHeader === 'function') {
        return request.getHeader(name)
      }

      if (request.get && typeof request.get === 'function') {
        return request.get(name)
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * 获取客户端 IP
   */
  getClientIP(request: any): string {
    try {
      // 尝试多种获取 IP 的方法
      const forwardedFor = this.getHeader(request, 'x-forwarded-for')
      if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
      }

      const realIP = this.getHeader(request, 'x-real-ip')
      if (realIP) {
        return realIP
      }

      // 直接从对象属性获取
      if (request.ip) {
        return request.ip
      }

      if (request.clientIP) {
        return request.clientIP
      }

      if (request.remoteAddress) {
        return request.remoteAddress
      }

      if (request.connection?.remoteAddress) {
        return request.connection.remoteAddress
      }

      if (request.socket?.remoteAddress) {
        return request.socket.remoteAddress
      }

      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 获取请求方法
   */
  getMethod(request: any): string {
    try {
      return request.method || 
             request.httpMethod || 
             request.requestMethod ||
             'UNKNOWN'
    } catch {
      return 'UNKNOWN'
    }
  }

  /**
   * 获取请求 URL
   */
  getURL(request: any): string {
    try {
      return request.url || 
             request.originalUrl ||
             request.path ||
             request.pathname ||
             request.uri ||
             'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 通用适配器总是可用
   */
  static isAvailable(): boolean {
    return true
  }
}
