/**
 * 序列化性能基准测试
 */

import { FastSerializer } from '../../core/performance'
import { PerformanceBenchmark, TestDataGenerator } from './benchmark-utils'

// Mock performance API
global.performance = global.performance || {
  now: () => Date.now()
} as any

describe('序列化性能基准测试', () => {
  describe('基础序列化性能', () => {
    const dataTypes: Array<{ name: string, type: 'simple' | 'complex' | 'large' }> = [
      { name: '简单对象', type: 'simple' },
      { name: '复杂对象', type: 'complex' },
      { name: '大型对象', type: 'large' }
    ]

    dataTypes.forEach(({ name, type }) => {
      it(`${name}序列化性能测试`, async () => {
        const benchmark = new PerformanceBenchmark({
          iterations: 1000,
          warmupIterations: 100,
          verbose: false
        })

        const serializer = new FastSerializer({
          fastMode: false,
          caching: false
        })

        const testData = TestDataGenerator.generateBatch(1, type)[0]

        const result = await benchmark.run(
          `${name}序列化`,
          () => {
            return serializer.serialize(testData)
          },
          undefined,
          () => {
            // 清理
          }
        )

        console.log(`${name}序列化: ${result.averageTime.toFixed(3)}ms, ${result.throughput.toFixed(0)} ops/sec`)

        // 性能要求
        expect(result.averageTime).toBeLessThan(10) // 10ms内完成
        expect(result.throughput).toBeGreaterThan(100) // 至少100 ops/sec

        serializer.destroy()
      })
    })
  })

  describe('快速模式 vs 标准模式', () => {
    it('应该展示快速模式的性能优势', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 500,
        warmupIterations: 50,
        verbose: true
      })

      const testData = TestDataGenerator.generateComplexLog()

      // 测试标准模式
      const standardSerializer = new FastSerializer({
        fastMode: false,
        caching: false
      })

      const standardResult = await benchmark.run(
        '标准序列化模式',
        () => {
          return standardSerializer.serialize(testData)
        }
      )

      // 测试快速模式
      const fastSerializer = new FastSerializer({
        fastMode: true,
        caching: false
      })

      const fastResult = await benchmark.run(
        '快速序列化模式',
        () => {
          return fastSerializer.serialize(testData)
        }
      )

      // 比较性能
      const comparison = PerformanceBenchmark.compare(standardResult, fastResult)
      console.log(`快速模式性能提升: ${comparison.summary}`)

      // 快速模式应该更快
      expect(fastResult.averageTime).toBeLessThanOrEqual(standardResult.averageTime)

      standardSerializer.destroy()
      fastSerializer.destroy()
    })
  })

  describe('缓存效果测试', () => {
    it('应该展示缓存的性能优势', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 200,
        warmupIterations: 20,
        verbose: true
      })

      const testData = TestDataGenerator.generateComplexLog()

      // 测试无缓存
      const noCacheSerializer = new FastSerializer({
        fastMode: true,
        caching: false
      })

      const noCacheResult = await benchmark.run(
        '无缓存序列化',
        () => {
          return noCacheSerializer.serialize(testData, `key-${Math.random()}`)
        }
      )

      // 测试有缓存（重复键）
      const cachedSerializer = new FastSerializer({
        fastMode: true,
        caching: true,
        cacheSize: 100
      })

      const cachedResult = await benchmark.run(
        '缓存序列化',
        () => {
          return cachedSerializer.serialize(testData, 'fixed-key') // 固定键，触发缓存
        }
      )

      // 比较性能
      const comparison = PerformanceBenchmark.compare(noCacheResult, cachedResult)
      console.log(`缓存性能提升: ${comparison.summary}`)

      // 获取缓存统计
      const cacheStats = cachedSerializer.getStats()
      console.log(`缓存命中率: ${(cacheStats.cacheHitRate * 100).toFixed(2)}%`)

      // 缓存应该显著提升性能
      expect(cachedResult.averageTime).toBeLessThan(noCacheResult.averageTime * 0.5)
      expect(cacheStats.cacheHitRate).toBeGreaterThan(0.8) // 80%以上命中率

      noCacheSerializer.destroy()
      cachedSerializer.destroy()
    })
  })

  describe('缓存大小对性能的影响', () => {
    const cacheSizes = [10, 50, 100, 500]

    cacheSizes.forEach(cacheSize => {
      it(`缓存大小 ${cacheSize} 的性能测试`, async () => {
        const benchmark = new PerformanceBenchmark({
          iterations: 100,
          warmupIterations: 10,
          verbose: false
        })

        const serializer = new FastSerializer({
          fastMode: true,
          caching: true,
          cacheSize
        })

        const testDataSet = TestDataGenerator.generateBatch(cacheSize * 2, 'complex')

        const result = await benchmark.run(
          `缓存大小-${cacheSize}`,
          () => {
            // 随机选择数据，模拟缓存命中和未命中
            const randomIndex = Math.floor(Math.random() * testDataSet.length)
            const data = testDataSet[randomIndex]
            return serializer.serialize(data, `key-${randomIndex}`)
          }
        )

        const stats = serializer.getStats()
        console.log(`缓存大小 ${cacheSize}: ${result.averageTime.toFixed(3)}ms, 命中率: ${(stats.cacheHitRate * 100).toFixed(1)}%`)

        serializer.destroy()
      })
    })
  })

  describe('与原生 JSON.stringify 对比', () => {
    it('应该与原生 JSON.stringify 性能相当或更好', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 1000,
        warmupIterations: 100,
        verbose: true
      })

      const testData = TestDataGenerator.generateComplexLog()

      // 测试原生 JSON.stringify
      const nativeResult = await benchmark.run(
        '原生 JSON.stringify',
        () => {
          return JSON.stringify(testData)
        }
      )

      // 测试 FastSerializer
      const serializer = new FastSerializer({
        fastMode: true,
        caching: false
      })

      const fastResult = await benchmark.run(
        'FastSerializer',
        () => {
          return serializer.serialize(testData)
        }
      )

      // 比较性能
      const comparison = PerformanceBenchmark.compare(nativeResult, fastResult)
      console.log(`FastSerializer vs 原生: ${comparison.summary}`)

      // FastSerializer 应该至少与原生性能相当
      expect(fastResult.averageTime).toBeLessThan(nativeResult.averageTime * 2) // 不超过2倍时间

      serializer.destroy()
    })
  })

  describe('大数据集序列化性能', () => {
    it('应该高效处理大数据集', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 10,
        warmupIterations: 2,
        trackMemory: true,
        verbose: true
      })

      const serializer = new FastSerializer({
        fastMode: true,
        caching: true,
        cacheSize: 50
      })

      const largeDataSet = TestDataGenerator.generateBatch(100, 'large')

      const result = await benchmark.run(
        '大数据集序列化',
        () => {
          const promises = largeDataSet.map((data, index) => 
            serializer.serialize(data, `large-key-${index % 20}`) // 部分重复键
          )
          return Promise.all(promises)
        },
        undefined,
        () => {
          // 强制垃圾回收
          if (global.gc) {
            global.gc()
          }
        }
      )

      const stats = serializer.getStats()
      console.log(`大数据集序列化统计:`)
      console.log(`  平均时间: ${result.averageTime.toFixed(2)}ms`)
      console.log(`  内存增长: ${result.memoryUsage.delta.toFixed(2)}MB`)
      console.log(`  缓存命中率: ${(stats.cacheHitRate * 100).toFixed(2)}%`)

      // 性能要求
      expect(result.averageTime).toBeLessThan(5000) // 5秒内完成
      expect(result.memoryUsage.delta).toBeLessThan(50) // 内存增长不超过50MB

      serializer.destroy()
    }, 30000)
  })

  describe('并发序列化性能', () => {
    it('应该支持高并发序列化', async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 5,
        warmupIterations: 1,
        verbose: true
      })

      const serializer = new FastSerializer({
        fastMode: true,
        caching: true,
        cacheSize: 200
      })

      const concurrentTasks = 50
      const itemsPerTask = 20

      const result = await benchmark.run(
        '并发序列化',
        async () => {
          const tasks = Array.from({ length: concurrentTasks }, async (_, taskIndex) => {
            const testData = TestDataGenerator.generateBatch(itemsPerTask, 'complex')
            
            const promises = testData.map((data, itemIndex) => 
              serializer.serialize(data, `task-${taskIndex}-item-${itemIndex}`)
            )
            
            return Promise.all(promises)
          })

          await Promise.all(tasks)
        }
      )

      const stats = serializer.getStats()
      console.log(`并发序列化统计:`)
      console.log(`  总操作数: ${stats.totalOperations}`)
      console.log(`  平均时间: ${result.averageTime.toFixed(2)}ms`)
      console.log(`  吞吐量: ${result.throughput.toFixed(0)} ops/sec`)
      console.log(`  缓存命中率: ${(stats.cacheHitRate * 100).toFixed(2)}%`)

      // 性能要求
      expect(result.averageTime).toBeLessThan(10000) // 10秒内完成
      expect(result.throughput).toBeGreaterThan(10) // 至少10 ops/sec

      serializer.destroy()
    }, 60000)
  })

  describe('序列化统计准确性', () => {
    it('应该提供准确的序列化统计信息', async () => {
      const serializer = new FastSerializer({
        fastMode: true,
        caching: true,
        cacheSize: 10
      })

      const testData = TestDataGenerator.generateBatch(20, 'simple')

      // 执行序列化操作
      for (let i = 0; i < testData.length; i++) {
        const data = testData[i]
        await serializer.serialize(data, `key-${i % 5}`) // 重复键模式
      }

      const stats = serializer.getStats()

      expect(stats.totalOperations).toBe(testData.length)
      expect(stats.cacheHitRate).toBeGreaterThan(0) // 应该有缓存命中
      expect(stats.cacheHitRate).toBeLessThanOrEqual(1) // 命中率不超过100%
      expect(stats.averageSerializationTime).toBeGreaterThan(0)

      console.log('序列化统计验证:', {
        totalOperations: stats.totalOperations,
        cacheHitRate: (stats.cacheHitRate * 100).toFixed(2) + '%',
        averageTime: stats.averageSerializationTime.toFixed(3) + 'ms'
      })

      serializer.destroy()
    })
  })
})
