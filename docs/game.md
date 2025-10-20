# 经典2d横版超级马里奥

## 经典马里奥的移动特性分析

马里奥的移动系统有以下核心特点：

1. 加速式移动（不是瞬间达到最大速度）
2. 变高度跳跃（按键时长影响跳跃高度）
3. 空中控制（空中可以左右移动但控制力较弱）
4. 冲刺奔跑（长按方向键加速，可以跳得更远）
5. 惯性滑行（松开方向键后有减速过程）
6. 土狼时间（离开平台后短时间内仍可跳跃）
7. 跳跃缓冲（提前按跳跃键会在落地瞬间起跳）


```moonbit
/// 组件：输入控制（马里奥风格）
pub struct InputController {
  // ===== 移动参数 =====
  move_acceleration: Float      // 地面加速度 (如 1500.0)
  move_deceleration: Float      // 地面减速度 (如 2000.0)
  air_acceleration: Float       // 空中加速度 (如 800.0，比地面小)
  air_deceleration: Float       // 空中减速度 (如 1000.0)
  
  max_walk_speed: Float         // 最大行走速度 (如 200.0)
  max_run_speed: Float          // 最大奔跑速度 (如 350.0，按住冲刺键)
  
  // ===== 跳跃参数 =====
  jump_force: Float             // 初始跳跃力 (如 600.0)
  jump_hold_force: Float        // 持续按住跳跃键的额外力 (如 300.0)
  jump_hold_duration: Float     // 可以持续施加力的最大时间 (如 0.2秒)
  
  short_jump_multiplier: Float  // 短跳倍率 (如 0.5，松开跳跃键时减速)
  fall_multiplier: Float        // 下落重力倍率 (如 1.5，下落比上升快)
  
  max_jump_count: Int           // 最大跳跃次数 (1=单跳, 2=二段跳)
  coyote_time: Float            // 土狼时间 (如 0.1秒)
  jump_buffer_time: Float       // 跳跃缓冲时间 (如 0.1秒)
  
  // ===== 状态 =====
  is_grounded: Bool             // 是否在地面
  is_jumping: Bool              // 是否正在跳跃上升阶段
  is_falling: Bool              // 是否正在下落
  is_running: Bool              // 是否在奔跑（冲刺状态）
  
  facing_right: Bool            // 朝向（true=右，false=左）
  
  jump_count: Int               // 当前跳跃次数
  time_since_grounded: Float    // 离开地面后的时间（用于土狼时间）
  jump_hold_time: Float         // 当前跳跃已持续的时间
  jump_buffer_timer: Float      // 跳跃缓冲计时器
  
  // ===== 控制标志 =====
  controllable: Bool            // 是否可控（被击中时可能失控）
  input_enabled: Bool           // 是否启用输入（过场动画时禁用）
}

/// 组件：输入状态（存储当前帧的输入）
pub struct InputState {
  move_x: Float          // 移动输入 (-1.0 左, 0.0 无, 1.0 右)
  jump_pressed: Bool     // 跳跃键是否按下
  jump_held: Bool        // 跳跃键是否持续按住
  jump_released: Bool    // 跳跃键是否松开
  run_held: Bool         // 冲刺/奔跑键是否按住
}

/// 组件：地面检测器
pub struct GroundDetector {
  check_distance: Float    // 检测距离 (如 0.1，从碰撞体底部向下检测)
  check_width: Float       // 检测宽度 (如碰撞体宽度的 0.8，避免边缘误判)
  check_offset_y: Float    // 检测Y偏移 (相对于碰撞体底部)
  
  ground_layer_mask: UInt  // 地面层级遮罩（用于过滤哪些层算作地面）
}
```

## 创建马里奥角色

```moonbit
// 创建马里奥实体的示例
fn create_mario() -> Entity {
  let mario = Entity(0) // 假设实体ID为0
  
  // 位置
  let position = Position { x: 100.0, y: 100.0 }
  
  // 速度
  let velocity = Velocity { x: 0.0, y: 0.0 }
  
  // 碰撞体（马里奥大约 16x32 像素）
  let collider = BoxCollider {
    width: 16.0,
    height: 32.0,
    offset_x: 0.0,
    offset_y: 0.0,
    is_trigger: false
  }
  
  // 刚体
  let rigidbody = Rigidbody {
    mass: 1.0,
    gravity_scale: 1.0,
    drag: 0.0,
    angular_drag: 0.0,
    is_kinematic: false,
    is_fixed_rotation: true  // 马里奥不旋转
  }
  
  // 输入控制器
  let input_controller = InputController {
    // 移动参数
    move_acceleration: 1500.0,
    move_deceleration: 2000.0,
    air_acceleration: 800.0,
    air_deceleration: 1000.0,
    max_walk_speed: 200.0,
    max_run_speed: 350.0,
    
    // 跳跃参数
    jump_force: 600.0,
    jump_hold_force: 300.0,
    jump_hold_duration: 0.2,
    short_jump_multiplier: 0.5,
    fall_multiplier: 1.5,
    max_jump_count: 1,
    coyote_time: 0.1,
    jump_buffer_time: 0.1,
    
    // 初始状态
    is_grounded: false,
    is_jumping: false,
    is_falling: false,
    is_running: false,
    facing_right: true,
    jump_count: 0,
    time_since_grounded: 0.0,
    jump_hold_time: 0.0,
    jump_buffer_timer: 0.0,
    
    // 控制
    controllable: true,
    input_enabled: true
  }
  
  // 地面检测器
  let ground_detector = GroundDetector {
    check_distance: 0.1,
    check_width: 12.0,  // 比碰撞体稍窄
    check_offset_y: 0.0,
    ground_layer_mask: 0b0001  // 只检测第0层
  }
  
  // 输入状态
  let input_state = InputState {
    move_x: 0.0,
    jump_pressed: false,
    jump_held: false,
    jump_released: false,
    run_held: false
  }
  
  // 在实际ECS中，这些组件会被添加到实体
  mario
}
```
