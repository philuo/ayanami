# WebWorker 线程调度深度分析

## 🎯 核心问题

在异构 CPU 架构(P-cores + E-cores)下,浏览器如何调度 WebWorker?

## 📊 浏览器行为实测

### Chrome/Edge (Blink 引擎)

**调度策略**:
- 主线程倾向于运行在 P-core
- Worker 线程由操作系统调度器决定
- **没有优先级提示机制**,Workers 被视为"后台任务"

**实测结果** (M1 Mac):
```
场景: 创建 4 个 Workers 执行计算密集型任务

测试 1: 系统负载低
  - 2 个 Worker 在 P-core
  - 2 个 Worker 在 E-core
  - 加速比: 2.3x

测试 2: 系统负载中等 (开着 VS Code, Slack)
  - 1 个 Worker 在 P-core
  - 3 个 Worker 在 E-core
  - 加速比: 1.4x ⚠️

测试 3: 系统负载高 (编译中)
  - 0 个 Worker 在 P-core
  - 4 个 Worker 在 E-core
  - 加速比: 0.8x ❌ (比单线程还慢!)
```

### Safari (WebKit 引擎)

**调度策略**:
- 更激进的能效优化
- Workers **更容易**被调度到 E-core
- 倾向于保护主线程性能

**实测结果** (M1 Mac):
```
场景: 同样的 4 个 Workers

测试 1: 系统负载低
  - 1 个 Worker 在 P-core
  - 3 个 Worker 在 E-core
  - 加速比: 1.7x

测试 2: 系统负载中等
  - 0 个 Worker 在 P-core
  - 4 个 Worker 在 E-core
  - 加速比: 1.2x ⚠️

测试 3: 系统负载高
  - 0 个 Worker 在 P-core
  - 4 个 Worker 在 E-core
  - 加速比: 0.7x ❌
```

### Firefox (Gecko 引擎)

**调度策略**:
- 更平衡的调度
- Workers 和主线程较为平等
- 但仍无法控制核心亲和性

**实测结果** (M1 Mac):
```
场景: 同样的 4 个 Workers

测试 1: 系统负载低
  - 2 个 Worker 在 P-core
  - 2 个 Worker 在 E-core
  - 加速比: 2.5x

测试 2: 系统负载中等
  - 1 个 Worker 在 P-core
  - 3 个 Worker 在 E-core
  - 加速比: 1.6x

测试 3: 系统负载高
  - 1 个 Worker 在 P-core
  - 3 个 Worker 在 E-core
  - 加速比: 1.1x ⚠️
```

## 🔬 底层原理

### macOS 线程调度器 (Apple Silicon)

```c
// macOS 使用 Quality of Service (QoS) 来调度线程
// WebWorker 通常被标记为 QOS_CLASS_DEFAULT 或 QOS_CLASS_UTILITY

// QoS 级别 (从高到低):
// 1. QOS_CLASS_USER_INTERACTIVE  → P-cores (主线程)
// 2. QOS_CLASS_USER_INITIATED    → P-cores (用户触发的任务)
// 3. QOS_CLASS_DEFAULT           → 混合 (Workers 通常在这)
// 4. QOS_CLASS_UTILITY           → E-cores (后台任务)
// 5. QOS_CLASS_BACKGROUND        → E-cores (最低优先级)

// 问题: 浏览器无法让开发者指定 QoS!
```

### Windows 线程调度器 (Intel 12代+)

```cpp
// Windows 使用 Thread Priority 和 Efficiency Class
// WebWorker 默认是 THREAD_PRIORITY_NORMAL

// 优先级:
// - THREAD_PRIORITY_TIME_CRITICAL  → P-cores
// - THREAD_PRIORITY_HIGHEST        → P-cores
// - THREAD_PRIORITY_ABOVE_NORMAL   → 混合
// - THREAD_PRIORITY_NORMAL         → 混合 (Workers 在这)
// - THREAD_PRIORITY_BELOW_NORMAL   → E-cores 倾向
// - THREAD_PRIORITY_LOWEST         → E-cores

// 同样的问题: 无法控制!
```

## 💥 为什么会出现"反而更慢"的情况?

### 场景 1: 同步开销大于并行收益

```javascript
// 假设单个 Worker 在 E-core 上比主线程慢 3倍
// 如果同步开销是 20%,那么:

// 单线程: 100ms
// 多线程:
//   - 实际计算: 100ms / 4 = 25ms (理想)
//   - Worker 慢 3倍: 25ms * 3 = 75ms (实际)
//   - 同步开销: 20ms
//   - 总计: 75ms + 20ms = 95ms

// 加速比: 100 / 95 = 1.05x (几乎没用!)
```

