#!/bin/bash

# 运行所有示例的脚本
# 测试日志文件前缀与示例名称一致

set -e  # 遇到错误立即退出

echo "🚀 开始运行所有示例..."
echo "📅 运行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁 当前目录: $(pwd)"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/run-all-examples.sh"
    exit 1
fi

# 确保 packages 已构建
echo "📦 确保 packages 已构建..."
npm run build:packages
echo "✅ packages 构建完成"
echo ""

# 清理旧的日志文件
echo "🧹 清理旧的日志文件..."
rm -f logs/basic.log
rm -f logs/nextjs.log
echo "✅ 清理完成"
echo ""

# 记录测试结果
BASIC_SUCCESS=false
NEXTJS_SUCCESS=false

# 1. 运行基础示例
echo "=== 1. 运行基础示例 (basic) ==="
if ./scripts/run-basic-example.sh; then
    echo "✅ 基础示例测试完成"
    BASIC_SUCCESS=true
else
    echo "❌ 基础示例测试失败"
    BASIC_SUCCESS=false
fi
echo ""

# 2. 运行 Next.js 示例
echo "=== 2. 运行 Next.js 示例 (nextjs) ==="
if ./scripts/run-nextjs-example.sh; then
    echo "✅ Next.js 示例测试完成"
    NEXTJS_SUCCESS=true
else
    echo "❌ Next.js 示例测试失败"
    NEXTJS_SUCCESS=false
fi
echo ""

# 4. 检查生成的日志文件
echo "=== 4. 检查生成的日志文件 ==="
echo "📁 日志文件位置: ./logs/"
echo ""

if [[ -f "logs/basic.log" ]]; then
    echo "✅ basic.log 已生成"
    echo "📄 文件大小: $(wc -l < logs/basic.log) 行"
    echo "🔍 最后几行内容:"
    tail -3 logs/basic.log | sed 's/^/   /'
    echo ""
else
    echo "❌ basic.log 未生成"
fi



if [[ -f "logs/nextjs.log" ]]; then
    echo "✅ nextjs.log 已存在"
    echo "📄 文件大小: $(wc -l < logs/nextjs.log) 行"
    echo "🔍 最后几行内容:"
    tail -3 logs/nextjs.log | sed 's/^/   /'
    echo ""
else
    echo "⚠️  nextjs.log 不存在 (需要启动 Next.js 应用)"
fi

# 5. 验证日志文件前缀
echo "=== 5. 验证日志文件前缀与示例名称一致 ==="
echo "📋 期望的日志文件:"
echo "   - basic.log   ← basic 示例"
echo "   - nextjs.log  ← nextjs 示例"
echo ""

echo "📋 实际生成的日志文件:"
ls -la logs/*.log 2>/dev/null | awk '{print "   - " $9}' | sed 's|.*/||' || echo "   (无日志文件)"
echo ""

# 6. 验证本地时间格式
echo "=== 6. 验证本地时间格式 ==="
echo "🕐 期望格式: YYYY-MM-DD HH:MM:SS.mmm (本地时间)"
echo "🔍 检查日志文件中的时间格式:"

for logfile in logs/basic.log logs/nextjs.log; do
    if [[ -f "$logfile" ]]; then
        filename=$(basename "$logfile")
        echo "   📄 $filename:"
        # 提取第一行的时间戳
        first_timestamp=$(head -1 "$logfile" | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}' || echo "未找到时间戳")
        if [[ "$first_timestamp" != "未找到时间戳" ]]; then
            echo "      ✅ $first_timestamp (本地时间格式)"
        else
            echo "      ❌ 时间格式不正确"
        fi
    fi
done
echo ""

echo "🎉 所有示例运行完成！"
echo ""
# 最终总结
echo "📋 所有示例运行总结:"
if [[ "$BASIC_SUCCESS" == "true" ]]; then
    echo "   ✅ 基础示例 (basic) - 成功"
else
    echo "   ❌ 基础示例 (basic) - 失败"
fi



if [[ "$NEXTJS_SUCCESS" == "true" ]]; then
    echo "   ✅ Next.js 示例 (nextjs) - 成功"
else
    echo "   ❌ Next.js 示例 (nextjs) - 失败"
fi

echo ""

# 计算成功率
SUCCESS_COUNT=0
if [[ "$BASIC_SUCCESS" == "true" ]]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); fi
if [[ "$NEXTJS_SUCCESS" == "true" ]]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); fi

echo "📊 成功率: $SUCCESS_COUNT/2 个示例成功"

if [[ $SUCCESS_COUNT -eq 2 ]]; then
    echo "🎉 所有示例都运行成功！"
    EXIT_CODE=0
else
    echo "⚠️  部分示例运行失败，请检查上述错误信息"
    EXIT_CODE=1
fi

echo ""
echo "📁 查看日志文件:"
echo "   ls -la logs/*.log"
echo ""
echo "🔧 单独运行示例:"
echo "   ./scripts/run-basic-example.sh   # 基础示例"
echo "   ./scripts/run-nextjs-example.sh  # Next.js 示例"

exit $EXIT_CODE
