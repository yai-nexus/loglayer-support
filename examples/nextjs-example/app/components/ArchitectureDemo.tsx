/**
 * 架构演示组件 - 展示新架构的特性
 */

'use client';

export function ArchitectureDemo() {
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
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>🏗️ v0.8.2 新架构特性</h2>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '16px' }}>✅ 严格代码隔离</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
            <li>客户端: <code>@yai-loglayer/next/client</code></li>
            <li>服务端: <code>@yai-loglayer/next/server</code></li>
            <li>完全避免构建错误</li>
          </ul>
        </div>
        
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff', fontSize: '16px' }}>🚀 极简接入</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
            <li>一行代码开始使用</li>
            <li>零配置智能默认</li>
            <li>同步API立即可用</li>
          </ul>
        </div>
        
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#6f42c1', fontSize: '16px' }}>⚙️ 预设配置</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
            <li>开发/生产/测试环境</li>
            <li>环境特定优化</li>
            <li>开箱即用</li>
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0066cc', fontSize: '14px' }}>💡 使用示例对比</h4>
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <strong style={{ color: '#dc3545', fontSize: '12px' }}>❌ 之前 (v0.8.1)</strong>
            <pre style={{ 
              margin: '5px 0 0 0', 
              padding: '10px', 
              backgroundColor: '#fff', 
              borderRadius: '4px', 
              fontSize: '11px',
              overflow: 'auto'
            }}>
{`// 容易导入错误
import { createNextjsLogger } from '@yai-loglayer/next';

// 需要多步配置
const logger = await createNextjsLogger({
  appName: 'my-app'
});`}
            </pre>
          </div>
          <div>
            <strong style={{ color: '#28a745', fontSize: '12px' }}>✅ 现在 (v0.8.2)</strong>
            <pre style={{ 
              margin: '5px 0 0 0', 
              padding: '10px', 
              backgroundColor: '#fff', 
              borderRadius: '4px', 
              fontSize: '11px',
              overflow: 'auto'
            }}>
{`// 清晰的导入路径
import { clientQuickStart } from '@yai-loglayer/next/client';

// 一行代码开始使用
const logger = clientQuickStart.dev('my-app');`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
