/**
 * 阿里云 SLS REST API 客户端
 * 使用纯 JavaScript 实现，无原生模块依赖
 */

import * as crypto from 'crypto';
import type { SlsTransportInternalConfig, SlsLogItem, SlsLogTag } from './types';
import { internalLogger } from './logger';

export class SlsRestClient {
  private config: SlsTransportInternalConfig;

  constructor(config: SlsTransportInternalConfig) {
    this.config = config;
  }

  /**
   * 发送日志到 SLS
   * @param logs 日志条目数组
   * @param logTags 日志标签数组（可选，包含PackID等）
   */
  async putLogs(logs: SlsLogItem[], logTags?: SlsLogTag[]): Promise<void> {
    // 注意：根据阿里云 SLS 官方文档，PutLogs API 需要：
    // 1. 使用 POST 方法（不是 PUT）
    // 2. 端点为 /logstores/{logstore}/shards/lb
    // 3. 数据格式为 PB (Protocol Buffer)，需要压缩
    // 4. Content-Type 为 application/x-protobuf
    //
    // 当前实现使用 JSON 格式作为临时方案，需要后续升级为 PB 格式
    // 根据 SLS API 要求，使用正确的数据格式
    const logGroup: any = {
      __logs__: logs.map(log => ({
        __time__: log.time, // SLS 时间戳（秒）
        __source__: '', // 日志来源
        ...Object.fromEntries(log.contents.map(c => [c.key, c.value]))
      }))
    };

    // 添加LogTags支持（包含PackID等）
    if (logTags && logTags.length > 0) {
      logGroup.__tags__ = Object.fromEntries(
        logTags.map(tag => [tag.key, tag.value])
      );
    }

    const body = JSON.stringify(logGroup);
    const uri = `/logstores/${this.config.logstore}/shards/lb`;
    const headers = this.buildHeaders(body);

    // 【调试增强】记录环境信息和配置
    internalLogger.debug('=== SLS 请求开始 ===', {
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        isNextjs: typeof window === 'undefined' && process.env.NEXT_RUNTIME !== undefined
      },
      config: {
        endpoint: this.config.sdkConfig.endpoint,
        project: this.config.project,
        logstore: this.config.logstore,
        accessKeyId: this.config.sdkConfig.accessKeyId?.substring(0, 6) + '***'
      },
      requestInfo: {
        uri,
        logsCount: logs.length,
        logTagsCount: logTags?.length || 0,
        hasPackId: logTags?.some(tag => tag.key === '__pack_id__') || false
        method: 'POST',
        bodyLength: body.length,
        logsCount: logs.length
      }
    });

    // 生成认证签名（使用 POST 方法）
    const signature = this.generateSignature('POST', uri, headers);
    headers['Authorization'] = `LOG ${this.config.sdkConfig.accessKeyId}:${signature}`;

    const url = this.buildUrl(uri);

    // 【调试增强】记录完整的 HTTP 请求信息
    internalLogger.debug('完整 HTTP 请求信息', {
      url,
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization?.replace(/:[^:]+$/, ':***') },
      bodyPreview: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
      bodySize: body.length
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 【调试增强】记录错误响应的详细信息
        internalLogger.error('SLS API 错误响应详情', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorBody: errorText,
          requestUrl: url,
          requestHeaders: { ...headers, Authorization: '***' }
        });
        
