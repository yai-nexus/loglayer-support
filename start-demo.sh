#!/bin/bash

echo "🚀 启动 @yai-loglayer/next 演示项目"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 构建主包
echo "📦 构建主包..."
cd packages/next
if ! npm run build; then
    echo "❌ 主包构建失败"
    exit 1
fi
echo "✅ 主包构建成功"

# 回到根目录
cd ../..

# 设置简单示例
echo "🔧 设置简单示例..."
cd examples/simple-demo

# 安装依赖
echo "📥 安装依赖..."
if ! npm install; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装成功"

# 启动开发服务器
echo "🌟 启动开发服务器..."
echo "📍 应用将在 http://localhost:3002 启动"
echo "🔍 打开浏览器控制台查看日志输出"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

npm run dev
