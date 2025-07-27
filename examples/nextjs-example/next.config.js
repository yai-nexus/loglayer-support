/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能（如果需要）
  experimental: {
    // Next.js 14 默认启用 App Router，不需要显式配置
  },
  
  // 编译配置
  typescript: {
    // 开发时忽略类型错误，加快构建速度
    ignoreBuildErrors: false,
  },
  
  // 环境变量
  env: {
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    LOG_TO_FILE: process.env.LOG_TO_FILE || 'true',
  },
  
  // 注意：由于阿里云 SLS SDK 的原生模块兼容性问题，
  // webpack externals 配置无法解决根本问题。
  // 具体分析请参考: docs/SLS_SDK_NEXTJS_COMPATIBILITY_ANALYSIS.md
};

module.exports = nextConfig;