        throw new Error(`SLS API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      internalLogger.debug('SLS REST API 调用成功', { 
        logsCount: logs.length,
        url,
        status: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      internalLogger.error('SLS REST API 调用失败', {
        error: errorMessage,
        url,
        logsCount: logs.length,
        headers: { ...headers, Authorization: '***' }
      });
      throw error;
    }
  }

  /**
   * 构建请求头
   */
  private buildHeaders(body: string): Record<string, string> {
    // 【编码标准化】确保所有字符串处理使用一致的 UTF-8 编码
    const startTime = Date.now();
    
    // 【编码标准化】强制使用 UTF-8 编码处理 body
    const normalizedBody = this.normalizeStringEncoding(body);
    const bodyBuffer = Buffer.from(normalizedBody, 'utf8');
    
    // 【编码标准化】MD5 计算使用标准化后的字符串
    // 【重要修复】阿里云官方文档要求 Content-MD5 必须是十六进制大写字符串
    const contentMD5 = crypto.createHash('md5').update(bodyBuffer).digest('hex').toUpperCase();
    
    // 【编码标准化】时间字符串格式标准化
    const date = this.getStandardizedDateString();
    const host = this.extractHostFromEndpoint();
    // 【重要修复】x-log-bodyrawsize 应该是原始数据长度，不是 Buffer 字节长度
    // 根据阿里云官方文档：请求的Body原始大小，当Body是压缩数据，则为压缩前的原始数据大小
    const bodyRawSize = normalizedBody.length;

    // 【调试增强】详细记录各个头部字段的计算过程
    internalLogger.debug('HTTP 头部构建详情', {
      encoding_normalization: {
        original_body_length: body.length,
        normalized_body_length: normalizedBody.length,
        body_encoding_changed: body !== normalizedBody,
        buffer_length: bodyBuffer.length,
        first_100_chars: normalizedBody.substring(0, 100),
        encoding_test: {
          utf8: Buffer.from(normalizedBody, 'utf8').toString('utf8') === normalizedBody,
          ascii_safe: /^[\x00-\x7F]*$/.test(normalizedBody)
        }
      },
      md5_calculation: {
        input_string: normalizedBody,
        input_bytes: bodyBuffer.toString('hex').substring(0, 100) + '...',
        md5_hex: contentMD5,
        md5_base64: Buffer.from(contentMD5, 'hex').toString('base64')
      },
      date_standardization: {
        utc_string: date,
        iso_string: new Date().toISOString(),
        timestamp: Date.now(),
        timezone_offset: new Date().getTimezoneOffset()
      },
      host_info: {
        endpoint_config: this.config.sdkConfig.endpoint,
        project: this.config.project,
        extracted_host: host,
        host_parts: host.split('.')
      },
      timing: {
        header_build_time_ms: Date.now() - startTime
      }
    });

    // 【头部标准化】构建基础头部
    const rawHeaders = {
      // 注意：官方文档要求 application/x-protobuf，但当前使用 JSON 格式
      // 后续需要升级为 PB 格式时需要修改此处
      'Content-Type': 'application/json',
      'Content-MD5': contentMD5,
      'Date': date,
      'Host': host,
      'x-log-apiversion': '0.6.0',
      'x-log-bodyrawsize': bodyRawSize.toString(),
      'x-log-compresstype': '', // 暂不压缩，官方支持 lz4、gzip
      'x-log-signaturemethod': 'hmac-sha1', // 阿里云 SLS 要求的签名方法
    };

    // 【头部标准化】应用标准化处理
    const standardizedHeaders = this.normalizeHeaders(rawHeaders);

    // 【调试增强】记录最终构建的头部
    internalLogger.debug('最终 HTTP 头部', {
      raw_headers: rawHeaders,
      standardized_headers: standardizedHeaders,
      headers_changed: JSON.stringify(rawHeaders) !== JSON.stringify(standardizedHeaders),
      header_count: Object.keys(standardizedHeaders).length,
      header_keys: Object.keys(standardizedHeaders).sort(),
      x_log_headers: Object.keys(standardizedHeaders).filter(k => k.startsWith('x-log-')),
      standard_headers: Object.keys(standardizedHeaders).filter(k => !k.startsWith('x-log-'))
    });

    return standardizedHeaders;
  }

  /**
   * 生成阿里云签名
   */
  private generateSignature(
    method: string,
    uri: string,
    headers: Record<string, string>
  ): string {
    // 【调试增强】记录签名生成的详细过程
    internalLogger.debug('=== 开始生成签名 ===', {
      method,
      uri,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        encoding: process.env.LANG || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });

    const stringToSign = this.buildStringToSign(method, uri, headers);
    
    // 【编码标准化】对签名字符串进行编码标准化
    const normalizedStringToSign = this.normalizeStringEncoding(stringToSign);
    
    // 【调试增强】详细记录 stringToSign 的构建过程
    internalLogger.debug('StringToSign 构建详情', {
      method,
      uri,
      headerKeys: Object.keys(headers).sort(),
      stringToSign_raw: stringToSign,
      stringToSign_normalized: normalizedStringToSign,
      encoding_changed: stringToSign !== normalizedStringToSign,
      stringToSign_escaped: normalizedStringToSign.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'),
      stringToSign_length: normalizedStringToSign.length,
      stringToSign_bytes: Buffer.from(normalizedStringToSign, 'utf8').toString('hex'),
      stringToSign_utf8Length: Buffer.byteLength(normalizedStringToSign, 'utf8'),
      // 分段显示 stringToSign 的各个部分
      stringToSign_parts: normalizedStringToSign.split('\n').map((part, index) => `[${index}]: "${part}"`),
    });
    
    // 【编码标准化】使用标准化的字符串计算签名
    const signature = crypto
      .createHmac('sha1', this.config.sdkConfig.accessKeySecret)
      .update(normalizedStringToSign, 'utf8')
      .digest('base64');

    // 【调试增强】记录签名计算的详细信息
    internalLogger.debug('HMAC-SHA1 签名计算详情', {
      accessKeySecret_preview: this.config.sdkConfig.accessKeySecret.substring(0, 8) + '***',
      accessKeySecret_length: this.config.sdkConfig.accessKeySecret.length,
      hmac_input: normalizedStringToSign,
      hmac_input_bytes: Buffer.from(normalizedStringToSign, 'utf8').toString('hex'),
      signature_base64: signature,
      signature_hex: Buffer.from(signature, 'base64').toString('hex'),
      signature_length: signature.length,
      encoding_normalization_applied: stringToSign !== normalizedStringToSign
    });

    // 【调试增强】记录头部处理的详细信息
    const xLogHeaders = Object.keys(headers)
      .filter(k => k.toLowerCase().startsWith('x-log-'))
      .reduce((obj, k) => {
        obj[k] = headers[k];
        return obj;
      }, {} as Record<string, string>);

    internalLogger.debug('HTTP 头部处理详情', {
      allHeaders: headers,
      xLogHeaders,
      headerCount: Object.keys(headers).length,
      xLogHeaderCount: Object.keys(xLogHeaders).length,
      headersSorted: Object.keys(headers).sort(),
      contentMD5: headers['Content-MD5'],
      contentType: headers['Content-Type'],
      date: headers['Date'],
      host: headers['Host']
    });

    return signature;
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

    // 根据阿里云官方文档，格式为：
    // method + "\n" + contentMD5 + "\n" + contentType + "\n" + date + "\n" + canonicalizedHeaders + canonicalizedResource
    let stringToSign = method + '\n' + contentMD5 + '\n' + contentType + '\n' + date + '\n';

    // canonicalizedHeaders 已经包含了每个头部的换行符
    stringToSign += canonicalizedHeaders;

    stringToSign += canonicalizedResource;

    return stringToSign;
  }

  /**
   * 构建规范化的自定义头部
   */
  private buildCanonicalizedHeaders(headers: Record<string, string>): string {
    const logHeaders: string[] = [];

    // 找出所有 x-log- 或 x-acs- 开头的头部
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('x-log-') || lowerKey.startsWith('x-acs-')) {
        logHeaders.push(`${lowerKey}:${headers[key]}`);
      }
    });

    // 按字典序排序并拼接，每个头部后面有换行符
    return logHeaders.sort().map(header => header + '\n').join('');
  }

  /**
   * 构建完整的请求 URL
   */
  private buildUrl(uri: string): string {
    const endpoint = this.config.sdkConfig.endpoint;

    let finalEndpoint: string;

    if (endpoint.startsWith('http')) {
      // 如果是完整 URL，直接使用
      finalEndpoint = endpoint;
    } else {
      // 如果是域名格式，需要添加 project 前缀
      // 阿里云 SLS 的正确格式：{project}.{region}.log.aliyuncs.com
      const projectPrefix = this.config.project;
      finalEndpoint = `https://${projectPrefix}.${endpoint}`;
    }

