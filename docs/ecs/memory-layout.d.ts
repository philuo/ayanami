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

  /**
   * offset: 0x004C, length: 4 Bytes 
   * 当前主线程正在写的InputEventQueue, 此时WASM读另一个InputEventQueue
   * 编号0或1, 默认首次使用0
   */
  input_event_queue_no: u32;



  // reserved 0x0050 ~ 0x03FF 944 Bytes
}

/** 
 * offset: 0x0400, length: 8192 Bytes
 * - 线程插槽 (suggest 64 slots layout)
 * - (32 slots & slot per 256 Bytes) 
 * - (64 slots & slot per 128 Bytes) 
 * - (128 slots & slot per 64 Bytes) 
 * - (256 slots & slot per 32 Bytes) 
 */
interface ThreadSlots { }


/**
 * offset: 0x2400, length: 8192
 * 数据表元数据, 存放着所有“数据指针”
 */
interface TableMeta { }


interface RingBufferMeta<T = u16> {
  tail: T;
  head: T;
  size: T;
  capacity: T;
}

/** 
 * offset: 0x4400, length: 16384 \
 * 事件容器数据, 存放着所有“容器指针”，DataArea中有与之对应实际数据
 */
interface EventMeta {
  /**
   * offset: 0x4400, length: 8 Bytes
   * Keyboard按键按下事件环形队列meta信息, 占用 8 Bytes
   */
  keydown_buffer: RingBufferMeta;
  /**
   * offset: 0x4408, length: 8 Bytes
   * Keyboard按键弹起事件环形队列meta信息, 占用 8 Bytes
   */
  keyup_buffer: RingBufferMeta;

  /**
   * offset: 0x4410, length: 8 Bytes
   * Mouse按键按下事件环形队列meta信息, 占用 8 Bytes
   */
  mousedown_buffer: RingBufferMeta;
  /**
   * offset: 0x4418, length: 8 Bytes
   * Mouse按键弹起事件环形队列meta信息, 占用 8 Bytes
   */
  mouseup_buffer: RingBufferMeta;

  /**
   * offset: 0x4420, length: 8 Bytes
   * Mouse移动label信息, 占用 4 Bytes
   */
  mousemove_buffer: RingBufferMeta;

  /**
   * offset: 0x4428, length: 8 Bytes
   * Touch开始事件环形队列meta信息, 占用 8 Bytes
   */
  touchstart_buffer: RingBufferMeta;

  /**
   * offset: 0x4430, length: 8 Bytes
   * 注意: 超过触点个数后，touchcancel事件在ios safari上稳定触发强制移除所有触点 \
   * 当touchcancel发生时，主线程写入全部当前触点的end事件
   */
  touchend_buffer: RingBufferMeta;

  /**
   * offset: 0x4438, length: 8 Bytes
   * Touch移动label信息, 占用 8 Bytes
   */
  touchmove_buffer: RingBufferMeta;

  /**
   * offset: 0x4440, length: 8 Bytes
   * Wheel滚动事件环形队列meta信息, 占用 8 Bytes
   */
  wheel_buffer: RingBufferMeta;

  // /**
  //  * TODO: 上一逻辑帧Kyboard环形队列按bit对应按键是否按下, 改为内置组件实现 占用 16 Bytes
  //  */
  // last_keyboard: {
  //   bitmask: [u64, u64];
  // };
}

/**
 * offset: 0x8400, length: 7168 Bytes
 * 性能遥测
 */
interface Telemetry { }

/**
 * offset: 0xA000, length: 24576 Bytes
 * 未来扩展区
 */
interface Extension { }

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

  /** 事件容器元数据 */
  event_meta: EventMeta;

  /** 性能遥测 */
  telemetry: Telemetry;

  /** 未来扩展区 */
  extension: Extension;
}


/** 
 * length: 512 Bytes
 * 输入区指针, 需使用双缓冲交换不中断接收输入事件
 */
interface InputEventQueue {
  /** 8 Bytes */
  keydown_buffer: Array<{ timestamp: f32; code: u16; typ: u16; }>;
  /** 8 Bytes */
  keyup_buffer: Array<{ timestamp: f32; code: u16; typ: u16; }>;
  /** 16 Bytes */
  mousedown_buffer: Array<{
    timestamp: f32;
    button: u32;
    buttons: u16;
    modifiers: u16;
    _padding: u32;
  }>;
  /** 16 Bytes */
  mouseup_buffer: Array<{
    timestamp: f32;
    button: u32;
    buttons: u16;
    modifiers: u16;
    _padding: u32;
  }>;
  /** 32 Bytes */
  mousemove_buffer: Array<{
    timestamp: f32;
    x: f32;   // clientX
    y: f32;   // clientY
    dx: i32;  // movementX
    dy: i32;  // movementY
    buttons: u16; // 鼠标按钮状态
    modifiers: u16; // Shift/Ctrl/Command/Alt 状态
    _padding: u64;
  }>;

  /** 32 Bytes */
  touchstart_buffer: Array<{
    timestamp: f32;
    identifier: u32;  // 0~n 手指标识符
    x: f32;   // clientX
    y: f32;   // clientY
    dx: i32;  // movementX
    dy: i32;  // movementY
    buttons: u16; // 鼠标按钮状态
    modifiers: u16; // Shift/Ctrl/Command/Alt 状态
    _padding: u32;
  }>;

  /** 32 Bytes */
  touchend_buffer: Array<{
    timestamp: f32;
    identifier: u32;  // 0~n 手指标识符
    x: f32;   // clientX
    y: f32;   // clientY
    dx: i32;  // movementX
    dy: i32;  // movementY
    buttons: u16; // 鼠标按钮状态
    modifiers: u16; // Shift/Ctrl/Command/Alt 状态
    _padding: u32;
  }>;

  /** 32 Bytes */
  touchmove_buffer: Array<{
    timestamp: f32;
    identifier: u32;  // 0~n 手指标识符
    x: f32;   // clientX
    y: f32;   // clientY
    dx: i32;  // movementX
    dy: i32;  // movementY
    buttons: u16; // 鼠标按钮状态
    modifiers: u16; // Shift/Ctrl/Command/Alt 状态
    _padding: u32;
  }>;

  /** 32 Bytes */
  wheel_buffer: Array<{
    timestamp: f32;
    identifier: u32;  // 0~n 手指标识符
    x: f32;   // clientX
    y: f32;   // clientY
    dx: i32;  // deltaX
    dy: i32;  // deltaY
    buttons: u16; // 鼠标按钮状态
    modifiers: u16; // Shift/Ctrl/Command/Alt 状态
    _padding: u32;
  }>;
}

/** 
 * offset: 0x10000, length: 1MB+
 */
interface DataArea {
  /**
   * offset: 0x10000, length: 512 Bytes
   * 输入事件队列0, 默认首次使用此队列, 取决于
   */
  input_event_queue_0: InputEventQueue;
  /**
   * offset: 0x10200, length: 512 Bytes
   * 输入事件队列1
   */
  input_event_queue_1: InputEventQueue;
}


/** Byte */
type u8 = number;

/** UInt16 */
type u16 = number;

/** Int16 */
type i16 = number;

/** UInt */
type u32 = number;

/** Int */
type i32 = number;

/** Int64 */
type i64 = number;

/** UInt64 */
type u64 = number;

/** Float */
type f32 = number;

/** Double */
type f64 = number;
