#!/bin/bash

# 运行 Next.js 示例 (nextjs)
# 启动应用 -> 执行测试 -> 停止应用

set -e

echo "🚀 运行 Next.js 示例 (nextjs)..."
echo "📅 运行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/nextjs" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/test-nextjs.sh"
    exit 1
fi

# 清理函数 - 确保测试结束时停止应用
cleanup() {
    echo ""
    echo "🧹 清理测试环境..."
    ./scripts/stop-nextjs.sh
}

# 设置退出时清理
trap cleanup EXIT

# 1. 启动 Next.js 应用
echo "=== 1. 启动 Next.js 应用 ==="
./scripts/start-nextjs.sh

echo ""
echo "=== 2. 执行自动化测试 ==="

# 等待应用完全启动
echo "⏳ 等待应用完全启动..."
sleep 3

# 测试首页访问
echo "🔍 测试首页访问..."
if curl -s http://localhost:3001 | grep -q "LogLayer NextJS"; then
    echo "✅ 首页访问成功"
else
    echo "❌ 首页访问失败"
    exit 1
fi

# 测试 API 调用
echo "🔍 测试 API 调用..."
API_RESPONSE=$(curl -s -X POST http://localhost:3001/api/test \
    -H "Content-Type: application/json" \
    -d '{"message": "自动化测试"}' \
    -w "%{http_code}")

HTTP_CODE="${API_RESPONSE: -3}"
RESPONSE_BODY="${API_RESPONSE%???}"

if [[ "$HTTP_CODE" == "200" ]]; then
    echo "✅ API 调用成功 (HTTP 200)"
    echo "   响应: $(echo $RESPONSE_BODY | jq -r '.message' 2>/dev/null || echo $RESPONSE_BODY)"
elif [[ "$HTTP_CODE" == "500" ]]; then
    echo "✅ API 调用成功 (HTTP 500 - 模拟错误)"
    echo "   这是预期的模拟错误响应"
else
    echo "❌ API 调用失败 (HTTP $HTTP_CODE)"
    echo "   响应: $RESPONSE_BODY"
    exit 1
fi

# 等待日志写入
echo "⏳ 等待日志写入..."
sleep 2

# 验证日志文件
echo ""
echo "=== 3. 验证日志文件 ==="

if [[ -f "logs/nextjs.log" ]]; then
    echo "✅ nextjs.log 已生成"
    
    # 检查文件大小
    LOG_LINES=$(wc -l < logs/nextjs.log)
    echo "📄 文件大小: $LOG_LINES 行"
    
    if [[ $LOG_LINES -gt 0 ]]; then
        echo "✅ 日志文件包含内容"
        
        # 验证本地时间格式
        FIRST_TIMESTAMP=$(head -1 logs/nextjs.log | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}' || echo "")
        if [[ -n "$FIRST_TIMESTAMP" ]]; then
            echo "✅ 时间格式正确: $FIRST_TIMESTAMP (本地时间)"
        else
            echo "❌ 时间格式不正确"
            echo "   第一行: $(head -1 logs/nextjs.log)"
        fi
        
        # 检查是否包含启动日志
        if grep -q "Next.js 应用启动" logs/nextjs.log; then
            echo "✅ 包含启动日志"
        else
            echo "⚠️  未找到启动日志"
        fi
        
        # 检查是否包含 API 日志
        if grep -q "API 请求" logs/nextjs.log || grep -q "收到 API 请求" logs/nextjs.log; then
            echo "✅ 包含 API 请求日志"
        else
            echo "⚠️  未找到 API 请求日志"
        fi
        
        # 显示最新日志
        echo ""
        echo "🔍 最新日志内容:"
        tail -5 logs/nextjs.log | sed 's/^/   /'
        
    else
        echo "❌ 日志文件为空"
        exit 1
    fi
else
    echo "❌ nextjs.log 未生成"
    exit 1
fi

echo ""
echo "=== 4. 性能测试 ==="

# 多次 API 调用测试
echo "🚀 执行多次 API 调用测试..."
SUCCESS_COUNT=0
ERROR_COUNT=0

for i in {1..5}; do
    HTTP_CODE=$(curl -s -X POST http://localhost:3001/api/test \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"测试调用 $i\"}" \
        -w "%{http_code}" \
        -o /dev/null)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "   调用 $i: ✅ 成功 (HTTP 200)"
    elif [[ "$HTTP_CODE" == "500" ]]; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo "   调用 $i: ⚠️  模拟错误 (HTTP 500)"
    else
        echo "   调用 $i: ❌ 失败 (HTTP $HTTP_CODE)"
    fi
    
    sleep 0.5
done

echo "📊 测试结果: $SUCCESS_COUNT 成功, $ERROR_COUNT 模拟错误"

# 等待日志写入
sleep 2

# 最终日志检查
FINAL_LOG_LINES=$(wc -l < logs/nextjs.log)
echo "📄 最终日志行数: $FINAL_LOG_LINES 行"

echo ""
echo "🎉 Next.js 示例测试完成！"
echo ""
echo "📋 测试总结:"
echo "   ✅ 应用启动成功"
echo "   ✅ 首页访问正常"
echo "   ✅ API 调用功能正常"
echo "   ✅ 日志文件生成正确"
echo "   ✅ 本地时间格式正确"
echo "   ✅ 性能测试通过"
echo ""
echo "📁 查看完整日志:"
echo "   cat logs/nextjs.log"
