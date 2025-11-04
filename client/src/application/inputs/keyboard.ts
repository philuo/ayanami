/**
 * @file 键盘输入管理器
 */
import { memory } from '@/application/memory';

class KeyboardBuffer {
  view: DataView;
  capacity: number;
  offset: number;
  capture: boolean;

  /**
   * 键盘输入事件环形缓冲区 - 基于固定内存布局
   * | Addr          | Byte      | Name     | Type    | Description |
   * |:--------------|:---------:|:--------:|:-------:|:------------|
   * | 0x04~0x05     | 2         | tail     | UInt16  | 队列尾索引   |
   * | 0x06~0x07     | 2         | head     | UInt16  | 队列头索引   |
   * | 0x08~0x09     | 2         | size     | UInt16  | 队列长度（0～65535）|
   * | 0x0A~0x0B     | 2         | capacity | UInt16  | 最大容量（65535）|
   * | [4096, 4607]  | 8 × 64    | data[]   | struct  | KeyboardState |
   */
  constructor(buffer) {
    this.view = new DataView(buffer);
    this.capacity = 64;
    this.offset = 4096;
    this.capture = false;
  }

  reset() {
    this.capacity = this.view.getUint16(10, true);
    this.offset = this.view.getUint32(0, true);
  }

  get size(): number {
    return this.view.getUint16(8, true);
  }

  push(timestamp, code, typ): number {
    if (!this.capture) return;

    const head_size = this.view.getUint32(6, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;
    const offset = this.offset + ((head + size) & (this.capacity - 1)) * 8;

    this.view.setFloat32(offset, timestamp, true);
    this.view.setUint32(offset + 4, (typ << 16) | code, true);

    // 头指针前移
    if (size === this.capacity) {
      this.view.setUint16(6, (head + 1) & (this.capacity - 1), true);
      return;
    }

    this.view.setUint16(8, size + 1, true)
  }

  pop() {
    const head_size = this.view.getUint32(6, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;

    if (size === 0) {
      return null;
    }

    this.view.setUint16(6, size - 1, true);
    const offset = this.offset + head * 8;
    const data = this.view.getUint32(offset + 4, true);
    this.view.setUint16(2, (head + size - 1) & (this.capacity - 1), true);

    return {
      timestamp: this.view.getFloat32(offset, true),
      code: data & 0xFFFF,
      typ: data >> 16
    };
  }

  each(fn) {
    const head_size = this.view.getUint32(6, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;

    for (let i = 0; i < size; ++i) {
      const offset = this.offset + ((head + i) & (this.capacity - 1)) * 8;
      const data = this.view.getUint32(offset + 4, true);

      fn({
        timestamp: this.view.getFloat32(offset, true),
        code: data & 0xFFFF,
        typ: data >> 16
      });
    }
  }

  clear() {
    this.view.setUint16(8, 0, true);
  }
}

/** 键盘输入采集器 */
export const keyboard_buffer = new KeyboardBuffer(memory.buffer);

///| 键盘输入事件监听器
window.addEventListener('keydown', (event) => {
  keyboard_buffer.push(event.timeStamp, event.keyCode, 0);
});
window.addEventListener('keyup', (event) => {
  keyboard_buffer.push(event.timeStamp, event.keyCode, 1);
});
