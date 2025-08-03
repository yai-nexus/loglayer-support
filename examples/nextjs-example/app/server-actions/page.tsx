'use client';

import { useState } from 'react';
import { useComponentLogger } from '@yai-loglayer/next/client';
import { createUser, deleteUser, getUsers } from './actions';

export default function ServerActionsPage() {
  const logger = useComponentLogger('ServerActionsPage');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCreateUser = async () => {
    setLoading(true);
    logger.info('开始创建用户');

    try {
      const formData = new FormData();
      formData.append('name', `测试用户_${Date.now()}`);
      formData.append('email', `test${Date.now()}@example.com`);

      const result = await createUser(formData);

      if (result.success) {
        logger.info('用户创建成功', { userId: result.user?.id });
        addResult(`✅ 用户创建成功: ${result.user?.name}`);
      } else {
        logger.warn('用户创建失败', { error: result.error });
        addResult(`❌ 用户创建失败: ${result.error}`);
      }
    } catch (error) {
      logger.error('创建用户时发生错误', { error: (error as Error).message });
      addResult(`💥 创建用户时发生错误: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUsers = async () => {
    setLoading(true);
    logger.info('开始获取用户列表');

    try {
      const users = await getUsers();
      logger.info('获取用户列表成功', { count: users.length });
      addResult(`✅ 获取到 ${users.length} 个用户`);
    } catch (error) {
      logger.error('获取用户列表时发生错误', { error: (error as Error).message });
      addResult(`💥 获取用户列表时发生错误: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    logger.info('开始删除用户');

    try {
      const formData = new FormData();
      formData.append('id', 'test-user-id');

      const result = await deleteUser(formData);

      if (result.success) {
        logger.info('用户删除成功');
        addResult(`✅ 用户删除成功`);
      } else {
        logger.warn('用户删除失败', { error: result.error });
        addResult(`❌ 用户删除失败: ${result.error}`);
      }
    } catch (error) {
      logger.error('删除用户时发生错误', { error: (error as Error).message });
      addResult(`💥 删除用户时发生错误: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    logger.debug('清空操作结果');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Server Actions 演示</h1>
      <p>演示 Next.js Server Actions 与日志记录的集成</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={handleCreateUser}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '处理中...' : '创建用户'}
        </button>

        <button
          onClick={handleGetUsers}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '处理中...' : '获取用户'}
        </button>

        <button
          onClick={handleDeleteUser}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '处理中...' : '删除用户'}
        </button>

        <button
          onClick={clearResults}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          清空结果
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '5px',
          padding: '15px',
          minHeight: '200px',
        }}
      >
        <h3>操作结果:</h3>
        {results.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>暂无操作结果</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '5px 0',
                  borderBottom: index < results.length - 1 ? '1px solid #eee' : 'none',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
        }}
      >
        <h3>说明:</h3>
        <ul>
          <li>所有操作都会记录详细的日志信息</li>
          <li>日志会同时显示在浏览器控制台和服务端日志文件中</li>
          <li>
            可以在 <code>logs/nextjs.log</code> 文件中查看服务端日志
          </li>
          <li>每个操作都包含性能监控和错误处理</li>
        </ul>
      </div>
    </div>
  );
}
