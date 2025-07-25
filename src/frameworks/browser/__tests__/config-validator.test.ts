/**
 * 浏览器配置验证器单元测试
 */

import {
  createBrowserConfigValidator,
  validateBrowserConfig,
  validateBrowserConfigStrict
} from '../config-validator'
import type { BrowserLoggerConfig } from '../../browser'

describe('createBrowserConfigValidator', () => {
  let validator: ReturnType<typeof createBrowserConfigValidator>

  beforeEach(() => {
    validator = createBrowserConfigValidator()
  })

  describe('日志级别验证', () => {
    it('应该接受有效的日志级别', () => {
      const validLevels = ['debug', 'info', 'warn', 'error']
      
      validLevels.forEach(level => {
        const result = validator.validate({ level })
        expect(result.valid).toBe(true)
      })
    })

    it('应该拒绝无效的日志级别', () => {
      const result = validator.validate({ level: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('must be one of')
    })
  })

  describe('输出配置验证', () => {
    it('应该接受有效的输出配置', () => {
      const config: BrowserLoggerConfig = {
        outputs: {
          console: true,
          localStorage: { enabled: true, maxEntries: 100 },
          http: { enabled: true, endpoint: '/api/logs' }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(true)
    })

    it('应该警告未知的输出类型', () => {
      const config = {
        outputs: {
          console: true,
          unknownOutput: true
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(true) // 警告不影响有效性
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].message).toContain('Unknown output type')
    })

    it('应该警告没有启用的输出', () => {
      const config = {
        outputs: {
          console: false,
          localStorage: { enabled: false },
          http: { enabled: false }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('No outputs are enabled'))).toBe(true)
    })
  })

  describe('控制台输出验证', () => {
    it('应该验证控制台颜色配置', () => {
      const config = {
        outputs: {
          console: {
            enabled: true,
            colors: {
              debug: '#888',
              info: '#2196F3',
              warn: '#FF9800',
              error: 123 // 无效类型
            }
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('Color for level "error" must be a string'))).toBe(true)
    })

    it('应该验证 groupCollapsed 配置', () => {
      const config = {
        outputs: {
          console: {
            enabled: true,
            groupCollapsed: 'invalid' // 应该是 boolean
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('groupCollapsed must be a boolean'))).toBe(true)
    })
  })

  describe('localStorage 输出验证', () => {
    it('应该验证 maxEntries 配置', () => {
      const invalidConfigs = [
        { outputs: { localStorage: { enabled: true, maxEntries: 'invalid' } } },
        { outputs: { localStorage: { enabled: true, maxEntries: 0 } } },
        { outputs: { localStorage: { enabled: true, maxEntries: -5 } } }
      ]

      invalidConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(false)
      })
    })

    it('应该警告过大的 maxEntries', () => {
      const config = {
        outputs: {
          localStorage: {
            enabled: true,
            maxEntries: 50000 // 很大的值
          }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('very large'))).toBe(true)
    })

    it('应该验证 key 配置', () => {
      const config = {
        outputs: {
          localStorage: {
            enabled: true,
            key: 123 // 应该是 string
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('key must be a string'))).toBe(true)
    })
  })

  describe('HTTP 输出验证', () => {
    it('应该验证 endpoint 配置', () => {
      const invalidConfigs = [
        { outputs: { http: { enabled: true, endpoint: 123 } } }, // 错误类型
        { outputs: { http: { enabled: true, endpoint: '' } } }, // 空字符串
      ]

      invalidConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(false)
      })
    })

    it('应该接受相对路径的 endpoint', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            endpoint: '/api/logs'
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(true)
    })

    it('应该接受完整 URL 的 endpoint', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            endpoint: 'https://api.example.com/logs'
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(true)
    })

    it('应该为无效 URL 提供建议', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            endpoint: 'invalid-url'
          }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('should be a valid URL'))).toBe(true)
    })

    it('应该验证 batchSize 配置', () => {
      const invalidConfigs = [
        { outputs: { http: { enabled: true, batchSize: 'invalid' } } },
        { outputs: { http: { enabled: true, batchSize: 0 } } },
        { outputs: { http: { enabled: true, batchSize: -1 } } }
      ]

      invalidConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(false)
      })
    })

    it('应该警告过大的 batchSize', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            batchSize: 5000 // 很大的值
          }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('very large'))).toBe(true)
    })

    it('应该验证 flushInterval 配置', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            flushInterval: 'invalid' // 应该是 number
          }
        }
      }

      const result = validator.validate(config)
      expect(result.valid).toBe(false)
    })

    it('应该警告过短的 flushInterval', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            flushInterval: 50 // 很短的间隔
          }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('very short'))).toBe(true)
    })

    it('应该验证 retryAttempts 配置', () => {
      const invalidConfigs = [
        { outputs: { http: { enabled: true, retryAttempts: 'invalid' } } },
        { outputs: { http: { enabled: true, retryAttempts: -1 } } }
      ]

      invalidConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(false)
      })
    })

    it('应该警告过高的 retryAttempts', () => {
      const config = {
        outputs: {
          http: {
            enabled: true,
            retryAttempts: 20 // 很高的重试次数
          }
        }
      }

      const result = validator.validate(config)
      expect(result.warnings.some(w => w.message.includes('very high'))).toBe(true)
    })
  })

  describe('采样配置验证', () => {
    it('应该验证采样率范围', () => {
      const validConfigs = [
        { sampling: { rate: 0 } },
        { sampling: { rate: 0.5 } },
        { sampling: { rate: 1 } }
      ]

      validConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(true)
      })

      const invalidConfigs = [
        { sampling: { rate: -0.1 } },
        { sampling: { rate: 1.1 } },
        { sampling: { rate: 'invalid' } }
      ]

      invalidConfigs.forEach(config => {
        const result = validator.validate(config)
        expect(result.valid).toBe(false)
      })
    })
  })
})

