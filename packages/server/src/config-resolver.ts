/**
 * 配置解析器 - 智能解析自动配置
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  AutoLoggerConfig,
  ResolvedLoggerConfig,
  ResolvedAppConfig,
  ResolvedOutputsConfig,
  SlsCredentials,
  ProjectType,
  Environment
} from './auto-config';
import { DEFAULT_CONFIG, ENV_MAPPINGS, CONFIG_TEMPLATES } from './auto-config';

// ==================== 环境变量工具 ====================

/**
 * 获取环境变量值（支持多个候选键）
 */
function getEnvValue(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}



// ==================== 路径工具 ====================

/**
 * 自动检测项目根目录
 */
function detectProjectRoot(): string {
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    // 检查是否存在项目标识文件
    const indicators = ['package.json', 'nx.json', 'lerna.json', '.git'];
    
    for (const indicator of indicators) {
      if (fs.existsSync(path.join(currentDir, indicator))) {
        return currentDir;
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // 回退到当前工作目录
  return process.cwd();
}

/**
 * 自动检测项目类型
 */
function detectProjectType(): ProjectType {
  const projectRoot = detectProjectRoot();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (dependencies.next || dependencies['@next/core']) {
        return 'nextjs';
      }
      
      if (dependencies.express) {
        return 'express';
      }
    } catch (error) {
      // 忽略解析错误
    }
  }
  
  return 'generic';
}

/**
 * 获取应用版本
 */
function getAppVersion(): string {
  // 首先尝试环境变量
  const envVersion = getEnvValue(ENV_MAPPINGS.APP_VERSION);
  if (envVersion) return envVersion;
  
  // 尝试从 package.json 读取
  try {
    const projectRoot = detectProjectRoot();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version || '1.0.0';
    }
  } catch (error) {
    // 忽略解析错误
  }
  
  return '1.0.0';
}

// ==================== 配置解析器 ====================

/**
 * 配置解析器类
 */
export class ConfigResolver {
  private projectRoot: string;
  private projectType: ProjectType;
  
  constructor() {
    this.projectRoot = detectProjectRoot();
    this.projectType = detectProjectType();
  }
  
  /**
   * 解析完整配置
   */
  async resolve(config: AutoLoggerConfig): Promise<ResolvedLoggerConfig> {
    // 合并默认配置和项目模板
    const template = CONFIG_TEMPLATES[this.projectType];
    const mergedConfig = this.mergeConfigs(DEFAULT_CONFIG, template, config);
    
    return {
      app: await this.resolveAppConfig(mergedConfig.app!),
      outputs: await this.resolveOutputsConfig(mergedConfig.outputs!),
      features: {
        debug: {
          enabled: this.resolveAutoBoolean(mergedConfig.features!.debug!.enabled!, false),
          verbose: mergedConfig.features!.debug!.verbose!
        }
      },
      level: this.resolveLogLevel(mergedConfig.level!)
    };
  }
  
  /**
   * 解析应用配置
   */
  private async resolveAppConfig(config: any): Promise<ResolvedAppConfig> {
    const name = config.name || getEnvValue(ENV_MAPPINGS.APP_NAME) || 'unknown-app';
    const environment = this.resolveEnvironment(config.environment);
    const version = config.version === 'auto' ? getAppVersion() : (config.version || '1.0.0');
    const service = config.service || name;
    
    return { name, environment, version, service };
  }
  
  /**
   * 解析输出配置
   */
  private async resolveOutputsConfig(config: any): Promise<ResolvedOutputsConfig> {
    return {
      console: {
        enabled: this.resolveAutoBoolean(config.console?.enabled, this.isDevelopment()),
        format: config.console?.format || 'pretty',
        colors: this.resolveAutoBoolean(config.console?.colors, true)
      },
      file: {
        enabled: config.file?.enabled ?? true,
        path: await this.resolveFilePath(config.file?.path),
        filename: config.file?.filename || 'app.log',
        rotation: config.file?.rotation
      },
      sls: {
        enabled: this.resolveAutoBoolean(config.sls?.enabled, false),
        credentials: await this.resolveSlsCredentials(config.sls?.config),
        topic: config.sls?.topic || 'loglayer',
        source: config.sls?.source || 'nodejs'
      }
    };
  }
  
  /**
   * 解析环境类型
   */
  private resolveEnvironment(env?: Environment): Exclude<Environment, 'auto'> {
    if (env && env !== 'auto') return env;
    
    const nodeEnv = getEnvValue(ENV_MAPPINGS.NODE_ENV);
    switch (nodeEnv) {
      case 'development':
      case 'dev':
        return 'development';
      case 'production':
      case 'prod':
        return 'production';
      case 'test':
        return 'test';
      case 'staging':
        return 'staging';
      default:
        return 'development';
    }
  }
  
  /**
   * 解析自动布尔值
   */
  private resolveAutoBoolean(value: any, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (value === 'auto') return defaultValue;
    return defaultValue;
  }
  
  /**
   * 解析文件路径
   */
  private async resolveFilePath(pathConfig?: string | 'auto'): Promise<string> {
    if (!pathConfig || pathConfig === 'auto') {
      // 自动检测日志目录
      const logsDir = path.join(this.projectRoot, 'logs');
      
      // 确保目录存在
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      return logsDir;
    }
    
    // 处理相对路径
    if (!path.isAbsolute(pathConfig)) {
      return path.resolve(this.projectRoot, pathConfig);
    }
    
    return pathConfig;
  }
  
  /**
   * 解析 SLS 凭证
   */
  private async resolveSlsCredentials(config?: 'env' | SlsCredentials): Promise<SlsCredentials | undefined> {
    if (!config || config === 'env') {
      // 从环境变量读取
      const endpoint = getEnvValue(ENV_MAPPINGS.SLS_ENDPOINT);
      const accessKeyId = getEnvValue(ENV_MAPPINGS.SLS_ACCESS_KEY_ID);
      const accessKeySecret = getEnvValue(ENV_MAPPINGS.SLS_ACCESS_KEY_SECRET);
      const project = getEnvValue(ENV_MAPPINGS.SLS_PROJECT);
      const logstore = getEnvValue(ENV_MAPPINGS.SLS_LOGSTORE);
      const region = getEnvValue(ENV_MAPPINGS.SLS_REGION);
      
      if (endpoint && accessKeyId && accessKeySecret && project && logstore) {
        return { endpoint, accessKeyId, accessKeySecret, project, logstore, region };
      }
      
      return undefined;
    }
    
    return config;
  }
  
  /**
   * 解析日志级别
   */
  private resolveLogLevel(level: string | 'auto'): string {
    if (level !== 'auto') return level;
    
    const envLevel = getEnvValue(ENV_MAPPINGS.LOG_LEVEL);
    if (envLevel) return envLevel;
    
    return this.isDevelopment() ? 'debug' : 'info';
  }
  
  /**
   * 检查是否为开发环境
   */
  private isDevelopment(): boolean {
    const env = getEnvValue(ENV_MAPPINGS.NODE_ENV);
    return !env || env === 'development' || env === 'dev';
  }
  
  /**
   * 合并配置对象
   */
  private mergeConfigs(...configs: any[]): any {
    return configs.reduce((merged, config) => {
      if (!config) return merged;
      
      for (const key in config) {
        if (config[key] && typeof config[key] === 'object' && !Array.isArray(config[key])) {
          merged[key] = this.mergeConfigs(merged[key] || {}, config[key]);
        } else {
          merged[key] = config[key];
        }
      }
      
      return merged;
    }, {});
  }
}
