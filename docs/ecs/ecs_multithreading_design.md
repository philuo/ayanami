# 高性能多线程 ECS 架构设计
## WASM-GC + SharedArrayBuffer + WebWorker

╔═══════════════════════════════════════════════════════════════╗
║  架构概览                                                      ║
╚═══════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────┐
│  主线程 (JS)                                                    │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 渲染系统      │  │ 输入捕获      │  │ 网络/音频     │        │
│  │ (Canvas 2D/  │  │ (鼠标/键盘)   │  │              │        │
│  │  WebGL)      │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         ↕                  ↕                                    │
│  ┌─────────────────────────────────────────────────┐          │
│  │         SharedArrayBuffer (线性内存)             │          │
│  │  ┌──────────┬──────────┬──────────┬──────────┐  │          │
│  │  │ 输入区   │ 组件数据 │ 输出区   │ 同步区   │  │          │
│  │  └──────────┴──────────┴──────────┴──────────┘  │          │
│  └─────────────────────────────────────────────────┘          │
│         ↕            ↕            ↕            ↕                │
├────────────────────────────────────────────────────────────────┤
│  Worker 1          Worker 2          Worker 3                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ WASM-GC      │  │ WASM-GC      │  │ WASM-GC      │        │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │        │
│  │ │ GC 堆    │ │  │ │ GC 堆    │ │  │ │ GC 堆    │ │        │
│  │ │ (系统逻辑)│ │  │ │ (系统逻辑)│ │  │ │ (系统逻辑)│ │        │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │        │
│  │              │  │              │  │              │        │
│  │ 物理系统      │  │ AI 系统      │  │ 战斗系统      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘

关键点：
✅ GC 堆：每个 Worker 独立，存储系统逻辑
✅ 线性内存：SharedArrayBuffer，所有线程共享
✅ 组件数据：存储在共享线性内存中
✅ 系统逻辑：存储在各自的 GC 堆中


╔═══════════════════════════════════════════════════════════════╗
║  1. 共享内存布局设计                                           ║
╚═══════════════════════════════════════════════════════════════╝

SharedArrayBuffer (线性内存) 布局：
┌──────────────────────────────────────────────────────────────┐
│ 地址范围              用途                访问模式             │
├──────────────────────────────────────────────────────────────┤
│ 0x0000 - 0x0100    元数据区              Atomic 读写         │
│   0x0000: entity_count                                       │
│   0x0004: frame_number                                       │
│   0x0008: worker_status[4]                                   │
│   0x0020: lock_flags                                         │
│                                                              │
│ 0x0100 - 0x1000    输入区 (JS → WASM)   JS写, WASM读        │
│   0x0100: mouse_x                                            │
│   0x0104: mouse_y                                            │
│   0x0108: mouse_buttons                                      │
│   0x0110: keys[256]         // 键盘状态位图                  │
│   0x0200: gamepad[4][16]    // 4个手柄，每个16字节           │
│                                                              │
│ 0x1000 - 0x2000    同步/调度区          Atomic 操作         │
│   0x1000: system_barriers[8]  // 系统间同步屏障              │
│   0x1100: job_queue           // 任务队列                    │
│                                                              │
│ 0x2000 - 0x10000   组件数据区(SoA)      分区并行访问         │
│   位置组件:                                                  │
│   0x2000: positions_x[MAX_ENTITIES]                         │
│   0x6000: positions_y[MAX_ENTITIES]                         │
│                                                              │
│   速度组件:                                                  │
│   0x10000: velocities_x[MAX_ENTITIES]                       │
│   0x14000: velocities_y[MAX_ENTITIES]                       │
│                                                              │
│   碰撞组件:                                                  │
│   0x20000: collision_radius[MAX_ENTITIES]                   │
│   0x24000: collision_layer[MAX_ENTITIES]                    │
│                                                              │
│ 0x100000+          渲染输出区 (WASM → JS)  WASM写, JS读     │
│   0x100000: render_data                                      │
│   0x100004: sprite_positions[MAX_VISIBLE]                   │
│   0x110000: sprite_rotations[MAX_VISIBLE]                   │
└──────────────────────────────────────────────────────────────┘

关键设计：
✓ SoA (Structure of Arrays)：提高缓存命中率
✓ 对齐：所有数据 4/8 字节对齐
✓ 分区：不同系统访问不同区域，减少竞争
✓ Atomic：关键元数据使用原子操作


╔═══════════════════════════════════════════════════════════════╗
║  2. MoonBit 实现：内存管理层                                   ║
╚═══════════════════════════════════════════════════════════════╝

