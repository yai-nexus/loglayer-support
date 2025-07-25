/**
 * 性能基准测试工具类
 */

export interface PerformanceMetrics {
  /** 平均执行时间 (ms) */
  averageTime: number
  /** 最小执行时间 (ms) */
  minTime: number
  /** 最大执行时间 (ms) */
  maxTime: number
  /** 总执行时间 (ms) */
  totalTime: number
  /** 执行次数 */
  iterations: number
  /** 吞吐量 (operations/second) */
  throughput: number
  /** 内存使用 (MB) */
  memoryUsage: {
    initial: number
    peak: number
    final: number
    delta: number
  }
  /** 标准差 */
  standardDeviation: number
}

export interface BenchmarkOptions {
  /** 预热次数 */
  warmupIterations?: number
  /** 测试次数 */
  iterations?: number
  /** 超时时间 (ms) */
  timeout?: number
  /** 是否监控内存 */
  trackMemory?: boolean
  /** 是否输出详细日志 */
  verbose?: boolean
}

export class PerformanceBenchmark {
  private results: number[] = []
  private memorySnapshots: number[] = []

  constructor(private options: BenchmarkOptions = {}) {
    this.options = {
      warmupIterations: 5,
      iterations: 100,
      timeout: 30000,
      trackMemory: true,
      verbose: false,
      ...options
    }
  }

  /**
   * 运行性能基准测试
   */
  async run<T>(
    name: string,
    testFunction: () => Promise<T> | T,
    setupFunction?: () => Promise<void> | void,
    teardownFunction?: () => Promise<void> | void
  ): Promise<PerformanceMetrics> {
    if (this.options.verbose) {
      console.log(`🚀 开始性能测试: ${name}`)
    }

    // 记录初始内存
    const initialMemory = this.getMemoryUsage()
    let peakMemory = initialMemory

    // 预热
    if (this.options.warmupIterations! > 0) {
      if (this.options.verbose) {
        console.log(`🔥 预热 ${this.options.warmupIterations} 次...`)
      }
      for (let i = 0; i < this.options.warmupIterations!; i++) {
        if (setupFunction) await setupFunction()
        await testFunction()
        if (teardownFunction) await teardownFunction()
      }
    }

    // 清理预热结果
    this.results = []
    this.memorySnapshots = []

    // 正式测试
    if (this.options.verbose) {
      console.log(`📊 执行 ${this.options.iterations} 次测试...`)
    }

    const startTime = performance.now()
    
    for (let i = 0; i < this.options.iterations!; i++) {
      if (setupFunction) await setupFunction()

      const iterationStart = performance.now()
      await testFunction()
      const iterationEnd = performance.now()

      this.results.push(iterationEnd - iterationStart)

      if (this.options.trackMemory) {
        const currentMemory = this.getMemoryUsage()
        this.memorySnapshots.push(currentMemory)
        peakMemory = Math.max(peakMemory, currentMemory)
      }

      if (teardownFunction) await teardownFunction()

      // 检查超时
      if (performance.now() - startTime > this.options.timeout!) {
        console.warn(`⚠️ 测试超时，只完成了 ${i + 1} 次迭代`)
        break
      }
    }

    const finalMemory = this.getMemoryUsage()

    // 计算统计指标
    const metrics = this.calculateMetrics(initialMemory, peakMemory, finalMemory)

    if (this.options.verbose) {
      this.printResults(name, metrics)
    }

    return metrics
  }

  /**
   * 比较两个测试的性能
   */
  static compare(baseline: PerformanceMetrics, optimized: PerformanceMetrics): {
    timeImprovement: number
    throughputImprovement: number
    memoryImprovement: number
    summary: string
  } {
    const timeImprovement = ((baseline.averageTime - optimized.averageTime) / baseline.averageTime) * 100
    const throughputImprovement = ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100
    const memoryImprovement = ((baseline.memoryUsage.delta - optimized.memoryUsage.delta) / baseline.memoryUsage.delta) * 100

    const summary = [
      `时间优化: ${timeImprovement > 0 ? '+' : ''}${timeImprovement.toFixed(2)}%`,
      `吞吐量优化: ${throughputImprovement > 0 ? '+' : ''}${throughputImprovement.toFixed(2)}%`,
      `内存优化: ${memoryImprovement > 0 ? '+' : ''}${memoryImprovement.toFixed(2)}%`
    ].join(', ')

    return {
      timeImprovement,
      throughputImprovement,
      memoryImprovement,
      summary
    }
  }