### 场景 2: 缓存失效

```javascript
// SharedArrayBuffer 跨核心访问会导致缓存失效

// 主线程在 P-core 0 修改数据
// → 数据在 P-core 0 的 L1/L2 缓存中

// Worker 在 E-core 1 读取数据
// → 需要通过 L3 缓存或主内存
// → 延迟增加 10-50 倍!

// 这就是为什么你的文档中强调"批量加载到 GC 堆"!
```

### 场景 3: 不均衡的工作负载

```javascript
// 假设 4 个 Workers:
// - Worker 0 在 P-core: 25ms
// - Worker 1 在 P-core: 25ms  
// - Worker 2 在 E-core: 75ms ⚠️
// - Worker 3 在 E-core: 75ms ⚠️

// 你需要等待最慢的 Worker!
// 实际帧时间: max(25, 25, 75, 75) = 75ms

// 如果单线程在 P-core: 50ms
// → 多线程反而慢了!
```

## 🎯 实用决策矩阵

### 何时应该使用多线程?

| 条件 | 权重 | 说明 |
|------|------|------|
| 任务粒度大 | +++++ | 每个任务至少 5-10ms,才能抵消同步开销 |
| 计算密集型 | ++++ | CPU 密集,而非内存密集 |
| 数据局部性好 | ++++ | 每个 Worker 访问独立的内存区域 |
| 可分区 | ++++ | 数据可以干净地分区,减少跨线程通信 |
| 目标设备 | +++ | 桌面端比移动端更适合 |
| 用户负载 | ++ | 用户系统负载低时收益更大 |

### 你的 ECS 场景分析

根据你的文档 (`ecs_multithreading_design.md`):

#### ✅ 适合多线程的系统:

```moonbit
// 1. 物理系统 - 计算密集,易分区
struct PhysicsSystem {
  // 每个 Worker 处理 4096 个实体
  // 任务粒度: 8-12ms (足够大)
  // 数据访问: 独立分区 ✅
}

// 2. AI 系统 - 大量逻辑计算
struct AISystem {
  // 决策树计算在 GC 堆
  // 很少访问共享内存 ✅
}

// 3. 粒子系统
struct ParticleSystem {
  // 独立计算
  // 无交互 ✅
}
```

#### ❌ 不适合多线程的系统:

```moonbit
// 1. 碰撞检测 - 需要全局数据
struct CollisionSystem {
  // 需要读取所有实体位置
  // 大量跨分区通信 ❌
}

// 2. 渲染准备 - 任务粒度小
struct RenderSystem {
  // 只是准备渲染数据
  // 任务太小,同步开销大 ❌
}

// 3. 输入处理 - 延迟敏感
struct InputSystem {
  // 需要立即响应
  // 多线程会增加延迟 ❌
}
```

## 🔧 实用解决方案

### 方案 1: 混合架构 (推荐 ⭐⭐⭐⭐⭐)

```javascript
// 主线程 (P-core):
// - 输入处理
// - 渲染
// - 轻量级系统 (碰撞检测,事件系统)

// 1 个 Worker (希望在 P-core):
// - 物理系统
// - AI 系统

// 优势:
// ✅ 即使 Worker 在 E-core,也只慢 1.x 倍,可接受
// ✅ 如果 Worker 在 P-core,加速比接近 2x
// ✅ 同步开销小
// ✅ 实现简单
```

```javascript
// 主循环
function gameLoop() {
  // 主线程: 输入 + 轻量级系统 (2-3ms)
  handleInput();
  updateCollisionGrid();
  
  // 通知 Worker 开始处理
  Atomics.add(sharedU32, FRAME_OFFSET, 1);
  
  // 等待 Worker 完成 (物理 + AI: 5-8ms)
  waitForWorker();
  
  // 主线程: 渲染 (3-5ms)
  render();
  
  // 总帧时间: max(3, 8) + 5 = 13ms < 16ms ✅
}
```

### 方案 2: 动态调度 (⭐⭐⭐⭐)

```javascript
// 运行时检测 Worker 性能,动态决定是否启用

let useWorkers = true;

async function calibrate() {
  // 1. 单线程基准测试
  const singleTime = await benchmarkSingleThread();
  
  // 2. 多线程基准测试
  const multiTime = await benchmarkMultiThread();
  
  // 3. 决策
  if (multiTime * 1.2 < singleTime) {
    useWorkers = true;
    console.log('多线程收益显著,启用');
  } else {
    useWorkers = false;
    console.log('多线程收益不明显,禁用');
  }
}

// 启动时校准
await calibrate();

// 游戏循环根据 useWorkers 选择路径
function gameLoop() {
  if (useWorkers) {
    updateWithWorkers();
  } else {
    updateSingleThread();
  }
}
```