```moonbit
// src/ecs/memory_layout.mbt

// ========== 内存布局常量 ==========
pub let METADATA_BASE : Int = 0x0000
pub let INPUT_BASE    : Int = 0x0100
pub let SYNC_BASE     : Int = 0x1000
pub let COMPONENT_BASE: Int = 0x2000
pub let RENDER_BASE   : Int = 0x100000

pub let MAX_ENTITIES  : Int = 4096

// ========== 原子操作包装 ==========
///|
pub fn atomic_load(addr: Int) -> Int =
  #|(func (param $addr i32) (result i32)
      (i32.atomic.load (local.get $addr)))

///|
pub fn atomic_store(addr: Int, val: Int) -> Unit =
  #|(func (param $addr i32) (param $val i32)
      (i32.atomic.store (local.get $addr) (local.get $val)))

///|
pub fn atomic_add(addr: Int, delta: Int) -> Int =
  #|(func (param $addr i32) (param $delta i32) (result i32)
      (i32.atomic.rmw.add (local.get $addr) (local.get $delta)))

///|
pub fn atomic_cmpxchg(addr: Int, expected: Int, desired: Int) -> Int =
  #|(func (param $addr i32) (param $expected i32) (param $desired i32) (result i32)
      (i32.atomic.rmw.cmpxchg 
        (local.get $addr) 
        (local.get $expected) 
        (local.get $desired)))

// ========== 元数据访问 ==========
pub fn get_entity_count() -> Int {
  atomic_load(METADATA_BASE + 0)
}

pub fn set_entity_count(count: Int) {
  atomic_store(METADATA_BASE + 0, count)
}

pub fn get_frame_number() -> Int {
  atomic_load(METADATA_BASE + 4)
}

pub fn increment_frame() -> Int {
  atomic_add(METADATA_BASE + 4, 1)
}

// ========== 输入读取 ==========
pub struct InputState {
  mouse_x: Int
  mouse_y: Int
  mouse_buttons: Int
  keys: FixedArray[Int]  // 在 GC 堆，读取后缓存
}

pub fn read_input() -> InputState {
  let keys = FixedArray::make(8, 0)  // 256 bits = 8 * 32
  
  // 读取输入数据到 GC 堆中的结构
  for i = 0; i < 8; i = i + 1 {
    keys[i] = load32(INPUT_BASE + 0x10 + i * 4)
  }
  
  InputState {
    mouse_x: load32(INPUT_BASE + 0),
    mouse_y: load32(INPUT_BASE + 4),
    mouse_buttons: load32(INPUT_BASE + 8),
    keys: keys,
  }
}

// ========== 组件数据访问 (SoA) ==========
pub fn get_position_x(entity_id: Int) -> Double {
  loadf64(COMPONENT_BASE + entity_id * 8)
}

pub fn set_position_x(entity_id: Int, x: Double) {
  storef64(COMPONENT_BASE + entity_id * 8, x)
}

pub fn get_position_y(entity_id: Int) -> Double {
  loadf64(COMPONENT_BASE + 0x4000 + entity_id * 8)
}

pub fn set_position_y(entity_id: Int, y: Double) {
  storef64(COMPONENT_BASE + 0x4000 + entity_id * 8, y)
}

// ========== 批量操作（优化缓存） ==========
pub struct PositionBatch {
  start_id: Int
  count: Int
  x_data: FixedArray[Double]  // GC 堆中的临时缓存
  y_data: FixedArray[Double]
}

pub fn load_position_batch(start_id: Int, count: Int) -> PositionBatch {
  let x_data = FixedArray::make(count, 0.0)
  let y_data = FixedArray::make(count, 0.0)
  
  for i = 0; i < count; i = i + 1 {
    x_data[i] = get_position_x(start_id + i)
    y_data[i] = get_position_y(start_id + i)
  }
  
  PositionBatch { start_id, count, x_data, y_data }
}

pub fn store_position_batch(batch: PositionBatch) {
  for i = 0; i < batch.count; i = i + 1 {
    set_position_x(batch.start_id + i, batch.x_data[i])
    set_position_y(batch.start_id + i, batch.y_data[i])
  }
}
```


╔═══════════════════════════════════════════════════════════════╗
║  3. 多线程 ECS 系统设计                                        ║
╚═══════════════════════════════════════════════════════════════╝

