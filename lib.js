export class KeyboardBuffer {
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
    this.capacity = this.view.getUint16(10, true);
    this.offset = this.view.getUint32(0, true);
  }

  get size() {
    return this.view.getUint16(8, true);
  }

  push(timestamp, code, typ) {
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
      const offset = this.offset + ((head + i) & (this.capacity - 1) * 8);
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

export class Game {

}

/** wasm文件路径 */
const wasmUrl = './target/wasm-gc/release/build/ayanami.optimized.wasm';
/** 游戏是否正在looping */
let is_running = false;
/** 游戏正在运行的帧id */
let loop_id = 0;

/** 游戏looping函数 */
function game_loop(timestamp) {
  if (!is_running) return;
  exports.game_loop(timestamp);
  loop_id = requestAnimationFrame(game_loop);
}

/** wasm初始化对象 */
const importObject = {
  env: {
    /** SAB */
    memory: new WebAssembly.Memory({ initial: 1024, maximum: 1024, shared: true }), // wasm-gc
    // memory: new WebAssembly.Memory({ initial: 256, maximum: 1024, shared: false }), // wasm 
    log: console.log.bind(console),
    get_realtime_delta: performance.now.bind(performance),
    app_start: () => {
      loop_id = requestAnimationFrame(game_loop);
      is_running = true;
      return performance.now();
    },
    app_stop: (id) => {
      cancelAnimationFrame(loop_id);
      loop_id = 0;
      is_running = false;
    }
  }
};

/** wasm特性 */
const useFeature = {
  builtins: ["js-string"],
  importedStringConstants: "_"
};

// IndexedDB 缓存配置
const DB_NAME = 'wasm-cache';
const DB_VERSION = 1;
const STORE_NAME = 'modules';

/**
 * 打开 IndexedDB 数据库
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
}

/**
 * 从 IndexedDB 获取缓存的模块
 * @param {string} url - WASM 文件 URL
 * @param {string} etag - 文件版本标识
 * @returns {Promise<WebAssembly.Module|null>}
 */
async function getCachedModule(url, etag) {
  try {
    const db = await openDB();
    const cached = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[WASM Cache] Read error:', request.error);
        resolve(null);
      };
    });
    
    if (!cached || cached.etag !== etag) {
      return null;
    }
    
    // 从缓存的字节码重新编译模块
    const module = await WebAssembly.compile(cached.bytes, useFeature);
    return module;
  } catch (error) {
    return null;
  }
}

/**
 * 保存 WASM 字节码到 IndexedDB
 * @param {string} url - WASM 文件 URL
 * @param {string} etag - 文件版本标识
 * @param {ArrayBuffer} bytes - WASM 字节码
 */
async function setCachedModule(url, etag, bytes) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        url,
        etag,
        bytes,
        timestamp: Date.now()
      });
      
      request.onsuccess = resolve;
      request.onerror = () => resolve;
    });
  } catch (error) {
    console.warn('[WASM Cache] DB open failed:', error);
  }
}

/**
 * 加载 WASM 模块（带缓存）
 * @param {string} url - WASM 文件 URL
 * @returns {Promise<WebAssembly.Module>}
 */
async function loadWasmModule(url) {
  const etag = url;
  
  // 尝试从缓存加载
  const cached = await getCachedModule(url, etag);
  if (cached) {
    return cached;
  }
  
  // 缓存未命中，下载并编译新模块
  console.log('[WASM] Fetching and compiling:', url);
  const response = await fetch(url);
  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.compile(bytes, useFeature);
  
  // 异步保存字节码到缓存（不阻塞）
  setCachedModule(url, etag, bytes).catch(err => 
    console.warn('[WASM Cache] Failed to cache:', err)
  );
  
  return module;
}

// 加载 WASM 模块（带 IndexedDB 缓存）
// const module = await loadWasmModule(wasmUrl);

// export const { exports } = await WebAssembly.instantiate(
//   module,
//   importObject,
//   useFeature
// );

export const { instance: { exports } } = await WebAssembly.instantiateStreaming(
  fetch(wasmUrl),
  importObject,
  // useFeature
);

export const keyboard_buffer = new KeyboardBuffer(exports.memory.buffer);

const KEY_MAP = {
  
};

window.addEventListener('keydown', (event) => {
  keyboard_buffer.push(event.timeStamp, event.keyCode, 0);
});
window.addEventListener('keyup', (event) => {
  keyboard_buffer.push(event.timeStamp, event.keyCode, 1);
});

window.addEventListener('mousemove', () => {

});
window.addEventListener('mousedown', event => {
  console.log(event)
});

window.addEventListener('mouseup', event => {
  console.log(event)
});

// ============ 自定义触点 ID 管理器 ============

/**
 * 触点 ID 分配器
 * 1. 从 0 开始分配 ID
 * 2. 多点触摸时累加（0, 1, 2, ...）
 * 3. 有触点松开时，复用最小的空闲 ID
 */
class TouchIDAllocator {
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

// ============ 配置 ============
const touchIdAllocator = new TouchIDAllocator(5);

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

// 导出（如果需要在其他地方使用）
export { touchIdAllocator, activeTouches };


// =========================================
window.addEventListener('wheel', event => {
  console.log(event)
}, { capture: true, passive: true });
