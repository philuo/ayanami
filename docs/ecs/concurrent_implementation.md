# 并发 ECS 实现指南

## 概述

本文档详细说明如何在 Moonbit + WebAssembly + SharedArrayBuffer 环境下实现无数据冲突的并发 ECS 架构。

## 核心策略总结

### 1. 数据分区（Data Partitioning）

**原理**: 将实体空间划分给不同的 Worker，每个 Worker 只访问自己负责的内存区域。

**内存布局**:
```
Worker 0: Entity [0    - 4095 ] → 访问 SAB [0x2000  - 0x22000]
Worker 1: Entity [4096 - 8191 ] → 访问 SAB [0x22000 - 0x42000]
Worker 2: Entity [8192 - 12287] → 访问 SAB [0x42000 - 0x62000]
Worker 3: Entity [12288- 16383] → 访问 SAB [0x62000 - 0x82000]
```

**优势**:
- ✅ 零竞争，性能最高
- ✅ 不需要锁或原子操作
- ✅ 实现简单

**劣势**:
- ⚠️ 需要负载均衡
- ⚠️ 跨分区交互需要特殊处理

### 2. 双缓冲（Double Buffering）

**原理**: 使用两个缓冲区，Workers 从一个缓冲区读取，写入另一个缓冲区。

**工作流程**:
```
帧 N:
  - 所有 Worker 从 Buffer 0 读取
  - 所有 Worker 写入 Buffer 1
  - 等待所有 Worker 完成
  - 切换活动缓冲区

帧 N+1:
  - 所有 Worker 从 Buffer 1 读取
  - 所有 Worker 写入 Buffer 0
  - ...
```

**优势**:
- ✅ 读写完全分离，无冲突
- ✅ 适合需要全局状态的系统

**劣势**:
- ⚠️ 内存使用翻倍
- ⚠️ 需要同步屏障

### 3. 原子操作（Atomic Operations）

**适用场景**: 元数据、状态标志、计数器等小型共享数据。

**WebAssembly 原子指令**:
- `i32.atomic.load` / `i32.atomic.store`
- `i32.atomic.rmw.add` / `i32.atomic.rmw.sub`
- `i32.atomic.rmw.cmpxchg` (CAS)
- `memory.atomic.wait32` / `memory.atomic.notify`

**示例**: 帧计数器、Worker 状态标记

### 4. 屏障同步（Barrier Synchronization）

**原理**: 所有 Worker 必须到达同一同步点才能继续。

**实现**:
```moonbit
// 所有 Worker 到达此点
barrier.wait()

// 继续执行...
```

**应用**: 读写阶段切换、缓冲区交换

## 推荐架构: 分区 + 双缓冲 + 屏障

### 内存布局

```
SharedArrayBuffer (256 MB)

┌─────────────────────────────────────────────────────────────┐
│ 0x00000 - 0x00100 (256 B)   元数据区                        │
│   0x00000: entity_count      (i32, atomic)                 │
│   0x00004: frame_number      (i32, atomic)                 │
│   0x00008: worker_status[4]  (i32[4], atomic)              │
│   0x00018: active_buffer     (i32, atomic, 0 or 1)         │
│                                                             │
│ 0x01000 - 0x02000 (4 KB)    同步区                          │
│   0x01000: barrier_counter   (i32, atomic)                 │
│   0x01004: barrier_generation(i32, atomic)                 │
│   0x01008: lock_array[]      (i32[], atomic)               │
│                                                             │
│ 0x02000 - 0x01000 (3.9 KB)  输入区 (JS主线程写)             │
│   0x00100: mouse_x, mouse_y                                │
│   0x00110: keyboard_state[64]                              │
│                                                             │
│ 0x02000 - ...                组件数据区                      │
│                                                             │
│   Position X - Buffer 0      [0x02000  - 0x22000]  128KB   │
│   Position Y - Buffer 0      [0x22000  - 0x42000]  128KB   │
│   Velocity X - Buffer 0      [0x42000  - 0x62000]  128KB   │
│   Velocity Y - Buffer 0      [0x62000  - 0x82000]  128KB   │
│   ... 更多组件 ...                                          │
└─────────────────────────────────────────────────────────────┘
```

### Worker 执行流程

```
每个 Worker 的帧循环:

1. [等待] 检查 frame_number 是否增加
   ↓
2. [读取] 从 active_buffer 批量加载数据到 GC 堆
   ↓
3. [计算] 在 GC 堆中进行逻辑计算 (快速!)
   ↓
4. [写入] 批量写入到非活动缓冲区
   ↓
5. [标记] 设置 worker_status[id] = current_frame
   ↓
6. [同步] 等待屏障 - 所有 Worker 完成
   ↓
7. [切换] Worker 0 切换 active_buffer
   ↓
8. [同步] 再次等待屏障 - 确保切换完成
   ↓
   回到步骤 1
```

