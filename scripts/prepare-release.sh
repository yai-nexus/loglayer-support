#!/bin/bash

# 准备 v0.8.0 发布脚本

set -e

echo "🚀 准备 @yai-loglayer/* v0.8.0 发布..."

# 检查是否在正确的分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ 请在 main 分支上运行此脚本"
    exit 1
fi

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 工作目录不干净，请先提交或暂存更改"
    exit 1
fi

echo "✅ 分支和工作目录检查通过"

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 运行构建
echo "🔨 构建所有包..."
pnpm build:packages

# 运行类型检查
echo "🔍 运行类型检查..."
pnpm type-check

# 运行 lint 检查
echo "🧹 运行 lint 检查..."
pnpm lint

echo "✅ 所有检查通过！"

# 显示将要发布的包
echo ""
echo "📦 将要发布的包:"
echo "- @yai-loglayer/core@0.8.0"
echo "- @yai-loglayer/browser@0.8.0"
echo "- @yai-loglayer/server@0.8.0"
echo "- @yai-loglayer/receiver@0.8.0"
echo "- @yai-loglayer/sls-transport@0.8.0"

echo ""
echo "🎯 下一步操作:"
echo "1. 提交所有更改: git add . && git commit -m 'chore: prepare v0.8.0 release'"
echo "2. 创建标签: git tag v0.8.0"
echo "3. 推送到远程: git push origin main --tags"
echo "4. 在 GitHub 上创建 Release"
echo "5. 或者运行: pnpm publish --recursive --access public"

echo ""
echo "🚀 准备完成！"
