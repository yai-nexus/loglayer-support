# 更新日志

本文档记录了 `@yai-nexus/loglayer-support` 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.7] - 2025-07-20

### 发布说明
这是第一个正式发布版本，将原有的 demo 项目迁移为完整的 npm 包。

### 新增
- 🎉 基于 LogLayer 的统一日志解决方案
- ✅ 完美兼容 Next.js（解决 Edge 和 Serverless 环境问题）
- ✅ 架构解耦设计，支持在运行时切换日志实现
- ✅ 零配置启动，提供同步创建函数
- ✅ 环境自适应，自动检测和选择最佳传输器
- 🔧 支持多种日志传输器：Pino, Winston, Console
- 📝 结构化日志记录
- 🏷️ 上下文绑定（请求、用户、模块级别）
- 🚨 增强的错误处理和性能监控
- 📚 完整的使用示例和文档

### 核心功能
- `createNextjsLoggerSync()` - Next.js 专用同步创建函数
- `createLoggerWithPreset()` - 基于预设的异步创建
- `createEnhancedLogger()` - 自定义配置创建
- 支持 `development`, `production`, `nextjsCompatible` 预设
- 自动环境检测和传输器选择
- 完整的 TypeScript 类型支持

### 技术特性
- TypeScript 编写，提供完整类型定义
- 支持 CommonJS 和 ES Modules
- 目标环境：Node.js 16+
- 零依赖核心（除 LogLayer）
- 可选的对等依赖

### 示例和文档
- Next.js 使用示例
- Node.js 服务使用示例
- 基础 API 使用示例
- 完整的中文文档

---

## 版本说明

### 版本号规则
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的新增功能
- **修订号**：向下兼容的问题修正

### 变更类型
- `新增` - 新功能
- `修改` - 现有功能的修改
- `弃用` - 即将移除的功能
- `移除` - 已移除的功能
- `修复` - 问题修复
- `安全` - 安全相关修复