export default {
  ecs: {
    path: 'ecs-gc.wasm',

    /** SAB线性内存大小(每页64KB, 默认1024页 = 64MB) */
    memory_size: 1024
  },

  game: {
    /** 逻辑帧步长(ms) */
    logic_frame_step: 16
  }
};
