import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LogLayer NextJS Demo',
  description: 'Complete client/server logging demonstration with loglayer-support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <header style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>
            LogLayer NextJS 演示
          </h1>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>
            完整的前后端日志功能演示 - 适用于 Playwright 测试
          </p>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}