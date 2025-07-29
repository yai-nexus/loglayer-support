/**
 * OpenTelemetry 集成模块
 * 
 * 自动从 OpenTelemetry 获取当前的 TraceId 和 SpanId
 * 支持多种 OpenTelemetry 实现和版本
 */

import { internalLogger } from './logger';

/**
 * OpenTelemetry API 接口定义
 * 兼容不同版本的 @opentelemetry/api
 */
interface OTelAPI {
  trace?: {
    getActiveSpan?: () => OTelSpan | undefined;
    getSpan?: (context: any) => OTelSpan | undefined;
    setSpan?: (context: any, span: OTelSpan) => any;
    context?: {
      active?: () => any;
    };
  };
  context?: {
    active?: () => any;
  };
}

interface OTelSpan {
  spanContext?: () => OTelSpanContext;
  getSpanContext?: () => OTelSpanContext;
}

interface OTelSpanContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  isValid?: () => boolean;
}

/**
 * OpenTelemetry 集成类
 */
export class OpenTelemetryIntegration {
  private static otelApi: OTelAPI | null = null;
  private static initializationAttempted = false;
  private static isAvailable = false;

  /**
   * 初始化 OpenTelemetry 集成
   * 尝试加载 @opentelemetry/api 包
   */
  private static async initialize(): Promise<void> {
    if (this.initializationAttempted) {
      return;
    }

    this.initializationAttempted = true;

    try {
      // 尝试动态导入 @opentelemetry/api
      const otelModule = await import('@opentelemetry/api');
      
      if (otelModule && typeof otelModule === 'object') {
        this.otelApi = otelModule as OTelAPI;
        this.isAvailable = true;
        
        internalLogger.info('OpenTelemetry API 集成成功', {
          hasTrace: !!this.otelApi.trace,
          hasContext: !!this.otelApi.context,
          version: this.detectOTelVersion()
        });
      }
    } catch (error) {
      // OpenTelemetry 不可用，这是正常情况
      internalLogger.debug('OpenTelemetry API 不可用', {
        error: error instanceof Error ? error.message : String(error),
        reason: 'package_not_installed'
      });
      
      this.isAvailable = false;
    }
  }

  /**
   * 检测 OpenTelemetry 版本
   */
  private static detectOTelVersion(): string {
    try {
      // 尝试通过不同的方式检测版本
      if (typeof require !== 'undefined') {
        const pkg = require('@opentelemetry/api/package.json');
        return pkg.version || 'unknown';
      }
    } catch {
      // 忽略错误
    }
    
    return 'unknown';
  }

  /**
   * 检查 OpenTelemetry 是否可用
   */
  static async isOpenTelemetryAvailable(): Promise<boolean> {
    await this.initialize();
    return this.isAvailable;
  }

