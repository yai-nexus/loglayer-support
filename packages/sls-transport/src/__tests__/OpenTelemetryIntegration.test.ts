/**
 * OpenTelemetry 集成测试
 */

import { OpenTelemetryIntegration } from '../OpenTelemetryIntegration';

// Mock @opentelemetry/api
const mockOTelAPI = {
  trace: {
    getActiveSpan: jest.fn(),
    getSpan: jest.fn(),
    context: {
      active: jest.fn()
    }
  },
  context: {
    active: jest.fn()
  }
};

const mockSpanContext = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '4bf92f3577b34da6',
  traceFlags: 1,
  isValid: () => true
};

const mockSpan = {
  spanContext: () => mockSpanContext,
  getSpanContext: () => mockSpanContext
};

// Mock dynamic import
jest.mock('@opentelemetry/api', () => mockOTelAPI, { virtual: true });

describe('OpenTelemetryIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static state
    (OpenTelemetryIntegration as any).otelApi = null;
    (OpenTelemetryIntegration as any).initializationAttempted = false;
    (OpenTelemetryIntegration as any).isAvailable = false;
  });

  describe('初始化', () => {
    it('应该检测到 OpenTelemetry 可用性', async () => {
      const isAvailable = await OpenTelemetryIntegration.isOpenTelemetryAvailable();
      expect(isAvailable).toBe(true);
    });

    it('应该获取集成状态', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(mockSpan);
      
      const status = await OpenTelemetryIntegration.getIntegrationStatus();
      
      expect(status.available).toBe(true);
      expect(status.initialized).toBe(true);
      expect(status.hasActiveSpan).toBe(true);
      expect(status.currentTraceInfo).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '4bf92f3577b34da6',
        traceFlags: 1
      });
    });
  });

  describe('TraceId 获取', () => {
    it('应该从活跃 Span 获取 TraceId', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(mockSpan);
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(mockOTelAPI.trace.getActiveSpan).toHaveBeenCalled();
    });

    it('应该从上下文获取 TraceId 当 getActiveSpan 不可用时', async () => {
      mockOTelAPI.trace.getActiveSpan = undefined;
      mockOTelAPI.trace.getSpan.mockReturnValue(mockSpan);
      mockOTelAPI.context.active.mockReturnValue({});
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(mockOTelAPI.trace.getSpan).toHaveBeenCalled();
      expect(mockOTelAPI.context.active).toHaveBeenCalled();
    });

    it('应该返回 null 当没有活跃 Span 时', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(undefined);
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBeNull();
    });

    it('应该返回 null 当 SpanContext 无效时', async () => {
      const invalidSpan = {
        spanContext: () => ({
          ...mockSpanContext,
          isValid: () => false
        })
      };
      
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(invalidSpan);
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBeNull();
    });
  });

  describe('SpanId 获取', () => {
    it('应该从活跃 Span 获取 SpanId', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(mockSpan);
      
      const spanId = await OpenTelemetryIntegration.getCurrentSpanId();
      
      expect(spanId).toBe('4bf92f3577b34da6');
    });

    it('应该返回 null 当没有活跃 Span 时', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(undefined);
      
      const spanId = await OpenTelemetryIntegration.getCurrentSpanId();
      
      expect(spanId).toBeNull();
    });
  });

  describe('完整 Trace 信息获取', () => {
    it('应该获取完整的 Trace 信息', async () => {
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(mockSpan);
      
      const traceInfo = await OpenTelemetryIntegration.getCurrentTraceInfo();
      
      expect(traceInfo).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '4bf92f3577b34da6',
        traceFlags: 1
      });
    });

    it('应该处理没有 traceFlags 的情况', async () => {
      const spanWithoutFlags = {
        spanContext: () => ({
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          spanId: '4bf92f3577b34da6',
          isValid: () => true
        })
      };
      
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(spanWithoutFlags);
      
      const traceInfo = await OpenTelemetryIntegration.getCurrentTraceInfo();
      
      expect(traceInfo).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '4bf92f3577b34da6'
      });
    });
  });

  describe('ID 格式验证', () => {
    it('应该验证有效的 TraceId', () => {
      const validTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const invalidTraceId1 = '4bf92f3577b34da6a3ce929d0e0e473'; // 太短
      const invalidTraceId2 = '4bf92f3577b34da6a3ce929d0e0e4736x'; // 非十六进制
      const invalidTraceId3 = '00000000000000000000000000000000'; // 全零
      
      expect(OpenTelemetryIntegration.isValidOTelTraceId(validTraceId)).toBe(true);
      expect(OpenTelemetryIntegration.isValidOTelTraceId(invalidTraceId1)).toBe(false);
      expect(OpenTelemetryIntegration.isValidOTelTraceId(invalidTraceId2)).toBe(false);
      expect(OpenTelemetryIntegration.isValidOTelTraceId(invalidTraceId3)).toBe(false);
    });

    it('应该验证有效的 SpanId', () => {
      const validSpanId = '4bf92f3577b34da6';
      const invalidSpanId1 = '4bf92f3577b34da'; // 太短
      const invalidSpanId2 = '4bf92f3577b34da6x'; // 非十六进制
      const invalidSpanId3 = '0000000000000000'; // 全零
      
      expect(OpenTelemetryIntegration.isValidOTelSpanId(validSpanId)).toBe(true);
      expect(OpenTelemetryIntegration.isValidOTelSpanId(invalidSpanId1)).toBe(false);
      expect(OpenTelemetryIntegration.isValidOTelSpanId(invalidSpanId2)).toBe(false);
      expect(OpenTelemetryIntegration.isValidOTelSpanId(invalidSpanId3)).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该处理 getActiveSpan 抛出的错误', async () => {
      mockOTelAPI.trace.getActiveSpan.mockImplementation(() => {
        throw new Error('Mock error');
      });
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBeNull();
    });

    it('应该处理 spanContext 抛出的错误', async () => {
      const errorSpan = {
        spanContext: () => {
          throw new Error('SpanContext error');
        }
      };
      
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(errorSpan);
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBeNull();
    });
  });

  describe('不同版本兼容性', () => {
    it('应该支持 getSpanContext 方法', async () => {
      const spanWithGetSpanContext = {
        getSpanContext: () => mockSpanContext
      };
      
      mockOTelAPI.trace.getActiveSpan.mockReturnValue(spanWithGetSpanContext);
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    });

    it('应该支持 trace.context.active 方法', async () => {
      mockOTelAPI.trace.getActiveSpan = undefined;
      mockOTelAPI.trace.getSpan.mockReturnValue(mockSpan);
      mockOTelAPI.trace.context.active.mockReturnValue({});
      
      const traceId = await OpenTelemetryIntegration.getCurrentTraceId();
      
      expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(mockOTelAPI.trace.context.active).toHaveBeenCalled();
    });
  });
});
