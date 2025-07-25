/**
 * 浏览器端日志器配置验证
 */

import { 
  ConfigValidator, 
  FieldValidator, 
  ValidationRules, 
  createConfigValidator, 
  createFieldValidator,
  ValidationResult,
  formatValidationResult
} from '../../core'
import type { BrowserLoggerConfig } from '../browser'

/**
 * 创建浏览器日志器配置验证器
 */
export function createBrowserConfigValidator(): ConfigValidator {
  const validator = createConfigValidator()

  // 验证日志级别
  validator.addField('level', 
    createFieldValidator()
      .addRule(ValidationRules.type('string'))
      .addRule(ValidationRules.enum(['debug', 'info', 'warn', 'error']))
  )

  // 验证输出配置
  validator.addField('outputs', 
    createFieldValidator()
      .addRule(ValidationRules.type('object'))
      .addRule(ValidationRules.custom((value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'object' && value !== null) {
          const outputs = Object.keys(value)
          const validOutputs = ['console', 'localStorage', 'http', 'indexedDB']
          
          for (const output of outputs) {
            if (!validOutputs.includes(output)) {
              result.warnings.push({
                message: `Unknown output type "${output}". Valid types: ${validOutputs.join(', ')}`,
                path: `${path}.${output}`,
                value: output,
                suggested: validOutputs.find(v => v.toLowerCase().includes(output.toLowerCase()))
              })
            }
          }

          // 检查是否至少有一个输出启用
          const enabledOutputs = outputs.filter(key => {
            const config = value[key]
            return config === true || (typeof config === 'object' && config?.enabled !== false)
          })

          if (enabledOutputs.length === 0) {
            result.warnings.push({
              message: 'No outputs are enabled. Logs will not be recorded anywhere.',
              path,
              value,
              suggested: { console: true }
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }))
  )

  // 验证控制台输出配置
  validator.addField('outputs.console', 
    createFieldValidator()
      .addRule(ValidationRules.custom((value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'object' && value !== null) {
          // 验证颜色配置
          if (value.colors && typeof value.colors === 'object') {
            const validLevels = ['debug', 'info', 'warn', 'error']
            for (const level of validLevels) {
              if (value.colors[level] && typeof value.colors[level] !== 'string') {
                result.errors.push({
                  code: 'E3002',
                  message: `Color for level "${level}" must be a string`,
                  path: `${path}.colors.${level}`,
                  value: value.colors[level],
                  expected: 'string (CSS color)',
                  severity: 'medium' as any
                })
              }
            }
          }

          // 验证 groupCollapsed
          if (value.groupCollapsed !== undefined && typeof value.groupCollapsed !== 'boolean') {
            result.errors.push({
              code: 'E3002',
              message: 'groupCollapsed must be a boolean',
              path: `${path}.groupCollapsed`,
              value: value.groupCollapsed,
              expected: 'boolean',
              severity: 'medium' as any
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }))
  )

  // 验证 localStorage 输出配置
  validator.addField('outputs.localStorage', 
    createFieldValidator()
      .addRule(ValidationRules.custom((value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'object' && value !== null) {
          // 验证 maxEntries
          if (value.maxEntries !== undefined) {
            if (typeof value.maxEntries !== 'number') {
              result.errors.push({
                code: 'E3002',
                message: 'maxEntries must be a number',
                path: `${path}.maxEntries`,
                value: value.maxEntries,
                expected: 'number',
                severity: 'medium' as any
              })
            } else if (value.maxEntries <= 0) {
              result.errors.push({
                code: 'E3003',
                message: 'maxEntries must be greater than 0',
                path: `${path}.maxEntries`,
                value: value.maxEntries,
                expected: '> 0',
                severity: 'medium' as any
              })
            } else if (value.maxEntries > 10000) {
              result.warnings.push({
                message: 'maxEntries is very large and may cause performance issues',
                path: `${path}.maxEntries`,
                value: value.maxEntries,
                suggested: 1000
              })
            }
          }

          // 验证 key
          if (value.key !== undefined && typeof value.key !== 'string') {
            result.errors.push({
              code: 'E3002',
              message: 'key must be a string',
              path: `${path}.key`,
              value: value.key,
              expected: 'string',
              severity: 'medium' as any
            })
          }
        }

        result.valid = result.errors.length === 0
        return result
      }))
  )

  // 验证 HTTP 输出配置
  validator.addField('outputs.http', 
    createFieldValidator()
      .addRule(ValidationRules.custom((value, path) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        if (typeof value === 'object' && value !== null) {
          // 验证 endpoint
          if (value.endpoint !== undefined) {
            if (typeof value.endpoint !== 'string') {
              result.errors.push({
                code: 'E3002',
                message: 'endpoint must be a string',
                path: `${path}.endpoint`,
                value: value.endpoint,
                expected: 'string (URL)',
                severity: 'high' as any
              })
            } else if (value.endpoint.length === 0) {
              result.errors.push({
                code: 'E3001',
                message: 'endpoint cannot be empty',
                path: `${path}.endpoint`,
                value: value.endpoint,
                expected: 'non-empty string',
                severity: 'high' as any
              })
            } else {
              // 验证 URL 格式
              try {
                if (value.endpoint.startsWith('/')) {
                  // 相对路径，这是可以的
                } else {
                  new URL(value.endpoint)
                }
              } catch {
                result.warnings.push({
                  message: 'endpoint should be a valid URL or start with "/"',
                  path: `${path}.endpoint`,
                  value: value.endpoint,
                  suggested: value.endpoint.startsWith('/') ? value.endpoint : `/${value.endpoint}`
                })
              }
            }
          }

          // 验证 batchSize
          if (value.batchSize !== undefined) {
            if (typeof value.batchSize !== 'number') {
              result.errors.push({
                code: 'E3002',
                message: 'batchSize must be a number',
                path: `${path}.batchSize`,
                value: value.batchSize,
                expected: 'number',
                severity: 'medium' as any
              })
            } else if (value.batchSize <= 0) {
              result.errors.push({
                code: 'E3003',
                message: 'batchSize must be greater than 0',
                path: `${path}.batchSize`,
                value: value.batchSize,
                expected: '> 0',
                severity: 'medium' as any
              })
            } else if (value.batchSize > 1000) {
              result.warnings.push({
                message: 'batchSize is very large and may cause performance issues',
                path: `${path}.batchSize`,
                value: value.batchSize,
                suggested: 50
              })
            }
          }

          // 验证 flushInterval
          if (value.flushInterval !== undefined) {
            if (typeof value.flushInterval !== 'number') {
              result.errors.push({
                code: 'E3002',
                message: 'flushInterval must be a number',
                path: `${path}.flushInterval`,
                value: value.flushInterval,
                expected: 'number (milliseconds)',
                severity: 'medium' as any
              })
            } else if (value.flushInterval < 100) {
              result.warnings.push({
                message: 'flushInterval is very short and may cause performance issues',
                path: `${path}.flushInterval`,
                value: value.flushInterval,
                suggested: 1000
              })
            }
          }

          // 验证 retryAttempts
          if (value.retryAttempts !== undefined) {
            if (typeof value.retryAttempts !== 'number') {
              result.errors.push({
                code: 'E3002',
                message: 'retryAttempts must be a number',
                path: `${path}.retryAttempts`,
                value: value.retryAttempts,
                expected: 'number',
                severity: 'medium' as any
              })
            } else if (value.retryAttempts < 0) {
              result.errors.push({
                code: 'E3003',
                message: 'retryAttempts cannot be negative',
                path: `${path}.retryAttempts`,
                value: value.retryAttempts,
                expected: '>= 0',
                severity: 'medium' as any
              })
            } else if (value.retryAttempts > 10) {
              result.warnings.push({
                message: 'retryAttempts is very high and may cause delays',
                path: `${path}.retryAttempts`,
                value: value.retryAttempts,
                suggested: 3
              })
            }
          }
        }

        result.valid = result.errors.length === 0
        return result
      }))
  )

  // 验证采样配置
  validator.addField('sampling.rate', 
    createFieldValidator()
      .addRule(ValidationRules.type('number'))
      .addRule(ValidationRules.range(0, 1))
  )

  return validator
}

/**
 * 验证浏览器日志器配置
 */
export function validateBrowserConfig(config: BrowserLoggerConfig): ValidationResult {
  const validator = createBrowserConfigValidator()
  return validator.validate(config)
}

/**
 * 验证浏览器日志器配置并抛出错误（如果有）
 */
export function validateBrowserConfigStrict(config: BrowserLoggerConfig): void {
  const result = validateBrowserConfig(config)
  
  if (!result.valid) {
    const message = formatValidationResult(result)
    throw new Error(`Browser logger configuration validation failed:\n${message}`)
  }

  // 输出警告和建议
  if (result.warnings.length > 0 || result.suggestions.length > 0) {
    const message = formatValidationResult(result)
    console.warn(`Browser logger configuration warnings:\n${message}`)
  }
}
