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
  
  // Webpack 配置（处理 monorepo 本地包引用）
  webpack: (config, { isServer }) => {
    // 确保正确处理 monorepo 中的本地包引用
    // 现在使用 packages/ 中的包，不需要特殊的 alias 配置
    
    // 处理阿里云 SLS SDK 的原生模块问题（仅在服务端）
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        // 将有问题的原生模块标记为外部模块
        'lz4': 'commonjs lz4',
        '@alicloud/sls20201230': 'commonjs @alicloud/sls20201230',
      });
    } else {
      // 客户端不应该包含 SLS SDK
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'lz4': false,
        '@alicloud/sls20201230': false,
        '@yai-loglayer/sls-transport': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;