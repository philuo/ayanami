export class KeyboardBuffer {
  /**
   * 键盘输入事件环形缓冲区 - 基于固定内存布局
   * | Addr          | Byte      | Name     | Type    | Description |
   * |:--------------|:---------:|:--------:|:-------:|:------------|
   * | 0x00~0x01     | 2         | tail     | UInt16  | 队列尾索引   |
   * | 0x02~0x03     | 2         | head     | UInt16  | 队列头索引   |
   * | 0x04~0x05     | 2         | size     | UInt16  | 队列长度（0～65535）|
   * | 0x06~0x07     | 2         | capacity | UInt16  | 最大容量（65535）|
   * | 0x08~0x7FF    | 8 × 255   | data[]   | struct  | KeyboardState |
   */
  constructor(buffer) {
    this.view = new DataView(buffer);
    this.capacity = this.view.getUint16(6, true);
  }

  push(item) {
    const head_size = this.view.getUint32(2, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;
    const offset = 8 + head * 8;
    this.view.setFloat32(offset, item.timestamp, true);
    this.view.setUint16(offset + 4, item.code, true);
    this.view.setUint16(offset + 6, item.typ, true);

    // 头指针前移
    if (size === this.capacity) {
      this.view.setUint16(2, (head + 1) & (this.capacity - 1), true);
      return;
    }

    this.view.setUint16(4, size + 1, true)
  }

  pop() {
    const head_size = this.view.getUint32(2, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;

    if (size === 0) {
      return null;
    }

    this.view.setUint16(2, size - 1, true);
    const offset = 8 + head * 8;
    const data = this.view.getUint32(offset + 4, true);
    this.view.setUint16(2, (head + size - 1) & (this.capacity - 1), true);

    return {
      timestamp: this.view.getFloat32(offset, true),
      code: data & 0xFFFF,
      typ: data >> 16
    };
  }

  each(fn) {
    const head_size = this.view.getUint32(2, true);
    const head = head_size & 0xFFFF;
    const size = head_size >> 16;

    for (let i = 0; i < size; ++i) {
      const offset = 8 + (head + i) & (this.capacity - 1) * 8;
      const data = this.view.getUint32(offset + 4, true);

      fn({
        timestamp: this.view.getFloat32(offset, true),
        code: data & 0xFFFF,
        typ: data >> 16
      });
    }
  }
}
