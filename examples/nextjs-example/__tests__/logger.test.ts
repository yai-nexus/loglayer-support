/**
 * Next.js Example 基础测试
 */

describe('Next.js Example Tests', () => {
  test('basic functionality should work', () => {
    // Basic test to ensure Jest is working
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  test('environment variables should be accessible', () => {
    // Test that we can access environment variables
    expect(typeof process.env).toBe('object');
    expect(process.env).toBeDefined();
  });

  test('environment detection should work', () => {
    // Test that we can detect different environments
    // In Jest environment, window might be defined by jsdom
    expect(typeof process).toBe('object');
    expect(process.env).toBeDefined();
  });

  test('console should be available', () => {
    // Test that console methods are available
    expect(typeof console.log).toBe('function');
    expect(typeof console.info).toBe('function');
    expect(typeof console.warn).toBe('function');
    expect(typeof console.error).toBe('function');
    expect(typeof console.debug).toBe('function');
  });

  test('JSON operations should work', () => {
    // Test JSON operations (common in logging)
    const testObj = { message: 'test', level: 'info', timestamp: Date.now() };
    const jsonString = JSON.stringify(testObj);
    const parsedObj = JSON.parse(jsonString);

    expect(parsedObj.message).toBe('test');
    expect(parsedObj.level).toBe('info');
    expect(typeof parsedObj.timestamp).toBe('number');
  });

  test('date operations should work', () => {
    // Test date operations (common in logging)
    const now = new Date();
    const timestamp = Date.now();
    const isoString = now.toISOString();

    expect(typeof timestamp).toBe('number');
    expect(typeof isoString).toBe('string');
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
