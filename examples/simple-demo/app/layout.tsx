'use client';

import { LoggerProvider } from '@yai-loglayer/next/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LoggerProvider config={{ appName: 'simple-demo' }}>
          {children}
        </LoggerProvider>
      </body>
    </html>
  );
}
