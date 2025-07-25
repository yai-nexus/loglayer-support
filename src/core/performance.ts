/**
 * 性能优化模块
 * 
 * 提供日志记录的性能优化功能，包括：
 * - 智能批处理
 * - 内存管理
 * - 序列化优化
 * - 缓存机制
 */

/**
 * 性能配置选项
 */
export interface PerformanceConfig {
  /** 是否启用性能优化 */
  enabled?: boolean
  /** 批处理配置 */
  batching?: {
    /** 最大批次大小 */
    maxBatchSize?: number
    /** 批处理超时时间 (ms) */
    batchTimeout?: number
    /** 是否启用智能批处理 */
    adaptive?: boolean
  }
  /** 内存管理配置 */
  memory?: {
    /** 最大内存使用量 (MB) */
    maxMemoryUsage?: number
    /** 内存检查间隔 (ms) */
    checkInterval?: number
    /** 是否启用内存压缩 */
    compression?: boolean
  }
  /** 序列化优化 */
  serialization?: {
    /** 是否使用快速序列化 */
    fastMode?: boolean
    /** 是否缓存序列化结果 */
    caching?: boolean
    /** 缓存大小限制 */
    cacheSize?: number
  }
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
  /** 总处理时间 (ms) */
  totalProcessingTime: number
  /** 平均处理时间 (ms) */
  averageProcessingTime: number
  /** 批处理统计 */
  batching: {
    totalBatches: number
    averageBatchSize: number
    batchingEfficiency: number
  }
  /** 内存使用统计 */
  memory: {
    currentUsage: number
    peakUsage: number
    compressionRatio: number
  }
  /** 序列化统计 */
  serialization: {
    totalOperations: number
    cacheHitRate: number
    averageSerializationTime: number
  }
}

/**
 * 智能批处理器
 */
export class SmartBatcher<T> {
  private items: T[] = []
  private timer: NodeJS.Timeout | null = null
  private readonly config: Required<NonNullable<PerformanceConfig['batching']>>
  private stats = {
    totalBatches: 0,
    totalItems: 0,
    totalWaitTime: 0
  }

  constructor(
    private readonly processor: (items: T[]) => Promise<void>,
    config: PerformanceConfig['batching'] = {}
  ) {
    this.config = {
      maxBatchSize: 50,
      batchTimeout: 1000,
      adaptive: true,
      ...config
    }
  }

  /**
   * 添加项目到批处理队列
   */
  add(item: T): void {
    this.items.push(item)

    // 如果达到最大批次大小，立即处理
    if (this.items.length >= this.config.maxBatchSize) {
      this.flush()
      return
    }

    // 设置或重置定时器
    if (this.timer) {
      clearTimeout(this.timer)
    }

    const timeout = this.config.adaptive 
      ? this.calculateAdaptiveTimeout()
      : this.config.batchTimeout

    this.timer = setTimeout(() => this.flush(), timeout)
  }

