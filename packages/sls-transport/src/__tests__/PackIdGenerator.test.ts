/**
 * PackID 生成器测试
 */

import { PackIdGenerator, getGlobalPackIdGenerator, resetGlobalPackIdGenerator, generatePackId } from '../PackIdGenerator';

describe('PackIdGenerator', () => {
  beforeEach(() => {
    resetGlobalPackIdGenerator();
  });

  describe('PackIdGenerator 类', () => {
    it('应该生成正确格式的PackID', () => {
      const generator = new PackIdGenerator();
      const packId = generator.generateNewPackId();
      
      // 验证格式：前缀-组ID
      expect(packId).toMatch(/^[A-F0-9]{16}-[A-F0-9]+$/);
    });

    it('应该生成递增的批次ID', () => {
      const generator = new PackIdGenerator();
      const packId1 = generator.generateNewPackId();
      const packId2 = generator.generateNewPackId();
      
      const [prefix1, batchId1] = packId1.split('-');
      const [prefix2, batchId2] = packId2.split('-');
      
      // 同一生成器的前缀应该相同
      expect(prefix1).toBe(prefix2);
      
      // 批次ID应该递增
      expect(parseInt(batchId2, 16)).toBe(parseInt(batchId1, 16) + 1);
    });

    it('应该返回正确的上下文前缀', () => {
      const generator = new PackIdGenerator();
      const prefix = generator.getContextPrefix();
      
      expect(prefix).toMatch(/^[A-F0-9]{16}$/);
    });

    it('应该返回正确的当前批次ID', () => {
      const generator = new PackIdGenerator();
      
      expect(generator.getCurrentBatchId()).toBe(0);
      
      generator.generateNewPackId();
      expect(generator.getCurrentBatchId()).toBe(1);
      
      generator.generateNewPackId();
      expect(generator.getCurrentBatchId()).toBe(2);
    });
  });

  describe('全局PackID生成器', () => {
    it('应该返回同一个实例', () => {
      const generator1 = getGlobalPackIdGenerator();
      const generator2 = getGlobalPackIdGenerator();
      
      expect(generator1).toBe(generator2);
    });

    it('应该生成连续的PackID', () => {
      const packId1 = generatePackId();
      const packId2 = generatePackId();
      
      const [prefix1, batchId1] = packId1.split('-');
      const [prefix2, batchId2] = packId2.split('-');
      
      expect(prefix1).toBe(prefix2);
      expect(parseInt(batchId2, 16)).toBe(parseInt(batchId1, 16) + 1);
    });

    it('重置后应该创建新的生成器', () => {
      const generator1 = getGlobalPackIdGenerator();
      const prefix1 = generator1.getContextPrefix();
      
      resetGlobalPackIdGenerator();
      
      const generator2 = getGlobalPackIdGenerator();
      const prefix2 = generator2.getContextPrefix();
      
      expect(generator1).not.toBe(generator2);
      // 前缀可能不同（基于时间戳）
    });
  });

  describe('不同实例的PackID', () => {
    it('不同生成器应该有不同的前缀', () => {
      const generator1 = new PackIdGenerator();
      const generator2 = new PackIdGenerator();
      
      const prefix1 = generator1.getContextPrefix();
      const prefix2 = generator2.getContextPrefix();
      
      // 由于时间戳不同，前缀应该不同
      expect(prefix1).not.toBe(prefix2);
    });
  });
});