    return finalEndpoint + uri;
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

    // 如果是域名格式，需要添加 project 前缀
    // 阿里云 SLS 的正确格式：{project}.{region}.log.aliyuncs.com
    const projectPrefix = this.config.project;
    return `${projectPrefix}.${endpoint}`;
  }

  /**
   * 【编码标准化】字符串编码标准化
   * 确保所有字符串都使用一致的 UTF-8 编码处理
   */
  private normalizeStringEncoding(input: string): string {
    // 检查字符串是否包含非 ASCII 字符
    const hasNonAscii = !/^[\x00-\x7F]*$/.test(input);
    
    if (!hasNonAscii) {
      // 纯 ASCII 字符串，直接返回
      return input;
    }

    // 包含非 ASCII 字符，进行 UTF-8 标准化
    try {
      // 先转换为 Buffer 再转回字符串，确保 UTF-8 编码一致性
      const buffer = Buffer.from(input, 'utf8');
      const normalized = buffer.toString('utf8');
      
      // 验证转换是否正确
      if (normalized === input) {
        return normalized;
      } else {
        internalLogger.warn('字符串编码标准化检测到差异', {
          original: input.substring(0, 100),
          normalized: normalized.substring(0, 100),
          originalLength: input.length,
          normalizedLength: normalized.length
        });
        return normalized;
      }
    } catch (error) {
      internalLogger.error('字符串编码标准化失败', {
        error: error instanceof Error ? error.message : String(error),
        input: input.substring(0, 100)
      });
      return input; // 失败时返回原字符串
    }
  }

  /**
   * 【时间标准化】获取标准化的日期字符串
   * 确保时间格式在所有环境下一致
   */
  private getStandardizedDateString(): string {
    const now = new Date();
    
    // 使用标准的 RFC 2822 格式（HTTP Date 格式）
    // 格式：Fri, 27 Jul 2025 08:45:18 GMT
    const utcString = now.toUTCString();
    
    // 【调试增强】记录时间标准化过程
    internalLogger.debug('时间标准化详情', {
      localTime: now.toString(),
      localISOString: now.toISOString(),
      utcString: utcString,
      timestamp: now.getTime(),
      timezoneOffset: now.getTimezoneOffset(),
      // 验证时间格式的正则表达式
      isValidHttpDate: /^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(utcString)
    });
    
    return utcString;
  }

  /**
   * 【头部标准化】标准化 HTTP 头部键值对
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    // 对头部进行标准化处理
    Object.entries(headers).forEach(([key, value]) => {
      // 头部名称标准化：保持原始大小写，但确保一致性
      const normalizedKey = key.trim();
      const normalizedValue = this.normalizeHeaderValue(key, value);
      
      normalized[normalizedKey] = normalizedValue;
    });
    
    return normalized;
  }

  /**
   * 【头部标准化】标准化头部值
   */
  private normalizeHeaderValue(headerName: string, value: string): string {
    // 移除首尾空白字符
    let normalized = value.trim();
    
    // 根据头部类型进行特殊处理
    switch (headerName.toLowerCase()) {
      case 'content-type':
        // Content-Type 头部标准化
        normalized = normalized.toLowerCase();
        break;
      case 'host':
        // Host 头部标准化（转为小写）
        normalized = normalized.toLowerCase();
        break;
      case 'date':
        // Date 头部已经通过 getStandardizedDateString 标准化
        break;
      default:
        // 其他头部保持原样，但确保编码一致性
        normalized = this.normalizeStringEncoding(normalized);
        break;
    }
    
    return normalized;
  }
}