/** 
 * offset: 0x0000, length: 1024 Bytes
 * 全局控制
 */
interface GlobalControl {
  /** offset: 0x0000 魔数 0x45435330 'ECS0' in hex */
  magic: u32;
  /** offset: 0x0004 版本号 */
  version: u32;
  /** offset: 0x0008 应用首次启动时间(ms) */
  app_st: u64;
  /** offset: 0x0010  最大实体数量 */
  max_entities: u32;
  /** offset: 0x0014 最大组件数量 */
  max_components: u32;
  /** offset: 0x0018 最大线程数量 */
  max_workers: u32;
  /** offset: 0x001c 已注册的Archetype数量 */
  archetype_count: u32;
  /** offset: 0x0020 已注册的Component数量 (通常只在启动时写) */
  component_type_count: u32;
  /** offset: 0x0024 当前逻辑帧号 */
  frame_no: u64;
  /** offset: 0x002C 当前逻辑帧率Hz */
  logic_frame_rate: f32;
  /** offset: 0x0030 当前渲染帧率Hz */
  render_frame_rate: f32;
  /** offset: 0x0034 当前存活的Worker数量 */
  worker_count: u32;
  /** offset: 0x0038 Worker屏障; Worker完成帧后 Atomics.sub */
  worker_barrier: i32;
  /** offset: 0x003C 下一个实体id */
  next_entity_id: u32;
  /** offset: 0x0040 当前存活的实体总数 */
  entity_count: u32;

  /** 
   * offset: 0x0044
   * bitmask 全局bool状态
   * - 1 << 0 is_running 应用是否正在运行
   * - 1 << 1 world_lock 0=Unlocked, 1=Locked
   */
  flags: u64;

  /** offset: 0x0048 双缓冲状态：渲染器/读取器使用的索引 (0 or 1) */
  read_state_index: u32;
  /** offset: 0x004C 双缓冲状态：模拟器/写入器使用的索引 (0 or 1) */
  write_state_index: u32;

  /** TODO: 输入区指针, 需使用双缓冲交换不中断接收输入事件 */
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
  };

  // reserved 944 Bytes
}

/**
 * offset: 0x2000, length: 8192
 * 数据表元数据
 */
interface TableMeta {}

/** 
 * offset: 0x4000, length: 16384
 * 事件队列元数据
 */
interface EventQueueMeta {
  // 当前逻辑帧Keyboard环形队列；最大64项 占用 512 Bytes [4096, 4607]
  keyboard_buffer: Array<{ timestamp: f32; code: u16; typ: u16; }>;

  /** 
   * 当前逻辑帧鼠标移动事件；最大4项, 占用 32 Bytes [4608, 4639]
   */
  mouse_move_buffer: Array<{ x: f32, y: f32 }>;

  // 当前逻辑帧手指移动事件；最大4项, 占用 256 Bytes [4640, 4895]
  touch_move_buffer: Array<{
    /** 至多支持4个触点, 每个触点占用 16 Bytes, 共占用 64 Bytes */
    touches: Array<{
      /** 触摸点唯一标识 */
      identifier: u32;
      /** 触点半径 */
      radius: f32
      /** 水平方向位置 */
      x: f32;
      /** 垂直方向位置 */
      y: f32;
    }>
  }>

  /**
   * 当前逻辑帧鼠标点击事件；最大16项 占用 128 Bytes [4896, 5023]
   */
  mouse_buffer: Array<{ timestamp: f32, buttons: u32 }>
}

/** 
 * offset: 0x4000, length: 7168 Bytes
 * 线程插槽(28slots 每slot 256 Bytes)
 */
interface ThreadSlots {}

/**
 * offset: 0x8000, length: 8192 Bytes
 * 性能遥测
 */
interface Telemetry {}

/**
 * offset: 0xA000, length: 24576 Bytes
 * 未来扩展区
 */
interface Extension {}

/**
 * offest: 0x0000, length: 64KB
 */
interface HeaderInfo {
  /** 全局控制 */
  global_control: GlobalControl;
  
  /** 线程插槽 */
  thread_slots: ThreadSlots;

  /** 数据表元数据 */
  table_meta: TableMeta;

  /** 事件队列元数据 */
  event_queue_meta: EventQueueMeta;

  /** 性能遥测 */
  telemetry: Telemetry;

  /** 未来扩展区 */
  extension: Extension;
}


/** Unsigned16 bits */
type u16 = number;

/** Usigned32 bits */
type u32 = number;

/** Signed32 bits */
type i32 = number;

/** Usigned64 bits */
type u64 = number;

/** Float */
type f32 = number;

/** Double */
type f64 = number;
