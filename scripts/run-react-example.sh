#!/bin/bash

# 运行 React 示例的脚本

set -e  # 遇到错误立即退出

echo "🚀 启动 React 示例..."
echo "📅 启动时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁 当前目录: $(pwd)"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/react-example" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/run-react-example.sh"
    exit 1
fi

# 检查 React 示例目录
if [[ ! -d "examples/react-example" ]]; then
    echo "❌ React 示例目录不存在: examples/react-example"
    exit 1
fi

# 确保 packages 已构建
echo "📦 确保 packages 已构建..."
npm run build:packages
echo "✅ packages 构建完成"
echo ""

# 进入 React 示例目录
cd examples/react-example

# 检查依赖
echo "📋 检查依赖..."
if [[ ! -d "node_modules" ]]; then
    echo "📦 安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi
echo ""

# 启动开发服务器
echo "🌐 启动 React 开发服务器..."
echo "📍 应用将在 http://localhost:3001 启动"
echo "🔧 使用 Ctrl+C 停止服务器"
echo ""

# 启动 Vite 开发服务器
npm run dev
