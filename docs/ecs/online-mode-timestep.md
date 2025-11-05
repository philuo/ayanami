# 网游模式下的时间步长策略

## 🚨 核心问题

**自适应步长在单机游戏中完美，但在网络游戏中会导致严重的同步问题！**

## 问题详解

### 1. 客户端步长不一致

```typescript
// 同一场游戏中的三个玩家
玩家A (RTX 4090 + 240Hz):   62.5Hz (16ms) ⚡
玩家B (普通笔记本 + 60Hz):  50Hz (20ms)   ✅
玩家C (低端设备):           40Hz (25ms)   🐌

问题：
- 同样的操作，执行次数不同
- 玩家A 每秒处理 62.5 次输入
- 玩家C 每秒只处理 40 次输入
- 56% 的性能差异！这是不公平的
```

### 2. 时间戳同步失败

```typescript
// 服务器发送状态更新：t=100ms, position=(200, 300)

客户端A (62.5Hz, 步长16ms):
  收到时本地时间: t=96ms  (第6帧)
  预测位置: (196, 296)
  误差: 4px ⚠️

客户端C (40Hz, 步长25ms):
  收到时本地时间: t=75ms  (第3帧)
  预测位置: (180, 280)
  误差: 20px ❌❌

// 结果：不同客户端看到的画面不同！
// 在 FPS 游戏中，这是致命的
```

### 3. 输入延迟不公平

```typescript
// FPS 对枪场景
玩家A (62.5Hz):
  t=0ms:   看到敌人
  t=0ms:   按下开火
  t=16ms:  输入发送到服务器 ⚡
  
玩家B (40Hz):
  t=0ms:   看到敌人
  t=0ms:   按下开火
  t=25ms:  输入发送到服务器 🐌
  
// 玩家A 有 9ms 的先发优势
// 在竞技游戏中，这是不可接受的
```

### 4. 回放/录像失效

```typescript
// 录制时的步长序列
帧0-60:   50Hz
帧61-120: 62.5Hz (性能提升)
帧121+:   40Hz (后台任务启动)

// 回放时：
// - 如何重现步长变化？
// - 时间戳对不上，操作会错位
// - 无法做精确的回放验证
// - 反作弊系统失效 ❌
```

### 5. 延迟补偿失效

```typescript
// 服务器的延迟补偿算法
function compensate_lag(player_input) {
  // 假设固定步长 16.67ms (60Hz)
  const frames_ago = Math.floor(player.ping / 16.67);
  const compensated_state = rewind(frames_ago);
  // ...
}

// 如果客户端步长动态变化：
// - frames_ago 计算错误
// - 补偿到错误的时间点
// - 判断击中/未击中出错 ❌
```

## ✅ 解决方案

### 方案对比

| 方案 | 单机游戏 | 网游 | 优点 | 缺点 |
|------|----------|------|------|------|
| 纯自适应 | ✅ 完美 | ❌ 不可用 | 性能最佳 | 无法同步 |
| 纯固定 | ⚠️ 一般 | ✅ 可用 | 同步准确 | 性能浪费 |
| **混合模式** | ✅ 完美 | ✅ 完美 | 兼得两者 | 稍微复杂 |

### 推荐：混合模式

```typescript
// configs/index.ts
export default {
  game: {
    mode: 'online',  // 👈 切换模式
    
    single: {
      use_adaptive: true,      // 单机：自适应
      fallback_step: 20
    },
    
    online: {
      use_adaptive: false,     // 网游：固定
      fixed_step: 16,          // 匹配服务器 tick rate
      server_tick_rate: 60     // 服务器频率
    }
  }
};
```

## 网游架构设计

### 标准架构：服务器权威

```
服务器 (固定 60Hz)
    ↓ 广播状态 (60次/秒)
客户端A (逻辑 60Hz，渲染 240Hz)
    ↓ 上传输入 (60次/秒)
客户端B (逻辑 60Hz，渲染 60Hz)
    ↓ 上传输入 (60次/秒)
客户端C (逻辑 60Hz，渲染 144Hz)
```

