# ECS架构设计

## 架构设计

```prompt
你提的建议有一点很重要就是根据任务量决定采用的架构方案。请仔细考虑Web场景渲染是WebGPU在RenderWorker中通过OffscreenCanvas实现的。

JS主线程接收用户键盘、鼠标输入并以DataView零拷贝写在SAB中头部RingBuffer中，Worker只读遍历输入。

问题：我如何参考Bevy设计性能极佳的调度器（考虑任务量）分配任务给多个Worker干活？

目前我的架构: 1个“JS主线程”(记录用户输入、rAF做tick通知逻辑线程)，1个“逻辑线程”拥有资源（模型、纹理、音频、动画等数据）、任务调度开启并行逻辑计算，完成并行逻辑计算后“渲染线程”进行渲染。
```

## 架构分析

```
JS主线程 (Input Thread)
    │
    ├─ 1. 加载*.wasm、*.worker.js 并缓存至indexedDB
    ├─ 2. 加载WASM并缓存至indexedDB
    ├─ 采集输入 → SAB RingBuffer (零拷贝)
    ├─ 采集输入 → SAB RingBuffer (零拷贝)
    └─ rAF tick → 通知逻辑线程
    
逻辑线程 (Main ECS World)
    │
    ├─ 读取输入 (从SAB)
    ├─ ECS调度器 ← 这是核心！
    │   ├─ 分析系统依赖
    │   ├─ 评估任务量
    │   └─ 决定并行策略
    │
    ├─ 派发任务 → 计算Worker池
    │   ├─ PhysicsWorker
    │   ├─ AIWorker
    │   └─ AnimationWorker
    │
    ├─ 等待计算完成
    └─ 设置渲染数据 → 渲染线程

渲染线程 (RenderWorker)
    │
    ├─ 获取渲染数据
    ├─ WebGPU渲染 (OffscreenCanvas)
    └─ 完成通知
```

## SparseSet vs Archetype

- SparseSet

```
优点：简单，O(1) 访问
缺点：浪费内存（不是所有实体都有所有组件）

16K 实体 × 20 种组件 × 平均 32 字节 = 10MB
但实际使用率可能只有 30% → 浪费 7MB
```

- Archetype

```
优点：内存紧凑，缓存友好
缺点：添加/删除组件需要移动实体

16K 实体，假设 8 个 Archetype，每个 2K 实体
实际使用：2K × 8 × 平均组件大小 = 3-5MB
节省 50% 内存！
```

## 内存池方案

```
- 预分配大块（如 256MB）
- 实现简单的 bump allocator
- Archetype 需要时从池中分配
- 实体销毁时标记空闲，复用

活跃实体管理：
- 维护 active_entities 位图 (在元数据区)
- 只遍历活跃的实体
- 死亡实体 ID 进入空闲列表，复用
```

## 基础配置256MB SAB

16K 并发实体
20+ 种组件类型
4 个并行 Worker

```
0x00000000 - 0x00100000 (1MB)    元数据
  ├─ 0x000000: Entity 活跃位图 (16K bits = 2KB)
  ├─ 0x001000: Archetype 表 (最多 4K archetypes × 256B)
  └─ 0x100000: 帧同步数据

0x00100000 - 0x00400000 (3MB)    输入/同步
  ├─ 输入环形缓冲
  └─ Worker 任务队列

0x00400000 - 0x0C000000 (184MB)  组件数据（SoA）
  ├─ Archetype 1 data
  ├─ Archetype 2 data
  └─ ... 按需分配

0x0C000000 - 0x0E000000 (32MB)   渲染输出
  ├─ Transform 矩阵
  └─ 可见实体列表

0x0E000000 - 0x10000000 (32MB)   临时区
  ├─ 空间哈希表
  ├─ 碰撞对列表
  └─ 排序缓冲
```


