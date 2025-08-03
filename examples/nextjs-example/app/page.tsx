'use client';

import { useState, useEffect } from 'react';
import { useComponentLogger, usePerformanceLogger, useLogging } from '@yai-loglayer/next/client';

export default function HomePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);

  // 使用组件专用logger
  const logger = useComponentLogger('HomePage');
  const { measurePerformance } = usePerformanceLogger();
  const { isReady, error: loggerError } = useLogging();

  // 页面加载时记录日志
  useEffect(() => {
    if (isReady) {
      logger.info('页面加载完成', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
      addLog('✅ 页面加载完成，已记录客户端日志');
    }
  }, [isReady, logger]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 基础日志测试
  const handleInfoLog = () => {
    logger.info('用户点击了 Info 按钮', {
      buttonType: 'info',
      timestamp: new Date().toISOString(),
      action: 'button-click',
    });
    addLog('📝 已触发 Info 日志');
  };

  const handleErrorLog = () => {
    setErrorCount((prev) => prev + 1);
    const error = new Error(`模拟错误 #${errorCount + 1}`);
    logger.error('用户触发的测试错误', {
      errorCount: errorCount + 1,
      userTriggered: true,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      action: 'error-simulation',
    });
    addLog(`❌ 已触发 Error 日志 (#${errorCount + 1})`);
  };

  // API 调用测试
  const handleApiCall = async () => {
    setApiStatus('调用中...');
    addLog('🔄 开始调用 API...');

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello from client',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApiStatus(`✅ 成功: ${data.message}`);
        addLog('✅ API 调用成功，已记录服务端日志');
      } else {
        setApiStatus(`❌ 失败: ${data.error}`);
        addLog('❌ API 调用失败');
      }
    } catch (error) {
      setApiStatus(`❌ 网络错误: ${(error as Error).message}`);
      addLog('❌ API 网络错误');
    }
  };

  // 性能测试
  const handlePerformanceTest = () => {
    measurePerformance('client-computation', () => {
      // 模拟一些计算工作
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random();
      }

      logger.info('计算完成', {
        iterations: 1000000,
        result: result.toFixed(2),
        operation: 'client-computation',
      });
    });

    addLog('⚡ 性能测试完成，已记录性能日志');
  };

  // 模拟崩溃
  const handleCrashSimulation = () => {
    try {
      // 故意触发错误
      const obj: any = null;
      obj.nonExistentMethod();
    } catch (error) {
      logger.error('模拟的客户端崩溃', {
        simulatedCrash: true,
        location: 'handleCrashSimulation',
        error: (error as Error).message,
        errorName: (error as Error).name,
        errorStack: (error as Error).stack,
        timestamp: new Date().toISOString(),
      });

      addLog('💥 已模拟客户端崩溃并记录');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* 导航链接 */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#333' }}>演示页面</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a
            href="/components"
            style={{
              color: '#2196f3',
              textDecoration: 'none',
              padding: '8px 16px',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            组件日志演示
          </a>
          <a
            href="/server-actions"
            style={{
              color: '#4caf50',
              textDecoration: 'none',
              padding: '8px 16px',
              border: '1px solid #4caf50',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            Server Actions演示
          </a>
        </div>
      </section>

      {/* Logger状态显示 */}
      <section
        style={{
          backgroundColor: loggerError ? '#ffebee' : '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          border: `1px solid ${loggerError ? '#ffcdd2' : '#c8e6c9'}`,
        }}
      >
        <h3 style={{ marginTop: 0, color: loggerError ? '#c62828' : '#2e7d32' }}>
          Logger状态: {isReady ? '✅ 已就绪' : '⏳ 初始化中...'}
        </h3>
        {loggerError && (
          <p style={{ margin: '5px 0 0 0', color: '#c62828', fontSize: '14px' }}>
            错误: {loggerError}
          </p>
        )}
      </section>

      {/* 日志测试按钮区域 */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#333' }}>客户端日志测试</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
          }}
        >
          <button onClick={handleInfoLog} data-testid="info-log-btn" style={buttonStyle}>
            触发 Info 日志
          </button>
          <button
            onClick={handleErrorLog}
            data-testid="error-log-btn"
            style={{ ...buttonStyle, backgroundColor: '#ff6b6b' }}
          >
            触发 Error 日志
          </button>
          <button
            onClick={handlePerformanceTest}
            data-testid="performance-test-btn"
            style={{ ...buttonStyle, backgroundColor: '#4ecdc4' }}
          >
            性能测试
          </button>
          <button
            onClick={handleCrashSimulation}
            data-testid="crash-simulation-btn"
            style={{ ...buttonStyle, backgroundColor: '#ff8c42' }}
          >
            模拟崩溃
          </button>
        </div>
      </section>

      {/* 服务端日志区域 */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#333' }}>服务端日志测试</h2>
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={handleApiCall}
            data-testid="api-call-btn"
            style={{ ...buttonStyle, backgroundColor: '#74c0fc' }}
          >
            调用测试 API
          </button>
        </div>
        <div
          data-testid="api-status"
          style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          状态: {apiStatus || '等待调用...'}
        </div>
      </section>

      {/* 日志显示区域 */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#333' }}>实时日志显示</h2>
        <div
          data-testid="log-display"
          style={{
            backgroundColor: '#1e1e1e',
            color: '#fff',
            padding: '15px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            height: '200px',
            overflowY: 'auto',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>等待日志输出...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 说明信息 */}
      <section
        style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #bbdefb',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1565c0' }}>日志输出位置</h3>
        <ul style={{ marginBottom: 0, color: '#1976d2' }}>
          <li>
            <strong>客户端日志</strong>: 浏览器控制台 + localStorage + HTTP 上报
          </li>
          <li>
            <strong>服务端日志</strong>: 控制台输出 + 文件输出 (logs/nextjs-server.log)
          </li>
          <li>
            <strong>性能日志</strong>: 包含详细的执行时间和上下文信息
          </li>
          <li>
            <strong>错误日志</strong>: 包含完整的堆栈跟踪和错误上下文
          </li>
        </ul>
      </section>
    </div>
  );
}

const buttonStyle = {
  padding: '10px 15px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
};