### JS 主线程流程

```javascript
function gameLoop(currentTime) {
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // 1. 写入输入数据
  writeInputToSAB();
  
  // 2. 触发新帧 (增加帧号)
  Atomics.add(sharedU32, FRAME_NUMBER_OFFSET / 4, 1);
  const frameNum = Atomics.load(sharedU32, FRAME_NUMBER_OFFSET / 4);
  
  // 3. 等待所有 Workers 完成
  waitForWorkers(frameNum);
  
  // 4. 从活动缓冲区读取渲染数据
  const activeBuffer = Atomics.load(sharedU32, ACTIVE_BUFFER_OFFSET / 4);
  const renderData = readRenderData(activeBuffer);
  
  // 5. 渲染
  render(renderData);
  
  requestAnimationFrame(gameLoop);
}

function waitForWorkers(frameNum) {
  const WORKER_STATUS_BASE = WORKER_STATUS_OFFSET / 4;
  
  // 轮询等待所有 Workers 标记完成
  while (true) {
    let allDone = true;
    for (let i = 0; i < WORKER_COUNT; i++) {
      if (Atomics.load(sharedU32, WORKER_STATUS_BASE + i) < frameNum) {
        allDone = false;
        break;
      }
    }
    if (allDone) break;
  }
}
```

## 高级场景处理

### 场景 1: 跨分区交互（碰撞检测）

**问题**: Worker 0 的实体可能与 Worker 1 的实体碰撞。

**解决方案 A - 读写分离**:
```
阶段 1: 所有 Worker 读取所有位置数据（只读，并发安全）
阶段 2: 每个 Worker 检测自己分区内实体与其他实体的碰撞
阶段 3: 每个 Worker 只写入自己分区的碰撞结果
```

**解决方案 B - 空间划分**:
```
将世界划分为网格，每个网格分配给一个 Worker
实体移动到其他网格时，转移所有权
```

**解决方案 C - 消息传递**:
```
Worker 0 检测到跨分区碰撞 → 写入消息队列
Worker 1 读取消息队列 → 处理碰撞响应
```

### 场景 2: 全局资源访问（实体池、资源管理器）

**问题**: 创建/删除实体需要修改全局状态。

**解决方案 - 延迟操作队列**:
```moonbit
// 每个 Worker 维护本地队列
let spawn_queue: Array[EntitySpawnRequest] = []
let destroy_queue: Array[EntityId] = []

// 在系统逻辑中
fn spawn_entity(template: EntityTemplate) {
  spawn_queue.push(EntitySpawnRequest { template })
}

// 帧结束后，单线程处理队列
fn process_entity_operations() {
  for request in spawn_queue {
    // 在共享内存中创建实体
  }
  spawn_queue.clear()
}
```

### 场景 3: 细粒度锁（避免使用）

如果必须使用锁，使用细粒度锁降低竞争:

```moonbit
// ❌ 粗粒度锁 - 锁住整个组件数组
global_lock.lock()
for entity in entities {
  update_component(entity)
}
global_lock.unlock()

// ✅ 细粒度锁 - 每个实体一个锁
for entity in entities {
  let lock = get_entity_lock(entity)
  lock.lock()
  update_component(entity)
  lock.unlock()
}
```

## 性能优化技巧

### 1. 批量加载（减少共享内存访问）

```moonbit
// ❌ 逐个访问 - 慢
for i in 0..<entity_count {
  let x = load_f64(shared_memory, pos_x_base + i * 8)
  let y = load_f64(shared_memory, pos_y_base + i * 8)
  process(x, y)
}

// ✅ 批量加载到 GC 堆 - 快
let positions = load_position_batch(0, entity_count, buffer)
for i in 0..<entity_count {
  process(positions.x_data[i], positions.y_data[i])  // GC 堆访问
}
```

### 2. SoA (Structure of Arrays)

```moonbit
// ❌ AoS - 缓存不友好
struct Entity {
  x: Double
  y: Double
  vx: Double
  vy: Double
}
let entities: Array[Entity] = [...]

// ✅ SoA - 缓存友好
struct Entities {
  x: Array[Double]
  y: Array[Double]
  vx: Array[Double]
  vy: Array[Double]
}
```

### 3. 预分配 GC 缓冲区

```moonbit
// 在 Worker 初始化时预分配
struct MovementSystem {
  pos_x_buffer: Array[Double]  // 预分配，避免每帧 GC
  pos_y_buffer: Array[Double]
  vel_x_buffer: Array[Double]
  vel_y_buffer: Array[Double]
}

fn MovementSystem::new(entity_count: Int) -> MovementSystem {
  MovementSystem {
    pos_x_buffer: Array::make(entity_count, 0.0),
    pos_y_buffer: Array::make(entity_count, 0.0),
    vel_x_buffer: Array::make(entity_count, 0.0),
    vel_y_buffer: Array::make(entity_count, 0.0),
  }
}
```

