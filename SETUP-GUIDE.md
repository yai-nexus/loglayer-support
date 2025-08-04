# @yai-loglayer/next 项目设置指南

## 🎯 项目结构

```
loglayer-support/
├── packages/next/                 # 主包源码
│   ├── src/                      # TypeScript 源码
│   ├── dist/                     # 编译后的 JavaScript
│   ├── client.ts                 # 客户端入口
│   ├── server.ts                 # 服务端入口
│   └── package.json              # 包配置
├── examples/
│   ├── simple-demo/              # 简单示例（推荐）
│   └── nextjs-example/           # 完整示例
└── .vscode/launch.json           # VSCode 调试配置
```

## 🔧 设置步骤

### 1. 构建主包

```bash
# 进入主包目录
cd packages/next

# 安装依赖
npm install

# 构建包
npm run build
```

### 2. 设置简单示例

```bash
# 进入简单示例目录
cd examples/simple-demo

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. VSCode 调试配置

已配置的调试选项：

- **Debug Simple Demo**: 调试简单示例（端口 3002）
- **Next.js: debug server-side**: 调试完整示例（端口 3001）
- **Test Package**: 测试包功能

## 🚀 使用方式

### 客户端使用

```typescript
// app/layout.tsx
'use client';
import { LoggerProvider } from '@yai-loglayer/next/client';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoggerProvider config={{ appName: 'my-app' }}>
          {children}
        </LoggerProvider>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';
import { useComponentLogger } from '@yai-loglayer/next/client';

export default function HomePage() {
  const logger = useComponentLogger('HomePage');
  
  const handleClick = () => {
    logger.info('Button clicked');
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### 服务端使用

```typescript
// app/api/logs/route.ts
import { serverQuickStart } from '@yai-loglayer/next/server';

const logger = await serverQuickStart.prod('my-app');
export const { POST, OPTIONS } = logger.createReceiver();
```

## 🐛 调试说明

### VSCode 调试

1. 打开 VSCode
2. 按 `F5` 或点击调试面板
3. 选择 "Debug Simple Demo"
4. 应用将在 http://localhost:3002 启动
5. 浏览器会自动打开

### 手动启动

```bash
# 方式1：直接启动
cd examples/simple-demo
npm run dev

# 方式2：使用调试模式
node --inspect node_modules/.bin/next dev -p 3002
```

## 📦 包功能测试

运行包功能测试：

```bash
# 在项目根目录
node test-package.js
```

这将测试：
- 客户端模块导入
- 服务端模块导入  
- 快速启动功能
- 基本日志功能

## 🔍 故障排除

### 1. 模块解析错误

如果遇到 `Can't resolve '@yai-loglayer/next/client'` 错误：

```bash
# 重新构建主包
cd packages/next
npm run build

# 重新安装示例依赖
cd examples/simple-demo
rm -rf node_modules package-lock.json
npm install
```

### 2. 端口冲突

如果端口被占用：

```bash
# 查找占用端口的进程
lsof -ti:3002

# 杀死进程
kill -9 <PID>
```

### 3. TypeScript 错误

如果有 TypeScript 编译错误：

```bash
# 检查 TypeScript 配置
cd packages/next
npx tsc --noEmit

# 清理并重新构建
rm -rf dist
npm run build
```

## 🎉 验证成功

成功设置后，您应该能够：

1. ✅ 构建主包无错误
2. ✅ 启动简单示例
3. ✅ 在浏览器控制台看到日志输出
4. ✅ 使用 VSCode 调试功能

## 📝 下一步

- 查看 `examples/simple-demo/app/page.tsx` 了解基本用法
- 查看 `examples/nextjs-example/` 了解完整功能
- 阅读 `packages/next/README.md` 了解 API 文档