```moonbit
// src/ecs/systems.mbt

// ========== 系统基类 (GC 堆中) ==========
trait System {
  run(self: Self, input: InputState, dt: Double) -> Unit
  get_component_range(self: Self) -> (Int, Int)  // 返回访问的组件范围
}

// ========== 物理系统 (Worker 1) ==========
struct PhysicsSystem {
  entity_start: Int
  entity_end: Int
}

impl System for PhysicsSystem {
  fn run(self: Self, input: InputState, dt: Double) {
    // 1. 批量加载到 GC 堆（减少线性内存访问）
    let positions = load_position_batch(self.entity_start, self.entity_end - self.entity_start)
    let velocities = load_velocity_batch(self.entity_start, self.entity_end - self.entity_start)
    
    // 2. 在 GC 堆中处理（快速）
    for i = 0; i < positions.count; i = i + 1 {
      positions.x_data[i] = positions.x_data[i] + velocities.x_data[i] * dt
      positions.y_data[i] = positions.y_data[i] + velocities.y_data[i] * dt
    }
    
    // 3. 批量写回共享内存
    store_position_batch(positions)
  }
  
  fn get_component_range(self: Self) -> (Int, Int) {
    (COMPONENT_BASE, COMPONENT_BASE + 0x10000)  // 声明访问范围
  }
}

// ========== AI 系统 (Worker 2) ==========
struct AISystem {
  entity_start: Int
  entity_end: Int
  decision_tree: DecisionTree  // 在 GC 堆中
}

impl System for AISystem {
  fn run(self: Self, input: InputState, dt: Double) {
    // AI 逻辑主要在 GC 堆中
    let decisions = self.decision_tree.evaluate(input)
    
    // 只在需要时写入共享内存
    for decision in decisions {
      set_velocity_x(decision.entity_id, decision.velocity_x)
      set_velocity_y(decision.entity_id, decision.velocity_y)
    }
  }
  
  fn get_component_range(self: Self) -> (Int, Int) {
    (COMPONENT_BASE + 0x10000, COMPONENT_BASE + 0x20000)
  }
}
```


╔═══════════════════════════════════════════════════════════════╗
║  4. JavaScript 主线程协调                                      ║
╚═══════════════════════════════════════════════════════════════╝

```javascript
// index.html / main.js

// ========== 创建共享内存 ==========
const MEMORY_SIZE = 16 * 1024 * 1024;  // 16 MB
const sharedMemory = new SharedArrayBuffer(MEMORY_SIZE);
const sharedView = new DataView(sharedMemory);
const sharedU32 = new Uint32Array(sharedMemory);
const sharedF64 = new Float64Array(sharedMemory);

// ========== 创建 Workers ==========
const workers = [
  new Worker('physics_worker.js'),
  new Worker('ai_worker.js'),
  new Worker('combat_worker.js'),
];

// 向所有 Workers 发送共享内存
workers.forEach((worker, id) => {
  worker.postMessage({ 
    type: 'init', 
    memory: sharedMemory,
    workerId: id,
    wasmUrl: 'target/wasm-gc/release/build/ayanami.wasm'
  });
});

// ========== 内存布局常量 ==========
const METADATA_BASE = 0x0000;
const INPUT_BASE = 0x0100;
const SYNC_BASE = 0x1000;
const RENDER_BASE = 0x100000;

// ========== 输入写入 ==========
const inputState = {
  mouseX: 0,
  mouseY: 0,
  mouseButtons: 0,
  keys: new Uint32Array(8),
};

canvas.addEventListener('mousemove', (e) => {
  inputState.mouseX = e.clientX;
  inputState.mouseY = e.clientY;
  
  // 写入共享内存
  sharedView.setFloat64(INPUT_BASE + 0, inputState.mouseX, true);
  sharedView.setFloat64(INPUT_BASE + 8, inputState.mouseY, true);
});

canvas.addEventListener('keydown', (e) => {
  const keyCode = e.keyCode;
  const arrayIdx = Math.floor(keyCode / 32);
  const bitIdx = keyCode % 32;
  
  inputState.keys[arrayIdx] |= (1 << bitIdx);
  sharedU32[(INPUT_BASE / 4) + 4 + arrayIdx] = inputState.keys[arrayIdx];
});

// ========== 游戏循环 ==========
let lastTime = performance.now();

function gameLoop(currentTime) {
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // 1. 增加帧号（触发 Workers 开始处理）
  Atomics.add(sharedU32, METADATA_BASE / 4 + 1, 1);
  const frameNum = Atomics.load(sharedU32, METADATA_BASE / 4 + 1);
  
  // 2. 等待所有 Workers 完成
  // 使用 Atomics.wait 或轮询 worker_status
  waitForWorkers(frameNum);
  
  // 3. 读取渲染数据
  const entityCount = Atomics.load(sharedU32, METADATA_BASE / 4);
  const renderData = new Float64Array(
    sharedMemory, 
    RENDER_BASE, 
    entityCount * 4  // x, y, rotation, scale
  );
  
  // 4. 渲染
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < entityCount; i++) {
    const x = renderData[i * 4 + 0];
    const y = renderData[i * 4 + 1];
    const rot = renderData[i * 4 + 2];
    const scale = renderData[i * 4 + 3];
    
    drawSprite(ctx, x, y, rot, scale);
  }
  
  requestAnimationFrame(gameLoop);
}

function waitForWorkers(frameNum) {
  const WORKER_STATUS_OFFSET = (METADATA_BASE + 8) / 4;
  
  for (let i = 0; i < workers.length; i++) {
    // 等待 worker 标记完成
    while (Atomics.load(sharedU32, WORKER_STATUS_OFFSET + i) < frameNum) {
      // Atomics.wait 或 busy wait
    }
  }
}
```


