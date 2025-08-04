/**
 * 服务端组件示例 - 展示新架构的服务端日志使用
 */

import { logger } from '@/lib/server-logger';

// 模拟数据获取
async function fetchData() {
  const dataLogger = logger.forModule('data-fetch');
  
  dataLogger.info('开始获取数据', {
    operation: 'fetch-user-data',
    timestamp: new Date().toISOString()
  });

  // 模拟异步数据获取
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const data = {
    users: [
      { id: 1, name: '张三', role: 'admin' },
      { id: 2, name: '李四', role: 'user' },
      { id: 3, name: '王五', role: 'user' }
    ],
    timestamp: new Date().toISOString(),
    source: 'mock-database'
  };

  dataLogger.info('数据获取成功', {
    operation: 'fetch-user-data',
    recordCount: data.users.length,
    duration: '100ms'
  });

  return data;
}

export async function ServerComponentNew() {
  // 🚀 新架构：服务端组件中使用服务端日志器
  const componentLogger = logger.forModule('ServerComponentNew');
  
  componentLogger.info('服务端组件开始渲染', {
    component: 'ServerComponentNew',
    renderTime: new Date().toISOString()
  });

  let data;
  let error = null;

  try {
    data = await fetchData();
    componentLogger.info('组件数据加载完成', {
      component: 'ServerComponentNew',
      dataLoaded: true
    });
  } catch (err) {
    error = err;
    componentLogger.error('组件数据加载失败', {
      component: 'ServerComponentNew',
      error: err instanceof Error ? err.message : String(err)
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>服务端日志功能</h4>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
          使用 <code>logger.forModule()</code> 创建模块专用日志器
        </p>
        
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <strong style={{ fontSize: '12px', color: '#0066cc' }}>组件渲染</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
              记录组件生命周期
            </p>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <strong style={{ fontSize: '12px', color: '#0066cc' }}>数据获取</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
              记录数据库操作
            </p>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <strong style={{ fontSize: '12px', color: '#0066cc' }}>错误处理</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
              记录异常信息
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '14px' }}>❌ 数据加载失败</h5>
          <p style={{ margin: 0, fontSize: '13px', color: '#721c24' }}>
            错误已记录到服务端日志
          </p>
        </div>
      ) : (
        <div style={{ padding: '15px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '14px' }}>✅ 数据加载成功</h5>
          <div style={{ fontSize: '13px', color: '#155724' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              加载了 {data?.users.length} 条用户记录
            </p>
            <details style={{ fontSize: '12px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>查看数据</summary>
              <pre style={{ 
                margin: '5px 0 0 0', 
                padding: '10px', 
                backgroundColor: '#fff', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '11px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '6px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>💡 服务端日志说明</h5>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#856404' }}>
          <li>服务端日志输出到终端控制台</li>
          <li>生产环境会写入日志文件</li>
          <li>支持结构化日志和上下文信息</li>
          <li>自动包含请求ID、时间戳等元数据</li>
        </ul>
      </div>
    </div>
  );
}
