/**
 * TraceId 生成器测试
 */

import { 
  TraceIdGenerator, 
  traceContext, 
  generateTraceId, 
  generateSpanId, 
  getOrGenerateTraceId, 
  getOrGenerateSpanId 
} from '../TraceIdGenerator';

describe('TraceIdGenerator', () => {
  beforeEach(() => {
    traceContext.clearCurrentTrace();
  });

  describe('TraceId 生成', () => {
    it('应该生成正确格式的TraceId', () => {
      const traceId = TraceIdGenerator.generateTraceId();
      
      // 验证格式：32位十六进制字符串
      expect(traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(traceId.length).toBe(32);
    });

    it('应该生成不同的TraceId', () => {
      const traceId1 = TraceIdGenerator.generateTraceId();
      const traceId2 = TraceIdGenerator.generateTraceId();
      
      expect(traceId1).not.toBe(traceId2);
    });

    it('应该验证TraceId格式', () => {
      const validTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const invalidTraceId1 = '4bf92f3577b34da6a3ce929d0e0e473'; // 太短
      const invalidTraceId2 = '4bf92f3577b34da6a3ce929d0e0e4736x'; // 包含非十六进制字符
      const invalidTraceId3 = '00000000000000000000000000000000'; // 全为0
      
      expect(TraceIdGenerator.isValidTraceId(validTraceId)).toBe(true);
      expect(TraceIdGenerator.isValidTraceId(invalidTraceId1)).toBe(false);
      expect(TraceIdGenerator.isValidTraceId(invalidTraceId2)).toBe(false);
      expect(TraceIdGenerator.isValidTraceId(invalidTraceId3)).toBe(false);
    });
  });

  describe('SpanId 生成', () => {
    it('应该生成正确格式的SpanId', () => {
      const spanId = TraceIdGenerator.generateSpanId();
      
      // 验证格式：16位十六进制字符串
      expect(spanId).toMatch(/^[0-9a-f]{16}$/);
      expect(spanId.length).toBe(16);
    });

    it('应该生成不同的SpanId', () => {
      const spanId1 = TraceIdGenerator.generateSpanId();
      const spanId2 = TraceIdGenerator.generateSpanId();
      
      expect(spanId1).not.toBe(spanId2);
    });

    it('应该验证SpanId格式', () => {
      const validSpanId = '4bf92f3577b34da6';
      const invalidSpanId1 = '4bf92f3577b34da'; // 太短
      const invalidSpanId2 = '4bf92f3577b34da6x'; // 包含非十六进制字符
      const invalidSpanId3 = '0000000000000000'; // 全为0
      
      expect(TraceIdGenerator.isValidSpanId(validSpanId)).toBe(true);
      expect(TraceIdGenerator.isValidSpanId(invalidSpanId1)).toBe(false);
      expect(TraceIdGenerator.isValidSpanId(invalidSpanId2)).toBe(false);
      expect(TraceIdGenerator.isValidSpanId(invalidSpanId3)).toBe(false);
    });
  });

  describe('Trace上下文管理', () => {
    it('应该设置和获取当前Trace', () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const spanId = '4bf92f3577b34da6';
      
      traceContext.setCurrentTrace(traceId, spanId);
      
      expect(traceContext.getCurrentTraceId()).toBe(traceId);
      expect(traceContext.getCurrentSpanId()).toBe(spanId);
    });

    it('应该清除当前Trace', () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const spanId = '4bf92f3577b34da6';
      
      traceContext.setCurrentTrace(traceId, spanId);
      traceContext.clearCurrentTrace();
      
      expect(traceContext.getCurrentTraceId()).toBeNull();
      expect(traceContext.getCurrentSpanId()).toBeNull();
    });

    it('应该生成新的Trace上下文', () => {
      const { traceId, spanId } = traceContext.generateNewTrace();
      
      expect(TraceIdGenerator.isValidTraceId(traceId)).toBe(true);
      expect(TraceIdGenerator.isValidSpanId(spanId)).toBe(true);
      expect(traceContext.getCurrentTraceId()).toBe(traceId);
      expect(traceContext.getCurrentSpanId()).toBe(spanId);
    });
  });

  describe('便捷函数', () => {
    it('generateTraceId 应该生成有效的TraceId', () => {
      const traceId = generateTraceId();
      expect(TraceIdGenerator.isValidTraceId(traceId)).toBe(true);
    });

    it('generateSpanId 应该生成有效的SpanId', () => {
      const spanId = generateSpanId();
      expect(TraceIdGenerator.isValidSpanId(spanId)).toBe(true);
    });

    it('getOrGenerateTraceId 应该返回当前TraceId或生成新的', () => {
      // 没有当前TraceId时应该生成新的
      const traceId1 = getOrGenerateTraceId();
      expect(TraceIdGenerator.isValidTraceId(traceId1)).toBe(true);
      
      // 有当前TraceId时应该返回相同的
      const traceId2 = getOrGenerateTraceId();
      expect(traceId2).toBe(traceId1);
      
      // 清除后应该生成新的
      traceContext.clearCurrentTrace();
      const traceId3 = getOrGenerateTraceId();
      expect(traceId3).not.toBe(traceId1);
      expect(TraceIdGenerator.isValidTraceId(traceId3)).toBe(true);
    });

    it('getOrGenerateSpanId 应该返回当前SpanId或生成新的', () => {
      // 没有当前SpanId时应该生成新的
      const spanId1 = getOrGenerateSpanId();
      expect(TraceIdGenerator.isValidSpanId(spanId1)).toBe(true);
      
      // 设置Trace上下文后应该返回相同的SpanId
      const traceId = generateTraceId();
      traceContext.setCurrentTrace(traceId, spanId1);
      const spanId2 = getOrGenerateSpanId();
      expect(spanId2).toBe(spanId1);
    });
  });

  describe('ID解析', () => {
    it('应该解析有效的TraceId和SpanId', () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const spanId = '4bf92f3577b34da6';
      
      const result = TraceIdGenerator.parseIds(traceId, spanId);
      
      expect(result.traceId.value).toBe(traceId);
      expect(result.traceId.valid).toBe(true);
      expect(result.spanId?.value).toBe(spanId);
      expect(result.spanId?.valid).toBe(true);
    });

    it('应该识别无效的ID', () => {
      const invalidTraceId = 'invalid-trace-id';
      const invalidSpanId = 'invalid-span-id';
      
      const result = TraceIdGenerator.parseIds(invalidTraceId, invalidSpanId);
      
      expect(result.traceId.valid).toBe(false);
      expect(result.spanId?.valid).toBe(false);
    });
  });
});
