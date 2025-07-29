/**
 * 工具函数测试
 */

import { 
  convertLogToSlsItem, 
  getHostname, 
  getLocalIP, 
  getAppVersion, 
  getEnvironment, 
  inferCategory 
} from '../utils';
import type { SlsFieldConfig } from '../types';

describe('工具函数测试', () => {
  describe('系统信息获取', () => {
    it('getHostname 应该返回主机名', () => {
      const hostname = getHostname();
      expect(typeof hostname).toBe('string');
      expect(hostname.length).toBeGreaterThan(0);
    });

    it('getLocalIP 应该返回IP地址', () => {
      const ip = getLocalIP();
      expect(typeof ip).toBe('string');
      expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it('getEnvironment 应该返回环境标识', () => {
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'test';
      expect(getEnvironment()).toBe('test');
      
      delete process.env.NODE_ENV;
      process.env.ENVIRONMENT = 'staging';
      expect(getEnvironment()).toBe('staging');
      
      delete process.env.ENVIRONMENT;
      expect(getEnvironment()).toBe('unknown');
      
      // 恢复原始环境
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('getAppVersion 应该返回版本信息', () => {
      const version = getAppVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('日志分类推断', () => {
    it('应该从上下文推断分类', () => {
      expect(inferCategory(undefined, { module: 'api' })).toBe('api');
      expect(inferCategory(undefined, { category: 'database' })).toBe('database');
      expect(inferCategory(undefined, { component: 'auth' })).toBe('auth');
    });

    it('应该从logger名称推断分类', () => {
      expect(inferCategory('api-service')).toBe('api');
      expect(inferCategory('db-connection')).toBe('database');
      expect(inferCategory('auth-middleware')).toBe('auth');
      expect(inferCategory('cache-manager')).toBe('cache');
      expect(inferCategory('queue-worker')).toBe('queue');
    });

    it('应该返回默认分类', () => {
      expect(inferCategory()).toBe('application');
      expect(inferCategory('unknown-service')).toBe('application');
    });
  });

  describe('convertLogToSlsItem', () => {
    const mockLogData = {
      level: 'info' as const,
      message: 'Test message',
      time: new Date('2024-01-01T00:00:00Z'),
      context: { userId: '123', action: 'login' },
    };

    it('应该生成基本的SLS日志条目', () => {
      const result = convertLogToSlsItem(mockLogData);
      
      expect(result.time).toBe(Math.floor(mockLogData.time.getTime() / 1000));
      expect(result.contents).toEqual(
        expect.arrayContaining([
          { key: 'level', value: 'info' },
          { key: 'message', value: 'Test message' },
        ])
      );
    });

    it('应该包含系统字段', () => {
      const result = convertLogToSlsItem(mockLogData);
      
      const contentKeys = result.contents.map(c => c.key);
      expect(contentKeys).toContain('environment');
      expect(contentKeys).toContain('version');
      expect(contentKeys).toContain('hostname');
      expect(contentKeys).toContain('host_ip');
      expect(contentKeys).toContain('category');
      expect(contentKeys).toContain('pid');
    });

    it('应该处理错误信息', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      const logDataWithError = {
        ...mockLogData,
        err: error,
      };
      
      const result = convertLogToSlsItem(logDataWithError);
      const contentKeys = result.contents.map(c => c.key);
      
      expect(contentKeys).toContain('error_message');
      expect(contentKeys).toContain('error_stack');
      expect(contentKeys).toContain('error_name');
    });

    it('应该处理上下文数据', () => {
      const result = convertLogToSlsItem(mockLogData);
      
      const userIdContent = result.contents.find(c => c.key === 'userId');
      const actionContent = result.contents.find(c => c.key === 'action');
      
      expect(userIdContent?.value).toBe('123');
      expect(actionContent?.value).toBe('login');
    });

    it('应该支持字段配置', () => {
      const fieldConfig: SlsFieldConfig = {
        includeEnvironment: false,
        includeVersion: false,
        includeHostIP: false,
        includeCategory: false,
        includeLogger: true,
        customFields: { service: 'test-service' },
      };
      
      const result = convertLogToSlsItem(mockLogData, fieldConfig, 'test-logger');
      const contentKeys = result.contents.map(c => c.key);
      
      expect(contentKeys).not.toContain('environment');
      expect(contentKeys).not.toContain('version');
      expect(contentKeys).not.toContain('host_ip');
      expect(contentKeys).not.toContain('category');
      expect(contentKeys).toContain('logger');
      expect(contentKeys).toContain('service');
      
      const serviceContent = result.contents.find(c => c.key === 'service');
      expect(serviceContent?.value).toBe('test-service');
    });
  });
});