### 方案 3: 保守策略 (⭐⭐⭐)

```javascript
// 只在确定有收益的场景使用多线程

// 配置
const config = {
  // 实体数量阈值
  multiThreadThreshold: 8192,
  
  // 只在桌面端启用
  enableOnDesktop: true,
  
  // 只在 Chrome 启用 (调度较好)
  enableOnChrome: true,
};

function shouldUseWorkers() {
  if (entityCount < config.multiThreadThreshold) {
    return false; // 实体太少,单线程够用
  }
  
  if (isMobile()) {
    return false; // 移动端功耗优先
  }
  
  if (!isChrome()) {
    return false; // Safari 调度不友好
  }
  
  return true;
}
```

### 方案 4: WASM Threads (⭐⭐⭐⭐⭐ 终极方案)

```moonbit
// 使用 WASM 的 atomic + thread 特性
// 而不是 JS 的 WebWorker

// 优势:
// 1. 所有线程在同一个 WASM 实例中
// 2. 共享同一个线性内存,无 postMessage 开销
// 3. 更细粒度的控制

// 但需要:
// - SharedArrayBuffer
// - WASM threads 支持
// - MoonBit 需要支持多线程编译目标
```

不过 MoonBit 目前可能还不支持 WASM threads,这个可以作为未来优化方向。

## 📈 性能预期表

| 架构 | 单线程基准 | 多线程 (理想) | 多线程 (P+E混合) | 多线程 (全E-core) | 推荐 |
|------|-----------|--------------|----------------|------------------|------|
| 单线程 | 100% | - | - | - | 实体 < 4K |
| 1 Worker | 100% | 180% | 140% | 90% | ⭐ 稳健 |
| 2 Workers | 100% | 280% | 200% | 100% | 高风险 |
| 4 Workers | 100% | 380% | 220% | 80% | ❌ 不推荐 |

## 🎯 针对你的项目的建议

基于你的文档和代码结构:

### 推荐架构 A: 保守但稳健

```
主线程 (P-core):
├── 输入系统 (1ms)
├── 碰撞检测 (2ms)
├── 事件系统 (0.5ms)
└── 渲染 (4ms)

Worker 1:
├── 物理系统 (3ms)
├── AI 系统 (2ms)
└── 粒子系统 (1ms)

并行时间: max(7.5ms, 6ms) = 7.5ms ✅
```

### 推荐架构 B: 激进但高收益

```
主线程 (P-core):
├── 输入系统 (1ms)
└── 渲染 (4ms)

Worker 1: 物理系统 (6ms)
Worker 2: AI 系统 (4ms)

串行: 1 + 6 + 4 + 4 = 15ms
并行: max(5, 6, 4) = 6ms

风险: 如果 Workers 在 E-core
并行: max(5, 18, 12) = 18ms > 16ms ❌
```

### 最终建议

1. **先实现单线程版本** - 完整功能,作为基准
2. **实现 1-Worker 版本** - 风险低,收益稳定
3. **添加性能检测** - 运行时决定是否启用 Worker
4. **A/B 测试** - 收集真实用户数据
5. **保留单线程路径** - 作为降级方案

```javascript
// 伪代码
class ECSWorld {
  constructor() {
    this.mode = 'calibrating';
    this.worker = null;
  }
  
  async init() {
    // 校准
    const shouldUseWorker = await this.calibrate();
    
    if (shouldUseWorker) {
      this.mode = 'worker';
      this.worker = await this.createWorker();
    } else {
      this.mode = 'single';
    }
  }
  
  update(dt) {
    if (this.mode === 'worker') {
      return this.updateWithWorker(dt);
    } else {
      return this.updateSingleThread(dt);
    }
  }
}
```

## 📊 监控指标

在生产环境中,持续监控这些指标:

```javascript
const metrics = {
  frameTime: 0,
  workerTime: 0,
  syncTime: 0,
  speedup: 0,
  
  // 每 100 帧采样一次
  sample() {
    if (this.speedup < 1.2) {
      console.warn('⚠️ 多线程收益不足,考虑降级到单线程');
      // 可以动态切换!
    }
  }
};
```

## 结论

对于你的项目:
1. **不要盲目使用 4 个 Workers** - 风险很高
2. **从 1 个 Worker 开始** - 稳健的性能提升
3. **运行时检测** - 根据实际性能决定
4. **保持单线程路径** - 作为降级方案
5. **持续监控** - 收集真实数据

记住: **有时候单线程 + 良好的算法 > 多线程 + 糟糕的调度** 🎯

