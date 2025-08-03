import type { Metadata } from 'next';
import { LoggerProvider } from '@yai-loglayer/next/client';

export const metadata: Metadata = {
  title: '@yai-loglayer/next Demo',
  description: 'Next.js unified logging solution demonstration',
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
        <LoggerProvider
          config={{
            appName: 'server',
            environment: (process.env.NODE_ENV as any) || 'development',
            level: 'debug',
            server: {
              enableFileLogging: true,
              logDir: './logs',
              outputs: {
                console: { enabled: true },
                file: { enabled: true, path: './logs/server.log' },
              },
            },
            browser: {
              httpEndpoint: '/api/client-logs',
            },
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
            <h1 style={{ margin: 0, color: '#333' }}>@yai-loglayer/next 统一日志演示</h1>
            <p style={{ margin: '10px 0 0 0', color: '#666' }}>
              Next.js统一日志解决方案 - 极简接入，功能完整
            </p>
          </header>
          <main>{children}</main>
        </LoggerProvider>
      </body>
    </html>
  );
}
