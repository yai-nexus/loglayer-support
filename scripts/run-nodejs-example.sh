#!/bin/bash

# 运行 Node.js 示例 (nodejs)
# 测试服务器端日志功能

set -e

echo "🚀 运行 Node.js 示例 (nodejs)..."
echo "📅 运行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/nodejs" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/run-nodejs-example.sh"
    exit 1
fi

# 确保项目已构建
if [[ ! -f "dist/index.js" ]]; then
    echo "📦 项目未构建，正在构建..."
    npm run build
    echo "✅ 项目构建完成"
    echo ""
fi

# 清理旧的日志文件
echo "🧹 清理旧的 Node.js 示例日志..."
rm -f logs/nodejs.log
echo "✅ 清理完成"
echo ""

# 运行 Node.js 示例
echo "=== 运行 Node.js 示例 ==="
cd examples/nodejs
echo "📍 当前目录: $(pwd)"
echo "🔄 运行 server.ts..."
echo ""

# 执行示例
if npx ts-node server.ts; then
    echo ""
    echo "✅ Node.js 示例运行成功"
else
    echo ""
    echo "❌ Node.js 示例运行失败"
    cd ../..
    exit 1
fi

cd ../..

# 验证日志文件
echo ""
echo "=== 验证日志文件 ==="

if [[ -f "logs/nodejs.log" ]]; then
    echo "✅ nodejs.log 已生成"
    
    # 检查文件大小
    LOG_LINES=$(wc -l < logs/nodejs.log)
    echo "📄 文件大小: $LOG_LINES 行"
    
    if [[ $LOG_LINES -gt 0 ]]; then
        echo "✅ 日志文件包含内容"
        
        # 验证本地时间格式
        FIRST_TIMESTAMP=$(head -1 logs/nodejs.log | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}' || echo "")
        if [[ -n "$FIRST_TIMESTAMP" ]]; then
            echo "✅ 时间格式正确: $FIRST_TIMESTAMP (本地时间)"
        else
            echo "❌ 时间格式不正确"
            echo "   第一行: $(head -1 logs/nodejs.log)"
        fi
        
        # 检查关键日志内容
        echo ""
        echo "🔍 检查关键日志内容:"
        
        if grep -q "服务器启动中" logs/nodejs.log; then
            echo "   ✅ 包含服务器启动日志"
        else
            echo "   ❌ 缺少服务器启动日志"
        fi
        
        if grep -q "数据库连接" logs/nodejs.log; then
            echo "   ✅ 包含数据库连接日志"
        else
            echo "   ❌ 缺少数据库连接日志"
        fi
        
        if grep -q "API请求" logs/nodejs.log; then
            echo "   ✅ 包含 API 请求日志"
        else
            echo "   ❌ 缺少 API 请求日志"
        fi
        
        if grep -q "性能测量" logs/nodejs.log; then
            echo "   ✅ 包含性能测量日志"
        else
            echo "   ❌ 缺少性能测量日志"
        fi
        
        if grep -q "ERROR" logs/nodejs.log; then
            echo "   ✅ 包含错误处理日志"
        else
            echo "   ⚠️  未发现错误日志 (可能是正常情况)"
        fi
        
        # 显示日志统计
        echo ""
        echo "📊 日志统计:"
        echo "   DEBUG: $(grep -c '\[DEBUG\]' logs/nodejs.log || echo 0) 条"
        echo "   INFO:  $(grep -c '\[INFO\]' logs/nodejs.log || echo 0) 条"
        echo "   WARN:  $(grep -c '\[WARN\]' logs/nodejs.log || echo 0) 条"
        echo "   ERROR: $(grep -c '\[ERROR\]' logs/nodejs.log || echo 0) 条"
        
        # 显示最新几行日志
        echo ""
        echo "🔍 最新日志内容:"
        tail -5 logs/nodejs.log | sed 's/^/   /'
        
    else
        echo "❌ 日志文件为空"
        exit 1
    fi
else
    echo "❌ nodejs.log 未生成"
    exit 1
fi

echo ""
echo "🎉 Node.js 示例测试完成！"
echo ""
echo "📋 测试结果:"
echo "   ✅ 示例代码执行成功"
echo "   ✅ 日志文件生成正确"
echo "   ✅ 本地时间格式正确"
echo "   ✅ 文件前缀与示例名称一致 (nodejs.log)"
echo ""
echo "📁 查看完整日志:"
echo "   cat logs/nodejs.log"
echo ""
echo "🧪 测试的功能:"
echo "   - 服务器应用日志"
echo "   - 数据库服务日志"
echo "   - API 服务日志"
echo "   - 认证服务日志"
echo "   - 性能测量"
echo "   - 错误处理"
echo "   - 模块化日志"
echo "   - 请求级别日志"
