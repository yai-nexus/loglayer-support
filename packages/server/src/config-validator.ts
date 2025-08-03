/**
 * 配置验证器 - 提供友好的配置验证和错误提示
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AutoLoggerConfig, ResolvedLoggerConfig } from './auto-config';
import { ENV_MAPPINGS } from './auto-config';

// ==================== 验证结果类型 ====================

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
}

// ==================== 配置验证器 ====================

export class ConfigValidator {
  /**
   * 验证原始配置
   */
  static validateRawConfig(config: AutoLoggerConfig): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // 验证应用配置
    this.validateAppConfig(config.app, issues);
    
    // 验证输出配置
    if (config.outputs) {
      this.validateOutputsConfig(config.outputs, issues);
    }
    
    // 验证功能配置
    if (config.features) {
      this.validateFeaturesConfig(config.features, issues);
    }
    
    return this.buildResult(issues);
  }
  
  /**
   * 验证解析后的配置
   */
  static validateResolvedConfig(config: ResolvedLoggerConfig): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // 验证文件输出权限
    this.validateFilePermissions(config.outputs.file, issues);
    
    // 验证 SLS 配置完整性
    this.validateSlsConfig(config.outputs.sls, issues);
    
    // 验证日志级别
    this.validateLogLevel(config.level, issues);
    
    // 检查输出配置合理性
    this.validateOutputConfiguration(config.outputs, issues);
    
    return this.buildResult(issues);
  }
  
  /**
   * 验证环境变量配置
   */
  static validateEnvironmentVariables(): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // 检查 SLS 相关环境变量
    this.checkSlsEnvironmentVariables(issues);
    
    // 检查应用相关环境变量
    this.checkAppEnvironmentVariables(issues);
    
    return this.buildResult(issues);
  }
  
  // ==================== 私有验证方法 ====================
  
  /**
   * 验证应用配置
   */
  private static validateAppConfig(app: any, issues: ValidationIssue[]): void {
    if (!app) {
      issues.push({
        type: 'error',
        code: 'APP_CONFIG_MISSING',
        message: '缺少应用配置',
        suggestion: '请提供 app 配置对象，至少包含 name 字段'
      });
      return;
    }
    
    if (!app.name) {
      issues.push({
        type: 'error',
        code: 'APP_NAME_MISSING',
        message: '缺少应用名称',
        field: 'app.name',
        suggestion: '请设置 app.name 或环境变量 SERVICE_NAME'
      });
    }
    
    if (app.name && typeof app.name !== 'string') {
      issues.push({
        type: 'error',
        code: 'APP_NAME_INVALID',
        message: '应用名称必须是字符串',
        field: 'app.name'
      });
    }
    
    if (app.environment && !['development', 'production', 'test', 'staging', 'auto'].includes(app.environment)) {
      issues.push({
        type: 'warning',
        code: 'APP_ENV_INVALID',
        message: `无效的环境类型: ${app.environment}`,
        field: 'app.environment',
        suggestion: '支持的环境类型: development, production, test, staging, auto'
      });
    }
  }
  
  /**
   * 验证输出配置
   */
  private static validateOutputsConfig(outputs: any, issues: ValidationIssue[]): void {
    let hasEnabledOutput = false;
    
    // 检查控制台输出
    if (outputs.console?.enabled === true) {
      hasEnabledOutput = true;
    }
    
    // 检查文件输出
    if (outputs.file?.enabled === true) {
      hasEnabledOutput = true;
      
      if (outputs.file.path && typeof outputs.file.path !== 'string') {
        issues.push({
          type: 'error',
          code: 'FILE_PATH_INVALID',
          message: '文件路径必须是字符串',
          field: 'outputs.file.path'
        });
      }
    }
    
    // 检查 SLS 输出
    if (outputs.sls?.enabled === true) {
      hasEnabledOutput = true;
    }
    
    if (!hasEnabledOutput) {
      issues.push({
        type: 'warning',
        code: 'NO_OUTPUT_ENABLED',
        message: '没有启用任何输出方式',
        suggestion: '建议至少启用控制台或文件输出'
      });
    }
  }
  
  /**
   * 验证功能配置
   */
  private static validateFeaturesConfig(features: any, issues: ValidationIssue[]): void {
    // 目前只有调试配置，暂无需特殊验证
    if (features.debug && typeof features.debug.verbose !== 'undefined' && typeof features.debug.verbose !== 'boolean') {
      issues.push({
        type: 'warning',
        code: 'DEBUG_VERBOSE_INVALID',
        message: 'debug.verbose 应该是布尔值',
        field: 'features.debug.verbose'
      });
    }
  }
  
  /**
   * 验证文件权限
   */
  private static validateFilePermissions(fileConfig: any, issues: ValidationIssue[]): void {
    if (!fileConfig.enabled) return;
    
    try {
      const logDir = fileConfig.path;
      
      // 检查目录是否存在
      if (!fs.existsSync(logDir)) {
        try {
          fs.mkdirSync(logDir, { recursive: true });
          issues.push({
            type: 'info',
            code: 'LOG_DIR_CREATED',
            message: `已创建日志目录: ${logDir}`
          });
        } catch (error) {
          issues.push({
            type: 'error',
            code: 'LOG_DIR_CREATE_FAILED',
            message: `无法创建日志目录: ${logDir}`,
            suggestion: '请检查目录权限或手动创建目录'
          });
          return;
        }
      }
      
      // 检查写入权限
      const testFile = path.join(logDir, '.write-test');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        issues.push({
          type: 'error',
          code: 'LOG_DIR_NO_WRITE_PERMISSION',
          message: `日志目录无写入权限: ${logDir}`,
          suggestion: '请检查目录权限设置'
        });
      }
    } catch (error) {
      issues.push({
        type: 'error',
        code: 'FILE_VALIDATION_ERROR',
        message: `文件配置验证失败: ${error}`,
        suggestion: '请检查文件路径配置'
      });
    }
  }
  
  /**
   * 验证 SLS 配置
   */
  private static validateSlsConfig(slsConfig: any, issues: ValidationIssue[]): void {
    if (!slsConfig.enabled) return;
    
    if (!slsConfig.credentials) {
      issues.push({
        type: 'error',
        code: 'SLS_CREDENTIALS_MISSING',
        message: 'SLS 输出已启用但缺少凭证配置',
        suggestion: '请设置相关环境变量或提供凭证配置'
      });
      return;
    }
    
    const required = ['endpoint', 'accessKeyId', 'accessKeySecret', 'project', 'logstore'];
    for (const field of required) {
      if (!slsConfig.credentials[field]) {
        issues.push({
          type: 'error',
          code: 'SLS_FIELD_MISSING',
          message: `SLS 配置缺少必需字段: ${field}`,
          field: `sls.${field}`,
          suggestion: `请设置环境变量或配置 sls.credentials.${field}`
        });
      }
    }
  }
  
  /**
   * 验证日志级别
   */
  private static validateLogLevel(level: string, issues: ValidationIssue[]): void {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      issues.push({
        type: 'warning',
        code: 'LOG_LEVEL_INVALID',
        message: `无效的日志级别: ${level}`,
        suggestion: `支持的日志级别: ${validLevels.join(', ')}`
      });
    }
  }
  
  /**
   * 验证输出配置合理性
   */
  private static validateOutputConfiguration(outputs: any, issues: ValidationIssue[]): void {
    const enabledOutputs = [];
    
    if (outputs.console.enabled) enabledOutputs.push('console');
    if (outputs.file.enabled) enabledOutputs.push('file');
    if (outputs.sls.enabled) enabledOutputs.push('sls');
    
    if (enabledOutputs.length === 0) {
      issues.push({
        type: 'error',
        code: 'NO_OUTPUT_CONFIGURED',
        message: '没有配置任何输出方式',
        suggestion: '请至少启用一种输出方式'
      });
    } else if (enabledOutputs.length === 1 && enabledOutputs[0] === 'sls') {
      issues.push({
        type: 'warning',
        code: 'ONLY_SLS_OUTPUT',
        message: '仅启用了 SLS 输出',
        suggestion: '建议同时启用控制台或文件输出作为备用'
      });
    }
  }
  
  /**
   * 检查 SLS 环境变量
   */
  private static checkSlsEnvironmentVariables(issues: ValidationIssue[]): void {
    const slsEnabled = process.env.NEXT_PUBLIC_SLS_ENABLED === 'true' || process.env.SLS_ENABLED === 'true';
    
    if (slsEnabled) {
      const requiredVars = [
        'SLS_ENDPOINT',
        'SLS_ACCESS_KEY_ID', 
        'SLS_ACCESS_KEY_SECRET',
        'SLS_PROJECT',
        'SLS_LOGSTORE'
      ];
      
      for (const varName of requiredVars) {
        const keys = ENV_MAPPINGS[varName as keyof typeof ENV_MAPPINGS];
        const hasValue = keys?.some(key => process.env[key]);
        
        if (!hasValue) {
          issues.push({
            type: 'warning',
            code: 'SLS_ENV_VAR_MISSING',
            message: `SLS 已启用但缺少环境变量: ${keys?.join(' 或 ')}`,
            suggestion: '请设置相应的环境变量或禁用 SLS 输出'
          });
        }
      }
    }
  }
  
  /**
   * 检查应用环境变量
   */
  private static checkAppEnvironmentVariables(issues: ValidationIssue[]): void {
    const hasAppName = ENV_MAPPINGS.APP_NAME.some(key => process.env[key]);
    
    if (!hasAppName) {
      issues.push({
        type: 'info',
        code: 'APP_NAME_ENV_MISSING',
        message: '未设置应用名称环境变量',
        suggestion: `建议设置以下环境变量之一: ${ENV_MAPPINGS.APP_NAME.join(', ')}`
      });
    }
  }
  
  /**
   * 构建验证结果
   */
  private static buildResult(issues: ValidationIssue[]): ValidationResult {
    const errors = issues.filter(issue => issue.type === 'error');
    const warnings = issues.filter(issue => issue.type === 'warning');
    const infos = issues.filter(issue => issue.type === 'info');
    
    return {
      valid: errors.length === 0,
      issues,
      errors,
      warnings,
      infos
    };
  }
}
