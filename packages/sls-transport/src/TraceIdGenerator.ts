/**
 * OpenTelemetry 标准的 TraceId 生成器
 * 
 * 实现符合 OpenTelemetry 规范的 TraceId 生成
 * TraceId 格式: 32位十六进制字符串 (128位)
 * 例如: 4bf92f3577b34da6a3ce929d0e0e4736
 */

import { randomBytes } from 'crypto';
import { internalLogger } from './logger';

/**
 * TraceId 生成器类
 * 符合 OpenTelemetry 标准的 TraceId 生成
 */
export class TraceIdGenerator {
  /**
   * 生成符合 OpenTelemetry 标准的 TraceId
   * @returns 32位十六进制字符串 (128位)
   */
  static generateTraceId(): string {
    try {
      // 生成16字节(128位)的随机数据
      const traceIdBytes = randomBytes(16);
      
      // 转换为32位十六进制字符串
      const traceId = traceIdBytes.toString('hex');
      
      internalLogger.debug('生成新TraceId', { 
        traceId,
        length: traceId.length 
      });
      
      return traceId;
    } catch (error) {
      // 如果生成失败，使用备用方案
      const fallbackTraceId = this.generateFallbackTraceId();
      
      internalLogger.warn('TraceId生成失败，使用备用方案', { 
        error: error instanceof Error ? error.message : String(error),
        fallbackTraceId 
      });
      
      return fallbackTraceId;
    }
  }

  /**
   * 生成备用TraceId（基于时间戳和随机数）
   * @returns 32位十六进制字符串
   */
  private static generateFallbackTraceId(): string {
    const timestamp = Date.now().toString(16).padStart(12, '0'); // 48位时间戳
    const random = Math.random().toString(16).substring(2).padStart(20, '0'); // 80位随机数
    
    return (timestamp + random).substring(0, 32);
  }

  /**
   * 验证TraceId格式是否正确
   * @param traceId 要验证的TraceId
   * @returns 是否为有效的TraceId格式
   */
  static isValidTraceId(traceId: string): boolean {
    // OpenTelemetry TraceId 必须是32位十六进制字符串，且不能全为0
    const traceIdRegex = /^[0-9a-f]{32}$/i;
    const isValidFormat = traceIdRegex.test(traceId);
    const isNotAllZeros = traceId !== '00000000000000000000000000000000';
    
    return isValidFormat && isNotAllZeros;
  }

  /**
   * 从现有TraceId生成SpanId
   * @param traceId 父TraceId
   * @returns 16位十六进制字符串 (64位)
   */
  static generateSpanId(traceId?: string): string {
    try {
      // 生成8字节(64位)的随机数据
      const spanIdBytes = randomBytes(8);
      
      // 转换为16位十六进制字符串
      const spanId = spanIdBytes.toString('hex');
      
      internalLogger.debug('生成新SpanId', { 
        traceId,
        spanId,
        length: spanId.length 
      });
      
      return spanId;
    } catch (error) {
      // 备用方案
      const fallbackSpanId = Math.random().toString(16).substring(2).padStart(16, '0');
      
      internalLogger.warn('SpanId生成失败，使用备用方案', { 
        error: error instanceof Error ? error.message : String(error),
        fallbackSpanId 
      });
      
      return fallbackSpanId;
    }
  }

  /**
   * 验证SpanId格式是否正确
   * @param spanId 要验证的SpanId
   * @returns 是否为有效的SpanId格式
   */
  static isValidSpanId(spanId: string): boolean {
    // OpenTelemetry SpanId 必须是16位十六进制字符串，且不能全为0
    const spanIdRegex = /^[0-9a-f]{16}$/i;
    const isValidFormat = spanIdRegex.test(spanId);
    const isNotAllZeros = spanId !== '0000000000000000';
    
    return isValidFormat && isNotAllZeros;
  }