describe('validateBrowserConfig', () => {
  it('应该返回验证结果', () => {
    const config: BrowserLoggerConfig = {
      level: 'info',
      outputs: {
        console: true
      }
    }

    const result = validateBrowserConfig(config)
    expect(result).toBeDefined()
    expect(typeof result.valid).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(Array.isArray(result.suggestions)).toBe(true)
  })

  it('应该验证有效配置', () => {
    const config: BrowserLoggerConfig = {
      level: 'debug',
      outputs: {
        console: { enabled: true, colorized: true },
        localStorage: { enabled: true, maxEntries: 500 },
        http: { enabled: true, endpoint: '/api/logs', batchSize: 10 }
      },
      sampling: { rate: 0.8 }
    }

    const result = validateBrowserConfig(config)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('应该检测无效配置', () => {
    const config = {
      level: 'invalid-level',
      outputs: {
        console: { enabled: true, groupCollapsed: 'invalid' },
        http: { enabled: true, endpoint: 123 }
      },
      sampling: { rate: 2.0 }
    }

    const result = validateBrowserConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateBrowserConfigStrict', () => {
  it('应该在配置有效时不抛出错误', () => {
    const config: BrowserLoggerConfig = {
      level: 'info',
      outputs: { console: true }
    }

    expect(() => validateBrowserConfigStrict(config)).not.toThrow()
  })

  it('应该在配置无效时抛出错误', () => {
    const config = {
      level: 'invalid-level',
      outputs: { console: true }
    }

    expect(() => validateBrowserConfigStrict(config)).toThrow('Browser logger configuration validation failed')
  })

  it('应该在有警告时输出到控制台', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    const config = {
      outputs: {
        unknownOutput: true
      }
    }

    validateBrowserConfigStrict(config)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Browser logger configuration warnings'),
      expect.any(String)
    )

    consoleSpy.mockRestore()
  })
})
