/**
 * 配置验证系统单元测试
 */

import {
  ConfigValidator,
  FieldValidator,
  ValidationRules,
  createConfigValidator,
  createFieldValidator,
  formatValidationResult,
  ValidationResult,
} from '../config-validation';
import { ERROR_CODES, ErrorSeverity } from '../error-handling';

describe('ValidationRules', () => {
  describe('required', () => {
    it('应该验证必需字段', () => {
      const rule = ValidationRules.required('testField');

      const validResult = rule.validate('value', 'test.field', {});
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = rule.validate(undefined, 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].code).toBe(ERROR_CODES.CONFIG_MISSING);
    });
  });

  describe('type', () => {
    it('应该验证字段类型', () => {
      const rule = ValidationRules.type('string');

      const validResult = rule.validate('hello', 'test.field', {});
      expect(validResult.valid).toBe(true);

      const invalidResult = rule.validate(123, 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].code).toBe(ERROR_CODES.CONFIG_TYPE_MISMATCH);
      expect(invalidResult.errors[0].expected).toBe('string');
    });

    it('应该允许 undefined 值', () => {
      const rule = ValidationRules.type('string');

      const result = rule.validate(undefined, 'test.field', {});
      expect(result.valid).toBe(true);
    });
  });

  describe('enum', () => {
    it('应该验证枚举值', () => {
      const rule = ValidationRules.enum(['debug', 'info', 'warn', 'error']);

      const validResult = rule.validate('info', 'test.field', {});
      expect(validResult.valid).toBe(true);

      const invalidResult = rule.validate('invalid', 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].code).toBe(ERROR_CODES.VALIDATION_OUT_OF_RANGE);
    });

    it('应该提供拼写建议', () => {
      const rule = ValidationRules.enum(['debug', 'info', 'warn', 'error']);

      const result = rule.validate('inf', 'test.field', {});
      expect(result.valid).toBe(false);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].suggestedConfig).toBe('info');
    });
  });

  describe('range', () => {
    it('应该验证数值范围', () => {
      const rule = ValidationRules.range(1, 10);

      const validResult = rule.validate(5, 'test.field', {});
      expect(validResult.valid).toBe(true);

      const tooSmallResult = rule.validate(0, 'test.field', {});
      expect(tooSmallResult.valid).toBe(false);
      expect(tooSmallResult.errors[0].expected).toBe('>= 1');

      const tooLargeResult = rule.validate(15, 'test.field', {});
      expect(tooLargeResult.valid).toBe(false);
      expect(tooLargeResult.errors[0].expected).toBe('<= 10');
    });

    it('应该只验证数字类型', () => {
      const rule = ValidationRules.range(1, 10);

      const result = rule.validate('not a number', 'test.field', {});
      expect(result.valid).toBe(true); // 不是数字，跳过验证
    });
  });

  describe('stringLength', () => {
    it('应该验证字符串长度', () => {
      const rule = ValidationRules.stringLength(2, 5);

      const validResult = rule.validate('abc', 'test.field', {});
      expect(validResult.valid).toBe(true);

      const tooShortResult = rule.validate('a', 'test.field', {});
      expect(tooShortResult.valid).toBe(false);

      const tooLongResult = rule.validate('abcdef', 'test.field', {});
      expect(tooLongResult.valid).toBe(false);
    });
  });

  describe('url', () => {
    it('应该验证 URL 格式', () => {
      const rule = ValidationRules.url();

      const validResults = [
        rule.validate('https://example.com', 'test.field', {}),
        rule.validate('http://localhost:3000', 'test.field', {}),
        rule.validate('', 'test.field', {}), // 空字符串应该通过
      ];

      validResults.forEach((result) => {
        expect(result.valid).toBe(true);
      });

      const invalidResult = rule.validate('not-a-url', 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].code).toBe(ERROR_CODES.VALIDATION_INVALID_FORMAT);
    });

    it('应该为无协议的 URL 提供建议', () => {
      const rule = ValidationRules.url();

      const result = rule.validate('example.com', 'test.field', {});
      expect(result.valid).toBe(false);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].suggestedConfig).toBe('https://example.com');
    });
  });

  describe('array', () => {
    it('应该验证数组类型', () => {
      const rule = ValidationRules.array();

      const validResult = rule.validate([1, 2, 3], 'test.field', {});
      expect(validResult.valid).toBe(true);

      const invalidResult = rule.validate('not an array', 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].code).toBe(ERROR_CODES.CONFIG_TYPE_MISMATCH);
    });

    it('应该验证数组项', () => {
      const itemValidator = createFieldValidator().addRule(ValidationRules.type('string'));

      const rule = ValidationRules.array(itemValidator);

      const validResult = rule.validate(['a', 'b', 'c'], 'test.field', {});
      expect(validResult.valid).toBe(true);

      const invalidResult = rule.validate(['a', 123, 'c'], 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].path).toBe('test.field[1]');
    });
  });

  describe('custom', () => {
    it('应该执行自定义验证', () => {
      const customValidator = jest.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      });

      const rule = ValidationRules.custom(customValidator);

      const result = rule.validate('test', 'test.field', { context: 'data' });
      expect(result.valid).toBe(true);
      expect(customValidator).toHaveBeenCalledWith('test', 'test.field', { context: 'data' });
    });
  });
});

