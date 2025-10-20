console.log('\n=== WASM Backend Test ===');
import fs from 'node:fs';

const wasmUrl = './target/wasm/release/build/src/src.wasm';
const memory = await new WebAssembly.Memory({ initial: 1024, maximum: 65536, shared: false });
const { instance: { exports } } = await WebAssembly.instantiate(
  fs.readFileSync(wasmUrl), 
  { env: { memory } }
);

let view = new DataView(memory.buffer);

const ptr = (exports as any).createOne();
const ptr2 = (exports as any).createPos2();
const ptr3 = (exports as any).createPos3();
const ptr4 = (exports as any).createPos4();
console.log('WASM值类型:', ptr, ptr2);
console.log('WASM返回的指针:', ptr3, ptr4);
console.log('WASM返回的指针访问值:', view.getFloat32(ptr3 + 8, true), view.getFloat32(ptr4 + 8, true));

const N = 100_0000;
let result;

const start = performance.now();
for (let i = 0; i < N; ++i) {
  // (exports as any).createOne();
  // (exports as any).createPos2();
  result = view.getFloat32((exports as any).createPos3() + 12, true);
  view.getFloat32((exports as any).createPos4() + 8, true)
}
const end = performance.now();
console.log(`WASM值类型: ${end - start}ms`, result);


// 对于WASM，需要从内存中读取结构体数据
// // 也可能需要考虑结构体的内存布局和字节对齐
// // 尝试不同的偏移量
// console.log('\n=== 尝试不同的内存偏移量 ===');
// for (let offset = 0; offset < 16; offset += 4) {
//   const val2 = view.getFloat32(ptr + offset + 4, true);
//   console.log(`偏移量 ${offset}: x=${val1}, y=${val2}`);
// }