### 4. 对齐和 Padding

```moonbit
// 确保数据对齐到 8 字节边界
let POSITION_X_BASE = 0x2000  // 对齐
let POSITION_Y_BASE = 0x22000 // 对齐

// 避免伪共享（False Sharing）
// 不同 Worker 的元数据应该在不同缓存行
let WORKER_STATUS_OFFSET = METADATA_BASE + 8  // 每个 Worker 4 字节
// 如果需要，可以 padding 到 64 字节（缓存行大小）
```

## 调试技巧

### 1. 检测数据竞争

```moonbit
// 在开发模式下，添加访问记录
let access_log: Array[(Int, Int, String)] = []  // (entity_id, worker_id, operation)

fn debug_write_position(entity_id: Int, worker_id: Int, value: Double) {
  // 检查是否有其他 Worker 正在访问
  for (eid, wid, op) in access_log {
    if eid == entity_id && wid != worker_id {
      panic("Data race detected!")
    }
  }
  
  access_log.push((entity_id, worker_id, "write"))
  write_position(entity_id, value)
}
```

### 2. 可视化 Worker 状态

```javascript
// 在浏览器中显示每个 Worker 的状态
function debugRenderWorkerStatus() {
  const WORKER_STATUS_BASE = WORKER_STATUS_OFFSET / 4;
  const frameNum = Atomics.load(sharedU32, FRAME_NUMBER_OFFSET / 4);
  
  for (let i = 0; i < WORKER_COUNT; i++) {
    const status = Atomics.load(sharedU32, WORKER_STATUS_BASE + i);
    const color = status >= frameNum ? 'green' : 'red';
    console.log(`Worker ${i}: ${status} / ${frameNum}`, color);
  }
}
```

## 常见错误和解决

### 错误 1: 忘记使用原子操作

```moonbit
// ❌ 错误 - 普通读写
let frame = load_i32(FRAME_NUMBER_OFFSET)

// ✅ 正确 - 原子读写
let frame = atomic_load_i32(FRAME_NUMBER_OFFSET)
```

### 错误 2: 缓冲区切换时机错误

```moonbit
// ❌ 错误 - 在 Workers 还在写入时切换
set_worker_status(worker_id, frame)
if worker_id == 0 {
  swap_buffer()  // 危险！其他 Worker 还在写
}

// ✅ 正确 - 等待所有 Worker 完成
set_worker_status(worker_id, frame)
barrier.wait()  // 等待所有 Worker
if worker_id == 0 {
  swap_buffer()
}
barrier.wait()  // 确保切换完成
```

### 错误 3: 跨分区访问

```moonbit
// ❌ 错误 - Worker 0 访问 Worker 1 的分区
fn run_system(partition: WorkerPartition) {
  for i in 0..<MAX_ENTITIES {  // 越界！
    update(i)
  }
}

// ✅ 正确 - 只访问自己的分区
fn run_system(partition: WorkerPartition) {
  for i in partition.entity_start..<partition.entity_end() {
    update(i)
  }
}
```

## 性能指标参考

基于 16K 实体、4 个 Worker 的典型场景:

| 操作 | 时间（单线程） | 时间（4线程） | 加速比 |
|------|---------------|--------------|--------|
| 位置更新 | 2.0 ms | 0.6 ms | 3.3x |
| 物理计算 | 8.0 ms | 2.2 ms | 3.6x |
| 碰撞检测 | 12.0 ms | 4.0 ms | 3.0x |
| AI 决策 | 6.0 ms | 1.8 ms | 3.3x |
| **总计** | **28.0 ms** | **8.6 ms** | **3.3x** |

**瓶颈分析**:
- 共享内存访问: 10-20%
- 屏障同步: 5-10%
- GC 堆计算: 70-80%

**优化目标**: 将帧时间控制在 16ms 内，实现 60 FPS。

## 总结

### 核心原则

1. **分区优先**: 尽可能使用数据分区避免竞争
2. **批量操作**: 减少共享内存访问次数
3. **读写分离**: 使用双缓冲分离读写
4. **原子最小化**: 仅在必要时使用原子操作
5. **GC 堆计算**: 将热点计算移到 GC 堆

### 推荐组合

对于大多数游戏场景:
- **数据分区** + **双缓冲** + **屏障同步**

对于特殊需求:
- 全局状态: 使用原子操作或单线程处理
- 跨分区交互: 消息队列或空间划分
- 资源管理: 延迟操作队列

### 开发流程

1. 先实现单线程版本
2. 识别可并行的系统
3. 设计内存分区
4. 添加同步机制
5. 性能测试和调优
6. 添加调试工具

