# 时间步长决策指南

## 快速决策

```
你的游戏是什么类型？

├─ 单机游戏 / 本地多人
│  └─ ✅ 使用自适应步长
│     配置: mode: 'single', use_adaptive: true
│     文档: adaptive-quickstart.md
│
└─ 网络游戏
   │
   ├─ 竞技类（FPS/MOBA/格斗）
   │  └─ ✅ 固定步长（严格）
   │     配置: mode: 'online', fixed_step: 16
   │     文档: online-mode-timestep.md
   │
   ├─ 合作类（PvE/协作）
   │  └─ ✅ 固定步长（标准）
   │     配置: mode: 'online', fixed_step: 20
   │     文档: online-mode-timestep.md
   │
   └─ 休闲/社交类（MMO/建造）
      └─ ✅ 固定步长（宽松）
         配置: mode: 'online', fixed_step: 33
         文档: online-mode-timestep.md
```

## 配置示例

### 单机游戏（推荐）

```typescript
// client/src/configs/index.ts
export default {
  game: {
    mode: 'single',
    
    single: {
      use_adaptive: true,    // ✅ 自适应
      fallback_step: 20
    }
  }
};

// 效果：
// - 高端设备：自动 62.5Hz
// - 普通设备：保持 50Hz
// - 低端设备：自动降到 40Hz/30Hz
// - 最佳体验 ✨
```

### 竞技网游（严格同步）

```typescript
// client/src/configs/index.ts
export default {
  game: {
    mode: 'online',
    
    online: {
      use_adaptive: false,     // ❌ 禁用自适应
      fixed_step: 16,          // 60Hz，匹配服务器
      server_tick_rate: 60
    }
  }
};

// 效果：
// - 所有客户端：固定 60Hz
// - 保证同步 ✅
// - 竞技公平 ✅
// - 可回放验证 ✅
```

### 休闲网游（宽松同步）

```typescript
// client/src/configs/index.ts
export default {
  game: {
    mode: 'online',
    
    online: {
      use_adaptive: false,
      fixed_step: 33,          // 30Hz
      server_tick_rate: 30
    }
  }
};

// 效果：
// - 降低服务器压力
// - 节省带宽
// - 适合休闲游戏
```

## 详细对比

### 单机模式 vs 网游模式

| 特性 | 单机模式 | 网游模式 |
|------|----------|----------|
| **逻辑步长** | 自适应 30-62.5Hz | 固定（匹配服务器） |
| **渲染步长** | 自适应 | 自适应（仅视觉） |
| **同步要求** | 无 | 严格 |
| **公平性** | 不相关 | 关键 |
| **性能利用** | 最大化 | 标准化 |
| **适用场景** | 单人/本地 | 多人在线 |

### 自适应 vs 固定

| 指标 | 自适应步长 | 固定步长 |
|------|-----------|----------|
| **性能利用** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **稳定性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **同步能力** | ❌ 不可用 | ⭐⭐⭐⭐⭐ |
| **公平性** | ❌ 不公平 | ⭐⭐⭐⭐⭐ |
| **适配性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **复杂度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 性能对比

### 场景1: 高端 PC (RTX 4090, 240Hz)

```
单机模式:
  逻辑: 自动升到 62.5Hz ✨
  渲染: 240Hz
  体验: ⭐⭐⭐⭐⭐ 完美

网游模式:
  逻辑: 固定 60Hz
  渲染: 240Hz
  体验: ⭐⭐⭐⭐ 优秀

差异: 单机稍好（62.5Hz vs 60Hz）
```

### 场景2: 普通笔记本 (60Hz)

```
单机模式:
  逻辑: 保持 50Hz
  渲染: 60Hz
  体验: ⭐⭐⭐⭐ 优秀

网游模式:
  逻辑: 固定 60Hz
  渲染: 60Hz
  体验: ⭐⭐⭐⭐ 优秀

差异: 几乎无差异
```

### 场景3: 低端设备

```
单机模式:
  逻辑: 自动降到 40Hz ⬇️
  渲染: 60Hz
  体验: ⭐⭐⭐ 可接受

网游模式:
  逻辑: 固定 60Hz
  渲染: 可能掉帧
  体验: ⭐⭐ 可能卡顿

差异: 单机更好（自适应降级）
```

## 常见问题

### Q1: 我能在网游中使用自适应吗？

**A: 不行！** 原因：

1. **同步问题**：不同客户端步长不同，无法同步
2. **公平性**：高端设备有更新频率优势
3. **回放失败**：步长动态变化，无法精确复现

详见：[网游模式文档](./online-mode-timestep.md)

### Q2: 网游的渲染能自适应吗？

**A: 能！** 而且应该这样做：

```typescript
逻辑: 固定 60Hz （保证同步）
渲染: 自适应 240Hz （视觉流畅）
```

这是现代网游的标准做法。

### Q3: 如何在开发时测试？

