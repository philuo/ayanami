import configs from '@/configs';
import { memory } from '@/application/memory';
import inputs from '@/application/inputs';
import { render } from '@/application/render';

/** 游戏是否正在looping */
let is_running = false;

/** 游戏正在运行的帧id */
let loop_id = 0;

const LOGIC_STEP = configs.game.logic_frame_step;
let acc = 0;
let last_dt = 0;

/** 游戏looping函数 */
function game_loop(timestamp) {
  if (!is_running) return;

  acc += timestamp - last_dt;
  last_dt = timestamp;
  let need_logic_frame = acc >= LOGIC_STEP;

  // 逻辑帧开始，停止捕获
  if (need_logic_frame) {
    inputs.discard();
  }

  while (acc >= LOGIC_STEP) {
    (exports as __ECS_GLUE__).game_loop(timestamp);
    acc -= LOGIC_STEP;
  }

  // 同步渲染帧
  render();

  // 帧结束，允许捕获
  if (need_logic_frame) {
    inputs.capture();
  }

  // next tick
  loop_id = requestAnimationFrame(game_loop);
}

/** wasm初始化对象 */
const importObject = {
  env: {
    memory, 
    log: console.log.bind(console),
    get_realtime_delta: performance.now.bind(performance),
    app_start: () => {
      loop_id = requestAnimationFrame(game_loop);
      is_running = true;
      last_dt = performance.now();
      inputs.recover();
      return last_dt;
    },
    app_stop: () => {
      cancelAnimationFrame(loop_id);
      loop_id = 0;
      is_running = false;
      inputs.discard(true);
    }
  }
};

/** wasm特性 */
const useFeature = {
  builtins: ["js-string"],
  importedStringConstants: "_"
};

export const { instance: { exports } } = await WebAssembly.instantiateStreaming(
  fetch(configs.ecs.path),
  importObject,
  // useFeature
) as unknown as { instance: { exports: ECS } };
