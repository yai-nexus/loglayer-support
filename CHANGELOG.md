# 更新日志

本文档记录了 `@yai-nexus/loglayer-support` 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.5.2] - 2024-07-16

### 修复
- 🔧 修复了 CI 中由于缺少测试文件而导致的构建失败问题。

### 新增
- ✅ 添加了 `jest.config.js` 和一个简单的测试文件 `src/__tests__/factory.test.ts` 来验证 `createLogger` 函数。

## [0.5.1] - 2025-01-27

### 修复
- 🔧 解决 TypeScript 类型检查错误
- 🛠️ 修复 winston.format.printf 回调函数参数类型不兼容问题
- 📦 添加缺失的 @types/pino 依赖
- 🚀 更新 CI workflow，移除已废弃的 format:check 步骤
- ✅ 确保所有类型检查和 lint 检查通过

### 技术改进
- 🔍 放宽部分 ESLint 规则以减少警告数量
- 🏗️ 优化构建流程，确保 CI/CD 管道稳定运行
- 📋 改进错误处理和类型安全性

## [0.5.0] - 2025-07-22

### 版本发布
- 🚀 发布 v0.5.0 版本
- 📦 更新包版本到 0.5.0
- 🏷️ 创建对应的 Git 标签
- 📋 发布 GitHub Release

## [0.4.9] - 2025-07-21

### 文档优化
- 📝 重构 README.md，提升可读性和用户体验
- 📚 创建详细的 API 参考文档 (`docs/api-reference.md`)
- 💡 添加最佳实践指南 (`docs/best-practices.md`)
- 🔧 创建使用指南和故障排除文档
- 🔗 修正示例项目链接，确保准确性
- 📖 改进文档结构，便于用户快速找到所需信息

### 架构改进
- 🏗️ 优化文档组织结构，主 README 更加简洁
- 📋 将详细内容分离到专门的文档文件中
- 🎯 突出核心价值主张和快速开始指南

## [0.4.0] - 2025-07-20

### 依赖更新
- ⬆️ 更新 React 到 v19.1.0（从 v18.0.0）
- ⬆️ 更新 React-DOM 到 v19.1.0（从 v18.0.0）
- ⬆️ 更新 Next.js 到 v15.4.2（从 v14.0.0）
- ⬆️ 更新相关 TypeScript 类型定义到最新版本

### 技术改进
- 🔧 修正仓库 URL 为正确的 yai-nexus 组织地址
- ✨ 支持 React 19 的新特性和性能优化
- 🚀 兼容 Next.js 15 的最新功能和改进
- 🛡️ 更好的类型安全性和开发体验

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