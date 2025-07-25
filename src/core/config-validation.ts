/**
 * 统一配置验证系统
 * 
 * 提供全面的配置验证功能，包括：
 * - 类型验证
 * - 值范围验证
 * - 依赖关系验证
 * - 详细的错误提示
 */

import { ErrorCategory, ErrorSeverity, ERROR_CODES } from './error-handling'

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误列表 */
  errors: ValidationError[]
  /** 警告列表 */
  warnings: ValidationWarning[]
  /** 建议列表 */
  suggestions: ValidationSuggestion[]
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 字段路径 */
  path: string
  /** 当前值 */
  value: any
  /** 期望值或类型 */
  expected?: any
  /** 严重程度 */
  severity: ErrorSeverity
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告消息 */
  message: string
  /** 字段路径 */
  path: string
  /** 当前值 */
  value: any
  /** 建议值 */
  suggested?: any
}

/**
 * 验证建议
 */
export interface ValidationSuggestion {
  /** 建议消息 */
  message: string
  /** 字段路径 */
  path: string
  /** 建议的配置 */
  suggestedConfig: any
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string
  /** 验证函数 */
  validate: (value: any, path: string, fullConfig: any) => ValidationResult
  /** 是否为必需验证 */
  required?: boolean
  /** 依赖的其他字段 */
  dependencies?: string[]
}

/**
 * 字段验证器
 */
export class FieldValidator {
  private rules: ValidationRule[] = []

  /**
   * 添加验证规则
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule)
    return this
  }

  /**
   * 验证字段
   */
  validate(value: any, path: string, fullConfig: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    for (const rule of this.rules) {
      const ruleResult = rule.validate(value, path, fullConfig)
      
      result.errors.push(...ruleResult.errors)
      result.warnings.push(...ruleResult.warnings)
      result.suggestions.push(...ruleResult.suggestions)
    }

    result.valid = result.errors.length === 0
    return result
  }
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  private fieldValidators = new Map<string, FieldValidator>()
  private globalRules: ValidationRule[] = []

  /**
   * 添加字段验证器
   */
  addField(path: string, validator: FieldValidator): this {
    this.fieldValidators.set(path, validator)
    return this
  }

  /**
   * 添加全局验证规则
   */
  addGlobalRule(rule: ValidationRule): this {
    this.globalRules.push(rule)
    return this
  }

  /**
   * 验证配置
   */
  validate(config: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // 验证各个字段
    for (const [path, validator] of this.fieldValidators) {
      const value = this.getValueByPath(config, path)
      const fieldResult = validator.validate(value, path, config)
      
      result.errors.push(...fieldResult.errors)
      result.warnings.push(...fieldResult.warnings)
      result.suggestions.push(...fieldResult.suggestions)
    }

    // 执行全局验证规则
    for (const rule of this.globalRules) {
      const ruleResult = rule.validate(config, '', config)
      
      result.errors.push(...ruleResult.errors)
      result.warnings.push(...ruleResult.warnings)
      result.suggestions.push(...ruleResult.suggestions)
    }

    result.valid = result.errors.length === 0
    return result
  }

  /**
   * 根据路径获取值
   */
  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj
    
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[key]
    }
    
    return current
  }
}

/**
 * 常用验证规则
 */
