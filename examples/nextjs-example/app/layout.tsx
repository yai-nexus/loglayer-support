import { LoggerProvider } from '@yai-loglayer/next/client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js Logger Example - v0.8.2',
  description: '展示 @yai-loglayer/next v0.8.2 新架构的完整示例',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          padding: '20px',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* 🚀 新架构：客户端专用的 LoggerProvider */}
        <LoggerProvider
          config={{
            appName: 'nextjs-example',
            environment: 'development',
            level: 'debug',
          }}
        >
          <header
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h1 style={{ margin: 0, color: '#333' }}>Next.js Logger v0.8.2 新架构演示</h1>
            <p style={{ margin: '10px 0 0 0', color: '#666' }}>
              严格代码隔离 • 极简接入 • 一行代码开始使用
            </p>
          </header>
          <main>{children}</main>
        </LoggerProvider>
      </body>
    </html>
  );
}