╔═══════════════════════════════════════════════════════════════╗
║  5. Worker 实现                                                ║
╚═══════════════════════════════════════════════════════════════╝

```javascript
// physics_worker.js

let wasmInstance;
let sharedMemory;
let workerId;
let sharedU32;

self.onmessage = async (e) => {
  if (e.data.type === 'init') {
    sharedMemory = e.data.memory;
    workerId = e.data.workerId;
    sharedU32 = new Uint32Array(sharedMemory);
    
    // 加载 WASM
    const wasmBuffer = await fetch(e.data.wasmUrl).then(r => r.arrayBuffer());
    const memory = new WebAssembly.Memory({ 
      initial: 1, 
      maximum: 1,
      shared: false  // Worker 内部的线性内存是独立的
    });
    
    // ⚠️ 关键：传入 SharedArrayBuffer 作为共享内存
    wasmInstance = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        // 这里我们需要自定义导入，让 WASM 使用 SharedArrayBuffer
        shared_memory: sharedMemory,
        log: (x) => console.log('[Worker ' + workerId + ']', x),
      }
    });
    
    // 启动系统循环
    systemLoop();
  }
};

function systemLoop() {
  const METADATA_BASE = 0;
  const WORKER_STATUS_OFFSET = (METADATA_BASE + 8) / 4;
  let lastFrame = 0;
  
  setInterval(() => {
    // 1. 检查是否有新帧
    const currentFrame = Atomics.load(sharedU32, METADATA_BASE / 4 + 1);
    
    if (currentFrame > lastFrame) {
      lastFrame = currentFrame;
      
      // 2. 运行物理系统（WASM）
      wasmInstance.exports.run_physics_system(0.016);
      
      // 3. 标记完成
      Atomics.store(sharedU32, WORKER_STATUS_OFFSET + workerId, currentFrame);
    }
  }, 1);  // 1ms 轮询
}
```


╔═══════════════════════════════════════════════════════════════╗
║  6. 内存冲突避免策略                                           ║
╚═══════════════════════════════════════════════════════════════╝

策略 1: 数据分区（推荐）
┌────────────────────────────────────────────────────────┐
│  Entity 0-1023:   Worker 1 (Physics)                   │
│  Entity 1024-2047: Worker 2 (AI)                       │
│  Entity 2048-3071: Worker 3 (Combat)                   │
│  Entity 3072-4095: Worker 4 (Render Prep)             │
└────────────────────────────────────────────────────────┘
✅ 无竞争
✅ 高性能
⚠️ 需要负载均衡

策略 2: 读写分离
┌────────────────────────────────────────────────────────┐
│  Phase 1: 所有 Workers 读取数据（并发）                 │
│  Phase 2: 所有 Workers 计算（GC 堆，并发）              │
│  Phase 3: 所有 Workers 写入数据（需同步）               │
└────────────────────────────────────────────────────────┘
✅ 灵活
⚠️ 需要 Barrier 同步

策略 3: 双缓冲
┌────────────────────────────────────────────────────────┐
│  Buffer A: Workers 读取                                │
│  Buffer B: Workers 写入                                │
│  交换                                                  │
└────────────────────────────────────────────────────────┘
✅ 无锁
⚠️ 内存翻倍

推荐组合：分区 + 读写分离


╔═══════════════════════════════════════════════════════════════╗
║  7. 性能优化要点                                               ║
╚═══════════════════════════════════════════════════════════════╝