  /**
   * 立即处理所有待处理项目
   */
  async flush(): Promise<void> {
    if (this.items.length === 0) {
      return
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const itemsToProcess = this.items.splice(0)
    this.updateStats(itemsToProcess.length)

    try {
      await this.processor(itemsToProcess)
    } catch (error) {
      // 如果处理失败，可以选择重新加入队列或记录错误
      console.error('Batch processing failed:', error)
    }
  }

  /**
   * 计算自适应超时时间
   */
  private calculateAdaptiveTimeout(): number {
    const currentBatchSize = this.items.length
    const efficiency = this.getBatchingEfficiency()
    
    // 根据当前批次大小和效率调整超时时间
    if (efficiency > 0.8 && currentBatchSize < this.config.maxBatchSize * 0.5) {
      return this.config.batchTimeout * 1.5 // 延长等待时间
    } else if (efficiency < 0.5) {
      return this.config.batchTimeout * 0.5 // 缩短等待时间
    }
    
    return this.config.batchTimeout
  }

  /**
   * 获取批处理效率
   */
  private getBatchingEfficiency(): number {
    if (this.stats.totalBatches === 0) {
      return 1.0
    }
    
    const averageBatchSize = this.stats.totalItems / this.stats.totalBatches
    return averageBatchSize / this.config.maxBatchSize
  }

  /**
   * 更新统计信息
   */
  private updateStats(batchSize: number): void {
    this.stats.totalBatches++
    this.stats.totalItems += batchSize
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalBatches: number
    averageBatchSize: number
    efficiency: number
  } {
    return {
      totalBatches: this.stats.totalBatches,
      averageBatchSize: this.stats.totalBatches > 0 
        ? this.stats.totalItems / this.stats.totalBatches 
        : 0,
      efficiency: this.getBatchingEfficiency()
    }
  }

  /**
   * 销毁批处理器
   */
  async destroy(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    await this.flush()
  }
}

/**
 * 内存管理器
 */
export class MemoryManager {
  private readonly config: Required<NonNullable<PerformanceConfig['memory']>>
  private checkTimer: NodeJS.Timeout | null = null
  private stats = {
    currentUsage: 0,
    peakUsage: 0,
    compressionRatio: 1.0
  }

  constructor(config: PerformanceConfig['memory'] = {}) {
    this.config = {
      maxMemoryUsage: 50, // 50MB
      checkInterval: 30000, // 30秒
      compression: true,
      ...config
    }

    this.startMonitoring()
  }

  /**
   * 开始内存监控
   */
  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.checkMemoryUsage()
    }, this.config.checkInterval)
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js 环境
      const usage = process.memoryUsage()
      this.stats.currentUsage = usage.heapUsed / 1024 / 1024 // 转换为 MB
    } else if (typeof performance !== 'undefined' && (performance as any).memory) {
      // 浏览器环境 (Chrome)
      const memory = (performance as any).memory
      this.stats.currentUsage = memory.usedJSHeapSize / 1024 / 1024 // 转换为 MB
    }

    // 更新峰值使用量
    if (this.stats.currentUsage > this.stats.peakUsage) {
      this.stats.peakUsage = this.stats.currentUsage
    }

    // 如果内存使用超过限制，触发清理
    if (this.stats.currentUsage > this.config.maxMemoryUsage) {
      this.triggerCleanup()
    }
  }

  /**
   * 触发内存清理
   */
  private triggerCleanup(): void {
    // 触发垃圾回收（如果可用）
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }

    // 发出内存压力事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('memory-pressure', {
        detail: { currentUsage: this.stats.currentUsage }
      }))
    }
  }

  /**
   * 压缩数据
   */
  compress<T>(data: T): string {
    if (!this.config.compression) {
      return JSON.stringify(data)
    }

    try {
      const jsonString = JSON.stringify(data)
      // 简单的压缩：移除不必要的空格和重复字符
      const compressed = jsonString
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')

      this.stats.compressionRatio = compressed.length / jsonString.length
      return compressed
    } catch (error) {
      console.warn('Compression failed, using original data:', error)
      return JSON.stringify(data)
    }
  }

  /**
   * 获取内存统计
   */
  getStats(): PerformanceStats['memory'] {
    return { ...this.stats }
  }

  /**
   * 销毁内存管理器
   */
  destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }
}

/**
 * 快速序列化器
 */
export class FastSerializer {
  private cache = new Map<string, string>()
  private readonly config: Required<NonNullable<PerformanceConfig['serialization']>>
  private stats = {
    totalOperations: 0,
    cacheHits: 0,
    totalSerializationTime: 0
  }

  constructor(config: PerformanceConfig['serialization'] = {}) {
    this.config = {
      fastMode: true,
      caching: true,
      cacheSize: 1000,
      ...config
    }
  }