  /**
   * 批量运行多个测试
   */
  static async runSuite(
    tests: Array<{
      name: string
      test: () => Promise<any> | any
      setup?: () => Promise<void> | void
      teardown?: () => Promise<void> | void
      options?: BenchmarkOptions
    }>
  ): Promise<Record<string, PerformanceMetrics>> {
    const results: Record<string, PerformanceMetrics> = {}

    console.log(`🧪 开始性能测试套件 (${tests.length} 个测试)`)

    for (const testCase of tests) {
      const benchmark = new PerformanceBenchmark(testCase.options)
      results[testCase.name] = await benchmark.run(
        testCase.name,
        testCase.test,
        testCase.setup,
        testCase.teardown
      )
    }

    console.log('📈 性能测试套件完成')
    return results
  }

  private calculateMetrics(
    initialMemory: number,
    peakMemory: number,
    finalMemory: number
  ): PerformanceMetrics {
    const times = this.results
    const totalTime = times.reduce((sum, time) => sum + time, 0)
    const averageTime = totalTime / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    
    // 计算标准差
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length
    const standardDeviation = Math.sqrt(variance)

    // 计算吞吐量 (operations per second)
    const throughput = 1000 / averageTime

    return {
      averageTime,
      minTime,
      maxTime,
      totalTime,
      iterations: times.length,
      throughput,
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        delta: finalMemory - initialMemory
      },
      standardDeviation
    }
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }
    
    // 浏览器环境
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    
    return 0
  }

  private printResults(name: string, metrics: PerformanceMetrics): void {
    console.log(`\n📊 ${name} 性能测试结果:`)
    console.log(`   平均时间: ${metrics.averageTime.toFixed(3)} ms`)
    console.log(`   最小时间: ${metrics.minTime.toFixed(3)} ms`)
    console.log(`   最大时间: ${metrics.maxTime.toFixed(3)} ms`)
    console.log(`   标准差: ${metrics.standardDeviation.toFixed(3)} ms`)
    console.log(`   吞吐量: ${metrics.throughput.toFixed(0)} ops/sec`)
    console.log(`   迭代次数: ${metrics.iterations}`)
    
    if (metrics.memoryUsage.initial > 0) {
      console.log(`   内存使用:`)
      console.log(`     初始: ${metrics.memoryUsage.initial.toFixed(2)} MB`)
      console.log(`     峰值: ${metrics.memoryUsage.peak.toFixed(2)} MB`)
      console.log(`     最终: ${metrics.memoryUsage.final.toFixed(2)} MB`)
      console.log(`     增量: ${metrics.memoryUsage.delta.toFixed(2)} MB`)
    }
  }
}

/**
 * 生成测试数据
 */
export class TestDataGenerator {
  /**
   * 生成简单日志对象
   */
  static generateSimpleLog(index: number = 0) {
    return {
      level: 'info',
      message: `Test log message ${index}`,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 生成复杂日志对象
   */
  static generateComplexLog(index: number = 0) {
    return {
      level: 'info',
      message: `Complex test log message ${index}`,
      timestamp: new Date().toISOString(),
      metadata: {
        userId: `user-${index}`,
        sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        userAgent: 'Mozilla/5.0 (Test Environment)',
        ip: `192.168.1.${index % 255}`,
        performance: {
          loadTime: Math.random() * 1000,
          renderTime: Math.random() * 500,
          networkTime: Math.random() * 200
        },
        features: ['feature-a', 'feature-b', 'feature-c'],
        context: {
          page: `/page-${index % 10}`,
          action: `action-${index % 5}`,
          component: `component-${index % 3}`
        }
      },
      error: index % 10 === 0 ? {
        name: 'TestError',
        message: 'Simulated error for testing',
        stack: 'Error: Simulated error\n    at test.js:1:1'
      } : undefined
    }
  }

  /**
   * 生成大型日志对象
   */
  static generateLargeLog(index: number = 0) {
    const largeData = new Array(1000).fill(0).map((_, i) => ({
      id: i,
      value: Math.random(),
      text: `Large data item ${i} for log ${index}`
    }))

    return {
      level: 'debug',
      message: `Large test log message ${index}`,
      timestamp: new Date().toISOString(),
      largeData,
      metadata: this.generateComplexLog(index).metadata
    }
  }

  /**
   * 生成指定数量的测试数据
   */
  static generateBatch(count: number, type: 'simple' | 'complex' | 'large' = 'simple') {
    const generator = {
      simple: this.generateSimpleLog,
      complex: this.generateComplexLog,
      large: this.generateLargeLog
    }[type]

    return new Array(count).fill(0).map((_, i) => generator(i))
  }
}