  /**
   * 获取当前活跃的 Span
   */
  private static async getActiveSpan(): Promise<OTelSpan | null> {
    await this.initialize();
    
    if (!this.isAvailable || !this.otelApi?.trace) {
      return null;
    }

    try {
      // 尝试不同的方法获取活跃 Span
      let activeSpan: OTelSpan | undefined;

      // 方法1: 直接获取活跃 Span
      if (this.otelApi.trace.getActiveSpan) {
        activeSpan = this.otelApi.trace.getActiveSpan();
      }

      // 方法2: 通过上下文获取 Span
      if (!activeSpan && this.otelApi.trace.getSpan && this.otelApi.context?.active) {
        const activeContext = this.otelApi.context.active();
        if (activeContext) {
          activeSpan = this.otelApi.trace.getSpan(activeContext);
        }
      }

      // 方法3: 通过 trace.context 获取
      if (!activeSpan && this.otelApi.trace.context?.active && this.otelApi.trace.getSpan) {
        const activeContext = this.otelApi.trace.context.active();
        if (activeContext) {
          activeSpan = this.otelApi.trace.getSpan(activeContext);
        }
      }

      return activeSpan || null;
    } catch (error) {
      internalLogger.debug('获取活跃 Span 失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return null;
    }
  }

  /**
   * 获取当前的 TraceId
   * @returns OpenTelemetry 生成的 TraceId，如果不可用则返回 null
   */
  static async getCurrentTraceId(): Promise<string | null> {
    const activeSpan = await this.getActiveSpan();
    
    if (!activeSpan) {
      return null;
    }

    try {
      // 尝试不同的方法获取 SpanContext
      let spanContext: OTelSpanContext | undefined;

      if (activeSpan.spanContext) {
        spanContext = activeSpan.spanContext();
      } else if (activeSpan.getSpanContext) {
        spanContext = activeSpan.getSpanContext();
      }

      if (!spanContext) {
        return null;
      }

      // 验证 SpanContext 是否有效
      if (spanContext.isValid && !spanContext.isValid()) {
        return null;
      }

      const traceId = spanContext.traceId;
      
      if (traceId && typeof traceId === 'string' && traceId.length > 0) {
        internalLogger.debug('获取到 OpenTelemetry TraceId', {
          traceId,
          length: traceId.length,
          traceFlags: spanContext.traceFlags
        });
        
        return traceId;
      }

      return null;
    } catch (error) {
      internalLogger.debug('解析 SpanContext 失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return null;
    }
  }

  /**
   * 获取当前的 SpanId
   * @returns OpenTelemetry 生成的 SpanId，如果不可用则返回 null
   */
  static async getCurrentSpanId(): Promise<string | null> {
    const activeSpan = await this.getActiveSpan();
    
    if (!activeSpan) {
      return null;
    }

    try {
      let spanContext: OTelSpanContext | undefined;

      if (activeSpan.spanContext) {
        spanContext = activeSpan.spanContext();
      } else if (activeSpan.getSpanContext) {
        spanContext = activeSpan.getSpanContext();
      }

      if (!spanContext) {
        return null;
      }

      // 验证 SpanContext 是否有效
      if (spanContext.isValid && !spanContext.isValid()) {
        return null;
      }

      const spanId = spanContext.spanId;
      
      if (spanId && typeof spanId === 'string' && spanId.length > 0) {
        internalLogger.debug('获取到 OpenTelemetry SpanId', {
          spanId,
          length: spanId.length
        });
        
        return spanId;
      }

      return null;
    } catch (error) {
      internalLogger.debug('解析 SpanId 失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return null;
    }
  }

  /**
   * 获取当前的 Trace 信息
   * @returns 包含 TraceId 和 SpanId 的对象，如果不可用则返回 null
   */
  static async getCurrentTraceInfo(): Promise<{
    traceId: string;
    spanId: string;
    traceFlags?: number;
  } | null> {
    const activeSpan = await this.getActiveSpan();
    
    if (!activeSpan) {
      return null;
    }

    try {
      let spanContext: OTelSpanContext | undefined;

      if (activeSpan.spanContext) {
        spanContext = activeSpan.spanContext();
      } else if (activeSpan.getSpanContext) {
        spanContext = activeSpan.getSpanContext();
      }

      if (!spanContext) {
        return null;
      }

      // 验证 SpanContext 是否有效
      if (spanContext.isValid && !spanContext.isValid()) {
        return null;
      }

      const { traceId, spanId, traceFlags } = spanContext;
      
      if (traceId && spanId && 
          typeof traceId === 'string' && typeof spanId === 'string' &&
          traceId.length > 0 && spanId.length > 0) {
        
        const traceInfo = {
          traceId,
          spanId,
          ...(traceFlags !== undefined && { traceFlags })
        };

        internalLogger.debug('获取到完整 OpenTelemetry Trace 信息', traceInfo);
        
        return traceInfo;
      }

      return null;
    } catch (error) {
      internalLogger.debug('获取 Trace 信息失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return null;
    }
  }

  /**
   * 检查 TraceId 格式是否符合 OpenTelemetry 标准
   * @param traceId 要检查的 TraceId
   * @returns 是否符合标准
   */
  static isValidOTelTraceId(traceId: string): boolean {
    // OpenTelemetry TraceId 应该是32位十六进制字符串
    const traceIdRegex = /^[0-9a-f]{32}$/i;
    const isValidFormat = traceIdRegex.test(traceId);
    const isNotAllZeros = traceId !== '00000000000000000000000000000000';
    
    return isValidFormat && isNotAllZeros;
  }

  /**
   * 检查 SpanId 格式是否符合 OpenTelemetry 标准
   * @param spanId 要检查的 SpanId
   * @returns 是否符合标准
   */
  static isValidOTelSpanId(spanId: string): boolean {
    // OpenTelemetry SpanId 应该是16位十六进制字符串
    const spanIdRegex = /^[0-9a-f]{16}$/i;
    const isValidFormat = spanIdRegex.test(spanId);
    const isNotAllZeros = spanId !== '0000000000000000';
    
    return isValidFormat && isNotAllZeros;
  }

  /**
   * 获取集成状态信息（用于调试）
   */
  static async getIntegrationStatus(): Promise<{
    available: boolean;
    initialized: boolean;
    hasActiveSpan: boolean;
    currentTraceInfo?: {
      traceId: string;
      spanId: string;
      traceFlags?: number;
    } | null;
  }> {
    await this.initialize();
    
    const activeSpan = await this.getActiveSpan();
    const currentTraceInfo = await this.getCurrentTraceInfo();
    
    return {
      available: this.isAvailable,
      initialized: this.initializationAttempted,
      hasActiveSpan: !!activeSpan,
      currentTraceInfo
    };
  }
}