export const ValidationRules = {
  /**
   * 必需字段验证
   */
  required(fieldName: string): ValidationRule {
    return {
      name: 'required',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value === undefined || value === null) {
          result.errors.push({
            code: ERROR_CODES.CONFIG_MISSING,
            message: `Required field "${fieldName}" is missing`,
            path,
            value,
            severity: ErrorSeverity.HIGH
          })
        }

        result.valid = result.errors.length === 0
        return result
      },
      required: true
    }
  },

  /**
   * 类型验证
   */
  type(expectedType: string): ValidationRule {
    return {
      name: 'type',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value !== undefined && typeof value !== expectedType) {
          result.errors.push({
            code: ERROR_CODES.CONFIG_TYPE_MISMATCH,
            message: `Field "${path}" must be of type ${expectedType}, got ${typeof value}`,
            path,
            value,
            expected: expectedType,
            severity: ErrorSeverity.HIGH
          })
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * 枚举值验证
   */
  enum(allowedValues: any[]): ValidationRule {
    return {
      name: 'enum',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value !== undefined && !allowedValues.includes(value)) {
          result.errors.push({
            code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
            message: `Field "${path}" must be one of: ${allowedValues.join(', ')}. Got: ${value}`,
            path,
            value,
            expected: allowedValues,
            severity: ErrorSeverity.MEDIUM
          })

          // 提供建议
          const suggestion = allowedValues.find(v => 
            typeof v === 'string' && typeof value === 'string' && 
            v.toLowerCase().includes(value.toLowerCase())
          )
          
          if (suggestion) {
            result.suggestions.push({
              message: `Did you mean "${suggestion}"?`,
              path,
              suggestedConfig: suggestion
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * 数值范围验证
   */
  range(min?: number, max?: number): ValidationRule {
    return {
      name: 'range',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            result.errors.push({
              code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
              message: `Field "${path}" must be >= ${min}, got ${value}`,
              path,
              value,
              expected: `>= ${min}`,
              severity: ErrorSeverity.MEDIUM
            })
          }

          if (max !== undefined && value > max) {
            result.errors.push({
              code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
              message: `Field "${path}" must be <= ${max}, got ${value}`,
              path,
              value,
              expected: `<= ${max}`,
              severity: ErrorSeverity.MEDIUM
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * 字符串长度验证
   */
  stringLength(min?: number, max?: number): ValidationRule {
    return {
      name: 'stringLength',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'string') {
          if (min !== undefined && value.length < min) {
            result.errors.push({
              code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
              message: `Field "${path}" must be at least ${min} characters, got ${value.length}`,
              path,
              value,
              expected: `>= ${min} characters`,
              severity: ErrorSeverity.MEDIUM
            })
          }

          if (max !== undefined && value.length > max) {
            result.errors.push({
              code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
              message: `Field "${path}" must be at most ${max} characters, got ${value.length}`,
              path,
              value,
              expected: `<= ${max} characters`,
              severity: ErrorSeverity.MEDIUM
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * URL 格式验证
   */
  url(): ValidationRule {
    return {
      name: 'url',
      validate: (value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'string' && value.length > 0) {
          try {
            new URL(value)
          } catch {
            result.errors.push({
              code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
              message: `Field "${path}" must be a valid URL, got: ${value}`,
              path,
              value,
              expected: 'Valid URL format',
              severity: ErrorSeverity.MEDIUM
            })

            // 提供建议
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
              result.suggestions.push({
                message: 'URL should start with http:// or https://',
                path,
                suggestedConfig: value.startsWith('/') ? `http://localhost${value}` : `https://${value}`
              })
            }
          }
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * 数组验证
   */
  array(itemValidator?: FieldValidator): ValidationRule {
    return {
      name: 'array',
      validate: (value, path, fullConfig) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (value !== undefined && !Array.isArray(value)) {
          result.errors.push({
            code: ERROR_CODES.CONFIG_TYPE_MISMATCH,
            message: `Field "${path}" must be an array, got ${typeof value}`,
            path,
            value,
            expected: 'Array',
            severity: ErrorSeverity.HIGH
          })
        } else if (Array.isArray(value) && itemValidator) {
          // 验证数组项
          value.forEach((item, index) => {
            const itemPath = `${path}[${index}]`
            const itemResult = itemValidator.validate(item, itemPath, fullConfig)
            
            result.errors.push(...itemResult.errors)
            result.warnings.push(...itemResult.warnings)
            result.suggestions.push(...itemResult.suggestions)
          })
        }

        result.valid = result.errors.length === 0
        return result
      }
    }
  },

  /**
   * 自定义验证
   */
  custom(validator: (value: any, path: string, fullConfig: any) => ValidationResult): ValidationRule {
    return {
      name: 'custom',
      validate: validator
    }
  }
}

/**
 * 创建配置验证器
 */
export function createConfigValidator(): ConfigValidator {
  return new ConfigValidator()
}

/**
 * 创建字段验证器
 */
export function createFieldValidator(): FieldValidator {
  return new FieldValidator()
}

/**
 * 格式化验证结果为用户友好的消息
 */
export function formatValidationResult(result: ValidationResult): string {
  const messages: string[] = []

  if (result.errors.length > 0) {
    messages.push('❌ Configuration Errors:')
    result.errors.forEach(error => {
      messages.push(`  • ${error.message} (${error.code})`)
    })
  }

  if (result.warnings.length > 0) {
    messages.push('⚠️  Configuration Warnings:')
    result.warnings.forEach(warning => {
      messages.push(`  • ${warning.message}`)
    })
  }

  if (result.suggestions.length > 0) {
    messages.push('💡 Suggestions:')
    result.suggestions.forEach(suggestion => {
      messages.push(`  • ${suggestion.message}`)
    })
  }

  return messages.join('\n')
}
