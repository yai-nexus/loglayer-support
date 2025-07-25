/**
 * 性能优化系统单元测试
 */

import {
  SmartBatcher,
  FastSerializer,
  MemoryManager,
  PerformanceManager,
  createPerformanceManager
} from '../performance'

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
} as any

// Mock process.memoryUsage for Node.js environment
global.process = {
  memoryUsage: jest.fn(() => ({
    rss: 50 * 1024 * 1024, // 50MB
    heapTotal: 40 * 1024 * 1024, // 40MB
    heapUsed: 30 * 1024 * 1024, // 30MB
    external: 5 * 1024 * 1024, // 5MB
    arrayBuffers: 1 * 1024 * 1024 // 1MB
  }))
} as any

describe('SmartBatcher', () => {
  let processor: jest.Mock
  let batcher: SmartBatcher<string>

  beforeEach(() => {
    processor = jest.fn().mockResolvedValue(undefined)
    batcher = new SmartBatcher(processor, {
      maxBatchSize: 5,
      batchTimeout: 100,
      adaptive: false
    })
  })

  afterEach(async () => {
    await batcher.destroy()
  })

  describe('基础功能', () => {
    it('应该能够创建批处理器', () => {
      expect(batcher).toBeDefined()
      expect(typeof batcher.add).toBe('function')
      expect(typeof batcher.flush).toBe('function')
    })

    it('应该在达到最大批次大小时自动处理', async () => {
      // 添加项目直到达到最大批次大小
      for (let i = 0; i < 5; i++) {
        batcher.add(`item-${i}`)
      }

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith([
        'item-0', 'item-1', 'item-2', 'item-3', 'item-4'
      ])
    })

    it('应该在超时时自动处理', async () => {
      batcher.add('item-1')
      batcher.add('item-2')

      // 等待超时
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith(['item-1', 'item-2'])
    })

    it('应该能够手动刷新', async () => {
      batcher.add('item-1')
      batcher.add('item-2')

      await batcher.flush()

      expect(processor).toHaveBeenCalledTimes(1)
      expect(processor).toHaveBeenCalledWith(['item-1', 'item-2'])
    })
  })

  describe('自适应批处理', () => {
    it('应该根据效率调整超时时间', async () => {
      const adaptiveBatcher = new SmartBatcher(processor, {
        maxBatchSize: 10,
        batchTimeout: 100,
        adaptive: true
      })

      // 模拟高效率场景
      for (let i = 0; i < 8; i++) {
        adaptiveBatcher.add(`item-${i}`)
      }
      await adaptiveBatcher.flush()

      const stats = adaptiveBatcher.getStats()
      expect(stats.efficiency).toBeGreaterThan(0.5)

      await adaptiveBatcher.destroy()
    })
  })

  describe('统计信息', () => {
    it('应该提供准确的统计信息', async () => {
      // 第一批
      for (let i = 0; i < 5; i++) {
        batcher.add(`batch1-item-${i}`)
      }
      await new Promise(resolve => setTimeout(resolve, 50))

      // 第二批
      for (let i = 0; i < 3; i++) {
        batcher.add(`batch2-item-${i}`)
      }
      await batcher.flush()

      const stats = batcher.getStats()
      expect(stats.totalBatches).toBe(2)
      expect(stats.averageBatchSize).toBe(4) // (5 + 3) / 2
      expect(stats.efficiency).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    it('应该处理处理器中的错误', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const failingProcessor = jest.fn().mockRejectedValue(new Error('Processing failed'))
      const errorBatcher = new SmartBatcher(failingProcessor, { maxBatchSize: 2 })

      errorBatcher.add('item-1')
      errorBatcher.add('item-2')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(failingProcessor).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Batch processing failed:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
      await errorBatcher.destroy()
    })
  })
})

describe('FastSerializer', () => {
  let serializer: FastSerializer

  beforeEach(() => {
    serializer = new FastSerializer({
      fastMode: true,
      caching: true,
      cacheSize: 100
    })
  })

  afterEach(() => {
    serializer.destroy()
  })

  describe('基础功能', () => {
    it('应该能够序列化简单对象', () => {
      const obj = { name: 'test', value: 123 }
      const result = serializer.serialize(obj)

      expect(result).toBe('{"name":"test","value":123}')
    })

    it('应该能够序列化复杂对象', () => {
      const obj = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { a: 1, b: 2 }
      }

      const result = serializer.serialize(obj)
      const parsed = JSON.parse(result)

      expect(parsed).toEqual(obj)
    })

    it('应该能够序列化日期对象', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const result = serializer.serialize(date)

      expect(result).toBe('"2023-01-01T00:00:00.000Z"')
    })
  })

  describe('缓存功能', () => {
    it('应该缓存序列化结果', () => {
      const obj = { test: 'data' }
      const cacheKey = 'test-key'

      const result1 = serializer.serialize(obj, cacheKey)
      const result2 = serializer.serialize(obj, cacheKey)

      expect(result1).toBe(result2)

      const stats = serializer.getStats()
      expect(stats.totalOperations).toBe(2)
      expect(stats.cacheHitRate).toBe(0.5) // 1 hit out of 2 operations
    })

    it('应该在缓存满时删除旧条目', () => {
      const smallCacheSerializer = new FastSerializer({
        caching: true,
        cacheSize: 2
      })

      smallCacheSerializer.serialize({ a: 1 }, 'key1')
      smallCacheSerializer.serialize({ b: 2 }, 'key2')
      smallCacheSerializer.serialize({ c: 3 }, 'key3') // 应该删除 key1

      // 验证 key1 不再在缓存中
      smallCacheSerializer.serialize({ a: 1 }, 'key1') // 应该重新计算
      const stats = smallCacheSerializer.getStats()
      expect(stats.cacheHitRate).toBeLessThan(1)

      smallCacheSerializer.destroy()
    })
  })

  describe('性能模式', () => {
    it('快速模式应该产生正确的结果', () => {
      const fastSerializer = new FastSerializer({ fastMode: true })
      const standardSerializer = new FastSerializer({ fastMode: false })

      const obj = { name: 'test', value: 123, nested: { a: 1 } }

      const fastResult = fastSerializer.serialize(obj)
      const standardResult = standardSerializer.serialize(obj)

      expect(JSON.parse(fastResult)).toEqual(JSON.parse(standardResult))

      fastSerializer.destroy()
      standardSerializer.destroy()
    })
  })

  describe('统计信息', () => {
    it('应该提供准确的统计信息', () => {
      serializer.serialize({ a: 1 }, 'key1')
      serializer.serialize({ b: 2 }, 'key2')
      serializer.serialize({ a: 1 }, 'key1') // 缓存命中

      const stats = serializer.getStats()
      expect(stats.totalOperations).toBe(3)
      expect(stats.cacheHitRate).toBeCloseTo(0.33, 2) // 1/3
      expect(stats.averageSerializationTime).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('MemoryManager', () => {
  let memoryManager: MemoryManager

  beforeEach(() => {
    memoryManager = new MemoryManager({
      maxMemoryUsage: 50, // 50MB
      checkInterval: 100, // 100ms for testing
      compression: true
    })
  })

  afterEach(() => {
    memoryManager.destroy()
  })

  describe('基础功能', () => {
    it('应该能够创建内存管理器', () => {
      expect(memoryManager).toBeDefined()
      expect(typeof memoryManager.compress).toBe('function')
      expect(typeof memoryManager.getStats).toBe('function')
    })

    it('应该能够压缩数据', () => {
      const data = {
        message: 'test message',
        metadata: { key: 'value' },
        timestamp: '2023-01-01T00:00:00.000Z'
      }

      const compressed = memoryManager.compress(data)
      expect(typeof compressed).toBe('string')

      const parsed = JSON.parse(compressed)
      expect(parsed).toEqual(data)
    })

    it('压缩应该减少数据大小', () => {
      const largeData = {
        message: 'test message with lots of spaces    and    repeated    content',
        metadata: { key: 'value', another: 'value' },
        array: [1, 2, 3, 4, 5]
      }

      const original = JSON.stringify(largeData)
      const compressed = memoryManager.compress(largeData)

      expect(compressed.length).toBeLessThanOrEqual(original.length)
    })
  })

  describe('内存监控', () => {
    it('应该提供内存使用统计', () => {
      const stats = memoryManager.getStats()

      expect(stats).toBeDefined()
      expect(typeof stats.currentUsage).toBe('number')
      expect(typeof stats.peakUsage).toBe('number')
      expect(typeof stats.compressionRatio).toBe('number')
      expect(stats.currentUsage).toBeGreaterThanOrEqual(0)
    })

    it('应该跟踪峰值内存使用', async () => {
      const initialStats = memoryManager.getStats()
      const initialPeak = initialStats.peakUsage

      // 等待内存检查
      await new Promise(resolve => setTimeout(resolve, 150))

      const updatedStats = memoryManager.getStats()
      expect(updatedStats.peakUsage).toBeGreaterThanOrEqual(initialPeak)
    })
  })
})

describe('PerformanceManager', () => {
  let performanceManager: PerformanceManager

  beforeEach(() => {
    performanceManager = createPerformanceManager({
      enabled: true,
      batching: { maxBatchSize: 10, batchTimeout: 100 },
      memory: { maxMemoryUsage: 50, checkInterval: 100 },
      serialization: { fastMode: true, caching: true }
    })
  })

  afterEach(async () => {
    await performanceManager.destroy()
  })

  describe('基础功能', () => {
    it('应该能够创建性能管理器', () => {
      expect(performanceManager).toBeDefined()
      expect(typeof performanceManager.getBatcher).toBe('function')
      expect(typeof performanceManager.getMemoryManager).toBe('function')
      expect(typeof performanceManager.getSerializer).toBe('function')
    })

    it('应该提供所有性能组件', () => {
      const batcher = performanceManager.getBatcher()
      const memoryManager = performanceManager.getMemoryManager()
      const serializer = performanceManager.getSerializer()

      expect(batcher).toBeInstanceOf(SmartBatcher)
      expect(memoryManager).toBeInstanceOf(MemoryManager)
      expect(serializer).toBeInstanceOf(FastSerializer)
    })

    it('应该提供综合统计信息', () => {
      const stats = performanceManager.getStats()

      expect(stats).toBeDefined()
      expect(stats.batching).toBeDefined()
      expect(stats.memory).toBeDefined()
      expect(stats.serialization).toBeDefined()
      expect(typeof stats.totalProcessingTime).toBe('number')
      expect(typeof stats.averageProcessingTime).toBe('number')
    })
  })

  describe('集成功能', () => {
    it('所有组件应该协同工作', async () => {
      const batcher = performanceManager.getBatcher()
      const serializer = performanceManager.getSerializer()
      const memoryManager = performanceManager.getMemoryManager()

      // 测试序列化
      const data = { test: 'data' }
      const serialized = serializer.serialize(data, 'test-key')
      expect(serialized).toBeDefined()

      // 测试压缩
      const compressed = memoryManager.compress(data)
      expect(compressed).toBeDefined()

      // 测试批处理
      batcher.add(data)
      await batcher.flush()

      const stats = performanceManager.getStats()
      expect(stats.serialization.totalOperations).toBeGreaterThan(0)
    })
  })
})
