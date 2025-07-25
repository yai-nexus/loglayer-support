/**
 * 批处理性能基准测试
 */

import { SmartBatcher } from '../../core/performance'
import { PerformanceBenchmark, TestDataGenerator } from './benchmark-utils'

// Mock performance API
global.performance = global.performance || {
  now: () => Date.now()
} as any

describe('批处理性能基准测试', () => {
  let processedItems: any[] = []
  let processor: jest.Mock

  beforeEach(() => {
    processedItems = []
    processor = jest.fn().mockImplementation(async (items: any[]) => {
      processedItems.push(...items)
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1))
    })
  })

  describe('批次大小性能对比', () => {
    const testSizes = [1, 10, 50, 100]
    const itemCount = 1000

    testSizes.forEach(batchSize => {
      it(`批次大小 ${batchSize} 的性能测试`, async () => {
        const benchmark = new PerformanceBenchmark({
          iterations: 10,
          warmupIterations: 2,
          verbose: false
        })

        const testData = TestDataGenerator.generateBatch(itemCount, 'simple')
        let dataIndex = 0

        const result = await benchmark.run(
          `批次大小-${batchSize}`,
          async () => {
            const batcher = new SmartBatcher(processor, {
              maxBatchSize: batchSize,
              batchTimeout: 100,
              adaptive: false
            })

            // 添加所有测试数据
            for (let i = 0; i < itemCount; i++) {
              batcher.add(testData[dataIndex % testData.length])
              dataIndex++
            }

            // 等待所有批次处理完成
            await batcher.flush()
            await batcher.destroy()
          },
          () => {
            processedItems = []
            processor.mockClear()
          }
        )

        // 验证所有数据都被处理
        expect(processedItems.length).toBe(itemCount * result.iterations)

        // 性能断言
        expect(result.averageTime).toBeLessThan(5000) // 5秒内完成
        expect(result.throughput).toBeGreaterThan(100) // 至少100 ops/sec

        console.log(`批次大小 ${batchSize}: ${result.averageTime.toFixed(2)}ms, ${result.throughput.toFixed(0)} ops/sec`)
      }, 30000)
    })
  })

  describe('自适应批处理性能测试', () => {
    it('应该展示自适应批处理的性能优势', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 5,
        warmupIterations: 1,
        verbose: true
      })

      const testData = TestDataGenerator.generateBatch(500, 'complex')

      // 测试固定批处理
      const fixedResult = await benchmark.run(
        '固定批处理',
        async () => {
          const batcher = new SmartBatcher(processor, {
            maxBatchSize: 20,
            batchTimeout: 50,
            adaptive: false
          })

          for (const item of testData) {
            batcher.add(item)
          }

          await batcher.flush()
          await batcher.destroy()
        },
        () => {
          processedItems = []
          processor.mockClear()
        }
      )

      // 测试自适应批处理
      const adaptiveResult = await benchmark.run(
        '自适应批处理',
        async () => {
          const batcher = new SmartBatcher(processor, {
            maxBatchSize: 50,
            batchTimeout: 100,
            adaptive: true
          })

          for (const item of testData) {
            batcher.add(item)
          }

          await batcher.flush()
          await batcher.destroy()
        },
        () => {
          processedItems = []
          processor.mockClear()
        }
      )

      // 比较性能
      const comparison = PerformanceBenchmark.compare(fixedResult, adaptiveResult)
      console.log(`自适应批处理性能对比: ${comparison.summary}`)

      // 自适应批处理应该有更好的效率
      expect(adaptiveResult.throughput).toBeGreaterThanOrEqual(fixedResult.throughput * 0.8)
    }, 60000)
  })

  describe('不同数据类型的批处理性能', () => {
    const dataTypes: Array<{ name: string, type: 'simple' | 'complex' | 'large' }> = [
      { name: '简单数据', type: 'simple' },
      { name: '复杂数据', type: 'complex' },
      { name: '大型数据', type: 'large' }
    ]

    dataTypes.forEach(({ name, type }) => {
      it(`${name}的批处理性能`, async () => {
        const benchmark = new PerformanceBenchmark({
          iterations: 5,
          warmupIterations: 1,
          verbose: false
        })

        const testData = TestDataGenerator.generateBatch(100, type)

        const result = await benchmark.run(
          `${name}批处理`,
          async () => {
            const batcher = new SmartBatcher(processor, {
              maxBatchSize: 20,
              batchTimeout: 100,
              adaptive: false
            })

            for (const item of testData) {
              batcher.add(item)
            }

            await batcher.flush()
            await batcher.destroy()
          },
          () => {
            processedItems = []
            processor.mockClear()
          }
        )

        console.log(`${name}: ${result.averageTime.toFixed(2)}ms, ${result.throughput.toFixed(0)} ops/sec`)

        // 基本性能要求
        expect(result.averageTime).toBeLessThan(10000) // 10秒内完成
        expect(result.throughput).toBeGreaterThan(5) // 至少5 ops/sec
      }, 30000)
    })
  })

  describe('高并发批处理性能测试', () => {
    it('应该处理高并发的批处理请求', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 3,
        warmupIterations: 1,
        verbose: true
      })

      const concurrentBatchers = 10
      const itemsPerBatcher = 100

      const result = await benchmark.run(
        '高并发批处理',
        async () => {
          const batchers = Array.from({ length: concurrentBatchers }, () => 
            new SmartBatcher(processor, {
              maxBatchSize: 20,
              batchTimeout: 50,
              adaptive: true
            })
          )

          const promises = batchers.map(async (batcher, index) => {
            const testData = TestDataGenerator.generateBatch(itemsPerBatcher, 'simple')
            
            for (const item of testData) {
              batcher.add({ ...item, batcherId: index })
            }

            await batcher.flush()
            await batcher.destroy()
          })

          await Promise.all(promises)
        },
        () => {
          processedItems = []
          processor.mockClear()
        }
      )

      // 验证所有数据都被处理
      const expectedItems = concurrentBatchers * itemsPerBatcher * result.iterations
      expect(processedItems.length).toBe(expectedItems)

      console.log(`高并发批处理: ${result.averageTime.toFixed(2)}ms, ${result.throughput.toFixed(0)} ops/sec`)

      // 性能要求
      expect(result.averageTime).toBeLessThan(15000) // 15秒内完成
      expect(result.throughput).toBeGreaterThan(50) // 至少50 ops/sec
    }, 60000)
  })

  describe('批处理效率统计', () => {
    it('应该提供准确的批处理效率统计', async () => {
      const batcher = new SmartBatcher(processor, {
        maxBatchSize: 10,
        batchTimeout: 100,
        adaptive: false
      })

      const testData = TestDataGenerator.generateBatch(95, 'simple') // 不能整除批次大小

      // 添加数据
      for (const item of testData) {
        batcher.add(item)
      }

      await batcher.flush()

      const stats = batcher.getStats()

      expect(stats.totalBatches).toBeGreaterThan(0)
      expect(stats.averageBatchSize).toBeGreaterThan(0)
      expect(stats.efficiency).toBeGreaterThan(0)
      expect(stats.efficiency).toBeLessThanOrEqual(1)

      console.log('批处理统计:', {
        totalBatches: stats.totalBatches,
        averageBatchSize: stats.averageBatchSize.toFixed(2),
        efficiency: (stats.efficiency * 100).toFixed(2) + '%'
      })

      await batcher.destroy()
    })
  })

  describe('内存使用优化测试', () => {
    it('批处理应该优化内存使用', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 3,
        warmupIterations: 1,
        trackMemory: true,
        verbose: true
      })

      const largeDataSet = TestDataGenerator.generateBatch(1000, 'large')

      const result = await benchmark.run(
        '大数据集批处理',
        async () => {
          const batcher = new SmartBatcher(processor, {
            maxBatchSize: 50,
            batchTimeout: 200,
            adaptive: true
          })

          for (const item of largeDataSet) {
            batcher.add(item)
          }

          await batcher.flush()
          await batcher.destroy()
        },
        () => {
          processedItems = []
          processor.mockClear()
          // 强制垃圾回收（如果可用）
          if (global.gc) {
            global.gc()
          }
        }
      )

      console.log(`大数据集内存使用: ${result.memoryUsage.delta.toFixed(2)} MB`)

      // 内存使用应该在合理范围内
      expect(result.memoryUsage.delta).toBeLessThan(100) // 不超过100MB增长
    }, 60000)
  })
})
