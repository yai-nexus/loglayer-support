/**
 * 客户端组件示例 - 展示新架构的客户端日志使用
 */

'use client';

import { useState } from 'react';
import { useComponentLogger, usePerformanceLogger } from '@yai-loglayer/next/client';

export function ClientComponentNew() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // 🚀 新架构：使用客户端专用的 hooks
  const logger = useComponentLogger('ClientComponentNew');
  const { measureAsync } = usePerformanceLogger('ClientComponentNew');

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleClick = () => {
    logger.info('按钮被点击', { 
      count: count + 1,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    setCount(prev => prev + 1);
    addLog(`按钮点击 #${count + 1}`);
  };

  const handleAsyncOperation = async () => {
    try {
      await measureAsync('模拟异步操作', async () => {
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        logger.info('异步操作完成', {
          operation: 'simulate-async',
          duration: '1-2秒',
          success: true
        });
      });
      
      addLog('异步操作完成');
    } catch (error) {
      logger.error('异步操作失败', { error: String(error) });
      addLog('异步操作失败');
    }
  };

  const handleError = () => {
    try {
      throw new Error('这是一个测试错误');
    } catch (error) {
      logger.error('捕获到错误', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'ClientComponentNew'
      });
      addLog('错误已记录');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>客户端日志功能</h4>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
          使用 <code>useComponentLogger</code> 和 <code>usePerformanceLogger</code>
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            点击记录日志 ({count})
          </button>
          
          <button
            onClick={handleAsyncOperation}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            异步操作 + 性能测量
          </button>
          
          <button
            onClick={handleError}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            触发错误日志
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '6px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>最近的日志操作:</h5>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
            {logs.map((log, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>{log}</li>
            ))}
          </ul>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#999' }}>
            💡 查看浏览器控制台可以看到详细的日志输出
          </p>
        </div>
      )}
    </div>
  );
}
