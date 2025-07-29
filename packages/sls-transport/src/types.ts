/**
 * 阿里云 SLS Transport 类型定义
 */

// 避免类型导入问题，直接定义配置接口

/**
 * SLS 字段配置接口
 */
export interface SlsFieldConfig {
  /** 是否启用PackID机制，默认 true */
  enablePackId?: boolean;
  /** 是否包含环境信息，默认 true */
  includeEnvironment?: boolean;
  /** 是否包含版本信息，默认 true */
  includeVersion?: boolean;
  /** 是否包含主机IP，默认 true */
  includeHostIP?: boolean;
  /** 是否包含日志分类，默认 true */
  includeCategory?: boolean;
  /** 是否包含日志器名称，默认 false */
  includeLogger?: boolean;
  /** 自定义字段 */
  customFields?: Record<string, string>;
}

/**
 * SLS Transport 配置接口
 */
export interface SlsTransportConfig {
  /** SLS 服务端点 */
  endpoint: string;
  /** 阿里云访问密钥 ID */
  accessKeyId: string;
  /** 阿里云访问密钥 Secret */
  accessKeySecret: string;
  /** SLS 项目名 */
  project: string;
  /** SLS 日志库名 */
  logstore: string;
  /** 日志主题，默认 'loglayer' */
  topic?: string;
  /** 日志来源，默认 'nodejs' */
  source?: string;
  /** 批量发送大小，默认 100 */
  batchSize?: number;
  /** 刷新间隔(毫秒)，默认 5000 */
  flushInterval?: number;
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 重试基础延迟(毫秒)，默认 1000 */
  retryBaseDelay?: number;
  /** 字段配置 */
  fields?: SlsFieldConfig;
}

/**
 * 内部配置接口（经过处理和默认值填充）
 */
export interface SlsTransportInternalConfig {
  sdkConfig: {
    endpoint: string;
    accessKeyId: string;
    accessKeySecret: string;
  };
  project: string;
  logstore: string;
  topic: string;
  source: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryBaseDelay: number;
  fields: Required<SlsFieldConfig>;
}

/**
 * 日志条目接口（发送到 SLS 的格式）
 */
export interface SlsLogItem {
  /** Unix 时间戳（秒） */
  time: number;
  /** 日志内容键值对 */
  contents: SlsLogContent[];
}

/**
 * SLS 日志内容
 */
export interface SlsLogContent {
  key: string;
  value: string;
}

/**
 * SLS 日志标签
 */
export interface SlsLogTag {
  key: string;
  value: string;
}

/**
 * 批量日志组
 */
export interface SlsLogGroup {
  /** 日志条目列表 */
  logs: SlsLogItem[];
  /** 日志主题 */
  topic: string;
  /** 日志来源 */
  source: string;
  /** 日志标签（包含PackID等） */
  logTags?: SlsLogTag[];
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 基础延迟时间（毫秒） */
  baseDelay: number;
  /** 最大延迟时间（毫秒） */
  maxDelay?: number;
}

/**
 * 传输统计信息
 */
export interface TransportStats {
  /** 总发送次数 */
  totalSent: number;
  /** 成功发送次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 重试次数 */
  retryCount: number;
  /** 批量发送次数 */
  batchCount: number;
  /** 最后发送时间 */
  lastSentAt: Date | null;
  /** 最后错误时间 */
  lastErrorAt: Date | null;
}