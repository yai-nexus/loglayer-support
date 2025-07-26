#!/bin/bash

# 启动 Next.js 示例应用
# 包含日志监控和健康检查

set -e

echo "🚀 启动 Next.js 示例应用..."
echo "📅 启动时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/nextjs-example" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/start-nextjs.sh"
    exit 1
fi

# 确保 packages 已构建
echo "📦 确保 packages 已构建..."
npm run build:packages
echo "✅ packages 构建完成"
echo ""

# 检查端口是否被占用
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 3001 已被占用"
    echo "🔍 当前占用进程:"
    lsof -Pi :3001 -sTCP:LISTEN
    echo ""
    echo "💡 请先停止占用进程或使用停止脚本:"
    echo "   ./scripts/stop-nextjs.sh"
    exit 1
fi

# 进入 Next.js 目录
cd examples/nextjs-example

# 检查依赖是否安装
if [[ ! -d "node_modules" ]]; then
    echo "📦 安装 Next.js 依赖..."
    npm install
    echo "✅ 依赖安装完成"
    echo ""
fi

# 清理旧的日志文件
echo "🧹 清理旧的 Next.js 日志..."
rm -f ../../logs/nextjs.log
echo "✅ 清理完成"
echo ""

# 启动 Next.js 应用（后台运行）
echo "🌟 启动 Next.js 开发服务器..."
echo "📍 工作目录: $(pwd)"
echo "🌐 访问地址: http://localhost:3001"
echo "📝 日志文件: ../../logs/nextjs.log"
echo ""

# 使用 nohup 在后台运行，并将输出重定向到日志文件
nohup npm run dev > nextjs-console.log 2>&1 &
NEXTJS_PID=$!

# 保存 PID 到文件
echo $NEXTJS_PID > nextjs.pid
echo "💾 进程 ID: $NEXTJS_PID (已保存到 nextjs.pid)"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
echo "🔍 检查服务状态..."
for i in {1..10}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Next.js 应用启动成功！"
        echo ""
        break
    else
        if [[ $i -eq 10 ]]; then
            echo "❌ 服务启动失败，请检查日志"
            echo "📄 控制台日志: $(pwd)/nextjs-console.log"
            exit 1
        fi
        echo "   尝试 $i/10 - 等待服务响应..."
        sleep 2
    fi
done

# 检查日志文件是否生成
echo "📋 检查日志文件..."
if [[ -f "../../logs/nextjs.log" ]]; then
    echo "✅ nextjs.log 已生成"
    echo "📄 文件大小: $(wc -l < ../../logs/nextjs.log) 行"
    echo "🔍 最新日志内容:"
    tail -3 ../../logs/nextjs.log | sed 's/^/   /'
else
    echo "⚠️  nextjs.log 尚未生成，可能需要触发一些 API 调用"
fi
echo ""

# 显示使用说明
echo "🎉 Next.js 示例应用已启动！"
echo ""
echo "📋 使用说明:"
echo "   🌐 访问应用: http://localhost:3001"
echo "   📝 查看日志: tail -f logs/nextjs.log"
echo "   📄 控制台日志: tail -f examples/nextjs-example/nextjs-console.log"
echo "   🛑 停止应用: ./scripts/stop-nextjs.sh"
echo ""
echo "🧪 测试功能:"
echo "   1. 打开浏览器访问 http://localhost:3001"
echo "   2. 点击 '调用测试 API' 按钮"
echo "   3. 查看日志文件 logs/nextjs.log"
echo ""
echo "💡 提示: 应用在后台运行，关闭终端不会停止服务"
