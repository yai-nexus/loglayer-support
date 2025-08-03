'use client';

import { useState } from 'react';
import { useComponentLogger, usePerformanceLogger } from '@yai-loglayer/next/client';

// 示例组件1：用户操作组件
function UserActionComponent() {
  const logger = useComponentLogger('UserActionComponent');
  const [userCount, setUserCount] = useState(0);

  const handleUserLogin = () => {
    const userId = `user_${Date.now()}`;
    logger.info('用户登录', {
      userId,
      loginMethod: 'demo',
      timestamp: new Date().toISOString(),
    });
    setUserCount((prev) => prev + 1);
  };

  const handleUserLogout = () => {
    logger.info('用户登出', {
      reason: 'user_action',
      sessionDuration: Math.floor(Math.random() * 3600),
      timestamp: new Date().toISOString(),
    });
    setUserCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>用户操作组件</h3>
      <p>当前在线用户: {userCount}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleUserLogin}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          模拟登录
        </button>
        <button
          onClick={handleUserLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          模拟登出
        </button>
      </div>
    </div>
  );
}

// 示例组件2：性能监控组件
function PerformanceComponent() {
  const logger = useComponentLogger('PerformanceComponent');
  const { measurePerformance } = usePerformanceLogger();
  const [results, setResults] = useState<string[]>([]);

  const handleCpuIntensiveTask = () => {
    measurePerformance('cpu-intensive-task', () => {
      // 模拟CPU密集型任务
      let result = 0;
      for (let i = 0; i < 5000000; i++) {
        result += Math.sqrt(i);
      }

      logger.info('CPU密集型任务完成', {
        iterations: 5000000,
        result: result.toFixed(2),
      });

      setResults((prev) => [...prev, `CPU任务完成: ${result.toFixed(2)}`]);
    });
  };

  const handleAsyncTask = async () => {
    await measurePerformance('async-task', async () => {
      // 模拟异步任务
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      logger.info('异步任务完成', {
        taskType: 'simulated-api-call',
        delay: '1-3秒',
      });

      setResults((prev) => [...prev, '异步任务完成']);
    });
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>性能监控组件</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={handleCpuIntensiveTask}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          CPU密集型任务
        </button>
        <button
          onClick={handleAsyncTask}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          异步任务
        </button>
      </div>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>任务结果:</h4>
        {results.length === 0 ? (
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>暂无任务结果</p>
        ) : (
          results.map((result, index) => (
            <div key={index} style={{ fontSize: '14px', marginBottom: '5px' }}>
              {index + 1}. {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 示例组件3：错误处理组件
function ErrorHandlingComponent() {
  const logger = useComponentLogger('ErrorHandlingComponent');
  const [errorCount, setErrorCount] = useState(0);

  const handleValidationError = () => {
    const error = new Error('表单验证失败');
    logger.warn('表单验证错误', {
      errorType: 'validation',
      field: 'email',
      value: 'invalid-email',
      errorMessage: error.message,
    });
    setErrorCount((prev) => prev + 1);
  };

  const handleNetworkError = () => {
    const error = new Error('网络请求超时');
    logger.error('网络请求失败', {
      errorType: 'network',
      url: '/api/fake-endpoint',
      method: 'POST',
      timeout: 5000,
      errorMessage: error.message,
      stack: error.stack,
    });
    setErrorCount((prev) => prev + 1);
  };

  const handleUnexpectedError = () => {
    try {
      // 故意触发错误
      const obj: any = null;
      obj.someMethod();
    } catch (error) {
      logger.error('未预期的错误', {
        errorType: 'unexpected',
        location: 'handleUnexpectedError',
        errorMessage: (error as Error).message,
        stack: (error as Error).stack,
      });
      setErrorCount((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>错误处理组件</h3>
      <p>错误计数: {errorCount}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleValidationError}
          style={{
            padding: '10px 15px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          验证错误
        </button>
        <button
          onClick={handleNetworkError}
          style={{
            padding: '10px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          网络错误
        </button>
        <button
          onClick={handleUnexpectedError}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          未预期错误
        </button>
      </div>
    </div>
  );
}

// 主页面组件
export default function ComponentsPage() {
  const logger = useComponentLogger('ComponentsPage');

  return (
    <div>
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ marginTop: 0, color: '#333' }}>组件日志演示</h1>
        <p style={{ color: '#666' }}>
          这个页面展示了如何在不同的React组件中使用@yai-loglayer/next的日志功能。
          每个组件都有自己的logger实例，会自动添加组件名称到日志中。
        </p>
      </div>

      <UserActionComponent />
      <PerformanceComponent />
      <ErrorHandlingComponent />
    </div>
  );
}
