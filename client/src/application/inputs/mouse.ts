/**
 * @file 鼠标输入管理器
 */

import { memory } from '@/application/memory';

class MouseMoveBuffer {
  view: DataView;
  capacity: number;
  capture: boolean;

  /**
   * [4608, 4639] 4 * 8
   */
  constructor(buffer) {
    this.view = new DataView(buffer);
    this.capacity = 4;
    this.capture = false;
  }

  // TODO
  reset() {}

  get size(): number {
    return this.view.getUint32(28, true);
  }

  push(x, y) {
    if (!this.capture) return;

    const size = this.view.getUint32(28, true);
    const index = Math.min(size, this.capacity - 1);
    let offset = 4608 + index * 8;
    this.view.setFloat32(offset, x, true);
    this.view.setFloat32(offset + 4, y, true);

    if (size < this.capacity) {
      this.view.setUint32(28, size + 1, true);
    }
  }

  pop() {
    const size = this.view.getUint32(28, true);

    if (size === 0) {
      return null;
    }

    this.view.setUint32(28, size - 1, true);
    const offset = 4608 + (size - 1) * 8;

    return {
      x: this.view.getFloat32(offset, true),
      y: this.view.getFloat32(offset + 4, true)
    };
  }

  each(fn) {
    const size = this.view.getUint32(28, true);

    for (let i = 0; i < size; ++i) {
      const offset = 4608 + i * 8;

      fn({
        x: this.view.getFloat32(offset, true),
        y: this.view.getFloat32(offset + 4, true)
      });
    }
  }

  clear() {
    this.view.setUint32(28, 0, true);
  }
}

/** 鼠标输入采集器 */
export const mouse_move_buffer = new MouseMoveBuffer(memory.buffer);


///| 鼠标输入事件监听器
window.addEventListener('mousemove', event => {
  mouse_move_buffer.push(event.clientX, event.clientY);
});
window.addEventListener('mousedown', event => {
  // console.log(event)
});

window.addEventListener('mouseup', event => {
  // console.log(event)
});

window.addEventListener('wheel', event => {
  console.log(event)
}, { capture: true, passive: true });
