/**
 * 演示页面 - 展示新架构的完整功能
 */

import { Suspense } from 'react';
import { ArchitectureDemo } from '../components/ArchitectureDemo';
import { ClientComponentNew } from '../components/ClientComponentNew';
import { ServerComponentNew } from '../components/ServerComponentNew';

export default function DemoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 架构说明 */}
      <ArchitectureDemo />
      
      {/* 示例组件 */}
      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>🖥️ 服务端组件</h2>
          <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
            使用 <code>@yai-loglayer/next/server</code>
          </p>
          <Suspense fallback={<div>Loading server component...</div>}>
            <ServerComponentNew />
          </Suspense>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>💻 客户端组件</h2>
          <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
            使用 <code>@yai-loglayer/next/client</code>
          </p>
          <ClientComponentNew />
        </div>
      </div>

      {/* API测试区域 */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>🔌 API 测试</h2>
        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
          测试服务端API路由的日志功能
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/demo');
                const data = await response.json();
                console.log('API响应:', data);
                alert('API调用成功，查看控制台和服务端日志');
              } catch (error) {
                console.error('API调用失败:', error);
                alert('API调用失败');
              }
            }}
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
            测试 GET API
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/demo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    test: true, 
                    timestamp: new Date().toISOString(),
                    data: 'demo data'
                  })
                });
                const data = await response.json();
                console.log('POST API响应:', data);
                alert('POST API调用成功，查看控制台和服务端日志');
              } catch (error) {
                console.error('POST API调用失败:', error);
                alert('POST API调用失败');
              }
            }}
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
            测试 POST API
          </button>
        </div>
      </div>

      {/* 说明文档 */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}
      >
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>📚 使用说明</h2>
        
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>客户端日志</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
              <li>在浏览器控制台查看日志输出</li>
              <li>支持本地存储和HTTP发送</li>
              <li>自动包含用户代理、URL等上下文</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>服务端日志</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
              <li>在终端控制台查看日志输出</li>
              <li>支持文件输出和SLS集成</li>
              <li>自动包含请求ID、时间戳等元数据</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>日志接收器</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
              <li>自动处理客户端发送的日志</li>
              <li>支持批量处理和验证</li>
              <li>一行代码创建完整API路由</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