```javascript
const MEMORY_CONFIG = {
  SAB_SIZE: 256 * 1024 * 1024,
  MAX_ENTITIES: 16384,
  
  METADATA_SIZE:   1 * 1024 * 1024,   // 1MB
  INPUT_SIZE:      3 * 1024 * 1024,   // 3MB  
  COMPONENT_SIZE:  200 * 1024 * 1024, // 200MB (核心)
  RENDER_SIZE:     32 * 1024 * 1024,  // 32MB
  TEMP_SIZE:       20 * 1024 * 1024,  // 20MB
};

const COMPONENT_MEMORY_PLAN = {
  // 稀疏数组组件（常用，>50%实体拥有）
  sparse_components: {
    Position:  { max: 16384, size: 16, total: '256KB' },
    Velocity:  { max: 16384, size: 16, total: '256KB' },
    Transform: { max: 16384, size: 64, total: '1MB' },
    Sprite:    { max: 16384, size: 32, total: '512KB' },
  },
  
  // 固定 SparseSet（中等，20-50%）
  sparse_set_components: {
    Health:   { max: 8192, size: 16, total: '128KB' },
    Collider: { max: 8192, size: 32, total: '256KB' },
  },
  
  // 哈希表（稀有，<20%，放 GC 堆）
  hash_components: {
    AIState:   'GC heap',
    Inventory: 'GC heap',
  }
};

// 总计：约 2.5MB（核心组件数据）
// 剩余 253MB 可用于更多组件或更大容量

// ❌ 浪费方案：所有组件都支持 16K
Position:  16K slots × 16B = 256KB
Velocity:  16K slots × 16B = 256KB
Sprite:    16K slots × 32B = 512KB
AIState:   16K slots × 64B = 1MB    // 但只有 5% 实体需要！
Inventory: 16K slots × 256B = 4MB   // 但只有 2% 实体需要！

总计：6.2MB，但浪费了 3-4MB

// ✅ 节省方案：按实际使用率分配
const COMPONENT_CAPACITY = {
  // 通用组件 (80%+ 实体)
  Position:  { max: 16384, size: 16 },  // 256KB
  Velocity:  { max: 16384, size: 16 },  // 256KB
  
  // 常见组件 (50-80% 实体)
  Sprite:    { max: 12288, size: 32 },  // 384KB
  Health:    { max: 12288, size: 8  },  // 96KB
  
  // 中等组件 (20-50% 实体)
  Collider:  { max: 8192, size: 32 },   // 256KB
  Animation: { max: 8192, size: 64 },   // 512KB
  
  // 稀有组件 (5-20% 实体)
  AIState:   { max: 2048, size: 64 },   // 128KB
  Weapon:    { max: 4096, size: 128 },  // 512KB
  
  // 超稀有组件 (<5% 实体)
  Inventory: { max: 512, size: 256 },   // 128KB
  Dialogue:  { max: 256, size: 512 },   // 128KB
  BossData:  { max: 16, size: 1024 },   // 16KB
};

总计：2.7MB - 节省了 56%！
```

```js
// ========== SAB 键盘布局 (8 字节) ==========
const KEYBOARD_LAYOUT = {
  base: 0x200,
  
  // Byte 0: 移动键
  movement: 0x200,  // u8
  /*
    bit 0: KeyW
    bit 1: KeyA
    bit 2: KeyS
    bit 3: KeyD
    bit 4: ArrowUp
    bit 5: ArrowDown
    bit 6: ArrowLeft
    bit 7: ArrowRight
  */
  
  // Byte 1: 修饰键 + 常用
  modifiers: 0x201,  // u8
  /*
    bit 0: Shift
    bit 1: Ctrl
    bit 2: Alt
    bit 3: Space
    bit 4: Tab
    bit 5: Escape
    bit 6: Enter
    bit 7: Backspace
  */
  
  // Byte 2-3: 数字键
  digits: 0x202,  // u16
  /*
    bit 0-9: Digit1-0 (10 个)
    bit 10-15: 预留
  */
  
  // Byte 4-7: 字母功能键
  actions: 0x204,  // u32
  /*
    bit 0: KeyE (交互)
    bit 1: KeyQ (切换武器)
    bit 2: KeyR (换弹)
    bit 3: KeyF (手电筒)
    bit 4: KeyG (手雷)
    bit 5: KeyC (蹲下)
    bit 6: KeyV (近战)
    bit 7: KeyX (趴下)
    bit 8: KeyZ (特殊)
    bit 9-15: F1-F7
    bit 16-31: 预留/自定义
  */
};

// 总计：8 字节，支持 64 个按键

// ========== FPS 游戏 ==========
必需：WASD, Space, Shift, Ctrl, 鼠标左右键
常用：R(换弹), E(交互), G(手雷), 数字键1-5(切枪)
可选：C(蹲), X(趴), V(近战), F(手电)
总计：~25 个键

// ========== RPG 游戏 ==========
必需：WASD/方向键, Space, Enter, Escape
常用：数字键1-9(技能), Tab(库存), I(信息), M(地图)
可选：字母键(快捷栏), F1-F4(队友)
总计：~35 个键

// ========== 平台跳跃游戏 ==========
必需：方向键/WASD, Space(跳跃), Shift(冲刺)
常用：Z/X(攻击/技能)
可选：Enter(菜单), Escape(暂停)
总计：~12 个键

// ========== 策略游戏 ==========
必需：鼠标, 数字键(编队), Ctrl/Shift(多选/添加)
常用：字母键(快捷键), F1-F5(控制组)
可选：空格(回到基地), Tab(单位面板)
总计：~30 个键
```

