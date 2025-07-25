/**
 * 内存管理性能基准测试
 */

import { MemoryManager } from '../../core/performance'
import { PerformanceBenchmark, TestDataGenerator } from './benchmark-utils'

// Mock performance API
global.performance = global.performance || {
  now: () => Date.now()
} as any

// Mock process.memoryUsage for consistent testing
const mockMemoryUsage = jest.fn(() => ({
  rss: 50 * 1024 * 1024,
  heapTotal: 40 * 1024 * 1024,
  heapUsed: 30 * 1024 * 1024,
  external: 5 * 1024 * 1024,
  arrayBuffers: 1 * 1024 * 1024
}))

global.process = {
  ...global.process,
  memoryUsage: mockMemoryUsage
} as any

describe('内存管理性能基准测试', () => {
  beforeEach(() => {
    mockMemoryUsage.mockClear()
  })

  describe('压缩性能测试', () => {
    const dataTypes: Array<{ name: string, type: 'simple' | 'complex' | 'large' }> = [
      { name: '简单数据', type: 'simple' },
      { name: '复杂数据', type: 'complex' },
      { name: '大型数据', type: 'large' }
    ]

    dataTypes.forEach(({ name, type }) => {
      it(`${name}压缩性能测试`, async () => {
        const benchmark = new PerformanceBenchmark({
          iterations: 100,
          warmupIterations: 10,
          verbose: false
        })

        const memoryManager = new MemoryManager({
          maxMemoryUsage: 100,
          checkInterval: 1000,
          compression: true
        })

        const testData = TestDataGenerator.generateBatch(1, type)[0]
        const originalSize = JSON.stringify(testData).length

        const result = await benchmark.run(
          `${name}压缩`,
          () => {
            return memoryManager.compress(testData)
          }
        )

        const compressedData = memoryManager.compress(testData)
        const compressedSize = compressedData.length
        const compressionRatio = (1 - compressedSize / originalSize) * 100

        console.log(`${name}压缩: ${result.averageTime.toFixed(3)}ms, 压缩率: ${compressionRatio.toFixed(1)}%`)

        // 性能要求
        expect(result.averageTime).toBeLessThan(50) // 50ms内完成
        expect(result.throughput).toBeGreaterThan(20) // 至少20 ops/sec

        memoryManager.destroy()
      })
    })
  })

  describe('压缩率测试', () => {
    it('应该有效压缩重复数据', async () => {
      const memoryManager = new MemoryManager({
        compression: true
      })

      // 创建包含大量重复数据的对象
      const repetitiveData = {
        message: 'This is a repeated message that appears many times',
        metadata: {
          repeated: new Array(100).fill('repeated value'),
          numbers: new Array(50).fill(42),
          objects: new Array(20).fill({
            id: 'same-id',
            name: 'same-name',
            value: 'same-value'
          })
        }
      }

      const originalData = JSON.stringify(repetitiveData)
      const compressedData = memoryManager.compress(repetitiveData)

      const originalSize = originalData.length
      const compressedSize = compressedData.length
      const compressionRatio = (1 - compressedSize / originalSize) * 100

      console.log(`重复数据压缩统计:`)
      console.log(`  原始大小: ${originalSize} bytes`)
      console.log(`  压缩大小: ${compressedSize} bytes`)
      console.log(`  压缩率: ${compressionRatio.toFixed(2)}%`)

      // 重复数据应该有较好的压缩效果
      expect(compressionRatio).toBeGreaterThan(10) // 至少10%压缩率

      // 验证数据完整性
      const decompressed = JSON.parse(compressedData)
      expect(decompressed).toEqual(repetitiveData)

      memoryManager.destroy()
    })
  })

  describe('内存监控性能', () => {
    it('应该高效监控内存使用', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 50,
        warmupIterations: 5,
        verbose: true
      })

      let memoryManager: MemoryManager

      const result = await benchmark.run(
        '内存监控',
        () => {
          memoryManager = new MemoryManager({
            maxMemoryUsage: 50,
            checkInterval: 10, // 快速检查间隔
            compression: true
          })

          // 获取内存统计
          const stats = memoryManager.getStats()
          return stats
        },
        undefined,
        () => {
          if (memoryManager) {
            memoryManager.destroy()
          }
        }
      )

      console.log(`内存监控性能: ${result.averageTime.toFixed(3)}ms`)

      // 内存监控应该非常快
      expect(result.averageTime).toBeLessThan(10) // 10ms内完成
      expect(result.throughput).toBeGreaterThan(100) // 至少100 ops/sec
    })
  })

  describe('内存清理性能', () => {
    it('应该高效执行内存清理', async () => {
      const memoryManager = new MemoryManager({
        maxMemoryUsage: 30, // 较低的限制触发清理
        checkInterval: 50,
        compression: true
      })

      const benchmark = new PerformanceBenchmark({
        iterations: 20,
        warmupIterations: 2,
        trackMemory: true,
        verbose: true
      })

      // 模拟内存使用增长
      let currentMemory = 25
      mockMemoryUsage.mockImplementation(() => ({
        rss: currentMemory * 1024 * 1024,
        heapTotal: currentMemory * 1024 * 1024 * 0.8,
        heapUsed: currentMemory * 1024 * 1024 * 0.6,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024
      }))

      const result = await benchmark.run(
        '内存清理',
        async () => {
          // 模拟内存增长
          currentMemory += 2

          // 创建一些数据进行压缩
          const testData = TestDataGenerator.generateBatch(10, 'complex')
          const compressed = testData.map(data => memoryManager.compress(data))

          // 等待内存检查周期
          await new Promise(resolve => setTimeout(resolve, 60))

          return compressed
        },
        () => {
          currentMemory = 25 // 重置内存
        }
      )

      const stats = memoryManager.getStats()
      console.log(`内存清理统计:`)
      console.log(`  平均清理时间: ${result.averageTime.toFixed(2)}ms`)
      console.log(`  当前内存使用: ${stats.currentUsage.toFixed(2)}MB`)
      console.log(`  峰值内存使用: ${stats.peakUsage.toFixed(2)}MB`)
      console.log(`  压缩率: ${(stats.compressionRatio * 100).toFixed(2)}%`)

      memoryManager.destroy()
    }, 10000)
  })

  describe('大数据集内存管理', () => {
    it('应该高效管理大数据集的内存', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 5,
        warmupIterations: 1,
        trackMemory: true,
        verbose: true
      })

      const memoryManager = new MemoryManager({
        maxMemoryUsage: 100,
        checkInterval: 100,
        compression: true
      })

      const largeDataSet = TestDataGenerator.generateBatch(500, 'large')

      const result = await benchmark.run(
        '大数据集内存管理',
        () => {
          const compressed = largeDataSet.map((data, index) => 
            memoryManager.compress(data)
          )
          return compressed
        },
        undefined,
        () => {
          // 强制垃圾回收
          if (global.gc) {
            global.gc()
          }
        }
      )

      const stats = memoryManager.getStats()
      console.log(`大数据集内存管理统计:`)
      console.log(`  处理时间: ${result.averageTime.toFixed(2)}ms`)
      console.log(`  内存增长: ${result.memoryUsage.delta.toFixed(2)}MB`)
      console.log(`  压缩率: ${(stats.compressionRatio * 100).toFixed(2)}%`)

      // 性能要求
      expect(result.averageTime).toBeLessThan(30000) // 30秒内完成
      expect(result.memoryUsage.delta).toBeLessThan(200) // 内存增长不超过200MB

      memoryManager.destroy()
    }, 60000)
  })

  describe('并发内存管理', () => {
    it('应该支持并发内存操作', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 3,
        warmupIterations: 1,
        verbose: true
      })

      const memoryManager = new MemoryManager({
        maxMemoryUsage: 80,
        checkInterval: 50,
        compression: true
      })

      const concurrentTasks = 20
      const itemsPerTask = 10

      const result = await benchmark.run(
        '并发内存管理',
        async () => {
          const tasks = Array.from({ length: concurrentTasks }, async (_, taskIndex) => {
            const testData = TestDataGenerator.generateBatch(itemsPerTask, 'complex')
            
            const compressed = testData.map((data, itemIndex) => 
              memoryManager.compress(data)
            )
            
            return compressed
          })

          const results = await Promise.all(tasks)
          return results.flat()
        }
      )

      const stats = memoryManager.getStats()
      console.log(`并发内存管理统计:`)
      console.log(`  处理时间: ${result.averageTime.toFixed(2)}ms`)
      console.log(`  吞吐量: ${result.throughput.toFixed(0)} ops/sec`)
      console.log(`  压缩率: ${(stats.compressionRatio * 100).toFixed(2)}%`)

      // 性能要求
      expect(result.averageTime).toBeLessThan(15000) // 15秒内完成
      expect(result.throughput).toBeGreaterThan(5) // 至少5 ops/sec

      memoryManager.destroy()
    }, 30000)
  })

  describe('内存泄漏检测', () => {
    it('应该检测内存泄漏', async () => {
      const memoryManager = new MemoryManager({
        maxMemoryUsage: 50,
        checkInterval: 100,
        compression: true
      })

      // 模拟内存持续增长（泄漏）
      let memoryGrowth = 0
      mockMemoryUsage.mockImplementation(() => {
        memoryGrowth += 1
        return {
          rss: (30 + memoryGrowth) * 1024 * 1024,
          heapTotal: (25 + memoryGrowth) * 1024 * 1024,
          heapUsed: (20 + memoryGrowth) * 1024 * 1024,
          external: 5 * 1024 * 1024,
          arrayBuffers: 1 * 1024 * 1024
        }
      })

      // 运行一段时间观察内存变化
      const iterations = 10
      const initialStats = memoryManager.getStats()

      for (let i = 0; i < iterations; i++) {
        const testData = TestDataGenerator.generateComplexLog()
        memoryManager.compress(testData)
        await new Promise(resolve => setTimeout(resolve, 120)) // 等待内存检查
      }

      const finalStats = memoryManager.getStats()

      console.log(`内存泄漏检测:`)
      console.log(`  初始内存: ${initialStats.currentUsage.toFixed(2)}MB`)
      console.log(`  最终内存: ${finalStats.currentUsage.toFixed(2)}MB`)
      console.log(`  峰值内存: ${finalStats.peakUsage.toFixed(2)}MB`)
      console.log(`  内存增长: ${(finalStats.currentUsage - initialStats.currentUsage).toFixed(2)}MB`)

      // 验证内存监控功能
      expect(finalStats.peakUsage).toBeGreaterThan(initialStats.currentUsage)
      expect(finalStats.currentUsage).toBeGreaterThan(initialStats.currentUsage)

      memoryManager.destroy()
    }, 15000)
  })

  describe('内存统计准确性', () => {
    it('应该提供准确的内存统计', async () => {
      const memoryManager = new MemoryManager({
        maxMemoryUsage: 60,
        checkInterval: 200,
        compression: true
      })

      // 执行一些内存操作
      const testData = TestDataGenerator.generateBatch(50, 'complex')
      const compressed = testData.map(data => memoryManager.compress(data))

      // 等待内存检查
      await new Promise(resolve => setTimeout(resolve, 250))

      const stats = memoryManager.getStats()

      expect(stats.currentUsage).toBeGreaterThanOrEqual(0)
      expect(stats.peakUsage).toBeGreaterThanOrEqual(stats.currentUsage)
      expect(stats.compressionRatio).toBeGreaterThanOrEqual(0)
      expect(stats.compressionRatio).toBeLessThanOrEqual(1)

      console.log('内存统计验证:', {
        currentUsage: stats.currentUsage.toFixed(2) + 'MB',
        peakUsage: stats.peakUsage.toFixed(2) + 'MB',
        compressionRatio: (stats.compressionRatio * 100).toFixed(2) + '%'
      })

      memoryManager.destroy()
    })
  })
})
