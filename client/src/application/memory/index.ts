/**
 * @file WASM线性内存管理器
 */

import configs from '@/configs';

export const memory = new WebAssembly.Memory({
  initial: configs.ecs.memory_size,
  maximum: configs.ecs.memory_size,
  shared: true
});
