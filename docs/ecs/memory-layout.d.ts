interface HeaderInfo {
  /**
   * 记录头部各类数据结构的内部标量、指针(4字节对齐)
   * 默认占用 64KB Bytes[0, 65535]
   */
  layout: {
    /** 公共字段 占用 512 Bytes [0, 511] */
    global_control: {
      /** 魔数, 占用 2 Bytes [0, 1] */
      magic: u16;
      /** 版本号, 占用 2 Bytes [2, 4] */
      version: u16;
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
    };

    /** 线程插槽, 占用 8192 Bytes [512, 8703] */
    thread_slots: {

    };

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
    };
  };

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


/** Unsigned16 bits */
type u16 = number;

/** Usigned32 bits */
type u32 = number;

/** Usigned64 bits */
type u64 = number;

/** Float */
type f32 = number;

/** Double */
type f64 = number;