describe('FieldValidator', () => {
  let validator: FieldValidator;

  beforeEach(() => {
    validator = createFieldValidator();
  });

  describe('基础功能', () => {
    it('应该能够添加验证规则', () => {
      validator.addRule(ValidationRules.required('test'));
      validator.addRule(ValidationRules.type('string'));

      expect(validator).toBeDefined();
    });

    it('应该执行所有验证规则', () => {
      validator
        .addRule(ValidationRules.required('test'))
        .addRule(ValidationRules.type('string'))
        .addRule(ValidationRules.stringLength(2, 10));

      const validResult = validator.validate('hello', 'test.field', {});
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validate(undefined, 'test.field', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1); // 只有 required 规则失败
    });

    it('应该收集所有错误、警告和建议', () => {
      const customRule = ValidationRules.custom(() => ({
        valid: false,
        errors: [
          {
            code: 'TEST001',
            message: 'Test error',
            path: 'test',
            value: 'test',
            severity: ErrorSeverity.MEDIUM,
          },
        ],
        warnings: [
          {
            message: 'Test warning',
            path: 'test',
            value: 'test',
          },
        ],
        suggestions: [
          {
            message: 'Test suggestion',
            path: 'test',
            suggestedConfig: 'suggested',
          },
        ],
      }));

      validator.addRule(customRule);

      const result = validator.validate('test', 'test.field', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
    });
  });
});

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = createConfigValidator();
  });

  describe('基础功能', () => {
    it('应该能够添加字段验证器', () => {
      const fieldValidator = createFieldValidator()
        .addRule(ValidationRules.required('level'))
        .addRule(ValidationRules.enum(['debug', 'info', 'warn', 'error']));

      validator.addField('level', fieldValidator);

      const validResult = validator.validate({ level: 'info' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validate({ level: 'invalid' });
      expect(invalidResult.valid).toBe(false);
    });

    it('应该能够添加全局验证规则', () => {
      const globalRule = ValidationRules.custom((config) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: [],
        };

        if (!config.level && !config.outputs) {
          result.valid = false;
          result.errors.push({
            code: 'GLOBAL001',
            message: 'Either level or outputs must be specified',
            path: '',
            value: config,
            severity: ErrorSeverity.HIGH,
          });
        }

        return result;
      });

      validator.addGlobalRule(globalRule);

      const validResult = validator.validate({ level: 'info' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validate({});
      expect(invalidResult.valid).toBe(false);
    });

    it('应该处理嵌套字段路径', () => {
      const fieldValidator = createFieldValidator()
        .addRule(ValidationRules.required('endpoint'))
        .addRule(ValidationRules.url());

      validator.addField('outputs.http.endpoint', fieldValidator);

      const validResult = validator.validate({
        outputs: {
          http: {
            endpoint: 'https://api.example.com',
          },
        },
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validate({
        outputs: {
          http: {
            endpoint: 'invalid-url',
          },
        },
      });
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('路径解析', () => {
    it('应该正确解析嵌套路径', () => {
      const fieldValidator = createFieldValidator().addRule(ValidationRules.type('number'));

      validator.addField('a.b.c', fieldValidator);

      const result = validator.validate({
        a: {
          b: {
            c: 123,
          },
        },
      });

      expect(result.valid).toBe(true);
    });

    it('应该处理不存在的路径', () => {
      const fieldValidator = createFieldValidator().addRule(ValidationRules.required('missing'));

      validator.addField('missing.path', fieldValidator);

      const result = validator.validate({});
      expect(result.valid).toBe(false);
    });
  });
});

describe('formatValidationResult', () => {
  it('应该格式化验证结果', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        {
          code: 'E1001',
          message: 'Test error',
          path: 'test.field',
          value: 'invalid',
          severity: ErrorSeverity.HIGH,
        },
      ],
      warnings: [
        {
          message: 'Test warning',
          path: 'test.field',
          value: 'warning',
        },
      ],
      suggestions: [
        {
          message: 'Test suggestion',
          path: 'test.field',
          suggestedConfig: 'suggested',
        },
      ],
    };

    const formatted = formatValidationResult(result);

    expect(formatted).toContain('❌ Configuration Errors:');
    expect(formatted).toContain('Test error (E1001)');
    expect(formatted).toContain('⚠️  Configuration Warnings:');
    expect(formatted).toContain('Test warning');
    expect(formatted).toContain('💡 Suggestions:');
    expect(formatted).toContain('Test suggestion');
  });

  it('应该处理空结果', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const formatted = formatValidationResult(result);
    expect(formatted).toBe('');
  });
});
