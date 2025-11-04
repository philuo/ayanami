import { keyboard_buffer } from './keyboard';
import { mouse_move_buffer } from './mouse';

/** 应用启动后恢复状态 */
function recover() {
  keyboard_buffer.reset();
  mouse_move_buffer.reset();
}

/** 应用停止/状态转移丢弃事件监听, 默认不清空事件队列 */
function discard(clear = false) {
  if (clear) {
    keyboard_buffer.clear();
    mouse_move_buffer.clear();
  }

  keyboard_buffer.capture = false;
  mouse_move_buffer.capture = false;
}

/** 应用启动 / 逻辑帧完成后, 清空事件队列, 开始事件捕获 */
function capture(clear = true) {
  if (clear) {
    keyboard_buffer.clear();
    mouse_move_buffer.clear();
  }

  keyboard_buffer.capture = true;
  mouse_move_buffer.capture = true;
}

export default {
  recover,
  discard,
  capture,
  keyboard_buffer,
  mouse_move_buffer,
};
