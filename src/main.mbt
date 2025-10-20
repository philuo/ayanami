pub struct Entity(UInt)

/// 组件：2d置
pub struct Position {
  x : Float // 水平方向位置(像素)
  y : Float // 垂直方向位置(像素)
}

/// 组件：2d速度
pub struct Velocity {
  x: Float  // 水平方向速度(像素/秒)
  y: Float  // 垂直方向速度(像素/秒)
}

/// 组件：2d加速度
pub struct Acceleration {
  x: Float  // 水平方向加速度(像素/秒^2)
  y: Float  // 垂直方向加速度(像素/秒^2)
}

/// 组件：2d变换
pub struct Transform {
  rotation: Float  // 旋转角度(-360-0-360)
  scale_x: Float   // 水平方向缩放
  scale_y: Float   // 垂直方向缩放
}

/// 组件：2d纹理
pub struct Sprite {
  texture_id: UInt  // 纹理ID
  width: Float      // 纹理宽度(px)
  height: Float     // 纹理高度(px)
  layer: UInt16     // 纹理层级(0-65535)
  opacity: Byte     // 透明度(0-255)
  visible: Bool     // 是否可见
  flipY: Bool       // 是否翻转Y轴
}

/// 组件：动画
pub struct Animation {
  frames: Array[UInt]   // 序列帧(纹理ID列表)
  frame_duration: Float // 每帧持续时间(秒)
  current_frame: Int    // 当前帧索引
  elapsed_time: Float   // 累计已播放时长
  is_loop: Bool         // 是否循环播放
  is_playing: Bool      // 是否正在播放
}

/// 组件：矩形碰撞体
pub struct BoxCollider {
  width: Float      // 宽度(px)
  height: Float     // 高度(px)
  offset_x: Float   // 相对于Position的偏移位置X
  offset_y: Float   // 相对于Position的偏移位置Y
  is_trigger: Bool  // 是否为触发器(不产生物理响应)
}

/// 组件：圆形碰撞体
pub struct CircleCollider {
  radius: Float     // 半径(px)
  offset_x: Float   // 相对于Position的偏移位置X
  offset_y: Float   // 相对于Position的偏移位置Y
  is_trigger: Bool  // 是否为触发器(不产生物理响应)
}

/// 组件：刚体物理
pub struct Rigidbody {
  mass: Float              // 质量(kg)
  gravity_scale: Float     // 重力缩放系数
  drag: Float              // 阻力系数
  angular_drag: Float      // 角速度阻力
  is_kinematic: Bool       // 是否为静态刚体
  is_fixed_rotation: Bool  // 是否固定旋转
}

/// 组件：生命值
pub struct Health {
  current: Float           // 当前生命值
  max: Float               // 最大生命值
  invincible: Bool         // 是否无敌
  invincible_time: Float   // 无敌时间(秒)
}

/// 组件：输入控制
pub struct InputHandler {
  move_speed: Float
  jump_force: Float
  controllable: Bool
}
