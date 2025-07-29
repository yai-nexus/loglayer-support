/**
 * PackID 生成器
 * 
 * 实现阿里云SLS的PackID机制，用于关联日志上下文
 * PackID格式: 上下文前缀-日志组ID (例如: 5FA51423DDB54FDA-1E3)
 */

import { createHash } from 'crypto';
import { hostname } from 'os';
import { internalLogger } from './logger';

/**
 * PackID 生成器类
 * 每个进程应该使用同一个实例，确保同一进程的日志具有相同的上下文前缀
 */
export class PackIdGenerator {
  private readonly packIdPrefix: string;
  private batchId: number = 0;

  constructor() {
    this.packIdPrefix = this.generatePackIdPrefix();
    internalLogger.debug('PackID生成器初始化', { 
      prefix: this.packIdPrefix,
      pid: process.pid 
    });
  }

  /**
   * 生成新的PackID
   * @returns PackID字符串，格式为 "前缀-组ID"
   */
  generateNewPackId(): string {
    const packId = `${this.packIdPrefix}-${(++this.batchId).toString(16).toUpperCase()}`;
    
    internalLogger.debug('生成新PackID', { 
      packId, 
      batchId: this.batchId 
    });
    
    return packId;
  }

  /**
   * 获取当前的上下文前缀
   * @returns 上下文前缀字符串
   */
  getContextPrefix(): string {
    return this.packIdPrefix;
  }

  /**
   * 获取当前的批次ID
   * @returns 当前批次ID
   */
  getCurrentBatchId(): number {
    return this.batchId;
  }

  /**
   * 生成PackID前缀
   * 基于主机名、进程ID和时间戳生成唯一的上下文前缀
   * @returns 16位大写十六进制字符串
   */
  private generatePackIdPrefix(): string {
    try {
      const hostName = hostname();
      const pid = process.pid;
      const timestamp = Date.now();
      
      // 构建输入字符串，包含主机名、进程ID和时间戳
      const input = `${hostName}-${pid}-${timestamp}`;
      
      // 使用MD5生成哈希值
      const hash = createHash('md5').update(input).digest('hex');
      
      // 取前16位并转换为大写
      const prefix = hash.substring(0, 16).toUpperCase();
      
      internalLogger.debug('生成PackID前缀', {
        hostName,
        pid,
        timestamp,
        input,
        hash,
        prefix
      });
      
      return prefix;
    } catch (error) {
      // 如果生成失败，使用备用方案
      const fallbackPrefix = createHash('md5')
        .update(`fallback-${process.pid}-${Date.now()}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
      
      internalLogger.warn('PackID前缀生成失败，使用备用方案', { 
        error: error instanceof Error ? error.message : String(error),
        fallbackPrefix 
      });
      
      return fallbackPrefix;
    }
  }
}

/**
 * 全局PackID生成器实例
 * 确保整个进程使用同一个生成器实例
 */
let globalPackIdGenerator: PackIdGenerator | null = null;

/**
 * 获取全局PackID生成器实例
 * @returns PackID生成器实例
 */
export function getGlobalPackIdGenerator(): PackIdGenerator {
  if (!globalPackIdGenerator) {
    globalPackIdGenerator = new PackIdGenerator();
    internalLogger.info('创建全局PackID生成器', { 
      prefix: globalPackIdGenerator.getContextPrefix() 
    });
  }
  return globalPackIdGenerator;
}

/**
 * 重置全局PackID生成器（主要用于测试）
 */
export function resetGlobalPackIdGenerator(): void {
  globalPackIdGenerator = null;
  internalLogger.debug('重置全局PackID生成器');
}

/**
 * 生成单个PackID的便捷函数
 * @returns 新的PackID
 */
export function generatePackId(): string {
  return getGlobalPackIdGenerator().generateNewPackId();
}
