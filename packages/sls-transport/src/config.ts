/**
 * SLS Transport 配置工厂函数
 */

import type { SlsTransportConfig } from './types';
import { internalLogger } from './logger';

/**
 * 环境变量诊断信息
 */
export interface EnvDiagnosticInfo {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    cwd: string;
    pid: number;
    isNextjs: boolean;
    hasNextRuntime: boolean;
    nextRuntimeValue?: string;
  };
  envVars: {
    required: Record<string, { exists: boolean; length?: number; preview?: string; }>;
    optional: Record<string, { exists: boolean; value?: string; }>;
    all_sls_vars: string[];
  };
  config?: SlsTransportConfig;
}

/**
 * 获取环境变量诊断信息
 */
export function getEnvDiagnosticInfo(): EnvDiagnosticInfo {
  const requiredVars = [
    'SLS_ENDPOINT',
    'SLS_PROJECT', 
    'SLS_LOGSTORE',
    'SLS_ACCESS_KEY_ID',
    'SLS_ACCESS_KEY_SECRET'
  ];

  const optionalVars = [
    'SLS_TOPIC',
    'SLS_SOURCE',
    'SLS_BATCH_SIZE',
    'SLS_FLUSH_INTERVAL',
    'SLS_MAX_RETRIES',
    'SLS_RETRY_BASE_DELAY'
  ];

  // 收集所有 SLS 相关的环境变量
  const allSlsVars = Object.keys(process.env)
    .filter(key => key.startsWith('SLS_'))
    .sort();

  const diagnosticInfo: EnvDiagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      pid: process.pid,
      isNextjs: typeof window === 'undefined' && process.env.NEXT_RUNTIME !== undefined,
      hasNextRuntime: process.env.NEXT_RUNTIME !== undefined,
      nextRuntimeValue: process.env.NEXT_RUNTIME
    },
    envVars: {
      required: {},
      optional: {},
      all_sls_vars: allSlsVars
    }
  };

  // 检查必需的环境变量
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    diagnosticInfo.envVars.required[varName] = {
      exists: !!value,
      length: value?.length,
      preview: value ? (varName.includes('SECRET') || varName.includes('KEY') 
        ? value.substring(0, 6) + '***' 
        : value.substring(0, 20) + (value.length > 20 ? '...' : '')) : undefined
    };
  });

  // 检查可选的环境变量
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    diagnosticInfo.envVars.optional[varName] = {
      exists: !!value,
      value: value
    };
  });

  // 如果所有必需变量都存在，生成配置
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length === 0) {
    diagnosticInfo.config = {
      endpoint: process.env.SLS_ENDPOINT!,
      project: process.env.SLS_PROJECT!,
      logstore: process.env.SLS_LOGSTORE!,
      accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
      topic: process.env.SLS_TOPIC || 'loglayer',
      source: process.env.SLS_SOURCE || 'nodejs',
      batchSize: parseInt(process.env.SLS_BATCH_SIZE || '100'),
      flushInterval: parseInt(process.env.SLS_FLUSH_INTERVAL || '5000'),
      maxRetries: parseInt(process.env.SLS_MAX_RETRIES || '3'),
      retryBaseDelay: parseInt(process.env.SLS_RETRY_BASE_DELAY || '1000'),
    };
  }

  return diagnosticInfo;
}

/**
 * 从环境变量创建 SLS Transport 配置
 */
export function createSlsConfigFromEnv(): SlsTransportConfig | null {
  // 【调试增强】获取详细的环境诊断信息
  const diagnosticInfo = getEnvDiagnosticInfo();
  
  internalLogger.debug('=== 环境变量诊断 ===', diagnosticInfo);

  const requiredVars = [
    'SLS_ENDPOINT',
    'SLS_PROJECT', 
    'SLS_LOGSTORE',
    'SLS_ACCESS_KEY_ID',
    'SLS_ACCESS_KEY_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    // 对于配置错误，使用 console.warn 而非内部日志器，因为这是用户配置问题
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SlsTransport] 缺少 SLS 环境变量: ${missingVars.join(', ')}。SLS 传输已禁用。`);
    }
    return null;
  }

  const config = {
    endpoint: process.env.SLS_ENDPOINT!,
    accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
    project: process.env.SLS_PROJECT!,
    logstore: process.env.SLS_LOGSTORE!,
    topic: process.env.SLS_TOPIC || 'loglayer',
    source: process.env.SLS_SOURCE || 'nodejs',
    batchSize: parseInt(process.env.SLS_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.SLS_FLUSH_INTERVAL || '5000'),
    maxRetries: parseInt(process.env.SLS_MAX_RETRIES || '3'),
    fields: {
      enablePackId: process.env.SLS_ENABLE_PACK_ID !== 'false',
      includeEnvironment: process.env.SLS_INCLUDE_ENVIRONMENT !== 'false',
      includeVersion: process.env.SLS_INCLUDE_VERSION !== 'false',
      includeHostIP: process.env.SLS_INCLUDE_HOST_IP !== 'false',
      includeCategory: process.env.SLS_INCLUDE_CATEGORY !== 'false',
      includeLogger: process.env.SLS_INCLUDE_LOGGER === 'true',
    },
  };

  // 【调试增强】记录最终生成的配置
  internalLogger.debug('生成的 SLS 配置', {
    ...config,
    accessKeyId: config.accessKeyId.substring(0, 6) + '***',
    accessKeySecret: config.accessKeySecret.substring(0, 6) + '***'
  });

  return config;
}

/**
 * 检查 SLS 配置是否完整（向后兼容）
 */
export function checkSlsConfig(): boolean {
  return createSlsConfigFromEnv() !== null;
}

/**
 * 对比两个环境的配置差异
 */
export function compareEnvConfigs(env1: EnvDiagnosticInfo, env2: EnvDiagnosticInfo): {
  environmentDiffs: Record<string, { env1: any; env2: any; different: boolean }>;
  configDiffs: Record<string, { env1: any; env2: any; different: boolean }>;
  summary: {
    hasEnvironmentDiffs: boolean;
    hasConfigDiffs: boolean;
    differentKeys: string[];
  };
} {
  const environmentDiffs: Record<string, { env1: any; env2: any; different: boolean }> = {};
  const configDiffs: Record<string, { env1: any; env2: any; different: boolean }> = {};

  // 对比环境信息
  const envKeys = Object.keys(env1.environment);
  envKeys.forEach(key => {
    const val1 = (env1.environment as any)[key];
    const val2 = (env2.environment as any)[key];
    const different = val1 !== val2;
    environmentDiffs[key] = { env1: val1, env2: val2, different };
  });

  // 对比配置（如果两个环境都有配置）
  if (env1.config && env2.config) {
    const configKeys = Object.keys(env1.config);
    configKeys.forEach(key => {
      const val1 = (env1.config as any)[key];
      const val2 = (env2.config as any)[key];
      const different = val1 !== val2;
      configDiffs[key] = { env1: val1, env2: val2, different };
    });
  }

  const allDifferentKeys = [
    ...Object.keys(environmentDiffs).filter(k => environmentDiffs[k].different),
    ...Object.keys(configDiffs).filter(k => configDiffs[k].different)
  ];

  return {
    environmentDiffs,
    configDiffs,
    summary: {
      hasEnvironmentDiffs: Object.values(environmentDiffs).some(d => d.different),
      hasConfigDiffs: Object.values(configDiffs).some(d => d.different),
      differentKeys: allDifferentKeys
    }
  };
}