  /**
   * 序列化对象
   */
  serialize<T>(obj: T, cacheKey?: string): string {
    const startTime = performance.now()
    this.stats.totalOperations++

    // 如果启用缓存且提供了缓存键
    if (this.config.caching && cacheKey && this.cache.has(cacheKey)) {
      this.stats.cacheHits++
      return this.cache.get(cacheKey)!
    }

    let result: string
    if (this.config.fastMode) {
      result = this.fastStringify(obj)
    } else {
      result = JSON.stringify(obj)
    }

    // 缓存结果
    if (this.config.caching && cacheKey) {
      this.addToCache(cacheKey, result)
    }

    this.stats.totalSerializationTime += performance.now() - startTime
    return result
  }

  /**
   * 快速字符串化
   */
  private fastStringify(obj: any): string {
    // 对于简单对象，使用优化的序列化
    if (obj === null) return 'null'
    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
    if (obj instanceof Date) return `"${obj.toISOString()}"`
    
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.fastStringify(item)).join(',') + ']'
    }
    
    if (typeof obj === 'object') {
      const pairs: string[] = []
      for (const [key, value] of Object.entries(obj)) {
        pairs.push(`"${key}":${this.fastStringify(value)}`)
      }
      return '{' + pairs.join(',') + '}'
    }
    
    return JSON.stringify(obj)
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, value: string): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, value)
  }

  /**
   * 获取统计信息
   */
  getStats(): PerformanceStats['serialization'] {
    return {
      totalOperations: this.stats.totalOperations,
      cacheHitRate: this.stats.totalOperations > 0 
        ? this.stats.cacheHits / this.stats.totalOperations 
        : 0,
      averageSerializationTime: this.stats.totalOperations > 0
        ? this.stats.totalSerializationTime / this.stats.totalOperations
        : 0
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 销毁序列化器
   */
  destroy(): void {
    this.cache.clear()
  }
}

/**
 * 性能管理器
 */
export class PerformanceManager {
  private readonly batcher: SmartBatcher<any>
  private readonly memoryManager: MemoryManager
  private readonly serializer: FastSerializer
  private readonly config: Required<PerformanceConfig>

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enabled: true,
      batching: {
        maxBatchSize: 50,
        batchTimeout: 1000,
        adaptive: true
      },
      memory: {
        maxMemoryUsage: 50,
        checkInterval: 30000,
        compression: true
      },
      serialization: {
        fastMode: true,
        caching: true,
        cacheSize: 1000
      },
      ...config
    }

    this.batcher = new SmartBatcher(
      async (items) => { /* 处理逻辑由外部提供 */ },
      this.config.batching
    )
    this.memoryManager = new MemoryManager(this.config.memory)
    this.serializer = new FastSerializer(this.config.serialization)
  }

  /**
   * 获取批处理器
   */
  getBatcher(): SmartBatcher<any> {
    return this.batcher
  }

  /**
   * 获取内存管理器
   */
  getMemoryManager(): MemoryManager {
    return this.memoryManager
  }

  /**
   * 获取序列化器
   */
  getSerializer(): FastSerializer {
    return this.serializer
  }

  /**
   * 获取完整的性能统计
   */
  getStats(): PerformanceStats {
    const batchStats = this.batcher.getStats()
    const memoryStats = this.memoryManager.getStats()
    const serializationStats = this.serializer.getStats()

    return {
      totalProcessingTime: 0, // 需要外部跟踪
      averageProcessingTime: 0, // 需要外部跟踪
      batching: {
        totalBatches: batchStats.totalBatches,
        averageBatchSize: batchStats.averageBatchSize,
        batchingEfficiency: batchStats.efficiency
      },
      memory: memoryStats,
      serialization: serializationStats
    }
  }

  /**
   * 销毁性能管理器
   */
  async destroy(): Promise<void> {
    await this.batcher.destroy()
    this.memoryManager.destroy()
    this.serializer.destroy()
  }
}

/**
 * 创建性能管理器
 */
export function createPerformanceManager(config?: PerformanceConfig): PerformanceManager {
  return new PerformanceManager(config)
}