**关键点**：
- ✅ **逻辑步长统一**：所有客户端和服务器都是 60Hz
- ✅ **渲染可变**：客户端渲染可以自适应（仅视觉）
- ✅ **输入频率固定**：每 16.67ms 采样一次输入

### 代码实现

```typescript
// ========== 服务器 ==========
class GameServer {
  private TICK_RATE = 60;
  private TICK_STEP = 1000 / 60; // 16.67ms
  
  start() {
    setInterval(() => {
      this.processInputs();    // 处理所有客户端输入
      this.updatePhysics();    // 固定步长物理模拟
      this.broadcastState();   // 广播权威状态
    }, this.TICK_STEP);
  }
}

// ========== 客户端 ==========
class NetworkedGameClient {
  // 逻辑：固定 60Hz（匹配服务器）
  private LOGIC_STEP = 16.67;
  private logic_acc = 0;
  
  // 渲染：自适应（仅视觉）
  private render_adaptive = new AdaptiveTimestep(true);
  
  update(timestamp: number, dt: number) {
    // 1️⃣ 逻辑更新（固定步长）
    this.logic_acc += dt;
    while (this.logic_acc >= this.LOGIC_STEP) {
      // 固定 60Hz 逻辑
      this.processServerState();   // 应用服务器状态
      this.predictLocalPlayer();   // 客户端预测
      this.sendInputToServer();    // 发送输入（固定频率）
      
      this.logic_acc -= this.LOGIC_STEP;
    }
    
    // 2️⃣ 渲染（自适应高帧率）
    this.render_adaptive.record_raf(dt);
    
    const alpha = this.logic_acc / this.LOGIC_STEP;
    this.renderInterpolated(alpha); // 插值渲染（240Hz）
  }
}
```

## 不同游戏类型的策略

### 竞技类（FPS / MOBA / 格斗）

```typescript
mode: 'online',
online: {
  use_adaptive: false,         // ❌ 禁用自适应
  fixed_step: 16.67,          // ✅ 严格固定（60Hz）
  client_prediction: true,     // ✅ 客户端预测
  server_reconciliation: true, // ✅ 服务器校正
  interpolation: true          // ✅ 渲染插值
}

// 要求：
// - 绝对公平
// - 精确同步
// - 可回放验证
```

### 合作类（PvE / 协作）

```typescript
mode: 'online',
online: {
  use_adaptive: false,        // ❌ 禁用自适应
  fixed_step: 20,            // ⚠️ 可以稍宽松（50Hz）
  client_prediction: true,    // ✅ 客户端预测
  interpolation: true         // ✅ 渲染插值
}

// 特点：
// - 不需要绝对公平
// - 可容忍轻微不同步
// - 更注重流畅度
```

### 休闲/社交类（MMO / 建造）

```typescript
mode: 'online',
online: {
  use_adaptive: false,     // ❌ 逻辑仍然固定
  fixed_step: 33,         // ⚠️ 可以更低（30Hz）
  loose_sync: true         // ✅ 宽松同步
}

// 特点：
// - 对同步要求低
// - 更注重视觉体验
// - 可以有更大延迟
```

### 单机/本地多人

```typescript
mode: 'single',
single: {
  use_adaptive: true,      // ✅ 充分利用自适应
  fallback_step: 20
}

// 特点：
// - 无同步问题
// - 充分利用硬件
// - 最佳体验
```

## 实际案例

### CS:GO / Valorant

```typescript
服务器: 128Hz (7.8ms)
客户端逻辑: 128Hz (固定)
客户端渲染: 300Hz+ (自适应)

输入采样: 1000Hz (鼠标)
输入发送: 128Hz (匹配服务器)
```

### Overwatch

```typescript
服务器: 63Hz (15.87ms)
客户端逻辑: 63Hz (固定)
客户端渲染: 60-300Hz (自适应)

延迟补偿: Favor the Shooter
客户端预测: 激进
```

