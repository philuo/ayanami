/**
 * @file 触摸输入管理器
 */

import { memory } from '@/application/memory';

/**
 * 触点 ID 分配器
 * 1. 从 0 开始分配 ID
 * 2. 多点触摸时累加（0, 1, 2, ...）
 * 3. 有触点松开时，复用最小的空闲 ID
 */
class TouchIDAllocator {
  identifiers: Map<number, number>;
  freeIds: number[];
  maxTouches: number;

  constructor(maxTouches = 4) {
    this.maxTouches = maxTouches;
    this.freeIds = [];
    this.identifiers = new Map();

    for (let i = 0; i < maxTouches; i++) {
      this.freeIds.push(i);
    }
  }
  
  /**
   * 分配一个新的 ID
   */
  allocate(ori_identifier) {
    if (this.identifiers.has(ori_identifier)) {
      return this.identifiers.get(ori_identifier);
    }

    if (this.freeIds.length === 0) {
      return;
    }
    
    const customId = this.freeIds.shift();
    this.identifiers.set(ori_identifier, customId);

    return customId;
  }
  
  /**
   * 释放一个 ID
   */
  release(ori_identifier) {
    const customId = this.identifiers.get(ori_identifier);
    
    if (customId === void 0) {
      return;
    }
    
    this.identifiers.delete(ori_identifier);
    
    // 将 ID 放回空闲池，并保持升序
    this.freeIds.push(customId);
    this.freeIds.sort();
  }
  
  /**
   * 获取自定义 ID
   */
  get(ori_identifier) {
    return this.identifiers.get(ori_identifier);
  }
  
  /**
   * 获取当前活跃触点数
   */
  getActiveCount() {
    return this.identifiers.size;
  }
  
  /**
   * 重置
   */
  reset() {
    this.identifiers.clear();
    this.freeIds = [];
    for (let i = 0; i < this.maxTouches; i++) {
      this.freeIds.push(i);
    }
  }
}

export const touchIdAllocator = new TouchIDAllocator(5);

// 存储触摸数据（使用自定义 ID）
const activeTouches = new Map();

// 使用 capture 阶段，确保在 canvas 监听器之前执行
window.addEventListener('touchstart', event => {
  for (let touch of event.changedTouches) {
    const customId = touchIdAllocator.allocate(touch.identifier);

    if (customId === void 0) {
      continue;
    }

    activeTouches.set(customId, {
      customId: customId,
      browserId: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    });
  }
}, true);

window.addEventListener('touchmove', event => {
  for (let touch of event.touches) {
    const customId = touchIdAllocator.get(touch.identifier);

    if (customId !== void 0 && activeTouches.has(customId)) {
      const data = activeTouches.get(customId);
      data.x = touch.clientX;
      data.y = touch.clientY;
    }
  }
}, true);

window.addEventListener('touchend', event => {
  for (let touch of event.changedTouches) {
    const customId = touchIdAllocator.get(touch.identifier);

    if (customId !== void 0) {
      activeTouches.delete(customId);
      touchIdAllocator.release(touch.identifier);
    }
  }
}, true);

// warning: IOS上超过5个触点会触发touchcancel事件
window.addEventListener('touchcancel', event => {
  for (let touch of event.changedTouches) {
    const customId = touchIdAllocator.get(touch.identifier);

    if (customId !== void 0) {
      activeTouches.delete(customId);
      touchIdAllocator.release(touch.identifier);
    }
  }
}, true);
