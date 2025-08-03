# VSCode 调试配置说明

这个目录包含了为 `@yai-loglayer/next` Next.js 示例项目优化的 VSCode 配置。

## 📁 文件说明

### `launch.json` - 调试配置

包含多种调试场景的配置：

- **Next.js: debug server-side** - 调试服务端代码
- **Next.js: debug client-side** - 调试客户端代码
- **Next.js: debug full stack** - 全栈调试
- **Jest: debug tests** - 调试单元测试
- **Jest: debug current file** - 调试当前测试文件
- **Playwright: debug e2e tests** - 调试端到端测试
- **Build: debug production build** - 调试生产构建
- **Start: debug production server** - 调试生产服务器

### `tasks.json` - 任务配置

预定义的常用任务：

- `npm: dev` - 启动开发服务器
- `npm: build` - 构建生产版本
- `npm: start` - 启动生产服务器
- `npm: test` - 运行单元测试
- `npm: test:e2e` - 运行端到端测试
- `npm: lint` - 代码检查
- `TypeScript: Check` - TypeScript 类型检查
- `Kill Port 3001` - 杀死占用 3001 端口的进程

### `settings.json` - 工作区设置

优化的编辑器设置：

- TypeScript 智能感知配置
- ESLint 和 Prettier 集成
- 文件排除和搜索优化
- Jest 测试配置
- 调试相关设置

### `extensions.json` - 推荐扩展

开发 Next.js 应用推荐的 VSCode 扩展：

- Next.js 和 React 开发工具
- 代码格式化和质量工具
- 测试工具
- Git 和版本控制工具
- 调试工具

### `snippets.code-snippets` - 代码片段

专为 `@yai-loglayer/next` 设计的代码片段：

- `useLogger` - 使用组件日志器
- `usePerformance` - 使用性能监控
- `serverLogger` - 创建服务端日志器
- `browserLogger` - 创建浏览器端日志器
- `logReceiver` - 创建日志接收器
- `serverAction` - 带日志的 Server Action
- `componentLogger` - 带日志的 React 组件
- `loggerProvider` - LoggerProvider 设置
- `errorBoundary` - 带日志的错误边界

## 🚀 快速开始

### 1. 安装推荐扩展

打开命令面板 (`Cmd+Shift+P` / `Ctrl+Shift+P`)，运行：

```
Extensions: Show Recommended Extensions
```

安装所有推荐的扩展。

### 2. 开始调试

#### 调试服务端代码

1. 在服务端代码中设置断点
2. 按 `F5` 或选择 "Next.js: debug server-side"
3. 访问 http://localhost:3001

#### 调试客户端代码

1. 在客户端代码中设置断点
2. 选择 "Next.js: debug client-side"
3. 会自动打开 Chrome 并连接调试器

#### 全栈调试

1. 选择 "Next.js: debug full stack"
2. 可以同时调试服务端和客户端代码

#### 调试测试

1. 在测试文件中设置断点
2. 选择 "Jest: debug tests" 或 "Jest: debug current file"

### 3. 使用代码片段

在 TypeScript/TSX 文件中输入片段前缀，如：

- `useLogger` + Tab - 快速创建组件日志器
- `serverAction` + Tab - 创建带日志的 Server Action
- `loggerProvider` + Tab - 设置 LoggerProvider

## 🔧 自定义配置

### 修改端口

如果需要使用其他端口，修改以下文件中的端口号：

- `launch.json` 中的 `args` 参数
- `tasks.json` 中的环境变量

### 添加环境变量

在 `launch.json` 和 `tasks.json` 的 `env` 部分添加需要的环境变量。

### 自定义代码片段

编辑 `snippets.code-snippets` 文件添加自己的代码片段。

## 📝 调试技巧

### 服务端调试

- 在 Server Actions 中设置断点
- 在 API 路由中设置断点
- 使用 `console.log` 在终端查看输出

### 客户端调试

- 在 React 组件中设置断点
- 在浏览器开发者工具中查看网络请求
- 使用 React DevTools 检查组件状态

### 日志调试

- 查看终端输出的服务端日志
- 查看浏览器控制台的客户端日志
- 检查 `/api/client-logs` 接收到的日志

### 性能调试

- 使用 `usePerformanceLogger` 监控组件性能
- 在 Network 面板查看请求时间
- 使用 React Profiler 分析渲染性能

## 🛠️ 故障排除

### 调试器无法连接

1. 确保端口 3001 没有被占用
2. 运行 "Kill Port 3001" 任务
3. 重新启动调试会话

### 断点不生效

1. 确保 source maps 已启用
2. 检查 TypeScript 配置
3. 重新构建项目

### 扩展冲突

1. 禁用不需要的扩展
2. 检查 `extensions.json` 中的 `unwantedRecommendations`
3. 重启 VSCode

## 📚 相关文档

- [VSCode 调试文档](https://code.visualstudio.com/docs/editor/debugging)
- [Next.js 调试指南](https://nextjs.org/docs/advanced-features/debugging)
- [@yai-loglayer/next 文档](../README.md)