### Minecraft (Multiplayer)

```typescript
服务器: 20Hz (50ms) ⚠️ 很低！
客户端逻辑: 20Hz (固定)
客户端渲染: 60-144Hz (自适应)

特点: 对同步要求低，可以接受延迟
```

### League of Legends

```typescript
服务器: 30Hz (33.3ms)
客户端逻辑: 30Hz (固定)
客户端渲染: 60-240Hz (自适应)

特点: MOBA 对同步要求较 FPS 低
```

## 实现 Checklist

### ✅ 已完成

- [x] 配置系统支持 `single` / `online` 模式
- [x] 自动根据模式选择时间步长策略
- [x] 固定步长管理器实现
- [x] 调试接口统一

### 🔲 待实现（网游完整功能）

- [ ] 客户端预测（Client-Side Prediction）
- [ ] 服务器校正（Server Reconciliation）
- [ ] 延迟补偿（Lag Compensation）
- [ ] 输入缓冲（Input Buffer）
- [ ] 网络插值（Network Interpolation）

## 切换模式

### 开发阶段（单机测试）

```typescript
// configs/index.ts
game: {
  mode: 'single',  // 👈 单机模式
  single: {
    use_adaptive: true  // 启用自适应
  }
}

// 控制台输出：
// 🎮 单机模式：启用自适应步长
```

### 上线阶段（网游）

```typescript
// configs/index.ts
game: {
  mode: 'online',  // 👈 网游模式
  online: {
    use_adaptive: false,
    fixed_step: 16,         // 匹配你的服务器
    server_tick_rate: 60
  }
}

// 控制台输出：
// 🌐 网游模式：固定步长 16ms (60.0Hz)
```

## 常见问题

### Q: 为什么不能在网游中使用自适应？

A: 三个核心原因：
1. **同步要求**：所有客户端必须在相同时间点看到相同状态
2. **公平性**：高端设备不能有更新频率优势
3. **可验证性**：服务器需要能回放和验证操作

### Q: 渲染能自适应吗？

A: **能！** 这是正确做法：
```
逻辑: 固定 60Hz （保证同步）
渲染: 自适应 240Hz （视觉流畅）
```

### Q: 如何测试网游模式？

A: 本地测试流程：
```bash
# 1. 启动本地服务器（固定 60Hz）
node server.js

# 2. 修改配置为 online 模式
# configs/index.ts: mode: 'online'

# 3. 启动多个客户端
# 观察控制台：应该都显示固定步长

# 4. 验证同步
# 所有客户端应该在相同帧号看到相同状态
```

### Q: 能否运行时切换模式？

A: 可以，但需要重新初始化：
```typescript
// 不推荐运行时切换，会导致状态不一致
// 如果必须切换：
async function switchMode(new_mode: 'single' | 'online') {
  await stop_game();
  configs.game.mode = new_mode;
  await restart_game();
}
```

### Q: 服务器 tick rate 选多少？

A: 推荐配置：
```
竞技 FPS:  128Hz (专业) / 60Hz (标准)
MOBA:      30Hz
MMO:       20Hz
休闲游戏:  30Hz
```

## 总结

### ✅ 单机模式

```typescript
mode: 'single'
use_adaptive: true

优点:
- 充分利用硬件
- 高刷显示器体验好
- 应对 rAF 波动
- 自动降级保护
```

### ✅ 网游模式

```typescript
mode: 'online'
use_adaptive: false
fixed_step: 16 (匹配服务器)

优点:
- 保证同步
- 竞技公平
- 可验证回放
- 延迟补偿准确
```

### 🎯 最佳实践

**逻辑固定 + 渲染自适应 = 完美方案**

```typescript
逻辑: 60Hz 固定（同步）
渲染: 240Hz 自适应（流畅）

结果:
✅ 完美同步
✅ 竞技公平
✅ 视觉流畅
✅ 充分利用硬件
```

---

**记住：网游永远不要在逻辑层使用自适应步长！** 🚨

