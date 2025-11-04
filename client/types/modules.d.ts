declare module 'virtual:*' {
  const result: any;
  export default result;
}

declare interface ECS extends WebAssembly.Exports {
  /** 启动游戏 */
  game_start: () => void;
  /** 停止游戏 */
  game_stop: () => void;
  /** WASM线性内存 */
  memory: WebAssembly.Memory;
}

declare interface __ECS_GLUE__ extends WebAssembly.Exports {
  /** 逻辑帧 */
  game_loop?: (timestamp: number) => void;
}