## 头部header信息

```ts
interface HeaderInfo {
  /**
   * 记录头部各类数据结构的内部标量、指针(4字节对齐)
   * 默认占用 64KB Bytes[0, 65535]
   */
  layout: {
    /** 公共字段 占用 4KB Bytes */
    global_control: {
      /** 头部layout大小, 占用 4 Bytes[0, 3] */
      capacity: u32;
      /** 应用启动时间(ms) */
      app_st: u64;
      /** 当前帧号, 占用 8 Bytes [4, 11] */
      frame_no: u64;
      /**
       * bitmask 全局bool状态
       * 1 << 0 应用是否正在运行
       */
      flag0: u64;
      flag1: u64;
      flag2: u64;
      flag3: u64;
      /** 支持的最多实体数量 */
      max_entities: u32;
      /** 支持的最多组件数量 */
      max_components: u32;
      /** 当前逻辑帧率Hz */
      logic_rate: f32;
      /** 当前渲染帧率Hz */
      render_rate: f32;
    }

    /** 输入区指针, 占用 */
    inputs: {
      /**
       * 当前逻辑帧Keyboard环形队列label信息, 占用 8 Bytes[4, 11]
       */
      keyboard_buffer: {
        tail: u16;
        head: u16;
        size: u16;
        capacity: u16;
      };
      /**
       * 上一逻辑帧Kyboard环形队列按bit对应按键是否按下, 占用 16 Bytes[12, 27]
       */
      last_keyboard: {
        bitmask: [u64, u64];
      };
      /**
       * 当前逻辑帧鼠标移动label信息, 占用 4 Bytes [28, 31]
       */
      mouse_move: {
        /** 当前帧鼠标移动事件触发次数, 范围0~4次 */
        size: u32;
      };
      /**
       * 当前逻辑帧手指移动label信息, 占用 4 Bytes [32, 35]
       */
      touch_move: {
        /** 当前帧手指移动事件触发次数, 范围0~4次 */
        size: u16;
        /** 
         * 内存布局表达事件对应触点个数
         * 0000_0000_0000_0000
         */
        count: u16;
      };
  
      /**
       * 当前逻辑帧Mouse环形队列label信息, 占用 8 Bytes [36, 43]
       */
      mouse_buffer: {
        tail: u16;
        head: u16;
        size: u16;
        capacity: u16;
      };
    }
  };

  // 当前逻辑帧Keyboard环形队列；最大64项 占用 512 Bytes [4096, 4607]
  keyboard_buffer: [{ timestamp: Float; code: u16; typ: u16; }; 64];

  /** 
   * 当前逻辑帧鼠标移动事件, 占用 32 Bytes [4608, 4639]
   */
  mouse_move_buffer: [{ x: f32, y: f32 }; 4];

  // 当前逻辑帧手指移动事件, 占用 256 Bytes [4640, 4895]
  touch_move_buffer: [{
    /** 至多支持4个触点, 每个触点占用 16 Bytes, 共占用 64 Bytes */
    touches: [{
      /** 触摸点唯一标识 */
      identifier: u32;
      /** 触点半径 */
      radius: f32
      /** 水平方向位置 */
      x: f32;
      /** 垂直方向位置 */
      y: f32;
    }; 4]
  }; 4]

  /**
   * 当前逻辑帧鼠标点击事件, 最大16项 占用 128 Bytes [4896, 5023]
   */
  mouse_buffer: [{ timestamp: f32, buttons: u32 }; 16]
}
```
