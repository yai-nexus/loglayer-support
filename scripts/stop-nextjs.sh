#!/bin/bash

# 停止 Next.js 示例应用
# 清理进程和临时文件

set -e

echo "🛑 停止 Next.js 示例应用..."
echo "📅 停止时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/nextjs" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/stop-nextjs.sh"
    exit 1
fi

# 进入 Next.js 目录
cd examples/nextjs

# 检查是否有保存的 PID
if [[ -f "nextjs.pid" ]]; then
    NEXTJS_PID=$(cat nextjs.pid)
    echo "📋 找到保存的进程 ID: $NEXTJS_PID"
    
    # 检查进程是否还在运行
    if ps -p $NEXTJS_PID > /dev/null 2>&1; then
        echo "🔍 进程 $NEXTJS_PID 正在运行，正在停止..."
        kill $NEXTJS_PID
        
        # 等待进程结束
        echo "⏳ 等待进程结束..."
        for i in {1..10}; do
            if ! ps -p $NEXTJS_PID > /dev/null 2>&1; then
                echo "✅ 进程 $NEXTJS_PID 已停止"
                break
            else
                if [[ $i -eq 10 ]]; then
                    echo "⚠️  进程未响应，强制终止..."
                    kill -9 $NEXTJS_PID 2>/dev/null || true
                    echo "✅ 进程已强制终止"
                fi
                sleep 1
            fi
        done
    else
        echo "⚠️  进程 $NEXTJS_PID 已不存在"
    fi
    
    # 删除 PID 文件
    rm -f nextjs.pid
    echo "🗑️  已删除 PID 文件"
else
    echo "⚠️  未找到 PID 文件，尝试通过端口查找进程..."
fi

# 通过端口查找并停止进程
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🔍 发现端口 3001 上的进程:"
    PIDS=$(lsof -Pi :3001 -sTCP:LISTEN -t)
    for PID in $PIDS; do
        echo "   停止进程 $PID..."
        kill $PID 2>/dev/null || true
    done
    
    # 等待端口释放
    echo "⏳ 等待端口释放..."
    for i in {1..5}; do
        if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "✅ 端口 3001 已释放"
            break
        else
            if [[ $i -eq 5 ]]; then
                echo "⚠️  强制终止剩余进程..."
                lsof -Pi :3001 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
                echo "✅ 已强制终止"
            fi
            sleep 1
        fi
    done
else
    echo "✅ 端口 3001 未被占用"
fi

# 清理临时文件
echo "🧹 清理临时文件..."
rm -f nextjs-console.log
rm -f nextjs.pid
echo "✅ 清理完成"

# 显示日志文件状态
echo ""
echo "📋 日志文件状态:"
if [[ -f "../../logs/nextjs.log" ]]; then
    echo "   📄 nextjs.log: $(wc -l < ../../logs/nextjs.log) 行"
    echo "   🔍 最后几行内容:"
    tail -3 ../../logs/nextjs.log | sed 's/^/      /'
else
    echo "   ⚠️  nextjs.log 不存在"
fi

echo ""
echo "🎉 Next.js 示例应用已停止！"
echo ""
echo "💡 如需重新启动:"
echo "   ./scripts/start-nextjs.sh"
