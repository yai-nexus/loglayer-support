#!/bin/bash

# 框架预设测试运行脚本

set -e

echo "🧪 运行 loglayer-support 框架预设测试..."

# 检查依赖
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js 和 npm"
    exit 1
fi

# 进入测试目录
cd "$(dirname "$0")"

echo "📦 安装测试依赖..."
npm install --silent

echo "🔍 运行 TypeScript 类型检查..."
npx tsc --noEmit --project ../tsconfig.json

echo "🧪 运行单元测试..."

# 运行所有测试
echo "  📋 运行浏览器日志器测试..."
npx jest browser-logger.test.ts --config jest.config.js

echo "  📋 运行日志接收器测试..."
npx jest log-receiver.test.ts --config jest.config.js

echo "  📋 运行服务端日志器测试..."
npx jest server-logger.test.ts --config jest.config.js

echo "📊 生成覆盖率报告..."
npx jest --coverage --config jest.config.js

echo "✅ 所有测试完成！"

# 检查覆盖率
echo "📈 覆盖率摘要："
echo "  - 分支覆盖率: 目标 70%"
echo "  - 函数覆盖率: 目标 70%"
echo "  - 行覆盖率: 目标 70%"
echo "  - 语句覆盖率: 目标 70%"

echo ""
echo "📁 详细覆盖率报告已生成到 coverage/ 目录"
echo "🌐 打开 coverage/lcov-report/index.html 查看详细报告"

# 可选：自动打开覆盖率报告
if command -v open &> /dev/null; then
    echo "🚀 自动打开覆盖率报告..."
    open coverage/lcov-report/index.html
elif command -v xdg-open &> /dev/null; then
    echo "🚀 自动打开覆盖率报告..."
    xdg-open coverage/lcov-report/index.html
fi

echo "🎉 测试运行完成！"