1️⃣ 批量加载到 GC 堆
   ❌ 避免：每次都从共享内存读
   for entity in entities {
     let x = load_f64(shared_memory, offset)  // 慢！
     process(x)
   }
   
   ✅ 推荐：批量加载到 GC 堆
   let batch = load_batch(shared_memory, start, count)  // 一次读取
   for x in batch.data {  // GC 堆中快速访问
     process(x)
   }
   store_batch(shared_memory, batch)  // 一次写入

2️⃣ SoA (Structure of Arrays)
   ❌ AoS: [Entity{x,y,vx,vy}, Entity{x,y,vx,vy}, ...]
   ✅ SoA: {x[], y[], vx[], vy[]}
   
   优势：
   - 更好的缓存局部性
   - SIMD 友好
   - 减少内存带宽

3️⃣ 对齐和 Padding
   所有数据 8 字节对齐，避免跨缓存行

4️⃣ Atomic 操作最小化
   只在必要时使用 Atomic（元数据、同步点）
   组件数据用分区避免竞争

5️⃣ 预分配
   在 GC 堆中预分配临时缓冲区，避免频繁 GC


╔═══════════════════════════════════════════════════════════════╗
║  8. 完整示例：移动系统                                         ║
╚═══════════════════════════════════════════════════════════════╝

```moonbit
// src/ecs/movement_system.mbt

struct MovementSystem {
  entity_start: Int
  entity_count: Int
  // GC 堆中的临时缓冲区（预分配）
  pos_x_buffer: FixedArray[Double]
  pos_y_buffer: FixedArray[Double]
  vel_x_buffer: FixedArray[Double]
  vel_y_buffer: FixedArray[Double]
}

pub fn MovementSystem::new(start: Int, count: Int) -> MovementSystem {
  MovementSystem {
    entity_start: start,
    entity_count: count,
    pos_x_buffer: FixedArray::make(count, 0.0),
    pos_y_buffer: FixedArray::make(count, 0.0),
    vel_x_buffer: FixedArray::make(count, 0.0),
    vel_y_buffer: FixedArray::make(count, 0.0),
  }
}

pub fn MovementSystem::run(self: MovementSystem, dt: Double) {
  // 1. 批量加载（一次性读取，减少共享内存访问）
  let base_pos_x = COMPONENT_BASE
  let base_pos_y = COMPONENT_BASE + 0x4000
  let base_vel_x = COMPONENT_BASE + 0x10000
  let base_vel_y = COMPONENT_BASE + 0x14000
  
  for i = 0; i < self.entity_count; i = i + 1 {
    let entity_id = self.entity_start + i
    self.pos_x_buffer[i] = loadf64(base_pos_x + entity_id * 8)
    self.pos_y_buffer[i] = loadf64(base_pos_y + entity_id * 8)
    self.vel_x_buffer[i] = loadf64(base_vel_x + entity_id * 8)
    self.vel_y_buffer[i] = loadf64(base_vel_y + entity_id * 8)
  }
  
  // 2. 在 GC 堆中快速计算
  for i = 0; i < self.entity_count; i = i + 1 {
    self.pos_x_buffer[i] = self.pos_x_buffer[i] + self.vel_x_buffer[i] * dt
    self.pos_y_buffer[i] = self.pos_y_buffer[i] + self.vel_y_buffer[i] * dt
  }
  
  // 3. 批量写回
  for i = 0; i < self.entity_count; i = i + 1 {
    let entity_id = self.entity_start + i
    storef64(base_pos_x + entity_id * 8, self.pos_x_buffer[i])
    storef64(base_pos_y + entity_id * 8, self.pos_y_buffer[i])
  }
}
```


╔═══════════════════════════════════════════════════════════════╗
║  9. 总结：WASM-GC 在多线程 ECS 中的角色                        ║
╚═══════════════════════════════════════════════════════════════╝

GC 堆的用途：
✅ 系统逻辑代码
✅ 临时计算缓冲区
✅ 决策树、状态机等复杂结构
✅ 字符串处理
✅ 中间结果

线性内存（SharedArrayBuffer）的用途：
✅ ECS 组件数据
✅ 跨线程共享状态
✅ 输入/输出缓冲区
✅ 同步原语

关键设计原则：
1. 批量读写：减少共享内存访问
2. 分区处理：避免竞争
3. GC 堆计算：利用高速缓存
4. 原子操作：仅用于同步点
5. SoA 布局：提升性能

性能预期：
- 4 Workers，4096 entities
- 每帧 16ms 预算
- 每个 Worker 处理 1024 entities
- 批量加载：~0.5ms
- GC 堆计算：~3ms
- 批量写回：~0.5ms
- 总计：~4ms/worker（并行）
- 实际帧时间：~4-5ms ✅ 满足 60 FPS

