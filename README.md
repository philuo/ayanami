# angel/ayanami

基于 Moonbit 开发的ECS架构，目的是为了学习语言特性

## Linux & MacOS

```bash
# 仅首次执行为文件赋可执行权限
chmod +x ./build.sh

# 执行构建脚本
./build.sh

```

## Window

```bash
# 分目标编译
moon build --target js --release
moon build --target wasm --release
moon build --target wasm-gc --release

# 编译全部
moon build --target all --release
```
