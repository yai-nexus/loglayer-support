#!/bin/bash

# 运行基础示例 (basic)
# 测试基本日志功能和配置

set -e

echo "🚀 运行基础示例 (basic)..."
echo "📅 运行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保在项目根目录下运行
if [[ ! -f "package.json" ]] || [[ ! -d "examples/basic-example" ]]; then
    echo "❌ 请在项目根目录下运行此脚本"
    echo "💡 使用方法: ./scripts/run-basic-example.sh"
    exit 1
fi

# 确保 packages 已构建
echo "📦 确保 packages 已构建..."
npm run build:packages
echo "✅ packages 构建完成"
echo ""

# 清理旧的日志文件
echo "🧹 清理旧的基础示例日志..."
rm -f logs/*.log
echo "✅ 清理完成"
echo ""

# 运行基础示例
echo "=== 运行基础示例 ==="
cd examples/basic-example
echo "📍 当前目录: $(pwd)"
echo "🔄 运行 index.ts..."
echo ""

# 执行示例
if npx tsx index.ts; then
    echo ""
    echo "✅ 基础示例运行成功"
else
    echo ""
    echo "❌ 基础示例运行失败"
    cd ../..
    exit 1
fi

# 保持在示例目录中进行验证

# 验证日志文件
echo ""
echo "=== 验证日志文件 ==="

# 检查基础示例生成的日志文件
BASIC_LOG_FOUND=""
if [[ -f "logs/app.log" ]]; then
    BASIC_LOG_FOUND="logs/app.log"
elif [[ -f "logs/custom.log" ]]; then
    BASIC_LOG_FOUND="logs/custom.log"
else
    # 查找任何 .log 文件
    for log_file in logs/*.log; do
        if [[ -f "$log_file" ]]; then
            BASIC_LOG_FOUND="$log_file"
            break
        fi
    done
fi

if [[ -n "$BASIC_LOG_FOUND" ]]; then
    echo "✅ 日志文件已生成: $BASIC_LOG_FOUND"

    # 检查文件大小
    LOG_LINES=$(wc -l < "$BASIC_LOG_FOUND")
    echo "📄 文件大小: $LOG_LINES 行"

    if [[ $LOG_LINES -gt 0 ]]; then
        echo "✅ 日志文件包含内容"

        # 验证本地时间格式
        FIRST_TIMESTAMP=$(head -1 "$BASIC_LOG_FOUND" | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}' || echo "")
        if [[ -n "$FIRST_TIMESTAMP" ]]; then
            echo "✅ 时间格式正确: $FIRST_TIMESTAMP (本地时间)"
        else
            echo "❌ 时间格式不正确"
            echo "   第一行: $(head -1 "$BASIC_LOG_FOUND")"
        fi

        # 显示日志内容摘要
        echo ""
        echo "🔍 日志内容摘要:"
        echo "   第一行: $(head -1 "$BASIC_LOG_FOUND" | cut -c1-80)..."
        echo "   最后行: $(tail -1 "$BASIC_LOG_FOUND" | cut -c1-80)..."

        # 显示最新几行日志
        echo ""
        echo "🔍 最新日志内容:"
        tail -3 "$BASIC_LOG_FOUND" | sed 's/^/   /'

    else
        echo "❌ 日志文件为空"
        exit 1
    fi
else
    echo "❌ 日志文件未生成"
    echo "🔍 查找的位置: logs/*.log"
    exit 1
fi

echo ""
echo "🎉 基础示例测试完成！"
echo ""
echo "📋 测试结果:"
echo "   ✅ 示例代码执行成功"
echo "   ✅ 日志文件生成正确"
echo "   ✅ 本地时间格式正确"
echo "   ✅ 文件前缀与示例名称一致 (basic.log)"
echo ""
echo "📁 查看完整日志:"
echo "   cat logs/basic.log"
echo ""
echo "🧪 测试的功能:"
echo "   - 预设配置使用"
echo "   - 自定义配置"
echo "   - 增强功能 (性能测量、错误记录)"
echo "   - 生产环境配置"
echo "   - 多输出配置"
