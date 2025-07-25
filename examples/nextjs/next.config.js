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
  
  // Webpack 配置（处理 loglayer-support 本地引用）
  webpack: (config, { isServer }) => {
    // 确保正确处理本地包引用
    config.resolve.alias = {
      ...config.resolve.alias,
      'loglayer-support': require('path').resolve(__dirname, '../../src'),
    };
    
    return config;
  },
};

module.exports = nextConfig;