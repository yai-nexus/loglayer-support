import { useState, useEffect } from 'react'
import { logger, logUserAction, logComponentMount, logApiCall, logPerformance } from './logger'

function App() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    logComponentMount('App')
    logger.withMetadata({
      version: '0.7.0-alpha.2',
      framework: 'React + Vite'
    }).info('React 应用启动')

    return () => {
      logger.debug('App 组件卸载')
    }
  }, [])

  const handleCountClick = () => {
    const start = performance.now()
    setCount((count) => count + 1)
    const duration = performance.now() - start
    
    logUserAction('click', 'counter-button', { newCount: count + 1 })
    logPerformance('state-update', duration)
  }

  const handleInfoLog = () => {
    const message = `信息日志 - 当前计数: ${count}`
    logger.withMetadata({ count, timestamp: new Date().toISOString() }).info(message)
    setLogs(prev => [...prev, `[INFO] ${message}`])
  }

  const handleWarningLog = () => {
    const message = `警告日志 - 计数过高: ${count}`
    logger.withMetadata({ count, threshold: 10 }).warn(message)
    setLogs(prev => [...prev, `[WARN] ${message}`])
  }

  const handleErrorLog = () => {
    try {
      throw new Error(`模拟错误 - 计数: ${count}`)
    } catch (error) {
      const err = error as Error
      logger.withMetadata({
        count,
        context: 'demo',
        error: err,
        errorName: err.name,
        errorStack: err.stack
      }).error('演示错误处理')
      setLogs(prev => [...prev, `[ERROR] ${err.message}`])
    }
  }

  const handleApiCall = async () => {
    const start = performance.now()
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      const duration = performance.now() - start
      const success = Math.random() > 0.3 // 70% 成功率
      
      if (success) {
        logApiCall('/api/data', 'GET', duration, 200)
        setLogs(prev => [...prev, `[API] GET /api/data - 200 (${duration.toFixed(2)}ms)`])
      } else {
        logApiCall('/api/data', 'GET', duration, 500)
        setLogs(prev => [...prev, `[API] GET /api/data - 500 (${duration.toFixed(2)}ms)`])
      }
    } catch (error) {
      const duration = performance.now() - start
      logger.withMetadata({ error: (error as Error).message, duration }).error('API 调用失败')
      setLogs(prev => [...prev, `[API] 调用失败: ${(error as Error).message}`])
    }
  }

  const handlePerformanceTest = () => {
    const start = performance.now()
    
    // 模拟一些计算密集型操作
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.random()
    }
    
    const duration = performance.now() - start
    logPerformance('heavy-computation', duration, { iterations: 1000000, result })
    setLogs(prev => [...prev, `[PERF] 计算完成 - ${duration.toFixed(2)}ms`])
  }

  const clearLogs = () => {
    setLogs([])
    logger.debug('日志显示已清空')
  }

  const checkLocalStorage = () => {
    try {
      const storedLogs = localStorage.getItem('react-app-logs')
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs)
        logger.withMetadata({
          count: parsedLogs.length,
          sample: parsedLogs.slice(-3)
        }).info('本地存储日志检查')
        setLogs(prev => [...prev, `[STORAGE] 找到 ${parsedLogs.length} 条本地日志`])
      } else {
        setLogs(prev => [...prev, `[STORAGE] 暂无本地日志`])
      }
    } catch (error) {
      logger.withMetadata({ error: (error as Error).message }).error('检查本地存储失败')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>LogLayer React 示例</h1>
      <p>展示 v0.7.0-alpha.2 LogLayer API 功能</p>

      <div className="demo-section">
        <h3>🎯 基础功能演示</h3>
        <div>
          <button onClick={handleCountClick}>
            计数器: {count}
          </button>
          <button onClick={handleInfoLog}>记录信息日志</button>
          <button onClick={handleWarningLog}>记录警告日志</button>
          <button onClick={handleErrorLog}>记录错误日志</button>
        </div>
      </div>

      <div className="demo-section">
        <h3>🚀 高级功能演示</h3>
        <div>
          <button onClick={handleApiCall}>模拟 API 调用</button>
          <button onClick={handlePerformanceTest}>性能测试</button>
          <button onClick={checkLocalStorage}>检查本地存储</button>
        </div>
      </div>

      <div className="demo-section">
        <h3>📊 日志输出</h3>
        <div>
          <button onClick={clearLogs}>清空显示</button>
          <div className="log-output">
            {logs.length === 0 ? (
              <div>暂无日志 - 点击上方按钮生成日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>💡 使用提示</h3>
        <ul>
          <li>打开浏览器开发者工具查看彩色控制台输出</li>
          <li>检查 localStorage 中的 'react-app-logs' 键查看本地存储</li>
          <li>错误日志会自动捕获堆栈跟踪信息</li>
          <li>性能日志会记录操作耗时</li>
          <li>所有日志都包含丰富的上下文信息</li>
        </ul>
      </div>
    </div>
  )
}

export default App
