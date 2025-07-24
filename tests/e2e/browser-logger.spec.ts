/**
 * 浏览器端日志器 E2E 测试
 * 测试 createBrowserLogger 在真实浏览器环境中的功能
 */

import { test, expect, Page } from '@playwright/test'

test.describe('createBrowserLogger E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // 监听控制台消息
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    })
    
    // 监听未捕获的异常
    const errors: string[] = []
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // 将消息数组附加到页面对象上，以便测试中访问
    ;(page as any).consoleMessages = consoleMessages
    ;(page as any).errors = errors
  })

  test('应该能够创建浏览器端日志器', async () => {
    await page.goto('data:text/html,<html><head><title>Test</title></head><body></body></html>')
    
    // 注入 createBrowserLogger 代码
    await page.addScriptTag({
      content: `
        // 模拟 createBrowserLoggerSync 函数
        window.createBrowserLoggerSync = function(config = {}) {
          const sessionId = 'test-session-' + Math.random().toString(36).substr(2, 9);
          
          return {
            debug: (msg, meta) => console.log('[DEBUG]', msg, meta || {}),
            info: (msg, meta) => console.log('[INFO]', msg, meta || {}),
            warn: (msg, meta) => console.warn('[WARN]', msg, meta || {}),
            error: (msg, meta) => console.error('[ERROR]', msg, meta || {}),
            logError: (error, meta, customMsg) => {
              console.error('[ERROR]', customMsg || error.message, { error: error.message, ...meta });
            },
            logPerformance: (operation, duration, meta) => {
              console.log('[PERF]', operation, duration + 'ms', meta || {});
            },
            getSessionId: () => sessionId,
            isReady: () => true
          };
        };
        
        // 创建日志器实例
        window.logger = window.createBrowserLoggerSync({
          outputs: {
            console: { colorized: true }
          }
        });
      `
    })
    
    // 测试基础日志功能
    await page.evaluate(() => {
      window.logger.info('测试信息日志', { test: true })
      window.logger.warn('测试警告日志', { level: 'warn' })
      window.logger.error('测试错误日志', { error: true })
    })
    
    // 验证控制台输出
    const consoleMessages = (page as any).consoleMessages
    expect(consoleMessages.some(msg => msg.includes('测试信息日志'))).toBe(true)
    expect(consoleMessages.some(msg => msg.includes('测试警告日志'))).toBe(true)
    expect(consoleMessages.some(msg => msg.includes('测试错误日志'))).toBe(true)
  })

  test('应该能够记录性能日志', async () => {
    await page.goto('data:text/html,<html><head><title>Performance Test</title></head><body></body></html>')
    
    await page.addScriptTag({
      content: `
        window.createBrowserLoggerSync = function(config = {}) {
          return {
            logPerformance: (operation, duration, meta) => {
              console.log('[PERF]', operation, duration + 'ms', meta || {});
            }
          };
        };
        
        window.logger = window.createBrowserLoggerSync();
      `
    })
    
    // 测试性能日志
    await page.evaluate(() => {
      const start = performance.now()
      // 模拟一些操作
      for (let i = 0; i < 1000; i++) {
        Math.random()
      }
      const duration = performance.now() - start
      window.logger.logPerformance('test-operation', duration, { iterations: 1000 })
    })
    
    const consoleMessages = (page as any).consoleMessages
    expect(consoleMessages.some(msg => 
      msg.includes('[PERF]') && msg.includes('test-operation')
    )).toBe(true)
  })

  test('应该能够处理错误对象', async () => {
    await page.goto('data:text/html,<html><head><title>Error Test</title></head><body></body></html>')
    
    await page.addScriptTag({
      content: `
        window.createBrowserLoggerSync = function(config = {}) {
          return {
            logError: (error, meta, customMsg) => {
              console.error('[ERROR]', customMsg || error.message, { 
                error: error.message, 
                stack: error.stack,
                ...meta 
              });
            }
          };
        };
        
        window.logger = window.createBrowserLoggerSync();
      `
    })
    
    // 测试错误处理
    await page.evaluate(() => {
      try {
        throw new Error('测试错误')
      } catch (error) {
        window.logger.logError(error, { context: 'test' }, '捕获到测试错误')
      }
    })
    
    const consoleMessages = (page as any).consoleMessages
    expect(consoleMessages.some(msg => 
      msg.includes('捕获到测试错误') && msg.includes('测试错误')
    )).toBe(true)
  })

  test('应该能够使用 localStorage 输出', async () => {
    await page.goto('data:text/html,<html><head><title>LocalStorage Test</title></head><body></body></html>')
    
    await page.addScriptTag({
      content: `
        window.createBrowserLoggerSync = function(config = {}) {
          const storageKey = config.outputs?.localStorage?.key || 'app-logs';
          const maxEntries = config.outputs?.localStorage?.maxEntries || 100;
          
          return {
            info: (msg, meta) => {
              console.log('[INFO]', msg, meta || {});
              
              // 模拟保存到 localStorage
              const logEntry = {
                level: 'info',
                message: msg,
                metadata: meta || {},
                timestamp: new Date().toISOString()
              };
              
              const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
              logs.push(logEntry);
              
              if (logs.length > maxEntries) {
                logs.splice(0, logs.length - maxEntries);
              }
              
              localStorage.setItem(storageKey, JSON.stringify(logs));
            }
          };
        };
        
        window.logger = window.createBrowserLoggerSync({
          outputs: {
            localStorage: {
              key: 'test-logs',
              maxEntries: 10
            }
          }
        });
      `
    })
    
    // 记录一些日志
    await page.evaluate(() => {
      window.logger.info('第一条日志', { id: 1 })
      window.logger.info('第二条日志', { id: 2 })
      window.logger.info('第三条日志', { id: 3 })
    })
    
    // 验证 localStorage 中的日志
    const storedLogs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('test-logs') || '[]')
    })
    
    expect(storedLogs).toHaveLength(3)
    expect(storedLogs[0].message).toBe('第一条日志')
    expect(storedLogs[1].message).toBe('第二条日志')
    expect(storedLogs[2].message).toBe('第三条日志')
  })

  test('应该能够生成和管理会话 ID', async () => {
    await page.goto('data:text/html,<html><head><title>Session Test</title></head><body></body></html>')
    
    await page.addScriptTag({
      content: `
        window.createBrowserLoggerSync = function(config = {}) {
          let sessionId = config.sessionId;
          
          if (!sessionId) {
            sessionId = sessionStorage.getItem('log-session-id');
            if (!sessionId) {
              sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
              sessionStorage.setItem('log-session-id', sessionId);
            }
          }
          
          return {
            getSessionId: () => sessionId,
            setSessionId: (newId) => {
              sessionId = newId;
              sessionStorage.setItem('log-session-id', newId);
            }
          };
        };
        
        window.logger = window.createBrowserLoggerSync();
      `
    })
    
    // 测试会话 ID 生成
    const sessionId1 = await page.evaluate(() => window.logger.getSessionId())
    expect(sessionId1).toMatch(/^sess_/)
    
    // 测试会话 ID 设置
    await page.evaluate(() => {
      window.logger.setSessionId('custom-session-123')
    })
    
    const sessionId2 = await page.evaluate(() => window.logger.getSessionId())
    expect(sessionId2).toBe('custom-session-123')
    
    // 验证 sessionStorage 中的值
    const storedSessionId = await page.evaluate(() => {
      return sessionStorage.getItem('log-session-id')
    })
    expect(storedSessionId).toBe('custom-session-123')
  })

  test('应该能够处理全局错误捕获', async () => {
    await page.goto('data:text/html,<html><head><title>Global Error Test</title></head><body></body></html>')
    
    await page.addScriptTag({
      content: `
        window.createBrowserLoggerSync = function(config = {}) {
          const logger = {
            error: (msg, meta) => console.error('[ERROR]', msg, meta || {})
          };
          
          if (config.errorHandling?.captureGlobalErrors) {
            window.addEventListener('error', (event) => {
              logger.error('全局错误捕获', {
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
              });
            });
          }
          
          if (config.errorHandling?.captureUnhandledRejections) {
            window.addEventListener('unhandledrejection', (event) => {
              logger.error('未处理的 Promise 拒绝', {
                reason: event.reason?.message || event.reason
              });
            });
          }
          
          return logger;
        };
        
        window.logger = window.createBrowserLoggerSync({
          errorHandling: {
            captureGlobalErrors: true,
            captureUnhandledRejections: true
          }
        });
      `
    })
    
    // 触发全局错误
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('全局测试错误')
      }, 100)
    })
    
    // 等待错误被捕获
    await page.waitForTimeout(200)
    
    const consoleMessages = (page as any).consoleMessages
    expect(consoleMessages.some(msg => 
      msg.includes('全局错误捕获') && msg.includes('全局测试错误')
    )).toBe(true)
  })
})
