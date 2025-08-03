/**
 * 自动日志器 - 简化的业务接入接口
 */

import { LogLayer } from 'loglayer';
import type { LogLayerConfig } from 'loglayer';
import type { ServerOutput } from '@yai-loglayer/core';
import { ServerTransport } from './server-transport';
import { ConfigResolver } from './config-resolver';
import { ConfigValidator } from './config-validator';
import type { AutoLoggerConfig, ResolvedLoggerConfig } from './auto-config';

// ==================== 简化的日志器接口 ====================

/**
 * 简化的日志器接口 - 无需 await
 */
export interface SimpleLogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;

  // 工具方法
  isReady(): boolean;
  getConfig(): ResolvedLoggerConfig;
}

// ==================== 内部日志器实现 ====================

class AutoLoggerImpl implements SimpleLogger {
  private loggerPromise: Promise<LogLayer>;
  private resolvedConfig!: ResolvedLoggerConfig;
  private isInitialized = false;
  private fallbackLogger: SimpleLogger;
  
  constructor(config: AutoLoggerConfig) {
    this.fallbackLogger = this.createFallbackLogger();
    this.loggerPromise = this.initializeLogger(config);
  }
  
  /**
   * 初始化日志器
   */
  private async initializeLogger(config: AutoLoggerConfig): Promise<LogLayer> {
    try {
      // 1. 验证原始配置
      const rawValidation = ConfigValidator.validateRawConfig(config);
      if (!rawValidation.valid) {
        this.logValidationIssues(rawValidation);
        if (rawValidation.errors.length > 0) {
          throw new Error(`配置验证失败: ${rawValidation.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      // 2. 解析配置
      const resolver = new ConfigResolver();
      this.resolvedConfig = await resolver.resolve(config);
      
      // 3. 验证解析后的配置
      const resolvedValidation = ConfigValidator.validateResolvedConfig(this.resolvedConfig);
      if (!resolvedValidation.valid) {
        this.logValidationIssues(resolvedValidation);
        if (resolvedValidation.errors.length > 0) {
          throw new Error(`解析后配置验证失败: ${resolvedValidation.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      // 4. 创建输出配置
      const outputs = this.createServerOutputs(this.resolvedConfig);
      
      // 5. 创建 LogLayer 实例
      const transport = new ServerTransport(outputs);
      const logLayerConfig: LogLayerConfig = { transport };
      const logger = new LogLayer(logLayerConfig);
      
      this.isInitialized = true;
      
      // 记录初始化成功信息
      if (this.resolvedConfig.features.debug.enabled) {
        console.info('[AutoLogger] 初始化成功', {
          app: this.resolvedConfig.app.name,
          environment: this.resolvedConfig.app.environment,
          outputs: this.getEnabledOutputs(),
          level: this.resolvedConfig.level
        });
      }
      
      return logger;
    } catch (error) {
      console.error('AutoLogger 初始化失败:', error);
      
      // 返回 fallback logger 的 LogLayer 包装
      return this.createFallbackLogLayer();
    }
  }
  
  /**
   * 创建服务端输出配置
   */
  private createServerOutputs(config: ResolvedLoggerConfig): ServerOutput[] {
    const outputs: ServerOutput[] = [];
    
    // 控制台输出
    if (config.outputs.console.enabled) {
      outputs.push({ type: 'stdout' });
    }
    
    // 文件输出
    if (config.outputs.file.enabled) {
      outputs.push({
        type: 'file',
        config: {
          dir: config.outputs.file.path,
          filename: config.outputs.file.filename,
          ...config.outputs.file.rotation
        }
      });
    }
    
    // SLS 输出
    if (config.outputs.sls.enabled && config.outputs.sls.credentials) {
      outputs.push({
        type: 'sls',
        config: {
          ...config.outputs.sls.credentials,
          appName: config.app.name
        }
      });
    }
    
    // 确保至少有一个输出
    if (outputs.length === 0) {
      outputs.push({ type: 'stdout' });
    }
    
    return outputs;
  }
  
  /**
   * 创建 fallback logger
   */
  private createFallbackLogger(): SimpleLogger {
    return {
      debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || ''),
      info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data || ''),
      warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
      error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
      isReady: () => false,
      getConfig: () => ({} as any)
    };
  }
  
  /**
   * 创建 fallback LogLayer
   */
  private createFallbackLogLayer(): LogLayer {
    const outputs: ServerOutput[] = [{ type: 'stdout' }];
    const transport = new ServerTransport(outputs);
    return new LogLayer({ transport });
  }
  
  /**
   * 记录验证问题
   */
  private logValidationIssues(validation: any): void {
    validation.warnings.forEach((warning: any) => {
      console.warn(`[AutoLogger Warning] ${warning.message}${warning.suggestion ? ` - ${warning.suggestion}` : ''}`);
    });
    
    validation.infos.forEach((info: any) => {
      console.info(`[AutoLogger Info] ${info.message}${info.suggestion ? ` - ${info.suggestion}` : ''}`);
    });
  }
  
  /**
   * 获取已启用的输出类型
   */
  private getEnabledOutputs(): string[] {
    if (!this.resolvedConfig) return [];
    
    const enabled = [];
    if (this.resolvedConfig.outputs.console.enabled) enabled.push('console');
    if (this.resolvedConfig.outputs.file.enabled) enabled.push('file');
    if (this.resolvedConfig.outputs.sls.enabled) enabled.push('sls');
    return enabled;
  }
  
  // ==================== 公共接口实现 ====================
  
  debug(message: string, data?: any): void {
    if (this.isInitialized) {
      this.loggerPromise.then(logger => logger.debug(message, this.enrichData(data)));
    } else {
      this.fallbackLogger.debug(message, data);
    }
  }
  
  info(message: string, data?: any): void {
    if (this.isInitialized) {
      this.loggerPromise.then(logger => logger.info(message, this.enrichData(data)));
    } else {
      this.fallbackLogger.info(message, data);
    }
  }
  
  warn(message: string, data?: any): void {
    if (this.isInitialized) {
      this.loggerPromise.then(logger => logger.warn(message, this.enrichData(data)));
    } else {
      this.fallbackLogger.warn(message, data);
    }
  }
  
  error(message: string, data?: any): void {
    if (this.isInitialized) {
      this.loggerPromise.then(logger => logger.error(message, this.enrichData(data)));
    } else {
      this.fallbackLogger.error(message, data);
    }
  }
  

  
  isReady(): boolean {
    return this.isInitialized;
  }
  
  getConfig(): ResolvedLoggerConfig {
    return this.resolvedConfig;
  }
  
  /**
   * 丰富日志数据
   */
  private enrichData(data?: any): any {
    if (!this.resolvedConfig) return data;
    
    return {
      ...data,
      service: this.resolvedConfig.app.service,
      environment: this.resolvedConfig.app.environment,
      version: this.resolvedConfig.app.version,
      timestamp: new Date().toISOString()
    };
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建自动配置的日志器
 */
export function createAutoLogger(config: AutoLoggerConfig): SimpleLogger {
  return new AutoLoggerImpl(config);
}

/**
 * 创建带有项目模板的日志器
 */
export function createAutoLoggerWithTemplate(
  projectType: 'nextjs' | 'express' | 'generic',
  config: Partial<AutoLoggerConfig>
): SimpleLogger {
  const baseConfig: AutoLoggerConfig = {
    app: {
      name: config.app?.name || 'unknown-app',
      environment: 'auto',
      version: 'auto',
      service: projectType === 'nextjs' ? 'nextjs-app' : 
               projectType === 'express' ? 'express-app' : 'nodejs-app'
    },
    ...config
  };
  
  return createAutoLogger(baseConfig);
}