  /**
   * 解析TraceId和SpanId（用于调试）
   * @param traceId TraceId字符串
   * @param spanId SpanId字符串
   * @returns 解析结果
   */
  static parseIds(traceId: string, spanId?: string): {
    traceId: {
      value: string;
      valid: boolean;
      timestamp?: number;
    };
    spanId?: {
      value: string;
      valid: boolean;
    };
  } {
    const result = {
      traceId: {
        value: traceId,
        valid: this.isValidTraceId(traceId),
        timestamp: undefined as number | undefined
      },
      spanId: spanId ? {
        value: spanId,
        valid: this.isValidSpanId(spanId)
      } : undefined
    };

    // 尝试从TraceId中提取时间戳（如果是基于时间戳生成的）
    if (result.traceId.valid) {
      try {
        const timestampHex = traceId.substring(0, 12);
        const timestamp = parseInt(timestampHex, 16);
        if (timestamp > 0 && timestamp < Date.now() + 86400000) { // 合理的时间范围
          result.traceId.timestamp = timestamp;
        }
      } catch {
        // 忽略解析错误
      }
    }

    return result;
  }
}

/**
 * 全局TraceId上下文管理
 */
class TraceContext {
  private static currentTraceId: string | null = null;
  private static currentSpanId: string | null = null;

  /**
   * 设置当前TraceId
   * @param traceId TraceId
   * @param spanId SpanId（可选）
   */
  static setCurrentTrace(traceId: string, spanId?: string): void {
    this.currentTraceId = traceId;
    this.currentSpanId = spanId || null;
    
    internalLogger.debug('设置当前Trace上下文', { 
      traceId, 
      spanId 
    });
  }

  /**
   * 获取当前TraceId
   * @returns 当前TraceId或null
   */
  static getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  /**
   * 获取当前SpanId
   * @returns 当前SpanId或null
   */
  static getCurrentSpanId(): string | null {
    return this.currentSpanId;
  }

  /**
   * 清除当前Trace上下文
   */
  static clearCurrentTrace(): void {
    this.currentTraceId = null;
    this.currentSpanId = null;
    
    internalLogger.debug('清除当前Trace上下文');
  }

  /**
   * 生成新的Trace上下文
   * @returns 新的TraceId和SpanId
   */
  static generateNewTrace(): { traceId: string; spanId: string } {
    const traceId = TraceIdGenerator.generateTraceId();
    const spanId = TraceIdGenerator.generateSpanId(traceId);
    
    this.setCurrentTrace(traceId, spanId);
    
    return { traceId, spanId };
  }
}

// 导出便捷函数
export const traceContext = TraceContext;

/**
 * 生成新的TraceId（便捷函数）
 * @returns 32位十六进制TraceId
 */
export function generateTraceId(): string {
  return TraceIdGenerator.generateTraceId();
}

/**
 * 生成新的SpanId（便捷函数）
 * @param traceId 关联的TraceId
 * @returns 16位十六进制SpanId
 */
export function generateSpanId(traceId?: string): string {
  return TraceIdGenerator.generateSpanId(traceId);
}

/**
 * 获取或生成TraceId
 * 如果当前上下文中有TraceId则返回，否则生成新的
 * @returns TraceId
 */
export function getOrGenerateTraceId(): string {
  const currentTraceId = traceContext.getCurrentTraceId();
  if (currentTraceId) {
    return currentTraceId;
  }
  
  const newTrace = traceContext.generateNewTrace();
  return newTrace.traceId;
}

/**
 * 获取或生成SpanId
 * 如果当前上下文中有SpanId则返回，否则生成新的
 * @returns SpanId
 */
export function getOrGenerateSpanId(): string {
  const currentSpanId = traceContext.getCurrentSpanId();
  if (currentSpanId) {
    return currentSpanId;
  }
  
  const currentTraceId = traceContext.getCurrentTraceId();
  return generateSpanId(currentTraceId || undefined);
}