**A: 分阶段测试**

```bash
# 阶段1: 单机开发
mode: 'single', use_adaptive: true
# 测试游戏逻辑、AI、玩法

# 阶段2: 本地联机测试
mode: 'online', fixed_step: 16
# 启动本地服务器，测试同步

# 阶段3: 线上测试
mode: 'online', fixed_step: 16
# 连接真实服务器，测试延迟
```

### Q4: 可以运行时切换模式吗？

**A: 不推荐**

切换模式需要重新初始化整个游戏状态。如果必须切换：

```typescript
async function switchMode(newMode: 'single' | 'online') {
  await stopGame();
  config.game.mode = newMode;
  await restartGame();
}
```

### Q5: 服务器 tick rate 如何选择？

**A: 根据游戏类型**

```
竞技 FPS:  60-128Hz
MOBA:      30-60Hz
MMO:       20-30Hz
休闲:      10-30Hz
回合制:    1-10Hz
```

原则：**竞技性越强，tick rate 越高**

### Q6: 单机游戏一定要用自适应吗？

**A: 不是必须，但强烈推荐**

固定步长也可以：

```typescript
mode: 'single',
single: {
  use_adaptive: false,  // 禁用自适应
  fallback_step: 20     // 使用固定 50Hz
}
```

但会失去：
- 高刷设备的更好体验
- 低端设备的自动降级
- rAF 波动的自动应对

### Q7: 自适应的性能开销多大？

**A: 几乎可忽略**

```
监控: < 0.1ms/帧
统计: ~2ms (每 120 帧一次)
内存: ~3KB

总结: 可忽略不计
```

## 决策流程图

```
开始
  ↓
你的游戏类型？
  ↓
├─ 单机游戏
│    ↓
│  设备性能重要吗？
│    ↓
│  ├─ 是 → use_adaptive: true ✅
│  └─ 否 → fixed_step: 20 ⚠️
│
└─ 网络游戏
     ↓
   竞技性强吗？
     ↓
   ├─ 是（FPS/MOBA）
   │    ↓
   │  fixed_step: 16 (60Hz) ✅
   │
   ├─ 中（PvE/协作）
   │    ↓
   │  fixed_step: 20 (50Hz) ✅
   │
   └─ 弱（MMO/休闲）
        ↓
      fixed_step: 33 (30Hz) ✅
```

## 推荐配置速查表

| 游戏类型 | mode | use_adaptive | fixed_step | 说明 |
|----------|------|--------------|------------|------|
| 单机动作 | single | true | - | 自适应最佳 |
| 单机RPG | single | true | - | 自适应最佳 |
| 本地多人 | single | true | - | 自适应最佳 |
| 竞技FPS | online | false | 16 | 严格同步 |
| MOBA | online | false | 16-20 | 标准同步 |
| PvE合作 | online | false | 20 | 标准同步 |
| MMO | online | false | 33 | 宽松同步 |
| 休闲社交 | online | false | 33-50 | 宽松同步 |
| 回合制 | online | false | 100+ | 极宽松 |

## 迁移指南

### 从固定步长迁移到自适应

```typescript
// 之前
const LOGIC_STEP = 16;

// 之后
// 1. 修改配置
game: {
  mode: 'single',
  single: { use_adaptive: true }
}

// 2. 不需要修改代码！
// timestep.get_step() 会自动返回合适的值

// 3. 测试
// 观察控制台输出，看步长如何变化
```

### 从单机迁移到网游

```typescript
// 之前（单机）
game: {
  mode: 'single',
  single: { use_adaptive: true }
}

// 之后（网游）
game: {
  mode: 'online',
  online: {
    use_adaptive: false,
    fixed_step: 16,        // 匹配服务器
    server_tick_rate: 60
  }
}

// 注意事项：
// 1. 需要实现客户端预测
// 2. 需要实现服务器校正
// 3. 需要实现延迟补偿
// 4. 需要实现输入缓冲
```

## 文档索引

- **单机游戏**：[自适应步长快速开始](./adaptive-quickstart.md)
- **网络游戏**：[网游模式时间步长](./online-mode-timestep.md)
- **详细设计**：[自适应步长系统](./adaptive-timestep.md)
- **本文档**：决策指南（你在这里）

## 总结

### 黄金法则

**单机用自适应，网游用固定！**

```typescript
// 单机
mode: 'single'
use_adaptive: true
// 理由：性能最大化，体验最佳

// 网游
mode: 'online'
use_adaptive: false
fixed_step: 16 (匹配服务器)
// 理由：同步准确，竞技公平
```

### 核心原则

1. **单机游戏**：充分利用硬件，自适应最优
2. **网络游戏**：保证同步公平，固定必须
3. **渲染层面**：永远可以自适应（仅视觉）
4. **性能监控**：无论哪种模式都应该监控

需要帮助？查看对应的详细文档！🚀

