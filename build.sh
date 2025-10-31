#!/bin/bash
# MoonBit 多端一键构建脚本

set -e

echo "🚀 MoonBit 多端构建开始..."
echo ""

# 清理旧构建
moon clean

# 一次性构建所有目标
echo "🔨 构建所有目标 (JS + WASM + WASM-GC)..."
# moon build --target all --release
moon build --target wasm --release
moon build --target wasm --output-wat
moon build --target wasm-gc --release
moon build --target wasm-gc --output-wat

echo ""
echo "📦 构建完成！正在统计..."
echo ""

# 统计文件大小
echo "📊 文件大小对比:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# if [ -f "target/js/release/build/src/src.js" ]; then
#   JS_SIZE=$(ls -lh target/js/release/build/src/src.js | awk '{print $5}')
#   echo "✓ JS:        $JS_SIZE  (target/js/release/build/src/src.js)"
# else
#   echo "✗ JS:        未生成"
# fi

if [ -f "target/wasm/release/build/ayanami.wasm" ]; then
  WASM_SIZE=$(ls -lh target/wasm/release/build/ayanami.wasm | awk '{print $5}')
  echo "✓ WASM:      $WASM_SIZE  (target/wasm/release/build/ayanami.wasm)"
else
  echo "✗ WASM:      未生成"
fi

if [ -f "target/wasm-gc/release/build/ayanami.wasm" ]; then
  WASM_GC_SIZE=$(ls -lh target/wasm-gc/release/build/ayanami.wasm | awk '{print $5}')
  echo "✓ WASM-GC:   $WASM_GC_SIZE  (target/wasm-gc/release/build/ayanami.wasm)"
else
  echo "✗ WASM-GC:   未生成"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 使用 wasm-opt 优化 (如果安装了)
if command -v wasm-opt &> /dev/null; then
  echo ""
  echo "⚡ 使用 wasm-opt 进行后处理优化..."
  
  # 优化 WASM
if [ -f "target/wasm/release/build/ayanami.wasm" ]; then
  wasm-opt -O3 --enable-bulk-memory --enable-multivalue \
    --enable-simd --enable-relaxed-simd --enable-threads \
    --strip-debug --strip-dwarf --strip-producers --vacuum --dce --dae  \
    target/wasm/release/build/ayanami.wasm \
    -o target/wasm/release/build/ayanami.optimized.wasm
    WASM_OPT_SIZE=$(ls -lh target/wasm/release/build/ayanami.optimized.wasm | awk '{print $5}')
    echo "  ✓ WASM 优化后:    $WASM_OPT_SIZE"
  wasm-tools print target/wasm/release/build/ayanami.optimized.wasm > target/wasm/release/build/ayanami.optimized.wat
  fi
  
  # 优化 WASM-GC
if [ -f "target/wasm-gc/release/build/ayanami.wasm" ]; then
  wasm-opt -O3 --enable-bulk-memory --enable-reference-types --enable-gc --enable-multivalue \
    --enable-simd --enable-relaxed-simd --enable-threads \
    --strip-debug --strip-dwarf --strip-producers --vacuum --dce --dae \
    target/wasm-gc/release/build/ayanami.wasm \
    -o target/wasm-gc/release/build/ayanami.optimized.wasm
    WASM_GC_OPT_SIZE=$(ls -lh target/wasm-gc/release/build/ayanami.optimized.wasm | awk '{print $5}')
    echo "  ✓ WASM-GC 优化后 (SIMD): $WASM_GC_OPT_SIZE"
  wasm-tools print target/wasm-gc/release/build/ayanami.optimized.wasm > target/wasm-gc/release/build/ayanami.optimized.wat
  fi
else
  echo ""
  echo "💡 提示: 安装 wasm-opt 可进一步优化体积"
  echo "   brew install binaryen"
fi
