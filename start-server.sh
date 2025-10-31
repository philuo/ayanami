#!/bin/bash

# 停止可能正在运行的旧服务器
echo "🔍 检查是否有旧服务器进程..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "python.*http.server" 2>/dev/null
sleep 1

# 启动 HTTPS 服务器
echo "🚀 启动 HTTPS 服务器..."
node https-server.js &
SERVER_PID=$!

sleep 2

# 检查服务器是否启动成功
if ps -p $SERVER_PID > /dev/null; then
    echo ""
    echo "=========================================="
    echo "✅ 服务器启动成功！"
    echo "=========================================="
    echo ""
    echo "📊 性能测试页面："
    echo "   https://127.0.0.1:8443/worker_performance_test.html"
    echo ""
    echo "⚠️  浏览器安全警告："
    echo "   由于使用自签名证书，浏览器会显示安全警告"
    echo "   这是正常的，请点击「高级」->「继续访问」"
    echo ""
    echo "🔒 已启用的安全头部："
    echo "   ✓ Cross-Origin-Opener-Policy: same-origin"
    echo "   ✓ Cross-Origin-Embedder-Policy: require-corp"
    echo "   ✓ SharedArrayBuffer 支持已启用"
    echo ""
    echo "=========================================="
    echo "💡 测试步骤："
    echo "   1. 在浏览器中打开上面的 URL"
    echo "   2. 接受安全证书警告"
    echo "   3. 选择「两者对比」测试模式"
    echo "   4. 点击「开始测试」"
    echo "   5. 等待测试完成，查看性能对比结果"
    echo "=========================================="
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    
    # 保持脚本运行
    wait $SERVER_PID
else
    echo "❌ 服务器启动失败"
    exit 1
fi

