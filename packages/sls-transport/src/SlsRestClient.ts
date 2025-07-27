/**
 * 阿里云 SLS REST API 客户端
 * 使用纯 JavaScript 实现，无原生模块依赖
 */

import * as crypto from 'crypto';
import type { SlsTransportInternalConfig, SlsLogItem } from './types';
import { internalLogger } from './logger';

export class SlsRestClient {
  private config: SlsTransportInternalConfig;

  constructor(config: SlsTransportInternalConfig) {
    this.config = config;
  }

  /**
   * 发送日志到 SLS
   */
  async putLogs(logs: SlsLogItem[]): Promise<void> {
    const body = JSON.stringify({ logs });
    const uri = `/logstores/${this.config.logstore}/logs`;
    const headers = this.buildHeaders(body);
    
    // 生成认证签名
    const signature = this.generateSignature('PUT', uri, headers);
    headers['Authorization'] = `LOG ${this.config.sdkConfig.accessKeyId}:${signature}`;

    const url = this.buildUrl(uri);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SLS API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      internalLogger.debug('SLS REST API 调用成功', { 
        logsCount: logs.length,
        url,
        status: response.status
      });

    } catch (error) {
      internalLogger.error('SLS REST API 调用失败', { 
        error: error.message,
        url,
        logsCount: logs.length
      });
      throw error;
    }
  }

  /**
   * 构建请求头
   */
  private buildHeaders(body: string): Record<string, string> {
    const contentMD5 = crypto.createHash('md5').update(body).digest('hex');
    const date = new Date().toUTCString();

    return {
      'Content-Type': 'application/json',
      'Content-MD5': contentMD5,
      'Date': date,
      'Host': this.extractHostFromEndpoint(),
      'x-log-apiversion': '0.6.0',
      'x-log-bodyrawsize': Buffer.byteLength(body, 'utf8').toString(),
      'x-log-compresstype': '', // 暂不压缩
    };
  }

  /**
   * 生成阿里云签名
   */
  private generateSignature(
    method: string,
    uri: string,
    headers: Record<string, string>
  ): string {
    const stringToSign = this.buildStringToSign(method, uri, headers);
    
    internalLogger.debug('生成 SLS 签名', {
      method,
      uri,
      stringToSign: stringToSign.replace(/\n/g, '\\n')
    });

    return crypto
      .createHmac('sha1', this.config.sdkConfig.accessKeySecret)
      .update(stringToSign, 'utf8')
      .digest('base64');
  }

  /**
   * 构建待签名字符串
   * 按照阿里云 SLS 规范：https://help.aliyun.com/document_detail/29012.html
   */
  private buildStringToSign(
    method: string,
    uri: string,
    headers: Record<string, string>
  ): string {
    const contentMD5 = headers['Content-MD5'] || '';
    const contentType = headers['Content-Type'] || '';
    const date = headers['Date'] || '';
    
    // 构建 CanonicalizedResource
    const canonicalizedResource = uri;
    
    // 构建 CanonicalizedHeaders（处理 x-log- 开头的头部）
    const canonicalizedHeaders = this.buildCanonicalizedHeaders(headers);

    return [
      method,
      contentMD5,
      contentType,
      date,
      canonicalizedHeaders,
      canonicalizedResource
    ].join('\n');
  }

  /**
   * 构建规范化的自定义头部
   */
  private buildCanonicalizedHeaders(headers: Record<string, string>): string {
    const logHeaders: string[] = [];
    
    // 找出所有 x-log- 开头的头部
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('x-log-')) {
        logHeaders.push(`${lowerKey}:${headers[key]}`);
      }
    });
    
    // 按字典序排序并拼接
    return logHeaders.sort().join('\n');
  }

  /**
   * 构建完整的请求 URL
   */
  private buildUrl(uri: string): string {
    const endpoint = this.config.sdkConfig.endpoint;
    
    // 确保 endpoint 以 https:// 开头
    const normalizedEndpoint = endpoint.startsWith('http') 
      ? endpoint 
      : `https://${endpoint}`;
    
    return normalizedEndpoint + uri;
  }

  /**
   * 从 endpoint 提取主机名
   */
  private extractHostFromEndpoint(): string {
    const endpoint = this.config.sdkConfig.endpoint;
    
    if (endpoint.startsWith('http://')) {
      return endpoint.substring(7);
    }
    if (endpoint.startsWith('https://')) {
      return endpoint.substring(8);
    }
    return endpoint;
  }
}