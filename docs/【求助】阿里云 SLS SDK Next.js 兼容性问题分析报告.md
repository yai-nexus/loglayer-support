# 阿里云 SLS SDK Next.js 兼容性问题分析报告

## 问题概述

在实现 @yai-loglayer/sls-transport 包时，遇到了 SLS SDK (@alicloud/sls20201230) 与 Next.js 构建系统的兼容性问题。这正是整个项目要解决的核心问题 - 绕过传统日志库的原生模块依赖。

## 核心问题

### 1. 原生模块架构冲突
```
[Error: dlopen(...lz4/build/Release/xxhash.node, 0x0001): tried: '...' 
(mach-o file, but is an incompatible architecture (have 'x86_64', need 'arm64e' or 'arm64'))]
```

**问题分析：**
- SLS SDK 依赖链中包含 lz4 压缩库的原生模块
- 原生模块编译为 x86_64 架构，但运行环境为 arm64
- 这是典型的二进制不兼容问题

### 2. 依赖链分析
```
@alicloud/sls20201230 → protobufjs → @protobufjs/inquire → lz4 → xxhash.node
```

SLS SDK 的依赖链深度较深，原生模块嵌套在多层依赖中，难以直接控制。

## 已尝试的解决方案

### 方案2.1: Webpack Externals 配置
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@alicloud/sls20201230': 'commonjs @alicloud/sls20201230',
        '@alicloud/openapi-core': 'commonjs @alicloud/openapi-core',
        'lz4': 'commonjs lz4'
      });
    }
    return config;
  }
};
```

**结果：失败**
- Webpack externals 只能防止模块被打包，但无法解决架构不兼容问题
- 原生模块在运行时仍然被加载，架构冲突依然存在

## 技术根因分析

### 1. 原生模块的本质问题
- 原生模块（.node 文件）是编译后的二进制代码
- 必须与目标平台架构完全匹配
- Next.js 无法通过配置解决二进制兼容性问题

### 2. SLS SDK 设计局限
- SLS SDK 设计时主要考虑 Node.js 服务器环境
- 对 webpack 打包环境的兼容性考虑不足
- 深层依赖的原生模块难以替换或排除

### 3. Next.js 架构特性
- Next.js 服务端渲染时执行完整的构建过程
- 所有依赖都会被分析和加载
- 无法在构建时排除深层的原生模块依赖

