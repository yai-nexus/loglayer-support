/**
 * 输出引擎工具函数
 *
 * 提供日志处理相关的通用工具函数
 */

/**
 * 生成本地时间格式的时间戳
 */
export function getLocalTimestamp(): string {
  return (
    new Date()
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-') +
    '.' +
    String(new Date().getMilliseconds()).padStart(3, '0')
  );
}
