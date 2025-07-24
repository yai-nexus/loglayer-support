/**
 * Express.js 框架适配器
 */

import type { FrameworkAdapter, ResponseData } from '../../receiver'

export class ExpressAdapter implements FrameworkAdapter {
  readonly name = 'express'

  /**
   * 解析 Express.js 请求数据
   */
  async parseRequest(request: any): Promise<any> {
    // Express.js 通常通过中间件（如 express.json()）解析请求体
    if (request.body) {
      return request.body
    }

    // 如果没有解析过，尝试手动解析
    return new Promise((resolve, reject) => {
      let body = ''
      
      request.on('data', (chunk: any) => {
        body += chunk.toString()
      })
      
      request.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          resolve(parsed)
        } catch (error) {
          reject(new Error(`Failed to parse request body: ${error.message}`))
        }
      })
      
      request.on('error', (error: any) => {
        reject(new Error(`Request error: ${error.message}`))
      })
    })
  }

  /**
   * 创建 Express.js 响应
   */
  createResponse(data: ResponseData, status = 200): any {
    // Express.js 响应是通过 res 对象发送的
    // 这里返回一个函数，在实际使用时调用
    return (res: any) => {
      res.status(status).json(data)
    }
  }

  /**
   * 获取请求头
   */
  getHeader(request: any, name: string): string | null {
    try {
      return request.headers?.[name.toLowerCase()] || 
             request.get?.(name) || 
             null
    } catch {
      return null
    }
  }

  /**
   * 获取客户端 IP
   */
  getClientIP(request: any): string {
    // Express.js 中获取客户端 IP 的常见方法
    const forwardedFor = this.getHeader(request, 'x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = this.getHeader(request, 'x-real-ip')
    if (realIP) {
      return realIP
    }

    // 尝试从 request 对象获取 IP
    try {
      return request.ip || 
             request.connection?.remoteAddress || 
             request.socket?.remoteAddress ||
             request.info?.remoteAddress ||
             'unknown'
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
      if (request.originalUrl) {
        return request.originalUrl
      }
      
      if (request.url) {
        return request.url
      }
      
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 检查是否在 Express.js 环境中
   */
  static isAvailable(): boolean {
    try {
      require('express')
      return true
    } catch {
      return false
    }
  }
}
