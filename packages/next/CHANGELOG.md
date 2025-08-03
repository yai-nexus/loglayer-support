# @yai-loglayer/next

## 0.8.1

### Patch Changes

- feat: 优化浏览器日志组件架构和示例项目

  ## 主要更改

  ### 🚀 架构优化
  - 大规模简化浏览器端代码架构，减少约35%的代码量
  - 移除冗余组件和抽象层，直接利用LogLayer核心功能
  - 优化API结构，移除冗余函数并建立导出规范

  ### 🔧 功能增强
  - 实现框架预设API：`createBrowserLogger`、`createServerLogger`、`createLogReceiver`
  - 增强SLS传输功能，提供更好的Next.js兼容性
  - 统一使用`withMetadata`方法增强日志信息

  ### 📚 示例项目更新
  - 更新Next.js示例项目，增强日志记录功能和配置
  - 修复examples兼容性，确保与简化架构匹配
  - 添加React示例项目，展示Vite集成

  ### 🛠️ 开发体验改进
  - 完善类型安全，解决TypeScript错误
  - 优化构建配置和开发工具
  - 增强文档和API参考

  ### 📦 版本管理
  - 统一所有包版本到0.8.1
  - 准备发布到npm公共仓库

- Updated dependencies []:
  - @yai-loglayer/core@0.8.1
  - @yai-loglayer/browser@0.8.1
  - @yai-loglayer/server@0.8.1
  - @yai-loglayer/receiver@0.8.1

## 0.8.0

### Minor Changes

- feat: 优化浏览器日志组件架构和示例项目

  ## 主要更改

  ### 🚀 架构优化
  - 大规模简化浏览器端代码架构，减少约35%的代码量
  - 移除冗余组件和抽象层，直接利用LogLayer核心功能
  - 优化API结构，移除冗余函数并建立导出规范

  ### 🔧 功能增强
  - 实现框架预设API：`createBrowserLogger`、`createServerLogger`、`createLogReceiver`
  - 增强SLS传输功能，提供更好的Next.js兼容性
  - 统一使用`withMetadata`方法增强日志信息

  ### 📚 示例项目更新
  - 更新Next.js示例项目，增强日志记录功能和配置
  - 修复examples兼容性，确保与简化架构匹配
  - 添加React示例项目，展示Vite集成

  ### 🛠️ 开发体验改进
  - 完善类型安全，解决TypeScript错误
  - 优化构建配置和开发工具
  - 增强文档和API参考

  ### 📦 版本管理
  - 统一所有包版本到0.8.0
  - 准备发布到npm公共仓库

### Patch Changes

- Updated dependencies []:
  - @yai-loglayer/core@0.8.0
  - @yai-loglayer/browser@0.8.0
  - @yai-loglayer/server@0.8.0
  - @yai-loglayer/receiver@0.8.0
